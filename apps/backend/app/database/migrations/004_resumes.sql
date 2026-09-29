-- Resume PDF metadata.
--
-- public.resumes is shared with the editor/AI generated resume documents
-- (template_id + data). Uploaded PDF resumes are the rows that carry a
-- storage_path, so this migration extends the existing table additively
-- instead of creating a competing table.

CREATE TABLE IF NOT EXISTS public.resumes (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    file_name TEXT,
    storage_path TEXT,
    mime_type TEXT,
    file_size BIGINT,
    template_id VARCHAR(255),
    data JSON,
    is_ai_generated BOOLEAN,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- PDF columns (no-ops when the columns already exist).
ALTER TABLE public.resumes
    ADD COLUMN IF NOT EXISTS user_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS title VARCHAR(255),
    ADD COLUMN IF NOT EXISTS file_name TEXT,
    ADD COLUMN IF NOT EXISTS storage_path TEXT,
    ADD COLUMN IF NOT EXISTS mime_type TEXT,
    ADD COLUMN IF NOT EXISTS file_size BIGINT,
    ADD COLUMN IF NOT EXISTS template_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS data JSON,
    ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW();

-- Editor resume documents do not carry a PDF, so these two columns must
-- become optional. Existing values are preserved.
ALTER TABLE public.resumes ALTER COLUMN template_id DROP NOT NULL;
ALTER TABLE public.resumes ALTER COLUMN data DROP NOT NULL;

-- Timestamps are set by the application, defaults keep manual inserts sane.
ALTER TABLE public.resumes ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE public.resumes ALTER COLUMN updated_at SET DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_resumes_user_id
ON public.resumes(user_id);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id_created_at
ON public.resumes(user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_resumes_storage_path
ON public.resumes(storage_path)
WHERE storage_path IS NOT NULL;

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own resumes" ON public.resumes;
CREATE POLICY "Users manage own resumes"
ON public.resumes
FOR ALL
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);
