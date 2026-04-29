/**
 * Tests for the iOS Background Tasks JS bridge — feature 030 / T015.
 *
 * Uses jest.isolateModules + jest.doMock so each test pins its own
 * Platform / native-module return.
 */

import type { TaskRunRecord } from '@/native/background-tasks.types';

interface PlatformShape {
  OS: 'ios' | 'android' | 'web';
  Version: string | number;
  select: (specifics: Record<string, unknown>) => unknown;
}

type NativeMock = {
  scheduleAppRefresh: jest.Mock;
  scheduleProcessing: jest.Mock;
  cancelAll: jest.Mock;
  getLastRun: jest.Mock;
};

type BridgeModule = typeof import('@/native/background-tasks');

let requireOptionalNativeModuleArg: string | undefined;

function loadBridge(opts: {
  os: 'ios' | 'android' | 'web';
  version?: string | number;
  native?: NativeMock | null;
}): BridgeModule {
  requireOptionalNativeModuleArg = undefined;
  const platform: PlatformShape = {
    OS: opts.os,
    Version: opts.version ?? '17.0',
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
    mod = require('@/native/background-tasks') as BridgeModule;
  });
  if (!mod) throw new Error('failed to load bridge module');
  return mod;
}

function freshNativeMock(): NativeMock {
  return {
    scheduleAppRefresh: jest.fn().mockResolvedValue(undefined),
    scheduleProcessing: jest.fn().mockResolvedValue(undefined),
    cancelAll: jest.fn().mockResolvedValue(undefined),
    getLastRun: jest.fn().mockResolvedValue(null),
  };
}

describe('background-tasks bridge: iOS happy path', () => {
  it('isAvailable() === true with native present and Platform.OS === "ios"', () => {
    const b = loadBridge({ os: 'ios', native: freshNativeMock() });
    expect(b.isAvailable()).toBe(true);
  });

  it('getRegisteredIdentifiers() returns the two task ids (FR-060/FR-065)', () => {
    const b = loadBridge({ os: 'ios', native: freshNativeMock() });
    expect(b.getRegisteredIdentifiers()).toEqual([
      'com.izkizk8.spot.refresh',
      'com.izkizk8.spot.processing',
    ]);
  });

  it('scheduleAppRefresh forwards ms to native exactly once (FR-021/FR-070)', async () => {
    const native = freshNativeMock();
    const b = loadBridge({ os: 'ios', native });
    await b.scheduleAppRefresh(60_000);
    expect(native.scheduleAppRefresh).toHaveBeenCalledTimes(1);
    expect(native.scheduleAppRefresh).toHaveBeenCalledWith(60_000);
  });

  it('scheduleProcessing forwards both flags verbatim (FR-031/FR-070)', async () => {
    const native = freshNativeMock();
    const b = loadBridge({ os: 'ios', native });
    await b.scheduleProcessing({
      requiresExternalPower: true,
      requiresNetworkConnectivity: true,
    });
    expect(native.scheduleProcessing).toHaveBeenCalledTimes(1);
    expect(native.scheduleProcessing).toHaveBeenCalledWith({
      requiresExternalPower: true,
      requiresNetworkConnectivity: true,
    });
  });

  it('cancelAll delegates to native (FR-082)', async () => {
    const native = freshNativeMock();
    const b = loadBridge({ os: 'ios', native });
    await b.cancelAll();
    expect(native.cancelAll).toHaveBeenCalledTimes(1);
  });

  it('getLastRun resolves to the native return value (FR-070)', async () => {
    const native = freshNativeMock();
    const rec: TaskRunRecord = {
      id: 'r1',
      type: 'refresh',
      scheduledAt: 1,
      startedAt: 2,
      endedAt: 3,
      durationMs: 1,
      status: 'completed',
    };
    native.getLastRun.mockResolvedValueOnce({ refresh: rec, processing: null });
    const b = loadBridge({ os: 'ios', native });
    const result = await b.getLastRun();
    expect(result).toEqual({ refresh: rec, processing: null });
  });

  it('requireOptionalNativeModule called with the literal "BackgroundTasks" (B1)', () => {
    loadBridge({ os: 'ios', native: freshNativeMock() });
    expect(requireOptionalNativeModuleArg).toBe('BackgroundTasks');
  });
});

describe('background-tasks bridge: native module absent', () => {
  it('isAvailable() === false', () => {
    const b = loadBridge({ os: 'ios', native: null });
    expect(b.isAvailable()).toBe(false);
  });

  it('getRegisteredIdentifiers() === []', () => {
    const b = loadBridge({ os: 'ios', native: null });
    expect(b.getRegisteredIdentifiers()).toEqual([]);
  });

  it('every mutating method rejects with BackgroundTasksNotSupported (FR-071/FR-072/EC-002)', async () => {
    const b = loadBridge({ os: 'ios', native: null });
    await expect(b.scheduleAppRefresh()).rejects.toBeInstanceOf(b.BackgroundTasksNotSupported);
    await expect(
      b.scheduleProcessing({ requiresExternalPower: true, requiresNetworkConnectivity: true }),
    ).rejects.toBeInstanceOf(b.BackgroundTasksNotSupported);
    await expect(b.cancelAll()).rejects.toBeInstanceOf(b.BackgroundTasksNotSupported);
    await expect(b.getLastRun()).rejects.toBeInstanceOf(b.BackgroundTasksNotSupported);
  });
});

describe('background-tasks bridge: iOS < 13', () => {
  it('isAvailable() === false even with native present', () => {
    const b = loadBridge({ os: 'ios', version: '12.4', native: freshNativeMock() });
    expect(b.isAvailable()).toBe(false);
  });

  it('mutating methods reject with BackgroundTasksNotSupported', async () => {
    const b = loadBridge({ os: 'ios', version: '12.4', native: freshNativeMock() });
    await expect(b.cancelAll()).rejects.toBeInstanceOf(b.BackgroundTasksNotSupported);
  });
});

describe('background-tasks bridge: serialised promise chain (R-A / FR-083)', () => {
  it('two back-to-back scheduleAppRefresh calls produce two native invocations in order', async () => {
    const native = freshNativeMock();
    const order: number[] = [];
    let resolveFirstHolder: { current: () => void } = { current: () => undefined };
    native.scheduleAppRefresh
      .mockImplementationOnce(
        () =>
          new Promise<void>((res) => {
            resolveFirstHolder.current = () => {
              order.push(1);
              res();
            };
          }),
      )
      .mockImplementationOnce(() => {
        order.push(2);
        return Promise.resolve();
      });

    const b = loadBridge({ os: 'ios', native });
    const p1 = b.scheduleAppRefresh(60_000);
    const p2 = b.scheduleAppRefresh(60_000);

    // Flush microtasks so the first chained call begins
    await Promise.resolve();
    await Promise.resolve();
    expect(native.scheduleAppRefresh).toHaveBeenCalledTimes(1);
    resolveFirstHolder.current();
    await Promise.all([p1, p2]);
    expect(order).toEqual([1, 2]);
    expect(native.scheduleAppRefresh).toHaveBeenCalledTimes(2);
  });

  it('first-call rejection does not poison the chain', async () => {
    const native = freshNativeMock();
    native.scheduleAppRefresh
      .mockRejectedValueOnce(new Error('first failed'))
      .mockResolvedValueOnce(undefined);

    const b = loadBridge({ os: 'ios', native });
    const p1 = b.scheduleAppRefresh(60_000);
    const p2 = b.scheduleAppRefresh(60_000);

    await expect(p1).rejects.toThrow('first failed');
    await expect(p2).resolves.toBeUndefined();
    expect(native.scheduleAppRefresh).toHaveBeenCalledTimes(2);
  });
});

describe('background-tasks bridge: error class identity', () => {
  it('BackgroundTasksNotSupported thrown from non-iOS path is instanceof BackgroundTasksNotSupported (FR-072)', async () => {
    const b = loadBridge({ os: 'web', native: null });
    let caught: unknown;
    try {
      await b.scheduleAppRefresh();
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(b.BackgroundTasksNotSupported);
    expect(caught).toBeInstanceOf(Error);
  });
});
