const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  confirmPayment,
  processRefund,
  getPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
  handleWebhook,
  getPaymentHistory,
} = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');

// Webhook (no auth - Stripe sends this)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Protected routes
router.use(authenticateToken);

router.post('/create-intent', createPaymentIntent);
router.post('/confirm', confirmPayment);
router.post('/refund', processRefund);
router.get('/methods', getPaymentMethods);
router.post('/methods', addPaymentMethod);
router.delete('/methods/:paymentMethodId', removePaymentMethod);
router.get('/history', getPaymentHistory);

module.exports = router;
