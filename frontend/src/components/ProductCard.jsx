import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { formatPrice } from '../utils/format.js';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Badge, { stockLabel, stockTone } from './ui/Badge.jsx';
import Button from './ui/Button.jsx';
import ProductImage from './ProductImage.jsx';

export default function ProductCard({ product }) {
  const { addItem, items } = useCart();
  const toast = useToast();
  const inCart = items.find((i) => i.id === product.id)?.qty || 0;
  const stock = Number(product.quantity);
  const soldOut = stock <= 0;
  const maxed = inCart >= stock;

  const handleAdd = () => {
    addItem(product, 1);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link to={`/products/${product.id}`} className="block">
        <ProductImage product={product} className="h-40 w-full" />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {product.category && (
              <p className="text-xs font-medium uppercase tracking-wide text-brand-700">
                {product.category}
              </p>
            )}
            <Link
              to={`/products/${product.id}`}
              className="line-clamp-2 font-semibold text-stone-900 hover:text-brand-700"
            >
              {product.name}
            </Link>
          </div>
          <p className="shrink-0 font-semibold text-stone-900">{formatPrice(product.price)}</p>
        </div>
        <Badge tone={stockTone(stock)} className="self-start">
          {stockLabel(stock)}
        </Badge>
        <div className="mt-auto pt-2">
          <Button
            className="w-full"
            size="sm"
            onClick={handleAdd}
            disabled={soldOut || maxed}
            title={maxed && !soldOut ? 'You already have all available stock in your cart' : undefined}
          >
            <Plus className="h-4 w-4" />
            {soldOut ? 'Sold out' : inCart > 0 ? `In cart (${inCart})` : 'Add to cart'}
          </Button>
        </div>
      </div>
    </article>
  );
}
