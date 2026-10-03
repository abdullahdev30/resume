from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.modules.auth.dependencies import get_auth_service
from app.modules.auth.errors import invalid_session_error
from app.modules.auth.router import limiter
from app.modules.auth.schemas import UserResponse
from app.modules.auth.service import AuthResult, AuthTokens


@dataclass
class FakeAuthService:
    fail_refresh: bool = False

    def __post_init__(self) -> None:
        self.register_payload = None
        self.forgot_payload = None
        self.guest_upgrade_payload = None
        self.guest_create_count = 0

    def register(self, payload):
        self.register_payload = payload
        return {
            "message": (
                "Account registration started. "
                "Please verify the OTP sent to your email."
            ),
            "email": str(payload.email),
            "email_verification_required": True,
        }

    def verify_email(self, payload):
        return auth_result()

    def resend_verification(self, payload):
        return None

    def login(self, payload):
        return auth_result()

    def create_guest(self):
        self.guest_create_count += 1
        return guest_auth_result()

    def request_guest_upgrade(
        self,
        *,
        user_id,
        access_token,
        refresh_token,
        payload,
    ):
        self.guest_upgrade_payload = payload

    def verify_guest_upgrade(
        self,
        *,
        user_id,
        current_user,
        access_token,
        refresh_token,
        payload,
    ):
        self.guest_upgrade_payload = payload
        return AuthResult(
            user=user_response(user_id=user_id, email=str(payload.email)),
            tokens=AuthTokens(
                access_token="upgraded-access-token",
                refresh_token="upgraded-refresh-token",
            ),
        )

    def get_current_user(self, access_token):
        if access_token == "expired-token":
            raise invalid_session_error()
        if access_token == "guest-token":
            return UserResponse(id="guest-123", is_guest=True)
        return user_response()

    def refresh_session(self, refresh_token):
        if self.fail_refresh:
            raise invalid_session_error()
        return auth_result(
            access_token="new-access-token",
            refresh_token="new-refresh-token",
        )

    def logout(self, *, access_token, refresh_token):
        return None

    def forgot_password(self, payload):
        self.forgot_payload = payload

    def verify_recovery_otp(self, payload):
        return "recovery-code-123456789"

    def change_password(self, *, payload, access_token=None, refresh_token=None):
        if not payload.recovery_code and (not access_token or not refresh_token):
            raise invalid_session_error()
        return user_response()


@pytest.fixture(autouse=True)
def auth_service_override():
    limiter.enabled = False
    fake = FakeAuthService()
    app.dependency_overrides[get_auth_service] = lambda: fake
    yield fake
    app.dependency_overrides.clear()
    limiter.enabled = True


@pytest.fixture
def client():
    return TestClient(app)


def user_response(
    *,
    user_id: str = "user-123",
    email: str = "john@example.com",
) -> UserResponse:
    return UserResponse(
        id=user_id,
        email=email,
        name="John Doe",
        number="03001234567",
        email_verified=True,
    )


def guest_auth_result() -> AuthResult:
    return AuthResult(
        user=UserResponse(
            id="guest-123",
            is_guest=True,
            guest_expires_at=datetime.now(UTC) + timedelta(hours=12),
        ),
        tokens=AuthTokens(
            access_token="guest-access-token",
            refresh_token="guest-refresh-token",
        ),
    )


def auth_result(
    *,
    access_token: str = "access-token",
    refresh_token: str = "refresh-token",
) -> AuthResult:
    return AuthResult(
        user=user_response(),
        tokens=AuthTokens(
            access_token=access_token,
            refresh_token=refresh_token,
        ),
    )


def valid_register_payload(**overrides):
    payload = {
        "name": " John Doe ",
        "email": " JOHN@EXAMPLE.COM ",
        "number": "03001234567",
        "password": "StrongPassword123!",
        "confirm_password": "StrongPassword123!",
    }
    payload.update(overrides)
    return payload


def valid_register_payload_with_phone(**overrides):
    payload = valid_register_payload(**overrides)
    payload["phone"] = payload.pop("number")
    return payload


def test_register_valid_data_normalizes_inputs(client, auth_service_override):
    response = client.post(
        "/api/v1/auth/register",
        json=valid_register_payload(),
    )

    assert response.status_code == 201
    assert response.json() == {
        "message": (
            "Account registration started. "
            "Please verify the OTP sent to your email."
        ),
        "email": "john@example.com",
        "email_verification_required": True,
    }
    assert auth_service_override.register_payload.name == "John Doe"
    assert str(auth_service_override.register_payload.email) == "john@example.com"
    assert auth_service_override.register_payload.number == "+923001234567"


def test_register_accepts_phone_field(client, auth_service_override):
    response = client.post(
        "/api/v1/auth/register",
        json=valid_register_payload_with_phone(),
    )

    assert response.status_code == 201
    assert auth_service_override.register_payload.number == "+923001234567"


@pytest.mark.parametrize(
    "number",
    [
        "123",
        "+0123456789",
        "++923001234567",
        "abc03001234",
    ],
)
def test_register_rejects_invalid_phone_numbers(client, number):
    response = client.post(
        "/api/v1/auth/register",
        json=valid_register_payload(number=number),
    )

    assert response.status_code == 422


@pytest.mark.parametrize(
    "number",
    ["0300-1234567", "+923001234567", "00923001234567"],
)
def test_register_accepts_and_normalizes_common_phone_formats(
    client,
    auth_service_override,
    number,
):
    response = client.post(
        "/api/v1/auth/register",
        json=valid_register_payload(number=number),
    )

    assert response.status_code == 201
    assert auth_service_override.register_payload.number == "+923001234567"


@pytest.mark.parametrize(
    "password",
    [
        "short1!",
        "lowercase123!",
        "UPPERCASE123!",
        "NoDigits!",
        "NoSpecial123",
        " StrongPassword123!",
    ],
)
def test_register_rejects_weak_passwords(client, password):
    response = client.post(
        "/api/v1/auth/register",
        json=valid_register_payload(
            password=password,
            confirm_password=password,
        ),
    )

    assert response.status_code == 422


def test_register_rejects_password_mismatch(client):
    response = client.post(
        "/api/v1/auth/register",
        json=valid_register_payload(confirm_password="OtherPassword123!"),
    )

    assert response.status_code == 422


def test_register_rejects_malformed_email(client):
    response = client.post(
        "/api/v1/auth/register",
        json=valid_register_payload(email="not-an-email"),
    )

    assert response.status_code == 422


def test_verify_email_sets_cookies_without_tokens_in_json(client):
    response = client.post(
        "/api/v1/auth/verify-email",
        json={"email": "john@example.com", "otp": "123456"},
    )

    assert response.status_code == 200
    assert response.cookies.get("access_token") == "access-token"
    assert response.cookies.get("refresh_token") == "refresh-token"
    response_body = response.json()
    assert "access-token" not in str(response_body)
    assert "refresh-token" not in str(response_body)


def test_verify_email_rejects_malformed_otp(client):
    response = client.post(
        "/api/v1/auth/verify-email",
        json={"email": "john@example.com", "otp": "12ab56"},
    )

    assert response.status_code == 422


def test_resend_verification_returns_generic_message(client):
    response = client.post(
        "/api/v1/auth/resend-verification",
        json={"email": "john@example.com"},
    )

    assert response.status_code == 200
    assert "If an account is pending verification" in response.json()["message"]


def test_login_sets_http_only_session_without_exposing_tokens(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "john@example.com", "password": "StrongPassword123!"},
    )

    assert response.status_code == 200
    assert response.cookies.get("access_token") == "access-token"
    assert response.cookies.get("refresh_token") == "refresh-token"
    response_body = response.json()
    assert response_body["message"] == "Login successful."
    assert response_body["user"]["id"] == "user-123"
    assert "access_token" not in response_body
    assert "refresh_token" not in response_body


def test_create_guest_sets_12_hour_session_without_exposing_tokens(client):
    response = client.post("/api/v1/auth/guest")

    assert response.status_code == 201
    assert response.cookies.get("access_token") == "guest-access-token"
    assert response.cookies.get("refresh_token") == "guest-refresh-token"
    response_body = response.json()
    assert response_body["user"]["id"] == "guest-123"
    assert response_body["user"]["is_guest"] is True
    assert response_body["user"]["guest_expires_at"] is not None
    assert "guest-access-token" not in str(response_body)


def test_create_guest_resumes_existing_guest_without_replacing_ownership(
    client,
    auth_service_override,
):
    client.cookies.set("access_token", "guest-token")

    response = client.post("/api/v1/auth/guest")

    assert response.status_code == 201
    assert response.json()["message"] == "Guest session resumed."
    assert response.json()["user"]["id"] == "guest-123"
    assert auth_service_override.guest_create_count == 0


def test_create_guest_does_not_replace_registered_session(client):
    client.cookies.set("access_token", "access-token")

    response = client.post("/api/v1/auth/guest")

    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "already_authenticated"


def test_guest_upgrade_request_uses_current_guest_identity(
    client,
    auth_service_override,
):
    client.cookies.set("access_token", "guest-token")
    client.cookies.set("refresh_token", "guest-refresh-token")

    response = client.post(
        "/api/v1/auth/guest/upgrade/request",
        json=valid_register_payload_with_phone(),
    )

    assert response.status_code == 200
    assert auth_service_override.guest_upgrade_payload.name == "John Doe"
    assert auth_service_override.guest_upgrade_payload.number == "+923001234567"


def test_registered_user_cannot_use_guest_upgrade_request(client):
    client.cookies.set("access_token", "access-token")
    client.cookies.set("refresh_token", "refresh-token")

    response = client.post(
        "/api/v1/auth/guest/upgrade/request",
        json=valid_register_payload_with_phone(),
    )

    assert response.status_code == 403
    assert response.json()["detail"]["code"] == "guest_permission_denied"


def test_guest_upgrade_verification_preserves_user_id_and_rotates_cookies(
    client,
):
    client.cookies.set("access_token", "guest-token")
    client.cookies.set("refresh_token", "guest-refresh-token")
    payload = valid_register_payload_with_phone(otp="123456")

    response = client.post(
        "/api/v1/auth/guest/upgrade/verify",
        json=payload,
    )

    assert response.status_code == 200
    assert response.json()["user"]["id"] == "guest-123"
    assert response.json()["user"]["is_guest"] is False
    assert response.cookies.get("access_token") == "upgraded-access-token"
    assert response.cookies.get("refresh_token") == "upgraded-refresh-token"


def test_me_requires_authentication(client):
    response = client.get("/api/v1/auth/me")

    assert response.status_code == 401


def test_me_returns_current_user(client):
    client.cookies.set("access_token", "access-token")

    response = client.get("/api/v1/auth/me")

    assert response.status_code == 200
    assert response.json()["email"] == "john@example.com"


def test_me_accepts_bearer_access_token(client):
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer access-token"},
    )

    assert response.status_code == 200
    assert response.json()["email"] == "john@example.com"


def test_me_rejects_invalid_session(client):
    client.cookies.set("access_token", "expired-token")

    response = client.get("/api/v1/auth/me")

    assert response.status_code == 401


def test_refresh_rotates_session_cookies(client):
    client.cookies.set("refresh_token", "old-refresh-token")

    response = client.post(
        "/api/v1/auth/refresh",
    )

    assert response.status_code == 200
    assert response.cookies.get("access_token") == "new-access-token"
    assert response.cookies.get("refresh_token") == "new-refresh-token"
    response_body = response.json()
    assert response_body["message"] == "Session refreshed successfully."
    assert response_body["user"]["id"] == "user-123"
    assert "access_token" not in response_body
    assert "refresh_token" not in response_body


def test_refresh_invalid_token_clears_cookies(client, auth_service_override):
    auth_service_override.fail_refresh = True
    client.cookies.set("access_token", "old-access-token")
    client.cookies.set("refresh_token", "old-refresh-token")

    response = client.post(
        "/api/v1/auth/refresh",
    )

    assert response.status_code == 401
    assert response.cookies.get("access_token") is None
    assert response.cookies.get("refresh_token") is None


def test_logout_clears_cookies(client):
    client.cookies.set("access_token", "access-token")
    client.cookies.set("refresh_token", "refresh-token")

    response = client.post("/api/v1/auth/logout")

    assert response.status_code == 200
    assert response.cookies.get("access_token") is None
    assert response.cookies.get("refresh_token") is None


def test_forgot_password_does_not_disclose_account_existence(client):
    response = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "unknown@example.com"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "message": (
            "If an account exists for this email, "
            "password recovery instructions have been sent."
        ),
    }


def test_verify_recovery_otp_returns_only_recovery_code(client):
    response = client.post(
        "/api/v1/auth/verify-recovery-otp",
        json={"email": "john@example.com", "otp": "123456"},
    )

    assert response.status_code == 200
    assert response.cookies.get("access_token") is None
    assert response.cookies.get("refresh_token") is None
    response_body = response.json()
    assert response_body["message"] == "Recovery OTP verified successfully."
    assert response_body["recovery_code"] == "recovery-code-123456789"
    assert "user" not in response_body
    assert "access-token" not in str(response_body)
    assert "refresh-token" not in str(response_body)


def test_change_password_requires_session(client):
    response = client.post(
        "/api/v1/auth/change-password",
        json={
            "new_password": "NewStrongPassword123!",
            "confirm_new_password": "NewStrongPassword123!",
        },
    )

    assert response.status_code == 401


def test_change_password_rejects_weak_password(client):
    client.cookies.set("access_token", "access-token")
    client.cookies.set("refresh_token", "refresh-token")

    response = client.post(
        "/api/v1/auth/change-password",
        json={
            "new_password": "weak",
            "confirm_new_password": "weak",
        },
    )

    assert response.status_code == 422


def test_change_password_rejects_mismatch(client):
    client.cookies.set("access_token", "access-token")
    client.cookies.set("refresh_token", "refresh-token")

    response = client.post(
        "/api/v1/auth/change-password",
        json={
            "new_password": "NewStrongPassword123!",
            "confirm_new_password": "OtherStrongPassword123!",
        },
    )

    assert response.status_code == 422


def test_change_password_valid_session(client):
    client.cookies.set("access_token", "access-token")
    client.cookies.set("refresh_token", "refresh-token")

    response = client.post(
        "/api/v1/auth/change-password",
        json={
            "new_password": "NewStrongPassword123!",
            "confirm_new_password": "NewStrongPassword123!",
        },
    )

    assert response.status_code == 200
    assert response.json() == {"message": "Password changed successfully."}


def test_change_password_rejects_saved_guest_session(client):
    client.cookies.set("access_token", "guest-token")
    client.cookies.set("refresh_token", "guest-refresh-token")

    response = client.post(
        "/api/v1/auth/change-password",
        json={
            "new_password": "NewStrongPassword123!",
            "confirm_new_password": "NewStrongPassword123!",
        },
    )

    assert response.status_code == 403
    assert response.json()["detail"]["code"] == "guest_permission_denied"



def test_change_password_accepts_recovery_code_without_session(client):
    response = client.post(
        "/api/v1/auth/change-password",
        json={
            "new_password": "NewStrongPassword123!",
            "confirm_new_password": "NewStrongPassword123!",
            "recovery_code": "recovery-code-123456789",
        },
    )

    assert response.status_code == 200
    assert response.json() == {"message": "Password changed successfully."}
