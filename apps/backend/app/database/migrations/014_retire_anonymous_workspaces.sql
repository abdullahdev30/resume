-- Stop exposing lifecycle state, without deleting identities, resumes, or PDFs.
-- Historical records are quarantined for an operator's ownership audit.
-- This migration deliberately performs no DELETE against auth.users/resumes.
DO $$
BEGIN
    IF to_regclass('public.guest_accounts') IS NOT NULL
       AND to_regclass('public.retired_anonymous_workspaces') IS NULL THEN
        ALTER TABLE public.guest_accounts RENAME TO retired_anonymous_workspaces;
    END IF;
    IF to_regclass('public.retired_anonymous_workspaces') IS NOT NULL THEN
        COMMENT ON TABLE public.retired_anonymous_workspaces IS
            'Historical quarantine. No automatic expiration or account deletion. Audit ownership and storage before any separately approved cleanup.';
    END IF;
END $$;

ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS template_version INTEGER NOT NULL DEFAULT 1;
