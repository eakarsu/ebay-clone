const express = require('express');
const router = express.Router();
const { optionalAuth, authenticateToken } = require('../middleware/auth');
const c = require('../controllers/experimentController');

router.get('/assign/:key', optionalAuth, c.assign);
router.post('/convert', optionalAuth, c.convert);
router.get('/:key/results', authenticateToken, c.results);

module.exports = router;
