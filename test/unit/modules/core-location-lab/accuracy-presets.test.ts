/**
 * Tests for accuracy-presets.ts (feature 025)
 */
import * as Location from 'expo-location';

import {
  ACCURACY_PRESETS,
  DEFAULT_ACCURACY_PRESET,
  type AccuracyPreset,
  type AccuracyPresetLabel,
} from '@/modules/core-location-lab/accuracy-presets';

describe('accuracy-presets', () => {
  it('contains exactly 4 entries', () => {
    expect(ACCURACY_PRESETS).toHaveLength(4);
  });

  it('has the documented labels in order', () => {
    const labels = ACCURACY_PRESETS.map((p) => p.label);
    expect(labels).toEqual(['Best', 'Best for navigation', 'Hundred meters', 'Kilometer']);
  });

  it('each value is a member of Location.LocationAccuracy', () => {
    const validValues = Object.values(Location.LocationAccuracy);
    ACCURACY_PRESETS.forEach((preset) => {
      expect(validValues).toContain(preset.value);
    });
  });

  it('DEFAULT_ACCURACY_PRESET === ACCURACY_PRESETS[0] with label "Best"', () => {
    expect(DEFAULT_ACCURACY_PRESET).toBe(ACCURACY_PRESETS[0]);
    expect(DEFAULT_ACCURACY_PRESET.label).toBe('Best');
  });

  it('labels are unique', () => {
    const labels = ACCURACY_PRESETS.map((p) => p.label);
    const uniqueLabels = new Set(labels);
    expect(uniqueLabels.size).toBe(labels.length);
  });

  it('exports correct types', () => {
    // Type-level check - these would fail at compile time if incorrect
    const _preset: AccuracyPreset = ACCURACY_PRESETS[0];
    const _label: AccuracyPresetLabel = ACCURACY_PRESETS[0].label;
    expect(_preset).toBeDefined();
    expect(_label).toBeDefined();
  });
});
