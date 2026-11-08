import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2, ArrowLeft, Phone, Mail, StickyNote, Lock } from 'lucide-react';
import { getOrder, readGuestOrders } from '../api/orders.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDate, formatPrice } from '../utils/format.js';
import Spinner from '../components/ui/Spinner.jsx';
import ErrorBanner from '../components/ui/ErrorBanner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import { STATUS_LABEL, STATUS_TONE } from './Orders.jsx';

const PAYMENT_LABEL = { unpaid: 'Pay at counter', paid: 'Paid', refunded: 'Refunded' };

export default function OrderDetail() {
  const { id } = useParams();
  const { state } = useLocation();
  const { isAuthenticated, isAdmin } = useAuth();
  const justPlaced = Boolean(state?.justPlaced);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [forbidden, setForbidden] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      // Guests unlock their order with the phone number they used.
      const remembered = readGuestOrders().find((g) => String(g.id) === String(id));
      setOrder(await getOrder(id, isAuthenticated ? undefined : remembered?.phone));
    } catch (err) {
      if (err.status === 403) setForbidden(true);
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAuthenticated]);

  if (loading) return <Spinner />;
  if (forbidden) {
    return (
      <EmptyState
        icon={Lock}
        title="This order belongs to someone else"
        description={
          isAuthenticated
            ? 'Only the person who placed it and bakery staff can see it.'
            : 'Log in with the account that placed it, or open it from the device you ordered on.'
        }
        action={
          <Link to={isAuthenticated ? '/orders' : '/login'}>
            <Button>{isAuthenticated ? 'My orders' : 'Log in'}</Button>
          </Link>
        }
      />
    );
  }
  if (error) return <ErrorBanner message={error} onRetry={load} />;
  if (!order) return null;

  const status = String(order.status || 'pending').toLowerCase();

  return (
    <div className="mx-auto max-w-2xl">
      {justPlaced ? (
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex rounded-full bg-emerald-100 p-4 text-emerald-700">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="font-display text-3xl font-bold text-stone-900">
            Thank you, {order.customer_name.split(' ')[0]}!
          </h1>
          <p className="mt-2 text-stone-600">Your order is in. Quote this number at the counter:</p>
          <p className="mt-3 inline-block rounded-xl bg-brand-50 px-6 py-3 font-display text-4xl font-bold tracking-wide text-brand-800">
            #{order.id}
          </p>
        </div>
      ) : (
        <Link
          to={isAdmin ? '/dashboard/orders' : '/orders'}
          className="mb-6 inline-flex items-center gap-1 text-sm text-stone-600 hover:text-stone-900"
        >
          <ArrowLeft className="h-4 w-4" /> {isAdmin ? 'All orders' : 'My orders'}
        </Link>
      )}

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-stone-900">Order #{order.id}</h2>
            <p className="text-xs text-stone-500">{formatDate(order.created_at)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={STATUS_TONE[status] || 'neutral'}>{STATUS_LABEL[status] || status}</Badge>
            <Badge tone={order.payment_status === 'paid' ? 'success' : order.payment_status === 'refunded' ? 'neutral' : 'warning'}>
              {PAYMENT_LABEL[order.payment_status] || order.payment_status}
            </Badge>
          </div>
        </div>

        <ul className="divide-y divide-stone-100 px-5">
          {order.items.map((i) => (
            <li key={i.id} className="flex items-center justify-between py-3 text-sm">
              <span className="text-stone-700">
                {i.quantity} × {i.product_name}
                <span className="ml-2 text-xs text-stone-400">{formatPrice(i.price)} each</span>
              </span>
              <span className="font-medium text-stone-900">{formatPrice(i.quantity * i.price)}</span>
            </li>
          ))}
        </ul>

        <div className="flex justify-between border-t border-stone-200 px-5 py-4 text-base font-semibold text-stone-900">
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </div>

        <div className="space-y-1.5 border-t border-stone-200 bg-stone-50 px-5 py-4 text-sm text-stone-600">
          <p className="font-medium text-stone-800">{order.customer_name}</p>
          {order.phone && (
            <p className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5" /> {order.phone}
            </p>
          )}
          {order.email && (
            <p className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5" /> {order.email}
            </p>
          )}
          {order.note && (
            <p className="flex items-start gap-2">
              <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {order.note}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <Link to="/products">
          <Button variant="secondary">Keep shopping</Button>
        </Link>
        <Link to={isAdmin ? '/dashboard/orders' : '/orders'}>
          <Button>{isAdmin ? 'Manage orders' : 'My orders'}</Button>
        </Link>
      </div>
    </div>
  );
}
