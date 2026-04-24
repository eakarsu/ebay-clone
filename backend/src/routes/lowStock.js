const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { listLowStock, setThreshold } = require('../controllers/lowStockController');

router.get('/', authenticateToken, listLowStock);
router.put('/:productId', authenticateToken, setThreshold);

module.exports = router;
