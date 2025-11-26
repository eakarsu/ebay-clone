const { pool } = require('../config/database');

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

    // Get cart items
    const itemsResult = await pool.query(
      `SELECT ci.id, ci.quantity, ci.added_at,
              p.id as product_id, p.title, p.slug, p.current_price, p.buy_now_price,
              p.listing_type, p.quantity as available_quantity, p.quantity_sold,
              p.shipping_cost, p.free_shipping, p.status,
              u.id as seller_id, u.username as seller_username,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       JOIN users u ON p.seller_id = u.id
       WHERE ci.cart_id = $1
       ORDER BY ci.added_at DESC`,
      [cartId]
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

    const tax = subtotal * 0.08;
    const total = subtotal + shippingTotal + tax;

    res.json({
      cartId,
      items,
      summary: {
        subtotal: parseFloat(subtotal.toFixed(2)),
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

    const availableQty = product.quantity - product.quantity_sold;
    if (quantity > availableQty) {
      return res.status(400).json({ error: `Only ${availableQty} available` });
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

    if (existingItem.rows.length > 0) {
      const newQty = existingItem.rows[0].quantity + quantity;
      if (newQty > availableQty) {
        return res.status(400).json({ error: `Cannot add more. Only ${availableQty} available` });
      }

      await pool.query(
        'UPDATE cart_items SET quantity = $1 WHERE id = $2',
        [newQty, existingItem.rows[0].id]
      );
    } else {
      await pool.query(
        'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3)',
        [cartId, productId, quantity]
      );
    }

    res.json({ message: 'Item added to cart' });
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
      return res.json({ message: 'Item removed from cart' });
    }

    await pool.query('UPDATE cart_items SET quantity = $1 WHERE id = $2', [quantity, itemId]);

    res.json({ message: 'Cart updated' });
  } catch (error) {
    next(error);
  }
};

const removeFromCart = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    // Verify ownership
    const itemResult = await pool.query(
      `SELECT ci.id, sc.user_id
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

    res.json({ message: 'Cart cleared' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
