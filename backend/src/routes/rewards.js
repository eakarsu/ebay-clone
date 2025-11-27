const express = require('express');
const router = express.Router();
const { authenticateToken: authenticate } = require('../middleware/auth');
const rewardsController = require('../controllers/rewardsController');

router.get('/my', authenticate, rewardsController.getMyRewards);
router.get('/transactions', authenticate, rewardsController.getTransactions);
router.get('/tiers', rewardsController.getTiers);
router.post('/redeem', authenticate, rewardsController.redeemPoints);
router.post('/earn', authenticate, rewardsController.earnPoints);

module.exports = router;
