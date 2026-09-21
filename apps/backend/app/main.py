from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings
from app.modules.auth.router import limiter
from app.modules.auth.router import router as auth_router
from app.modules.profile.router import router as profile_router

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
)


app.state.limiter = limiter
app.add_exception_handler(
    RateLimitExceeded,
    _rate_limit_exceeded_handler,
)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(
    auth_router,
    prefix="/api",
)
app.include_router(
    profile_router,
    prefix="/api",
)


@app.get("/health")
def health():
    return {
        "status": "ok",
    }
