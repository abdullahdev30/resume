-- Durable cleanup queue for objects left behind after a successful DB delete.

CREATE TABLE IF NOT EXISTS public.resume_storage_cleanup (
    storage_path TEXT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resume_storage_cleanup_created_at
ON public.resume_storage_cleanup(created_at);
