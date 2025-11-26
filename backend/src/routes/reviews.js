const express = require('express');
const router = express.Router();
const { createReview, getProductReviews, getUserReviews, markReviewHelpful } = require('../controllers/reviewController');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, createReview);
router.get('/product/:productId', getProductReviews);
router.get('/user/:userId', getUserReviews);
router.post('/:reviewId/helpful', markReviewHelpful);

module.exports = router;
