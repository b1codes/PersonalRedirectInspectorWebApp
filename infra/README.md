# Terraform AWS Serverless Infrastructure

This directory contains **HashiCorp Terraform** configurations to deploy your multi-user, serverless **FastAPI + DynamoDB + API Gateway** backend onto Amazon Web Services (AWS).

---

## Architecture Components

*   **AWS API Gateway v2 (HTTP API):** Routes all requests (`GET`, `POST`, `DELETE`, etc.) to the FastAPI application inside Lambda. Includes custom CORS settings.
*   **AWS Lambda (Python 3.11):** Runs your FastAPI app mapped through the Mangum ASGI handler.
*   **AWS DynamoDB Table:** A single high-performance table partitioned by `userId` (hash) and sorted by `id` (range) to hold separate log histories per authenticated user.
*   **AWS IAM Roles & Policies:** Tailored policies adhering to the *Principle of Least Privilege*, allowing Lambda to only read/write to the specific DynamoDB table and record system execution logs in CloudWatch.

---

## Setup & Deployment Steps

### 1. Prerequisite Installations
*   Install [Terraform CLI](https://developer.hashicorp.com/terraform/downloads) (v1.5.0 or later).
*   Install Python 3.11.
*   Configure your AWS Command Line Interface (CLI) keys locally (`aws configure`).

### 2. Package Python Dependencies
Because AWS Lambda requires external libraries (like `fastapi`, `mangum`, etc.) packaged directly inside the deployment ZIP archive, run the automated build script:
```bash
./build.sh
```
This downloads the pinned packages from `requirements.txt` straight into the `backend-python/` root directory so they can be zipped by Terraform.

### 3. Supply Your Environment Variables
Copy the example variables file:
```bash
cp terraform.tfvars.example terraform.tfvars
```
Open `terraform.tfvars` and supply your actual **Auth0 Tenant Domain** and **Auth0 API Audience Identifier** values:
```hcl
aws_region     = "us-east-1"
environment    = "prod"
auth0_domain   = "your-tenant.auth0.com"
auth0_audience = "https://api.redirectinspector.com"
```

### 4. Deploy Infrastructure
Initialize the Terraform directory to pull providers and dependencies:
```bash
terraform init
```

Generate and inspect the execution plan to verify resources:
```bash
terraform plan
```

Deploy the serverless infrastructure to AWS:
```bash
terraform apply
```

---

## Config Output
Once deployment is successful, Terraform will print the outputs:
*   `api_endpoint`: Use this value to configure your frontend `.env.production`'s `VITE_API_ENDPOINT` variable.
*   `dynamodb_table_name`: The exact table name.
*   `health_check_url`: Ping this to verify backend responsiveness.

---

## Destroying Resources
To completely clean up all AWS resources created by this project, run:
```bash
terraform destroy
```
