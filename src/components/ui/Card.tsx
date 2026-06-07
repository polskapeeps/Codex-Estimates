import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm dark:bg-slate-900 dark:ring-slate-800',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
