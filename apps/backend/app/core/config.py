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

    cookie_secure: bool = False
    cookie_domain: str | None = None
    cookie_samesite: Literal["lax", "strict", "none"] = "lax"
    access_token_cookie_name: str = "access_token"
    refresh_token_cookie_name: str = "refresh_token"
    access_token_max_age_seconds: int = 60 * 60
    refresh_token_max_age_seconds: int = 60 * 60 * 24 * 30

    rate_limit_storage_uri: str = "memory://"
    profile_database_path: str = "profile.sqlite3"
    certificate_upload_dir: str = "uploads/certificates"

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
