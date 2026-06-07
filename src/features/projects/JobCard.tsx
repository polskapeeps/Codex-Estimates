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
      className="block rounded-2xl bg-white px-4 py-3.5 ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">{project.title}</p>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-slate-500">
            <TradeIcon size={14} className="shrink-0 text-slate-400" />
            {clientName}
          </p>
        </div>
        <StatusChip status={project.status} />
      </div>
      <div className="mt-2.5 flex items-end justify-between">
        <div>
          {expected != null ? (
            <>
              <span className="text-base font-bold text-slate-900">
                {formatMoneyWhole(expected)}
              </span>
              {low != null && high != null && (
                <span className="ml-1.5 text-xs text-slate-400">
                  {formatMoneyWhole(low)}–{formatMoneyWhole(high)}
                </span>
              )}
            </>
          ) : (
            <span className="text-sm text-slate-400">No estimate yet</span>
          )}
        </div>
        <span className="text-xs text-slate-400">{formatRelative(project.updatedAt)}</span>
      </div>
    </Link>
  );
}
