import jwt from 'jsonwebtoken';

// Read lazily so dotenv has run by the time a request arrives.
const secret = () => process.env.JWT_SECRET || 'dev-only-secret-change-me';

export const TOKEN_TTL = '7d';

export function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, secret(), { expiresIn: TOKEN_TTL });
}

// Admins are whoever is listed in ADMIN_EMAILS (comma separated).
export function isAdminEmail(email) {
  const list = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(String(email || '').trim().toLowerCase());
}

// Sets req.user from a Bearer token when present; never rejects.
export function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  req.user = null;
  if (token) {
    try {
      const payload = jwt.verify(token, secret());
      req.user = { id: Number(payload.id), role: payload.role || 'customer' };
    } catch {
      req.user = null;
    }
  }
  next();
}

export function requireAuth(req, res, next) {
  optionalAuth(req, res, () => {
    if (!req.user) return res.status(401).json({ message: 'Login required' });
    next();
  });
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
    next();
  });
}
