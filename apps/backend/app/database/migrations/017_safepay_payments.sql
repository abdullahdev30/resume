-- Keep historical Stripe payment records intact, but take Stripe out of the active schema.
ALTER TABLE stripe_checkout_orders RENAME TO legacy_stripe_checkout_orders;
ALTER TABLE stripe_webhook_events RENAME TO legacy_stripe_webhook_events;
ALTER TABLE subscription_packages DROP COLUMN stripe_price_id;
ALTER TABLE user_subscriptions RENAME COLUMN source_checkout_session TO source_legacy_checkout_session;
ALTER TABLE user_subscriptions ADD COLUMN source_payment_order UUID;
ALTER TABLE subscription_packages
    ADD COLUMN yearly_price NUMERIC(12,2) CHECK (yearly_price IS NULL OR yearly_price >= 0);
ALTER TABLE user_subscriptions
    ADD COLUMN billing_interval TEXT NOT NULL DEFAULT 'monthly'
        CHECK (billing_interval IN ('monthly','yearly')),
    ADD COLUMN current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN next_billing_at TIMESTAMPTZ,
    ADD COLUMN renewal_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN cancellation_at TIMESTAMPTZ;
UPDATE user_subscriptions SET current_period_start=starts_at, next_billing_at=expires_at;

CREATE TABLE payment_orders (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES subscription_packages(id),
    package_name TEXT NOT NULL,
    persona_limit INTEGER NOT NULL,
    plan_price NUMERIC(12,2) NOT NULL,
    billing_interval TEXT NOT NULL CHECK (billing_interval IN ('monthly','yearly')),
    amount_total BIGINT NOT NULL CHECK (amount_total > 0),
    currency VARCHAR(3) NOT NULL,
    provider TEXT NOT NULL CHECK (provider = 'safepay'),
    tracker_token TEXT UNIQUE,
    idempotency_key UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX payment_orders_user_idempotency_idx ON payment_orders(user_id,idempotency_key);
CREATE INDEX payment_orders_user_idx ON payment_orders(user_id, created_at DESC);

CREATE TABLE payment_webhook_events (
    event_id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_subscriptions
    ADD CONSTRAINT user_subscriptions_source_payment_order_fk
    FOREIGN KEY (source_payment_order) REFERENCES payment_orders(id);
