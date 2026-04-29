/**
 * ARKit Bridge Test - All Platforms
 * Feature: 034-arkit-basics
 *
 * Tests the typed bridge surface across iOS, Android, and Web variants.
 * Mocks the native module at the import boundary per FR-022.
 *
 * @see specs/034-arkit-basics/contracts/arkit-bridge.contract.ts
 * @see specs/034-arkit-basics/research.md §1 (R-A serialisation)
 */

import { Platform } from 'react-native';

// Mock must be before imports
jest.mock('expo-modules-core', () => ({
  requireOptionalNativeModule: jest.fn(),
}));

describe('arkit bridge', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe('iOS variant', () => {
    beforeEach(() => {
      Platform.OS = 'ios';
    });

    it('placeAnchorAt delegates to native module and returns AnchorRecord', async () => {
      const mockAnchor = {
        id: '0e6f7c1a-1234-5678-90ab-cdef12345678',
        x: 0.123,
        y: -0.045,
        z: -0.872,
        createdAt: Date.now(),
      };

      const { requireOptionalNativeModule } = require('expo-modules-core');
      const mockNative = {
        placeAnchorAt: jest.fn().mockResolvedValue(mockAnchor),
        clearAnchors: jest.fn().mockResolvedValue(undefined),
        pauseSession: jest.fn().mockResolvedValue(undefined),
        resumeSession: jest.fn().mockResolvedValue(undefined),
        getSessionInfo: jest.fn().mockResolvedValue({
          state: 'running',
          anchorCount: 1,
          fps: 60,
          duration: 10.5,
          trackingState: 'normal',
        }),
        isAvailable: jest.fn().mockReturnValue(true),
      };
      requireOptionalNativeModule.mockReturnValue(mockNative);

      const { placeAnchorAt } = require('@/native/arkit');
      const result = await placeAnchorAt(100, 200);

      expect(result).toEqual(mockAnchor);
      expect(mockNative.placeAnchorAt).toHaveBeenCalledWith(100, 200);
      expect(mockNative.placeAnchorAt).toHaveBeenCalledTimes(1);
    });

    it('placeAnchorAt returns null when raycast misses', async () => {
      const { requireOptionalNativeModule } = require('expo-modules-core');
      const mockNative = {
        placeAnchorAt: jest.fn().mockResolvedValue(null),
        clearAnchors: jest.fn(),
        pauseSession: jest.fn(),
        resumeSession: jest.fn(),
        getSessionInfo: jest.fn(),
        isAvailable: jest.fn().mockReturnValue(true),
      };
      requireOptionalNativeModule.mockReturnValue(mockNative);

      const { placeAnchorAt } = require('@/native/arkit');
      const result = await placeAnchorAt(100, 200);

      expect(result).toBeNull();
    });

    it('clearAnchors resolves void', async () => {
      const { requireOptionalNativeModule } = require('expo-modules-core');
      const mockNative = {
        placeAnchorAt: jest.fn(),
        clearAnchors: jest.fn().mockResolvedValue(undefined),
        pauseSession: jest.fn(),
        resumeSession: jest.fn(),
        getSessionInfo: jest.fn(),
        isAvailable: jest.fn().mockReturnValue(true),
      };
      requireOptionalNativeModule.mockReturnValue(mockNative);

      const { clearAnchors } = require('@/native/arkit');
      await expect(clearAnchors()).resolves.toBeUndefined();
      expect(mockNative.clearAnchors).toHaveBeenCalledTimes(1);
    });

    it('pauseSession resolves void', async () => {
      const { requireOptionalNativeModule } = require('expo-modules-core');
      const mockNative = {
        placeAnchorAt: jest.fn(),
        clearAnchors: jest.fn(),
        pauseSession: jest.fn().mockResolvedValue(undefined),
        resumeSession: jest.fn(),
        getSessionInfo: jest.fn(),
        isAvailable: jest.fn().mockReturnValue(true),
      };
      requireOptionalNativeModule.mockReturnValue(mockNative);

      const { pauseSession } = require('@/native/arkit');
      await expect(pauseSession()).resolves.toBeUndefined();
      expect(mockNative.pauseSession).toHaveBeenCalledTimes(1);
    });

    it('resumeSession resolves void', async () => {
      const { requireOptionalNativeModule } = require('expo-modules-core');
      const mockNative = {
        placeAnchorAt: jest.fn(),
        clearAnchors: jest.fn(),
        pauseSession: jest.fn(),
        resumeSession: jest.fn().mockResolvedValue(undefined),
        getSessionInfo: jest.fn(),
        isAvailable: jest.fn().mockReturnValue(true),
      };
      requireOptionalNativeModule.mockReturnValue(mockNative);

      const { resumeSession } = require('@/native/arkit');
      await expect(resumeSession()).resolves.toBeUndefined();
      expect(mockNative.resumeSession).toHaveBeenCalledTimes(1);
    });

    it('getSessionInfo returns typed SessionInfo', async () => {
      const mockInfo = {
        state: 'running' as const,
        anchorCount: 3,
        fps: 58.5,
        duration: 42.1,
        trackingState: 'normal' as const,
      };

      const { requireOptionalNativeModule } = require('expo-modules-core');
      const mockNative = {
        placeAnchorAt: jest.fn(),
        clearAnchors: jest.fn(),
        pauseSession: jest.fn(),
        resumeSession: jest.fn(),
        getSessionInfo: jest.fn().mockResolvedValue(mockInfo),
        isAvailable: jest.fn().mockReturnValue(true),
      };
      requireOptionalNativeModule.mockReturnValue(mockNative);

      const { getSessionInfo } = require('@/native/arkit');
      const result = await getSessionInfo();

      expect(result).toEqual(mockInfo);
      expect(mockNative.getSessionInfo).toHaveBeenCalledTimes(1);
    });

    it('isAvailable returns boolean from native isAvailable', () => {
      const { requireOptionalNativeModule } = require('expo-modules-core');
      const mockNative = {
        placeAnchorAt: jest.fn(),
        clearAnchors: jest.fn(),
        pauseSession: jest.fn(),
        resumeSession: jest.fn(),
        getSessionInfo: jest.fn(),
        isAvailable: jest.fn().mockReturnValue(true),
      };
      requireOptionalNativeModule.mockReturnValue(mockNative);

      const { isAvailable } = require('@/native/arkit');
      expect(isAvailable()).toBe(true);
      expect(mockNative.isAvailable).toHaveBeenCalledTimes(1);
    });

    it('isAvailable never throws', () => {
      const { requireOptionalNativeModule } = require('expo-modules-core');
      const mockNative = {
        placeAnchorAt: jest.fn(),
        clearAnchors: jest.fn(),
        pauseSession: jest.fn(),
        resumeSession: jest.fn(),
        getSessionInfo: jest.fn(),
        isAvailable: jest.fn().mockReturnValue(false),
      };
      requireOptionalNativeModule.mockReturnValue(mockNative);

      const { isAvailable } = require('@/native/arkit');
      expect(() => isAvailable()).not.toThrow();
      expect(isAvailable()).toBe(false);
    });

    it('serialisation: two back-to-back placeAnchorAt calls execute in order', async () => {
      const mockAnchor1 = {
        id: '00000000-0000-0000-0000-000000000001',
        x: 1,
        y: 1,
        z: 1,
        createdAt: Date.now(),
      };
      const mockAnchor2 = {
        id: '00000000-0000-0000-0000-000000000002',
        x: 2,
        y: 2,
        z: 2,
        createdAt: Date.now(),
      };

      const callOrder: string[] = [];
      const { requireOptionalNativeModule } = require('expo-modules-core');
      const mockNative = {
        placeAnchorAt: jest.fn((x: number) => {
          callOrder.push(`call-${x}`);
          return Promise.resolve(x === 10 ? mockAnchor1 : mockAnchor2);
        }),
        clearAnchors: jest.fn(),
        pauseSession: jest.fn(),
        resumeSession: jest.fn(),
        getSessionInfo: jest.fn(),
        isAvailable: jest.fn().mockReturnValue(true),
      };
      requireOptionalNativeModule.mockReturnValue(mockNative);

      const { placeAnchorAt } = require('@/native/arkit');

      // Fire two calls without awaiting
      const p1 = placeAnchorAt(10, 10);
      const p2 = placeAnchorAt(20, 20);

      await Promise.all([p1, p2]);

      // Serialisation invariant: native invocations happen in submission order
      expect(callOrder).toEqual(['call-10', 'call-20']);
      expect(mockNative.placeAnchorAt).toHaveBeenCalledTimes(2);
    });

    it('serialisation: rejection does not block subsequent calls', async () => {
      const { requireOptionalNativeModule } = require('expo-modules-core');
      const mockNative = {
        placeAnchorAt: jest
          .fn()
          .mockRejectedValueOnce(new Error('first fails'))
          .mockResolvedValueOnce({
            id: 'second-anchor',
            x: 2,
            y: 2,
            z: 2,
            createdAt: Date.now(),
          }),
        clearAnchors: jest.fn(),
        pauseSession: jest.fn(),
        resumeSession: jest.fn(),
        getSessionInfo: jest.fn(),
        isAvailable: jest.fn().mockReturnValue(true),
      };
      requireOptionalNativeModule.mockReturnValue(mockNative);

      const { placeAnchorAt } = require('@/native/arkit');

      // First call rejects
      await expect(placeAnchorAt(10, 10)).rejects.toThrow('first fails');

      // Second call still succeeds (chain not poisoned)
      const result = await placeAnchorAt(20, 20);
      expect(result).toEqual(expect.objectContaining({ id: 'second-anchor' }));
      expect(mockNative.placeAnchorAt).toHaveBeenCalledTimes(2);
    });
  });

  describe('Android variant', () => {
    beforeEach(() => {
      Platform.OS = 'android';
    });

    it('placeAnchorAt rejects with ARKitNotSupported', async () => {
      const { placeAnchorAt, ARKitNotSupported } = require('@/native/arkit.android');

      await expect(placeAnchorAt(100, 200)).rejects.toThrow(ARKitNotSupported);
      await expect(placeAnchorAt(100, 200)).rejects.toThrow(/not available/i);
    });

    it('clearAnchors rejects with ARKitNotSupported', async () => {
      const { clearAnchors, ARKitNotSupported } = require('@/native/arkit.android');

      await expect(clearAnchors()).rejects.toThrow(ARKitNotSupported);
    });

    it('pauseSession rejects with ARKitNotSupported', async () => {
      const { pauseSession, ARKitNotSupported } = require('@/native/arkit.android');

      await expect(pauseSession()).rejects.toThrow(ARKitNotSupported);
    });

    it('resumeSession rejects with ARKitNotSupported', async () => {
      const { resumeSession, ARKitNotSupported } = require('@/native/arkit.android');

      await expect(resumeSession()).rejects.toThrow(ARKitNotSupported);
    });

    it('getSessionInfo rejects with ARKitNotSupported', async () => {
      const { getSessionInfo, ARKitNotSupported } = require('@/native/arkit.android');

      await expect(getSessionInfo()).rejects.toThrow(ARKitNotSupported);
    });

    it('isAvailable returns false and never throws', () => {
      const { isAvailable } = require('@/native/arkit.android');

      expect(() => isAvailable()).not.toThrow();
      expect(isAvailable()).toBe(false);
    });

    it('ARKitNotSupported has stable code field', async () => {
      const { placeAnchorAt, ARKitNotSupported } = require('@/native/arkit.android');

      await expect(placeAnchorAt(0, 0)).rejects.toMatchObject({
        code: 'ARKIT_NOT_SUPPORTED',
      });

      await expect(placeAnchorAt(0, 0)).rejects.toBeInstanceOf(ARKitNotSupported);
    });
  });

  describe('Web variant', () => {
    beforeEach(() => {
      Platform.OS = 'web';
    });

    it('placeAnchorAt rejects with ARKitNotSupported', async () => {
      const { placeAnchorAt, ARKitNotSupported } = require('@/native/arkit.web');

      await expect(placeAnchorAt(100, 200)).rejects.toThrow(ARKitNotSupported);
    });

    it('clearAnchors rejects with ARKitNotSupported', async () => {
      const { clearAnchors, ARKitNotSupported } = require('@/native/arkit.web');

      await expect(clearAnchors()).rejects.toThrow(ARKitNotSupported);
    });

    it('pauseSession rejects with ARKitNotSupported', async () => {
      const { pauseSession, ARKitNotSupported } = require('@/native/arkit.web');

      await expect(pauseSession()).rejects.toThrow(ARKitNotSupported);
    });

    it('resumeSession rejects with ARKitNotSupported', async () => {
      const { resumeSession, ARKitNotSupported } = require('@/native/arkit.web');

      await expect(resumeSession()).rejects.toThrow(ARKitNotSupported);
    });

    it('getSessionInfo rejects with ARKitNotSupported', async () => {
      const { getSessionInfo, ARKitNotSupported } = require('@/native/arkit.web');

      await expect(getSessionInfo()).rejects.toThrow(ARKitNotSupported);
    });

    it('isAvailable returns false and never throws', () => {
      const { isAvailable } = require('@/native/arkit.web');

      expect(() => isAvailable()).not.toThrow();
      expect(isAvailable()).toBe(false);
    });

    it('web bundle does NOT import iOS bridge at module evaluation time', () => {
      jest.isolateModules(() => {
        jest.doMock('@/native/arkit.ts', () => {
          throw new Error('iOS bridge MUST NOT be imported at evaluation time on web');
        });

        // If this throws, the web variant is incorrectly importing the iOS file
        expect(() => {
          require('@/native/arkit.web');
        }).not.toThrow();
      });
    });
  });
});
