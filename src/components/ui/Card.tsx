import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[18px] border border-white/[0.07] bg-[#1d1810] shadow-[0_8px_24px_rgba(0,0,0,0.28)]',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
