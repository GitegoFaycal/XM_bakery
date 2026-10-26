import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../config/db.js';

const router = express.Router();


router.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

 
  const checkSql = 'SELECT id FROM users WHERE email = ?';
  db.query(checkSql, [email], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });

    if (results.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

   
    const hashedPassword = bcrypt.hashSync(password, 10);

  
    const insertSql =
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';

    db.query(insertSql, [name, email, hashedPassword], (err, result) => {
      if (err) return res.status(500).json({ message: 'Database error' });

      res.status(201).json({
        message: 'User registered successfully',
        userId: result.insertId
      });
    });
  });
});


router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  const sql = 'SELECT * FROM users WHERE email = ?';

  db.query(sql, [email], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = results[0];

   
    const isMatch = bcrypt.compareSync(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  });
});


router.get('/test', (req, res) => {
  res.send('Auth route works!');
});

export default router;
