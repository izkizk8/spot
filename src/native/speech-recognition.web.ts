/**
 * Speech-recognition JS bridge — Web fallback.
 *
 * Feature-detects `globalThis.webkitSpeechRecognition`:
 *   - ABSENT → mirrors the Android stub (every async method rejects with
 *     `SpeechRecognitionNotSupported`; `isAvailable` returns false).
 *   - PRESENT → adapts the WebKit API surface onto the bridge contract:
 *     start() constructs the recognizer, wires `onresult`/`onerror` onto
 *     the bridge's event channel; stop() proxies to the native stop().
 *     `onDevice: true` is silently coerced (server-only on web per FR-023).
 *
 * @see specs/018-speech-recognition/contracts/speech-bridge.contract.ts
 */

import type {
  FinalEvent,
  Locale,
  PartialEvent,
  SpeechBridge,
  SpeechBridgeEventEmitter,
  SpeechBridgeEventName,
  SpeechErrorKind,
  SpeechRecognitionError,
} from './speech-recognition.types';
import { SpeechRecognitionNotSupported } from './speech-recognition.types';

const TOP_LOCALES: Locale[] = ['en-US', 'zh-CN', 'ja-JP', 'es-ES', 'fr-FR', 'de-DE'];

interface WebkitResultEntry {
  transcript: string;
  confidence?: number;
}

interface WebkitResultList {
  [index: number]: WebkitResultEntry;
  length: number;
  isFinal: boolean;
}

interface WebkitResultEvent {
  results: WebkitResultList[];
  resultIndex: number;
}

interface WebkitErrorEvent {
  error?: string;
  message?: string;
}

interface WebkitRecognition {
  start(): void;
  stop(): void;
  abort?(): void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((ev: WebkitResultEvent) => void) | null;
  onerror: ((ev: WebkitErrorEvent) => void) | null;
  onend: ((ev: unknown) => void) | null;
  onstart: ((ev: unknown) => void) | null;
}

type WebkitCtor = new () => WebkitRecognition;

function getWebkitCtor(): WebkitCtor | null {
  const g = globalThis as unknown as { webkitSpeechRecognition?: WebkitCtor };
  return typeof g.webkitSpeechRecognition === 'function' ? g.webkitSpeechRecognition : null;
}

// ---------------------------------------------------------------------------
// Local event emitter (the bridge owns its own channel; native EventEmitter
// from expo-modules-core is iOS-only).
// ---------------------------------------------------------------------------

type Listener = (payload: unknown) => void;

function createEmitter(): SpeechBridgeEventEmitter & {
  emit: (name: SpeechBridgeEventName, payload: unknown) => void;
} {
  const map: Record<SpeechBridgeEventName, Set<Listener>> = {
    partial: new Set(),
    final: new Set(),
    error: new Set(),
  };
  return {
    addListener(name, listener) {
      const set = map[name];
      set.add(listener as Listener);
      return { remove: () => set.delete(listener as Listener) };
    },
    removeAllListeners(name) {
      if (name) map[name].clear();
      else (Object.keys(map) as SpeechBridgeEventName[]).forEach((k) => map[k].clear());
    },
    emit(name, payload) {
      map[name].forEach((l) => l(payload));
    },
  };
}

const events = createEmitter();

// ---------------------------------------------------------------------------
// WebKit error → SpeechErrorKind mapping (R-012)
// ---------------------------------------------------------------------------

function mapWebkitError(code: string | undefined): SpeechErrorKind {
  switch (code) {
    case 'no-speech':
    case 'audio-capture':
      return 'audioEngine';
    case 'not-allowed':
    case 'service-not-allowed':
      return 'authorization';
    case 'network':
      return 'network';
    case 'aborted':
      return 'interrupted';
    default:
      return 'unknown';
  }
}

// ---------------------------------------------------------------------------
// Active webkit instance — at most one session at a time.
// ---------------------------------------------------------------------------

let activeRecognition: WebkitRecognition | null = null;

function buildPartial(result: WebkitResultList): PartialEvent {
  const first = result[0];
  return { transcript: first?.transcript ?? '' };
}

function buildFinal(result: WebkitResultList): FinalEvent {
  const first = result[0];
  return { transcript: first?.transcript ?? '', isFinal: true };
}

const bridge: SpeechBridge = {
  isAvailable(_locale: Locale) {
    return getWebkitCtor() != null;
  },

  availableLocales() {
    return getWebkitCtor() != null ? [...TOP_LOCALES] : [];
  },

  async requestAuthorization() {
    if (getWebkitCtor() == null) throw new SpeechRecognitionNotSupported();
    // Browser surfaces the mic prompt at start() time.
    return 'authorized';
  },

  async getAuthorizationStatus() {
    if (getWebkitCtor() == null) throw new SpeechRecognitionNotSupported();
    return 'notDetermined';
  },

  async start({ locale }: { locale: Locale; onDevice: boolean }) {
    const Ctor = getWebkitCtor();
    if (Ctor == null) throw new SpeechRecognitionNotSupported();

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = locale;

    recognition.onresult = (ev: WebkitResultEvent) => {
      const results = ev.results;
      if (!results || results.length === 0) return;
      // Iterate from resultIndex to surface any new final/partial results.
      for (let i = ev.resultIndex ?? 0; i < results.length; i++) {
        const r = results[i];
        if (!r) continue;
        if (r.isFinal) {
          events.emit('final', buildFinal(r));
        } else {
          events.emit('partial', buildPartial(r));
        }
      }
    };

    recognition.onerror = (ev: WebkitErrorEvent) => {
      const payload: SpeechRecognitionError = {
        kind: mapWebkitError(ev.error),
        message: ev.message ?? ev.error ?? 'webkitSpeechRecognition error',
      };
      events.emit('error', payload);
    };

    recognition.onend = () => {
      if (activeRecognition === recognition) activeRecognition = null;
    };

    activeRecognition = recognition;
    recognition.start();
  },

  async stop() {
    if (getWebkitCtor() == null) throw new SpeechRecognitionNotSupported();
    if (activeRecognition) {
      try {
        activeRecognition.stop();
      } catch {
        // ignore — webkit may throw if already stopped
      }
      activeRecognition = null;
    }
  },

  events,
};

export default bridge;
