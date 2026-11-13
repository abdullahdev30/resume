ALTER TABLE subscription_packages
    ADD COLUMN ai_resume_limit INTEGER NOT NULL DEFAULT 3
        CHECK (ai_resume_limit BETWEEN 0 AND 10000),
    ADD COLUMN yearly_discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0
        CHECK (yearly_discount_percent BETWEEN 0 AND 100);

UPDATE subscription_packages
SET yearly_discount_percent = CASE
    WHEN monthly_price > 0 AND yearly_price IS NOT NULL
        THEN LEAST(100, GREATEST(0, ROUND((1 - yearly_price / (monthly_price * 12)) * 100, 2)))
    ELSE 0
END,
yearly_price = COALESCE(yearly_price, monthly_price * 12);

ALTER TABLE user_subscriptions
    ADD COLUMN ai_resume_limit INTEGER NOT NULL DEFAULT 3;
UPDATE user_subscriptions s SET ai_resume_limit=p.ai_resume_limit
FROM subscription_packages p WHERE p.id=s.package_id;

ALTER TABLE payment_orders ADD COLUMN ai_resume_limit INTEGER NOT NULL DEFAULT 3;
UPDATE payment_orders o SET ai_resume_limit=p.ai_resume_limit
FROM subscription_packages p WHERE p.id=o.package_id;

CREATE OR REPLACE FUNCTION enforce_ai_resume_subscription_limit()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    subscription user_subscriptions;
    account account_access;
    used_count INTEGER;
BEGIN
    IF NEW.is_ai_generated IS NOT TRUE AND NEW.resume_type IS DISTINCT FROM 'ai' THEN
        RETURN NEW;
    END IF;

    PERFORM pg_advisory_xact_lock(hashtextextended(NEW.user_id::text, 0));
    SELECT * INTO account FROM account_access WHERE user_id=NEW.user_id;
    IF account.active = FALSE THEN
        RAISE EXCEPTION 'Account is deactivated' USING ERRCODE='P0001';
    END IF;
    IF account.role IN ('admin','super_admin') THEN
        RETURN NEW;
    END IF;

    SELECT * INTO subscription FROM user_subscriptions WHERE user_id=NEW.user_id;
    IF subscription.user_id IS NULL OR subscription.expires_at <= NOW() THEN
        RAISE EXCEPTION 'Select an active package before creating an AI resume' USING ERRCODE='P0001';
    END IF;
    SELECT count(*) INTO used_count FROM resumes
    WHERE user_id=NEW.user_id
      AND (is_ai_generated IS TRUE OR resume_type='ai')
      AND created_at >= subscription.current_period_start;
    IF used_count >= subscription.ai_resume_limit THEN
        RAISE EXCEPTION 'AI resume limit reached for this package. You can continue editing your existing resumes.' USING ERRCODE='P0001';
    END IF;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS ai_resume_subscription_limit ON resumes;
CREATE TRIGGER ai_resume_subscription_limit BEFORE INSERT ON resumes
FOR EACH ROW EXECUTE FUNCTION enforce_ai_resume_subscription_limit();
