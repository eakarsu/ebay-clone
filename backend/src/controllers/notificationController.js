// Real-time Notification Controller with WebSocket Support
const { pool } = require('../config/database');

// Get user's notification preferences
const getNotificationPreferences = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notification_subscriptions WHERE user_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      // Create default preferences
      const defaultPrefs = await pool.query(
        `INSERT INTO notification_subscriptions
         (user_id, outbid_alerts, auction_ending, price_drops, watchlist_updates,
          order_updates, message_alerts, promotion_alerts)
         VALUES ($1, true, true, true, true, true, true, false)
         RETURNING *`,
        [req.user.id]
      );
      return res.json(defaultPrefs.rows[0]);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// Update notification preferences
const updateNotificationPreferences = async (req, res, next) => {
  try {
    const {
      outbidAlerts, auctionEnding, priceDrops, watchlistUpdates,
      orderUpdates, messageAlerts, promotionAlerts
    } = req.body;

    const result = await pool.query(
      `INSERT INTO notification_subscriptions
       (user_id, outbid_alerts, auction_ending, price_drops, watchlist_updates,
        order_updates, message_alerts, promotion_alerts)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id) DO UPDATE SET
        outbid_alerts = $2, auction_ending = $3, price_drops = $4, watchlist_updates = $5,
        order_updates = $6, message_alerts = $7, promotion_alerts = $8,
        updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [req.user.id, outbidAlerts, auctionEnding, priceDrops, watchlistUpdates,
       orderUpdates, messageAlerts, promotionAlerts]
    );

    res.json({ message: 'Preferences updated', preferences: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'user_id = $1';
    if (unreadOnly === 'true') {
      whereClause += ' AND is_read = false';
    }

    const result = await pool.query(
      `SELECT id, type, title, message, link, is_read, created_at
       FROM notifications
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM notifications WHERE ${whereClause}`,
      [req.user.id]
    );

    const unreadResult = await pool.query(
      'SELECT COUNT(*) as unread FROM notifications WHERE user_id = $1 AND is_read = false',
      [req.user.id]
    );

    res.json({
      notifications: result.rows.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        link: n.link,
        isRead: n.is_read,
        createdAt: n.created_at,
      })),
      unreadCount: parseInt(unreadResult.rows[0].unread),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
      },
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [notificationId, req.user.id]
    );

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [req.user.id]
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [notificationId, req.user.id]
    );

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
};

// Create notification (internal use)
const createNotification = async (userId, type, title, message, data = {}) => {
  try {
    // Check user preferences
    const prefs = await pool.query(
      `SELECT * FROM notification_subscriptions WHERE user_id = $1`,
      [userId]
    );

    if (prefs.rows.length > 0) {
      const pref = prefs.rows[0];
      const prefMap = {
        'outbid': 'outbid_alerts',
        'auction_ending': 'auction_ending',
        'price_drop': 'price_drops',
        'watchlist': 'watchlist_updates',
        'order': 'order_updates',
        'message': 'message_alerts',
        'promotion': 'promotion_alerts'
      };

      const prefKey = prefMap[type];
      if (prefKey && !pref[prefKey]) {
        return null; // User has disabled this notification type
      }
    }

    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, type, title, message, JSON.stringify(data)]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Create auction event (for WebSocket broadcasting)
const createAuctionEvent = async (req, res, next) => {
  try {
    const { productId, eventType, eventData } = req.body;

    const result = await pool.query(
      `INSERT INTO auction_events (product_id, event_type, event_data)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [productId, eventType, JSON.stringify(eventData)]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// Get recent auction events for a product
const getAuctionEvents = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { since } = req.query;

    let whereClause = 'product_id = $1';
    const params = [productId];

    if (since) {
      whereClause += ' AND created_at > $2';
      params.push(since);
    }

    const result = await pool.query(
      `SELECT * FROM auction_events
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT 50`,
      params
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// Subscribe to product updates (watchlist/auction)
const subscribeToProduct = async (req, res, next) => {
  try {
    const { productId } = req.body;

    // Add to watchlist if not already there
    const existing = await pool.query(
      `SELECT * FROM watchlist WHERE user_id = $1 AND product_id = $2`,
      [req.user.id, productId]
    );

    if (existing.rows.length === 0) {
      await pool.query(
        `INSERT INTO watchlist (user_id, product_id) VALUES ($1, $2)`,
        [req.user.id, productId]
      );
    }

    res.json({ message: 'Subscribed to product updates', productId });
  } catch (error) {
    next(error);
  }
};

// Unsubscribe from product updates
const unsubscribeFromProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;

    await pool.query(
      `DELETE FROM watchlist WHERE user_id = $1 AND product_id = $2`,
      [req.user.id, productId]
    );

    res.json({ message: 'Unsubscribed from product updates', productId });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
  createNotification,
  createAuctionEvent,
  getAuctionEvents,
  subscribeToProduct,
  unsubscribeFromProduct
};
