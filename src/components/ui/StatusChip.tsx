import { STATUS_META } from '../../lib/status';
import type { ProjectStatus } from '../../lib/types';
import { cn } from '../../lib/cn';

export function StatusChip({
  status,
  className,
}: {
  status: ProjectStatus;
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        meta.chipClass,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dotClass)} />
      {meta.label}
    </span>
  );
}
