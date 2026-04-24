const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, remove } = require('../controllers/validationRuleController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, getAll);
router.post('/', authenticateToken, create);
router.get('/:id', authenticateToken, getById);
router.put('/:id', authenticateToken, update);
router.delete('/:id', authenticateToken, remove);

module.exports = router;
