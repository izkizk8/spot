/**
 * T012 (iOS): JS bridge contract test for feature 019.
 *
 * Default-resolved file → corresponds to the iOS bridge implementation at
 * `src/native/speech-synthesis.ts`.
 */

interface NativeMock {
  availableVoices: jest.Mock;
  speak: jest.Mock;
  pause: jest.Mock;
  continue: jest.Mock;
  stop: jest.Mock;
  isSpeaking: jest.Mock;
  requestPersonalVoiceAuthorization: jest.Mock;
  addListener: jest.Mock;
  removeListeners: jest.Mock;
}

function freshNative(overrides: Partial<NativeMock> = {}): NativeMock {
  return {
    availableVoices: jest.fn(() =>
      Promise.resolve([
        { id: 'v1', name: 'Alex', language: 'en-US', quality: 'Default', isPersonalVoice: false },
      ]),
    ),
    speak: jest.fn(() => Promise.resolve()),
    pause: jest.fn(() => Promise.resolve()),
    continue: jest.fn(() => Promise.resolve()),
    stop: jest.fn(() => Promise.resolve()),
    isSpeaking: jest.fn(() => false),
    requestPersonalVoiceAuthorization: jest.fn(() => Promise.resolve('notDetermined')),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
    ...overrides,
  };
}

interface BridgeBundle {
  bridge: typeof import('@/native/speech-synthesis').default;
  SpeechSynthesisNotSupported: new (msg?: string) => Error;
}

function loadIOSBridge(native: NativeMock | null): BridgeBundle {
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
    const types = require('@/native/speech-synthesis.types');
    const bridgeModule = require('@/native/speech-synthesis');
    bundle = {
      bridge: bridgeModule.default,
      SpeechSynthesisNotSupported: types.SpeechSynthesisNotSupported,
    };
  });
  if (!bundle) throw new Error('failed to load iOS bridge');
  return bundle;
}

describe('speech-synthesis bridge (iOS)', () => {
  describe('native module PRESENT', () => {
    it('availableVoices proxies and maps to Voice shape', async () => {
      const native = freshNative();
      const { bridge } = loadIOSBridge(native);
      const list = await bridge.availableVoices();
      expect(native.availableVoices).toHaveBeenCalled();
      expect(list).toEqual([
        { id: 'v1', name: 'Alex', language: 'en-US', quality: 'Default', isPersonalVoice: false },
      ]);
    });

    it('speak delegates to native with clamped values', async () => {
      const native = freshNative();
      const { bridge } = loadIOSBridge(native);
      await bridge.speak({ text: 'hi', rate: 0.5, pitch: 1, volume: 0.7 });
      expect(native.speak).toHaveBeenCalledWith({
        text: 'hi',
        voiceId: undefined,
        rate: 0.5,
        pitch: 1,
        volume: 0.7,
      });
    });

    it('pause / continue / stop delegate', async () => {
      const native = freshNative();
      const { bridge } = loadIOSBridge(native);
      await bridge.pause();
      await bridge.continue();
      await bridge.stop();
      expect(native.pause).toHaveBeenCalled();
      expect(native.continue).toHaveBeenCalled();
      expect(native.stop).toHaveBeenCalled();
    });

    it('isSpeaking is synchronous boolean', () => {
      const native = freshNative({ isSpeaking: jest.fn(() => true) });
      const { bridge } = loadIOSBridge(native);
      const r = bridge.isSpeaking();
      expect(typeof r).toBe('boolean');
      expect(r).toBe(true);
    });

    it('requestPersonalVoiceAuthorization proxies to native', async () => {
      const native = freshNative({
        requestPersonalVoiceAuthorization: jest.fn(() => Promise.resolve('authorized')),
      });
      const { bridge } = loadIOSBridge(native);
      const status = await bridge.requestPersonalVoiceAuthorization();
      expect(status).toBe('authorized');
    });

    it('events exposes addListener / removeAllListeners', () => {
      const { bridge } = loadIOSBridge(freshNative());
      expect(bridge.events).toBeDefined();
      expect(typeof bridge.events.addListener).toBe('function');
      expect(typeof bridge.events.removeAllListeners).toBe('function');
    });
  });

  describe('native module ABSENT (NOOP_BRIDGE)', () => {
    it('availableVoices returns []', async () => {
      const { bridge } = loadIOSBridge(null);
      expect(await bridge.availableVoices()).toEqual([]);
    });

    it('speak rejects with SpeechSynthesisNotSupported', async () => {
      const { bridge, SpeechSynthesisNotSupported } = loadIOSBridge(null);
      await expect(
        bridge.speak({ text: 'hi', rate: 0.5, pitch: 1, volume: 0.7 }),
      ).rejects.toBeInstanceOf(SpeechSynthesisNotSupported);
    });

    it('pause / continue reject with SpeechSynthesisNotSupported', async () => {
      const { bridge, SpeechSynthesisNotSupported } = loadIOSBridge(null);
      await expect(bridge.pause()).rejects.toBeInstanceOf(SpeechSynthesisNotSupported);
      await expect(bridge.continue()).rejects.toBeInstanceOf(SpeechSynthesisNotSupported);
    });

    it('stop resolves quietly (idempotent)', async () => {
      const { bridge } = loadIOSBridge(null);
      await expect(bridge.stop()).resolves.toBeUndefined();
    });

    it('requestPersonalVoiceAuthorization resolves "unsupported"', async () => {
      const { bridge } = loadIOSBridge(null);
      expect(await bridge.requestPersonalVoiceAuthorization()).toBe('unsupported');
    });

    it('isSpeaking is false', () => {
      const { bridge } = loadIOSBridge(null);
      expect(bridge.isSpeaking()).toBe(false);
    });
  });
});
