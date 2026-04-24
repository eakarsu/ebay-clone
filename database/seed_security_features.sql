-- Seed Security Features Data (15+ rows per table)

DO $$
DECLARE
    v_buyer_id UUID;
    v_seller_id UUID;
    v_admin_id UUID;
BEGIN
    SELECT id INTO v_buyer_id FROM users WHERE email = 'buyer@ebay.com' LIMIT 1;
    SELECT id INTO v_seller_id FROM users WHERE email = 'seller@ebay.com' LIMIT 1;
    SELECT id INTO v_admin_id FROM users WHERE email = 'admin@ebay.com' LIMIT 1;

    -- 1. Security Audit Logs (20 rows)
    INSERT INTO security_audit_logs (event_type, severity, source_ip, user_agent, user_id, request_url, header_name, blocked, resolved, details) VALUES
    ('helmet_header_set', 'info', '192.168.1.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', v_admin_id, '/api/products', 'X-Content-Type-Options', false, true, '{"header_value": "nosniff"}'),
    ('helmet_header_set', 'info', '192.168.1.2', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', v_buyer_id, '/api/auth/login', 'X-Frame-Options', false, true, '{"header_value": "SAMEORIGIN"}'),
    ('csp_violation', 'high', '10.0.0.15', 'Mozilla/5.0 (Linux; Android 12)', NULL, '/api/products/images', 'Content-Security-Policy', true, false, '{"violated_directive": "img-src", "blocked_uri": "https://malicious-site.com/image.png"}'),
    ('xss_attempt', 'critical', '203.0.113.50', 'curl/7.88.1', NULL, '/api/reviews', NULL, true, false, '{"payload": "<script>alert(1)</script>", "field": "comment"}'),
    ('brute_force_attempt', 'high', '198.51.100.42', 'Python-urllib/3.10', NULL, '/api/auth/login', NULL, true, false, '{"attempts": 15, "timeframe_minutes": 5, "target_email": "admin@ebay.com"}'),
    ('token_expired', 'low', '172.16.0.100', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', v_buyer_id, '/api/orders', 'Authorization', false, true, '{"token_age_hours": 168}'),
    ('unauthorized_access', 'medium', '10.0.0.25', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', v_buyer_id, '/api/admin/users', NULL, true, true, '{"reason": "non-admin user attempted admin route"}'),
    ('rate_limit_exceeded', 'medium', '203.0.113.100', 'axios/1.6.0', v_seller_id, '/api/products', NULL, true, false, '{"requests_per_minute": 150, "limit": 100}'),
    ('cors_violation', 'high', '10.0.0.50', 'Mozilla/5.0 (Windows NT 10.0)', NULL, '/api/auth/register', 'Origin', true, true, '{"origin": "https://phishing-site.com", "allowed_origins": ["http://localhost:3000"]}'),
    ('sql_injection_attempt', 'critical', '198.51.100.99', 'sqlmap/1.7', NULL, '/api/products?search=', NULL, true, false, '{"payload": "1 OR 1=1; DROP TABLE users;--", "field": "search"}'),
    ('password_changed', 'info', '192.168.1.10', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', v_seller_id, '/api/auth/change-password', NULL, false, true, '{"method": "user_initiated"}'),
    ('two_factor_enabled', 'info', '192.168.1.10', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', v_admin_id, '/api/auth/2fa/verify', NULL, false, true, '{"method": "totp"}'),
    ('suspicious_login', 'high', '45.33.32.156', 'Mozilla/5.0 (Linux; Android 11)', v_buyer_id, '/api/auth/login', NULL, false, false, '{"reason": "login from new location", "country": "RU", "usual_country": "US"}'),
    ('file_upload_blocked', 'medium', '192.168.1.5', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', v_seller_id, '/api/upload/single', 'Content-Type', true, true, '{"file_type": "application/x-executable", "allowed_types": ["image/jpeg", "image/png"]}'),
    ('api_key_exposed', 'critical', '10.0.0.1', 'GitGuardian/1.0', v_admin_id, '/api/health', NULL, false, false, '{"key_prefix": "sk_live_", "source": "git_commit"}'),
    ('helmet_csp_report', 'medium', '192.168.1.20', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', v_buyer_id, '/csp-report', 'Content-Security-Policy-Report-Only', false, false, '{"document_uri": "http://localhost:3000", "violated_directive": "script-src"}'),
    ('session_hijack_attempt', 'critical', '198.51.100.200', 'curl/8.0.1', NULL, '/api/auth/profile', 'Authorization', true, false, '{"reason": "token used from different IP than issued"}'),
    ('permission_escalation', 'high', '10.0.0.30', 'Mozilla/5.0 (X11; Linux x86_64)', v_buyer_id, '/api/admin/settings', NULL, true, true, '{"attempted_role": "admin", "current_role": "buyer"}'),
    ('data_export_request', 'info', '192.168.1.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', v_admin_id, '/api/admin/export', NULL, false, true, '{"export_type": "users", "format": "csv", "record_count": 500}'),
    ('helmet_hsts_set', 'info', '192.168.1.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', NULL, '/api/products', 'Strict-Transport-Security', false, true, '{"max_age": 31536000, "includeSubDomains": true}')
    ON CONFLICT DO NOTHING;

    -- 2. Token Blacklist (16 rows)
    INSERT INTO token_blacklist (token_hash, user_id, reason, ip_address, user_agent, expires_at) VALUES
    ('a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2', v_buyer_id, 'logout', '192.168.1.1', 'Mozilla/5.0 (Macintosh)', NOW() + INTERVAL '7 days'),
    ('b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3', v_seller_id, 'logout', '192.168.1.2', 'Mozilla/5.0 (Windows)', NOW() + INTERVAL '7 days'),
    ('c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4', v_admin_id, 'password_change', '192.168.1.3', 'Mozilla/5.0 (Linux)', NOW() + INTERVAL '7 days'),
    ('d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5', v_buyer_id, 'security_revoke', '10.0.0.50', 'curl/7.88.1', NOW() + INTERVAL '3 days'),
    ('e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6', v_seller_id, 'session_expired', '172.16.0.1', 'Mozilla/5.0 (iPhone)', NOW() - INTERVAL '1 day'),
    ('f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1', v_admin_id, 'admin_action', '192.168.1.1', 'Mozilla/5.0 (Macintosh)', NOW() + INTERVAL '30 days'),
    ('1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b', v_buyer_id, 'logout', '192.168.1.10', 'Mozilla/5.0 (Android)', NOW() + INTERVAL '5 days'),
    ('2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c', v_seller_id, 'password_change', '192.168.1.20', 'Mozilla/5.0 (iPad)', NOW() + INTERVAL '7 days'),
    ('3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d', v_buyer_id, 'security_revoke', '203.0.113.1', 'Python-urllib/3.10', NOW() - INTERVAL '2 days'),
    ('4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e', v_admin_id, 'logout', '10.0.0.1', 'Mozilla/5.0 (Macintosh)', NOW() + INTERVAL '6 days'),
    ('5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f', v_seller_id, 'session_expired', '192.168.1.30', 'Mozilla/5.0 (Chrome OS)', NOW() - INTERVAL '3 days'),
    ('6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a', v_buyer_id, 'admin_action', '192.168.1.1', 'Mozilla/5.0 (Macintosh)', NOW() + INTERVAL '14 days'),
    ('7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b', v_admin_id, 'security_revoke', '198.51.100.42', 'sqlmap/1.7', NOW() + INTERVAL '1 day'),
    ('8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c', v_seller_id, 'logout', '172.16.0.100', 'Mozilla/5.0 (Linux)', NOW() + INTERVAL '4 days'),
    ('9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d', v_buyer_id, 'password_change', '192.168.1.40', 'Mozilla/5.0 (Windows)', NOW() + INTERVAL '7 days'),
    ('0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e', v_admin_id, 'logout', '10.0.0.100', 'Mozilla/5.0 (Macintosh)', NOW() + INTERVAL '2 days')
    ON CONFLICT (token_hash) DO NOTHING;

    -- 3. Error Logs (18 rows)
    INSERT INTO error_logs (error_type, error_message, error_stack, component_name, page_url, user_id, browser_info, severity, is_resolved, occurrence_count) VALUES
    ('TypeError', 'Cannot read properties of undefined (reading ''map'')', 'TypeError: Cannot read properties of undefined\n    at ProductList (ProductList.js:45)\n    at renderWithHooks', 'ProductList', '/search?q=electronics', v_buyer_id, '{"browser": "Chrome", "version": "120.0", "os": "macOS 14.2"}', 'error', false, 12),
    ('NetworkError', 'Failed to fetch', 'Error: Failed to fetch\n    at api.js:28\n    at async fetchProducts', 'ProductDetail', '/product/abc-123', v_buyer_id, '{"browser": "Firefox", "version": "121.0", "os": "Windows 11"}', 'error', true, 5),
    ('ReferenceError', 'cartItems is not defined', 'ReferenceError: cartItems is not defined\n    at Cart.js:22\n    at renderWithHooks', 'Cart', '/cart', v_seller_id, '{"browser": "Safari", "version": "17.2", "os": "macOS 14.2"}', 'error', true, 3),
    ('ChunkLoadError', 'Loading chunk 5 failed', 'ChunkLoadError: Loading chunk 5 failed\n    at webpack_require', 'LazyRoute', '/seller/dashboard', v_seller_id, '{"browser": "Chrome", "version": "119.0", "os": "Android 14"}', 'warning', false, 8),
    ('SyntaxError', 'Unexpected token < in JSON at position 0', 'SyntaxError: Unexpected token <\n    at JSON.parse\n    at api.js:15', 'OrderDetail', '/orders/xyz-789', v_buyer_id, '{"browser": "Edge", "version": "120.0", "os": "Windows 11"}', 'error', false, 15),
    ('RangeError', 'Maximum call stack size exceeded', 'RangeError: Maximum call stack size exceeded\n    at useEffect (Notifications.js:18)', 'Notifications', '/notifications', v_admin_id, '{"browser": "Chrome", "version": "120.0", "os": "macOS 14.2"}', 'critical', false, 2),
    ('TypeError', 'Cannot destructure property ''user'' of undefined', 'TypeError: Cannot destructure property\n    at AuthContext.js:45', 'AuthProvider', '/login', NULL, '{"browser": "Chrome", "version": "120.0", "os": "Linux"}', 'error', true, 7),
    ('UnhandledRejection', 'Request failed with status code 500', 'Error: Request failed with status code 500\n    at createError (axios.js:16)', 'SellItem', '/sell', v_seller_id, '{"browser": "Safari", "version": "17.1", "os": "iOS 17.2"}', 'error', false, 4),
    ('SecurityError', 'Blocked a frame with origin from accessing a cross-origin frame', 'SecurityError: Blocked a frame\n    at PaymentForm.js:88', 'PaymentForm', '/checkout', v_buyer_id, '{"browser": "Firefox", "version": "120.0", "os": "Ubuntu 22.04"}', 'warning', true, 1),
    ('TypeError', 'null is not an object (evaluating ''response.data.products'')', 'TypeError: null is not an object\n    at Search.js:67', 'Search', '/search', v_buyer_id, '{"browser": "Safari", "version": "17.2", "os": "macOS 14.2"}', 'error', false, 9),
    ('AbortError', 'The operation was aborted', 'AbortError: The operation was aborted\n    at XMLHttpRequest.send', 'ImageUpload', '/sell', v_seller_id, '{"browser": "Chrome", "version": "120.0", "os": "Windows 10"}', 'warning', true, 6),
    ('QuotaExceededError', 'localStorage quota exceeded', 'QuotaExceededError: Failed to execute setItem on Storage\n    at CartContext.js:30', 'CartProvider', '/cart', v_buyer_id, '{"browser": "Safari", "version": "16.6", "os": "iOS 16.7"}', 'warning', false, 3),
    ('TypeError', 'Cannot read properties of null (reading ''id'')', 'TypeError: Cannot read properties of null\n    at WatchlistItem.js:15', 'WatchlistItem', '/watchlist', v_buyer_id, '{"browser": "Chrome", "version": "121.0", "os": "macOS 14.3"}', 'error', false, 11),
    ('Error', 'ResizeObserver loop completed with undelivered notifications', 'Error: ResizeObserver loop completed\n    at ResizeObserver callback', 'ProductCard', '/', NULL, '{"browser": "Chrome", "version": "120.0", "os": "Windows 11"}', 'info', true, 50),
    ('UnhandledRejection', 'Network Error', 'Error: Network Error\n    at XMLHttpRequest.handleError (xhr.js:91)', 'Messages', '/messages', v_buyer_id, '{"browser": "Firefox", "version": "121.0", "os": "macOS 14.2"}', 'error', false, 7),
    ('TypeError', 'e.preventDefault is not a function', 'TypeError: e.preventDefault is not a function\n    at handleSubmit (Review.js:44)', 'ReviewForm', '/product/review', v_buyer_id, '{"browser": "Chrome", "version": "120.0", "os": "Android 13"}', 'error', true, 2),
    ('ReferenceError', 'process is not defined', 'ReferenceError: process is not defined\n    at env.js:3', 'App', '/', NULL, '{"browser": "Safari", "version": "17.0", "os": "macOS 14.0"}', 'critical', true, 1),
    ('Error', 'Hydration failed because the initial UI does not match what was rendered on the server', 'Error: Hydration failed\n    at throwOnHydrationMismatch', 'App', '/', NULL, '{"browser": "Chrome", "version": "119.0", "os": "macOS 14.1"}', 'warning', false, 4)
    ON CONFLICT DO NOTHING;

    -- 4. Password Policies (15 rows)
    INSERT INTO password_policies (policy_name, description, min_length, max_length, require_uppercase, require_lowercase, require_number, require_special_char, max_age_days, password_history_count, applies_to, is_active) VALUES
    ('Default Policy', 'Standard password policy for all users', 8, 128, true, true, true, true, 90, 5, 'all', true),
    ('Admin Strict Policy', 'Enhanced security policy for admin accounts', 12, 128, true, true, true, true, 30, 10, 'admin', true),
    ('Seller Policy', 'Password policy for seller accounts with financial access', 10, 128, true, true, true, true, 60, 8, 'seller', true),
    ('Buyer Basic Policy', 'Relaxed policy for buyer accounts', 8, 128, true, true, true, false, 180, 3, 'buyer', true),
    ('High Security Policy', 'Maximum security for sensitive operations', 16, 128, true, true, true, true, 14, 12, 'admin', false),
    ('Legacy Migration Policy', 'Temporary policy for users migrating from old system', 6, 128, false, false, true, false, 365, 0, 'all', false),
    ('API Service Account Policy', 'Policy for automated service accounts', 32, 256, true, true, true, true, 30, 5, 'admin', true),
    ('Temporary Access Policy', 'Policy for temporary or guest accounts', 8, 64, true, true, true, false, 7, 1, 'buyer', false),
    ('Financial Operations Policy', 'Policy for users performing financial transactions', 12, 128, true, true, true, true, 45, 8, 'all', true),
    ('PCI Compliance Policy', 'Meets PCI DSS password requirements', 12, 128, true, true, true, true, 90, 12, 'all', false),
    ('NIST 800-63B Policy', 'Follows NIST digital identity guidelines', 8, 128, false, false, false, false, 0, 0, 'all', false),
    ('Enterprise SSO Policy', 'Policy for enterprise SSO integrated accounts', 14, 128, true, true, true, true, 60, 10, 'seller', false),
    ('Developer Testing Policy', 'Relaxed policy for development environment', 4, 128, false, false, false, false, 0, 0, 'all', false),
    ('Mobile App Policy', 'Optimized policy for mobile users with biometrics fallback', 8, 64, true, true, true, false, 120, 3, 'buyer', true),
    ('Regulatory Compliance Policy', 'Policy meeting GDPR and SOX requirements', 10, 128, true, true, true, true, 60, 10, 'all', true)
    ON CONFLICT (policy_name) DO NOTHING;

    -- 5. Validation Rules (18 rows)
    INSERT INTO validation_rules (route_path, http_method, field_name, field_location, validation_type, validation_params, error_message, is_active) VALUES
    ('/api/auth/register', 'POST', 'email', 'body', 'isEmail', '{}', 'Please provide a valid email address', true),
    ('/api/auth/register', 'POST', 'username', 'body', 'isLength', '{"min": 3, "max": 30}', 'Username must be between 3 and 30 characters', true),
    ('/api/auth/register', 'POST', 'password', 'body', 'isStrongPassword', '{"minLength": 8, "minUppercase": 1, "minNumbers": 1, "minSymbols": 1}', 'Password must be at least 8 characters with uppercase, number, and special character', true),
    ('/api/auth/register', 'POST', 'firstName', 'body', 'isLength', '{"min": 1, "max": 50}', 'First name is required and must be under 50 characters', true),
    ('/api/auth/login', 'POST', 'email', 'body', 'isEmail', '{}', 'Please provide a valid email address', true),
    ('/api/auth/login', 'POST', 'password', 'body', 'notEmpty', '{}', 'Password is required', true),
    ('/api/products', 'POST', 'title', 'body', 'isLength', '{"min": 3, "max": 200}', 'Product title must be between 3 and 200 characters', true),
    ('/api/products', 'POST', 'price', 'body', 'isFloat', '{"min": 0.01, "max": 999999.99}', 'Price must be between $0.01 and $999,999.99', true),
    ('/api/products', 'POST', 'description', 'body', 'isLength', '{"min": 10, "max": 10000}', 'Description must be between 10 and 10,000 characters', true),
    ('/api/products', 'POST', 'categoryId', 'body', 'isUUID', '{}', 'Valid category ID is required', true),
    ('/api/reviews', 'POST', 'rating', 'body', 'isInt', '{"min": 1, "max": 5}', 'Rating must be between 1 and 5', true),
    ('/api/reviews', 'POST', 'comment', 'body', 'isLength', '{"min": 10, "max": 2000}', 'Review must be between 10 and 2,000 characters', true),
    ('/api/messages', 'POST', 'content', 'body', 'isLength', '{"min": 1, "max": 5000}', 'Message must be between 1 and 5,000 characters', true),
    ('/api/bids', 'POST', 'amount', 'body', 'isFloat', '{"min": 0.01}', 'Bid amount must be a positive number', true),
    ('/api/offers', 'POST', 'amount', 'body', 'isFloat', '{"min": 0.01}', 'Offer amount must be a positive number', true),
    ('/api/auth/change-password', 'POST', 'newPassword', 'body', 'isStrongPassword', '{"minLength": 8, "minUppercase": 1, "minNumbers": 1, "minSymbols": 1}', 'New password must meet strength requirements', true),
    ('/api/auth/change-password', 'POST', 'currentPassword', 'body', 'notEmpty', '{}', 'Current password is required', true),
    ('/api/products/:id', 'GET', 'id', 'params', 'isUUID', '{}', 'Valid product ID is required', true)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Security features seed data loaded successfully';
END $$;
