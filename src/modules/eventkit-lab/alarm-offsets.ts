/**
 * Pure alarm-offset helper for EventKit Lab.
 * Feature: 037-eventkit
 *
 * @see specs/037-eventkit/contracts/helpers.md §B
 */

/** The four supported alarm-offset presets. */
export type AlarmOffsetPreset = 'none' | '5min' | '15min' | '1hour';

/** Ordered list of presets for picker UI. */
export const ALARM_OFFSET_PRESETS: readonly AlarmOffsetPreset[] = [
  'none',
  '5min',
  '15min',
  '1hour',
] as const;

/** Human-readable labels for each preset. */
export const ALARM_OFFSET_LABELS: Readonly<Record<AlarmOffsetPreset, string>> = {
  none: 'None',
  '5min': '5 minutes before',
  '15min': '15 minutes before',
  '1hour': '1 hour before',
};

/** Offset-in-minutes map (negative = before event). */
const OFFSET_MINUTES: Record<Exclude<AlarmOffsetPreset, 'none'>, number> = {
  '5min': -5,
  '15min': -15,
  '1hour': -60,
};

/**
 * Convert an alarm-offset preset to the expo-calendar alarm array shape.
 *
 * - Returns `undefined` for `'none'` (A3).
 * - Returns a single-element array with `relativeOffset` for others (A4–A6).
 * - Returns fresh objects on every call (A7 — purity).
 */
export function toAlarmsArray(
  preset: AlarmOffsetPreset,
): readonly [{ readonly relativeOffset: number }] | undefined {
  switch (preset) {
    case 'none':
      return undefined;
    case '5min':
    case '15min':
    case '1hour':
      return [{ relativeOffset: OFFSET_MINUTES[preset] }];
    default: {
      const _exhaustive: never = preset;
      return _exhaustive;
    }
  }
}
