/**
 * date-ranges.ts — unit tests.
 * Feature: 037-eventkit
 *
 * @see specs/037-eventkit/contracts/helpers.md §A (D1–D7)
 */

import {
  DATE_RANGE_LABELS,
  DATE_RANGE_PRESETS,
  type DateRangePreset,
  computeRange,
} from '@/modules/eventkit-lab/date-ranges';

describe('date-ranges', () => {
  const fixedNow = new Date(2025, 5, 15, 14, 30, 0, 0); // 2025-06-15T14:30 local

  describe('DATE_RANGE_PRESETS', () => {
    it('contains exactly the three presets in order', () => {
      expect(DATE_RANGE_PRESETS).toEqual(['today', 'next7', 'next30']);
    });
  });

  describe('DATE_RANGE_LABELS', () => {
    it('maps every preset to a non-empty label', () => {
      for (const preset of DATE_RANGE_PRESETS) {
        expect(DATE_RANGE_LABELS[preset]).toBeTruthy();
        expect(typeof DATE_RANGE_LABELS[preset]).toBe('string');
      }
    });
  });

  describe('computeRange', () => {
    const presets: DateRangePreset[] = ['today', 'next7', 'next30'];
    const expectedDays: Record<DateRangePreset, number> = {
      today: 1,
      next7: 7,
      next30: 30,
    };

    // D1: purity — identical inputs produce deep-equal outputs across calls
    it('D1: is pure — repeated calls with same input produce deep-equal outputs', () => {
      for (const preset of presets) {
        const a = computeRange(preset, fixedNow);
        const b = computeRange(preset, fixedNow);
        expect(a).toEqual(b);
        // Fresh objects, not aliased
        expect(a.startDate).not.toBe(b.startDate);
        expect(a.endDate).not.toBe(b.endDate);
        // Not aliasing now
        expect(a.startDate).not.toBe(fixedNow);
        expect(a.endDate).not.toBe(fixedNow);
      }
    });

    // D2: startDate <= endDate
    it.each(presets)('D2: %s — startDate <= endDate', (preset) => {
      const { startDate, endDate } = computeRange(preset, fixedNow);
      expect(startDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
    });

    // D3: startDate is start-of-day
    it.each(presets)('D3: %s — startDate is start-of-day', (preset) => {
      const { startDate } = computeRange(preset, fixedNow);
      expect(startDate.getHours()).toBe(0);
      expect(startDate.getMinutes()).toBe(0);
      expect(startDate.getSeconds()).toBe(0);
      expect(startDate.getMilliseconds()).toBe(0);
    });

    // D4: endDate is end-of-day
    it.each(presets)('D4: %s — endDate is end-of-day', (preset) => {
      const { endDate } = computeRange(preset, fixedNow);
      expect(endDate.getHours()).toBe(23);
      expect(endDate.getMinutes()).toBe(59);
      expect(endDate.getSeconds()).toBe(59);
    });

    // D5: day count per preset
    it.each(presets)('D5: %s — spans %i calendar days', (preset) => {
      const { startDate, endDate } = computeRange(preset, fixedNow);
      // Calendar-day count: difference in dates (local midnight-to-midnight) + 1
      const msPerDay = 24 * 60 * 60 * 1000;
      const startMidnight = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
      );
      const endMidnight = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate(),
      );
      const dayCount = Math.round((endMidnight.getTime() - startMidnight.getTime()) / msPerDay) + 1;
      expect(dayCount).toBe(expectedDays[preset]);
    });

    // D6: DST stability — spring-forward and fall-back boundaries
    it('D6: DST spring-forward boundary', () => {
      // 2025-03-09 is US spring-forward
      const springNow = new Date(2025, 2, 9, 12, 0, 0);
      for (const preset of ['next7', 'next30'] as const) {
        const { startDate, endDate } = computeRange(preset, springNow);
        expect(startDate.getHours()).toBe(0);
        expect(startDate.getMinutes()).toBe(0);
        expect(endDate.getHours()).toBe(23);
        expect(endDate.getMinutes()).toBe(59);
        expect(endDate.getSeconds()).toBe(59);

        // Verify day count
        const startMidnight = new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate(),
        );
        const endMidnight = new Date(
          endDate.getFullYear(),
          endDate.getMonth(),
          endDate.getDate(),
        );
        const msPerDay = 24 * 60 * 60 * 1000;
        const dayCount =
          Math.round((endMidnight.getTime() - startMidnight.getTime()) / msPerDay) + 1;
        expect(dayCount).toBe(expectedDays[preset]);
      }
    });

    it('D6: DST fall-back boundary', () => {
      // 2025-11-02 is US fall-back
      const fallNow = new Date(2025, 10, 2, 12, 0, 0);
      for (const preset of ['next7', 'next30'] as const) {
        const { startDate, endDate } = computeRange(preset, fallNow);
        expect(startDate.getHours()).toBe(0);
        expect(endDate.getHours()).toBe(23);
        expect(endDate.getMinutes()).toBe(59);

        const startMidnight = new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate(),
        );
        const endMidnight = new Date(
          endDate.getFullYear(),
          endDate.getMonth(),
          endDate.getDate(),
        );
        const msPerDay = 24 * 60 * 60 * 1000;
        const dayCount =
          Math.round((endMidnight.getTime() - startMidnight.getTime()) / msPerDay) + 1;
        expect(dayCount).toBe(expectedDays[preset]);
      }
    });
  });
});
