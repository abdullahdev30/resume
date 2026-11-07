from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from types import SimpleNamespace
from uuid import uuid4

import pytest
from app.main import app
from app.modules.auth.dependencies import get_auth_service
from app.modules.auth.schemas import UserResponse
from app.modules.billing import dependencies, router, service
from app.modules.billing.router import PackageInput, SubscribeInput
from fastapi import HTTPException
from fastapi.testclient import TestClient
from pydantic import ValidationError
from starlette.requests import Request


@pytest.fixture
def client(monkeypatch):
    identity = UserResponse(id=str(uuid4()), email="owner@example.com")
    app.dependency_overrides[get_auth_service] = lambda: SimpleNamespace(
        get_current_user=lambda _: identity
    )
    client = TestClient(app)
    client.cookies.set("access_token", "test-token")
    yield client
    app.dependency_overrides.clear()


def test_regular_users_cannot_administer(client):
    assert client.get("/api/v1/admin/users").status_code == 403
    assert client.post("/api/v1/admin/packages", json={}).status_code == 403
    assert (
        client.patch(
            f"/api/v1/admin/users/{uuid4()}/role", json={"role": "admin"}
        ).status_code
        == 403
    )


def test_admin_cannot_manage_packages_or_roles(client, monkeypatch):
    monkeypatch.setattr(
        service, "access_for", lambda _: {"role": "admin", "active": True}
    )
    assert client.post("/api/v1/admin/packages", json={}).status_code == 403
    assert (
        client.patch(
            f"/api/v1/admin/users/{uuid4()}/role", json={"role": "admin"}
        ).status_code
        == 403
    )


def test_disabled_existing_session_is_rejected(client, monkeypatch):
    monkeypatch.setattr(
        service, "access_for", lambda _: {"role": "user", "active": False}
    )
    assert client.get("/api/v1/auth/me").status_code == 403
    assert client.get("/api/v1/billing/me").status_code == 403
    assert client.get("/api/v1/personas").status_code == 403


@pytest.mark.parametrize("status", ["expired", "unsubscribed"])
def test_expired_or_missing_package_blocks_writes(status, monkeypatch):
    monkeypatch.setattr(dependencies, "subscription_for", lambda _: {"status": status})
    with pytest.raises(HTTPException) as error:
        dependencies.require_subscription(
            Request({"type": "http", "method": "POST"}), SimpleNamespace(id="owner")
        )
    assert error.value.status_code == 403
    # Existing work may still be read or removed.
    for method in ("GET", "DELETE"):
        assert (
            dependencies.require_subscription(
                Request({"type": "http", "method": method}), SimpleNamespace(id="owner")
            ).id
            == "owner"
        )


@pytest.mark.parametrize(
    "changes",
    [
        {"persona_limit": 0},
        {"persona_limit": 1.5},
        {"monthly_price": "-1"},
        {"monthly_price": "1.001"},
        {"currency": "usd"},
        {"name": "  "},
    ],
)
def test_invalid_package_rejected(changes):
    with pytest.raises(ValidationError):
        PackageInput.model_validate(
            {"name": "Starter", "persona_limit": 2, "monthly_price": "9.99", **changes}
        )


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


def package():
    return {
        "id": uuid4(),
        "name": "Starter",
        "persona_limit": 2,
        "monthly_price": "9.99",
        "currency": "USD",
    }


def test_downgrade_below_existing_personas_rejected(monkeypatch):
    plan = package()
    cursor = fake_database(monkeypatch, service, [plan, {"count": 3}])
    with pytest.raises(HTTPException) as error:
        service.subscribe(str(uuid4()), plan["id"])
    assert error.value.status_code == 409
    assert not any("INSERT INTO" in query for query, _ in cursor.queries)


def test_unavailable_package_rejected(monkeypatch):
    fake_database(monkeypatch, service, [None])
    with pytest.raises(HTTPException) as error:
        service.subscribe(str(uuid4()), uuid4())
    assert error.value.status_code == 404


def test_active_same_package_does_not_reset_expiry(monkeypatch):
    plan = package()
    cursor = fake_database(
        monkeypatch,
        service,
        [plan, {"count": 1}, {"package_id": plan["id"]}, {"active": True}],
    )
    with pytest.raises(HTTPException) as error:
        service.subscribe(str(uuid4()), plan["id"])
    assert error.value.status_code == 409
    assert not any("INSERT INTO" in query for query, _ in cursor.queries)


@pytest.mark.parametrize("current", [None, {"package_id": "old-plan"}])
def test_new_subscription_and_upgrade_snapshot_terms(monkeypatch, current):
    plan = package()
    result = {**plan, "expires_at": datetime.now(timezone.utc) + timedelta(days=30)}
    cursor = fake_database(monkeypatch, service, [plan, {"count": 1}, current, result])
    assert service.subscribe(str(uuid4()), plan["id"]) == result
    assert "pg_advisory_xact_lock" in cursor.queries[0][0]
    assert "INTERVAL '1 month'" in cursor.queries[-1][0]
    assert cursor.queries[-1][1][2:] == ("Starter", 2, "9.99", "USD")


def test_expired_package_can_be_renewed(monkeypatch):
    plan = package()
    fake_database(
        monkeypatch,
        service,
        [
            plan,
            {"count": 1},
            {"package_id": plan["id"]},
            {"active": False},
            {"renewed": True},
        ],
    )
    assert service.subscribe(str(uuid4()), plan["id"]) == {"renewed": True}


def test_paid_packages_cannot_be_activated_without_checkout(monkeypatch):
    fake_database(monkeypatch, router, [{"monthly_price": Decimal("9.99")}])
    with pytest.raises(HTTPException) as error:
        router.select_package(
            SubscribeInput(package_id=uuid4()),
            user=SimpleNamespace(id=str(uuid4())),
        )
    assert error.value.status_code == 402


def test_verified_checkout_event_fulfills_once(monkeypatch):
    order = {
        "stripe_session_id": "cs_test_1",
        "user_id": str(uuid4()),
        "package_id": str(uuid4()),
        "package_name": "Professional",
        "persona_limit": 5,
        "monthly_price": Decimal("9.99"),
        "amount_total": 999,
        "currency": "usd",
        "status": "pending",
    }
    cursor = fake_database(
        monkeypatch,
        service,
        [{"stripe_event_id": "evt_1"}, order],
    )
    result = service.fulfill_checkout_event(
        event_id="evt_1",
        event_type="checkout.session.completed",
        session_id="cs_test_1",
        payment_status="paid",
        amount_total=999,
        currency="usd",
        payment_intent="pi_1",
    )
    assert result == {"status": "fulfilled"}
    assert any("INSERT INTO user_subscriptions" in query for query, _ in cursor.queries)
    assert any("fulfilled_at=NOW()" in query for query, _ in cursor.queries)


def test_checkout_event_does_not_fulfill_unpaid_session(monkeypatch):
    order = {
        "stripe_session_id": "cs_test_1",
        "amount_total": 999,
        "currency": "usd",
        "status": "pending",
    }
    cursor = fake_database(monkeypatch, service, [{"stripe_event_id": "evt_2"}, order])
    result = service.fulfill_checkout_event(
        event_id="evt_2",
        event_type="checkout.session.completed",
        session_id="cs_test_1",
        payment_status="unpaid",
        amount_total=999,
        currency="usd",
    )
    assert result == {"status": "pending"}
    assert not any("INSERT INTO user_subscriptions" in query for query, _ in cursor.queries)


def test_super_admin_cannot_be_deactivated(client, monkeypatch):
    monkeypatch.setattr(
        service, "access_for", lambda _: {"role": "super_admin", "active": True}
    )
    fake_database(monkeypatch, router, [{"id": uuid4()}, {"role": "super_admin"}])
    assert (
        client.patch(
            f"/api/v1/admin/users/{uuid4()}/status", json={"active": False}
        ).status_code
        == 403
    )


def test_package_delete_preserves_subscriptions(client, monkeypatch):
    monkeypatch.setattr(
        service, "access_for", lambda _: {"role": "super_admin", "active": True}
    )
    cursor = fake_database(monkeypatch, router, [{"id": uuid4()}])
    assert client.delete(f"/api/v1/admin/packages/{uuid4()}").status_code == 200
    assert "available=FALSE" in cursor.queries[0][0]
    assert "DELETE FROM" not in cursor.queries[0][0]


def test_public_catalog_available_without_authentication(client, monkeypatch):
    client.cookies.clear()
    plan = {**package(), "description": "A public package"}
    cursor = fake_database(monkeypatch, router, [])
    cursor.fetchall = lambda: [plan]
    response = client.get("/api/v1/public/packages")
    assert response.status_code == 200
    assert response.json()[0]["name"] == "Starter"
    query = cursor.queries[0][0]
    assert "WHERE available" in query
    assert "user_id" not in query and "user_subscriptions" not in query


def test_access_lookup_shared_within_request_and_fresh_on_next_request(client, monkeypatch):
    calls = []

    def lookup(user_id):
        calls.append(user_id)
        return {"role": "user", "active": True}

    monkeypatch.setattr(service, "access_for", lookup)
    monkeypatch.setattr(router, "subscription_for", lambda _: {"status": "active"})
    assert client.get("/api/v1/billing/me").status_code == 200
    assert len(calls) == 1
    assert client.get("/api/v1/billing/me").status_code == 200
    assert len(calls) == 2
