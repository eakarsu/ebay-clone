const express = require('express');
const router = express.Router();
const { authenticateToken: authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/auctionChatController');

// Public read so non-logged-in watchers can see recent banter.
router.get('/:productId', ctrl.getChat);
// Posting requires auth — we record user_id for moderation.
router.post('/:productId', authenticate, ctrl.postMessage);

module.exports = router;
