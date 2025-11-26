const express = require('express');
const router = express.Router();
const { getConversations, getMessages, sendMessage, getUnreadCount } = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/auth');

router.get('/conversations', authenticateToken, getConversations);
router.get('/unread-count', authenticateToken, getUnreadCount);
router.get('/:userId', authenticateToken, getMessages);
router.post('/', authenticateToken, sendMessage);

module.exports = router;
