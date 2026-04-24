const { pool } = require('../config/database');
const { screenListing, recordReport } = require('../services/moderationService');

const createSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    + '-' + Date.now().toString(36);
};

const getAllProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      subcategory,
      minPrice,
      maxPrice,
      condition,
      listingType,
      sortBy = 'created_at',
      sortOrder = 'desc',
      search,
      sellerId,
      // New filters
      freeShipping,
      location,
      state,
      country,
      brand,
      color,
      acceptsOffers,
      freeReturns,
      topRatedSeller,
      minSellerRating,
      endingWithin,
      localPickup,
      featured,
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = ["p.status = 'active'"];
    let queryParams = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      whereConditions.push(`c.slug = $${paramCount}`);
      queryParams.push(category);
    }

    if (subcategory) {
      paramCount++;
      whereConditions.push(`sc.slug = $${paramCount}`);
      queryParams.push(subcategory);
    }

    if (minPrice) {
      paramCount++;
      whereConditions.push(`COALESCE(p.current_price, p.buy_now_price) >= $${paramCount}`);
      queryParams.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      paramCount++;
      whereConditions.push(`COALESCE(p.current_price, p.buy_now_price) <= $${paramCount}`);
      queryParams.push(parseFloat(maxPrice));
    }

    if (condition) {
      // Support multiple conditions separated by comma
      const conditions = condition.split(',').map(c => c.trim());
      paramCount++;
      whereConditions.push(`p.condition = ANY($${paramCount}::text[])`);
      queryParams.push(conditions);
    }

    if (listingType) {
      paramCount++;
      whereConditions.push(`p.listing_type = $${paramCount}`);
      queryParams.push(listingType);
    }

    if (sellerId) {
      paramCount++;
      whereConditions.push(`p.seller_id = $${paramCount}`);
      queryParams.push(sellerId);
    }

    if (search) {
      paramCount++;
      whereConditions.push(`p.search_vector @@ websearch_to_tsquery('english', $${paramCount})`);
      queryParams.push(search);
    }

    // New filter conditions
    if (freeShipping === 'true') {
      whereConditions.push(`p.free_shipping = true`);
    }

    if (location) {
      paramCount++;
      whereConditions.push(`(LOWER(p.shipping_from_city) LIKE LOWER($${paramCount}) OR LOWER(p.shipping_from_state) LIKE LOWER($${paramCount}))`);
      queryParams.push(`%${location}%`);
    }

    if (state) {
      paramCount++;
      whereConditions.push(`LOWER(p.shipping_from_state) = LOWER($${paramCount})`);
      queryParams.push(state);
    }

    if (country) {
      paramCount++;
      whereConditions.push(`LOWER(p.shipping_from_country) = LOWER($${paramCount})`);
      queryParams.push(country);
    }

    if (brand) {
      // Support multiple brands separated by comma
      const brands = brand.split(',').map(b => b.trim().toLowerCase());
      paramCount++;
      whereConditions.push(`LOWER(p.brand) = ANY($${paramCount}::text[])`);
      queryParams.push(brands);
    }

    if (color) {
      // Support multiple colors separated by comma
      const colors = color.split(',').map(c => c.trim().toLowerCase());
      paramCount++;
      whereConditions.push(`LOWER(p.color) = ANY($${paramCount}::text[])`);
      queryParams.push(colors);
    }

    if (acceptsOffers === 'true') {
      whereConditions.push(`p.accepts_offers = true`);
    }

    if (freeReturns === 'true') {
      whereConditions.push(`p.free_returns = true`);
    }

    if (topRatedSeller === 'true') {
      whereConditions.push(`u.seller_rating >= 4.8`);
    }

    if (minSellerRating) {
      paramCount++;
      whereConditions.push(`u.seller_rating >= $${paramCount}`);
      queryParams.push(parseFloat(minSellerRating));
    }

    if (endingWithin) {
      // endingWithin is in hours
      whereConditions.push(`p.listing_type IN ('auction', 'both')`);
      paramCount++;
      whereConditions.push(`p.auction_end <= NOW() + INTERVAL '1 hour' * $${paramCount}`);
      queryParams.push(parseInt(endingWithin));
    }

    if (localPickup === 'true') {
      whereConditions.push(`p.allows_local_pickup = true`);
    }

    if (featured === 'true') {
      whereConditions.push(`p.featured = true`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count query (uses only WHERE params — don't push additional params before this runs).
    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      ${whereClause}
    `;

    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Relevance sort needs a parameter slot for the search text — pushed AFTER count.
    let relevanceExpr = 'p.created_at';
    if (sortBy === 'relevance' && search) {
      paramCount++;
      queryParams.push(search);
      relevanceExpr = `ts_rank_cd(p.search_vector, websearch_to_tsquery('english', $${paramCount}))`;
    }

    const validSortColumns = {
      created_at: 'p.created_at',
      price: 'COALESCE(p.current_price, p.buy_now_price)',
      title: 'p.title',
      auction_end: 'p.auction_end',
      view_count: 'p.view_count',
      relevance: relevanceExpr,
    };

    const sortColumn = validSortColumns[sortBy] || 'p.created_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Main query
    paramCount++;
    const limitParam = paramCount;
    paramCount++;
    const offsetParam = paramCount;

    const query = `
      SELECT
        p.id, p.title, p.slug, p.description, p.condition, p.listing_type,
        p.starting_price, p.current_price, p.buy_now_price, p.reserve_price,
        p.auction_start, p.auction_end, p.bid_count, p.quantity, p.quantity_sold,
        p.shipping_cost, p.free_shipping, p.shipping_from_city, p.shipping_from_state,
        p.brand, p.view_count, p.watch_count, p.featured, p.created_at,
        c.name as category_name, c.slug as category_slug,
        sc.name as subcategory_name, sc.slug as subcategory_slug,
        u.id as seller_id, u.username as seller_username, u.seller_rating, u.avatar_url as seller_avatar,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as primary_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      LEFT JOIN users u ON p.seller_id = u.id
      ${whereClause}
      ORDER BY ${sortColumn} ${order}
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    queryParams.push(parseInt(limit), offset);

    const result = await pool.query(query, queryParams);

    res.json({
      products: result.rows.map(row => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        description: row.description,
        condition: row.condition,
        listingType: row.listing_type,
        startingPrice: parseFloat(row.starting_price) || null,
        currentPrice: parseFloat(row.current_price) || null,
        buyNowPrice: parseFloat(row.buy_now_price) || null,
        auctionStart: row.auction_start,
        auctionEnd: row.auction_end,
        bidCount: row.bid_count,
        quantity: row.quantity,
        quantitySold: row.quantity_sold,
        shippingCost: parseFloat(row.shipping_cost),
        freeShipping: row.free_shipping,
        shippingFrom: `${row.shipping_from_city}, ${row.shipping_from_state}`,
        brand: row.brand,
        viewCount: row.view_count,
        watchCount: row.watch_count,
        featured: row.featured,
        createdAt: row.created_at,
        category: { name: row.category_name, slug: row.category_slug },
        subcategory: row.subcategory_name ? { name: row.subcategory_name, slug: row.subcategory_slug } : null,
        seller: {
          id: row.seller_id,
          username: row.seller_username,
          rating: parseFloat(row.seller_rating),
          avatarUrl: row.seller_avatar,
        },
        primaryImage: row.primary_image,
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

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Increment view count
    await pool.query('UPDATE products SET view_count = view_count + 1 WHERE id = $1', [id]);

    const query = `
      SELECT
        p.*,
        c.name as category_name, c.slug as category_slug,
        sc.name as subcategory_name, sc.slug as subcategory_slug,
        u.id as seller_id, u.username as seller_username, u.seller_rating,
        u.total_sales, u.avatar_url as seller_avatar, u.member_since as seller_member_since
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      LEFT JOIN users u ON p.seller_id = u.id
      WHERE p.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = result.rows[0];

    // Get images
    const imagesResult = await pool.query(
      'SELECT id, image_url, thumbnail_url, alt_text, is_primary FROM product_images WHERE product_id = $1 ORDER BY sort_order',
      [id]
    );

    // Get bid history (latest 10)
    const bidsResult = await pool.query(
      `SELECT b.id, b.bid_amount, b.created_at, u.username
       FROM bids b
       JOIN users u ON b.bidder_id = u.id
       WHERE b.product_id = $1
       ORDER BY b.bid_amount DESC
       LIMIT 10`,
      [id]
    );

    // Check if user is watching
    let isWatching = false;
    if (req.user) {
      const watchResult = await pool.query(
        'SELECT id FROM watchlist WHERE user_id = $1 AND product_id = $2',
        [req.user.id, id]
      );
      isWatching = watchResult.rows.length > 0;
    }

    // Get specifications
    const specsResult = await pool.query(
      `SELECT spec_group, spec_name, spec_value, display_order
       FROM product_specifications
       WHERE product_id = $1
       ORDER BY display_order`,
      [id]
    );

    // Group specifications by spec_group
    const specifications = {};
    specsResult.rows.forEach(spec => {
      if (!specifications[spec.spec_group]) {
        specifications[spec.spec_group] = [];
      }
      specifications[spec.spec_group].push({
        name: spec.spec_name,
        value: spec.spec_value,
      });
    });

    res.json({
      id: product.id,
      title: product.title,
      slug: product.slug,
      description: product.description,
      condition: product.condition,
      conditionDescription: product.condition_description,
      listingType: product.listing_type,
      startingPrice: parseFloat(product.starting_price) || null,
      currentPrice: parseFloat(product.current_price) || null,
      buyNowPrice: parseFloat(product.buy_now_price) || null,
      reservePrice: parseFloat(product.reserve_price) || null,
      auctionStart: product.auction_start,
      auctionEnd: product.auction_end,
      bidCount: product.bid_count,
      quantity: product.quantity,
      quantitySold: product.quantity_sold,
      shippingCost: parseFloat(product.shipping_cost),
      freeShipping: product.free_shipping,
      shippingFrom: {
        city: product.shipping_from_city,
        state: product.shipping_from_state,
        zip: product.shipping_from_zip,
        country: product.shipping_from_country,
      },
      estimatedDeliveryDays: product.estimated_delivery_days,
      handlingTime: product.handling_time,
      shippingService: product.shipping_service,
      packageWeight: product.package_weight ? parseFloat(product.package_weight) : null,
      packageLength: product.package_length ? parseFloat(product.package_length) : null,
      packageWidth: product.package_width ? parseFloat(product.package_width) : null,
      packageHeight: product.package_height ? parseFloat(product.package_height) : null,
      allowsLocalPickup: product.allows_local_pickup,
      brand: product.brand,
      model: product.model,
      sku: product.sku,
      upc: product.upc,
      weight: product.weight ? parseFloat(product.weight) + ' lbs' : null,
      dimensions: product.dimensions,
      color: product.color,
      size: product.size,
      material: product.material,
      viewCount: product.view_count,
      watchCount: product.watch_count,
      shareCount: product.share_count,
      featured: product.featured,
      acceptsOffers: product.accepts_offers,
      minimumOfferAmount: product.auto_decline_price ? parseFloat(product.auto_decline_price) : null,
      minimumOfferPercentage: product.minimum_offer_percentage,
      autoAcceptPrice: product.auto_accept_price ? parseFloat(product.auto_accept_price) : null,
      autoDeclinePrice: product.auto_decline_price ? parseFloat(product.auto_decline_price) : null,
      acceptsReturns: product.return_policy !== 'no_returns',
      returnPeriod: product.return_days,
      returnPolicy: product.return_policy,
      returnShippingPaidBy: product.return_policy === 'returns_accepted' ? 'seller' : 'buyer',
      freeReturns: product.return_policy === 'returns_accepted',
      yourCost: product.your_cost ? parseFloat(product.your_cost) : null,
      countryOfOrigin: product.country_of_origin,
      status: product.status,
      createdAt: product.created_at,
      category: { id: product.category_id, name: product.category_name, slug: product.category_slug },
      subcategory: product.subcategory_name
        ? { id: product.subcategory_id, name: product.subcategory_name, slug: product.subcategory_slug }
        : null,
      seller: {
        id: product.seller_id,
        username: product.seller_username,
        rating: parseFloat(product.seller_rating),
        totalSales: product.total_sales,
        avatarUrl: product.seller_avatar,
        memberSince: product.seller_member_since,
      },
      images: imagesResult.rows.map(img => ({
        id: img.id,
        url: img.image_url,
        thumbnail: img.thumbnail_url,
        altText: img.alt_text,
        isPrimary: img.is_primary,
      })),
      recentBids: bidsResult.rows.map(bid => ({
        id: bid.id,
        amount: parseFloat(bid.bid_amount),
        bidder: bid.username,
        time: bid.created_at,
      })),
      isWatching,
      specifications,
    });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const {
      title, description, categoryId, subcategoryId, condition, conditionDescription,
      listingType, startingPrice, buyNowPrice, reservePrice, auctionDuration,
      quantity, shippingCost, freeShipping, shippingFromCity, shippingFromState, shippingFromZip,
      estimatedDeliveryDays, brand, model, sku, weight, dimensions, color, size, material, upc,
      // New fields
      handlingTime, shippingService, packageWeight, packageLength, packageWidth, packageHeight,
      allowsLocalPickup, acceptsOffers, minimumOfferAmount,
      acceptsReturns, returnPeriod, returnShippingPaidBy,
      images,
      // Latest features
      yourCost, countryOfOrigin,
    } = req.body;

    // Content moderation — block outright, or flag pending review
    const mod = await screenListing({ title, description, brand });
    if (mod.decision === 'block') {
      return res.status(400).json({
        error: 'Listing violates our policies',
        categories: mod.categories,
        matched: mod.matched,
      });
    }

    const slug = createSlug(title);
    let auctionStart = null;
    let auctionEnd = null;

    if (listingType === 'auction' || listingType === 'both') {
      auctionStart = new Date();
      auctionEnd = new Date(auctionStart.getTime() + (auctionDuration || 7) * 24 * 60 * 60 * 1000);
    }

    const currentPrice = listingType === 'auction' || listingType === 'both' ? startingPrice : null;
    const freeReturns = returnShippingPaidBy === 'seller';

    const result = await pool.query(
      `INSERT INTO products (
        seller_id, category_id, subcategory_id, title, slug, description,
        condition, condition_description, listing_type, starting_price, current_price,
        buy_now_price, reserve_price, auction_start, auction_end, quantity,
        shipping_cost, free_shipping, shipping_from_city, shipping_from_state, shipping_from_zip,
        estimated_delivery_days, brand, model, sku, weight, dimensions, color, size, material, upc,
        handling_time, shipping_service, package_weight, package_length, package_width, package_height,
        allows_local_pickup, accepts_offers, minimum_offer_amount,
        accepts_returns, return_period, return_shipping_paid_by, free_returns,
        your_cost, country_of_origin
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46)
      RETURNING *`,
      [
        req.user.id, categoryId, subcategoryId || null, title, slug, description,
        condition, conditionDescription || null, listingType, startingPrice || null, currentPrice,
        buyNowPrice || null, reservePrice || null, auctionStart, auctionEnd, quantity || 1,
        shippingCost || 0, freeShipping || false, shippingFromCity, shippingFromState, shippingFromZip || null,
        estimatedDeliveryDays || null, brand || null, model || null, sku || null,
        weight || null, dimensions || null, color || null, size || null, material || null, upc || null,
        handlingTime || 1, shippingService || 'usps_priority', packageWeight || null,
        packageLength || null, packageWidth || null, packageHeight || null,
        allowsLocalPickup || false, acceptsOffers || false, minimumOfferAmount || null,
        acceptsReturns !== false, returnPeriod || 30, returnShippingPaidBy || 'buyer', freeReturns,
        yourCost || null, countryOfOrigin || null,
      ]
    );

    const product = result.rows[0];

    // Add images if provided
    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        await pool.query(
          `INSERT INTO product_images (product_id, image_url, thumbnail_url, alt_text, sort_order, is_primary)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [product.id, images[i].url, images[i].thumbnail || images[i].url, images[i].altText || title, i, i === 0]
        );
      }
    }

    // Record moderation outcome (flag keeps listing active but visible to mods)
    if (mod.decision !== 'allow') {
      await recordReport(product.id, mod);
    }

    // Update user to seller if not already
    await pool.query('UPDATE users SET is_seller = true WHERE id = $1', [req.user.id]);

    res.status(201).json({
      message: 'Product created successfully',
      product: {
        id: product.id,
        title: product.title,
        slug: product.slug,
        status: product.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check ownership
    const checkResult = await pool.query('SELECT seller_id FROM products WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (checkResult.rows[0].seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this product' });
    }

    const allowedFields = ['title', 'description', 'condition', 'condition_description',
      'buy_now_price', 'quantity', 'shipping_cost', 'free_shipping', 'brand', 'model'];

    const setClause = [];
    const values = [];
    let paramCount = 0;

    for (const [key, value] of Object.entries(updates)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (allowedFields.includes(snakeKey)) {
        paramCount++;
        setClause.push(`${snakeKey} = $${paramCount}`);
        values.push(value);
      }
    }

    if (setClause.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    paramCount++;
    setClause.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE products SET ${setClause.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);

    // Fire-and-forget: notify watchers if price dropped. Triggered on any update,
    // the helper itself compares new vs each watcher's stored price.
    if (updates.buyNowPrice !== undefined || updates.buy_now_price !== undefined) {
      const { notifyPriceDrop } = require('../services/priceDrop');
      notifyPriceDrop(id);
    }

    res.json({
      message: 'Product updated successfully',
      product: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check ownership
    const checkResult = await pool.query('SELECT seller_id, status FROM products WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (checkResult.rows[0].seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this product' });
    }

    // Soft delete by setting status to cancelled
    await pool.query("UPDATE products SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [id]);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Get available filter options with counts based on current search/filters
const getFilters = async (req, res, next) => {
  try {
    const {
      search,
      category,
      subcategory,
      minPrice,
      maxPrice,
      condition,
      listingType,
      freeShipping,
      brand,
      color,
      acceptsOffers,
      freeReturns,
      localPickup,
      sellerId,
    } = req.query;

    // Build base WHERE clause for counting (excludes the filter we're counting)
    const buildWhereClause = (excludeFilter = null) => {
      let whereConditions = ["p.status = 'active'"];
      let queryParams = [];
      let paramCount = 0;

      if (search) {
        paramCount++;
        whereConditions.push(`p.search_vector @@ websearch_to_tsquery('english', $${paramCount})`);
        queryParams.push(search);
      }

      if (category && excludeFilter !== 'category') {
        paramCount++;
        whereConditions.push(`c.slug = $${paramCount}`);
        queryParams.push(category);
      }

      if (subcategory && excludeFilter !== 'subcategory') {
        paramCount++;
        whereConditions.push(`sc.slug = $${paramCount}`);
        queryParams.push(subcategory);
      }

      if (minPrice && excludeFilter !== 'price') {
        paramCount++;
        whereConditions.push(`COALESCE(p.current_price, p.buy_now_price) >= $${paramCount}`);
        queryParams.push(parseFloat(minPrice));
      }

      if (maxPrice && excludeFilter !== 'price') {
        paramCount++;
        whereConditions.push(`COALESCE(p.current_price, p.buy_now_price) <= $${paramCount}`);
        queryParams.push(parseFloat(maxPrice));
      }

      if (condition && excludeFilter !== 'condition') {
        const conditions = condition.split(',');
        paramCount++;
        whereConditions.push(`p.condition = ANY($${paramCount}::text[])`);
        queryParams.push(conditions);
      }

      if (listingType && excludeFilter !== 'listingType') {
        paramCount++;
        whereConditions.push(`p.listing_type = $${paramCount}`);
        queryParams.push(listingType);
      }

      if (brand && excludeFilter !== 'brand') {
        const brands = brand.split(',');
        paramCount++;
        whereConditions.push(`LOWER(p.brand) = ANY($${paramCount}::text[])`);
        queryParams.push(brands.map(b => b.toLowerCase()));
      }

      if (color && excludeFilter !== 'color') {
        const colors = color.split(',');
        paramCount++;
        whereConditions.push(`LOWER(p.color) = ANY($${paramCount}::text[])`);
        queryParams.push(colors.map(c => c.toLowerCase()));
      }

      if (freeShipping === 'true' && excludeFilter !== 'freeShipping') {
        whereConditions.push(`p.free_shipping = true`);
      }

      if (acceptsOffers === 'true' && excludeFilter !== 'acceptsOffers') {
        whereConditions.push(`p.accepts_offers = true`);
      }

      if (freeReturns === 'true' && excludeFilter !== 'freeReturns') {
        whereConditions.push(`p.free_returns = true`);
      }

      if (localPickup === 'true' && excludeFilter !== 'localPickup') {
        whereConditions.push(`p.allows_local_pickup = true`);
      }

      if (sellerId) {
        paramCount++;
        whereConditions.push(`p.seller_id = $${paramCount}`);
        queryParams.push(sellerId);
      }

      return { whereClause: whereConditions.join(' AND '), queryParams, paramCount };
    };

    // Get brands with counts
    const brandBase = buildWhereClause('brand');
    const brandsQuery = `
      SELECT
        COALESCE(p.brand, 'Unbranded') as value,
        COUNT(*) as count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      WHERE ${brandBase.whereClause}
      GROUP BY COALESCE(p.brand, 'Unbranded')
      HAVING COUNT(*) > 0
      ORDER BY count DESC
      LIMIT 50
    `;
    const brandsResult = await pool.query(brandsQuery, brandBase.queryParams);

    // Get colors with counts
    const colorBase = buildWhereClause('color');
    const colorsQuery = `
      SELECT
        COALESCE(p.color, 'Not Specified') as value,
        COUNT(*) as count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      WHERE ${colorBase.whereClause} AND p.color IS NOT NULL
      GROUP BY p.color
      HAVING COUNT(*) > 0
      ORDER BY count DESC
      LIMIT 30
    `;
    const colorsResult = await pool.query(colorsQuery, colorBase.queryParams);

    // Get conditions with counts
    const conditionBase = buildWhereClause('condition');
    const conditionsQuery = `
      SELECT
        p.condition as value,
        COUNT(*) as count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      WHERE ${conditionBase.whereClause}
      GROUP BY p.condition
      ORDER BY
        CASE p.condition
          WHEN 'new' THEN 1
          WHEN 'like_new' THEN 2
          WHEN 'very_good' THEN 3
          WHEN 'good' THEN 4
          WHEN 'acceptable' THEN 5
          ELSE 6
        END
    `;
    const conditionsResult = await pool.query(conditionsQuery, conditionBase.queryParams);

    // Get categories with counts
    const categoryBase = buildWhereClause('category');
    const categoriesQuery = `
      SELECT
        c.id,
        c.name as value,
        c.slug,
        COUNT(*) as count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      WHERE ${categoryBase.whereClause}
      GROUP BY c.id, c.name, c.slug
      HAVING COUNT(*) > 0
      ORDER BY count DESC
    `;
    const categoriesResult = await pool.query(categoriesQuery, categoryBase.queryParams);

    // Get subcategories with counts (only if category is selected)
    let subcategoriesResult = { rows: [] };
    if (category) {
      const subcategoryBase = buildWhereClause('subcategory');
      const subcategoriesQuery = `
        SELECT
          sc.id,
          sc.name as value,
          sc.slug,
          COUNT(*) as count
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
        WHERE ${subcategoryBase.whereClause} AND sc.id IS NOT NULL
        GROUP BY sc.id, sc.name, sc.slug
        HAVING COUNT(*) > 0
        ORDER BY count DESC
      `;
      subcategoriesResult = await pool.query(subcategoriesQuery, subcategoryBase.queryParams);
    }

    // Get listing types with counts
    const listingTypeBase = buildWhereClause('listingType');
    const listingTypesQuery = `
      SELECT
        p.listing_type as value,
        COUNT(*) as count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      WHERE ${listingTypeBase.whereClause}
      GROUP BY p.listing_type
      ORDER BY count DESC
    `;
    const listingTypesResult = await pool.query(listingTypesQuery, listingTypeBase.queryParams);

    // Get price range
    const priceBase = buildWhereClause('price');
    const priceRangeQuery = `
      SELECT
        MIN(COALESCE(p.current_price, p.buy_now_price)) as min,
        MAX(COALESCE(p.current_price, p.buy_now_price)) as max
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      WHERE ${priceBase.whereClause}
    `;
    const priceRangeResult = await pool.query(priceRangeQuery, priceBase.queryParams);

    // Get shipping options counts
    const shippingBase = buildWhereClause('freeShipping');
    const shippingQuery = `
      SELECT
        SUM(CASE WHEN p.free_shipping = true THEN 1 ELSE 0 END) as free_shipping_count,
        SUM(CASE WHEN p.allows_local_pickup = true THEN 1 ELSE 0 END) as local_pickup_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      WHERE ${shippingBase.whereClause}
    `;
    const shippingResult = await pool.query(shippingQuery, shippingBase.queryParams);

    // Get seller options counts
    const sellerBase = buildWhereClause();
    const sellerOptionsQuery = `
      SELECT
        SUM(CASE WHEN p.accepts_offers = true THEN 1 ELSE 0 END) as accepts_offers_count,
        SUM(CASE WHEN p.free_returns = true THEN 1 ELSE 0 END) as free_returns_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      WHERE ${sellerBase.whereClause}
    `;
    const sellerOptionsResult = await pool.query(sellerOptionsQuery, sellerBase.queryParams);

    // Get sizes with counts (for fashion/clothing items)
    const sizeBase = buildWhereClause('size');
    const sizesQuery = `
      SELECT
        p.size as value,
        COUNT(*) as count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      WHERE ${sizeBase.whereClause} AND p.size IS NOT NULL
      GROUP BY p.size
      HAVING COUNT(*) > 0
      ORDER BY count DESC
      LIMIT 30
    `;
    const sizesResult = await pool.query(sizesQuery, sizeBase.queryParams);

    // Format condition labels
    const conditionLabels = {
      'new': 'Brand New',
      'like_new': 'Like New',
      'very_good': 'Very Good',
      'good': 'Good',
      'acceptable': 'Acceptable',
    };

    // Format listing type labels
    const listingTypeLabels = {
      'auction': 'Auction',
      'buy_now': 'Buy It Now',
      'both': 'Auction + Buy It Now',
    };

    res.json({
      brands: brandsResult.rows.map(r => ({
        value: r.value,
        count: parseInt(r.count),
      })),
      colors: colorsResult.rows.map(r => ({
        value: r.value,
        count: parseInt(r.count),
      })),
      conditions: conditionsResult.rows.map(r => ({
        value: r.value,
        label: conditionLabels[r.value] || r.value,
        count: parseInt(r.count),
      })),
      categories: categoriesResult.rows.map(r => ({
        id: r.id,
        value: r.value,
        slug: r.slug,
        count: parseInt(r.count),
      })),
      subcategories: subcategoriesResult.rows.map(r => ({
        id: r.id,
        value: r.value,
        slug: r.slug,
        count: parseInt(r.count),
      })),
      listingTypes: listingTypesResult.rows.map(r => ({
        value: r.value,
        label: listingTypeLabels[r.value] || r.value,
        count: parseInt(r.count),
      })),
      priceRange: {
        min: parseFloat(priceRangeResult.rows[0]?.min) || 0,
        max: parseFloat(priceRangeResult.rows[0]?.max) || 10000,
      },
      sizes: sizesResult.rows.map(r => ({
        value: r.value,
        count: parseInt(r.count),
      })),
      shippingOptions: {
        freeShipping: parseInt(shippingResult.rows[0]?.free_shipping_count) || 0,
        localPickup: parseInt(shippingResult.rows[0]?.local_pickup_count) || 0,
      },
      sellerOptions: {
        acceptsOffers: parseInt(sellerOptionsResult.rows[0]?.accepts_offers_count) || 0,
        freeReturns: parseInt(sellerOptionsResult.rows[0]?.free_returns_count) || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getFilters,
};
