const express = require('express');
const router = express.Router();
const { authenticateToken: authenticate } = require('../middleware/auth');
const bidRetractionController = require('../controllers/bidRetractionController');

router.get('/my', authenticate, bidRetractionController.getMyRetractions);
router.get('/pending', authenticate, bidRetractionController.getPendingRetractions);
router.post('/', authenticate, bidRetractionController.requestRetraction);
router.put('/:id/review', authenticate, bidRetractionController.reviewRetraction);

module.exports = router;
