import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary:
    'border border-brand-500/20 bg-gradient-to-br from-[#f0ce72] to-[#d6a43c] text-[#1a1407] shadow-[0_8px_22px_rgba(201,150,47,0.28)] hover:-translate-y-px hover:shadow-[0_11px_26px_rgba(201,150,47,0.4)]',
  secondary:
    'border border-white/[0.09] bg-[#1d1810] text-[#c6bca8] hover:border-brand-600/35 hover:bg-brand-600/[0.06] hover:text-[#f3eee1]',
  ghost: 'text-[#a89e8b] hover:bg-white/[0.05] hover:text-[#f3eee1]',
  danger:
    'border border-[#c87b6b]/30 bg-[#c87b6b]/15 text-[#e0a595] hover:bg-[#c87b6b]/25',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-base gap-2',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  leftIcon,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-[13px] font-semibold transition-[transform,box-shadow,border-color,background-color]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[#14110c]',
        'disabled:opacity-50 disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {leftIcon}
      {children}
    </button>
  );
}
