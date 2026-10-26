import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Info, UserCheck } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { placeOrder, rememberGuestOrder } from '../api/orders.js';
import { formatPrice } from '../utils/format.js';
import PageHeader from '../components/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';

function validate(form, isMember) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Name is required';
  if (!isMember && !form.phone.trim()) errors.phone = 'Phone is required so we can reach you';
  if (form.phone && !/^[+\d][\d\s-]{6,}$/.test(form.phone.trim())) errors.phone = 'Enter a valid phone number';
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email';
  return errors;
}

export default function Checkout() {
  const { items, total, clear } = useCart();
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: '',
    email: user?.email || '',
    note: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  // Set once an order is placed so clearing the cart does not bounce the user
  // back to /cart before the navigation to the confirmation page happens.
  const placedRef = useRef(false);

  if (items.length === 0 && !placedRef.current) return <Navigate to="/cart" replace />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handlePlace = async (e) => {
    e.preventDefault();
    setServerError(null);
    const errs = validate(form, isAuthenticated);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      const res = await placeOrder({
        userId: isAuthenticated ? user.id : null,
        customerName: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        note: form.note.trim(),
        items,
      });
      if (!isAuthenticated) rememberGuestOrder(res.orderId);
      placedRef.current = true;
      navigate(`/orders/${res.orderId}`, { replace: true, state: { justPlaced: true } });
      clear();
      toast.success('Order placed. See you at the counter!');
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Checkout" subtitle="Pickup at the counter. Pay when you collect." />
      <form onSubmit={handlePlace} className="grid gap-8 lg:grid-cols-3" noValidate>
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-stone-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold text-stone-900">Your details</h2>
              {isAuthenticated ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  <UserCheck className="h-3.5 w-3.5" /> Ordering as {user.name}
                </span>
              ) : (
                <p className="text-xs text-stone-500">
                  No account needed.{' '}
                  <Link to="/login" state={{ from: '/checkout' }} className="text-brand-700 hover:underline">
                    Log in
                  </Link>{' '}
                  to keep your order history.
                </p>
              )}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input
                label="Full name"
                autoComplete="name"
                value={form.name}
                onChange={set('name')}
                error={errors.name}
                placeholder="Jane Doe"
                required
                autoFocus={!isAuthenticated}
              />
              <Input
                label={isAuthenticated ? 'Phone (optional)' : 'Phone'}
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={set('phone')}
                error={errors.phone}
                placeholder="07xx xxx xxx"
                required={!isAuthenticated}
              />
              <Input
                label="Email (optional)"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={set('email')}
                error={errors.email}
                placeholder="you@example.com"
                className="sm:col-span-2"
              />
            </div>
          </section>

          <section className="rounded-xl border border-stone-200 bg-white p-5">
            <h2 className="font-semibold text-stone-900">Note for the bakers</h2>
            <textarea
              value={form.note}
              onChange={set('note')}
              rows={3}
              maxLength={500}
              placeholder="Birthday message, allergies, pickup time…"
              className="input mt-4 resize-none"
            />
          </section>

          <p className="flex items-start gap-1.5 text-xs text-stone-500">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            You will get an order number to quote at the counter. Payment is taken on collection.
          </p>
        </div>

        <aside className="h-fit rounded-xl border border-stone-200 bg-white p-5 lg:sticky lg:top-24">
          <h2 className="font-semibold text-stone-900">Your order</h2>
          <ul className="mt-4 divide-y divide-stone-100 text-sm">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between py-2">
                <span className="text-stone-700">
                  {i.qty} × {i.name}
                </span>
                <span className="font-medium text-stone-900">{formatPrice(i.qty * i.price)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-stone-200 pt-3 text-base font-semibold text-stone-900">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
          {serverError && (
            <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              {serverError}
            </p>
          )}
          <Button type="submit" size="lg" className="mt-5 w-full" loading={submitting}>
            Place order
          </Button>
          <Link to="/cart" className="mt-3 block text-center text-sm text-brand-700 hover:underline">
            Back to cart
          </Link>
        </aside>
      </form>
    </div>
  );
}
