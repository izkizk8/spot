/**
 * Native HomeKit bridge contract test.
 * Feature: 044-homekit
 *
 * Tests the typed bridge surface across iOS, Android, and Web
 * variants. Mocks the native module at the import boundary per
 * FR-10. Exercises the full async surface and the `HomeKitNotSupported`
 * fast-fail path.
 *
 * @jest-environment node
 */

import { Platform } from 'react-native';

jest.mock('expo-modules-core', () => ({
  requireOptionalNativeModule: jest.fn(),
}));

describe('homekit native bridge', () => {
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
      const homekit = require('@/native/homekit');
      expect(homekit.isAvailable()).toBe(true);
    });

    it('isAvailable returns false when native module is absent', () => {
      const { requireOptionalNativeModule } = require('expo-modules-core');
      requireOptionalNativeModule.mockReturnValue(null);
      const homekit = require('@/native/homekit');
      expect(homekit.isAvailable()).toBe(false);
    });

    it('getHomes / getAccessories / read / write delegate to native', async () => {
      const native = {
        isAvailable: () => true,
        getAuthStatus: jest.fn(async () => 'authorized'),
        requestAccess: jest.fn(async () => 'authorized'),
        getHomes: jest.fn(async () => [{ id: 'h1', name: 'C', isPrimary: true, rooms: [] }]),
        getAccessories: jest.fn(async () => []),
        readCharacteristic: jest.fn(async () => 42),
        writeCharacteristic: jest.fn(async () => undefined),
        addListener: jest.fn(() => ({ remove: jest.fn() })),
        startObserving: jest.fn(async () => undefined),
        stopObserving: jest.fn(async () => undefined),
      };
      const { requireOptionalNativeModule } = require('expo-modules-core');
      requireOptionalNativeModule.mockReturnValue(native);

      const homekit = require('@/native/homekit');
      await expect(homekit.getAuthStatus()).resolves.toBe('authorized');
      await expect(homekit.requestAccess()).resolves.toBe('authorized');
      await expect(homekit.getHomes()).resolves.toEqual([
        { id: 'h1', name: 'C', isPrimary: true, rooms: [] },
      ]);
      await expect(homekit.getAccessories('h1')).resolves.toEqual([]);
      expect(native.getAccessories).toHaveBeenCalledWith('h1');
      await expect(homekit.readCharacteristic('a', 'c')).resolves.toBe(42);
      await expect(homekit.writeCharacteristic('a', 'c', 1)).resolves.toBeUndefined();
      expect(native.writeCharacteristic).toHaveBeenCalledWith('a', 'c', 1);
    });

    it('async methods reject with HomeKitNotSupported when native is absent', async () => {
      const { requireOptionalNativeModule } = require('expo-modules-core');
      requireOptionalNativeModule.mockReturnValue(null);
      const homekit = require('@/native/homekit');
      const { HomeKitNotSupported } = require('@/native/homekit.types');
      await expect(homekit.getHomes()).rejects.toBeInstanceOf(HomeKitNotSupported);
      await expect(homekit.readCharacteristic('a', 'c')).rejects.toBeInstanceOf(
        HomeKitNotSupported,
      );
    });

    it('observeCharacteristic forwards matching events and returns an unsubscribe', () => {
      const remove = jest.fn();
      const native = {
        isAvailable: () => true,
        addListener: jest.fn((_event, cb) => {
          // Simulate two updates: one matching, one for another characteristic.
          cb({ accessoryId: 'a', characteristicId: 'c', value: true });
          cb({ accessoryId: 'a', characteristicId: 'OTHER', value: false });
          return { remove };
        }),
        startObserving: jest.fn(async () => undefined),
        stopObserving: jest.fn(async () => undefined),
      };
      const { requireOptionalNativeModule } = require('expo-modules-core');
      requireOptionalNativeModule.mockReturnValue(native);

      const homekit = require('@/native/homekit');
      const listener = jest.fn();
      const unsubscribe = homekit.observeCharacteristic('a', 'c', listener);

      // Only the matching event reaches the listener.
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(true);

      unsubscribe();
      expect(remove).toHaveBeenCalledTimes(1);
      // Calling unsubscribe twice is a no-op.
      unsubscribe();
      expect(remove).toHaveBeenCalledTimes(1);
    });

    it('observeCharacteristic returns a no-op unsubscribe when native is absent', () => {
      const { requireOptionalNativeModule } = require('expo-modules-core');
      requireOptionalNativeModule.mockReturnValue(null);
      const homekit = require('@/native/homekit');
      const unsubscribe = homekit.observeCharacteristic('a', 'c', () => {});
      expect(typeof unsubscribe).toBe('function');
      // Should not throw.
      expect(() => unsubscribe()).not.toThrow();
    });

    it('listener errors are swallowed', () => {
      const native = {
        isAvailable: () => true,
        addListener: jest.fn((_event, cb) => {
          cb({ accessoryId: 'a', characteristicId: 'c', value: true });
          return { remove: jest.fn() };
        }),
        startObserving: jest.fn(async () => undefined),
        stopObserving: jest.fn(async () => undefined),
      };
      const { requireOptionalNativeModule } = require('expo-modules-core');
      requireOptionalNativeModule.mockReturnValue(native);

      const homekit = require('@/native/homekit');
      const listener = jest.fn(() => {
        throw new Error('handler-bug');
      });
      expect(() => homekit.observeCharacteristic('a', 'c', listener)).not.toThrow();
      expect(listener).toHaveBeenCalled();
    });
  });

  describe('Android variant', () => {
    it('isAvailable returns false', () => {
      const homekit = require('@/native/homekit.android');
      expect(homekit.isAvailable()).toBe(false);
    });

    it('rejects all async methods with HomeKitNotSupported', async () => {
      const homekit = require('@/native/homekit.android');
      const { HomeKitNotSupported } = require('@/native/homekit.types');
      await expect(homekit.getHomes()).rejects.toBeInstanceOf(HomeKitNotSupported);
      await expect(homekit.getAccessories('h1')).rejects.toBeInstanceOf(HomeKitNotSupported);
      await expect(homekit.readCharacteristic('a', 'c')).rejects.toBeInstanceOf(
        HomeKitNotSupported,
      );
      await expect(homekit.writeCharacteristic('a', 'c', 1)).rejects.toBeInstanceOf(
        HomeKitNotSupported,
      );
      await expect(homekit.requestAccess()).rejects.toBeInstanceOf(HomeKitNotSupported);
      await expect(homekit.getAuthStatus()).rejects.toBeInstanceOf(HomeKitNotSupported);
    });

    it('observeCharacteristic returns a no-op unsubscribe', () => {
      const homekit = require('@/native/homekit.android');
      const unsub = homekit.observeCharacteristic('a', 'c', () => {});
      expect(typeof unsub).toBe('function');
      expect(() => unsub()).not.toThrow();
    });
  });

  describe('Web variant', () => {
    it('isAvailable returns false', () => {
      const homekit = require('@/native/homekit.web');
      expect(homekit.isAvailable()).toBe(false);
    });

    it('rejects all async methods with HomeKitNotSupported', async () => {
      const homekit = require('@/native/homekit.web');
      const { HomeKitNotSupported } = require('@/native/homekit.types');
      await expect(homekit.getHomes()).rejects.toBeInstanceOf(HomeKitNotSupported);
      await expect(homekit.requestAccess()).rejects.toBeInstanceOf(HomeKitNotSupported);
    });

    it('observeCharacteristic returns a no-op unsubscribe', () => {
      const homekit = require('@/native/homekit.web');
      const unsub = homekit.observeCharacteristic('a', 'c', () => {});
      expect(typeof unsub).toBe('function');
      expect(() => unsub()).not.toThrow();
    });
  });
});

describe('HomeKitNotSupported error class', () => {
  it('carries a stable code', () => {
    const { HomeKitNotSupported } = require('@/native/homekit.types');
    const err = new HomeKitNotSupported();
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe('HOMEKIT_NOT_SUPPORTED');
    expect(err.name).toBe('HomeKitNotSupported');
  });
});
