const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  listActive,
  createFlashSale,
  listMine,
  cancelFlashSale,
} = require('../controllers/flashSaleController');

router.get('/active', listActive); // public
router.get('/mine', authenticateToken, listMine);
router.post('/', authenticateToken, createFlashSale);
router.delete('/:id', authenticateToken, cancelFlashSale);

module.exports = router;
