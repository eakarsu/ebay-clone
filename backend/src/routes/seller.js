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
  endListing,
  relistProduct,
  deleteProduct,
  bulkUpload,
  getBulkUploadTemplate,
  generateSampleData,
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

// Listing management
router.put('/products/:productId/end', endListing);
router.post('/products/:productId/relist', relistProduct);
router.delete('/products/:productId', deleteProduct);

// Bulk upload
router.get('/bulk-upload/template', getBulkUploadTemplate);
router.get('/bulk-upload/sample-data', generateSampleData);
router.post('/bulk-upload', bulkUpload);

module.exports = router;
