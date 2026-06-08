import type { PricingMode, Rates, Room, Totals } from '../types';
import { roundCents } from '../money';
import { computeTotals } from './totals';

// PURE painting estimation engine (spec §7). No UI, no hardcoded numbers —
// every coefficient comes from the passed-in Rates object. Money is in cents;
// hours are kept at full float precision and money is rounded per step.

export interface RoomComputation {
  room: Room;
  perimeter: number;
  wallGross: number;
  openings: number;
  wallNet: number;
  ceilingArea: number;
  trimLinearFt: number;
  /** Painted area counting coats (walls + ceiling), feeds paint gallons. */
  appliedSqft: number;
  /** One-coat area used for primer when this room is heavy-prep. */
  primerArea: number;
  wallHours: number;
  ceilingHours: number;
  trimHours: number;
  doorHours: number;
  windowHours: number;
  baseHours: number;
  prepMultiplier: number;
  totalHours: number;
}

export interface PaintingComputation {
  rooms: RoomComputation[];
  totalAppliedSqft: number;
  paintGallons: number;
  primerGallons: number;
  paintCost: number; // cents
  primerCost: number; // cents
  sundries: number; // cents
  materials: number; // cents
  laborHours: number;
  labor: number; // cents
}

export interface PaintingEstimate {
  computation: PaintingComputation;
  totals: Totals;
}

function computeRoom(room: Room, rates: Rates): RoomComputation {
  const perimeter = 2 * (room.length + room.width);
  const wallGross = perimeter * room.height;
  const openings = room.doors * rates.doorAreaSqft + room.windows * rates.windowAreaSqft;
  const wallNet = Math.max(0, wallGross - openings);
  const ceilingArea = room.length * room.width;
  const trimLinearFt = perimeter;

  const wallArea = room.walls ? wallNet : 0;
  const ceilArea = room.ceiling ? ceilingArea : 0;

  const appliedSqft = (wallArea + ceilArea) * room.coats;
  const primerArea = room.prepLevel === 'heavy' ? wallArea + ceilArea : 0;

  const wallHours = room.walls ? (wallArea * room.coats) / rates.productionRates.walls : 0;
  const ceilingHours = room.ceiling
    ? (ceilArea * room.coats) / rates.productionRates.ceiling
    : 0;
  // Trim is a single-pass linear-ft rate; multiply by coats when coats > 1.
  const trimHours = room.trim ? (trimLinearFt * room.coats) / rates.productionRates.trim : 0;
  const doorHours = room.doors * rates.doorLaborHrs;
  const windowHours = room.windows * rates.windowLaborHrs;

  const baseHours = wallHours + ceilingHours + trimHours + doorHours + windowHours;
  const prepMultiplier = rates.prepMultipliers[room.prepLevel];
  const totalHours = baseHours * prepMultiplier;

  return {
    room,
    perimeter,
    wallGross,
    openings,
    wallNet,
    ceilingArea,
    trimLinearFt,
    appliedSqft,
    primerArea,
    wallHours,
    ceilingHours,
    trimHours,
    doorHours,
    windowHours,
    baseHours,
    prepMultiplier,
    totalHours,
  };
}

export function computePainting(rooms: Room[], rates: Rates): PaintingComputation {
  const computed = rooms.map((r) => computeRoom(r, rates));

  const totalAppliedSqft = computed.reduce((sum, r) => sum + r.appliedSqft, 0);
  const primerTotalArea = computed.reduce((sum, r) => sum + r.primerArea, 0);

  const coverage = rates.coverageSqftPerGallon;
  const paintGallons = totalAppliedSqft > 0 ? Math.ceil(totalAppliedSqft / coverage) : 0;
  const primerGallons =
    rates.primerOnHeavyPrep && primerTotalArea > 0 ? Math.ceil(primerTotalArea / coverage) : 0;

  const paintCost = paintGallons * rates.paintCostPerGallon;
  const primerCost = primerGallons * rates.primerCostPerGallon;
  const sundries = roundCents((paintCost + primerCost) * rates.sundriesPct);
  const materials = paintCost + primerCost + sundries;

  const laborHours = computed.reduce((sum, r) => sum + r.totalHours, 0);
  const labor = roundCents(laborHours * rates.hourlyRate);

  return {
    rooms: computed,
    totalAppliedSqft,
    paintGallons,
    primerGallons,
    paintCost,
    primerCost,
    sundries,
    materials,
    laborHours,
    labor,
  };
}

export function computePaintingEstimate(
  rooms: Room[],
  rates: Rates,
  pricingMode: PricingMode = 'full',
): PaintingEstimate {
  const computation = computePainting(rooms, rates);
  const totals = computeTotals(
    {
      materials: computation.materials,
      labor: computation.labor,
      laborHours: computation.laborHours,
    },
    rates,
    pricingMode,
  );
  return { computation, totals };
}
