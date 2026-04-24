const express = require('express');
const router = express.Router();
const { getAll, getStats, getById, remove, cleanupExpired } = require('../controllers/tokenBlacklistController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, getAll);
router.get('/stats', authenticateToken, getStats);
router.post('/cleanup', authenticateToken, cleanupExpired);
router.get('/:id', authenticateToken, getById);
router.delete('/:id', authenticateToken, remove);

module.exports = router;
