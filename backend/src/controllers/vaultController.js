const { pool } = require('../config/database');

// Grading services information
const GRADING_SERVICES = {
  PSA: {
    name: 'PSA (Professional Sports Authenticator)',
    description: 'The largest and most trusted third-party authentication and grading company',
    categories: ['Sports Cards', 'Pokemon Cards', 'Trading Cards'],
    turnaround: '30-60 days',
    priceRange: '$25-$150',
  },
  BGS: {
    name: 'BGS (Beckett Grading Services)',
    description: 'Renowned for their subgrade system and precise grading',
    categories: ['Sports Cards', 'Trading Cards', 'Gaming Cards'],
    turnaround: '45-90 days',
    priceRange: '$20-$100',
  },
  CGC: {
    name: 'CGC (Certified Guaranty Company)',
    description: 'The leading grading service for comic books and magazines',
    categories: ['Comic Books', 'Magazines', 'Concert Posters'],
    turnaround: '30-45 days',
    priceRange: '$25-$150',
  },
  SGC: {
    name: 'SGC (Sportscard Guaranty Corporation)',
    description: 'Known for consistent grading and quick turnaround',
    categories: ['Sports Cards', 'Vintage Cards'],
    turnaround: '20-40 days',
    priceRange: '$15-$75',
  },
};

// Get user's vault items
const getVaultItems = async (req, res, next) => {
  try {
    const { status, gradingService, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = ['user_id = $1'];
    let queryParams = [req.user.id];
    let paramCount = 1;

    if (status) {
      paramCount++;
      whereConditions.push(`status = $${paramCount}`);
      queryParams.push(status);
    }

    if (gradingService) {
      paramCount++;
      whereConditions.push(`grading_service = $${paramCount}`);
      queryParams.push(gradingService);
    }

    const whereClause = whereConditions.join(' AND ');

    // Count query
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM vault_items WHERE ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].total);

    // Main query
    paramCount++;
    const limitParam = paramCount;
    paramCount++;
    const offsetParam = paramCount;
    queryParams.push(parseInt(limit), offset);

    const result = await pool.query(
      `SELECT vi.*, p.title as product_title, p.slug as product_slug
       FROM vault_items vi
       LEFT JOIN products p ON vi.product_id = p.id
       WHERE ${whereClause}
       ORDER BY vi.created_at DESC
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      queryParams
    );

    res.json({
      items: result.rows.map(item => ({
        id: item.id,
        itemName: item.item_name,
        itemDescription: item.item_description,
        gradingService: item.grading_service,
        grade: item.grade,
        certNumber: item.cert_number,
        status: item.status,
        vaultLocation: item.vault_location,
        estimatedValue: item.estimated_value ? parseFloat(item.estimated_value) : null,
        insuranceValue: item.insurance_value ? parseFloat(item.insurance_value) : null,
        submissionDate: item.submission_date,
        gradedDate: item.graded_date,
        images: item.images || [],
        notes: item.notes,
        trackingNumberIn: item.tracking_number_in,
        trackingNumberOut: item.tracking_number_out,
        createdAt: item.created_at,
        product: item.product_id ? {
          id: item.product_id,
          title: item.product_title,
          slug: item.product_slug,
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

// Get single vault item
const getVaultItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT vi.*, p.title as product_title, p.slug as product_slug,
              p.buy_now_price as product_price
       FROM vault_items vi
       LEFT JOIN products p ON vi.product_id = p.id
       WHERE vi.id = $1 AND vi.user_id = $2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vault item not found' });
    }

    const item = result.rows[0];

    res.json({
      id: item.id,
      itemName: item.item_name,
      itemDescription: item.item_description,
      gradingService: item.grading_service,
      gradingServiceInfo: GRADING_SERVICES[item.grading_service] || null,
      grade: item.grade,
      certNumber: item.cert_number,
      status: item.status,
      vaultLocation: item.vault_location,
      estimatedValue: item.estimated_value ? parseFloat(item.estimated_value) : null,
      insuranceValue: item.insurance_value ? parseFloat(item.insurance_value) : null,
      submissionDate: item.submission_date,
      gradedDate: item.graded_date,
      images: item.images || [],
      notes: item.notes,
      trackingNumberIn: item.tracking_number_in,
      trackingNumberOut: item.tracking_number_out,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      product: item.product_id ? {
        id: item.product_id,
        title: item.product_title,
        slug: item.product_slug,
        price: item.product_price ? parseFloat(item.product_price) : null,
      } : null,
    });
  } catch (error) {
    next(error);
  }
};

// Submit item for vaulting/grading
const submitItem = async (req, res, next) => {
  try {
    const {
      itemName,
      itemDescription,
      gradingService,
      images,
      estimatedValue,
      insuranceValue,
      notes,
    } = req.body;

    if (!itemName) {
      return res.status(400).json({ error: 'Item name is required' });
    }

    if (gradingService && !GRADING_SERVICES[gradingService] && gradingService !== 'none') {
      return res.status(400).json({ error: 'Invalid grading service' });
    }

    const result = await pool.query(
      `INSERT INTO vault_items (
        user_id, item_name, item_description, grading_service,
        images, estimated_value, insurance_value, notes, submission_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *`,
      [
        req.user.id,
        itemName,
        itemDescription,
        gradingService || 'none',
        JSON.stringify(images || []),
        estimatedValue || null,
        insuranceValue || null,
        notes,
      ]
    );

    // Create notification
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES ($1, 'vault_submission', 'Vault Submission Received', $2, '/vault')`,
      [req.user.id, `Your item "${itemName}" has been submitted for vaulting.`]
    );

    res.status(201).json({
      message: 'Item submitted successfully',
      item: {
        id: result.rows[0].id,
        itemName: result.rows[0].item_name,
        status: result.rows[0].status,
        gradingService: result.rows[0].grading_service,
      },
      instructions: {
        shippingAddress: {
          name: 'eBay Vault Center',
          address: '1234 Vault Drive',
          city: 'Tempe',
          state: 'AZ',
          zip: '85281',
        },
        instructions: [
          'Pack your item securely with adequate protection',
          'Include a copy of your submission confirmation',
          'Ship with tracking and insurance',
          'Use the provided submission ID as reference',
        ],
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update vault item
const updateVaultItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { trackingNumberIn, notes, estimatedValue, insuranceValue } = req.body;

    // Verify ownership
    const checkResult = await pool.query(
      'SELECT id, status FROM vault_items WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vault item not found' });
    }

    const updates = [];
    const values = [];
    let paramCount = 0;

    if (trackingNumberIn) {
      paramCount++;
      updates.push(`tracking_number_in = $${paramCount}`);
      values.push(trackingNumberIn);

      // Update status if currently pending
      if (checkResult.rows[0].status === 'pending') {
        paramCount++;
        updates.push(`status = $${paramCount}`);
        values.push('shipped_to_vault');
      }
    }

    if (notes !== undefined) {
      paramCount++;
      updates.push(`notes = $${paramCount}`);
      values.push(notes);
    }

    if (estimatedValue !== undefined) {
      paramCount++;
      updates.push(`estimated_value = $${paramCount}`);
      values.push(estimatedValue);
    }

    if (insuranceValue !== undefined) {
      paramCount++;
      updates.push(`insurance_value = $${paramCount}`);
      values.push(insuranceValue);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    paramCount++;
    values.push(id);

    await pool.query(
      `UPDATE vault_items SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramCount}`,
      values
    );

    res.json({ message: 'Vault item updated successfully' });
  } catch (error) {
    next(error);
  }
};

// Request shipping out from vault
const requestShipOut = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { shippingAddressId } = req.body;

    // Verify ownership and status
    const checkResult = await pool.query(
      'SELECT status FROM vault_items WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vault item not found' });
    }

    if (checkResult.rows[0].status !== 'stored') {
      return res.status(400).json({ error: 'Item must be in stored status to request ship out' });
    }

    await pool.query(
      `UPDATE vault_items SET status = 'shipping_out', updated_at = NOW() WHERE id = $1`,
      [id]
    );

    // Create notification
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES ($1, 'vault_shipout', 'Ship Out Request Received', 'Your vault item will be shipped soon.', '/vault')`,
      [req.user.id]
    );

    res.json({
      message: 'Ship out request submitted',
      estimatedShipping: '3-5 business days',
    });
  } catch (error) {
    next(error);
  }
};

// List vault item for sale
const listVaultItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { price, listingType = 'buy_now' } = req.body;

    if (!price) {
      return res.status(400).json({ error: 'Price is required' });
    }

    // Get vault item
    const vaultResult = await pool.query(
      `SELECT * FROM vault_items WHERE id = $1 AND user_id = $2 AND status = 'stored'`,
      [id, req.user.id]
    );

    if (vaultResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vault item not found or not available for listing' });
    }

    const vaultItem = vaultResult.rows[0];

    // Create product listing
    const productResult = await pool.query(
      `INSERT INTO products (
        seller_id, title, description, condition, listing_type,
        buy_now_price, current_price, status
      ) VALUES ($1, $2, $3, 'like_new', $4, $5, $5, 'active')
      RETURNING id`,
      [
        req.user.id,
        `${vaultItem.item_name} - ${vaultItem.grading_service} ${vaultItem.grade || 'Graded'}`,
        `${vaultItem.item_description || ''}\n\nGrading: ${vaultItem.grading_service}\nGrade: ${vaultItem.grade || 'N/A'}\nCertification: ${vaultItem.cert_number || 'Pending'}`,
        listingType,
        price,
      ]
    );

    // Link product to vault item
    await pool.query(
      'UPDATE vault_items SET product_id = $1, updated_at = NOW() WHERE id = $2',
      [productResult.rows[0].id, id]
    );

    res.json({
      message: 'Item listed successfully',
      productId: productResult.rows[0].id,
    });
  } catch (error) {
    next(error);
  }
};

// Get grading services info
const getGradingServices = async (req, res, next) => {
  res.json({
    services: Object.entries(GRADING_SERVICES).map(([key, value]) => ({
      id: key,
      ...value,
    })),
  });
};

// Get vault statistics
const getVaultStats = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
        COUNT(*) as total_items,
        COUNT(*) FILTER (WHERE status = 'stored') as stored,
        COUNT(*) FILTER (WHERE status = 'grading') as grading,
        COUNT(*) FILTER (WHERE status = 'pending' OR status = 'shipped_to_vault') as pending,
        SUM(COALESCE(estimated_value, 0)) as total_estimated_value,
        COUNT(DISTINCT grading_service) FILTER (WHERE grading_service != 'none') as grading_services_used
       FROM vault_items
       WHERE user_id = $1`,
      [req.user.id]
    );

    const stats = result.rows[0];

    res.json({
      totalItems: parseInt(stats.total_items) || 0,
      stored: parseInt(stats.stored) || 0,
      grading: parseInt(stats.grading) || 0,
      pending: parseInt(stats.pending) || 0,
      totalEstimatedValue: parseFloat(stats.total_estimated_value) || 0,
      gradingServicesUsed: parseInt(stats.grading_services_used) || 0,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVaultItems,
  getVaultItem,
  submitItem,
  updateVaultItem,
  requestShipOut,
  listVaultItem,
  getGradingServices,
  getVaultStats,
};
