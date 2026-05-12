import { cn } from '@/lib/utils';
import { IconSuccess, IconError, IconWarning, IconInfo } from '@/lib/icons';
import type { LucideIcon } from 'lucide-react';

type AlertBannerVariant = 'error' | 'success' | 'warning' | 'info';

interface AlertBannerProps {
  variant?:   AlertBannerVariant;
  children:   React.ReactNode;
  className?: string;
}

const alertConfig: Record<
  AlertBannerVariant,
  { classes: string; Icon: LucideIcon }
> = {
  error:   { classes: 'bg-red-500/10    border-red-500/30    text-red-400',    Icon: IconError   },
  success: { classes: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400', Icon: IconSuccess },
  warning: { classes: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400', Icon: IconWarning  },
  info:    { classes: 'bg-blue-500/10   border-blue-500/30   text-blue-400',   Icon: IconInfo     },
};

export function AlertBanner({ variant = 'error', children, className }: AlertBannerProps) {
  const { classes, Icon } = alertConfig[variant];
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'flex items-start gap-2.5 text-sm px-3.5 py-2.5 rounded-lg border',
        classes,
        className
      )}
    >
      <Icon size={15} aria-hidden="true" className="shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}