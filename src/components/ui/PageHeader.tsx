import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon } from '../icons';

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  right?: ReactNode;
  /** Show a back button. `true` = history back; a string = navigate to path. */
  back?: boolean | string;
}

export function PageHeader({ title, subtitle, right, back }: PageHeaderProps) {
  const navigate = useNavigate();
  return (
    <header className="mb-6 flex items-start gap-3 md:mb-7">
      {back && (
        <button
          type="button"
          aria-label="Back"
          onClick={() => (typeof back === 'string' ? navigate(back) : navigate(-1))}
          className="-ml-1 mt-1 rounded-xl p-2 text-slate-500 hover:bg-white/[0.05] hover:text-brand-500"
        >
          <ChevronLeftIcon size={22} />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[28px] font-extrabold leading-tight tracking-[-0.035em] text-slate-900 md:text-[32px]">
          {title}
        </h1>
        {subtitle && <div className="mt-1.5 text-[15px] text-slate-500">{subtitle}</div>}
      </div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </header>
  );
}
