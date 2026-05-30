import logging
from typing import List, Optional
import boto3
import requests
from botocore.exceptions import ClientError
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from pydantic import BaseModel, Field

from app.config import get_settings, Settings
from app.auth import get_current_user

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Redirect URI Inspector Backend",
    description="Python FastAPI backend serving a serverless URL/redirect debugger application",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware to allow requests from local dev and production client
# In production, replace the "*" with your specific client URL for strong security
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models matching the React frontend client interface
class QueryParam(BaseModel):
    key: str
    value: str

class RedirectDataInput(BaseModel):
    id: str = Field(..., description="Unique generated client-side identifier")
    timestamp: int = Field(..., description="Epoch timestamp of when the redirect was logged")
    fullUrl: str = Field(..., description="Fully parsed URL string")
    queryParams: List[QueryParam] = Field(default=[], description="Parsed query parameters list")
    fragment: str = Field(..., description="URL hash fragment")

class RedirectDataResponse(RedirectDataInput):
    userId: str = Field(..., description="Owner ID of this record (partitioned)")

# DynamoDB client helper
def get_dynamodb_table(settings: Settings = Depends(get_settings)):
    """Provides the DynamoDB Table resource."""
    # Instantiated without explicit AWS credentials; will inherit from IAM execution role or local AWS CLI config
    db_resource = boto3.resource("dynamodb", region_name=settings.aws_region)
    return db_resource.Table(settings.dynamodb_table_name)


@app.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    """Unauthenticated simple application status ping."""
    return {"status": "healthy", "service": "Redirect URI Inspector API"}


@app.post(
    "/api/redirects", 
    status_code=status.HTTP_201_CREATED,
    response_model=RedirectDataResponse
)
def save_redirect(
    payload: RedirectDataInput,
    current_user_id: str = Depends(get_current_user),
    table = Depends(get_dynamodb_table)
):
    """
    Saves a parsed redirect entry associated with the authenticated user.
    """
    logger.info(f"Saving redirect for user: {current_user_id}")

    # Build the record combining the frontend payload + authenticated user identifier
    item = {
        "userId": current_user_id, # Partition Key
        "id": payload.id,          # Sort Key
        "timestamp": payload.timestamp,
        "fullUrl": payload.fullUrl,
        # DynamoDB requires manual dictionary listing or JSON structures.
        # We store list of dicts directly for queryParams.
        "queryParams": [param.model_dump() for param in payload.queryParams],
        "fragment": payload.fragment
    }

    try:
        table.put_item(Item=item)
    except ClientError as e:
        logger.error(f"Error saving to DynamoDB: {e.response['Error']['Message']}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save data to the secure remote cloud database."
        )

    return item


@app.get(
    "/api/redirects",
    response_model=List[RedirectDataResponse]
)
def get_redirects(
    q: Optional[str] = None,
    current_user_id: str = Depends(get_current_user),
    table = Depends(get_dynamodb_table)
):
    """
    Retrieves the history list of redirect entries logged by the authenticated user,
    optionally filtered by a search query `q` matching the URL, parameter keys, parameter values, or fragment.
    """
    logger.info(f"Fetching redirects for user: {current_user_id} with query filter: {q}")

    try:
        # Fetching all items under the user partition key. 
        # Using query is highly efficient and safe compared to scanning the table.
        response = table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key("userId").eq(current_user_id)
        )
        items = response.get("Items", [])
        
        # Sort history reverse chronologically (newest at the top)
        items.sort(key=lambda x: x.get("timestamp", 0), reverse=True)
        
        # Filter items if query 'q' is specified
        if q:
            query = q.lower()
            filtered_items = []
            for item in items:
                # Substring search in fullUrl
                if query in item.get("fullUrl", "").lower():
                    filtered_items.append(item)
                    continue
                # Substring search in fragment
                if query in item.get("fragment", "").lower():
                    filtered_items.append(item)
                    continue
                # Substring search in query parameters
                match = False
                for p in item.get("queryParams", []):
                    if query in p.get("key", "").lower() or query in p.get("value", "").lower():
                        match = True
                        break
                if match:
                    filtered_items.append(item)
            return filtered_items

        return items

    except ClientError as e:
        logger.error(f"Error querying DynamoDB: {e.response['Error']['Message']}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch history from the secure remote cloud database."
        )


@app.delete(
    "/api/redirects/{redirect_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_redirect(
    redirect_id: str,
    current_user_id: str = Depends(get_current_user),
    table = Depends(get_dynamodb_table)
):
    """
    Deletes a specific redirect log entry belonging to the authenticated user.
    """
    logger.info(f"Deleting redirect {redirect_id} for user: {current_user_id}")

    try:
        # Delete requires specifying both the partition key and sort key to identify the record
        table.delete_item(
            Key={
                "userId": current_user_id,
                "id": redirect_id
            }
        )
    except ClientError as e:
        logger.error(f"Error deleting from DynamoDB: {e.response['Error']['Message']}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete specified entry from cloud database."
        )

    # 204 No Content responds with an empty body successfully
    return


class AnalyzeInput(BaseModel):
    fullUrl: str
    queryParams: List[QueryParam] = []
    fragment: str


@app.post(
    "/api/redirects/analyze",
    status_code=status.HTTP_200_OK
)
def analyze_redirect(
    payload: AnalyzeInput,
    current_user_id: str = Depends(get_current_user),
    settings: Settings = Depends(get_settings)
):
    """
    Analyzes a redirect using server-side Gemini API key and returns markdown analysis.
    """
    logger.info(f"AI analysis requested by user {current_user_id} for URL: {payload.fullUrl}")

    if not settings.gemini_api_key:
        logger.warning("Gemini API key is not configured on the backend server.")
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Server-side Gemini AI analysis is not configured on this host. Please configure your own API key client-side."
        )

    prompt = f"""
You are a senior security engineer and web developer. Analyze the following redirect URL:
URL: {payload.fullUrl}
Fragment: {payload.fragment or 'None'}
Parameters: {[param.model_dump() for param in payload.queryParams]}

Provide a professional, clear, and comprehensive analysis in Markdown format:
1. **Identified Protocol / Flow**: Analyze if this is OAuth 2.0 (e.g. Authorization Code, Implicit, etc.), OpenID Connect, SAML, standard marketing tracking redirect, or general parameters. Explain its purpose.
2. **Security Implications**: Check for risks like missing 'state' or 'nonce', exposing tokens in URL fragments, insecure transfer, or open redirect threats. Specifically mention if there is any parameter exposure risk in client logs or history.
3. **Parameter Significance**: Present a clear markdown table of each query parameter, explaining its purpose, typical values, and role.
"""

    gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent?key={settings.gemini_api_key}"
    headers = {"Content-Type": "application/json"}
    body = {
        "contents": [{"parts": [{"text": prompt}]}]
    }

    try:
        response = requests.post(gemini_url, json=body, headers=headers, timeout=15)
        response.raise_for_status()
        res_data = response.json()
        
        # Safe extraction
        text = res_data["candidates"][0]["content"]["parts"][0]["text"]
        return {"analysis": text, "model": settings.gemini_model}
    except Exception as e:
        logger.error(f"Gemini API call failed on backend: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to communicate with Gemini API on the server: {str(e)}"
        )


# This Mangum handler maps standard AWS Lambda Gateway proxy payloads into ASGI 
# events, allowing FastAPI to execute seamlessly inside a serverless Lambda context.
handler = Mangum(app)
