const express = require('express');
const router = express.Router();
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const c = require('../controllers/promotionController');

router.get('/slots', optionalAuth, c.getSlots);
router.post('/click', optionalAuth, c.click);
router.post('/', authenticateToken, c.upsert);
router.get('/mine', authenticateToken, c.listMine);
router.patch('/:id', authenticateToken, c.setStatus);

module.exports = router;
