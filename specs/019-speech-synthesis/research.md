# Phase 0 Research — Speech Synthesis Module (Feature 019)

**Branch**: `019-speech-synthesis` | **Date**: 2026-04-28 | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

This document records the autonomous resolution of every NEEDS-CLARIFICATION-equivalent open question identified during the plan-phase Technical Context fill. All decisions are linked back to spec FRs / Decisions and to the active project constitution (`.specify/memory/constitution.md` v1.1.0).

---

## R-001 — AVSpeechSynthesizer permissions / Info.plist requirements

**Question**: Does `AVSpeechSynthesizer` (or `AVSpeechSynthesizer.requestPersonalVoiceAuthorization` on iOS 17+) require any `Info.plist` usage-description key, any entitlement, any App Group, or any other operator-facing app-config change?

**Decision**: **No.** Zero Info.plist keys, zero entitlements, zero `app.json` modifications. Spec D-01 / FR-040 / FR-041 / FR-042 are correct as drafted. **Therefore no Expo config plugin is shipped** (no `plugins/with-speech-synthesis/` directory).

**Rationale**:

- `AVSpeechSynthesizer` is an output-only API: it produces audio from text. It does not capture audio (no microphone access), it does not perform speech recognition (no `NSSpeechRecognitionUsageDescription`), and it does not require any privacy-protected resource. Apple's `AVSpeechSynthesizer` reference page lists no `Info.plist` requirements.
- `AVSpeechSynthesizer.requestPersonalVoiceAuthorization(_:)` (iOS 17+) is the system-prompted authorization for using a Personal Voice the user has already created in Settings. The API itself triggers the system prompt; **no Info.plist key is required to call it**. (Contrast: `SFSpeechRecognizer` in feature 018 requires `NSSpeechRecognitionUsageDescription` — that key is for a different framework and is irrelevant here.)
- `AVFoundation` is part of the iOS SDK and is linked transparently by the iOS toolchain. No `s.frameworks` declaration on the podspec is required beyond the `expo-modules-core` baseline (mirrors features 015 / 016 / 017 / 018).

**Alternatives considered**:

- *Ship a zero-key plugin "for symmetry with feature 018"*: rejected. A plugin that adds nothing is dead code that drifts. The operator install is shorter without it (one `npx expo install expo-speech` vs. install + `app.json` plugin entry).
- *Add `NSSpeechRecognitionUsageDescription` defensively*: rejected. The key is for `SFSpeechRecognizer`. Adding it for a TTS-only feature would be misleading and would force operators to translate a string they don't need.

**Citations**: Apple Developer documentation — `AVSpeechSynthesizer`, `AVSpeechSynthesizer.requestPersonalVoiceAuthorization(_:)`, App Privacy guidance (no usage-description key listed for AVSpeechSynthesizer or for Personal Voice).

---

## R-002 — AVSpeechSynthesizerDelegate surface and parameter ranges

**Question**: What delegate callbacks does the iOS bridge need, and what are the documented ranges and defaults for `rate`, `pitchMultiplier`, and `volume`?

**Decision**:

- **Delegate callbacks wired** (one JS event each):
  - `speechSynthesizer(_:didStart:)` → `didStart`
  - `speechSynthesizer(_:didFinish:)` → `didFinish`
  - `speechSynthesizer(_:didPause:)` → `didPause`
  - `speechSynthesizer(_:didContinue:)` → `didContinue`
  - `speechSynthesizer(_:didCancel:)` → `didCancel`
  - `speechSynthesizer(_:willSpeakRangeOfSpeechString:utterance:)` → `willSpeakWord` with payload `{ range: { location, length }, fullText }`
- **Parameter ranges (Apple-documented)**:
  - `rate`: `AVSpeechUtteranceMinimumSpeechRate` (`0.0`) … `AVSpeechUtteranceMaximumSpeechRate` (`1.0`), default `AVSpeechUtteranceDefaultSpeechRate` (`0.5`).
  - `pitchMultiplier`: `0.5` … `2.0`, default `1.0`.
  - `volume`: `0.0` … `1.0`, default `1.0`.
- **Mapping (D-03 / D-04 / D-05)**:
  - Rate: Slow=`0.4`, Normal=`0.5`, Fast=`0.6`. Normal matches Apple default.
  - Pitch: Low=`0.75`, Normal=`1.0`, High=`1.5`. Normal matches Apple default.
  - Volume: Low=`0.3`, Normal=`0.7`, High=`1.0`. (Normal at `0.7` for room-tone realism; High at full volume so the High segment is audibly maximal.)

**Rationale**: All mapping values sit comfortably inside Apple's documented ranges. Normal-segment values match Apple defaults so the unmodified preset behaves identically to a no-options `AVSpeechUtterance`. Slow/Fast offsets of ±0.1 around `rate=0.5` are the conventional showcase steps (large enough to be audible, small enough to remain natural). The `pitchMultiplier` Low=`0.75` / High=`1.5` is asymmetric on purpose: human pitch perception is multiplicative (octaves), so equal logarithmic distance from `1.0` would put Low at `~0.67` — `0.75` is a slightly milder Low for accessibility comfort.

**Alternatives considered**:

- *Continuous sliders instead of 3-segment controls*: rejected (D-02). Visual consistency with prior modules outweighs the demoability gain.
- *Use the `AVSpeechUtteranceDefaultSpeechRate` constant at runtime instead of hard-coding `0.5`*: deferred. The mapping table in `synth-mapping.ts` will hard-code the JS-domain numbers (`0.4` / `0.5` / `0.6`); the iOS bridge will pass them through verbatim. If a future iOS release changes `AVSpeechUtteranceDefaultSpeechRate`, we revisit.

**Citations**: Apple Developer documentation — `AVSpeechUtterance.rate`, `AVSpeechUtterance.pitchMultiplier`, `AVSpeechUtterance.volume`, `AVSpeechUtteranceDefaultSpeechRate` / `AVSpeechUtteranceMinimumSpeechRate` / `AVSpeechUtteranceMaximumSpeechRate` constants.

---

## R-003 — `expo-speech` dependency status (Android playback path)

**Question**: Is `expo-speech` already a project dependency? If not, what command installs the SDK 55-compatible version, and where is the install action recorded?

**Decision**: `expo-speech` is **NOT** currently in `package.json` dependencies (verified at plan time — see the "Dependency snapshot" appendix at the bottom of this file).

**Action item for the implement phase** (NOT performed by `/speckit.plan`):

```powershell
# Run in the worktree root; pinned by Expo SDK 55 compatibility resolver
npx expo install expo-speech
```

`npx expo install` (rather than `pnpm add expo-speech`) is mandatory: it queries Expo's per-SDK compatibility matrix and pins a version known to work with SDK 55 / RN 0.83 / React 19.2. Using raw `pnpm add` risks pulling a version compiled against a different RN ABI.

After install, record the resolved version in `package.json` and re-verify with `pnpm check`. Document the version in this file's appendix.

**Rationale**:

- D-07 in the spec mandates `expo-speech` as the Android TTS path. Android's native TTS (`android.speech.tts.TextToSpeech`) is wrapped by `expo-speech` with the right autolinking and the right typings; reimplementing it in raw Kotlin would violate Constitution principle V (test-first / minimum-viable scope) and add a Kotlin source tree this feature otherwise doesn't need.
- `expo-speech` is a long-standing first-party Expo module (since SDK 33+) and is part of Expo's SDK 55 compatibility matrix.

**Alternatives considered**:

- *Write a Kotlin bridge directly*: rejected for the reason above.
- *Skip Android TTS and disable the screen on Android*: rejected — violates Constitution principle I (Cross-Platform Parity). The cost of one dependency is dramatically lower than the cost of a degraded screen.

**Citations**: Expo SDK 55 release notes; `expo-speech` package readme; the project's existing `expo-haptics`, `expo-camera`, `expo-clipboard` precedents (all installed via `npx expo install`).

---

## R-004 — `expo-speech` API surface mapping

**Question**: How does `expo-speech` map onto the bridge contract (`availableVoices`, `speak`, `pause`, `continue`, `stop`, `isSpeaking`)?

**Decision**:

| Bridge method | `expo-speech` call | Notes |
|---|---|---|
| `availableVoices()` | `Speech.getAvailableVoicesAsync()` | Map each `Voice` → unified `Voice` shape: `id ← identifier`, `name ← name`, `language ← language`, `quality ← quality ?? 'Default'` (Android exposes `'Default'` / `'Enhanced'`; map `'Enhanced'` → `'Enhanced'`, others → `'Default'` since Android has no `'Premium'` tier). `isPersonalVoice ← false` always (Android has no Personal Voice). |
| `speak(args)` | `Speech.speak(text, opts)` | `opts.voice ← voiceId`; `opts.rate ← mapRateForAndroid(rate)`; `opts.pitch ← mapPitchForAndroid(pitch)`; `opts.volume ← mapVolumeForAndroid(volume)`; `opts.onStart` → emit `didStart`; `opts.onDone` → emit `didFinish`; `opts.onStopped` → emit `didCancel`; `opts.onPause` → emit `didPause` (when fired); `opts.onResume` → emit `didContinue` (when fired); `opts.onBoundary` → emit `willSpeakWord` (when fired). |
| `pause()` | `Speech.pause()` | Wrapped in feature-detection; if Android OEM throws or returns rejected, re-reject as `SpeechSynthesisPauseUnsupported` (FR-021). |
| `continue()` | `Speech.resume()` | Same feature-detection rule. |
| `stop()` | `Speech.stop()` | Always supported. |
| `isSpeaking()` | `Speech.isSpeakingAsync()` reduced to a boolean snapshot kept in module-local state; the bridge's `isSpeaking` is synchronous and reads that snapshot. | The snapshot is updated on every emitted event (`didStart` → true; `didFinish`/`didCancel` → false). |
| `requestPersonalVoiceAuthorization()` | n/a | Returns `'unsupported'` synchronously (D-08). |

**Rationale**: `expo-speech` is the canonical Android TTS surface in Expo SDK 55. Its callback shape (`onStart` / `onDone` / `onStopped` / `onBoundary`) maps cleanly to the iOS delegate event shape after a small adapter; the only behavioral gap is OEM-dependent pause/continue and OEM-dependent `onBoundary`, both of which the spec already accounts for (FR-021, FR-024).

**Edge cases handled**:

- *Some OEMs do not fire `onBoundary`*: highlight degrades silently (FR-024). Detected by absence of any `willSpeakWord` events during a multi-second utterance — the screen never breaks because `currentWordRange` simply stays `null`.
- *Some OEMs do not support pause/continue via `Speech.pause()` / `Speech.resume()`*: bridge re-rejects with `SpeechSynthesisPauseUnsupported`; `TransportControls` consumes the rejection once at mount-time (probe call: `await bridge.pause().then(() => bridge.continue()).catch(() => setPauseSupported(false))`) and disables both buttons (FR-021). Probe is wrapped to be a true no-op on platforms where state allows it.

**Citations**: `expo-speech` API documentation.

---

## R-005 — Web Speech API (`window.speechSynthesis`) browser support

**Question**: Does `window.speechSynthesis` work in current Chromium and Safari? Are `boundary` events fired? What's the warm-up dance for `getVoices()`?

**Decision**:

- **Playback**: Chromium and Safari both fully implement `SpeechSynthesisUtterance.speak()` / `pause()` / `resume()` / `cancel()` (SC-009). Firefox also supports them.
- **Voice enumeration**: `speechSynthesis.getVoices()` initially returns `[]` because voices load asynchronously in some browsers. The bridge subscribes to the `voiceschanged` event on `speechSynthesis` and re-emits the voice list to the hook on first non-empty fire. This is the documented pattern.
- **Boundary events**: Chromium fires `boundary` events (`SpeechSynthesisEvent.charIndex` + `charLength`) reliably; Safari fires them inconsistently (often only for English voices); Firefox is less reliable. The bridge feature-uses them when fired (emitting `willSpeakWord` with `{ range: { location: charIndex, length: charLength }, fullText: text }`) and degrades silently otherwise (FR-024 / D-11).

**Rate / pitch / volume mapping** (covered in R-007).

**Rationale**: All three platforms can ship a real TTS path with no shim, fully satisfying Constitution principle I. The graceful degradation of word highlighting on browsers that don't fire `boundary` is already envisioned in spec FR-024.

**Citations**: MDN — `SpeechSynthesis`, `SpeechSynthesisUtterance`, `SpeechSynthesisEvent`, `voiceschanged` event.

---

## R-006 — Word-boundary highlighting overlay strategy

**Question**: How do we visually highlight a substring inside a `TextInput` when React Native does not natively support per-character styling inside an editable input?

**Decision**: Render the input as a stacked composition:

1. The actual `TextInput` (focusable, editable; the source of truth for `text` state).
2. An absolutely-positioned `<View>` overlay that mirrors the input's bounds, padding, and typography exactly. Inside the overlay, render the same `text` as a single `<Text>` composed of three slices: `[0, location)` (transparent), `[location, location+length)` (highlighted), `[location+length, end)` (transparent). When the input has focus or the user is editing, the overlay is hidden via `pointerEvents="none"` — interactions go through to the `TextInput` underneath.
3. The highlight slice's background color is animated with Reanimated's `useSharedValue` + `useAnimatedStyle` (fade in on `currentWordRange` change, fade out within one frame on `null`). Reduced-motion users get a static highlight (no fade) via `useReducedMotion()`.

**Rationale**:

- React Native does not support `<Text>` runs inside `<TextInput>` on iOS or Android. The overlay-on-top pattern is the standard workaround used by syntax-highlighting components (e.g., highlight.js wrappers).
- Pixel-exact alignment requires the overlay to use the same `fontSize`, `fontFamily`, `lineHeight`, and `padding` as the `TextInput`. These values are centralized in a `TEXT_STYLE` constant in `TextInputArea.tsx` and applied to both nodes.
- The Reanimated fade is the minimum animation needed to satisfy "advances frame-aligned with audio" (SC-003) without flicker on rapid transitions; reduced-motion users still see the highlight, just without animation.

**Alternatives considered**:

- *Use a third-party rich-text input library*: rejected. Adding a dependency for one feature violates the project's "no CSS-in-JS / no utility framework" discipline (Constitution principle IV) by analogy.
- *Render finalized text as a non-editable `<Text>` while speaking, swap back to `<TextInput>` afterward*: rejected. Loses focus, scrolls, and breaks the "editing while speaking does not affect current utterance" guarantee from the Edge Cases section of the spec.

**Citations**: React Native `TextInput` documentation (no support for child `Text` runs); Reanimated 3 `useAnimatedStyle` documentation; this project's existing usage in feature 018's `MicButton.tsx`.

---

## R-007 — Cross-platform rate / pitch / volume mapping

**Question**: How do iOS-domain `rate ∈ [0,1]`, `pitch ∈ [0.5, 2]`, `volume ∈ [0,1]` translate to Android (`expo-speech`) and Web (`SpeechSynthesisUtterance`)?

**Decision**: iOS-domain values are canonical; Android and Web bridges re-map internally via pure functions in `synth-mapping.ts`.

| Param | iOS range | Android range (`expo-speech`) | Web range (`SpeechSynthesisUtterance`) | Mapping rule |
|---|---|---|---|---|
| `rate` | `[0.0, 1.0]`, default `0.5` | `[0.1, 2.0]`, default `1.0` (multiplicative) | `[0.1, 10]`, default `1.0` (multiplicative) | Android: `iosRate * 2` (so iOS Normal `0.5` → Android `1.0` = Android default). Web: `iosRate * 2` (same logic — iOS Normal → Web default). |
| `pitch` | `[0.5, 2.0]`, default `1.0` | `[0.5, 2.0]`, default `1.0` (multiplicative) | `[0, 2]`, default `1.0` (multiplicative) | Identity passthrough. iOS Low `0.75` / Normal `1.0` / High `1.5` are valid in both Android and Web ranges. |
| `volume` | `[0.0, 1.0]`, default `1.0` | n/a (`expo-speech` exposes `volume` accepting `[0,1]` on platforms that support it; ignored otherwise) | `[0, 1]`, default `1.0` | Identity passthrough. |

**Concrete Slow/Normal/Fast values per platform** (for unit-test fixtures):

| Preset | iOS `rate` | Android `rate` | Web `rate` |
|---|---|---|---|
| Slow | 0.4 | 0.8 | 0.8 |
| Normal | 0.5 | 1.0 | 1.0 |
| Fast | 0.6 | 1.2 | 1.2 |

**Concrete Low/Normal/High `pitch`** (identity, all platforms): `0.75` / `1.0` / `1.5`.
**Concrete Low/Normal/High `volume`** (identity, all platforms where supported): `0.3` / `0.7` / `1.0`.

**Rationale**: Anchoring the Normal preset to each platform's documented default minimizes the chance of unexpected behavior for first-time users (SC-001). The `*2` rate transform gives Android/Web a perceptually-similar speed step to iOS's `±0.1` step around `0.5`.

**Citations**: `expo-speech.SpeechOptions` documentation (`rate`, `pitch`, `volume`); MDN `SpeechSynthesisUtterance.rate` / `.pitch` / `.volume`.

---

## R-008 — Personal Voice (iOS 17+) detection

**Question**: How does the iOS bridge identify a Personal Voice when enumerating `AVSpeechSynthesisVoice.speechVoices()`?

**Decision**: For each `AVSpeechSynthesisVoice`, set `isPersonalVoice = voice.voiceTraits.contains(.isPersonalVoice)` (iOS 17+ only; on iOS < 17 the trait is unavailable and the field defaults to `false`). The Swift bridge wraps the trait check in an `#available(iOS 17, *)` guard; the unified `Voice` returned to JS always carries the boolean.

The hook places voices with `isPersonalVoice === true` in a dedicated "Personal Voice" section that renders **above** all language-grouped sections in `VoicePicker` (FR-009, FR-028, A.S. 5 of US-2). The section is omitted entirely when there are zero Personal Voices (no empty headers, per FR-007 / A.S. 4 of US-2).

**Rationale**: `voiceTraits` is the documented Apple API for distinguishing Personal Voices from system voices. The runtime gate (`#available(iOS 17, *)`) prevents a compiler error on the iOS 16 toolchain and a runtime crash on iOS 16 devices.

**Citations**: Apple Developer documentation — `AVSpeechSynthesisVoice.voiceTraits`, `AVSpeechSynthesisVoiceTraits.isPersonalVoice` (iOS 17+).

---

## R-009 — Validate-Before-Spec assessment (constitution v1.1.0)

**Question**: Does this feature trigger the constitution v1.1.0 Validate-Before-Spec mandate?

**Decision**: **No.** This feature does not introduce a build pipeline change, an infrastructure layer, or an external service integration. The implementation surface is:

- One Swift file using a public Apple framework (`AVSpeechSynthesizer`) that has shipped since iOS 7.
- One npm dependency (`expo-speech`) that is a long-standing first-party Expo module.
- One Web API (`window.speechSynthesis`) that has been stable across browsers for years.
- **Zero `app.json` changes**, zero plugins, zero entitlements, zero permissions.

There is nothing to validate via proof-of-concept beyond the standard `pnpm check` quality gate (FR-046 / SC-008). The plan-phase Constitution Check explicitly records this assessment.

**Citations**: `.specify/memory/constitution.md` v1.1.0, "Development Workflow" → Validate-Before-Spec clause; comparison to feature 018 (also did not trigger; same precedent).

---

## Dependency snapshot (verified at plan time)

`package.json` `dependencies` block, snapshot 2026-04-28:

```text
@expo/config-plugins ~55.0.8
@expo/ui ^55.0.12
@react-native-async-storage/async-storage 2.2.0
@react-navigation/bottom-tabs ^7.15.5
@react-navigation/elements ^2.9.10
@react-navigation/native ^7.1.33
expo ~55.0.17
expo-camera ^55.0.16
expo-clipboard ^55.0.13           ← from feature 018
expo-constants ~55.0.15
expo-device ~55.0.15
expo-font ~55.0.6
expo-glass-effect ~55.0.10
expo-haptics ~55.0.14
expo-image ~55.0.9
expo-image-picker ^55.0.19
expo-linking ~55.0.14
expo-router ~55.0.13
expo-sensors ~55.0.13
expo-splash-screen ~55.0.19
expo-status-bar ~55.0.5
expo-symbols ~55.0.7
expo-system-ui ~55.0.16
expo-web-browser ~55.0.14
react 19.2.0
react-dom 19.2.0
react-native 0.83.6
react-native-gesture-handler ~2.30.0
react-native-reanimated 4.2.1
react-native-safe-area-context ~5.6.2
react-native-screens ~4.23.0
react-native-web ~0.21.0
react-native-worklets 0.7.4
```

**Missing for this feature**: `expo-speech`. Action: `npx expo install expo-speech` during the implement phase (R-003).

---

## Summary table

| ID | Topic | Decision | Spec link |
|---|---|---|---|
| R-001 | AVSpeechSynthesizer permissions | Zero Info.plist keys; no plugin | D-01 / FR-040–042 |
| R-002 | Delegate surface + parameter ranges | 6 callbacks → 6 events; mappings inside Apple ranges | FR-029–031, D-03/D-04/D-05 |
| R-003 | `expo-speech` install | Not in deps; install via `npx expo install expo-speech` in implement phase | D-07, A-03 |
| R-004 | `expo-speech` API mapping | Method-by-method table above | FR-034, FR-021 |
| R-005 | Web Speech API support | Functional in Chromium + Safari; `voiceschanged` warm-up; `boundary` optional | D-06, FR-035, SC-009 |
| R-006 | Highlight overlay strategy | Stacked overlay over `TextInput` with Reanimated fade + reduced-motion short-circuit | FR-022–024, SC-003 |
| R-007 | Cross-platform R/P/V mapping | iOS-domain canonical; `*2` rate transform for Android & Web; pitch/volume identity | FR-017 |
| R-008 | Personal Voice detection | `voice.voiceTraits.contains(.isPersonalVoice)` under `#available(iOS 17, *)` | FR-009, FR-028, FR-030 |
| R-009 | Validate-Before-Spec assessment | Not triggered; documented per constitution v1.1.0 | Constitution v1.1.0 |
