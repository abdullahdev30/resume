ALTER TABLE subscription_packages
    ADD COLUMN stripe_price_id TEXT;
CREATE UNIQUE INDEX subscription_packages_stripe_price_id_unique
    ON subscription_packages(stripe_price_id)
    WHERE stripe_price_id IS NOT NULL;

CREATE TABLE stripe_checkout_orders (
    stripe_session_id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES subscription_packages(id),
    package_name TEXT NOT NULL,
    persona_limit INTEGER NOT NULL,
    monthly_price NUMERIC(12,2) NOT NULL,
    amount_total BIGINT NOT NULL CHECK (amount_total >= 0),
    currency VARCHAR(3) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'paid', 'failed')),
    payment_intent_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fulfilled_at TIMESTAMPTZ
);
CREATE INDEX stripe_checkout_orders_payment_intent_idx
    ON stripe_checkout_orders(payment_intent_id);

CREATE TABLE stripe_webhook_events (
    stripe_event_id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_subscriptions
    ADD COLUMN source_checkout_session TEXT;
