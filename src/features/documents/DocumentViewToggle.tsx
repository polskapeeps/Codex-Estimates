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
    <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
      {(['internal', 'client'] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={cn(
            'rounded-lg px-3 py-1.5 capitalize transition-colors',
            value === mode ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900',
          )}
        >
          {mode}
        </button>
      ))}
    </div>
  );
}
