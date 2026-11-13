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
            cursor.execute("SET statement_timeout = '8s'")
            yield cursor
    except (psycopg.Error, RuntimeError) as exc:
        logger.exception("Billing database operation failed")
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
        cursor.execute(
            """SELECT count(*) AS count FROM resumes WHERE user_id=%s
            AND (is_ai_generated IS TRUE OR resume_type='ai')
            AND created_at >= COALESCE((SELECT current_period_start FROM user_subscriptions WHERE user_id=%s), NOW())""",
            (user_id, user_id),
        )
        ai_resume_count = cursor.fetchone()["count"]
    return {
        "subscription": subscription,
        "persona_count": count,
        "ai_resume_count": ai_resume_count,
        "status": "unsubscribed"
        if subscription is None
        else "expired"
        if subscription["expired"]
        else "active",
    }


def subscription_history_for(user_id):
    with database() as cursor:
        cursor.execute(
            """SELECT id,package_name,persona_limit,ai_resume_limit,billing_interval,
            amount,currency,status,starts_at,expires_at,created_at,
            CASE WHEN status='active' AND expires_at <= NOW() THEN 'expired' ELSE status END AS current_status
            FROM user_subscription_history WHERE user_id=%s
            ORDER BY starts_at DESC, created_at DESC""",
            (user_id,),
        )
        return cursor.fetchall()


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
            (user_id, package_id, package_name, persona_limit, ai_resume_limit, monthly_price, currency, starts_at, expires_at,
             billing_interval,current_period_start,next_billing_at,renewal_enabled)
            VALUES (%s,%s,%s,%s,%s,%s,%s,NOW(),NOW() + INTERVAL '1 month','monthly',NOW(),NOW() + INTERVAL '1 month',FALSE)
            ON CONFLICT (user_id) DO UPDATE SET package_id=EXCLUDED.package_id,
            package_name=EXCLUDED.package_name, persona_limit=EXCLUDED.persona_limit,
            ai_resume_limit=EXCLUDED.ai_resume_limit,
            monthly_price=EXCLUDED.monthly_price, currency=EXCLUDED.currency,
            starts_at=EXCLUDED.starts_at, expires_at=EXCLUDED.expires_at,
            billing_interval='monthly',current_period_start=EXCLUDED.current_period_start,
            next_billing_at=EXCLUDED.next_billing_at,renewal_enabled=FALSE,cancellation_at=NULL RETURNING *""",
            (
                user_id,
                package["id"],
                package["name"],
                package["persona_limit"],
                package["ai_resume_limit"],
                package["monthly_price"],
                package["currency"],
            ),
        )
        subscription = cursor.fetchone()
        cursor.execute(
            """UPDATE user_subscription_history SET status=CASE
                WHEN expires_at <= %s THEN 'expired' ELSE 'replaced' END
            WHERE user_id=%s AND status='active'""",
            (subscription["starts_at"], user_id),
        )
        cursor.execute(
            """INSERT INTO user_subscription_history
            (user_id,package_id,package_name,persona_limit,ai_resume_limit,billing_interval,
             amount,currency,status,starts_at,expires_at,created_at)
            VALUES (%s,%s,%s,%s,%s,'monthly',%s,%s,'active',%s,%s,NOW())""",
            (user_id,package["id"],package["name"],package["persona_limit"],
             package["ai_resume_limit"],package["monthly_price"],package["currency"],
             subscription["starts_at"],subscription["expires_at"]),
        )
        return subscription


def fulfill_safepay_payment(*, event_id, event_type, tracker_token, amount, currency, order_id=None):
    """Apply a signed Safepay payment event once, after validating its order terms."""
    if not event_id or not tracker_token:
        raise HTTPException(400, "Webhook is missing its event or tracker identifier.")
    with database() as cursor:
        cursor.execute(
            "INSERT INTO payment_webhook_events(event_id,event_type) VALUES (%s,%s) ON CONFLICT DO NOTHING RETURNING event_id",
            (event_id, event_type),
        )
        if not cursor.fetchone():
            return {"status": "duplicate"}
        cursor.execute("SELECT * FROM payment_orders WHERE tracker_token=%s FOR UPDATE", (tracker_token,))
        order = cursor.fetchone()
        if not order:
            raise HTTPException(404, "Safepay tracker is not associated with an order.")
        if order_id and str(order["id"]) != str(order_id):
            raise HTTPException(400, "Safepay order metadata does not match its tracker.")
        if amount != order["amount_total"] or (currency or "").lower() != order["currency"].lower():
            logger.error("Safepay amount/currency mismatch for order %s", order["id"])
            raise HTTPException(400, "Safepay payment amount or currency does not match its order.")
        if event_type == "payment.failed":
            cursor.execute("UPDATE payment_orders SET status='failed',updated_at=NOW() WHERE id=%s AND status='pending'", (order["id"],))
            return {"status": "failed"}
        if order["status"] == "paid":
            return {"status": "paid"}
        cursor.execute(
            """INSERT INTO user_subscriptions
            (user_id,package_id,package_name,persona_limit,ai_resume_limit,monthly_price,currency,starts_at,expires_at,
             source_payment_order,billing_interval,current_period_start,next_billing_at,renewal_enabled)
            VALUES (%s,%s,%s,%s,%s,%s,%s,NOW(),NOW()+CASE WHEN %s='yearly' THEN INTERVAL '12 months' ELSE INTERVAL '1 month' END,
             %s,%s,NOW(),NOW()+CASE WHEN %s='yearly' THEN INTERVAL '12 months' ELSE INTERVAL '1 month' END,FALSE)
            ON CONFLICT(user_id) DO UPDATE SET package_id=EXCLUDED.package_id,
            package_name=EXCLUDED.package_name,persona_limit=EXCLUDED.persona_limit,
            ai_resume_limit=EXCLUDED.ai_resume_limit,
            monthly_price=EXCLUDED.monthly_price,currency=EXCLUDED.currency,
            starts_at=CASE WHEN user_subscriptions.package_id=EXCLUDED.package_id
                AND user_subscriptions.billing_interval=EXCLUDED.billing_interval
                AND user_subscriptions.expires_at>NOW()
                THEN user_subscriptions.expires_at ELSE NOW() END,
            current_period_start=CASE WHEN user_subscriptions.package_id=EXCLUDED.package_id
                AND user_subscriptions.billing_interval=EXCLUDED.billing_interval
                AND user_subscriptions.expires_at>NOW()
                THEN user_subscriptions.expires_at ELSE NOW() END,
            expires_at=(CASE WHEN user_subscriptions.package_id=EXCLUDED.package_id
                AND user_subscriptions.billing_interval=EXCLUDED.billing_interval
                AND user_subscriptions.expires_at>NOW()
                THEN user_subscriptions.expires_at ELSE NOW() END)
                + CASE WHEN EXCLUDED.billing_interval='yearly' THEN INTERVAL '12 months' ELSE INTERVAL '1 month' END,
            next_billing_at=(CASE WHEN user_subscriptions.package_id=EXCLUDED.package_id
                AND user_subscriptions.billing_interval=EXCLUDED.billing_interval
                AND user_subscriptions.expires_at>NOW()
                THEN user_subscriptions.expires_at ELSE NOW() END)
                + CASE WHEN EXCLUDED.billing_interval='yearly' THEN INTERVAL '12 months' ELSE INTERVAL '1 month' END,
            source_payment_order=EXCLUDED.source_payment_order,
            billing_interval=EXCLUDED.billing_interval,
            renewal_enabled=FALSE,cancellation_at=NULL
            RETURNING starts_at,expires_at""",
            (order["user_id"],order["package_id"],order["package_name"],order["persona_limit"],order["ai_resume_limit"],
             order["plan_price"],order["currency"],order["billing_interval"],order["id"],
             order["billing_interval"],order["billing_interval"]),
        )
        subscription_period = cursor.fetchone()
        cursor.execute(
            """UPDATE user_subscription_history SET status=CASE
                WHEN expires_at <= %s THEN 'expired' ELSE 'replaced' END
            WHERE user_id=%s AND status='active'""",
            (subscription_period["starts_at"], order["user_id"]),
        )
        cursor.execute(
            """INSERT INTO user_subscription_history
            (user_id,package_id,package_name,persona_limit,ai_resume_limit,billing_interval,
             amount,currency,status,starts_at,expires_at,payment_order_id,created_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,'active',%s,%s,%s,NOW())""",
            (order["user_id"],order["package_id"],order["package_name"],
             order["persona_limit"],order["ai_resume_limit"],order["billing_interval"],
             order["plan_price"],order["currency"],subscription_period["starts_at"],
             subscription_period["expires_at"],order["id"]),
        )
        cursor.execute("UPDATE payment_orders SET status='paid',updated_at=NOW() WHERE id=%s", (order["id"],))
        return {"status": "paid"}
