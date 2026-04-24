const { pool } = require('../config/database');

// Get all active deals
const getActiveDeals = async (req, res, next) => {
  try {
    const {
      category,
      minDiscount,
      maxPrice,
      sortBy = 'end_time',
      sortOrder = 'asc',
      page = 1,
      limit = 20
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = [
      "d.is_active = true",
      "d.end_time > NOW()",
      "d.quantity_sold < d.quantity_available"
    ];
    let queryParams = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      whereConditions.push(`c.slug = $${paramCount}`);
      queryParams.push(category);
    }

    if (minDiscount) {
      paramCount++;
      whereConditions.push(`d.discount_percentage >= $${paramCount}`);
      queryParams.push(parseFloat(minDiscount));
    }

    if (maxPrice) {
      paramCount++;
      whereConditions.push(`d.deal_price <= $${paramCount}`);
      queryParams.push(parseFloat(maxPrice));
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const validSortColumns = {
      end_time: 'd.end_time',
      discount: 'd.discount_percentage',
      price: 'd.deal_price',
      created_at: 'd.created_at'
    };
    const sortColumn = validSortColumns[sortBy] || 'd.end_time';
    const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM daily_deals d
      LEFT JOIN products p ON d.product_id = p.id
      LEFT JOIN categories c ON d.category_id = c.id
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Main query
    paramCount++;
    const limitParam = paramCount;
    paramCount++;
    const offsetParam = paramCount;
    queryParams.push(parseInt(limit), offset);

    const query = `
      SELECT
        d.id,
        d.discount_percentage,
        d.deal_price,
        d.original_price,
        d.start_time,
        d.end_time,
        d.quantity_available,
        d.quantity_sold,
        d.featured,
        d.created_at,
        p.id as product_id,
        p.title,
        p.slug,
        p.description,
        p.condition,
        p.free_shipping,
        p.shipping_cost,
        c.id as category_id,
        c.name as category_name,
        c.slug as category_slug,
        u.id as seller_id,
        u.username as seller_username,
        u.seller_rating,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as primary_image
      FROM daily_deals d
      JOIN products p ON d.product_id = p.id
      LEFT JOIN categories c ON d.category_id = c.id
      LEFT JOIN users u ON p.seller_id = u.id
      ${whereClause}
      ORDER BY d.featured DESC, ${sortColumn} ${order}
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    const result = await pool.query(query, queryParams);

    const deals = result.rows.map(deal => ({
      id: deal.id,
      discountPercentage: parseFloat(deal.discount_percentage),
      dealPrice: parseFloat(deal.deal_price),
      originalPrice: parseFloat(deal.original_price),
      savings: parseFloat(deal.original_price) - parseFloat(deal.deal_price),
      startTime: deal.start_time,
      endTime: deal.end_time,
      quantityAvailable: deal.quantity_available,
      quantitySold: deal.quantity_sold,
      quantityRemaining: deal.quantity_available - deal.quantity_sold,
      featured: deal.featured,
      product: {
        id: deal.product_id,
        title: deal.title,
        slug: deal.slug,
        description: deal.description,
        condition: deal.condition,
        freeShipping: deal.free_shipping,
        shippingCost: parseFloat(deal.shipping_cost) || 0,
        primaryImage: deal.primary_image,
      },
      category: deal.category_id ? {
        id: deal.category_id,
        name: deal.category_name,
        slug: deal.category_slug,
      } : null,
      seller: {
        id: deal.seller_id,
        username: deal.seller_username,
        rating: parseFloat(deal.seller_rating),
      },
    }));

    res.json({
      deals,
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

// Get featured deals for homepage
const getFeaturedDeals = async (req, res, next) => {
  try {
    const { limit = 6 } = req.query;

    const query = `
      SELECT
        d.id,
        d.discount_percentage,
        d.deal_price,
        d.original_price,
        d.end_time,
        d.quantity_available,
        d.quantity_sold,
        p.id as product_id,
        p.title,
        p.slug,
        p.free_shipping,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as primary_image
      FROM daily_deals d
      JOIN products p ON d.product_id = p.id
      WHERE d.is_active = true
        AND d.end_time > NOW()
        AND d.quantity_sold < d.quantity_available
      ORDER BY d.featured DESC, d.discount_percentage DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [parseInt(limit)]);

    res.json({
      deals: result.rows.map(deal => ({
        id: deal.id,
        discountPercentage: parseFloat(deal.discount_percentage),
        dealPrice: parseFloat(deal.deal_price),
        originalPrice: parseFloat(deal.original_price),
        endTime: deal.end_time,
        quantityRemaining: deal.quantity_available - deal.quantity_sold,
        product: {
          id: deal.product_id,
          title: deal.title,
          slug: deal.slug,
          freeShipping: deal.free_shipping,
          primaryImage: deal.primary_image,
        },
      })),
    });
  } catch (error) {
    next(error);
  }
};

// Get deal categories
const getDealCategories = async (req, res, next) => {
  try {
    const query = `
      SELECT DISTINCT
        c.id,
        c.name,
        c.slug,
        COUNT(d.id) as deal_count
      FROM daily_deals d
      JOIN categories c ON d.category_id = c.id
      WHERE d.is_active = true
        AND d.end_time > NOW()
        AND d.quantity_sold < d.quantity_available
      GROUP BY c.id, c.name, c.slug
      ORDER BY deal_count DESC
    `;

    const result = await pool.query(query);

    res.json({
      categories: result.rows.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        dealCount: parseInt(cat.deal_count),
      })),
    });
  } catch (error) {
    next(error);
  }
};

// Get deal by ID
const getDealById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT
        d.*,
        p.id as product_id,
        p.title,
        p.slug,
        p.description,
        p.condition,
        p.free_shipping,
        p.shipping_cost,
        p.brand,
        p.model,
        c.id as category_id,
        c.name as category_name,
        c.slug as category_slug,
        u.id as seller_id,
        u.username as seller_username,
        u.seller_rating,
        u.total_sales
      FROM daily_deals d
      JOIN products p ON d.product_id = p.id
      LEFT JOIN categories c ON d.category_id = c.id
      LEFT JOIN users u ON p.seller_id = u.id
      WHERE d.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const deal = result.rows[0];

    // Get product images
    const imagesResult = await pool.query(
      'SELECT id, image_url, thumbnail_url, is_primary FROM product_images WHERE product_id = $1 ORDER BY is_primary DESC, sort_order',
      [deal.product_id]
    );

    res.json({
      id: deal.id,
      discountPercentage: parseFloat(deal.discount_percentage),
      dealPrice: parseFloat(deal.deal_price),
      originalPrice: parseFloat(deal.original_price),
      savings: parseFloat(deal.original_price) - parseFloat(deal.deal_price),
      startTime: deal.start_time,
      endTime: deal.end_time,
      quantityAvailable: deal.quantity_available,
      quantitySold: deal.quantity_sold,
      quantityRemaining: deal.quantity_available - deal.quantity_sold,
      isActive: deal.is_active && new Date(deal.end_time) > new Date(),
      featured: deal.featured,
      product: {
        id: deal.product_id,
        title: deal.title,
        slug: deal.slug,
        description: deal.description,
        condition: deal.condition,
        freeShipping: deal.free_shipping,
        shippingCost: parseFloat(deal.shipping_cost) || 0,
        brand: deal.brand,
        model: deal.model,
        images: imagesResult.rows.map(img => ({
          id: img.id,
          url: img.image_url,
          thumbnail: img.thumbnail_url,
          isPrimary: img.is_primary,
        })),
      },
      category: deal.category_id ? {
        id: deal.category_id,
        name: deal.category_name,
        slug: deal.category_slug,
      } : null,
      seller: {
        id: deal.seller_id,
        username: deal.seller_username,
        rating: parseFloat(deal.seller_rating),
        totalSales: deal.total_sales,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create a new deal (admin/seller)
const createDeal = async (req, res, next) => {
  try {
    const {
      productId,
      discountPercentage,
      endTime,
      quantityAvailable,
      featured = false,
    } = req.body;

    // Get product details
    const productResult = await pool.query(
      'SELECT id, seller_id, current_price, buy_now_price, category_id FROM products WHERE id = $1',
      [productId]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = productResult.rows[0];

    // Check ownership
    if (product.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to create deal for this product' });
    }

    const originalPrice = product.buy_now_price || product.current_price;
    const dealPrice = originalPrice * (1 - discountPercentage / 100);

    const result = await pool.query(
      `INSERT INTO daily_deals (
        product_id, discount_percentage, deal_price, original_price,
        end_time, quantity_available, category_id, featured
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        productId,
        discountPercentage,
        dealPrice.toFixed(2),
        originalPrice,
        endTime,
        quantityAvailable || 1,
        product.category_id,
        featured,
      ]
    );

    res.status(201).json({
      message: 'Deal created successfully',
      deal: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Update deal
const updateDeal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { discountPercentage, endTime, quantityAvailable, isActive, featured } = req.body;

    // Check deal exists and ownership
    const checkResult = await pool.query(
      `SELECT d.*, p.seller_id FROM daily_deals d
       JOIN products p ON d.product_id = p.id
       WHERE d.id = $1`,
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    if (checkResult.rows[0].seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this deal' });
    }

    const updates = [];
    const values = [];
    let paramCount = 0;

    if (discountPercentage !== undefined) {
      paramCount++;
      const dealPrice = checkResult.rows[0].original_price * (1 - discountPercentage / 100);
      updates.push(`discount_percentage = $${paramCount}`);
      values.push(discountPercentage);
      paramCount++;
      updates.push(`deal_price = $${paramCount}`);
      values.push(dealPrice.toFixed(2));
    }

    if (endTime !== undefined) {
      paramCount++;
      updates.push(`end_time = $${paramCount}`);
      values.push(endTime);
    }

    if (quantityAvailable !== undefined) {
      paramCount++;
      updates.push(`quantity_available = $${paramCount}`);
      values.push(quantityAvailable);
    }

    if (isActive !== undefined) {
      paramCount++;
      updates.push(`is_active = $${paramCount}`);
      values.push(isActive);
    }

    if (featured !== undefined) {
      paramCount++;
      updates.push(`featured = $${paramCount}`);
      values.push(featured);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    paramCount++;
    values.push(id);

    const result = await pool.query(
      `UPDATE daily_deals SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`,
      values
    );

    res.json({
      message: 'Deal updated successfully',
      deal: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Delete deal
const deleteDeal = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check ownership
    const checkResult = await pool.query(
      `SELECT d.*, p.seller_id FROM daily_deals d
       JOIN products p ON d.product_id = p.id
       WHERE d.id = $1`,
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    if (checkResult.rows[0].seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this deal' });
    }

    await pool.query('DELETE FROM daily_deals WHERE id = $1', [id]);

    res.json({ message: 'Deal deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Purchase deal
const purchaseDeal = async (req, res, next) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { quantity = 1 } = req.body;

    // Lock the deal row
    const dealResult = await client.query(
      `SELECT d.*, p.id as product_id, p.seller_id
       FROM daily_deals d
       JOIN products p ON d.product_id = p.id
       WHERE d.id = $1
       FOR UPDATE`,
      [id]
    );

    if (dealResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Deal not found' });
    }

    const deal = dealResult.rows[0];

    // Check if deal is still valid
    if (!deal.is_active || new Date(deal.end_time) <= new Date()) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Deal has expired' });
    }

    // Check quantity
    const remaining = deal.quantity_available - deal.quantity_sold;
    if (quantity > remaining) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Only ${remaining} items available` });
    }

    // Update deal quantity
    await client.query(
      'UPDATE daily_deals SET quantity_sold = quantity_sold + $1 WHERE id = $2',
      [quantity, id]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Deal added to cart successfully',
      deal: {
        id: deal.id,
        productId: deal.product_id,
        price: parseFloat(deal.deal_price),
        quantity,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

module.exports = {
  getActiveDeals,
  getFeaturedDeals,
  getDealCategories,
  getDealById,
  createDeal,
  updateDeal,
  deleteDeal,
  purchaseDeal,
};
