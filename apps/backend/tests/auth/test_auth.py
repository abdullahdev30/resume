from dataclasses import dataclass

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

    def get_current_user(self, access_token):
        if access_token == "expired-token":
            raise invalid_session_error()
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
        return auth_result()

    def change_password(self, *, payload, access_token, refresh_token):
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


def user_response() -> UserResponse:
    return UserResponse(
        id="user-123",
        email="john@example.com",
        name="John Doe",
        number="03001234567",
        email_verified=True,
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


def test_register_valid_data_normalizes_inputs(client, auth_service_override):
    response = client.post(
        "/api/auth/register",
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


@pytest.mark.parametrize(
    "number",
    [
        "3001234567",
        "030012345678",
        "0300-1234567",
        "+923001234567",
        "abc03001234",
    ],
)
def test_register_rejects_invalid_phone_numbers(client, number):
    response = client.post(
        "/api/auth/register",
        json=valid_register_payload(number=number),
    )

    assert response.status_code == 422


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
        "/api/auth/register",
        json=valid_register_payload(
            password=password,
            confirm_password=password,
        ),
    )

    assert response.status_code == 422


def test_register_rejects_password_mismatch(client):
    response = client.post(
        "/api/auth/register",
        json=valid_register_payload(confirm_password="OtherPassword123!"),
    )

    assert response.status_code == 422


def test_register_rejects_malformed_email(client):
    response = client.post(
        "/api/auth/register",
        json=valid_register_payload(email="not-an-email"),
    )

    assert response.status_code == 422


def test_verify_email_sets_cookies_without_tokens_in_json(client):
    response = client.post(
        "/api/auth/verify-email",
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
        "/api/auth/verify-email",
        json={"email": "john@example.com", "otp": "12ab56"},
    )

    assert response.status_code == 422


def test_resend_verification_returns_generic_message(client):
    response = client.post(
        "/api/auth/resend-verification",
        json={"email": "john@example.com"},
    )

    assert response.status_code == 200
    assert "If an account is pending verification" in response.json()["message"]


def test_login_sets_cookies_without_tokens_in_json(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "john@example.com", "password": "StrongPassword123!"},
    )

    assert response.status_code == 200
    assert response.cookies.get("access_token") == "access-token"
    assert response.cookies.get("refresh_token") == "refresh-token"
    response_body = response.json()
    assert response_body["message"] == "Login successful."
    assert response_body["user"]["email"] == "john@example.com"
    assert "access-token" not in str(response_body)
    assert "refresh-token" not in str(response_body)


def test_me_requires_authentication(client):
    response = client.get("/api/auth/me")

    assert response.status_code == 401


def test_me_returns_current_user(client):
    client.cookies.set("access_token", "access-token")

    response = client.get("/api/auth/me")

    assert response.status_code == 200
    assert response.json()["email"] == "john@example.com"


def test_me_accepts_bearer_access_token(client):
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer access-token"},
    )

    assert response.status_code == 200
    assert response.json()["email"] == "john@example.com"


def test_me_rejects_invalid_session(client):
    client.cookies.set("access_token", "expired-token")

    response = client.get("/api/auth/me")

    assert response.status_code == 401


def test_refresh_rotates_session_cookies(client):
    client.cookies.set("refresh_token", "old-refresh-token")

    response = client.post(
        "/api/auth/refresh",
    )

    assert response.status_code == 200
    assert response.cookies.get("access_token") == "new-access-token"
    assert response.cookies.get("refresh_token") == "new-refresh-token"
    response_body = response.json()
    assert response_body["message"] == "Session refreshed successfully."
    assert "new-access-token" not in str(response_body)
    assert "new-refresh-token" not in str(response_body)


def test_refresh_invalid_token_clears_cookies(client, auth_service_override):
    auth_service_override.fail_refresh = True
    client.cookies.set("access_token", "old-access-token")
    client.cookies.set("refresh_token", "old-refresh-token")

    response = client.post(
        "/api/auth/refresh",
    )

    assert response.status_code == 401
    assert response.cookies.get("access_token") is None
    assert response.cookies.get("refresh_token") is None


def test_logout_clears_cookies(client):
    client.cookies.set("access_token", "access-token")
    client.cookies.set("refresh_token", "refresh-token")

    response = client.post("/api/auth/logout")

    assert response.status_code == 200
    assert response.cookies.get("access_token") is None
    assert response.cookies.get("refresh_token") is None


def test_forgot_password_does_not_disclose_account_existence(client):
    response = client.post(
        "/api/auth/forgot-password",
        json={"email": "unknown@example.com"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "message": (
            "If an account exists for this email, "
            "password recovery instructions have been sent."
        ),
    }


def test_verify_recovery_otp_sets_recovery_session(client):
    response = client.post(
        "/api/auth/verify-recovery-otp",
        json={"email": "john@example.com", "otp": "123456"},
    )

    assert response.status_code == 200
    assert response.cookies.get("access_token") == "access-token"
    assert response.cookies.get("refresh_token") == "refresh-token"
    response_body = response.json()
    assert response_body["message"] == "Recovery OTP verified successfully."
    assert "access-token" not in str(response_body)
    assert "refresh-token" not in str(response_body)


def test_change_password_requires_session(client):
    response = client.post(
        "/api/auth/change-password",
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
        "/api/auth/change-password",
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
        "/api/auth/change-password",
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
        "/api/auth/change-password",
        json={
            "new_password": "NewStrongPassword123!",
            "confirm_new_password": "NewStrongPassword123!",
        },
    )

    assert response.status_code == 200
    assert response.json() == {"message": "Password changed successfully."}

