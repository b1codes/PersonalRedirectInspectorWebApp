terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ==========================================
# 1. DynamoDB Table Definition
# ==========================================
resource "aws_dynamodb_table" "redirect_history" {
  name         = "PersonalRedirectInspector-redirectHistory-${var.environment}"
  billing_mode = var.dynamodb_billing_mode
  hash_key     = "userId"  # Partition Key (Auth0 user identifier)
  range_key    = "id"      # Sort Key (Matches 'id' in React / client metadata)

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Environment = var.environment
    Project     = "RedirectUriInspector"
  }
}

# ==========================================
# 2. IAM Role & Security Policy for Lambda
# ==========================================
resource "aws_iam_role" "lambda_exec_role" {
  name = "redirect-inspector-lambda-exec-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# DynamoDB Write/Query permissions restricted to our specific table
resource "aws_iam_policy" "lambda_dynamodb_policy" {
  name        = "redirect-inspector-dynamodb-policy-${var.environment}"
  description = "IAM policy for Lambda to read/write to the specific RedirectHistory table"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:Query",
          "dynamodb:DeleteItem"
        ]
        Resource = aws_dynamodb_table.redirect_history.arn
      }
    ]
  })
}

# Basic Execution permissions (for CloudWatch logging)
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_dynamodb_execution" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = aws_iam_policy.lambda_dynamodb_policy.arn
}

# ==========================================
# 3. Packaging & Deploying the Lambda Function
# ==========================================

# Generates the zipped archive of the backend python package
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend"
  output_path = "${path.module}/dist/lambda.zip"
  
  # Exclude unnecessary files from being packaged into Lambda
  excludes = [
    "venv",
    ".mypy_cache",
    "__pycache__",
    "README.md"
  ]
}

resource "aws_lambda_function" "api_lambda" {
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  function_name    = "redirect-inspector-api-${var.environment}"
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "app.main.handler" # Maps to app/main.py -> handler (Mangum)
  runtime          = "python3.11"
  timeout          = 15
  memory_size      = 256

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.redirect_history.name
      AWS_REGION          = var.aws_region
      AUTH0_DOMAIN        = var.auth0_domain
      AUTH0_AUDIENCE      = var.auth0_audience
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic_execution,
    aws_iam_role_policy_attachment.lambda_dynamodb_execution
  ]
}

# ==========================================
# 4. API Gateway v2 (HTTP API) setup
# ==========================================
resource "aws_apigatewayv2_api" "http_api" {
  name          = "redirect-inspector-http-api-${var.environment}"
  protocol_type = "HTTP"
  
  # Configures global CORS parameters to support your React clients
  cors_configuration {
    allow_origins = ["*"] # Set to your actual domain name in production stage
    allow_methods = ["GET", "POST", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization"]
    max_age       = 300
  }
}

resource "aws_apigatewayv2_stage" "api_stage" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = var.environment
  auto_deploy = true
}

# Integrate API Gateway directly with our serverless Lambda function
resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.api_lambda.arn
  payload_format_version = "2.0" # Standard payload for FastAPI/Mangum mapping
}

# Catch-all route to forward all requests directly to the FastAPI router
resource "aws_apigatewayv2_route" "default_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

# Specific root path fallback route
resource "aws_apigatewayv2_route" "root_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

# Permission for API Gateway to invoke the Lambda function
resource "aws_lambda_permission" "api_gateway_permission" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}
