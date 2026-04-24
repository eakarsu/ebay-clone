const express = require('express');
const router = express.Router();
const { authenticateToken: authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/publicWishlistController');

// Authenticated: manage my own wishlist sharing settings.
router.put('/visibility', authenticate, ctrl.setWishlistVisibility);
router.post('/rotate-token', authenticate, ctrl.rotateShareToken);

// Public: view by token.
router.get('/:token', ctrl.getPublicWishlist);

module.exports = router;
