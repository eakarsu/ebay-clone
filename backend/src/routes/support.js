const express = require('express');
const router = express.Router();
const { authenticateToken: authenticate } = require('../middleware/auth');
const supportController = require('../controllers/supportController');

router.get('/chats', authenticate, supportController.getMyChats);
router.get('/chats/:chatId', authenticate, supportController.getChatMessages);
router.post('/chats', authenticate, supportController.startChat);
router.post('/chats/:chatId/message', authenticate, supportController.sendMessage);
router.put('/chats/:chatId/close', authenticate, supportController.closeChat);
router.get('/agent/dashboard', authenticate, supportController.getAgentDashboard);

module.exports = router;
