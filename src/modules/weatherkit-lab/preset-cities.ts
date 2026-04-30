/**
 * preset-cities — frozen catalog of demo locations for the
 * WeatherKit Lab. Picked deliberately to span hemispheres /
 * climates: San Francisco, Tokyo, London, Sydney, Paris.
 *
 * The catalog is `as const` so consumers receive narrow string
 * unions and the array is frozen at import time. Pure module — no
 * React, no native imports.
 */

export interface PresetCity {
  readonly id: string;
  readonly label: string;
  readonly country: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly timezone: string;
}

export const PRESET_CITIES: readonly PresetCity[] = Object.freeze([
  {
    id: 'san-francisco',
    label: 'San Francisco',
    country: 'US',
    latitude: 37.7749,
    longitude: -122.4194,
    timezone: 'America/Los_Angeles',
  },
  {
    id: 'tokyo',
    label: 'Tokyo',
    country: 'JP',
    latitude: 35.6762,
    longitude: 139.6503,
    timezone: 'Asia/Tokyo',
  },
  {
    id: 'london',
    label: 'London',
    country: 'GB',
    latitude: 51.5074,
    longitude: -0.1278,
    timezone: 'Europe/London',
  },
  {
    id: 'sydney',
    label: 'Sydney',
    country: 'AU',
    latitude: -33.8688,
    longitude: 151.2093,
    timezone: 'Australia/Sydney',
  },
  {
    id: 'paris',
    label: 'Paris',
    country: 'FR',
    latitude: 48.8566,
    longitude: 2.3522,
    timezone: 'Europe/Paris',
  },
]);

export const DEFAULT_CITY_ID = 'san-francisco' as const;

export function findCityById(id: string): PresetCity | undefined {
  return PRESET_CITIES.find((c) => c.id === id);
}
