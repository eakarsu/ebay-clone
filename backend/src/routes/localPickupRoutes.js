// Local Pickup Routes
const express = require('express');
const router = express.Router();
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const localPickupController = require('../controllers/localPickupController');

// Public routes
router.get('/products/:productId/availability', optionalAuth, localPickupController.checkPickupAvailability);
router.get('/settings/:sellerId', localPickupController.getPickupSettings);

// Protected routes - Seller
router.get('/settings', authenticateToken, localPickupController.getPickupSettings);
router.put('/settings', authenticateToken, localPickupController.updatePickupSettings);
router.put('/settings/toggle', authenticateToken, localPickupController.togglePickupAvailability);
router.get('/seller/appointments', authenticateToken, localPickupController.getSellerPickups);
router.put('/appointments/:appointmentId/status', authenticateToken, localPickupController.updateAppointmentStatus);

// Protected routes - Buyer
router.post('/appointments', authenticateToken, localPickupController.schedulePickup);
router.get('/appointments/:appointmentId', authenticateToken, localPickupController.getPickupAppointment);
router.get('/buyer/appointments', authenticateToken, localPickupController.getBuyerPickups);

module.exports = router;
