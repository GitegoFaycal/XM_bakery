import express from 'express';
import bcrypt from 'bcryptjs';
import db, { toId } from '../config/db.js';
import { isAdminEmail, requireAuth, signToken } from '../middleware/auth.js';

const router = express.Router();
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

const publicUser = (row) => ({
  id: toId(row.id),
  name: row.name,
  email: row.email,
  role: row.role || 'customer',
});

// POST /api/auth/register -> 201 { message, userId, token, user }
router.post('/register', async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existing = await db.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: [email] });
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const role = isAdminEmail(email) ? 'admin' : 'customer';
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await db.execute({
      sql: 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      args: [name, email, hashedPassword, role],
    });

    const user = { id: toId(result.lastInsertRowid), name, email, role };
    res.status(201).json({
      message: 'User registered successfully',
      userId: user.id,
      token: signToken(user),
      user,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login -> 200 { message, token, user: { id, name, email, role } }
router.post('/login', async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  try {
    const result = await db.execute({
      sql: 'SELECT id, name, email, password, role FROM users WHERE email = ?',
      args: [email],
    });
    const row = result.rows[0];

    if (!row || !(await bcrypt.compare(password, row.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Promote on login if the address was added to ADMIN_EMAILS after sign-up.
    if (row.role !== 'admin' && isAdminEmail(row.email)) {
      await db.execute({ sql: "UPDATE users SET role = 'admin' WHERE id = ?", args: [row.id] });
      row.role = 'admin';
    }

    const user = publicUser(row);
    res.status(200).json({ message: 'Login successful', token: signToken(user), user });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me -> 200 { user } (fresh from the database)
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const result = await db.execute({
      sql: 'SELECT id, name, email, role FROM users WHERE id = ?',
      args: [req.user.id],
    });
    if (result.rows.length === 0) return res.status(401).json({ message: 'Account no longer exists' });
    res.status(200).json({ user: publicUser(result.rows[0]) });
  } catch (err) {
    next(err);
  }
});

router.get('/test', (req, res) => {
  res.send('Auth route works!');
});

export default router;
