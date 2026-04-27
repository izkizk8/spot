/**
 * Tests for the App Intents JS bridge.
 *
 * Uses jest.isolateModules + jest.doMock so each test pins its own
 * Platform / native-module return.
 *
 * @see specs/013-app-intents/contracts/app-intents-bridge.md
 */

import type { AppIntentsBridge } from '@/native/app-intents';

interface PlatformShape {
  OS: 'ios' | 'android' | 'web';
  Version: string | number;
  select: (specifics: Record<string, unknown>) => unknown;
}

type NativeMock = {
  logMood: jest.Mock;
  getLastMood: jest.Mock;
  greetUser: jest.Mock;
};

interface BridgeModule {
  default: AppIntentsBridge;
  AppIntentsNotSupported: new (msg?: string) => Error;
}

function loadBridge(opts: {
  os: 'ios' | 'android' | 'web';
  version?: string | number;
  native?: NativeMock | null;
}): BridgeModule {
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
      requireOptionalNativeModule: () => native,
    }));
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require('@/native/app-intents') as BridgeModule;
  });
  if (!mod) throw new Error('failed to load bridge module');
  return mod;
}

function freshNativeMock(): NativeMock {
  return {
    logMood: jest.fn().mockResolvedValue({ logged: 'happy', timestamp: 42 }),
    getLastMood: jest.fn().mockResolvedValue({ mood: 'sad' }),
    greetUser: jest.fn().mockResolvedValue({ greeting: 'Hello, Ada!' }),
  };
}

describe('app-intents bridge: web', () => {
  it('isAvailable() === false', () => {
    const { default: bridge } = loadBridge({ os: 'web' });
    expect(bridge.isAvailable()).toBe(false);
  });

  it('all three methods reject with AppIntentsNotSupported', async () => {
    const { default: bridge, AppIntentsNotSupported } = loadBridge({ os: 'web' });
    await expect(bridge.logMood('happy')).rejects.toBeInstanceOf(AppIntentsNotSupported);
    await expect(bridge.getLastMood()).rejects.toBeInstanceOf(AppIntentsNotSupported);
    await expect(bridge.greetUser('x')).rejects.toBeInstanceOf(AppIntentsNotSupported);
  });
});

describe('app-intents bridge: android', () => {
  it('isAvailable() === false', () => {
    const { default: bridge } = loadBridge({ os: 'android' });
    expect(bridge.isAvailable()).toBe(false);
  });

  it('all three methods reject with AppIntentsNotSupported', async () => {
    const { default: bridge, AppIntentsNotSupported } = loadBridge({ os: 'android' });
    await expect(bridge.logMood('happy')).rejects.toBeInstanceOf(AppIntentsNotSupported);
    await expect(bridge.getLastMood()).rejects.toBeInstanceOf(AppIntentsNotSupported);
    await expect(bridge.greetUser('y')).rejects.toBeInstanceOf(AppIntentsNotSupported);
  });
});

describe('app-intents bridge: iOS 15.5', () => {
  it('isAvailable() === false even with native module present', () => {
    const { default: bridge } = loadBridge({
      os: 'ios',
      version: '15.5',
      native: freshNativeMock(),
    });
    expect(bridge.isAvailable()).toBe(false);
  });

  it('all three methods reject with AppIntentsNotSupported', async () => {
    const { default: bridge, AppIntentsNotSupported } = loadBridge({
      os: 'ios',
      version: '15.5',
      native: freshNativeMock(),
    });
    await expect(bridge.logMood('happy')).rejects.toBeInstanceOf(AppIntentsNotSupported);
    await expect(bridge.getLastMood()).rejects.toBeInstanceOf(AppIntentsNotSupported);
    await expect(bridge.greetUser('y')).rejects.toBeInstanceOf(AppIntentsNotSupported);
  });
});

describe('app-intents bridge: iOS 16 + null native', () => {
  it('isAvailable() === false', () => {
    const { default: bridge } = loadBridge({ os: 'ios', version: '16.0', native: null });
    expect(bridge.isAvailable()).toBe(false);
  });

  it('all three methods reject with AppIntentsNotSupported', async () => {
    const { default: bridge, AppIntentsNotSupported } = loadBridge({
      os: 'ios',
      version: '16.0',
      native: null,
    });
    await expect(bridge.logMood('happy')).rejects.toBeInstanceOf(AppIntentsNotSupported);
    await expect(bridge.getLastMood()).rejects.toBeInstanceOf(AppIntentsNotSupported);
    await expect(bridge.greetUser('y')).rejects.toBeInstanceOf(AppIntentsNotSupported);
  });
});

describe('app-intents bridge: iOS 16 + native present (happy path)', () => {
  it('isAvailable() === true', () => {
    const { default: bridge } = loadBridge({
      os: 'ios',
      version: '16.0',
      native: freshNativeMock(),
    });
    expect(bridge.isAvailable()).toBe(true);
  });

  it('logMood delegates with right shape and reshapes result', async () => {
    const native = freshNativeMock();
    const { default: bridge } = loadBridge({ os: 'ios', native });
    const r = await bridge.logMood('happy');
    expect(native.logMood).toHaveBeenCalledWith({ mood: 'happy' });
    expect(r).toEqual({ ok: true, logged: 'happy', timestamp: 42 });
  });

  it('getLastMood delegates and reshapes', async () => {
    const native = freshNativeMock();
    const { default: bridge } = loadBridge({ os: 'ios', native });
    const r = await bridge.getLastMood();
    expect(native.getLastMood).toHaveBeenCalled();
    expect(r).toEqual({ ok: true, mood: 'sad' });
  });

  it('getLastMood passes mood: null through', async () => {
    const native = freshNativeMock();
    native.getLastMood.mockResolvedValueOnce({ mood: null });
    const { default: bridge } = loadBridge({ os: 'ios', native });
    const r = await bridge.getLastMood();
    expect(r).toEqual({ ok: true, mood: null });
  });

  it('greetUser delegates with right shape', async () => {
    const native = freshNativeMock();
    const { default: bridge } = loadBridge({ os: 'ios', native });
    const r = await bridge.greetUser('Ada');
    expect(native.greetUser).toHaveBeenCalledWith({ name: 'Ada' });
    expect(r).toEqual({ ok: true, greeting: 'Hello, Ada!' });
  });

  it('native rejecting with Error("NOT_SUPPORTED") → AppIntentsNotSupported', async () => {
    const native = freshNativeMock();
    native.logMood.mockRejectedValueOnce(new Error('NOT_SUPPORTED'));
    const { default: bridge, AppIntentsNotSupported } = loadBridge({ os: 'ios', native });
    await expect(bridge.logMood('happy')).rejects.toBeInstanceOf(AppIntentsNotSupported);
  });

  it('native rejecting with another Error → original Error rethrown', async () => {
    const err = new Error('disk full');
    const native = freshNativeMock();
    native.logMood.mockRejectedValueOnce(err);
    const { default: bridge } = loadBridge({ os: 'ios', native });
    await expect(bridge.logMood('happy')).rejects.toBe(err);
  });
});

describe('app-intents bridge: cross-cutting', () => {
  it('module imports without throwing on every platform', () => {
    for (const os of ['ios', 'android', 'web'] as const) {
      expect(() => loadBridge({ os })).not.toThrow();
    }
  });

  it('AppIntentsNotSupported is exported and instanceof Error', () => {
    const { AppIntentsNotSupported } = loadBridge({ os: 'ios' });
    const err = new AppIntentsNotSupported();
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('AppIntentsNotSupported');
  });

  it('default export is frozen', () => {
    const { default: bridge } = loadBridge({ os: 'ios' });
    expect(Object.isFrozen(bridge)).toBe(true);
  });
});
