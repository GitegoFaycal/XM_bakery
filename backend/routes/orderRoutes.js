import express from 'express';
import db, { toId } from '../config/db.js';

const router = express.Router();

const serialiseOrder = (row, items = []) => ({
  id: toId(row.id),
  user_id: row.user_id == null ? null : toId(row.user_id),
  customer_name: row.customer_name,
  phone: row.phone,
  email: row.email,
  note: row.note,
  total: Number(row.total),
  status: row.status,
  payment_method: row.payment_method,
  payment_status: row.payment_status,
  created_at: row.created_at,
  items: items.map((i) => ({
    id: toId(i.id),
    product_id: i.product_id == null ? null : toId(i.product_id),
    product_name: i.product_name,
    quantity: Number(i.quantity),
    price: Number(i.price),
  })),
});

async function loadItems(orderIds) {
  if (orderIds.length === 0) return new Map();
  const placeholders = orderIds.map(() => '?').join(',');
  const result = await db.execute({
    sql: `SELECT * FROM order_items WHERE order_id IN (${placeholders}) ORDER BY id`,
    args: orderIds,
  });
  const byOrder = new Map();
  for (const row of result.rows) {
    const key = toId(row.order_id);
    if (!byOrder.has(key)) byOrder.set(key, []);
    byOrder.get(key).push(row);
  }
  return byOrder;
}

// POST /api/orders
// Body: { user_id?, customer_name?, phone?, email?, note?, items: [{ product_id, quantity }] }
// Guests must send customer_name and phone. Members may send only user_id.
// Prices come from the database, never from the client, and stock is
// checked and reduced inside one transaction.
router.post('/', async (req, res, next) => {
  const { user_id: userId, items, note } = req.body;
  let { customer_name: customerName, phone, email } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Order must contain at least one item' });
  }
  for (const item of items) {
    const qty = Number(item?.quantity);
    if (!item?.product_id || !Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({ message: 'Each item needs a product_id and a quantity of 1 or more' });
    }
  }

  try {
    if (userId) {
      const user = await db.execute({ sql: 'SELECT id, name, email FROM users WHERE id = ?', args: [userId] });
      if (user.rows.length === 0) return res.status(404).json({ message: 'User not found' });
      customerName = (customerName || '').trim() || user.rows[0].name;
      email = (email || '').trim() || user.rows[0].email;
    }

    customerName = (customerName || '').trim();
    phone = (phone || '').trim();
    email = (email || '').trim();

    if (!customerName) return res.status(400).json({ message: 'Customer name is required' });
    if (!userId && !phone) return res.status(400).json({ message: 'Phone number is required for guest orders' });

    // Merge duplicate product lines.
    const wanted = new Map();
    for (const item of items) {
      const id = Number(item.product_id);
      wanted.set(id, (wanted.get(id) || 0) + Number(item.quantity));
    }

    const tx = await db.transaction('write');
    try {
      const ids = Array.from(wanted.keys());
      const found = await tx.execute({
        sql: `SELECT id, name, price, quantity FROM products WHERE id IN (${ids.map(() => '?').join(',')})`,
        args: ids,
      });
      const products = new Map(found.rows.map((p) => [toId(p.id), p]));

      const lines = [];
      for (const [id, qty] of wanted) {
        const product = products.get(id);
        if (!product) {
          await tx.rollback();
          return res.status(404).json({ message: `Product ${id} not found` });
        }
        if (Number(product.quantity) < qty) {
          await tx.rollback();
          return res.status(409).json({
            message: `Only ${product.quantity} of "${product.name}" left in stock`,
            product_id: id,
            available: Number(product.quantity),
          });
        }
        lines.push({ id, name: product.name, price: Number(product.price), qty });
      }

      const total = lines.reduce((sum, l) => sum + l.price * l.qty, 0);

      const inserted = await tx.execute({
        sql: `INSERT INTO orders (user_id, customer_name, phone, email, note, total)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [userId ?? null, customerName, phone || null, email || null, (note || '').trim() || null, total],
      });
      const orderId = toId(inserted.lastInsertRowid);

      for (const line of lines) {
        await tx.execute({
          sql: 'INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES (?, ?, ?, ?, ?)',
          args: [orderId, line.id, line.name, line.qty, line.price],
        });
        await tx.execute({
          sql: 'UPDATE products SET quantity = quantity - ? WHERE id = ?',
          args: [line.qty, line.id],
        });
      }

      await tx.commit();

      const order = await db.execute({ sql: 'SELECT * FROM orders WHERE id = ?', args: [orderId] });
      const itemRows = await loadItems([orderId]);
      res.status(201).json({
        message: 'Order placed successfully',
        orderId,
        order: serialiseOrder(order.rows[0], itemRows.get(orderId) || []),
      });
    } catch (err) {
      try { await tx.rollback(); } catch { /* already closed */ }
      throw err;
    }
  } catch (err) {
    next(err);
  }
});

// GET /api/orders?user_id=1   or   GET /api/orders?email=x@y.z
router.get('/', async (req, res, next) => {
  const { user_id: userId, email } = req.query;
  if (!userId && !email) {
    return res.status(400).json({ message: 'Provide user_id or email to list orders' });
  }
  try {
    const result = userId
      ? await db.execute({ sql: 'SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC', args: [userId] })
      : await db.execute({ sql: 'SELECT * FROM orders WHERE email = ? ORDER BY id DESC', args: [email] });
    const items = await loadItems(result.rows.map((r) => toId(r.id)));
    res.status(200).json(result.rows.map((r) => serialiseOrder(r, items.get(toId(r.id)) || [])));
  } catch (err) {
    next(err);
  }
});

router.get('/test', (req, res) => {
  res.send('Order route works!');
});

// GET /api/orders/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await db.execute({ sql: 'SELECT * FROM orders WHERE id = ?', args: [req.params.id] });
    if (result.rows.length === 0) return res.status(404).json({ message: 'Order not found' });
    const id = toId(result.rows[0].id);
    const items = await loadItems([id]);
    res.status(200).json(serialiseOrder(result.rows[0], items.get(id) || []));
  } catch (err) {
    next(err);
  }
});

export default router;
