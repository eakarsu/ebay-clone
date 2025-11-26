const express = require('express');
const router = express.Router();
const { placeBid, getBidsForProduct, getUserBids } = require('../controllers/bidController');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, placeBid);
router.get('/product/:productId', getBidsForProduct);
router.get('/my-bids', authenticateToken, getUserBids);

module.exports = router;
