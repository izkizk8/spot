/**
 * Distance filter presets for Core Location Lab (feature 025).
 *
 * Maps distance values in meters to user-friendly labels.
 */

export type DistanceFilterMeters = 5 | 50 | 500;

export interface DistanceFilter {
  readonly label: string;
  readonly meters: DistanceFilterMeters;
}

export const DISTANCE_FILTERS: readonly DistanceFilter[] = [
  { label: '5 m', meters: 5 },
  { label: '50 m', meters: 50 },
  { label: '500 m', meters: 500 },
] as const;

export const DEFAULT_DISTANCE_FILTER: DistanceFilter = DISTANCE_FILTERS[0];
