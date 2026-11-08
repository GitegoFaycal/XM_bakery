import express from 'express';
import db, { toId } from '../config/db.js';
import { optionalAuth, requireAdmin, requireAuth } from '../middleware/auth.js';

const router = express.Router();

export const ORDER_STATUSES = ['pending', 'processing', 'ready', 'collected', 'cancelled'];
export const PAYMENT_STATUSES = ['unpaid', 'paid', 'refunded'];

const digits = (s) => String(s || '').replace(/\D/g, '');

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

async function loadOrder(id) {
  const result = await db.execute({ sql: 'SELECT * FROM orders WHERE id = ?', args: [id] });
  if (result.rows.length === 0) return null;
  const items = await loadItems([toId(result.rows[0].id)]);
  return serialiseOrder(result.rows[0], items.get(toId(result.rows[0].id)) || []);
}

// POST /api/orders
// Body: { customer_name?, phone?, email?, note?, items: [{ product_id, quantity }] }
// Logged-in users are attached by their token; guests must send name + phone.
// Prices come from the database and stock is reduced inside one transaction.
router.post('/', optionalAuth, async (req, res, next) => {
  const { items, note } = req.body;
  let { customer_name: customerName, phone, email } = req.body;
  const userId = req.user ? req.user.id : null;

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
      if (user.rows.length === 0) return res.status(401).json({ message: 'Account no longer exists' });
      customerName = (customerName || '').trim() || user.rows[0].name;
      email = (email || '').trim() || user.rows[0].email;
    }

    customerName = (customerName || '').trim();
    phone = (phone || '').trim();
    email = (email || '').trim();

    if (!customerName) return res.status(400).json({ message: 'Customer name is required' });
    if (!userId && !phone) return res.status(400).json({ message: 'Phone number is required for guest orders' });

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
        args: [userId, customerName, phone || null, email || null, (note || '').trim() || null, total],
      });
      const orderId = toId(inserted.lastInsertRowid);

      for (const line of lines) {
        await tx.execute({
          sql: 'INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES (?, ?, ?, ?, ?)',
          args: [orderId, line.id, line.name, line.qty, line.price],
        });
        await tx.execute({ sql: 'UPDATE products SET quantity = quantity - ? WHERE id = ?', args: [line.qty, line.id] });
      }
      await tx.commit();

      res.status(201).json({ message: 'Order placed successfully', orderId, order: await loadOrder(orderId) });
    } catch (err) {
      try { await tx.rollback(); } catch { /* already closed */ }
      throw err;
    }
  } catch (err) {
    next(err);
  }
});

// GET /api/orders            -> own orders (customer) or all orders (admin)
// GET /api/orders?status=pending  (admin filter)
router.get('/', requireAuth, async (req, res, next) => {
  try {
    let result;
    if (req.user.role === 'admin') {
      const { status } = req.query;
      if (status && !ORDER_STATUSES.includes(status)) {
        return res.status(400).json({ message: `status must be one of ${ORDER_STATUSES.join(', ')}` });
      }
      result = status
        ? await db.execute({ sql: 'SELECT * FROM orders WHERE status = ? ORDER BY id DESC', args: [status] })
        : await db.execute('SELECT * FROM orders ORDER BY id DESC');
    } else {
      result = await db.execute({ sql: 'SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC', args: [req.user.id] });
    }
    const items = await loadItems(result.rows.map((r) => toId(r.id)));
    res.status(200).json(result.rows.map((r) => serialiseOrder(r, items.get(toId(r.id)) || [])));
  } catch (err) {
    next(err);
  }
});

router.get('/test', (req, res) => {
  res.send('Order route works!');
});

// GET /api/orders/:id  -> admin, the owning user, or a guest who sends ?phone= matching the order
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const order = await loadOrder(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isAdmin = req.user?.role === 'admin';
    const isOwner = req.user && order.user_id === req.user.id;
    const guestMatch =
      order.user_id === null && req.query.phone && digits(req.query.phone) === digits(order.phone);

    if (!isAdmin && !isOwner && !guestMatch) {
      return res.status(403).json({ message: 'You are not allowed to view this order' });
    }
    res.status(200).json(order);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/orders/:id (admin) -> { status?, payment_status? }
// Cancelling an order puts its items back into stock.
router.patch('/:id', requireAdmin, async (req, res, next) => {
  const { status, payment_status: paymentStatus } = req.body;

  if (status !== undefined && !ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ message: `status must be one of ${ORDER_STATUSES.join(', ')}` });
  }
  if (paymentStatus !== undefined && !PAYMENT_STATUSES.includes(paymentStatus)) {
    return res.status(400).json({ message: `payment_status must be one of ${PAYMENT_STATUSES.join(', ')}` });
  }
  if (status === undefined && paymentStatus === undefined) {
    return res.status(400).json({ message: 'Nothing to update' });
  }

  try {
    const current = await loadOrder(req.params.id);
    if (!current) return res.status(404).json({ message: 'Order not found' });

    const tx = await db.transaction('write');
    try {
      const nextStatus = status ?? current.status;
      const nextPayment = paymentStatus ?? current.payment_status;

      if (nextStatus === 'cancelled' && current.status !== 'cancelled') {
        for (const item of current.items) {
          if (item.product_id != null) {
            await tx.execute({
              sql: 'UPDATE products SET quantity = quantity + ? WHERE id = ?',
              args: [item.quantity, item.product_id],
            });
          }
        }
      } else if (current.status === 'cancelled' && nextStatus !== 'cancelled') {
        // Re-opening a cancelled order takes the stock again.
        for (const item of current.items) {
          if (item.product_id != null) {
            await tx.execute({
              sql: 'UPDATE products SET quantity = MAX(0, quantity - ?) WHERE id = ?',
              args: [item.quantity, item.product_id],
            });
          }
        }
      }

      await tx.execute({
        sql: 'UPDATE orders SET status = ?, payment_status = ? WHERE id = ?',
        args: [nextStatus, nextPayment, current.id],
      });
      await tx.commit();
    } catch (err) {
      try { await tx.rollback(); } catch { /* already closed */ }
      throw err;
    }

    res.status(200).json({ message: 'Order updated', order: await loadOrder(current.id) });
  } catch (err) {
    next(err);
  }
});

export default router;
