/**
 * useWeather — feature 046 / WeatherKit Lab.
 *
 * Wraps `src/native/weatherkit.ts` into a React-friendly state
 * machine. Owns:
 *   - the picked city (or current-location lat/lng);
 *   - the unit system selection (metric / imperial / scientific);
 *   - the current / hourly / daily payloads + alerts;
 *   - the loading flag and `lastError` string.
 *
 * Contracts:
 *   - All async helpers are no-throw: errors surface via `lastError`.
 *   - The hook ignores async completions that resolve after unmount
 *     (an internal `aliveRef` guards every state update).
 *   - The native bridge is loaded via a getter so tests can swap it
 *     out using `__setWeatherBridgeForTests`.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import defaultBridge from '@/native/weatherkit';
import type {
  CurrentWeather,
  DailyForecastEntry,
  HourlyForecastEntry,
  UnitSystem,
  WeatherAlert,
  WeatherKitBridge,
} from '@/native/weatherkit.types';

import { DEFAULT_CITY_ID, findCityById, type PresetCity, PRESET_CITIES } from '../preset-cities';

let bridgeOverride: WeatherKitBridge | null = null;

/**
 * Test helper — replaces the bridge resolved by `useWeather`. Pass
 * `null` to restore the default bridge. Exported only for tests.
 */
export function __setWeatherBridgeForTests(b: WeatherKitBridge | null): void {
  bridgeOverride = b;
}

function getBridge(): WeatherKitBridge {
  return bridgeOverride ?? (defaultBridge as unknown as WeatherKitBridge);
}

export interface UseWeatherReturn {
  readonly available: boolean | null;
  readonly cityId: string;
  readonly city: PresetCity | undefined;
  readonly units: UnitSystem;
  readonly current: CurrentWeather | null;
  readonly hourly: readonly HourlyForecastEntry[];
  readonly daily: readonly DailyForecastEntry[];
  readonly alerts: readonly WeatherAlert[];
  readonly loading: boolean;
  readonly lastError: string | null;
  selectCity(id: string): void;
  selectUnits(u: UnitSystem): void;
  refresh(): Promise<void>;
  reset(): void;
}

const NO_HOURLY: readonly HourlyForecastEntry[] = Object.freeze([]);
const NO_DAILY: readonly DailyForecastEntry[] = Object.freeze([]);
const NO_ALERTS: readonly WeatherAlert[] = Object.freeze([]);

export const DEFAULT_UNITS: UnitSystem = 'metric';

export function useWeather(): UseWeatherReturn {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [cityId, setCityId] = useState<string>(DEFAULT_CITY_ID);
  const [units, setUnits] = useState<UnitSystem>(DEFAULT_UNITS);
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [hourly, setHourly] = useState<readonly HourlyForecastEntry[]>(NO_HOURLY);
  const [daily, setDaily] = useState<readonly DailyForecastEntry[]>(NO_DAILY);
  const [alerts, setAlerts] = useState<readonly WeatherAlert[]>(NO_ALERTS);
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const safeError = useCallback((err: unknown) => {
    if (!aliveRef.current) return;
    const msg = err instanceof Error ? err.message : String(err);
    setLastError(msg);
  }, []);

  const refresh = useCallback(async () => {
    const bridge = getBridge();
    let avail = false;
    try {
      avail = bridge.isAvailable();
    } catch (err) {
      safeError(err);
    }
    if (!aliveRef.current) return;
    setAvailable(avail);

    const target = findCityById(cityId) ?? PRESET_CITIES[0];
    if (!target) return;

    setLoading(true);
    setLastError(null);

    try {
      const [c, h, d, a] = await Promise.all([
        bridge.getCurrent(target.latitude, target.longitude, units),
        bridge.getHourly(target.latitude, target.longitude, units),
        bridge.getDaily(target.latitude, target.longitude, units),
        bridge.getAlerts(target.latitude, target.longitude),
      ]);
      if (!aliveRef.current) return;
      setCurrent(c);
      setHourly(h);
      setDaily(d);
      setAlerts(a);
    } catch (err) {
      safeError(err);
    } finally {
      if (aliveRef.current) {
        setLoading(false);
      }
    }
  }, [cityId, units, safeError]);

  const selectCity = useCallback((id: string) => {
    setCityId(id);
  }, []);

  const selectUnits = useCallback((u: UnitSystem) => {
    setUnits(u);
  }, []);

  const reset = useCallback(() => {
    setCurrent(null);
    setHourly(NO_HOURLY);
    setDaily(NO_DAILY);
    setAlerts(NO_ALERTS);
    setLoading(false);
    setLastError(null);
  }, []);

  return {
    available,
    cityId,
    city: findCityById(cityId),
    units,
    current,
    hourly,
    daily,
    alerts,
    loading,
    lastError,
    selectCity,
    selectUnits,
    refresh,
    reset,
  };
}
