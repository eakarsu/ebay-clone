-- Security Features Migration
-- 5 tables: security_audit_logs, token_blacklist, error_logs, password_policies, validation_rules

-- 1. Security Audit Logs
CREATE TABLE IF NOT EXISTS security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical')),
    source_ip VARCHAR(45),
    user_agent TEXT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    request_url TEXT,
    header_name VARCHAR(255),
    blocked BOOLEAN DEFAULT false,
    resolved BOOLEAN DEFAULT false,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_security_audit_event_type ON security_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_severity ON security_audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_security_audit_created ON security_audit_logs(created_at DESC);

-- 2. Token Blacklist
CREATE TABLE IF NOT EXISTS token_blacklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(50) NOT NULL DEFAULT 'logout' CHECK (reason IN ('logout', 'password_change', 'security_revoke', 'session_expired', 'admin_action')),
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_token_blacklist_hash ON token_blacklist(token_hash);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at);

-- 3. Error Logs
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_type VARCHAR(100) NOT NULL,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    component_name VARCHAR(255),
    page_url TEXT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    browser_info JSONB DEFAULT '{}',
    severity VARCHAR(20) NOT NULL DEFAULT 'error' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    is_resolved BOOLEAN DEFAULT false,
    occurrence_count INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(is_resolved);

-- 4. Password Policies
CREATE TABLE IF NOT EXISTS password_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    min_length INTEGER NOT NULL DEFAULT 8,
    max_length INTEGER DEFAULT 128,
    require_uppercase BOOLEAN DEFAULT true,
    require_lowercase BOOLEAN DEFAULT true,
    require_number BOOLEAN DEFAULT true,
    require_special_char BOOLEAN DEFAULT true,
    max_age_days INTEGER DEFAULT 90,
    password_history_count INTEGER DEFAULT 5,
    applies_to VARCHAR(20) NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all', 'admin', 'seller', 'buyer')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Validation Rules
CREATE TABLE IF NOT EXISTS validation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_path VARCHAR(255) NOT NULL,
    http_method VARCHAR(10) NOT NULL CHECK (http_method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),
    field_name VARCHAR(100) NOT NULL,
    field_location VARCHAR(20) NOT NULL DEFAULT 'body' CHECK (field_location IN ('body', 'query', 'params', 'headers')),
    validation_type VARCHAR(50) NOT NULL,
    validation_params JSONB DEFAULT '{}',
    error_message VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_validation_rules_route ON validation_rules(route_path, http_method);
