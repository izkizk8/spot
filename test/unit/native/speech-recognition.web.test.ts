/**
 * T009 (Web): JS bridge contract test for feature 018 — web fallback.
 *
 * Resolves to `src/native/speech-recognition.web.ts` per Metro's platform
 * extension resolution.
 *
 * Two scenarios:
 *
 *   1. webkitSpeechRecognition ABSENT — bridge mirrors the Android stub:
 *      isAvailable() → false; availableLocales() → []; all async methods
 *      reject with SpeechRecognitionNotSupported.
 *
 *   2. webkitSpeechRecognition PRESENT — bridge becomes operational:
 *      isAvailable() → true; availableLocales() → non-empty; start()
 *      constructs a webkit recognizer; onresult fires partial / final events;
 *      onerror maps to an error event.
 */

interface WebkitInstanceMock {
  start: jest.Mock;
  stop: jest.Mock;
  abort: jest.Mock;
  addEventListener: jest.Mock;
  removeEventListener: jest.Mock;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((ev: any) => void) | null;
  onerror: ((ev: any) => void) | null;
  onend: ((ev: any) => void) | null;
  onstart: ((ev: any) => void) | null;
}

function createWebkitInstance(): WebkitInstanceMock {
  // The implementation wires events with `addEventListener` (per
  // eslint-plugin-unicorn). The mock routes those listener registrations
  // back onto the legacy `on{type}` fields so tests can synthesize events
  // by calling `inst.onresult?.(fakeEvent)` regardless of how the bridge
  // subscribes.
  const inst: WebkitInstanceMock = {
    start: jest.fn(),
    stop: jest.fn(),
    abort: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    continuous: false,
    interimResults: false,
    lang: '',
    onresult: null,
    onerror: null,
    onend: null,
    onstart: null,
  };
  inst.addEventListener.mockImplementation((type: string, listener: (ev: any) => void) => {
    const key = `on${type}` as 'onresult' | 'onerror' | 'onend' | 'onstart';
    inst[key] = listener;
  });
  inst.removeEventListener.mockImplementation((type: string) => {
    const key = `on${type}` as 'onresult' | 'onerror' | 'onend' | 'onstart';
    inst[key] = null;
  });
  return inst;
}

function loadWebBridge(opts: { webkitPresent: boolean; instances?: WebkitInstanceMock[] }): {
  bridge: any;
  SpeechRecognitionNotSupported: new (msg?: string) => Error;
  webkitCtor: jest.Mock | null;
} {
  let bundle:
    | {
        bridge: any;
        SpeechRecognitionNotSupported: new (msg?: string) => Error;
        webkitCtor: jest.Mock | null;
      }
    | undefined;

  jest.isolateModules(() => {
    let webkitCtor: jest.Mock | null = null;
    if (opts.webkitPresent) {
      const queue = [...(opts.instances ?? [createWebkitInstance()])];
      webkitCtor = jest.fn(function () {
        const inst = queue.shift() ?? createWebkitInstance();
        // Returning an object from a constructor causes `new Ctor()` to
        // resolve to that object — keeping the test's `inst` reference
        // identical to what the bridge mutates (so `inst.onresult` etc.
        // observe the bridge's wiring).
        return inst;
      }) as unknown as jest.Mock;
      (globalThis as any).webkitSpeechRecognition = webkitCtor;
    } else {
      delete (globalThis as any).webkitSpeechRecognition;
    }

    jest.doMock('react-native', () => ({
      __esModule: true,
      Platform: { OS: 'web' },
    }));

    const types = require('@/native/speech-recognition.types');
    const bridgeModule = require('@/native/speech-recognition.web');
    bundle = {
      bridge: bridgeModule.default,
      SpeechRecognitionNotSupported: types.SpeechRecognitionNotSupported,
      webkitCtor,
    };
  });

  if (!bundle) throw new Error('failed to load web bridge');
  return bundle;
}

afterEach(() => {
  delete (globalThis as any).webkitSpeechRecognition;
});

describe('speech-recognition bridge (Web — webkitSpeechRecognition absent)', () => {
  it('isAvailable() returns false', () => {
    const { bridge } = loadWebBridge({ webkitPresent: false });
    expect(bridge.isAvailable('en-US')).toBe(false);
  });

  it('availableLocales() returns []', () => {
    const { bridge } = loadWebBridge({ webkitPresent: false });
    expect(bridge.availableLocales()).toEqual([]);
  });

  it('requestAuthorization() rejects with SpeechRecognitionNotSupported', async () => {
    const { bridge, SpeechRecognitionNotSupported } = loadWebBridge({ webkitPresent: false });
    await expect(bridge.requestAuthorization()).rejects.toBeInstanceOf(
      SpeechRecognitionNotSupported,
    );
  });

  it('getAuthorizationStatus() rejects with SpeechRecognitionNotSupported', async () => {
    const { bridge, SpeechRecognitionNotSupported } = loadWebBridge({ webkitPresent: false });
    await expect(bridge.getAuthorizationStatus()).rejects.toBeInstanceOf(
      SpeechRecognitionNotSupported,
    );
  });

  it('start() rejects with SpeechRecognitionNotSupported', async () => {
    const { bridge, SpeechRecognitionNotSupported } = loadWebBridge({ webkitPresent: false });
    await expect(bridge.start({ locale: 'en-US', onDevice: false })).rejects.toBeInstanceOf(
      SpeechRecognitionNotSupported,
    );
  });

  it('stop() rejects with SpeechRecognitionNotSupported', async () => {
    const { bridge, SpeechRecognitionNotSupported } = loadWebBridge({ webkitPresent: false });
    await expect(bridge.stop()).rejects.toBeInstanceOf(SpeechRecognitionNotSupported);
  });
});

describe('speech-recognition bridge (Web — webkitSpeechRecognition present)', () => {
  it('isAvailable() returns true', () => {
    const { bridge } = loadWebBridge({ webkitPresent: true });
    expect(bridge.isAvailable('en-US')).toBe(true);
  });

  it('availableLocales() returns a non-empty curated list', () => {
    const { bridge } = loadWebBridge({ webkitPresent: true });
    const locales = bridge.availableLocales();
    expect(Array.isArray(locales)).toBe(true);
    expect(locales.length).toBeGreaterThan(0);
  });

  it('start() constructs the webkit recognizer and calls .start()', async () => {
    const inst = createWebkitInstance();
    const { bridge, webkitCtor } = loadWebBridge({
      webkitPresent: true,
      instances: [inst],
    });
    await bridge.start({ locale: 'en-US', onDevice: true });
    expect(webkitCtor).toHaveBeenCalledTimes(1);
    expect(inst.start).toHaveBeenCalled();
  });

  it('forces onDevice to false on web (server-only fallback)', async () => {
    // The web fallback should not throw even when onDevice:true is requested
    // because per FR-023 the web path is server-only — the bridge should
    // silently coerce. We assert no SpeechRecognitionNotSupported reject.
    const inst = createWebkitInstance();
    const { bridge } = loadWebBridge({ webkitPresent: true, instances: [inst] });
    await expect(bridge.start({ locale: 'en-US', onDevice: true })).resolves.toBeUndefined();
  });

  it('wires onresult → partial event for non-final results', async () => {
    const inst = createWebkitInstance();
    const { bridge } = loadWebBridge({ webkitPresent: true, instances: [inst] });
    const onPartial = jest.fn();
    bridge.events.addListener('partial', onPartial);
    await bridge.start({ locale: 'en-US', onDevice: false });

    // Synthesize a webkit non-final result event.
    const fakeResultEvent = {
      results: [
        Object.assign([{ transcript: 'hello world', confidence: 0.9 }], { isFinal: false }),
      ],
      resultIndex: 0,
    };
    inst.onresult?.(fakeResultEvent);

    expect(onPartial).toHaveBeenCalledTimes(1);
    expect(onPartial.mock.calls[0][0]).toMatchObject({
      transcript: expect.stringMatching(/hello world/),
    });
  });

  it('wires onresult → final event for final results', async () => {
    const inst = createWebkitInstance();
    const { bridge } = loadWebBridge({ webkitPresent: true, instances: [inst] });
    const onFinal = jest.fn();
    bridge.events.addListener('final', onFinal);
    await bridge.start({ locale: 'en-US', onDevice: false });

    const fakeResultEvent = {
      results: [
        Object.assign([{ transcript: 'final transcript', confidence: 0.95 }], { isFinal: true }),
      ],
      resultIndex: 0,
    };
    inst.onresult?.(fakeResultEvent);

    expect(onFinal).toHaveBeenCalledTimes(1);
    expect(onFinal.mock.calls[0][0]).toMatchObject({
      transcript: expect.stringMatching(/final transcript/),
      isFinal: true,
    });
  });

  it('wires onerror → error event', async () => {
    const inst = createWebkitInstance();
    const { bridge } = loadWebBridge({ webkitPresent: true, instances: [inst] });
    const onError = jest.fn();
    bridge.events.addListener('error', onError);
    await bridge.start({ locale: 'en-US', onDevice: false });

    inst.onerror?.({ error: 'no-speech', message: 'no speech detected' });

    expect(onError).toHaveBeenCalledTimes(1);
    const arg = onError.mock.calls[0][0];
    expect(arg).toHaveProperty('kind');
    expect(arg).toHaveProperty('message');
  });

  it('stop() calls the webkit recognizer .stop()', async () => {
    const inst = createWebkitInstance();
    const { bridge } = loadWebBridge({ webkitPresent: true, instances: [inst] });
    await bridge.start({ locale: 'en-US', onDevice: false });
    await bridge.stop();
    expect(inst.stop).toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // T060 (US5): explicit onDevice coercion + onerror kind mapping
  // -------------------------------------------------------------------------

  it('start({ onDevice: true }) does not propagate onDevice to webkit (recognizer has no such field)', async () => {
    const inst = createWebkitInstance();
    const { bridge } = loadWebBridge({ webkitPresent: true, instances: [inst] });
    await bridge.start({ locale: 'en-US', onDevice: true });
    // The bridge must not crash and must have configured the recognizer with
    // the standard webkit fields (no on-device flag exists on web).
    expect(inst.start).toHaveBeenCalled();
    expect(inst.continuous).toBe(true);
    expect(inst.interimResults).toBe(true);
    expect(inst.lang).toBe('en-US');
  });

  it.each([
    ['no-speech', 'audioEngine'],
    ['audio-capture', 'audioEngine'],
    ['not-allowed', 'authorization'],
    ['network', 'network'],
    ['mystery-code', 'unknown'],
  ] as const)('maps webkit error "%s" to SpeechErrorKind "%s"', async (code, expected) => {
    const inst = createWebkitInstance();
    const { bridge } = loadWebBridge({ webkitPresent: true, instances: [inst] });
    const onError = jest.fn();
    bridge.events.addListener('error', onError);
    await bridge.start({ locale: 'en-US', onDevice: false });
    inst.onerror?.({ error: code, message: 'm' });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0].kind).toBe(expected);
  });
});
