from dataclasses import dataclass
from typing import Any

import pytest
from fastapi import status
from supabase_auth.errors import AuthApiError

from app.modules.auth.errors import AuthApplicationError, upstream_auth_error
from app.modules.auth.schemas import RegisterRequest
from app.modules.auth.service import AuthService


@dataclass
class FakeSupabaseResponse:
    body: dict[str, Any]

    def json(self) -> dict[str, Any]:
        return self.body


class FakeSupabaseAuth:
    def __init__(self, body: dict[str, Any]) -> None:
        self.body = body
        self.request_body: dict[str, Any] | None = None
        self.redirect_to: str | None = None

    def _request(self, method, path, *, body=None, redirect_to=None):
        self.request_body = body
        self.redirect_to = redirect_to
        return FakeSupabaseResponse(self.body)


class FakeSupabaseClient:
    def __init__(self, auth: FakeSupabaseAuth) -> None:
        self.auth = auth


def register_request() -> RegisterRequest:
    return RegisterRequest(
        name="Jane Doe",
        email="jane@example.com",
        phone="03001234567",
        password="StrongPassword123!",
        confirm_password="StrongPassword123!",
    )


def test_register_accepts_wrapped_supabase_signup_response():
    auth = FakeSupabaseAuth(
        {
            "user": {
                "id": "user-123",
                "email": "jane@example.com",
                "identities": [{"id": "identity-123"}],
            },
            "session": None,
        },
    )
    service = AuthService(client_factory=lambda: FakeSupabaseClient(auth))

    response = service.register(register_request())

    assert response.email == "jane@example.com"
    assert response.email_verification_required is True
    assert auth.request_body == {
        "email": "jane@example.com",
        "password": "StrongPassword123!",
        "data": {
            "name": "Jane Doe",
            "phone_number": "03001234567",
        },
        "gotrue_meta_security": {
            "captcha_token": None,
        },
    }
    assert auth.redirect_to.endswith("/auth/verified")


def test_register_accepts_top_level_supabase_user_response():
    auth = FakeSupabaseAuth(
        {
            "id": "user-123",
            "email": "jane@example.com",
            "identities": [{"id": "identity-123"}],
        },
    )
    service = AuthService(client_factory=lambda: FakeSupabaseClient(auth))

    response = service.register(register_request())

    assert response.email == "jane@example.com"
    assert response.email_verification_required is True


def test_register_rejects_duplicate_signup_response():
    auth = FakeSupabaseAuth(
        {
            "user": {
                "id": "user-123",
                "email": "jane@example.com",
                "identities": [],
            },
            "session": None,
        },
    )
    service = AuthService(client_factory=lambda: FakeSupabaseClient(auth))

    with pytest.raises(AuthApplicationError) as exc_info:
        service.register(register_request())

    assert exc_info.value.status_code == status.HTTP_409_CONFLICT
    assert exc_info.value.code == "account_already_exists"


def test_upstream_auth_error_uses_status_code_attribute():
    class StatusCodeOnlyError(Exception):
        status_code = 429
        code = None

    error = upstream_auth_error(StatusCodeOnlyError("rate limited"))

    assert error.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    assert error.code == "rate_limited"


def test_upstream_auth_error_maps_supabase_duplicate_error():
    error = upstream_auth_error(
        AuthApiError("User already registered", 422, "user_already_exists"),
    )

    assert error.status_code == status.HTTP_409_CONFLICT
    assert error.code == "account_already_exists"
