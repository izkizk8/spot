/**
 * Unit tests: filter-types catalog (feature 064).
 */
import { FILTER_CATALOG, defaultParams, findFilter } from '@/modules/064-core-image/filter-types';
import type { FilterId } from '@/native/core-image.types';

describe('FILTER_CATALOG', () => {
  it('contains exactly 6 filters', () => {
    expect(FILTER_CATALOG).toHaveLength(6);
  });

  it('contains all expected filter ids', () => {
    const ids: FilterId[] = ['sepia', 'blur', 'vignette', 'color-invert', 'noir', 'sharpen'];
    ids.forEach((id) => {
      expect(FILTER_CATALOG.find((f) => f.id === id)).toBeDefined();
    });
  });

  it('every filter has a non-empty name, description, and ciFilterName', () => {
    FILTER_CATALOG.forEach((f) => {
      expect(f.name.length).toBeGreaterThan(0);
      expect(f.description.length).toBeGreaterThan(0);
      expect(f.ciFilterName.length).toBeGreaterThan(0);
    });
  });

  it('every ParameterDef has valid min < max and 0 < step', () => {
    FILTER_CATALOG.forEach((f) => {
      f.params.forEach((p) => {
        expect(p.min).toBeLessThan(p.max);
        expect(p.step).toBeGreaterThan(0);
        expect(p.defaultValue).toBeGreaterThanOrEqual(p.min);
        expect(p.defaultValue).toBeLessThanOrEqual(p.max);
      });
    });
  });

  it('color-invert and noir have no params', () => {
    expect(findFilter('color-invert')?.params).toHaveLength(0);
    expect(findFilter('noir')?.params).toHaveLength(0);
  });

  it('sepia has an intensity param', () => {
    const info = findFilter('sepia');
    expect(info?.params.find((p) => p.key === 'intensity')).toBeDefined();
  });

  it('blur has a radius param', () => {
    const info = findFilter('blur');
    expect(info?.params.find((p) => p.key === 'radius')).toBeDefined();
  });

  it('vignette has radius and intensity params', () => {
    const info = findFilter('vignette');
    expect(info?.params.find((p) => p.key === 'radius')).toBeDefined();
    expect(info?.params.find((p) => p.key === 'intensity')).toBeDefined();
  });
});

describe('findFilter', () => {
  it('returns the correct filter for a valid id', () => {
    const info = findFilter('sepia');
    expect(info?.id).toBe('sepia');
    expect(info?.ciFilterName).toBe('CISepiaTone');
  });

  it('returns undefined for an unknown id', () => {
    expect(findFilter('unknown' as FilterId)).toBeUndefined();
  });
});

describe('defaultParams', () => {
  it('returns a map with defaultValue for every param', () => {
    const info = findFilter('blur');
    if (!info) throw new Error('blur not found');
    const params = defaultParams(info);
    info.params.forEach((p) => {
      expect(params[p.key]).toBe(p.defaultValue);
    });
  });

  it('returns empty object for filters with no params', () => {
    const info = findFilter('color-invert');
    if (!info) throw new Error('color-invert not found');
    expect(defaultParams(info)).toEqual({});
  });
});
