-- Latest Features Migration
-- eBay Clone 2025-2026 Features

-- 1. Add product columns for "Your Cost" and "Country of Origin"
ALTER TABLE products ADD COLUMN IF NOT EXISTS your_cost DECIMAL(12,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS country_of_origin VARCHAR(100);

-- 2. Daily Deals Table
CREATE TABLE IF NOT EXISTS daily_deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    discount_percentage DECIMAL(5,2) NOT NULL,
    deal_price DECIMAL(12,2) NOT NULL,
    original_price DECIMAL(12,2) NOT NULL,
    start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NOT NULL,
    quantity_available INT NOT NULL DEFAULT 1,
    quantity_sold INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    category_id UUID REFERENCES categories(id),
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for querying active deals
CREATE INDEX IF NOT EXISTS idx_daily_deals_active ON daily_deals(is_active, end_time);
CREATE INDEX IF NOT EXISTS idx_daily_deals_category ON daily_deals(category_id);

-- 3. Team Access Tables
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('viewer', 'editor', 'manager', 'admin')),
    permissions JSONB DEFAULT '{}',
    invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    invited_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(owner_id, member_id)
);

CREATE TABLE IF NOT EXISTS team_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL,
    action_details JSONB,
    entity_type VARCHAR(50),
    entity_id UUID,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_team_members_owner ON team_members(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_activity_member ON team_activity_log(team_member_id);

-- 4. Live Shopping Tables
CREATE TABLE IF NOT EXISTS live_streams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(30) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
    scheduled_start TIMESTAMP NOT NULL,
    actual_start TIMESTAMP,
    ended_at TIMESTAMP,
    viewer_count INT DEFAULT 0,
    peak_viewers INT DEFAULT 0,
    stream_key VARCHAR(255),
    stream_url VARCHAR(500),
    playback_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    category_id UUID REFERENCES categories(id),
    is_featured BOOLEAN DEFAULT false,
    replay_available BOOLEAN DEFAULT false,
    replay_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS live_stream_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    flash_price DECIMAL(12,2),
    flash_start TIMESTAMP,
    flash_end TIMESTAMP,
    is_featured BOOLEAN DEFAULT false,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(stream_id, product_id)
);

CREATE TABLE IF NOT EXISTS live_chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    is_highlighted BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_live_streams_status ON live_streams(status, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_live_streams_seller ON live_streams(seller_id);
CREATE INDEX IF NOT EXISTS idx_live_chat_stream ON live_chat_messages(stream_id, created_at);

-- 5. Vault/Grading Integration Tables
CREATE TABLE IF NOT EXISTS vault_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    item_name VARCHAR(255) NOT NULL,
    item_description TEXT,
    grading_service VARCHAR(50) CHECK (grading_service IN ('PSA', 'BGS', 'CGC', 'SGC', 'none')),
    grade VARCHAR(20),
    cert_number VARCHAR(100),
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'shipped_to_vault', 'received', 'grading', 'graded', 'stored', 'shipping_out', 'delivered')),
    vault_location VARCHAR(100),
    estimated_value DECIMAL(12,2),
    insurance_value DECIMAL(12,2),
    submission_date TIMESTAMP,
    graded_date TIMESTAMP,
    images JSONB DEFAULT '[]',
    notes TEXT,
    tracking_number_in VARCHAR(100),
    tracking_number_out VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vault_items_user ON vault_items(user_id);
CREATE INDEX IF NOT EXISTS idx_vault_items_status ON vault_items(status);

-- 6. Automatic Feedback Table
CREATE TABLE IF NOT EXISTS automatic_feedback_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT true,
    delay_days INT DEFAULT 3,
    feedback_template TEXT DEFAULT 'Great buyer! Fast payment. Thank you!',
    conditions JSONB DEFAULT '{"require_payment": true, "require_no_disputes": true}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS automatic_feedback_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    from_user_id UUID REFERENCES users(id),
    to_user_id UUID REFERENCES users(id),
    feedback_type VARCHAR(20) CHECK (feedback_type IN ('positive', 'neutral', 'negative')),
    feedback_text TEXT,
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN DEFAULT true,
    error_message TEXT
);

-- 7. Shipping Reminders Table
CREATE TABLE IF NOT EXISTS shipping_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reminder_time TIMESTAMP NOT NULL,
    reminder_type VARCHAR(30) DEFAULT 'handling_time' CHECK (reminder_type IN ('handling_time', 'follow_up', 'final')),
    sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP,
    acknowledged BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shipping_reminders_pending ON shipping_reminders(reminder_time) WHERE sent = false;

-- 8. AI Message Suggestions Table (for caching)
CREATE TABLE IF NOT EXISTS ai_message_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID,
    message_id UUID,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    original_message TEXT,
    suggested_reply TEXT,
    context JSONB,
    used BOOLEAN DEFAULT false,
    feedback VARCHAR(20) CHECK (feedback IN ('helpful', 'not_helpful', 'edited')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update orders table for shipping reminders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS handling_deadline TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to new tables
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_daily_deals_updated_at') THEN
        CREATE TRIGGER update_daily_deals_updated_at BEFORE UPDATE ON daily_deals
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_team_members_updated_at') THEN
        CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_live_streams_updated_at') THEN
        CREATE TRIGGER update_live_streams_updated_at BEFORE UPDATE ON live_streams
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_vault_items_updated_at') THEN
        CREATE TRIGGER update_vault_items_updated_at BEFORE UPDATE ON vault_items
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END$$;

-- Insert sample daily deals (will reference existing products)
-- This is commented out as it requires existing product IDs
-- INSERT INTO daily_deals (product_id, discount_percentage, deal_price, original_price, end_time, quantity_available)
-- SELECT id, 25, current_price * 0.75, current_price, CURRENT_TIMESTAMP + INTERVAL '24 hours', 10
-- FROM products WHERE status = 'active' LIMIT 5;

COMMENT ON TABLE daily_deals IS 'Daily deals with time-limited discounts';
COMMENT ON TABLE team_members IS 'Team access for sharing seller accounts';
COMMENT ON TABLE live_streams IS 'Live shopping streams by sellers';
COMMENT ON TABLE live_stream_products IS 'Products featured in live streams';
COMMENT ON TABLE live_chat_messages IS 'Chat messages during live streams';
COMMENT ON TABLE vault_items IS 'Items stored in vault for grading services';
COMMENT ON TABLE automatic_feedback_settings IS 'User settings for automatic feedback';
COMMENT ON TABLE shipping_reminders IS 'Shipping reminder notifications for sellers';
COMMENT ON TABLE ai_message_suggestions IS 'AI-generated message reply suggestions';
COMMENT ON COLUMN products.your_cost IS 'Seller cost for profit tracking';
COMMENT ON COLUMN products.country_of_origin IS 'Country of origin for tariff calculation';
