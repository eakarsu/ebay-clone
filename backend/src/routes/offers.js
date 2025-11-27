const express = require('express');
const router = express.Router();
const { authenticateToken: authenticate } = require('../middleware/auth');
const offerController = require('../controllers/offerController');

router.get('/product/:productId', offerController.getProductOffers);
router.get('/my', authenticate, offerController.getMyOffers);
router.get('/received', authenticate, offerController.getReceivedOffers);
router.post('/', authenticate, offerController.createOffer);
router.put('/:id/respond', authenticate, offerController.respondToOffer);
router.put('/:id/withdraw', authenticate, offerController.withdrawOffer);

module.exports = router;
