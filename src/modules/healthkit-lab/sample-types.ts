/**
 * sample-types.ts — HealthKit Lab (feature 043).
 *
 * Single source of truth for the canonical sample categories the lab
 * cares about and the HealthKit permission sets requested at init
 * time. Keeps the typed surface independent from `react-native-health`
 * so unit tests can run without the native module.
 *
 * Pure module: no React, no native bridge. Helpers are deterministic
 * and exported for unit testing.
 */

export type HealthSampleId = 'steps' | 'heartRate' | 'sleep' | 'workouts' | 'weight';

export type AuthStatus = 'undetermined' | 'authorized' | 'denied';

/** Sleep classification stages we surface in the UI. */
export type SleepStage = 'inBed' | 'asleep' | 'awake' | 'core' | 'deep' | 'rem';

export interface DailyStep {
  /** ISO YYYY-MM-DD date of the day this bucket covers. */
  readonly date: string;
  readonly steps: number;
}

export interface HeartRateSample {
  readonly bpm: number;
  /** ISO-8601 timestamp. */
  readonly timestamp: string;
}

export interface SleepSegment {
  readonly stage: SleepStage;
  readonly startDate: string;
  readonly endDate: string;
  /** Duration in minutes (precomputed for UI). */
  readonly minutes: number;
}

export interface WorkoutSummary {
  readonly id: string;
  readonly activityName: string;
  readonly start: string;
  readonly end: string;
  /** Active calories in kcal. */
  readonly calories: number;
  /** Duration in seconds. */
  readonly duration: number;
}

export interface WeightSample {
  readonly kg: number;
  readonly timestamp: string;
}

/**
 * The set of HealthKit permission identifiers requested for read.
 * The string values match `HealthPermission` enum values exposed by
 * `react-native-health`. Frozen to prevent runtime mutation.
 */
export const READ_PERMISSIONS: readonly string[] = Object.freeze([
  'StepCount',
  'HeartRate',
  'SleepAnalysis',
  'Workout',
  'Weight',
  'ActiveEnergyBurned',
]);

/** Permission identifiers requested for write. */
export const WRITE_PERMISSIONS: readonly string[] = Object.freeze(['HeartRate', 'Weight']);

/**
 * Stable, ordered list of the sample categories the lab exposes. The
 * UI iterates this array in the AuthorizationCard so a developer
 * adding a new category needs only to extend this list.
 */
export const SAMPLE_IDS: readonly HealthSampleId[] = Object.freeze([
  'steps',
  'heartRate',
  'sleep',
  'workouts',
  'weight',
]);

const SAMPLE_LABELS: Readonly<Record<HealthSampleId, string>> = Object.freeze({
  steps: 'Step count',
  heartRate: 'Heart rate',
  sleep: 'Sleep analysis',
  workouts: 'Workouts',
  weight: 'Weight',
});

export function labelForSample(id: HealthSampleId): string {
  return SAMPLE_LABELS[id];
}

/**
 * Build the initial undetermined per-type status map.
 */
export function makeInitialAuthMap(): Readonly<Record<HealthSampleId, AuthStatus>> {
  const out: Record<HealthSampleId, AuthStatus> = {
    steps: 'undetermined',
    heartRate: 'undetermined',
    sleep: 'undetermined',
    workouts: 'undetermined',
    weight: 'undetermined',
  };
  return Object.freeze(out);
}

/**
 * Render an integer minute count as `H:MM` (e.g. 95 → '1:35'). Negative
 * inputs are clamped to 0. Non-finite inputs return '0:00'.
 */
export function formatMinutes(minutes: number): string {
  if (!Number.isFinite(minutes)) return '0:00';
  const m = Math.max(0, Math.floor(minutes));
  const h = Math.floor(m / 60);
  const r = m % 60;
  return `${h}:${r.toString().padStart(2, '0')}`;
}

/**
 * Render a duration in seconds as `MM:SS` for short workouts or
 * `H:MM:SS` for >=1h. Non-finite or negative inputs return '00:00'.
 */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = m.toString().padStart(2, '0');
  const ss = s.toString().padStart(2, '0');
  if (h > 0) return `${h}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}

/**
 * Map a raw HealthKit sleep value to a coarse SleepStage. Unknown raw
 * values fall back to 'asleep' (conservative — counts as sleep).
 */
export function mapSleepValue(raw: string): SleepStage {
  const lc = raw.toLowerCase();
  if (lc.includes('inbed')) return 'inBed';
  if (lc.includes('awake')) return 'awake';
  if (lc.includes('rem')) return 'rem';
  if (lc.includes('deep')) return 'deep';
  if (lc.includes('core')) return 'core';
  return 'asleep';
}

/**
 * Build N consecutive YYYY-MM-DD dates ending at `endIso` (inclusive),
 * oldest first. Used to backfill 7-day step buckets when the response
 * has gaps. `endIso` falls back to today if not provided / invalid.
 */
export function lastNDates(n: number, endIso?: string): readonly string[] {
  if (!Number.isFinite(n) || n <= 0) return Object.freeze<string[]>([]);
  const end = endIso !== undefined ? new Date(endIso) : new Date();
  const safe = isNaN(end.getTime()) ? new Date() : end;
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(safe);
    d.setUTCDate(safe.getUTCDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return Object.freeze(out);
}
