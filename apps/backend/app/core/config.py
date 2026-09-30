from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Company API"
    app_env: str = "development"

    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"

    supabase_url: str
    supabase_publishable_key: str
    database_url: str | None = None

    cookie_secure: bool = False
    cookie_domain: str | None = None
    cookie_samesite: Literal["lax", "strict", "none"] = "lax"
    access_token_cookie_name: str = "access_token"
    refresh_token_cookie_name: str = "refresh_token"
    access_token_max_age_seconds: int = 60 * 60
    refresh_token_max_age_seconds: int = 60 * 60 * 24 * 30

    rate_limit_storage_uri: str = "memory://"
    certificate_upload_dir: str = "uploads/certificates"

    # Supabase Storage (S3-compatible API). The AWS_* variable names are
    # reused because the existing .env already defines them for that storage.
    aws_access_key_id: str | None = None
    aws_secret_access_key: str | None = None
    aws_region: str = "us-east-1"
    aws_s3_bucket_name: str = "resumes"
    supabase_s3_endpoint: str | None = None

    # Resume PDF uploads.
    resume_max_file_size_bytes: int = 10 * 1024 * 1024
    resume_signed_url_expires_in_seconds: int = 300
    openai_api_key: str | None = None
    openai_model: str = "gpt-5-mini"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
