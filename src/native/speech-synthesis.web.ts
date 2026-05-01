/**
 * Speech-synthesis JS bridge — Web fallback over `window.speechSynthesis`.
 *
 * Feature-detects `globalThis.speechSynthesis`. When PRESENT, adapts the W3C
 * Web Speech API onto the bridge contract. When ABSENT, exports the
 * `NOOP_BRIDGE` semantics — every async method that requires speech rejects
 * with `SpeechSynthesisNotSupported`; `availableVoices()` returns [].
 *
 * @see specs/019-speech-synthesis/contracts/speech-synthesis-bridge.contract.ts
 */

import {
  mapPitchForWeb,
  mapRateForWeb,
  mapVolumeForWeb,
} from '@/modules/speech-synthesis-lab/synth-mapping';

import type {
  SpeakArgs,
  SpeechBridgeEventEmitter,
  SpeechSynthesisBridge,
  SynthEventName,
  SynthEventPayloads,
  Voice,
} from './speech-synthesis.types';
import { NOOP_BRIDGE } from './speech-synthesis.types';

interface WebVoice {
  voiceURI: string;
  name: string;
  lang: string;
}

interface WebUtterance {
  voice: WebVoice | null;
  rate: number;
  pitch: number;
  volume: number;
  text?: string;
  addEventListener?(name: string, handler: (ev: any) => void): void;
}

interface WebSynth {
  speaking: boolean;
  paused: boolean;
  pending: boolean;
  speak(utt: WebUtterance): void;
  pause(): void;
  resume(): void;
  cancel(): void;
  getVoices(): WebVoice[];
  addEventListener?(name: 'voiceschanged', cb: () => void): void;
}

interface WebUtteranceCtor {
  new (text: string): WebUtterance;
}

function getSynth(): WebSynth | null {
  const g = globalThis as unknown as { speechSynthesis?: WebSynth };
  return g.speechSynthesis ?? null;
}

function getUtteranceCtor(): WebUtteranceCtor | null {
  const g = globalThis as unknown as { SpeechSynthesisUtterance?: WebUtteranceCtor };
  return typeof g.SpeechSynthesisUtterance === 'function' ? g.SpeechSynthesisUtterance : null;
}

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

let voicesCache: WebVoice[] = [];

function refreshVoicesCache() {
  const synth = getSynth();
  if (!synth) return;
  try {
    voicesCache = synth.getVoices() ?? [];
  } catch {
    voicesCache = [];
  }
}

const initialSynth = getSynth();
if (initialSynth) {
  refreshVoicesCache();
  try {
    initialSynth.addEventListener?.('voiceschanged', refreshVoicesCache);
  } catch {
    // ignore — feature-detect already passed but listener wiring failed
  }
}

function buildPresent(synth: WebSynth, UtteranceCtor: WebUtteranceCtor): SpeechSynthesisBridge {
  const events = createEmitter();
  return {
    async availableVoices(): Promise<Voice[]> {
      refreshVoicesCache();
      return voicesCache.map((v) => ({
        id: v.voiceURI,
        name: v.name,
        language: v.lang,
        quality: 'Default',
        isPersonalVoice: false,
      }));
    },
    async speak(args: SpeakArgs): Promise<void> {
      const utt = new UtteranceCtor(args.text);
      const voice = voicesCache.find((v) => v.voiceURI === args.voiceId) ?? null;
      utt.voice = voice;
      utt.rate = mapRateForWeb(args.rate);
      utt.pitch = mapPitchForWeb(args.pitch);
      utt.volume = mapVolumeForWeb(args.volume);
      const add = utt.addEventListener?.bind(utt);
      add?.('start', () => events.emit('didStart', {}));
      add?.('end', () => events.emit('didFinish', {}));
      add?.('pause', () => events.emit('didPause', {}));
      add?.('resume', () => events.emit('didContinue', {}));
      add?.('error', () => events.emit('didCancel', {}));
      add?.('boundary', (ev: { charIndex: number; charLength?: number; name?: string }) => {
        if (ev.name && ev.name !== 'word') return;
        events.emit('willSpeakWord', {
          range: { location: ev.charIndex, length: ev.charLength ?? 1 },
          fullText: args.text,
        });
      });
      synth.speak(utt);
    },
    async pause(): Promise<void> {
      synth.pause();
    },
    async continue(): Promise<void> {
      synth.resume();
    },
    async stop(): Promise<void> {
      try {
        synth.cancel();
      } catch {
        // ignore
      }
    },
    isSpeaking(): boolean {
      return Boolean(synth.speaking);
    },
    async requestPersonalVoiceAuthorization() {
      return 'unsupported';
    },
    events,
  };
}

const synthRef = getSynth();
const ctorRef = getUtteranceCtor();

const bridge: SpeechSynthesisBridge =
  synthRef && ctorRef ? buildPresent(synthRef, ctorRef) : NOOP_BRIDGE;

export default bridge;
