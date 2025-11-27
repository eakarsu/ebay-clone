const express = require('express');
const router = express.Router();
const { authenticateToken: authenticate, optionalAuth } = require('../middleware/auth');
const recentlyViewedController = require('../controllers/recentlyViewedController');

router.get('/', authenticate, recentlyViewedController.getRecentlyViewed);
// Support both POST / and POST /track for compatibility
router.post('/', optionalAuth, recentlyViewedController.trackViewOptional);
router.post('/track', authenticate, recentlyViewedController.trackView);
router.delete('/clear', authenticate, recentlyViewedController.clearHistory);
router.delete('/:productId', authenticate, recentlyViewedController.removeFromHistory);

module.exports = router;
