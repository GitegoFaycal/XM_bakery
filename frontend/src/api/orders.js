import { api } from './client.js';

// POST /api/orders -> 201 { message, orderId, order }
// Members send userId; guests send customerName + phone. Prices are computed
// server-side from the product table, so only ids and quantities go up.
export function placeOrder({ userId, customerName, phone, email, note, items }) {
  return api.post('/orders', {
    user_id: userId ?? null,
    customer_name: customerName,
    phone,
    email,
    note,
    items: items.map((i) => ({ product_id: i.id, quantity: i.qty })),
  });
}

// GET /api/orders/:id -> order with items
export function getOrder(id) {
  return api.get(`/orders/${id}`);
}

// GET /api/orders?user_id= -> [ order ]
export function getMyOrders(userId) {
  return api.get(`/orders?user_id=${encodeURIComponent(userId)}`);
}

// Guests have no account, so remember their order numbers in this browser.
const GUEST_KEY = 'xm_bakery_guest_orders';

export function rememberGuestOrder(id) {
  try {
    const ids = readGuestOrders().filter((x) => x !== id);
    localStorage.setItem(GUEST_KEY, JSON.stringify([id, ...ids].slice(0, 20)));
  } catch {
    /* ignore */
  }
}

export function readGuestOrders() {
  try {
    const parsed = JSON.parse(localStorage.getItem(GUEST_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
