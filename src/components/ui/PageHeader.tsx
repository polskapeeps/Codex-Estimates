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
    <header className="mb-4 flex items-start gap-3">
      {back && (
        <button
          type="button"
          aria-label="Back"
          onClick={() => (typeof back === 'string' ? navigate(back) : navigate(-1))}
          className="-ml-1 mt-0.5 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
        >
          <ChevronLeftIcon size={22} />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <div className="mt-0.5 text-sm text-slate-500">{subtitle}</div>}
      </div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </header>
  );
}
