import { useState } from 'react';
import { StatusChip } from '../../components/ui';
import { CheckIcon, ChevronDownIcon } from '../../components/icons';
import { PIPELINE_STATUSES, STATUS_META } from '../../lib/status';
import { cn } from '../../lib/cn';
import type { ProjectStatus } from '../../lib/types';

export function StatusControl({
  status,
  onChange,
}: {
  status: ProjectStatus;
  onChange: (status: ProjectStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 rounded-full"
      >
        <StatusChip status={status} />
        <ChevronDownIcon size={16} className="text-slate-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl bg-white p-1 shadow-lg ring-1 ring-slate-200">
            {PIPELINE_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  onChange(s);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <span className={cn('h-2 w-2 rounded-full', STATUS_META[s].dotClass)} />
                {STATUS_META[s].label}
                {s === status && <CheckIcon size={16} className="ml-auto text-brand-600" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
