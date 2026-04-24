-- =====================================================
-- Platform features migration (idempotent)
-- Moderation · Currency · Events · API keys · A/B · Digests ·
-- IP reputation · Seller onboarding · Promoted auction · Saved-search runs ·
-- Bid cursor for offline catch-up
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----- Content moderation -----
CREATE TABLE IF NOT EXISTS prohibited_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern TEXT NOT NULL,
  is_regex BOOLEAN DEFAULT false,
  category VARCHAR(40) NOT NULL,  -- weapons, drugs, counterfeit, hate, adult, recalled
  severity VARCHAR(10) NOT NULL DEFAULT 'block', -- block | flag
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_prohibited_terms_cat ON prohibited_terms(category);

CREATE TABLE IF NOT EXISTS moderation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending | approved | blocked
  reason TEXT,
  matched_terms TEXT[],
  reviewer_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_moderation_status ON moderation_reports(status);

-- Seed common prohibited terms (safe to run repeatedly)
INSERT INTO prohibited_terms (pattern, is_regex, category, severity) VALUES
  ('firearm', false, 'weapons', 'block'),
  ('handgun', false, 'weapons', 'block'),
  ('ammunition', false, 'weapons', 'block'),
  ('ivory', false, 'wildlife', 'block'),
  ('cocaine', false, 'drugs', 'block'),
  ('heroin', false, 'drugs', 'block'),
  ('counterfeit', false, 'counterfeit', 'block'),
  ('replica rolex', false, 'counterfeit', 'block'),
  ('fake id', false, 'counterfeit', 'block'),
  ('recalled', false, 'recalled', 'flag')
ON CONFLICT DO NOTHING;

-- ----- Currency / i18n -----
CREATE TABLE IF NOT EXISTS currency_rates (
  code CHAR(3) PRIMARY KEY,
  rate_to_usd DECIMAL(14,6) NOT NULL,
  symbol VARCHAR(4),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO currency_rates (code, rate_to_usd, symbol) VALUES
  ('USD', 1.000000, '$'),
  ('EUR', 0.920000, '€'),
  ('GBP', 0.790000, '£'),
  ('CAD', 1.360000, 'C$'),
  ('AUD', 1.510000, 'A$'),
  ('JPY', 149.0000, '¥'),
  ('TRY', 32.50000, '₺')
ON CONFLICT (code) DO UPDATE SET rate_to_usd = EXCLUDED.rate_to_usd, updated_at = NOW();

-- ----- Event analytics -----
CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  event_name VARCHAR(60) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(64),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  properties JSONB,
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_events_name_time ON events(event_name, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);

-- ----- Public API keys -----
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(80) NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix VARCHAR(12) NOT NULL,
  scopes TEXT[] DEFAULT ARRAY['public:read'],
  rate_limit_per_min INT DEFAULT 120,
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);

CREATE TABLE IF NOT EXISTS api_key_usage (
  id BIGSERIAL PRIMARY KEY,
  key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint VARCHAR(200),
  bucket_start TIMESTAMPTZ NOT NULL,
  request_count INT DEFAULT 1,
  UNIQUE(key_id, endpoint, bucket_start)
);
CREATE INDEX IF NOT EXISTS idx_api_usage_bucket ON api_key_usage(bucket_start);

-- ----- A/B testing -----
CREATE TABLE IF NOT EXISTS experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(60) UNIQUE NOT NULL,
  name VARCHAR(120),
  variants JSONB NOT NULL,           -- [{"key":"control","weight":50},{"key":"variant","weight":50}]
  status VARCHAR(15) DEFAULT 'running', -- running | paused | ended
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS experiment_assignments (
  id BIGSERIAL PRIMARY KEY,
  experiment_key VARCHAR(60) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(64),
  variant VARCHAR(30) NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(experiment_key, user_id),
  UNIQUE(experiment_key, session_id)
);
CREATE INDEX IF NOT EXISTS idx_exp_assign_lookup ON experiment_assignments(experiment_key, variant);

CREATE TABLE IF NOT EXISTS experiment_conversions (
  id BIGSERIAL PRIMARY KEY,
  experiment_key VARCHAR(60) NOT NULL,
  variant VARCHAR(30) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(64),
  goal VARCHAR(40) NOT NULL,   -- e.g. 'purchase', 'bid_placed', 'signup'
  value DECIMAL(12,2),
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exp_conv_lookup ON experiment_conversions(experiment_key, variant, goal);

-- ----- Digest runs (idempotency for email jobs) -----
CREATE TABLE IF NOT EXISTS digest_runs (
  id BIGSERIAL PRIMARY KEY,
  job_name VARCHAR(40) NOT NULL,
  run_date DATE NOT NULL,
  users_notified INT DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  UNIQUE(job_name, run_date)
);

-- ----- IP reputation / fraud heuristics -----
CREATE TABLE IF NOT EXISTS ip_reputation (
  ip INET PRIMARY KEY,
  score INT NOT NULL DEFAULT 0,       -- higher = worse
  label VARCHAR(30),                  -- tor | vpn | datacenter | abusive | trusted
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ip_reputation_label ON ip_reputation(label);

CREATE TABLE IF NOT EXISTS bid_velocity_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  ip INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bid_velocity_user_time ON bid_velocity_log(user_id, created_at DESC);

-- Flag columns on users for new-account gating
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='trust_level') THEN
    ALTER TABLE users ADD COLUMN trust_level INT DEFAULT 0;  -- 0 new, 1 basic, 2 verified, 3 top-rated
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='signup_ip') THEN
    ALTER TABLE users ADD COLUMN signup_ip INET;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='preferred_currency') THEN
    ALTER TABLE users ADD COLUMN preferred_currency CHAR(3) DEFAULT 'USD';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='preferred_locale') THEN
    ALTER TABLE users ADD COLUMN preferred_locale VARCHAR(8) DEFAULT 'en';
  END IF;
END$$;

-- ----- Seller onboarding -----
CREATE TABLE IF NOT EXISTS seller_onboarding (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  step_account BOOLEAN DEFAULT false,
  step_identity BOOLEAN DEFAULT false,
  step_payout BOOLEAN DEFAULT false,
  step_tax BOOLEAN DEFAULT false,
  step_policies BOOLEAN DEFAULT false,
  step_first_listing BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----- Promoted Listings auction -----
CREATE TABLE IF NOT EXISTS promotion_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  cpc_bid DECIMAL(8,2) NOT NULL,   -- max cost per click seller will pay
  daily_budget DECIMAL(10,2),
  spent_today DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(15) DEFAULT 'active',  -- active | paused | exhausted
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_promotion_bids_status ON promotion_bids(status);

CREATE TABLE IF NOT EXISTS promotion_events (
  id BIGSERIAL PRIMARY KEY,
  promotion_bid_id UUID REFERENCES promotion_bids(id) ON DELETE CASCADE,
  kind VARCHAR(15) NOT NULL,  -- impression | click
  cost DECIMAL(8,2) DEFAULT 0,
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_promo_events_time ON promotion_events(occurred_at DESC);

-- ----- Saved-search alert runs -----
CREATE TABLE IF NOT EXISTS saved_search_last_run (
  saved_search_id UUID PRIMARY KEY,
  last_run_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_product_ids UUID[] DEFAULT ARRAY[]::UUID[]
);

-- ----- Bid cursor for offline catch-up -----
-- Add a monotonic seq to bids so clients can ask "what did I miss since bid seq X?"
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bids' AND column_name='seq') THEN
    ALTER TABLE bids ADD COLUMN seq BIGSERIAL;
    CREATE INDEX idx_bids_seq ON bids(seq);
  END IF;
END$$;
