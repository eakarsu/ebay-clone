const express = require('express');
const router = express.Router();
const { authenticateToken: authenticate, optionalAuth } = require('../middleware/auth');
const collectionController = require('../controllers/collectionController');

router.get('/my', authenticate, collectionController.getMyCollections);
router.get('/public', collectionController.getPublicCollections);
router.get('/:id', optionalAuth, collectionController.getCollection);
router.post('/', authenticate, collectionController.createCollection);
router.put('/:id', authenticate, collectionController.updateCollection);
router.delete('/:id', authenticate, collectionController.deleteCollection);
router.post('/:id/items', authenticate, collectionController.addItem);
router.delete('/:id/items/:productId', authenticate, collectionController.removeItem);
router.post('/:id/follow', authenticate, collectionController.followCollection);
router.delete('/:id/follow', authenticate, collectionController.unfollowCollection);

module.exports = router;
