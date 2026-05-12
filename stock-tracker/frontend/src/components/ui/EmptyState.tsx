import type { LucideIcon } from 'lucide-react';
import { IconInbox } from '@/lib/icons';

interface EmptyStateProps {
  Icon?:        LucideIcon;
  title:        string;
  description?: string;
  action?:      React.ReactNode;
}

export function EmptyState({
  Icon        = IconInbox,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-label={title}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div
        aria-hidden="true"
        className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center mb-4"
      >
        <Icon size={28} className="text-gray-500" />
      </div>
      <h3 className="text-gray-300 font-semibold text-base">{title}</h3>
      {description && (
        <p className="text-gray-500 text-sm mt-1 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
