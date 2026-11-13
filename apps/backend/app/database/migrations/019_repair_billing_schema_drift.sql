-- Repair installations where earlier billing versions were marked applied
-- while some of their columns were missing or still had legacy names.
ALTER TABLE public.subscription_packages
    ADD COLUMN IF NOT EXISTS yearly_price NUMERIC(12,2);

UPDATE public.subscription_packages
SET yearly_price = ROUND(monthly_price * 12 * (100 - yearly_discount_percent) / 100, 2)
WHERE yearly_price IS NULL;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid='public.subscription_packages'::regclass
          AND conname='subscription_packages_yearly_price_check'
    ) THEN
        ALTER TABLE public.subscription_packages
            ADD CONSTRAINT subscription_packages_yearly_price_check
            CHECK (yearly_price IS NULL OR yearly_price >= 0);
    END IF;
END $$;

ALTER TABLE public.user_subscriptions
    ADD COLUMN IF NOT EXISTS billing_interval TEXT DEFAULT 'monthly',
    ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS next_billing_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS renewal_enabled BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS cancellation_at TIMESTAMPTZ;

UPDATE public.user_subscriptions
SET billing_interval=COALESCE(billing_interval, 'monthly'),
    current_period_start=COALESCE(current_period_start, starts_at),
    next_billing_at=COALESCE(next_billing_at, expires_at),
    renewal_enabled=COALESCE(renewal_enabled, FALSE);

ALTER TABLE public.user_subscriptions
    ALTER COLUMN billing_interval SET DEFAULT 'monthly',
    ALTER COLUMN billing_interval SET NOT NULL,
    ALTER COLUMN current_period_start SET DEFAULT NOW(),
    ALTER COLUMN current_period_start SET NOT NULL,
    ALTER COLUMN next_billing_at SET NOT NULL,
    ALTER COLUMN renewal_enabled SET DEFAULT FALSE,
    ALTER COLUMN renewal_enabled SET NOT NULL;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid='public.user_subscriptions'::regclass
          AND conname='user_subscriptions_billing_interval_check'
    ) THEN
        ALTER TABLE public.user_subscriptions
            ADD CONSTRAINT user_subscriptions_billing_interval_check
            CHECK (billing_interval IN ('monthly','yearly'));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='payment_orders'
          AND column_name='plan_price'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='payment_orders'
          AND column_name='monthly_price'
    ) THEN
        ALTER TABLE public.payment_orders RENAME COLUMN monthly_price TO plan_price;
    ELSE
        ALTER TABLE public.payment_orders ADD COLUMN IF NOT EXISTS plan_price NUMERIC(12,2);
    END IF;
END $$;

ALTER TABLE public.payment_orders
    ADD COLUMN IF NOT EXISTS billing_interval TEXT DEFAULT 'monthly',
    ADD COLUMN IF NOT EXISTS idempotency_key UUID DEFAULT gen_random_uuid();

UPDATE public.payment_orders
SET billing_interval=COALESCE(billing_interval, 'monthly'),
    idempotency_key=COALESCE(idempotency_key, gen_random_uuid());

ALTER TABLE public.payment_orders
    ALTER COLUMN billing_interval SET DEFAULT 'monthly',
    ALTER COLUMN billing_interval SET NOT NULL,
    ALTER COLUMN idempotency_key SET DEFAULT gen_random_uuid(),
    ALTER COLUMN idempotency_key SET NOT NULL,
    ALTER COLUMN plan_price SET NOT NULL;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid='public.payment_orders'::regclass
          AND conname='payment_orders_billing_interval_check'
    ) THEN
        ALTER TABLE public.payment_orders
            ADD CONSTRAINT payment_orders_billing_interval_check
            CHECK (billing_interval IN ('monthly','yearly'));
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS payment_orders_user_idempotency_idx
    ON public.payment_orders(user_id,idempotency_key);
