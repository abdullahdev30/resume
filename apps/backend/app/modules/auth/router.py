from fastapi import APIRouter, Request, Response, status
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings
from app.modules.auth.cookies import clear_auth_cookies, set_auth_cookies
from app.modules.auth.dependencies import (
    ACCESS_TOKEN_DEPENDENCY,
    AUTH_SERVICE_DEPENDENCY,
    CURRENT_USER_DEPENDENCY,
    REFRESH_TOKEN_DEPENDENCY,
)
from app.modules.auth.errors import AuthApplicationError, raise_http_error
from app.modules.auth.schemas import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    RegisterResponse,
    ResendVerificationRequest,
    SessionResponse,
    UserResponse,
    VerifyEmailOtpRequest,
    VerifyEmailResponse,
    VerifyRecoveryOtpRequest,
)
from app.modules.auth.service import AuthResult, AuthService

router = APIRouter(
    prefix="/auth",
    tags=["Auth"],
)
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=settings.rate_limit_storage_uri,
)


def _set_session_cookies(response: Response, auth_result: AuthResult) -> None:
    if auth_result.tokens is None:
        return

    set_auth_cookies(
        response,
        access_token=auth_result.tokens.access_token,
        refresh_token=auth_result.tokens.refresh_token,
    )


def _session_response(message: str, auth_result: AuthResult) -> SessionResponse:
    return SessionResponse(
        message=message,
        user=auth_result.user,
    )


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("5/minute")
def register(
    request: Request,
    payload: RegisterRequest,
    auth_service: AuthService = AUTH_SERVICE_DEPENDENCY,
) -> RegisterResponse:
    try:
        return auth_service.register(payload)
    except AuthApplicationError as exc:
        raise_http_error(exc)


@router.post(
    "/verify-email",
    response_model=VerifyEmailResponse,
)
@limiter.limit("10/minute")
def verify_email(
    request: Request,
    response: Response,
    payload: VerifyEmailOtpRequest,
    auth_service: AuthService = AUTH_SERVICE_DEPENDENCY,
) -> VerifyEmailResponse:
    try:
        auth_result = auth_service.verify_email(payload)
        _set_session_cookies(response, auth_result)
        return VerifyEmailResponse(
            message="Email verified successfully.",
            user=auth_result.user,
        )
    except AuthApplicationError as exc:
        raise_http_error(exc)


@router.post(
    "/resend-verification",
    response_model=MessageResponse,
)
@limiter.limit("3/minute")
def resend_verification(
    request: Request,
    payload: ResendVerificationRequest,
    auth_service: AuthService = AUTH_SERVICE_DEPENDENCY,
) -> MessageResponse:
    try:
        auth_service.resend_verification(payload)
        return MessageResponse(
            message="If an account is pending verification, a new OTP has been sent.",
        )
    except AuthApplicationError as exc:
        raise_http_error(exc)


@router.post(
    "/login",
    response_model=SessionResponse,
)
@limiter.limit("5/minute")
def login(
    request: Request,
    response: Response,
    payload: LoginRequest,
    auth_service: AuthService = AUTH_SERVICE_DEPENDENCY,
) -> SessionResponse:
    try:
        auth_result = auth_service.login(payload)
        _set_session_cookies(response, auth_result)
        return _session_response("Login successful.", auth_result)
    except AuthApplicationError as exc:
        raise_http_error(exc)


@router.get(
    "/me",
    response_model=UserResponse,
)
def me(
    current_user: UserResponse = CURRENT_USER_DEPENDENCY,
) -> UserResponse:
    return current_user


@router.post(
    "/refresh",
    response_model=SessionResponse,
)
def refresh(
    response: Response,
    refresh_token: str = REFRESH_TOKEN_DEPENDENCY,
    auth_service: AuthService = AUTH_SERVICE_DEPENDENCY,
) -> SessionResponse:
    try:
        auth_result = auth_service.refresh_session(refresh_token)
        _set_session_cookies(response, auth_result)
        return _session_response("Session refreshed successfully.", auth_result)
    except AuthApplicationError as exc:
        clear_auth_cookies(response)
        raise_http_error(exc)


@router.post(
    "/logout",
    response_model=MessageResponse,
)
def logout(
    request: Request,
    response: Response,
    auth_service: AuthService = AUTH_SERVICE_DEPENDENCY,
) -> MessageResponse:
    access_token = request.cookies.get(settings.access_token_cookie_name)
    refresh_token = request.cookies.get(settings.refresh_token_cookie_name)
    auth_service.logout(
        access_token=access_token,
        refresh_token=refresh_token,
    )
    clear_auth_cookies(response)
    return MessageResponse(message="Logged out successfully.")


@router.post(
    "/forgot-password",
    response_model=MessageResponse,
)
@limiter.limit("3/minute")
def forgot_password(
    request: Request,
    payload: ForgotPasswordRequest,
    auth_service: AuthService = AUTH_SERVICE_DEPENDENCY,
) -> MessageResponse:
    try:
        auth_service.forgot_password(payload)
        return MessageResponse(
            message=(
                "If an account exists for this email, "
                "password recovery instructions have been sent."
            ),
        )
    except AuthApplicationError as exc:
        raise_http_error(exc)


@router.post(
    "/verify-recovery-otp",
    response_model=SessionResponse,
)
@limiter.limit("10/minute")
def verify_recovery_otp(
    request: Request,
    response: Response,
    payload: VerifyRecoveryOtpRequest,
    auth_service: AuthService = AUTH_SERVICE_DEPENDENCY,
) -> SessionResponse:
    try:
        auth_result = auth_service.verify_recovery_otp(payload)
        _set_session_cookies(response, auth_result)
        return _session_response("Recovery OTP verified successfully.", auth_result)
    except AuthApplicationError as exc:
        raise_http_error(exc)


@router.post(
    "/change-password",
    response_model=MessageResponse,
)
def change_password(
    payload: ChangePasswordRequest,
    access_token: str = ACCESS_TOKEN_DEPENDENCY,
    refresh_token: str = REFRESH_TOKEN_DEPENDENCY,
    auth_service: AuthService = AUTH_SERVICE_DEPENDENCY,
) -> MessageResponse:
    try:
        auth_service.change_password(
            payload=payload,
            access_token=access_token,
            refresh_token=refresh_token,
        )
        return MessageResponse(message="Password changed successfully.")
    except AuthApplicationError as exc:
        raise_http_error(exc)
