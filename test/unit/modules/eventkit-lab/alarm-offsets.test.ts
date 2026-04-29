/**
 * alarm-offsets.ts — unit tests.
 * Feature: 037-eventkit
 *
 * @see specs/037-eventkit/contracts/helpers.md §B (A1–A8)
 */

import {
  ALARM_OFFSET_LABELS,
  ALARM_OFFSET_PRESETS,
  type AlarmOffsetPreset,
  toAlarmsArray,
} from '@/modules/eventkit-lab/alarm-offsets';

describe('alarm-offsets', () => {
  // A1: the four preset keys are unique and exactly the union members
  it('A1: ALARM_OFFSET_PRESETS contains exactly the four presets in order', () => {
    expect(ALARM_OFFSET_PRESETS).toEqual(['none', '5min', '15min', '1hour']);
    // Uniqueness
    expect(new Set(ALARM_OFFSET_PRESETS).size).toBe(ALARM_OFFSET_PRESETS.length);
  });

  // A2: every preset has a non-empty label
  it('A2: every preset has a non-empty label', () => {
    for (const preset of ALARM_OFFSET_PRESETS) {
      expect(ALARM_OFFSET_LABELS[preset]).toBeTruthy();
      expect(typeof ALARM_OFFSET_LABELS[preset]).toBe('string');
      expect(ALARM_OFFSET_LABELS[preset].length).toBeGreaterThan(0);
    }
  });

  // A3: toAlarmsArray('none') === undefined (strict)
  it("A3: toAlarmsArray('none') is strictly undefined", () => {
    expect(toAlarmsArray('none')).toBeUndefined();
  });

  // A4: toAlarmsArray('5min')
  it("A4: toAlarmsArray('5min') deep-equals [{ relativeOffset: -5 }]", () => {
    expect(toAlarmsArray('5min')).toEqual([{ relativeOffset: -5 }]);
  });

  // A5: toAlarmsArray('15min')
  it("A5: toAlarmsArray('15min') deep-equals [{ relativeOffset: -15 }]", () => {
    expect(toAlarmsArray('15min')).toEqual([{ relativeOffset: -15 }]);
  });

  // A6: toAlarmsArray('1hour')
  it("A6: toAlarmsArray('1hour') deep-equals [{ relativeOffset: -60 }]", () => {
    expect(toAlarmsArray('1hour')).toEqual([{ relativeOffset: -60 }]);
  });

  // A7: purity — fresh objects per call
  it('A7: toAlarmsArray returns fresh objects on each call', () => {
    const presets: AlarmOffsetPreset[] = ['5min', '15min', '1hour'];
    for (const preset of presets) {
      const a = toAlarmsArray(preset);
      const b = toAlarmsArray(preset);
      expect(a).toEqual(b);
      expect(a).not.toBe(b);
    }
  });
});
