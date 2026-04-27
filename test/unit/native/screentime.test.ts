/**
 * @file T007 — JS bridge contract test for feature 015.
 *
 * Tests the bridge contract from contracts/screentime-bridge.contract.ts:
 *   - isAvailable() is synchronous and returns false when module is absent
 *   - entitlementsAvailable() never throws (resolves false when probe rejects)
 *   - All other async methods reject with EntitlementMissingError when probe → false
 *   - Android/web stubs reject with ScreenTimeNotSupportedError
 *
 * NOTE on isolated modules: the iOS bridge memoizes the entitlement
 * probe at module scope. Each test must run in `jest.isolateModules` so
 * the memoization is fresh AND the error classes used inside the bridge
 * share constructor identity with the ones the assertions reference.
 */

interface NativeModuleMock {
  isAvailable: jest.Mock;
  entitlementsAvailable: jest.Mock;
  requestAuthorization: jest.Mock;
  getAuthorizationStatus: jest.Mock;
  pickActivity: jest.Mock;
  applyShielding: jest.Mock;
  clearShielding: jest.Mock;
  startMonitoring: jest.Mock;
  stopMonitoring: jest.Mock;
}

function freshNative(overrides: Partial<NativeModuleMock> = {}): NativeModuleMock {
  return {
    isAvailable: jest.fn(() => true),
    entitlementsAvailable: jest.fn(),
    requestAuthorization: jest.fn(),
    getAuthorizationStatus: jest.fn(),
    pickActivity: jest.fn(),
    applyShielding: jest.fn(),
    clearShielding: jest.fn(),
    startMonitoring: jest.fn(),
    stopMonitoring: jest.fn(),
    ...overrides,
  };
}

interface BridgeBundle {
  bridge: typeof import('@/native/screentime').default;
  EntitlementMissingError: new (msg?: string) => Error;
  ScreenTimeNotSupportedError: new (msg?: string) => Error;
  PickerCancelledError: new (msg?: string) => Error;
  native: NativeModuleMock | null;
}

function loadIOSBridge(native: NativeModuleMock | null): BridgeBundle {
  let bundle: BridgeBundle | undefined;
  jest.isolateModules(() => {
    jest.doMock('expo-modules-core', () => ({
      __esModule: true,
      requireOptionalNativeModule: () => native,
    }));
    const types = require('@/native/screentime.types');
    const bridgeModule = require('@/native/screentime');
    bundle = {
      bridge: bridgeModule.default,
      EntitlementMissingError: types.EntitlementMissingError,
      ScreenTimeNotSupportedError: types.ScreenTimeNotSupportedError,
      PickerCancelledError: types.PickerCancelledError,
      native,
    };
  });
  if (!bundle) throw new Error('failed to load bridge');
  return bundle;
}

describe('screentime bridge (iOS)', () => {
  describe('isAvailable()', () => {
    it('returns false when requireOptionalNativeModule returns null', () => {
      const { bridge } = loadIOSBridge(null);
      expect(bridge.isAvailable()).toBe(false);
    });

    it('returns true when native module is present', () => {
      const { bridge } = loadIOSBridge(freshNative());
      expect(bridge.isAvailable()).toBe(true);
    });

    it('is synchronous (does not return a Promise)', () => {
      const { bridge } = loadIOSBridge(null);
      const result = bridge.isAvailable();
      expect(typeof result).toBe('boolean');
      expect(result).not.toBeInstanceOf(Promise);
    });
  });

  describe('entitlementsAvailable()', () => {
    it('resolves false when native module is absent', async () => {
      const { bridge } = loadIOSBridge(null);
      const result = await bridge.entitlementsAvailable();
      expect(result).toBe(false);
    });

    it('resolves true when native probe succeeds', async () => {
      const native = freshNative();
      native.entitlementsAvailable.mockResolvedValue(true);
      const { bridge } = loadIOSBridge(native);
      const result = await bridge.entitlementsAvailable();
      expect(result).toBe(true);
    });

    it('resolves false when native probe rejects (never throws)', async () => {
      const native = freshNative();
      native.entitlementsAvailable.mockRejectedValue(new Error('Entitlement missing'));
      const { bridge } = loadIOSBridge(native);
      const result = await bridge.entitlementsAvailable();
      expect(result).toBe(false);
    });

    it('memoizes result for the process lifetime', async () => {
      const native = freshNative();
      native.entitlementsAvailable.mockResolvedValue(true);
      const { bridge } = loadIOSBridge(native);
      const result1 = await bridge.entitlementsAvailable();
      const result2 = await bridge.entitlementsAvailable();
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(native.entitlementsAvailable).toHaveBeenCalledTimes(1);
    });
  });

  describe('requestAuthorization()', () => {
    it('rejects with EntitlementMissingError when entitlements unavailable', async () => {
      const native = freshNative();
      native.entitlementsAvailable.mockResolvedValue(false);
      const { bridge, EntitlementMissingError } = loadIOSBridge(native);
      await expect(bridge.requestAuthorization()).rejects.toBeInstanceOf(EntitlementMissingError);
    });

    it('calls native module when entitlements available', async () => {
      const native = freshNative();
      native.entitlementsAvailable.mockResolvedValue(true);
      native.requestAuthorization.mockResolvedValue('approved');
      const { bridge } = loadIOSBridge(native);
      const result = await bridge.requestAuthorization();
      expect(result).toBe('approved');
      expect(native.requestAuthorization).toHaveBeenCalled();
    });

    it('rejects when native module is absent', async () => {
      const { bridge, EntitlementMissingError } = loadIOSBridge(null);
      await expect(bridge.requestAuthorization()).rejects.toBeInstanceOf(EntitlementMissingError);
    });
  });

  describe('getAuthorizationStatus()', () => {
    it('rejects with EntitlementMissingError when entitlements unavailable', async () => {
      const native = freshNative();
      native.entitlementsAvailable.mockResolvedValue(false);
      const { bridge, EntitlementMissingError } = loadIOSBridge(native);
      await expect(bridge.getAuthorizationStatus()).rejects.toBeInstanceOf(EntitlementMissingError);
    });

    it('calls native module when entitlements available', async () => {
      const native = freshNative();
      native.entitlementsAvailable.mockResolvedValue(true);
      native.getAuthorizationStatus.mockResolvedValue('notDetermined');
      const { bridge } = loadIOSBridge(native);
      const result = await bridge.getAuthorizationStatus();
      expect(result).toBe('notDetermined');
    });
  });

  describe('pickActivity()', () => {
    it('rejects with EntitlementMissingError when entitlements unavailable', async () => {
      const native = freshNative();
      native.entitlementsAvailable.mockResolvedValue(false);
      const { bridge, EntitlementMissingError } = loadIOSBridge(native);
      await expect(bridge.pickActivity()).rejects.toBeInstanceOf(EntitlementMissingError);
    });

    it('calls native module and returns SelectionSummary', async () => {
      const mockSummary = {
        applicationCount: 2,
        categoryCount: 1,
        webDomainCount: 0,
        rawSelectionToken: 'base64token',
      };
      const native = freshNative();
      native.entitlementsAvailable.mockResolvedValue(true);
      native.pickActivity.mockResolvedValue(mockSummary);
      const { bridge } = loadIOSBridge(native);
      const result = await bridge.pickActivity();
      expect(result).toEqual(mockSummary);
    });

    it('propagates PickerCancelledError from native', async () => {
      const native = freshNative();
      native.entitlementsAvailable.mockResolvedValue(true);
      // Build the picker-cancelled error inside the same isolated module
      // graph the bridge uses, so the constructor identity matches.
      let bundle: BridgeBundle | undefined;
      jest.isolateModules(() => {
        jest.doMock('expo-modules-core', () => ({
          __esModule: true,
          requireOptionalNativeModule: () => native,
        }));
        const types = require('@/native/screentime.types');
        native.pickActivity.mockRejectedValue(new types.PickerCancelledError());
        const bridgeModule = require('@/native/screentime');
        bundle = {
          bridge: bridgeModule.default,
          EntitlementMissingError: types.EntitlementMissingError,
          ScreenTimeNotSupportedError: types.ScreenTimeNotSupportedError,
          PickerCancelledError: types.PickerCancelledError,
          native,
        };
      });
      await expect(bundle!.bridge.pickActivity()).rejects.toBeInstanceOf(
        bundle!.PickerCancelledError,
      );
    });
  });

  describe('applyShielding()', () => {
    it('rejects with EntitlementMissingError when entitlements unavailable', async () => {
      const native = freshNative();
      native.entitlementsAvailable.mockResolvedValue(false);
      const { bridge, EntitlementMissingError } = loadIOSBridge(native);
      await expect(bridge.applyShielding('token')).rejects.toBeInstanceOf(EntitlementMissingError);
    });

    it('calls native module with token', async () => {
      const native = freshNative();
      native.entitlementsAvailable.mockResolvedValue(true);
      native.applyShielding.mockResolvedValue(undefined);
      const { bridge } = loadIOSBridge(native);
      await bridge.applyShielding('testToken');
      expect(native.applyShielding).toHaveBeenCalledWith('testToken');
    });
  });

  describe('clearShielding()', () => {
    it('rejects with EntitlementMissingError when entitlements unavailable', async () => {
      const native = freshNative();
      native.entitlementsAvailable.mockResolvedValue(false);
      const { bridge, EntitlementMissingError } = loadIOSBridge(native);
      await expect(bridge.clearShielding()).rejects.toBeInstanceOf(EntitlementMissingError);
    });

    it('calls native module', async () => {
      const native = freshNative();
      native.entitlementsAvailable.mockResolvedValue(true);
      native.clearShielding.mockResolvedValue(undefined);
      const { bridge } = loadIOSBridge(native);
      await bridge.clearShielding();
      expect(native.clearShielding).toHaveBeenCalled();
    });
  });

  describe('startMonitoring()', () => {
    it('rejects with EntitlementMissingError when entitlements unavailable', async () => {
      const native = freshNative();
      native.entitlementsAvailable.mockResolvedValue(false);
      const { bridge, EntitlementMissingError } = loadIOSBridge(native);
      const schedule = { startHour: 9, startMinute: 0, endHour: 21, endMinute: 0 };
      await expect(bridge.startMonitoring('token', schedule)).rejects.toBeInstanceOf(
        EntitlementMissingError,
      );
    });

    it('calls native module with token and schedule', async () => {
      const native = freshNative();
      native.entitlementsAvailable.mockResolvedValue(true);
      native.startMonitoring.mockResolvedValue(undefined);
      const { bridge } = loadIOSBridge(native);
      const schedule = { startHour: 9, startMinute: 0, endHour: 21, endMinute: 0 };
      await bridge.startMonitoring('token', schedule);
      expect(native.startMonitoring).toHaveBeenCalledWith('token', schedule);
    });
  });

  describe('stopMonitoring()', () => {
    it('rejects with EntitlementMissingError when entitlements unavailable', async () => {
      const native = freshNative();
      native.entitlementsAvailable.mockResolvedValue(false);
      const { bridge, EntitlementMissingError } = loadIOSBridge(native);
      await expect(bridge.stopMonitoring()).rejects.toBeInstanceOf(EntitlementMissingError);
    });

    it('calls native module', async () => {
      const native = freshNative();
      native.entitlementsAvailable.mockResolvedValue(true);
      native.stopMonitoring.mockResolvedValue(undefined);
      const { bridge } = loadIOSBridge(native);
      await bridge.stopMonitoring();
      expect(native.stopMonitoring).toHaveBeenCalled();
    });
  });
});

describe('screentime bridge (Android stub)', () => {
  const androidBridge = require('@/native/screentime.android').default;
  const { ScreenTimeNotSupportedError } = require('@/native/screentime.types');

  it('isAvailable() returns false', () => {
    expect(androidBridge.isAvailable()).toBe(false);
  });

  it('entitlementsAvailable() resolves false', async () => {
    expect(await androidBridge.entitlementsAvailable()).toBe(false);
  });

  it('requestAuthorization() rejects with ScreenTimeNotSupportedError', async () => {
    await expect(androidBridge.requestAuthorization()).rejects.toBeInstanceOf(
      ScreenTimeNotSupportedError,
    );
  });

  it('getAuthorizationStatus() rejects with ScreenTimeNotSupportedError', async () => {
    await expect(androidBridge.getAuthorizationStatus()).rejects.toBeInstanceOf(
      ScreenTimeNotSupportedError,
    );
  });

  it('pickActivity() rejects with ScreenTimeNotSupportedError', async () => {
    await expect(androidBridge.pickActivity()).rejects.toBeInstanceOf(ScreenTimeNotSupportedError);
  });

  it('applyShielding() rejects with ScreenTimeNotSupportedError', async () => {
    await expect(androidBridge.applyShielding('token')).rejects.toBeInstanceOf(
      ScreenTimeNotSupportedError,
    );
  });

  it('clearShielding() rejects with ScreenTimeNotSupportedError', async () => {
    await expect(androidBridge.clearShielding()).rejects.toBeInstanceOf(
      ScreenTimeNotSupportedError,
    );
  });

  it('startMonitoring() rejects with ScreenTimeNotSupportedError', async () => {
    const schedule = { startHour: 9, startMinute: 0, endHour: 21, endMinute: 0 };
    await expect(androidBridge.startMonitoring('token', schedule)).rejects.toBeInstanceOf(
      ScreenTimeNotSupportedError,
    );
  });

  it('stopMonitoring() rejects with ScreenTimeNotSupportedError', async () => {
    await expect(androidBridge.stopMonitoring()).rejects.toBeInstanceOf(
      ScreenTimeNotSupportedError,
    );
  });
});

describe('screentime bridge (Web stub)', () => {
  const webBridge = require('@/native/screentime.web').default;
  const { ScreenTimeNotSupportedError } = require('@/native/screentime.types');

  it('isAvailable() returns false', () => {
    expect(webBridge.isAvailable()).toBe(false);
  });

  it('entitlementsAvailable() resolves false', async () => {
    expect(await webBridge.entitlementsAvailable()).toBe(false);
  });

  it('all async methods reject with ScreenTimeNotSupportedError', async () => {
    const schedule = { startHour: 9, startMinute: 0, endHour: 21, endMinute: 0 };
    await expect(webBridge.requestAuthorization()).rejects.toBeInstanceOf(
      ScreenTimeNotSupportedError,
    );
    await expect(webBridge.getAuthorizationStatus()).rejects.toBeInstanceOf(
      ScreenTimeNotSupportedError,
    );
    await expect(webBridge.pickActivity()).rejects.toBeInstanceOf(ScreenTimeNotSupportedError);
    await expect(webBridge.applyShielding('token')).rejects.toBeInstanceOf(
      ScreenTimeNotSupportedError,
    );
    await expect(webBridge.clearShielding()).rejects.toBeInstanceOf(ScreenTimeNotSupportedError);
    await expect(webBridge.startMonitoring('token', schedule)).rejects.toBeInstanceOf(
      ScreenTimeNotSupportedError,
    );
    await expect(webBridge.stopMonitoring()).rejects.toBeInstanceOf(ScreenTimeNotSupportedError);
  });
});
