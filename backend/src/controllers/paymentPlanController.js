const { pool } = require('../config/database');

// Get my payment plans
const getMyPlans = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pp.*, o.order_number,
              (SELECT json_agg(json_build_object(
                'id', ppi.id,
                'installment_number', ppi.installment_number,
                'amount', ppi.amount,
                'due_date', ppi.due_date,
                'paid_date', ppi.paid_date,
                'status', ppi.status
              ) ORDER BY ppi.installment_number)
              FROM payment_plan_installments ppi WHERE ppi.plan_id = pp.id) as installments
       FROM payment_plans pp
       JOIN orders o ON pp.order_id = o.id
       WHERE pp.user_id = $1
       ORDER BY pp.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get payment plan details
const getPlan = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await pool.query(
      `SELECT pp.*, o.order_number, o.total as order_total
       FROM payment_plans pp
       JOIN orders o ON pp.order_id = o.id
       WHERE pp.id = $1 AND pp.user_id = $2`,
      [id, req.user.id]
    );

    if (plan.rows.length === 0) {
      return res.status(404).json({ error: 'Payment plan not found' });
    }

    const installments = await pool.query(
      `SELECT * FROM payment_plan_installments WHERE plan_id = $1 ORDER BY installment_number`,
      [id]
    );

    res.json({
      ...plan.rows[0],
      installments: installments.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create payment plan
const createPlan = async (req, res) => {
  try {
    const { orderId, planType, provider } = req.body;

    // Get order details
    const order = await pool.query(
      `SELECT * FROM orders WHERE id = $1 AND buyer_id = $2`,
      [orderId, req.user.id]
    );

    if (order.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const o = order.rows[0];
    let installmentsTotal, interestRate = 0;

    if (planType === 'pay_in_4') {
      installmentsTotal = 4;
    } else if (planType === 'pay_in_6') {
      installmentsTotal = 6;
    } else {
      installmentsTotal = 12;
      interestRate = 0.1499; // 14.99% APR
    }

    const installmentAmount = o.total / installmentsTotal;

    const plan = await pool.query(
      `INSERT INTO payment_plans (order_id, user_id, plan_type, total_amount, installment_amount, installments_total, interest_rate, next_payment_date, provider)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [orderId, req.user.id, planType, o.total, installmentAmount, installmentsTotal, interestRate, new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), provider || 'Internal']
    );

    // Create installments
    for (let i = 1; i <= installmentsTotal; i++) {
      const dueDate = new Date(Date.now() + (i * 14) * 24 * 60 * 60 * 1000);
      await pool.query(
        `INSERT INTO payment_plan_installments (plan_id, installment_number, amount, due_date, status)
         VALUES ($1, $2, $3, $4, $5)`,
        [plan.rows[0].id, i, installmentAmount, dueDate, i === 1 ? 'pending' : 'pending']
      );
    }

    res.status(201).json(plan.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Pay installment
const payInstallment = async (req, res) => {
  try {
    const { planId, installmentId } = req.params;

    // Verify ownership
    const plan = await pool.query(
      `SELECT * FROM payment_plans WHERE id = $1 AND user_id = $2`,
      [planId, req.user.id]
    );

    if (plan.rows.length === 0) {
      return res.status(404).json({ error: 'Payment plan not found' });
    }

    // Update installment
    const result = await pool.query(
      `UPDATE payment_plan_installments
       SET status = 'paid', paid_date = NOW()
       WHERE id = $1 AND plan_id = $2
       RETURNING *`,
      [installmentId, planId]
    );

    // Update plan
    await pool.query(
      `UPDATE payment_plans
       SET installments_paid = installments_paid + 1,
           next_payment_date = (SELECT MIN(due_date) FROM payment_plan_installments WHERE plan_id = $1 AND status = 'pending'),
           status = CASE WHEN installments_paid + 1 >= installments_total THEN 'completed' ELSE 'active' END
       WHERE id = $1`,
      [planId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Check eligibility
const checkEligibility = async (req, res) => {
  try {
    const { amount } = req.query;

    // Simple eligibility check (in real app, would check credit, purchase history, etc.)
    const eligible = parseFloat(amount) >= 35 && parseFloat(amount) <= 10000;

    res.json({
      eligible,
      options: eligible ? [
        { type: 'pay_in_4', installments: 4, interest: 0, minAmount: 35 },
        { type: 'pay_in_6', installments: 6, interest: 0, minAmount: 99 },
        { type: 'pay_monthly', installments: 12, interest: 14.99, minAmount: 199 }
      ] : []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getMyPlans,
  getPlan,
  createPlan,
  payInstallment,
  checkEligibility
};
