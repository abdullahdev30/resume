import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings
from app.database.migration_runner import run_migrations
from app.modules.auth.router import limiter
from app.modules.auth.router import router as auth_router
from app.modules.profile.router import router as profile_router
from app.modules.resume.router import router as resume_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    if not settings.ai_api_key or not settings.ai_base_url.strip():
        logger.warning(
            "AI resume generation is not configured: set AI_API_KEY and AI_BASE_URL"
        )
    else:
        logger.info(
            "AI resume configuration provider=%s model=%s base_url=%s timeout_seconds=%s",
            settings.ai_provider,
            settings.ai_model,
            settings.ai_base_url,
            settings.ai_timeout_seconds,
        )
    run_migrations()
    yield


app = FastAPI(
    title=f"{settings.app_name} API",
    description="Comprehensive Resume Builder API featuring DB CRUD Persistence, Resume Storage, and AI-Powered Resume Generation.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(
    RateLimitExceeded,
    _rate_limit_exceeded_handler,
)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_cors_origins,
    allow_origin_regex=settings.allowed_cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(profile_router, prefix="/api/v1")
app.include_router(resume_router, prefix="/api/v1")


@app.get("/health", tags=["Health"])
def health():
    return {
        "status": "ok",
        "app_name": settings.app_name,
        "swagger_docs": "/docs",
    }
