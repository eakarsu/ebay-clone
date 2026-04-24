const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  listOpen,
  getGroupBuy,
  createGroupBuy,
  commitQuantity,
  withdrawCommitment,
} = require('../controllers/groupBuyController');

router.get('/', listOpen);
router.get('/:id', getGroupBuy);
router.post('/', authenticateToken, createGroupBuy);
router.post('/:id/commit', authenticateToken, commitQuantity);
router.delete('/:id/commit', authenticateToken, withdrawCommitment);

module.exports = router;
