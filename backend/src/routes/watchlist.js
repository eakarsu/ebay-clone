const express = require('express');
const router = express.Router();
const { getWatchlist, addToWatchlist, removeFromWatchlist, checkWatchlist } = require('../controllers/watchlistController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, getWatchlist);
router.post('/', authenticateToken, addToWatchlist);
router.delete('/:productId', authenticateToken, removeFromWatchlist);
router.get('/check/:productId', authenticateToken, checkWatchlist);

module.exports = router;
