import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import type { ComponentType } from 'react';
import {
  ClientsIcon,
  HomeIcon,
  JobsIcon,
  PlusIcon,
  ReceiptIcon,
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
  { to: '/', label: 'Dashboard', Icon: HomeIcon, end: true },
  { to: '/jobs', label: 'Jobs', Icon: JobsIcon },
  { to: '/clients', label: 'Clients', Icon: ClientsIcon },
  { to: '/invoices', label: 'Invoices', Icon: ReceiptIcon },
  { to: '/settings', label: 'Settings', Icon: SettingsIcon },
];

const MOBILE_TABS = TABS.filter((tab) => tab.to !== '/settings');
const NEW_QUOTE = '/quote/new';

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-[13px] bg-gradient-to-br from-[#f0ce72] to-[#c9962f] text-[18px] font-extrabold tracking-[-0.04em] text-[#1a1407] shadow-[0_6px_18px_rgba(201,150,47,0.35)]">
        PK
      </span>
      <span className="flex min-w-0 flex-col leading-none">
        <span className="text-[18px] font-extrabold tracking-[-0.02em] text-[#f6f1e4]">
          Estimator
        </span>
        <span className="mt-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#c9962f]">
          PK Paints & Reno
        </span>
      </span>
    </div>
  );
}

export function AppShell() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[272px] flex-col border-r border-white/[0.06] bg-[#14100a]/60 px-[18px] pb-[18px] pt-6 backdrop-blur-sm md:flex">
        <div className="px-2">
          <BrandMark />
        </div>

        <div className="mt-[22px]">
          <Button
            fullWidth
            size="lg"
            leftIcon={<PlusIcon size={18} />}
            onClick={() => navigate(NEW_QUOTE)}
          >
            New Quote
          </Button>
        </div>

        <nav className="mt-[22px] flex flex-col gap-1">
          {TABS.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3.5 rounded-xl px-[15px] py-[13px] text-[15.5px] font-semibold',
                  isActive
                    ? 'bg-brand-600/[0.13] text-[#f0ce72]'
                    : 'text-[#a89e8b] hover:bg-white/[0.035] hover:text-[#c6bca8]',
                )
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex items-center gap-2.5 rounded-xl border border-white/[0.05] bg-white/[0.025] px-3.5 py-3">
          <span className="h-2 w-2 rounded-full bg-[#7fbf95] shadow-[0_0_9px_rgba(127,191,149,0.7)]" />
          <span className="flex flex-col leading-tight">
            <span className="text-xs font-semibold text-[#c6bca8]">Local-first</span>
            <span className="mt-0.5 text-[11px] text-[#7c7463]">Offline ready</span>
          </span>
        </div>
      </aside>

      <div className="md:pl-[272px]">
        <main className="mx-auto w-full max-w-[1104px] px-4 pb-28 pt-6 sm:px-6 md:px-[52px] md:pb-20 md:pt-[46px]">
          <Outlet />
        </main>
      </div>

      <NavLink
        to="/settings"
        aria-label="Settings"
        className={({ isActive }) =>
          cn(
            'fixed right-3 top-3 z-40 grid h-10 w-10 place-items-center rounded-full border border-white/[0.08] bg-[#1d1810]/95 shadow-lg backdrop-blur md:hidden',
            isActive ? 'text-brand-500' : 'text-slate-500',
          )
        }
      >
        <SettingsIcon size={19} />
      </NavLink>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/[0.07] bg-[#14100a]/95 pb-safe backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 items-end px-1 pt-1.5">
          <TabLink tab={MOBILE_TABS[0]} />
          <TabLink tab={MOBILE_TABS[1]} />
          <div className="flex justify-center">
            <button
              type="button"
              aria-label="New Quote"
              onClick={() => navigate(NEW_QUOTE)}
              className="-mt-6 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-[#f0ce72] to-[#d6a43c] text-[#1a1407] shadow-[0_8px_22px_rgba(201,150,47,0.38)] ring-4 ring-[#14110c] transition-transform active:scale-95"
            >
              <PlusIcon size={25} />
            </button>
          </div>
          <TabLink tab={MOBILE_TABS[2]} />
          <TabLink tab={MOBILE_TABS[3]} />
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
          'flex flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] font-semibold',
          isActive ? 'text-[#f0ce72]' : 'text-[#857c6b]',
        )
      }
    >
      <Icon size={21} />
      {label}
    </NavLink>
  );
}
