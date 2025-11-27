// Authenticity Guarantee Routes
const express = require('express');
const router = express.Router();
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const authenticityController = require('../controllers/authenticityController');

// Public routes
router.get('/categories', authenticityController.getAuthenticityCategories);
router.get('/check-required', authenticityController.checkAuthenticityRequired);
router.get('/verify', authenticityController.verifyCertificate);

// Protected routes
router.post('/requests', authenticateToken, authenticityController.createAuthenticityRequest);
router.get('/requests/:id', authenticateToken, authenticityController.getAuthenticityRequest);
router.put('/requests/:id', authenticateToken, authenticityController.updateAuthenticityStatus);
router.get('/user/requests', authenticateToken, authenticityController.getUserAuthenticityRequests);

module.exports = router;
