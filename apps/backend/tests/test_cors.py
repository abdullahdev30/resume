import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import app


@pytest.mark.parametrize(
    "origin",
    [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://[::1]:3000",
        "http://localhost:3001",
    ],
)
def test_development_loopback_origins_pass_preflight(origin: str) -> None:
    response = TestClient(app).options(
        "/api/v1/auth/login",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == origin
    assert response.headers["access-control-allow-credentials"] == "true"


def test_untrusted_origin_is_rejected() -> None:
    response = TestClient(app).options(
        "/api/v1/auth/login",
        headers={
            "Origin": "https://attacker.example",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )

    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers


def test_configured_origins_are_normalized_and_deduplicated() -> None:
    test_settings = Settings(
        _env_file=None,
        supabase_url="https://project.example",
        supabase_publishable_key="test-key",
        frontend_url="https://app.example/",
        cors_origins=" https://preview.example/,https://app.example ",
    )

    assert test_settings.allowed_cors_origins == [
        "https://app.example",
        "https://preview.example",
    ]
