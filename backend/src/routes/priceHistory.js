const express = require('express');
const router = express.Router();
const { getProductPriceHistory } = require('../controllers/priceHistoryController');

// Public — price history is visible on the product page.
router.get('/:productId', getProductPriceHistory);

module.exports = router;
