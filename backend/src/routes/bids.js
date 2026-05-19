const express = require('express');
const router = express.Router();
const { placeBid, getBidsForProduct, getUserBids, getBidsSince } = require('../controllers/bidController');
const { authenticateToken } = require('../middleware/auth');
const { bidRateLimit } = require('../middleware/rateLimits');

// Rate limit is applied after auth so the key can be per-user (not just per-IP)
router.post('/', authenticateToken, bidRateLimit, placeBid);
router.get('/product/:productId', getBidsForProduct);
router.get('/product/:productId/since', getBidsSince);
router.get('/my-bids', authenticateToken, getUserBids);

module.exports = router;
