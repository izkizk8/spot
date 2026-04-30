/**
 * units-utils — Pure unit-conversion + formatting helpers for the
 * LiDAR / RoomPlan Lab (feature 048).
 *
 * Metres are the canonical native unit; the JS surface mirrors
 * what `RoomCaptureResult.dimensions` reports. The helpers here
 * format dimensions for display and provide a m → ft/in
 * conversion used by the `RoomDetailView`.
 */

export const M_TO_FT = 3.280839895;
export const FT_PER_INCH = 12;

/**
 * Returns the supplied value in feet (floating point).
 * NaN / non-finite inputs collapse to 0.
 */
export function metersToFeet(m: number): number {
  if (!Number.isFinite(m)) return 0;
  return m * M_TO_FT;
}

/**
 * Splits a length in metres into a `{ feet, inches }` pair where
 * `inches` is rounded to the nearest integer in the [0, 12)
 * range, with `feet` carrying any overflow.
 */
export function metersToFeetInches(m: number): { readonly feet: number; readonly inches: number } {
  if (!Number.isFinite(m) || m < 0) return { feet: 0, inches: 0 };
  const totalInches = m * M_TO_FT * FT_PER_INCH;
  const rounded = Math.round(totalInches);
  const feet = Math.floor(rounded / FT_PER_INCH);
  const inches = rounded - feet * FT_PER_INCH;
  return { feet, inches };
}

/**
 * Formats a metric length, e.g. `formatMeters(3.456)` →
 * `'3.46 m'`. NaN / non-finite inputs render as `'—'`.
 */
export function formatMeters(m: number, fractionDigits = 2): string {
  if (!Number.isFinite(m)) return '—';
  return `${m.toFixed(fractionDigits)} m`;
}

/**
 * Formats a metric length in imperial display style:
 * `formatFeetInches(3.456)` → `'11′ 4″'`.
 * NaN / non-finite inputs render as `'—'`.
 */
export function formatFeetInches(m: number): string {
  if (!Number.isFinite(m)) return '—';
  const { feet, inches } = metersToFeetInches(m);
  return `${feet}′ ${inches}″`;
}

/**
 * Formats a `RoomDimensions`-shaped record as
 * `'W × L × H m'` using two-decimal precision.
 */
export function formatDimensions(d: {
  readonly widthM: number;
  readonly lengthM: number;
  readonly heightM: number;
}): string {
  return `${formatMeters(d.widthM)} × ${formatMeters(d.lengthM)} × ${formatMeters(d.heightM)}`;
}

function clampNonNeg(n: number): number {
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/**
 * Sums the values in a `SurfaceCounts`-shaped record. Negative or
 * non-finite contributions are clamped to 0.
 */
export function totalSurfaces(s: {
  readonly walls: number;
  readonly windows: number;
  readonly doors: number;
  readonly openings: number;
  readonly objects: number;
}): number {
  return (
    clampNonNeg(s.walls) +
    clampNonNeg(s.windows) +
    clampNonNeg(s.doors) +
    clampNonNeg(s.openings) +
    clampNonNeg(s.objects)
  );
}
