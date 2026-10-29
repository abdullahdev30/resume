ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS html_content TEXT;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS pdf_source_version BIGINT;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS pdf_html TEXT;
-- Existing editable source remains intact. Its first PDF request creates the
-- missing derivative; subsequent requests reuse the stored version.
