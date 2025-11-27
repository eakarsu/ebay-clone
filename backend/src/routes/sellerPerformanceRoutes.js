// Seller Performance Routes
const express = require('express');
const router = express.Router();
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const sellerPerformanceController = require('../controllers/sellerPerformanceController');

// Public routes
router.get('/:sellerId', optionalAuth, sellerPerformanceController.getSellerPerformance);

// Protected routes
router.get('/', authenticateToken, sellerPerformanceController.getSellerPerformance);
router.post('/calculate', authenticateToken, sellerPerformanceController.calculatePerformance);
router.get('/defects/list', authenticateToken, sellerPerformanceController.getSellerDefects);
router.post('/defects', authenticateToken, sellerPerformanceController.reportDefect);
router.post('/defects/:defectId/appeal', authenticateToken, sellerPerformanceController.appealDefect);
router.get('/benefits/list', authenticateToken, sellerPerformanceController.getSellerBenefits);

module.exports = router;
