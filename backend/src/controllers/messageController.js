const { pool } = require('../config/database');

const getConversations = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT ON (other_user_id)
              m.id, m.body, m.created_at, m.is_read,
              CASE
                WHEN m.sender_id = $1 THEN m.recipient_id
                ELSE m.sender_id
              END as other_user_id,
              u.username as other_username, u.avatar_url as other_avatar,
              p.id as product_id, p.title as product_title
       FROM messages m
       JOIN users u ON u.id = CASE
                                WHEN m.sender_id = $1 THEN m.recipient_id
                                ELSE m.sender_id
                              END
       LEFT JOIN products p ON m.product_id = p.id
       WHERE m.sender_id = $1 OR m.recipient_id = $1
       ORDER BY other_user_id, m.created_at DESC`,
      [req.user.id]
    );

    // Get unread counts
    const conversations = await Promise.all(
      result.rows.map(async (conv) => {
        const unreadResult = await pool.query(
          `SELECT COUNT(*) as unread FROM messages
           WHERE sender_id = $1 AND recipient_id = $2 AND is_read = false`,
          [conv.other_user_id, req.user.id]
        );

        return {
          id: conv.id,
          lastMessage: conv.body,
          lastMessageTime: conv.created_at,
          isRead: conv.is_read,
          unreadCount: parseInt(unreadResult.rows[0].unread),
          otherUser: {
            id: conv.other_user_id,
            username: conv.other_username,
            avatarUrl: conv.other_avatar,
          },
          product: conv.product_id ? {
            id: conv.product_id,
            title: conv.product_title,
          } : null,
        };
      })
    );

    res.json({ conversations });
  } catch (error) {
    next(error);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { productId, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = `((m.sender_id = $1 AND m.recipient_id = $2) OR (m.sender_id = $2 AND m.recipient_id = $1))`;
    const params = [req.user.id, userId, limit, offset];

    if (productId) {
      whereClause += ` AND m.product_id = $5`;
      params.push(productId);
    }

    const result = await pool.query(
      `SELECT m.id, m.sender_id, m.body, m.created_at, m.is_read,
              p.id as product_id, p.title as product_title
       FROM messages m
       LEFT JOIN products p ON m.product_id = p.id
       WHERE ${whereClause}
       ORDER BY m.created_at DESC
       LIMIT $3 OFFSET $4`,
      params
    );

    // Mark messages as read
    await pool.query(
      `UPDATE messages SET is_read = true
       WHERE recipient_id = $1 AND sender_id = $2 AND is_read = false`,
      [req.user.id, userId]
    );

    res.json({
      messages: result.rows.map(m => ({
        id: m.id,
        senderId: m.sender_id,
        body: m.body,
        createdAt: m.created_at,
        isRead: m.is_read,
        isMine: m.sender_id === req.user.id,
        product: m.product_id ? {
          id: m.product_id,
          title: m.product_title,
        } : null,
      })).reverse(),
    });
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { recipientId, body, productId, orderId, parentMessageId, subject } = req.body;

    if (recipientId === req.user.id) {
      return res.status(400).json({ error: 'Cannot send message to yourself' });
    }

    // Verify recipient exists
    const recipientResult = await pool.query('SELECT id FROM users WHERE id = $1', [recipientId]);
    if (recipientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    const result = await pool.query(
      `INSERT INTO messages (sender_id, recipient_id, product_id, order_id, parent_message_id, subject, body)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user.id, recipientId, productId || null, orderId || null, parentMessageId || null, subject || null, body]
    );

    // Notify recipient
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES ($1, 'message', 'New Message', $2, $3)`,
      [recipientId, `You have a new message from ${req.user.username}`, `/messages/${req.user.id}`]
    );

    res.status(201).json({
      message: 'Message sent',
      data: {
        id: result.rows[0].id,
        body: result.rows[0].body,
        createdAt: result.rows[0].created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM messages WHERE recipient_id = $1 AND is_read = false',
      [req.user.id]
    );

    res.json({ unreadCount: parseInt(result.rows[0].count) });
  } catch (error) {
    next(error);
  }
};

// Get messages for a specific conversation (by conversation/other user ID)
const getConversationMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    // First, find the other user from the conversation
    // The conversationId from frontend is the message ID of the last message
    // We need to get the other_user_id from that conversation
    const convResult = await pool.query(
      `SELECT CASE
                WHEN sender_id = $1 THEN recipient_id
                ELSE sender_id
              END as other_user_id
       FROM messages
       WHERE id = $2 AND (sender_id = $1 OR recipient_id = $1)`,
      [req.user.id, conversationId]
    );

    if (convResult.rows.length === 0) {
      // If not found by message ID, try treating conversationId as other_user_id directly
      const result = await pool.query(
        `SELECT m.id, m.sender_id, m.body as content, m.created_at,
                m.sender_id = $1 as is_own
         FROM messages m
         WHERE (m.sender_id = $1 AND m.recipient_id = $2) OR (m.sender_id = $2 AND m.recipient_id = $1)
         ORDER BY m.created_at ASC`,
        [req.user.id, conversationId]
      );

      // Mark messages as read
      await pool.query(
        `UPDATE messages SET is_read = true
         WHERE recipient_id = $1 AND sender_id = $2 AND is_read = false`,
        [req.user.id, conversationId]
      );

      return res.json({
        messages: result.rows.map(m => ({
          id: m.id,
          senderId: m.sender_id,
          content: m.content,
          createdAt: m.created_at,
          isOwn: m.is_own,
        })),
      });
    }

    const otherUserId = convResult.rows[0].other_user_id;

    const result = await pool.query(
      `SELECT m.id, m.sender_id, m.body as content, m.created_at,
              m.sender_id = $1 as is_own
       FROM messages m
       WHERE (m.sender_id = $1 AND m.recipient_id = $2) OR (m.sender_id = $2 AND m.recipient_id = $1)
       ORDER BY m.created_at ASC`,
      [req.user.id, otherUserId]
    );

    // Mark messages as read
    await pool.query(
      `UPDATE messages SET is_read = true
       WHERE recipient_id = $1 AND sender_id = $2 AND is_read = false`,
      [req.user.id, otherUserId]
    );

    res.json({
      messages: result.rows.map(m => ({
        id: m.id,
        senderId: m.sender_id,
        content: m.content,
        createdAt: m.created_at,
        isOwn: m.is_own,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// Reply to a conversation
const replyToConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Find the other user from the conversation
    const convResult = await pool.query(
      `SELECT CASE
                WHEN sender_id = $1 THEN recipient_id
                ELSE sender_id
              END as other_user_id,
              product_id
       FROM messages
       WHERE id = $2 AND (sender_id = $1 OR recipient_id = $1)`,
      [req.user.id, conversationId]
    );

    let recipientId, productId;

    if (convResult.rows.length === 0) {
      // If not found by message ID, treat conversationId as other_user_id
      recipientId = conversationId;
      productId = null;
    } else {
      recipientId = convResult.rows[0].other_user_id;
      productId = convResult.rows[0].product_id;
    }

    // Insert the new message
    const result = await pool.query(
      `INSERT INTO messages (sender_id, recipient_id, product_id, body)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user.id, recipientId, productId, content]
    );

    // Create notification for recipient
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, link)
         VALUES ($1, 'message', 'New Message', $2, $3)`,
        [recipientId, `You have a new message`, `/messages`]
      );
    } catch (e) {
      // Ignore notification errors
    }

    res.status(201).json({
      message: 'Message sent',
      data: {
        id: result.rows[0].id,
        content: result.rows[0].body,
        createdAt: result.rows[0].created_at,
        isOwn: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getConversations, getMessages, sendMessage, getUnreadCount, getConversationMessages, replyToConversation };
