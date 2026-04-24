const express = require('express');
const router = express.Router();
const { authenticateToken: authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/giftCardController');

router.post('/purchase', authenticate, ctrl.purchaseGiftCard);
router.post('/redeem', authenticate, ctrl.redeemGiftCard);
router.get('/balance', authenticate, ctrl.getBalance);
router.get('/my', authenticate, ctrl.myPurchased);

module.exports = router;
