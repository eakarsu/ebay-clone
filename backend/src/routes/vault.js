const express = require('express');
const router = express.Router();
const vaultController = require('../controllers/vaultController');
const { authenticateToken } = require('../middleware/auth');

// All vault routes require authentication
router.use(authenticateToken);

// Get user's vault items
router.get('/items', vaultController.getVaultItems);

// Get single vault item
router.get('/items/:id', vaultController.getVaultItem);

// Submit item for vaulting/grading
router.post('/submit', vaultController.submitItem);

// Update vault item
router.put('/items/:id', vaultController.updateVaultItem);

// Request shipping out
router.post('/items/:id/ship-out', vaultController.requestShipOut);

// List vault item for sale
router.post('/items/:id/list', vaultController.listVaultItem);

// Get grading services info
router.get('/services', vaultController.getGradingServices);

// Get vault statistics
router.get('/stats', vaultController.getVaultStats);

module.exports = router;
