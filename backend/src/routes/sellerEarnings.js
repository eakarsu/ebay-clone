const express = require('express');
const router = express.Router();
const { authenticateToken: authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/sellerEarningsController');

router.get('/', authenticate, ctrl.getEarnings);

module.exports = router;
