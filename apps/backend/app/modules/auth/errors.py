import logging
from dataclasses import dataclass

from fastapi import HTTPException, status

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class AuthApplicationError(Exception):
    status_code: int
    code: str
    message: str

    @property
    def detail(self) -> dict[str, str]:
        return {
            "code": self.code,
            "message": self.message,
        }


RATE_LIMIT_CODES = {
    "over_request_rate_limit",
    "over_email_send_rate_limit",
    "over_sms_send_rate_limit",
}

AUTHENTICATION_CODES = {
    "bad_jwt",
    "invalid_credentials",
    "invalid_jwt",
    "otp_expired",
    "session_not_found",
}

DUPLICATE_CODES = {
    "conflict",
    "email_exists",
    "identity_already_exists",
    "user_already_exists",
}


def missing_authentication_error() -> AuthApplicationError:
    return AuthApplicationError(
        status_code=status.HTTP_401_UNAUTHORIZED,
        code="missing_authentication",
        message="Authentication is required.",
    )


def invalid_session_error() -> AuthApplicationError:
    return AuthApplicationError(
        status_code=status.HTTP_401_UNAUTHORIZED,
        code="invalid_session",
        message="Invalid or expired session.",
    )


def invalid_recovery_code_error() -> AuthApplicationError:
    return AuthApplicationError(
        status_code=status.HTTP_401_UNAUTHORIZED,
        code="invalid_recovery_code",
        message="Invalid or expired recovery code.",
    )


def upstream_auth_error(
    exc: Exception,
    *,
    authentication_message: str = "Invalid email or password.",
) -> AuthApplicationError:
    code = _error_code(exc)
    upstream_status = _error_status(exc)

    if code in RATE_LIMIT_CODES or upstream_status == status.HTTP_429_TOO_MANY_REQUESTS:
        return AuthApplicationError(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            code="rate_limited",
            message="Too many requests. Please try again later.",
        )

    if code in DUPLICATE_CODES:
        return AuthApplicationError(
            status_code=status.HTTP_409_CONFLICT,
            code="account_already_exists",
            message="Unable to complete this request.",
        )

    if code == "email_not_confirmed":
        return AuthApplicationError(
            status_code=status.HTTP_403_FORBIDDEN,
            code="email_not_confirmed",
            message="Please verify your email before signing in.",
        )

    if code in AUTHENTICATION_CODES or upstream_status == status.HTTP_401_UNAUTHORIZED:
        return AuthApplicationError(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="authentication_failed",
            message=authentication_message,
        )

    if upstream_status == status.HTTP_403_FORBIDDEN:
        return AuthApplicationError(
            status_code=status.HTTP_403_FORBIDDEN,
            code="forbidden",
            message="This operation is not allowed.",
        )

    if upstream_status == status.HTTP_400_BAD_REQUEST:
        return AuthApplicationError(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="auth_request_failed",
            message="Unable to complete this request.",
        )

    logger.exception(
        "Unexpected Supabase Auth error: type=%s repr=%r message=%s "
        "code=%r status=%r status_code=%r",
        type(exc).__name__,
        exc,
        str(exc),
        getattr(exc, "code", None),
        getattr(exc, "status", None),
        getattr(exc, "status_code", None),
    )
    return AuthApplicationError(
        status_code=status.HTTP_502_BAD_GATEWAY,
        code="auth_provider_error",
        message="Authentication service is temporarily unavailable.",
    )


def unexpected_auth_error() -> AuthApplicationError:
    logger.exception("Unexpected Auth module error")
    return AuthApplicationError(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        code="auth_internal_error",
        message="Unable to complete this request.",
    )


def _error_code(exc: Exception) -> str | None:
    code = getattr(exc, "code", None)
    if code is None:
        return None
    value = getattr(code, "value", code)
    return str(value)


def _error_status(exc: Exception) -> int | None:
    status_code = (
        getattr(exc, "status", None)
        or getattr(exc, "status_code", None)
        or getattr(getattr(exc, "response", None), "status_code", None)
    )
    if status_code is None:
        return None
    try:
        return int(status_code)
    except (TypeError, ValueError):
        return None


def raise_http_error(error: AuthApplicationError) -> None:
    raise HTTPException(
        status_code=error.status_code,
        detail=error.detail,
    )
