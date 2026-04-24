// eBay Plus Membership Routes - Complete Implementation
const express = require('express');
const router = express.Router();
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const membershipController = require('../controllers/membershipController');

// Public routes
router.get('/plans', membershipController.getMembershipPlans);
router.get('/pricing/:productId', optionalAuth, membershipController.checkMemberPricing);
router.get('/products/:productId/pricing', optionalAuth, membershipController.checkMemberPricing);

// Protected routes - require authentication
router.use(authenticateToken);

// User membership status
router.get('/user', membershipController.getUserMembership);
router.get('/current', membershipController.getUserMembership);

// Subscription management
router.post('/subscribe', membershipController.subscribeMembership);
router.post('/cancel', membershipController.cancelMembership);
router.put('/auto-renew', membershipController.updateAutoRenew);
router.post('/upgrade', membershipController.upgradeMembership);

// Benefits and deals
router.get('/benefits', membershipController.getMembershipBenefits);
router.get('/deals', membershipController.getExclusiveDeals);
router.get('/exclusive-deals', membershipController.getExclusiveDeals);

// History
router.get('/history', membershipController.getMembershipHistory);

module.exports = router;
