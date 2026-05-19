const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart } = require('../controllers/cartController');
const { authenticateToken } = require('../middleware/auth');
const { cartRateLimit } = require('../middleware/rateLimits');

// cartRateLimit is applied after auth so the limiter key is per-user
router.get('/', authenticateToken, cartRateLimit, getCart);
router.post('/add', authenticateToken, cartRateLimit, addToCart);
router.put('/item/:itemId', authenticateToken, cartRateLimit, updateCartItem);
router.delete('/item/:itemId', authenticateToken, cartRateLimit, removeFromCart);
router.delete('/clear', authenticateToken, cartRateLimit, clearCart);

module.exports = router;
