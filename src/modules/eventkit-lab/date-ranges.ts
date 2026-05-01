/**
 * Pure date-range helper for EventKit Lab.
 * Feature: 037-eventkit
 *
 * @see specs/037-eventkit/contracts/helpers.md §A
 */

/** The three supported date-range presets. */
export type DateRangePreset = 'today' | 'next7' | 'next30';

/** Ordered list of presets for picker UI. */
export const DATE_RANGE_PRESETS: readonly DateRangePreset[] = ['today', 'next7', 'next30'] as const;

/** Human-readable labels for each preset. */
export const DATE_RANGE_LABELS: Readonly<Record<DateRangePreset, string>> = {
  today: 'Today',
  next7: 'Next 7 days',
  next30: 'Next 30 days',
};

/** Day offsets (inclusive span length - 1). */
const OFFSET: Record<DateRangePreset, number> = {
  today: 0,
  next7: 6,
  next30: 29,
};

/**
 * Compute a date range for the given preset and reference time.
 *
 * - Uses `setDate(d.getDate() + N)` for day arithmetic (D7 — DST-stable).
 * - Returns fresh Date instances (D1 — purity).
 * - startDate is start-of-day, endDate is end-of-day, both in local TZ.
 */
export function computeRange(
  preset: DateRangePreset,
  now: Date,
): { startDate: Date; endDate: Date } {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + OFFSET[preset]);
  end.setHours(23, 59, 59, 999);

  return { startDate: start, endDate: end };
}
