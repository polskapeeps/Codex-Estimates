# Supabase cloud-sync setup

The app is fully usable without Supabase. Once configured, Dexie/IndexedDB remains the
offline working database and Supabase becomes the private cross-device copy.

## 1. Create the project

1. Create a Supabase project at <https://supabase.com/dashboard>.
2. Open the project's SQL Editor.
3. Run [`supabase/migrations/202606240001_estimator_cloud_sync.sql`](supabase/migrations/202606240001_estimator_cloud_sync.sql).
4. In Authentication settings, keep Email/Password enabled. After the owner's account is
   created successfully, disabling public new-user signups is recommended for this
   single-operator app.

The migration creates one flexible records table, enables Row Level Security, restricts every
row to its authenticated owner, and enables realtime change notifications.

## 2. Add browser-safe project variables

Copy `.env.example` to `.env.local` for local development and fill in:

```dotenv
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_replace_me
```

Get both values from the project's Connect/API dialog. Use the **publishable** browser key
(or a legacy anon key), never a secret/service-role key.

For Vercel, add the same two names under Project → Settings → Environment Variables for
Production and Preview, then redeploy.

## 3. Configure auth URLs

In Supabase Authentication URL settings:

- Set the Site URL to the production Vercel URL.
- Add the production URL and any Vercel preview URL pattern you intend to use as allowed
  redirect URLs.
- Add the local Vite URL while testing locally (normally `http://localhost:5173`).

## 4. First-device migration

1. Open the configured app on the PC that currently has the authoritative estimator data.
2. Go to Settings → Cloud sync.
3. Create the owner account (or sign in to it).
4. Wait for **Cloud sync — Up to date**.
5. Export a JSON backup as an additional safety copy.

The first sync merges existing local records into an empty cloud account. Do this on the
authoritative PC before signing in on a fresh phone.

## 5. Add the phone

1. Install/open the same deployed PWA on the phone.
2. Sign in with the same account under Settings → Cloud sync.
3. Wait for **Up to date**, then verify the same clients, jobs, quotes, and invoices appear.
4. Make a harmless edit on one device and confirm it appears on the other.

## Conflict and offline behavior

- Every write is committed locally first and queued durably.
- Queued edits retry on reconnect, app focus, manual sync, and realtime cloud activity.
- Conflicts use last-write-wins per record.
- Deletions use tombstones so a deleted job does not reappear on another device.
- A local database is bound to the first Supabase user that syncs it, preventing accidental
  upload into a different account.

## Current scope

Cloud sync covers clients, jobs, estimates/quotes/invoices, properties, line-item library,
settings/rates, and the Rate Book. Photo blobs are not included yet because the app still has
no photo capture/attachment UI; those will require a Supabase Storage pass when that feature
is activated.

## Official references

- [Supabase Auth with React](https://supabase.com/docs/guides/auth/quickstarts/react)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Securing the Data API](https://supabase.com/docs/guides/api/securing-your-api)
