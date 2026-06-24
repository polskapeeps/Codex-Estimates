import { useState } from 'react';
import { Button, Field, Input } from '../../components/ui';
import {
  signInToCloud,
  signOutOfCloud,
  signUpForCloud,
  syncNow,
} from '../../data/cloud/cloudSync';
import { useSync } from '../../store/sync';
import { useUI } from '../../store/ui';

export function CloudSyncSettings() {
  const sync = useSync();
  const toast = useUI((state) => state.toast);
  const [mode, setMode] = useState<'sign_in' | 'create'>('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string>();

  async function authenticate() {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setWorking(true);
    setError(undefined);
    try {
      if (mode === 'create') {
        const result = await signUpForCloud(email.trim(), password);
        if (result.needsEmailConfirmation) {
          toast('Check your email to confirm the new sync account.', 'info');
        } else {
          toast('Sync account created');
        }
      } else {
        await signInToCloud(email.trim(), password);
        toast('Signed in — syncing this device');
      }
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.');
    } finally {
      setWorking(false);
    }
  }

  async function signOut() {
    setWorking(true);
    try {
      await signOutOfCloud();
      toast('Signed out. Local data remains on this device.', 'info');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign out.');
    } finally {
      setWorking(false);
    }
  }

  if (!sync.configured) {
    return (
      <div className="space-y-2 text-sm text-slate-500">
        <p>
          This build is ready for Supabase, but no project URL or publishable key is configured
          yet.
        </p>
        <p className="text-xs text-slate-400">
          Add the two VITE_SUPABASE variables from <code>.env.example</code>, run the included
          SQL migration, then redeploy.
        </p>
      </div>
    );
  }

  if (sync.email) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-200">{sync.email}</p>
            <p className="mt-1 text-xs text-slate-400">
              {sync.message}
              {sync.pendingCount > 0 ? ` ${sync.pendingCount} change(s) waiting.` : ''}
            </p>
            {sync.lastSyncedAt && (
              <p className="mt-1 text-xs text-slate-500">
                Last synced {new Date(sync.lastSyncedAt).toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => void syncNow()}
              disabled={sync.phase === 'syncing'}
            >
              {sync.phase === 'syncing' ? 'Syncing…' : 'Sync now'}
            </Button>
            <Button variant="ghost" onClick={() => void signOut()} disabled={working}>
              Sign out
            </Button>
          </div>
        </div>
        {sync.phase === 'error' && (
          <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-300">
            {sync.message}
          </p>
        )}
        <p className="text-xs text-slate-500">
          The app still reads and writes locally first. Signing out stops cloud transfer but
          does not erase this device.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={mode === 'sign_in' ? 'primary' : 'secondary'}
          onClick={() => setMode('sign_in')}
        >
          Sign in
        </Button>
        <Button
          size="sm"
          variant={mode === 'create' ? 'primary' : 'secondary'}
          onClick={() => setMode('create')}
        >
          Create account
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Email">
          <Input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field label="Password" error={error}>
          <Input
            type="password"
            autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void authenticate();
            }}
          />
        </Field>
      </div>
      <Button onClick={() => void authenticate()} disabled={working}>
        {working ? 'Working…' : mode === 'create' ? 'Create sync account' : 'Sign in & sync'}
      </Button>
      <p className="text-xs text-slate-500">
        On the first sign-in, this device's existing jobs and settings are merged into your
        private cloud copy. Later edits sync automatically.
      </p>
    </div>
  );
}
