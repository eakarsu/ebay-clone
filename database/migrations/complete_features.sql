-- Complete Features Migration
-- This creates all missing tables for full feature implementation
-- ================================================================

-- ============================================
-- MEMBERSHIP SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS membership_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    monthly_price DECIMAL(10,2) NOT NULL,
    annual_price DECIMAL(10,2) NOT NULL,
    free_shipping BOOLEAN DEFAULT false,
    free_returns BOOLEAN DEFAULT false,
    extended_returns_days INTEGER DEFAULT 30,
    exclusive_deals BOOLEAN DEFAULT false,
    priority_support BOOLEAN DEFAULT false,
    early_access BOOLEAN DEFAULT false,
    cashback_percent DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES membership_plans(id),
    billing_cycle VARCHAR(20) DEFAULT 'monthly',
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    auto_renew BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'active',
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS membership_exclusive_deals (
    id SERIAL PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    discount_type VARCHAR(20) DEFAULT 'percentage',
    discount_value DECIMAL(10,2) NOT NULL,
    membership_required BOOLEAN DEFAULT true,
    start_date TIMESTAMP DEFAULT NOW(),
    end_date TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days'),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add is_premium_member to users if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_premium_member') THEN
        ALTER TABLE users ADD COLUMN is_premium_member BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Insert default membership plans
INSERT INTO membership_plans (name, description, monthly_price, annual_price, free_shipping, free_returns, extended_returns_days, exclusive_deals, priority_support, early_access, cashback_percent)
VALUES
    ('eBay Plus', 'Premium membership with exclusive benefits', 9.99, 99.99, true, true, 60, true, true, true, 2),
    ('eBay Plus Premium', 'Ultimate membership with maximum benefits', 19.99, 179.99, true, true, 90, true, true, true, 5)
ON CONFLICT DO NOTHING;

-- ============================================
-- SELLER PERFORMANCE TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS seller_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    performance_level VARCHAR(50) DEFAULT 'standard',
    defect_rate DECIMAL(5,2) DEFAULT 0,
    late_shipment_rate DECIMAL(5,2) DEFAULT 0,
    tracking_uploaded_rate DECIMAL(5,2) DEFAULT 100,
    cases_closed_rate DECIMAL(5,2) DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    positive_feedback_rate DECIMAL(5,2) DEFAULT 100,
    evaluated_at TIMESTAMP DEFAULT NOW(),
    next_evaluation TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days'),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seller_defects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    defect_type VARCHAR(50) NOT NULL,
    description TEXT,
    occurred_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '12 months'),
    status VARCHAR(20) DEFAULT 'active',
    appeal_status VARCHAR(20),
    appeal_reason TEXT,
    appeal_submitted_at TIMESTAMP,
    appeal_resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seller_benefits (
    id SERIAL PRIMARY KEY,
    performance_level VARCHAR(50) NOT NULL,
    benefit_name VARCHAR(100) NOT NULL,
    benefit_description TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Insert default seller benefits
INSERT INTO seller_benefits (performance_level, benefit_name, benefit_description)
VALUES
    ('top_rated', 'Top Rated Plus Badge', 'Display Top Rated Plus badge on all listings'),
    ('top_rated', '10% Final Value Fee Discount', 'Save 10% on final value fees'),
    ('top_rated', 'Priority Customer Support', 'Access to dedicated seller support line'),
    ('above_standard', '5% Final Value Fee Discount', 'Save 5% on final value fees'),
    ('above_standard', 'Promoted Listings Credit', 'Monthly credit for promoted listings'),
    ('standard', 'Standard Selling Privileges', 'Access to all standard selling features')
ON CONFLICT DO NOTHING;

-- ============================================
-- SHIPPING TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS shipping_tracking_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID NOT NULL,
    tracking_number VARCHAR(100),
    event_date TIMESTAMP NOT NULL,
    event_location VARCHAR(255),
    event_status VARCHAR(100) NOT NULL,
    event_description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- STORE CATEGORIES
-- ============================================

CREATE TABLE IF NOT EXISTS store_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES seller_stores(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100),
    description TEXT,
    parent_id UUID REFERENCES store_categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    product_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- REWARDS SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS rewards_tiers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    min_points INTEGER NOT NULL,
    max_points INTEGER,
    multiplier DECIMAL(3,2) DEFAULT 1.0,
    perks TEXT[],
    badge_color VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    current_points INTEGER DEFAULT 0,
    lifetime_points INTEGER DEFAULT 0,
    tier_id INTEGER REFERENCES rewards_tiers(id),
    points_expiring_soon INTEGER DEFAULT 0,
    expiration_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rewards_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    points INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    description TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default reward tiers
INSERT INTO rewards_tiers (name, min_points, max_points, multiplier, perks, badge_color)
VALUES
    ('Bronze', 0, 999, 1.0, ARRAY['1 point per $1 spent', 'Birthday bonus'], '#CD7F32'),
    ('Silver', 1000, 4999, 1.25, ARRAY['1.25 points per $1 spent', 'Free shipping on orders $35+', 'Birthday bonus'], '#C0C0C0'),
    ('Gold', 5000, 19999, 1.5, ARRAY['1.5 points per $1 spent', 'Free shipping on all orders', 'Early access to sales', 'Birthday bonus'], '#FFD700'),
    ('Platinum', 20000, NULL, 2.0, ARRAY['2 points per $1 spent', 'Free express shipping', 'Exclusive deals', 'Priority support', 'Birthday bonus'], '#E5E4E2')
ON CONFLICT DO NOTHING;

-- ============================================
-- PAYMENT PLANS (BNPL)
-- ============================================

CREATE TABLE IF NOT EXISTS payment_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    total_amount DECIMAL(10,2) NOT NULL,
    num_installments INTEGER NOT NULL,
    installment_amount DECIMAL(10,2) NOT NULL,
    interest_rate DECIMAL(5,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    next_payment_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_plan_installments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID REFERENCES payment_plans(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date TIMESTAMP NOT NULL,
    paid_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- SUPPORT CHAT
-- ============================================

CREATE TABLE IF NOT EXISTS support_chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    subject VARCHAR(255),
    category VARCHAR(50),
    status VARCHAR(20) DEFAULT 'open',
    priority VARCHAR(20) DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    closed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS support_chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID REFERENCES support_chats(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    sender_type VARCHAR(20) DEFAULT 'user',
    message TEXT NOT NULL,
    attachments JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- CURRENCIES
-- ============================================

CREATE TABLE IF NOT EXISTS currencies (
    id SERIAL PRIMARY KEY,
    code VARCHAR(3) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    symbol VARCHAR(5) NOT NULL,
    exchange_rate DECIMAL(12,6) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_currency_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    currency_code VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default currencies
INSERT INTO currencies (code, name, symbol, exchange_rate)
VALUES
    ('USD', 'US Dollar', '$', 1.0),
    ('EUR', 'Euro', '€', 0.92),
    ('GBP', 'British Pound', '£', 0.79),
    ('CAD', 'Canadian Dollar', 'C$', 1.36),
    ('AUD', 'Australian Dollar', 'A$', 1.53),
    ('JPY', 'Japanese Yen', '¥', 149.50)
ON CONFLICT DO NOTHING;

-- ============================================
-- INVOICES
-- ============================================

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    buyer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    due_date TIMESTAMP,
    paid_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- LOCAL PICKUP
-- ============================================

CREATE TABLE IF NOT EXISTS pickup_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(2) DEFAULT 'US',
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    hours_of_operation JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pickup_appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    location_id UUID REFERENCES pickup_locations(id) ON DELETE SET NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    confirmation_code VARCHAR(20),
    status VARCHAR(20) DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- COLLECTIONS/WISHLISTS
-- ============================================

CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    follower_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collection_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT NOW(),
    notes TEXT,
    UNIQUE(collection_id, product_id)
);

CREATE TABLE IF NOT EXISTS collection_followers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    followed_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(collection_id, user_id)
);

-- ============================================
-- PRICE ALERTS
-- ============================================

CREATE TABLE IF NOT EXISTS price_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    target_price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    notify_email BOOLEAN DEFAULT true,
    notify_push BOOLEAN DEFAULT false,
    triggered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL,
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- PRODUCT Q&A
-- ============================================

CREATE TABLE IF NOT EXISTS product_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    asker_id UUID REFERENCES users(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    helpful_count INTEGER DEFAULT 0,
    is_answered BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES product_questions(id) ON DELETE CASCADE,
    answerer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    answer TEXT NOT NULL,
    is_seller_answer BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- OFFERS (MAKE AN OFFER)
-- ============================================

CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
    offer_amount DECIMAL(10,2) NOT NULL,
    counter_amount DECIMAL(10,2),
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '48 hours'),
    responded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add offers-related columns to products if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'accepts_offers') THEN
        ALTER TABLE products ADD COLUMN accepts_offers BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'minimum_offer_percent') THEN
        ALTER TABLE products ADD COLUMN minimum_offer_percent INTEGER DEFAULT 50;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'auto_accept_price') THEN
        ALTER TABLE products ADD COLUMN auto_accept_price DECIMAL(10,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'auto_decline_price') THEN
        ALTER TABLE products ADD COLUMN auto_decline_price DECIMAL(10,2);
    END IF;
END $$;

-- ============================================
-- RECENTLY VIEWED
-- ============================================

CREATE TABLE IF NOT EXISTS recently_viewed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- ============================================
-- BID RETRACTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS bid_retractions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bid_id UUID REFERENCES bids(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(100) NOT NULL,
    explanation TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- SELLER STORES
-- ============================================

CREATE TABLE IF NOT EXISTS seller_stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    store_name VARCHAR(100) NOT NULL,
    store_slug VARCHAR(100) UNIQUE,
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    theme_color VARCHAR(7) DEFAULT '#3665f3',
    policies TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    website_url TEXT,
    social_links JSONB,
    is_active BOOLEAN DEFAULT true,
    subscriber_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS store_subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES seller_stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subscribed_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(store_id, user_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_memberships_user ON user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_status ON user_memberships(status);
CREATE INDEX IF NOT EXISTS idx_seller_performance_seller ON seller_performance(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_defects_seller ON seller_defects(seller_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_product ON price_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_offers_product ON offers(product_id);
CREATE INDEX IF NOT EXISTS idx_offers_buyer ON offers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_offers_seller ON offers(seller_id);
CREATE INDEX IF NOT EXISTS idx_collections_user ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_user ON recently_viewed(user_id);
CREATE INDEX IF NOT EXISTS idx_product_questions_product ON product_questions(product_id);
CREATE INDEX IF NOT EXISTS idx_support_chats_user ON support_chats(user_id);

-- ============================================
-- SEED DATA FOR TESTING
-- ============================================

-- Seed some exclusive deals for membership
INSERT INTO membership_exclusive_deals (product_id, discount_type, discount_value, membership_required)
SELECT id, 'percentage', 15, true FROM products ORDER BY RANDOM() LIMIT 10
ON CONFLICT DO NOTHING;

-- Create default seller performance records for sellers
INSERT INTO seller_performance (seller_id, performance_level, positive_feedback_rate, total_transactions)
SELECT id, 'standard', 98.5, 50 FROM users WHERE is_seller = true
ON CONFLICT (seller_id) DO NOTHING;

-- Create default user rewards
INSERT INTO user_rewards (user_id, current_points, lifetime_points, tier_id)
SELECT id, 500, 500, 1 FROM users
ON CONFLICT (user_id) DO NOTHING;

RAISE NOTICE 'Complete features migration finished successfully!';
