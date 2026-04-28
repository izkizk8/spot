# Phase 1 — Data Model: Speech Recognition Module

This document defines the in-memory data shapes used by feature 018. The authoritative TypeScript declarations live in:

- `src/modules/speech-recognition-lab/speech-types.ts` — primitive enums, event shapes, error union, typed `Error` subclasses (the primary file)
- `src/modules/speech-recognition-lab/hooks/useSpeechSession.ts` — hook return shape (`SpeechSessionState`)
- `src/native/speech-recognition.types.ts` — re-exports from `speech-types.ts` + the `SpeechBridge` interface (covered in [contracts/](./contracts/))

This feature **does not persist anything to disk**. All state is in-memory hook state for the lifetime of the screen instance. Transcripts, partials, and audio session state all reset when the screen unmounts.

---

## 1. Authorization status

### `AuthStatus`

```ts
/**
 * The combined view of speech-recognition authorization, mirroring
 * Apple's `SFSpeechRecognizerAuthorizationStatus` enum.
 *
 *   - 'notDetermined' — user has not been prompted yet
 *   - 'denied'        — user explicitly denied; OS will not re-prompt
 *   - 'restricted'    — parental controls / device management blocks it
 *   - 'authorized'    — user granted; bridge calls may proceed
 *
 * Microphone authorization is queried separately at `start` time and
 * surfaced as an inline `SpeechAuthorizationError` (kind: 'authorization')
 * when denied — see research.md R-006.
 */
export type AuthStatus = 'notDetermined' | 'denied' | 'restricted' | 'authorized';
```

The `AuthStatusPill` component consumes this directly. The Web platform maps browser microphone-permission state into the same union (`'prompt'` → `'notDetermined'`, `'denied'` → `'denied'`, `'granted'` → `'authorized'`; `'restricted'` is iOS-only and never produced on web).

---

## 2. Recognition mode

### `RecognitionMode`

```ts
/**
 * The currently selected recognition mode.
 *
 *   - 'server'    — audio is streamed to Apple's servers; broadest locale +
 *                   device support; default; web fallback uses this.
 *   - 'on-device' — fully local recognition; per-locale, per-device
 *                   availability gated by `recognizer.supportsOnDeviceRecognition`.
 *
 * Maps to `bridge.start({ onDevice: mode === 'on-device' })`.
 * On web, mode is forced to 'server' (the segment is disabled).
 */
export type RecognitionMode = 'server' | 'on-device';
```

---

## 3. Locale

### `Locale`

```ts
/**
 * BCP-47 locale string. The picker exposes a fixed top-6 list:
 *
 *   'en-US' | 'zh-CN' | 'ja-JP' | 'es-ES' | 'fr-FR' | 'de-DE'
 *
 * The bridge's `availableLocales()` returns the platform-supported set;
 * the picker filters its top-6 list against that set.
 */
export type Locale = string;

export const TOP_LOCALES: readonly Locale[] = [
  'en-US',
  'zh-CN',
  'ja-JP',
  'es-ES',
  'fr-FR',
  'de-DE',
];
```

**Validation rules**:
- A locale not in `availableLocales()` is rendered visually disabled in the picker (FR-008).
- Selecting an unsupported locale at the picker level is impossible (the option is disabled); selecting one programmatically (test path) results in `bridge.start` rejecting with `SpeechRecognitionNotSupported`.

---

## 4. Word + transcript shapes

### `WordToken`

```ts
/**
 * A single recognized word with its confidence score in [0, 1].
 *
 *   - confidence omitted ⇒ unknown (default to 1.0 in the UI per FR-009)
 *   - confidence == 0    ⇒ Apple's "not yet computed" sentinel; the bridge
 *                          omits the field entirely so the default applies.
 *   - confidence ∈ (0, 1] ⇒ exact value, used in the per-word opacity
 *                           formula `0.4 + 0.6 * confidence` (clamped).
 */
export interface WordToken {
  word: string;
  confidence?: number;
}
```

### `PartialEvent`

```ts
/**
 * Emitted on every non-final `SFSpeechRecognitionResult` update.
 * Replaces the hook's `partial` string in its entirety.
 *
 *   transcript — the latest in-progress transcript (full string, not delta)
 *   words      — optional per-word breakdown; absent on web fallback
 */
export interface PartialEvent {
  transcript: string;
  words?: WordToken[];
}
```

### `FinalEvent`

```ts
/**
 * Emitted exactly once per recognition session, when
 * `result.isFinal == true`. Appended to the hook's `final` string and
 * resets the `partial` string.
 *
 *   isFinal — always true; included for parity with PartialEvent at the
 *             bridge boundary so a single discriminated union is possible
 *             over the wire.
 */
export interface FinalEvent {
  transcript: string;
  words?: WordToken[];
  isFinal: true;
}
```

The hook accumulates `final` as `${prevFinal}${prevFinal ? ' ' : ''}${event.transcript}` (single-space joiner; no trailing space). The accumulated `final` is what the **Copy** button writes to the clipboard.

---

## 5. Error shapes

### `SpeechErrorKind`

```ts
/**
 * The taxonomy of error kinds carried on the bridge's `error` channel.
 * The full mapping from native NSError to these kinds is research.md R-012.
 *
 *   - 'authorization' — speech-recognition or microphone permission denied
 *   - 'audioEngine'   — AVAudioSession or AVAudioEngine setup failure
 *   - 'network'       — Server-mode connectivity / Apple-server failure
 *   - 'interrupted'   — Audio session interruption (call, Siri, OS pause)
 *   - 'unavailable'   — Recognizer not available for the requested locale
 *                       (or supportsOnDeviceRecognition false when on-device requested)
 *   - 'unknown'       — Catch-all for uncategorized native errors
 */
export type SpeechErrorKind =
  | 'authorization'
  | 'audioEngine'
  | 'network'
  | 'interrupted'
  | 'unavailable'
  | 'unknown';
```

### `SpeechRecognitionError`

```ts
/**
 * The shape carried on the bridge's `error` event channel.
 * The hook surfaces this as `error: SpeechRecognitionError | null`.
 */
export interface SpeechRecognitionError {
  kind: SpeechErrorKind;
  message: string;
}
```

### Typed `Error` subclasses

These are thrown / rejected by the bridge's Promise-returning methods (in addition to the events fired on the `error` channel for mid-session failures):

```ts
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
```

Each subclass has a `readonly code` literal so consumers can branch on `err.code` without `instanceof` (useful in tests where `Error` prototype chains can be lost across module boundaries). The error union for the bridge's rejection envelope is the discriminated union over these `code` literals.

---

## 6. Hook state

### `SpeechSessionState`

```ts
/**
 * The return shape of `useSpeechSession()`.
 *
 *   partial      — latest in-progress transcript (replaced on every
 *                  partial event, reset to '' on final / start)
 *   final        — accumulated finalized transcript (appended on each
 *                  final event; preserved across mode/locale restart;
 *                  cleared by the user via the Clear button)
 *   isListening  — true between a successful start() and either stop()
 *                  or a terminal final/error event that ends the session
 *   error        — latest typed error (cleared on next successful start)
 *   start        — wraps bridge.start(...) + subscribes to events
 *   stop         — wraps bridge.stop() + unsubscribes
 */
export interface SpeechSessionState {
  partial: string;
  final: string;
  isListening: boolean;
  error: SpeechRecognitionError | null;
  start(args: { locale: Locale; onDevice: boolean }): Promise<void>;
  stop(): Promise<void>;
}
```

**State invariants** (asserted by the hook tests):
- `isListening === true` ⇒ a bridge subscription is live (the hook's internal `subscriptionToken` is non-null).
- `isListening === false` ⇒ the subscription is unsubscribed (or never subscribed).
- A terminal `final` event flips `isListening` to `false` exactly once and unsubscribes.
- A terminal `error` event flips `isListening` to `false`, sets `error`, and unsubscribes exactly once.
- Unmount during `isListening === true` calls `stop()` and unsubscribes; no `setState` calls fire after unmount (NFR-003).
- Mode/locale change while `isListening === true` triggers `await stop(); await start({ locale, onDevice });` within one event-loop tick (FR-013 / R-010); `final` is preserved, `partial` is reset.

---

## 7. Audio-session-indicator state

### `AudioSessionState`

```ts
/**
 * Visual state of the AudioSessionIndicator component. Derived from
 * `isListening` directly — no separate observable channel from the
 * bridge, because:
 *
 *   - The audio session is activated synchronously inside bridge.start
 *     (before the promise resolves), so isListening === true ⇒ active.
 *   - The audio session is deactivated synchronously inside bridge.stop
 *     (before the promise resolves), so isListening === false ⇒ inactive.
 *
 * If a future bridge ever decoupled session-state from listening-state,
 * this could be promoted to a separate observable, but per FR-011 the
 * indicator MUST update synchronously with the local listening state —
 * which is exactly what derivation provides.
 */
export type AudioSessionState = 'active' | 'inactive';

export const audioSessionStateOf = (isListening: boolean): AudioSessionState =>
  isListening ? 'active' : 'inactive';
```

---

## 8. Component prop shapes (summary)

These are not separate types; they are inline `interface` declarations in each component file. Listed here for cross-reference:

| Component | Key props |
|-----------|-----------|
| `AuthStatusPill` | `status: AuthStatus`, `onRequestPress?: () => void`, `onSettingsPress?: () => void` |
| `AudioSessionIndicator` | `state: AudioSessionState` |
| `RecognitionModePicker` | `mode: RecognitionMode`, `onDeviceAvailable: boolean`, `onModeChange: (m: RecognitionMode) => void` |
| `LocalePicker` | `locale: Locale`, `availableLocales: Locale[]`, `onLocaleChange: (l: Locale) => void`, `disabled?: boolean` |
| `TranscriptView` | `final: string`, `partial: string`, `words?: WordToken[]` |
| `MicButton` | `listening: boolean`, `disabled?: boolean`, `onPress: () => void` |
| `ActionRow` | `canCopy: boolean`, `onClear: () => void`, `onCopy: () => void` |
| `IOSOnlyBanner` | `(no props)` |

---

## 9. Reference

- Plan: [plan.md](./plan.md)
- Research: [research.md](./research.md)
- Contracts: [contracts/](./contracts/)
- Quickstart: [quickstart.md](./quickstart.md)
