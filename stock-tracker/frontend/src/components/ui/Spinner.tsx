import { cn } from '@/lib/utils';
import { IconSpinner } from '@/lib/icons';

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface SpinnerProps {
  size?:       SpinnerSize;
  className?:  string;
  label?:      string;
  'aria-hidden'?: boolean;
}

const spinnerSizes: Record<SpinnerSize, number> = {
  xs: 12, sm: 16, md: 20, lg: 28, xl: 40,
};

export function Spinner({
  size        = 'md',
  className,
  label       = 'Loading…',
  'aria-hidden': ariaHidden,
}: SpinnerProps) {
  return (
    <span
      role={ariaHidden ? undefined : 'status'}
      aria-label={ariaHidden ? undefined : label}
      aria-hidden={ariaHidden}
    >
      <IconSpinner
        size={spinnerSizes[size]}
        aria-hidden="true"
        className={cn('animate-spin text-emerald-400', className)}
      />
    </span>
  );
}

export default Spinner;