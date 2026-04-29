/**
 * PassKit bridge tests — all three platforms.
 * Feature: 036-passkit-wallet
 *
 * Tests bridge invariants from contracts/passkit-bridge.md (B1–B9).
 * The native runtime is mocked at the import boundary; per-test the mock's
 * return value is swapped so the JS bridge sees a fresh native shape.
 *
 * @see specs/036-passkit-wallet/contracts/passkit-bridge.md
 */

import { Platform } from 'react-native';

import {
  PassKitCancelled,
  PassKitDownloadFailed,
  PassKitInvalidPass,
  PassKitNotSupported,
  PassKitOpenUnsupported,
} from '@/native/passkit.types';

interface MockedNative {
  canAddPasses?: jest.Mock;
  isPassLibraryAvailable?: jest.Mock;
  passes?: jest.Mock;
  addPassFromBytes?: jest.Mock;
  addPassFromURL?: jest.Mock;
  openPass?: jest.Mock;
}

let mockNative: MockedNative | null = null;

jest.mock('expo-modules-core', () => ({
  requireOptionalNativeModule: () => mockNative,
}));

import * as bridge from '@/native/passkit';
import * as androidBridge from '@/native/passkit.android';
import * as webBridge from '@/native/passkit.web';

describe('PassKit Bridge', () => {
  describe('iOS', () => {
    beforeAll(() => {
      Platform.OS = 'ios';
      (Platform.constants as unknown as { osVersion: string }).osVersion = '14.0';
    });

    beforeEach(() => {
      mockNative = null;
    });

    it('B2: delegates canAddPasses() to native module', async () => {
      mockNative = { canAddPasses: jest.fn().mockResolvedValue(true) };
      const result = await bridge.canAddPasses();
      expect(mockNative.canAddPasses).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    it('B2: delegates isPassLibraryAvailable() to native module', async () => {
      mockNative = { isPassLibraryAvailable: jest.fn().mockResolvedValue(true) };
      const result = await bridge.isPassLibraryAvailable();
      expect(mockNative.isPassLibraryAvailable).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    it('B2/B8: delegates passes() to native module and accepts empty array', async () => {
      mockNative = { passes: jest.fn().mockResolvedValue([]) };
      const result = await bridge.passes();
      expect(mockNative.passes).toHaveBeenCalledTimes(1);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('B2: delegates addPassFromBytes() with verbatim arguments', async () => {
      mockNative = { addPassFromBytes: jest.fn().mockResolvedValue({ added: true }) };
      const result = await bridge.addPassFromBytes('base64string');
      expect(mockNative.addPassFromBytes).toHaveBeenCalledWith('base64string');
      expect(result).toEqual({ added: true });
    });

    it('B2: delegates addPassFromURL() with verbatim arguments', async () => {
      mockNative = { addPassFromURL: jest.fn().mockResolvedValue({ added: true }) };
      const result = await bridge.addPassFromURL('https://example.com/pass.pkpass');
      expect(mockNative.addPassFromURL).toHaveBeenCalledWith('https://example.com/pass.pkpass');
      expect(result).toEqual({ added: true });
    });

    it('B3: serialises two addPassFromURL() calls in submission order', async () => {
      const calls: number[] = [];
      mockNative = {
        addPassFromURL: jest.fn((url: string) => {
          const callIndex = parseInt(url.split('/').pop() ?? '0', 10);
          calls.push(callIndex);
          return callIndex === 1
            ? Promise.reject(new Error('Network error'))
            : Promise.resolve({ added: true });
        }),
      };

      const p1 = bridge.addPassFromURL('https://example.com/1').catch(() => ({ added: false }));
      const p2 = bridge.addPassFromURL('https://example.com/2');

      await Promise.all([p1, p2]);
      expect(calls).toEqual([1, 2]);
    });

    it('B5: openPass() rejects with PassKitOpenUnsupported on iOS < 13.4', async () => {
      (Platform.constants as unknown as { osVersion: string }).osVersion = '13.3';
      mockNative = { openPass: jest.fn() };

      await expect(bridge.openPass('pass.example.test', '12345')).rejects.toBeInstanceOf(
        PassKitOpenUnsupported,
      );
      expect(mockNative.openPass).not.toHaveBeenCalled();

      // Restore for subsequent tests.
      (Platform.constants as unknown as { osVersion: string }).osVersion = '14.0';
    });

    it('B5: openPass() handles "13.10" correctly (tuple parse, not parseFloat)', async () => {
      (Platform.constants as unknown as { osVersion: string }).osVersion = '13.10';
      mockNative = { openPass: jest.fn().mockResolvedValue(undefined) };

      await bridge.openPass('pass.example.test', '12345');
      expect(mockNative.openPass).toHaveBeenCalledWith('pass.example.test', '12345');

      (Platform.constants as unknown as { osVersion: string }).osVersion = '14.0';
    });

    it('B5: openPass() forwards to native on iOS >= 13.4', async () => {
      (Platform.constants as unknown as { osVersion: string }).osVersion = '13.4';
      mockNative = { openPass: jest.fn().mockResolvedValue(undefined) };

      await bridge.openPass('pass.example.test', '12345');
      expect(mockNative.openPass).toHaveBeenCalledWith('pass.example.test', '12345');

      (Platform.constants as unknown as { osVersion: string }).osVersion = '14.0';
    });

    it('B9: bridge does not export any EventEmitter', () => {
      expect(bridge).not.toHaveProperty('addListener');
      expect(bridge).not.toHaveProperty('removeListener');
      expect(bridge).not.toHaveProperty('emit');
    });
  });

  describe('Android stub (B4)', () => {
    beforeAll(() => {
      Platform.OS = 'android';
    });

    it('canAddPasses() resolves to false', async () => {
      await expect(androidBridge.canAddPasses()).resolves.toBe(false);
    });

    it('isPassLibraryAvailable() resolves to false', async () => {
      await expect(androidBridge.isPassLibraryAvailable()).resolves.toBe(false);
    });

    it('passes() rejects with PassKitNotSupported', async () => {
      await expect(androidBridge.passes()).rejects.toBeInstanceOf(PassKitNotSupported);
    });

    it('addPassFromBytes() rejects with PassKitNotSupported', async () => {
      await expect(androidBridge.addPassFromBytes('base64')).rejects.toBeInstanceOf(
        PassKitNotSupported,
      );
    });

    it('addPassFromURL() rejects with PassKitNotSupported', async () => {
      await expect(
        androidBridge.addPassFromURL('https://example.com/pass.pkpass'),
      ).rejects.toBeInstanceOf(PassKitNotSupported);
    });

    it('openPass() rejects with PassKitNotSupported', async () => {
      await expect(androidBridge.openPass('pass.example.test', '12345')).rejects.toBeInstanceOf(
        PassKitNotSupported,
      );
    });
  });

  describe('Web stub (B4)', () => {
    beforeAll(() => {
      Platform.OS = 'web';
    });

    it('canAddPasses() resolves to false', async () => {
      await expect(webBridge.canAddPasses()).resolves.toBe(false);
    });

    it('isPassLibraryAvailable() resolves to false', async () => {
      await expect(webBridge.isPassLibraryAvailable()).resolves.toBe(false);
    });

    it('passes() rejects with PassKitNotSupported', async () => {
      await expect(webBridge.passes()).rejects.toBeInstanceOf(PassKitNotSupported);
    });

    it('addPassFromBytes() rejects with PassKitNotSupported', async () => {
      await expect(webBridge.addPassFromBytes('base64')).rejects.toBeInstanceOf(
        PassKitNotSupported,
      );
    });

    it('addPassFromURL() rejects with PassKitNotSupported', async () => {
      await expect(
        webBridge.addPassFromURL('https://example.com/pass.pkpass'),
      ).rejects.toBeInstanceOf(PassKitNotSupported);
    });

    it('openPass() rejects with PassKitNotSupported', async () => {
      await expect(webBridge.openPass('pass.example.test', '12345')).rejects.toBeInstanceOf(
        PassKitNotSupported,
      );
    });
  });

  describe('Error class identity (B7)', () => {
    it('PassKitNotSupported has stable identity', () => {
      const err1 = new PassKitNotSupported();
      const err2 = new PassKitNotSupported('custom');

      expect(err1).toBeInstanceOf(PassKitNotSupported);
      expect(err2).toBeInstanceOf(PassKitNotSupported);
      expect(err1.name).toBe('PassKitNotSupported');
      expect(err2.name).toBe('PassKitNotSupported');
    });

    it('PassKitOpenUnsupported has stable identity', () => {
      const err = new PassKitOpenUnsupported();
      expect(err).toBeInstanceOf(PassKitOpenUnsupported);
      expect(err.name).toBe('PassKitOpenUnsupported');
    });

    it('PassKitDownloadFailed has stable identity', () => {
      const err = new PassKitDownloadFailed();
      expect(err).toBeInstanceOf(PassKitDownloadFailed);
      expect(err.name).toBe('PassKitDownloadFailed');
    });

    it('PassKitInvalidPass has stable identity', () => {
      const err = new PassKitInvalidPass();
      expect(err).toBeInstanceOf(PassKitInvalidPass);
      expect(err.name).toBe('PassKitInvalidPass');
    });

    it('PassKitCancelled has stable identity', () => {
      const err = new PassKitCancelled();
      expect(err).toBeInstanceOf(PassKitCancelled);
      expect(err.name).toBe('PassKitCancelled');
    });
  });
});
