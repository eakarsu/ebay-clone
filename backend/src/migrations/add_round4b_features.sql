-- Round 4b: Auction Watcher Chat + Seller Vacation Auto-Responder

-- Persistent chat log per auction. Lightweight: product_id scopes the room,
-- realtime delivery is via Socket.IO `auction:{productId}`.
CREATE TABLE IF NOT EXISTS auction_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL CHECK (length(message) BETWEEN 1 AND 500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auction_chat_product_created
  ON auction_chat_messages (product_id, created_at DESC);

-- Flag auto-replies so the UI can distinguish them from human messages,
-- and so we can dedup replies to the same sender.
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS is_auto_reply BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_messages_auto_reply_recent
  ON messages (sender_id, recipient_id, created_at DESC)
  WHERE is_auto_reply = true;
