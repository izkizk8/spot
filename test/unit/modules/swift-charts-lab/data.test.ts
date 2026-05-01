/**
 * T003: data.test.ts — Pure module test (no React, no mocks)
 *
 * Tests the `data.ts` pure module per contracts/dataset.md invariants.
 * This test MUST FAIL before T004 implements data.ts.
 */

import {
  initialDataset,
  randomize,
  addPoint,
  removePoint,
  nextMonthLabel,
  TINTS,
  CHART_TYPES,
  MIN_SERIES_SIZE,
  MAX_SERIES_SIZE,
  VALUE_MIN,
  VALUE_MAX,
  INITIAL_SIZE,
  INITIAL_MONTHS,
} from '@/modules/swift-charts-lab/data';

// Helper RNG function at module scope per linter
const rng = () => Math.random();

describe('data.ts — Constants', () => {
  it('MIN_SERIES_SIZE === 2', () => {
    expect(MIN_SERIES_SIZE).toBe(2);
  });

  it('MAX_SERIES_SIZE === 24', () => {
    expect(MAX_SERIES_SIZE).toBe(24);
  });

  it('VALUE_MIN === -10', () => {
    expect(VALUE_MIN).toBe(-10);
  });

  it('VALUE_MAX === 30', () => {
    expect(VALUE_MAX).toBe(30);
  });

  it('INITIAL_SIZE === 12', () => {
    expect(INITIAL_SIZE).toBe(12);
  });

  it('TINTS.length === 4 with expected ids', () => {
    expect(TINTS).toHaveLength(4);
    expect(TINTS.map((t) => t.id)).toEqual(['blue', 'green', 'orange', 'purple']);
  });

  it('CHART_TYPES deep-equals [line,bar,area,point]', () => {
    expect(CHART_TYPES).toEqual(['line', 'bar', 'area', 'point']);
  });
});

describe('data.ts — initialDataset()', () => {
  it('returns length 12', () => {
    const ds = initialDataset();
    expect(ds).toHaveLength(12);
  });

  it('months deep-equal INITIAL_MONTHS', () => {
    const ds = initialDataset();
    expect(ds.map((d) => d.month)).toEqual(INITIAL_MONTHS);
  });

  it('every value is finite, in [-10, 30], rounded to 1 decimal', () => {
    const ds = initialDataset();
    ds.forEach((d) => {
      expect(Number.isFinite(d.value)).toBe(true);
      expect(d.value).toBeGreaterThanOrEqual(VALUE_MIN);
      expect(d.value).toBeLessThanOrEqual(VALUE_MAX);
      // Check 1-decimal rounding: value * 10 is an integer
      expect(Math.round(d.value * 10)).toBe(d.value * 10);
    });
  });

  it('two successive calls return element-wise equal arrays (deterministic)', () => {
    const ds1 = initialDataset();
    const ds2 = initialDataset();
    expect(ds1).toEqual(ds2);
  });
});

describe('data.ts — randomize(data, seed)', () => {
  const seed1 = 12345;
  const seed2 = 67890;

  it('returns same length and same months as input', () => {
    const ds = initialDataset();
    const rand = randomize(ds, seed1);
    expect(rand).toHaveLength(ds.length);
    expect(rand.map((d) => d.month)).toEqual(ds.map((d) => d.month));
  });

  it('values are in range and 1-decimal rounded', () => {
    const ds = initialDataset();
    const rand = randomize(ds, seed1);
    rand.forEach((d) => {
      expect(Number.isFinite(d.value)).toBe(true);
      expect(d.value).toBeGreaterThanOrEqual(VALUE_MIN);
      expect(d.value).toBeLessThanOrEqual(VALUE_MAX);
      expect(Math.round(d.value * 10)).toBe(d.value * 10);
    });
  });

  it('same seed produces equal arrays', () => {
    const ds = initialDataset();
    const rand1 = randomize(ds, seed1);
    const rand2 = randomize(ds, seed1);
    expect(rand1).toEqual(rand2);
  });

  it('different seeds produce at least one differing value', () => {
    const ds = initialDataset();
    const rand1 = randomize(ds, seed1);
    const rand2 = randomize(ds, seed2);
    const hasDiff = rand1.some((d, i) => d.value !== rand2[i].value);
    expect(hasDiff).toBe(true);
  });
});

describe('data.ts — addPoint(data, seed)', () => {
  it('when length < 24, output length is +1 with appended month', () => {
    const ds = initialDataset(); // length 12
    const added = addPoint(ds, 1);
    expect(added).toHaveLength(13);
    // Prefix entries should be ===
    for (let i = 0; i < 12; i++) {
      expect(added[i]).toBe(ds[i]);
    }
    // Appended entry has next month
    expect(added[12].month).toBe(nextMonthLabel(ds[11].month));
    expect(added[12].value).toBeGreaterThanOrEqual(VALUE_MIN);
    expect(added[12].value).toBeLessThanOrEqual(VALUE_MAX);
    expect(Math.round(added[12].value * 10)).toBe(added[12].value * 10);
  });

  it('when length === 24, returns same reference', () => {
    let ds = initialDataset();
    // Add points until 24
    for (let i = 0; i < 12; i++) {
      ds = addPoint(ds, i);
    }
    expect(ds).toHaveLength(24);
    const beforeAdd = ds;
    const afterAdd = addPoint(ds, 99);
    expect(afterAdd).toBe(beforeAdd);
  });
});

describe('data.ts — removePoint(data)', () => {
  it('when length > 2, output length is -1 with prefix preserved', () => {
    const ds = initialDataset(); // length 12
    const removed = removePoint(ds);
    expect(removed).toHaveLength(11);
    // Prefix entries should be ===
    for (let i = 0; i < 11; i++) {
      expect(removed[i]).toBe(ds[i]);
    }
  });

  it('when length === 2, returns same reference', () => {
    let ds = initialDataset();
    // Remove points until 2
    for (let i = 0; i < 10; i++) {
      ds = removePoint(ds);
    }
    expect(ds).toHaveLength(2);
    const beforeRemove = ds;
    const afterRemove = removePoint(ds);
    expect(afterRemove).toBe(beforeRemove);
  });
});

describe('data.ts — nextMonthLabel(prev)', () => {
  it('Jan → Feb, Feb → Mar, etc.', () => {
    expect(nextMonthLabel('Jan')).toBe('Feb');
    expect(nextMonthLabel('Feb')).toBe('Mar');
    expect(nextMonthLabel('Nov')).toBe('Dec');
  });

  it('Dec → Jan ʼ27 (literal U+02BC)', () => {
    expect(nextMonthLabel('Dec')).toBe('Jan ʼ27');
  });

  it('Jan ʼ27 → Feb ʼ27', () => {
    expect(nextMonthLabel('Jan ʼ27')).toBe('Feb ʼ27');
  });

  it('Dec ʼ27 → Jan ʼ28', () => {
    expect(nextMonthLabel('Dec ʼ27')).toBe('Jan ʼ28');
  });

  it('Dec ʼ28 → Jan ʼ29', () => {
    expect(nextMonthLabel('Dec ʼ28')).toBe('Jan ʼ29');
  });
});

describe('data.ts — Composition: 30-step random walk', () => {
  it('keeps length in [2, 24], values in range, month labels distinct', () => {
    let ds = initialDataset();

    for (let step = 0; step < 30; step++) {
      const choice = rng();
      if (choice < 0.33 && ds.length < MAX_SERIES_SIZE) {
        ds = addPoint(ds, step);
      } else if (choice < 0.66 && ds.length > MIN_SERIES_SIZE) {
        ds = removePoint(ds);
      } else {
        ds = randomize(ds, step);
      }

      // Invariants
      expect(ds.length).toBeGreaterThanOrEqual(MIN_SERIES_SIZE);
      expect(ds.length).toBeLessThanOrEqual(MAX_SERIES_SIZE);

      ds.forEach((d) => {
        expect(Number.isFinite(d.value)).toBe(true);
        expect(d.value).toBeGreaterThanOrEqual(VALUE_MIN);
        expect(d.value).toBeLessThanOrEqual(VALUE_MAX);
        expect(Math.round(d.value * 10)).toBe(d.value * 10);
      });

      // Month labels pairwise distinct
      const months = ds.map((d) => d.month);
      const uniqueMonths = new Set(months);
      expect(uniqueMonths.size).toBe(months.length);
    }
  });
});
