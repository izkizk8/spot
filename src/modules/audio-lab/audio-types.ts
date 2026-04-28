/**
 * Foundational types and typed Error subclasses for the `audio-lab` module
 * (feature 020).
 *
 * Mirrors `specs/020-audio-recording/data-model.md` §1–§8 verbatim and
 * `specs/020-audio-recording/contracts/audio-bridge.contract.ts`. Any change
 * here MUST be matched by a spec/data-model amendment.
 */

// ---------------------------------------------------------------------------
// Value types
// ---------------------------------------------------------------------------

export type QualityName = 'Low' | 'Medium' | 'High';

export interface Recording {
  /** Stable opaque ID. UUID v4 generated at record-stop time. */
  id: string;
  /** Display name. `YYYY-MM-DD-HH-MM-SS[-N].m4a` on iOS/Android. */
  name: string;
  /** Absolute `file://` URI on iOS/Android; opaque blob URL on Web. */
  uri: string;
  /** Duration in milliseconds; computed at record-stop time. */
  durationMs: number;
  /** On-disk file size in bytes (or `Blob.size` on Web). */
  sizeBytes: number;
  /** ISO 8601 UTC timestamp at record-stop time. */
  createdAt: string;
  /** Quality preset that produced this recording. */
  quality: QualityName;
}

export interface QualityPreset {
  name: QualityName;
  /** Sample rate in Hz. */
  sampleRate: number;
  /** Bitrate in bits per second. */
  bitrate: number;
  /** 1 = mono, 2 = stereo. */
  channels: 1 | 2;
  /** Codec / container. */
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
  /** Omitted for Playback/Record/PlayAndRecord; set for Ambient/SoloAmbient. */
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
  /** Normalized power level in [0, 1]. 0 = silence, 1 = clipping. */
  level: number;
  /** ms since recording started. */
  timestampMs: number;
}

// ---------------------------------------------------------------------------
// Typed Error subclasses (data-model §8)
// ---------------------------------------------------------------------------

export class AudioPermissionDenied extends Error {
  override readonly name = 'AudioPermissionDenied';
}

export class AudioRecorderUnavailable extends Error {
  override readonly name = 'AudioRecorderUnavailable';
}

export class AudioPlayerLoadFailed extends Error {
  override readonly name = 'AudioPlayerLoadFailed';
  constructor(
    public readonly uri: string,
    message?: string,
  ) {
    super(message);
  }
}

export class AudioFileMissing extends Error {
  override readonly name = 'AudioFileMissing';
  constructor(public readonly uri: string) {
    super(`File missing on disk: ${uri}`);
  }
}

export class AudioStorageCorrupt extends Error {
  override readonly name = 'AudioStorageCorrupt';
  constructor(public readonly raw: string) {
    super('AsyncStorage value could not be parsed as Recording[]');
  }
}
