const express = require('express');
const router = express.Router();
const { getAll, getStats, getById, update, remove } = require('../controllers/securityAuditController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, getAll);
router.get('/stats', authenticateToken, getStats);
router.get('/:id', authenticateToken, getById);
router.put('/:id', authenticateToken, update);
router.delete('/:id', authenticateToken, remove);

module.exports = router;
