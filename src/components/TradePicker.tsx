import { FileTextIcon, PaintRollerIcon } from './icons';
import { cn } from '../lib/cn';
import type { Trade } from '../lib/types';

const OPTIONS: { value: Trade; label: string; Icon: typeof FileTextIcon; hint: string }[] = [
  { value: 'painting', label: 'Painting', Icon: PaintRollerIcon, hint: 'Room calculator' },
  { value: 'general', label: 'General', Icon: FileTextIcon, hint: 'Line items' },
];

/** Segmented control for choosing the estimate engine (spec §6 step 2). */
export function TradePicker({
  value,
  onChange,
}: {
  value: Trade;
  onChange: (trade: Trade) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {OPTIONS.map(({ value: v, label, Icon, hint }) => {
        const active = v === value;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={cn(
              'flex items-center gap-3 rounded-[14px] border px-3 py-3 text-left',
              active
                ? 'border-brand-700 bg-brand-600/[0.1]'
                : 'border-white/[0.08] bg-[#1d1810] hover:border-brand-600/25',
            )}
          >
            <span
              className={cn(
                'grid h-9 w-9 shrink-0 place-items-center rounded-lg',
                active
                  ? 'bg-brand-600/[0.16] text-brand-500'
                  : 'bg-[#16120b] text-slate-500',
              )}
            >
              <Icon size={20} />
            </span>
            <span className="min-w-0">
              <span
                className={cn(
                  'block text-sm font-semibold',
                  active ? 'text-brand-800' : 'text-slate-700',
                )}
              >
                {label}
              </span>
              <span className="block text-xs text-slate-500">{hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
