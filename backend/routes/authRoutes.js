import express from 'express';
import bcrypt from 'bcryptjs';
import db, { toId } from '../config/db.js';

const router = express.Router();
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

// POST /api/auth/register -> 201 { message, userId }
router.post('/register', async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existing = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [email],
    });
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await db.execute({
      sql: 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      args: [name, email, hashedPassword],
    });

    res.status(201).json({
      message: 'User registered successfully',
      userId: toId(result.lastInsertRowid),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login -> 200 { message, user: { id, name, email } }
router.post('/login', async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  try {
    const result = await db.execute({
      sql: 'SELECT id, name, email, password FROM users WHERE email = ?',
      args: [email],
    });
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.status(200).json({
      message: 'Login successful',
      user: { id: toId(user.id), name: user.name, email: user.email },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/test', (req, res) => {
  res.send('Auth route works!');
});

export default router;
