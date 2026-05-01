/**
 * T027 [US1]: useAudioRecorder hook tests.
 *
 * Drives the recorder state machine using the controllable `expo-audio` mock
 * at `test/__mocks__/expo-audio.ts`. Verifies the contract from
 * `data-model.md` §10 and `contracts/audio-bridge.contract.ts`.
 */

import React from 'react';
import { Text } from 'react-native';
import { act, render } from '@testing-library/react-native';

import {
  AudioPermissionDenied,
  AudioRecorderUnavailable,
  type Recording,
} from '@/modules/audio-lab/audio-types';
import { useAudioRecorder } from '@/modules/audio-lab/hooks/useAudioRecorder';

jest.mock('expo-audio');

const mockExpoAudio = jest.requireMock(
  'expo-audio',
) as typeof import('../../../../__mocks__/expo-audio');

// Stub the recordings-store so the hook never touches AsyncStorage / FS.
const savedRecordings: Recording[] = [];
jest.mock('@/modules/audio-lab/recordings-store', () => ({
  __esModule: true,
  STORAGE_KEY: 'spot.audio.recordings',
  loadRecordings: jest.fn(async () => []),
  saveRecording: jest.fn(async (r: Recording) => {
    savedRecordings.push(r);
    return savedRecordings;
  }),
  deleteRecording: jest.fn(async () => []),
  clearRecordings: jest.fn(async () => undefined),
}));

interface ProbeRef {
  state: ReturnType<typeof useAudioRecorder>;
}

function Probe({ onState }: { onState: (s: ReturnType<typeof useAudioRecorder>) => void }) {
  const state = useAudioRecorder({ nowOverride: () => Date.now(), idOverride: () => 'fixed-id' });
  onState(state);
  return <Text>{`S=${state.status}`}</Text>;
}

function makeRef(): ProbeRef {
  return { state: undefined as unknown as ProbeRef['state'] };
}

function captureProbe(ref: ProbeRef) {
  return (s: ProbeRef['state']) => {
    ref.state = s;
  };
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('useAudioRecorder', () => {
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockExpoAudio.__reset();
    savedRecordings.length = 0;
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
    jest.useRealTimers();
  });

  it('initial state', async () => {
    const ref = makeRef();
    render(<Probe onState={captureProbe(ref)} />);
    await flush();
    expect(ref.state.status).toBe('idle');
    expect(ref.state.elapsedMs).toBe(0);
    expect(ref.state.meterLevel).toBe(0);
    expect(ref.state.quality).toBe('Medium');
    expect(ref.state.hasPermission).toBe('undetermined');
  });

  it('start() transitions idle → requesting-permission → recording when granted', async () => {
    mockExpoAudio.__setPermission('granted');
    const ref = makeRef();
    render(<Probe onState={captureProbe(ref)} />);
    await flush();
    await act(async () => {
      await ref.state.start();
    });
    expect(ref.state.status).toBe('recording');
    expect(ref.state.hasPermission).toBe('granted');
    expect(mockExpoAudio.requestRecordingPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(mockExpoAudio.__getActiveRecorder()).not.toBeNull();
  });

  it('start() rejects with AudioPermissionDenied on denial; returns to idle', async () => {
    mockExpoAudio.__setPermission('denied');
    const ref = makeRef();
    render(<Probe onState={captureProbe(ref)} />);
    await flush();
    let caught: unknown = null;
    await act(async () => {
      try {
        await ref.state.start();
      } catch (e) {
        caught = e;
      }
    });
    expect(caught).toBeInstanceOf(AudioPermissionDenied);
    expect(caught).toBeInstanceOf(Error);
    expect(ref.state.status).toBe('idle');
    expect(ref.state.hasPermission).toBe('denied');
  });

  it('start() rejects with AudioRecorderUnavailable when the recorder throws', async () => {
    mockExpoAudio.__setPermission('granted');
    mockExpoAudio.__setConstructRecorderThrows(true);
    const ref = makeRef();
    render(<Probe onState={captureProbe(ref)} />);
    await flush();
    let caught: unknown = null;
    await act(async () => {
      try {
        await ref.state.start();
      } catch (e) {
        caught = e;
      }
    });
    expect(caught).toBeInstanceOf(AudioRecorderUnavailable);
    expect(caught).toBeInstanceOf(Error);
    expect(ref.state.status).toBe('idle');
  });

  it('setQuality updates while idle but is a no-op while recording (FR-008)', async () => {
    mockExpoAudio.__setPermission('granted');
    const ref = makeRef();
    render(<Probe onState={captureProbe(ref)} />);
    await flush();
    act(() => ref.state.setQuality('High'));
    expect(ref.state.quality).toBe('High');
    await act(async () => {
      await ref.state.start();
    });
    act(() => ref.state.setQuality('Low'));
    expect(ref.state.quality).toBe('High');
  });

  it('elapsedMs increments at >= 1 Hz (advance fake timers)', async () => {
    jest.useFakeTimers();
    mockExpoAudio.__setPermission('granted');
    const ref = makeRef();
    render(<Probe onState={captureProbe(ref)} />);
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      await ref.state.start();
    });
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    // 4 ticks at 250ms = 1000ms elapsed
    expect(ref.state.elapsedMs).toBeGreaterThanOrEqual(750);
  });

  it('meterLevel reflects injected metering frames (~10 Hz push)', async () => {
    mockExpoAudio.__setPermission('granted');
    const ref = makeRef();
    render(<Probe onState={captureProbe(ref)} />);
    await flush();
    await act(async () => {
      await ref.state.start();
    });
    act(() => mockExpoAudio.__emitMeter(0.42));
    expect(ref.state.meterLevel).toBeCloseTo(0.42);
    act(() => mockExpoAudio.__emitMeter(0.8));
    expect(ref.state.meterLevel).toBeCloseTo(0.8);
  });

  it('stop() transitions recording → stopping → idle and resolves with a Recording', async () => {
    mockExpoAudio.__setPermission('granted');
    mockExpoAudio.__setRecordedFile('file:///mock/recordings/r.m4a', 9999);
    const ref = makeRef();
    render(<Probe onState={captureProbe(ref)} />);
    await flush();
    await act(async () => {
      await ref.state.start();
    });
    let result: Recording | null = null;
    await act(async () => {
      result = await ref.state.stop();
    });
    expect(result).not.toBeNull();
    const r = result as unknown as Recording;
    expect(r.uri).toBe('file:///mock/recordings/r.m4a');
    expect(r.sizeBytes).toBe(9999);
    expect(r.quality).toBe('Medium');
    expect(typeof r.id).toBe('string');
    expect(r.durationMs).toBeGreaterThanOrEqual(0);
    expect(typeof r.createdAt).toBe('string');
    expect(ref.state.status).toBe('idle');
    // saveRecording was called.
    const store = jest.requireMock('@/modules/audio-lab/recordings-store') as {
      saveRecording: jest.Mock;
    };
    expect(store.saveRecording).toHaveBeenCalledTimes(1);
  });

  it('stop() called twice is idempotent (returns same Recording)', async () => {
    mockExpoAudio.__setPermission('granted');
    const ref = makeRef();
    render(<Probe onState={captureProbe(ref)} />);
    await flush();
    await act(async () => {
      await ref.state.start();
    });
    let first: Recording | null = null;
    let second: Recording | null = null;
    await act(async () => {
      first = await ref.state.stop();
    });
    await act(async () => {
      second = await ref.state.stop();
    });
    expect(first).not.toBeNull();
    expect(second).toBe(first);
  });

  it('requestPermission() returns the new status and updates hasPermission', async () => {
    mockExpoAudio.__setPermission('granted');
    const ref = makeRef();
    render(<Probe onState={captureProbe(ref)} />);
    await flush();
    let resolved: string | null = null;
    await act(async () => {
      resolved = await ref.state.requestPermission();
    });
    expect(resolved).toBe('granted');
    expect(ref.state.hasPermission).toBe('granted');
  });

  it('unmount during recording cleans up: stops recorder, no console.error / warn / act warnings', async () => {
    mockExpoAudio.__setPermission('granted');
    const ref = makeRef();
    const view = render(<Probe onState={captureProbe(ref)} />);
    await flush();
    await act(async () => {
      await ref.state.start();
    });
    const recorder = mockExpoAudio.__getActiveRecorder();
    await act(async () => {
      view.unmount();
    });
    // Cleanup should have invoked stopAndUnloadAsync at least once.
    expect(recorder?.stopAndUnloadAsync).toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // T045 [US3] Quality preset → recorder config wiring (FR-035 / D-12 / R-005)
  // -------------------------------------------------------------------------

  describe('quality preset → createAudioRecorder config (T045 / FR-035 / R-005)', () => {
    const RN = require('react-native') as { Platform: { OS: string } };
    const originalPlatform = RN.Platform.OS;

    afterEach(() => {
      RN.Platform.OS = originalPlatform;
    });

    it.each([
      ['Low', { sampleRate: 22050, numberOfChannels: 1, bitRate: 64000, format: 'aac' }],
      ['Medium', { sampleRate: 44100, numberOfChannels: 1, bitRate: 128000, format: 'aac' }],
      ['High', { sampleRate: 48000, numberOfChannels: 2, bitRate: 192000, format: 'aac' }],
    ] as const)(
      'forwards the native preset config when quality = %s (iOS/Android shape)',
      async (qualityName, expectedConfig) => {
        RN.Platform.OS = 'ios';
        mockExpoAudio.__setPermission('granted');
        const ref = makeRef();
        render(<Probe onState={captureProbe(ref)} />);
        await flush();
        act(() => ref.state.setQuality(qualityName));
        await act(async () => {
          await ref.state.start();
        });
        expect(mockExpoAudio.createAudioRecorder).toHaveBeenCalledTimes(1);
        const calledWith = mockExpoAudio.createAudioRecorder.mock.calls[0][0];
        expect(calledWith).toMatchObject(expectedConfig);
        // bitRate (capital R) — never the lowercase `bitrate` field.
        expect(calledWith).toHaveProperty('bitRate', expectedConfig.bitRate);
      },
    );

    it.each(['Low', 'Medium', 'High'] as const)(
      'persists Recording.quality = %s end-to-end',
      async (qualityName) => {
        RN.Platform.OS = 'ios';
        mockExpoAudio.__setPermission('granted');
        const ref = makeRef();
        render(<Probe onState={captureProbe(ref)} />);
        await flush();
        act(() => ref.state.setQuality(qualityName));
        await act(async () => {
          await ref.state.start();
        });
        let result: Recording | null = null;
        await act(async () => {
          result = await ref.state.stop();
        });
        expect(result).not.toBeNull();
        expect((result as unknown as Recording).quality).toBe(qualityName);
      },
    );

    it('forwards the Web preset shape ({ audioBitsPerSecond }) when Platform.OS === "web" (R-005)', async () => {
      RN.Platform.OS = 'web';
      mockExpoAudio.__setPermission('granted');
      const ref = makeRef();
      render(<Probe onState={captureProbe(ref)} />);
      await flush();
      act(() => ref.state.setQuality('High'));
      await act(async () => {
        await ref.state.start();
      });
      expect(mockExpoAudio.createAudioRecorder).toHaveBeenCalledTimes(1);
      const calledWith = mockExpoAudio.createAudioRecorder.mock.calls[0][0];
      expect(calledWith).toEqual({ audioBitsPerSecond: 192000 });
      // Native fields must NOT leak into the web payload.
      expect(calledWith).not.toHaveProperty('sampleRate');
      expect(calledWith).not.toHaveProperty('bitRate');
      expect(calledWith).not.toHaveProperty('numberOfChannels');
    });
  });
});
