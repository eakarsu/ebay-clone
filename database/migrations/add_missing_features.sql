-- =====================================================
-- EBAY CLONE: ALL MISSING FEATURES MIGRATION
-- =====================================================
-- This migration adds 20 missing eBay features:
-- 1. Make an Offer / Best Offer
-- 2. Product Q&A
-- 3. Recently Viewed Items
-- 4. Similar Items / Recommendations
-- 5. Price Drop Alerts
-- 6. Item Collections/Lists
-- 7. Social Sharing Tracking
-- 8. Bulk Listing Templates
-- 9. Scheduled Listings
-- 10. Seller Store Pages
-- 11. Real-time Notifications (WebSocket sessions)
-- 12. Invoice Generation
-- 13. Local Pickup Option
-- 14. Multi-Currency Support
-- 15. International Shipping Rates
-- 16. Rewards/eBay Bucks Program
-- 17. Payment Plans (Buy Now Pay Later)
-- 18. Live Chat Support
-- 19. Bid Retraction
-- 20. Reserve Price (already in products, needs enhancement)
-- =====================================================

-- =====================================================
-- 1. MAKE AN OFFER / BEST OFFER SYSTEM
-- =====================================================
CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    offer_amount DECIMAL(10,2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'countered', 'expired', 'withdrawn')),
    counter_amount DECIMAL(10,2),
    counter_message TEXT,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '48 hours'),
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add best_offer fields to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS accepts_offers BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS minimum_offer_percentage INTEGER DEFAULT 70;
ALTER TABLE products ADD COLUMN IF NOT EXISTS auto_accept_price DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS auto_decline_price DECIMAL(10,2);

CREATE INDEX IF NOT EXISTS idx_offers_product ON offers(product_id);
CREATE INDEX IF NOT EXISTS idx_offers_buyer ON offers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_offers_seller ON offers(seller_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);

-- =====================================================
-- 2. PRODUCT Q&A SYSTEM
-- =====================================================
CREATE TABLE IF NOT EXISTS product_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    asker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    is_public BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'rejected')),
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES product_questions(id) ON DELETE CASCADE,
    answerer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    answer TEXT NOT NULL,
    is_seller_answer BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_product ON product_questions(product_id);
CREATE INDEX IF NOT EXISTS idx_answers_question ON product_answers(question_id);

-- =====================================================
-- 3. RECENTLY VIEWED ITEMS
-- =====================================================
CREATE TABLE IF NOT EXISTS recently_viewed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    view_count INTEGER DEFAULT 1,
    first_viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_recently_viewed_user ON recently_viewed(user_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_last ON recently_viewed(last_viewed_at DESC);

-- =====================================================
-- 4. SIMILAR ITEMS / RECOMMENDATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS product_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    recommended_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    recommendation_type VARCHAR(30) DEFAULT 'similar' CHECK (recommendation_type IN ('similar', 'frequently_bought_together', 'customers_also_viewed', 'sponsored')),
    score DECIMAL(5,4) DEFAULT 0.5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, recommended_product_id, recommendation_type)
);

CREATE TABLE IF NOT EXISTS user_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    recommendation_reason VARCHAR(50),
    score DECIMAL(5,4) DEFAULT 0.5,
    is_viewed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_product_recs ON product_recommendations(product_id);
CREATE INDEX IF NOT EXISTS idx_user_recs ON user_recommendations(user_id);

-- =====================================================
-- 5. PRICE DROP ALERTS
-- =====================================================
CREATE TABLE IF NOT EXISTS price_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    target_price DECIMAL(10,2),
    alert_on_any_drop BOOLEAN DEFAULT true,
    percentage_drop INTEGER,
    is_active BOOLEAN DEFAULT true,
    last_notified_at TIMESTAMP WITH TIME ZONE,
    last_notified_price DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL,
    price_type VARCHAR(20) DEFAULT 'buy_now' CHECK (price_type IN ('buy_now', 'starting', 'current_bid', 'reserve')),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_product ON price_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_id);

-- =====================================================
-- 6. ITEM COLLECTIONS / LISTS
-- =====================================================
CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    cover_image_url TEXT,
    item_count INTEGER DEFAULT 0,
    follower_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collection_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    notes TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(collection_id, product_id)
);

CREATE TABLE IF NOT EXISTS collection_followers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    followed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(collection_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_collections_user ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_items ON collection_items(collection_id);

-- =====================================================
-- 7. SOCIAL SHARING TRACKING
-- =====================================================
CREATE TABLE IF NOT EXISTS social_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    platform VARCHAR(30) NOT NULL CHECK (platform IN ('facebook', 'twitter', 'pinterest', 'linkedin', 'whatsapp', 'email', 'copy_link')),
    share_url TEXT,
    click_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add share counts to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_social_shares_product ON social_shares(product_id);

-- =====================================================
-- 8. BULK LISTING TEMPLATES
-- =====================================================
CREATE TABLE IF NOT EXISTS listing_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    category_id UUID REFERENCES categories(id),
    template_data JSONB NOT NULL,
    is_default BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bulk_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    total_rows INTEGER DEFAULT 0,
    processed_rows INTEGER DEFAULT 0,
    successful_rows INTEGER DEFAULT 0,
    failed_rows INTEGER DEFAULT 0,
    error_log JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_templates_user ON listing_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_bulk_uploads_user ON bulk_uploads(user_id);

-- =====================================================
-- 9. SCHEDULED LISTINGS
-- =====================================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS scheduled_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS scheduled_end TIMESTAMP WITH TIME ZONE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS scheduled_listing_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('scheduled', 'published', 'ended', 'cancelled')),
    scheduled_for TIMESTAMP WITH TIME ZONE,
    executed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 10. SELLER STORE PAGES
-- =====================================================
CREATE TABLE IF NOT EXISTS seller_stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    store_name VARCHAR(100) NOT NULL,
    store_slug VARCHAR(100) UNIQUE,
    tagline VARCHAR(200),
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    theme_color VARCHAR(7) DEFAULT '#3665f3',
    custom_css TEXT,
    policies TEXT,
    about_html TEXT,
    social_links JSONB DEFAULT '{}',
    is_verified BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    subscriber_count INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS store_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES seller_stores(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    product_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS store_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES seller_stores(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(store_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_stores_slug ON seller_stores(store_slug);
CREATE INDEX IF NOT EXISTS idx_store_categories ON store_categories(store_id);

-- =====================================================
-- 11. REAL-TIME NOTIFICATIONS (WebSocket Sessions)
-- =====================================================
CREATE TABLE IF NOT EXISTS websocket_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    device_info JSONB,
    ip_address INET,
    is_active BOOLEAN DEFAULT true,
    last_ping_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    disconnected_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    bid_outbid BOOLEAN DEFAULT true,
    bid_won BOOLEAN DEFAULT true,
    auction_ending BOOLEAN DEFAULT true,
    item_sold BOOLEAN DEFAULT true,
    order_updates BOOLEAN DEFAULT true,
    messages BOOLEAN DEFAULT true,
    price_drops BOOLEAN DEFAULT true,
    promotions BOOLEAN DEFAULT false,
    newsletter BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ws_sessions_user ON websocket_sessions(user_id);

-- =====================================================
-- 12. INVOICE GENERATION
-- =====================================================
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    buyer_id UUID NOT NULL REFERENCES users(id),
    seller_id UUID NOT NULL REFERENCES users(id),
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    shipping_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'issued' CHECK (status IN ('draft', 'issued', 'paid', 'overdue', 'cancelled', 'refunded')),
    due_date DATE,
    paid_at TIMESTAMP WITH TIME ZONE,
    pdf_url TEXT,
    notes TEXT,
    billing_address JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_order ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_buyer ON invoices(buyer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_seller ON invoices(seller_id);

-- =====================================================
-- 13. LOCAL PICKUP OPTION
-- =====================================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS allows_local_pickup BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS pickup_location_city VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS pickup_location_state VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS pickup_location_zip VARCHAR(20);
ALTER TABLE products ADD COLUMN IF NOT EXISTS pickup_instructions TEXT;

CREATE TABLE IF NOT EXISTS pickup_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES users(id),
    seller_id UUID NOT NULL REFERENCES users(id),
    scheduled_date DATE NOT NULL,
    scheduled_time_start TIME,
    scheduled_time_end TIME,
    location_address TEXT,
    location_notes TEXT,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
    confirmation_code VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pickup_order ON pickup_appointments(order_id);

-- =====================================================
-- 14. MULTI-CURRENCY SUPPORT
-- =====================================================
CREATE TABLE IF NOT EXISTS currencies (
    code VARCHAR(3) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    symbol VARCHAR(5) NOT NULL,
    decimal_places INTEGER DEFAULT 2,
    exchange_rate_to_usd DECIMAL(15,6) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT true,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_currency_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    preferred_currency VARCHAR(3) DEFAULT 'USD' REFERENCES currencies(code),
    display_converted_prices BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_usd DECIMAL(10,2);

-- =====================================================
-- 15. INTERNATIONAL SHIPPING RATES
-- =====================================================
CREATE TABLE IF NOT EXISTS shipping_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    countries TEXT[] NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS international_shipping_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
    zone_id UUID NOT NULL REFERENCES shipping_zones(id) ON DELETE CASCADE,
    service_name VARCHAR(100) NOT NULL,
    base_rate DECIMAL(10,2) NOT NULL,
    per_pound_rate DECIMAL(10,2) DEFAULT 0,
    estimated_days_min INTEGER,
    estimated_days_max INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS ships_internationally BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS international_shipping_cost DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS excluded_countries TEXT[];

CREATE INDEX IF NOT EXISTS idx_intl_rates_seller ON international_shipping_rates(seller_id);
CREATE INDEX IF NOT EXISTS idx_intl_rates_zone ON international_shipping_rates(zone_id);

-- =====================================================
-- 16. REWARDS / EBAY BUCKS PROGRAM
-- =====================================================
CREATE TABLE IF NOT EXISTS rewards_program (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    tier VARCHAR(20) DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
    total_points INTEGER DEFAULT 0,
    available_points INTEGER DEFAULT 0,
    lifetime_points INTEGER DEFAULT 0,
    points_expiring_soon INTEGER DEFAULT 0,
    expiring_date DATE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tier_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rewards_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'expired', 'bonus', 'adjustment')),
    points INTEGER NOT NULL,
    description TEXT,
    expires_at DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rewards_tiers (
    tier VARCHAR(20) PRIMARY KEY,
    min_points INTEGER NOT NULL,
    earn_rate DECIMAL(5,4) DEFAULT 0.01,
    bonus_multiplier DECIMAL(3,2) DEFAULT 1.0,
    perks JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rewards_user ON rewards_program(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_trans_user ON rewards_transactions(user_id);

-- =====================================================
-- 17. PAYMENT PLANS (Buy Now Pay Later)
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('pay_in_4', 'pay_monthly', 'pay_in_6')),
    total_amount DECIMAL(10,2) NOT NULL,
    installment_amount DECIMAL(10,2) NOT NULL,
    installments_total INTEGER NOT NULL,
    installments_paid INTEGER DEFAULT 0,
    interest_rate DECIMAL(5,4) DEFAULT 0,
    next_payment_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'defaulted', 'cancelled')),
    provider VARCHAR(50),
    external_plan_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_plan_installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES payment_plans(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'failed')),
    payment_method_id UUID REFERENCES payment_methods(id),
    transaction_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_plans_order ON payment_plans(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_user ON payment_plans(user_id);

-- =====================================================
-- 18. LIVE CHAT SUPPORT
-- =====================================================
CREATE TABLE IF NOT EXISTS support_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES users(id),
    subject VARCHAR(200),
    category VARCHAR(50) CHECK (category IN ('order', 'payment', 'shipping', 'return', 'account', 'technical', 'other')),
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'resolved', 'closed')),
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES support_chats(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    attachment_url TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(100),
    department VARCHAR(50),
    is_available BOOLEAN DEFAULT false,
    max_concurrent_chats INTEGER DEFAULT 5,
    current_chat_count INTEGER DEFAULT 0,
    total_chats_handled INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_chats_user ON support_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_chat ON support_chat_messages(chat_id);

-- =====================================================
-- 19. BID RETRACTION
-- =====================================================
CREATE TABLE IF NOT EXISTS bid_retractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bid_id UUID NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    original_amount DECIMAL(10,2) NOT NULL,
    reason VARCHAR(50) NOT NULL CHECK (reason IN ('entered_wrong_amount', 'seller_changed_description', 'cannot_contact_seller', 'other')),
    explanation TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add retracted flag to bids
ALTER TABLE bids ADD COLUMN IF NOT EXISTS is_retracted BOOLEAN DEFAULT false;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS retracted_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_bid_retractions_user ON bid_retractions(user_id);
CREATE INDEX IF NOT EXISTS idx_bid_retractions_product ON bid_retractions(product_id);

-- =====================================================
-- 20. RESERVE PRICE ENHANCEMENTS
-- =====================================================
-- Already exists but add tracking
ALTER TABLE products ADD COLUMN IF NOT EXISTS reserve_met BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reserve_price_hidden BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS show_reserve_not_met BOOLEAN DEFAULT true;

CREATE TABLE IF NOT EXISTS reserve_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    previous_reserve DECIMAL(10,2),
    new_reserve DECIMAL(10,2),
    reason TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Create indexes for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_products_accepts_offers ON products(accepts_offers) WHERE accepts_offers = true;
CREATE INDEX IF NOT EXISTS idx_products_scheduled ON products(is_scheduled, scheduled_start) WHERE is_scheduled = true;
CREATE INDEX IF NOT EXISTS idx_products_local_pickup ON products(allows_local_pickup) WHERE allows_local_pickup = true;
CREATE INDEX IF NOT EXISTS idx_products_intl_shipping ON products(ships_internationally) WHERE ships_internationally = true;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'ALL 20 FEATURES MIGRATION COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  - offers (Make an Offer)';
    RAISE NOTICE '  - product_questions, product_answers (Q&A)';
    RAISE NOTICE '  - recently_viewed (Recently Viewed)';
    RAISE NOTICE '  - product_recommendations, user_recommendations (Similar Items)';
    RAISE NOTICE '  - price_alerts, price_history (Price Alerts)';
    RAISE NOTICE '  - collections, collection_items, collection_followers (Collections)';
    RAISE NOTICE '  - social_shares (Social Sharing)';
    RAISE NOTICE '  - listing_templates, bulk_uploads (Bulk Upload)';
    RAISE NOTICE '  - scheduled_listing_log (Scheduled Listings)';
    RAISE NOTICE '  - seller_stores, store_categories, store_subscribers (Store Pages)';
    RAISE NOTICE '  - websocket_sessions, notification_preferences (Real-time)';
    RAISE NOTICE '  - invoices (Invoice Generation)';
    RAISE NOTICE '  - pickup_appointments (Local Pickup)';
    RAISE NOTICE '  - currencies, user_currency_preferences (Multi-Currency)';
    RAISE NOTICE '  - shipping_zones, international_shipping_rates (Intl Shipping)';
    RAISE NOTICE '  - rewards_program, rewards_transactions, rewards_tiers (Rewards)';
    RAISE NOTICE '  - payment_plans, payment_plan_installments (Payment Plans)';
    RAISE NOTICE '  - support_chats, support_chat_messages, support_agents (Live Chat)';
    RAISE NOTICE '  - bid_retractions (Bid Retraction)';
    RAISE NOTICE '  - reserve_price_history (Reserve Price)';
    RAISE NOTICE '=====================================================';
END $$;
