/**
 * T009 (iOS): JS bridge contract test for feature 018 (Speech Recognition).
 *
 * Default-resolved file → corresponds to the iOS bridge implementation at
 * `src/native/speech-recognition.ts` which uses
 * `requireOptionalNativeModule('SpeechRecognition')` and exposes an
 * `EventEmitter`-backed `events` channel.
 *
 * Coverage:
 *   - isAvailable(locale) is synchronous, returns true when native module is present
 *     (Platform.OS === 'ios' && nativeModule != null), false when absent
 *   - availableLocales() proxies to native and returns the array
 *   - requestAuthorization / getAuthorizationStatus / start / stop delegate
 *     through to the mocked native module
 *   - On nativeModule == null, every async method rejects with
 *     SpeechRecognitionNotSupported
 *   - `events` is an EventEmitter instance (has addListener / removeAllListeners)
 *
 * Uses jest.isolateModules so module-scope `requireOptionalNativeModule(...)`
 * memoization is fresh in each test and constructor identity is preserved.
 */

interface NativeModuleMock {
  isAvailable: jest.Mock;
  availableLocales: jest.Mock;
  requestAuthorization: jest.Mock;
  getAuthorizationStatus: jest.Mock;
  start: jest.Mock;
  stop: jest.Mock;
  // EventEmitter-related (consumed by expo-modules-core's EventEmitter)
  addListener: jest.Mock;
  removeListeners: jest.Mock;
}

function freshNative(overrides: Partial<NativeModuleMock> = {}): NativeModuleMock {
  return {
    isAvailable: jest.fn(() => true),
    availableLocales: jest.fn(() => ['en-US', 'es-ES']),
    requestAuthorization: jest.fn(),
    getAuthorizationStatus: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
    ...overrides,
  };
}

interface BridgeBundle {
  bridge: typeof import('@/native/speech-recognition').default;
  SpeechRecognitionNotSupported: new (msg?: string) => Error;
  native: NativeModuleMock | null;
}

function loadIOSBridge(native: NativeModuleMock | null): BridgeBundle {
  let bundle: BridgeBundle | undefined;
  jest.isolateModules(() => {
    jest.doMock('react-native', () => ({
      __esModule: true,
      Platform: { OS: 'ios' },
    }));
    jest.doMock('expo-modules-core', () => {
      class FakeEventEmitter {
        addListener = jest.fn(() => ({ remove: jest.fn() }));
        removeAllListeners = jest.fn();
      }
      return {
        __esModule: true,
        requireOptionalNativeModule: () => native,
        EventEmitter: FakeEventEmitter,
      };
    });
    const types = require('@/native/speech-recognition.types');
    const bridgeModule = require('@/native/speech-recognition');
    bundle = {
      bridge: bridgeModule.default,
      SpeechRecognitionNotSupported: types.SpeechRecognitionNotSupported,
      native,
    };
  });
  if (!bundle) throw new Error('failed to load iOS bridge');
  return bundle;
}

describe('speech-recognition bridge (iOS)', () => {
  describe('isAvailable(locale)', () => {
    it('returns true when native module is present', () => {
      const { bridge } = loadIOSBridge(freshNative());
      expect(bridge.isAvailable('en-US')).toBe(true);
    });

    it('returns false when native module is absent', () => {
      const { bridge } = loadIOSBridge(null);
      expect(bridge.isAvailable('en-US')).toBe(false);
    });

    it('is synchronous (returns boolean, not Promise)', () => {
      const { bridge } = loadIOSBridge(freshNative());
      const result = bridge.isAvailable('en-US');
      expect(typeof result).toBe('boolean');
      expect(result).not.toBeInstanceOf(Promise);
    });
  });

  describe('availableLocales()', () => {
    it('returns array proxied from native module', () => {
      const native = freshNative();
      native.availableLocales.mockReturnValue(['en-US', 'fr-FR', 'ja-JP']);
      const { bridge } = loadIOSBridge(native);
      expect(bridge.availableLocales()).toEqual(['en-US', 'fr-FR', 'ja-JP']);
    });

    it('returns [] when native module is absent', () => {
      const { bridge } = loadIOSBridge(null);
      expect(bridge.availableLocales()).toEqual([]);
    });
  });

  describe('requestAuthorization()', () => {
    it('delegates to native module', async () => {
      const native = freshNative();
      native.requestAuthorization.mockResolvedValue('authorized');
      const { bridge } = loadIOSBridge(native);
      const status = await bridge.requestAuthorization();
      expect(status).toBe('authorized');
      expect(native.requestAuthorization).toHaveBeenCalled();
    });

    it('rejects with SpeechRecognitionNotSupported when native module is absent', async () => {
      const { bridge, SpeechRecognitionNotSupported } = loadIOSBridge(null);
      await expect(bridge.requestAuthorization()).rejects.toBeInstanceOf(
        SpeechRecognitionNotSupported,
      );
    });
  });

  describe('getAuthorizationStatus()', () => {
    it('delegates to native module', async () => {
      const native = freshNative();
      native.getAuthorizationStatus.mockResolvedValue('notDetermined');
      const { bridge } = loadIOSBridge(native);
      const status = await bridge.getAuthorizationStatus();
      expect(status).toBe('notDetermined');
    });

    it('rejects with SpeechRecognitionNotSupported when native module is absent', async () => {
      const { bridge, SpeechRecognitionNotSupported } = loadIOSBridge(null);
      await expect(bridge.getAuthorizationStatus()).rejects.toBeInstanceOf(
        SpeechRecognitionNotSupported,
      );
    });
  });

  describe('start({ locale, onDevice })', () => {
    it('delegates to native module with the given args', async () => {
      const native = freshNative();
      native.start.mockResolvedValue(undefined);
      const { bridge } = loadIOSBridge(native);
      await bridge.start({ locale: 'en-US', onDevice: false });
      expect(native.start).toHaveBeenCalledWith({ locale: 'en-US', onDevice: false });
    });

    it('rejects with SpeechRecognitionNotSupported when native module is absent', async () => {
      const { bridge, SpeechRecognitionNotSupported } = loadIOSBridge(null);
      await expect(bridge.start({ locale: 'en-US', onDevice: false })).rejects.toBeInstanceOf(
        SpeechRecognitionNotSupported,
      );
    });
  });

  describe('stop()', () => {
    it('delegates to native module', async () => {
      const native = freshNative();
      native.stop.mockResolvedValue(undefined);
      const { bridge } = loadIOSBridge(native);
      await bridge.stop();
      expect(native.stop).toHaveBeenCalled();
    });

    it('rejects with SpeechRecognitionNotSupported when native module is absent', async () => {
      const { bridge, SpeechRecognitionNotSupported } = loadIOSBridge(null);
      await expect(bridge.stop()).rejects.toBeInstanceOf(SpeechRecognitionNotSupported);
    });
  });

  describe('events', () => {
    it('exposes an EventEmitter with addListener / removeAllListeners', () => {
      const { bridge } = loadIOSBridge(freshNative());
      expect(bridge.events).toBeDefined();
      expect(typeof bridge.events.addListener).toBe('function');
      expect(typeof bridge.events.removeAllListeners).toBe('function');
    });
  });
});
