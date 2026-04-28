# Phase 1 Data Model — Audio Recording + Playback Module (Feature 020)

**Branch**: `020-audio-recording` | **Date**: 2026-04-28 | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

This document is the authoritative data-model declaration for the JS layer of feature 020. The TypeScript declarations here are mirrored verbatim by `src/modules/audio-lab/audio-types.ts` during implementation; the bridge contract at `contracts/audio-bridge.contract.ts` re-exports from this contract.

All field names, value types, and union-tag strings are normative — implementation deviations require a spec/plan/data-model amendment.

---

## 1. `Recording`

A persisted audio capture. The single record persisted under AsyncStorage key `spot.audio.recordings` (the stored value is `Recording[]`).

```ts
export interface Recording {
  /** Stable opaque ID. UUID v4 generated at record-stop time; never re-derived from filename. */
  id: string;
  /**
   * Display name. Format `YYYY-MM-DD-HH-MM-SS` plus optional `-N` de-dup suffix
   * plus `.m4a` extension on iOS/Android (D-13). On Web the displayed name follows
   * the same timestamp format even though `uri` is an opaque blob URL.
   */
  name: string;
  /**
   * iOS/Android: absolute `file://` URI under
   * `FileSystem.documentDirectory + 'recordings/' + name`.
   * Web: `blob:` URL returned by `URL.createObjectURL` on the `MediaRecorder` blob.
   */
  uri: string;
  /** Duration in milliseconds; computed at record-stop time; never recomputed on list render. */
  durationMs: number;
  /** On-disk file size in bytes (iOS/Android) or `Blob.size` (Web); read at record-stop time. */
  sizeBytes: number;
  /** ISO 8601 UTC timestamp at record-stop time. */
  createdAt: string;
  /** Quality preset that produced this recording. */
  quality: QualityName;
}

export type QualityName = 'Low' | 'Medium' | 'High';
```

**Storage shape**: `JSON.stringify(Recording[])` written to AsyncStorage key **`spot.audio.recordings`** (D-07). Read at screen mount via `recordings-store.loadRecordings()`. Parse failures are tolerated — treated as `[]` with a single `console.warn` (FR-034).

**Identity rules**:
- `id` is the canonical handle for delete operations.
- `name` is the user-facing display string only — never compared for equality logic.
- `uri` is recomputed on Web at every mount (blob URLs are session-scoped); on iOS/Android the URI is stable across mounts.

**Cleanup rule (FR-017)**: On `loadRecordings()`, any `Recording` whose `uri` does not exist on disk (per `FileSystem.getInfoAsync(uri).exists === false` on iOS/Android; always considered valid on Web within the session) MUST be filtered out and the cleaned list re-persisted, with a `console.warn` per dropped entry.

---

## 2. `QualityPreset`

A named recorder configuration consumed by `useAudioRecorder.start()` and passed through to `expo-audio`.

```ts
export interface QualityPreset {
  name: QualityName;
  /** Sample rate in Hz. */
  sampleRate: number;
  /** Bitrate in bits per second. */
  bitrate: number;
  /** 1 = mono, 2 = stereo. */
  channels: 1 | 2;
  /** Codec / container; defaults to `'aac'` (`.m4a` container) on iOS/Android. */
  format: 'aac' | 'opus' | 'mp4a';
}
```

**Canonical values** (D-12, FR-035 — subject to implement-phase tuning per SC-005):

| Preset | sampleRate | bitrate | channels | format |
|--------|-----------|---------|----------|--------|
| `LOW` | 22050 | 64000 | 1 | `'aac'` |
| `MEDIUM` | 44100 | 128000 | 1 | `'aac'` |
| `HIGH` | 48000 | 192000 | 2 | `'aac'` |

**Web overrides**: On `Platform.OS === 'web'`, `format` is auto-selected by the browser's `MediaRecorder` (typically `'opus'` on Chromium, `'mp4a'` on Safari) and the preset's `bitrate` is passed via `MediaRecorderOptions.audioBitsPerSecond`. `sampleRate` and `channels` may be ignored by the browser per R-005.

---

## 3. `AudioSessionCategory` and `AudioModeOptions`

```ts
export type AudioSessionCategory =
  | 'Playback'
  | 'Record'
  | 'PlayAndRecord'
  | 'Ambient'
  | 'SoloAmbient';

export interface AudioModeOptions {
  allowsRecording: boolean;
  playsInSilentMode: boolean;
  /**
   * Optional iOS-domain interruption hint.
   * Omitted for Playback/Record/PlayAndRecord; set for Ambient/SoloAmbient.
   */
  interruptionMode?: 'mixWithOthers' | 'duckOthers';
}
```

**Mapping**: `mapCategoryToOptions(cat)` is the single pure function that produces an `AudioModeOptions` object per category. Authoritative table in `contracts/audio-session-mapping.md`. Same return value on every platform; the platform-conditional behavior (apply vs. no-op + tooltip) lives in the screen, not in the mapping.

---

## 4. `RecorderState`

```ts
export type RecorderState =
  | 'idle'                  // No recording in progress.
  | 'requesting-permission' // Microphone permission prompt is up.
  | 'recording'             // Recorder is actively capturing audio.
  | 'stopping';             // stop() has been called; finalization in flight.
```

**Transitions**:

```
   idle ──start()──▶ requesting-permission ──granted──▶ recording ──stop()──▶ stopping ──persisted──▶ idle
                            │                              ▲                                            │
                            └─denied──▶ idle              └────────────── error ──────────────────────┘
```

**Invariants**:
- `setQuality()` is a no-op while `status === 'recording'` (FR-008).
- `applyCategory()` from the screen MUST be preceded by `stop()` if `status !== 'idle'` (FR-024 / D-09).

---

## 5. `PlayerState`

```ts
export type PlayerState =
  | 'idle'      // No file loaded.
  | 'loading'   // play(uri) called; native load in flight.
  | 'playing'   // Active playback.
  | 'paused'    // Paused with file still loaded.
  | 'stopped';  // Playback ended (terminal state; transitions to idle on next play()).
```

**Transitions**:

```
  idle ──play(uri)──▶ loading ──ready──▶ playing ──pause()──▶ paused ──play()──▶ playing
                                            │                                       │
                                            ├──end-of-file──▶ stopped ──play(u2)─▶ loading
                                            └──stop()──▶ idle
```

**Invariants**:
- Calling `play(uri2)` while `status === 'playing'` MUST first call `stop()` on the in-flight player and then load `uri2` (FR-012 / D-05).
- `play()` with no `uri` argument resumes from `paused` only.

---

## 6. `PermissionStatus`

```ts
export type PermissionStatus = 'undetermined' | 'granted' | 'denied';
```

`useAudioRecorder.hasPermission` reflects the latest known value. Initial value is `'undetermined'` until either `start()` (lazy request per D-14) or `requestPermission()` (banner action) resolves.

---

## 7. `MeterFrame`

```ts
export interface MeterFrame {
  /** Normalized power level in [0, 1]. 0 = silence, 1 = clipping. */
  level: number;
  /** ms since recording started. */
  timestampMs: number;
}
```

The recorder hook emits `MeterFrame` values internally to drive `meterLevel: number`. The `WaveformMeter` component holds a fixed-length ring buffer of recent `MeterFrame`s (default 32 frames = 3.2 seconds at 100 ms cadence) and renders one bar per frame.

---

## 8. Typed errors

Hooks reject with these typed `Error` subclasses; the screen's catch sites use `instanceof` checks to render specific UI:

```ts
export class AudioPermissionDenied extends Error {
  override readonly name = 'AudioPermissionDenied';
}

export class AudioRecorderUnavailable extends Error {
  override readonly name = 'AudioRecorderUnavailable';
}

export class AudioPlayerLoadFailed extends Error {
  override readonly name = 'AudioPlayerLoadFailed';
  constructor(public readonly uri: string, message?: string) { super(message); }
}

export class AudioFileMissing extends Error {
  override readonly name = 'AudioFileMissing';
  constructor(public readonly uri: string) { super(`File missing on disk: ${uri}`); }
}

export class AudioStorageCorrupt extends Error {
  override readonly name = 'AudioStorageCorrupt';
  constructor(public readonly raw: string) { super('AsyncStorage value could not be parsed as Recording[]'); }
}
```

The store's `loadRecordings()` does NOT throw `AudioStorageCorrupt` — it logs and returns `[]` (FR-034). The class exists for callers who want to introspect a captured failure (e.g., a future "reset storage" diagnostic).

---

## 9. `recordings-store` API surface

Implementation lives at `src/modules/audio-lab/recordings-store.ts`. Mirrored by `contracts/audio-bridge.contract.ts`.

```ts
export function loadRecordings(): Promise<Recording[]>;
export function saveRecording(record: Recording): Promise<Recording[]>;
export function deleteRecording(id: string): Promise<Recording[]>;
export function clearRecordings(): Promise<void>;
```

**Semantics**:
- `loadRecordings`: reads `spot.audio.recordings`; returns `[]` on parse failure or missing key; filters out entries whose `uri` doesn't exist on disk and re-persists the cleaned list.
- `saveRecording`: appends to the loaded list; de-duplicates `name` by appending `-1`, `-2`, … if collision; persists; returns the new full list.
- `deleteRecording`: removes the entry from the list; deletes the on-disk file via `FileSystem.deleteAsync({ idempotent: true })` (no-op on Web); persists; returns the new list.
- `clearRecordings`: removes the AsyncStorage key and recursively deletes the recordings directory (no-op on Web).

All four functions are individually unit-tested with a mocked `@react-native-async-storage/async-storage` and `expo-file-system`.

---

## 10. Hook API surface (concise re-statement of plan.md §Module Boundaries)

```ts
export interface UseAudioRecorder {
  status: RecorderState;
  elapsedMs: number;
  meterLevel: number;
  quality: QualityName;
  setQuality: (q: QualityName) => void;
  start: () => Promise<void>;
  stop: () => Promise<Recording>;
  hasPermission: PermissionStatus;
  requestPermission: () => Promise<PermissionStatus>;
}

export interface UseAudioPlayer {
  status: PlayerState;
  currentUri: string | null;
  positionMs: number;
  durationMs: number;
  play: (uri?: string) => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
}
```

These two interfaces are the entire JS surface that components consume. No component imports from `expo-audio` directly.
