/**
 * WeatherKit Bridge — iOS variant (feature 046).
 *
 * Single seam where the `WeatherKitBridge` Expo Module is touched.
 * On Android / Web the platform-specific siblings throw
 * `WeatherKitNotSupported` for every method.
 *
 * The native module is resolved via `requireOptionalNativeModule` so
 * the surface is null-safe in unit tests where the module is absent.
 *
 * Mocking strategy in tests: `jest.mock('expo-modules-core')` with a
 * `requireOptionalNativeModule` factory that returns a fake bridge.
 */

import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

import {
  type CurrentWeather,
  type DailyForecastEntry,
  type HourlyForecastEntry,
  NATIVE_MODULE_NAME,
  type UnitSystem,
  type WeatherAlert,
  type WeatherAttribution,
  WeatherKitNotSupported,
} from './weatherkit.types';

export { WeatherKitNotSupported };

interface NativeWeatherKitBridge {
  isAvailable(): boolean;
  getCurrent(lat: number, lng: number, units: UnitSystem): Promise<CurrentWeather>;
  getHourly(lat: number, lng: number, units: UnitSystem): Promise<readonly HourlyForecastEntry[]>;
  getDaily(lat: number, lng: number, units: UnitSystem): Promise<readonly DailyForecastEntry[]>;
  getAlerts(lat: number, lng: number): Promise<readonly WeatherAlert[]>;
  getAttribution(): Promise<WeatherAttribution>;
}

function getNative(): NativeWeatherKitBridge | null {
  return requireOptionalNativeModule<NativeWeatherKitBridge>(NATIVE_MODULE_NAME);
}

function ensureNative(): NativeWeatherKitBridge {
  if (Platform.OS !== 'ios') {
    throw new WeatherKitNotSupported(`WeatherKit is not available on ${Platform.OS}`);
  }
  const native = getNative();
  if (!native) {
    throw new WeatherKitNotSupported('WeatherKit native module is not registered');
  }
  return native;
}

export function isAvailable(): boolean {
  if (Platform.OS !== 'ios') return false;
  const native = getNative();
  return native !== null && native.isAvailable();
}

export function getCurrent(lat: number, lng: number, units: UnitSystem): Promise<CurrentWeather> {
  try {
    return ensureNative().getCurrent(lat, lng, units);
  } catch (err) {
    return Promise.reject(err);
  }
}

export function getHourly(
  lat: number,
  lng: number,
  units: UnitSystem,
): Promise<readonly HourlyForecastEntry[]> {
  try {
    return ensureNative().getHourly(lat, lng, units);
  } catch (err) {
    return Promise.reject(err);
  }
}

export function getDaily(
  lat: number,
  lng: number,
  units: UnitSystem,
): Promise<readonly DailyForecastEntry[]> {
  try {
    return ensureNative().getDaily(lat, lng, units);
  } catch (err) {
    return Promise.reject(err);
  }
}

export function getAlerts(lat: number, lng: number): Promise<readonly WeatherAlert[]> {
  try {
    return ensureNative().getAlerts(lat, lng);
  } catch (err) {
    return Promise.reject(err);
  }
}

export function getAttribution(): Promise<WeatherAttribution> {
  try {
    return ensureNative().getAttribution();
  } catch (err) {
    return Promise.reject(err);
  }
}

export const weatherkit = {
  isAvailable,
  getCurrent,
  getHourly,
  getDaily,
  getAlerts,
  getAttribution,
};

export default weatherkit;
