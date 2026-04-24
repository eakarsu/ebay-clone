// Automatic Feedback Service
// Auto-leaves positive feedback for successful transactions

const { pool } = require('../config/database');

class FeedbackService {
  constructor() {
    this.defaultFeedbackTemplate = 'Great buyer! Fast payment. Thank you!';
    this.defaultSellerFeedbackTemplate = 'Excellent seller! Item as described, fast shipping. A++';
  }

  // Check if automatic feedback should be sent for an order
  async shouldAutoFeedback(orderId, userId) {
    try {
      // Get user's automatic feedback settings
      const settingsResult = await pool.query(
        `SELECT * FROM automatic_feedback_settings WHERE user_id = $1`,
        [userId]
      );

      if (settingsResult.rows.length === 0) {
        // Create default settings if not exists
        await pool.query(
          `INSERT INTO automatic_feedback_settings (user_id) VALUES ($1)
           ON CONFLICT (user_id) DO NOTHING`,
          [userId]
        );
        return { enabled: true, delayDays: 3, template: this.defaultFeedbackTemplate };
      }

      const settings = settingsResult.rows[0];
      return {
        enabled: settings.enabled,
        delayDays: settings.delay_days,
        template: settings.feedback_template,
        conditions: settings.conditions,
      };
    } catch (error) {
      console.error('Error checking auto feedback settings:', error);
      return { enabled: false };
    }
  }

  // Trigger automatic feedback check for delivered orders
  async processDeliveredOrder(orderId) {
    try {
      // Get order details
      const orderResult = await pool.query(
        `SELECT o.*,
                o.seller_id,
                o.buyer_id,
                o.delivered_at,
                o.payment_status
         FROM orders o
         WHERE o.id = $1 AND o.status = 'delivered'`,
        [orderId]
      );

      if (orderResult.rows.length === 0) {
        return { success: false, message: 'Order not found or not delivered' };
      }

      const order = orderResult.rows[0];

      // Check if feedback already exists
      const existingFeedback = await pool.query(
        `SELECT id FROM automatic_feedback_log WHERE order_id = $1`,
        [orderId]
      );

      if (existingFeedback.rows.length > 0) {
        return { success: false, message: 'Feedback already processed' };
      }

      // Get seller's auto feedback settings
      const sellerSettings = await this.shouldAutoFeedback(orderId, order.seller_id);

      // Schedule or create automatic feedback from seller to buyer
      if (sellerSettings.enabled) {
        await this.scheduleAutoFeedback({
          orderId,
          fromUserId: order.seller_id,
          toUserId: order.buyer_id,
          feedbackType: 'positive',
          feedbackText: sellerSettings.template,
          delayDays: sellerSettings.delayDays,
        });
      }

      return { success: true, message: 'Automatic feedback scheduled' };
    } catch (error) {
      console.error('Error processing delivered order for feedback:', error);
      return { success: false, message: error.message };
    }
  }

  // Schedule automatic feedback
  async scheduleAutoFeedback({ orderId, fromUserId, toUserId, feedbackType, feedbackText, delayDays }) {
    try {
      // For immediate execution (delay = 0) or scheduled
      const triggerTime = new Date();
      triggerTime.setDate(triggerTime.getDate() + delayDays);

      // Check conditions (no disputes, payment received)
      const conditionsMet = await this.checkFeedbackConditions(orderId);

      if (!conditionsMet.valid) {
        await pool.query(
          `INSERT INTO automatic_feedback_log
           (order_id, from_user_id, to_user_id, feedback_type, feedback_text, success, error_message)
           VALUES ($1, $2, $3, $4, $5, false, $6)`,
          [orderId, fromUserId, toUserId, feedbackType, feedbackText, conditionsMet.reason]
        );
        return { success: false, reason: conditionsMet.reason };
      }

      if (delayDays === 0) {
        // Execute immediately
        return await this.createFeedback({
          orderId,
          fromUserId,
          toUserId,
          feedbackType,
          feedbackText,
        });
      }

      // Log for scheduled execution (would be picked up by a cron job)
      await pool.query(
        `INSERT INTO automatic_feedback_log
         (order_id, from_user_id, to_user_id, feedback_type, feedback_text, triggered_at, success)
         VALUES ($1, $2, $3, $4, $5, $6, false)`,
        [orderId, fromUserId, toUserId, feedbackType, feedbackText, triggerTime]
      );

      return { success: true, scheduled: true, triggerTime };
    } catch (error) {
      console.error('Error scheduling auto feedback:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if conditions for automatic feedback are met
  async checkFeedbackConditions(orderId) {
    try {
      // Check for open disputes
      const disputeResult = await pool.query(
        `SELECT id FROM disputes WHERE order_id = $1 AND status NOT IN ('closed', 'resolved')`,
        [orderId]
      );

      if (disputeResult.rows.length > 0) {
        return { valid: false, reason: 'Open dispute exists for this order' };
      }

      // Check payment status
      const orderResult = await pool.query(
        `SELECT payment_status FROM orders WHERE id = $1`,
        [orderId]
      );

      if (orderResult.rows[0]?.payment_status !== 'paid') {
        return { valid: false, reason: 'Payment not confirmed' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, reason: error.message };
    }
  }

  // Create the actual feedback/review
  async createFeedback({ orderId, fromUserId, toUserId, feedbackType, feedbackText }) {
    try {
      // Insert into reviews table
      const rating = feedbackType === 'positive' ? 5 : feedbackType === 'neutral' ? 3 : 1;

      await pool.query(
        `INSERT INTO reviews
         (reviewer_id, reviewed_user_id, order_id, rating, comment, review_type, is_verified_purchase)
         VALUES ($1, $2, $3, $4, $5, 'seller', true)
         ON CONFLICT DO NOTHING`,
        [fromUserId, toUserId, orderId, rating, feedbackText]
      );

      // Update the feedback log
      await pool.query(
        `UPDATE automatic_feedback_log
         SET success = true, triggered_at = NOW()
         WHERE order_id = $1 AND from_user_id = $2`,
        [orderId, fromUserId]
      );

      // Update seller rating
      await this.updateUserRating(toUserId);

      return { success: true, message: 'Feedback created successfully' };
    } catch (error) {
      console.error('Error creating feedback:', error);

      // Log the error
      await pool.query(
        `UPDATE automatic_feedback_log
         SET success = false, error_message = $3
         WHERE order_id = $1 AND from_user_id = $2`,
        [orderId, fromUserId, error.message]
      );

      return { success: false, error: error.message };
    }
  }

  // Update user's overall rating
  async updateUserRating(userId) {
    try {
      await pool.query(
        `UPDATE users SET seller_rating = (
          SELECT COALESCE(AVG(rating) / 5, 0)
          FROM reviews
          WHERE reviewed_user_id = $1
        ) WHERE id = $1`,
        [userId]
      );
    } catch (error) {
      console.error('Error updating user rating:', error);
    }
  }

  // Get user's automatic feedback settings
  async getSettings(userId) {
    try {
      const result = await pool.query(
        `SELECT * FROM automatic_feedback_settings WHERE user_id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return {
          enabled: true,
          delayDays: 3,
          feedbackTemplate: this.defaultFeedbackTemplate,
          conditions: { require_payment: true, require_no_disputes: true },
        };
      }

      const settings = result.rows[0];
      return {
        enabled: settings.enabled,
        delayDays: settings.delay_days,
        feedbackTemplate: settings.feedback_template,
        conditions: settings.conditions,
      };
    } catch (error) {
      console.error('Error getting feedback settings:', error);
      throw error;
    }
  }

  // Update user's automatic feedback settings
  async updateSettings(userId, settings) {
    try {
      const { enabled, delayDays, feedbackTemplate, conditions } = settings;

      await pool.query(
        `INSERT INTO automatic_feedback_settings
         (user_id, enabled, delay_days, feedback_template, conditions)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id) DO UPDATE SET
         enabled = EXCLUDED.enabled,
         delay_days = EXCLUDED.delay_days,
         feedback_template = EXCLUDED.feedback_template,
         conditions = EXCLUDED.conditions,
         updated_at = NOW()`,
        [userId, enabled, delayDays, feedbackTemplate, JSON.stringify(conditions)]
      );

      return { success: true };
    } catch (error) {
      console.error('Error updating feedback settings:', error);
      throw error;
    }
  }

  // Get feedback history for a user
  async getFeedbackHistory(userId, type = 'sent') {
    try {
      const column = type === 'sent' ? 'from_user_id' : 'to_user_id';
      const result = await pool.query(
        `SELECT afl.*, o.order_number,
                u.username as other_party_username
         FROM automatic_feedback_log afl
         JOIN orders o ON afl.order_id = o.id
         JOIN users u ON u.id = ${type === 'sent' ? 'afl.to_user_id' : 'afl.from_user_id'}
         WHERE afl.${column} = $1
         ORDER BY afl.triggered_at DESC
         LIMIT 50`,
        [userId]
      );

      return result.rows;
    } catch (error) {
      console.error('Error getting feedback history:', error);
      throw error;
    }
  }

  // Process pending automatic feedback (called by cron job)
  async processPendingFeedback() {
    try {
      const pendingResult = await pool.query(
        `SELECT * FROM automatic_feedback_log
         WHERE success = false
         AND error_message IS NULL
         AND triggered_at <= NOW()
         LIMIT 100`
      );

      let processed = 0;
      let errors = 0;

      for (const feedback of pendingResult.rows) {
        const result = await this.createFeedback({
          orderId: feedback.order_id,
          fromUserId: feedback.from_user_id,
          toUserId: feedback.to_user_id,
          feedbackType: feedback.feedback_type,
          feedbackText: feedback.feedback_text,
        });

        if (result.success) {
          processed++;
        } else {
          errors++;
        }
      }

      return { processed, errors, total: pendingResult.rows.length };
    } catch (error) {
      console.error('Error processing pending feedback:', error);
      throw error;
    }
  }
}

module.exports = new FeedbackService();
