const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getSellerOrders,
  getSellerProducts,
  getSalesAnalytics,
  updateOrderStatus,
  getSellerReviews,
  getInventoryAlerts,
} = require('../controllers/sellerController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/dashboard', getDashboard);
router.get('/orders', getSellerOrders);
router.get('/products', getSellerProducts);
router.get('/analytics', getSalesAnalytics);
router.put('/orders/:orderId/status', updateOrderStatus);
router.get('/reviews', getSellerReviews);
router.get('/alerts', getInventoryAlerts);

module.exports = router;
