import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ShoppingBag, Pencil } from 'lucide-react';
import { getProduct } from '../api/products.js';
import { formatPrice } from '../utils/format.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import ErrorBanner from '../components/ui/ErrorBanner.jsx';
import Button from '../components/ui/Button.jsx';
import Badge, { stockLabel, stockTone } from '../components/ui/Badge.jsx';
import ProductImage from '../components/ProductImage.jsx';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, items } = useCart();
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qty, setQty] = useState(1);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setProduct(await getProduct(id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} onRetry={load} />;
  if (!product) return null;

  const stock = Number(product.quantity);
  const inCart = items.find((i) => i.id === product.id)?.qty || 0;
  const remaining = Math.max(0, stock - inCart);
  const soldOut = stock <= 0;

  const handleAdd = () => {
    addItem(product, qty);
    toast.success(`Added ${qty} × ${product.name} to cart`);
    setQty(1);
  };

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-1 text-sm text-stone-600 hover:text-stone-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid gap-8 lg:grid-cols-2">
        <ProductImage
          product={product}
          className="aspect-square w-full rounded-2xl"
          iconClass="h-32 w-32"
        />

        <div className="flex flex-col">
          {product.category && (
            <Link
              to={`/products?category=${encodeURIComponent(product.category)}`}
              className="text-sm font-medium uppercase tracking-wide text-brand-700 hover:underline"
            >
              {product.category}
            </Link>
          )}
          <h1 className="mt-1 font-display text-3xl font-bold text-stone-900 sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-4 text-3xl font-semibold text-stone-900">{formatPrice(product.price)}</p>
          <div className="mt-3 flex items-center gap-3">
            <Badge tone={stockTone(stock)}>{stockLabel(stock)}</Badge>
            {stock > 0 && <span className="text-sm text-stone-500">{stock} available</span>}
          </div>

          <div className="mt-8 rounded-xl border border-stone-200 bg-white p-5">
            {soldOut ? (
              <p className="text-sm text-stone-600">
                This item is currently sold out. Check back tomorrow morning.
              </p>
            ) : remaining === 0 ? (
              <p className="text-sm text-stone-600">
                You already have all {stock} available in your cart.
              </p>
            ) : (
              <>
                <p className="label">Quantity</p>
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center rounded-lg border border-stone-300">
                    <button
                      className="p-2 text-stone-600 hover:bg-stone-100 disabled:opacity-40"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      disabled={qty <= 1}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-10 text-center text-sm font-medium">{qty}</span>
                    <button
                      className="p-2 text-stone-600 hover:bg-stone-100 disabled:opacity-40"
                      onClick={() => setQty((q) => Math.min(remaining, q + 1))}
                      disabled={qty >= remaining}
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-sm text-stone-500">
                    Subtotal {formatPrice(qty * Number(product.price))}
                  </span>
                </div>
                <Button size="lg" className="mt-4 w-full" onClick={handleAdd}>
                  <ShoppingBag className="h-4 w-4" /> Add to cart
                </Button>
              </>
            )}
            {inCart > 0 && (
              <p className="mt-3 text-center text-xs text-stone-500">
                {inCart} already in your cart ·{' '}
                <Link to="/cart" className="text-brand-700 hover:underline">
                  View cart
                </Link>
              </p>
            )}
          </div>

          {isAuthenticated && (
            <Link
              to={`/dashboard/products?edit=${product.id}`}
              className="mt-4 inline-flex items-center gap-1 self-start text-sm text-stone-500 hover:text-stone-800"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit this product
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
