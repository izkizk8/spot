/**
 * Native WeatherKit bridge contract test.
 * Feature: 046-weatherkit
 *
 * Tests the typed bridge surface across iOS, Android, and Web
 * variants. Mocks the native module at the import boundary.
 * Exercises the full async surface and the `WeatherKitNotSupported`
 * fast-fail path.
 *
 * @jest-environment node
 */

import { Platform } from 'react-native';

jest.mock('expo-modules-core', () => ({
  requireOptionalNativeModule: jest.fn(),
}));

describe('weatherkit native bridge', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe('iOS variant', () => {
    beforeEach(() => {
      Platform.OS = 'ios';
    });

    it('isAvailable returns true when native module is present', () => {
      const { requireOptionalNativeModule } = require('expo-modules-core');
      requireOptionalNativeModule.mockReturnValue({ isAvailable: () => true });
      const w = require('@/native/weatherkit');
      expect(w.isAvailable()).toBe(true);
    });

    it('isAvailable returns false when native module is absent', () => {
      const { requireOptionalNativeModule } = require('expo-modules-core');
      requireOptionalNativeModule.mockReturnValue(null);
      const w = require('@/native/weatherkit');
      expect(w.isAvailable()).toBe(false);
    });

    it('all five getters delegate to the native module', async () => {
      const native = {
        isAvailable: () => true,
        getCurrent: jest.fn(async () => ({
          temperature: 20,
          apparentTemperature: 19,
          condition: 'clear',
          conditionLabel: 'Clear',
          humidity: 0.5,
          windSpeed: 5,
          windDirection: 0,
          uvIndex: 1,
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
      const { requireOptionalNativeModule } = require('expo-modules-core');
      requireOptionalNativeModule.mockReturnValue(native);

      const w = require('@/native/weatherkit');
      await expect(w.getCurrent(0, 0, 'metric')).resolves.toMatchObject({ temperature: 20 });
      expect(native.getCurrent).toHaveBeenCalledWith(0, 0, 'metric');
      await expect(w.getHourly(0, 0, 'metric')).resolves.toEqual([]);
      await expect(w.getDaily(0, 0, 'metric')).resolves.toEqual([]);
      await expect(w.getAlerts(0, 0)).resolves.toEqual([]);
      await expect(w.getAttribution()).resolves.toMatchObject({ serviceName: 'Apple Weather' });
    });

    it('async methods reject with WeatherKitNotSupported when native is absent', async () => {
      const { requireOptionalNativeModule } = require('expo-modules-core');
      requireOptionalNativeModule.mockReturnValue(null);
      const w = require('@/native/weatherkit');
      const { WeatherKitNotSupported } = require('@/native/weatherkit.types');
      await expect(w.getCurrent(0, 0, 'metric')).rejects.toBeInstanceOf(WeatherKitNotSupported);
      await expect(w.getHourly(0, 0, 'metric')).rejects.toBeInstanceOf(WeatherKitNotSupported);
      await expect(w.getDaily(0, 0, 'metric')).rejects.toBeInstanceOf(WeatherKitNotSupported);
      await expect(w.getAlerts(0, 0)).rejects.toBeInstanceOf(WeatherKitNotSupported);
      await expect(w.getAttribution()).rejects.toBeInstanceOf(WeatherKitNotSupported);
    });
  });

  describe('Android variant', () => {
    it('isAvailable returns false and every async method rejects', async () => {
      const w = require('@/native/weatherkit.android');
      const { WeatherKitNotSupported } = require('@/native/weatherkit.types');
      expect(w.isAvailable()).toBe(false);
      await expect(w.getCurrent(0, 0, 'metric')).rejects.toBeInstanceOf(WeatherKitNotSupported);
      await expect(w.getHourly(0, 0, 'metric')).rejects.toBeInstanceOf(WeatherKitNotSupported);
      await expect(w.getDaily(0, 0, 'metric')).rejects.toBeInstanceOf(WeatherKitNotSupported);
      await expect(w.getAlerts(0, 0)).rejects.toBeInstanceOf(WeatherKitNotSupported);
      await expect(w.getAttribution()).rejects.toBeInstanceOf(WeatherKitNotSupported);
    });
  });

  describe('Web variant', () => {
    it('isAvailable returns false and every async method rejects', async () => {
      const w = require('@/native/weatherkit.web');
      const { WeatherKitNotSupported } = require('@/native/weatherkit.types');
      expect(w.isAvailable()).toBe(false);
      await expect(w.getCurrent(0, 0, 'metric')).rejects.toBeInstanceOf(WeatherKitNotSupported);
      await expect(w.getHourly(0, 0, 'metric')).rejects.toBeInstanceOf(WeatherKitNotSupported);
      await expect(w.getDaily(0, 0, 'metric')).rejects.toBeInstanceOf(WeatherKitNotSupported);
      await expect(w.getAlerts(0, 0)).rejects.toBeInstanceOf(WeatherKitNotSupported);
      await expect(w.getAttribution()).rejects.toBeInstanceOf(WeatherKitNotSupported);
    });
  });

  describe('WeatherKitNotSupported', () => {
    it('carries a stable code and name', () => {
      const { WeatherKitNotSupported } = require('@/native/weatherkit.types');
      const err = new WeatherKitNotSupported();
      expect(err.code).toBe('WEATHERKIT_NOT_SUPPORTED');
      expect(err.name).toBe('WeatherKitNotSupported');
      expect(err).toBeInstanceOf(Error);
    });
  });
});
