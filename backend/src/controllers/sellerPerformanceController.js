// Seller Performance Standards Controller - Complete Implementation
const { pool } = require('../config/database');

// Initialize tables if they don't exist
const initializeTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS seller_performance (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        seller_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        total_transactions INTEGER DEFAULT 0,
        defect_count INTEGER DEFAULT 0,
        defect_rate DECIMAL(5,4) DEFAULT 0,
        late_shipment_count INTEGER DEFAULT 0,
        late_shipment_rate DECIMAL(5,4) DEFAULT 0,
        cases_closed_without_resolution INTEGER DEFAULT 0,
        case_rate DECIMAL(5,4) DEFAULT 0,
        tracking_uploaded_count INTEGER DEFAULT 0,
        tracking_uploaded_rate DECIMAL(5,4) DEFAULT 0,
        positive_feedback_count INTEGER DEFAULT 0,
        negative_feedback_count INTEGER DEFAULT 0,
        neutral_feedback_count INTEGER DEFAULT 0,
        feedback_score DECIMAL(5,2) DEFAULT 100,
        seller_level VARCHAR(30) DEFAULT 'standard',
        top_rated_since TIMESTAMP,
        below_standard_since TIMESTAMP,
        final_value_fee_discount DECIMAL(5,2) DEFAULT 0,
        promoted_listing_discount DECIMAL(5,2) DEFAULT 0,
        selling_restricted BOOLEAN DEFAULT false,
        listing_limit INTEGER,
        evaluation_date DATE DEFAULT CURRENT_DATE,
        next_evaluation_date DATE DEFAULT (CURRENT_DATE + INTERVAL '1 month'),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS seller_defects (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
        order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
        defect_type VARCHAR(50) NOT NULL,
        description TEXT,
        defect_date DATE DEFAULT CURRENT_DATE,
        counts_toward_rate BOOLEAN DEFAULT true,
        appeal_status VARCHAR(20) DEFAULT 'none',
        appeal_reason TEXT,
        appeal_date TIMESTAMP,
        appeal_decision TEXT,
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS seller_benefits (
        id SERIAL PRIMARY KEY,
        level VARCHAR(30) UNIQUE NOT NULL,
        fvf_discount DECIMAL(5,2) DEFAULT 0,
        promoted_discount DECIMAL(5,2) DEFAULT 0,
        top_rated_badge BOOLEAN DEFAULT false,
        priority_support BOOLEAN DEFAULT false,
        fast_n_free BOOLEAN DEFAULT false,
        search_boost DECIMAL(5,2) DEFAULT 0,
        restrictions JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Insert default benefits if none exist
    const existingBenefits = await pool.query('SELECT COUNT(*) FROM seller_benefits');
    if (parseInt(existingBenefits.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO seller_benefits (level, fvf_discount, promoted_discount, top_rated_badge, priority_support, fast_n_free, search_boost, restrictions)
        VALUES
          ('below_standard', -5, 0, false, false, false, -20, '["Search visibility reduced", "May face selling limits"]'),
          ('standard', 0, 0, false, false, false, 0, '[]'),
          ('above_standard', 0, 5, false, false, false, 5, '[]'),
          ('top_rated', 10, 10, true, true, false, 15, '[]'),
          ('top_rated_plus', 20, 15, true, true, true, 25, '[]')
      `);
    }
  } catch (error) {
    // Tables may already exist or have dependencies issues - continue
    console.error('Error initializing seller performance tables:', error.message);
  }
};

// Initialize on module load
initializeTables();

// Get seller performance
const getSellerPerformance = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const targetId = sellerId || req.user.id;

    let result = await pool.query(
      `SELECT * FROM seller_performance WHERE seller_id = $1`,
      [targetId]
    );

    // If no record exists, create one with defaults
    if (result.rows.length === 0) {
      result = await pool.query(
        `INSERT INTO seller_performance (seller_id, evaluation_date, next_evaluation_date)
         VALUES ($1, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month')
         RETURNING *`,
        [targetId]
      );
    }

    const performance = result.rows[0];

    // Get additional stats from related tables
    const statsQuery = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM orders WHERE seller_id = $1 AND created_at >= NOW() - INTERVAL '12 months') as recent_sales,
        (SELECT COUNT(*) FROM products WHERE seller_id = $1 AND status = 'active') as active_listings,
        (SELECT AVG(rating) FROM reviews WHERE reviewed_user_id = $1 AND review_type = 'seller') as avg_rating
    `, [targetId]);

    res.json({
      ...performance,
      recentSales: statsQuery.rows[0]?.recent_sales || 0,
      activeListings: statsQuery.rows[0]?.active_listings || 0,
      averageRating: parseFloat(statsQuery.rows[0]?.avg_rating) || 0
    });
  } catch (error) {
    console.error('Get seller performance error:', error.message);
    res.status(500).json({ error: 'Failed to fetch seller performance' });
  }
};

// Calculate and update seller performance (should be run periodically)
const calculatePerformance = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    // Get transaction counts
    const transactions = await pool.query(
      `SELECT COUNT(*) as total FROM orders
       WHERE seller_id = $1 AND created_at >= $2`,
      [sellerId, twelveMonthsAgo]
    );

    // Get defects
    const defects = await pool.query(
      `SELECT COUNT(*) as total FROM seller_defects
       WHERE seller_id = $1 AND defect_date >= $2 AND counts_toward_rate = true`,
      [sellerId, twelveMonthsAgo]
    );

    // Get late shipments
    const lateShipments = await pool.query(
      `SELECT COUNT(*) as total FROM orders
       WHERE seller_id = $1 AND created_at >= $2
       AND shipped_at > created_at + INTERVAL '3 days'`,
      [sellerId, twelveMonthsAgo]
    );

    // Get tracking uploaded count
    const trackingUploaded = await pool.query(
      `SELECT COUNT(*) as total FROM orders
       WHERE seller_id = $1 AND created_at >= $2 AND tracking_number IS NOT NULL`,
      [sellerId, twelveMonthsAgo]
    );

    // Get feedback
    const feedback = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE rating >= 4) as positive,
         COUNT(*) FILTER (WHERE rating = 3) as neutral,
         COUNT(*) FILTER (WHERE rating < 3) as negative
       FROM reviews
       WHERE reviewed_user_id = $1 AND created_at >= $2 AND review_type = 'seller'`,
      [sellerId, twelveMonthsAgo]
    );

    const totalTransactions = parseInt(transactions.rows[0].total) || 1;
    const defectCount = parseInt(defects.rows[0].total);
    const lateCount = parseInt(lateShipments.rows[0].total);
    const trackingCount = parseInt(trackingUploaded.rows[0].total);
    const { positive, neutral, negative } = feedback.rows[0];

    const defectRate = defectCount / totalTransactions;
    const lateRate = lateCount / totalTransactions;
    const trackingRate = trackingCount / totalTransactions;
    const totalFeedback = parseInt(positive) + parseInt(neutral) + parseInt(negative);
    const feedbackScore = totalFeedback > 0 ? (parseInt(positive) / totalFeedback) * 100 : 100;

    // Determine seller level
    let sellerLevel = 'standard';
    let feeDiscount = 0;
    let promotedDiscount = 0;

    if (defectRate <= 0.005 && lateRate <= 0.03 && feedbackScore >= 98 && totalTransactions >= 100) {
      sellerLevel = 'top_rated_plus';
      feeDiscount = 20;
      promotedDiscount = 15;
    } else if (defectRate <= 0.01 && lateRate <= 0.05 && feedbackScore >= 95 && totalTransactions >= 50) {
      sellerLevel = 'top_rated';
      feeDiscount = 10;
      promotedDiscount = 10;
    } else if (defectRate <= 0.02 && feedbackScore >= 90) {
      sellerLevel = 'above_standard';
      promotedDiscount = 5;
    } else if (defectRate > 0.05 || feedbackScore < 85) {
      sellerLevel = 'below_standard';
      feeDiscount = -5;
    }

    // Update or insert performance record
    const result = await pool.query(
      `INSERT INTO seller_performance
       (seller_id, total_transactions, defect_count, defect_rate,
        late_shipment_count, late_shipment_rate,
        tracking_uploaded_count, tracking_uploaded_rate,
        positive_feedback_count, negative_feedback_count, neutral_feedback_count,
        feedback_score, seller_level, final_value_fee_discount, promoted_listing_discount,
        evaluation_date, next_evaluation_date, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month', CURRENT_TIMESTAMP)
       ON CONFLICT (seller_id) DO UPDATE SET
        total_transactions = $2, defect_count = $3, defect_rate = $4,
        late_shipment_count = $5, late_shipment_rate = $6,
        tracking_uploaded_count = $7, tracking_uploaded_rate = $8,
        positive_feedback_count = $9, negative_feedback_count = $10, neutral_feedback_count = $11,
        feedback_score = $12, seller_level = $13, final_value_fee_discount = $14, promoted_listing_discount = $15,
        evaluation_date = CURRENT_DATE, next_evaluation_date = CURRENT_DATE + INTERVAL '1 month',
        updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [sellerId, totalTransactions, defectCount, defectRate, lateCount, lateRate,
       trackingCount, trackingRate,
       parseInt(positive), parseInt(negative), parseInt(neutral), feedbackScore,
       sellerLevel, feeDiscount, promotedDiscount]
    );

    res.json({
      message: 'Performance calculated successfully',
      performance: result.rows[0]
    });
  } catch (error) {
    console.error('Calculate performance error:', error.message);
    res.status(500).json({ error: 'Failed to calculate performance' });
  }
};

// Report a defect
const reportDefect = async (req, res) => {
  try {
    const { sellerId, orderId, defectType, description } = req.body;

    // Validate defect type
    const validDefectTypes = ['item_not_as_described', 'item_not_received', 'transaction_defect',
                              'late_shipment', 'tracking_not_uploaded', 'case_closed_without_resolution'];
    if (!validDefectTypes.includes(defectType)) {
      return res.status(400).json({ error: 'Invalid defect type' });
    }

    const result = await pool.query(
      `INSERT INTO seller_defects
       (seller_id, order_id, defect_type, description, defect_date)
       VALUES ($1, $2, $3, $4, CURRENT_DATE)
       RETURNING *`,
      [sellerId, orderId, defectType, description]
    );

    // Trigger performance recalculation for the seller
    await pool.query(`
      UPDATE seller_performance
      SET defect_count = defect_count + 1,
          defect_rate = (defect_count + 1)::DECIMAL / GREATEST(total_transactions, 1),
          updated_at = CURRENT_TIMESTAMP
      WHERE seller_id = $1
    `, [sellerId]);

    res.status(201).json({
      message: 'Defect reported successfully',
      defect: result.rows[0]
    });
  } catch (error) {
    console.error('Report defect error:', error.message);
    res.status(500).json({ error: 'Failed to report defect' });
  }
};

// Get seller defects
const getSellerDefects = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'sd.seller_id = $1';
    const params = [req.user.id];

    if (status && status !== 'all') {
      params.push(status);
      whereClause += ` AND sd.appeal_status = $${params.length}`;
    }

    const result = await pool.query(
      `SELECT sd.*, o.order_number, o.total AS total_amount,
              p.title as product_title
       FROM seller_defects sd
       LEFT JOIN orders o ON sd.order_id = o.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE ${whereClause}
       ORDER BY sd.defect_date DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM seller_defects sd WHERE ${whereClause}`,
      params
    );

    res.json({
      defects: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (error) {
    console.error('Get seller defects error:', error.message);
    res.status(500).json({ error: 'Failed to fetch defects' });
  }
};

// Appeal a defect
const appealDefect = async (req, res) => {
  try {
    const { defectId } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 20) {
      return res.status(400).json({ error: 'Appeal reason must be at least 20 characters' });
    }

    // Verify the defect belongs to this seller
    const defectResult = await pool.query(
      `SELECT * FROM seller_defects WHERE id = $1 AND seller_id = $2`,
      [defectId, req.user.id]
    );

    if (defectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Defect not found' });
    }

    const defect = defectResult.rows[0];

    if (defect.appeal_status === 'approved') {
      return res.status(400).json({ error: 'This defect appeal has already been approved' });
    }

    if (defect.appeal_status === 'pending') {
      return res.status(400).json({ error: 'Appeal already submitted and pending review' });
    }

    // Update defect with appeal
    const result = await pool.query(
      `UPDATE seller_defects
       SET appeal_status = 'pending',
           appeal_reason = $1,
           appeal_date = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [reason, defectId]
    );

    // Create a support ticket for the appeal
    await pool.query(`
      INSERT INTO support_chats (user_id, subject, status, priority)
      VALUES ($1, $2, 'open', 'normal')
    `, [req.user.id, `Defect Appeal - ${defect.defect_type}`]).catch(() => {});

    res.json({
      message: 'Appeal submitted successfully. Our team will review within 5-7 business days.',
      defect: result.rows[0],
      estimatedReviewTime: '5-7 business days'
    });
  } catch (error) {
    console.error('Appeal defect error:', error.message);
    res.status(500).json({ error: 'Failed to submit appeal' });
  }
};

// Get seller level benefits
// Returns a stable, per-level benefits payload that the SellerPerformance
// dashboard UI expects. The seller_benefits table (performance_level,
// benefit_name, benefit_description) carries the named perks; the numeric
// perk values (fvfDiscount, searchBoost, etc.) are fixed per level.
const LEVEL_BENEFITS = {
  below_standard: {
    fvfDiscount: -5,  promotedDiscount: 0,  topRatedBadge: false, prioritySupport: false, fastNFree: false, searchBoost: -20,
  },
  standard: {
    fvfDiscount: 0,   promotedDiscount: 0,  topRatedBadge: false, prioritySupport: false, fastNFree: false, searchBoost: 0,
  },
  above_standard: {
    fvfDiscount: 0,   promotedDiscount: 5,  topRatedBadge: false, prioritySupport: false, fastNFree: false, searchBoost: 5,
  },
  top_rated: {
    fvfDiscount: 10,  promotedDiscount: 10, topRatedBadge: true,  prioritySupport: true,  fastNFree: false, searchBoost: 15,
  },
  top_rated_plus: {
    fvfDiscount: 20,  promotedDiscount: 15, topRatedBadge: true,  prioritySupport: true,  fastNFree: true,  searchBoost: 25,
  },
};

const getSellerBenefits = async (req, res) => {
  try {
    const performanceResult = await pool.query(
      `SELECT seller_level FROM seller_performance WHERE seller_id = $1`,
      [req.user.id]
    );
    const currentLevel = performanceResult.rows[0]?.seller_level || 'standard';

    // Named perks from seller_benefits table, keyed by level
    let byLevel = {};
    try {
      const benefitsResult = await pool.query(
        `SELECT DISTINCT performance_level, benefit_name, benefit_description
         FROM seller_benefits
         WHERE is_active = true
         ORDER BY performance_level, benefit_name`
      );
      for (const row of benefitsResult.rows) {
        if (!byLevel[row.performance_level]) byLevel[row.performance_level] = [];
        byLevel[row.performance_level].push({
          name: row.benefit_name,
          description: row.benefit_description,
        });
      }
    } catch (_) {
      byLevel = {};
    }

    const current = LEVEL_BENEFITS[currentLevel] || LEVEL_BENEFITS.standard;

    res.json({
      currentLevel,
      benefits: {
        ...current,
        items: byLevel[currentLevel] || [],
      },
      allLevels: Object.keys(LEVEL_BENEFITS).map((level) => ({
        level,
        ...LEVEL_BENEFITS[level],
        items: byLevel[level] || [],
      })),
    });
  } catch (error) {
    console.error('Get seller benefits error:', error.message);
    res.status(500).json({ error: 'Failed to fetch seller benefits' });
  }
};

// Get performance history
const getPerformanceHistory = async (req, res) => {
  try {
    const { months = 12 } = req.query;

    // For simplicity, we'll calculate monthly snapshots based on orders
    const history = await pool.query(`
      SELECT
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as transactions,
        COUNT(*) FILTER (WHERE shipped_at > created_at + INTERVAL '3 days') as late_shipments,
        COUNT(*) FILTER (WHERE tracking_number IS NOT NULL) as with_tracking
      FROM orders
      WHERE seller_id = $1 AND created_at >= NOW() - ($2 || ' months')::INTERVAL
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
    `, [req.user.id, months]);

    res.json({
      history: history.rows.map(row => ({
        month: row.month,
        transactions: parseInt(row.transactions),
        lateShipments: parseInt(row.late_shipments),
        withTracking: parseInt(row.with_tracking),
        onTimeRate: ((parseInt(row.transactions) - parseInt(row.late_shipments)) / parseInt(row.transactions) * 100).toFixed(2),
        trackingRate: (parseInt(row.with_tracking) / parseInt(row.transactions) * 100).toFixed(2)
      }))
    });
  } catch (error) {
    console.error('Get performance history error:', error.message);
    res.status(500).json({ error: 'Failed to fetch performance history' });
  }
};

module.exports = {
  getSellerPerformance,
  calculatePerformance,
  reportDefect,
  getSellerDefects,
  appealDefect,
  getSellerBenefits,
  getPerformanceHistory
};
