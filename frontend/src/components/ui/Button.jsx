import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-300 disabled:bg-brand-300',
  secondary:
    'bg-white text-stone-800 border border-stone-300 hover:bg-stone-50 focus-visible:ring-stone-300 disabled:text-stone-400',
  ghost: 'text-stone-700 hover:bg-stone-100 focus-visible:ring-stone-300 disabled:text-stone-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-300 disabled:bg-red-300',
  // For use on dark / coloured backgrounds (e.g. the hero banner).
  light: 'bg-white text-brand-800 hover:bg-brand-50 focus-visible:ring-white/60',
  outlineLight: 'border border-white/60 text-white hover:bg-white/15 focus-visible:ring-white/60',
};

const SIZES = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
  icon: 'h-9 w-9',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  children,
  disabled,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
