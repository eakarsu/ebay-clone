const multer = require('multer');
const sharp = require('sharp');
const { pool } = require('../config/database');
const aiService = require('../services/aiService');

// In-memory uploads, capped at 6MB so we can hand a data URL to the vision model
// without persisting the image. Caller must POST multipart/form-data with field `image`.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image uploads are allowed'));
  },
});

const bufferToDataUrl = async (buffer, mime) => {
  // Re-encode to JPEG and cap dimensions so we keep request size under control.
  const resized = await sharp(buffer)
    .rotate()
    .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
  return `data:image/jpeg;base64,${resized.toString('base64')}`;
};

// POST /api/image-search
// Body: multipart field "image" OR { imageUrl: string }
const searchByImage = async (req, res, next) => {
  try {
    let imageUrl = null;

    if (req.file) {
      imageUrl = await bufferToDataUrl(req.file.buffer, req.file.mimetype);
    } else if (req.body?.imageUrl) {
      imageUrl = req.body.imageUrl;
    }

    if (!imageUrl) {
      return res.status(400).json({ error: 'Provide an image file or imageUrl' });
    }

    // 1) Vision: extract attributes
    const aiResult = await aiService.extractImageAttributes({ imageUrl });
    if (!aiResult.success) {
      return res.status(502).json({ error: aiResult.error });
    }
    const attrs = aiResult.attributes || {};

    // 2) Turn attributes into a full-text search query + brand/color filters
    const termParts = [];
    if (attrs.title) termParts.push(attrs.title);
    if (Array.isArray(attrs.keywords)) termParts.push(attrs.keywords.join(' '));
    if (attrs.brand) termParts.push(attrs.brand);
    const ftsQuery = termParts.join(' ').trim();

    let products = [];
    if (ftsQuery) {
      // Try FTS first (requires the search_vector column); gracefully fall back to ILIKE.
      const fts = await pool
        .query(
          `SELECT p.id, p.title, p.slug, p.buy_now_price, p.current_price,
                  (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) AS image_url,
                  ts_rank(p.search_vector, websearch_to_tsquery('english', $1)) AS rank
             FROM products p
            WHERE p.status = 'active'
              AND p.search_vector @@ websearch_to_tsquery('english', $1)
            ORDER BY rank DESC
            LIMIT 24`,
          [ftsQuery]
        )
        .catch(() => null);

      if (fts && fts.rows.length > 0) {
        products = fts.rows;
      } else {
        // Fallback: naive ILIKE on title using top keywords.
        const keywords = [attrs.brand, ...(attrs.keywords || []).slice(0, 4)].filter(Boolean);
        const like = keywords.map((k, i) => `p.title ILIKE $${i + 1}`).join(' OR ') || 'TRUE';
        const params = keywords.map((k) => `%${k}%`);
        const r = await pool.query(
          `SELECT p.id, p.title, p.slug, p.buy_now_price, p.current_price,
                  (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) AS image_url
             FROM products p
            WHERE p.status = 'active' AND (${like})
            ORDER BY p.created_at DESC
            LIMIT 24`,
          params
        );
        products = r.rows;
      }
    }

    res.json({
      query: {
        title: attrs.title || null,
        brand: attrs.brand || null,
        color: attrs.color || null,
        category: attrs.category || null,
        keywords: attrs.keywords || [],
      },
      products: products.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        price: parseFloat(p.buy_now_price || p.current_price || 0),
        imageUrl: p.image_url,
      })),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { searchByImage, upload };
