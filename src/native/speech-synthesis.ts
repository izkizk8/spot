/**
 * Speech-synthesis JS bridge — iOS implementation.
 *
 * Uses `requireOptionalNativeModule('SpeechSynthesis')`. When the native
 * module is registered, all methods delegate to it. When absent (e.g. iOS
 * without the SpeechSynthesis module autolinked), the bridge collapses to
 * `NOOP_BRIDGE` — `availableVoices()` returns [], `speak`/`pause`/`continue`
 * reject with `SpeechSynthesisNotSupported`, `stop()` resolves quietly,
 * `requestPersonalVoiceAuthorization()` resolves `'unsupported'`.
 *
 * @see specs/019-speech-synthesis/contracts/speech-synthesis-bridge.contract.ts
 */

import { EventEmitter, requireOptionalNativeModule } from 'expo-modules-core';

import type {
  PersonalVoiceAuthorizationStatus,
  SpeakArgs,
  SpeechBridgeEventEmitter,
  SpeechSynthesisBridge,
  Voice,
  VoiceQuality,
} from './speech-synthesis.types';
import {
  NOOP_BRIDGE,
  NOOP_SUBSCRIPTION,
  SpeechSynthesisNotSupported,
} from './speech-synthesis.types';

interface NativeVoice {
  id: string;
  name: string;
  language: string;
  quality?: string;
  isPersonalVoice?: boolean;
}

interface NativeSpeechSynthesis {
  availableVoices(): Promise<NativeVoice[]>;
  speak(args: SpeakArgs): Promise<void>;
  pause(): Promise<void>;
  continue(): Promise<void>;
  stop(): Promise<void>;
  isSpeaking(): boolean;
  requestPersonalVoiceAuthorization(): Promise<PersonalVoiceAuthorizationStatus>;
  addListener?: (eventName: string) => void;
  removeListeners?: (count: number) => void;
}

const nativeModule = requireOptionalNativeModule<NativeSpeechSynthesis>('SpeechSynthesis');

function clamp(v: number, lo: number, hi: number): number {
  if (Number.isNaN(v)) return lo;
  return Math.min(hi, Math.max(lo, v));
}

function normalizeQuality(q: unknown): VoiceQuality {
  if (q === 'Enhanced' || q === 'Premium' || q === 'Default') return q;
  return 'Default';
}

function toVoice(raw: NativeVoice): Voice {
  return {
    id: String(raw.id),
    name: String(raw.name),
    language: String(raw.language),
    quality: normalizeQuality(raw.quality),
    isPersonalVoice: Boolean(raw.isPersonalVoice),
  };
}

function buildEvents(): SpeechBridgeEventEmitter {
  if (!nativeModule) {
    return {
      addListener: () => NOOP_SUBSCRIPTION,
      removeAllListeners: () => {},
    };
  }
  return new EventEmitter(
    nativeModule as unknown as ConstructorParameters<typeof EventEmitter>[0],
  ) as unknown as SpeechBridgeEventEmitter;
}

const events: SpeechBridgeEventEmitter = buildEvents();

const bridge: SpeechSynthesisBridge = nativeModule
  ? {
      async availableVoices(): Promise<Voice[]> {
        try {
          const list = await nativeModule.availableVoices();
          return Array.isArray(list) ? list.map(toVoice) : [];
        } catch {
          return [];
        }
      },
      async speak(args: SpeakArgs): Promise<void> {
        const safeArgs: SpeakArgs = {
          text: args.text,
          voiceId: args.voiceId,
          rate: clamp(args.rate, 0, 1),
          pitch: clamp(args.pitch, 0.5, 2),
          volume: clamp(args.volume, 0, 1),
        };
        return nativeModule.speak(safeArgs);
      },
      pause(): Promise<void> {
        return nativeModule.pause();
      },
      continue(): Promise<void> {
        return nativeModule.continue();
      },
      stop(): Promise<void> {
        return nativeModule.stop().catch(() => {
          /* idempotent — never reject */
        });
      },
      isSpeaking(): boolean {
        try {
          return Boolean(nativeModule.isSpeaking());
        } catch {
          return false;
        }
      },
      async requestPersonalVoiceAuthorization(): Promise<PersonalVoiceAuthorizationStatus> {
        try {
          return await nativeModule.requestPersonalVoiceAuthorization();
        } catch {
          return 'unsupported';
        }
      },
      events,
    }
  : {
      ...NOOP_BRIDGE,
      events,
    };

// Re-export for tests that need the typed-error class to assert rejections.
export { SpeechSynthesisNotSupported };

export default bridge;
