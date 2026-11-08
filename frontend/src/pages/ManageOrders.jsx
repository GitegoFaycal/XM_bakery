import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Search, RefreshCw, Phone, StickyNote, ExternalLink } from 'lucide-react';
import { getAllOrders, updateOrder, ORDER_STATUSES, PAYMENT_STATUSES } from '../api/orders.js';
import { useToast } from '../context/ToastContext.jsx';
import { formatDate, formatPrice } from '../utils/format.js';
import PageHeader from '../components/PageHeader.jsx';
import AdminTabs from '../components/AdminTabs.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import ErrorBanner from '../components/ui/ErrorBanner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import { STATUS_LABEL, STATUS_TONE } from './Orders.jsx';

const PAYMENT_LABEL = { unpaid: 'Unpaid', paid: 'Paid', refunded: 'Refunded' };
const PAYMENT_TONE = { unpaid: 'warning', paid: 'success', refunded: 'neutral' };

// The natural next step for the "advance" button.
const NEXT_STATUS = { pending: 'processing', processing: 'ready', ready: 'collected' };
const NEXT_LABEL = { pending: 'Start preparing', processing: 'Mark ready', ready: 'Mark collected' };

export default function ManageOrders() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('open'); // open | all | <status>
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const applyUpdate = async (order, patch, successMessage) => {
    setBusyId(order.id);
    try {
      const res = await updateOrder(order.id, patch);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? res.order : o)));
      toast.success(successMessage);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const confirmCancel = async () => {
    if (!cancelling) return;
    await applyUpdate(cancelling, { status: 'cancelled' }, `Order #${cancelling.id} cancelled, stock restored`);
    setCancelling(null);
  };

  const counts = useMemo(() => {
    const c = { open: 0, all: orders.length };
    for (const s of ORDER_STATUSES) c[s] = 0;
    for (const o of orders) {
      c[o.status] = (c[o.status] || 0) + 1;
      if (!['collected', 'cancelled'].includes(o.status)) c.open += 1;
    }
    return c;
  }, [orders]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter === 'open' && ['collected', 'cancelled'].includes(o.status)) return false;
      if (filter !== 'open' && filter !== 'all' && o.status !== filter) return false;
      if (!q) return true;
      return (
        String(o.id) === q.replace('#', '') ||
        o.customer_name?.toLowerCase().includes(q) ||
        o.phone?.replace(/\s/g, '').includes(q.replace(/\s/g, '')) ||
        o.email?.toLowerCase().includes(q) ||
        o.items?.some((i) => i.product_name.toLowerCase().includes(q))
      );
    });
  }, [orders, filter, search]);

  const FILTERS = [
    { key: 'open', label: 'Open' },
    ...ORDER_STATUSES.map((s) => ({ key: s, label: STATUS_LABEL[s] })),
    { key: 'all', label: 'All' },
  ];

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle="Move orders through preparation, take payment at the counter, cancel if needed."
        actions={
          <Button variant="secondary" size="sm" onClick={load} loading={loading}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        }
      />
      <AdminTabs />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order #, name, phone or product…"
            className="input pl-9"
            aria-label="Search orders"
          />
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg border border-stone-300 bg-white p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                filter === f.key ? 'bg-brand-700 text-white' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {f.label}
              <span className={`ml-1.5 ${filter === f.key ? 'text-white/80' : 'text-stone-400'}`}>{counts[f.key] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorBanner message={error} onRetry={load} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={orders.length === 0 ? 'No orders yet' : 'Nothing matches'}
          description={orders.length === 0 ? 'Orders placed in the shop will appear here.' : 'Try another filter or search.'}
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((o) => {
            const open = expanded === o.id;
            const busy = busyId === o.id;
            const next = NEXT_STATUS[o.status];
            const itemCount = o.items.reduce((n, i) => n + i.quantity, 0);
            return (
              <li key={o.id} className="rounded-xl border border-stone-200 bg-white">
                <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
                  <button
                    onClick={() => setExpanded(open ? null : o.id)}
                    className="flex min-w-0 flex-1 items-center gap-4 text-left"
                    aria-expanded={open}
                  >
                    <span className="font-display text-xl font-bold text-stone-900">#{o.id}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-stone-900">
                        {o.customer_name}
                        {o.user_id == null && <span className="ml-2 text-xs font-normal text-stone-400">guest</span>}
                      </p>
                      <p className="truncate text-xs text-stone-500">
                        {formatDate(o.created_at)} · {itemCount} item{itemCount === 1 ? '' : 's'} ·{' '}
                        {o.items.map((i) => `${i.quantity}× ${i.product_name}`).join(', ')}
                      </p>
                    </div>
                  </button>

                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    <span className="mr-2 font-semibold text-stone-900">{formatPrice(o.total)}</span>
                    <Badge tone={STATUS_TONE[o.status] || 'neutral'}>{STATUS_LABEL[o.status] || o.status}</Badge>
                    <Badge tone={PAYMENT_TONE[o.payment_status] || 'neutral'}>{PAYMENT_LABEL[o.payment_status] || o.payment_status}</Badge>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 bg-stone-50/60 px-4 py-3">
                  {next && (
                    <Button size="sm" onClick={() => applyUpdate(o, { status: next }, `Order #${o.id}: ${STATUS_LABEL[next]}`)} loading={busy}>
                      {NEXT_LABEL[o.status]}
                    </Button>
                  )}
                  {o.payment_status !== 'paid' && o.status !== 'cancelled' && (
                    <Button size="sm" variant="secondary" onClick={() => applyUpdate(o, { payment_status: 'paid' }, `Order #${o.id} marked paid`)} disabled={busy}>
                      Mark paid
                    </Button>
                  )}
                  {o.status === 'cancelled' && o.payment_status === 'paid' && (
                    <Button size="sm" variant="secondary" onClick={() => applyUpdate(o, { payment_status: 'refunded' }, `Order #${o.id} marked refunded`)} disabled={busy}>
                      Mark refunded
                    </Button>
                  )}
                  <label className="ml-auto flex items-center gap-2 text-xs text-stone-500">
                    Status
                    <select
                      value={o.status}
                      onChange={(e) => {
                        const s = e.target.value;
                        if (s === 'cancelled') setCancelling(o);
                        else applyUpdate(o, { status: s }, `Order #${o.id}: ${STATUS_LABEL[s]}`);
                      }}
                      disabled={busy}
                      className="input h-8 w-40 py-0 text-xs"
                      aria-label={`Status of order ${o.id}`}
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-stone-500">
                    Payment
                    <select
                      value={o.payment_status}
                      onChange={(e) => applyUpdate(o, { payment_status: e.target.value }, `Order #${o.id}: ${PAYMENT_LABEL[e.target.value]}`)}
                      disabled={busy}
                      className="input h-8 w-32 py-0 text-xs"
                      aria-label={`Payment of order ${o.id}`}
                    >
                      {PAYMENT_STATUSES.map((s) => (
                        <option key={s} value={s}>{PAYMENT_LABEL[s]}</option>
                      ))}
                    </select>
                  </label>
                </div>

                {open && (
                  <div className="grid gap-4 border-t border-stone-100 px-4 py-4 text-sm md:grid-cols-2">
                    <ul className="divide-y divide-stone-100">
                      {o.items.map((i) => (
                        <li key={i.id} className="flex justify-between py-1.5">
                          <span className="text-stone-700">{i.quantity} × {i.product_name}</span>
                          <span className="text-stone-900">{formatPrice(i.quantity * i.price)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="space-y-1.5 text-stone-600">
                      {o.phone && (
                        <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {o.phone}</p>
                      )}
                      {o.email && <p>{o.email}</p>}
                      {o.note && (
                        <p className="flex items-start gap-2"><StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {o.note}</p>
                      )}
                      <Link to={`/orders/${o.id}`} className="inline-flex items-center gap-1 text-brand-700 hover:underline">
                        <ExternalLink className="h-3.5 w-3.5" /> Open receipt view
                      </Link>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={cancelling !== null}
        onClose={() => busyId === null && setCancelling(null)}
        onConfirm={confirmCancel}
        title="Cancel order"
        message={`Cancel order #${cancelling?.id} for ${cancelling?.customer_name}? The items go back into stock.`}
        confirmLabel="Cancel order"
        danger
        loading={busyId !== null}
      />
    </div>
  );
}
