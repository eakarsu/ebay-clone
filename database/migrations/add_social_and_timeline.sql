-- Batch 5: seller follows + order status history.
-- Both tables are append-only so concurrent writes don't need locking.

-- =====================================================
-- 1) Seller follows
-- =====================================================
CREATE TABLE IF NOT EXISTS seller_follows (
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, seller_id),
    CHECK (follower_id <> seller_id)
);
CREATE INDEX IF NOT EXISTS idx_seller_follows_seller ON seller_follows (seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_follows_follower ON seller_follows (follower_id);

-- =====================================================
-- 2) Order status history — drives the tracking timeline UI.
--    Every change to orders.status inserts a row; the previous status is
--    captured so the timeline can render transitions (e.g. shipped → delivered).
-- =====================================================
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_status VARCHAR(30),
    to_status   VARCHAR(30) NOT NULL,
    note TEXT,
    changed_by UUID REFERENCES users(id),   -- null if system-initiated
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order
    ON order_status_history (order_id, created_at);

-- Trigger: log the initial status on insert, and any subsequent status change.
-- Using OLD IS NULL (TG_OP = 'INSERT') to distinguish the two paths.
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO order_status_history (order_id, from_status, to_status, note)
        VALUES (NEW.id, NULL, NEW.status, 'Order placed');
    ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
        INSERT INTO order_status_history (order_id, from_status, to_status)
        VALUES (NEW.id, OLD.status, NEW.status);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_order_status_change ON orders;
CREATE TRIGGER trg_log_order_status_change
AFTER INSERT OR UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION log_order_status_change();

-- Backfill: one INSERT row for every existing order so the UI has something
-- to show immediately after migration, rather than showing a blank timeline.
INSERT INTO order_status_history (order_id, from_status, to_status, note, created_at)
SELECT id, NULL, status, 'Order placed (backfilled)', created_at
  FROM orders
 WHERE NOT EXISTS (
   SELECT 1 FROM order_status_history h WHERE h.order_id = orders.id
 );
