const express = require('express');
const router = express.Router();
const {
  getCarriers,
  getShippingRates,
  getAllRates,
  calculateShipping,
  createShippingLabel,
  getShippingLabel,
  trackShipment,
  addTrackingEvent,
  getOrderShipping,
  voidShippingLabel,
  getSellerLabels
} = require('../controllers/shippingController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.get('/carriers', getCarriers);
router.get('/carriers/:carrierId/rates', getShippingRates);
router.get('/rates', getAllRates);
router.post('/calculate', calculateShipping);
router.get('/track/:trackingNumber', trackShipment);

// Protected routes
router.use(authenticateToken);

router.post('/orders/:orderId/label', createShippingLabel);
router.get('/labels/:id', getShippingLabel);
router.delete('/labels/:id', voidShippingLabel);
router.get('/orders/:orderId', getOrderShipping);
router.get('/seller/labels', getSellerLabels);
router.post('/track/:trackingNumber/events', addTrackingEvent);

module.exports = router;
