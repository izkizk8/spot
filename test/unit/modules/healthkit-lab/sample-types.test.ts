/**
 * @jest-environment node
 */

import {
  type AuthStatus,
  type HealthSampleId,
  READ_PERMISSIONS,
  SAMPLE_IDS,
  WRITE_PERMISSIONS,
  formatDuration,
  formatMinutes,
  labelForSample,
  lastNDates,
  makeInitialAuthMap,
  mapSleepValue,
} from '@/modules/healthkit-lab/sample-types';

describe('healthkit-lab sample-types — permission sets', () => {
  it('READ_PERMISSIONS is frozen and includes the documented identifiers', () => {
    expect(Object.isFrozen(READ_PERMISSIONS)).toBe(true);
    expect(READ_PERMISSIONS).toEqual(
      expect.arrayContaining(['StepCount', 'HeartRate', 'SleepAnalysis', 'Workout', 'Weight']),
    );
  });

  it('WRITE_PERMISSIONS is frozen and only contains writable types', () => {
    expect(Object.isFrozen(WRITE_PERMISSIONS)).toBe(true);
    expect(WRITE_PERMISSIONS).toEqual(['HeartRate', 'Weight']);
  });

  it('SAMPLE_IDS is frozen and ordered for the AuthorizationCard', () => {
    expect(Object.isFrozen(SAMPLE_IDS)).toBe(true);
    expect(SAMPLE_IDS).toEqual(['steps', 'heartRate', 'sleep', 'workouts', 'weight']);
  });

  it('SAMPLE_IDS has no duplicates', () => {
    expect(new Set(SAMPLE_IDS).size).toBe(SAMPLE_IDS.length);
  });
});

describe('labelForSample', () => {
  it.each(SAMPLE_IDS)('returns a non-empty label for %s', (id) => {
    expect(labelForSample(id).length).toBeGreaterThan(0);
  });
});

describe('makeInitialAuthMap', () => {
  it('returns a frozen map with every sample id set to undetermined', () => {
    const map = makeInitialAuthMap();
    expect(Object.isFrozen(map)).toBe(true);
    for (const id of SAMPLE_IDS) {
      const status: AuthStatus = map[id];
      expect(status).toBe('undetermined');
    }
  });

  it('returns a fresh object on every call', () => {
    const a = makeInitialAuthMap();
    const b = makeInitialAuthMap();
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});

describe('formatMinutes', () => {
  it.each([
    [0, '0:00'],
    [1, '0:01'],
    [59, '0:59'],
    [60, '1:00'],
    [95, '1:35'],
    [600, '10:00'],
  ])('formatMinutes(%i) => %s', (input, expected) => {
    expect(formatMinutes(input)).toBe(expected);
  });

  it('clamps negative inputs to 0:00', () => {
    expect(formatMinutes(-5)).toBe('0:00');
  });

  it('handles non-finite inputs', () => {
    expect(formatMinutes(NaN)).toBe('0:00');
    expect(formatMinutes(Infinity)).toBe('0:00');
  });
});

describe('formatDuration', () => {
  it.each([
    [0, '00:00'],
    [5, '00:05'],
    [65, '01:05'],
    [3599, '59:59'],
    [3600, '1:00:00'],
    [3725, '1:02:05'],
  ])('formatDuration(%i) => %s', (input, expected) => {
    expect(formatDuration(input)).toBe(expected);
  });

  it('returns 00:00 for negative or non-finite inputs', () => {
    expect(formatDuration(-5)).toBe('00:00');
    expect(formatDuration(NaN)).toBe('00:00');
  });
});

describe('mapSleepValue', () => {
  it.each<[string, ReturnType<typeof mapSleepValue>]>([
    ['INBED', 'inBed'],
    ['Awake', 'awake'],
    ['HKCategoryValueSleepAnalysisAsleepREM', 'rem'],
    ['HKCategoryValueSleepAnalysisAsleepDeep', 'deep'],
    ['HKCategoryValueSleepAnalysisAsleepCore', 'core'],
    ['HKCategoryValueSleepAnalysisAsleepUnspecified', 'asleep'],
  ])('mapSleepValue(%s) => %s', (raw, expected) => {
    expect(mapSleepValue(raw)).toBe(expected);
  });

  it('falls back to asleep for unknown values', () => {
    expect(mapSleepValue('garbage')).toBe('asleep');
    expect(mapSleepValue('')).toBe('asleep');
  });
});

describe('lastNDates', () => {
  it('returns N consecutive ISO dates ending at endIso', () => {
    const out = lastNDates(3, '2026-04-30T12:00:00.000Z');
    expect(out).toEqual(['2026-04-28', '2026-04-29', '2026-04-30']);
  });

  it('is frozen', () => {
    const out = lastNDates(2, '2026-04-30T00:00:00.000Z');
    expect(Object.isFrozen(out)).toBe(true);
  });

  it('returns an empty frozen array for non-positive n', () => {
    const out = lastNDates(0);
    expect(out).toEqual([]);
    expect(Object.isFrozen(out)).toBe(true);
  });

  it('falls back to today on invalid endIso', () => {
    const out = lastNDates(1, 'not-a-date');
    expect(out).toHaveLength(1);
    expect(out[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('uses HealthSampleId discriminant to lookup labels', () => {
    const id: HealthSampleId = 'workouts';
    expect(labelForSample(id)).toBe('Workouts');
  });
});
