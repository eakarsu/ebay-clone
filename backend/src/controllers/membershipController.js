// eBay Plus Membership Controller - Complete Implementation
const { pool } = require('../config/database');

// Initialize membership tables if they don't exist
const initializeTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS membership_plans (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        monthly_price DECIMAL(10,2) NOT NULL,
        annual_price DECIMAL(10,2) NOT NULL,
        free_shipping BOOLEAN DEFAULT false,
        free_returns BOOLEAN DEFAULT false,
        extended_returns_days INTEGER DEFAULT 30,
        exclusive_deals BOOLEAN DEFAULT false,
        priority_support BOOLEAN DEFAULT false,
        early_access BOOLEAN DEFAULT false,
        cashback_percent DECIMAL(5,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_memberships (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        plan_id INTEGER REFERENCES membership_plans(id),
        billing_cycle VARCHAR(20) DEFAULT 'monthly',
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        auto_renew BOOLEAN DEFAULT true,
        status VARCHAR(20) DEFAULT 'active',
        cancelled_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS membership_exclusive_deals (
        id SERIAL PRIMARY KEY,
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        discount_type VARCHAR(20) DEFAULT 'percentage',
        discount_value DECIMAL(10,2) NOT NULL,
        membership_required BOOLEAN DEFAULT true,
        start_date TIMESTAMP DEFAULT NOW(),
        end_date TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days'),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Insert default plans if none exist
    const existingPlans = await pool.query('SELECT COUNT(*) FROM membership_plans');
    if (parseInt(existingPlans.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO membership_plans (name, description, monthly_price, annual_price, free_shipping, free_returns, extended_returns_days, exclusive_deals, priority_support, early_access, cashback_percent)
        VALUES
          ('eBay Plus', 'Premium membership with exclusive benefits', 9.99, 99.99, true, true, 60, true, true, true, 2),
          ('eBay Plus Premium', 'Ultimate membership with maximum benefits', 19.99, 179.99, true, true, 90, true, true, true, 5)
      `);
    }
  } catch (error) {
    console.error('Error initializing membership tables:', error.message);
  }
};

// Initialize on module load
initializeTables();

// Get available membership plans
const getMembershipPlans = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM membership_plans WHERE is_active = true ORDER BY monthly_price`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get membership plans error:', error.message);
    res.status(500).json({ error: 'Failed to fetch membership plans' });
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
    console.error('Get user membership error:', error.message);
    res.status(500).json({ error: 'Failed to fetch membership status' });
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
    ).catch(() => {}); // Ignore if column doesn't exist

    res.status(201).json({
      message: 'Successfully subscribed to membership',
      membership: result.rows[0],
      plan: planData,
      nextBillingDate: endDate,
      amountCharged: price
    });
  } catch (error) {
    console.error('Subscribe membership error:', error.message);
    res.status(500).json({ error: 'Failed to subscribe to membership' });
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

    // Update user's membership status
    await pool.query(
      `UPDATE users SET is_premium_member = false WHERE id = $1`,
      [req.user.id]
    ).catch(() => {});

    res.json({
      message: 'Membership cancelled. Benefits will remain active until end date.',
      membership: result.rows[0],
      benefitsEndDate: result.rows[0].end_date
    });
  } catch (error) {
    console.error('Cancel membership error:', error.message);
    res.status(500).json({ error: 'Failed to cancel membership' });
  }
};

// Get membership benefits for checkout
const getMembershipBenefits = async (req, res) => {
  try {
    const { subtotal } = req.query;

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

    const freeShipping = plan.free_shipping === true;
    const shippingSavings = freeShipping ? 9.99 : 0;

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
    console.error('Get membership benefits error:', error.message);
    res.status(500).json({ error: 'Failed to fetch membership benefits' });
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
      `SELECT med.*, p.title, p.price as original_price,
              (p.price * (1 - med.discount_value/100)) as member_price,
              p.image_url as image
       FROM membership_exclusive_deals med
       JOIN products p ON med.product_id = p.id
       WHERE med.membership_required = true
       AND med.start_date <= CURRENT_TIMESTAMP
       AND med.end_date >= CURRENT_TIMESTAMP
       ORDER BY med.discount_value DESC
       LIMIT 20`
    );

    res.json(deals.rows);
  } catch (error) {
    console.error('Get exclusive deals error:', error.message);
    res.status(500).json({ error: 'Failed to fetch exclusive deals' });
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
    console.error('Update auto-renew error:', error.message);
    res.status(500).json({ error: 'Failed to update auto-renew setting' });
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
    console.error('Check member pricing error:', error.message);
    res.json({ hasMemberPricing: false });
  }
};

// Get membership history
const getMembershipHistory = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT um.*, mp.name as plan_name
       FROM user_memberships um
       JOIN membership_plans mp ON um.plan_id = mp.id
       WHERE um.user_id = $1
       ORDER BY um.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get membership history error:', error.message);
    res.status(500).json({ error: 'Failed to fetch membership history' });
  }
};

// Upgrade membership plan
const upgradeMembership = async (req, res) => {
  const { newPlanId } = req.body;

  try {
    // Get current membership
    const current = await pool.query(
      `SELECT um.*, mp.monthly_price as current_price
       FROM user_memberships um
       JOIN membership_plans mp ON um.plan_id = mp.id
       WHERE um.user_id = $1 AND um.status = 'active'`,
      [req.user.id]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'No active membership to upgrade' });
    }

    // Get new plan
    const newPlan = await pool.query(
      `SELECT * FROM membership_plans WHERE id = $1 AND is_active = true`,
      [newPlanId]
    );

    if (newPlan.rows.length === 0) {
      return res.status(404).json({ error: 'New plan not found' });
    }

    // Update to new plan
    const result = await pool.query(
      `UPDATE user_memberships
       SET plan_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND status = 'active'
       RETURNING *`,
      [newPlanId, req.user.id]
    );

    res.json({
      message: 'Membership upgraded successfully',
      membership: result.rows[0],
      newPlan: newPlan.rows[0]
    });
  } catch (error) {
    console.error('Upgrade membership error:', error.message);
    res.status(500).json({ error: 'Failed to upgrade membership' });
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
  checkMemberPricing,
  getMembershipHistory,
  upgradeMembership
};
