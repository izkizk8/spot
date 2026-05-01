/**
 * Pure preset-to-platform mapping functions for feature 019 (data-model.md §6).
 *
 * iOS-domain values:
 *   rate   ∈ [0.0, 1.0]  — defaults: Slow=0.4, Normal=0.5, Fast=0.6 (D-03)
 *   pitch  ∈ [0.5, 2.0]  — defaults: Low=0.75, Normal=1.0, High=1.5 (D-04)
 *   volume ∈ [0.0, 1.0]  — defaults: Low=0.3, Normal=0.7, High=1.0 (D-05)
 *
 * Android (`expo-speech`) and Web (`SpeechSynthesisUtterance`) ranges:
 *   rate   ≈ [0.0, 2.0]  — multiply iOS-domain by 2 (R-007)
 *   pitch  ≈ [0.5, 2.0]  — identity (R-007)
 *   volume ∈ [0.0, 1.0]  — identity (R-007)
 */

import type { PitchPreset, RatePreset, VolumePreset } from './synth-types';

export const RATE_PRESET_TO_IOS: Readonly<Record<RatePreset, number>> = {
  Slow: 0.4,
  Normal: 0.5,
  Fast: 0.6,
};

export const PITCH_PRESET_TO_IOS: Readonly<Record<PitchPreset, number>> = {
  Low: 0.75,
  Normal: 1.0,
  High: 1.5,
};

export const VOLUME_PRESET_TO_IOS: Readonly<Record<VolumePreset, number>> = {
  Low: 0.3,
  Normal: 0.7,
  High: 1.0,
};

export function ratePresetToValue(preset: RatePreset): number {
  return RATE_PRESET_TO_IOS[preset];
}

export function pitchPresetToValue(preset: PitchPreset): number {
  return PITCH_PRESET_TO_IOS[preset];
}

export function volumePresetToValue(preset: VolumePreset): number {
  return VOLUME_PRESET_TO_IOS[preset];
}

// Android maps rate to [0..2] (Speech.speak's `rate`).
export const mapRateForAndroid = (rate: number): number => rate * 2;
export const mapPitchForAndroid = (pitch: number): number => pitch;
export const mapVolumeForAndroid = (volume: number): number => volume;

// Web (SpeechSynthesisUtterance) rate ∈ [0.1..10], pitch ∈ [0..2], volume ∈ [0..1].
export const mapRateForWeb = (rate: number): number => rate * 2;
export const mapPitchForWeb = (pitch: number): number => pitch;
export const mapVolumeForWeb = (volume: number): number => volume;
