// eBay Plus Membership Controller
const { pool } = require('../config/database');

// Get available membership plans
const getMembershipPlans = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM membership_plans WHERE is_active = true ORDER BY price_monthly`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user's current membership
const getUserMembership = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT um.*, mp.name as plan_name, mp.benefits, mp.free_shipping_threshold,
              mp.extended_returns_days, mp.exclusive_deals
       FROM user_memberships um
       JOIN membership_plans mp ON um.plan_id = mp.id
       WHERE um.user_id = $1 AND um.status = 'active' AND um.end_date > CURRENT_TIMESTAMP`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.json({ hasMembership: false, membership: null });
    }

    res.json({ hasMembership: true, membership: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Subscribe to membership
const subscribeMembership = async (req, res) => {
  try {
    const { planId, billingCycle = 'monthly', paymentMethodId } = req.body;

    // Get plan details
    const plan = await pool.query(
      `SELECT * FROM membership_plans WHERE id = $1 AND is_active = true`,
      [planId]
    );

    if (plan.rows.length === 0) {
      return res.status(404).json({ error: 'Membership plan not found' });
    }

    const planData = plan.rows[0];
    const price = billingCycle === 'yearly' ? planData.price_yearly : planData.price_monthly;

    // Check for existing active membership
    const existing = await pool.query(
      `SELECT * FROM user_memberships
       WHERE user_id = $1 AND status = 'active' AND end_date > CURRENT_TIMESTAMP`,
      [req.user.id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'You already have an active membership' });
    }

    // Calculate end date
    const startDate = new Date();
    const endDate = new Date();
    if (billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Create membership
    const result = await pool.query(
      `INSERT INTO user_memberships
       (user_id, plan_id, billing_cycle, price_paid, start_date, end_date, auto_renew, status)
       VALUES ($1, $2, $3, $4, $5, $6, true, 'active')
       RETURNING *`,
      [req.user.id, planId, billingCycle, price, startDate, endDate]
    );

    // Update user's membership status
    await pool.query(
      `UPDATE users SET is_premium_member = true WHERE id = $1`,
      [req.user.id]
    );

    res.status(201).json({
      message: 'Successfully subscribed to membership',
      membership: result.rows[0],
      benefits: planData.benefits
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cancel membership
const cancelMembership = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE user_memberships
       SET auto_renew = false, cancelled_at = CURRENT_TIMESTAMP, status = 'cancelled'
       WHERE user_id = $1 AND status = 'active'
       RETURNING *`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No active membership found' });
    }

    res.json({
      message: 'Membership cancelled. Benefits will remain active until end date.',
      membership: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get membership benefits for checkout
const getMembershipBenefits = async (req, res) => {
  try {
    const { subtotal, sellerId } = req.query;

    const membership = await pool.query(
      `SELECT um.*, mp.*
       FROM user_memberships um
       JOIN membership_plans mp ON um.plan_id = mp.id
       WHERE um.user_id = $1 AND um.status = 'active' AND um.end_date > CURRENT_TIMESTAMP`,
      [req.user.id]
    );

    if (membership.rows.length === 0) {
      return res.json({
        hasMembership: false,
        freeShipping: false,
        discountPercent: 0,
        totalSavings: 0
      });
    }

    const plan = membership.rows[0];
    const orderSubtotal = parseFloat(subtotal) || 0;

    // Check free shipping eligibility
    const freeShipping = orderSubtotal >= parseFloat(plan.free_shipping_threshold || 0);
    const shippingSavings = freeShipping ? 9.99 : 0; // Estimated shipping cost

    // Check for member discounts
    const discountPercent = plan.member_discount_percent || 0;
    const discountSavings = orderSubtotal * (discountPercent / 100);

    res.json({
      hasMembership: true,
      planName: plan.name,
      freeShipping,
      freeShippingThreshold: plan.free_shipping_threshold,
      discountPercent,
      extendedReturns: plan.extended_returns_days,
      shippingSavings,
      discountSavings,
      totalSavings: shippingSavings + discountSavings
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get exclusive member deals
const getExclusiveDeals = async (req, res) => {
  try {
    // Verify user has membership
    const membership = await pool.query(
      `SELECT * FROM user_memberships
       WHERE user_id = $1 AND status = 'active' AND end_date > CURRENT_TIMESTAMP`,
      [req.user.id]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'Membership required to view exclusive deals' });
    }

    const deals = await pool.query(
      `SELECT med.*, p.title, p.current_price as original_price,
              (p.current_price * (1 - med.discount_percent/100)) as member_price,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image
       FROM membership_exclusive_deals med
       JOIN products p ON med.product_id = p.id
       WHERE med.is_active = true
       AND med.start_date <= CURRENT_TIMESTAMP
       AND med.end_date >= CURRENT_TIMESTAMP
       ORDER BY med.discount_percent DESC`
    );

    res.json(deals.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update auto-renew setting
const updateAutoRenew = async (req, res) => {
  try {
    const { autoRenew } = req.body;

    const result = await pool.query(
      `UPDATE user_memberships
       SET auto_renew = $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND status = 'active'
       RETURNING *`,
      [autoRenew, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No active membership found' });
    }

    res.json({
      message: `Auto-renew ${autoRenew ? 'enabled' : 'disabled'}`,
      membership: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Check if product has member pricing
const checkMemberPricing = async (req, res) => {
  try {
    const { productId } = req.params;

    // Check if user is a member
    const membership = await pool.query(
      `SELECT * FROM user_memberships
       WHERE user_id = $1 AND status = 'active' AND end_date > CURRENT_TIMESTAMP`,
      [req.user?.id]
    );

    const isMember = membership.rows.length > 0;

    // Check for exclusive deal on this product
    const deal = await pool.query(
      `SELECT * FROM membership_exclusive_deals
       WHERE product_id = $1 AND is_active = true
       AND start_date <= CURRENT_TIMESTAMP
       AND end_date >= CURRENT_TIMESTAMP`,
      [productId]
    );

    if (deal.rows.length === 0) {
      return res.json({ hasMemberPricing: false });
    }

    const dealData = deal.rows[0];

    res.json({
      hasMemberPricing: true,
      discountPercent: dealData.discount_percent,
      isMember,
      message: isMember
        ? `You save ${dealData.discount_percent}% as an eBay Plus member!`
        : `Join eBay Plus to save ${dealData.discount_percent}% on this item`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getMembershipPlans,
  getUserMembership,
  subscribeMembership,
  cancelMembership,
  getMembershipBenefits,
  getExclusiveDeals,
  updateAutoRenew,
  checkMemberPricing
};
