import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm', className)}
      {...rest}
    >
      {children}
    </div>
  );
}
