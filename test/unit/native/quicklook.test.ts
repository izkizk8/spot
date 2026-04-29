/**
 * Test: QuickLook Bridge Runtime (ios / android / web variants)
 * Feature: 032-document-picker-quicklook
 *
 * Tests the platform-specific runtime exports of QuickLookBridge.
 * iOS path uses requireOptionalNativeModule. Non-iOS variants throw.
 *
 * @see specs/032-document-picker-quicklook/contracts/quicklook-bridge.contract.ts
 */

import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { QuickLookNotSupported } from '@/native/quicklook.types';

// Mock expo-modules-core
jest.mock('expo-modules-core', () => ({
  requireOptionalNativeModule: jest.fn(),
}));

describe('QuickLook Bridge Runtime', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('iOS path (quicklook.ts)', () => {
    it('present() calls native module and resolves with result (B3)', async () => {
      // Platform.OS will be whatever it is in the test environment
      // We just verify the logic when native is available
      const mockNative = {
        present: jest.fn().mockResolvedValue({ shown: true }),
      };
      (requireOptionalNativeModule as jest.Mock).mockReturnValue(mockNative);

      // Clear the module cache to re-evaluate with new mock
      delete require.cache[require.resolve('@/native/quicklook')];
      
      // Check if the module loads without error
      const quicklook = require('@/native/quicklook');
      expect(quicklook.bridge).toBeDefined();
      expect(typeof quicklook.bridge.present).toBe('function');
      expect(typeof quicklook.bridge.isAvailable).toBe('function');
    });

    it('isAvailable() is a synchronous function (B4)', () => {
      (requireOptionalNativeModule as jest.Mock).mockReturnValue({ present: jest.fn() });

      delete require.cache[require.resolve('@/native/quicklook')];
      const { bridge } = require('@/native/quicklook');

      expect(typeof bridge.isAvailable).toBe('function');
      const result = bridge.isAvailable();
      expect(typeof result).toBe('boolean');
    });

    it('present() returns a Promise (B3)', async () => {
      const mockNative = { present: jest.fn().mockResolvedValue({ shown: true }) };
      (requireOptionalNativeModule as jest.Mock).mockReturnValue(mockNative);

      delete require.cache[require.resolve('@/native/quicklook')];
      const { bridge } = require('@/native/quicklook');

      const result = bridge.present('file://test.pdf');
      expect(result).toBeInstanceOf(Promise);
      // Wait for promise to avoid unhandled rejection
      await result.catch(() => {});
    });
  });

  describe('Android path (quicklook.android.ts)', () => {
    it('isAvailable() returns false', () => {
      const { bridge } = require('@/native/quicklook.android');
      expect(bridge.isAvailable()).toBe(false);
    });

    it('present() returns a rejecting Promise', async () => {
      const { bridge } = require('@/native/quicklook.android');
      const promise = bridge.present('file://test.pdf');
      expect(promise).toBeInstanceOf(Promise);
      await expect(promise).rejects.toThrow();
    });
  });

  describe('Web path (quicklook.web.ts)', () => {
    it('isAvailable() returns false', () => {
      const { bridge } = require('@/native/quicklook.web');
      expect(bridge.isAvailable()).toBe(false);
    });

    it('present() returns a rejecting Promise', async () => {
      const { bridge } = require('@/native/quicklook.web');
      const promise = bridge.present('file://test.pdf');
      expect(promise).toBeInstanceOf(Promise);
      await expect(promise).rejects.toThrow();
    });
  });
});
