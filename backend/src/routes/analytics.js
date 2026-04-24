const express = require('express');
const router = express.Router();
const { optionalAuth, authenticateToken } = require('../middleware/auth');
const c = require('../controllers/analyticsController');

router.post('/track', optionalAuth, c.track);
// Admin-only aggregates (reuse authenticate — further admin guard can be layered)
router.get('/funnel', authenticateToken, c.funnel);
router.get('/retention', authenticateToken, c.retention);
router.get('/top-events', authenticateToken, c.topEvents);
router.get('/seller-dashboard', authenticateToken, c.sellerDashboard);

module.exports = router;
