create table if not exists public.estimator_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null check (
    entity_type in (
      'clients',
      'projects',
      'estimates',
      'libraryItems',
      'rates',
      'rateEntries',
      'properties'
    )
  ),
  record_id text not null,
  payload jsonb,
  client_updated_at timestamptz not null,
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, entity_type, record_id),
  constraint estimator_records_payload_check
    check ((deleted and payload is null) or (not deleted and payload is not null))
);

create index if not exists estimator_records_user_updated_idx
  on public.estimator_records (user_id, updated_at);

alter table public.estimator_records enable row level security;

drop policy if exists "Estimator users read their own records" on public.estimator_records;
create policy "Estimator users read their own records"
  on public.estimator_records
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Estimator users insert their own records" on public.estimator_records;
create policy "Estimator users insert their own records"
  on public.estimator_records
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Estimator users update their own records" on public.estimator_records;
create policy "Estimator users update their own records"
  on public.estimator_records
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Estimator users delete their own records" on public.estimator_records;
create policy "Estimator users delete their own records"
  on public.estimator_records
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.estimator_records to authenticated;

create or replace function public.estimator_records_keep_newest()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.client_updated_at < old.client_updated_at then
    return old;
  end if;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists estimator_records_keep_newest on public.estimator_records;
create trigger estimator_records_keep_newest
  before insert or update on public.estimator_records
  for each row execute function public.estimator_records_keep_newest();

do $$
begin
  alter publication supabase_realtime add table public.estimator_records;
exception
  when duplicate_object then null;
end;
$$;
