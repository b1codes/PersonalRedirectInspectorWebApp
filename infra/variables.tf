variable "aws_region" {
  type        = string
  description = "The AWS region to deploy resources into."
  default     = "us-east-1"
}

variable "environment" {
  type        = string
  description = "The deployment stage or environment (e.g., dev, prod, staging)."
  default     = "dev"
}

variable "dynamodb_billing_mode" {
  type        = string
  description = "Billing mode for DynamoDB table. Defaults to PAY_PER_REQUEST (on-demand)."
  default     = "PAY_PER_REQUEST"
}

variable "auth0_domain" {
  type        = string
  description = "The Auth0 Tenant Domain identifier."
  default     = "your-tenant.auth0.com"
}

variable "auth0_audience" {
  type        = string
  description = "The Auth0 API Audience identifier."
  default     = "https://api.redirectinspector.com"
}
