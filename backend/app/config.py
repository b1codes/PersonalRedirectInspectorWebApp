from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # AWS configuration
    dynamodb_table_name: str = "PersonalRedirectInspector-redirectHistory"
    aws_region: str = "us-east-1"

    # Auth0 Configuration (Placeholder values to be replaced in production)
    auth0_domain: str = "your-tenant.auth0.com"
    auth0_audience: str = "https://api.redirectinspector.com"
    auth0_algorithms: list[str] = ["RS256"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

@lru_cache()
def get_settings() -> Settings:
    return Settings()
