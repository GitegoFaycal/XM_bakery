import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button.jsx';

export default function ErrorBanner({ message, onRetry }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center">
      <AlertTriangle className="h-5 w-5 shrink-0" />
      <p className="flex-1">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </Button>
      )}
    </div>
  );
}
