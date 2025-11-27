const express = require('express');
const router = express.Router();
const {
  validateCoupon,
  getAvailableCoupons,
  createCoupon,
  getCoupon,
  getMyCoupons,
  updateCoupon,
  deleteCoupon,
} = require('../controllers/couponController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.post('/validate', validateCoupon);
router.get('/available', getAvailableCoupons);
router.post('/', createCoupon);
router.get('/my', getMyCoupons);
router.get('/:id', getCoupon);
router.put('/:id', updateCoupon);
router.delete('/:id', deleteCoupon);

module.exports = router;
