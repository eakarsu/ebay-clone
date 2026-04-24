const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getMyReferral } = require('../controllers/referralController');

router.use(authenticateToken);
router.get('/me', getMyReferral);

module.exports = router;
