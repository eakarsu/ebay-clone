const express = require('express');
const router = express.Router();
const { authenticateToken: authenticate, optionalAuth } = require('../middleware/auth');
const questionController = require('../controllers/questionController');

router.get('/product/:productId', questionController.getProductQuestions);
router.get('/my', authenticate, questionController.getMyQuestions);
router.get('/seller', authenticate, questionController.getSellerQuestions);
router.post('/', authenticate, questionController.askQuestion);
router.post('/:questionId/answer', authenticate, questionController.answerQuestion);
router.post('/helpful/:answerId', authenticate, questionController.markHelpful);

module.exports = router;
