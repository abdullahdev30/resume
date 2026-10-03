-- Temporary guest accounts are real Supabase Auth users so all existing
-- ownership checks keep working. The public identifier is deliberately
-- separate from auth.users.id and is never used for authorization.
CREATE TABLE IF NOT EXISTS public.guest_accounts (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    guest_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    pending_email VARCHAR(320),
    upgraded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_guest_accounts_expiry
ON public.guest_accounts(expires_at)
WHERE upgraded_at IS NULL;

ALTER TABLE public.guest_accounts ENABLE ROW LEVEL SECURITY;

-- Guest lifecycle data is server-only. The FastAPI database role manages it;
-- no browser-facing RLS policy is intentionally created.
