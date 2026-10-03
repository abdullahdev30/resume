from datetime import UTC, datetime

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
from app.modules.auth.errors import (
    AuthApplicationError,
    guest_permission_error,
    raise_http_error,
)
from app.modules.auth.schemas import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    GuestUpgradeRequest,
    GuestUpgradeVerifyRequest,
    LoginRequest,
    MessageResponse,
    RecoveryCodeResponse,
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

    access_max_age = None
    refresh_max_age = None
    if auth_result.user.is_guest and auth_result.user.guest_expires_at:
        remaining = max(
            1,
            int((auth_result.user.guest_expires_at - datetime.now(UTC)).total_seconds()),
        )
        access_max_age = min(settings.access_token_max_age_seconds, remaining)
        refresh_max_age = remaining

    set_auth_cookies(
        response,
        access_token=auth_result.tokens.access_token,
        refresh_token=auth_result.tokens.refresh_token,
        access_max_age=access_max_age,
        refresh_max_age=refresh_max_age,
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


@router.post(
    "/guest",
    response_model=SessionResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("5/hour")
def create_guest(
    request: Request,
    response: Response,
    auth_service: AuthService = AUTH_SERVICE_DEPENDENCY,
) -> SessionResponse:
    try:
        existing_access_token = request.cookies.get(
            settings.access_token_cookie_name
        )
        if existing_access_token:
            try:
                existing_user = auth_service.get_current_user(existing_access_token)
            except AuthApplicationError as exc:
                if exc.status_code != status.HTTP_401_UNAUTHORIZED:
                    raise
            else:
                if not existing_user.is_guest:
                    raise AuthApplicationError(
                        status_code=status.HTTP_409_CONFLICT,
                        code="already_authenticated",
                        message="Sign out before starting a guest session.",
                    )
                return SessionResponse(
                    message="Guest session resumed.",
                    user=existing_user,
                )

        auth_result = auth_service.create_guest()
        _set_session_cookies(response, auth_result)
        return _session_response("Guest session started.", auth_result)
    except AuthApplicationError as exc:
        raise_http_error(exc)


@router.post(
    "/guest/upgrade/request",
    response_model=MessageResponse,
)
@limiter.limit("3/minute")
def request_guest_upgrade(
    request: Request,
    payload: GuestUpgradeRequest,
    access_token: str = ACCESS_TOKEN_DEPENDENCY,
    refresh_token: str = REFRESH_TOKEN_DEPENDENCY,
    current_user: UserResponse = CURRENT_USER_DEPENDENCY,
    auth_service: AuthService = AUTH_SERVICE_DEPENDENCY,
) -> MessageResponse:
    try:
        if not current_user.is_guest:
            raise guest_permission_error()
        auth_service.request_guest_upgrade(
            user_id=current_user.id,
            access_token=access_token,
            refresh_token=refresh_token,
            payload=payload,
        )
        return MessageResponse(message="A verification code was sent to your email.")
    except AuthApplicationError as exc:
        raise_http_error(exc)


@router.post(
    "/guest/upgrade/verify",
    response_model=SessionResponse,
)
@limiter.limit("10/minute")
def verify_guest_upgrade(
    request: Request,
    response: Response,
    payload: GuestUpgradeVerifyRequest,
    access_token: str = ACCESS_TOKEN_DEPENDENCY,
    refresh_token: str = REFRESH_TOKEN_DEPENDENCY,
    current_user: UserResponse = CURRENT_USER_DEPENDENCY,
    auth_service: AuthService = AUTH_SERVICE_DEPENDENCY,
) -> SessionResponse:
    try:
        auth_result = auth_service.verify_guest_upgrade(
            user_id=current_user.id,
            current_user=current_user,
            access_token=access_token,
            refresh_token=refresh_token,
            payload=payload,
        )
        _set_session_cookies(response, auth_result)
        return _session_response("Guest account converted successfully.", auth_result)
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
        if exc.status_code == status.HTTP_401_UNAUTHORIZED:
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
    response_model=RecoveryCodeResponse,
)
@limiter.limit("10/minute")
def verify_recovery_otp(
    request: Request,
    payload: VerifyRecoveryOtpRequest,
    auth_service: AuthService = AUTH_SERVICE_DEPENDENCY,
) -> RecoveryCodeResponse:
    try:
        recovery_code = auth_service.verify_recovery_otp(payload)
        return RecoveryCodeResponse(
            message="Recovery OTP verified successfully.",
            recovery_code=recovery_code,
        )
    except AuthApplicationError as exc:
        raise_http_error(exc)


@router.post(
    "/change-password",
    response_model=MessageResponse,
)
def change_password(
    payload: ChangePasswordRequest,
    request: Request,
    auth_service: AuthService = AUTH_SERVICE_DEPENDENCY,
) -> MessageResponse:
    try:
        access_token = request.cookies.get(settings.access_token_cookie_name)
        refresh_token = request.cookies.get(settings.refresh_token_cookie_name)
        if not payload.recovery_code and access_token:
            current_user = auth_service.get_current_user(access_token)
            if current_user.is_guest:
                raise guest_permission_error()
        auth_service.change_password(
            payload=payload,
            access_token=access_token,
            refresh_token=refresh_token,
        )
        return MessageResponse(message="Password changed successfully.")
    except AuthApplicationError as exc:
        raise_http_error(exc)
