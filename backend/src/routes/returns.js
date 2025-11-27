const express = require('express');
const router = express.Router();
const {
  createReturn,
  getReturn,
  getMyReturns,
  approveReturn,
  rejectReturn,
  updateReturnTracking,
  markReturnReceived,
  processReturnRefund,
} = require('../controllers/returnController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.post('/', createReturn);
router.get('/', getMyReturns);
router.get('/:id', getReturn);
router.post('/:id/approve', approveReturn);
router.post('/:id/reject', rejectReturn);
router.put('/:id/tracking', updateReturnTracking);
router.post('/:id/received', markReturnReceived);
router.post('/:id/refund', processReturnRefund);

module.exports = router;
