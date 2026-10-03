from datetime import UTC, datetime, timedelta

import pytest
from supabase_auth.errors import AuthApiError

from app.modules.auth.errors import AuthApplicationError
from app.modules.auth.schemas import GuestUpgradeRequest, GuestUpgradeVerifyRequest
from app.modules.auth.service import AuthService


class FakeGuestRepository:
    def __init__(self) -> None:
        self.expires_at = datetime.now(UTC) + timedelta(hours=12)
        self.active = True
        self.pending_email: str | None = None
        self.completed: dict[str, str] | None = None
        self.created_ttl: int | None = None

    def create(self, user_id: str, *, ttl_hours: int):
        assert user_id == "guest-123"
        self.created_ttl = ttl_hours
        return self.expires_at

    def require_active(self, user_id: str):
        assert user_id == "guest-123"
        return self.expires_at if self.active else None

    def set_pending_email(self, user_id: str, email: str):
        assert user_id == "guest-123"
        self.pending_email = email

    def pending_email_matches(self, user_id: str, email: str):
        return self.active and user_id == "guest-123" and self.pending_email == email

    def complete_upgrade(self, user_id: str, *, name: str, email: str, phone: str):
        assert user_id == "guest-123"
        self.completed = {"name": name, "email": email, "phone": phone}


class FakeGuestAuth:
    def __init__(self) -> None:
        self.access_token = "guest-access"
        self.refresh_token = "guest-refresh"
        self.email: str | None = None
        self.verified = False
        self.fail_otp = False

    def sign_in_anonymously(self, credentials=None):
        return self._response(anonymous=True)

    def get_user(self, access_token: str):
        return {"user": self._user(anonymous=not self.verified)}

    def refresh_session(self, refresh_token: str):
        return self._response(anonymous=not self.verified)

    def set_session(self, access_token: str, refresh_token: str):
        self.access_token = access_token
        self.refresh_token = refresh_token

    def update_user(self, attributes, options=None):
        if "email" in attributes:
            self.email = attributes["email"]
            return {"user": self._user(anonymous=True)}
        if "password" in attributes:
            return {"user": self._user(anonymous=False, metadata=attributes["data"])}
        raise AssertionError("Unexpected update_user payload")

    def verify_otp(self, params):
        if self.fail_otp:
            raise AuthApiError("OTP expired", 400, "otp_expired")
        assert params["type"] == "email_change"
        assert params["email"] == self.email
        self.verified = True
        self.access_token = "upgraded-access"
        self.refresh_token = "upgraded-refresh"
        return self._response(anonymous=False)

    def _response(self, *, anonymous: bool):
        return {
            "user": self._user(anonymous=anonymous),
            "session": {
                "access_token": self.access_token,
                "refresh_token": self.refresh_token,
                "expires_in": 3600,
            },
        }

    def _user(self, *, anonymous: bool, metadata=None):
        return {
            "id": "guest-123",
            "email": None if anonymous else self.email,
            "is_anonymous": anonymous,
            "email_confirmed_at": None if anonymous else "2026-10-03T12:00:00Z",
            "user_metadata": metadata or {},
        }


class FakeGuestClient:
    def __init__(self, auth: FakeGuestAuth) -> None:
        self.auth = auth


def upgrade_request() -> GuestUpgradeRequest:
    return GuestUpgradeRequest(
        name="Jane Doe",
        email="jane@example.com",
        phone="03001234567",
        password="StrongPassword123!",
        confirm_password="StrongPassword123!",
    )


def upgrade_verify() -> GuestUpgradeVerifyRequest:
    return GuestUpgradeVerifyRequest(
        **upgrade_request().model_dump(),
        otp="123456",
    )


def service_and_fakes():
    auth = FakeGuestAuth()
    repository = FakeGuestRepository()
    service = AuthService(
        client_factory=lambda: FakeGuestClient(auth),
        guest_repository=repository,
    )
    return service, auth, repository


def test_guest_creation_is_database_backed_for_exactly_12_hours():
    service, _, repository = service_and_fakes()

    result = service.create_guest()

    assert repository.created_ttl == 12
    assert result.user.id == "guest-123"
    assert result.user.is_guest is True
    assert result.user.guest_expires_at == repository.expires_at
    assert result.tokens is not None


def test_expired_guest_is_rejected_even_with_valid_provider_token():
    service, _, repository = service_and_fakes()
    repository.active = False

    with pytest.raises(AuthApplicationError) as exc_info:
        service.get_current_user("still-valid-provider-token")

    assert exc_info.value.status_code == 401
    assert exc_info.value.code == "guest_session_expired"


def test_expired_guest_cannot_extend_lifetime_by_refreshing_provider_session():
    service, _, repository = service_and_fakes()
    repository.active = False

    with pytest.raises(AuthApplicationError) as exc_info:
        service.refresh_session("still-valid-refresh-token")

    assert exc_info.value.status_code == 401
    assert exc_info.value.code == "guest_session_expired"


def test_guest_upgrade_preserves_uuid_and_finalizes_profile_details():
    service, _, repository = service_and_fakes()
    payload = upgrade_request()
    service.request_guest_upgrade(
        user_id="guest-123",
        access_token="guest-access",
        refresh_token="guest-refresh",
        payload=payload,
    )

    result = service.verify_guest_upgrade(
        user_id="guest-123",
        current_user=service.get_current_user("guest-access"),
        access_token="guest-access",
        refresh_token="guest-refresh",
        payload=upgrade_verify(),
    )

    assert result.user.id == "guest-123"
    assert result.user.is_guest is False
    assert result.user.email == "jane@example.com"
    assert repository.completed == {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "phone": "+923001234567",
    }


def test_guest_upgrade_rejects_wrong_or_expired_otp_without_marking_complete():
    service, auth, repository = service_and_fakes()
    payload = upgrade_request()
    service.request_guest_upgrade(
        user_id="guest-123",
        access_token="guest-access",
        refresh_token="guest-refresh",
        payload=payload,
    )
    auth.fail_otp = True

    with pytest.raises(AuthApplicationError) as exc_info:
        service.verify_guest_upgrade(
            user_id="guest-123",
            current_user=service.get_current_user("guest-access"),
            access_token="guest-access",
            refresh_token="guest-refresh",
            payload=upgrade_verify(),
        )

    assert exc_info.value.status_code == 401
    assert repository.completed is None
