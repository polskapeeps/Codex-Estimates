import type { RealtimeChannel, Session, User } from '@supabase/supabase-js';
import { nowIso } from '../../lib/ids';
import { db } from '../db';
import {
  syncKey,
  type CloudRecord,
  type SyncChange,
} from '../syncTypes';
import { cloudConfigured, supabase } from './supabase';
import {
  acknowledgeSyncChange,
  onLocalSyncChange,
} from '../repositories/syncQueue';
import {
  applyCloudRecord,
  readAllLocalSyncRecords,
  readLocalSyncRecord,
  type LocalSyncRecord,
} from '../repositories/syncRecords';
import { resolveConflict } from '../repositories/syncMerge';
import { setSyncState } from '../../store/sync';

const PAGE_SIZE = 500;
const SYNC_DEBOUNCE_MS = 700;

let currentUser: User | null = null;
let realtimeChannel: RealtimeChannel | null = null;
let syncPromise: Promise<void> | null = null;
let rerunRequested = false;
let syncTimer: number | undefined;
let initialized = false;

export interface SignUpResult {
  needsEmailConfirmation: boolean;
}

function online(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine;
}

async function pendingCount(): Promise<number> {
  return db.syncChanges.count();
}

async function refreshPendingCount(): Promise<void> {
  setSyncState({ pendingCount: await pendingCount() });
}

async function bindLocalDataToUser(userId: string): Promise<void> {
  const state = await db.syncState.get('cloud');
  if (state?.userId && state.userId !== userId) {
    throw new Error(
      'This device is already linked to a different sync account. Sign in with the original account before syncing.',
    );
  }
  if (!state?.userId) {
    await db.syncState.put({ ...state, id: 'cloud', userId });
  }
}

function recordTimestamp(localRecord: LocalSyncRecord): string {
  if (localRecord.payload && typeof localRecord.payload === 'object') {
    const updatedAt = (localRecord.payload as { updatedAt?: unknown }).updatedAt;
    if (typeof updatedAt === 'string') return updatedAt;
  }
  return nowIso();
}

function cloudRow(
  userId: string,
  localRecord: LocalSyncRecord | undefined,
  change: SyncChange | undefined,
): CloudRecord {
  const entityType = change?.entityType ?? localRecord!.entityType;
  const recordId = change?.recordId ?? localRecord!.recordId;
  const deleted = change?.operation === 'delete' || !localRecord;
  return {
    user_id: userId,
    entity_type: entityType,
    record_id: recordId,
    payload: deleted ? null : localRecord!.payload,
    client_updated_at: change?.changedAt ?? recordTimestamp(localRecord!),
    deleted,
  };
}

async function fetchAllCloudRecords(userId: string): Promise<CloudRecord[]> {
  if (!supabase) return [];
  const records: CloudRecord[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('estimator_records')
      .select(
        'user_id,entity_type,record_id,payload,client_updated_at,deleted,updated_at',
      )
      .eq('user_id', userId)
      .order('updated_at', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const page = (data ?? []) as CloudRecord[];
    records.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return records;
}

async function pushCloudRecords(records: CloudRecord[]): Promise<void> {
  if (!supabase || records.length === 0) return;
  for (let start = 0; start < records.length; start += PAGE_SIZE) {
    const batch = records.slice(start, start + PAGE_SIZE);
    const { error } = await supabase
      .from('estimator_records')
      .upsert(batch, { onConflict: 'user_id,entity_type,record_id' });
    if (error) throw error;
  }
}

async function performSync(user: User): Promise<void> {
  if (!online()) {
    setSyncState({
      phase: 'offline',
      email: user.email,
      message: 'Offline — changes will sync when a connection returns.',
    });
    await refreshPendingCount();
    return;
  }

  await bindLocalDataToUser(user.id);
  setSyncState({
    phase: 'syncing',
    email: user.email,
    message: 'Reconciling this device with the cloud…',
  });

  const [cloudRecords, localRecords, queuedChanges] = await Promise.all([
    fetchAllCloudRecords(user.id),
    readAllLocalSyncRecords(),
    db.syncChanges.toArray(),
  ]);
  const cloudByKey = new Map(
    cloudRecords.map((value) => [syncKey(value.entity_type, value.record_id), value]),
  );
  const queueByKey = new Map(queuedChanges.map((value) => [value.key, value]));
  const pushes = new Map<string, { row: CloudRecord; change?: SyncChange }>();

  for (const cloudRecord of cloudRecords) {
    const key = syncKey(cloudRecord.entity_type, cloudRecord.record_id);
    const localChange = queueByKey.get(key);
    if (localChange && resolveConflict(localChange, cloudRecord) === 'push_local') {
      const localRecord = await readLocalSyncRecord(
        localChange.entityType,
        localChange.recordId,
      );
      pushes.set(key, {
        row: cloudRow(user.id, localRecord, localChange),
        change: localChange,
      });
      continue;
    }
    await applyCloudRecord(cloudRecord, localChange);
  }

  // Upload local records that have never existed in this account's cloud copy.
  for (const [key, localRecord] of localRecords) {
    if (cloudByKey.has(key) || pushes.has(key)) continue;
    const localChange = queueByKey.get(key);
    pushes.set(key, {
      row: cloudRow(user.id, localRecord, localChange),
      change: localChange,
    });
  }

  // Preserve queued deletions even though no local payload remains.
  for (const localChange of queuedChanges) {
    if (pushes.has(localChange.key) || cloudByKey.has(localChange.key)) continue;
    const localRecord = await readLocalSyncRecord(
      localChange.entityType,
      localChange.recordId,
    );
    pushes.set(localChange.key, {
      row: cloudRow(user.id, localRecord, localChange),
      change: localChange,
    });
  }

  const pushList = [...pushes.values()];
  await pushCloudRecords(pushList.map(({ row }) => row));
  await Promise.all(
    pushList
      .map(({ change }) => change)
      .filter((change): change is SyncChange => Boolean(change))
      .map(acknowledgeSyncChange),
  );

  const syncedAt = nowIso();
  await db.syncState.put({
    id: 'cloud',
    userId: user.id,
    initialSyncComplete: true,
    lastSyncedAt: syncedAt,
  });
  setSyncState({
    phase: 'synced',
    email: user.email,
    lastSyncedAt: syncedAt,
    pendingCount: await pendingCount(),
    message: 'All local changes are backed up and available on your other devices.',
  });
}

export async function syncNow(): Promise<void> {
  if (!cloudConfigured || !supabase || !currentUser) return;
  if (syncPromise) {
    rerunRequested = true;
    return syncPromise;
  }

  const user = currentUser;
  syncPromise = performSync(user)
    .catch(async (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Cloud sync failed.';
      await db.syncState.put({
        ...(await db.syncState.get('cloud')),
        id: 'cloud',
        userId: user.id,
        lastError: message,
      });
      setSyncState({
        phase: online() ? 'error' : 'offline',
        message,
        pendingCount: await pendingCount(),
      });
    })
    .finally(() => {
      syncPromise = null;
      if (rerunRequested) {
        rerunRequested = false;
        void syncNow();
      }
    });
  return syncPromise;
}

function scheduleSync(): void {
  if (!currentUser || typeof window === 'undefined') return;
  window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(() => void syncNow(), SYNC_DEBOUNCE_MS);
}

async function stopRealtime(): Promise<void> {
  if (realtimeChannel && supabase) {
    await supabase.removeChannel(realtimeChannel);
  }
  realtimeChannel = null;
}

async function startRealtime(user: User): Promise<void> {
  if (!supabase) return;
  await stopRealtime();
  realtimeChannel = supabase
    .channel(`estimator-records-${user.id}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'estimator_records',
        filter: `user_id=eq.${user.id}`,
      },
      scheduleSync,
    )
    .subscribe();
}

async function handleSession(session: Session | null): Promise<void> {
  currentUser = session?.user ?? null;
  if (!currentUser) {
    await stopRealtime();
    setSyncState({
      configured: cloudConfigured,
      phase: cloudConfigured ? 'signed_out' : 'disabled',
      email: undefined,
      message: cloudConfigured
        ? 'Sign in to sync this device.'
        : 'Add Supabase project settings to enable cloud sync.',
      pendingCount: await pendingCount(),
    });
    return;
  }
  setSyncState({
    configured: true,
    email: currentUser.email,
    phase: online() ? 'syncing' : 'offline',
  });
  await startRealtime(currentUser);
  await syncNow();
}

export async function initializeCloudSync(): Promise<void> {
  if (initialized) return;
  initialized = true;
  setSyncState({
    configured: cloudConfigured,
    phase: cloudConfigured ? 'signed_out' : 'disabled',
    pendingCount: await pendingCount(),
  });
  onLocalSyncChange(() => {
    void refreshPendingCount();
    scheduleSync();
  });
  if (typeof window !== 'undefined') {
    window.addEventListener('online', scheduleSync);
    window.addEventListener('offline', () => {
      if (currentUser) {
        setSyncState({
          phase: 'offline',
          message: 'Offline — changes will sync when a connection returns.',
        });
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') scheduleSync();
    });
  }
  if (!supabase) return;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  await handleSession(session);
  supabase.auth.onAuthStateChange((_event, nextSession) => {
    window.setTimeout(() => void handleSession(nextSession), 0);
  });
}

export async function signInToCloud(email: string, password: string): Promise<void> {
  if (!supabase) throw new Error('Cloud sync is not configured in this build.');
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUpForCloud(
  email: string,
  password: string,
): Promise<SignUpResult> {
  if (!supabase) throw new Error('Cloud sync is not configured in this build.');
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return { needsEmailConfirmation: !data.session };
}

export async function signOutOfCloud(): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
