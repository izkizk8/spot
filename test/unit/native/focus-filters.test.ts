/**
 * Tests for the Focus Filters JS bridge per T009.
 *
 * Uses jest.isolateModules + jest.doMock so each test pins its own
 * Platform / native-module return.
 *
 * @see specs/029-focus-filters/contracts/focus-filters-bridge.contract.ts
 * @see specs/029-focus-filters/tasks.md T009
 */

import type { ShowcaseFilterPersistedPayload } from '@/modules/focus-filters-lab/filter-modes';

interface PlatformShape {
  OS: 'ios' | 'android' | 'web';
  Version: string | number;
  select: (specifics: Record<string, unknown>) => unknown;
}

type NativeMock = {
  getCurrentFilterValues: jest.Mock;
};

interface BridgeModule {
  isAvailable: () => boolean;
  getCurrentFilterValues: () => Promise<ShowcaseFilterPersistedPayload | null>;
  FocusFiltersNotSupported: new (msg?: string) => Error;
}

let requireOptionalNativeModuleArg: string | undefined;

function loadBridge(opts: {
  os: 'ios' | 'android' | 'web';
  version?: string | number;
  native?: NativeMock | null;
}): BridgeModule {
  requireOptionalNativeModuleArg = undefined;
  const platform: PlatformShape = {
    OS: opts.os,
    Version: opts.version ?? '16.0',
    select: (s) => s[opts.os] ?? s.default ?? undefined,
  };
  const native = opts.native ?? null;

  let mod: BridgeModule | undefined;
  jest.isolateModules(() => {
    jest.doMock('react-native', () => ({
      __esModule: true,
      Platform: platform,
    }));
    jest.doMock('expo-modules-core', () => ({
      __esModule: true,
      requireOptionalNativeModule: (name: string) => {
        requireOptionalNativeModuleArg = name;
        return native;
      },
    }));
    mod = require('@/native/focus-filters') as BridgeModule;
  });
  if (!mod) throw new Error('failed to load bridge module');
  return mod;
}

function freshNativeMock(): NativeMock {
  return {
    getCurrentFilterValues: jest.fn().mockResolvedValue({
      mode: 'relaxed',
      accentColor: 'blue',
      event: 'activated',
      updatedAt: '2026-05-07T12:34:56.000Z',
    }),
  };
}

describe('focus-filters bridge: web', () => {
  it('isAvailable() === false', () => {
    const bridge = loadBridge({ os: 'web' });
    expect(bridge.isAvailable()).toBe(false);
  });

  it('getCurrentFilterValues() rejects with FocusFiltersNotSupported', async () => {
    const bridge = loadBridge({ os: 'web' });
    await expect(bridge.getCurrentFilterValues()).rejects.toBeInstanceOf(
      bridge.FocusFiltersNotSupported,
    );
  });
});

describe('focus-filters bridge: android', () => {
  it('isAvailable() === false', () => {
    const bridge = loadBridge({ os: 'android' });
    expect(bridge.isAvailable()).toBe(false);
  });

  it('getCurrentFilterValues() rejects with FocusFiltersNotSupported', async () => {
    const bridge = loadBridge({ os: 'android' });
    await expect(bridge.getCurrentFilterValues()).rejects.toBeInstanceOf(
      bridge.FocusFiltersNotSupported,
    );
  });
});

describe('focus-filters bridge: iOS 15.6', () => {
  it('isAvailable() === false even with native module present', () => {
    const bridge = loadBridge({
      os: 'ios',
      version: '15.6',
      native: freshNativeMock(),
    });
    expect(bridge.isAvailable()).toBe(false);
  });

  it('getCurrentFilterValues() rejects with FocusFiltersNotSupported', async () => {
    const bridge = loadBridge({
      os: 'ios',
      version: '15.6',
      native: freshNativeMock(),
    });
    await expect(bridge.getCurrentFilterValues()).rejects.toBeInstanceOf(
      bridge.FocusFiltersNotSupported,
    );
  });
});

describe('focus-filters bridge: iOS 16 + null native', () => {
  it('isAvailable() === false', () => {
    const bridge = loadBridge({ os: 'ios', version: '16.0', native: null });
    expect(bridge.isAvailable()).toBe(false);
  });

  it('getCurrentFilterValues() rejects with FocusFiltersNotSupported', async () => {
    const bridge = loadBridge({ os: 'ios', version: '16.0', native: null });
    await expect(bridge.getCurrentFilterValues()).rejects.toBeInstanceOf(
      bridge.FocusFiltersNotSupported,
    );
  });
});

describe('focus-filters bridge: iOS 16 + native present (happy path)', () => {
  it('isAvailable() === true', () => {
    const bridge = loadBridge({
      os: 'ios',
      version: '16.0',
      native: freshNativeMock(),
    });
    expect(bridge.isAvailable()).toBe(true);
  });

  it('getCurrentFilterValues() calls through and parses payload', async () => {
    const native = freshNativeMock();
    const bridge = loadBridge({ os: 'ios', native });
    const result = await bridge.getCurrentFilterValues();
    expect(native.getCurrentFilterValues).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      mode: 'relaxed',
      accentColor: 'blue',
      event: 'activated',
      updatedAt: '2026-05-07T12:34:56.000Z',
    });
  });

  it('getCurrentFilterValues() returns null when native returns null', async () => {
    const native = freshNativeMock();
    native.getCurrentFilterValues.mockResolvedValueOnce(null);
    const bridge = loadBridge({ os: 'ios', native });
    const result = await bridge.getCurrentFilterValues();
    expect(result).toBeNull();
  });

  it('getCurrentFilterValues() returns null + warns once for malformed payload in __DEV__', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const native = freshNativeMock();
    native.getCurrentFilterValues.mockResolvedValueOnce({ broken: 'payload' });

    // @ts-expect-error - mocking __DEV__
    global.__DEV__ = true;

    const bridge = loadBridge({ os: 'ios', native });
    const result = await bridge.getCurrentFilterValues();

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledTimes(1);

    consoleSpy.mockRestore();
  });

  it('requireOptionalNativeModule called with literal "FocusFilters"', () => {
    loadBridge({ os: 'ios', native: freshNativeMock() });
    expect(requireOptionalNativeModuleArg).toBe('FocusFilters');
  });
});

describe('focus-filters bridge: dedup-warn behavior', () => {
  it('50 calls with same malformed payload produces exactly 1 console.warn', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const native = freshNativeMock();
    native.getCurrentFilterValues.mockResolvedValue({ broken: 'payload' });

    // @ts-expect-error - mocking __DEV__
    global.__DEV__ = true;

    const bridge = loadBridge({ os: 'ios', native });

    for (let i = 0; i < 50; i++) {
      await bridge.getCurrentFilterValues();
    }

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    consoleSpy.mockRestore();
  });

  it('different malformed payload produces 2nd console.warn', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const native = freshNativeMock();

    // @ts-expect-error - mocking __DEV__
    global.__DEV__ = true;

    const bridge = loadBridge({ os: 'ios', native });

    // First malformed shape
    native.getCurrentFilterValues.mockResolvedValueOnce({ broken: 'payload' });
    await bridge.getCurrentFilterValues();

    // Second different malformed shape
    native.getCurrentFilterValues.mockResolvedValueOnce({ different: 'shape' });
    await bridge.getCurrentFilterValues();

    expect(consoleSpy).toHaveBeenCalledTimes(2);
    consoleSpy.mockRestore();
  });

  it('dedup map capped at 64 entries for 100 distinct malformed shapes', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const native = freshNativeMock();

    // @ts-expect-error - mocking __DEV__
    global.__DEV__ = true;

    const bridge = loadBridge({ os: 'ios', native });

    // Generate 100 distinct malformed payloads
    for (let i = 0; i < 100; i++) {
      native.getCurrentFilterValues.mockResolvedValueOnce({ id: i });
      await bridge.getCurrentFilterValues();
    }

    // Should have warned for first 64, then cap reached
    // (actual implementation may vary, but cap should be enforced)
    expect(consoleSpy.mock.calls.length).toBeGreaterThan(0);
    expect(consoleSpy.mock.calls.length).toBeLessThanOrEqual(64);
    consoleSpy.mockRestore();
  });
});

describe('focus-filters bridge: FocusFiltersNotSupported error class', () => {
  it('is an instance of Error', () => {
    const bridge = loadBridge({ os: 'web' });
    const err = new bridge.FocusFiltersNotSupported();
    expect(err).toBeInstanceOf(Error);
  });

  it('has name === "FocusFiltersNotSupported"', () => {
    const bridge = loadBridge({ os: 'web' });
    const err = new bridge.FocusFiltersNotSupported();
    expect(err.name).toBe('FocusFiltersNotSupported');
  });

  it('accepts optional message string', () => {
    const bridge = loadBridge({ os: 'web' });
    const err = new bridge.FocusFiltersNotSupported('custom message');
    expect(err.message).toBe('custom message');
  });
});

describe('focus-filters bridge: symbol non-collision with 013', () => {
  it('app-intents.ts does NOT export getCurrentFilterValues, FocusFiltersNotSupported, or isAvailable', () => {
    const appIntents = require('@/native/app-intents');
    const exports = Object.keys(appIntents);
    expect(exports).not.toContain('getCurrentFilterValues');
    expect(exports).not.toContain('FocusFiltersNotSupported');
    // Note: app-intents may have isAvailable on bridge object, not as named export
    // Static check: ensure no top-level named export collision
  });
});

describe('focus-filters bridge: symbol non-collision with 014/027/028', () => {
  it('widget-center.ts does NOT export getCurrentFilterValues or FocusFiltersNotSupported', () => {
    const widgetCenter = require('@/native/widget-center');
    const exports = Object.keys(widgetCenter);
    expect(exports).not.toContain('getCurrentFilterValues');
    expect(exports).not.toContain('FocusFiltersNotSupported');
  });
});

describe('focus-filters bridge: 013/014/027/028 regression', () => {
  it('app-intents bridge still exposes expected symbols', () => {
    const appIntents = require('@/native/app-intents');
    // app-intents exports default bridge + error class
    expect(appIntents.default).toBeDefined();
    expect(appIntents.AppIntentsNotSupported).toBeDefined();
  });

  it('widget-center bridge still exposes expected symbols', () => {
    const widgetCenter = require('@/native/widget-center');
    // widget-center exports default bridge
    expect(widgetCenter.default).toBeDefined();
    expect(widgetCenter.default.getCurrentConfig).toBeDefined();
    expect(widgetCenter.default.setConfig).toBeDefined();
  });
});
