CREATE TABLE IF NOT EXISTS ai_results (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  resource_type VARCHAR(64) NOT NULL,
  resource_id VARCHAR(128) NOT NULL,
  feature VARCHAR(64) NOT NULL,
  model VARCHAR(128) NOT NULL,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  raw TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_results_resource ON ai_results(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_ai_results_user ON ai_results(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_results_feature ON ai_results(feature);
