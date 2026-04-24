const express = require('express');
const router = express.Router();
const dealController = require('../controllers/dealController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Public routes
router.get('/', optionalAuth, dealController.getActiveDeals);
router.get('/featured', optionalAuth, dealController.getFeaturedDeals);
router.get('/categories', dealController.getDealCategories);
router.get('/:id', optionalAuth, dealController.getDealById);

// Protected routes (admin/seller)
router.post('/', authenticateToken, dealController.createDeal);
router.put('/:id', authenticateToken, dealController.updateDeal);
router.delete('/:id', authenticateToken, dealController.deleteDeal);
router.post('/:id/purchase', authenticateToken, dealController.purchaseDeal);

module.exports = router;
