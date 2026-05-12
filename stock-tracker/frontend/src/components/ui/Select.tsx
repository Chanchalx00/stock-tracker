import { SelectHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?:   string;
  error?:   string;
  options:  { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, id: providedId, required, ...props }, ref) => {
    const autoId  = useId();
    const id      = providedId ?? autoId;
    const errorId = `${id}-error`;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={id} className="text-xs font-medium text-gray-400">
            {label}
            {required && <span aria-hidden="true" className="text-red-400 ml-0.5">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          required={required}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-950',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            error && 'border-red-500/60',
            className
          )}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {error && (
          <p id={errorId} role="alert" className="text-xs text-red-400">{error}</p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';
