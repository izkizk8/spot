# Implementation Plan: Speech Synthesis Module (AVSpeechSynthesizer / TTS)

**Branch**: `019-speech-synthesis` | **Date**: 2026-04-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/019-speech-synthesis/spec.md`

## Summary

Ship a code-complete educational module that wraps Apple's **`AVSpeechSynthesizer`** (with `AVSpeechSynthesizerDelegate` driving word-boundary highlighting via `willSpeakRangeOfSpeechString`) behind a thin `expo-modules-core` bridge, streams **didStart / didFinish / didPause / didContinue / didCancel / willSpeakWord** events from Swift to JS via `EventEmitter`, and renders a multi-line text input with quick-fill presets, a voice picker grouped by BCP-47 language with quality badges, three 3-segment controls (Rate / Pitch / Volume), four transport buttons (Speak / Pause / Continue / Stop), an animated highlighted-word overlay, and an iOS 17+ Personal Voice authorization card.

The module is **iOS-functional** and ships **real cross-platform parity** rather than degraded stubs: **Android** uses `expo-speech` (the established Expo SDK 55 TTS surface) for actual playback and voice listing; **Web** uses the browser's `window.speechSynthesis` (Web Speech API) for actual playback and voice listing. Both stubs adapt their native event surfaces to the same `didStart` / `didFinish` / `didPause` / `didContinue` / `didCancel` / `willSpeakWord` shape so the screen, hook, and components are byte-identical across platforms (FR-036). Where a platform omits a capability — Android pause/continue on some OEMs, Web word-boundary on some browsers, Personal Voice anywhere except iOS 17+ — the affected affordance is disabled (transport buttons) or omitted (`PersonalVoiceCard` not mounted at all per D-08), never errored.

The module is purely additive at the integration boundary: only `src/modules/registry.ts` (one import line + one array entry) and `package.json` / `pnpm-lock.yaml` (`expo-speech` dependency, see R-003) touch existing files. **No `app.json` mutation, no Expo config plugin, no Info.plist permission key** (D-01 / FR-040 / FR-041 / FR-042). `AVSpeechSynthesizer` and `AVSpeechSynthesizer.requestPersonalVoiceAuthorization` (iOS 17+) require zero usage-description strings — `NSSpeechRecognitionUsageDescription` belongs to `SFSpeechRecognizer` (feature 018, a different framework). This is the headline operator-friendliness story for 019 and is documented in research.md (R-001) and quickstart.md.

Technical approach:

1. **Native layer** (`native/ios/speech-synthesis/`, one Swift file + podspec):
   - `SpeechSynthesizer.swift` — exposes `availableVoices`, `speak`, `pause`, `continue`, `stop`, `isSpeaking`, `requestPersonalVoiceAuthorization` to JS via `expo-modules-core`'s `Module` DSL. Owns one `AVSpeechSynthesizer` instance and conforms to `AVSpeechSynthesizerDelegate`. `availableVoices()` enumerates `AVSpeechSynthesisVoice.speechVoices()`, mapping `AVSpeechSynthesisVoiceQuality` (`.default` / `.enhanced` / `.premium`) to the badge string and detecting Personal Voices via `voice.voiceTraits.contains(.isPersonalVoice)` (iOS 17+ only). `speak({text, voiceId, rate, pitch, volume})` constructs an `AVSpeechUtterance`, applies the requested voice (or platform default if `voiceId` is missing), clamps `rate` into `[AVSpeechUtteranceMinimumSpeechRate, AVSpeechUtteranceMaximumSpeechRate]`, clamps `pitch` into `[0.5, 2.0]` and `volume` into `[0.0, 1.0]`, and enqueues. Delegate callbacks emit JS events: `didStart` (`speechSynthesizer(_:didStart:)`), `didFinish` (`didFinish`), `didPause` (`didPause`), `didContinue` (`didContinue`), `didCancel` (`didCancel`), `willSpeakWord` (`willSpeakRangeOfSpeechString` — payload `{ range: { location, length }, fullText }`). `requestPersonalVoiceAuthorization()` returns `unsupported` synchronously on iOS < 17 (FR-030, D-08) and otherwise wraps `AVSpeechSynthesizer.requestPersonalVoiceAuthorization { … }`. All entry points wrapped in `do/catch` — no uncaught native exception may surface (mirrors 018 NFR-006).
2. **JS bridge** (`src/native/speech-synthesis.{ts,android.ts,web.ts}` + `speech-synthesis.types.ts`): typed Promise + `EventEmitter` API mirroring the 018 precedent. The iOS variant uses `requireOptionalNativeModule('SpeechSynthesis')` and adapts the native module to the bridge surface (with the same empty-emitter fallback as 018). The Android variant wraps `expo-speech`: `availableVoices()` → `Speech.getAvailableVoicesAsync()` mapped to the `Voice` shape (quality from `voice.quality` where exposed by Android TTS, otherwise `'Default'`); `speak({text, voiceId, rate, pitch, volume})` → `Speech.speak(text, { voice: voiceId, rate: mapRate(rate), pitch: mapPitch(pitch), volume: mapVolume(volume), onStart, onDone, onStopped, onBoundary })`; `pause`/`continue` → `Speech.pause()`/`Speech.resume()` when supported, otherwise reject with `SpeechSynthesisPauseUnsupported` so the screen can disable the buttons (FR-021); `stop()` → `Speech.stop()`. The `onBoundary` callback emits `willSpeakWord` if Android exposes char offset; otherwise highlight degrades silently (FR-024). The Web variant wraps `window.speechSynthesis`: `availableVoices()` reads `speechSynthesis.getVoices()` (with the standard one-tick `voiceschanged` warm-up); `speak` constructs a `SpeechSynthesisUtterance`, sets `voice` / `rate` / `pitch` / `volume` (mapped to Web ranges per R-007), wires `onstart` / `onend` / `onpause` / `onresume` / `onerror` to bridge events, and uses `onboundary` (when fired by the browser) to emit `willSpeakWord`. `requestPersonalVoiceAuthorization()` resolves to `unsupported` on Android and Web (D-08).
3. **Module UI** (`src/modules/speech-synthesis-lab/`): seven components — `TextInputArea`, `VoicePicker`, `RateControl`, `PitchControl`, `VolumeControl`, `TransportControls`, `PersonalVoiceCard` (FR-039). The session lifecycle (subscribe / unsubscribe, transport state machine `idle → speaking ⇄ paused → idle`, current-word range tracking, terminal cleanup) is owned by a `useSynthesisSession()` hook that exposes `{ status, currentWordRange, voices, selectedVoiceId, selectVoice, speak, pause, continue, stop, requestPersonalVoice, personalVoiceStatus }` (FR-037). Three platform screens (`screen.tsx`, `screen.android.tsx`, `screen.web.tsx`) compose those components — the platform differences are surfaced as conditional disabling (Android pause/continue) and conditional non-mounting (`PersonalVoiceCard` only on iOS 17+; runtime `Platform.OS === 'ios' && Number(Platform.Version) >= 17` gate, otherwise the hook reports `personalVoiceStatus === 'unsupported'` and the screen suppresses the card). The module is registered via a single import + array entry in `src/modules/registry.ts`.
4. **Speech-synth types** (`src/modules/speech-synthesis-lab/synth-types.ts`): authoritative TypeScript declarations for `Voice`, `VoiceQuality`, `TransportState`, `WordBoundaryEvent`, `PersonalVoiceAuthorizationStatus`, `SynthesisErrorKind`, `SpeechSynthesisError`, plus the typed `Error` subclasses (`SpeechSynthesisNotSupported`, `SpeechSynthesisPauseUnsupported`, `SpeechSynthesisInterrupted`). The bridge contract re-exports them.
5. **Sample texts** (`src/modules/speech-synthesis-lab/sample-texts.ts`): three locked constants — `EN_SAMPLE`, `ZH_SAMPLE`, `JA_SAMPLE` — exact strings per A-02 and FR-005/FR-006. Covered by `sample-texts.test.ts` for byte-equality (FR-006).
6. **Rate / Pitch / Volume mapping** (`src/modules/speech-synthesis-lab/synth-mapping.ts`): pure functions `ratePresetToValue`, `pitchPresetToValue`, `volumePresetToValue` returning iOS-domain numbers per D-03 / D-04 / D-05 (Slow=0.4 / Normal=0.5 / Fast=0.6, etc.). Android and Web bridge variants further re-map iOS-domain values into their own ranges via `mapRateForAndroid`, `mapRateForWeb`, etc. (R-007). All mapping logic is JS-pure and unit-tested.
7. **Highlighting**: `TextInputArea` overlays an absolutely-positioned `ThemedText` rendering the same string with a transparent base layer and a styled `<Text>` slice for the `[location, location+length)` range supplied by `currentWordRange`. The overlay uses `react-native-reanimated`'s `useDerivedValue` + a `useAnimatedStyle` block to fade highlight in/out within one frame on transport reset (FR-023). Reduced-motion preference (`useReducedMotion()`) short-circuits to a static highlight (no fade). When `currentWordRange` is `null`, the overlay is suppressed entirely (FR-024).

The change set is purely additive. No edits to features 006–018.

## Technical Context

**Language/Version**: TypeScript 5.9 strict (JS layer), Swift 5.9 (iOS native, compiled via EAS Build / macOS only — not testable on Windows).
**Primary Dependencies**: Expo SDK 55, React Native 0.83, React 19.2 (React Compiler enabled), `expo-router` (typed routes), `expo-modules-core` (native module wrapper + `EventEmitter` for delegate-event streaming), `react-native-reanimated` + `react-native-worklets` (highlight fade + reduced-motion fallback), `expo-speech` (NEW — Android playback path, see R-003), Apple `AVFoundation` (`AVSpeechSynthesizer`, iOS 7+; `AVSpeechSynthesizer.requestPersonalVoiceAuthorization`, iOS 17+). Web uses the browser's `window.speechSynthesis` and `SpeechSynthesisUtterance` (no shim).
**Storage**: None persisted. All state is in-memory hook state for the lifetime of the screen instance (D-09). No voice/rate/pitch/volume persistence, no transcript retention.
**Testing**: Jest Expo + React Native Testing Library under `test/unit/` mirroring `src/`. JS-pure layer only (`synth-types`, `sample-texts`, `synth-mapping`, `useSynthesisSession` with a mocked `EventEmitter`, all seven components, three screens with mocked bridge, bridge contract for ios/android/web variants, manifest). The Swift source is not Windows-testable; on-device verification is documented in `quickstart.md`. No new test runners (FR-043, FR-044).
**Target Platform**: iOS 7+ (functional, transport + voice picker + rate/pitch/volume + word highlighting), iOS 17+ (Personal Voice gating layer), Android (expo-speech functional + word highlighting where supported by OEM), Web (window.speechSynthesis functional in current Chromium and Safari per SC-009; word highlighting where browser fires `boundary` events).
**Project Type**: Mobile app module — additive feature inside the existing spot showcase.
**Performance Goals**:
- First audio frame within ~3 s of opening the screen on all three platforms (SC-001).
- Pause / Continue / Stop respond within 200 ms of user tap on all three platforms (SC-002).
- Highlighted-word overlay advances frame-aligned with audio for utterances ≥ 50 words on iOS (SC-003) — driven by the delegate so latency tracks the OS, not React render cost.
- Personal Voice authorization status pill updates within 1 s of system prompt completion on iOS 17+ (SC-006).
**Constraints**:
- Purely additive change set (FR-001 / FR-002 / SC-007).
- **Zero `app.json` modifications** (D-01 / FR-042 / SC-007). No plugin folder, no Info.plist key.
- Must coexist with features 014 / 015 / 016 / 017 / 018 plugins without modifying their targets, entitlements, App Groups, or existing Info.plist keys (mirrors 018 FR-028; trivially satisfied because 019 touches none of these).
- Must use the public, supported `AVSpeechSynthesizer` + `AVSpeechSynthesizerDelegate` API surface; no private API, no patched dependency.
- No code path may surface an uncaught JS exception or native crash. All bridge errors typed; the typed `error` channel of the hook is the single sink.
- Resource cleanup MUST be complete on unmount: `stop()` invoked, all listeners unsubscribed, no Jest "state update on unmounted component" warnings.
- The `PersonalVoiceCard` MUST NOT mount on iOS < 17, Android, or Web (FR-025, D-08) — runtime gate is `Platform.OS === 'ios' && Number(Platform.Version) >= 17`.
**Scale/Scope**: Single feature module — 1 Swift file, 1 podspec, 1 bridge module (3 platform variants + types), 1 hook, 7 components, 3 screens, 1 manifest, 3 pure data/mapping files, ~14 JS-pure test files. Zero bundled media; zero new permissions; zero `app.json` lines.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution version consulted: `1.1.0` (`.specify/memory/constitution.md`). FR-047 in the spec already targets `1.1.0`. The five core principles plus the v1.1.0 Validate-Before-Spec workflow guidance govern this gate.

| Principle | Status | Evidence in this plan |
|-----------|--------|-----------------------|
| **I. Cross-Platform Parity** | ✅ Pass | Module is registered for `['ios','android','web']` (FR-001). All three platforms ship a **functional** TTS path (not stubs): iOS via `AVSpeechSynthesizer`, Android via `expo-speech`, Web via `window.speechSynthesis`. The core user journey (type text → choose voice → adjust rate/pitch/volume → Speak / Pause / Continue / Stop) is interactively demonstrable on every target. Personal Voice (iOS 17+) and word-highlighting graceful-degradation are explicitly permitted as platform-specific UX improvements per the principle's allowance. |
| **II. Token-Based Theming** | ✅ Pass | All components use `ThemedText` / `ThemedView` and the `Spacing` scale from `src/constants/theme.ts`. Voice-picker section headers, quality badges, segmented-control selection, transport-button surfaces, highlighted-word background, and the Personal Voice status pill all derive from `useTheme()`; no hardcoded hex. The badge surface tokens reuse the warning/info/success surface tokens established by features 014–018. |
| **III. Platform File Splitting** | ✅ Pass | Bridge uses `speech-synthesis.ts` (iOS default) + `speech-synthesis.android.ts` + `speech-synthesis.web.ts`. Screen uses `screen.tsx` / `screen.android.tsx` / `screen.web.tsx`. The only inline `Platform.OS` / `Platform.Version` check is the single-value runtime gate for `PersonalVoiceCard` mounting (acceptable per principle: single-value differences). All non-trivial platform divergence lives in the suffixed files. |
| **IV. StyleSheet Discipline** | ✅ Pass | All component styles via `StyleSheet.create()` co-located with the component. No CSS-in-JS, no inline objects, no utility framework. The Reanimated highlight overlay uses `useAnimatedStyle` only for the fade-in/out shared value; the static overlay skeleton is a `StyleSheet.create()` style merged with the animated style — the standard Reanimated pattern. All spacing values from the `Spacing` scale. |
| **V. Test-First** | ✅ Pass | FR-044 enumerates the required test surface and Phase 1 enumerates ~14 JS-pure test files (mapping, sample-texts, types, hook with mocked emitter, all seven components, three screens with mocked bridge, bridge contract for ios/android/web, manifest). Tests are written alongside or before implementation. The Swift source is exempt from JS-side test-first because no Windows-runnable Swift test framework is configured; on-device verification is documented in `quickstart.md` per the principle's exemption clause. |

**Validate-Before-Spec** (constitution v1.1.0): This feature does not introduce a new build pipeline, infrastructure layer, or external service integration. The native pattern (`expo-modules-core` `Module` DSL + delegate-driven `EventEmitter`) is well-precedented by feature 018 (`SFSpeechRecognizer` + `EventEmitter`). The `expo-speech` Android path and the `window.speechSynthesis` Web path are mature, documented APIs feature-detected at runtime and tested with mocked globals; no novel browser-API or Android-API contract is being asserted untested. **No `app.json` change** further reduces validation surface to zero — there is no plugin to dry-run, no permission to grant, no entitlement to provision. No build / EAS proof-of-concept is required.

**Gate decision**: PASS. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/019-speech-synthesis/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── speech-synthesis-bridge.contract.ts   # JS bridge TypeScript contract
│   └── speech-synthesizer.swift.md           # Native Swift surface contract
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── modules/
│   ├── registry.ts                                   # +1 import line, +1 array entry (ONLY edit)
│   └── speech-synthesis-lab/                         # NEW
│       ├── index.tsx                                 # ModuleManifest export (id, platforms, minIOS:'7.0')
│       ├── screen.tsx                                # iOS — full functional path; PersonalVoiceCard gated at 17+
│       ├── screen.android.tsx                        # expo-speech functional path; no PersonalVoiceCard
│       ├── screen.web.tsx                            # window.speechSynthesis functional path; no PersonalVoiceCard
│       ├── synth-types.ts                            # Voice / TransportState / events / typed errors
│       ├── sample-texts.ts                           # EN_SAMPLE / ZH_SAMPLE / JA_SAMPLE constants
│       ├── synth-mapping.ts                          # ratePresetToValue / pitchPresetToValue / volumePresetToValue
│       ├── hooks/
│       │   └── useSynthesisSession.ts                # Bridge subscription + state machine owner
│       └── components/
│           ├── TextInputArea.tsx                     # Multi-line input + highlight overlay (Reanimated fade)
│           ├── VoicePicker.tsx                       # Sectioned by BCP-47 language; quality badges; PV section
│           ├── RateControl.tsx                       # 3-segment Slow / Normal / Fast
│           ├── PitchControl.tsx                      # 3-segment Low / Normal / High
│           ├── VolumeControl.tsx                     # 3-segment Low / Normal / High
│           ├── TransportControls.tsx                 # Speak / Pause / Continue / Stop with state-driven enablement
│           └── PersonalVoiceCard.tsx                 # iOS 17+ ONLY; not mounted otherwise (D-08)
└── native/
    ├── speech-synthesis.ts                           # iOS bridge (requireOptionalNativeModule + EventEmitter)
    ├── speech-synthesis.android.ts                   # expo-speech adapter
    ├── speech-synthesis.web.ts                       # window.speechSynthesis adapter
    └── speech-synthesis.types.ts                     # Re-exports from synth-types.ts + bridge interface

native/
└── ios/
    └── speech-synthesis/                             # NEW (sibling of native/ios/speech-recognition/)
        ├── SpeechSynthesizer.swift
        └── SpeechSynthesis.podspec                   # expo-modules-core registration

test/unit/
├── modules/speech-synthesis-lab/
│   ├── synth-types.test.ts
│   ├── sample-texts.test.ts
│   ├── synth-mapping.test.ts
│   ├── manifest.test.ts
│   ├── screen.test.tsx
│   ├── screen.android.test.tsx
│   ├── screen.web.test.tsx
│   ├── hooks/
│   │   └── useSynthesisSession.test.tsx
│   └── components/
│       ├── TextInputArea.test.tsx
│       ├── VoicePicker.test.tsx
│       ├── RateControl.test.tsx
│       ├── PitchControl.test.tsx
│       ├── VolumeControl.test.tsx
│       ├── TransportControls.test.tsx
│       └── PersonalVoiceCard.test.tsx
└── native/
    └── speech-synthesis.test.ts                      # Covers all three platform variants

package.json                                          # +1 dep: expo-speech (R-003)
```

**Structure Decision**: Standard spot module layout (mirrors features 006–018; `speech-recognition-lab` directly precedes this feature and is the closest reference). The triad of `native/ios/<feature>/`, `src/native/<feature>.{ts,android.ts,web.ts}`, and `src/modules/<feature>/` is the established pattern. The module slug is `speech-synthesis-lab` (matching the `-lab` convention for educational-demo modules: `coreml-lab`, `widgets-lab`, `screentime-lab`, `swift-charts-lab`, `app-intents-lab`, `sf-symbols-lab`, `speech-recognition-lab`). The bridge slug is `speech-synthesis` (no suffix, matching `speech-recognition`, `widget-center`, `screentime`, `coreml`, `vision-detector`). **There is intentionally no `plugins/with-speech-synthesis/` folder** — D-01 / FR-040 / FR-041 / FR-042 forbid it because no Info.plist key is required for `AVSpeechSynthesizer` or for `AVSpeechSynthesizer.requestPersonalVoiceAuthorization` (R-001).

## Module Boundaries & Native Bridge Contract (summary)

The contracts/ directory holds the authoritative declarations. A short summary follows so the plan reads stand-alone:

- **JS bridge → Swift / expo-speech / Web Speech**:
  - `availableVoices(): Promise<Voice[]>` — enumerates platform voices, mapped to the unified `Voice` shape (`id`, `name`, `language` BCP-47, `quality`, `isPersonalVoice`).
  - `speak(args: { text, voiceId?, rate, pitch, volume }): Promise<void>` — begins synthesis. iOS-domain values (`rate ∈ [0,1]`, `pitch ∈ [0.5, 2]`, `volume ∈ [0,1]`) are the canonical inputs; Android and Web bridges re-map internally per R-007.
  - `pause(): Promise<void>` — pauses immediately. Rejects with `SpeechSynthesisPauseUnsupported` on platforms/OEMs that don't support it (FR-021).
  - `continue(): Promise<void>` — resumes after pause. Same rejection rule.
  - `stop(): Promise<void>` — cancels current utterance immediately.
  - `isSpeaking(): boolean` — synchronous; reflects native state.
  - `requestPersonalVoiceAuthorization(): Promise<PersonalVoiceAuthorizationStatus>` — returns `'unsupported'` on iOS < 17, Android, Web (D-08, FR-030); on iOS 17+ wraps `AVSpeechSynthesizer.requestPersonalVoiceAuthorization`.
  - `events: EventEmitter` — emits `didStart`, `didFinish`, `didPause`, `didContinue`, `didCancel`, `willSpeakWord` (`{ range: { location, length }, fullText }`) (FR-031).
- **Hook → bridge** (`useSynthesisSession`): owns subscribe/unsubscribe, the transport state machine (`idle → speaking ⇄ paused → idle`), the `currentWordRange` ratchet driven by `willSpeakWord`, the voices snapshot (refreshed on mount and on `voiceschanged` for Web), and unmount teardown (calls `stop()` if still speaking). Calls `bridge.speak` / `pause` / `continue` / `stop` / `requestPersonalVoiceAuthorization`; never reads from `bridge` outside that envelope.
- **Hook → components**: exposes `{ status, currentWordRange, voices, selectedVoiceId, selectVoice, speak, pause, continue, stop, requestPersonalVoice, personalVoiceStatus }` (FR-037). `TextInputArea` consumes `currentWordRange`; `VoicePicker` consumes `voices` + `selectedVoiceId` + `selectVoice` + `personalVoiceStatus` (to render the PV section); `TransportControls` consumes `status` and the `speak`/`pause`/`continue`/`stop` callbacks; `PersonalVoiceCard` consumes `personalVoiceStatus` + `requestPersonalVoice`. The screen owns the controlled `text` state and the three preset values (`ratePreset`, `pitchPreset`, `volumePreset`) and translates them into the iOS-domain numbers via `synth-mapping.ts` immediately before calling `speak`. No component reads from `bridge` directly.

## Why No Config Plugin (D-01)

This is the most consequential delta from feature 018, which ships `plugins/with-speech-recognition/` to add two `Info.plist` keys. Feature 019 ships **zero** plugin and **zero** `Info.plist` keys.

- `AVSpeechSynthesizer` (the entire transport + voice + rate/pitch/volume + delegate-driven word-boundary surface) requires no Info.plist usage description. It does not capture audio input, does not require microphone permission, does not require speech-recognition permission. It is a pure output-only API.
- `AVSpeechSynthesizer.requestPersonalVoiceAuthorization` (iOS 17+) is gated by Apple's *system* Personal Voice setting (the user must have created a Personal Voice in Settings) and the system permission prompt the API itself triggers. **No Info.plist key is required to call it.** The `NSSpeechRecognitionUsageDescription` key (which feature 018 adds) belongs exclusively to `SFSpeechRecognizer` and is unrelated.
- `Speech.framework` and `AVFoundation` are part of the iOS SDK and linked transparently by the iOS toolchain. No podspec framework declaration needed beyond the standard `expo-modules-core` baseline (mirrors the 015/016/017/018 pattern).
- `expo-speech` (Android) ships its own autolinking and does not require any Expo config plugin in user space — operators install it with `npx expo install expo-speech` and it Just Works.
- Web uses no permissions at all.

The net consequence: feature 019's operator-facing checklist is **install the package and add the registry entry**, full stop. No plugin to register in `app.json`, no permission strings to translate, no entitlements to provision, no App Groups to configure. R-001 in `research.md` records this finding with citations.

## Phase 0: Research

Output → `research.md`. Key items:

- **R-001** — AVSpeechSynthesizer permissions/Info.plist requirements: zero. Personal Voice authorization (iOS 17+) requires no Info.plist key. Citations: Apple `AVSpeechSynthesizer` documentation, `requestPersonalVoiceAuthorization` documentation (iOS 17+), and Apple's Privacy-Manifest guidance (no usage-description key listed for AVSpeechSynthesizer or for Personal Voice). Implication: **D-01 is correct**, no plugin or `app.json` change.
- **R-002** — `AVSpeechSynthesizerDelegate` event surface and the ranges of `rate` (`[0.0, 1.0]`, default `0.5` per `AVSpeechUtteranceDefaultSpeechRate`), `pitchMultiplier` (`[0.5, 2.0]`, default `1.0`), `volume` (`[0.0, 1.0]`, default `1.0`). Implication: D-03/D-04/D-05 mappings are within Apple's documented ranges and the default-normal mapping (Normal=Apple default) is correct.
- **R-003** — `expo-speech` SDK 55 compatibility verification. **Action item for implement phase**: confirmed not currently in `package.json` dependencies; install with `npx expo install expo-speech` to let Expo resolve the SDK 55-compatible version (the install must use `npx expo install`, not raw `pnpm add`, to honor Expo's compatibility matrix). Document the resolved version in `research.md` after install.
- **R-004** — `expo-speech` API surface mapping to the bridge: `Speech.getAvailableVoicesAsync()`, `Speech.speak(text, options)`, `Speech.pause()`, `Speech.resume()`, `Speech.stop()`, `Speech.isSpeakingAsync()`. Pause/continue may be unsupported on some Android OEMs (FR-021) — the Android bridge surfaces this via `SpeechSynthesisPauseUnsupported`. `onBoundary` may not fire on all OEMs — highlight degrades silently (FR-024).
- **R-005** — Web Speech API (`window.speechSynthesis`) browser support: current Chromium and Safari fully support `getVoices()`, `SpeechSynthesisUtterance`, `pause()`, `resume()`, `cancel()`, and the `voiceschanged` event. `boundary` events are inconsistent across browsers — Chromium fires them, Safari may not for all voices (FR-024 / D-11). The bridge feature-detects and degrades silently.
- **R-006** — Word-boundary highlighting overlay strategy: an absolutely-positioned `<Text>` overlay matching the input's typography, with a styled `<Text>` slice for the `[location, location+length)` range. React Native does not natively support per-character highlighting inside a `TextInput`, so the overlay sits on top of the input (input remains the source of truth for editing). The fade-in/out is driven by Reanimated `useSharedValue` + `useAnimatedStyle`, with `useReducedMotion()` short-circuiting to a static highlight.
- **R-007** — Cross-platform rate/pitch/volume mapping: iOS-domain values are canonical (`rate ∈ [0,1]`, `pitch ∈ [0.5, 2]`, `volume ∈ [0,1]`). Android (`expo-speech`) accepts `rate ∈ [0,2]` (default 1.0) and `pitch ∈ [0,2]` (default 1.0); the Android bridge multiplies `rate` by 2 and passes `pitch` unchanged. Web (`SpeechSynthesisUtterance`) accepts `rate ∈ [0.1, 10]` (default 1.0), `pitch ∈ [0, 2]` (default 1.0), `volume ∈ [0, 1]` (default 1.0); the Web bridge multiplies `rate` by 2 and passes `pitch` and `volume` unchanged. All mapping functions are pure and unit-tested.
- **R-008** — Personal Voice (iOS 17+) detection: `AVSpeechSynthesisVoice.voiceTraits` contains `.isPersonalVoice` for Personal Voices. The voice list returned by `availableVoices()` includes them flagged with `isPersonalVoice: true`; the screen places them in a dedicated section above all language sections (FR-009 / FR-028).
- **R-009** — Validation-before-spec assessment: NOT required for this feature (no new build pipeline, no infrastructure, no external service, no `app.json` change). Documented per constitution v1.1.0 workflow guidance.

## Phase 1: Design Outputs

1. **`data-model.md`** — entities (`Voice`, `Utterance`, `WordBoundaryEvent`, `PersonalVoiceAuthorizationStatus`, `TransportState`, `RatePreset` / `PitchPreset` / `VolumePreset`), the typed error hierarchy, and the transport state machine diagram.
2. **`contracts/speech-synthesis-bridge.contract.ts`** — TypeScript contract for the JS bridge (the file at `src/native/speech-synthesis.types.ts` re-exports from this contract verbatim during implementation).
3. **`contracts/speech-synthesizer.swift.md`** — Swift surface contract listing every method, every delegate callback, every emitted JS event, and the input/output shape of each.
4. **`quickstart.md`** — operator install (one `npx expo install expo-speech`, no `app.json` edit), on-device verification steps mapped to spec user stories US-1 through US-6, and the explicit "no Info.plist key required" callout.
5. **Agent context update**: Replace the `<!-- SPECKIT START --> … <!-- SPECKIT END -->` block in `.github/copilot-instructions.md` to point to `specs/019-speech-synthesis/plan.md`.

Re-evaluation of Constitution Check after Phase 1 design: still PASS. The data model adds no new dependencies, the contracts confirm zero `app.json` change, and the quickstart documents the one-package install. No principle is touched negatively by the design artifacts.

## Phasing (informational — for /speckit.tasks)

Per the SDD lifecycle, the plan generation completes Phase 0 (research) and Phase 1 (data model + contracts + quickstart). Implementation phasing — once `/speckit.tasks` runs — will follow the spec's user-story priorities:

- **MVP slice (US-1, P1)**: End-to-end transport (Speak / Pause / Continue / Stop) on iOS. Module entry, manifest, `screen.tsx`, `useSynthesisSession`, `speech-synthesis.ts` + `SpeechSynthesizer.swift`, `TextInputArea` (without highlight overlay), `TransportControls`, `synth-types`, `synth-mapping`, `sample-texts` constants, plus the JS-pure tests for everything in scope. Validates the full pipeline (delegate → event emitter → React state → transport-button enablement) end-to-end on a real iOS device.
- **Second slice (US-2, P2)**: `VoicePicker` + `availableVoices` enumeration + selection persistence per FR-010 + fallback per FR-011. Personal Voice section appears as a placeholder (always-empty until US-6).
- **Third slice (US-3, P2)**: `RateControl`, `PitchControl`, `VolumeControl` + the wiring into `synth-mapping`. Validates D-03/D-04/D-05 numbers via on-device A/B with Apple's defaults.
- **Fourth slice (US-4, P3)**: Sample preset chips + `sample-texts` integration. Quick-fill UX for demo flow.
- **Fifth slice (US-5, P3)**: Highlighted-word overlay + `willSpeakWord` event wiring + Reanimated fade + reduced-motion short-circuit. iOS-functional; Android/Web degrade silently when boundary events are absent.
- **Sixth slice (US-6, P3)**: `PersonalVoiceCard` + `requestPersonalVoiceAuthorization` + Personal Voice section in `VoicePicker`. iOS 17+ runtime gate; non-mounted elsewhere (D-08).
- **Seventh slice (cross-platform parity)**: `screen.android.tsx` + `speech-synthesis.android.ts` (`expo-speech` adapter) + `screen.web.tsx` + `speech-synthesis.web.ts` (`window.speechSynthesis` adapter) + their mocked-bridge tests. Can technically land any time after US-1 since they share the hook + components; sequencing them last keeps the iOS feedback loop tight.

Each slice ends green under `pnpm check` (FR-046 / SC-008) and leaves the previous slice's behavior intact.

## Complexity Tracking

> No Constitution Check violations to justify. The feature stays inside the established additive-module pattern. The two atypical aspects:
>
> 1. A **delegate-driven `EventEmitter` bridge** rather than a single Promise per call. Forced by the nature of `AVSpeechSynthesizerDelegate` (continuous mid-utterance word-boundary events) and well-precedented by feature 018. The hook isolates the subscription complexity.
> 2. **Three real platform implementations** (iOS native, Android `expo-speech`, Web `speechSynthesis`) instead of iOS-functional + degraded stubs. This is a **simplification** relative to 018's `iOS-only banner` pattern: the screen, hook, and components have a single code path; only the bridge has three variants. Cross-platform parity is achieved via a shared bridge contract, not via UI conditionals.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| _(none)_ | _(n/a)_ | _(n/a)_ |
