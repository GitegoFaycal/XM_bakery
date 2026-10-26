import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, PackageOpen, SlidersHorizontal } from 'lucide-react';
import useProducts, { uniqueCategories } from '../hooks/useProducts.js';
import ProductCard from '../components/ProductCard.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import ErrorBanner from '../components/ui/ErrorBanner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Button from '../components/ui/Button.jsx';

const SORTS = {
  name: { label: 'Name A–Z', fn: (a, b) => a.name.localeCompare(b.name) },
  'price-asc': { label: 'Price: low to high', fn: (a, b) => Number(a.price) - Number(b.price) },
  'price-desc': { label: 'Price: high to low', fn: (a, b) => Number(b.price) - Number(a.price) },
  stock: { label: 'Most in stock', fn: (a, b) => Number(b.quantity) - Number(a.quantity) },
};

export default function Products() {
  const { products, loading, error, refresh } = useProducts();
  const [params, setParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const query = params.get('q') || '';
  const category = params.get('category') || '';
  const sort = params.get('sort') in SORTS ? params.get('sort') : 'name';
  const inStockOnly = params.get('stock') === '1';

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const categories = useMemo(() => uniqueCategories(products), [products]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => !category || p.category === category)
      .filter((p) => !inStockOnly || Number(p.quantity) > 0)
      .filter(
        (p) =>
          !q ||
          p.name?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q),
      )
      .sort(SORTS[sort].fn);
  }, [products, query, category, inStockOnly, sort]);

  const hasFilters = query || category || inStockOnly || sort !== 'name';

  return (
    <div>
      <PageHeader
        title="Shop"
        subtitle={
          loading ? 'Loading the shelves…' : `${visible.length} of ${products.length} products`
        }
      />

      <div className="mb-6 flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => update('q', e.target.value)}
            placeholder="Search bread, cakes, pastries…"
            className="input pl-9"
            aria-label="Search products"
          />
        </div>
        <Button
          variant="secondary"
          className="md:hidden"
          onClick={() => setShowFilters((s) => !s)}
        >
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </Button>
        <div className={`${showFilters ? 'flex' : 'hidden'} flex-col gap-3 md:flex md:flex-row`}>
          <select
            value={category}
            onChange={(e) => update('category', e.target.value)}
            className="input md:w-44"
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => update('sort', e.target.value === 'name' ? '' : e.target.value)}
            className="input md:w-48"
            aria-label="Sort products"
          >
            {Object.entries(SORTS).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => update('stock', e.target.checked ? '1' : '')}
              className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-300"
            />
            In stock only
          </label>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => update('category', '')}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              !category ? 'bg-brand-600 text-white' : 'bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50'
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => update('category', c === category ? '' : c)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                c === category
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorBanner message={error} onRetry={refresh} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title={hasFilters ? 'No products match your filters' : 'The shelves are empty'}
          description={
            hasFilters
              ? 'Try a different search term or clear the filters.'
              : 'Products added from the dashboard will appear here.'
          }
          action={
            hasFilters && (
              <Button variant="secondary" onClick={() => setParams({}, { replace: true })}>
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
