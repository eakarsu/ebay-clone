const express = require('express');
const router = express.Router();
const { authenticateToken: authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/categoryFollowController');

router.get('/my', authenticate, ctrl.listMyFollows);
router.get('/feed', authenticate, ctrl.getFeed);
router.get('/is-following/:categoryId', authenticate, ctrl.isFollowing);
router.post('/', authenticate, ctrl.follow);
router.delete('/:categoryId', authenticate, ctrl.unfollow);

module.exports = router;
