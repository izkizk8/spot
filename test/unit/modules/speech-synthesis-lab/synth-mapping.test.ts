/**
 * T010: synth-mapping pure function tests.
 */

import {
  PITCH_PRESET_TO_IOS,
  RATE_PRESET_TO_IOS,
  VOLUME_PRESET_TO_IOS,
  mapPitchForAndroid,
  mapPitchForWeb,
  mapRateForAndroid,
  mapRateForWeb,
  mapVolumeForAndroid,
  mapVolumeForWeb,
  pitchPresetToValue,
  ratePresetToValue,
  volumePresetToValue,
} from '@/modules/speech-synthesis-lab/synth-mapping';

describe('synth-mapping', () => {
  it('RATE_PRESET_TO_IOS exact values', () => {
    expect(RATE_PRESET_TO_IOS).toEqual({ Slow: 0.4, Normal: 0.5, Fast: 0.6 });
  });

  it('PITCH_PRESET_TO_IOS exact values', () => {
    expect(PITCH_PRESET_TO_IOS).toEqual({ Low: 0.75, Normal: 1.0, High: 1.5 });
  });

  it('VOLUME_PRESET_TO_IOS exact values', () => {
    expect(VOLUME_PRESET_TO_IOS).toEqual({ Low: 0.3, Normal: 0.7, High: 1.0 });
  });

  it('preset getters delegate to the constants', () => {
    expect(ratePresetToValue('Normal')).toBe(0.5);
    expect(pitchPresetToValue('Normal')).toBe(1.0);
    expect(volumePresetToValue('Normal')).toBe(0.7);
  });

  it('Android mapping: rate*=2, pitch identity, volume identity', () => {
    expect(mapRateForAndroid(0.5)).toBe(1.0);
    expect(mapPitchForAndroid(1.0)).toBe(1.0);
    expect(mapVolumeForAndroid(0.7)).toBe(0.7);
  });

  it('Web mapping: rate*=2, pitch identity, volume identity', () => {
    expect(mapRateForWeb(0.5)).toBe(1.0);
    expect(mapPitchForWeb(1.0)).toBe(1.0);
    expect(mapVolumeForWeb(0.7)).toBe(0.7);
  });

  it('boundary values pass through correctly', () => {
    expect(mapRateForAndroid(0)).toBe(0);
    expect(mapRateForAndroid(1)).toBe(2);
    expect(mapPitchForWeb(0.5)).toBe(0.5);
    expect(mapPitchForWeb(2)).toBe(2);
    expect(mapVolumeForAndroid(0)).toBe(0);
    expect(mapVolumeForAndroid(1)).toBe(1);
  });
});
