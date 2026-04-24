const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getMyWallet, topUp } = require('../controllers/walletController');

router.use(authenticateToken);
router.get('/', getMyWallet);
router.post('/topup', topUp);

module.exports = router;
