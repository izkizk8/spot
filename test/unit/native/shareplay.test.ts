/**
 * Native SharePlay bridge contract test.
 * Feature: 047-shareplay
 *
 * Tests the typed bridge surface across iOS, Android, and Web
 * variants. Mocks the native module at the import boundary.
 * Exercises the full async surface and the
 * `SharePlayNotSupported` fast-fail path.
 *
 * @jest-environment node
 */

import { Platform } from 'react-native';

jest.mock('expo-modules-core', () => ({
  requireOptionalNativeModule: jest.fn(),
}));

describe('shareplay native bridge', () => {
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
      const sp = require('@/native/shareplay');
      expect(sp.isAvailable()).toBe(true);
    });

    it('isAvailable returns false when native module is absent', () => {
      const { requireOptionalNativeModule } = require('expo-modules-core');
      requireOptionalNativeModule.mockReturnValue(null);
      const sp = require('@/native/shareplay');
      expect(sp.isAvailable()).toBe(false);
    });

    it('getState delegates to native and falls back to INITIAL_SESSION_STATE without it', () => {
      const { requireOptionalNativeModule } = require('expo-modules-core');
      requireOptionalNativeModule.mockReturnValue({
        isAvailable: () => true,
        getState: () => ({
          status: 'active',
          activity: { type: 'counter', title: 'X' },
          participants: [],
          counter: 7,
        }),
      });
      const sp = require('@/native/shareplay');
      expect(sp.getState().status).toBe('active');
      expect(sp.getState().counter).toBe(7);
    });

    it('all async methods delegate to the native module', async () => {
      const native = {
        isAvailable: () => true,
        getState: () => ({ status: 'none', activity: null, participants: [], counter: 0 }),
        startActivity: jest.fn(async () => undefined),
        endActivity: jest.fn(async () => undefined),
        sendCounter: jest.fn(async () => undefined),
        addStateListener: jest.fn(() => ({ remove: jest.fn() })),
      };
      const { requireOptionalNativeModule } = require('expo-modules-core');
      requireOptionalNativeModule.mockReturnValue(native);

      const sp = require('@/native/shareplay');
      await expect(sp.startActivity({ type: 'counter', title: 'T' })).resolves.toBeUndefined();
      expect(native.startActivity).toHaveBeenCalledWith({ type: 'counter', title: 'T' });
      await expect(sp.endActivity()).resolves.toBeUndefined();
      await expect(sp.sendCounter(3)).resolves.toBeUndefined();
      expect(native.sendCounter).toHaveBeenCalledWith(3);
    });

    it('subscribe wires through to native.addStateListener and returns an unsubscribe', () => {
      const remove = jest.fn();
      const native = {
        isAvailable: () => true,
        getState: () => ({ status: 'none', activity: null, participants: [], counter: 0 }),
        startActivity: jest.fn(),
        endActivity: jest.fn(),
        sendCounter: jest.fn(),
        addStateListener: jest.fn(() => ({ remove })),
      };
      const { requireOptionalNativeModule } = require('expo-modules-core');
      requireOptionalNativeModule.mockReturnValue(native);
      const sp = require('@/native/shareplay');
      const unsub = sp.subscribe(() => {});
      expect(typeof unsub).toBe('function');
      expect(native.addStateListener).toHaveBeenCalledTimes(1);
      unsub();
      expect(remove).toHaveBeenCalledTimes(1);
    });

    it('subscribe is a no-op when the native module exposes no listener helper', () => {
      const native = {
        isAvailable: () => true,
        getState: () => ({ status: 'none', activity: null, participants: [], counter: 0 }),
        startActivity: jest.fn(),
        endActivity: jest.fn(),
        sendCounter: jest.fn(),
      };
      const { requireOptionalNativeModule } = require('expo-modules-core');
      requireOptionalNativeModule.mockReturnValue(native);
      const sp = require('@/native/shareplay');
      const unsub = sp.subscribe(() => {});
      expect(typeof unsub).toBe('function');
      expect(() => unsub()).not.toThrow();
    });

    it('async methods reject with SharePlayNotSupported when native is absent', async () => {
      const { requireOptionalNativeModule } = require('expo-modules-core');
      requireOptionalNativeModule.mockReturnValue(null);
      const sp = require('@/native/shareplay');
      const { SharePlayNotSupported } = require('@/native/shareplay.types');
      await expect(sp.startActivity({ type: 'counter', title: 'X' })).rejects.toBeInstanceOf(
        SharePlayNotSupported,
      );
      await expect(sp.endActivity()).rejects.toBeInstanceOf(SharePlayNotSupported);
      await expect(sp.sendCounter(0)).rejects.toBeInstanceOf(SharePlayNotSupported);
    });
  });

  describe('Android variant', () => {
    it('isAvailable returns false and every async method rejects', async () => {
      const sp = require('@/native/shareplay.android');
      const { SharePlayNotSupported } = require('@/native/shareplay.types');
      expect(sp.isAvailable()).toBe(false);
      expect(sp.getState().status).toBe('none');
      await expect(sp.startActivity({ type: 'counter', title: 'X' })).rejects.toBeInstanceOf(
        SharePlayNotSupported,
      );
      await expect(sp.endActivity()).rejects.toBeInstanceOf(SharePlayNotSupported);
      await expect(sp.sendCounter(0)).rejects.toBeInstanceOf(SharePlayNotSupported);
      const unsub = sp.subscribe(() => {});
      expect(typeof unsub).toBe('function');
      expect(() => unsub()).not.toThrow();
    });
  });

  describe('Web variant', () => {
    it('isAvailable returns false and every async method rejects', async () => {
      const sp = require('@/native/shareplay.web');
      const { SharePlayNotSupported } = require('@/native/shareplay.types');
      expect(sp.isAvailable()).toBe(false);
      expect(sp.getState().status).toBe('none');
      await expect(sp.startActivity({ type: 'counter', title: 'X' })).rejects.toBeInstanceOf(
        SharePlayNotSupported,
      );
      await expect(sp.endActivity()).rejects.toBeInstanceOf(SharePlayNotSupported);
      await expect(sp.sendCounter(0)).rejects.toBeInstanceOf(SharePlayNotSupported);
      const unsub = sp.subscribe(() => {});
      expect(typeof unsub).toBe('function');
    });
  });

  describe('SharePlayNotSupported', () => {
    it('carries a stable code and name', () => {
      const { SharePlayNotSupported } = require('@/native/shareplay.types');
      const err = new SharePlayNotSupported();
      expect(err.code).toBe('SHAREPLAY_NOT_SUPPORTED');
      expect(err.name).toBe('SharePlayNotSupported');
      expect(err).toBeInstanceOf(Error);
    });
  });

  describe('INITIAL_SESSION_STATE', () => {
    it('is frozen and idle', () => {
      const { INITIAL_SESSION_STATE } = require('@/native/shareplay.types');
      expect(INITIAL_SESSION_STATE.status).toBe('none');
      expect(INITIAL_SESSION_STATE.activity).toBeNull();
      expect(INITIAL_SESSION_STATE.participants).toEqual([]);
      expect(INITIAL_SESSION_STATE.counter).toBe(0);
      expect(Object.isFrozen(INITIAL_SESSION_STATE)).toBe(true);
    });
  });
});
