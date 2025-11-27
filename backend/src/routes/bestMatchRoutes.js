// Best Match Algorithm Routes
const express = require('express');
const router = express.Router();
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const bestMatchController = require('../controllers/bestMatchController');

// Public routes
router.get('/quality-factors', bestMatchController.getQualityFactors);
router.get('/search', optionalAuth, bestMatchController.searchWithBestMatch);
router.get('/recommendations', optionalAuth, bestMatchController.getRecommendations);

// Protected routes (for admin/system)
router.put('/products/:productId/quality-score', authenticateToken, bestMatchController.updateProductQualityScore);
router.post('/batch-update', authenticateToken, bestMatchController.batchUpdateQualityScores);

module.exports = router;
