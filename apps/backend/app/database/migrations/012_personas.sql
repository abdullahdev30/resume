CREATE TABLE IF NOT EXISTS personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL CHECK (length(trim(name)) > 0),
    description VARCHAR(500) NOT NULL DEFAULT '',
    avatar_path TEXT,
    data JSONB NOT NULL DEFAULT '{"personal":{},"education":[],"experience":[],"skills":[],"certificates":[],"projects":[],"social_links":[]}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS personas_owner_idx ON personas(user_id, created_at DESC);
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own personas" ON personas;
CREATE POLICY "Users manage own personas" ON personas FOR ALL
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- One-time copy: preserve the legacy profile and its original entry IDs. Old
-- profile tables and saved resume snapshots are retained for compatibility.
INSERT INTO personas (user_id, name, description, avatar_path, data)
SELECT p.id, 'My persona', 'Imported from your existing profile', p.avatar_url,
    jsonb_build_object(
        'personal', to_jsonb(p) - 'id',
        'education', COALESCE((SELECT jsonb_agg(to_jsonb(e) || jsonb_build_object('institute_name', e.institution) ORDER BY e.created_at) FROM educations e WHERE e.user_id = p.id), '[]'::jsonb),
        'experience', COALESCE((SELECT jsonb_agg(to_jsonb(e) || jsonb_build_object('company_name', e.company, 'job_title', e.position) ORDER BY e.created_at) FROM experiences e WHERE e.user_id = p.id), '[]'::jsonb),
        'skills', COALESCE((SELECT jsonb_agg(to_jsonb(s) || jsonb_build_object('name', COALESCE(s.name, s.skill_name)) ORDER BY s.created_at) FROM skills s WHERE s.user_id = p.id), '[]'::jsonb),
        'certificates', COALESCE((SELECT jsonb_agg(to_jsonb(c) || jsonb_build_object('title', c.name, 'category', c.issuing_organization, 'field', c.credential_id, 'file_url', c.credential_url, 'file_name', c.file_path) ORDER BY c.created_at) FROM certificates c WHERE c.user_id = p.id), '[]'::jsonb),
        'projects', COALESCE((SELECT jsonb_agg(to_jsonb(r) || jsonb_build_object('link', r.url) ORDER BY r.created_at) FROM projects r WHERE r.user_id = p.id), '[]'::jsonb),
        'social_links', COALESCE((SELECT jsonb_agg(to_jsonb(s) || jsonb_build_object('platform_name', s.platform, 'profile_url', s.url) ORDER BY s.created_at) FROM social_links s WHERE s.user_id = p.id), '[]'::jsonb)
    )
FROM profiles p
WHERE NOT EXISTS (SELECT 1 FROM personas x WHERE x.user_id = p.id);
