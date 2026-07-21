class InventoryConflictError extends Error {
  constructor(message = 'Insufficient inventory') {
    super(message);
    this.status = 409;
  }
}

async function consumeInventory(client, productId, quantity) {
  const result = await client.query(
    `UPDATE products
        SET quantity_sold = quantity_sold + $1,
            status = CASE WHEN quantity_sold + $1 >= quantity THEN 'sold' ELSE status END,
            updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
        AND status = 'active'
        AND quantity_sold + $1 <= quantity
      RETURNING id, quantity, quantity_sold, status`,
    [quantity, productId],
  );
  if (!result.rows[0]) throw new InventoryConflictError();
  return result.rows[0];
}

async function releaseOrderInventory(client, orderId) {
  const claimed = await client.query(
    `UPDATE orders SET inventory_released_at=NOW(),updated_at=NOW()
      WHERE id=$1 AND inventory_released_at IS NULL RETURNING id`,
    [orderId],
  );
  if (!claimed.rows[0]) return false;
  await client.query(
    `UPDATE products p
        SET quantity_sold=GREATEST(0,p.quantity_sold-i.quantity),
            status=CASE WHEN p.status='sold' AND GREATEST(0,p.quantity_sold-i.quantity) < p.quantity THEN 'active' ELSE p.status END,
            updated_at=NOW()
       FROM (SELECT product_id,SUM(quantity)::integer AS quantity FROM order_items WHERE order_id=$1 GROUP BY product_id) i
      WHERE p.id=i.product_id`,
    [orderId],
  );
  return true;
}

async function restockReturnInventory(client, returnId) {
  const returned = (await client.query(
    `UPDATE returns SET inventory_restocked_at=NOW(),updated_at=NOW()
      WHERE id=$1 AND inventory_restocked_at IS NULL RETURNING order_item_id`,
    [returnId],
  )).rows[0];
  if (!returned?.order_item_id) return false;
  await client.query(
    `UPDATE products p
        SET quantity_sold=GREATEST(0,p.quantity_sold-oi.quantity),
            status=CASE WHEN p.status='sold' AND GREATEST(0,p.quantity_sold-oi.quantity) < p.quantity THEN 'active' ELSE p.status END,
            updated_at=NOW()
       FROM order_items oi WHERE oi.id=$1 AND p.id=oi.product_id`,
    [returned.order_item_id],
  );
  return true;
}

module.exports = { consumeInventory, releaseOrderInventory, restockReturnInventory, InventoryConflictError };
