const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getMyOnboarding, updateMyOnboarding } = require('../controllers/onboardingController');

router.get('/me', authenticateToken, getMyOnboarding);
router.put('/me', authenticateToken, updateMyOnboarding);

module.exports = router;
