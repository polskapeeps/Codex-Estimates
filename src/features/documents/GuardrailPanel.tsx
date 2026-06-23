import { Card } from '../../components/ui';
import { cn } from '../../lib/cn';
import type { GuardrailWarning } from '../../lib/estimate/guardrails';

const SEVERITY_CLASS: Record<GuardrailWarning['severity'], string> = {
  red: 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/35 dark:text-red-100',
  yellow:
    'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/35 dark:text-amber-100',
  info: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950/35 dark:text-sky-100',
};

const DOT_CLASS: Record<GuardrailWarning['severity'], string> = {
  red: 'bg-red-500',
  yellow: 'bg-amber-500',
  info: 'bg-sky-500',
};

export function GuardrailPanel({ warnings }: { warnings: GuardrailWarning[] }) {
  if (warnings.length === 0) return null;

  return (
    <Card className="space-y-2 p-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Pricing guardrails
        </h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {warnings.length}
        </span>
      </div>
      <ul className="space-y-2">
        {warnings.map((warning, index) => (
          <li
            key={`${warning.id}-${index}`}
            className={cn('rounded-xl border px-3 py-2 text-sm', SEVERITY_CLASS[warning.severity])}
          >
            <div className="flex items-start gap-2">
              <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', DOT_CLASS[warning.severity])} />
              <div className="min-w-0">
                <p className="font-semibold">{warning.title}</p>
                <p className="mt-0.5 text-xs opacity-85">{warning.message}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
