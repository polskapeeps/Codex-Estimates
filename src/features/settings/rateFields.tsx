import { Field, Input } from '../../components/ui';
import { centsToDollars, dollarsToCents } from '../../lib/money';

/** Edits a CENTS value while displaying dollars. */
export function MoneyField({
  label,
  hint,
  cents,
  onChange,
}: {
  label: string;
  hint?: string;
  cents: number;
  onChange: (cents: number) => void;
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          $
        </span>
        <Input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={centsToDollars(cents)}
          onChange={(e) => onChange(dollarsToCents(Number.parseFloat(e.target.value) || 0))}
          className="pl-7 font-bold text-brand-500"
        />
      </div>
    </Field>
  );
}

/** Edits a decimal fraction (0.20) while displaying a percent (20). */
export function PercentField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="relative">
        <Input
          type="number"
          inputMode="decimal"
          step="0.1"
          min="0"
          value={Math.round(value * 1000) / 10}
          onChange={(e) => onChange((Number.parseFloat(e.target.value) || 0) / 100)}
          className="pr-8 font-bold text-brand-500"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
          %
        </span>
      </div>
    </Field>
  );
}

/** Edits a plain number. */
export function NumField({
  label,
  hint,
  value,
  step = 1,
  suffix,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="relative">
        <Input
          type="number"
          inputMode="decimal"
          step={step}
          min="0"
          value={value}
          onChange={(e) => onChange(Number.parseFloat(e.target.value) || 0)}
          className={suffix ? 'pr-12 font-bold text-brand-500' : 'font-bold text-brand-500'}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
            {suffix}
          </span>
        )}
      </div>
    </Field>
  );
}
