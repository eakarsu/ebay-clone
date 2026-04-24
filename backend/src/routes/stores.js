const express = require('express');
const router = express.Router();
const { authenticateToken: authenticate, optionalAuth } = require('../middleware/auth');
const storeController = require('../controllers/storeController');

// Public routes
router.get('/featured', storeController.getFeaturedStores);
router.get('/search', storeController.searchStores);
router.get('/:slug', optionalAuth, storeController.getStore);
router.get('/:slug/products', storeController.getStoreProducts);
router.get('/:slug/categories', storeController.getStoreCategories);

// Protected routes
router.get('/my/store', authenticate, storeController.getMyStore);
router.get('/my/subscriptions', authenticate, storeController.getMySubscriptions);
router.put('/', authenticate, storeController.updateStore);
router.post('/category', authenticate, storeController.addCategory);
router.delete('/category/:categoryId', authenticate, storeController.deleteCategory);
router.post('/:storeId/subscribe', authenticate, storeController.subscribeToStore);
router.delete('/:storeId/subscribe', authenticate, storeController.unsubscribeFromStore);

module.exports = router;
