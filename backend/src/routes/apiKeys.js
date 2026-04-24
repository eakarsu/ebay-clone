const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const c = require('../controllers/apiKeyController');

router.use(authenticateToken);
router.get('/', c.listKeys);
router.post('/', c.createKey);
router.post('/:id/rotate', c.rotateKey);
router.delete('/:id', c.revokeKey);

module.exports = router;
