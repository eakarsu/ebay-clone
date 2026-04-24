const express = require('express');
const router = express.Router();
const { getAll, getStats, getById, create, update, remove } = require('../controllers/errorLogController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

router.get('/', authenticateToken, getAll);
router.get('/stats', authenticateToken, getStats);
router.post('/', optionalAuth, create);
router.get('/:id', authenticateToken, getById);
router.put('/:id', authenticateToken, update);
router.delete('/:id', authenticateToken, remove);

module.exports = router;
