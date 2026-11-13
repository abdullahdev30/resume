import hashlib
import hmac
import json
from contextlib import contextmanager
from decimal import Decimal
from types import SimpleNamespace
from uuid import uuid4

import pytest
from app.modules.billing import checkout, service
from app.modules.billing.checkout import CheckoutRequest
from fastapi import FastAPI
from fastapi.testclient import TestClient


class Cursor:
    def __init__(self, answers):
        self.answers = iter(answers)
        self.queries = []

    def execute(self, query, params=None):
        self.queries.append((query, params))

    def fetchone(self):
        return next(self.answers)


def fake_database(monkeypatch, module, answers):
    cursor = Cursor(answers)

    @contextmanager
    def database():
        yield cursor

    monkeypatch.setattr(module, "database", database)
    return cursor


def test_yearly_checkout_uses_server_yearly_price_and_is_idempotent(monkeypatch):
    package_id = uuid4()
    user_id = uuid4()
    key = uuid4()
    package = {
        "id": package_id,
        "name": "Professional",
        "persona_limit": 5,
        "monthly_price": Decimal("10.00"),
        "yearly_price": Decimal("96.00"),
        "currency": "PKR",
    }
    monkeypatch.setattr(checkout.settings, "safepay_public_key", "public-test")
    monkeypatch.setattr(checkout.settings, "safepay_secret_key", "secret-test")
    cursor = fake_database(monkeypatch, checkout, [None, package, {"count": 0}])

    result = checkout.initialize_payment(
        CheckoutRequest(package_id=str(package_id), billing_interval="yearly", idempotency_key=key),
        user=SimpleNamespace(id=user_id),
    )

    assert result["amount"] == 9600
    assert result["currency"] == "PKR"
    assert cursor.queries[-1][1][5:8] == (Decimal("96.00"), "yearly", 9600)
    assert "idempotency_key" in cursor.queries[-1][0]


def test_repeated_checkout_idempotency_key_reuses_pending_order(monkeypatch):
    order_id, package_id, key = uuid4(), uuid4(), uuid4()
    existing = {
        "id": order_id, "package_id": package_id, "billing_interval": "monthly",
        "amount_total": 1000, "currency": "usd", "tracker_token": "track_1", "status": "pending",
    }
    cursor = fake_database(monkeypatch, checkout, [existing])
    result = checkout.initialize_payment(
        CheckoutRequest(package_id=str(package_id), idempotency_key=key),
        user=SimpleNamespace(id=uuid4()),
    )
    assert result == {
        "order_id": str(order_id), "amount": 1000, "currency": "USD", "tracker_token": "track_1",
    }
    assert len(cursor.queries) == 2


def test_signed_safepay_webhook_is_accepted_and_invalid_signature_rejected(monkeypatch):
    secret = "sandbox-webhook-secret"
    monkeypatch.setattr(checkout.settings, "safepay_webhook_secret", secret)
    processed = []
    monkeypatch.setattr(checkout, "fulfill_safepay_payment", lambda **event: processed.append(event))
    app = FastAPI()
    app.include_router(checkout.router, prefix="/api/v1")
    client = TestClient(app)
    event_data = {
        "type": "payment:created",
        "notification": {
            "tracker": "track_1", "amount": "10.00", "currency": "PKR", "state": "PAID",
            "metadata": {"order_id": "order_1"},
        },
    }
    body = json.dumps({"data": event_data}, separators=(",", ":")).encode()
    signature = hmac.new(
        secret.encode(), json.dumps(event_data, separators=(",", ":")).encode(), hashlib.sha512
    ).hexdigest()

    rejected = client.post("/api/v1/webhooks/safepay", content=body, headers={"x-sfpy-signature": "bad"})
    accepted = client.post("/api/v1/webhooks/safepay", content=body, headers={"x-sfpy-signature": signature})

    assert rejected.status_code == 400
    assert accepted.status_code == 200
    assert processed[0]["tracker_token"] == "track_1"
    assert processed[0]["event_type"] == "payment:created"
    assert processed[0]["amount"] == 1000
    assert processed[0]["order_id"] == "order_1"


@pytest.mark.parametrize(("event_type", "expected_status"), [("payment.failed", "failed"), ("payment.succeeded", "paid")])
def test_safepay_fulfillment_uses_interval_and_deduplicates(event_type, expected_status, monkeypatch):
    order = {
        "id": uuid4(), "user_id": uuid4(), "package_id": uuid4(), "package_name": "Annual",
        "persona_limit": 5, "plan_price": Decimal("96.00"), "amount_total": 9600,
        "currency": "pkr", "billing_interval": "yearly", "status": "pending",
    }
    if event_type == "payment.failed":
        cursor = fake_database(monkeypatch, service, [{"event_id": "evt_1"}, order])
        result = service.fulfill_safepay_payment(
            event_id="evt_1", event_type=event_type, tracker_token="track_1", amount=9600, currency="PKR",
            order_id=None,
        )
        assert result == {"status": "failed"}
        assert not any("INSERT INTO user_subscriptions" in query for query, _ in cursor.queries)
        return

    cursor = fake_database(monkeypatch, service, [{"event_id": "evt_2"}, order])
    result = service.fulfill_safepay_payment(
        event_id="evt_2", event_type=event_type, tracker_token="track_1", amount=9600, currency="PKR",
        order_id=None,
    )
    insert = next(query for query, _ in cursor.queries if "INSERT INTO user_subscriptions" in query)
    assert result == {"status": expected_status}
    assert "INTERVAL '12 months'" in insert
    assert cursor.queries[-2][1][6] == "yearly"
