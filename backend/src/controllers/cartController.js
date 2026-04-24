const { pool } = require('../config/database');
const reservations = require('../services/cartReservations');

const getCart = async (req, res, next) => {
  try {
    // Get or create cart
    let cartResult = await pool.query(
      'SELECT id FROM shopping_carts WHERE user_id = $1',
      [req.user.id]
    );

    if (cartResult.rows.length === 0) {
      cartResult = await pool.query(
        'INSERT INTO shopping_carts (user_id) VALUES ($1) RETURNING id',
        [req.user.id]
      );
    }

    const cartId = cartResult.rows[0].id;

    // Get cart items + this user's reservation expiry per product.
    const itemsResult = await pool.query(
      `SELECT ci.id, ci.quantity, ci.added_at,
              p.id as product_id, p.title, p.slug, p.current_price, p.buy_now_price,
              p.listing_type, p.quantity as available_quantity, p.quantity_sold,
              p.shipping_cost, p.free_shipping, p.status,
              u.id as seller_id, u.username as seller_username,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image,
              (SELECT expires_at FROM cart_reservations
                 WHERE user_id = $2 AND product_id = p.id) AS reservation_expires_at
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       JOIN users u ON p.seller_id = u.id
       WHERE ci.cart_id = $1
       ORDER BY ci.added_at DESC`,
      [cartId, req.user.id]
    );

    let subtotal = 0;
    let shippingTotal = 0;
    const items = itemsResult.rows.map(item => {
      const price = parseFloat(item.buy_now_price || item.current_price);
      const itemTotal = price * item.quantity;
      subtotal += itemTotal;
      if (!item.free_shipping) {
        shippingTotal += parseFloat(item.shipping_cost) || 0;
      }

      return {
        id: item.id,
        quantity: item.quantity,
        addedAt: item.added_at,
        reservationExpiresAt: item.reservation_expires_at,
        product: {
          id: item.product_id,
          title: item.title,
          slug: item.slug,
          price,
          listingType: item.listing_type,
          availableQuantity: item.available_quantity - item.quantity_sold,
          shippingCost: parseFloat(item.shipping_cost),
          freeShipping: item.free_shipping,
          status: item.status,
          image: item.image,
        },
        seller: {
          id: item.seller_id,
          username: item.seller_username,
        },
        itemTotal,
      };
    });

    // Apply bundle discounts server-side: pick the best qualifying rule per seller.
    const bySeller = {};
    for (const it of items) {
      const sid = it.seller.id;
      if (!bySeller[sid]) bySeller[sid] = { count: 0, subtotal: 0 };
      bySeller[sid].count += it.quantity;
      bySeller[sid].subtotal += it.itemTotal;
    }
    const sellerIds = Object.keys(bySeller);
    const bundles = [];
    let bundleSavings = 0;
    if (sellerIds.length > 0) {
      const rules = await pool.query(
        `SELECT seller_id, id, name, min_items, discount_percent
           FROM bundle_discounts
          WHERE is_active = true AND seller_id = ANY($1::uuid[])`,
        [sellerIds]
      );
      const best = {};
      for (const r of rules.rows) {
        const c = bySeller[r.seller_id];
        if (!c || c.count < r.min_items) continue;
        if (!best[r.seller_id] || Number(r.discount_percent) > Number(best[r.seller_id].discount_percent)) {
          best[r.seller_id] = r;
        }
      }
      for (const [sid, rule] of Object.entries(best)) {
        const savings = +(bySeller[sid].subtotal * (Number(rule.discount_percent) / 100)).toFixed(2);
        bundleSavings += savings;
        bundles.push({
          sellerId: sid,
          bundleName: rule.name,
          discountPercent: Number(rule.discount_percent),
          savings,
        });
      }
    }

    const discountedSubtotal = subtotal - bundleSavings;
    const tax = discountedSubtotal * 0.08;
    const total = discountedSubtotal + shippingTotal + tax;

    res.json({
      cartId,
      items,
      bundles,
      summary: {
        subtotal: parseFloat(subtotal.toFixed(2)),
        bundleSavings: parseFloat(bundleSavings.toFixed(2)),
        shipping: parseFloat(shippingTotal.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        itemCount: items.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    // Get product
    const productResult = await pool.query(
      `SELECT id, seller_id, listing_type, quantity, quantity_sold, status
       FROM products WHERE id = $1`,
      [productId]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = productResult.rows[0];

    if (product.status !== 'active') {
      return res.status(400).json({ error: 'This product is no longer available' });
    }

    if (product.listing_type === 'auction') {
      return res.status(400).json({ error: 'Auction items cannot be added to cart. Please place a bid.' });
    }

    if (product.seller_id === req.user.id) {
      return res.status(400).json({ error: 'You cannot add your own product to cart' });
    }

    // Available quantity is net of other users' cart reservations — so the last
    // unit can't be double-claimed by two buyers at once.
    const availableQty = await reservations.getAvailable(productId, req.user.id);
    if (quantity > availableQty) {
      return res.status(400).json({ error: `Only ${availableQty} available right now` });
    }

    // Get or create cart
    let cartResult = await pool.query(
      'SELECT id FROM shopping_carts WHERE user_id = $1',
      [req.user.id]
    );

    if (cartResult.rows.length === 0) {
      cartResult = await pool.query(
        'INSERT INTO shopping_carts (user_id) VALUES ($1) RETURNING id',
        [req.user.id]
      );
    }

    const cartId = cartResult.rows[0].id;

    // Check if item already in cart
    const existingItem = await pool.query(
      'SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2',
      [cartId, productId]
    );

    let finalQty = quantity;
    if (existingItem.rows.length > 0) {
      finalQty = existingItem.rows[0].quantity + quantity;
      if (finalQty > availableQty) {
        return res.status(400).json({ error: `Cannot add more. Only ${availableQty} available` });
      }

      await pool.query(
        'UPDATE cart_items SET quantity = $1 WHERE id = $2',
        [finalQty, existingItem.rows[0].id]
      );
    } else {
      await pool.query(
        'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3)',
        [cartId, productId, quantity]
      );
    }

    // Place/refresh the reservation so this buyer holds the stock for 10 minutes.
    const reservation = await reservations.reserve(req.user.id, productId, finalQty);
    res.json({
      message: 'Item added to cart',
      reservation: reservation.ok ? { expiresAt: reservation.expiresAt } : null,
    });
  } catch (error) {
    next(error);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    // Verify ownership and get product info
    const itemResult = await pool.query(
      `SELECT ci.id, ci.cart_id, ci.product_id, sc.user_id,
              p.quantity as product_quantity, p.quantity_sold
       FROM cart_items ci
       JOIN shopping_carts sc ON ci.cart_id = sc.id
       JOIN products p ON ci.product_id = p.id
       WHERE ci.id = $1`,
      [itemId]
    );

    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    if (itemResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const availableQty = itemResult.rows[0].product_quantity - itemResult.rows[0].quantity_sold;
    if (quantity > availableQty) {
      return res.status(400).json({ error: `Only ${availableQty} available` });
    }

    if (quantity <= 0) {
      await pool.query('DELETE FROM cart_items WHERE id = $1', [itemId]);
      await reservations.release(req.user.id, itemResult.rows[0].product_id);
      return res.json({ message: 'Item removed from cart' });
    }

    await pool.query('UPDATE cart_items SET quantity = $1 WHERE id = $2', [quantity, itemId]);
    await reservations.reserve(req.user.id, itemResult.rows[0].product_id, quantity);

    res.json({ message: 'Cart updated' });
  } catch (error) {
    next(error);
  }
};

const removeFromCart = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    // Verify ownership (also fetch product_id to release its reservation).
    const itemResult = await pool.query(
      `SELECT ci.id, ci.product_id, sc.user_id
       FROM cart_items ci
       JOIN shopping_carts sc ON ci.cart_id = sc.id
       WHERE ci.id = $1`,
      [itemId]
    );

    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    if (itemResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await pool.query('DELETE FROM cart_items WHERE id = $1', [itemId]);
    await reservations.release(req.user.id, itemResult.rows[0].product_id);

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    await pool.query(
      `DELETE FROM cart_items
       WHERE cart_id = (SELECT id FROM shopping_carts WHERE user_id = $1)`,
      [req.user.id]
    );
    await reservations.releaseAll(req.user.id);

    res.json({ message: 'Cart cleared' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
