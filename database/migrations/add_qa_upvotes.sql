-- Q&A upvoting with dedup.
-- One row per (user, target_type, target_id) — the compound PK enforces
-- a single vote per user per question/answer, and doubles as the dedup key
-- for the INSERT ... ON CONFLICT DO NOTHING upsert.

CREATE TABLE IF NOT EXISTS qa_upvotes (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(10) NOT NULL CHECK (target_type IN ('question', 'answer')),
    target_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_qa_upvotes_target
    ON qa_upvotes (target_type, target_id);
