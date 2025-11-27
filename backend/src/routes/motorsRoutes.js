// eBay Motors Routes
const express = require('express');
const router = express.Router();
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const motorsController = require('../controllers/motorsController');

// Public routes
router.get('/vehicles/search', motorsController.searchVehicles);
router.get('/vehicles/vin/:vin', motorsController.getVehicleByVin);
router.get('/vehicles/vin/:vin/decode', motorsController.decodeVin);
router.get('/vehicles/vin/:vin/history', motorsController.getVehicleHistory);
router.get('/parts/:productId/compatibility', motorsController.getCompatibleVehicles);
router.get('/parts/check-compatibility', motorsController.checkCompatibility);

// Protected routes
router.post('/vehicles', authenticateToken, motorsController.createVehicleListing);
router.post('/parts/compatibility', authenticateToken, motorsController.addPartsCompatibility);
router.post('/inspections', authenticateToken, motorsController.requestInspection);
router.get('/inspections/:vehicleId', authenticateToken, motorsController.getInspectionReport);

module.exports = router;
