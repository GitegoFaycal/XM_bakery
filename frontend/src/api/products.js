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

function normalise({ name, category, price, quantity }) {
  return {
    name: String(name || '').trim(),
    category: String(category || '').trim() || null,
    price: Number(price),
    quantity: Number(quantity),
  };
}
