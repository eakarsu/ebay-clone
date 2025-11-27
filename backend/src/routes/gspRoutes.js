// Global Shipping Program Routes
const express = require('express');
const router = express.Router();
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const gspController = require('../controllers/gspController');

// Public routes
router.get('/countries', gspController.getSupportedCountries);
router.post('/calculate-duties', gspController.calculateDuties);

// Protected routes
router.post('/shipments', authenticateToken, gspController.createGspShipment);
router.get('/shipments/:id', authenticateToken, gspController.getGspShipment);
router.put('/shipments/:id/domestic', authenticateToken, gspController.updateDomesticShipment);
router.get('/user/shipments', authenticateToken, gspController.getUserGspShipments);

module.exports = router;
