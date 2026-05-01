/**
 * @jest-environment node
 */

import {
  M_TO_FT,
  formatDimensions,
  formatFeetInches,
  formatMeters,
  metersToFeet,
  metersToFeetInches,
  totalSurfaces,
} from '@/modules/lidar-roomplan-lab/units-utils';

describe('units-utils', () => {
  describe('M_TO_FT', () => {
    it('matches the canonical conversion factor', () => {
      expect(M_TO_FT).toBeCloseTo(3.280839895, 6);
    });
  });

  describe('metersToFeet', () => {
    it('converts metres to feet', () => {
      expect(metersToFeet(1)).toBeCloseTo(3.28084, 4);
    });

    it('returns 0 for non-finite inputs', () => {
      expect(metersToFeet(Number.NaN)).toBe(0);
      expect(metersToFeet(Number.POSITIVE_INFINITY)).toBe(0);
      expect(metersToFeet(Number.NEGATIVE_INFINITY)).toBe(0);
    });

    it('handles zero', () => {
      expect(metersToFeet(0)).toBe(0);
    });
  });

  describe('metersToFeetInches', () => {
    it('splits 1 m into 3′ 3″', () => {
      const r = metersToFeetInches(1);
      expect(r).toEqual({ feet: 3, inches: 3 });
    });

    it('rounds inches to the nearest integer', () => {
      // 0.999 m ≈ 39.32 inches → rounded to 39 → 3 ft 3 in
      const r = metersToFeetInches(0.999);
      expect(r).toEqual({ feet: 3, inches: 3 });
    });

    it('zero metres → 0 ft 0 in', () => {
      expect(metersToFeetInches(0)).toEqual({ feet: 0, inches: 0 });
    });

    it('negative or non-finite inputs collapse to zero', () => {
      expect(metersToFeetInches(-1)).toEqual({ feet: 0, inches: 0 });
      expect(metersToFeetInches(Number.NaN)).toEqual({ feet: 0, inches: 0 });
    });

    it('inches are always in [0, 12)', () => {
      for (const m of [0.1, 0.5, 1, 2.5, 3.456, 10]) {
        const r = metersToFeetInches(m);
        expect(r.inches).toBeGreaterThanOrEqual(0);
        expect(r.inches).toBeLessThan(12);
      }
    });
  });

  describe('formatMeters', () => {
    it('renders two decimals by default', () => {
      expect(formatMeters(3.456)).toBe('3.46 m');
    });

    it('respects a custom fractionDigits', () => {
      expect(formatMeters(3.456, 1)).toBe('3.5 m');
    });

    it('non-finite inputs render as em-dash', () => {
      expect(formatMeters(Number.NaN)).toBe('—');
      expect(formatMeters(Number.POSITIVE_INFINITY)).toBe('—');
    });
  });

  describe('formatFeetInches', () => {
    it('renders 1 m as 3′ 3″', () => {
      expect(formatFeetInches(1)).toBe('3′ 3″');
    });

    it('non-finite inputs render as em-dash', () => {
      expect(formatFeetInches(Number.NaN)).toBe('—');
    });
  });

  describe('formatDimensions', () => {
    it('renders W × L × H in metres', () => {
      const out = formatDimensions({ widthM: 3, lengthM: 4, heightM: 2.5 });
      expect(out).toBe('3.00 m × 4.00 m × 2.50 m');
    });
  });

  describe('totalSurfaces', () => {
    it('sums all categories', () => {
      expect(
        totalSurfaces({
          walls: 4,
          windows: 2,
          doors: 1,
          openings: 1,
          objects: 5,
        }),
      ).toBe(13);
    });

    it('clamps non-finite or negative contributions to zero', () => {
      expect(
        totalSurfaces({
          walls: Number.NaN,
          windows: -3,
          doors: 1,
          openings: Number.POSITIVE_INFINITY,
          objects: 2,
        }),
      ).toBe(3);
    });

    it('returns 0 for an all-zero record', () => {
      expect(totalSurfaces({ walls: 0, windows: 0, doors: 0, openings: 0, objects: 0 })).toBe(0);
    });
  });
});
