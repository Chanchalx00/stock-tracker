import { cn } from '@/lib/utils';
import { IconArrowUp, IconArrowDown, IconMinus } from '@/lib/icons';

export type BadgeVariant = 'emerald' | 'red' | 'blue' | 'gray' | 'yellow';

interface BadgeProps {
  variant?:    BadgeVariant;
  children:    React.ReactNode;
  className?:  string;
}

const badgeClasses: Record<BadgeVariant, string> = {
  emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  red:     'bg-red-500/15     text-red-400     border-red-500/20',
  blue:    'bg-blue-500/15    text-blue-400    border-blue-500/20',
  gray:    'bg-gray-700/60    text-gray-400    border-gray-600/30',
  yellow:  'bg-yellow-500/15  text-yellow-400  border-yellow-500/20',
};

export function Badge({ variant = 'gray', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border',
        badgeClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}


export function ChangeBadge({ value }: { value: number | null | undefined }) {
  if (value == null) return <Badge variant="gray">—</Badge>;

  if (value > 0) {
    return (
      <Badge variant="emerald" aria-label={`Up ${value.toFixed(2)} percent`}>
        <IconArrowUp size={10} aria-hidden="true" />
        {value.toFixed(2)}%
      </Badge>
    );
  }
  if (value < 0) {
    return (
      <Badge variant="red" aria-label={`Down ${Math.abs(value).toFixed(2)} percent`}>
        <IconArrowDown size={10} aria-hidden="true" />
        {Math.abs(value).toFixed(2)}%
      </Badge>
    );
  }
  return (
    <Badge variant="gray" aria-label="No change">
      <IconMinus size={10} aria-hidden="true" />
      0.00%
    </Badge>
  );
}