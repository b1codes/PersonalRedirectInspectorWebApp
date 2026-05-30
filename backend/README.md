# FastAPI Serverless Backend (Auth0 + DynamoDB)

This is the serverless Python backend for the **Redirect URI Inspector** application. It implements clean API endpoints using FastAPI and converts the request payloads to run inside AWS Lambda using **Mangum**.

## Core Features
1. **Multi-User Isolation:** History is queryable by an authenticated user ID (`userId`), keeping all user data secure and segregated in DynamoDB.
2. **Auth0 JWT Authentication:** Endpoints are protected via JSON Web Tokens (JWT) issued by Auth0, verifying the token signatures dynamically against Auth0's JWKS (JSON Web Key Set).
3. **Optimized DynamoDB operations:** Uses proper partition keys (`userId`) and sort keys (`id`) to allow efficient, cost-effective queries instead of scanning table records.

---

## Local Setup & Development

### 1. Create a Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run Locally (using Uvicorn)
```bash
uvicorn app.main:app --reload --port 8000
```
This spins up a local server at `http://localhost:8000`.

### 4. Interactive Documentation
Go to:
* **Swagger UI:** `http://localhost:8000/docs`
* **ReDoc UI:** `http://localhost:8000/redoc`

---

## Deployment
This backend is fully pre-configured to be deployed onto AWS using the **Serverless Framework** (defined in `infra/serverless.yml`).

1. Install Serverless globally: `npm install -g serverless`
2. Configure AWS credentials.
3. Deploy the service:
   ```bash
   serverless deploy --stage prod
   ```
