const express = require('express');
const router = express.Router();
const { authenticateToken: authenticate } = require('../middleware/auth');
const priceAlertController = require('../controllers/priceAlertController');

router.get('/', authenticate, priceAlertController.getMyAlerts);
router.post('/', authenticate, priceAlertController.createAlert);
router.put('/:id', authenticate, priceAlertController.updateAlert);
router.delete('/:id', authenticate, priceAlertController.deleteAlert);
router.get('/history/:productId', priceAlertController.getPriceHistory);

module.exports = router;
