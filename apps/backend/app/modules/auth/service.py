from collections.abc import Callable, Mapping
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from secrets import token_urlsafe
from typing import Any

from httpx import HTTPError
from supabase import Client
from supabase_auth.errors import AuthError

from app.core.config import settings
from app.integrations.supabase import create_supabase_client
from app.modules.auth.errors import (
    AuthApplicationError,
    invalid_recovery_code_error,
    invalid_session_error,
    upstream_auth_error,
)
from app.modules.auth.schemas import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    RegisterResponse,
    ResendVerificationRequest,
    UserResponse,
    VerifyEmailOtpRequest,
    VerifyRecoveryOtpRequest,
)

RECOVERY_CODE_TTL_MINUTES = 10
_RECOVERY_SESSIONS: dict[str, "RecoverySession"] = {}


@dataclass(frozen=True)
class AuthTokens:
    access_token: str
    refresh_token: str
    expires_in: int | None = None


@dataclass(frozen=True)
class AuthResult:
    user: UserResponse
    tokens: AuthTokens | None = None


@dataclass(frozen=True)
class RecoverySession:
    access_token: str
    refresh_token: str
    expires_at: datetime


class AuthService:
    def __init__(
        self,
        client_factory: Callable[[], Client] = create_supabase_client,
    ) -> None:
        self._client_factory = client_factory

    def register(self, payload: RegisterRequest) -> RegisterResponse:
        try:
            signup_user = self._sign_up(payload)
        except AuthApplicationError:
            raise
        except Exception as exc:
            raise upstream_auth_error(exc) from exc

        if signup_user is None:
            raise AuthApplicationError(
                status_code=400,
                code="registration_failed",
                message="Unable to start account registration.",
            )

        return RegisterResponse(
            message=(
                "Account registration started. "
                "Please verify the OTP sent to your email."
            ),
            email=str(payload.email),
            email_verification_required=True,
        )

    def _sign_up(self, payload: RegisterRequest) -> Mapping[str, Any] | Any | None:
        auth_client = self._client_factory().auth
        response = auth_client._request(
            "POST",
            "signup",
            body={
                "email": str(payload.email),
                "password": payload.password,
                "data": {
                    "name": payload.name,
                    "phone_number": payload.number,
                },
                "gotrue_meta_security": {
                    "captcha_token": None,
                },
            },
            redirect_to=f"{settings.frontend_url}/auth/verified",
        )
        response_body = response.json()
        signup_user = self._signup_user_from_response(response_body)
        if signup_user is None:
            return None

        identities = self._get_attr(signup_user, "identities")
        if isinstance(identities, list) and len(identities) == 0:
            raise AuthApplicationError(
                status_code=409,
                code="account_already_exists",
                message="Unable to complete this request.",
            )

        return signup_user

    def verify_email(self, payload: VerifyEmailOtpRequest) -> AuthResult:
        try:
            response = self._client_factory().auth.verify_otp(
                {
                    "email": str(payload.email),
                    "token": payload.otp,
                    "type": "signup",
                }
            )
        except Exception as exc:
            raise upstream_auth_error(
                exc,
                authentication_message="Invalid or expired OTP.",
            ) from exc

        return self._auth_result_from_response(response)

    def resend_verification(self, payload: ResendVerificationRequest) -> None:
        try:
            self._client_factory().auth.resend(
                {
                    "type": "signup",
                    "email": str(payload.email),
                    "options": {
                        "email_redirect_to": (
                            f"{settings.frontend_url}/auth/verified"
                        ),
                    },
                }
            )
        except Exception as exc:
            raise upstream_auth_error(exc) from exc

    def login(self, payload: LoginRequest) -> AuthResult:
        try:
            response = self._client_factory().auth.sign_in_with_password(
                {
                    "email": str(payload.email),
                    "password": payload.password,
                }
            )
        except Exception as exc:
            raise upstream_auth_error(exc) from exc

        return self._auth_result_from_response(response, require_session=True)

    def get_current_user(self, access_token: str) -> UserResponse:
        try:
            response = self._client_factory().auth.get_user(access_token)
        except Exception as exc:
            raise invalid_session_error() from exc

        user = self._get_attr(response, "user")
        if user is None:
            raise invalid_session_error()

        return self._user_response(user)

    def refresh_session(self, refresh_token: str) -> AuthResult:
        try:
            response = self._client_factory().auth.refresh_session(refresh_token)
        except Exception as exc:
            raise invalid_session_error() from exc

        return self._auth_result_from_response(response, require_session=True)

    def logout(
        self,
        *,
        access_token: str | None,
        refresh_token: str | None,
    ) -> None:
        if not access_token or not refresh_token:
            return

        try:
            client = self._client_factory()
            client.auth.set_session(access_token, refresh_token)
            client.auth.sign_out()
        except (AuthError, HTTPError):
            return

    def forgot_password(self, payload: ForgotPasswordRequest) -> None:
        try:
            self._client_factory().auth.reset_password_for_email(
                str(payload.email),
                {
                    "redirect_to": f"{settings.frontend_url}/auth/reset-password",
                },
            )
        except Exception as exc:
            error = upstream_auth_error(exc)
            if error.status_code == 429:
                raise error from exc

    def verify_recovery_otp(
        self,
        payload: VerifyRecoveryOtpRequest,
    ) -> str:
        try:
            response = self._client_factory().auth.verify_otp(
                {
                    "email": str(payload.email),
                    "token": payload.otp,
                    "type": "recovery",
                }
            )
        except Exception as exc:
            raise upstream_auth_error(exc) from exc

        auth_result = self._auth_result_from_response(response, require_session=True)
        if auth_result.tokens is None:
            raise invalid_session_error()

        return self._create_recovery_code(auth_result.tokens)

    def change_password(
        self,
        *,
        payload: ChangePasswordRequest,
        access_token: str | None = None,
        refresh_token: str | None = None,
    ) -> UserResponse:
        if payload.recovery_code:
            recovery_session = self._consume_recovery_code(payload.recovery_code)
            access_token = recovery_session.access_token
            refresh_token = recovery_session.refresh_token

        if not access_token or not refresh_token:
            raise invalid_session_error()

        try:
            client = self._client_factory()
            client.auth.set_session(access_token, refresh_token)
            response = client.auth.update_user(
                {
                    "password": payload.new_password,
                }
            )
        except Exception as exc:
            raise upstream_auth_error(exc) from exc

        user = self._get_attr(response, "user")
        if user is None:
            raise invalid_session_error()

        return self._user_response(user)

    def _create_recovery_code(self, tokens: AuthTokens) -> str:
        self._delete_expired_recovery_codes()
        recovery_code = token_urlsafe(32)
        _RECOVERY_SESSIONS[recovery_code] = RecoverySession(
            access_token=tokens.access_token,
            refresh_token=tokens.refresh_token,
            expires_at=datetime.now(UTC) + timedelta(minutes=RECOVERY_CODE_TTL_MINUTES),
        )
        return recovery_code

    def _consume_recovery_code(self, recovery_code: str) -> RecoverySession:
        self._delete_expired_recovery_codes()
        recovery_session = _RECOVERY_SESSIONS.pop(recovery_code, None)
        if recovery_session is None:
            raise invalid_recovery_code_error()
        return recovery_session

    def _delete_expired_recovery_codes(self) -> None:
        now = datetime.now(UTC)
        expired_codes = [
            code
            for code, recovery_session in _RECOVERY_SESSIONS.items()
            if recovery_session.expires_at <= now
        ]
        for code in expired_codes:
            _RECOVERY_SESSIONS.pop(code, None)

    def _auth_result_from_response(
        self,
        response: Any,
        *,
        require_session: bool = False,
    ) -> AuthResult:
        user = self._get_attr(response, "user")
        if user is None:
            raise invalid_session_error()

        session = self._get_attr(response, "session")
        tokens = self._tokens_from_session(session)

        if require_session and tokens is None:
            raise invalid_session_error()

        return AuthResult(
            user=self._user_response(user),
            tokens=tokens,
        )

    def _tokens_from_session(self, session: Any) -> AuthTokens | None:
        if session is None:
            return None

        access_token = self._get_attr(session, "access_token")
        refresh_token = self._get_attr(session, "refresh_token")
        if not access_token or not refresh_token:
            return None

        return AuthTokens(
            access_token=str(access_token),
            refresh_token=str(refresh_token),
            expires_in=self._get_attr(session, "expires_in"),
        )

    def _user_response(self, user: Any) -> UserResponse:
        metadata = self._get_attr(user, "user_metadata") or {}
        email = self._get_attr(user, "email")

        return UserResponse(
            id=str(self._get_attr(user, "id")),
            email=str(email).lower(),
            name=metadata.get("name"),
            number=metadata.get("phone_number"),
            email_verified=self._email_verified(user),
        )

    def _email_verified(self, user: Any) -> bool:
        return bool(
            self._get_attr(user, "email_confirmed_at")
            or self._get_attr(user, "confirmed_at")
        )

    def _get_attr(self, value: Any, attr: str) -> Any:
        if isinstance(value, dict):
            return value.get(attr)
        return getattr(value, attr, None)

    def _signup_user_from_response(self, response_body: Any) -> Any | None:
        if not isinstance(response_body, dict):
            return None

        user = response_body.get("user")
        if user is not None:
            return user

        if response_body.get("id") is not None:
            return response_body

        return None
