const express = require('express');
const router = express.Router();
const {
  createDispute,
  getDispute,
  getMyDisputes,
  addDisputeMessage,
  resolveDispute,
  escalateDispute,
} = require('../controllers/disputeController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.post('/', createDispute);
router.get('/', getMyDisputes);
router.get('/:id', getDispute);
router.post('/:id/messages', addDisputeMessage);
router.post('/:id/resolve', resolveDispute);
router.post('/:id/escalate', escalateDispute);

module.exports = router;
