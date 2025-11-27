const { pool } = require('../config/database');

// Get my support chats
const getMyChats = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sc.*, sa.display_name as agent_name,
              (SELECT message FROM support_chat_messages WHERE chat_id = sc.id ORDER BY created_at DESC LIMIT 1) as last_message
       FROM support_chats sc
       LEFT JOIN support_agents sa ON sc.agent_id = sa.user_id
       WHERE sc.user_id = $1
       ORDER BY sc.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get chat messages
const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await pool.query(
      `SELECT * FROM support_chats WHERE id = $1 AND user_id = $2`,
      [chatId, req.user.id]
    );

    if (chat.rows.length === 0) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const messages = await pool.query(
      `SELECT scm.*, u.username as sender_name
       FROM support_chat_messages scm
       JOIN users u ON scm.sender_id = u.id
       WHERE scm.chat_id = $1
       ORDER BY scm.created_at ASC`,
      [chatId]
    );

    // Mark as read
    await pool.query(
      `UPDATE support_chat_messages SET is_read = true WHERE chat_id = $1 AND sender_id != $2`,
      [chatId, req.user.id]
    );

    res.json({
      chat: chat.rows[0],
      messages: messages.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Start new chat
const startChat = async (req, res) => {
  try {
    const { subject, category, message } = req.body;

    // Find available agent
    const agent = await pool.query(
      `SELECT * FROM support_agents
       WHERE is_available = true AND current_chat_count < max_concurrent_chats
       ORDER BY current_chat_count ASC
       LIMIT 1`
    );

    const agentId = agent.rows[0]?.user_id || null;

    const chat = await pool.query(
      `INSERT INTO support_chats (user_id, agent_id, subject, category, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, agentId, subject, category, agentId ? 'active' : 'waiting']
    );

    // Add initial message
    if (message) {
      await pool.query(
        `INSERT INTO support_chat_messages (chat_id, sender_id, message)
         VALUES ($1, $2, $3)`,
        [chat.rows[0].id, req.user.id, message]
      );
    }

    // Update agent chat count
    if (agentId) {
      await pool.query(
        `UPDATE support_agents SET current_chat_count = current_chat_count + 1 WHERE user_id = $1`,
        [agentId]
      );
    }

    res.status(201).json(chat.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Send message
const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { message, messageType, attachmentUrl } = req.body;

    // Verify access
    const chat = await pool.query(
      `SELECT * FROM support_chats WHERE id = $1 AND (user_id = $2 OR agent_id = $2)`,
      [chatId, req.user.id]
    );

    if (chat.rows.length === 0) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const result = await pool.query(
      `INSERT INTO support_chat_messages (chat_id, sender_id, message, message_type, attachment_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [chatId, req.user.id, message, messageType || 'text', attachmentUrl]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Close chat
const closeChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { rating, feedback } = req.body;

    const result = await pool.query(
      `UPDATE support_chats
       SET status = 'closed', ended_at = NOW(), rating = $1, feedback = $2
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [rating, feedback, chatId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Update agent stats
    if (result.rows[0].agent_id) {
      await pool.query(
        `UPDATE support_agents
         SET current_chat_count = current_chat_count - 1,
             total_chats_handled = total_chats_handled + 1,
             average_rating = (SELECT AVG(rating) FROM support_chats WHERE agent_id = $1 AND rating IS NOT NULL)
         WHERE user_id = $1`,
        [result.rows[0].agent_id]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get agent dashboard (for support agents)
const getAgentDashboard = async (req, res) => {
  try {
    const agent = await pool.query(
      `SELECT * FROM support_agents WHERE user_id = $1`,
      [req.user.id]
    );

    if (agent.rows.length === 0) {
      return res.status(403).json({ error: 'Not a support agent' });
    }

    const activeChats = await pool.query(
      `SELECT sc.*, u.username as user_name
       FROM support_chats sc
       JOIN users u ON sc.user_id = u.id
       WHERE sc.agent_id = $1 AND sc.status IN ('active', 'waiting')
       ORDER BY sc.created_at ASC`,
      [req.user.id]
    );

    res.json({
      agent: agent.rows[0],
      activeChats: activeChats.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getMyChats,
  getChatMessages,
  startChat,
  sendMessage,
  closeChat,
  getAgentDashboard
};
