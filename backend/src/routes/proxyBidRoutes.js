// Proxy/Automatic Bidding Routes
const express = require('express');
const router = express.Router();
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const proxyBidController = require('../controllers/proxyBidController');

// Public routes
router.get('/increments', proxyBidController.getBidIncrements);
router.get('/auction/:productId/status', optionalAuth, proxyBidController.getAuctionStatus);

// Protected routes
router.post('/', authenticateToken, proxyBidController.placeProxyBid);
router.get('/user', authenticateToken, proxyBidController.getUserProxyBids);
router.delete('/:productId', authenticateToken, proxyBidController.cancelProxyBid);

module.exports = router;
