from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict

TRUSTED_FRONTEND_ORIGINS = (
    "https://resume-seven-psi-88.vercel.app",
    "https://resume-2rp6qj2g0-abdullah-shafiques-projects-2f0cafbc.vercel.app",
)


class Settings(BaseSettings):
    app_name: str = "Company API"
    app_env: str = "development"

    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"
    # Additional browser origins, as a comma-separated list. FRONTEND_URL is
    # always included, so existing deployments remain compatible.
    cors_origins: str = ""
    cors_origin_regex: str = ""

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
    guest_session_ttl_hours: int = 12
    guest_cleanup_enabled: bool = True
    guest_cleanup_interval_minutes: int = 60

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
    # Server-side AI resume generation. Keys are never returned to clients.
    ai_api_key: str | None = None
    ai_provider: str = "openai"
    ai_model: str = "gpt-5-mini"
    ai_base_url: str = "https://api.openai.com/v1"
    ai_timeout_seconds: float = 90.0
    ai_rate_limit_per_hour: int = 5

    @property
    def allowed_cors_origins(self) -> list[str]:
        configured_origins = [
            self.frontend_url,
            *TRUSTED_FRONTEND_ORIGINS,
            *self.cors_origins.split(","),
        ]
        # Origin headers never contain a trailing slash. Normalizing configured
        # URLs prevents an easy-to-miss exact-match failure in production.
        return list(dict.fromkeys(
            origin.strip().rstrip("/")
            for origin in configured_origins
            if origin.strip()
        ))

    @property
    def allowed_cors_origin_regex(self) -> str | None:
        if self.cors_origin_regex.strip():
            return self.cors_origin_regex.strip()
        if self.app_env.strip().lower() in {"development", "dev", "local", "test"}:
            # Permit loopback aliases and alternate Next.js development ports,
            # while keeping non-local origins denied by default.
            return r"^https?://(?:localhost|127\.0\.0\.1|\[::1\])(?::\d{1,5})?$"
        return None

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
