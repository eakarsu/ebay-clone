const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart } = require('../controllers/cartController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, getCart);
router.post('/add', authenticateToken, addToCart);
router.put('/item/:itemId', authenticateToken, updateCartItem);
router.delete('/item/:itemId', authenticateToken, removeFromCart);
router.delete('/clear', authenticateToken, clearCart);

module.exports = router;
