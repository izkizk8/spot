/**
 * Bridge types for speech-recognition.
 *
 * Re-exports value types and typed errors from the module-side
 * `speech-types.ts`, then declares the `SpeechBridge` surface that the
 * iOS / Android / Web variants implement.
 *
 * @see specs/018-speech-recognition/contracts/speech-bridge.contract.ts
 */

export type {
  AuthStatus,
  RecognitionMode,
  Locale,
  WordToken,
  PartialEvent,
  FinalEvent,
  SpeechErrorKind,
  SpeechRecognitionError,
} from '@/modules/speech-recognition-lab/speech-types';

export {
  SpeechRecognitionNotSupported,
  SpeechAuthorizationError,
  SpeechAudioEngineError,
  SpeechNetworkError,
  SpeechInterrupted,
  isFinalEvent,
  TOP_LOCALES,
} from '@/modules/speech-recognition-lab/speech-types';

import type {
  AuthStatus,
  Locale,
  PartialEvent,
  FinalEvent,
  SpeechRecognitionError,
} from '@/modules/speech-recognition-lab/speech-types';

export interface Subscription {
  remove(): void;
}

export type SpeechBridgeEventName = 'partial' | 'final' | 'error';

export type SpeechBridgeEventListener<E extends SpeechBridgeEventName> = E extends 'partial'
  ? (event: PartialEvent) => void
  : E extends 'final'
    ? (event: FinalEvent) => void
    : E extends 'error'
      ? (event: SpeechRecognitionError) => void
      : never;

export interface SpeechBridgeEventEmitter {
  addListener<E extends SpeechBridgeEventName>(
    eventName: E,
    listener: SpeechBridgeEventListener<E>,
  ): Subscription;
  removeAllListeners(eventName?: SpeechBridgeEventName): void;
}

export interface SpeechBridge {
  isAvailable(locale: Locale): boolean;
  /**
   * Per-locale on-device support probe. Optional — only iOS exposes this
   * synchronously via the native module. On Android / web fallbacks the
   * field is omitted (the consumer must treat `undefined` as `false`).
   */
  supportsOnDeviceRecognition?(locale: Locale): boolean;
  availableLocales(): Locale[];
  requestAuthorization(): Promise<AuthStatus>;
  getAuthorizationStatus(): Promise<AuthStatus>;
  start(args: { locale: Locale; onDevice: boolean }): Promise<void>;
  stop(): Promise<void>;
  events: SpeechBridgeEventEmitter;
}
