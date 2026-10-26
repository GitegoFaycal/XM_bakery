import express from 'express';
import db, { toId } from '../config/db.js';

const router = express.Router();

const serialise = (row) => ({
  id: toId(row.id),
  name: row.name,
  category: row.category,
  price: Number(row.price),
  quantity: Number(row.quantity),
  created_at: row.created_at,
});

// POST /api/products -> 201 { message, productId }
router.post('/', async (req, res, next) => {
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
    const result = await db.execute({
      sql: 'SELECT * FROM products WHERE id = ?',
      args: [req.params.id],
    });
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(serialise(result.rows[0]));
  } catch (err) {
    next(err);
  }
});

// PUT /api/products/:id -> 200 { message } | 404
router.put('/:id', async (req, res, next) => {
  const { name, category, price, quantity } = req.body;

  if (!name || price === undefined || quantity === undefined) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const result = await db.execute({
      sql: 'UPDATE products SET name = ?, category = ?, price = ?, quantity = ? WHERE id = ?',
      args: [name, category ?? null, Number(price), Number(quantity), req.params.id],
    });
    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product updated successfully' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/products/:id -> 200 { message } | 404
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await db.execute({
      sql: 'DELETE FROM products WHERE id = ?',
      args: [req.params.id],
    });
    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
