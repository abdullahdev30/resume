CREATE TABLE account_access (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
    active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE subscription_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL CHECK (length(trim(name)) > 0),
    description VARCHAR(1000) NOT NULL DEFAULT '',
    persona_limit INTEGER NOT NULL CHECK (persona_limit BETWEEN 1 AND 10000),
    monthly_price NUMERIC(12,2) NOT NULL CHECK (monthly_price >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE user_subscriptions (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES subscription_packages(id),
    package_name TEXT NOT NULL,
    persona_limit INTEGER NOT NULL,
    monthly_price NUMERIC(12,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    CHECK (expires_at > starts_at)
);
ALTER TABLE account_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
-- No browser policies: only the trusted backend may manage billing or roles.

-- Serialize subscriptions and persona creation on the same user lock so
-- concurrent requests cannot bypass the limit or race a downgrade.
CREATE FUNCTION enforce_persona_subscription() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE subscription user_subscriptions; access account_access;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtextextended(NEW.user_id::text, 0));
    SELECT * INTO access FROM account_access WHERE user_id = NEW.user_id;
    IF access.active = FALSE THEN
        RAISE EXCEPTION 'Account is deactivated' USING ERRCODE = 'P0001';
    END IF;
    IF access.role IN ('admin', 'super_admin') THEN RETURN NEW; END IF;
    SELECT * INTO subscription FROM user_subscriptions WHERE user_id = NEW.user_id;
    IF subscription.user_id IS NULL OR subscription.expires_at <= NOW() THEN
        RAISE EXCEPTION 'Select an active package before creating a persona' USING ERRCODE = 'P0001';
    END IF;
    IF (SELECT count(*) FROM personas WHERE user_id = NEW.user_id) >= subscription.persona_limit THEN
        RAISE EXCEPTION 'Persona limit reached. Upgrade your package.' USING ERRCODE = 'P0001';
    END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER persona_subscription_limit BEFORE INSERT ON personas
FOR EACH ROW EXECUTE FUNCTION enforce_persona_subscription();
