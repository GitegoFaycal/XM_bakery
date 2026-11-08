import { api } from './client.js';

// POST /api/auth/register -> 201 { message, userId, token, user }
export function register({ name, email, password }) {
  return api.post('/auth/register', { name, email, password });
}

// POST /api/auth/login -> 200 { message, token, user: { id, name, email, role } }
export function login({ email, password }) {
  return api.post('/auth/login', { email, password });
}

// GET /api/auth/me -> 200 { user }
export function me() {
  return api.get('/auth/me');
}
