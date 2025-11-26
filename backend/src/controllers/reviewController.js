const { pool } = require('../config/database');

const createReview = async (req, res, next) => {
  try {
    const { orderId, productId, reviewedUserId, reviewType, rating, title, comment } = req.body;

    // Validate review type and required fields
    if (reviewType === 'product' && !productId) {
      return res.status(400).json({ error: 'Product ID required for product review' });
    }

    if ((reviewType === 'seller' || reviewType === 'buyer') && !reviewedUserId) {
      return res.status(400).json({ error: 'User ID required for user review' });
    }

    // Check if order exists and user is part of it
    if (orderId) {
      const orderResult = await pool.query(
        'SELECT id, buyer_id, seller_id FROM orders WHERE id = $1',
        [orderId]
      );

      if (orderResult.rows.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const order = orderResult.rows[0];
      if (order.buyer_id !== req.user.id && order.seller_id !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to review this order' });
      }
    }

    // Check for duplicate review
    const existingReview = await pool.query(
      `SELECT id FROM reviews
       WHERE reviewer_id = $1 AND review_type = $2
       AND (order_id = $3 OR product_id = $4 OR reviewed_user_id = $5)`,
      [req.user.id, reviewType, orderId || null, productId || null, reviewedUserId || null]
    );

    if (existingReview.rows.length > 0) {
      return res.status(400).json({ error: 'You have already submitted a review' });
    }

    const result = await pool.query(
      `INSERT INTO reviews (order_id, product_id, reviewer_id, reviewed_user_id, review_type, rating, title, comment, is_verified_purchase)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [orderId || null, productId || null, req.user.id, reviewedUserId || null, reviewType, rating, title || null, comment || null, !!orderId]
    );

    // Update seller rating if it's a seller review
    if (reviewType === 'seller' && reviewedUserId) {
      const avgResult = await pool.query(
        `SELECT AVG(rating) as avg_rating FROM reviews
         WHERE reviewed_user_id = $1 AND review_type = 'seller'`,
        [reviewedUserId]
      );
      await pool.query(
        'UPDATE users SET seller_rating = $1 WHERE id = $2',
        [avgResult.rows[0].avg_rating, reviewedUserId]
      );
    }

    // Notify reviewed user
    if (reviewedUserId) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, link)
         VALUES ($1, 'review', 'New Review', $2, $3)`,
        [reviewedUserId, `You received a ${rating}-star review`, `/reviews`]
      );
    }

    res.status(201).json({
      message: 'Review submitted successfully',
      review: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT r.id, r.rating, r.title, r.comment, r.is_verified_purchase, r.helpful_count, r.created_at,
              u.username, u.avatar_url
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.product_id = $1 AND r.review_type = 'product'
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [productId, limit, offset]
    );

    const countResult = await pool.query(
      "SELECT COUNT(*) as total, AVG(rating) as avg_rating FROM reviews WHERE product_id = $1 AND review_type = 'product'",
      [productId]
    );

    const stats = countResult.rows[0];

    res.json({
      reviews: result.rows.map(r => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        isVerifiedPurchase: r.is_verified_purchase,
        helpfulCount: r.helpful_count,
        createdAt: r.created_at,
        reviewer: {
          username: r.username,
          avatarUrl: r.avatar_url,
        },
      })),
      stats: {
        totalReviews: parseInt(stats.total),
        averageRating: parseFloat(stats.avg_rating) || 0,
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(stats.total),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getUserReviews = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { type = 'seller', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT r.id, r.rating, r.title, r.comment, r.is_verified_purchase, r.helpful_count, r.created_at,
              u.username, u.avatar_url
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.reviewed_user_id = $1 AND r.review_type = $2
       ORDER BY r.created_at DESC
       LIMIT $3 OFFSET $4`,
      [userId, type, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) as total, AVG(rating) as avg_rating FROM reviews WHERE reviewed_user_id = $1 AND review_type = $2',
      [userId, type]
    );

    const stats = countResult.rows[0];

    // Get rating breakdown
    const breakdownResult = await pool.query(
      `SELECT rating, COUNT(*) as count FROM reviews
       WHERE reviewed_user_id = $1 AND review_type = $2
       GROUP BY rating ORDER BY rating DESC`,
      [userId, type]
    );

    const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    breakdownResult.rows.forEach(row => {
      ratingBreakdown[row.rating] = parseInt(row.count);
    });

    res.json({
      reviews: result.rows.map(r => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        isVerifiedPurchase: r.is_verified_purchase,
        helpfulCount: r.helpful_count,
        createdAt: r.created_at,
        reviewer: {
          username: r.username,
          avatarUrl: r.avatar_url,
        },
      })),
      stats: {
        totalReviews: parseInt(stats.total),
        averageRating: parseFloat(stats.avg_rating) || 0,
        ratingBreakdown,
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(stats.total),
      },
    });
  } catch (error) {
    next(error);
  }
};

const markReviewHelpful = async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    await pool.query(
      'UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = $1',
      [reviewId]
    );

    res.json({ message: 'Marked as helpful' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createReview, getProductReviews, getUserReviews, markReviewHelpful };
