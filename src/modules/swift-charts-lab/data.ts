/**
 * T004: data.ts — Pure dataset module
 *
 * Provides types, constants, and pure functions for managing the chart dataset.
 * No React, no I/O. All generators are deterministic when seeded.
 */

// ============================================================================
// Types
// ============================================================================

/** The four chart types surfaced in the UI. */
export type ChartType = 'line' | 'bar' | 'area' | 'point';

/** Identifier for one of the four predefined tint swatches. */
export type TintId = 'blue' | 'green' | 'orange' | 'purple';

/** A single tint definition. */
export interface Tint {
  readonly id: TintId;
  /** Hex string suitable for both RN backgroundColor and Swift Charts. */
  readonly value: string;
}

/** A single value in the chart series. */
export interface DataPoint {
  /** Month label, e.g. 'Jan' or 'Jan ʼ27' for entries past December. */
  readonly month: string;
  /** Mock-temperature value within [VALUE_MIN, VALUE_MAX], 1 decimal place. */
  readonly value: number;
}

/** The screen holds the dataset as a readonly array. */
export type Dataset = readonly DataPoint[];

// ============================================================================
// Constants
// ============================================================================

export const MIN_SERIES_SIZE = 2;
export const MAX_SERIES_SIZE = 24;
export const VALUE_MIN = -10;
export const VALUE_MAX = 30;
export const INITIAL_SIZE = 12;

/** Hardcoded tint palette. */
export const TINTS: readonly Tint[] = [
  { id: 'blue', value: '#007AFF' },
  { id: 'green', value: '#34C759' },
  { id: 'orange', value: '#FF9500' },
  { id: 'purple', value: '#AF52DE' },
] as const;

/** Chart types in UI order. */
export const CHART_TYPES: readonly ChartType[] = ['line', 'bar', 'area', 'point'] as const;

/** Initial month labels — first 12 entries are unsuffixed. */
export const INITIAL_MONTHS: readonly string[] = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

// ============================================================================
// Seedable PRNG (mulberry32)
// ============================================================================

/**
 * Simple seedable PRNG for deterministic randomization.
 * Returns a function that generates [0, 1) floats.
 */
function createPRNG(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ============================================================================
// Pure functions
// ============================================================================

/**
 * Round a value to 1 decimal place.
 */
function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

/**
 * Generate a random value in [VALUE_MIN, VALUE_MAX], rounded to 1 decimal.
 */
function randomValue(rng: () => number): number {
  const v = VALUE_MIN + rng() * (VALUE_MAX - VALUE_MIN);
  return round1(v);
}

/**
 * Returns the 12-month initial dataset with deterministic values.
 * Two successive calls produce element-wise equal arrays.
 */
export function initialDataset(): Dataset {
  // Use a fixed seed for initial dataset so it's deterministic
  const rng = createPRNG(42);
  return INITIAL_MONTHS.map((month) => ({
    month,
    value: randomValue(rng),
  }));
}

/**
 * Returns a new dataset with same length and months, but randomized values.
 * @param data - Input dataset
 * @param seed - Optional seed for deterministic output (defaults to Date.now())
 */
export function randomize(data: Dataset, seed?: number): Dataset {
  const rng = createPRNG(seed ?? Date.now());
  return data.map((d) => ({
    month: d.month,
    value: randomValue(rng),
  }));
}

/**
 * Appends a new point with the next month label.
 * Returns the same reference if already at MAX_SERIES_SIZE.
 * @param data - Input dataset
 * @param seed - Optional seed for deterministic value
 */
export function addPoint(data: Dataset, seed?: number): Dataset {
  if (data.length >= MAX_SERIES_SIZE) {
    return data;
  }
  const rng = createPRNG(seed ?? Date.now());
  const lastMonth = data[data.length - 1].month;
  const newMonth = nextMonthLabel(lastMonth);
  return [...data, { month: newMonth, value: randomValue(rng) }];
}

/**
 * Removes the last point from the dataset.
 * Returns the same reference if already at MIN_SERIES_SIZE.
 */
export function removePoint(data: Dataset): Dataset {
  if (data.length <= MIN_SERIES_SIZE) {
    return data;
  }
  return data.slice(0, -1);
}

/**
 * Computes the next month label in the sequence.
 * Wraps from 'Dec' to 'Jan ʼ27', from 'Dec ʼ27' to 'Jan ʼ28', etc.
 * Uses the literal Unicode modifier letter apostrophe U+02BC: ʼ
 */
export function nextMonthLabel(prev: string): string {
  // Parse format: "Jan", "Feb", ..., "Dec" or "Jan ʼ27", "Dec ʼ99"
  const match = prev.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(?: ʼ(\d+))?$/);
  if (!match) {
    throw new Error(`Invalid month label: ${prev}`);
  }

  const monthName = match[1];
  const yearSuffix = match[2] ? parseInt(match[2], 10) : 26; // unsuffixed = year 26

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const monthIndex = monthNames.indexOf(monthName);

  if (monthIndex === -1) {
    throw new Error(`Invalid month name: ${monthName}`);
  }

  const nextIndex = (monthIndex + 1) % 12;
  const nextMonth = monthNames[nextIndex];

  // If we wrapped from Dec to Jan, increment year
  if (nextIndex === 0) {
    const nextYear = yearSuffix + 1;
    return `${nextMonth} ʼ${nextYear}`;
  }

  // If original had a year suffix, keep it
  if (match[2]) {
    return `${nextMonth} ʼ${yearSuffix}`;
  }

  // If original was unsuffixed and we didn't wrap, keep it unsuffixed
  return nextMonth;
}
