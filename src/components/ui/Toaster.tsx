import { useUI } from '../../store/ui';
import { cn } from '../../lib/cn';
import { CheckIcon, XIcon } from '../icons';

const TONE: Record<string, string> = {
  success: 'border border-[#7fbf95]/25 bg-[#1d1810] text-[#8fd0a6]',
  error: 'border border-[#c87b6b]/30 bg-[#1d1810] text-[#e0a595]',
  info: 'border border-brand-600/30 bg-[#1d1810] text-brand-500',
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
