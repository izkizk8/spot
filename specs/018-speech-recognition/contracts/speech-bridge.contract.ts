/**
 * Phase 1 contract — JS bridge for feature 018 (Speech Recognition).
 *
 * This file is the AUTHORITATIVE TypeScript contract for the bridge module
 * that will be implemented at:
 *   - src/native/speech-recognition.ts          (iOS, requireOptionalNativeModule)
 *   - src/native/speech-recognition.android.ts  (Android stub)
 *   - src/native/speech-recognition.web.ts      (Web — webkitSpeechRecognition adapter or stub)
 *   - src/native/speech-recognition.types.ts    (shared types — re-exports from
 *                                                src/modules/speech-recognition-lab/
 *                                                speech-types.ts plus the bridge
 *                                                interface declared below)
 *
 * The bridge mirrors the precedent set by feature 015's
 * `src/native/screentime.ts` (event-emitter pattern), feature 016's
 * `src/native/coreml.ts` (typed Promise rejections), and feature 017's
 * `src/native/vision-detector.ts` (platform split).
 *
 * Behavior contract (FR-020 .. FR-024):
 *   - `isAvailable(locale)` is SYNCHRONOUS. Returns false on non-iOS
 *     (except web with webkitSpeechRecognition present), iOS < 10,
 *     or any locale not supported by the platform recognizer.
 *   - `availableLocales()` is SYNCHRONOUS and returns [] on Android /
 *     web-without-fallback.
 *   - On non-iOS without a fallback, `start`, `stop`,
 *     `requestAuthorization`, `getAuthorizationStatus` MUST reject with
 *     `SpeechRecognitionNotSupported`.
 *   - On iOS, native failures MUST be caught inside Swift and surface
 *     either as one of the typed Promise rejections (start-time errors)
 *     or as an `error` event (mid-session errors) — never an uncaught
 *     native exception (NFR-006).
 *   - `events` MUST emit ONLY 'partial' / 'final' / 'error' (FR-021).
 */

// ---------------------------------------------------------------------------
// Value types — re-declared here for contract self-containedness.
// These mirror src/modules/speech-recognition-lab/speech-types.ts verbatim.
// ---------------------------------------------------------------------------

export type AuthStatus =
  | 'notDetermined'
  | 'denied'
  | 'restricted'
  | 'authorized';

export type RecognitionMode = 'server' | 'on-device';

export type Locale = string; // BCP-47

export interface WordToken {
  word: string;
  /**
   * Confidence in [0, 1]. OMITTED when unknown (web fallback) or when
   * the native value was 0 (Apple's "not yet computed" sentinel).
   * Consumers default missing confidence to 1.0 (FR-009).
   */
  confidence?: number;
}

export interface PartialEvent {
  /** Full transcript so far (NOT a delta). */
  transcript: string;
  /** Optional per-word breakdown. Absent on web fallback. */
  words?: WordToken[];
}

export interface FinalEvent {
  transcript: string;
  words?: WordToken[];
  /** Always true on FinalEvent; lets a single union discriminate. */
  isFinal: true;
}

export type SpeechErrorKind =
  | 'authorization'
  | 'audioEngine'
  | 'network'
  | 'interrupted'
  | 'unavailable'
  | 'unknown';

export interface SpeechRecognitionError {
  kind: SpeechErrorKind;
  message: string;
}

// ---------------------------------------------------------------------------
// Typed Error subclasses (Promise rejection envelope)
// ---------------------------------------------------------------------------

/**
 * Rejected on non-iOS without fallback (Android, web w/o
 * webkitSpeechRecognition) and on iOS < 10. Indicates the underlying
 * Speech-framework surface (or its web equivalent) is unavailable.
 */
export class SpeechRecognitionNotSupported extends Error {
  readonly code = 'SpeechRecognitionNotSupported' as const;
  constructor(message = 'Speech recognition is not available on this platform.') {
    super(message);
    this.name = 'SpeechRecognitionNotSupported';
  }
}

/**
 * Rejected when speech-recognition or microphone permission is denied
 * (or restricted). The screen surfaces this through the inline error
 * affordance; the AuthStatusPill is updated separately by
 * getAuthorizationStatus.
 */
export class SpeechAuthorizationError extends Error {
  readonly code = 'SpeechAuthorizationError' as const;
  constructor(message = 'Speech or microphone permission was denied.') {
    super(message);
    this.name = 'SpeechAuthorizationError';
  }
}

/**
 * Rejected when AVAudioSession activation or AVAudioEngine startup
 * fails (microphone busy, hardware route mismatch, etc.).
 */
export class SpeechAudioEngineError extends Error {
  readonly code = 'SpeechAudioEngineError' as const;
  constructor(message = 'Audio engine could not be started.') {
    super(message);
    this.name = 'SpeechAudioEngineError';
  }
}

/**
 * Rejected — or fired on the error channel — when Server-mode
 * recognition cannot reach Apple's servers within the documented
 * silent-timeout window (default 10 s after start without a partial).
 */
export class SpeechNetworkError extends Error {
  readonly code = 'SpeechNetworkError' as const;
  constructor(message = 'Speech recognition server is unreachable.') {
    super(message);
    this.name = 'SpeechNetworkError';
  }
}

/**
 * Fired on the error channel (not Promise-rejected; this is mid-session)
 * when the AVAudioSession is interrupted by an incoming call, Siri, or
 * OS-level audio routing change. The hook should treat this as a
 * terminal event and transition isListening to false.
 */
export class SpeechInterrupted extends Error {
  readonly code = 'SpeechInterrupted' as const;
  constructor(message = 'Speech recognition session was interrupted.') {
    super(message);
    this.name = 'SpeechInterrupted';
  }
}

// ---------------------------------------------------------------------------
// Minimal event-emitter interface used by the hook
//
// Satisfied on iOS by `expo-modules-core`'s native-backed EventEmitter,
// and on web by the local shim in speech-recognition.web.ts that wraps
// `webkitSpeechRecognition`. Android does not expose `events` — its
// stub throws on every method that would cause a subscription anyway.
// ---------------------------------------------------------------------------

export interface Subscription {
  remove(): void;
}

export type SpeechBridgeEventName = 'partial' | 'final' | 'error';

export type SpeechBridgeEventListener<E extends SpeechBridgeEventName> =
  E extends 'partial' ? (event: PartialEvent) => void :
  E extends 'final'   ? (event: FinalEvent) => void :
  E extends 'error'   ? (event: SpeechRecognitionError) => void :
  never;

export interface SpeechBridgeEventEmitter {
  addListener<E extends SpeechBridgeEventName>(
    eventName: E,
    listener: SpeechBridgeEventListener<E>,
  ): Subscription;
  removeAllListeners(eventName?: SpeechBridgeEventName): void;
}

// ---------------------------------------------------------------------------
// Bridge surface
// ---------------------------------------------------------------------------

export interface SpeechBridge {
  /**
   * Returns true when `start` may plausibly succeed for this `locale`.
   * Synchronous; never throws.
   *
   *   - iOS:     true iff iOS >= 10 AND the locale is in the platform
   *              recognizer's supported set.
   *   - Android: always false.
   *   - Web:     true iff `globalThis.webkitSpeechRecognition` exists
   *              AND `availableLocales()` is non-empty.
   *
   * NOTE: this DOES NOT guarantee on-device recognition; the
   * bridge re-checks `supportsOnDeviceRecognition` at start time
   * when `onDevice: true` is requested (research.md R-004).
   */
  isAvailable(locale: Locale): boolean;

  /**
   * Returns the locales the platform recognizer supports.
   *
   *   - iOS:     `SFSpeechRecognizer.supportedLocales()` mapped to
   *              BCP-47 strings (e.g., `en_US` → `en-US`).
   *   - Android: [].
   *   - Web:     a curated list (the top-6 locales) when
   *              webkitSpeechRecognition is present; otherwise [].
   *
   * The LocalePicker filters its top-6 list against this return value.
   */
  availableLocales(): Locale[];

  /**
   * Triggers the system speech-recognition prompt and resolves to the
   * resulting status. The microphone prompt may surface separately;
   * its result is reflected at `start` time, not here.
   *
   * Rejects with `SpeechRecognitionNotSupported` on non-iOS-without-
   * fallback platforms.
   */
  requestAuthorization(): Promise<AuthStatus>;

  /**
   * Returns the current speech-recognition authorization status
   * without prompting. Rejects with `SpeechRecognitionNotSupported`
   * on non-iOS-without-fallback platforms.
   *
   * Synchronous in iOS native, but wrapped in Promise here for
   * cross-platform parity with the web fallback (which queries
   * `navigator.permissions.query({ name: 'microphone' })`).
   */
  getAuthorizationStatus(): Promise<AuthStatus>;

  /**
   * Begins a streaming recognition session.
   *
   * MUST activate the audio session (iOS: AVAudioSession.setActive(true);
   * web: getUserMedia + webkitSpeechRecognition.start) before resolving.
   *
   * If `onDevice: true` is requested but the recognizer for the given
   * `locale` does not support on-device recognition, MUST reject with
   * `SpeechRecognitionNotSupported` (research.md R-004) — MUST NOT
   * silently fall back to server mode.
   *
   * Rejection envelope:
   *   - SpeechRecognitionNotSupported  — platform / locale / on-device unsupported
   *   - SpeechAuthorizationError       — speech or microphone permission denied
   *   - SpeechAudioEngineError         — audio session / engine failure
   *
   * MUST NOT propagate uncaught native exceptions (NFR-006).
   */
  start(args: { locale: Locale; onDevice: boolean }): Promise<void>;

  /**
   * Terminates the active recognition session.
   *
   * MUST deactivate the audio session (iOS: AVAudioSession.setActive(false,
   * options: .notifyOthersOnDeactivation)) before resolving.
   *
   * Idempotent: calling `stop` when no session is active resolves
   * without error.
   *
   * MUST NOT propagate uncaught native exceptions.
   */
  stop(): Promise<void>;

  /**
   * Streaming event channel. Listener subscriptions are managed by the
   * caller (the hook); the bridge does NOT auto-unsubscribe on `stop`.
   *
   * Emitted events:
   *   - 'partial' (PartialEvent)             — every non-final result update
   *   - 'final'   (FinalEvent)               — exactly once per session, on isFinal
   *   - 'error'   (SpeechRecognitionError)   — terminal mid-session failure
   *
   * After 'final' or 'error', no further events fire for the same
   * session; the next `start` begins a new event stream.
   */
  events: SpeechBridgeEventEmitter;
}

// ---------------------------------------------------------------------------
// Type guards (handy for tests + the hook's terminal-event detection)
// ---------------------------------------------------------------------------

export const isFinalEvent = (e: PartialEvent | FinalEvent): e is FinalEvent =>
  (e as FinalEvent).isFinal === true;
