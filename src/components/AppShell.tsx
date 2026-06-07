import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import type { ComponentType } from 'react';
import {
  ClientsIcon,
  HomeIcon,
  JobsIcon,
  PlusIcon,
  SettingsIcon,
} from './icons';
import { Button, Toaster } from './ui';
import { cn } from '../lib/cn';

type IconType = ComponentType<{ size?: number; className?: string }>;

interface Tab {
  to: string;
  label: string;
  Icon: IconType;
  end?: boolean;
}

const TABS: Tab[] = [
  { to: '/', label: 'Home', Icon: HomeIcon, end: true },
  { to: '/jobs', label: 'Jobs', Icon: JobsIcon },
  { to: '/clients', label: 'Clients', Icon: ClientsIcon },
  { to: '/settings', label: 'Settings', Icon: SettingsIcon },
];

const NEW_ESTIMATE = '/estimate/new';

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-700 text-white shadow-sm">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M5 6.5 9 10l8-7"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="text-lg font-bold tracking-tight text-slate-900">Estimator</span>
    </div>
  );
}

export function AppShell() {
  const navigate = useNavigate();

  return (
    <div className="min-h-full">
      {/* Desktop left rail */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-slate-200 bg-white px-4 py-5 md:flex">
        <div className="px-2">
          <BrandMark />
        </div>
        <div className="mt-6 px-1">
          <Button fullWidth leftIcon={<PlusIcon size={18} />} onClick={() => navigate(NEW_ESTIMATE)}>
            New Estimate
          </Button>
        </div>
        <nav className="mt-6 flex flex-col gap-1">
          {TABS.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-100',
                )
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto px-3 text-xs text-slate-400">Local-first · offline ready</div>
      </aside>

      {/* Content */}
      <div className="md:pl-60">
        <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-5 md:pb-10 md:pt-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur pb-safe md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 items-end px-1 pt-1.5">
          <TabLink tab={TABS[0]} />
          <TabLink tab={TABS[1]} />
          <div className="flex justify-center">
            <button
              type="button"
              aria-label="New Estimate"
              onClick={() => navigate(NEW_ESTIMATE)}
              className="-mt-6 grid h-14 w-14 place-items-center rounded-full bg-brand-700 text-white shadow-lg shadow-brand-700/30 ring-4 ring-slate-50 transition-transform active:scale-95"
            >
              <PlusIcon size={26} />
            </button>
          </div>
          <TabLink tab={TABS[2]} />
          <TabLink tab={TABS[3]} />
        </div>
      </nav>

      <Toaster />
    </div>
  );
}

function TabLink({ tab }: { tab: Tab }) {
  const { to, label, Icon, end } = tab;
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] font-medium',
          isActive ? 'text-brand-700' : 'text-slate-500',
        )
      }
    >
      <Icon size={22} />
      {label}
    </NavLink>
  );
}
