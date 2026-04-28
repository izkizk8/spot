/**
 * Jest mock for `expo-audio` (feature 020).
 *
 * Exposes a controllable in-memory recorder + player so hook/component tests
 * can drive state transitions and metering / position ticks deterministically.
 *
 * Mirrors the precedent set by `test/__mocks__/expo-speech-recognition.ts`
 * (feature 018) — every public API on `expo-audio` consumed by the audio-lab
 * module is re-implemented here as a `jest.fn()` whose behavior can be
 * inspected and reset between tests.
 *
 * Usage in tests:
 *
 *   import * as ExpoAudio from 'expo-audio';
 *   const mock = require('expo-audio') as typeof import('../../test/__mocks__/expo-audio');
 *   mock.__reset();
 *   mock.__setPermission('granted');
 *   mock.__emitMeter(0.42);   // push a metering frame to the active recorder
 *   mock.__emitPlaybackStatus({ positionMillis: 1234, durationMillis: 5000 });
 */

type PermissionStatus = 'undetermined' | 'granted' | 'denied';

interface MockRecorder {
  startAsync: jest.Mock;
  stopAndUnloadAsync: jest.Mock;
  pauseAsync: jest.Mock;
  getStatusAsync: jest.Mock;
  setOnRecordingStatusUpdate: jest.Mock;
}

interface MockPlayer {
  play: jest.Mock;
  pause: jest.Mock;
  stop: jest.Mock;
  seekTo: jest.Mock;
  unloadAsync: jest.Mock;
  setOnPlaybackStatusUpdate: jest.Mock;
}

interface PlaybackStatus {
  isLoaded: boolean;
  isPlaying: boolean;
  positionMillis: number;
  durationMillis: number;
  didJustFinish: boolean;
}

interface RecordingStatus {
  isRecording: boolean;
  durationMillis: number;
  metering?: number;
}

let permission: PermissionStatus = 'undetermined';
let constructRecorderShouldThrow = false;
let constructPlayerShouldThrow = false;

let activeRecorder: MockRecorder | null = null;
let activeRecorderStatusListener: ((s: RecordingStatus) => void) | null = null;
let activePlayer: MockPlayer | null = null;
let activePlaybackListener: ((s: PlaybackStatus) => void) | null = null;

let lastRecordedUri = 'file:///mock/recordings/recording.m4a';
let lastRecordedSize = 1234;

export const setAudioModeAsync = jest.fn(async (_options: unknown) => {
  return undefined;
});

export const getRecordingPermissionsAsync = jest.fn(async () => ({
  status: permission,
  granted: permission === 'granted',
  canAskAgain: true,
  expires: 'never',
}));

export const requestRecordingPermissionsAsync = jest.fn(async () => ({
  status: permission,
  granted: permission === 'granted',
  canAskAgain: true,
  expires: 'never',
}));

export const createAudioRecorder = jest.fn((_options: unknown): MockRecorder => {
  if (constructRecorderShouldThrow) {
    throw new Error('Mock recorder construction failure');
  }
  const recorder: MockRecorder = {
    startAsync: jest.fn(async () => undefined),
    stopAndUnloadAsync: jest.fn(async () => ({
      uri: lastRecordedUri,
      size: lastRecordedSize,
    })),
    pauseAsync: jest.fn(async () => undefined),
    getStatusAsync: jest.fn(async () => ({
      isRecording: true,
      durationMillis: 0,
    })),
    setOnRecordingStatusUpdate: jest.fn((cb: (s: RecordingStatus) => void) => {
      activeRecorderStatusListener = cb;
    }),
  };
  activeRecorder = recorder;
  return recorder;
});

export function createAudioPlayer(_uri: string, _options?: unknown): MockPlayer {
  if (constructPlayerShouldThrow) {
    throw new Error('Mock player construction failure');
  }
  const player: MockPlayer = {
    play: jest.fn(async () => undefined),
    pause: jest.fn(async () => undefined),
    stop: jest.fn(async () => undefined),
    seekTo: jest.fn(async (_pos: number) => undefined),
    unloadAsync: jest.fn(async () => undefined),
    setOnPlaybackStatusUpdate: jest.fn((cb: (s: PlaybackStatus) => void) => {
      activePlaybackListener = cb;
    }),
  };
  activePlayer = player;
  return player;
}

// ---------------------------------------------------------------------------
// Test helpers (prefixed with `__` so they're obviously test-only)
// ---------------------------------------------------------------------------

export function __reset(): void {
  permission = 'undetermined';
  constructRecorderShouldThrow = false;
  constructPlayerShouldThrow = false;
  activeRecorder = null;
  activeRecorderStatusListener = null;
  activePlayer = null;
  activePlaybackListener = null;
  lastRecordedUri = 'file:///mock/recordings/recording.m4a';
  lastRecordedSize = 1234;
  setAudioModeAsync.mockClear();
  getRecordingPermissionsAsync.mockClear();
  requestRecordingPermissionsAsync.mockClear();
  createAudioRecorder.mockClear();
}

export function __setPermission(s: PermissionStatus): void {
  permission = s;
}

export function __setConstructRecorderThrows(b: boolean): void {
  constructRecorderShouldThrow = b;
}

export function __setConstructPlayerThrows(b: boolean): void {
  constructPlayerShouldThrow = b;
}

export function __setRecordedFile(uri: string, size: number): void {
  lastRecordedUri = uri;
  lastRecordedSize = size;
}

export function __getActiveRecorder(): MockRecorder | null {
  return activeRecorder;
}

export function __getActivePlayer(): MockPlayer | null {
  return activePlayer;
}

/** Emit a metering frame to the active recorder's status listener. */
export function __emitMeter(level: number, durationMillis = 0): void {
  if (activeRecorderStatusListener) {
    activeRecorderStatusListener({
      isRecording: true,
      durationMillis,
      metering: level,
    });
  }
}

/** Emit a playback status update to the active player's listener. */
export function __emitPlaybackStatus(s: Partial<PlaybackStatus>): void {
  if (activePlaybackListener) {
    activePlaybackListener({
      isLoaded: true,
      isPlaying: true,
      positionMillis: 0,
      durationMillis: 0,
      didJustFinish: false,
      ...s,
    });
  }
}
