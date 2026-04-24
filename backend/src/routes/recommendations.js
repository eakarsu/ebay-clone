const express = require('express');
const router = express.Router();
const { authenticateToken: authenticate, optionalAuth } = require('../middleware/auth');
const recommendationController = require('../controllers/recommendationController');
const { getForYou } = require('../controllers/forYouController');

router.get('/similar/:productId', recommendationController.getSimilarProducts);
router.get('/personalized', authenticate, recommendationController.getPersonalizedRecommendations);
router.get('/also-viewed/:productId', recommendationController.getCustomersAlsoViewed);
router.get('/bought-together/:productId', recommendationController.getFrequentlyBoughtTogether);
router.get('/trending', recommendationController.getTrending);
// For-You aggregate feed (optional auth — guests get trending + flash sales only)
router.get('/for-you', optionalAuth, getForYou);
router.post('/viewed/:productId', authenticate, recommendationController.markViewed);

module.exports = router;
