/**
 * Phase 1 contract — JS bridge for feature 019 (Speech Synthesis).
 *
 * This file is the AUTHORITATIVE TypeScript contract for the bridge module
 * that will be implemented at:
 *   - src/native/speech-synthesis.ts          (iOS, requireOptionalNativeModule)
 *   - src/native/speech-synthesis.android.ts  (Android, expo-speech adapter)
 *   - src/native/speech-synthesis.web.ts      (Web, window.speechSynthesis adapter)
 *   - src/native/speech-synthesis.types.ts    (shared types — re-exports from
 *                                              src/modules/speech-synthesis-lab/
 *                                              synth-types.ts plus the bridge
 *                                              interface declared below)
 *
 * The bridge mirrors the precedent set by feature 018's
 * `src/native/speech-recognition.ts` (event-emitter pattern, typed Promise
 * rejections, platform split). Unlike 018, ALL THREE platform variants here
 * are functional (no degraded "iOS-only banner" stub) — see plan.md and
 * research.md R-003 / R-004 / R-005.
 *
 * Behavior contract (FR-029 .. FR-036):
 *   - `availableVoices()` returns the platform's voices mapped to the
 *     unified `Voice` shape. Never rejects; returns [] when none available.
 *   - `speak(args)` clamps rate/pitch/volume defensively but does NOT throw
 *     on out-of-range values; the screen guards empty text per FR-020.
 *   - `pause()` / `continue()` reject with `SpeechSynthesisPauseUnsupported`
 *     on platforms/OEMs that don't support them (FR-021).
 *   - `stop()` is idempotent; never rejects.
 *   - `requestPersonalVoiceAuthorization()` returns 'unsupported' on
 *     iOS < 17, Android, and Web (D-08, FR-030).
 *   - `events` MUST emit ONLY 'didStart' / 'didFinish' / 'didPause' /
 *     'didContinue' / 'didCancel' / 'willSpeakWord' (FR-031).
 *   - On all platforms, native failures MUST be caught inside the platform
 *     adapter and surface either as one of the typed Promise rejections
 *     (sync-time errors) or be silently dropped (mid-utterance non-fatal
 *     events) — never an uncaught exception.
 */

// ---------------------------------------------------------------------------
// Value types — re-declared here for contract self-containedness.
// These mirror src/modules/speech-synthesis-lab/synth-types.ts verbatim.
// ---------------------------------------------------------------------------

export type VoiceQuality = 'Default' | 'Enhanced' | 'Premium';

export interface Voice {
  id: string;
  name: string;
  /** BCP-47 language tag exactly as reported by the platform (D-12). */
  language: string;
  quality: VoiceQuality;
  /** True only on iOS 17+ for voices flagged with `.isPersonalVoice` (R-008). */
  isPersonalVoice: boolean;
}

export type TransportState = 'idle' | 'speaking' | 'paused';

export type PersonalVoiceAuthorizationStatus =
  | 'notDetermined'
  | 'authorized'
  | 'denied'
  | 'unsupported';

export interface WordBoundaryEvent {
  range: { location: number; length: number };
  fullText: string;
}

export interface SpeakArgs {
  /** Required; non-empty after trim (caller-side guard per FR-020). */
  text: string;
  /** Omit for the platform default voice. */
  voiceId?: string;
  /** iOS-domain rate ∈ [0.0, 1.0]. */
  rate: number;
  /** iOS-domain pitch ∈ [0.5, 2.0]. */
  pitch: number;
  /** iOS-domain volume ∈ [0.0, 1.0]. */
  volume: number;
}

// ---------------------------------------------------------------------------
// Typed error hierarchy
// ---------------------------------------------------------------------------

export type SynthesisErrorKind =
  | 'NotSupported'
  | 'PauseUnsupported'
  | 'Interrupted'
  | 'Unknown';

export class SpeechSynthesisError extends Error {
  readonly kind: SynthesisErrorKind;
  constructor(kind: SynthesisErrorKind, message?: string) {
    super(message ?? kind);
    this.name = 'SpeechSynthesisError';
    this.kind = kind;
  }
}

export class SpeechSynthesisNotSupported extends SpeechSynthesisError {
  constructor(message?: string) {
    super('NotSupported', message);
    this.name = 'SpeechSynthesisNotSupported';
  }
}

export class SpeechSynthesisPauseUnsupported extends SpeechSynthesisError {
  constructor(message?: string) {
    super('PauseUnsupported', message);
    this.name = 'SpeechSynthesisPauseUnsupported';
  }
}

export class SpeechSynthesisInterrupted extends SpeechSynthesisError {
  constructor(message?: string) {
    super('Interrupted', message);
    this.name = 'SpeechSynthesisInterrupted';
  }
}

// ---------------------------------------------------------------------------
// Event payload map
// ---------------------------------------------------------------------------

export type SynthEventName =
  | 'didStart'
  | 'didFinish'
  | 'didPause'
  | 'didContinue'
  | 'didCancel'
  | 'willSpeakWord';

export interface SynthEventPayloads {
  didStart: { utteranceId?: string };
  didFinish: { utteranceId?: string };
  didPause: { utteranceId?: string };
  didContinue: { utteranceId?: string };
  didCancel: { utteranceId?: string };
  willSpeakWord: WordBoundaryEvent;
}

export interface SpeechBridgeSubscription {
  remove: () => void;
}

export interface SpeechBridgeEventEmitter {
  addListener<E extends SynthEventName>(
    name: E,
    listener: (payload: SynthEventPayloads[E]) => void,
  ): SpeechBridgeSubscription;
  removeAllListeners: (name?: SynthEventName) => void;
}

// ---------------------------------------------------------------------------
// Bridge surface
// ---------------------------------------------------------------------------

export interface SpeechSynthesisBridge {
  /** Enumerate platform voices. Never rejects; returns [] when none. */
  availableVoices(): Promise<Voice[]>;

  /** Begin synthesis. Rejects only with SpeechSynthesisNotSupported on
   *  test/no-TTS environments. Empty text MUST be guarded by the caller. */
  speak(args: SpeakArgs): Promise<void>;

  /** Pause current utterance. Rejects with SpeechSynthesisPauseUnsupported
   *  on platforms/OEMs that don't support pause/continue (FR-021). */
  pause(): Promise<void>;

  /** Resume paused utterance. Same rejection rule as pause(). */
  continue(): Promise<void>;

  /** Cancel any in-flight utterance. Idempotent; never rejects. */
  stop(): Promise<void>;

  /** Synchronous snapshot of native is-speaking state. */
  isSpeaking(): boolean;

  /** Returns the current authorization status on iOS 17+, prompting the
   *  user if 'notDetermined'. Returns 'unsupported' on iOS < 17, Android,
   *  Web. Never rejects. */
  requestPersonalVoiceAuthorization(): Promise<PersonalVoiceAuthorizationStatus>;

  /** EventEmitter exposing the six delegate-driven events. */
  events: SpeechBridgeEventEmitter;
}

// ---------------------------------------------------------------------------
// Platform stub-detection helpers (consumed by tests)
// ---------------------------------------------------------------------------

/** A no-op subscription used by the empty emitter when the bridge has no
 *  source of events (e.g., test environment with no TTS). */
export const NOOP_SUBSCRIPTION: SpeechBridgeSubscription = { remove: () => {} };

/** A bridge implementation that does nothing — used as a defensive default
 *  when the platform has no TTS path at all. Exposed for test fixtures. */
export const NOOP_BRIDGE: SpeechSynthesisBridge = {
  availableVoices: async () => [],
  speak: async () => {
    throw new SpeechSynthesisNotSupported();
  },
  pause: async () => {
    throw new SpeechSynthesisNotSupported();
  },
  continue: async () => {
    throw new SpeechSynthesisNotSupported();
  },
  stop: async () => {
    /* idempotent no-op */
  },
  isSpeaking: () => false,
  requestPersonalVoiceAuthorization: async () => 'unsupported',
  events: {
    addListener: () => NOOP_SUBSCRIPTION,
    removeAllListeners: () => {},
  },
};
