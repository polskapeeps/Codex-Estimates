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
        'whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-semibold',
        active
          ? 'border-brand-600/45 bg-brand-600/[0.13] text-[#f0ce72]'
          : 'border-white/10 bg-transparent text-slate-500 hover:border-brand-600/30 hover:bg-brand-600/[0.05] hover:text-slate-200',
        className,
      )}
    >
      {children}
    </button>
  );
}
