from contextlib import contextmanager
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import Mock

import pytest
from app.modules.billing import checkout
from app.modules.billing.dependencies import require_account
from fastapi import FastAPI
from fastapi.testclient import TestClient
from stripe import StripeError


def package():
    return {
        "id": "package-1",
        "name": "Professional",
        "monthly_price": Decimal("9.99"),
        "currency": "USD",
        "persona_limit": 5,
        "stripe_price_id": "price_live_or_test",
    }


@pytest.fixture
def client(monkeypatch):
    app = FastAPI()
    app.include_router(checkout.router, prefix="/api/v1")
    app.dependency_overrides[require_account] = lambda: SimpleNamespace(
        id="owner", email="owner@example.com"
    )
    monkeypatch.setattr(checkout.settings, "stripe_secret_key", "sk_test_fake")

    class Cursor:
        answers = iter([package(), {"count": 1}])

        def __init__(self):
            self.queries = []

        def execute(self, query, params=None):
            self.queries.append((query, params))

        def fetchone(self):
            return next(self.answers)

    cursor = Cursor()

    @contextmanager
    def database():
        yield cursor

    monkeypatch.setattr(checkout, "database", database)
    app.state.test_cursor = cursor
    return TestClient(app)


def fake_stripe(create):
    return Mock(
        return_value=SimpleNamespace(
            v1=SimpleNamespace(
                prices=SimpleNamespace(
                    retrieve=Mock(
                        return_value=SimpleNamespace(
                            active=True,
                            recurring=None,
                            currency="usd",
                            unit_amount=999,
                        )
                    )
                ),
                checkout=SimpleNamespace(sessions=SimpleNamespace(create=create)),
            )
        )
    )


def test_checkout_uses_server_price_and_stores_order(client, monkeypatch):
    create = Mock(return_value=SimpleNamespace(id="cs_test_123", client_secret="secret"))
    sdk = fake_stripe(create)
    monkeypatch.setattr(checkout, "StripeClient", sdk)
    response = client.post(
        "/api/v1/billing/create-checkout-session", json={"package_id": "package-1"}
    )
    assert response.status_code == 200
    assert response.json() == {"client_secret": "secret"}
    sdk.assert_called_once_with("sk_test_fake", stripe_version="2026-10-28.endive")
    params = create.call_args.args[0]
    assert params["ui_mode"] == "form"
    assert params["mode"] == "payment"
    assert params["line_items"] == [{"price": "price_live_or_test", "quantity": 1}]
    assert params["automatic_tax"] == {"enabled": False}
    assert params["return_url"].endswith("/packages?checkout=complete")
    assert len(params["integration_identifier"].rsplit("_", 1)[1]) == 8
    assert client.app.state.test_cursor.queries[-1][0].startswith(
        "INSERT INTO stripe_checkout_orders"
    )


def test_missing_configuration(client, monkeypatch):
    monkeypatch.setattr(checkout.settings, "stripe_secret_key", None)
    response = client.post(
        "/api/v1/billing/create-checkout-session", json={"package_id": "package-1"}
    )
    assert response.status_code == 503


def test_stripe_error_is_sanitized(client, monkeypatch):
    create = Mock(side_effect=StripeError("sensitive provider details"))
    monkeypatch.setattr(checkout, "StripeClient", fake_stripe(create))
    response = client.post(
        "/api/v1/billing/create-checkout-session", json={"package_id": "package-1"}
    )
    assert response.status_code == 502
    assert "sensitive" not in response.text


def test_rejects_price_that_does_not_match_package(client, monkeypatch):
    sdk = fake_stripe(Mock())
    sdk.return_value.v1.prices.retrieve.return_value.unit_amount = 1000
    monkeypatch.setattr(checkout, "StripeClient", sdk)
    response = client.post(
        "/api/v1/billing/create-checkout-session", json={"package_id": "package-1"}
    )
    assert response.status_code == 409


def test_requires_account():
    app = FastAPI()
    app.include_router(checkout.router)
    response = TestClient(app).post(
        "/billing/create-checkout-session", json={"package_id": "package-1"}
    )
    assert response.status_code == 401
