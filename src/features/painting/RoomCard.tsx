import type { ReactNode } from 'react';
import { Card, Input, NumberStepper } from '../../components/ui';
import { TrashIcon } from '../../components/icons';
import { PREP_LEVELS } from './room';
import { cn } from '../../lib/cn';
import type { RoomComputation } from '../../lib/estimate/painting';
import type { PrepLevel, Room } from '../../lib/types';

interface RoomCardProps {
  room: Room;
  computation?: RoomComputation;
  index: number;
  canRemove: boolean;
  onChange: (room: Room) => void;
  onRemove: () => void;
}

export function RoomCard({
  room,
  computation,
  index,
  canRemove,
  onChange,
  onRemove,
}: RoomCardProps) {
  const set = <K extends keyof Room>(key: K, value: Room[K]) => onChange({ ...room, [key]: value });

  return (
    <Card className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Input
          value={room.label}
          onChange={(e) => set('label', e.target.value)}
          placeholder={`Room ${index + 1}`}
          className="flex-1 font-semibold"
        />
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove room"
            className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
          >
            <TrashIcon size={18} />
          </button>
        )}
      </div>

      {/* Dimensions */}
      <div className="grid grid-cols-3 gap-2">
        <Dim label="Length (ft)" value={room.length} onChange={(v) => set('length', v)} />
        <Dim label="Width (ft)" value={room.width} onChange={(v) => set('width', v)} />
        <Dim label="Height (ft)" value={room.height} onChange={(v) => set('height', v)} />
      </div>

      {/* Surfaces */}
      <div>
        <p className="mb-1.5 text-xs font-medium text-slate-500">Surfaces to paint</p>
        <div className="grid grid-cols-3 gap-2">
          <SurfaceToggle label="Walls" active={room.walls} onClick={() => set('walls', !room.walls)} />
          <SurfaceToggle
            label="Ceiling"
            active={room.ceiling}
            onClick={() => set('ceiling', !room.ceiling)}
          />
          <SurfaceToggle label="Trim" active={room.trim} onClick={() => set('trim', !room.trim)} />
        </div>
      </div>

      {/* Counts */}
      <div className="grid grid-cols-2 gap-3">
        <CounterRow label="Doors">
          <NumberStepper value={room.doors} onChange={(v) => set('doors', v)} ariaLabel="doors" />
        </CounterRow>
        <CounterRow label="Windows">
          <NumberStepper
            value={room.windows}
            onChange={(v) => set('windows', v)}
            ariaLabel="windows"
          />
        </CounterRow>
        <CounterRow label="Coats">
          <NumberStepper
            value={room.coats}
            min={1}
            max={6}
            onChange={(v) => set('coats', v)}
            ariaLabel="coats"
          />
        </CounterRow>
        <CounterRow label="Prep">
          <div className="inline-flex h-11 overflow-hidden rounded-xl border border-white/[0.09] bg-[#16120b]">
            {PREP_LEVELS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => set('prepLevel', p.value as PrepLevel)}
                className={cn(
                  'px-2.5 text-xs font-semibold',
                  room.prepLevel === p.value
                    ? 'bg-gradient-to-br from-[#f0ce72] to-[#d6a43c] text-[#1a1407]'
                    : 'text-slate-500 hover:bg-white/[0.04] hover:text-slate-200',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </CounterRow>
      </div>

      {/* Live per-room readout */}
      {computation && (
      <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#16120b] px-3 py-2 text-xs text-slate-500">
          <span>
            {Math.round(computation.appliedSqft)} sqft painted
            {room.walls && ` · ${Math.round(computation.wallNet)} sqft walls`}
          </span>
          <span className="font-medium text-slate-700">
            {computation.totalHours.toFixed(1)} hrs
          </span>
        </div>
      )}
    </Card>
  );
}

function Dim({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-center text-[11px] font-medium text-slate-500">
        {label}
      </label>
      <Input
        type="number"
        inputMode="decimal"
        min="0"
        step="0.5"
        value={value}
        onChange={(e) => onChange(Number.parseFloat(e.target.value) || 0)}
        className="text-center text-base font-semibold"
      />
    </div>
  );
}

function SurfaceToggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-11 rounded-xl border text-sm font-semibold',
        active
          ? 'border-brand-600/45 bg-brand-600/[0.15] text-brand-500'
          : 'border-white/[0.09] bg-[#16120b] text-slate-500 hover:border-brand-600/25',
      )}
    >
      {label}
    </button>
  );
}

function CounterRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-slate-600">{label}</span>
      {children}
    </div>
  );
}
