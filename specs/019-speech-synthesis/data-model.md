# Phase 1 Data Model — Speech Synthesis Module (Feature 019)

**Branch**: `019-speech-synthesis` | **Date**: 2026-04-28 | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

This document is the authoritative data-model declaration for the JS layer of feature 019. The TypeScript declarations here are mirrored verbatim by `src/modules/speech-synthesis-lab/synth-types.ts` during implementation; the bridge contract at `contracts/speech-synthesis-bridge.contract.ts` re-exports from this contract.

All field names, value types, and union-tag strings are normative — implementation deviations require a spec/plan/data-model amendment.

---

## 1. `Voice`

A TTS voice reported by the platform. Cross-platform unified shape — every bridge variant (iOS, Android `expo-speech`, Web `speechSynthesis`) MUST emit voices conforming to this shape.

```ts
export interface Voice {
  /** Opaque platform identifier; passed back verbatim on `speak({ voiceId })`. */
  id: string;
  /** Human-readable display name as reported by the platform (no localization performed). */
  name: string;
  /**
   * BCP-47 language tag exactly as reported by the platform (e.g. `en-US`, `zh-CN`,
   * `ja-JP`). No humanization performed (D-12). The voice picker section header is
   * the raw tag.
   */
  language: string;
  /** Quality tier — see {@link VoiceQuality}. */
  quality: VoiceQuality;
  /**
   * True iff the voice is a Personal Voice the user has authorized
   * (iOS 17+ only). Always `false` on iOS < 17, Android, and Web.
   */
  isPersonalVoice: boolean;
}

export type VoiceQuality = 'Default' | 'Enhanced' | 'Premium';
```

**Source-mapping rules** (per platform):

| Field | iOS | Android (`expo-speech`) | Web (`speechSynthesis`) |
|---|---|---|---|
| `id` | `AVSpeechSynthesisVoice.identifier` | `Voice.identifier` | `SpeechSynthesisVoice.voiceURI` |
| `name` | `AVSpeechSynthesisVoice.name` | `Voice.name` | `SpeechSynthesisVoice.name` |
| `language` | `AVSpeechSynthesisVoice.language` | `Voice.language` | `SpeechSynthesisVoice.lang` |
| `quality` | `.default` → `'Default'`, `.enhanced` → `'Enhanced'`, `.premium` → `'Premium'` | `'Enhanced'` if exposed by platform; else `'Default'`. (`'Premium'` not used.) | `'Default'` always (Web Speech API has no quality tier). |
| `isPersonalVoice` | `voice.voiceTraits.contains(.isPersonalVoice)` under `#available(iOS 17, *)`; else `false` | `false` always | `false` always |

**Validation**:

- `id`: non-empty string.
- `name`: non-empty string.
- `language`: non-empty string; not validated against a BCP-47 grammar (the platform is the source of truth).
- `quality`: one of the three union values.
- `isPersonalVoice`: boolean; only ever `true` on iOS 17+.

---

## 2. `Utterance` (in-flight or queued speech request)

Conceptual entity (not a JS class). The bridge's `speak()` argument type is the on-the-wire serialization:

```ts
export interface SpeakArgs {
  /** Required; non-empty after trim. Bridge-side trim NOT performed; screen guards
   *  empty input by disabling Speak (FR-020). */
  text: string;
  /** Optional; when omitted, the platform default voice is used. */
  voiceId?: string;
  /** iOS-domain rate in [0.0, 1.0]. Canonical input across all platforms; bridge
   *  variants re-map internally per R-007. */
  rate: number;
  /** iOS-domain pitch in [0.5, 2.0]. Canonical input; identity-passthrough on
   *  Android and Web. */
  pitch: number;
  /** iOS-domain volume in [0.0, 1.0]. Canonical input; identity-passthrough where
   *  supported. */
  volume: number;
}
```

**Validation** (caller-side; the bridge clamps defensively but does not throw):

- `text`: caller MUST guard `text.trim().length > 0` before calling `speak` (FR-020).
- `rate`: clamped to `[0, 1]`.
- `pitch`: clamped to `[0.5, 2]`.
- `volume`: clamped to `[0, 1]`.

---

## 3. `WordBoundaryEvent`

Emitted by the bridge each time the platform fires a word-boundary callback (iOS delegate `willSpeakRangeOfSpeechString:utterance:`, Android `expo-speech` `onBoundary`, Web `boundary` event).

```ts
export interface WordBoundaryEvent {
  /** Character offset + length within the utterance text. */
  range: { location: number; length: number };
  /** The full utterance string the boundary applies to. Carried so the consumer
   *  doesn't have to keep its own copy in sync with rapid utterances. */
  fullText: string;
}
```

**Validation**:

- `range.location`: `>= 0` and `< fullText.length`.
- `range.length`: `> 0` and `range.location + range.length <= fullText.length`.
- Bridge implementations MUST clamp out-of-bound ranges silently (`willSpeakWord` MUST NOT cause an error event).

---

## 4. `PersonalVoiceAuthorizationStatus`

```ts
export type PersonalVoiceAuthorizationStatus =
  | 'notDetermined'
  | 'authorized'
  | 'denied'
  | 'unsupported';
```

- `'notDetermined'`: initial state on iOS 17+ before the user has been prompted.
- `'authorized'`: the user has granted Personal Voice access on iOS 17+.
- `'denied'`: the user has denied Personal Voice access on iOS 17+.
- `'unsupported'`: this device cannot use Personal Voice — iOS < 17, Android, or Web (D-08).

**State transition rules**:

- `'unsupported'` is terminal — no transition possible.
- `'notDetermined' → 'authorized'` or `'notDetermined' → 'denied'` only via `requestPersonalVoiceAuthorization()`.
- After settling on `'authorized'` or `'denied'`, no further transitions occur during the session (D-09).

---

## 5. `TransportState`

```ts
export type TransportState = 'idle' | 'speaking' | 'paused';
```

The hook owns this state and exposes it as `status`. Components consume it for button-enablement (FR-019) and for the highlight overlay's clear-on-`idle` rule (FR-023).

### Transport state machine (FR-019, FR-023)

```text
                +--------+    speak({text})       +-----------+
                |  idle  | ---------------------> |  speaking |
                +--------+                        +-----+-----+
                   ^   ^                                |  ^
        didFinish  |   | didCancel             pause()  |  | continue()
                   |   |                                v  |
                   |   |                         +----------+
                   |   +-------------------------|  paused  |
                   +-----------------stop()------+----------+
```

**Transitions**:

| From | Event / call | To | Side effects |
|---|---|---|---|
| `idle` | `speak()` resolves and `didStart` fires | `speaking` | Start receiving `willSpeakWord` events; `currentWordRange` may update. |
| `speaking` | `pause()` resolves and `didPause` fires | `paused` | Highlight remains on most recently spoken word (FR-023; A.S. 2 of US-5). |
| `paused` | `continue()` resolves and `didContinue` fires | `speaking` | `willSpeakWord` events resume. |
| `speaking` or `paused` | `stop()` resolves and `didCancel` fires | `idle` | `currentWordRange` cleared within one frame (FR-023). |
| `speaking` | `didFinish` fires (natural end) | `idle` | `currentWordRange` cleared within one frame (FR-023). |
| `paused` | (no `didFinish` from paused state — Apple/expo-speech behavior) | n/a | n/a |
| any | unmount | `idle` (component-side) | Hook calls `stop()` if status was `speaking` or `paused`; unsubscribes; clears state. |

**Invariants**:

- `currentWordRange` MUST be `null` whenever `status === 'idle'`.
- `currentWordRange` MAY be `null` while `status === 'speaking'` if the platform has not yet fired `willSpeakWord` (or never fires it — FR-024).
- `selectedVoiceId` MUST be preserved across `idle → speaking → idle` cycles (D-09 — per-screen-session persistence).

---

## 6. Rate / Pitch / Volume preset enums

```ts
export type RatePreset = 'Slow' | 'Normal' | 'Fast';
export type PitchPreset = 'Low' | 'Normal' | 'High';
export type VolumePreset = 'Low' | 'Normal' | 'High';
```

Translated to iOS-domain numbers by `synth-mapping.ts` (D-03 / D-04 / D-05):

```ts
export const RATE_PRESET_TO_IOS: Readonly<Record<RatePreset, number>> = {
  Slow: 0.4,
  Normal: 0.5,
  Fast: 0.6,
};

export const PITCH_PRESET_TO_IOS: Readonly<Record<PitchPreset, number>> = {
  Low: 0.75,
  Normal: 1.0,
  High: 1.5,
};

export const VOLUME_PRESET_TO_IOS: Readonly<Record<VolumePreset, number>> = {
  Low: 0.3,
  Normal: 0.7,
  High: 1.0,
};
```

Android-platform re-maps (R-007; consumed only by `speech-synthesis.android.ts`):

```ts
export const mapRateForAndroid = (iosRate: number): number => iosRate * 2;
export const mapPitchForAndroid = (iosPitch: number): number => iosPitch;
export const mapVolumeForAndroid = (iosVolume: number): number => iosVolume;
```

Web-platform re-maps (R-007; consumed only by `speech-synthesis.web.ts`):

```ts
export const mapRateForWeb = (iosRate: number): number => iosRate * 2;
export const mapPitchForWeb = (iosPitch: number): number => iosPitch;
export const mapVolumeForWeb = (iosVolume: number): number => iosVolume;
```

Each mapping function is pure and unit-tested in `synth-mapping.test.ts`.

---

## 7. Typed error hierarchy

```ts
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
  constructor(message?: string) { super('NotSupported', message); this.name = 'SpeechSynthesisNotSupported'; }
}
export class SpeechSynthesisPauseUnsupported extends SpeechSynthesisError {
  constructor(message?: string) { super('PauseUnsupported', message); this.name = 'SpeechSynthesisPauseUnsupported'; }
}
export class SpeechSynthesisInterrupted extends SpeechSynthesisError {
  constructor(message?: string) { super('Interrupted', message); this.name = 'SpeechSynthesisInterrupted'; }
}
```

**Rejection rules**:

| Method | Rejection conditions |
|---|---|
| `availableVoices()` | Never rejects; returns `[]` on platforms with no voices. |
| `speak(args)` | Rejects with `SpeechSynthesisNotSupported` if the platform has no TTS path (e.g., a test environment with `speechSynthesis` undefined). |
| `pause()` | Rejects with `SpeechSynthesisPauseUnsupported` on Android OEMs that don't support pause/continue. |
| `continue()` | Rejects with `SpeechSynthesisPauseUnsupported` symmetrically. |
| `stop()` | Never rejects (idempotent — calling stop on `idle` is a no-op). |
| `requestPersonalVoiceAuthorization()` | Never rejects; resolves `'unsupported'` on non-iOS-17+ platforms. |
| `isSpeaking()` | Synchronous; never throws. |

`SpeechSynthesisInterrupted` is reserved for a future enhancement (e.g., audio-session interruption events); not emitted in v1 but declared so consumers can write exhaustive switch statements once.

---

## 8. Bridge event payloads

```ts
export type SynthEventName =
  | 'didStart'
  | 'didFinish'
  | 'didPause'
  | 'didContinue'
  | 'didCancel'
  | 'willSpeakWord';

export interface SynthEventPayloads {
  didStart: { utteranceId?: string };       // utteranceId optional; reserved for queueing
  didFinish: { utteranceId?: string };
  didPause: { utteranceId?: string };
  didContinue: { utteranceId?: string };
  didCancel: { utteranceId?: string };
  willSpeakWord: WordBoundaryEvent;
}
```

The bridge's `events.addListener<E extends SynthEventName>(name: E, listener: (payload: SynthEventPayloads[E]) => void)` is typed exactly. The hook uses `addListener` for each of the six events on `start`/`speak` and the returned subscription's `.remove()` on unsubscribe / unmount.

---

## 9. Hook surface (`useSynthesisSession`)

```ts
export interface UseSynthesisSession {
  // State
  status: TransportState;                                 // idle | speaking | paused
  currentWordRange: { location: number; length: number } | null;
  voices: Voice[];
  selectedVoiceId: string | undefined;
  personalVoiceStatus: PersonalVoiceAuthorizationStatus;
  pauseSupported: boolean;                                // probed once at mount; FR-021

  // Actions
  selectVoice: (voiceId: string | undefined) => void;
  speak: (args: { text: string; rate: number; pitch: number; volume: number }) => Promise<void>;
  pause: () => Promise<void>;
  continue: () => Promise<void>;
  stop: () => Promise<void>;
  requestPersonalVoice: () => Promise<PersonalVoiceAuthorizationStatus>;
}
```

Notes:

- `speak` injects `selectedVoiceId` from hook state into the bridge call so the screen doesn't have to thread it through.
- `pauseSupported` is `true` by default and is set to `false` only after a probe at mount-time finds the bridge rejects with `SpeechSynthesisPauseUnsupported`. `TransportControls` consumes this to disable the Pause/Continue buttons (FR-021).
- The hook re-fetches `voices` once on mount, and on web subscribes to `voiceschanged` to refresh.
- On unmount, the hook calls `stop()` if `status !== 'idle'`, then unsubscribes from all event channels.

---

## 10. Manifest entry (`src/modules/speech-synthesis-lab/index.tsx`)

```ts
import type { ModuleManifest } from '@/modules/types';
import SpeechSynthesisLabScreen from './screen';

const manifest: ModuleManifest = {
  id: 'speech-synthesis-lab',
  title: 'Speech Synthesis',
  description: 'Apple AVSpeechSynthesizer text-to-speech with voice picker, rate/pitch/volume, word-highlight overlay, and iOS 17+ Personal Voice.',
  icon: { ios: 'speaker.wave.2', fallback: '🔊' },
  platforms: ['ios', 'android', 'web'],
  minIOS: '7.0',                          // FR-001 / A-06
  render: () => <SpeechSynthesisLabScreen />,
};

export default manifest;
```

Validation (covered by `manifest.test.ts`): `id` matches `/^[a-z][a-z0-9-]*$/`; `id === 'speech-synthesis-lab'`; `minIOS === '7.0'`; `platforms` includes ios / android / web; `render` is a function returning a React element.

---

## 11. Sample-text constants (`sample-texts.ts`)

```ts
export const EN_SAMPLE = 'The quick brown fox jumps over the lazy dog.';     // FR-005
export const ZH_SAMPLE = '敏捷的棕色狐狸跳过了懒狗。';                          // A-02 (Simplified Chinese)
export const JA_SAMPLE = '素早い茶色の狐が怠け者の犬を飛び越えます。';            // A-02 (Japanese)

export const SAMPLE_PRESETS = [
  { id: 'en' as const, label: 'English',  text: EN_SAMPLE },
  { id: 'zh' as const, label: 'Chinese',  text: ZH_SAMPLE },
  { id: 'ja' as const, label: 'Japanese', text: JA_SAMPLE },
];
```

Validation (covered by `sample-texts.test.ts`): exact byte equality of all three strings (FR-006); `SAMPLE_PRESETS.length === 3`; preset `text` fields equal the corresponding constants.
