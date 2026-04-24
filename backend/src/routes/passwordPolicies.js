const express = require('express');
const router = express.Router();
const { getAll, getActive, getById, create, update, remove, validate } = require('../controllers/passwordPolicyController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, getAll);
router.get('/active', authenticateToken, getActive);
router.post('/validate', validate);
router.post('/', authenticateToken, create);
router.get('/:id', authenticateToken, getById);
router.put('/:id', authenticateToken, update);
router.delete('/:id', authenticateToken, remove);

module.exports = router;
