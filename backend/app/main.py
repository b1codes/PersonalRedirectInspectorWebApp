import logging
from typing import List, Optional
import boto3
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


# This Mangum handler maps standard AWS Lambda Gateway proxy payloads into ASGI 
# events, allowing FastAPI to execute seamlessly inside a serverless Lambda context.
handler = Mangum(app)
