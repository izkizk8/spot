/**
 * Value types and typed Error subclasses for feature 018 (Speech Recognition).
 *
 * Mirrors `specs/018-speech-recognition/contracts/speech-bridge.contract.ts`.
 * The bridge in `src/native/speech-recognition.types.ts` re-exports from here.
 */

export type AuthStatus =
  | 'notDetermined'
  | 'denied'
  | 'restricted'
  | 'authorized';

export type RecognitionMode = 'server' | 'on-device';

/** BCP-47 locale string (e.g., 'en-US'). */
export type Locale = string;

export interface WordToken {
  word: string;
  /**
   * Confidence in [0, 1]. OMITTED when unknown (web fallback) or when
   * the native value was 0 (Apple's "not yet computed" sentinel).
   */
  confidence?: number;
}

export interface PartialEvent {
  /** Full transcript so far (NOT a delta). */
  transcript: string;
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

export const TOP_LOCALES: readonly Locale[] = [
  'en-US',
  'zh-CN',
  'ja-JP',
  'es-ES',
  'fr-FR',
  'de-DE',
];

// ---------------------------------------------------------------------------
// Typed Error subclasses (Promise rejection envelope)
// ---------------------------------------------------------------------------

export class SpeechRecognitionNotSupported extends Error {
  readonly code = 'SpeechRecognitionNotSupported' as const;
  constructor(message = 'Speech recognition is not available on this platform.') {
    super(message);
    this.name = 'SpeechRecognitionNotSupported';
  }
}

export class SpeechAuthorizationError extends Error {
  readonly code = 'SpeechAuthorizationError' as const;
  constructor(message = 'Speech or microphone permission was denied.') {
    super(message);
    this.name = 'SpeechAuthorizationError';
  }
}

export class SpeechAudioEngineError extends Error {
  readonly code = 'SpeechAudioEngineError' as const;
  constructor(message = 'Audio engine could not be started.') {
    super(message);
    this.name = 'SpeechAudioEngineError';
  }
}

export class SpeechNetworkError extends Error {
  readonly code = 'SpeechNetworkError' as const;
  constructor(message = 'Speech recognition server is unreachable.') {
    super(message);
    this.name = 'SpeechNetworkError';
  }
}

export class SpeechInterrupted extends Error {
  readonly code = 'SpeechInterrupted' as const;
  constructor(message = 'Speech recognition session was interrupted.') {
    super(message);
    this.name = 'SpeechInterrupted';
  }
}

export const isFinalEvent = (e: PartialEvent | FinalEvent): e is FinalEvent =>
  (e as FinalEvent).isFinal === true;
