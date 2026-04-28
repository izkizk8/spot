/**
 * Phase 1 contract — JS surface for feature 020 (Audio Recording + Playback).
 *
 * This file is the AUTHORITATIVE TypeScript contract for the two hooks, the
 * recordings store, and the audio-session mapping that will be implemented at:
 *
 *   - src/modules/audio-lab/hooks/useAudioRecorder.ts
 *   - src/modules/audio-lab/hooks/useAudioPlayer.ts
 *   - src/modules/audio-lab/recordings-store.ts
 *   - src/modules/audio-lab/audio-session.ts
 *   - src/modules/audio-lab/quality-presets.ts
 *   - src/modules/audio-lab/audio-types.ts          (re-exports the value types
 *                                                    declared below)
 *
 * Behavior contract (FR-029 .. FR-035, FR-018 .. FR-025):
 *   - useAudioRecorder owns the recorder lifecycle, lazy permission request,
 *     100 ms metering poll, and quality selection. setQuality is a no-op while
 *     recording. stop() resolves with the persisted Recording.
 *   - useAudioPlayer owns single-active-player playback. play(uri) on an
 *     in-flight player MUST stop the previous one first. Both hooks clean up
 *     all timers / subscriptions / native handles on unmount.
 *   - recordings-store is JSON-parse tolerant (returns [] on failure with
 *     console.warn; never throws AudioStorageCorrupt to its caller).
 *   - audio-session.mapCategoryToOptions is pure and platform-agnostic; the
 *     screen layer decides whether to actually call setAudioModeAsync or to
 *     render a no-op tooltip (Web).
 */

// ---------------------------------------------------------------------------
// Value types — re-declared here for contract self-containedness.
// These mirror src/modules/audio-lab/audio-types.ts verbatim.
// ---------------------------------------------------------------------------

export type QualityName = 'Low' | 'Medium' | 'High';

export interface Recording {
  id: string;
  name: string;
  uri: string;
  durationMs: number;
  sizeBytes: number;
  createdAt: string;
  quality: QualityName;
}

export interface QualityPreset {
  name: QualityName;
  sampleRate: number;
  bitrate: number;
  channels: 1 | 2;
  format: 'aac' | 'opus' | 'mp4a';
}

export type AudioSessionCategory =
  | 'Playback'
  | 'Record'
  | 'PlayAndRecord'
  | 'Ambient'
  | 'SoloAmbient';

export interface AudioModeOptions {
  allowsRecording: boolean;
  playsInSilentMode: boolean;
  interruptionMode?: 'mixWithOthers' | 'duckOthers';
}

export type RecorderState =
  | 'idle'
  | 'requesting-permission'
  | 'recording'
  | 'stopping';

export type PlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'stopped';

export type PermissionStatus = 'undetermined' | 'granted' | 'denied';

export interface MeterFrame {
  level: number;
  timestampMs: number;
}

// ---------------------------------------------------------------------------
// Typed errors
// ---------------------------------------------------------------------------

export declare class AudioPermissionDenied extends Error {
  override readonly name: 'AudioPermissionDenied';
}

export declare class AudioRecorderUnavailable extends Error {
  override readonly name: 'AudioRecorderUnavailable';
}

export declare class AudioPlayerLoadFailed extends Error {
  override readonly name: 'AudioPlayerLoadFailed';
  readonly uri: string;
  constructor(uri: string, message?: string);
}

export declare class AudioFileMissing extends Error {
  override readonly name: 'AudioFileMissing';
  readonly uri: string;
  constructor(uri: string);
}

export declare class AudioStorageCorrupt extends Error {
  override readonly name: 'AudioStorageCorrupt';
  readonly raw: string;
  constructor(raw: string);
}

// ---------------------------------------------------------------------------
// Hook contracts
// ---------------------------------------------------------------------------

export interface UseAudioRecorder {
  /** Current recorder state. */
  readonly status: RecorderState;
  /** Milliseconds elapsed since the current recording started; 0 when idle. */
  readonly elapsedMs: number;
  /** Last metering sample, normalized to [0, 1]; 0 when idle. */
  readonly meterLevel: number;
  /** Currently selected quality preset; default 'Medium' on first mount. */
  readonly quality: QualityName;
  /** No-op while status === 'recording' (FR-008). */
  setQuality(q: QualityName): void;
  /**
   * Start recording. Lazily requests microphone permission if not granted
   * (FR-026 / D-14). Rejects with AudioPermissionDenied on denial or
   * AudioRecorderUnavailable if expo-audio cannot initialize.
   */
  start(): Promise<void>;
  /**
   * Stop, finalize, persist via recordings-store.saveRecording, and resolve
   * with the new Recording. Idempotent; calling stop() on an already-idle
   * recorder resolves with the most recent Recording (or rejects if none).
   */
  stop(): Promise<Recording>;
  readonly hasPermission: PermissionStatus;
  /** Explicit re-prompt (PermissionBanner action). */
  requestPermission(): Promise<PermissionStatus>;
}

export interface UseAudioPlayer {
  readonly status: PlayerState;
  readonly currentUri: string | null;
  readonly positionMs: number;
  readonly durationMs: number;
  /**
   * Play `uri`, stopping any in-flight playback first (FR-012 / D-05).
   * Calling play() with no argument resumes from `paused` only.
   * Rejects with AudioPlayerLoadFailed (or AudioFileMissing for missing files
   * on iOS/Android).
   */
  play(uri?: string): Promise<void>;
  pause(): Promise<void>;
  /** Idempotent; never rejects. */
  stop(): Promise<void>;
}

// ---------------------------------------------------------------------------
// Recordings store contract
// ---------------------------------------------------------------------------

export interface RecordingsStore {
  /**
   * Read AsyncStorage `spot.audio.recordings`. Returns [] on missing key or
   * parse failure (console.warn on failure). Filters out entries whose URI no
   * longer exists on disk (iOS/Android only) and re-persists the cleaned list.
   */
  loadRecordings(): Promise<Recording[]>;
  /**
   * Append `record` to the loaded list. De-duplicates `name` by appending
   * `-1`, `-2`, ... before the `.m4a` extension if collision. Persists.
   * Returns the new full list.
   */
  saveRecording(record: Recording): Promise<Recording[]>;
  /**
   * Remove the entry whose `id === id` from the list and from disk
   * (FileSystem.deleteAsync({ idempotent: true })). Persists. No-op on disk
   * for Web. Returns the new list.
   */
  deleteRecording(id: string): Promise<Recording[]>;
  /**
   * Remove the AsyncStorage key and recursively delete the recordings
   * directory (no-op on Web).
   */
  clearRecordings(): Promise<void>;
}

// ---------------------------------------------------------------------------
// Audio session mapping contract
// ---------------------------------------------------------------------------

/**
 * Pure mapping function. Same return value on every platform. The screen
 * decides whether to actually invoke `setAudioModeAsync` (iOS / Android) or
 * to render an informational tooltip (Web).
 *
 * Authoritative table: contracts/audio-session-mapping.md.
 */
export declare function mapCategoryToOptions(
  cat: AudioSessionCategory,
): AudioModeOptions;

/**
 * Convenience wrapper: calls expo-audio's `setAudioModeAsync` with
 * `mapCategoryToOptions(cat)`. The screen is responsible for stopping any
 * in-flight recorder/player BEFORE calling this (FR-024 / FR-025 / D-09);
 * this wrapper does NOT introspect transport state.
 */
export declare function applyCategory(cat: AudioSessionCategory): Promise<void>;

// ---------------------------------------------------------------------------
// Quality presets contract
// ---------------------------------------------------------------------------

export declare const LOW: QualityPreset;
export declare const MEDIUM: QualityPreset;
export declare const HIGH: QualityPreset;

/** Look up a preset by name. */
export declare function getPreset(name: QualityName): QualityPreset;
