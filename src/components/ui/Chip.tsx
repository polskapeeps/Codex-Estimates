import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export function Chip({
  active,
  onClick,
  children,
  className,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset transition-colors',
        active
          ? 'bg-brand-700 text-white ring-brand-700'
          : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50',
        className,
      )}
    >
      {children}
    </button>
  );
}
