// Best Match Algorithm Controller
const { pool } = require('../config/database');

// Get product quality score factors
const getQualityFactors = async (req, res) => {
  try {
    const factors = {
      listingQuality: {
        weight: 0.25,
        components: ['title_relevance', 'description_quality', 'images_count', 'item_specifics']
      },
      sellerPerformance: {
        weight: 0.30,
        components: ['feedback_score', 'defect_rate', 'shipping_speed', 'response_time']
      },
      pricing: {
        weight: 0.20,
        components: ['competitive_price', 'shipping_cost', 'value_rating']
      },
      engagement: {
        weight: 0.15,
        components: ['views', 'watchers', 'sales_count', 'conversion_rate']
      },
      recency: {
        weight: 0.10,
        components: ['listing_age', 'recent_activity']
      }
    };

    res.json(factors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Calculate quality score for a product
const calculateQualityScore = async (productId) => {
  const product = await pool.query(
    `SELECT p.*, u.id as seller_id,
            (SELECT COUNT(*) FROM product_images WHERE product_id = p.id) as image_count,
            (SELECT COUNT(*) FROM product_item_specifics WHERE product_id = p.id) as specifics_count
     FROM products p
     JOIN users u ON p.seller_id = u.id
     WHERE p.id = $1`,
    [productId]
  );

  if (product.rows.length === 0) return null;

  const p = product.rows[0];

  // Get seller performance
  const sellerPerf = await pool.query(
    `SELECT * FROM seller_performance WHERE seller_id = $1`,
    [p.seller_id]
  );

  // Get engagement metrics
  const engagement = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM bids WHERE product_id = $1) as bid_count,
       (SELECT COUNT(*) FROM watchlist WHERE product_id = $1) as watch_count
     FROM products WHERE id = $1`,
    [productId]
  );

  // Calculate component scores (0-100)
  const titleScore = Math.min(100, (p.title?.length || 0) * 2);
  const descriptionScore = Math.min(100, (p.description?.length || 0) / 10);
  const imageScore = Math.min(100, (p.image_count || 0) * 15);
  const specificsScore = Math.min(100, (p.specifics_count || 0) * 10);

  const listingQuality = (titleScore + descriptionScore + imageScore + specificsScore) / 4;

  // Seller performance score
  const perf = sellerPerf.rows[0] || {};
  const feedbackScore = perf.feedback_score || 50;
  const defectScore = 100 - ((perf.defect_rate || 0) * 1000);
  const sellerScore = (feedbackScore + Math.max(0, defectScore)) / 2;

  // Engagement score
  const eng = engagement.rows[0] || {};
  const engagementScore = Math.min(100, ((eng.bid_count || 0) * 10) + ((eng.watch_count || 0) * 5));

  // Recency score (newer listings score higher)
  const daysSinceListing = Math.floor((Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24));
  const recencyScore = Math.max(0, 100 - (daysSinceListing * 2));

  // Calculate weighted total
  const totalScore = (
    listingQuality * 0.25 +
    sellerScore * 0.30 +
    50 * 0.20 + // Placeholder for pricing competitiveness
    engagementScore * 0.15 +
    recencyScore * 0.10
  );

  return {
    productId,
    totalScore: Math.round(totalScore * 100) / 100,
    components: {
      listingQuality: Math.round(listingQuality),
      sellerScore: Math.round(sellerScore),
      engagementScore: Math.round(engagementScore),
      recencyScore: Math.round(recencyScore)
    }
  };
};

// Update product quality score
const updateProductQualityScore = async (req, res) => {
  try {
    const { productId } = req.params;

    const score = await calculateQualityScore(productId);

    if (!score) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Upsert quality score
    await pool.query(
      `INSERT INTO product_quality_scores (product_id, quality_score, components, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (product_id) DO UPDATE SET
       quality_score = $2, components = $3, updated_at = CURRENT_TIMESTAMP`,
      [productId, score.totalScore, JSON.stringify(score.components)]
    );

    res.json(score);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Search products with Best Match sorting
const searchWithBestMatch = async (req, res) => {
  try {
    const { query, category, minPrice, maxPrice, condition, sortBy = 'best_match', page = 1, limit = 48 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = `p.status = 'active'`;
    const params = [];
    let paramCount = 0;

    if (query) {
      paramCount++;
      whereClause += ` AND (p.title ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
      params.push(`%${query}%`);
    }

    if (category) {
      paramCount++;
      whereClause += ` AND p.category_id = $${paramCount}`;
      params.push(category);
    }

    if (minPrice) {
      paramCount++;
      whereClause += ` AND p.current_price >= $${paramCount}`;
      params.push(minPrice);
    }

    if (maxPrice) {
      paramCount++;
      whereClause += ` AND p.current_price <= $${paramCount}`;
      params.push(maxPrice);
    }

    if (condition) {
      paramCount++;
      whereClause += ` AND p.condition = $${paramCount}`;
      params.push(condition);
    }

    // Determine sort order
    let orderBy;
    switch (sortBy) {
      case 'price_low':
        orderBy = 'p.current_price ASC';
        break;
      case 'price_high':
        orderBy = 'p.current_price DESC';
        break;
      case 'ending_soonest':
        orderBy = `CASE WHEN p.listing_type = 'auction' THEN p.auction_end ELSE '9999-12-31'::timestamp END ASC`;
        break;
      case 'newly_listed':
        orderBy = 'p.created_at DESC';
        break;
      case 'best_match':
      default:
        orderBy = 'COALESCE(pqs.quality_score, 50) DESC, p.created_at DESC';
        break;
    }

    // Main search query with quality scores
    const result = await pool.query(
      `SELECT p.*, c.name as category_name,
              u.username as seller_name,
              COALESCE(pqs.quality_score, 50) as match_score,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image,
              (SELECT COUNT(*) FROM bids WHERE product_id = p.id) as bid_count,
              (SELECT COUNT(*) FROM watchlist WHERE product_id = p.id) as watch_count
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN users u ON p.seller_id = u.id
       LEFT JOIN product_quality_scores pqs ON p.id = pqs.product_id
       WHERE ${whereClause}
       ORDER BY ${orderBy}
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...params, limit, offset]
    );

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM products p WHERE ${whereClause}`,
      params
    );

    // Track search impression
    if (req.user && query) {
      await pool.query(
        `INSERT INTO search_impressions (user_id, search_query, result_count)
         VALUES ($1, $2, $3)`,
        [req.user.id, query, countResult.rows[0].total]
      );
    }

    res.json({
      products: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      },
      sortBy
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get recommended products for user
const getRecommendations = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      // Return trending products for non-logged in users
      const trending = await pool.query(
        `SELECT p.*,
                (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image,
                (SELECT COUNT(*) FROM bids WHERE product_id = p.id) as bid_count
         FROM products p
         WHERE p.status = 'active'
         ORDER BY (SELECT COUNT(*) FROM bids WHERE product_id = p.id) DESC
         LIMIT 12`
      );
      return res.json({ type: 'trending', products: trending.rows });
    }

    // Get user's recent activity (viewed categories, bids, purchases)
    const userActivity = await pool.query(
      `SELECT DISTINCT p.category_id
       FROM (
         SELECT product_id FROM bids WHERE bidder_id = $1
         UNION
         SELECT product_id FROM watchlist WHERE user_id = $1
         UNION
         SELECT product_id FROM orders WHERE buyer_id = $1
       ) AS activity
       JOIN products p ON activity.product_id = p.id
       LIMIT 5`,
      [userId]
    );

    const categoryIds = userActivity.rows.map(r => r.category_id).filter(Boolean);

    let recommendations;
    if (categoryIds.length > 0) {
      // Recommend from user's interested categories
      recommendations = await pool.query(
        `SELECT p.*,
                COALESCE(pqs.quality_score, 50) as match_score,
                (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image
         FROM products p
         LEFT JOIN product_quality_scores pqs ON p.id = pqs.product_id
         WHERE p.status = 'active' AND p.category_id = ANY($1)
         AND p.id NOT IN (SELECT product_id FROM orders WHERE buyer_id = $2)
         ORDER BY COALESCE(pqs.quality_score, 50) DESC
         LIMIT 12`,
        [categoryIds, userId]
      );
    } else {
      // Fall back to trending
      recommendations = await pool.query(
        `SELECT p.*,
                (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image
         FROM products p
         WHERE p.status = 'active'
         ORDER BY p.created_at DESC
         LIMIT 12`
      );
    }

    res.json({ type: 'personalized', products: recommendations.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Batch update quality scores (for cron job)
const batchUpdateQualityScores = async (req, res) => {
  try {
    const products = await pool.query(
      `SELECT id FROM products WHERE status = 'active'`
    );

    let updated = 0;
    for (const product of products.rows) {
      try {
        const score = await calculateQualityScore(product.id);
        if (score) {
          await pool.query(
            `INSERT INTO product_quality_scores (product_id, quality_score, components, updated_at)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
             ON CONFLICT (product_id) DO UPDATE SET
             quality_score = $2, components = $3, updated_at = CURRENT_TIMESTAMP`,
            [product.id, score.totalScore, JSON.stringify(score.components)]
          );
          updated++;
        }
      } catch (e) {
        console.error(`Failed to update score for product ${product.id}:`, e.message);
      }
    }

    res.json({ message: `Updated ${updated} product quality scores` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getQualityFactors,
  updateProductQualityScore,
  searchWithBestMatch,
  getRecommendations,
  batchUpdateQualityScores
};
