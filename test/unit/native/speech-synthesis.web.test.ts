/**
 * T012 (Web): JS bridge contract test for feature 019.
 *
 * Tests both PRESENT and ABSENT branches of `globalThis.speechSynthesis`.
 */

interface FakeUtterance {
  voice: unknown;
  rate: number;
  pitch: number;
  volume: number;
  text: string;
  _handlers: Record<string, (ev: any) => void>;
  addEventListener: (name: string, handler: (ev: any) => void) => void;
}

function setupGlobals(present: boolean): {
  synth: {
    speak: jest.Mock;
    pause: jest.Mock;
    resume: jest.Mock;
    cancel: jest.Mock;
    getVoices: jest.Mock;
    addEventListener: jest.Mock;
    speaking: boolean;
    paused: boolean;
    pending: boolean;
  } | null;
  lastUtterance: { ref: FakeUtterance | null };
} {
  const g = globalThis as unknown as {
    speechSynthesis?: unknown;
    SpeechSynthesisUtterance?: unknown;
  };
  if (!present) {
    delete g.speechSynthesis;
    delete g.SpeechSynthesisUtterance;
    return { synth: null, lastUtterance: { ref: null } };
  }

  const synth = {
    speaking: false,
    paused: false,
    pending: false,
    speak: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    cancel: jest.fn(),
    getVoices: jest.fn(() => [{ voiceURI: 'web-1', name: 'Web Voice', lang: 'en-US' }]),
    addEventListener: jest.fn(),
  };
  const lastUtterance: { ref: FakeUtterance | null } = { ref: null };

  function FakeCtor(this: FakeUtterance, text: string) {
    this.text = text;
    this.voice = null;
    this.rate = 1;
    this.pitch = 1;
    this.volume = 1;
    this._handlers = {};
    this.addEventListener = (name: string, handler: (ev: any) => void) => {
      this._handlers[name] = handler;
    };
    lastUtterance.ref = this;
  }

  g.speechSynthesis = synth;
  g.SpeechSynthesisUtterance = FakeCtor as unknown as new (text: string) => FakeUtterance;
  return { synth, lastUtterance };
}

function loadWebBridge() {
  let bundle: { bridge: typeof import('@/native/speech-synthesis.web').default } | undefined;
  jest.isolateModules(() => {
    const m = require('@/native/speech-synthesis.web');
    bundle = { bridge: m.default };
  });
  if (!bundle) throw new Error('failed to load web bridge');
  return bundle.bridge;
}

describe('speech-synthesis bridge (Web)', () => {
  afterEach(() => {
    const g = globalThis as unknown as {
      speechSynthesis?: unknown;
      SpeechSynthesisUtterance?: unknown;
    };
    delete g.speechSynthesis;
    delete g.SpeechSynthesisUtterance;
  });

  describe('PRESENT', () => {
    it('availableVoices reads getVoices and maps to Voice shape', async () => {
      setupGlobals(true);
      const bridge = loadWebBridge();
      const list = await bridge.availableVoices();
      expect(list).toEqual([
        {
          id: 'web-1',
          name: 'Web Voice',
          language: 'en-US',
          quality: 'Default',
          isPersonalVoice: false,
        },
      ]);
    });

    it('speak constructs utterance, sets mapped properties, and proxies', async () => {
      const { synth, lastUtterance } = setupGlobals(true);
      const bridge = loadWebBridge();
      await bridge.speak({ text: 'hi', voiceId: 'web-1', rate: 0.5, pitch: 1.0, volume: 0.7 });
      expect(synth!.speak).toHaveBeenCalledTimes(1);
      const utt = lastUtterance.ref!;
      expect(utt.text).toBe('hi');
      expect(utt.rate).toBe(1.0);
      expect(utt.pitch).toBe(1.0);
      expect(utt.volume).toBe(0.7);
      expect(utt.voice).toBeTruthy();
    });

    it('event wiring proxies start/end/pause/resume/error/boundary', async () => {
      const { lastUtterance } = setupGlobals(true);
      const bridge = loadWebBridge();
      const seen: string[] = [];
      bridge.events.addListener('didStart', () => seen.push('start'));
      bridge.events.addListener('didFinish', () => seen.push('finish'));
      bridge.events.addListener('didPause', () => seen.push('pause'));
      bridge.events.addListener('didContinue', () => seen.push('cont'));
      bridge.events.addListener('didCancel', () => seen.push('cancel'));
      bridge.events.addListener('willSpeakWord', () => seen.push('word'));

      await bridge.speak({ text: 'hi', rate: 0.5, pitch: 1.0, volume: 0.7 });
      const utt = lastUtterance.ref!;
      utt._handlers.start?.({});
      utt._handlers.boundary?.({ charIndex: 0, charLength: 2, name: 'word' });
      utt._handlers.pause?.({});
      utt._handlers.resume?.({});
      utt._handlers.end?.({});
      utt._handlers.error?.({});
      expect(seen).toEqual(['start', 'word', 'pause', 'cont', 'finish', 'cancel']);
    });

    it('pause / continue / stop proxy to speechSynthesis', async () => {
      const { synth } = setupGlobals(true);
      const bridge = loadWebBridge();
      await bridge.pause();
      await bridge.continue();
      await bridge.stop();
      expect(synth!.pause).toHaveBeenCalled();
      expect(synth!.resume).toHaveBeenCalled();
      expect(synth!.cancel).toHaveBeenCalled();
    });

    it('requestPersonalVoiceAuthorization resolves "unsupported"', async () => {
      setupGlobals(true);
      const bridge = loadWebBridge();
      expect(await bridge.requestPersonalVoiceAuthorization()).toBe('unsupported');
    });
  });

  describe('ABSENT', () => {
    it('availableVoices returns []', async () => {
      setupGlobals(false);
      const bridge = loadWebBridge();
      expect(await bridge.availableVoices()).toEqual([]);
    });

    it('speak rejects with SpeechSynthesisNotSupported', async () => {
      setupGlobals(false);
      const bridge = loadWebBridge();
      await expect(
        bridge.speak({ text: 'hi', rate: 0.5, pitch: 1, volume: 0.7 }),
      ).rejects.toMatchObject({ kind: 'NotSupported' });
    });

    it('stop resolves quietly', async () => {
      setupGlobals(false);
      const bridge = loadWebBridge();
      await expect(bridge.stop()).resolves.toBeUndefined();
    });
  });
});
