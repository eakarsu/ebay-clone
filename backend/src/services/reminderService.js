// Shipping Reminders Service
// Sends email/notifications after handling time expires

const { pool } = require('../config/database');
const emailService = require('./emailService');

class ReminderService {
  constructor() {
    this.reminderTypes = {
      HANDLING_TIME: 'handling_time',
      FOLLOW_UP: 'follow_up',
      FINAL: 'final',
    };
  }

  // Create shipping reminder when order is placed
  async createShippingReminder(orderId) {
    try {
      const orderResult = await pool.query(
        `SELECT o.*, p.handling_time, u.email as seller_email, u.username as seller_username
         FROM orders o
         JOIN order_items oi ON o.id = oi.order_id
         JOIN products p ON oi.product_id = p.id
         JOIN users u ON o.seller_id = u.id
         WHERE o.id = $1
         LIMIT 1`,
        [orderId]
      );

      if (orderResult.rows.length === 0) {
        return { success: false, message: 'Order not found' };
      }

      const order = orderResult.rows[0];
      const handlingTime = order.handling_time || 1;

      // Calculate reminder time (handling time + 1 day buffer)
      const reminderTime = new Date(order.created_at);
      reminderTime.setDate(reminderTime.getDate() + handlingTime);

      // Create the initial reminder
      await pool.query(
        `INSERT INTO shipping_reminders (order_id, seller_id, reminder_time, reminder_type)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING`,
        [orderId, order.seller_id, reminderTime, this.reminderTypes.HANDLING_TIME]
      );

      // Update the order with handling deadline
      await pool.query(
        `UPDATE orders SET handling_deadline = $1 WHERE id = $2`,
        [reminderTime, orderId]
      );

      return { success: true, reminderTime };
    } catch (error) {
      console.error('Error creating shipping reminder:', error);
      return { success: false, error: error.message };
    }
  }

  // Process pending shipping reminders (called by cron job)
  async processPendingReminders() {
    try {
      // Get all pending reminders that are due
      const remindersResult = await pool.query(
        `SELECT sr.*, o.order_number, o.status as order_status, o.shipped_at,
                u.email as seller_email, u.username as seller_username,
                buyer.username as buyer_username
         FROM shipping_reminders sr
         JOIN orders o ON sr.order_id = o.id
         JOIN users u ON sr.seller_id = u.id
         JOIN users buyer ON o.buyer_id = buyer.id
         WHERE sr.sent = false
         AND sr.reminder_time <= NOW()
         AND o.status NOT IN ('shipped', 'delivered', 'cancelled')
         LIMIT 100`
      );

      const results = {
        processed: 0,
        sent: 0,
        skipped: 0,
        errors: 0,
      };

      for (const reminder of remindersResult.rows) {
        results.processed++;

        // Skip if already shipped
        if (reminder.shipped_at) {
          await this.markReminderSent(reminder.id, true);
          results.skipped++;
          continue;
        }

        try {
          // Send notification
          await this.sendReminderNotification(reminder);

          // Send email
          await this.sendReminderEmail(reminder);

          // Mark as sent
          await this.markReminderSent(reminder.id, false);

          // Schedule follow-up reminder if this was the first one
          if (reminder.reminder_type === this.reminderTypes.HANDLING_TIME) {
            await this.scheduleFollowUpReminder(reminder);
          }

          results.sent++;
        } catch (error) {
          console.error('Error sending reminder:', error);
          results.errors++;
        }
      }

      return results;
    } catch (error) {
      console.error('Error processing reminders:', error);
      throw error;
    }
  }

  // Send in-app notification for shipping reminder
  async sendReminderNotification(reminder) {
    let title, message;

    switch (reminder.reminder_type) {
      case this.reminderTypes.HANDLING_TIME:
        title = 'Ship Your Item!';
        message = `Order #${reminder.order_number} is ready to ship. Handling time has passed.`;
        break;
      case this.reminderTypes.FOLLOW_UP:
        title = 'Shipping Reminder';
        message = `Order #${reminder.order_number} needs to be shipped soon to avoid late shipment.`;
        break;
      case this.reminderTypes.FINAL:
        title = 'Final Shipping Warning';
        message = `Order #${reminder.order_number} is past due for shipping. Ship immediately to avoid seller performance impact.`;
        break;
      default:
        title = 'Shipping Reminder';
        message = `Please ship order #${reminder.order_number}`;
    }

    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES ($1, 'shipping_reminder', $2, $3, $4)`,
      [reminder.seller_id, title, message, `/orders/${reminder.order_id}`]
    );
  }

  // Send email reminder
  async sendReminderEmail(reminder) {
    const subject = `Ship Order #${reminder.order_number} - ${
      reminder.reminder_type === this.reminderTypes.FINAL ? 'URGENT' : 'Reminder'
    }`;

    let urgencyText = '';
    if (reminder.reminder_type === this.reminderTypes.FINAL) {
      urgencyText = '<p style="color: #e53238; font-weight: bold;">This is your final reminder. Late shipments may affect your seller rating.</p>';
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #3665f3; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Shipping Reminder</h1>
        </div>
        <div style="padding: 20px; background: #f7f7f7;">
          <p>Hi ${reminder.seller_username},</p>
          ${urgencyText}
          <p>Your order #${reminder.order_number} from buyer <strong>${reminder.buyer_username}</strong> is waiting to be shipped.</p>
          <p>Please ship the item as soon as possible to maintain excellent buyer experience and protect your seller rating.</p>
          <div style="margin: 20px 0; padding: 15px; background: white; border-radius: 8px;">
            <p style="margin: 0;"><strong>Order Number:</strong> ${reminder.order_number}</p>
            <p style="margin: 10px 0 0 0;"><strong>Buyer:</strong> ${reminder.buyer_username}</p>
          </div>
          <a href="${process.env.FRONTEND_URL}/orders/${reminder.order_id}"
             style="display: inline-block; padding: 12px 24px; background: #3665f3; color: white; text-decoration: none; border-radius: 24px; font-weight: bold;">
            View Order Details
          </a>
          <p style="margin-top: 20px; color: #666; font-size: 12px;">
            If you've already shipped this order, please update the tracking information to stop receiving reminders.
          </p>
        </div>
      </div>
    `;

    try {
      // Using email service if available
      if (emailService && emailService.sendEmail) {
        await emailService.sendEmail({
          to: reminder.seller_email,
          subject,
          html,
        });
      }
    } catch (error) {
      console.error('Error sending reminder email:', error);
      // Don't throw - email is not critical
    }
  }

  // Mark reminder as sent
  async markReminderSent(reminderId, acknowledged = false) {
    await pool.query(
      `UPDATE shipping_reminders SET sent = true, sent_at = NOW(), acknowledged = $2 WHERE id = $1`,
      [reminderId, acknowledged]
    );
  }

  // Schedule follow-up reminder
  async scheduleFollowUpReminder(previousReminder) {
    const followUpTime = new Date();
    followUpTime.setDate(followUpTime.getDate() + 1); // 1 day after first reminder

    await pool.query(
      `INSERT INTO shipping_reminders (order_id, seller_id, reminder_time, reminder_type)
       VALUES ($1, $2, $3, $4)`,
      [previousReminder.order_id, previousReminder.seller_id, followUpTime, this.reminderTypes.FOLLOW_UP]
    );

    // Schedule final reminder
    const finalTime = new Date();
    finalTime.setDate(finalTime.getDate() + 2); // 2 days after first reminder

    await pool.query(
      `INSERT INTO shipping_reminders (order_id, seller_id, reminder_time, reminder_type)
       VALUES ($1, $2, $3, $4)`,
      [previousReminder.order_id, previousReminder.seller_id, finalTime, this.reminderTypes.FINAL]
    );
  }

  // Get pending reminders for a seller
  async getSellerReminders(sellerId) {
    const result = await pool.query(
      `SELECT sr.*, o.order_number, o.created_at as order_date, o.total,
              buyer.username as buyer_username
       FROM shipping_reminders sr
       JOIN orders o ON sr.order_id = o.id
       JOIN users buyer ON o.buyer_id = buyer.id
       WHERE sr.seller_id = $1
       AND sr.sent = false
       ORDER BY sr.reminder_time ASC`,
      [sellerId]
    );

    return result.rows;
  }

  // Acknowledge a reminder (dismiss it)
  async acknowledgeReminder(reminderId, sellerId) {
    const result = await pool.query(
      `UPDATE shipping_reminders SET acknowledged = true, sent = true
       WHERE id = $1 AND seller_id = $2
       RETURNING *`,
      [reminderId, sellerId]
    );

    return result.rows[0];
  }

  // Cancel all reminders for an order (when shipped)
  async cancelOrderReminders(orderId) {
    await pool.query(
      `UPDATE shipping_reminders SET acknowledged = true WHERE order_id = $1 AND sent = false`,
      [orderId]
    );
  }

  // Get reminder statistics for a seller
  async getReminderStats(sellerId) {
    const result = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE sent = false) as pending,
        COUNT(*) FILTER (WHERE sent = true AND acknowledged = false) as sent,
        COUNT(*) FILTER (WHERE acknowledged = true) as acknowledged,
        COUNT(*) FILTER (WHERE reminder_type = 'final' AND sent = true) as final_warnings
       FROM shipping_reminders
       WHERE seller_id = $1
       AND created_at >= NOW() - INTERVAL '30 days'`,
      [sellerId]
    );

    return result.rows[0];
  }
}

module.exports = new ReminderService();
