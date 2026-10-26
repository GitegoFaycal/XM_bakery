import express from 'express';
import db from '../config/db.js';

const router = express.Router();


router.post('/', (req, res) => {
  const { name, category, price, quantity } = req.body;

  if (!name || !price || !quantity) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const sql = `
    INSERT INTO products (name, category, price, quantity)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [name, category, price, quantity], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    res.status(201).json({
      message: 'Product created successfully',
      productId: result.insertId
    });
  });
});


router.get('/', (req, res) => {
  const sql = 'SELECT * FROM products';

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    res.status(200).json(results);
  });
});



router.get('/:id', (req, res) => {
  const { id } = req.params;

  const sql = 'SELECT * FROM products WHERE id = ?';

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json(results[0]);
  });
});


router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, category, price, quantity } = req.body;

  const sql = `
    UPDATE products
    SET name = ?, category = ?, price = ?, quantity = ?
    WHERE id = ?
  `;

  db.query(sql, [name, category, price, quantity, id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ message: 'Product updated successfully' });
  });
});



router.delete('/:id', (req, res) => {
  const { id } = req.params;

  const sql = 'DELETE FROM products WHERE id = ?';

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ message: 'Product deleted successfully' });
  });
});

export default router;
