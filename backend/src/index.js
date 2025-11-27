const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { testConnection } = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
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

const app = express();

// Rate limiting - increased for development
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
  message: { error: 'Too many requests, please try again later.' },
});

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('Failed to connect to database. Please ensure PostgreSQL is running.');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer();
