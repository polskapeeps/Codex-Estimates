import { create } from 'zustand';

export type SyncPhase =
  | 'disabled'
  | 'signed_out'
  | 'syncing'
  | 'synced'
  | 'offline'
  | 'error';

export interface SyncStore {
  configured: boolean;
  phase: SyncPhase;
  email?: string;
  lastSyncedAt?: string;
  pendingCount: number;
  message?: string;
}

export const useSync = create<SyncStore>(() => ({
  configured: false,
  phase: 'disabled',
  pendingCount: 0,
}));

export function setSyncState(patch: Partial<SyncStore>): void {
  useSync.setState(patch);
}
