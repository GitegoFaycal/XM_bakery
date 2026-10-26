import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatPrice } from '../utils/format.js';
import PageHeader from '../components/PageHeader.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Button from '../components/ui/Button.jsx';
import ProductImage from '../components/ProductImage.jsx';

export default function Cart() {
  const { items, total, count, updateQty, removeItem, clear } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div>
        <PageHeader title="Your cart" />
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Browse the shop and add a few fresh bakes."
          action={
            <Link to="/products">
              <Button>Go to the shop</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Your cart"
        subtitle={`${count} item${count === 1 ? '' : 's'}`}
        actions={
          <Button variant="ghost" size="sm" onClick={clear}>
            <Trash2 className="h-4 w-4" /> Clear cart
          </Button>
        }
      />

      <div className="grid gap-8 lg:grid-cols-3">
        <ul className="space-y-3 lg:col-span-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex gap-4 rounded-xl border border-stone-200 bg-white p-4"
            >
              <ProductImage
                product={item}
                className="h-20 w-20 shrink-0 rounded-lg"
                iconClass="h-8 w-8"
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      to={`/products/${item.id}`}
                      className="truncate font-semibold text-stone-900 hover:text-brand-700"
                    >
                      {item.name}
                    </Link>
                    {item.category && <p className="text-xs text-stone-500">{item.category}</p>}
                  </div>
                  <p className="font-semibold text-stone-900">
                    {formatPrice(item.qty * item.price)}
                  </p>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="inline-flex items-center rounded-lg border border-stone-300">
                    <button
                      className="p-1.5 text-stone-600 hover:bg-stone-100"
                      onClick={() => updateQty(item.id, item.qty - 1)}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                    <button
                      className="p-1.5 text-stone-600 hover:bg-stone-100 disabled:opacity-40"
                      onClick={() => updateQty(item.id, item.qty + 1)}
                      disabled={item.qty >= item.stock}
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-stone-500">
                    <span>{formatPrice(item.price)} each</span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="inline-flex items-center gap-1 text-red-600 hover:underline"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-xl border border-stone-200 bg-white p-5 lg:sticky lg:top-24">
          <h2 className="font-semibold text-stone-900">Order summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-stone-600">
              <dt>Subtotal</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
            <div className="flex justify-between text-stone-600">
              <dt>Pickup</dt>
              <dd>Free</dd>
            </div>
            <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-semibold text-stone-900">
              <dt>Total</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
          </dl>
          <Button size="lg" className="mt-5 w-full" onClick={() => navigate('/checkout')}>
            Checkout <ArrowRight className="h-4 w-4" />
          </Button>
          {!isAuthenticated && (
            <p className="mt-2 text-center text-xs text-stone-500">No account needed</p>
          )}
          <Link
            to="/products"
            className="mt-3 block text-center text-sm text-brand-700 hover:underline"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
