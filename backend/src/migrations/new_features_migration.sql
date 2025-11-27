-- Migration for all new eBay features
-- Run this SQL to add all new tables

-- ============================================
-- 1. GLOBAL SHIPPING PROGRAM (GSP)
-- ============================================

CREATE TABLE IF NOT EXISTS gsp_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES users(id),
  buyer_id UUID REFERENCES users(id),

  -- Domestic shipping to hub
  domestic_tracking_number VARCHAR(100),
  domestic_carrier VARCHAR(50),
  domestic_shipped_at TIMESTAMP,
  domestic_received_at TIMESTAMP,
  hub_location VARCHAR(100) DEFAULT 'Kentucky, USA',

  -- International shipping from hub
  international_tracking_number VARCHAR(100),
  international_carrier VARCHAR(50),
  international_shipped_at TIMESTAMP,
  delivered_at TIMESTAMP,

  -- Customs & Duties
  customs_value DECIMAL(10,2),
  import_duties DECIMAL(10,2) DEFAULT 0,
  import_taxes DECIMAL(10,2) DEFAULT 0,
  customs_cleared BOOLEAN DEFAULT false,
  customs_cleared_at TIMESTAMP,

  -- Destination
  destination_country VARCHAR(100),
  destination_address JSONB,

  status VARCHAR(50) DEFAULT 'pending',
  -- pending, shipped_to_hub, at_hub, customs_processing, shipped_international, delivered

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gsp_countries (
  id SERIAL PRIMARY KEY,
  country_code VARCHAR(3) NOT NULL UNIQUE,
  country_name VARCHAR(100) NOT NULL,
  is_supported BOOLEAN DEFAULT true,
  base_shipping_rate DECIMAL(10,2),
  estimated_days_min INT,
  estimated_days_max INT,
  duty_rate_percent DECIMAL(5,2) DEFAULT 0,
  tax_rate_percent DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. EBAY MOTORS
-- ============================================

CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES users(id),

  -- Vehicle Info
  vin VARCHAR(17) UNIQUE,
  year INT,
  make VARCHAR(100),
  model VARCHAR(100),
  trim_level VARCHAR(100),
  body_type VARCHAR(50), -- sedan, suv, truck, coupe, etc.

  -- Engine & Performance
  engine_type VARCHAR(100),
  engine_size VARCHAR(50),
  fuel_type VARCHAR(50), -- gasoline, diesel, electric, hybrid
  transmission VARCHAR(50), -- automatic, manual, cvt
  drivetrain VARCHAR(50), -- fwd, rwd, awd, 4wd
  horsepower INT,

  -- Condition
  mileage INT,
  exterior_color VARCHAR(50),
  interior_color VARCHAR(50),
  num_owners INT,
  accident_history BOOLEAN DEFAULT false,
  title_status VARCHAR(50) DEFAULT 'clean', -- clean, salvage, rebuilt, lemon

  -- History
  vehicle_history_report_url VARCHAR(500),
  inspection_report JSONB,
  inspection_date DATE,

  -- Features
  features JSONB, -- array of features like sunroof, leather seats, etc.

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicle_parts_compatibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,

  -- Compatible vehicles
  year_from INT,
  year_to INT,
  make VARCHAR(100),
  model VARCHAR(100),
  trim_level VARCHAR(100),
  engine VARCHAR(100),
  submodel VARCHAR(100),

  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicle_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,

  inspector_name VARCHAR(200),
  inspection_location VARCHAR(500),
  inspection_date DATE,

  -- Inspection Results
  overall_condition VARCHAR(50), -- excellent, good, fair, poor
  exterior_rating INT, -- 1-10
  interior_rating INT, -- 1-10
  mechanical_rating INT, -- 1-10

  -- Detailed findings
  findings JSONB,
  photos JSONB,

  passed BOOLEAN,
  report_url VARCHAR(500),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. AUTHENTICITY GUARANTEE
-- ============================================

CREATE TABLE IF NOT EXISTS authenticity_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  seller_id UUID REFERENCES users(id),
  buyer_id UUID REFERENCES users(id),

  -- Item details
  item_category VARCHAR(100), -- watches, sneakers, handbags, jewelry
  brand VARCHAR(100),
  model VARCHAR(200),
  declared_value DECIMAL(10,2),

  -- Authentication center
  auth_center_location VARCHAR(200),
  received_at_center TIMESTAMP,

  -- Inspection
  authenticator_id VARCHAR(100),
  authenticator_name VARCHAR(200),
  inspection_date TIMESTAMP,
  inspection_notes TEXT,
  photos_taken JSONB,

  -- Result
  is_authentic BOOLEAN,
  authenticity_score INT, -- 0-100
  certificate_number VARCHAR(100) UNIQUE,
  certificate_url VARCHAR(500),
  nfc_tag_id VARCHAR(100),

  -- Issues found
  issues_found JSONB,
  rejection_reason TEXT,

  status VARCHAR(50) DEFAULT 'pending',
  -- pending, shipped_to_center, inspecting, authenticated, rejected, shipped_to_buyer

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS authenticity_categories (
  id SERIAL PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL,
  min_value_threshold DECIMAL(10,2) DEFAULT 0,
  is_mandatory BOOLEAN DEFAULT false,
  inspection_fee DECIMAL(10,2) DEFAULT 0,
  brands_covered JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. SELLER PERFORMANCE STANDARDS
-- ============================================

CREATE TABLE IF NOT EXISTS seller_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,

  -- Performance Metrics (last 12 months)
  total_transactions INT DEFAULT 0,
  defect_count INT DEFAULT 0,
  defect_rate DECIMAL(5,4) DEFAULT 0, -- e.g., 0.0123 = 1.23%

  late_shipment_count INT DEFAULT 0,
  late_shipment_rate DECIMAL(5,4) DEFAULT 0,

  cases_closed_without_resolution INT DEFAULT 0,
  case_rate DECIMAL(5,4) DEFAULT 0,

  tracking_uploaded_count INT DEFAULT 0,
  tracking_uploaded_rate DECIMAL(5,4) DEFAULT 0,

  -- Feedback
  positive_feedback_count INT DEFAULT 0,
  negative_feedback_count INT DEFAULT 0,
  neutral_feedback_count INT DEFAULT 0,
  feedback_score DECIMAL(5,2) DEFAULT 100, -- percentage

  -- Status
  seller_level VARCHAR(50) DEFAULT 'standard',
  -- below_standard, standard, above_standard, top_rated, top_rated_plus

  top_rated_since DATE,
  below_standard_since DATE,

  -- Benefits
  final_value_fee_discount DECIMAL(5,2) DEFAULT 0, -- percentage
  promoted_listing_discount DECIMAL(5,2) DEFAULT 0,

  -- Restrictions (for below standard)
  selling_restricted BOOLEAN DEFAULT false,
  listing_limit INT,

  evaluation_date DATE,
  next_evaluation_date DATE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS seller_defects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),

  defect_type VARCHAR(50) NOT NULL,
  -- item_not_as_described, item_not_received, late_shipment, cancelled_transaction

  description TEXT,
  defect_date DATE,

  -- Resolution
  resolved BOOLEAN DEFAULT false,
  resolved_date DATE,
  resolution_notes TEXT,

  -- Impact
  counts_toward_rate BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. PROXY/AUTOMATIC BIDDING
-- ============================================

CREATE TABLE IF NOT EXISTS proxy_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  bidder_id UUID REFERENCES users(id) ON DELETE CASCADE,

  max_bid_amount DECIMAL(10,2) NOT NULL,
  current_proxy_bid DECIMAL(10,2), -- What system has bid on their behalf

  is_active BOOLEAN DEFAULT true,
  is_winning BOOLEAN DEFAULT false,

  outbid_notifications BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(product_id, bidder_id)
);

CREATE TABLE IF NOT EXISTS bid_increments (
  id SERIAL PRIMARY KEY,
  price_from DECIMAL(10,2) NOT NULL,
  price_to DECIMAL(10,2),
  increment_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 6. AUCTION HYBRID (Buy It Now + Auction)
-- ============================================

-- Adding columns to products table via ALTER
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_buy_now BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS buy_now_removed BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS buy_now_removed_at TIMESTAMP;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reserve_price DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS reserve_met BOOLEAN DEFAULT false;

-- ============================================
-- 7. EBAY PLUS MEMBERSHIP
-- ============================================

CREATE TABLE IF NOT EXISTS membership_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  monthly_price DECIMAL(10,2),
  annual_price DECIMAL(10,2),

  -- Benefits
  free_shipping BOOLEAN DEFAULT false,
  free_returns BOOLEAN DEFAULT false,
  extended_returns_days INT DEFAULT 30,
  exclusive_deals BOOLEAN DEFAULT false,
  priority_support BOOLEAN DEFAULT false,
  early_access BOOLEAN DEFAULT false,
  cashback_percent DECIMAL(5,2) DEFAULT 0,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id INT REFERENCES membership_plans(id),

  status VARCHAR(50) DEFAULT 'active', -- active, cancelled, expired, paused
  billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly, annual

  start_date DATE NOT NULL,
  end_date DATE,
  next_billing_date DATE,

  -- Payment
  payment_method_id UUID,
  auto_renew BOOLEAN DEFAULT true,

  -- Usage tracking
  free_shipping_used_count INT DEFAULT 0,
  returns_used_count INT DEFAULT 0,

  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS membership_exclusive_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,

  discount_type VARCHAR(20), -- percentage, fixed
  discount_value DECIMAL(10,2),

  product_id UUID REFERENCES products(id),
  category_id INT,

  start_date TIMESTAMP,
  end_date TIMESTAMP,

  max_uses INT,
  current_uses INT DEFAULT 0,

  membership_required BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 8. LOCAL PICKUP
-- ============================================

CREATE TABLE IF NOT EXISTS local_pickup_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE UNIQUE,
  seller_id UUID REFERENCES users(id),

  offers_local_pickup BOOLEAN DEFAULT false,
  pickup_only BOOLEAN DEFAULT false, -- No shipping option

  -- Location
  pickup_address JSONB,
  pickup_city VARCHAR(100),
  pickup_state VARCHAR(100),
  pickup_zip VARCHAR(20),
  pickup_country VARCHAR(100) DEFAULT 'US',
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),

  -- Availability
  available_days JSONB, -- ["monday", "tuesday", etc.]
  available_hours JSONB, -- {"start": "09:00", "end": "17:00"}

  -- Instructions
  pickup_instructions TEXT,
  contact_phone VARCHAR(20),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_pickup_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  seller_id UUID REFERENCES users(id),
  buyer_id UUID REFERENCES users(id),

  scheduled_date DATE,
  scheduled_time TIME,

  status VARCHAR(50) DEFAULT 'pending',
  -- pending, confirmed, completed, cancelled, no_show

  seller_confirmed BOOLEAN DEFAULT false,
  buyer_confirmed BOOLEAN DEFAULT false,

  pickup_code VARCHAR(10), -- Code buyer shows seller

  completed_at TIMESTAMP,
  notes TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 9. REAL-TIME NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS notification_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- What to subscribe to
  entity_type VARCHAR(50) NOT NULL, -- product, auction, order, user
  entity_id UUID NOT NULL,

  -- Notification types
  notify_on_bid BOOLEAN DEFAULT true,
  notify_on_outbid BOOLEAN DEFAULT true,
  notify_on_price_change BOOLEAN DEFAULT true,
  notify_on_ending_soon BOOLEAN DEFAULT true,
  notify_on_sold BOOLEAN DEFAULT true,

  -- Delivery preferences
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT false,
  sms_enabled BOOLEAN DEFAULT false,

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, entity_type, entity_id)
);

CREATE TABLE IF NOT EXISTS websocket_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  connection_id VARCHAR(200) NOT NULL,

  connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_ping TIMESTAMP,

  device_type VARCHAR(50),
  ip_address VARCHAR(50),

  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS auction_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,

  event_type VARCHAR(50) NOT NULL,
  -- new_bid, outbid, reserve_met, ending_soon, ended, buy_now_removed

  event_data JSONB,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 10. BEST MATCH ALGORITHM SUPPORT
-- ============================================

CREATE TABLE IF NOT EXISTS product_quality_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE UNIQUE,

  -- Listing Quality
  title_quality_score INT DEFAULT 50, -- 0-100
  description_quality_score INT DEFAULT 50,
  image_quality_score INT DEFAULT 50,
  item_specifics_score INT DEFAULT 50,

  -- Seller Performance
  seller_rating_score INT DEFAULT 50,
  seller_history_score INT DEFAULT 50,

  -- Price Competitiveness
  price_score INT DEFAULT 50,
  shipping_score INT DEFAULT 50,

  -- Engagement
  click_through_rate DECIMAL(5,4) DEFAULT 0,
  conversion_rate DECIMAL(5,4) DEFAULT 0,

  -- Overall
  best_match_score INT DEFAULT 50, -- Calculated composite score

  last_calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS search_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),

  search_query VARCHAR(500),
  position_shown INT,

  clicked BOOLEAN DEFAULT false,
  clicked_at TIMESTAMP,

  purchased BOOLEAN DEFAULT false,
  purchased_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_gsp_shipments_status ON gsp_shipments(status);
CREATE INDEX IF NOT EXISTS idx_gsp_shipments_order ON gsp_shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_vin ON vehicles(vin);
CREATE INDEX IF NOT EXISTS idx_vehicles_make_model ON vehicles(make, model, year);
CREATE INDEX IF NOT EXISTS idx_parts_compatibility ON vehicle_parts_compatibility(make, model, year_from, year_to);
CREATE INDEX IF NOT EXISTS idx_authenticity_status ON authenticity_requests(status);
CREATE INDEX IF NOT EXISTS idx_seller_performance_level ON seller_performance(seller_level);
CREATE INDEX IF NOT EXISTS idx_proxy_bids_product ON proxy_bids(product_id);
CREATE INDEX IF NOT EXISTS idx_proxy_bids_active ON proxy_bids(is_active);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON user_memberships(status);
CREATE INDEX IF NOT EXISTS idx_local_pickup_location ON local_pickup_settings(pickup_zip);
CREATE INDEX IF NOT EXISTS idx_notification_subs ON notification_subscriptions(user_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_product_quality ON product_quality_scores(best_match_score DESC);
CREATE INDEX IF NOT EXISTS idx_search_impressions ON search_impressions(product_id, created_at);
