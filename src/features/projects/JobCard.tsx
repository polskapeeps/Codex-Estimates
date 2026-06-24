import { Link } from 'react-router-dom';
import { StatusChip } from '../../components/ui';
import { PaintRollerIcon, FileTextIcon } from '../../components/icons';
import { formatMoneyWhole } from '../../lib/money';
import { formatRelative } from '../../lib/format';
import type { JobRow } from './jobsQuery';

export function JobCard({ row }: { row: JobRow }) {
  const { project, clientName, expected, low, high } = row;
  const TradeIcon = project.trade === 'painting' ? PaintRollerIcon : FileTextIcon;

  return (
    <Link
      to={`/jobs/${project.id}`}
      className="flex items-center gap-3.5 px-4 py-4 hover:bg-brand-600/[0.045] sm:gap-4 sm:px-[22px]"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-brand-600/25 bg-brand-600/[0.1] text-brand-500">
        <TradeIcon size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold text-slate-900 sm:text-base">
          {project.title}
        </p>
        <p className="mt-0.5 truncate text-[13px] text-slate-400 sm:text-[13.5px]">
          {clientName} · {formatRelative(project.updatedAt)}
        </p>
      </div>
      <div className="shrink-0 text-right">
        {expected != null ? (
          <p className="text-[15px] font-bold tabular-nums text-slate-200 sm:text-base">
            {formatMoneyWhole(expected)}
          </p>
        ) : (
          <p className="text-xs text-slate-400">No estimate</p>
        )}
        <div className="mt-1.5 flex justify-end">
          <StatusChip status={project.status} />
        </div>
        {expected != null && low != null && high != null && (
          <span className="sr-only">
            Range {formatMoneyWhole(low)}–{formatMoneyWhole(high)}
          </span>
        )}
      </div>
    </Link>
  );
}
