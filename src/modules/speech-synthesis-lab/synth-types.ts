/**
 * Value types and typed Error subclasses for feature 019 (Speech Synthesis).
 *
 * Mirrors `specs/019-speech-synthesis/contracts/speech-synthesis-bridge.contract.ts`.
 * The bridge in `src/native/speech-synthesis.types.ts` re-exports from here.
 */

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
  text: string;
  voiceId?: string;
  /** iOS-domain rate in [0.0, 1.0]. */
  rate: number;
  /** iOS-domain pitch in [0.5, 2.0]. */
  pitch: number;
  /** iOS-domain volume in [0.0, 1.0]. */
  volume: number;
}

export type RatePreset = 'Slow' | 'Normal' | 'Fast';
export type PitchPreset = 'Low' | 'Normal' | 'High';
export type VolumePreset = 'Low' | 'Normal' | 'High';

export type SynthesisErrorKind = 'NotSupported' | 'PauseUnsupported' | 'Interrupted' | 'Unknown';

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

// ---------------------------------------------------------------------------
// Typed Error subclasses
// ---------------------------------------------------------------------------

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
    super('NotSupported', message ?? 'Speech synthesis is not available on this platform.');
    this.name = 'SpeechSynthesisNotSupported';
  }
}

export class SpeechSynthesisPauseUnsupported extends SpeechSynthesisError {
  constructor(message?: string) {
    super('PauseUnsupported', message ?? 'Pause/continue is not supported on this platform.');
    this.name = 'SpeechSynthesisPauseUnsupported';
  }
}

export class SpeechSynthesisInterrupted extends SpeechSynthesisError {
  constructor(message?: string) {
    super('Interrupted', message ?? 'Speech synthesis was interrupted.');
    this.name = 'SpeechSynthesisInterrupted';
  }
}
