import { api } from './client.js';

export const ORDER_STATUSES = ['pending', 'processing', 'ready', 'collected', 'cancelled'];
export const PAYMENT_STATUSES = ['unpaid', 'paid', 'refunded'];

// POST /api/orders -> 201 { message, orderId, order }
// A logged-in user is attached by their token; guests send name + phone.
export function placeOrder({ customerName, phone, email, note, items }) {
  return api.post('/orders', {
    customer_name: customerName,
    phone,
    email,
    note,
    items: items.map((i) => ({ product_id: i.id, quantity: i.qty })),
  });
}

// GET /api/orders/:id -> order with items. Guests must pass the phone used on the order.
export function getOrder(id, phone) {
  const q = phone ? `?phone=${encodeURIComponent(phone)}` : '';
  return api.get(`/orders/${id}${q}`);
}

// GET /api/orders -> the caller's own orders (customer) or every order (admin)
export function getMyOrders() {
  return api.get('/orders');
}

export function getAllOrders(status) {
  return api.get(`/orders${status ? `?status=${encodeURIComponent(status)}` : ''}`);
}

// PATCH /api/orders/:id (admin) -> { message, order }
export function updateOrder(id, patch) {
  return api.patch(`/orders/${id}`, patch);
}

// Guests have no account, so remember their order numbers (and the phone that
// unlocks them) in this browser.
const GUEST_KEY = 'xm_bakery_guest_orders';

export function rememberGuestOrder(id, phone) {
  try {
    const rest = readGuestOrders().filter((x) => x.id !== id);
    localStorage.setItem(GUEST_KEY, JSON.stringify([{ id, phone }, ...rest].slice(0, 20)));
  } catch {
    /* ignore */
  }
}

export function readGuestOrders() {
  try {
    const parsed = JSON.parse(localStorage.getItem(GUEST_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    // Older entries were bare ids; keep them but they will need a phone.
    return parsed.map((x) => (typeof x === 'object' && x ? x : { id: x, phone: '' }));
  } catch {
    return [];
  }
}
