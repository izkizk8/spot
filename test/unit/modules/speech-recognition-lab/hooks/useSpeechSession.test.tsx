/**
 * T033: useSpeechSession hook test (US1).
 *
 * Coverage with a mocked EventEmitter bridge:
 *   - start({ locale, onDevice }) calls bridge.start(...) once and subscribes
 *     to partial/final/error events; isListening flips to true
 *   - partial event updates `partial`; final event appends to `final` and
 *     resets `partial` to ''
 *   - stop() calls bridge.stop() once and unsubscribes; isListening flips false
 *   - error event sets `error` and clears isListening; next start clears error
 *   - Unmount during active session calls bridge.stop() and unsubscribes
 *   - Re-start after terminal error works
 *   - Words from events propagate to partial/final carriers
 */

import React from 'react';
import { Text } from 'react-native';
import { act, render } from '@testing-library/react-native';

import { useSpeechSession } from '@/modules/speech-recognition-lab/hooks/useSpeechSession';
import type { SpeechBridge } from '@/native/speech-recognition.types';

interface ListenerEntry {
  event: 'partial' | 'final' | 'error';
  fn: (payload: any) => void;
  removed: boolean;
}

function createMockBridge() {
  const listeners: ListenerEntry[] = [];
  const events = {
    addListener: jest.fn((event: 'partial' | 'final' | 'error', fn: (p: any) => void) => {
      const entry: ListenerEntry = { event, fn, removed: false };
      listeners.push(entry);
      return {
        remove: jest.fn(() => {
          entry.removed = true;
        }),
      };
    }),
    removeAllListeners: jest.fn(() => {
      for (const e of listeners) e.removed = true;
    }),
  };
  const bridge: SpeechBridge = {
    isAvailable: jest.fn(() => true),
    availableLocales: jest.fn(() => ['en-US']),
    requestAuthorization: jest.fn(),
    getAuthorizationStatus: jest.fn(),
    start: jest.fn(() => Promise.resolve()),
    stop: jest.fn(() => Promise.resolve()),
    events: events as unknown as SpeechBridge['events'],
  };
  function emit(event: 'partial' | 'final' | 'error', payload: any) {
    for (const e of listeners) {
      if (e.event === event && !e.removed) e.fn(payload);
    }
  }
  function activeCount() {
    return listeners.filter((e) => !e.removed).length;
  }
  return { bridge, emit, listeners, activeCount, events };
}

interface ProbeRef {
  state: ReturnType<typeof useSpeechSession>;
}

function Probe({ bridge, refOut }: { bridge: SpeechBridge; refOut: ProbeRef }) {
  const state = useSpeechSession({ bridgeOverride: bridge });
  // eslint-disable-next-line react-hooks/immutability
  refOut.state = state;
  return <Text>{`L=${String(state.isListening)}`}</Text>;
}

describe('useSpeechSession', () => {
  it('start() calls bridge.start once, subscribes to events, isListening=true', async () => {
    const { bridge, activeCount } = createMockBridge();
    const ref: ProbeRef = { state: undefined as any };
    render(<Probe bridge={bridge} refOut={ref} />);

    await act(async () => {
      await ref.state.start({ locale: 'en-US', onDevice: false });
    });

    expect(bridge.start).toHaveBeenCalledTimes(1);
    expect(bridge.start).toHaveBeenCalledWith({ locale: 'en-US', onDevice: false });
    expect(activeCount()).toBeGreaterThanOrEqual(3);
    expect(ref.state.isListening).toBe(true);
  });

  it('partial event updates `partial` state with transcript', async () => {
    const { bridge, emit } = createMockBridge();
    const ref: ProbeRef = { state: undefined as any };
    render(<Probe bridge={bridge} refOut={ref} />);
    await act(async () => {
      await ref.state.start({ locale: 'en-US', onDevice: false });
    });
    await act(async () => {
      emit('partial', { transcript: 'hello' });
    });
    expect(ref.state.partial).toBe('hello');
  });

  it('final event appends transcript to `final` and resets partial to empty', async () => {
    const { bridge, emit } = createMockBridge();
    const ref: ProbeRef = { state: undefined as any };
    render(<Probe bridge={bridge} refOut={ref} />);
    await act(async () => {
      await ref.state.start({ locale: 'en-US', onDevice: false });
    });
    await act(async () => {
      emit('partial', { transcript: 'hello world' });
    });
    await act(async () => {
      emit('final', { transcript: 'hello world', isFinal: true });
    });
    expect(ref.state.final).toContain('hello world');
    expect(ref.state.partial).toBe('');
  });

  it('stop() calls bridge.stop once, unsubscribes, isListening=false', async () => {
    const { bridge, activeCount } = createMockBridge();
    const ref: ProbeRef = { state: undefined as any };
    render(<Probe bridge={bridge} refOut={ref} />);
    await act(async () => {
      await ref.state.start({ locale: 'en-US', onDevice: false });
    });
    await act(async () => {
      await ref.state.stop();
    });
    expect(bridge.stop).toHaveBeenCalledTimes(1);
    expect(activeCount()).toBe(0);
    expect(ref.state.isListening).toBe(false);
  });

  it('error event sets error and clears isListening; next start clears error', async () => {
    const { bridge, emit } = createMockBridge();
    const ref: ProbeRef = { state: undefined as any };
    render(<Probe bridge={bridge} refOut={ref} />);
    await act(async () => {
      await ref.state.start({ locale: 'en-US', onDevice: false });
    });
    await act(async () => {
      emit('error', { kind: 'audioEngine', message: 'boom' });
    });
    expect(ref.state.error).toBeTruthy();
    expect(ref.state.error?.message).toBe('boom');
    expect(ref.state.isListening).toBe(false);

    await act(async () => {
      await ref.state.start({ locale: 'en-US', onDevice: false });
    });
    expect(ref.state.error).toBeNull();
    expect(ref.state.isListening).toBe(true);
  });

  it('unmount during active session calls bridge.stop and unsubscribes', async () => {
    const { bridge, activeCount } = createMockBridge();
    const ref: ProbeRef = { state: undefined as any };
    const view = render(<Probe bridge={bridge} refOut={ref} />);
    await act(async () => {
      await ref.state.start({ locale: 'en-US', onDevice: false });
    });
    const warnSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await act(async () => {
      view.unmount();
    });
    expect(bridge.stop).toHaveBeenCalled();
    expect(activeCount()).toBe(0);
    expect(warnSpy).not.toHaveBeenCalledWith(
      expect.stringMatching(/state update on an unmounted component/i),
    );
    warnSpy.mockRestore();
  });

  it('words from partial events propagate to partialWords state carrier', async () => {
    const { bridge, emit } = createMockBridge();
    const ref: ProbeRef = { state: undefined as any };
    render(<Probe bridge={bridge} refOut={ref} />);
    await act(async () => {
      await ref.state.start({ locale: 'en-US', onDevice: false });
    });
    const words = [{ word: 'hello', confidence: 0.9 }];
    await act(async () => {
      emit('partial', { transcript: 'hello', words });
    });
    expect(ref.state.partialWords).toEqual(words);
  });

  it('words from final events propagate to finalWords state carrier', async () => {
    const { bridge, emit } = createMockBridge();
    const ref: ProbeRef = { state: undefined as any };
    render(<Probe bridge={bridge} refOut={ref} />);
    await act(async () => {
      await ref.state.start({ locale: 'en-US', onDevice: false });
    });
    const words = [{ word: 'done', confidence: 0.99 }];
    await act(async () => {
      emit('final', { transcript: 'done', words, isFinal: true });
    });
    expect(ref.state.finalWords).toEqual(expect.arrayContaining(words));
  });
});
