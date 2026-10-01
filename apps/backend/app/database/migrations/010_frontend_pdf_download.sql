-- Editable resumes are source documents rendered by the browser. Only legacy
-- uploaded PDFs retain object-storage metadata and server-signed downloads.

ALTER TABLE public.resumes
    ALTER COLUMN storage_path DROP NOT NULL,
    ALTER COLUMN file_name DROP NOT NULL,
    ALTER COLUMN file_size DROP NOT NULL,
    ALTER COLUMN html_content DROP NOT NULL;

UPDATE public.resumes
SET storage_path = NULL,
    file_name = NULL,
    file_size = NULL,
    mime_type = NULL,
    html_content = NULL
WHERE resume_type IN ('template', 'ai')
   OR data IS NOT NULL;

ALTER TABLE public.resumes
    DROP COLUMN IF EXISTS pdf_source_version;
