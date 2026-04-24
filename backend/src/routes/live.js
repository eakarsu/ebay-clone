const express = require('express');
const router = express.Router();
const liveController = require('../controllers/liveController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Public routes
router.get('/streams', optionalAuth, liveController.getLiveStreams);
router.get('/streams/featured', liveController.getFeaturedStreams);
router.get('/streams/:id', optionalAuth, liveController.getStreamById);
router.get('/streams/:id/chat', liveController.getStreamChat);
router.get('/streams/:id/products', liveController.getStreamProducts);

// Protected routes (sellers)
router.post('/streams', authenticateToken, liveController.createStream);
router.put('/streams/:id', authenticateToken, liveController.updateStream);
router.delete('/streams/:id', authenticateToken, liveController.deleteStream);
router.post('/streams/:id/start', authenticateToken, liveController.startStream);
router.post('/streams/:id/end', authenticateToken, liveController.endStream);

// Stream products management
router.post('/streams/:id/products', authenticateToken, liveController.addStreamProduct);
router.delete('/streams/:id/products/:productId', authenticateToken, liveController.removeStreamProduct);
router.post('/streams/:id/products/:productId/flash', authenticateToken, liveController.createFlashDeal);

// Chat
router.post('/streams/:id/chat', authenticateToken, liveController.sendChatMessage);
router.post('/streams/:id/chat/:messageId/pin', authenticateToken, liveController.pinChatMessage);

// Viewer actions
router.post('/streams/:id/join', authenticateToken, liveController.joinStream);
router.post('/streams/:id/leave', authenticateToken, liveController.leaveStream);

module.exports = router;
