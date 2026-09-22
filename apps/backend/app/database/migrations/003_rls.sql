ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE educations ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own profile" ON profiles;
CREATE POLICY "Users manage own profile"
ON profiles
FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users manage own education" ON educations;
CREATE POLICY "Users manage own education"
ON educations
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own experience" ON experiences;
CREATE POLICY "Users manage own experience"
ON experiences
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own skills" ON skills;
CREATE POLICY "Users manage own skills"
ON skills
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own certificates" ON certificates;
CREATE POLICY "Users manage own certificates"
ON certificates
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own projects" ON projects;
CREATE POLICY "Users manage own projects"
ON projects
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own social links" ON social_links;
CREATE POLICY "Users manage own social links"
ON social_links
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
