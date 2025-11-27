// eBay Plus Membership Routes
const express = require('express');
const router = express.Router();
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const membershipController = require('../controllers/membershipController');

// Public routes
router.get('/plans', membershipController.getMembershipPlans);

// Protected routes
router.get('/user', authenticateToken, membershipController.getUserMembership);
router.get('/current', authenticateToken, membershipController.getUserMembership);
router.post('/subscribe', authenticateToken, membershipController.subscribeMembership);
router.post('/cancel', authenticateToken, membershipController.cancelMembership);
router.get('/benefits', authenticateToken, membershipController.getMembershipBenefits);
router.get('/deals', authenticateToken, membershipController.getExclusiveDeals);
router.put('/auto-renew', authenticateToken, membershipController.updateAutoRenew);
router.get('/products/:productId/pricing', optionalAuth, membershipController.checkMemberPricing);

module.exports = router;
