const express = require('express');
const router = express.Router();
const { authenticateToken: authenticate } = require('../middleware/auth');
const paymentPlanController = require('../controllers/paymentPlanController');

router.get('/my', authenticate, paymentPlanController.getMyPlans);
router.get('/eligibility', authenticate, paymentPlanController.checkEligibility);
router.get('/:id', authenticate, paymentPlanController.getPlan);
router.post('/', authenticate, paymentPlanController.createPlan);
router.post('/:planId/pay/:installmentId', authenticate, paymentPlanController.payInstallment);

module.exports = router;
