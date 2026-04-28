/**
 * Speech-synthesis JS bridge — Android adapter over `expo-speech`.
 *
 * Maps the unified bridge surface onto Android's `expo-speech` API.
 *   - `availableVoices()` → `Speech.getAvailableVoicesAsync()`
 *   - `speak({...})` → `Speech.speak(text, { voice, rate, pitch, volume,
 *      onStart, onDone, onStopped, onBoundary })` with the Android domain
 *      mapping from `synth-mapping`.
 *   - `pause()` / `continue()` → `Speech.pause()` / `Speech.resume()` inside
 *      a try/catch — rejects with `SpeechSynthesisPauseUnsupported` if the
 *      OEM TTS engine doesn't support pausing (FR-021).
 *   - `stop()` → `Speech.stop()` (idempotent).
 *   - `isSpeaking()` reports the cached state from the latest event channel
 *     (synchronous, since `Speech.isSpeakingAsync()` is async — D-08).
 *   - `requestPersonalVoiceAuthorization()` resolves `'unsupported'` (D-08).
 */

import * as Speech from 'expo-speech';

import {
  mapPitchForAndroid,
  mapRateForAndroid,
  mapVolumeForAndroid,
} from '@/modules/speech-synthesis-lab/synth-mapping';

import type {
  SpeakArgs,
  SpeechBridgeEventEmitter,
  SpeechSynthesisBridge,
  SynthEventName,
  SynthEventPayloads,
  Voice,
  VoiceQuality,
} from './speech-synthesis.types';
import { SpeechSynthesisPauseUnsupported } from './speech-synthesis.types';

type Listener = (payload: unknown) => void;

function createEmitter(): SpeechBridgeEventEmitter & {
  emit<E extends SynthEventName>(name: E, payload: SynthEventPayloads[E]): void;
} {
  const map: Record<SynthEventName, Set<Listener>> = {
    didStart: new Set(),
    didFinish: new Set(),
    didPause: new Set(),
    didContinue: new Set(),
    didCancel: new Set(),
    willSpeakWord: new Set(),
  };
  return {
    addListener(name, listener) {
      map[name].add(listener as Listener);
      return { remove: () => map[name].delete(listener as Listener) };
    },
    removeAllListeners(name) {
      if (name) {
        map[name].clear();
      } else {
        (Object.keys(map) as SynthEventName[]).forEach((k) => map[k].clear());
      }
    },
    emit(name, payload) {
      map[name].forEach((l) => l(payload as unknown));
    },
  };
}

const events = createEmitter();

let speakingFlag = false;

interface ExpoVoice {
  identifier: string;
  name?: string;
  language: string;
  quality?: string;
}

function mapAndroidQuality(q: unknown): VoiceQuality {
  if (q == null) return 'Default';
  // expo-speech surfaces VoiceQuality.Enhanced as 'Enhanced' on devices that
  // support it; Premium is iOS-only (D-08).
  if (q === 'Enhanced') return 'Enhanced';
  return 'Default';
}

function toVoice(raw: ExpoVoice): Voice {
  return {
    id: String(raw.identifier),
    name: String(raw.name ?? raw.identifier),
    language: String(raw.language),
    quality: mapAndroidQuality(raw.quality),
    isPersonalVoice: false,
  };
}

interface BoundaryEvent {
  charIndex: number;
  charLength?: number;
}

const bridge: SpeechSynthesisBridge = {
  async availableVoices(): Promise<Voice[]> {
    try {
      const list = await Speech.getAvailableVoicesAsync();
      return Array.isArray(list) ? list.map((v) => toVoice(v as ExpoVoice)) : [];
    } catch {
      return [];
    }
  },

  async speak(args: SpeakArgs): Promise<void> {
    const text = args.text;
    return new Promise<void>((resolve) => {
      try {
        Speech.speak(text, {
          voice: args.voiceId,
          rate: mapRateForAndroid(args.rate),
          pitch: mapPitchForAndroid(args.pitch),
          volume: mapVolumeForAndroid(args.volume),
          onStart: () => {
            speakingFlag = true;
            events.emit('didStart', {});
          },
          onDone: () => {
            speakingFlag = false;
            events.emit('didFinish', {});
          },
          onStopped: () => {
            speakingFlag = false;
            events.emit('didCancel', {});
          },
          onError: () => {
            speakingFlag = false;
            events.emit('didCancel', {});
          },
          onBoundary: (ev: BoundaryEvent) => {
            events.emit('willSpeakWord', {
              range: { location: ev.charIndex, length: ev.charLength ?? 1 },
              fullText: text,
            });
          },
        } as Parameters<typeof Speech.speak>[1]);
      } catch {
        speakingFlag = false;
        events.emit('didCancel', {});
      }
      resolve();
    });
  },

  async pause(): Promise<void> {
    const pauseFn = (Speech as unknown as { pause?: () => Promise<void> | void }).pause;
    if (typeof pauseFn !== 'function') {
      throw new SpeechSynthesisPauseUnsupported();
    }
    try {
      await pauseFn.call(Speech);
      events.emit('didPause', {});
    } catch {
      throw new SpeechSynthesisPauseUnsupported();
    }
  },

  async continue(): Promise<void> {
    const resumeFn = (Speech as unknown as { resume?: () => Promise<void> | void }).resume;
    if (typeof resumeFn !== 'function') {
      throw new SpeechSynthesisPauseUnsupported();
    }
    try {
      await resumeFn.call(Speech);
      events.emit('didContinue', {});
    } catch {
      throw new SpeechSynthesisPauseUnsupported();
    }
  },

  async stop(): Promise<void> {
    try {
      await Speech.stop();
    } catch {
      // idempotent
    }
    speakingFlag = false;
  },

  isSpeaking(): boolean {
    return speakingFlag;
  },

  async requestPersonalVoiceAuthorization() {
    return 'unsupported';
  },

  events,
};

export default bridge;
