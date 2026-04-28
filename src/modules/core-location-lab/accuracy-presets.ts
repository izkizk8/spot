/**
 * Accuracy presets for Core Location Lab (feature 025).
 *
 * Maps user-friendly labels to expo-location LocationAccuracy enum values.
 */
import * as Location from 'expo-location';

export type AccuracyPresetLabel = 'Best' | 'Best for navigation' | 'Hundred meters' | 'Kilometer';

export interface AccuracyPreset {
  readonly label: AccuracyPresetLabel;
  readonly value: Location.LocationAccuracy;
}

export const ACCURACY_PRESETS: readonly AccuracyPreset[] = [
  { label: 'Best', value: Location.LocationAccuracy.Best },
  { label: 'Best for navigation', value: Location.LocationAccuracy.BestForNavigation },
  { label: 'Hundred meters', value: Location.LocationAccuracy.Hundred },
  { label: 'Kilometer', value: Location.LocationAccuracy.Lowest },
] as const;

export const DEFAULT_ACCURACY_PRESET: AccuracyPreset = ACCURACY_PRESETS[0];
