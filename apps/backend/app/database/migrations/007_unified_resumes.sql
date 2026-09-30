-- Unified resume records for template, AI generated, and legacy PDF uploads.
-- Existing uploaded PDFs are preserved and marked as legacy_pdf when they do
-- not have editable source data.

ALTER TABLE public.resumes
    ADD COLUMN IF NOT EXISTS html_content TEXT,
    ADD COLUMN IF NOT EXISTS resume_type VARCHAR(30),
    ADD COLUMN IF NOT EXISTS source_version BIGINT DEFAULT 1;

UPDATE public.resumes
SET resume_type = CASE
    WHEN is_ai_generated IS TRUE THEN 'ai'
    WHEN data IS NOT NULL OR template_id IS NOT NULL THEN 'template'
    ELSE 'legacy_pdf'
END
WHERE resume_type IS NULL;

ALTER TABLE public.resumes
    ALTER COLUMN source_version SET DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_resumes_user_id_resume_type
ON public.resumes(user_id, resume_type);
