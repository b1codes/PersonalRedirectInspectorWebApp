output "api_endpoint" {
  value       = "${aws_apigatewayv2_stage.api_stage.invoke_url}/api/redirects"
  description = "The HTTP API Gateway endpoint to configure VITE_API_ENDPOINT in your frontend .env file."
}

output "dynamodb_table_name" {
  value       = aws_dynamodb_table.redirect_history.name
  description = "The generated DynamoDB table name."
}

output "health_check_url" {
  value       = "${aws_apigatewayv2_stage.api_stage.invoke_url}/health"
  description = "Backend simple health check url."
}
