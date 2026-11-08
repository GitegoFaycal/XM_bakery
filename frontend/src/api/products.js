import { api } from './client.js';

// Product shape returned by the backend: { id, name, category, price, quantity }

export function getProducts() {
  return api.get('/products');
}

export function getProduct(id) {
  return api.get(`/products/${id}`);
}

export function createProduct(product) {
  return api.post('/products', normalise(product));
}

export function updateProduct(id, product) {
  return api.put(`/products/${id}`, normalise(product));
}

export function deleteProduct(id) {
  return api.delete(`/products/${id}`);
}

// PATCH /api/products/:id/stock -> { message, quantity }
// Pass { delta: -1 } to adjust or { quantity: 12 } to set.
export function setStock(id, change) {
  return api.patch(`/products/${id}/stock`, change);
}

function normalise({ name, category, price, quantity }) {
  return {
    name: String(name || '').trim(),
    category: String(category || '').trim() || null,
    price: Number(price),
    quantity: Number(quantity),
  };
}
