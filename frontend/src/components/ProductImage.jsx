import { useState } from 'react';
import { Cake, Cookie, Croissant, Wheat, CupSoda, Donut, Sandwich } from 'lucide-react';

// The backend stores no image per product yet, so each product gets a photo
// chosen from its category / name. Photos live in public/images (see
// public/images/CREDITS.md). If a product later gets an `image` field, it wins.
const THEMES = [
  { match: /cake|gateau|tart|brownie|muffin|cupcake/i, icon: Cake, photo: 'cakes', bg: 'from-pink-100 to-rose-200', fg: 'text-rose-600' },
  { match: /cookie|biscuit/i, icon: Cookie, photo: 'cookies', bg: 'from-amber-100 to-orange-200', fg: 'text-orange-700' },
  { match: /croissant|pastr|danish|puff|roll|scone/i, icon: Croissant, photo: 'pastries', bg: 'from-yellow-100 to-amber-200', fg: 'text-amber-700' },
  { match: /donut|doughnut|mandazi/i, icon: Donut, photo: 'donuts', bg: 'from-fuchsia-100 to-pink-200', fg: 'text-fuchsia-700' },
  { match: /sandwich|burger|pizza|savou?ry|samosa|pie/i, icon: Sandwich, photo: 'savoury', bg: 'from-lime-100 to-green-200', fg: 'text-green-700' },
  { match: /drink|juice|coffee|tea|soda|milk/i, icon: CupSoda, photo: 'drinks', bg: 'from-sky-100 to-cyan-200', fg: 'text-cyan-700' },
  { match: /bread|loaf|baguette|bun|sourdough/i, icon: Wheat, photo: 'bread', bg: 'from-brand-100 to-brand-200', fg: 'text-brand-700' },
];
const FALLBACK = { icon: Wheat, photo: 'default', bg: 'from-brand-100 to-brand-200', fg: 'text-brand-700' };

export function pickTheme(product) {
  const key = `${product?.category || ''} ${product?.name || ''}`;
  return THEMES.find((t) => t.match.test(key)) || FALLBACK;
}

export function productImageUrl(product) {
  if (product?.image) return product.image;
  return `/images/${pickTheme(product).photo}.jpg`;
}

export default function ProductImage({ product, className = '', iconClass = 'h-12 w-12', alt = '' }) {
  const { icon: Icon, bg, fg } = pickTheme(product);
  const [failed, setFailed] = useState(false);
  const src = productImageUrl(product);

  if (failed) {
    return (
      <div className={`flex items-center justify-center bg-linear-to-br ${bg} ${className}`} aria-hidden="true">
        <Icon className={`${iconClass} ${fg}`} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-stone-100 ${className}`}>
      <img
        src={src}
        alt={alt || product?.name || ''}
        loading="lazy"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
      />
    </div>
  );
}
