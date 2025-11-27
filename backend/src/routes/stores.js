const express = require('express');
const router = express.Router();
const { authenticateToken: authenticate, optionalAuth } = require('../middleware/auth');
const storeController = require('../controllers/storeController');

router.get('/featured', storeController.getFeaturedStores);
router.get('/my', authenticate, storeController.getMyStore);
router.get('/:slug', storeController.getStore);
router.get('/:slug/products', storeController.getStoreProducts);
router.get('/:slug/categories', storeController.getStoreCategories);
router.put('/', authenticate, storeController.updateStore);
router.post('/category', authenticate, storeController.addCategory);
router.post('/:storeId/subscribe', authenticate, storeController.subscribeToStore);
router.delete('/:storeId/subscribe', authenticate, storeController.unsubscribeFromStore);

module.exports = router;
