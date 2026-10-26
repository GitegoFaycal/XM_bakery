import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { ensureSchema } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Make sure tables exist before any route touches the database.
app.use(async (req, res, next) => {
  try {
    await ensureSchema();
    next();
  } catch (err) {
    next(err);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

app.get('/', (req, res) => {
  res.status(200).json({ message: 'XM Bakery Backend is running' });
});

app.use((req, res) => {
  res.status(404).json({ message: `Cannot ${req.method} ${req.path}` });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Database error' });
});

export default app;
