import { useUI } from '../../store/ui';
import { cn } from '../../lib/cn';
import { CheckIcon, XIcon } from '../icons';

const TONE: Record<string, string> = {
  success: 'bg-slate-900 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-brand-700 text-white',
};

export function Toaster() {
  const toasts = useUI((s) => s.toasts);
  const dismiss = useUI((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-8">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg',
            TONE[t.tone],
          )}
        >
          {t.tone === 'success' && <CheckIcon size={16} />}
          {t.tone === 'error' && <XIcon size={16} />}
          <span>{t.message}</span>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            className="ml-1 opacity-70 hover:opacity-100"
            aria-label="Dismiss"
          >
            <XIcon size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
