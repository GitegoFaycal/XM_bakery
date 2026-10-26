import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Pencil, Plus, Search, Trash2, PackageOpen, ExternalLink } from 'lucide-react';
import useProducts, { uniqueCategories } from '../hooks/useProducts.js';
import { createProduct, deleteProduct, updateProduct } from '../api/products.js';
import { useToast } from '../context/ToastContext.jsx';
import { formatPrice } from '../utils/format.js';
import PageHeader from '../components/PageHeader.jsx';
import ProductForm from '../components/ProductForm.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import ErrorBanner from '../components/ui/ErrorBanner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import Button from '../components/ui/Button.jsx';
import Badge, { stockLabel, stockTone } from '../components/ui/Badge.jsx';
import ProductImage from '../components/ProductImage.jsx';

export default function ManageProducts() {
  const { products, setProducts, loading, error, refresh } = useProducts();
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(params.get('filter') || 'all');
  const [editing, setEditing] = useState(null); // null | 'new' | product
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);

  // Deep links: ?new=1 opens the create form, ?edit=<id> opens that product.
  useEffect(() => {
    if (loading) return;
    if (params.get('new')) {
      setEditing('new');
    } else if (params.get('edit')) {
      const target = products.find((p) => String(p.id) === params.get('edit'));
      if (target) setEditing(target);
      else toast.error('That product no longer exists.');
    } else {
      return;
    }
    const next = new URLSearchParams(params);
    next.delete('new');
    next.delete('edit');
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, products]);

  const categories = useMemo(() => uniqueCategories(products), [products]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products
      .filter((p) => {
        const qty = Number(p.quantity);
        if (filter === 'low') return qty <= 5;
        if (filter === 'out') return qty <= 0;
        return true;
      })
      .filter((p) => !q || p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, search, filter]);

  const closeForm = () => setEditing(null);

  const handleSave = async (values) => {
    setSaving(true);
    try {
      if (editing === 'new') {
        const res = await createProduct(values);
        const created = {
          id: res.productId,
          name: values.name.trim(),
          category: values.category.trim() || null,
          price: Number(values.price),
          quantity: Number(values.quantity),
        };
        setProducts((prev) => [...prev, created]);
        toast.success(`${created.name} created`);
      } else {
        await updateProduct(editing.id, values);
        setProducts((prev) =>
          prev.map((p) =>
            p.id === editing.id
              ? {
                  ...p,
                  name: values.name.trim(),
                  category: values.category.trim() || null,
                  price: Number(values.price),
                  quantity: Number(values.quantity),
                }
              : p,
          ),
        );
        toast.success('Product updated');
      }
      closeForm();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setSaving(true);
    try {
      await deleteProduct(deleting.id);
      setProducts((prev) => prev.filter((p) => p.id !== deleting.id));
      toast.success(`${deleting.name} deleted`);
      setDeleting(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'low', label: 'Low stock' },
    { key: 'out', label: 'Out of stock' },
  ];

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Create, edit and remove items on the shelf."
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" /> Add product
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="input pl-9"
            aria-label="Search products"
          />
        </div>
        <div className="inline-flex rounded-lg border border-stone-300 bg-white p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                filter === f.key ? 'bg-brand-600 text-white' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorBanner message={error} onRetry={refresh} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title={products.length === 0 ? 'No products yet' : 'Nothing matches'}
          description={
            products.length === 0
              ? 'Add your first product to start selling.'
              : 'Try another search or filter.'
          }
          action={
            products.length === 0 && (
              <Button onClick={() => setEditing('new')}>
                <Plus className="h-4 w-4" /> Add product
              </Button>
            )
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="min-w-full divide-y divide-stone-200 text-sm">
            <thead className="bg-stone-50 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {visible.map((p) => (
                <tr key={p.id} className="hover:bg-stone-50/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <ProductImage product={p} className="h-10 w-10 rounded-lg" iconClass="h-5 w-5" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-stone-900">{p.name}</p>
                        <p className="text-xs text-stone-400">ID {p.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{p.category || '-'}</td>
                  <td className="px-4 py-3 text-right font-medium text-stone-900">
                    {formatPrice(p.price)}
                  </td>
                  <td className="px-4 py-3 text-right text-stone-700">{p.quantity}</td>
                  <td className="px-4 py-3">
                    <Badge tone={stockTone(p.quantity)}>{stockLabel(p.quantity)}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link
                        to={`/products/${p.id}`}
                        className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-800"
                        title="View in shop"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => setEditing(p)}
                        className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-800"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleting(p)}
                        className="rounded-lg p-2 text-stone-500 hover:bg-red-50 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={editing !== null}
        onClose={saving ? undefined : closeForm}
        title={editing === 'new' ? 'Add product' : `Edit ${editing?.name ?? ''}`}
      >
        <ProductForm
          initial={editing && editing !== 'new' ? editing : null}
          categories={categories}
          onSubmit={handleSave}
          onCancel={closeForm}
          submitting={saving}
        />
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => !saving && setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete product"
        message={`"${deleting?.name}" will be permanently removed from the shop. This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={saving}
      />
    </div>
  );
}
