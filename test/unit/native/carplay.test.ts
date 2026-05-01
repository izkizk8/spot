/**
 * Native CarPlay bridge contract test (feature 045).
 *
 * Tests the typed bridge surface across iOS, Android, and Web
 * variants. Mocks the native module at the import boundary.
 *
 * @jest-environment node
 */

import { Platform } from 'react-native';

jest.mock('expo-modules-core', () => ({
  requireOptionalNativeModule: jest.fn(),
}));

describe('carplay native bridge', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe('iOS variant', () => {
    beforeEach(() => {
      Platform.OS = 'ios';
    });

    it('isAvailable returns false when native module reports unavailable', () => {
      const expoCore = require('expo-modules-core');
      (expoCore.requireOptionalNativeModule as jest.Mock).mockReturnValue({
        isAvailable: () => false,
        getStatus: jest.fn(),
        presentTemplate: jest.fn(),
      });
      const { isAvailable } = require('@/native/carplay');
      expect(isAvailable()).toBe(false);
    });

    it('isAvailable returns true when native module reports available', () => {
      const expoCore = require('expo-modules-core');
      (expoCore.requireOptionalNativeModule as jest.Mock).mockReturnValue({
        isAvailable: () => true,
        getStatus: jest.fn(),
        presentTemplate: jest.fn(),
      });
      const { isAvailable } = require('@/native/carplay');
      expect(isAvailable()).toBe(true);
    });

    it('getStatus resolves to "not-entitled" when the native module is missing', async () => {
      const expoCore = require('expo-modules-core');
      (expoCore.requireOptionalNativeModule as jest.Mock).mockReturnValue(null);
      const { getStatus } = require('@/native/carplay');
      await expect(getStatus()).resolves.toBe('not-entitled');
    });

    it('getStatus delegates to the native module when present', async () => {
      const expoCore = require('expo-modules-core');
      const fake = {
        isAvailable: () => true,
        getStatus: jest.fn().mockResolvedValue('available'),
        presentTemplate: jest.fn(),
      };
      (expoCore.requireOptionalNativeModule as jest.Mock).mockReturnValue(fake);
      const { getStatus } = require('@/native/carplay');
      await expect(getStatus()).resolves.toBe('available');
      expect(fake.getStatus).toHaveBeenCalledTimes(1);
    });

    it('presentTemplate rejects with CarPlayNotEntitled when no native module', async () => {
      const expoCore = require('expo-modules-core');
      (expoCore.requireOptionalNativeModule as jest.Mock).mockReturnValue(null);
      const { presentTemplate, CarPlayNotEntitled } = require('@/native/carplay');
      await expect(presentTemplate('list')).rejects.toBeInstanceOf(CarPlayNotEntitled);
    });

    it('presentTemplate forwards to the native module when present', async () => {
      const expoCore = require('expo-modules-core');
      const fake = {
        isAvailable: () => true,
        getStatus: jest.fn(),
        presentTemplate: jest.fn().mockResolvedValue(undefined),
      };
      (expoCore.requireOptionalNativeModule as jest.Mock).mockReturnValue(fake);
      const { presentTemplate } = require('@/native/carplay');
      await expect(presentTemplate('grid')).resolves.toBeUndefined();
      expect(fake.presentTemplate).toHaveBeenCalledWith('grid');
    });
  });

  describe('Android variant', () => {
    beforeEach(() => {
      Platform.OS = 'android';
    });

    it('isAvailable returns false', () => {
      const { isAvailable } = require('@/native/carplay.android');
      expect(isAvailable()).toBe(false);
    });

    it('getStatus resolves to "unsupported"', async () => {
      const { getStatus } = require('@/native/carplay.android');
      await expect(getStatus()).resolves.toBe('unsupported');
    });

    it('presentTemplate rejects with CarPlayNotSupported', async () => {
      const { presentTemplate, CarPlayNotSupported } = require('@/native/carplay.android');
      await expect(presentTemplate('list')).rejects.toBeInstanceOf(CarPlayNotSupported);
    });
  });

  describe('Web variant', () => {
    beforeEach(() => {
      Platform.OS = 'web';
    });

    it('isAvailable returns false', () => {
      const { isAvailable } = require('@/native/carplay.web');
      expect(isAvailable()).toBe(false);
    });

    it('getStatus resolves to "unsupported"', async () => {
      const { getStatus } = require('@/native/carplay.web');
      await expect(getStatus()).resolves.toBe('unsupported');
    });

    it('presentTemplate rejects with CarPlayNotSupported', async () => {
      const { presentTemplate, CarPlayNotSupported } = require('@/native/carplay.web');
      await expect(presentTemplate('list')).rejects.toBeInstanceOf(CarPlayNotSupported);
    });
  });

  describe('typed errors', () => {
    it('CarPlayNotSupported carries the documented error code and name', () => {
      const { CarPlayNotSupported } = require('@/native/carplay.types');
      const e = new CarPlayNotSupported();
      expect(e.code).toBe('CARPLAY_NOT_SUPPORTED');
      expect(e.name).toBe('CarPlayNotSupported');
      expect(e).toBeInstanceOf(Error);
    });

    it('CarPlayNotEntitled carries the documented error code and name', () => {
      const { CarPlayNotEntitled } = require('@/native/carplay.types');
      const e = new CarPlayNotEntitled();
      expect(e.code).toBe('CARPLAY_NOT_ENTITLED');
      expect(e.name).toBe('CarPlayNotEntitled');
      expect(e).toBeInstanceOf(Error);
    });
  });
});
