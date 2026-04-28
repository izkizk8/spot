/**
 * T039 [US2]: useAudioPlayer hook tests.
 *
 * Drives the player state machine using the controllable `expo-audio` mock.
 * Verifies:
 *   - state machine: idle → loading → playing → paused → stopped
 *   - single-active-player invariant (FR-012 / D-05): play(uri2) while
 *     playing first stops the in-flight player
 *   - end-of-file event transitions to 'stopped'; subsequent play(uri) reloads
 *   - play(missingUri) rejects AudioFileMissing on iOS/Android
 *   - bad-load rejects AudioPlayerLoadFailed
 *   - unmount cleanup: stop + clear interval + no warnings/errors
 */

import React from 'react';
import { Text } from 'react-native';
import { act, render } from '@testing-library/react-native';

import {
  AudioFileMissing,
  AudioPlayerLoadFailed,
} from '@/modules/audio-lab/audio-types';
import { useAudioPlayer } from '@/modules/audio-lab/hooks/useAudioPlayer';

jest.mock('expo-audio');
jest.mock('expo-file-system');

const mockExpoAudio = jest.requireMock('expo-audio') as typeof import('../../../../__mocks__/expo-audio');
const mockFs = jest.requireMock('expo-file-system') as typeof import('../../../../__mocks__/expo-file-system');

interface ProbeRef {
  state: ReturnType<typeof useAudioPlayer>;
}

function Probe({ onState }: { onState: (s: ReturnType<typeof useAudioPlayer>) => void }) {
  const state = useAudioPlayer();
  onState(state);
  return <Text>{`P=${state.status}`}</Text>;
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

const URI_A = 'file:///mock/recordings/a.m4a';
const URI_B = 'file:///mock/recordings/b.m4a';

describe('useAudioPlayer', () => {
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockExpoAudio.__reset();
    mockFs.__reset();
    // Default: both URIs exist
    mockFs.__setExists(URI_A, true, 1000);
    mockFs.__setExists(URI_B, true, 2000);
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
    expect(ref.state.currentUri).toBeNull();
    expect(ref.state.positionMs).toBe(0);
    expect(ref.state.durationMs).toBe(0);
  });

  it('play(uri) transitions idle → loading → playing and sets currentUri', async () => {
    const ref = makeRef();
    render(<Probe onState={captureProbe(ref)} />);
    await flush();
    await act(async () => {
      await ref.state.play(URI_A);
    });
    expect(ref.state.status).toBe('playing');
    expect(ref.state.currentUri).toBe(URI_A);
    const player = mockExpoAudio.__getActivePlayer();
    expect(player).not.toBeNull();
    expect(player?.play).toHaveBeenCalled();
  });

  it('pause() transitions playing → paused; play() (no arg) resumes from paused', async () => {
    const ref = makeRef();
    render(<Probe onState={captureProbe(ref)} />);
    await flush();
    await act(async () => {
      await ref.state.play(URI_A);
    });
    await act(async () => {
      await ref.state.pause();
    });
    expect(ref.state.status).toBe('paused');
    await act(async () => {
      await ref.state.play();
    });
    expect(ref.state.status).toBe('playing');
  });

  it('play(uri2) while playing first stops the in-flight player (single-active invariant)', async () => {
    const ref = makeRef();
    render(<Probe onState={captureProbe(ref)} />);
    await flush();
    await act(async () => {
      await ref.state.play(URI_A);
    });
    const playerA = mockExpoAudio.__getActivePlayer();
    expect(playerA).not.toBeNull();
    await act(async () => {
      await ref.state.play(URI_B);
    });
    const playerB = mockExpoAudio.__getActivePlayer();
    expect(playerB).not.toBe(playerA);
    expect(playerA?.stop).toHaveBeenCalled();
    expect(ref.state.currentUri).toBe(URI_B);
    expect(ref.state.status).toBe('playing');
  });

  it('stop() is idempotent and never rejects', async () => {
    const ref = makeRef();
    render(<Probe onState={captureProbe(ref)} />);
    await flush();
    await act(async () => {
      await ref.state.play(URI_A);
    });
    await act(async () => {
      await ref.state.stop();
      await ref.state.stop();
      await ref.state.stop();
    });
    expect(ref.state.status).toBe('idle');
  });

  it('end-of-file event transitions to "stopped"; subsequent play(uri) reloads', async () => {
    const ref = makeRef();
    render(<Probe onState={captureProbe(ref)} />);
    await flush();
    await act(async () => {
      await ref.state.play(URI_A);
    });
    act(() => {
      mockExpoAudio.__emitPlaybackStatus({
        isPlaying: false,
        positionMillis: 5000,
        durationMillis: 5000,
        didJustFinish: true,
      });
    });
    expect(ref.state.status).toBe('stopped');
    await act(async () => {
      await ref.state.play(URI_A);
    });
    expect(ref.state.status).toBe('playing');
  });

  it('play(missingUri) rejects with AudioFileMissing on iOS/Android', async () => {
    mockFs.__setExists('file:///mock/missing.m4a', false);
    // Override: file present in map but not exists
    const ref = makeRef();
    render(<Probe onState={captureProbe(ref)} />);
    await flush();
    let caught: unknown = null;
    await act(async () => {
      try {
        await ref.state.play('file:///mock/missing.m4a');
      } catch (e) {
        caught = e;
      }
    });
    expect(caught).toBeInstanceOf(AudioFileMissing);
    expect(caught).toBeInstanceOf(Error);
    expect(ref.state.status).toBe('idle');
  });

  it('play(badUri) rejects with AudioPlayerLoadFailed when player throws on construction', async () => {
    mockExpoAudio.__setConstructPlayerThrows(true);
    const ref = makeRef();
    render(<Probe onState={captureProbe(ref)} />);
    await flush();
    let caught: unknown = null;
    await act(async () => {
      try {
        await ref.state.play(URI_A);
      } catch (e) {
        caught = e;
      }
    });
    expect(caught).toBeInstanceOf(AudioPlayerLoadFailed);
    expect(caught).toBeInstanceOf(Error);
    expect(ref.state.status).toBe('idle');
  });

  it('positionMs/durationMs reflect injected playback status updates', async () => {
    const ref = makeRef();
    render(<Probe onState={captureProbe(ref)} />);
    await flush();
    await act(async () => {
      await ref.state.play(URI_A);
    });
    act(() => {
      mockExpoAudio.__emitPlaybackStatus({
        isPlaying: true,
        positionMillis: 1234,
        durationMillis: 5678,
        didJustFinish: false,
      });
    });
    expect(ref.state.positionMs).toBe(1234);
    expect(ref.state.durationMs).toBe(5678);
  });

  it('unmount during playing cleans up: stops player, no warnings/errors', async () => {
    const ref = makeRef();
    const view = render(<Probe onState={captureProbe(ref)} />);
    await flush();
    await act(async () => {
      await ref.state.play(URI_A);
    });
    const player = mockExpoAudio.__getActivePlayer();
    await act(async () => {
      view.unmount();
    });
    expect(player?.stop).toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
