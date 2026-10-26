import { Link } from 'react-router-dom';
import { Package, Tags, AlertTriangle, Wallet, ArrowRight, Plus } from 'lucide-react';
import useProducts, { uniqueCategories } from '../hooks/useProducts.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatPrice } from '../utils/format.js';
import PageHeader from '../components/PageHeader.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import ErrorBanner from '../components/ui/ErrorBanner.jsx';
import Button from '../components/ui/Button.jsx';
import Badge, { stockLabel, stockTone } from '../components/ui/Badge.jsx';

function StatCard({ icon: Icon, label, value, tone = 'brand', to }) {
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

export default function Dashboard() {
  const { user } = useAuth();
  const { products, loading, error, refresh } = useProducts();

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} onRetry={refresh} />;

  const categories = uniqueCategories(products);
  const lowStock = products.filter((p) => Number(p.quantity) > 0 && Number(p.quantity) <= 5);
  const outOfStock = products.filter((p) => Number(p.quantity) <= 0);
  const inventoryValue = products.reduce(
    (sum, p) => sum + Number(p.price) * Number(p.quantity),
    0,
  );
  const attention = [...outOfStock, ...lowStock].slice(0, 6);

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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Package} label="Products" value={products.length} to="/dashboard/products" />
        <StatCard icon={Tags} label="Categories" value={categories.length} tone="neutral" />
        <StatCard
          icon={AlertTriangle}
          label="Need restocking"
          value={lowStock.length + outOfStock.length}
          tone={lowStock.length + outOfStock.length > 0 ? 'warning' : 'success'}
          to="/dashboard/products?filter=low"
        />
        <StatCard
          icon={Wallet}
          label="Inventory value"
          value={formatPrice(inventoryValue)}
          tone="success"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-stone-200 bg-white lg:col-span-2">
          <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
            <h2 className="font-semibold text-stone-900">Needs attention</h2>
            <Link
              to="/dashboard/products?filter=low"
              className="inline-flex items-center gap-1 text-sm text-brand-700 hover:underline"
            >
              Manage stock <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {attention.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-stone-500">
              Every product is well stocked. Nice work.
            </p>
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
                    <Link
                      to={`/dashboard/products?edit=${p.id}`}
                      className="text-sm text-brand-700 hover:underline"
                    >
                      Restock
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-stone-200 bg-white">
          <div className="border-b border-stone-200 px-5 py-4">
            <h2 className="font-semibold text-stone-900">Categories</h2>
          </div>
          {categories.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-stone-500">No categories yet.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {categories.map((c) => {
                const count = products.filter((p) => p.category === c).length;
                return (
                  <li key={c} className="flex items-center justify-between px-5 py-3 text-sm">
                    <Link
                      to={`/products?category=${encodeURIComponent(c)}`}
                      className="text-stone-800 hover:text-brand-700"
                    >
                      {c}
                    </Link>
                    <span className="text-stone-500">
                      {count} item{count === 1 ? '' : 's'}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
