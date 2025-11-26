const { pool } = require('../config/database');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Ensure upload directories exist
const uploadDir = process.env.UPLOAD_DIR || './uploads';
const imagesDir = path.join(uploadDir, 'images');
const thumbnailsDir = path.join(uploadDir, 'thumbnails');

[uploadDir, imagesDir, thumbnailsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Multer configuration
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
    files: 10,
  },
});

// Process and save image
const processImage = async (buffer, filename) => {
  const imageFilename = `${filename}.webp`;
  const thumbnailFilename = `${filename}_thumb.webp`;

  const imagePath = path.join(imagesDir, imageFilename);
  const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);

  // Process main image (max 1200px width)
  await sharp(buffer)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(imagePath);

  // Create thumbnail (300px)
  await sharp(buffer)
    .resize(300, 300, { fit: 'cover' })
    .webp({ quality: 80 })
    .toFile(thumbnailPath);

  return {
    image: `/uploads/images/${imageFilename}`,
    thumbnail: `/uploads/thumbnails/${thumbnailFilename}`,
  };
};

// Upload single image
const uploadSingle = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filename = `${uuidv4()}_${Date.now()}`;
    const paths = await processImage(req.file.buffer, filename);

    res.json({
      success: true,
      image: {
        url: paths.image,
        thumbnail: paths.thumbnail,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Upload multiple images
const uploadMultiple = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const images = await Promise.all(
      req.files.map(async (file, index) => {
        const filename = `${uuidv4()}_${Date.now()}_${index}`;
        const paths = await processImage(file.buffer, filename);
        return {
          url: paths.image,
          thumbnail: paths.thumbnail,
        };
      })
    );

    res.json({
      success: true,
      images,
    });
  } catch (error) {
    next(error);
  }
};

// Upload product images
const uploadProductImages = async (req, res, next) => {
  try {
    const { productId } = req.params;

    // Verify product ownership
    const productResult = await pool.query(
      'SELECT seller_id FROM products WHERE id = $1',
      [productId]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (productResult.rows[0].seller_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Get current image count
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM product_images WHERE product_id = $1',
      [productId]
    );
    const currentCount = parseInt(countResult.rows[0].count);

    if (currentCount + req.files.length > 12) {
      return res.status(400).json({ error: 'Maximum 12 images per product' });
    }

    const images = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const filename = `product_${productId}_${uuidv4()}`;
      const paths = await processImage(file.buffer, filename);

      const isPrimary = currentCount === 0 && i === 0;

      const result = await pool.query(
        `INSERT INTO product_images (product_id, image_url, thumbnail_url, sort_order, is_primary)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [productId, paths.image, paths.thumbnail, currentCount + i, isPrimary]
      );

      images.push({
        id: result.rows[0].id,
        url: paths.image,
        thumbnail: paths.thumbnail,
        isPrimary,
      });
    }

    res.json({
      success: true,
      images,
    });
  } catch (error) {
    next(error);
  }
};

// Delete product image
const deleteProductImage = async (req, res, next) => {
  try {
    const { productId, imageId } = req.params;

    // Verify ownership
    const result = await pool.query(
      `SELECT pi.*, p.seller_id
       FROM product_images pi
       JOIN products p ON pi.product_id = p.id
       WHERE pi.id = $1 AND pi.product_id = $2`,
      [imageId, productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    if (result.rows[0].seller_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const image = result.rows[0];

    // Delete files
    const imagePath = path.join(process.cwd(), image.image_url);
    const thumbnailPath = path.join(process.cwd(), image.thumbnail_url);

    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    if (fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath);

    // Delete from database
    await pool.query('DELETE FROM product_images WHERE id = $1', [imageId]);

    // If was primary, set new primary
    if (image.is_primary) {
      await pool.query(
        `UPDATE product_images SET is_primary = true
         WHERE product_id = $1 AND id = (
           SELECT id FROM product_images WHERE product_id = $1 ORDER BY sort_order LIMIT 1
         )`,
        [productId]
      );
    }

    res.json({ success: true, message: 'Image deleted' });
  } catch (error) {
    next(error);
  }
};

// Set primary image
const setPrimaryImage = async (req, res, next) => {
  try {
    const { productId, imageId } = req.params;

    // Verify ownership
    const result = await pool.query(
      `SELECT p.seller_id FROM products p
       JOIN product_images pi ON p.id = pi.product_id
       WHERE pi.id = $1 AND p.id = $2`,
      [imageId, productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    if (result.rows[0].seller_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Remove primary from all
    await pool.query(
      'UPDATE product_images SET is_primary = false WHERE product_id = $1',
      [productId]
    );

    // Set new primary
    await pool.query(
      'UPDATE product_images SET is_primary = true WHERE id = $1',
      [imageId]
    );

    res.json({ success: true, message: 'Primary image updated' });
  } catch (error) {
    next(error);
  }
};

// Reorder images
const reorderImages = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { imageOrder } = req.body; // Array of image IDs in new order

    // Verify ownership
    const productResult = await pool.query(
      'SELECT seller_id FROM products WHERE id = $1',
      [productId]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (productResult.rows[0].seller_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Update sort order for each image
    for (let i = 0; i < imageOrder.length; i++) {
      await pool.query(
        'UPDATE product_images SET sort_order = $1 WHERE id = $2 AND product_id = $3',
        [i, imageOrder[i], productId]
      );
    }

    res.json({ success: true, message: 'Images reordered' });
  } catch (error) {
    next(error);
  }
};

// Upload avatar
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filename = `avatar_${req.user.id}_${Date.now()}`;
    const avatarFilename = `${filename}.webp`;
    const avatarPath = path.join(imagesDir, avatarFilename);

    // Process avatar (square, 200x200)
    await sharp(req.file.buffer)
      .resize(200, 200, { fit: 'cover' })
      .webp({ quality: 85 })
      .toFile(avatarPath);

    const avatarUrl = `/uploads/images/${avatarFilename}`;

    // Update user
    await pool.query(
      'UPDATE users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [avatarUrl, req.user.id]
    );

    res.json({
      success: true,
      avatarUrl,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadProductImages,
  deleteProductImage,
  setPrimaryImage,
  reorderImages,
  uploadAvatar,
};
