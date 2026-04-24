const { pool } = require('../config/database');

/**
 * Full-text search with ranking.
 * Query params:
 *   q             - search text (optional; if absent, returns most recent active)
 *   category      - category slug
 *   subcategory   - subcategory slug
 *   minPrice/maxPrice
 *   condition     - comma-separated
 *   listingType   - 'auction' | 'buy_now' | 'both'
 *   brand         - comma-separated
 *   freeShipping  - 'true'
 *   sortBy        - 'relevance' (default if q) | 'newest' | 'price_asc' | 'price_desc' | 'ending_soon' | 'popular'
 *   page, limit
 *
 * Uses websearch_to_tsquery for forgiving query syntax (supports "quoted phrases", OR, -negation).
 * Falls back to pg_trgm similarity on title when the tsquery yields nothing (typo tolerance).
 */
const search = async (req, res, next) => {
  try {
    const {
      q = '',
      category,
      subcategory,
      minPrice,
      maxPrice,
      condition,
      listingType,
      brand,
      freeShipping,
      sortBy,
      page = 1,
      limit = 24,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 24));
    const offset = (pageNum - 1) * limitNum;
    const query = q.trim();

    const where = ["p.status = 'active'"];
    const params = [];
    let pc = 0;

    // Primary search clause
    let rankSelect = '0::float AS rank';
    if (query) {
      pc++;
      params.push(query);
      where.push(`(
        p.search_vector @@ websearch_to_tsquery('english', $${pc})
        OR similarity(p.title, $${pc}) > 0.25
        OR (p.brand IS NOT NULL AND similarity(p.brand, $${pc}) > 0.3)
      )`);
      rankSelect = `(
        ts_rank_cd(p.search_vector, websearch_to_tsquery('english', $${pc})) * 2.0
        + similarity(p.title, $${pc}) * 0.5
        + (CASE WHEN p.featured THEN 0.3 ELSE 0 END)
      )::float AS rank`;
    }

    if (category) {
      pc++;
      params.push(category);
      where.push(`c.slug = $${pc}`);
    }
    if (subcategory) {
      pc++;
      params.push(subcategory);
      where.push(`sc.slug = $${pc}`);
    }
    if (minPrice) {
      pc++;
      params.push(parseFloat(minPrice));
      where.push(`COALESCE(p.current_price, p.buy_now_price) >= $${pc}`);
    }
    if (maxPrice) {
      pc++;
      params.push(parseFloat(maxPrice));
      where.push(`COALESCE(p.current_price, p.buy_now_price) <= $${pc}`);
    }
    if (condition) {
      pc++;
      params.push(condition.split(',').map(s => s.trim()));
      where.push(`p.condition = ANY($${pc}::text[])`);
    }
    if (listingType) {
      pc++;
      params.push(listingType);
      where.push(`p.listing_type = $${pc}`);
    }
    if (brand) {
      pc++;
      params.push(brand.split(',').map(s => s.trim().toLowerCase()));
      where.push(`LOWER(p.brand) = ANY($${pc}::text[])`);
    }
    if (freeShipping === 'true') {
      where.push(`p.free_shipping = true`);
    }

    const whereSQL = where.join(' AND ');

    // Sorting
    let orderBy;
    const effectiveSort = sortBy || (query ? 'relevance' : 'newest');
    switch (effectiveSort) {
      case 'price_asc':
        orderBy = 'COALESCE(p.current_price, p.buy_now_price) ASC NULLS LAST';
        break;
      case 'price_desc':
        orderBy = 'COALESCE(p.current_price, p.buy_now_price) DESC NULLS LAST';
        break;
      case 'ending_soon':
        orderBy = `CASE WHEN p.listing_type IN ('auction','both') AND p.auction_end > NOW() THEN p.auction_end END ASC NULLS LAST`;
        break;
      case 'popular':
        orderBy = 'p.view_count DESC, p.created_at DESC';
        break;
      case 'newest':
        orderBy = 'p.created_at DESC';
        break;
      case 'relevance':
      default:
        orderBy = query ? 'rank DESC, p.created_at DESC' : 'p.created_at DESC';
    }

    // Main query
    pc++;
    const limitIdx = pc;
    params.push(limitNum);
    pc++;
    const offsetIdx = pc;
    params.push(offset);

    const sql = `
      SELECT
        p.id, p.title, p.slug, p.description, p.condition, p.listing_type,
        p.starting_price, p.current_price, p.buy_now_price,
        p.auction_start, p.auction_end, p.bid_count,
        p.shipping_cost, p.free_shipping, p.brand, p.view_count, p.featured, p.created_at,
        c.name AS category_name, c.slug AS category_slug,
        sc.name AS subcategory_name, sc.slug AS subcategory_slug,
        u.id AS seller_id, u.username AS seller_username, u.seller_rating, u.avatar_url AS seller_avatar,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) AS primary_image,
        ${rankSelect}
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      LEFT JOIN users u ON p.seller_id = u.id
      WHERE ${whereSQL}
      ORDER BY ${orderBy}
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const result = await pool.query(sql, params);

    // Count + facets (use same params minus limit/offset)
    const facetParams = params.slice(0, pc - 2);
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
       WHERE ${whereSQL}`,
      facetParams
    );
    const total = countResult.rows[0].total;

    // Category facet (top 10)
    const categoryFacet = await pool.query(
      `SELECT c.slug, c.name, COUNT(*)::int AS count
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
       WHERE ${whereSQL} AND c.slug IS NOT NULL
       GROUP BY c.slug, c.name
       ORDER BY count DESC
       LIMIT 10`,
      facetParams
    );

    // Brand facet (top 15)
    const brandFacet = await pool.query(
      `SELECT p.brand AS value, COUNT(*)::int AS count
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
       WHERE ${whereSQL} AND p.brand IS NOT NULL AND p.brand <> ''
       GROUP BY p.brand
       ORDER BY count DESC
       LIMIT 15`,
      facetParams
    );

    // Price buckets
    const priceBuckets = await pool.query(
      `SELECT
         SUM(CASE WHEN COALESCE(p.current_price, p.buy_now_price) < 25 THEN 1 ELSE 0 END)::int AS under_25,
         SUM(CASE WHEN COALESCE(p.current_price, p.buy_now_price) BETWEEN 25 AND 99.99 THEN 1 ELSE 0 END)::int AS "25_100",
         SUM(CASE WHEN COALESCE(p.current_price, p.buy_now_price) BETWEEN 100 AND 499.99 THEN 1 ELSE 0 END)::int AS "100_500",
         SUM(CASE WHEN COALESCE(p.current_price, p.buy_now_price) >= 500 THEN 1 ELSE 0 END)::int AS over_500
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
       WHERE ${whereSQL}`,
      facetParams
    );

    // Detect "did you mean" suggestion when original query has 0 strong matches
    let didYouMean = null;
    if (query && total === 0) {
      const suggest = await pool.query(
        `SELECT title
         FROM products
         WHERE status = 'active' AND similarity(title, $1) > 0.2
         ORDER BY similarity(title, $1) DESC
         LIMIT 1`,
        [query]
      );
      didYouMean = suggest.rows[0]?.title || null;
    }

    res.json({
      query,
      sortBy: effectiveSort,
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
        shippingCost: parseFloat(row.shipping_cost),
        freeShipping: row.free_shipping,
        brand: row.brand,
        viewCount: row.view_count,
        featured: row.featured,
        createdAt: row.created_at,
        rank: row.rank,
        category: { name: row.category_name, slug: row.category_slug },
        subcategory: row.subcategory_name
          ? { name: row.subcategory_name, slug: row.subcategory_slug }
          : null,
        seller: {
          id: row.seller_id,
          username: row.seller_username,
          rating: parseFloat(row.seller_rating),
          avatarUrl: row.seller_avatar,
        },
        primaryImage: row.primary_image,
      })),
      facets: {
        categories: categoryFacet.rows,
        brands: brandFacet.rows,
        priceBuckets: priceBuckets.rows[0] || {},
      },
      didYouMean,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search autocomplete — fast prefix suggestions powered by pg_trgm.
 * GET /api/search/suggest?q=ipho
 */
const suggest = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) return res.json({ suggestions: [] });

    const result = await pool.query(
      `SELECT title, similarity(title, $1) AS sim
       FROM products
       WHERE status = 'active' AND title ILIKE $2
       ORDER BY sim DESC, view_count DESC
       LIMIT 8`,
      [q, `%${q}%`]
    );

    res.json({
      suggestions: result.rows.map(r => ({ title: r.title })),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { search, suggest };
