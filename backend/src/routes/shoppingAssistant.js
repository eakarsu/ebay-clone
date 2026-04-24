const express = require('express');
const router = express.Router();
const { chat } = require('../controllers/shoppingAssistantController');
const { optionalAuth } = require('../middleware/auth');

// Public — but if a user is logged in we can personalize later.
router.post('/chat', optionalAuth, chat);

module.exports = router;
