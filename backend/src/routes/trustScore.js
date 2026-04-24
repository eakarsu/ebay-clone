const express = require('express');
const router = express.Router();
const { getTrustScore } = require('../controllers/trustScoreController');

// Public — trust badges are shown on seller profiles and product listings.
router.get('/:id', getTrustScore);

module.exports = router;
