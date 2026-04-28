/**
 * Bridge types for speech-synthesis (feature 019).
 *
 * Re-exports value types + typed errors from the module-side `synth-types.ts`,
 * then declares the `SpeechSynthesisBridge` surface implemented by the iOS,
 * Android, and Web variants.
 *
 * @see specs/019-speech-synthesis/contracts/speech-synthesis-bridge.contract.ts
 */

export type {
  Voice,
  VoiceQuality,
  WordBoundaryEvent,
  PersonalVoiceAuthorizationStatus,
  TransportState,
  SpeakArgs,
  RatePreset,
  PitchPreset,
  VolumePreset,
  SynthesisErrorKind,
  SynthEventName,
  SynthEventPayloads,
} from '@/modules/speech-synthesis-lab/synth-types';

export {
  SpeechSynthesisError,
  SpeechSynthesisNotSupported,
  SpeechSynthesisPauseUnsupported,
  SpeechSynthesisInterrupted,
} from '@/modules/speech-synthesis-lab/synth-types';

import type {
  PersonalVoiceAuthorizationStatus,
  SpeakArgs,
  SynthEventName,
  SynthEventPayloads,
  Voice,
} from '@/modules/speech-synthesis-lab/synth-types';
import { SpeechSynthesisNotSupported } from '@/modules/speech-synthesis-lab/synth-types';

export interface SpeechBridgeSubscription {
  remove: () => void;
}

export interface SpeechBridgeEventEmitter {
  addListener<E extends SynthEventName>(
    name: E,
    listener: (payload: SynthEventPayloads[E]) => void,
  ): SpeechBridgeSubscription;
  removeAllListeners(name?: SynthEventName): void;
}

export interface SpeechSynthesisBridge {
  availableVoices(): Promise<Voice[]>;
  speak(args: SpeakArgs): Promise<void>;
  pause(): Promise<void>;
  continue(): Promise<void>;
  stop(): Promise<void>;
  isSpeaking(): boolean;
  requestPersonalVoiceAuthorization(): Promise<PersonalVoiceAuthorizationStatus>;
  events: SpeechBridgeEventEmitter;
}

export const NOOP_SUBSCRIPTION: SpeechBridgeSubscription = { remove: () => {} };

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
