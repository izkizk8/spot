/**
 * @jest-environment node
 */

import {
  DEFAULT_CITY_ID,
  findCityById,
  PRESET_CITIES,
} from '@/modules/weatherkit-lab/preset-cities';

describe('preset-cities', () => {
  it('exposes exactly 5 preset cities', () => {
    expect(PRESET_CITIES).toHaveLength(5);
  });

  it('declares the documented 5 city ids', () => {
    const ids = PRESET_CITIES.map((c) => c.id);
    expect(ids).toEqual(['san-francisco', 'tokyo', 'london', 'sydney', 'paris']);
  });

  it('city ids are unique', () => {
    const ids = PRESET_CITIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all entries declare valid lat/lng ranges', () => {
    for (const c of PRESET_CITIES) {
      expect(c.latitude).toBeGreaterThanOrEqual(-90);
      expect(c.latitude).toBeLessThanOrEqual(90);
      expect(c.longitude).toBeGreaterThanOrEqual(-180);
      expect(c.longitude).toBeLessThanOrEqual(180);
    }
  });

  it('all entries declare a non-empty timezone and country', () => {
    for (const c of PRESET_CITIES) {
      expect(c.timezone.length).toBeGreaterThan(0);
      expect(c.country.length).toBeGreaterThan(0);
    }
  });

  it('the catalog is frozen', () => {
    expect(Object.isFrozen(PRESET_CITIES)).toBe(true);
  });

  it('DEFAULT_CITY_ID resolves to a real city', () => {
    expect(findCityById(DEFAULT_CITY_ID)).toBeDefined();
    expect(findCityById(DEFAULT_CITY_ID)?.label).toBe('San Francisco');
  });

  it('findCityById returns undefined for an unknown id', () => {
    expect(findCityById('atlantis')).toBeUndefined();
  });

  it('Sydney is in the southern hemisphere (negative latitude)', () => {
    const sydney = findCityById('sydney');
    expect(sydney).toBeDefined();
    expect(sydney!.latitude).toBeLessThan(0);
  });
});
