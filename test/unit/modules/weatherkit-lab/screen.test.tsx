/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { __setWeatherBridgeForTests } from '@/modules/weatherkit-lab/hooks/useWeather';
import type { WeatherKitBridge } from '@/native/weatherkit.types';

const mockBridge: WeatherKitBridge = {
  isAvailable: jest.fn(() => true),
  getCurrent: jest.fn(async () => ({
    temperature: 18,
    apparentTemperature: 17,
    condition: 'partlyCloudy',
    conditionLabel: 'Partly Cloudy',
    humidity: 0.5,
    windSpeed: 10,
    windDirection: 90,
    uvIndex: 3,
    isDaylight: true,
  })),
  getHourly: jest.fn(async () => []),
  getDaily: jest.fn(async () => []),
  getAlerts: jest.fn(async () => []),
  getAttribution: jest.fn(async () => ({
    serviceName: 'Apple Weather',
    logoLightUrl: '',
    logoDarkUrl: '',
    legalPageUrl: '',
  })),
};

beforeEach(() => {
  __setWeatherBridgeForTests(mockBridge);
});

afterEach(() => {
  __setWeatherBridgeForTests(null);
  jest.clearAllMocks();
});

import WeatherKitLabScreen from '@/modules/weatherkit-lab/screen';

describe('weatherkit-lab screen (iOS)', () => {
  it('renders the seven primary sections', () => {
    const { getByTestId } = render(<WeatherKitLabScreen />);
    expect(getByTestId('weatherkit-location-picker')).toBeTruthy();
    expect(getByTestId('weatherkit-unit-picker')).toBeTruthy();
    expect(getByTestId('weatherkit-refresh')).toBeTruthy();
    // Empty payload renders the empty-state variant of the current card.
    expect(getByTestId('weatherkit-current-card-empty')).toBeTruthy();
    expect(getByTestId('weatherkit-hourly-forecast')).toBeTruthy();
    expect(getByTestId('weatherkit-daily-forecast')).toBeTruthy();
    expect(getByTestId('weatherkit-alerts-list')).toBeTruthy();
    expect(getByTestId('weatherkit-attribution-footer')).toBeTruthy();
  });
});
