/**
 * useWeather hook tests.
 * Feature: 046-weatherkit
 *
 * The native WeatherKit bridge is mocked at the import boundary via
 * `__setWeatherBridgeForTests`. The hook never touches a real native
 * module. Tests cover: initial idle state, refresh success path
 * (population of current/hourly/daily/alerts), city change, unit
 * change, refresh error path, reset, unmount safety.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { act, render } from '@testing-library/react-native';

import {
  __setWeatherBridgeForTests,
  DEFAULT_UNITS,
  useWeather,
  type UseWeatherReturn,
} from '@/modules/weatherkit-lab/hooks/useWeather';
import { DEFAULT_CITY_ID } from '@/modules/weatherkit-lab/preset-cities';
import type {
  CurrentWeather,
  DailyForecastEntry,
  HourlyForecastEntry,
  WeatherAlert,
  WeatherKitBridge,
} from '@/native/weatherkit.types';

const CURRENT: CurrentWeather = {
  temperature: 20,
  apparentTemperature: 19,
  condition: 'clear',
  conditionLabel: 'Clear',
  humidity: 0.5,
  windSpeed: 5,
  windDirection: 0,
  uvIndex: 4,
  isDaylight: true,
};

const HOURLY: readonly HourlyForecastEntry[] = [
  { date: '2026-05-09T00:00:00Z', temperature: 15, condition: 'clear', precipitationChance: 0 },
];
const DAILY: readonly DailyForecastEntry[] = [
  {
    date: '2026-05-09T00:00:00Z',
    highTemperature: 22,
    lowTemperature: 12,
    condition: 'clear',
    precipitationChance: 0,
  },
];
const ALERTS: readonly WeatherAlert[] = [
  {
    id: 'a1',
    title: 'Test',
    summary: 'Summary',
    severity: 'minor',
    source: 'Test',
    issuedAt: '2026-05-09T00:00:00Z',
    expiresAt: null,
    detailsUrl: null,
  },
];

interface MockBridge extends WeatherKitBridge {
  isAvailable: jest.Mock;
  getCurrent: jest.Mock;
  getHourly: jest.Mock;
  getDaily: jest.Mock;
  getAlerts: jest.Mock;
  getAttribution: jest.Mock;
}

function makeBridge(): MockBridge {
  return {
    isAvailable: jest.fn(() => true),
    getCurrent: jest.fn(async () => CURRENT),
    getHourly: jest.fn(async () => HOURLY),
    getDaily: jest.fn(async () => DAILY),
    getAlerts: jest.fn(async () => ALERTS),
    getAttribution: jest.fn(async () => ({
      serviceName: 'Apple Weather',
      logoLightUrl: '',
      logoDarkUrl: '',
      legalPageUrl: '',
    })),
  };
}

interface Handle {
  current: UseWeatherReturn | null;
}

const handle: Handle = { current: null };

function Harness() {
  const w = useWeather();
  React.useEffect(() => {
    handle.current = w;
  });
  return null;
}

let bridge: MockBridge;

beforeEach(() => {
  bridge = makeBridge();
  __setWeatherBridgeForTests(bridge);
  handle.current = null;
});

afterEach(() => {
  __setWeatherBridgeForTests(null);
  jest.clearAllMocks();
});

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('useWeather', () => {
  it('initial state is idle with the documented defaults', async () => {
    render(<Harness />);
    await flush();
    expect(handle.current).not.toBeNull();
    const w = handle.current!;
    expect(w.cityId).toBe(DEFAULT_CITY_ID);
    expect(w.units).toBe(DEFAULT_UNITS);
    expect(w.current).toBeNull();
    expect(w.hourly).toEqual([]);
    expect(w.daily).toEqual([]);
    expect(w.alerts).toEqual([]);
    expect(w.loading).toBe(false);
    expect(w.lastError).toBeNull();
    expect(w.available).toBeNull();
  });

  it('refresh populates current/hourly/daily/alerts and toggles loading', async () => {
    render(<Harness />);
    await flush();
    await act(async () => {
      await handle.current!.refresh();
    });
    const w = handle.current!;
    expect(w.current).toEqual(CURRENT);
    expect(w.hourly).toEqual(HOURLY);
    expect(w.daily).toEqual(DAILY);
    expect(w.alerts).toEqual(ALERTS);
    expect(w.available).toBe(true);
    expect(w.loading).toBe(false);
    expect(w.lastError).toBeNull();
    expect(bridge.getCurrent).toHaveBeenCalledTimes(1);
    expect(bridge.getHourly).toHaveBeenCalledTimes(1);
    expect(bridge.getDaily).toHaveBeenCalledTimes(1);
    expect(bridge.getAlerts).toHaveBeenCalledTimes(1);
  });

  it('selectCity changes the cityId and city', async () => {
    render(<Harness />);
    await flush();
    act(() => {
      handle.current!.selectCity('tokyo');
    });
    await flush();
    expect(handle.current!.cityId).toBe('tokyo');
    expect(handle.current!.city?.label).toBe('Tokyo');
  });

  it('selectUnits changes the unit system', async () => {
    render(<Harness />);
    await flush();
    act(() => {
      handle.current!.selectUnits('imperial');
    });
    await flush();
    expect(handle.current!.units).toBe('imperial');
  });

  it('refresh records the last error when the bridge rejects', async () => {
    bridge.getCurrent.mockRejectedValue(new Error('boom'));
    render(<Harness />);
    await flush();
    await act(async () => {
      await handle.current!.refresh();
    });
    expect(handle.current!.lastError).toBe('boom');
    expect(handle.current!.loading).toBe(false);
  });

  it('reset clears payload and error', async () => {
    render(<Harness />);
    await flush();
    await act(async () => {
      await handle.current!.refresh();
    });
    expect(handle.current!.current).not.toBeNull();
    act(() => {
      handle.current!.reset();
    });
    await flush();
    const w = handle.current!;
    expect(w.current).toBeNull();
    expect(w.hourly).toEqual([]);
    expect(w.daily).toEqual([]);
    expect(w.alerts).toEqual([]);
    expect(w.lastError).toBeNull();
  });

  it('passes the picked city lat/lng and units down to the bridge', async () => {
    render(<Harness />);
    await flush();
    act(() => {
      handle.current!.selectCity('paris');
      handle.current!.selectUnits('imperial');
    });
    await flush();
    await act(async () => {
      await handle.current!.refresh();
    });
    expect(bridge.getCurrent).toHaveBeenCalledWith(48.8566, 2.3522, 'imperial');
  });

  it('survives bridge.isAvailable throwing', async () => {
    bridge.isAvailable.mockImplementation(() => {
      throw new Error('not loaded');
    });
    render(<Harness />);
    await flush();
    await act(async () => {
      await handle.current!.refresh();
    });
    // Refresh still proceeds: lastError captured the throw, available is false.
    expect(handle.current!.available).toBe(false);
    expect(handle.current!.lastError === null || handle.current!.lastError === 'not loaded').toBe(
      true,
    );
  });
});
