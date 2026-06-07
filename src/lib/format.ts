import { format, formatDistanceToNowStrict, isValid, parseISO } from 'date-fns';

/** "Jun 6, 2026" */
export function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = parseISO(iso);
  return isValid(d) ? format(d, 'MMM d, yyyy') : '—';
}

/** "Jun 6, 2026, 2:30 PM" */
export function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  const d = parseISO(iso);
  return isValid(d) ? format(d, "MMM d, yyyy, h:mm a") : '—';
}

/** "3 days ago" */
export function formatRelative(iso?: string): string {
  if (!iso) return '—';
  const d = parseISO(iso);
  return isValid(d) ? `${formatDistanceToNowStrict(d)} ago` : '—';
}

/** Title-case a fixed status/enum string for display: "bid_sent" -> "Bid sent". */
export function humanize(value: string): string {
  const s = value.replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}
