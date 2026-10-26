import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, ChevronRight } from 'lucide-react';
import { getMyOrders, getOrder, readGuestOrders } from '../api/orders.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDate, formatPrice } from '../utils/format.js';
import PageHeader from '../components/PageHeader.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorBanner from '../components/ui/ErrorBanner.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';

export const STATUS_TONE = {
  pending: 'warning',
  processing: 'brand',
  ready: 'brand',
  collected: 'success',
  delivered: 'success',
  cancelled: 'danger',
};

export default function Orders() {
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isAuthenticated) {
        const data = await getMyOrders(user.id);
        setOrders(Array.isArray(data) ? data : []);
      } else {
        // Guests: look up the order numbers remembered in this browser.
        const ids = readGuestOrders();
        const results = await Promise.allSettled(ids.map((id) => getOrder(id)));
        setOrders(results.filter((r) => r.status === 'fulfilled').map((r) => r.value));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]);

  return (
    <div>
      <PageHeader
        title="My orders"
        subtitle={
          isAuthenticated
            ? `Orders placed by ${user.name}`
            : 'Orders placed from this browser. Log in to keep a permanent history.'
        }
      />

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorBanner message={error} onRetry={load} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No orders yet"
          description="Your first order will show up here with its order number."
          action={
            <Link to="/products">
              <Button>Start shopping</Button>
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
          <table className="min-w-full divide-y divide-stone-200 text-sm">
            <thead className="bg-stone-50 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="hidden px-4 py-3 sm:table-cell">Date</th>
                <th className="hidden px-4 py-3 md:table-cell">Items</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-2 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {orders.map((o) => {
                const status = String(o.status || 'pending').toLowerCase();
                const count = o.items?.reduce((n, i) => n + i.quantity, 0) ?? 0;
                return (
                  <tr key={o.id} className="hover:bg-stone-50/60">
                    <td className="px-4 py-3 font-medium text-stone-900">
                      <Link to={`/orders/${o.id}`} className="hover:text-brand-700">
                        #{o.id}
                      </Link>
                    </td>
                    <td className="hidden px-4 py-3 text-stone-600 sm:table-cell">{formatDate(o.created_at)}</td>
                    <td className="hidden px-4 py-3 text-stone-600 md:table-cell">
                      {count} item{count === 1 ? '' : 's'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[status] || 'neutral'}>{status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-stone-900">{formatPrice(o.total)}</td>
                    <td className="px-2 py-3 text-right">
                      <Link to={`/orders/${o.id}`} className="inline-flex rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-800" aria-label={`View order ${o.id}`}>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
