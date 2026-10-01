-- Profile fields used to seed new resumes, plus education fields already
-- present in the public API contract but missing from the original table.

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS professional_title VARCHAR(255),
    ADD COLUMN IF NOT EXISTS summary TEXT;

ALTER TABLE public.educations
    ADD COLUMN IF NOT EXISTS grade VARCHAR(100),
    ADD COLUMN IF NOT EXISTS is_current BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE public.educations
SET is_current = TRUE
WHERE end_date IS NULL;
