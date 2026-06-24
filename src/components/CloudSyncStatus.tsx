import { useSync } from '../store/sync';
import { cn } from '../lib/cn';

const LABELS = {
  disabled: ['Local-first', 'Cloud not configured'],
  signed_out: ['Local-first', 'Sign in to sync'],
  syncing: ['Cloud sync', 'Syncing…'],
  synced: ['Cloud sync', 'Up to date'],
  offline: ['Offline ready', 'Changes queued'],
  error: ['Sync needs attention', 'Open Settings'],
} as const;

export function CloudSyncStatus() {
  const { phase, pendingCount } = useSync();
  const [title, baseSubtitle] = LABELS[phase];
  const subtitle =
    pendingCount > 0 && phase !== 'syncing'
      ? `${pendingCount} change${pendingCount === 1 ? '' : 's'} queued`
      : baseSubtitle;

  return (
    <>
      <span
        className={cn(
          'h-2 w-2 rounded-full',
          phase === 'error'
            ? 'bg-[#d69585] shadow-[0_0_9px_rgba(214,149,133,0.65)]'
            : phase === 'syncing'
              ? 'animate-pulse bg-[#e6bd63] shadow-[0_0_9px_rgba(230,189,99,0.65)]'
              : 'bg-[#7fbf95] shadow-[0_0_9px_rgba(127,191,149,0.7)]',
        )}
      />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-xs font-semibold text-[#c6bca8]">{title}</span>
        <span className="mt-0.5 truncate text-[11px] text-[#7c7463]">{subtitle}</span>
      </span>
    </>
  );
}
