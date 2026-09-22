CREATE INDEX IF NOT EXISTS idx_educations_user_id
ON educations(user_id);

CREATE INDEX IF NOT EXISTS idx_experiences_user_id
ON experiences(user_id);

CREATE INDEX IF NOT EXISTS idx_skills_user_id
ON skills(user_id);

CREATE INDEX IF NOT EXISTS idx_certificates_user_id
ON certificates(user_id);

CREATE INDEX IF NOT EXISTS idx_projects_user_id
ON projects(user_id);

CREATE INDEX IF NOT EXISTS idx_social_links_user_id
ON social_links(user_id);
