const CURRENCY = import.meta.env.VITE_CURRENCY || 'RWF';

const formatter = new Intl.NumberFormat('en-RW', {
  style: 'currency',
  currency: CURRENCY,
  // Show the ISO code ("RWF 3,500") rather than the locale symbol ("RF 3,500").
  currencyDisplay: 'code',
  maximumFractionDigits: CURRENCY === 'RWF' ? 0 : 2,
});

export function formatPrice(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return '-';
  return formatter.format(n);
}

export function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}
