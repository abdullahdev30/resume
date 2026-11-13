CREATE TABLE IF NOT EXISTS public.user_subscription_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    package_id UUID REFERENCES public.subscription_packages(id) ON DELETE SET NULL,
    package_name TEXT NOT NULL,
    persona_limit INTEGER NOT NULL,
    ai_resume_limit INTEGER NOT NULL,
    billing_interval TEXT NOT NULL CHECK (billing_interval IN ('monthly','yearly')),
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','replaced')),
    starts_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    payment_order_id UUID UNIQUE REFERENCES public.payment_orders(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (expires_at > starts_at)
);

CREATE INDEX IF NOT EXISTS user_subscription_history_user_created_idx
    ON public.user_subscription_history(user_id, starts_at DESC, created_at DESC);

ALTER TABLE public.user_subscription_history ENABLE ROW LEVEL SECURITY;

-- Preserve paid terms already represented by payment orders.
INSERT INTO public.user_subscription_history
    (user_id,package_id,package_name,persona_limit,ai_resume_limit,billing_interval,
     amount,currency,status,starts_at,expires_at,payment_order_id,created_at)
SELECT o.user_id,o.package_id,o.package_name,o.persona_limit,o.ai_resume_limit,
       o.billing_interval,o.plan_price,o.currency,'active',o.created_at,
       o.created_at + CASE WHEN o.billing_interval='yearly' THEN INTERVAL '12 months' ELSE INTERVAL '1 month' END,
       o.id,o.created_at
FROM public.payment_orders o
WHERE o.status='paid'
ON CONFLICT (payment_order_id) DO NOTHING;

-- Use the subscription record's real period dates for its most recent payment.
UPDATE public.user_subscription_history h
SET package_name=s.package_name, persona_limit=s.persona_limit,
    ai_resume_limit=s.ai_resume_limit, billing_interval=s.billing_interval,
    amount=s.monthly_price, currency=s.currency, starts_at=s.starts_at,
    expires_at=s.expires_at
FROM public.user_subscriptions s
WHERE s.source_payment_order=h.payment_order_id;

-- Preserve current free/manual subscriptions that have no payment order.
INSERT INTO public.user_subscription_history
    (user_id,package_id,package_name,persona_limit,ai_resume_limit,billing_interval,
     amount,currency,status,starts_at,expires_at,created_at)
SELECT s.user_id,s.package_id,s.package_name,s.persona_limit,s.ai_resume_limit,
       s.billing_interval,s.monthly_price,s.currency,
       CASE WHEN s.expires_at <= NOW() THEN 'expired' ELSE 'active' END,
       s.starts_at,s.expires_at,s.starts_at
FROM public.user_subscriptions s
WHERE s.source_payment_order IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM public.user_subscription_history h
      WHERE h.user_id=s.user_id AND h.starts_at=s.starts_at AND h.expires_at=s.expires_at
  );
