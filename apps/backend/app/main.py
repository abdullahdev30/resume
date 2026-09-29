from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings
from app.database.connection import Base, engine
from app.modules.auth.router import limiter
from app.modules.auth.router import router as auth_router
from app.modules.profile.router import router as profile_router
from app.modules.resume.router import router as resume_router

# Auto-create all database tables (e.g. resumes, personal_details, etc.)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=f"{settings.app_name} API",
    description="Comprehensive Resume Builder API featuring DB CRUD Persistence, Resume Storage, and AI-Powered Resume Generation.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.state.limiter = limiter
app.add_exception_handler(
    RateLimitExceeded,
    _rate_limit_exceeded_handler,
)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router Registrations
app.include_router(auth_router, prefix="/api")
app.include_router(profile_router, prefix="/api")
app.include_router(resume_router, prefix="/api")

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
