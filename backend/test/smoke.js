#!/usr/bin/env node
/**
 * Smoke test: exercise every GET endpoint a logged-in user would hit and assert
 * the server never 500s. Flags non-200 responses for investigation but only the
 * 5xx failures count as true test failures — 4xx can legitimately happen
 * (e.g. seller-only endpoints for a buyer account).
 *
 * Zero deps — uses Node 18+ native fetch. Run:
 *   node test/smoke.js
 *   BASE_URL=http://localhost:4000 TEST_EMAIL=jane@example.com TEST_PASSWORD=password123 node test/smoke.js
 *
 * Exit 0 on no 5xx, 1 otherwise.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const API = `${BASE_URL}/api`;
const EMAIL = process.env.TEST_EMAIL || 'jane@example.com';
const PASSWORD = process.env.TEST_PASSWORD || 'password123';

const GREEN = '\x1b[32m', RED = '\x1b[31m', YELLOW = '\x1b[33m', GREY = '\x1b[90m', RESET = '\x1b[0m';

let token = null;
let sampleProductId = null;
let sampleUserId = null;

const req = async (method, path, opts = {}) => {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token && !opts.noAuth) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  let body = null;
  try {
    body = res.headers.get('content-type')?.includes('json') ? await res.json() : await res.text();
  } catch {}
  return { status: res.status, body };
};

// Endpoints that hit static paths (no :id etc.) — can be run blindly.
// Classified: "expected" is the expected status for our test user (buyer, non-seller, non-admin).
// 200 = should work; 401/403 = auth/permission gate is acceptable; otherwise we flag.
const ENDPOINTS = [
  // Auth / profile
  ['GET', '/auth/profile',              { expected: [200] }],
  ['GET', '/auth/me',                   { expected: [200] }],
  // Products / catalog — public
  ['GET', '/products',                  { expected: [200], noAuth: true }],
  ['GET', '/products/filters',          { expected: [200], noAuth: true }],
  ['GET', '/categories',                { expected: [200], noAuth: true }],
  ['GET', '/categories/with-subcategories', { expected: [200], noAuth: true }],
  ['GET', '/search?q=iphone',           { expected: [200], noAuth: true }],
  ['GET', '/search/suggest?q=iph',      { expected: [200], noAuth: true }],
  ['GET', '/recommendations/trending',  { expected: [200], noAuth: true }],
  // User data
  ['GET', '/addresses',                 { expected: [200] }],
  ['GET', '/watchlist',                 { expected: [200] }],
  ['GET', '/cart',                      { expected: [200] }],
  ['GET', '/orders',                    { expected: [200] }],
  ['GET', '/saved-searches',            { expected: [200] }],
  ['GET', '/notifications',             { expected: [200] }],
  ['GET', '/messages/conversations',    { expected: [200] }],
  ['GET', '/messages/unread-count',     { expected: [200] }],
  ['GET', '/bids/my-bids',              { expected: [200] }],
  ['GET', '/recently-viewed',           { expected: [200] }],
  ['GET', '/listing-templates',         { expected: [200] }],
  ['GET', '/vacation/me',               { expected: [200] }],
  ['GET', '/gift-cards/balance',        { expected: [200] }],
  ['GET', '/gift-cards/my',             { expected: [200] }],
  ['GET', '/seller/earnings?days=30',   { expected: [200] }],
  ['GET', '/bundle-discounts/my',       { expected: [200] }],
  ['GET', '/category-follows/my',       { expected: [200] }],
  ['GET', '/category-follows/feed',     { expected: [200] }],
  ['GET', '/collections/my',            { expected: [200] }],
  ['GET', '/collections/public',        { expected: [200], noAuth: true }],
  ['GET', '/offers/my',                 { expected: [200] }],
  ['GET', '/offers/received',           { expected: [200] }],
  ['GET', '/questions/my',              { expected: [200] }],
  ['GET', '/price-alerts',              { expected: [200] }],
  ['GET', '/returns',                   { expected: [200] }],
  ['GET', '/disputes',                  { expected: [200] }],
  ['GET', '/bid-retractions/my',        { expected: [200] }],
  ['GET', '/bid-retractions/pending',   { expected: [200, 403] }],
  ['GET', '/coupons/available',         { expected: [200] }],
  ['GET', '/coupons/my',                { expected: [200] }],
  ['GET', '/rewards/my',                { expected: [200] }],
  ['GET', '/rewards/transactions',      { expected: [200] }],
  ['GET', '/rewards/tiers',             { expected: [200], noAuth: true }],
  ['GET', '/invoices/my',               { expected: [200] }],
  ['GET', '/invoices/sent',             { expected: [200] }],
  ['GET', '/payment-plans/my',          { expected: [200] }],
  ['GET', '/payment-plans/eligibility?amount=100', { expected: [200] }],
  ['GET', '/currencies',                { expected: [200], noAuth: true }],
  ['GET', '/currencies/preference',     { expected: [200] }],
  ['GET', '/support/chats',             { expected: [200] }],
  ['GET', '/payment/config',            { expected: [200], noAuth: true }],
  ['GET', '/payment/methods',           { expected: [200] }],
  ['GET', '/payment/history',           { expected: [200] }],
  // Seller side (buyer will get 403 on some; still shouldn't 500)
  ['GET', '/seller/dashboard',          { expected: [200, 403] }],
  ['GET', '/seller/orders',             { expected: [200, 403] }],
  ['GET', '/seller/products',           { expected: [200, 403] }],
  ['GET', '/seller/analytics',          { expected: [200, 403] }],
  ['GET', '/seller/reviews',            { expected: [200, 403] }],
  ['GET', '/seller/alerts',             { expected: [200, 403] }],
  ['GET', '/seller/bulk-upload/template', { expected: [200, 403] }],
  ['GET', '/seller/bulk-upload/sample-data', { expected: [200, 403] }],
  ['GET', '/seller-performance/my',     { expected: [200, 403, 404] }],
  ['GET', '/seller-performance/dashboard', { expected: [200, 403, 404] }],
  ['GET', '/seller-performance/defects', { expected: [200, 403, 404] }],
  ['GET', '/seller-performance/benefits', { expected: [200, 403, 404] }],
  ['GET', '/seller-performance/history', { expected: [200, 403, 404] }],
  // Store
  ['GET', '/stores/my/store',           { expected: [200, 404] }],
  ['GET', '/stores/my/subscriptions',   { expected: [200] }],
  ['GET', '/stores/featured',           { expected: [200], noAuth: true }],
  // Live streams
  ['GET', '/live/streams',              { expected: [200], noAuth: true }],
  ['GET', '/live/streams/featured',     { expected: [200], noAuth: true }],
  // Deals
  ['GET', '/deals',                     { expected: [200], noAuth: true }],
  ['GET', '/deals/featured',            { expected: [200], noAuth: true }],
  ['GET', '/deals/categories',          { expected: [200], noAuth: true }],
  // Membership
  ['GET', '/membership/plans',          { expected: [200], noAuth: true }],
  ['GET', '/membership/current',        { expected: [200] }],
  ['GET', '/membership/benefits',       { expected: [200] }],
  ['GET', '/membership/exclusive-deals', { expected: [200] }],
  ['GET', '/membership/history',        { expected: [200] }],
  // Shipping
  ['GET', '/shipping/carriers',         { expected: [200] }],
  ['GET', '/shipping/rates',            { expected: [200] }],
  // GSP / Motors / LocalPickup / BestMatch / Authenticity
  ['GET', '/gsp/countries',             { expected: [200], noAuth: true }],
  ['GET', '/gsp/user/shipments',        { expected: [200] }],
  ['GET', '/motors/vehicles/search?make=honda', { expected: [200], noAuth: true }],
  ['GET', '/local-pickup/settings',     { expected: [200, 404] }],
  ['GET', '/local-pickup/buyer/appointments', { expected: [200] }],
  ['GET', '/local-pickup/seller/appointments', { expected: [200, 403] }],
  ['GET', '/best-match/quality-factors', { expected: [200], noAuth: true }],
  ['GET', '/best-match/search?q=phone', { expected: [200], noAuth: true }],
  ['GET', '/authenticity/categories',   { expected: [200], noAuth: true }],
  ['GET', '/authenticity/user/requests', { expected: [200] }],
  // Onboarding
  ['GET', '/onboarding/me',             { expected: [200] }],
  // Proxy bids
  ['GET', '/proxy-bids/increments',     { expected: [200], noAuth: true }],
  ['GET', '/proxy-bids/user',           { expected: [200] }],
  // Team / Vault
  ['GET', '/team/members',              { expected: [200] }],
  ['GET', '/team/invitations',          { expected: [200] }],
  ['GET', '/team/roles',                { expected: [200] }],
  ['GET', '/vault/items',               { expected: [200] }],
  ['GET', '/vault/services',            { expected: [200] }],
  ['GET', '/vault/stats',               { expected: [200] }],
  // Promotions / experiments / analytics
  ['GET', '/promotions/slots',          { expected: [200] }],
  ['GET', '/promotions/mine',           { expected: [200] }],
  // Security/admin-style (buyer will be 403; 403 is fine, 500 is not)
  ['GET', '/security-audit',            { expected: [200, 403] }],
  ['GET', '/security-audit/stats',      { expected: [200, 403] }],
  ['GET', '/token-blacklist',           { expected: [200, 403] }],
  ['GET', '/token-blacklist/stats',     { expected: [200, 403] }],
  ['GET', '/error-logs',                { expected: [200, 403] }],
  ['GET', '/error-logs/stats',          { expected: [200, 403] }],
  ['GET', '/password-policies',         { expected: [200, 403] }],
  ['GET', '/password-policies/active',  { expected: [200, 403] }],
  ['GET', '/validation-rules',          { expected: [200, 403] }],
  // Public v1
  ['GET', '/v1/products',               { expected: [200], noAuth: true }],
  ['GET', '/v1/categories',             { expected: [200], noAuth: true }],
  ['GET', '/v1/search?q=phone',         { expected: [200], noAuth: true }],
];

// Endpoints needing fixtures (a product id). Loaded after /products responds.
const fixtureEndpoints = (pid) => pid ? [
  ['GET', `/products/${pid}`,                       { expected: [200], noAuth: true }],
  ['GET', `/recommendations/similar/${pid}`,         { expected: [200], noAuth: true }],
  ['GET', `/recommendations/also-viewed/${pid}`,     { expected: [200], noAuth: true }],
  ['GET', `/recommendations/bought-together/${pid}`, { expected: [200], noAuth: true }],
  ['GET', `/offers/product/${pid}`,                  { expected: [200], noAuth: true }],
  ['GET', `/questions/product/${pid}`,               { expected: [200], noAuth: true }],
  ['GET', `/reviews/product/${pid}`,                 { expected: [200], noAuth: true }],
  ['GET', `/bids/product/${pid}`,                    { expected: [200], noAuth: true }],
  ['GET', `/price-alerts/history/${pid}`,            { expected: [200], noAuth: true }],
  ['GET', `/watchlist/check/${pid}`,                 { expected: [200] }],
  ['GET', `/proxy-bids/auction/${pid}/status`,       { expected: [200], noAuth: true }],
  ['GET', `/auction-chat/${pid}`,                    { expected: [200], noAuth: true }],
] : [];

const main = async () => {
  // Health
  const h = await fetch(`${API}/health`).catch(() => null);
  if (!h || !h.ok) {
    console.error(`${RED}Backend not responding at ${API}/health${RESET}`);
    process.exit(1);
  }

  // Login
  console.log(`${GREY}→ logging in as ${EMAIL}${RESET}`);
  const login = await req('POST', '/auth/login', { body: { email: EMAIL, password: PASSWORD }, noAuth: true });
  if (login.status !== 200 || !login.body?.token) {
    console.error(`${RED}login failed: status=${login.status} body=${JSON.stringify(login.body).slice(0, 200)}${RESET}`);
    process.exit(1);
  }
  token = login.body.token;
  sampleUserId = login.body.user?.id;

  // Grab a sample product id
  const products = await req('GET', '/products?limit=1', { noAuth: true });
  sampleProductId = products.body?.products?.[0]?.id || null;

  const all = [...ENDPOINTS, ...fixtureEndpoints(sampleProductId)];

  let pass = 0, acceptable = 0, fail = 0, crash = 0;
  const failures = [];
  const crashes = [];

  for (const [method, path, opts] of all) {
    const r = await req(method, path, opts);
    const expected = opts.expected || [200];
    const tag = `${method} ${path}`;
    if (r.status >= 500) {
      crash++;
      crashes.push({ tag, status: r.status, body: r.body });
      console.log(`${RED}✗ ${tag} → ${r.status} (SERVER ERROR)${RESET}`);
    } else if (r.status === 200) {
      pass++;
      if (process.env.VERBOSE) console.log(`${GREEN}✓ ${tag} → 200${RESET}`);
    } else if (expected.includes(r.status)) {
      acceptable++;
      if (process.env.VERBOSE) console.log(`${GREY}· ${tag} → ${r.status} (expected)${RESET}`);
    } else {
      fail++;
      failures.push({ tag, status: r.status, body: r.body });
      console.log(`${YELLOW}⚠ ${tag} → ${r.status} (unexpected; body=${JSON.stringify(r.body).slice(0, 120)})${RESET}`);
    }
  }

  console.log(`\n${GREEN}${pass} passed${RESET}  ${GREY}${acceptable} acceptable${RESET}  ${YELLOW}${fail} unexpected${RESET}  ${RED}${crash} server errors${RESET}  (total ${all.length})`);

  if (crash) {
    console.log(`\n${RED}Server errors (5xx) — these are test failures:${RESET}`);
    for (const c of crashes) console.log(`  ${c.tag} → ${c.status}\n    ${JSON.stringify(c.body).slice(0, 300)}`);
  }
  process.exit(crash ? 1 : 0);
};

main().catch((e) => {
  console.error(`${RED}smoke runner crashed:${RESET}`, e);
  process.exit(2);
});
