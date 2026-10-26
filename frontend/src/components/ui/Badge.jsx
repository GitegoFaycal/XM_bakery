const TONES = {
  neutral: 'bg-stone-100 text-stone-700',
  brand: 'bg-brand-100 text-brand-800',
  success: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-800',
};

export default function Badge({ tone = 'neutral', children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function stockTone(quantity) {
  const q = Number(quantity);
  if (q <= 0) return 'danger';
  if (q <= 5) return 'warning';
  return 'success';
}

export function stockLabel(quantity) {
  const q = Number(quantity);
  if (q <= 0) return 'Out of stock';
  if (q <= 5) return `Only ${q} left`;
  return 'In stock';
}
