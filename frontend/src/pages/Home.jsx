import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Leaf, Truck } from 'lucide-react';
import useProducts from '../hooks/useProducts.js';
import ProductCard from '../components/ProductCard.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import ErrorBanner from '../components/ui/ErrorBanner.jsx';
import Button from '../components/ui/Button.jsx';

const PERKS = [
  { icon: Clock, title: 'Baked at dawn', text: 'Every loaf and pastry comes out of the oven the same morning you buy it.' },
  { icon: Leaf, title: 'Honest ingredients', text: 'Local flour, real butter and eggs. No shortcuts, no preservatives.' },
  { icon: Truck, title: 'Order ahead', text: 'Reserve your favourites online and pick them up warm from the counter.' },
];

export default function Home() {
  const { products, loading, error, refresh } = useProducts();
  const featured = [...products]
    .filter((p) => Number(p.quantity) > 0)
    .sort((a, b) => Number(b.quantity) - Number(a.quantity))
    .slice(0, 4);

  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-3xl bg-brand-900 px-6 py-16 text-white sm:px-12 sm:py-24">
        <img
          src="/images/hero.jpg"
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-linear-to-r from-brand-950/90 via-brand-900/70 to-brand-900/30" />
        <div className="relative max-w-2xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-100">
            Welcome to XM Bakery
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight sm:text-6xl">
            Fresh bread, cakes &amp; pastries, every single day.
          </h1>
          <p className="mt-5 max-w-xl text-base text-brand-50 sm:text-lg">
            Browse the shelves, fill your basket and pick up your order warm from the oven.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/products">
              <Button size="lg" variant="light">
                Shop the bakery <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="outlineLight">
                Create an account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        {PERKS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-xl border border-stone-200 bg-white p-6">
            <div className="mb-3 inline-flex rounded-lg bg-brand-50 p-2 text-brand-700">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-stone-900">{title}</h3>
            <p className="mt-1 text-sm text-stone-500">{text}</p>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-stone-900">Fresh on the shelf</h2>
            <p className="text-sm text-stone-500">Our most plentiful bakes right now.</p>
          </div>
          <Link to="/products" className="text-sm font-medium text-brand-700 hover:underline">
            View all
          </Link>
        </div>
        {loading ? (
          <Spinner />
        ) : error ? (
          <ErrorBanner message={error} onRetry={refresh} />
        ) : featured.length === 0 ? (
          <p className="rounded-xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
            Nothing on the shelf yet. Add products from the dashboard to see them here.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
