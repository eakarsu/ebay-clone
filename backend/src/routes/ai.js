// AI Routes - OpenRouter powered AI features

const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Generate product description (auth required for sellers)
router.post('/generate-description', optionalAuth, aiController.generateDescription);

// Get price suggestions
router.post('/suggest-price', optionalAuth, aiController.suggestPrice);

// Get personalized recommendations
router.post('/recommendations', optionalAuth, aiController.getRecommendations);

// Answer product question
router.post('/answer-question', optionalAuth, aiController.answerQuestion);

// Analyze listing quality
router.post('/analyze-listing', optionalAuth, aiController.analyzeListingQuality);

// Generate item specifics
router.post('/generate-specifics', optionalAuth, aiController.generateItemSpecifics);

// Get search suggestions
router.post('/search-suggestions', aiController.getSearchSuggestions);

// Analyze fraud risk (admin/system only in production)
router.post('/fraud-analysis', optionalAuth, aiController.analyzeFraudRisk);

// AI Chat support
router.post('/chat', optionalAuth, aiController.chatSupport);

// Generate message reply suggestion (for seller messaging)
router.post('/message-reply', optionalAuth, aiController.generateMessageReply);

// Analyze product image
router.post('/analyze-image', optionalAuth, aiController.analyzeProductImage);

// Get background enhancement suggestions
router.post('/background-suggestions', optionalAuth, aiController.getBackgroundSuggestions);

module.exports = router;
