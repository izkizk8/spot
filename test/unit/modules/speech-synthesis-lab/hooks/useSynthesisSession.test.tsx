/**
 * T026 + T049 + T056: useSynthesisSession hook tests.
 */

import React from 'react';
import { Text } from 'react-native';
import { act, render } from '@testing-library/react-native';

import { useSynthesisSession } from '@/modules/speech-synthesis-lab/hooks/useSynthesisSession';
import type {
  SpeechBridgeSubscription,
  SpeechSynthesisBridge,
  SynthEventName,
  SynthEventPayloads,
} from '@/native/speech-synthesis.types';
import { SpeechSynthesisPauseUnsupported } from '@/native/speech-synthesis.types';

interface ListenerEntry {
  event: SynthEventName;
  fn: (payload: any) => void;
  removed: boolean;
}

function createMockBridge(opts: { pauseSupported?: boolean } = {}) {
  const listeners: ListenerEntry[] = [];
  const events = {
    addListener: jest.fn(
      <E extends SynthEventName>(event: E, fn: (p: SynthEventPayloads[E]) => void) => {
        const entry: ListenerEntry = { event, fn: fn as any, removed: false };
        listeners.push(entry);
        const sub: SpeechBridgeSubscription = {
          remove: jest.fn(() => {
            entry.removed = true;
          }),
        };
        return sub;
      },
    ),
    removeAllListeners: jest.fn(() => {
      for (const e of listeners) e.removed = true;
    }),
  };

  const pauseSupported = opts.pauseSupported ?? true;

  const bridge: SpeechSynthesisBridge = {
    availableVoices: jest.fn(() =>
      Promise.resolve([
        { id: 'v1', name: 'Alex', language: 'en-US', quality: 'Default', isPersonalVoice: false },
      ]),
    ),
    speak: jest.fn(() => Promise.resolve()),
    pause: jest.fn(() =>
      pauseSupported ? Promise.resolve() : Promise.reject(new SpeechSynthesisPauseUnsupported()),
    ),
    continue: jest.fn(() =>
      pauseSupported ? Promise.resolve() : Promise.reject(new SpeechSynthesisPauseUnsupported()),
    ),
    stop: jest.fn(() => Promise.resolve()),
    isSpeaking: jest.fn(() => false),
    requestPersonalVoiceAuthorization: jest.fn(() => Promise.resolve('unsupported')),
    events: events as unknown as SpeechSynthesisBridge['events'],
  };

  function emit<E extends SynthEventName>(event: E, payload: SynthEventPayloads[E]) {
    for (const e of listeners) {
      if (e.event === event && !e.removed) e.fn(payload);
    }
  }
  function activeCount() {
    return listeners.filter((e) => !e.removed).length;
  }
  return { bridge, emit, listeners, activeCount };
}

interface ProbeRef {
  state: ReturnType<typeof useSynthesisSession>;
}

function Probe({
  bridge,
  onState,
}: {
  bridge: SpeechSynthesisBridge;
  onState: (s: ReturnType<typeof useSynthesisSession>) => void;
}) {
  const state = useSynthesisSession({ bridgeOverride: bridge });
  onState(state);
  return <Text>{`S=${state.status}`}</Text>;
}

function makeRef(): ProbeRef {
  const ref = { state: undefined as unknown as ProbeRef['state'] };
  return ref;
}

function captureProbe(ref: ProbeRef) {
  return (s: ProbeRef['state']) => {
    Object.defineProperty(ref, 'state', { value: s, writable: true, configurable: true });
  };
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('useSynthesisSession', () => {
  it('on mount, calls availableVoices once and exposes voices', async () => {
    const { bridge } = createMockBridge();
    const ref = makeRef();
    render(<Probe bridge={bridge} onState={captureProbe(ref)} />);
    await flush();
    expect(bridge.availableVoices).toHaveBeenCalledTimes(1);
    expect(ref.state.voices.length).toBe(1);
  });

  it('on mount, probes pause support — sets pauseSupported=false when PauseUnsupported', async () => {
    const { bridge } = createMockBridge({ pauseSupported: false });
    const ref = makeRef();
    render(<Probe bridge={bridge} onState={captureProbe(ref)} />);
    await flush();
    expect(ref.state.pauseSupported).toBe(false);
  });

  it('speak() subscribes; didStart flips status to speaking', async () => {
    const { bridge, emit } = createMockBridge();
    const ref = makeRef();
    render(<Probe bridge={bridge} onState={captureProbe(ref)} />);
    await flush();
    await act(async () => {
      await ref.state.speak({ text: 'hi', rate: 0.5, pitch: 1, volume: 0.7 });
    });
    expect(bridge.speak).toHaveBeenCalledTimes(1);
    await act(async () => {
      emit('didStart', {});
    });
    expect(ref.state.status).toBe('speaking');
  });

  it('didPause / didContinue / didCancel transitions', async () => {
    const { bridge, emit } = createMockBridge();
    const ref = makeRef();
    render(<Probe bridge={bridge} onState={captureProbe(ref)} />);
    await flush();
    await act(async () => {
      await ref.state.speak({ text: 'hi', rate: 0.5, pitch: 1, volume: 0.7 });
    });
    await act(async () => {
      emit('didStart', {});
      emit('didPause', {});
    });
    expect(ref.state.status).toBe('paused');
    await act(async () => {
      emit('didContinue', {});
    });
    expect(ref.state.status).toBe('speaking');
    await act(async () => {
      emit('didCancel', {});
    });
    expect(ref.state.status).toBe('idle');
    expect(ref.state.currentWordRange).toBeNull();
  });

  it('didFinish resets to idle and clears currentWordRange', async () => {
    const { bridge, emit } = createMockBridge();
    const ref = makeRef();
    render(<Probe bridge={bridge} onState={captureProbe(ref)} />);
    await flush();
    await act(async () => {
      await ref.state.speak({ text: 'hello world', rate: 0.5, pitch: 1, volume: 0.7 });
    });
    await act(async () => {
      emit('didStart', {});
      emit('willSpeakWord', { range: { location: 0, length: 5 }, fullText: 'hello world' });
    });
    expect(ref.state.currentWordRange).toEqual({ location: 0, length: 5 });
    await act(async () => {
      emit('didFinish', {});
    });
    expect(ref.state.status).toBe('idle');
    expect(ref.state.currentWordRange).toBeNull();
  });

  it('selectVoice persists across speak cycles and is injected into bridge.speak', async () => {
    const { bridge, emit } = createMockBridge();
    const ref = makeRef();
    render(<Probe bridge={bridge} onState={captureProbe(ref)} />);
    await flush();
    act(() => ref.state.selectVoice('v1'));
    await act(async () => {
      await ref.state.speak({ text: 'hi', rate: 0.5, pitch: 1, volume: 0.7 });
    });
    const callArgs = (bridge.speak as jest.Mock).mock.calls[0]![0];
    expect(callArgs).toMatchObject({ voiceId: 'v1' });
    await act(async () => {
      emit('didStart', {});
      emit('didFinish', {});
    });
    expect(ref.state.selectedVoiceId).toBe('v1');
  });

  it('unmount during active session calls bridge.stop and unsubscribes; no warnings', async () => {
    const { bridge, emit, activeCount } = createMockBridge();
    const ref = makeRef();
    const view = render(<Probe bridge={bridge} onState={captureProbe(ref)} />);
    await flush();
    await act(async () => {
      await ref.state.speak({ text: 'hi', rate: 0.5, pitch: 1, volume: 0.7 });
      emit('didStart', {});
    });
    const stopCallsBefore = (bridge.stop as jest.Mock).mock.calls.length;
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await act(async () => {
      view.unmount();
    });
    expect((bridge.stop as jest.Mock).mock.calls.length).toBeGreaterThan(stopCallsBefore);
    expect(activeCount()).toBe(0);
    expect(errSpy).not.toHaveBeenCalledWith(
      expect.stringMatching(/state update on an unmounted component/i),
    );
    errSpy.mockRestore();
  });

  it('willSpeakWord updates currentWordRange', async () => {
    const { bridge, emit } = createMockBridge();
    const ref = makeRef();
    render(<Probe bridge={bridge} onState={captureProbe(ref)} />);
    await flush();
    await act(async () => {
      await ref.state.speak({ text: 'hello', rate: 0.5, pitch: 1, volume: 0.7 });
      emit('didStart', {});
      emit('willSpeakWord', { range: { location: 4, length: 5 }, fullText: 'hello' });
    });
    expect(ref.state.currentWordRange).toEqual({ location: 4, length: 5 });
  });

  it('requestPersonalVoice calls bridge and updates personalVoiceStatus', async () => {
    const { bridge } = createMockBridge();
    (bridge.requestPersonalVoiceAuthorization as jest.Mock).mockResolvedValue('authorized');
    const ref = makeRef();
    render(<Probe bridge={bridge} onState={captureProbe(ref)} />);
    await flush();
    await act(async () => {
      await ref.state.requestPersonalVoice();
    });
    expect(ref.state.personalVoiceStatus).toBe('authorized');
  });
});
