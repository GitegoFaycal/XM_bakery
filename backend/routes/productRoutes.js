import express from 'express';
import db, { toId } from '../config/db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

const serialise = (row) => ({
  id: toId(row.id),
  name: row.name,
  category: row.category,
  price: Number(row.price),
  quantity: Number(row.quantity),
  created_at: row.created_at,
});

// POST /api/products (admin) -> 201 { message, productId }
router.post('/', requireAdmin, async (req, res, next) => {
  const { name, category, price, quantity } = req.body;

  if (!name || !price || quantity === undefined || quantity === null || quantity === '') {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const result = await db.execute({
      sql: 'INSERT INTO products (name, category, price, quantity) VALUES (?, ?, ?, ?)',
      args: [name, category ?? null, Number(price), Number(quantity)],
    });
    res.status(201).json({
      message: 'Product created successfully',
      productId: toId(result.lastInsertRowid),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/products -> 200 [ product ]
router.get('/', async (req, res, next) => {
  try {
    const result = await db.execute('SELECT * FROM products ORDER BY id');
    res.status(200).json(result.rows.map(serialise));
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id -> 200 product | 404
router.get('/:id', async (req, res, next) => {
  try {
    const result = await db.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [req.params.id] });
    if (result.rows.length === 0) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json(serialise(result.rows[0]));
  } catch (err) {
    next(err);
  }
});

// PUT /api/products/:id (admin) -> 200 { message } | 404
router.put('/:id', requireAdmin, async (req, res, next) => {
  const { name, category, price, quantity } = req.body;

  if (!name || price === undefined || quantity === undefined) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const result = await db.execute({
      sql: 'UPDATE products SET name = ?, category = ?, price = ?, quantity = ? WHERE id = ?',
      args: [name, category ?? null, Number(price), Number(quantity), req.params.id],
    });
    if (result.rowsAffected === 0) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json({ message: 'Product updated successfully' });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/products/:id/stock (admin) -> 200 { message, quantity }
// Body: { quantity: 12 } to set, or { delta: -2 } to adjust. Never below 0.
router.patch('/:id/stock', requireAdmin, async (req, res, next) => {
  const { quantity, delta } = req.body;
  const hasQty = quantity !== undefined && quantity !== null && quantity !== '';
  const hasDelta = delta !== undefined && delta !== null && delta !== '';

  if (hasQty === hasDelta) {
    return res.status(400).json({ message: 'Send either quantity or delta' });
  }
  const value = Number(hasQty ? quantity : delta);
  if (!Number.isInteger(value) || (hasQty && value < 0)) {
    return res.status(400).json({ message: 'Stock must be a whole number' });
  }

  try {
    const result = hasQty
      ? await db.execute({ sql: 'UPDATE products SET quantity = ? WHERE id = ?', args: [value, req.params.id] })
      : await db.execute({
          sql: 'UPDATE products SET quantity = MAX(0, quantity + ?) WHERE id = ?',
          args: [value, req.params.id],
        });
    if (result.rowsAffected === 0) return res.status(404).json({ message: 'Product not found' });

    const after = await db.execute({ sql: 'SELECT quantity FROM products WHERE id = ?', args: [req.params.id] });
    res.status(200).json({ message: 'Stock updated', quantity: Number(after.rows[0].quantity) });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/products/:id (admin) -> 200 { message } | 404
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const result = await db.execute({ sql: 'DELETE FROM products WHERE id = ?', args: [req.params.id] });
    if (result.rowsAffected === 0) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
