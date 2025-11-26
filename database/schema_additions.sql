-- eBay Clone - Additional Database Schema
-- New tables for missing features

-- =====================================================
-- PASSWORD RESET TOKENS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TWO FACTOR AUTH TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS two_factor_auth (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    secret VARCHAR(255) NOT NULL,
    is_enabled BOOLEAN DEFAULT FALSE,
    backup_codes TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- STRIPE CUSTOMERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS stripe_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PAYMENT TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id),
    user_id UUID NOT NULL REFERENCES users(id),
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'usd',
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded', 'partially_refunded')),
    payment_method_type VARCHAR(50),
    receipt_url VARCHAR(500),
    refund_amount DECIMAL(12,2) DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- DISPUTES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id),
    order_item_id UUID REFERENCES order_items(id),
    opened_by UUID NOT NULL REFERENCES users(id),
    against_user UUID NOT NULL REFERENCES users(id),
    dispute_type VARCHAR(50) NOT NULL CHECK (dispute_type IN ('item_not_received', 'item_not_as_described', 'unauthorized_purchase', 'other')),
    status VARCHAR(30) DEFAULT 'open' CHECK (status IN ('open', 'pending_seller_response', 'pending_buyer_response', 'under_review', 'resolved', 'closed', 'escalated')),
    reason TEXT NOT NULL,
    desired_resolution VARCHAR(50) CHECK (desired_resolution IN ('full_refund', 'partial_refund', 'replacement', 'other')),
    resolution_type VARCHAR(50) CHECK (resolution_type IN ('refunded', 'partially_refunded', 'replaced', 'closed_no_action', 'favor_buyer', 'favor_seller')),
    resolution_notes TEXT,
    refund_amount DECIMAL(12,2),
    admin_id UUID REFERENCES users(id),
    escalated_at TIMESTAMP,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- DISPUTE MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS dispute_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    message TEXT NOT NULL,
    attachments TEXT[],
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- RETURNS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id),
    order_item_id UUID REFERENCES order_items(id),
    buyer_id UUID NOT NULL REFERENCES users(id),
    seller_id UUID NOT NULL REFERENCES users(id),
    return_reason VARCHAR(50) NOT NULL CHECK (return_reason IN ('changed_mind', 'defective', 'not_as_described', 'wrong_item', 'arrived_late', 'other')),
    return_details TEXT,
    status VARCHAR(30) DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'shipped', 'received', 'refunded', 'closed')),
    return_shipping_label VARCHAR(500),
    tracking_number VARCHAR(100),
    refund_amount DECIMAL(12,2),
    refund_type VARCHAR(30) CHECK (refund_type IN ('full', 'partial', 'store_credit')),
    seller_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SAVED SEARCHES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS saved_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    search_query VARCHAR(255),
    category_id UUID REFERENCES categories(id),
    subcategory_id UUID REFERENCES subcategories(id),
    min_price DECIMAL(12,2),
    max_price DECIMAL(12,2),
    condition VARCHAR(50),
    listing_type VARCHAR(20),
    free_shipping BOOLEAN,
    email_alerts BOOLEAN DEFAULT TRUE,
    alert_frequency VARCHAR(20) DEFAULT 'daily' CHECK (alert_frequency IN ('instant', 'daily', 'weekly')),
    last_alert_sent TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- COUPONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_shipping')),
    discount_value DECIMAL(10,2) NOT NULL,
    min_purchase_amount DECIMAL(12,2) DEFAULT 0,
    max_discount_amount DECIMAL(12,2),
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    per_user_limit INTEGER DEFAULT 1,
    category_id UUID REFERENCES categories(id),
    seller_id UUID REFERENCES users(id),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- COUPON USAGE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS coupon_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id UUID NOT NULL REFERENCES coupons(id),
    user_id UUID NOT NULL REFERENCES users(id),
    order_id UUID REFERENCES orders(id),
    discount_applied DECIMAL(12,2) NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(coupon_id, user_id, order_id)
);

-- =====================================================
-- SHIPPING CARRIERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS shipping_carriers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    tracking_url_template VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SHIPPING RATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS shipping_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    carrier_id UUID NOT NULL REFERENCES shipping_carriers(id),
    service_name VARCHAR(100) NOT NULL,
    service_code VARCHAR(50) NOT NULL,
    min_weight DECIMAL(10,2) DEFAULT 0,
    max_weight DECIMAL(10,2),
    base_rate DECIMAL(10,2) NOT NULL,
    rate_per_lb DECIMAL(10,2) DEFAULT 0,
    estimated_days_min INTEGER,
    estimated_days_max INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SHIPPING LABELS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS shipping_labels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id),
    carrier_id UUID REFERENCES shipping_carriers(id),
    tracking_number VARCHAR(100),
    label_url VARCHAR(500),
    label_cost DECIMAL(10,2),
    weight DECIMAL(10,2),
    dimensions VARCHAR(100),
    from_address JSONB,
    to_address JSONB,
    status VARCHAR(30) DEFAULT 'created' CHECK (status IN ('created', 'purchased', 'voided')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ADMIN ACTIONS LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID NOT NULL,
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- EMAIL LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    email_type VARCHAR(50) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ADD NEW COLUMNS TO EXISTING TABLES
-- =====================================================

-- Add admin flag to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);

-- Add coupon to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES coupons(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);

-- Add return policy to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS return_policy VARCHAR(50) DEFAULT 'returns_accepted' CHECK (return_policy IN ('returns_accepted', 'no_returns', 'exchange_only'));
ALTER TABLE products ADD COLUMN IF NOT EXISTS return_days INTEGER DEFAULT 30;

-- =====================================================
-- NEW INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_disputes_order ON disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_returns_order ON returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);
CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON admin_actions(target_type, target_id);

-- =====================================================
-- INSERT DEFAULT SHIPPING CARRIERS
-- =====================================================
INSERT INTO shipping_carriers (name, code, tracking_url_template) VALUES
('USPS', 'usps', 'https://tools.usps.com/go/TrackConfirmAction?tLabels={tracking}'),
('UPS', 'ups', 'https://www.ups.com/track?tracknum={tracking}'),
('FedEx', 'fedex', 'https://www.fedex.com/fedextrack/?trknbr={tracking}'),
('DHL', 'dhl', 'https://www.dhl.com/en/express/tracking.html?AWB={tracking}')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- INSERT DEFAULT SHIPPING RATES
-- =====================================================
INSERT INTO shipping_rates (carrier_id, service_name, service_code, base_rate, rate_per_lb, estimated_days_min, estimated_days_max)
SELECT id, 'Ground', 'ground', 5.99, 0.50, 5, 7 FROM shipping_carriers WHERE code = 'usps'
ON CONFLICT DO NOTHING;

INSERT INTO shipping_rates (carrier_id, service_name, service_code, base_rate, rate_per_lb, estimated_days_min, estimated_days_max)
SELECT id, 'Priority Mail', 'priority', 8.99, 0.75, 2, 3 FROM shipping_carriers WHERE code = 'usps'
ON CONFLICT DO NOTHING;

INSERT INTO shipping_rates (carrier_id, service_name, service_code, base_rate, rate_per_lb, estimated_days_min, estimated_days_max)
SELECT id, 'Express', 'express', 24.99, 1.25, 1, 2 FROM shipping_carriers WHERE code = 'usps'
ON CONFLICT DO NOTHING;
