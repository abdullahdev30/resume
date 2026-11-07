import logging
from contextlib import contextmanager

import psycopg
from fastapi import HTTPException
from psycopg.rows import dict_row

from app.database.connection import get_connection

logger = logging.getLogger(__name__)


@contextmanager
def database():
    try:
        with get_connection() as conn, conn.cursor(row_factory=dict_row) as cursor:
            yield cursor
    except (psycopg.Error, RuntimeError) as exc:
        raise HTTPException(
            503, "Account services are temporarily unavailable."
        ) from exc


def access_for(user_id):
    with database() as cursor:
        cursor.execute(
            "SELECT role, active FROM account_access WHERE user_id = %s", (user_id,)
        )
        return cursor.fetchone() or {"role": "user", "active": True}


def subscription_for(user_id):
    with database() as cursor:
        cursor.execute(
            "SELECT *, expires_at <= NOW() AS expired FROM user_subscriptions WHERE user_id = %s",
            (user_id,),
        )
        subscription = cursor.fetchone()
        cursor.execute(
            "SELECT count(*) AS count FROM personas WHERE user_id = %s", (user_id,)
        )
        count = cursor.fetchone()["count"]
    return {
        "subscription": subscription,
        "persona_count": count,
        "status": "unsubscribed"
        if subscription is None
        else "expired"
        if subscription["expired"]
        else "active",
    }


def subscribe(user_id, package_id):
    with database() as cursor:
        cursor.execute(
            "SELECT pg_advisory_xact_lock(hashtextextended(%s, 0))", (str(user_id),)
        )
        cursor.execute(
            "SELECT * FROM subscription_packages WHERE id = %s AND available FOR SHARE",
            (package_id,),
        )
        package = cursor.fetchone()
        if not package:
            raise HTTPException(404, "This package is no longer available.")
        cursor.execute(
            "SELECT count(*) AS count FROM personas WHERE user_id = %s", (user_id,)
        )
        if cursor.fetchone()["count"] > package["persona_limit"]:
            raise HTTPException(
                409, "Remove personas before choosing a smaller package."
            )
        cursor.execute(
            "SELECT * FROM user_subscriptions WHERE user_id = %s", (user_id,)
        )
        current = cursor.fetchone()
        if current and str(current["package_id"]) == str(package_id):
            cursor.execute(
                "SELECT expires_at > NOW() AS active FROM user_subscriptions WHERE user_id = %s",
                (user_id,),
            )
            if cursor.fetchone()["active"]:
                raise HTTPException(
                    409, "You already have this active package. Renew after it expires."
                )
        cursor.execute(
            """INSERT INTO user_subscriptions
            (user_id, package_id, package_name, persona_limit, monthly_price, currency, starts_at, expires_at)
            VALUES (%s,%s,%s,%s,%s,%s,NOW(),NOW() + INTERVAL '1 month')
            ON CONFLICT (user_id) DO UPDATE SET package_id=EXCLUDED.package_id,
            package_name=EXCLUDED.package_name, persona_limit=EXCLUDED.persona_limit,
            monthly_price=EXCLUDED.monthly_price, currency=EXCLUDED.currency,
            starts_at=EXCLUDED.starts_at, expires_at=EXCLUDED.expires_at RETURNING *""",
            (
                user_id,
                package["id"],
                package["name"],
                package["persona_limit"],
                package["monthly_price"],
                package["currency"],
            ),
        )
        return cursor.fetchone()


def fulfill_checkout_event(
    *,
    event_id,
    event_type,
    session_id=None,
    payment_status=None,
    amount_total=None,
    currency=None,
    payment_intent=None,
    payment_intent_id=None,
    fully_refunded=False,
):
    """Fulfill paid package orders exactly once from verified Stripe webhooks."""
    payment_intent_id = payment_intent_id or payment_intent
    if hasattr(payment_intent_id, "id"):
        payment_intent_id = payment_intent_id.id
    with database() as cursor:
        cursor.execute(
            """INSERT INTO stripe_webhook_events(stripe_event_id, event_type)
            VALUES (%s,%s) ON CONFLICT DO NOTHING RETURNING stripe_event_id""",
            (event_id, event_type),
        )
        if not cursor.fetchone():
            return {"status": "duplicate"}

        if session_id:
            cursor.execute(
                """SELECT * FROM stripe_checkout_orders
                WHERE stripe_session_id=%s FOR UPDATE""",
                (session_id,),
            )
            order = cursor.fetchone()
            if not order:
                raise HTTPException(404, "Checkout order is not registered yet.")
            if event_type == "checkout.session.async_payment_failed":
                cursor.execute(
                    "UPDATE stripe_checkout_orders SET status='failed' WHERE stripe_session_id=%s AND status='pending'",
                    (session_id,),
                )
                return {"status": "failed"}
            if payment_status != "paid":
                return {"status": "pending"}
            if (
                amount_total != order["amount_total"]
                or (currency or "").lower() != order["currency"].lower()
            ):
                logger.error("Stripe checkout amount/currency mismatch for session %s", session_id)
                cursor.execute(
                    "UPDATE stripe_checkout_orders SET status='failed' WHERE stripe_session_id=%s",
                    (session_id,),
                )
                return {"status": "mismatch"}
            if order["status"] == "paid":
                return {"status": "fulfilled"}

            cursor.execute(
                "SELECT pg_advisory_xact_lock(hashtextextended(%s, 0))",
                (str(order["user_id"]),),
            )
            cursor.execute(
                """INSERT INTO user_subscriptions
                (user_id, package_id, package_name, persona_limit, monthly_price,
                 currency, starts_at, expires_at, source_checkout_session)
                VALUES (%s,%s,%s,%s,%s,%s,NOW(),NOW() + INTERVAL '1 month',%s)
                ON CONFLICT (user_id) DO UPDATE SET
                    package_id=EXCLUDED.package_id,
                    package_name=EXCLUDED.package_name,
                    persona_limit=EXCLUDED.persona_limit,
                    monthly_price=EXCLUDED.monthly_price,
                    currency=EXCLUDED.currency,
                    starts_at=EXCLUDED.starts_at,
                    expires_at=EXCLUDED.expires_at,
                    source_checkout_session=EXCLUDED.source_checkout_session""",
                (
                    order["user_id"], order["package_id"], order["package_name"],
                    order["persona_limit"], order["monthly_price"], order["currency"],
                    session_id,
                ),
            )
            cursor.execute(
                """UPDATE stripe_checkout_orders SET status='paid', payment_intent_id=%s,
                fulfilled_at=NOW() WHERE stripe_session_id=%s""",
                (payment_intent_id, session_id),
            )
            return {"status": "fulfilled"}

        if payment_intent_id:
            cursor.execute(
                """SELECT * FROM stripe_checkout_orders
                WHERE payment_intent_id=%s FOR UPDATE""",
                (payment_intent_id,),
            )
            order = cursor.fetchone()
            if not order:
                raise HTTPException(404, "Stripe payment is not associated with an order.")
            if event_type == "charge.refunded" and not fully_refunded:
                return {"status": "partial_refund"}
            cursor.execute(
                "UPDATE stripe_checkout_orders SET status='failed' WHERE stripe_session_id=%s",
                (order["stripe_session_id"],),
            )
            cursor.execute(
                """UPDATE user_subscriptions SET expires_at=NOW()
                WHERE user_id=%s AND source_checkout_session=%s""",
                (order["user_id"], order["stripe_session_id"]),
            )
            logger.warning("Suspended package access after Stripe risk event %s", event_type)
            return {"status": "suspended"}
        return {"status": "ignored"}
