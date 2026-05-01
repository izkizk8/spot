# Audio Session Category → `setAudioModeAsync` Options Mapping

**Phase 1 contract — Feature 020 (Audio Recording + Playback)**
**Implements**: FR-018 / FR-020 / FR-024 / FR-025 / D-09 (spec.md), R-007 (research.md)
**Consumed by**: `src/modules/audio-lab/audio-session.ts` (re-implements verbatim)

This document is the authoritative mapping table. Implementation deviations require a spec/plan/contract amendment.

---

## 1. Mapping Table

| Category | `allowsRecording` | `playsInSilentMode` | `interruptionMode` | iOS Behavior | Android Behavior | Web Behavior |
|----------|:-----------------:|:-------------------:|:------------------:|--------------|------------------|--------------|
| `Playback` | `false` | `true` | _(omitted)_ | Audio plays even when ringer is in silent mode (SC-006). Microphone NOT engaged. | Honored: `playsInSilentMode` ↔ `STREAM_MUSIC` routing. | No-op. Tooltip: "Web treats all playback as Playback-equivalent." |
| `Record` | `true` | `false` | _(omitted)_ | Microphone engaged; playback respects silent mode. | Honored: enables `RECORD_AUDIO` routing. | No-op. Tooltip: "Web record permission is requested per-recording by the browser." |
| `PlayAndRecord` | `true` | `true` | _(omitted)_ | Both record + play work; playback bypasses silent mode. **This is the default category set on screen mount (D-02 / FR-022).** | Honored. | No-op. Tooltip: "Web allows record + play concurrently by default." |
| `Ambient` | `false` | `false` | `'mixWithOthers'` | Mixes with other apps' audio (e.g., music keeps playing). Microphone NOT engaged. | Honored where Android supports `mixWithOthers` via `AudioFocusRequest` ducking config. | No-op. Tooltip: "Web does not expose audio focus." |
| `SoloAmbient` | `false` | `false` | `'duckOthers'` | Ducks other apps' audio while this app plays. Microphone NOT engaged. | Honored similarly via Android `AudioFocus` ducking. | No-op. Same tooltip as `Ambient`. |

---

## 2. Function Signature

```ts
// src/modules/audio-lab/audio-session.ts
import type { AudioModeOptions, AudioSessionCategory } from './audio-types';

export function mapCategoryToOptions(cat: AudioSessionCategory): AudioModeOptions {
  switch (cat) {
    case 'Playback':       return { allowsRecording: false, playsInSilentMode: true };
    case 'Record':         return { allowsRecording: true,  playsInSilentMode: false };
    case 'PlayAndRecord':  return { allowsRecording: true,  playsInSilentMode: true };
    case 'Ambient':        return { allowsRecording: false, playsInSilentMode: false, interruptionMode: 'mixWithOthers' };
    case 'SoloAmbient':    return { allowsRecording: false, playsInSilentMode: false, interruptionMode: 'duckOthers' };
  }
}

export async function applyCategory(cat: AudioSessionCategory): Promise<void> {
  const { setAudioModeAsync } = await import('expo-audio');
  await setAudioModeAsync(mapCategoryToOptions(cat));
}
```

The `mapCategoryToOptions` function is **pure** and **platform-agnostic** — same return value on every platform. Platform-conditional behavior (apply vs. tooltip) lives in the screen, not in the mapping. This keeps the mapping trivially unit-testable without platform mocks.

---

## 3. Default Category On Screen Mount

Per FR-022 / D-02, the default active category on first screen mount is **`PlayAndRecord`**. The Audio Session Card initializes its segmented control to `PlayAndRecord` and `applyCategory('PlayAndRecord')` is invoked once during `useEffect(() => { ... }, [])` on mount.

---

## 4. Transport-Stop-First Invariants

Per FR-024 / FR-025 / D-09, the screen MUST:

1. If `recorderStatus !== 'idle'` when the user taps **Apply**, call `recorderHook.stop()` first (which finalizes and persists the in-progress recording per the normal Stop flow), `await` its resolution, **then** call `applyCategory(newCat)`.
2. If `playerStatus === 'playing' || playerStatus === 'paused'` when the user taps **Apply**, call `playerHook.stop()` first, `await` its resolution, **then** call `applyCategory(newCat)`.
3. Both guards run in series (recorder first, then player) — they are mutually exclusive in practice but the order is documented for determinism.

The `applyCategory` wrapper itself does NOT introspect transport state; the screen is the single owner of the "stop first" invariant. This separation keeps `audio-session.ts` pure and unit-testable.

---

## 5. Test Coverage (`test/unit/modules/audio-lab/audio-session.test.ts`)

The mapping function MUST be covered by:

1. One test per category (5 tests) asserting the exact returned shape.
2. One test asserting `mapCategoryToOptions` is referentially pure (calling it twice with the same input returns deep-equal output).
3. One test asserting that omitted `interruptionMode` is `undefined` (not `null`, not `''`) for Playback / Record / PlayAndRecord.

`applyCategory` is NOT directly unit-tested in `audio-session.test.ts` because it is a one-line wrapper around `setAudioModeAsync`; instead, it is exercised through the `AudioSessionCard.test.tsx` component test with a mocked `expo-audio`.
