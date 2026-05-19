const express = require('express');
const router = express.Router();
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const {
  followSeller,
  unfollowSeller,
  getFollowStatus,
  getFollowingFeed,
  getMyFollowing,
} = require('../controllers/sellerFollowController');
const { getSellerAnalytics } = require('../controllers/sellerAnalyticsController');

// Public — status endpoint is used by the product page even when logged out.
router.get('/:id/follow-status', optionalAuth, getFollowStatus);

// Seller analytics with AI insights (authenticated — seller sees own, admin sees any)
router.get('/:id/analytics', authenticateToken, getSellerAnalytics);

// Authenticated actions.
router.post('/:id/follow', authenticateToken, followSeller);
router.delete('/:id/follow', authenticateToken, unfollowSeller);

module.exports = { router, getFollowingFeed, getMyFollowing };
