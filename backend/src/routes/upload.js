const express = require('express');
const router = express.Router();
const {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadProductImages,
  deleteProductImage,
  setPrimaryImage,
  reorderImages,
  uploadAvatar,
} = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// General uploads
router.post('/single', upload.single('image'), uploadSingle);
router.post('/multiple', upload.array('images', 10), uploadMultiple);

// Product images
router.post('/product/:productId', upload.array('images', 10), uploadProductImages);
router.delete('/product/:productId/image/:imageId', deleteProductImage);
router.put('/product/:productId/image/:imageId/primary', setPrimaryImage);
router.put('/product/:productId/reorder', reorderImages);

// Avatar
router.post('/avatar', upload.single('avatar'), uploadAvatar);

module.exports = router;
