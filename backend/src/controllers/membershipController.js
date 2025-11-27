// eBay Plus Membership Controller
const { pool } = require('../config/database');

// Get available membership plans
const getMembershipPlans = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM membership_plans WHERE is_active = true ORDER BY monthly_price`
    );
    res.json(result.rows);
  } catch (error) {
    // Return mock plans if table doesn't exist
    res.json([
      {
        id: 1,
        name: 'eBay Plus',
        description: 'Premium membership with exclusive benefits',
        monthly_price: 9.99,
        annual_price: 99.99,
        free_shipping: true,
        free_returns: true,
        extended_returns_days: 60,
        exclusive_deals: true,
        priority_support: true,
        early_access: true,
        cashback_percent: 2,
        is_active: true
      },
      {
        id: 2,
        name: 'eBay Plus Premium',
        description: 'Ultimate membership with maximum benefits',
        monthly_price: 19.99,
        annual_price: 179.99,
        free_shipping: true,
        free_returns: true,
        extended_returns_days: 90,
        exclusive_deals: true,
        priority_support: true,
        early_access: true,
        cashback_percent: 5,
        is_active: true
      }
    ]);
  }
};

// Get user's current membership
const getUserMembership = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT um.*, mp.name as plan_name, mp.description, mp.free_shipping,
              mp.free_returns, mp.extended_returns_days, mp.exclusive_deals,
              mp.priority_support, mp.early_access, mp.cashback_percent,
              mp.monthly_price, mp.annual_price
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
    // Return mock response if tables don't exist
    res.json({ hasMembership: false, membership: null });
  }
};

// Subscribe to membership
const subscribeMembership = async (req, res) => {
  const { planId, billingCycle = 'monthly', paymentMethodId } = req.body;

  try {
    // Get plan details
    const plan = await pool.query(
      `SELECT * FROM membership_plans WHERE id = $1 AND is_active = true`,
      [planId]
    );

    if (plan.rows.length === 0) {
      return res.status(404).json({ error: 'Membership plan not found' });
    }

    const planData = plan.rows[0];
    const price = billingCycle === 'annual' ? planData.annual_price : planData.monthly_price;

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
    if (billingCycle === 'annual') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Create membership
    const result = await pool.query(
      `INSERT INTO user_memberships
       (user_id, plan_id, billing_cycle, start_date, end_date, auto_renew, status)
       VALUES ($1, $2, $3, $4, $5, true, 'active')
       RETURNING *`,
      [req.user.id, planId, billingCycle, startDate, endDate]
    );

    // Update user's membership status
    await pool.query(
      `UPDATE users SET is_premium_member = true WHERE id = $1`,
      [req.user.id]
    );

    res.status(201).json({
      message: 'Successfully subscribed to membership',
      membership: result.rows[0],
      plan: planData
    });
  } catch (error) {
    console.error('Subscribe membership error:', error.message);
    // Return mock success if tables don't exist
    res.status(201).json({
      message: 'Successfully subscribed to membership (demo mode)',
      membership: {
        id: 'demo-membership-' + Date.now(),
        plan_id: planId,
        billing_cycle: billingCycle,
        status: 'active',
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });
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
      // Return success for demo mode - no active membership to cancel
      return res.json({
        message: 'Membership cancelled (demo mode)',
        membership: null
      });
    }

    res.json({
      message: 'Membership cancelled. Benefits will remain active until end date.',
      membership: result.rows[0]
    });
  } catch (error) {
    // Return mock success if table doesn't exist (demo mode)
    res.json({
      message: 'Membership cancelled (demo mode)',
      membership: null
    });
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

    // Check free shipping eligibility (free_shipping is a boolean in the schema)
    const freeShipping = plan.free_shipping === true;
    const shippingSavings = freeShipping ? 9.99 : 0; // Estimated shipping cost

    // Check for member discounts (cashback_percent in the schema)
    const discountPercent = plan.cashback_percent || 0;
    const discountSavings = orderSubtotal * (discountPercent / 100);

    res.json({
      hasMembership: true,
      planName: plan.name,
      freeShipping,
      freeReturns: plan.free_returns,
      discountPercent,
      extendedReturns: plan.extended_returns_days,
      shippingSavings,
      discountSavings,
      totalSavings: shippingSavings + discountSavings
    });
  } catch (error) {
    // Return mock response if tables don't exist
    res.json({
      hasMembership: false,
      freeShipping: false,
      discountPercent: 0,
      totalSavings: 0
    });
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
              (p.current_price * (1 - med.discount_value/100)) as member_price,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image
       FROM membership_exclusive_deals med
       JOIN products p ON med.product_id = p.id
       WHERE med.membership_required = true
       AND med.start_date <= CURRENT_TIMESTAMP
       AND med.end_date >= CURRENT_TIMESTAMP
       ORDER BY med.discount_value DESC`
    );

    res.json(deals.rows);
  } catch (error) {
    // Return mock deals if tables don't exist
    res.json([
      {
        id: 1,
        title: '20% Off Electronics',
        description: 'Exclusive member discount on all electronics',
        discount_type: 'percentage',
        discount_value: 20,
        original_price: 299.99,
        member_price: 239.99
      },
      {
        id: 2,
        title: '15% Off Fashion',
        description: 'Save on designer fashion items',
        discount_type: 'percentage',
        discount_value: 15,
        original_price: 149.99,
        member_price: 127.49
      }
    ]);
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
    res.json({
      message: `Auto-renew ${req.body.autoRenew ? 'enabled' : 'disabled'} (demo mode)`,
      membership: null
    });
  }
};

// Check if product has member pricing
const checkMemberPricing = async (req, res) => {
  try {
    const { productId } = req.params;

    // Check if user is a member
    let isMember = false;
    if (req.user?.id) {
      const membership = await pool.query(
        `SELECT * FROM user_memberships
         WHERE user_id = $1 AND status = 'active' AND end_date > CURRENT_TIMESTAMP`,
        [req.user.id]
      );
      isMember = membership.rows.length > 0;
    }

    // Check for exclusive deal on this product
    const deal = await pool.query(
      `SELECT * FROM membership_exclusive_deals
       WHERE product_id = $1 AND membership_required = true
       AND start_date <= CURRENT_TIMESTAMP
       AND end_date >= CURRENT_TIMESTAMP`,
      [productId]
    );

    if (deal.rows.length === 0) {
      return res.json({ hasMemberPricing: false });
    }

    const dealData = deal.rows[0];
    const discountPercent = dealData.discount_value || 0;

    res.json({
      hasMemberPricing: true,
      discountPercent,
      isMember,
      message: isMember
        ? `You save ${discountPercent}% as an eBay Plus member!`
        : `Join eBay Plus to save ${discountPercent}% on this item`
    });
  } catch (error) {
    // Return no member pricing if tables don't exist
    res.json({ hasMemberPricing: false });
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
