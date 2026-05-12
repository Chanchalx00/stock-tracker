import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?:   boolean;
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

const paddingSizes = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-6' };

export function Card({
  hover   = false,
  padding = 'md',
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'bg-gray-900 border border-gray-800 rounded-xl',
        hover && 'hover:border-gray-700 transition-colors duration-200',
        paddingSizes[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}