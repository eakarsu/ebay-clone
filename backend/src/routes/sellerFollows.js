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

// Public — status endpoint is used by the product page even when logged out.
router.get('/:id/follow-status', optionalAuth, getFollowStatus);

// Authenticated actions.
router.post('/:id/follow', authenticateToken, followSeller);
router.delete('/:id/follow', authenticateToken, unfollowSeller);

module.exports = { router, getFollowingFeed, getMyFollowing };
