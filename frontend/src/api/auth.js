import { api } from './client.js';

// POST /api/auth/register -> 201 { message, userId }
export function register({ name, email, password }) {
  return api.post('/auth/register', { name, email, password });
}

// POST /api/auth/login -> 200 { message, user: { id, name, email } }
export function login({ email, password }) {
  return api.post('/auth/login', { email, password });
}
