const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Get live streams
const getLiveStreams = async (req, res, next) => {
  try {
    const { status = 'live', category, page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      whereConditions.push(`ls.status = $${paramCount}`);
      queryParams.push(status);
    }

    if (category) {
      paramCount++;
      whereConditions.push(`c.slug = $${paramCount}`);
      queryParams.push(category);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    paramCount++;
    const limitParam = paramCount;
    paramCount++;
    const offsetParam = paramCount;
    queryParams.push(parseInt(limit), offset);

    const query = `
      SELECT
        ls.*,
        u.username as seller_username,
        u.avatar_url as seller_avatar,
        u.seller_rating,
        c.name as category_name,
        c.slug as category_slug,
        (SELECT COUNT(*) FROM live_stream_products WHERE stream_id = ls.id) as product_count
      FROM live_streams ls
      JOIN users u ON ls.seller_id = u.id
      LEFT JOIN categories c ON ls.category_id = c.id
      ${whereClause}
      ORDER BY ls.is_featured DESC, ls.viewer_count DESC, ls.scheduled_start DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    const result = await pool.query(query, queryParams);

    const countQuery = `
      SELECT COUNT(*) as total FROM live_streams ls
      LEFT JOIN categories c ON ls.category_id = c.id
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    res.json({
      streams: result.rows.map(stream => ({
        id: stream.id,
        title: stream.title,
        description: stream.description,
        status: stream.status,
        scheduledStart: stream.scheduled_start,
        actualStart: stream.actual_start,
        viewerCount: stream.viewer_count,
        peakViewers: stream.peak_viewers,
        thumbnailUrl: stream.thumbnail_url,
        isFeatured: stream.is_featured,
        productCount: parseInt(stream.product_count),
        seller: {
          id: stream.seller_id,
          username: stream.seller_username,
          avatarUrl: stream.seller_avatar,
          rating: parseFloat(stream.seller_rating),
        },
        category: stream.category_id ? {
          id: stream.category_id,
          name: stream.category_name,
          slug: stream.category_slug,
        } : null,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get featured streams
const getFeaturedStreams = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT ls.*, u.username as seller_username, u.avatar_url as seller_avatar
       FROM live_streams ls
       JOIN users u ON ls.seller_id = u.id
       WHERE ls.status = 'live' OR (ls.status = 'scheduled' AND ls.scheduled_start <= NOW() + INTERVAL '24 hours')
       ORDER BY ls.is_featured DESC, ls.viewer_count DESC
       LIMIT 6`
    );

    res.json({
      streams: result.rows.map(stream => ({
        id: stream.id,
        title: stream.title,
        status: stream.status,
        viewerCount: stream.viewer_count,
        thumbnailUrl: stream.thumbnail_url,
        scheduledStart: stream.scheduled_start,
        seller: {
          username: stream.seller_username,
          avatarUrl: stream.seller_avatar,
        },
      })),
    });
  } catch (error) {
    next(error);
  }
};

// Get stream by ID
const getStreamById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT ls.*,
              u.username as seller_username, u.avatar_url as seller_avatar,
              u.seller_rating, u.total_sales,
              c.name as category_name, c.slug as category_slug
       FROM live_streams ls
       JOIN users u ON ls.seller_id = u.id
       LEFT JOIN categories c ON ls.category_id = c.id
       WHERE ls.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    const stream = result.rows[0];

    // Get stream products
    const productsResult = await pool.query(
      `SELECT lsp.*, p.title, p.current_price, p.buy_now_price,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image
       FROM live_stream_products lsp
       JOIN products p ON lsp.product_id = p.id
       WHERE lsp.stream_id = $1
       ORDER BY lsp.is_featured DESC, lsp.display_order`,
      [id]
    );

    res.json({
      id: stream.id,
      title: stream.title,
      description: stream.description,
      status: stream.status,
      scheduledStart: stream.scheduled_start,
      actualStart: stream.actual_start,
      endedAt: stream.ended_at,
      viewerCount: stream.viewer_count,
      peakViewers: stream.peak_viewers,
      streamUrl: stream.status === 'live' ? stream.playback_url : null,
      thumbnailUrl: stream.thumbnail_url,
      isFeatured: stream.is_featured,
      replayAvailable: stream.replay_available,
      replayUrl: stream.replay_url,
      seller: {
        id: stream.seller_id,
        username: stream.seller_username,
        avatarUrl: stream.seller_avatar,
        rating: parseFloat(stream.seller_rating),
        totalSales: stream.total_sales,
      },
      category: stream.category_id ? {
        id: stream.category_id,
        name: stream.category_name,
        slug: stream.category_slug,
      } : null,
      products: productsResult.rows.map(p => ({
        id: p.product_id,
        title: p.title,
        price: parseFloat(p.buy_now_price || p.current_price),
        flashPrice: p.flash_price ? parseFloat(p.flash_price) : null,
        flashStart: p.flash_start,
        flashEnd: p.flash_end,
        isFeatured: p.is_featured,
        image: p.image,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// Create stream
const createStream = async (req, res, next) => {
  try {
    const { title, description, scheduledStart, categoryId, thumbnailUrl } = req.body;

    if (!title || !scheduledStart) {
      return res.status(400).json({ error: 'Title and scheduled start time are required' });
    }

    const streamKey = uuidv4();

    const result = await pool.query(
      `INSERT INTO live_streams (seller_id, title, description, scheduled_start, category_id, thumbnail_url, stream_key)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user.id, title, description, scheduledStart, categoryId || null, thumbnailUrl, streamKey]
    );

    res.status(201).json({
      message: 'Stream scheduled successfully',
      stream: {
        id: result.rows[0].id,
        title: result.rows[0].title,
        scheduledStart: result.rows[0].scheduled_start,
        streamKey: result.rows[0].stream_key,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update stream
const updateStream = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, scheduledStart, categoryId, thumbnailUrl } = req.body;

    // Check ownership
    const checkResult = await pool.query(
      'SELECT seller_id, status FROM live_streams WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    if (checkResult.rows[0].seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (checkResult.rows[0].status === 'live') {
      return res.status(400).json({ error: 'Cannot edit a live stream' });
    }

    const updates = [];
    const values = [];
    let paramCount = 0;

    if (title) {
      paramCount++;
      updates.push(`title = $${paramCount}`);
      values.push(title);
    }
    if (description !== undefined) {
      paramCount++;
      updates.push(`description = $${paramCount}`);
      values.push(description);
    }
    if (scheduledStart) {
      paramCount++;
      updates.push(`scheduled_start = $${paramCount}`);
      values.push(scheduledStart);
    }
    if (categoryId !== undefined) {
      paramCount++;
      updates.push(`category_id = $${paramCount}`);
      values.push(categoryId);
    }
    if (thumbnailUrl) {
      paramCount++;
      updates.push(`thumbnail_url = $${paramCount}`);
      values.push(thumbnailUrl);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    paramCount++;
    values.push(id);

    await pool.query(
      `UPDATE live_streams SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramCount}`,
      values
    );

    res.json({ message: 'Stream updated successfully' });
  } catch (error) {
    next(error);
  }
};

// Delete stream
const deleteStream = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM live_streams WHERE id = $1 AND seller_id = $2 AND status != $3 RETURNING id',
      [id, req.user.id, 'live']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stream not found or cannot be deleted while live' });
    }

    res.json({ message: 'Stream deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Start stream
const startStream = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE live_streams
       SET status = 'live', actual_start = NOW()
       WHERE id = $1 AND seller_id = $2 AND status = 'scheduled'
       RETURNING *`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stream not found or already started' });
    }

    res.json({
      message: 'Stream started',
      stream: {
        id: result.rows[0].id,
        streamKey: result.rows[0].stream_key,
        streamUrl: result.rows[0].stream_url,
      },
    });
  } catch (error) {
    next(error);
  }
};

// End stream
const endStream = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE live_streams
       SET status = 'ended', ended_at = NOW()
       WHERE id = $1 AND seller_id = $2 AND status = 'live'
       RETURNING *`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stream not found or not live' });
    }

    res.json({ message: 'Stream ended' });
  } catch (error) {
    next(error);
  }
};

// Get stream chat
const getStreamChat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 100, after } = req.query;

    let query = `
      SELECT lcm.*, u.username, u.avatar_url
      FROM live_chat_messages lcm
      JOIN users u ON lcm.user_id = u.id
      WHERE lcm.stream_id = $1 AND lcm.is_deleted = false
    `;
    const params = [id];

    if (after) {
      query += ` AND lcm.created_at > $2`;
      params.push(after);
    }

    query += ` ORDER BY lcm.created_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));

    const result = await pool.query(query, params);

    res.json({
      messages: result.rows.reverse().map(msg => ({
        id: msg.id,
        message: msg.message,
        isPinned: msg.is_pinned,
        isHighlighted: msg.is_highlighted,
        createdAt: msg.created_at,
        user: {
          id: msg.user_id,
          username: msg.username,
          avatarUrl: msg.avatar_url,
        },
      })),
    });
  } catch (error) {
    next(error);
  }
};

// Send chat message
const sendChatMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check if stream is live
    const streamResult = await pool.query(
      "SELECT id FROM live_streams WHERE id = $1 AND status = 'live'",
      [id]
    );

    if (streamResult.rows.length === 0) {
      return res.status(400).json({ error: 'Stream is not live' });
    }

    const result = await pool.query(
      `INSERT INTO live_chat_messages (stream_id, user_id, message)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, req.user.id, message.trim()]
    );

    res.status(201).json({
      message: {
        id: result.rows[0].id,
        message: result.rows[0].message,
        createdAt: result.rows[0].created_at,
        user: {
          id: req.user.id,
          username: req.user.username,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Pin chat message
const pinChatMessage = async (req, res, next) => {
  try {
    const { id, messageId } = req.params;

    // Check ownership of stream
    const streamResult = await pool.query(
      'SELECT seller_id FROM live_streams WHERE id = $1',
      [id]
    );

    if (streamResult.rows.length === 0 || streamResult.rows[0].seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Unpin all other messages first
    await pool.query(
      'UPDATE live_chat_messages SET is_pinned = false WHERE stream_id = $1',
      [id]
    );

    // Pin this message
    await pool.query(
      'UPDATE live_chat_messages SET is_pinned = true WHERE id = $1 AND stream_id = $2',
      [messageId, id]
    );

    res.json({ message: 'Message pinned' });
  } catch (error) {
    next(error);
  }
};

// Get stream products
const getStreamProducts = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT lsp.*, p.title, p.current_price, p.buy_now_price, p.condition, p.free_shipping,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image
       FROM live_stream_products lsp
       JOIN products p ON lsp.product_id = p.id
       WHERE lsp.stream_id = $1
       ORDER BY lsp.is_featured DESC, lsp.display_order`,
      [id]
    );

    res.json({
      products: result.rows.map(p => ({
        id: p.product_id,
        title: p.title,
        price: parseFloat(p.buy_now_price || p.current_price),
        flashPrice: p.flash_price ? parseFloat(p.flash_price) : null,
        flashStart: p.flash_start,
        flashEnd: p.flash_end,
        isFeatured: p.is_featured,
        condition: p.condition,
        freeShipping: p.free_shipping,
        image: p.image,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// Add product to stream
const addStreamProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { productId, displayOrder } = req.body;

    // Verify stream ownership
    const streamResult = await pool.query(
      'SELECT seller_id FROM live_streams WHERE id = $1',
      [id]
    );

    if (streamResult.rows.length === 0) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    if (streamResult.rows[0].seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Verify product ownership
    const productResult = await pool.query(
      'SELECT id FROM products WHERE id = $1 AND seller_id = $2',
      [productId, req.user.id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found or not owned by you' });
    }

    await pool.query(
      `INSERT INTO live_stream_products (stream_id, product_id, display_order)
       VALUES ($1, $2, $3)
       ON CONFLICT (stream_id, product_id) DO UPDATE SET display_order = $3`,
      [id, productId, displayOrder || 0]
    );

    res.status(201).json({ message: 'Product added to stream' });
  } catch (error) {
    next(error);
  }
};

// Remove product from stream
const removeStreamProduct = async (req, res, next) => {
  try {
    const { id, productId } = req.params;

    // Verify ownership
    const streamResult = await pool.query(
      'SELECT seller_id FROM live_streams WHERE id = $1',
      [id]
    );

    if (streamResult.rows.length === 0 || streamResult.rows[0].seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await pool.query(
      'DELETE FROM live_stream_products WHERE stream_id = $1 AND product_id = $2',
      [id, productId]
    );

    res.json({ message: 'Product removed from stream' });
  } catch (error) {
    next(error);
  }
};

// Create flash deal during stream
const createFlashDeal = async (req, res, next) => {
  try {
    const { id, productId } = req.params;
    const { flashPrice, durationMinutes = 10 } = req.body;

    // Verify ownership and stream is live
    const streamResult = await pool.query(
      "SELECT seller_id FROM live_streams WHERE id = $1 AND status = 'live'",
      [id]
    );

    if (streamResult.rows.length === 0) {
      return res.status(404).json({ error: 'Stream not found or not live' });
    }

    if (streamResult.rows[0].seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const flashStart = new Date();
    const flashEnd = new Date(flashStart.getTime() + durationMinutes * 60 * 1000);

    await pool.query(
      `UPDATE live_stream_products
       SET flash_price = $1, flash_start = $2, flash_end = $3, is_featured = true
       WHERE stream_id = $4 AND product_id = $5`,
      [flashPrice, flashStart, flashEnd, id, productId]
    );

    res.json({
      message: 'Flash deal created',
      flashDeal: {
        productId,
        flashPrice,
        flashStart,
        flashEnd,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Join stream (increment viewer count)
const joinStream = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE live_streams
       SET viewer_count = viewer_count + 1,
           peak_viewers = GREATEST(peak_viewers, viewer_count + 1)
       WHERE id = $1 AND status = 'live'
       RETURNING viewer_count`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stream not found or not live' });
    }

    res.json({ viewerCount: result.rows[0].viewer_count });
  } catch (error) {
    next(error);
  }
};

// Leave stream (decrement viewer count)
const leaveStream = async (req, res, next) => {
  try {
    const { id } = req.params;

    await pool.query(
      `UPDATE live_streams
       SET viewer_count = GREATEST(0, viewer_count - 1)
       WHERE id = $1`,
      [id]
    );

    res.json({ message: 'Left stream' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLiveStreams,
  getFeaturedStreams,
  getStreamById,
  createStream,
  updateStream,
  deleteStream,
  startStream,
  endStream,
  getStreamChat,
  sendChatMessage,
  pinChatMessage,
  getStreamProducts,
  addStreamProduct,
  removeStreamProduct,
  createFlashDeal,
  joinStream,
  leaveStream,
};
