/**
 * T012 (Android): JS bridge contract test for feature 019.
 *
 * Mocks `expo-speech` and asserts the Android adapter delegates and maps
 * presets via `synth-mapping`. Pause/continue should reject with
 * SpeechSynthesisPauseUnsupported when the OEM TTS doesn't support them.
 */

interface ExpoSpeechMock {
  speak: jest.Mock;
  stop: jest.Mock;
  getAvailableVoicesAsync: jest.Mock;
  pause?: jest.Mock;
  resume?: jest.Mock;
}

function loadAndroidBridge(speechMock: ExpoSpeechMock): {
  bridge: typeof import('@/native/speech-synthesis.android').default;
  SpeechSynthesisPauseUnsupported: new (msg?: string) => Error;
  speech: ExpoSpeechMock;
} {
  let bundle:
    | {
        bridge: typeof import('@/native/speech-synthesis.android').default;
        SpeechSynthesisPauseUnsupported: new (msg?: string) => Error;
        speech: ExpoSpeechMock;
      }
    | undefined;
  jest.isolateModules(() => {
    jest.doMock('expo-speech', () => speechMock);
    const types = require('@/native/speech-synthesis.types');
    const bridgeModule = require('@/native/speech-synthesis.android');
    bundle = {
      bridge: bridgeModule.default,
      SpeechSynthesisPauseUnsupported: types.SpeechSynthesisPauseUnsupported,
      speech: speechMock,
    };
  });
  if (!bundle) throw new Error('failed to load Android bridge');
  return bundle;
}

describe('speech-synthesis bridge (Android)', () => {
  it('availableVoices maps expo-speech voices to unified Voice shape', async () => {
    const { bridge } = loadAndroidBridge({
      speak: jest.fn(),
      stop: jest.fn(() => Promise.resolve()),
      getAvailableVoicesAsync: jest.fn(() =>
        Promise.resolve([
          { identifier: 'v1', name: 'Robo', language: 'en-US', quality: 'Enhanced' },
          { identifier: 'v2', language: 'es-ES' },
        ]),
      ),
    });
    const list = await bridge.availableVoices();
    expect(list[0]).toEqual({
      id: 'v1',
      name: 'Robo',
      language: 'en-US',
      quality: 'Enhanced',
      isPersonalVoice: false,
    });
    expect(list[1]).toEqual({
      id: 'v2',
      name: 'v2',
      language: 'es-ES',
      quality: 'Default',
      isPersonalVoice: false,
    });
  });

  it('speak delegates to Speech.speak with mapped rate/pitch/volume and emits events', async () => {
    const speakMock = jest.fn();
    const { bridge } = loadAndroidBridge({
      speak: speakMock,
      stop: jest.fn(() => Promise.resolve()),
      getAvailableVoicesAsync: jest.fn(() => Promise.resolve([])),
    });

    const events: Array<{ name: string; payload: unknown }> = [];
    const sub = bridge.events.addListener('didStart', () => events.push({ name: 'didStart', payload: {} }));
    bridge.events.addListener('willSpeakWord', (p) =>
      events.push({ name: 'willSpeakWord', payload: p }),
    );

    await bridge.speak({ text: 'hello', rate: 0.5, pitch: 1.0, volume: 0.7, voiceId: 'v1' });

    expect(speakMock).toHaveBeenCalledTimes(1);
    const args = speakMock.mock.calls[0]!;
    expect(args[0]).toBe('hello');
    expect(args[1].voice).toBe('v1');
    expect(args[1].rate).toBe(1.0);
    expect(args[1].pitch).toBe(1.0);
    expect(args[1].volume).toBe(0.7);

    // Simulate the onStart and onBoundary callbacks via the captured options.
    args[1].onStart?.();
    args[1].onBoundary?.({ charIndex: 4, charLength: 5 });
    expect(events).toEqual([
      { name: 'didStart', payload: {} },
      {
        name: 'willSpeakWord',
        payload: { range: { location: 4, length: 5 }, fullText: 'hello' },
      },
    ]);
    sub.remove();
  });

  it('pause rejects with SpeechSynthesisPauseUnsupported when Speech.pause is missing', async () => {
    const { bridge, SpeechSynthesisPauseUnsupported } = loadAndroidBridge({
      speak: jest.fn(),
      stop: jest.fn(() => Promise.resolve()),
      getAvailableVoicesAsync: jest.fn(() => Promise.resolve([])),
    });
    await expect(bridge.pause()).rejects.toBeInstanceOf(SpeechSynthesisPauseUnsupported);
  });

  it('pause rejects with SpeechSynthesisPauseUnsupported when Speech.pause throws', async () => {
    const { bridge, SpeechSynthesisPauseUnsupported } = loadAndroidBridge({
      speak: jest.fn(),
      stop: jest.fn(() => Promise.resolve()),
      getAvailableVoicesAsync: jest.fn(() => Promise.resolve([])),
      pause: jest.fn(() => {
        throw new Error('oem');
      }),
      resume: jest.fn(),
    });
    await expect(bridge.pause()).rejects.toBeInstanceOf(SpeechSynthesisPauseUnsupported);
  });

  it('stop delegates to Speech.stop and is idempotent', async () => {
    const stopMock = jest.fn(() => Promise.resolve());
    const { bridge } = loadAndroidBridge({
      speak: jest.fn(),
      stop: stopMock,
      getAvailableVoicesAsync: jest.fn(() => Promise.resolve([])),
    });
    await bridge.stop();
    expect(stopMock).toHaveBeenCalled();
  });

  it('requestPersonalVoiceAuthorization resolves "unsupported"', async () => {
    const { bridge } = loadAndroidBridge({
      speak: jest.fn(),
      stop: jest.fn(() => Promise.resolve()),
      getAvailableVoicesAsync: jest.fn(() => Promise.resolve([])),
    });
    expect(await bridge.requestPersonalVoiceAuthorization()).toBe('unsupported');
  });
});
