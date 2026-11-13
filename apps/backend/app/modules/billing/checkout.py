"""Safepay order initialization and signed webhook processing."""

import hashlib
import hmac
import json
import logging
import uuid
from decimal import Decimal, InvalidOperation
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from app.core.config import settings
from app.modules.billing.dependencies import require_account
from app.modules.billing.service import database, fulfill_safepay_payment

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Payments"])
ACCOUNT = Depends(require_account)


class CheckoutRequest(BaseModel):
    package_id: str
    billing_interval: Literal["monthly", "yearly"] = "monthly"
    idempotency_key: uuid.UUID


class TrackerRequest(BaseModel):
    order_id: uuid.UUID
    tracker_token: str


class OrderFailureRequest(BaseModel):
    order_id: uuid.UUID


@router.post("/billing/payment/init")
def initialize_payment(payload: CheckoutRequest, user=ACCOUNT):
    if not settings.safepay_public_key or not settings.safepay_secret_key:
        raise HTTPException(503, "Safepay is not configured on the server.")
    with database() as cursor:
        cursor.execute("SELECT pg_advisory_xact_lock(hashtextextended(%s,0))", (f"{user.id}:{payload.idempotency_key}",))
        cursor.execute(
            "SELECT id,package_id,billing_interval,amount_total,currency,tracker_token,status FROM payment_orders WHERE user_id=%s AND idempotency_key=%s",
            (user.id, payload.idempotency_key),
        )
        existing = cursor.fetchone()
        if existing:
            if str(existing["package_id"]) != payload.package_id or existing["billing_interval"] != payload.billing_interval:
                raise HTTPException(409, "This idempotency key was already used for a different selection.")
            if existing["status"] != "pending":
                raise HTTPException(409, "This checkout attempt has already finished. Start a new attempt.")
            return {"order_id": str(existing["id"]), "amount": existing["amount_total"], "currency": existing["currency"].upper(), "tracker_token": existing["tracker_token"]}
        cursor.execute(
            "SELECT * FROM subscription_packages WHERE id=%s AND available",
            (payload.package_id,),
        )
        package = cursor.fetchone()
        if not package:
            raise HTTPException(404, "This package is no longer available.")
        price = package["yearly_price"] if payload.billing_interval == "yearly" else package["monthly_price"]
        if price is None:
            raise HTTPException(400, "Yearly billing is not configured for this package.")
        if Decimal(price) <= 0:
            raise HTTPException(400, "Free packages do not require checkout.")
        cursor.execute("SELECT count(*) AS count FROM personas WHERE user_id=%s", (user.id,))
        if cursor.fetchone()["count"] > package["persona_limit"]:
            raise HTTPException(409, "Remove personas before choosing this package.")
        order_id = uuid.uuid4()
        amount = int(Decimal(price) * 100)
        cursor.execute(
            """INSERT INTO payment_orders
            (id,user_id,package_id,package_name,persona_limit,ai_resume_limit,plan_price,billing_interval,amount_total,currency,provider,status,idempotency_key)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'safepay','pending',%s)""",
            (order_id, user.id, package["id"], package["name"], package["persona_limit"],
             package["ai_resume_limit"], price, payload.billing_interval, amount, package["currency"].lower(), payload.idempotency_key),
        )
    return {
        "order_id": str(order_id), "amount": amount,
        "currency": package["currency"].upper(), "tracker_token": None,
    }


@router.post("/billing/payment/tracker")
def attach_tracker(payload: TrackerRequest, user=ACCOUNT):
    with database() as cursor:
        cursor.execute(
            "UPDATE payment_orders SET tracker_token=%s, updated_at=NOW() WHERE id=%s AND user_id=%s AND status='pending' RETURNING id",
            (payload.tracker_token, payload.order_id, user.id),
        )
        if not cursor.fetchone():
            raise HTTPException(404, "Payment order not found.")
    return {"ok": True}


@router.post("/billing/payment/fail")
def fail_payment_order(payload: OrderFailureRequest, user=ACCOUNT):
    with database() as cursor:
        cursor.execute(
            "UPDATE payment_orders SET status='failed', updated_at=NOW() WHERE id=%s AND user_id=%s AND status='pending'",
            (payload.order_id, user.id),
        )
    return {"ok": True}


@router.get("/billing/payment/status")
def payment_status(order_id: uuid.UUID, user=ACCOUNT):
    with database() as cursor:
        cursor.execute(
            "SELECT id,status,package_id,billing_interval FROM payment_orders WHERE id=%s AND user_id=%s",
            (order_id, user.id),
        )
        order = cursor.fetchone()
    if not order:
        raise HTTPException(404, "Payment order not found.")
    return order


@router.post("/webhooks/safepay")
async def safepay_webhook(request: Request):
    secret = settings.safepay_webhook_secret
    if not secret:
        raise HTTPException(503, "Safepay webhook verification is not configured.")
    signature = request.headers.get("x-sfpy-signature")
    if not signature:
        raise HTTPException(400, "Missing Safepay signature.")
    body = await request.body()
    try:
        event = json.loads(body)
    except (ValueError, TypeError) as exc:
        raise HTTPException(400, "Invalid webhook payload.") from exc
    if not isinstance(event, dict):
        raise HTTPException(400, "Webhook payload must be a JSON object.")
    data = event.get("data")
    if not isinstance(data, dict):
        raise HTTPException(400, "Webhook payment data must be an object.")

    # Safepay's API webhook guide signs the delivered JSON payload. The official
    # WooCommerce integration also documents signing the compact `data` object.
    # Accept either documented form while comparing signatures in constant time.
    signed_values = [body]
    data_json = json.dumps(data, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    signed_values.append(data_json)
    if not any(
        hmac.compare_digest(hmac.new(secret.encode(), value, hashlib.sha512).hexdigest(), signature)
        for value in signed_values
    ):
        raise HTTPException(400, "Invalid Safepay webhook signature.")

    # The tracker checkout flow emits payment:created with a nested notification;
    # Safepay's generic API client documents payment.succeeded/payment.failed.
    event_type = data.get("type") or event.get("type")
    if event_type not in {"payment:created", "payment.succeeded", "payment.failed"}:
        logger.info("Ignoring unhandled Safepay event type %s", event_type)
        return {"received": True}

    notification = data.get("notification") if event_type == "payment:created" else data
    if not isinstance(notification, dict):
        raise HTTPException(400, "Webhook notification must be an object.")
    tracker_token = notification.get("tracker") or notification.get("tracker_token")
    if not tracker_token:
        raise HTTPException(400, "Webhook is missing the payment tracker reference.")
    amount = notification.get("amount")
    currency = notification.get("currency")
    metadata = notification.get("metadata") or {}
    order_id = metadata.get("order_id") if isinstance(metadata, dict) else None
    payment_state = notification.get("state")
    if event_type == "payment:created" and payment_state != "PAID":
        logger.info("Safepay payment tracker %s is not in the documented PAID state", tracker_token)
        return {"received": True}
    if amount is None or not currency:
        raise HTTPException(400, "Safepay payment event is missing amount or currency.")
    if event_type == "payment:created":
        try:
            amount = Decimal(str(amount)) * 100
            if amount != amount.to_integral_value():
                raise InvalidOperation
            amount = int(amount)
        except (InvalidOperation, ValueError):
            raise HTTPException(400, "Safepay payment amount is invalid.") from None
    else:
        try:
            amount = int(amount) if amount is not None else None
        except (TypeError, ValueError):
            raise HTTPException(400, "Safepay payment amount is invalid.") from None
    event_id = request.headers.get("x-sfpy-event-id") or event.get("id") or hashlib.sha256(
        (str(event_type) + ":" + signature).encode("utf-8")
    ).hexdigest()
    fulfill_safepay_payment(
        event_id=event_id,
        event_type=event_type,
        tracker_token=tracker_token,
        amount=amount,
        currency=currency,
        order_id=order_id,
    )
    return {"received": True}
