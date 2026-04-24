const express = require('express');
const router = express.Router();
const { authenticateToken: authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/bundleDiscountController');

// Seller-scoped CRUD for own rules.
router.get('/my', authenticate, ctrl.listMyBundles);
router.post('/', authenticate, ctrl.createBundle);
router.put('/:id', authenticate, ctrl.updateBundle);
router.delete('/:id', authenticate, ctrl.deleteBundle);

// Public read (for "bundle and save" banners).
router.get('/seller/:sellerId', ctrl.getSellerBundles);

// Cart helper — expects the client to pass the items it currently has.
router.post('/calculate', ctrl.calculateForCart);

module.exports = router;
