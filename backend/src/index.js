const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { testConnection } = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const realtime = require('./realtime/socket');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const searchRoutes = require('./routes/search');
const categoryRoutes = require('./routes/categories');
const bidRoutes = require('./routes/bids');
const orderRoutes = require('./routes/orders');
const cartRoutes = require('./routes/cart');
const watchlistRoutes = require('./routes/watchlist');
const reviewRoutes = require('./routes/reviews');
const messageRoutes = require('./routes/messages');
const notificationRoutes = require('./routes/notifications');
const addressRoutes = require('./routes/addresses');
const paymentRoutes = require('./routes/payment');
const uploadRoutes = require('./routes/upload');
const disputeRoutes = require('./routes/disputes');
const returnRoutes = require('./routes/returns');
const shippingRoutes = require('./routes/shipping');
const savedSearchRoutes = require('./routes/savedSearches');
const couponRoutes = require('./routes/coupons');
const sellerRoutes = require('./routes/seller');
const adminRoutes = require('./routes/admin');

// New feature routes
const offerRoutes = require('./routes/offers');
const questionRoutes = require('./routes/questions');
const recentlyViewedRoutes = require('./routes/recentlyViewed');
const recommendationRoutes = require('./routes/recommendations');
const priceAlertRoutes = require('./routes/priceAlerts');
const collectionRoutes = require('./routes/collections');
const storeRoutes = require('./routes/stores');
const invoiceRoutes = require('./routes/invoices');
const rewardsRoutes = require('./routes/rewards');
const paymentPlanRoutes = require('./routes/paymentPlans');
const supportRoutes = require('./routes/support');
const currencyRoutes = require('./routes/currencies');
const bidRetractionRoutes = require('./routes/bidRetractions');

// Advanced feature routes (new implementations)
const gspRoutes = require('./routes/gspRoutes');
const motorsRoutes = require('./routes/motorsRoutes');
const authenticityRoutes = require('./routes/authenticityRoutes');
const sellerPerformanceRoutes = require('./routes/sellerPerformanceRoutes');
const proxyBidRoutes = require('./routes/proxyBidRoutes');
const membershipRoutes = require('./routes/membershipRoutes');
const localPickupRoutes = require('./routes/localPickupRoutes');
const bestMatchRoutes = require('./routes/bestMatchRoutes');

// AI Routes (OpenRouter)
const aiRoutes = require('./routes/ai');

// Latest eBay 2025-2026 Features
const dealsRoutes = require('./routes/deals');
const liveRoutes = require('./routes/live');
const teamRoutes = require('./routes/team');
const vaultRoutes = require('./routes/vault');

// Security Feature Routes
const securityAuditRoutes = require('./routes/securityAudit');
const tokenBlacklistRoutes = require('./routes/tokenBlacklist');
const errorLogRoutes = require('./routes/errorLogs');
const passwordPolicyRoutes = require('./routes/passwordPolicies');
const validationRuleRoutes = require('./routes/validationRules');

// Extension feature routes
const listingTemplateRoutes = require('./routes/listingTemplates');
const vacationRoutes = require('./routes/vacation');
const compareRoutes = require('./routes/compare');
const giftCardRoutes = require('./routes/giftCards');
const publicWishlistRoutes = require('./routes/publicWishlist');
const sellerEarningsRoutes = require('./routes/sellerEarnings');

// Round 4 feature routes
const bundleDiscountRoutes = require('./routes/bundleDiscounts');
const categoryFollowRoutes = require('./routes/categoryFollows');
const auctionChatRoutes = require('./routes/auctionChat');

// Platform feature routes (Wave 3-6)
const publicV1Routes = require('./routes/publicV1');
const apiKeyRoutes = require('./routes/apiKeys');
const analyticsRoutes = require('./routes/analytics');
const experimentRoutes = require('./routes/experiments');
const promotionRoutes = require('./routes/promotions');
const onboardingRoutes = require('./routes/onboarding');
const lowStockRoutes = require('./routes/lowStock');
const priceHistoryRoutes = require('./routes/priceHistory');
const imageSearchRoutes = require('./routes/imageSearch');
const shoppingAssistantRoutes = require('./routes/shoppingAssistant');
const walletRoutes = require('./routes/wallet');
const referralRoutes = require('./routes/referrals');
const flashSaleRoutes = require('./routes/flashSales');
const groupBuyRoutes = require('./routes/groupBuys');
const trustScoreRoutes = require('./routes/trustScore');

const app = express();

// Trust proxy headers from loopback (localhost) only. Needed so express-rate-limit
// can correctly derive the client IP when running behind CRA dev-server proxy or
// similar local reverse proxies that forward X-Forwarded-For.
// Do NOT change to `true` in production — that would let clients spoof their IP.
app.set('trust proxy', 'loopback');

// Rate limiting - increased for development
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
  message: { error: 'Too many requests, please try again later.' },
});

// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:3000'],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Stripe webhook needs raw body
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/saved-searches', savedSearchRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/admin', adminRoutes);

// New feature routes
app.use('/api/offers', offerRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/recently-viewed', recentlyViewedRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/price-alerts', priceAlertRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/payment-plans', paymentPlanRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/currencies', currencyRoutes);
app.use('/api/bid-retractions', bidRetractionRoutes);

// Advanced feature routes (new implementations)
app.use('/api/gsp', gspRoutes);
app.use('/api/motors', motorsRoutes);
app.use('/api/authenticity', authenticityRoutes);
app.use('/api/seller-performance', sellerPerformanceRoutes);
app.use('/api/proxy-bids', proxyBidRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/local-pickup', localPickupRoutes);
app.use('/api/best-match', bestMatchRoutes);

// AI Routes (OpenRouter powered)
app.use('/api/ai', aiRoutes);

// Latest eBay 2025-2026 Feature Routes
app.use('/api/deals', dealsRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/vault', vaultRoutes);

// Security Feature Routes
app.use('/api/security-audit', securityAuditRoutes);
app.use('/api/token-blacklist', tokenBlacklistRoutes);
app.use('/api/error-logs', errorLogRoutes);
app.use('/api/password-policies', passwordPolicyRoutes);
app.use('/api/validation-rules', validationRuleRoutes);

// Extension feature routes
app.use('/api/listing-templates', listingTemplateRoutes);
app.use('/api/vacation', vacationRoutes);
app.use('/api/compare', compareRoutes);
app.use('/api/gift-cards', giftCardRoutes);
app.use('/api/public-wishlist', publicWishlistRoutes);
app.use('/api/seller/earnings', sellerEarningsRoutes);

// Round 4 features
app.use('/api/bundle-discounts', bundleDiscountRoutes);
app.use('/api/category-follows', categoryFollowRoutes);
app.use('/api/auction-chat', auctionChatRoutes);

// Platform feature routes (Wave 3-6)
app.use('/api/v1', publicV1Routes);
app.use('/api/api-keys', apiKeyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/experiments', experimentRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/seller-onboarding', onboardingRoutes);
app.use('/api/low-stock', lowStockRoutes);
app.use('/api/price-history', priceHistoryRoutes);
app.use('/api/image-search', imageSearchRoutes);
app.use('/api/shopping-assistant', shoppingAssistantRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/flash-sales', flashSaleRoutes);
app.use('/api/group-buys', groupBuyRoutes);
app.use('/api/trust-score', trustScoreRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('Failed to connect to database. Please ensure PostgreSQL is running.');
    process.exit(1);
  }

  const server = http.createServer(app);
  realtime.init(server);

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Socket.IO listening on /socket.io`);

    // Start scheduled jobs (digests, saved-search alerts)
    try {
      require('./jobs/digestScheduler').start();
    } catch (err) {
      console.warn('Digest scheduler failed to start:', err.message);
    }

    // Cleanup expired blacklisted tokens every hour
    setInterval(async () => {
      try {
        const { pool } = require('./config/database');
        const result = await pool.query('DELETE FROM token_blacklist WHERE expires_at < NOW()');
        if (result.rowCount > 0) {
          console.log(`Cleaned up ${result.rowCount} expired blacklisted tokens`);
        }
      } catch (err) {
        // Silently ignore cleanup errors
      }
    }, 60 * 60 * 1000);

    // Cleanup expired cart reservations every minute so stock returns quickly.
    setInterval(async () => {
      try {
        const { cleanupExpired } = require('./services/cartReservations');
        await cleanupExpired();
      } catch (err) { /* silent */ }
    }, 60 * 1000);
  });
};

startServer();
