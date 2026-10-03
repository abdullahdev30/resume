from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings
from app.modules.auth.errors import (
    AuthApplicationError,
    guest_permission_error,
    invalid_session_error,
    missing_authentication_error,
    raise_http_error,
)
from app.modules.auth.schemas import UserResponse
from app.modules.auth.service import AuthService

bearer_scheme = HTTPBearer(auto_error=False)
BEARER_DEPENDENCY = Depends(bearer_scheme)


def get_auth_service() -> AuthService:
    return AuthService()


def get_access_token(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = BEARER_DEPENDENCY,
) -> str:
    token = None
    if credentials and credentials.scheme.lower() == "bearer":
        token = credentials.credentials

    if not token:
        token = request.cookies.get(settings.access_token_cookie_name)

    if not token:
        raise_http_error(missing_authentication_error())
        raise RuntimeError("unreachable")
    return token


def get_refresh_token(request: Request) -> str:
    token = request.cookies.get(settings.refresh_token_cookie_name)
    if not token:
        raise_http_error(invalid_session_error())
        raise RuntimeError("unreachable")
    return token


ACCESS_TOKEN_DEPENDENCY = Depends(get_access_token)
AUTH_SERVICE_DEPENDENCY = Depends(get_auth_service)
REFRESH_TOKEN_DEPENDENCY = Depends(get_refresh_token)


def get_current_user(
    access_token: str = ACCESS_TOKEN_DEPENDENCY,
    auth_service: AuthService = AUTH_SERVICE_DEPENDENCY,
) -> UserResponse:
    try:
        return auth_service.get_current_user(access_token)
    except AuthApplicationError as exc:
        raise_http_error(exc)
        raise RuntimeError("unreachable")


CURRENT_USER_DEPENDENCY = Depends(get_current_user)


def get_current_registered_user(
    current_user: UserResponse = CURRENT_USER_DEPENDENCY,
) -> UserResponse:
    if current_user.is_guest:
        raise_http_error(guest_permission_error())
        raise RuntimeError("unreachable")
    return current_user


CURRENT_REGISTERED_USER_DEPENDENCY = Depends(get_current_registered_user)
