import { Loader2 } from 'lucide-react';

export default function Spinner({ label = 'Loading…', className = '' }) {
  return (
    <div
      className={`flex items-center justify-center gap-2 py-16 text-sm text-stone-500 ${className}`}
      role="status"
    >
      <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
      <span>{label}</span>
    </div>
  );
}
