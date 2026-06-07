/** Stable UUIDs for all records (spec §5). */
export function newId(): string {
  return crypto.randomUUID();
}

/** Current time as an ISO-8601 string (all timestamps are ISO strings). */
export function nowIso(): string {
  return new Date().toISOString();
}
