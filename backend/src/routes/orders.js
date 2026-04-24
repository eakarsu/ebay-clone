const express = require('express');
const router = express.Router();
const { createOrder, getOrders, getOrderById, updateOrderStatus } = require('../controllers/orderController');
const { getOrderTimeline } = require('../controllers/orderTimelineController');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, createOrder);
router.get('/', authenticateToken, getOrders);
router.get('/:id', authenticateToken, getOrderById);
router.get('/:id/timeline', authenticateToken, getOrderTimeline);
router.put('/:id/status', authenticateToken, updateOrderStatus);

module.exports = router;
