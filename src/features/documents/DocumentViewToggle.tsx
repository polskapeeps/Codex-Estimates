import { cn } from '../../lib/cn';

export type DocumentViewMode = 'internal' | 'client';

export function DocumentViewToggle({
  value,
  onChange,
}: {
  value: DocumentViewMode;
  onChange: (value: DocumentViewMode) => void;
}) {
  return (
    <div className="grid grid-cols-2 rounded-xl border border-white/[0.06] bg-[#16120b] p-1 text-xs font-semibold text-slate-500">
      {(['internal', 'client'] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={cn(
            'rounded-lg px-3 py-1.5 capitalize',
            value === mode
              ? 'bg-brand-600/[0.16] text-brand-500'
              : 'hover:text-slate-200',
          )}
        >
          {mode}
        </button>
      ))}
    </div>
  );
}
