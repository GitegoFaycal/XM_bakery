import { useId } from 'react';

export default function Input({ label, error, hint, className = '', id, ...props }) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`input ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : ''}`}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-stone-500">{hint}</p>
      ) : null}
    </div>
  );
}
