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
    guest_session_expired_error,
    guest_session_unavailable_error,
    guest_upgrade_error,
    invalid_recovery_code_error,
    invalid_session_error,
    upstream_auth_error,
)
from app.modules.auth.guest_repository import GuestAccountRepository
from app.modules.auth.schemas import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    GuestUpgradeRequest,
    GuestUpgradeVerifyRequest,
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
        guest_repository: GuestAccountRepository | None = None,
    ) -> None:
        self._client_factory = client_factory
        self._guest_repository = guest_repository or GuestAccountRepository()

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

    def create_guest(self) -> AuthResult:
        try:
            response = self._client_factory().auth.sign_in_anonymously(
                {"options": {"data": {"guest": True}}}
            )
            auth_result = self._auth_result_from_response(
                response,
                require_session=True,
            )
            if not auth_result.user.is_guest:
                raise guest_upgrade_error(
                    code="guest_creation_failed",
                    message="Unable to start a guest session.",
                )
            expires_at = self._guest_repository.create(
                auth_result.user.id,
                ttl_hours=settings.guest_session_ttl_hours,
            )
        except AuthApplicationError:
            raise
        except Exception as exc:
            raise upstream_auth_error(
                exc,
                authentication_message="Unable to start a guest session.",
            ) from exc

        return AuthResult(
            user=auth_result.user.model_copy(
                update={"guest_expires_at": expires_at}
            ),
            tokens=auth_result.tokens,
        )

    def get_current_user(self, access_token: str) -> UserResponse:
        try:
            response = self._client_factory().auth.get_user(access_token)
        except Exception as exc:
            raise invalid_session_error() from exc

        user = self._get_attr(response, "user")
        if user is None:
            raise invalid_session_error()

        return self._with_active_guest_lifetime(self._user_response(user))

    def refresh_session(self, refresh_token: str) -> AuthResult:
        try:
            response = self._client_factory().auth.refresh_session(refresh_token)
        except Exception as exc:
            raise invalid_session_error() from exc

        auth_result = self._auth_result_from_response(response, require_session=True)
        return AuthResult(
            user=self._with_active_guest_lifetime(auth_result.user),
            tokens=auth_result.tokens,
        )

    def request_guest_upgrade(
        self,
        *,
        user_id: str,
        access_token: str,
        refresh_token: str,
        payload: GuestUpgradeRequest,
    ) -> None:
        self._require_guest_id(user_id)
        try:
            client = self._client_factory()
            client.auth.set_session(access_token, refresh_token)
            response = client.auth.update_user(
                {"email": str(payload.email)},
                {"email_redirect_to": f"{settings.frontend_url}/settings"},
            )
            response_user = self._get_attr(response, "user")
            if response_user is None or str(self._get_attr(response_user, "id")) != user_id:
                raise guest_upgrade_error()
            self._guest_repository.set_pending_email(user_id, str(payload.email))
        except AuthApplicationError:
            raise
        except LookupError as exc:
            raise guest_session_expired_error() from exc
        except Exception as exc:
            raise upstream_auth_error(
                exc,
                authentication_message="Unable to send the verification code.",
            ) from exc

    def verify_guest_upgrade(
        self,
        *,
        user_id: str,
        current_user: UserResponse,
        access_token: str,
        refresh_token: str,
        payload: GuestUpgradeVerifyRequest,
    ) -> AuthResult:
        email = str(payload.email)
        try:
            pending_email_matches = self._guest_repository.pending_email_matches(
                user_id,
                email,
            )
        except Exception as exc:
            raise guest_session_unavailable_error() from exc
        if not pending_email_matches:
            raise guest_upgrade_error(
                code="guest_upgrade_not_requested",
                message="Request a new verification code before converting this account.",
                status_code=409,
            )

        try:
            client = self._client_factory()
            if current_user.is_guest:
                verification = client.auth.verify_otp(
                    {
                        "email": email,
                        "token": payload.otp,
                        "type": "email_change",
                    }
                )
                verified = self._auth_result_from_response(
                    verification,
                    require_session=True,
                )
                if verified.user.id != user_id:
                    raise guest_upgrade_error(
                        code="guest_identity_mismatch",
                        message="The verified identity does not match this guest session.",
                        status_code=403,
                    )
                if verified.tokens is None:
                    raise invalid_session_error()
                tokens = verified.tokens
            else:
                # Supabase may have accepted the OTP before a transient local
                # database failure. Retrying finalizes the same authenticated
                # UUID instead of leaving a half-converted account.
                if current_user.id != user_id or current_user.email != email:
                    raise guest_upgrade_error(
                        code="guest_identity_mismatch",
                        message="The verified identity does not match this guest session.",
                        status_code=403,
                    )
                tokens = AuthTokens(
                    access_token=access_token,
                    refresh_token=refresh_token,
                )

            client.auth.set_session(
                tokens.access_token,
                tokens.refresh_token,
            )
            updated = client.auth.update_user(
                {
                    "password": payload.password,
                    "data": {
                        "name": payload.name,
                        "phone_number": payload.number,
                    },
                }
            )
            updated_user = self._get_attr(updated, "user")
            if updated_user is None:
                raise invalid_session_error()
            user = self._user_response(updated_user)
            if user.id != user_id or user.is_guest:
                raise guest_upgrade_error(
                    code="guest_upgrade_incomplete",
                    message="Email verification did not complete the account conversion.",
                    status_code=409,
                )

            self._guest_repository.complete_upgrade(
                user_id,
                name=payload.name,
                email=email,
                phone=payload.number,
            )
            return AuthResult(user=user, tokens=tokens)
        except AuthApplicationError:
            raise
        except LookupError as exc:
            raise guest_upgrade_error(status_code=409) from exc
        except Exception as exc:
            raise upstream_auth_error(
                exc,
                authentication_message="Invalid or expired verification code.",
            ) from exc

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

    def _with_active_guest_lifetime(self, user: UserResponse) -> UserResponse:
        if not user.is_guest:
            return user
        try:
            expires_at = self._guest_repository.require_active(user.id)
        except Exception as exc:
            raise guest_session_unavailable_error() from exc
        if expires_at is None:
            raise guest_session_expired_error()
        return user.model_copy(update={"guest_expires_at": expires_at})

    def _require_guest_id(self, user_id: str) -> None:
        try:
            expires_at = self._guest_repository.require_active(user_id)
        except Exception as exc:
            raise guest_session_unavailable_error() from exc
        if expires_at is None:
            raise guest_session_expired_error()

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
            email=str(email).lower() if email else None,
            name=metadata.get("name"),
            number=metadata.get("phone_number"),
            email_verified=self._email_verified(user),
            is_guest=bool(self._get_attr(user, "is_anonymous")),
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
