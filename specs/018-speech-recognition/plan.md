# Implementation Plan: Speech Recognition Module (SFSpeechRecognizer)

**Branch**: `018-speech-recognition` | **Date**: 2026-04-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/018-speech-recognition/spec.md`

## Summary

Ship a code-complete educational module that wraps Apple's **`SFSpeechRecognizer`** (with `SFSpeechAudioBufferRecognitionRequest` driven by `AVAudioEngine`) behind a thin `expo-modules-core` bridge, streams **partial / final / error** events from Swift to JS via `EventEmitter`, and renders the live transcript with per-word confidence shading, a pulsing mic toggle (`react-native-reanimated`), an audio-session indicator, a top-6 locale picker, and a Server / On-device recognition-mode segmented control.

The module is **iOS-functional** and degrades gracefully on the other two showcase platforms: **Android** renders every UI section but disables the mic toggle behind an "iOS-only on this build" banner (no bridge calls beyond `isAvailable()`); **Web** opportunistically wires `webkitSpeechRecognition` when the browser exposes it (Chromium) so Story 5 stays interactively demonstrable, and falls back to the same iOS-only banner pattern in Firefox / non-Chromium browsers.

The dual-authorization reality (`NSSpeechRecognitionUsageDescription` **and** `NSMicrophoneUsageDescription`) and the shared-`AVAudioSession` side effect are surfaced honestly in the UI (Authorization Status pill + Audio Session indicator) and re-stated in `quickstart.md` and `research.md` (R-002 / R-006). Server vs On-device is labeled to expose the privacy/network trade-off (NFR-007) — On-device self-disables per locale based on `recognizer.supportsOnDeviceRecognition`.

Technical approach:

1. **Native layer** (`native/ios/speech-recognition/`, one Swift file):
   - `SpeechRecognizer.swift` — exposes `requestAuthorization`, `getAuthorizationStatus`, `isAvailable(locale:)`, `availableLocales`, `start(locale:onDevice:)`, `stop` to JS via `expo-modules-core`'s `Module` DSL. Owns one `SFSpeechRecognizer`, one `AVAudioEngine`, and one in-flight `SFSpeechRecognitionTask` at a time. Configures `AVAudioSession` for `.record` (`mode = .measurement`, `options = [.duckOthers]`) before installing the engine tap, and deactivates it on `stop` / on terminal events (`error` / final). Streams `SFSpeechRecognitionResult` updates as `partial` events; emits `final` when `result.isFinal`; emits `error` events with a typed `kind` for any runtime failure. Honors `onDevice` only when `recognizer.supportsOnDeviceRecognition` is true for the requested locale; rejects `start` with `SpeechRecognitionNotSupported` otherwise. All entry points wrapped in `do/catch` — no uncaught native exception may surface (NFR-006 / FR-024).
2. **JS bridge** (`src/native/speech-recognition.{ts,android.ts,web.ts}` + `speech-recognition.types.ts`): typed Promise + `EventEmitter` API mirroring the 015 / 016 / 017 precedent. `isAvailable(locale)` is synchronous; non-iOS variants return `false` (web returns `true` only when `webkitSpeechRecognition` is present). The Android stub rejects every method (other than `isAvailable` / `availableLocales`) with `SpeechRecognitionNotSupported`. The web stub feature-detects `webkitSpeechRecognition` and adapts it to the same event-emitter shape (`partial` / `final` / `error`); when absent it behaves identically to the Android stub.
3. **Module UI** (`src/modules/speech-recognition-lab/`): seven components — `AuthStatusPill`, `AudioSessionIndicator`, `RecognitionModePicker`, `LocalePicker`, `TranscriptView`, `MicButton`, `ActionRow` (Clear + Copy) — plus an `IOSOnlyBanner` shared with the Android / web screens. The session lifecycle (subscribe / unsubscribe, partial+final accumulation, terminal error handling, restart-on-mode-or-locale-change per FR-013) is owned by a `useSpeechSession()` hook that exposes `{ partial, final, isListening, error, start, stop }` to the screen. Three platform screens (`screen.tsx`, `screen.android.tsx`, `screen.web.tsx`) compose those components. The module is registered via a single import + array entry in `src/modules/registry.ts`.
4. **Speech types** (`src/modules/speech-recognition-lab/speech-types.ts`): authoritative TypeScript declarations for `AuthStatus`, `RecognitionMode`, `Locale`, `WordToken`, `PartialEvent`, `FinalEvent`, `SpeechErrorKind`, `SpeechRecognitionError`, plus the typed `Error` subclasses (`SpeechRecognitionNotSupported`, `SpeechAuthorizationError`, `SpeechAudioEngineError`, `SpeechNetworkError`, `SpeechInterrupted`). The bridge contract re-exports them.
5. **Config plugin** (`plugins/with-speech-recognition/`): single `withInfoPlist`-based mod that adds **both** `NSSpeechRecognitionUsageDescription` and `NSMicrophoneUsageDescription` if not already present (idempotent — operator-supplied values are preserved untouched, including the `NSCameraUsageDescription` added by the 017 plugin). The Apple `Speech.framework` and `AVFoundation` are part of the iOS SDK and are linked transparently by the iOS toolchain — no podspec framework declaration or Xcode-project mutation is required (R-005).
6. **Reanimated pulse**: `MicButton` uses `react-native-reanimated`'s `useSharedValue` + `withRepeat(withTiming(...))` to drive a subtle scale + opacity pulse while listening; reduced-motion preference (`useReducedMotion()`) short-circuits to a static "active" indicator (NFR-005 / FR-006).

The change set is purely additive: only `src/modules/registry.ts` (≤ 2 lines), `app.json` (one plugin entry), and `package.json` / `pnpm-lock.yaml` (`expo-clipboard`) touch existing files. No edits to features 006–017.

## Technical Context

**Language/Version**: TypeScript 5.9 strict (JS layer), Swift 5.9 (iOS native, compiled via EAS Build / macOS only — not testable on Windows).
**Primary Dependencies**: Expo SDK 55, React Native 0.83, React 19.2 (React Compiler enabled), `expo-router` (typed routes), `expo-modules-core` (native module wrapper + `EventEmitter` for partial/final/error streaming), `react-native-reanimated` + `react-native-worklets` (mic pulse), `expo-clipboard` (NEW — added via `npx expo install expo-clipboard`), Apple frameworks `Speech` (iOS 10+ for `SFSpeechRecognizer`, iOS 13+ for `supportsOnDeviceRecognition`) and `AVFoundation` (`AVAudioEngine` + `AVAudioSession`). Web uses the browser's optional `webkitSpeechRecognition` (Chromium-only).
**Storage**: None persisted. All state is in-memory hook state for the lifetime of the screen instance. No transcript persistence, no captured-audio retention, no clipboard history beyond the user's own clipboard.
**Testing**: Jest Expo + React Native Testing Library under `test/unit/` mirroring `src/`. JS-pure layer only (`speech-types`, `useSpeechSession` with a mocked `EventEmitter`, all seven components, three screens with mocked bridge, bridge contract + non-iOS stubs + web `webkitSpeechRecognition` mock, config plugin against 007 / 014 / 015 / 016 / 017 fixtures, manifest). The Swift source is not Windows-testable; on-device verification is documented in `quickstart.md`. No new test runners.
**Target Platform**: iOS 10+ (functional path; on-device gate at iOS 13+), Android (UI-only + banner), Web (Chromium = functional via `webkitSpeechRecognition`; other browsers = banner).
**Project Type**: Mobile app module — additive feature inside the existing spot showcase.
**Performance Goals**: First `partial` event arrives within ~1 s of audible speech in Server mode (NFR-001 / SC-001 / SC-004) and ~1.5 s in On-device mode on A14+ hardware. Mic-toggle visual state and Audio Session indicator transition within one render frame of user action / promise resolution (NFR-002).
**Constraints**:
- Purely additive change set (FR-035 / SC-003).
- Must coexist with features 007 / 014 / 015 / 016 / 017 plugins without modifying their targets, entitlements, App Groups, or existing `Info.plist` keys (FR-028 — including the 017 `NSCameraUsageDescription`).
- Must use the public, supported `SFSpeechRecognizer` + `AVAudioEngine` API surface; no private API, no patched dependency.
- No code path may surface an uncaught JS exception or native crash (NFR-006). All bridge errors typed; `error` channel of the hook is the single sink.
- On-device mode MUST never transmit audio (NFR-007).
- Resource cleanup MUST be complete on unmount: `stop()` invoked, audio session deactivated, all listeners unsubscribed, no Jest "state update on unmounted component" warnings (NFR-003 / SC-010).
**Scale/Scope**: Single feature module — 1 Swift file, 1 bridge module (3 platform variants + types), 1 hook, 7 components + 1 shared banner, 3 screens, 1 config plugin, 1 manifest, ~13 JS-pure test files. Zero bundled media (NFR-009: < 250 KB total feature footprint).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution version consulted: `1.1.0` (`.specify/memory/constitution.md`). The spec's FR-033 references `1.0.1` (the version in force when the spec draft was authored); the active project constitution has since been minor-bumped to `1.1.0` (added Validate-Before-Spec + spec back-patching guidance). The five core principles are unchanged and govern this gate; the new workflow guidance is addressed in the Validate-Before-Spec subsection below.

| Principle | Status | Evidence in this plan |
|-----------|--------|-----------------------|
| **I. Cross-Platform Parity** | ✅ Pass | Module is registered for `['ios','android','web']`. The screen layout — every UI section (pill, indicator, mode picker, locale picker, transcript area, mic toggle, action row) — renders on all three platforms (FR-012). The "core user journey" — "open the module, see the controls, see what they would do, read transcripts" — is interactively demonstrable on iOS (full pipeline), Chromium web (`webkitSpeechRecognition` fallback), and even on Android / Firefox the educational scaffold is intact behind the iOS-only banner. iOS-restricted behavior (running `SFSpeechRecognizer`) is permitted as a platform-specific UX improvement per the principle's allowance. |
| **II. Token-Based Theming** | ✅ Pass | All components use `ThemedText` / `ThemedView` and the `Spacing` scale from `src/constants/theme.ts`. Authorization-pill colors, mode-picker selection background, mic-button surface, and confidence-shaded transcript opacity all derive from `useTheme()`; no hardcoded hex. The iOS-only banner reuses the same warning surface tokens established by features 015 / 016 / 017. |
| **III. Platform File Splitting** | ✅ Pass | Bridge uses `speech-recognition.ts` (iOS default) + `speech-recognition.android.ts` + `speech-recognition.web.ts`. Screen uses `screen.tsx` / `screen.android.tsx` / `screen.web.tsx`. No inline `Platform.select()` for non-trivial logic; only single-value `Platform.OS === 'ios'` checks inside `isAvailable()` and the manifest declaration (acceptable per principle: single-value differences). |
| **IV. StyleSheet Discipline** | ✅ Pass | All component styles via `StyleSheet.create()` co-located with the component. No CSS-in-JS, no inline objects, no utility framework. Reanimated `useAnimatedStyle` is used only for the mic-button scale + opacity shared values (the static button skeleton is a `StyleSheet.create()` style merged with the animated style — the standard Reanimated pattern). All spacing values from the `Spacing` scale. |
| **V. Test-First** | ✅ Pass | FR-031 enumerates 13+ JS-pure test files (`useSpeechSession` with mocked `EventEmitter`, all seven components, three screens with mocked bridge, bridge contract including the `webkitSpeechRecognition` web fallback, config plugin against 007/014/015/016/017 fixtures, manifest). Tests are written alongside or before implementation. The Swift source is exempt from JS-side test-first because no Windows-runnable Swift test framework is configured; on-device verification is documented in `quickstart.md` per the principle's exemption clause for code that depends on infrastructure not yet available (a real iOS device with mic + dual permissions granted). |

**Validate-Before-Spec** (constitution v1.1.0): This feature does not introduce a new build pipeline, infrastructure layer, or external service integration. The native pattern (`expo-modules-core` `Module` DSL + `EventEmitter`), the dual-permission `Info.plist` plugin, and the `.android.ts` / `.web.ts` stub split are well-precedented by features 014 / 015 / 016 / 017. No build / EAS proof-of-concept is required. The `webkitSpeechRecognition` web fallback is feature-detected at runtime and tested with a mocked global; no novel browser-API contract is being asserted untested.

**Gate decision**: PASS. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/018-speech-recognition/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── speech-bridge.contract.ts          # JS bridge TypeScript contract
│   └── speech-recognizer.swift.md         # Native Swift surface contract
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── modules/
│   ├── registry.ts                                   # +1 import line, +1 array entry (ONLY edit)
│   └── speech-recognition-lab/                       # NEW
│       ├── index.tsx                                 # ModuleManifest export (id, platforms, minIOS:'10.0')
│       ├── screen.tsx                                # iOS — full functional path
│       ├── screen.android.tsx                        # Full UI + iOS-only banner + disabled mic
│       ├── screen.web.tsx                            # Chromium fallback OR iOS-only banner
│       ├── speech-types.ts                           # AuthStatus / RecognitionMode / events / typed errors
│       ├── hooks/
│       │   └── useSpeechSession.ts                   # Bridge subscription + state machine owner
│       └── components/
│           ├── AuthStatusPill.tsx                    # 4 statuses + Request / Settings affordance
│           ├── AudioSessionIndicator.tsx             # active / inactive
│           ├── RecognitionModePicker.tsx             # Server / On-device segmented control
│           ├── LocalePicker.tsx                      # Top-6 locales with system-locale preselect
│           ├── TranscriptView.tsx                    # Finals + partial layers, confidence shading
│           ├── MicButton.tsx                         # Reanimated pulse (reduced-motion aware)
│           ├── ActionRow.tsx                         # Clear + Copy (expo-clipboard)
│           └── IOSOnlyBanner.tsx                     # Shared with screen.android.tsx + screen.web.tsx
└── native/
    ├── speech-recognition.ts                         # iOS bridge (requireOptionalNativeModule + EventEmitter)
    ├── speech-recognition.android.ts                 # Android stub — SpeechRecognitionNotSupported
    ├── speech-recognition.web.ts                     # webkitSpeechRecognition adapter or stub
    └── speech-recognition.types.ts                   # Re-exports from speech-types.ts + bridge interface

native/
└── ios/
    └── speech-recognition/                           # NEW (sibling of native/ios/coreml/, native/ios/vision/)
        ├── SpeechRecognizer.swift
        └── SpeechRecognition.podspec                 # expo-modules-core registration

plugins/
└── with-speech-recognition/                          # NEW
    ├── index.ts                                      # Default export: ConfigPlugin (withSpeechRecognition)
    └── package.json                                  # name, main, types

test/unit/
├── modules/speech-recognition-lab/
│   ├── speech-types.test.ts
│   ├── manifest.test.ts
│   ├── screen.test.tsx
│   ├── screen.android.test.tsx
│   ├── screen.web.test.tsx
│   ├── hooks/
│   │   └── useSpeechSession.test.tsx
│   └── components/
│       ├── AuthStatusPill.test.tsx
│       ├── AudioSessionIndicator.test.tsx
│       ├── RecognitionModePicker.test.tsx
│       ├── LocalePicker.test.tsx
│       ├── TranscriptView.test.tsx
│       ├── MicButton.test.tsx
│       ├── ActionRow.test.tsx
│       └── IOSOnlyBanner.test.tsx
├── native/
│   └── speech-recognition.test.ts
└── plugins/
    └── with-speech-recognition/
        └── index.test.ts

app.json                                              # +1 plugin entry: "./plugins/with-speech-recognition"
package.json                                          # +1 dep: expo-clipboard
```

**Structure Decision**: Standard spot module layout (mirrors features 006–017). The triad of `native/ios/<feature>/`, `src/native/<feature>.{ts,android.ts,web.ts}`, and `src/modules/<feature>/` is the established pattern. The module slug is `speech-recognition-lab` (matching `coreml-lab`, `widgets-lab`, `screentime-lab`, `swift-charts-lab`, `app-intents-lab`, `sf-symbols-lab`, etc.) — the `-lab` suffix is the established convention for educational-demo modules in the showcase. The bridge slug is `speech-recognition` (no suffix, matching `widget-center`, `screentime`, `coreml`, `vision-detector`). The config-plugin slug `with-speech-recognition` matches `with-app-intents`, `with-home-widgets`, `with-live-activity`, `with-screentime`, `with-coreml`, `with-vision`.

## Module Boundaries & Native Bridge Contract (summary)

The contracts/ directory holds the authoritative declarations. A short summary follows so the plan reads stand-alone:

- **JS bridge → Swift**:
  - `requestAuthorization(): Promise<AuthStatus>` — triggers the system speech-recognition prompt; returns the resolved status.
  - `getAuthorizationStatus(): Promise<AuthStatus>` — reads current status without prompting.
  - `isAvailable(locale: string): boolean` — synchronous; `false` on non-iOS / iOS < 10 / unsupported locale.
  - `availableLocales(): string[]` — synchronous; the locales the platform recognizer supports (used to filter the top-6 list).
  - `start({ locale, onDevice }): Promise<void>` — begins the streaming session. Rejects with a typed error if the session cannot be started (authorization, audio engine, network, on-device unavailable for locale).
  - `stop(): Promise<void>` — terminates the active session and deactivates `AVAudioSession`.
  - `events: EventEmitter` — emits `partial` (`{ transcript, words? }`), `final` (`{ transcript, words?, isFinal: true }`), `error` (`{ kind: SpeechErrorKind, message }`).
- **Hook → bridge** (`useSpeechSession`): owns the subscribe / unsubscribe lifecycle, the partial+final accumulation, the `isListening` boolean, the terminal-error handling, and the unmount teardown. Calls `bridge.start` / `bridge.stop` only; never reads from `bridge` outside that envelope. Reads `bridge.isAvailable(locale)` at mount-time and short-circuits the listening UI off when false.
- **Hook → components**: exposes `{ partial, final, isListening, error, start, stop }` (FR-017). `TranscriptView` consumes `partial` + `final`; `MicButton` consumes `isListening`; `AudioSessionIndicator` consumes `isListening`; `ActionRow` consumes `final` (for Copy / Clear); the screen consumes `error` for inline error display. No component reads from `bridge` directly.

## Plugin Design

`plugins/with-speech-recognition/index.ts` is a single default-exported `ConfigPlugin` that composes one mod:

1. `withInfoPlist((config) => { … })` — sets the two required usage descriptions:
   - `NSSpeechRecognitionUsageDescription` (default: "Used to demonstrate live speech-to-text recognition")
   - `NSMicrophoneUsageDescription` (default: "Used to capture audio for live speech-to-text")

   Both are written **only if absent**. If the operator (or a prior plugin — for example, a future feature that also needs the microphone) has already supplied a value, the existing value is preserved untouched. This is the idempotency contract (FR-027) and the coexistence contract (FR-028) in one. In particular, the `NSCameraUsageDescription` added by the 017 plugin is never read or modified by 018; the two plugins target disjoint Info.plist keys.

The Apple `Speech.framework` and `AVFoundation` are part of the iOS SDK and are linked into the app target by the iOS toolchain transparently — no `s.frameworks` declaration on the podspec is required (this contrasts with the 017 plugin, which explicitly links `Vision` because it is a separately declared framework). The plugin does not add any extension target, App Group, entitlement, or capability — none are required for `SFSpeechRecognizer`. This is what makes coexistence with 007 / 014 / 015 / 016 / 017 trivially safe (FR-028): 018's plugin only ever touches `Info.plist`, and only two additive keys, and only conditionally.

## Test Strategy

Three layers, all Windows-runnable under `pnpm check` (no new test runners; standard Jest Expo + RNTL conventions established by the 017 suite):

1. **Pure-data tests**:
   - `speech-types.test.ts` — runtime construction + `instanceof` checks for the typed `Error` subclasses (`SpeechRecognitionNotSupported`, `SpeechAuthorizationError`, `SpeechAudioEngineError`, `SpeechNetworkError`, `SpeechInterrupted`); union-completeness assertion for `SpeechErrorKind`.
2. **Hook test** (`useSpeechSession`) with a mocked `EventEmitter`:
   - `start` subscribes to `partial` / `final` / `error` channels and resolves; `stop` unsubscribes and resolves; partial events update `partial`; final events append to `final` and reset the partial buffer; error events set `error` and clear `isListening`; unmount during an active session calls `stop` and unsubscribes (no Jest "state update on unmounted component" warning); re-`start` after a terminal error works correctly; mode/locale change while listening triggers the FR-013 stop+start sequence within one event-loop tick.
3. **Component + screen tests** with mocked `speech-recognition` bridge and mocked `expo-clipboard`:
   - One test file per component (`AuthStatusPill`, `AudioSessionIndicator`, `RecognitionModePicker`, `LocalePicker`, `TranscriptView`, `MicButton`, `ActionRow`, `IOSOnlyBanner`).
   - `MicButton` tests assert the reanimated pulse is enabled when `listening` and not under reduced-motion, and short-circuited when reduced-motion is on (NFR-005).
   - `TranscriptView` asserts the per-word opacity formula `0.4 + 0.6 * confidence` (clamped) and the `1.0` default for missing confidence (FR-009).
   - `LocalePicker` asserts exactly 6 locales rendered, system-locale preselected when in the list, `en-US` fallback otherwise.
   - `RecognitionModePicker` asserts the **On-device** segment renders disabled with the documented accessibility label when `onDeviceAvailable={false}`.
   - One screen test per platform variant: iOS asserts the full mic-toggle → start → partial → final → Copy → Clear flow against the mocked bridge; Android asserts banner + disabled mic + zero `bridge.start` calls; web (with `webkitSpeechRecognition` mocked present) asserts the fallback wires to the same UI; web (with `webkitSpeechRecognition` mocked absent) asserts banner + disabled mic.
4. **Bridge contract test** (`native/speech-recognition.test.ts`):
   - `isAvailable(locale)` returns boolean; `.android.ts` stub rejects with `SpeechRecognitionNotSupported` for `start`, returns `false` for `isAvailable`, returns `[]` for `availableLocales`; `.web.ts` stub adapts a mocked global `webkitSpeechRecognition` to the `partial` / `final` / `error` event shape and returns `true` for `isAvailable` in that case; rejects with `SpeechRecognitionNotSupported` when the global is undefined.
5. **Plugin test** (`plugins/with-speech-recognition/index.test.ts`) with the established config-plugin fixture pattern (precedent: `plugins/with-coreml/`, `plugins/with-screentime/`, `plugins/with-vision/`):
   - Adds `NSSpeechRecognitionUsageDescription` when missing.
   - Adds `NSMicrophoneUsageDescription` when missing.
   - Preserves existing values when present (both keys, independently).
   - Idempotent across two consecutive invocations (deep-equal on the resulting config).
   - Does not modify 007 / 014 / 015 / 016 / 017 plugin fixture outputs (run through a composed plugin chain and diff against the chain without 018; in particular, the 017 `NSCameraUsageDescription` value is preserved verbatim).
6. **Manifest test** (`manifest.test.ts`):
   - Manifest valid; `id === 'speech-recognition-lab'`; `minIOS === '10.0'`; `platforms` includes ios / android / web.

The Swift source has **no Windows-runnable test**; its behavior is asserted manually via the on-device steps in `quickstart.md` (US-1 through US-5 from the spec map directly to numbered checks).

## Phasing

Per the SDD lifecycle, the plan generation completes Phase 0 (research) and Phase 1 (data model + contracts + quickstart). Implementation phasing — once `/speckit.tasks` runs — will follow the spec's user-story priorities:

- **MVP slice (US-1, P1)**: Server-mode end-to-end. Module entry, `screen.tsx`, `useSpeechSession`, `speech-recognition.ts` + `SpeechRecognizer.swift` (Server-mode path), `MicButton`, `TranscriptView`, `AuthStatusPill` (with Request flow), `AudioSessionIndicator`, `ActionRow` (Copy + Clear), the plugin, the manifest, and the JS-pure tests for everything in scope. This slice validates the full pipeline (dual permission → audio engine → recognizer → event emitter → React state → confidence-shaded render → audio session teardown) end-to-end on a real iOS device.
- **Second slice (US-2, P2)**: `RecognitionModePicker` + the `onDevice` branch of `SpeechRecognizer.swift` (`request.requiresOnDeviceRecognition = true` when supported; reject otherwise). Self-disabling per locale.
- **Third slice (US-3, P2)**: `LocalePicker` + the locale-aware `availableLocales` filter + the FR-013 stop+restart-on-locale-change flow. The bridge already accepts `locale` from US-1; this slice wires the picker.
- **Fourth slice (US-4, P2)**: Authorization handling completeness — `denied` / `restricted` paths, the Settings deep-link affordance, the inline microphone-denied error surfaced through the `error` channel. (US-1 covered the `notDetermined` → `authorized` happy path.)
- **Fifth slice (US-5, P2)**: `screen.android.tsx`, `screen.web.tsx`, `IOSOnlyBanner`, the `webkitSpeechRecognition` adapter in `speech-recognition.web.ts`, and the corresponding tests. (These can technically land before US-2 / US-3 / US-4 since they are independent surface area; sequencing them last keeps the device-verification feedback loop tight on the iOS path.)

Each slice ends green under `pnpm check` and leaves the previous slice's behavior intact.

## Complexity Tracking

> No Constitution Check violations to justify. The feature stays inside the established additive-module pattern. The single atypical aspect — a **streaming `EventEmitter` bridge** rather than a single Promise per analyze cycle — is forced by the nature of `SFSpeechRecognizer` (continuous mid-session updates) and is well-precedented by `expo-modules-core`'s documented `EventEmitter` API; the hook's subscribe/unsubscribe contract isolates this complexity to a single file (`useSpeechSession.ts`) covered by JS-pure tests with a mocked emitter.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| _(none)_ | _(n/a)_ | _(n/a)_ |
