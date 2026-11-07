"""Stripe Checkout and verified, idempotent one-month package fulfillment."""

import logging
import secrets
import string
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from stripe import SignatureVerificationError, StripeClient, StripeError, Webhook

from app.core.config import settings
from app.modules.billing.dependencies import require_account
from app.modules.billing.service import database, fulfill_checkout_event

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Checkout"])
ACCOUNT = Depends(require_account)


class CheckoutRequest(BaseModel):
    package_id: str


@router.post("/billing/create-checkout-session")
def create_checkout_session(payload: CheckoutRequest, user=ACCOUNT):
    if not settings.stripe_secret_key:
        raise HTTPException(503, "Stripe is not configured on the server.")
    with database() as cursor:
        cursor.execute(
            "SELECT * FROM subscription_packages WHERE id=%s AND available",
            (payload.package_id,),
        )
        package = cursor.fetchone()
        if not package:
            raise HTTPException(404, "This package is no longer available.")
        if Decimal(package["monthly_price"]) <= 0:
            raise HTTPException(400, "Free packages do not require checkout.")
        if not package.get("stripe_price_id"):
            raise HTTPException(503, "This package is not connected to a Stripe Price yet.")
        cursor.execute("SELECT count(*) AS count FROM personas WHERE user_id=%s", (user.id,))
        persona_count = cursor.fetchone()["count"]
        if persona_count > package["persona_limit"]:
            raise HTTPException(409, "Remove personas before choosing this package.")

    client = StripeClient(settings.stripe_secret_key, stripe_version="2026-10-28.endive")
    try:
        price = client.v1.prices.retrieve(package["stripe_price_id"])
        expected_amount = int(Decimal(package["monthly_price"]) * 100)
        if (
            not price.active
            or price.recurring is not None
            or price.currency.lower() != package["currency"].lower()
            or price.unit_amount != expected_amount
        ):
            raise HTTPException(
                409,
                "The Stripe Price must be active, one-time, and match the package amount and currency.",
            )
        suffix = "".join(secrets.choice(string.ascii_letters) for _ in range(8))
        params = {
            "ui_mode": "form",
            "mode": "payment",
            "return_url": f"{settings.frontend_url.rstrip('/')}/packages?checkout=complete",
            "billing_address_collection": "auto",
            "automatic_tax": {"enabled": False},
            "integration_identifier": f"resume_package_checkout_{suffix}",
            "line_items": [{"price": package["stripe_price_id"], "quantity": 1}],
            "submit_type": "auto",
        }
        if user.email:
            params["customer_email"] = user.email
        session = client.v1.checkout.sessions.create(params)
    except HTTPException:
        raise
    except StripeError as exc:
        logger.warning("Stripe Checkout session creation failed: %s", exc)
        raise HTTPException(502, "Unable to start checkout. Please retry.") from exc

    if not session.client_secret:
        raise HTTPException(502, "Stripe did not return a checkout client secret.")
    with database() as cursor:
        cursor.execute(
            """INSERT INTO stripe_checkout_orders
            (stripe_session_id, user_id, package_id, package_name, persona_limit,
             monthly_price, amount_total, currency)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
            (
                session.id,
                user.id,
                package["id"],
                package["name"],
                package["persona_limit"],
                package["monthly_price"],
                expected_amount,
                package["currency"].lower(),
            ),
        )
    return {"client_secret": session.client_secret}


@router.post("/webhooks/stripe")
async def stripe_webhook(request: Request):
    if not settings.stripe_webhook_secret:
        raise HTTPException(503, "Stripe webhook verification is not configured.")
    signature = request.headers.get("stripe-signature")
    if not signature:
        raise HTTPException(400, "Missing Stripe signature.")
    body = await request.body()
    try:
        event = Webhook.construct_event(body, signature, settings.stripe_webhook_secret)
    except (ValueError, SignatureVerificationError) as exc:
        raise HTTPException(400, "Invalid Stripe webhook signature.") from exc

    if event.type in {
        "checkout.session.completed",
        "checkout.session.async_payment_succeeded",
        "checkout.session.async_payment_failed",
    }:
        session = event.data.object
        fulfill_checkout_event(
            event_id=event.id,
            event_type=event.type,
            session_id=session.id,
            payment_status=session.payment_status,
            amount_total=session.amount_total,
            currency=session.currency,
            payment_intent=session.payment_intent,
        )
    elif event.type in {
        "charge.refunded",
        "charge.dispute.created",
        "radar.early_fraud_warning.created",
    }:
        payment_intent = event.data.object.payment_intent
        if payment_intent:
            fulfill_checkout_event(
                event_id=event.id,
                event_type=event.type,
                payment_intent_id=payment_intent,
                fully_refunded=getattr(event.data.object, "refunded", False),
            )
    else:
        logger.info("Ignoring unhandled Stripe event %s (%s)", event.id, event.type)
    return {"received": True}
