const express = require('express');
const router = express.Router();
const { authenticateToken: authenticate } = require('../middleware/auth');
const currencyController = require('../controllers/currencyController');

router.get('/', currencyController.getCurrencies);
router.get('/convert', currencyController.convertPrice);
router.get('/preference', authenticate, currencyController.getMyPreference);
router.put('/preference', authenticate, currencyController.setPreference);
router.put('/rates', authenticate, currencyController.updateRates); // Admin only

module.exports = router;
