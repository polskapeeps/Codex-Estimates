import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, EmptyState, Field, Input, PageHeader } from '../../components/ui';
import { ClientsIcon, PlusIcon, SearchIcon } from '../../components/icons';
import { useAllEstimates, useClients, useProjects } from '../../data/hooks';
import { ClientForm } from './ClientForm';
import { formatMoneyWhole } from '../../lib/money';
import type { Client } from '../../lib/types';

export function ClientsPage() {
  const clients = useClients();
  const projects = useProjects();
  const estimates = useAllEstimates();
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  const statsByClient = useMemo(() => {
    const map = new Map<string, { jobs: number; billed: number }>();
    const projectClient = new Map<string, string>();

    for (const project of projects ?? []) {
      projectClient.set(project.id, project.clientId);
      const entry = map.get(project.clientId) ?? { jobs: 0, billed: 0 };
      entry.jobs += 1;
      map.set(project.clientId, entry);
    }

    for (const estimate of estimates ?? []) {
      if (estimate.docType !== 'invoice') continue;
      const clientId = projectClient.get(estimate.projectId);
      if (!clientId) continue;
      const entry = map.get(clientId) ?? { jobs: 0, billed: 0 };
      entry.billed += estimate.totals.total;
      map.set(clientId, entry);
    }

    return map;
  }, [estimates, projects]);

  const totalBilled = useMemo(
    () => [...statsByClient.values()].reduce((sum, entry) => sum + entry.billed, 0),
    [statsByClient],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const list = clients ?? [];
    if (!normalized) return list;
    return list.filter((client) =>
      [client.name, client.company, client.phone, client.email, client.address]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalized)),
    );
  }, [clients, query]);

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle={
          clients
            ? `${clients.length} total · ${formatMoneyWhole(totalBilled)} billed all-time`
            : undefined
        }
        right={
          <Button
            size="sm"
            leftIcon={<PlusIcon size={18} />}
            onClick={() => setFormOpen(true)}
          >
            New client
          </Button>
        }
      />

      {(clients?.length ?? 0) > 0 && (
        <Field className="mb-5">
          <div className="relative max-w-xl">
            <SearchIcon
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search clients…"
              className="pl-10"
            />
          </div>
        </Field>
      )}

      {clients === undefined ? null : filtered.length === 0 ? (
        <EmptyState
          icon={<ClientsIcon size={40} />}
          title={query ? 'No matches' : 'No clients yet'}
          message={query ? 'Try a different search.' : 'Add your first client to get started.'}
          action={
            !query && (
              <Button leftIcon={<PlusIcon size={18} />} onClick={() => setFormOpen(true)}>
                New client
              </Button>
            )
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((client) => (
            <li key={client.id}>
              <ClientCard client={client} stats={statsByClient.get(client.id)} />
            </li>
          ))}
        </ul>
      )}

      <ClientForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}

function ClientCard({
  client,
  stats,
}: {
  client: Client;
  stats?: { jobs: number; billed: number };
}) {
  const initials = client.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  const location = client.address?.split(',').slice(-2, -1)[0]?.trim() || client.company || 'Client';

  return (
    <Link
      to={`/clients/${client.id}`}
      className="block rounded-[18px] border border-white/[0.07] bg-[#1d1810] p-[22px] shadow-[0_8px_22px_rgba(0,0,0,0.28)] transition-[border-color,transform] hover:-translate-y-0.5 hover:border-brand-600/30"
    >
      <div className="flex items-center gap-3.5">
        <span className="grid h-[50px] w-[50px] shrink-0 place-items-center rounded-[14px] border border-brand-600/30 bg-brand-600/[0.12] text-[17px] font-extrabold text-brand-500">
          {initials || 'PK'}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[17px] font-bold text-slate-900">
            {client.name}
          </span>
          <span className="mt-0.5 block truncate text-[13.5px] text-slate-400">
            {location}
          </span>
        </span>
      </div>
      <div className="mt-[18px] grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-4">
        <ClientStat label="Jobs" value={String(stats?.jobs ?? 0)} />
        <ClientStat label="Billed" value={formatMoneyWhole(stats?.billed ?? 0)} gold />
      </div>
    </Link>
  );
}

function ClientStat({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <span>
      <span className="block text-xs font-semibold uppercase tracking-[0.04em] text-slate-400">
        {label}
      </span>
      <span
        className={`mt-1 block text-lg font-bold tabular-nums ${
          gold ? 'text-brand-500' : 'text-slate-200'
        }`}
      >
        {value}
      </span>
    </span>
  );
}
