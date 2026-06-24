import { MinusIcon, PlusIcon } from '../icons';
import { cn } from '../../lib/cn';
import { clamp } from '../../lib/cn';

interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  ariaLabel?: string;
  className?: string;
}

/** Tap-friendly −/+ stepper with a directly-editable middle field (spec §18). */
export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  ariaLabel,
  className,
}: NumberStepperProps) {
  const set = (next: number) => onChange(clamp(next, min, max));

  return (
    <div
      className={cn(
        'inline-flex h-11 items-stretch overflow-hidden rounded-xl border border-white/[0.09] bg-[#16120b]',
        className,
      )}
    >
      <button
        type="button"
        aria-label={`Decrease ${ariaLabel ?? ''}`.trim()}
        onClick={() => set(value - step)}
        disabled={value <= min}
        className="flex w-11 items-center justify-center text-slate-500 hover:bg-white/[0.05] disabled:opacity-40"
      >
        <MinusIcon size={18} />
      </button>
      <input
        type="number"
        inputMode="decimal"
        aria-label={ariaLabel}
        value={Number.isFinite(value) ? value : ''}
        onChange={(e) => {
          const n = Number.parseFloat(e.target.value);
          set(Number.isFinite(n) ? n : min);
        }}
        className="w-14 border-x border-white/[0.07] bg-transparent text-center text-base font-bold text-brand-500 focus:outline-none"
      />
      <button
        type="button"
        aria-label={`Increase ${ariaLabel ?? ''}`.trim()}
        onClick={() => set(value + step)}
        disabled={value >= max}
        className="flex w-11 items-center justify-center text-brand-500 hover:bg-brand-600/[0.08] disabled:opacity-40"
      >
        <PlusIcon size={18} />
      </button>
    </div>
  );
}
