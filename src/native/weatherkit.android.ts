/**
 * WeatherKit Bridge — Android variant (feature 046). All async
 * methods reject with `WeatherKitNotSupported`; `isAvailable()`
 * returns false. MUST NOT import the iOS bridge file.
 */

import {
  type CurrentWeather,
  type DailyForecastEntry,
  type HourlyForecastEntry,
  type UnitSystem,
  type WeatherAlert,
  type WeatherAttribution,
  WeatherKitNotSupported,
} from './weatherkit.types';

export { WeatherKitNotSupported };

const ERR = (): WeatherKitNotSupported =>
  new WeatherKitNotSupported('WeatherKit is not available on Android');

export function isAvailable(): boolean {
  return false;
}

export function getCurrent(
  _lat: number,
  _lng: number,
  _units: UnitSystem,
): Promise<CurrentWeather> {
  return Promise.reject(ERR());
}

export function getHourly(
  _lat: number,
  _lng: number,
  _units: UnitSystem,
): Promise<readonly HourlyForecastEntry[]> {
  return Promise.reject(ERR());
}

export function getDaily(
  _lat: number,
  _lng: number,
  _units: UnitSystem,
): Promise<readonly DailyForecastEntry[]> {
  return Promise.reject(ERR());
}

export function getAlerts(_lat: number, _lng: number): Promise<readonly WeatherAlert[]> {
  return Promise.reject(ERR());
}

export function getAttribution(): Promise<WeatherAttribution> {
  return Promise.reject(ERR());
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
