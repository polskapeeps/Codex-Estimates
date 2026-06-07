// Money utilities. ALL internal money math is in integer CENTS to avoid
// floating-point drift. Convert to display strings only at the edges.

/** Round a fractional cents value to a whole integer of cents. */
export function roundCents(value: number): number {
  return Math.round(value);
}

/** Dollars (possibly fractional) -> integer cents. */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/** Integer cents -> dollars (float, for display formatting only). */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

const usd2 = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usd0 = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Format cents as "$1,234.56". */
export function formatMoney(cents: number): string {
  return usd2.format(centsToDollars(cents));
}

/** Format cents as whole dollars "$1,234" (used for the headline range). */
export function formatMoneyWhole(cents: number): string {
  return usd0.format(centsToDollars(cents));
}

/**
 * The headline estimate range, e.g. "$760 – $967 (est. $864)".
 * Whole-dollar rounding for a clean, non-false-precision display (spec §18).
 */
export function formatRange(low: number, expected: number, high: number): string {
  return `${formatMoneyWhole(low)} – ${formatMoneyWhole(high)} (est. ${formatMoneyWhole(
    expected,
  )})`;
}

/** Parse a user-entered dollar string ("45", "$45.50", "1,234") into cents. */
export function parseDollarsToCents(input: string): number {
  const cleaned = input.replace(/[^0-9.-]/g, '');
  const value = Number.parseFloat(cleaned);
  if (!Number.isFinite(value)) return 0;
  return dollarsToCents(value);
}
