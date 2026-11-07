"""Existing API suites use fake identity/storage; keep their account lookup isolated too.

Billing tests replace these functions with the access/expiry cases under test.
"""

import pytest


@pytest.fixture(autouse=True)
def isolated_memberships(monkeypatch):
    monkeypatch.setattr(
        "app.modules.billing.service.access_for",
        lambda _: {"role": "user", "active": True},
    )
    monkeypatch.setattr(
        "app.modules.billing.dependencies.access_for",
        lambda _: {"role": "user", "active": True},
    )
    monkeypatch.setattr(
        "app.modules.billing.dependencies.subscription_for",
        lambda _: {"status": "active"},
    )
