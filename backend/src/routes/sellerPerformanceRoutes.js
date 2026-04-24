// Seller Performance Routes - Complete Implementation
const express = require('express');
const router = express.Router();
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const sellerPerformanceController = require('../controllers/sellerPerformanceController');

// Public routes - view any seller's performance
router.get('/seller/:sellerId', optionalAuth, sellerPerformanceController.getSellerPerformance);

// Protected routes - all require authentication
router.use(authenticateToken);

// Get current user's performance
router.get('/', sellerPerformanceController.getSellerPerformance);
router.get('/my', sellerPerformanceController.getSellerPerformance);
router.get('/dashboard', sellerPerformanceController.getSellerPerformance);

// Calculate and update performance metrics
router.post('/calculate', sellerPerformanceController.calculatePerformance);

// Defects management
router.get('/defects', sellerPerformanceController.getSellerDefects);
router.get('/defects/list', sellerPerformanceController.getSellerDefects);
router.post('/defects', sellerPerformanceController.reportDefect);
router.post('/defects/:defectId/appeal', sellerPerformanceController.appealDefect);

// Benefits based on seller level
router.get('/benefits', sellerPerformanceController.getSellerBenefits);
router.get('/benefits/list', sellerPerformanceController.getSellerBenefits);

// Performance history
router.get('/history', sellerPerformanceController.getPerformanceHistory);

module.exports = router;
