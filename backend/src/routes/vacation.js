const express = require('express');
const router = express.Router();
const { authenticateToken: authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/vacationModeController');

// Authenticated: view & update your own vacation mode.
router.get('/me', authenticate, ctrl.getStatus);
router.put('/me', authenticate, ctrl.updateStatus);

// Public: check another seller's vacation status.
router.get('/seller/:sellerId', ctrl.getSellerStatus);

module.exports = router;
