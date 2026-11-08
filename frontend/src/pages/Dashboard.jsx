import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, AlertTriangle, Wallet, ArrowRight, Plus, ClipboardList, Clock } from 'lucide-react';
import useProducts, { uniqueCategories } from '../hooks/useProducts.js';
import { getAllOrders } from '../api/orders.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatPrice, formatDate } from '../utils/format.js';
import PageHeader from '../components/PageHeader.jsx';
import AdminTabs from '../components/AdminTabs.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import ErrorBanner from '../components/ui/ErrorBanner.jsx';
import Button from '../components/ui/Button.jsx';
import Badge, { stockLabel, stockTone } from '../components/ui/Badge.jsx';
import { STATUS_LABEL, STATUS_TONE } from './Orders.jsx';

function StatCard({ icon: Icon, label, value, hint, tone = 'brand', to }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-700',
    warning: 'bg-amber-50 text-amber-700',
    success: 'bg-emerald-50 text-emerald-700',
    neutral: 'bg-stone-100 text-stone-700',
  };
  const body = (
    <div className="flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-5">
      <span className={`rounded-lg p-3 ${tones[tone]}`}>
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <p className="text-sm text-stone-500">{label}</p>
        <p className="text-2xl font-semibold text-stone-900">{value}</p>
        {hint && <p className="text-xs text-stone-400">{hint}</p>}
      </div>
    </div>
  );
  return to ? (
    <Link to={to} className="block transition hover:-translate-y-0.5">
      {body}
    </Link>
  ) : (
    body
  );
}

const isToday = (iso) => {
  const d = new Date(iso.replace(' ', 'T') + 'Z');
  const now = new Date();
  return d.toDateString() === now.toDateString();
};

export default function Dashboard() {
  const { user } = useAuth();
  const { products, loading: loadingProducts, error: productsError, refresh } = useProducts();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState(null);

  const loadOrders = async () => {
    setLoadingOrders(true);
    setOrdersError(null);
    try {
      const data = await getAllOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setOrdersError(err.message);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  if (loadingProducts || loadingOrders) return <Spinner />;
  if (productsError) return <ErrorBanner message={productsError} onRetry={refresh} />;
  if (ordersError) return <ErrorBanner message={ordersError} onRetry={loadOrders} />;

  const categories = uniqueCategories(products);
  const lowStock = products.filter((p) => Number(p.quantity) > 0 && Number(p.quantity) <= 5);
  const outOfStock = products.filter((p) => Number(p.quantity) <= 0);
  const inventoryValue = products.reduce((sum, p) => sum + Number(p.price) * Number(p.quantity), 0);
  const attention = [...outOfStock, ...lowStock].slice(0, 6);

  const openOrders = orders.filter((o) => !['collected', 'cancelled'].includes(o.status));
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const todaysOrders = orders.filter((o) => o.created_at && isToday(o.created_at) && o.status !== 'cancelled');
  const todaysRevenue = todaysOrders.reduce((s, o) => s + Number(o.total), 0);
  const unpaidReady = orders.filter((o) => o.status === 'ready' && o.payment_status !== 'paid');
  const recent = orders.slice(0, 6);

  return (
    <div>
      <PageHeader
        title={`Hello, ${user.name.split(' ')[0]}`}
        subtitle="Here is how the bakery is looking today."
        actions={
          <Link to="/dashboard/products?new=1">
            <Button>
              <Plus className="h-4 w-4" /> Add product
            </Button>
          </Link>
        }
      />
      <AdminTabs />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Clock}
          label="Open orders"
          value={openOrders.length}
          hint={`${pendingOrders.length} waiting to start`}
          tone={pendingOrders.length > 0 ? 'warning' : 'success'}
          to="/dashboard/orders"
        />
        <StatCard
          icon={ClipboardList}
          label="Today's orders"
          value={todaysOrders.length}
          hint={`${formatPrice(todaysRevenue)} in sales`}
          to="/dashboard/orders"
        />
        <StatCard
          icon={AlertTriangle}
          label="Need restocking"
          value={lowStock.length + outOfStock.length}
          hint={`${outOfStock.length} sold out`}
          tone={lowStock.length + outOfStock.length > 0 ? 'warning' : 'success'}
          to="/dashboard/products?filter=low"
        />
        <StatCard
          icon={Wallet}
          label="Stock value"
          value={formatPrice(inventoryValue)}
          hint={`${products.length} products, ${categories.length} categories`}
          tone="success"
          to="/dashboard/products"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-stone-200 bg-white">
          <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
            <h2 className="font-semibold text-stone-900">Latest orders</h2>
            <Link to="/dashboard/orders" className="inline-flex items-center gap-1 text-sm text-brand-700 hover:underline">
              Manage orders <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-stone-500">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {recent.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-stone-900">
                      #{o.id} · {o.customer_name}
                    </p>
                    <p className="text-xs text-stone-500">
                      {formatDate(o.created_at)} · {formatPrice(o.total)}
                    </p>
                  </div>
                  <Badge tone={STATUS_TONE[o.status] || 'neutral'}>{STATUS_LABEL[o.status] || o.status}</Badge>
                </li>
              ))}
            </ul>
          )}
          {unpaidReady.length > 0 && (
            <p className="border-t border-stone-100 bg-amber-50 px-5 py-3 text-xs text-amber-800">
              {unpaidReady.length} ready order{unpaidReady.length === 1 ? ' is' : 's are'} waiting for payment at the counter.
            </p>
          )}
        </section>

        <section className="rounded-xl border border-stone-200 bg-white">
          <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
            <h2 className="font-semibold text-stone-900">Needs restocking</h2>
            <Link to="/dashboard/products?filter=low" className="inline-flex items-center gap-1 text-sm text-brand-700 hover:underline">
              Manage stock <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {attention.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-stone-500">Every product is well stocked. Nice work.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {attention.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-stone-900">{p.name}</p>
                    <p className="text-xs text-stone-500">{p.category || 'Uncategorised'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={stockTone(p.quantity)}>{stockLabel(p.quantity)}</Badge>
                    <Link to={`/dashboard/products?edit=${p.id}`} className="text-sm text-brand-700 hover:underline">
                      Restock
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
