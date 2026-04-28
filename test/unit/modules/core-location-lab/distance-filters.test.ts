/**
 * Tests for distance-filters.ts (feature 025)
 */
import {
  DISTANCE_FILTERS,
  DEFAULT_DISTANCE_FILTER,
  type DistanceFilter,
  type DistanceFilterMeters,
} from '@/modules/core-location-lab/distance-filters';

describe('distance-filters', () => {
  it('contains exactly 3 entries', () => {
    expect(DISTANCE_FILTERS).toHaveLength(3);
  });

  it('has meters values of exactly 5, 50, 500', () => {
    const meters = DISTANCE_FILTERS.map((f) => f.meters);
    expect(meters).toEqual([5, 50, 500]);
  });

  it('labels include the meter count and unit suffix', () => {
    DISTANCE_FILTERS.forEach((filter) => {
      expect(filter.label).toContain(String(filter.meters));
      expect(filter.label).toMatch(/m$/);
    });
  });

  it('DEFAULT_DISTANCE_FILTER === DISTANCE_FILTERS[0]', () => {
    expect(DEFAULT_DISTANCE_FILTER).toBe(DISTANCE_FILTERS[0]);
    expect(DEFAULT_DISTANCE_FILTER.meters).toBe(5);
  });

  it('exports correct types', () => {
    // Type-level check - these would fail at compile time if incorrect
    const _filter: DistanceFilter = DISTANCE_FILTERS[0];
    const _meters: DistanceFilterMeters = DISTANCE_FILTERS[0].meters;
    expect(_filter).toBeDefined();
    expect(_meters).toBeDefined();
  });
});
