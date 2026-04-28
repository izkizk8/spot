---
description: "Dependency-ordered task list for feature 018 — Speech Recognition Module (`speech-recognition-lab`)"
---

# Tasks: Speech Recognition Module (`speech-recognition-lab`)

**Input**: Design documents from `/specs/018-speech-recognition/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/speech-bridge.contract.ts, contracts/speech-recognizer.swift.md, quickstart.md

**Tests**: REQUIRED. FR-031 + Constitution Principle V mandate JS-pure tests for `speech-types`, the `useSpeechSession` hook (with a mocked `EventEmitter`), the JS bridge (3 platform variants including the `webkitSpeechRecognition` web fallback), the config plugin, every component, every screen variant, and the manifest. The Swift source `SpeechRecognizer.swift` is not Windows-testable; on-device verification is documented in `quickstart.md`.

**Organization**: Tasks are grouped by user story so each story can be implemented, tested, and demoed independently. Within each story, tests precede implementation (TDD: RED → GREEN → REFACTOR).

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Different file, no ordering dependency on any incomplete task — safe to run in parallel.
- **[Story]**: User story tag (US1 / US2 / US3 / US4 / US5). Setup, Foundational, and Polish phases carry no story tag.
- Every task lists the **exact** file path it touches and references the FR / NFR / SC IDs it satisfies.

## Path Conventions

Paths are relative to the repository root (`C:\Users\izkizk8\spot-018-speech-recognition\`). The feature touches:

- `src/modules/speech-recognition-lab/` — JS module (manifest + 3 screen variants + hook + 7 components + IOSOnlyBanner + speech-types)
- `src/native/speech-recognition*.ts` — JS bridge (iOS default + Android stub + Web `webkitSpeechRecognition` adapter + types)
- `plugins/with-speech-recognition/` — TS Expo config plugin (idempotent dual `Info.plist` key injection)
- `native/ios/speech-recognition/` — Swift source + podspec (not Windows-testable)
- `test/unit/modules/speech-recognition-lab/`, `test/unit/native/`, `test/unit/plugins/with-speech-recognition/` — Jest tests
- `src/modules/registry.ts`, `app.json`, `package.json` — single-line additive edits (only existing files touched; FR-035)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Branch verification, install `expo-clipboard`, and create the directory skeleton expected by every later phase. No production code yet.

- [x] T001 Verify on branch `018-speech-recognition` (`git rev-parse --abbrev-ref HEAD`) and the working tree is clean except for `specs/018-speech-recognition/` (FR-035)
- [x] T002 Install `expo-clipboard` via the SDK-aligned installer: run `npx expo install expo-clipboard` from the repo root; verify `package.json` and `pnpm-lock.yaml` updated and `expo-clipboard` resolves at the SDK 55-pinned version (FR-030, SC-003)
- [x] T003 [P] Create directories `src/modules/speech-recognition-lab/`, `src/modules/speech-recognition-lab/components/`, and `src/modules/speech-recognition-lab/hooks/` (FR-003, FR-004)
- [x] T004 [P] Ensure directory `src/native/` exists for the new `speech-recognition` bridge variants (no files yet — scaffolded in Foundational)
- [x] T005 [P] Create directory `plugins/with-speech-recognition/` (FR-026)
- [x] T006 [P] Create directory `native/ios/speech-recognition/` (FR-025)
- [x] T007 [P] Create test directories `test/unit/modules/speech-recognition-lab/components/`, `test/unit/modules/speech-recognition-lab/hooks/`, `test/unit/native/`, `test/unit/plugins/with-speech-recognition/` (FR-031)

**Checkpoint**: Branch verified, `expo-clipboard` installed, empty skeleton ready. No imports resolve yet — that is expected.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Ship the cross-cutting pieces every user story depends on — shared `speech-types` (typed errors + event shapes), the JS bridge (3 platform variants) wired to the contract surface but with per-feature behavior left as TODOs, the Swift native scaffold + podspec, the config plugin (idempotent dual-key `Info.plist` mod), the `IOSOnlyBanner` shared component, the manifest, and the registry / app.json wiring.

**⚠️ CRITICAL**: No user story phase can begin until this phase is complete. The bridge and types are imported by every component; the plugin is required for any iOS build to grant speech + microphone permission; the registry edit is required for the module to appear in the grid.

### Foundational Tests (write FIRST, must FAIL before implementation)

- [x] T008 [P] Write speech-types test `test/unit/modules/speech-recognition-lab/speech-types.test.ts`: covers union completeness for `AuthStatus`, `RecognitionMode`, `SpeechErrorKind`; runtime `instanceof` for `SpeechRecognitionNotSupported`, `SpeechAuthorizationError`, `SpeechAudioEngineError`, `SpeechNetworkError`, `SpeechInterrupted`; each error class exposes `readonly code` literal and `name` matches the class name (FR-024, NFR-006, NFR-008)
- [x] T009 [P] Write JS bridge contract test `test/unit/native/speech-recognition.test.ts` (default + `.android.test.ts` + `.web.test.ts` siblings) asserting:
  - `isAvailable(locale)` is synchronous; returns `false` on `Platform.OS !== 'ios'` unless web `webkitSpeechRecognition` is mocked-present
  - `availableLocales()` returns `[]` on android/web-without-webkit; returns array on iOS with native module mocked-present
  - `requestAuthorization()` and `start({ locale, onDevice })` reject with `SpeechRecognitionNotSupported` on android stub
  - `start(...)` on web stub with `webkitSpeechRecognition` mocked-absent rejects with `SpeechRecognitionNotSupported`
  - On iOS with the optional native module mocked present, `start({ locale: 'en-US', onDevice: false })` delegates through to the mocked native call; `events` is an `EventEmitter` instance
  - On web with `webkitSpeechRecognition` mocked-present, `start(...)` constructs the recognizer, wires `onresult` → `partial` / `final` events, `onerror` → `error` event with `kind: 'unknown'` mapped, and forces `onDevice: false` (FR-023)
  - Use jest mocking of `requireOptionalNativeModule`, `Platform`, and a global `webkitSpeechRecognition` constructor (FR-020, FR-021, FR-022, FR-023, FR-024)
- [x] T010 [P] Write config plugin test `test/unit/plugins/with-speech-recognition/index.test.ts` asserting against fixture Expo configs:
  - Adds `NSSpeechRecognitionUsageDescription` with the default copy ("Used to demonstrate live speech-to-text recognition") when the key is absent (FR-026)
  - Adds `NSMicrophoneUsageDescription` with the default copy ("Used to capture audio for live speech-to-text") when the key is absent (FR-026)
  - Preserves an existing `NSSpeechRecognitionUsageDescription` value when present (does not overwrite operator-supplied copy; FR-026)
  - Preserves an existing `NSMicrophoneUsageDescription` value when present (FR-026)
  - Idempotent: running the plugin twice on the same config produces deep-equal output (FR-027, SC-008)
  - Coexists with feature 007's `LiveActivityWidget` target, feature 014's `HomeWidget` target, feature 015's `DeviceActivityMonitorExtension` target, feature 016's CoreML config, and feature 017's `NSCameraUsageDescription` without collision (FR-028, SC-009)
  - Does not modify any entitlements, App Groups, extension targets, or the 017 `NSCameraUsageDescription` value
- [x] T011 [P] Write manifest test `test/unit/modules/speech-recognition-lab/manifest.test.ts`: manifest `id === 'speech-recognition-lab'`, `platforms` includes `'ios'`, `'android'`, `'web'`, `minIOS === '10.0'`, `screen` reference resolves (FR-001, FR-003, FR-004)
- [x] T012 [P] Write `IOSOnlyBanner` test `test/unit/modules/speech-recognition-lab/components/IOSOnlyBanner.test.tsx`: renders the banner copy ("Speech Recognition is iOS-only on this build"); uses `ThemedText` / `ThemedView`; sets `accessibilityRole="alert"`; uses the `Spacing` scale (FR-012, NFR-004)
- [x] T013 [P] Write `AuthStatusPill` test `test/unit/modules/speech-recognition-lab/components/AuthStatusPill.test.tsx`: renders one of four labels per `status` prop (`notDetermined` / `denied` / `restricted` / `authorized`) with corresponding color tokens; **Request** button visible only when `status === 'notDetermined'`; tapping invokes `onRequestPress` exactly once; pill exposes `accessibilityRole` + `accessibilityState` for screen readers (FR-010, NFR-004)
- [x] T014 [P] Write `AudioSessionIndicator` test `test/unit/modules/speech-recognition-lab/components/AudioSessionIndicator.test.tsx`: renders **active** vs **inactive** per `active` prop with distinct visual + accessible state; reduced-motion respected if any indicator animation is used; accessible label updates synchronously with the `active` prop (FR-011, NFR-002, NFR-004, NFR-005)

### Foundational Implementation

- [x] T015 [P] Implement `src/modules/speech-recognition-lab/speech-types.ts` per `data-model.md` and `contracts/speech-bridge.contract.ts`: export `AuthStatus`, `RecognitionMode`, `Locale`, `WordToken`, `PartialEvent`, `FinalEvent`, `SpeechErrorKind`, `SpeechRecognitionError`, and the typed `Error` subclasses (`SpeechRecognitionNotSupported`, `SpeechAuthorizationError`, `SpeechAudioEngineError`, `SpeechNetworkError`, `SpeechInterrupted`) — each with `readonly code` literal and `name` matching the class name; makes T008 pass (FR-024, NFR-006, NFR-008)
- [x] T016 [P] Create shared bridge types `src/native/speech-recognition.types.ts` per `contracts/speech-bridge.contract.ts`: re-export the value types from `speech-types.ts`; declare and export the `SpeechBridge` interface (`requestAuthorization`, `getAuthorizationStatus`, `isAvailable`, `availableLocales`, `start`, `stop`, `events: EventEmitter`); re-export the typed error classes — supports T009 (FR-020, FR-021, FR-024)
- [x] T017 Implement iOS JS bridge `src/native/speech-recognition.ts` using `requireOptionalNativeModule('SpeechRecognition')`; `isAvailable(locale)` returns `Platform.OS === 'ios' && nativeModule != null` synchronously (with optional locale check delegated to native when present); `availableLocales()` proxies to native; `requestAuthorization` / `getAuthorizationStatus` / `start` / `stop` delegate to the native module's async functions; `events` exposes an `EventEmitter` constructed from the native module; on `nativeModule == null`, every async method rejects with `new SpeechRecognitionNotSupported()` — partially makes T009 pass (depends on T016) (FR-020, FR-021, FR-024)
- [x] T018 [P] Implement Android stub `src/native/speech-recognition.android.ts`: `isAvailable() => false`, `availableLocales() => []`, `requestAuthorization` / `getAuthorizationStatus` / `start` / `stop` reject with `new SpeechRecognitionNotSupported()`; `events` is an empty `EventEmitter` that never emits — completes android assertions in T009 (depends on T016) (FR-022, FR-024)
- [x] T019 [P] Implement Web stub scaffold `src/native/speech-recognition.web.ts`: feature-detect `(globalThis as any).webkitSpeechRecognition`; when absent, mirrors the android stub (returns false from `isAvailable`, rejects all async with `SpeechRecognitionNotSupported`); when present, exports the no-op skeleton (constructor wiring is implemented in US5 — leave a `// TODO US5: wire webkitSpeechRecognition` marker for now); `events` is an `EventEmitter`; ensures bridge contract surface compiles — partially supports T009 (depends on T016) (FR-023, FR-024)
- [x] T020 [P] Create Swift `native/ios/speech-recognition/SpeechRecognizer.swift` scaffold per `contracts/speech-recognizer.swift.md`: `import ExpoModulesCore / Speech / AVFoundation`; `public class SpeechRecognizerModule: Module` with `Name("SpeechRecognition")`, `Events("partial", "final", "error")`, and `AsyncFunction` declarations for `requestAuthorization`, `getAuthorizationStatus`, `isAvailable(locale:)`, `availableLocales`, `start({locale,onDevice})`, `stop`. Bodies left as `// TODO US1: wire SFSpeechRecognizer` markers; entry points wrapped in `do/catch`; declare `SpeechAuthorizationError`, `SpeechAudioEngineError`, `SpeechNetworkError`, `SpeechInterrupted`, `SpeechRecognitionNotSupported` typed-throw helpers per the contract (NFR-006, FR-024, FR-025) — scaffold-only, not unit-testable on Windows
- [x] T021 [P] Create `native/ios/speech-recognition/SpeechRecognition.podspec`: `s.name = 'SpeechRecognition'`, `s.platforms = { :ios => '10.0' }`, `s.source_files = '*.swift'`, `s.dependency 'ExpoModulesCore'`, `s.swift_version = '5.9'`. No `s.frameworks` declaration — `Speech.framework` and `AVFoundation` are part of the iOS SDK and linked transparently (research R-005). (FR-025)
- [x] T022 [P] Create plugin entry point `plugins/with-speech-recognition/index.ts`: default-exported `ConfigPlugin` named `withSpeechRecognition` that composes a single `withInfoPlist` mod which sets `NSSpeechRecognitionUsageDescription` to "Used to demonstrate live speech-to-text recognition" and `NSMicrophoneUsageDescription` to "Used to capture audio for live speech-to-text" only when each key is absent; preserves any existing values untouched (idempotent per FR-027, coexistence per FR-028) — makes T010 pass
- [x] T023 [P] Create `plugins/with-speech-recognition/package.json` with `name: "with-speech-recognition"`, `main: "./index.ts"`, `types: "./index.ts"`, no runtime deps
- [x] T024 [P] Implement `src/modules/speech-recognition-lab/components/IOSOnlyBanner.tsx`: themed banner using `ThemedView` + `ThemedText` + `Spacing` + warning surface tokens from `useTheme()`; copy "Speech Recognition is iOS-only on this build — open this module on an iOS 10+ device to see live transcription."; styled via `StyleSheet.create()`; `accessibilityRole="alert"` (NFR-004) — makes T012 pass
- [x] T025 [P] Implement `src/modules/speech-recognition-lab/components/AuthStatusPill.tsx`: props `{ status: AuthStatus; onRequestPress: () => void; onOpenSettingsPress?: () => void }`; renders themed pill with one of four labels + color tokens; **Request** button visible only when `status === 'notDetermined'`; for `denied` / `restricted` renders an inline Settings affordance placeholder (full deep-link wiring in US4); uses `ThemedView` + `ThemedText` + `Spacing`; styled via `StyleSheet.create()`; exposes `accessibilityRole="text"` + `accessibilityState`; makes T013 pass (FR-010, NFR-004)
- [x] T026 [P] Implement `src/modules/speech-recognition-lab/components/AudioSessionIndicator.tsx`: prop `{ active: boolean }`; renders themed dot/label that visually distinguishes **active** vs **inactive**; `accessibilityLabel` reads "Audio session active" / "Audio session inactive"; updates synchronously with `active`; honours `useReducedMotion()` if any animation is used; uses `ThemedView` + `ThemedText` + `Spacing`; styled via `StyleSheet.create()` — makes T014 pass (FR-011, NFR-002, NFR-004, NFR-005)
- [x] T027 Implement `src/modules/speech-recognition-lab/index.tsx`: exports a `ModuleManifest` with `id: 'speech-recognition-lab'`, `title: 'Speech Recognition'`, `platforms: ['ios','android','web']`, `minIOS: '10.0'`, `screen: () => import('./screen')` — makes T011 pass (FR-001, FR-003, FR-004)
- [x] T028 Edit `app.json`: add `"./plugins/with-speech-recognition"` to the `expo.plugins` array (single additive line, after the existing 017 `with-vision` entry; FR-029, FR-035, SC-003)
- [x] T029 Edit `src/modules/registry.ts`: add the import line and the array entry for the speech-recognition-lab manifest (single additive 1–2 line edit; FR-001, FR-002, FR-035, SC-003)

**Checkpoint**: Speech-types, bridge (3 platform variants), Swift scaffold + podspec, config plugin, `IOSOnlyBanner`, `AuthStatusPill`, `AudioSessionIndicator`, manifest, app.json, and registry are wired. The module appears in the grid. Foundational tests T008 / T009 / T010 / T011 / T012 / T013 / T014 are green. User-story phases can now begin.

---

## Phase 3: User Story 1 — Live dictation with server recognition on iOS (Priority: P1) 🎯 MVP

**Goal**: An iOS 13+ developer opens Modules → Speech Recognition, taps **Request** to grant both speech + microphone permissions, sees Mode preselected to **Server** and Locale preselected to the system default, taps the mic toggle, and within ~1 second of speaking sees partial transcripts streaming with confidence-shaded words; tapping the toggle again stops the session, the Audio Session indicator returns to **inactive**, and the final transcript persists. **Copy** writes to the clipboard via `expo-clipboard`; **Clear** empties the area.

**Independent Test**: Build on iOS 13+ device, open the module, grant both prompts, tap mic toggle, speak "the quick brown fox". Verify (a) mic pulses, (b) Audio Session reads **active**, (c) first partial within ~1s and a final within ~2s of stopping, (d) confidence shading visible, (e) toggling stops; transcript persists, indicator returns to **inactive**, (f) **Copy** writes clipboard, **Clear** empties area, (g) `pnpm test` is green for every test in this phase. (SC-001, SC-002, SC-004)

### Tests for User Story 1 (write FIRST, must FAIL before implementation)

- [x] T030 [P] [US1] Test `test/unit/modules/speech-recognition-lab/components/MicButton.test.tsx`: renders idle vs listening visual states from `listening` prop; pulse animation enabled when `listening && !reduceMotion`; reduced-motion short-circuits to a static "active" indicator (NFR-005, FR-006); `onPress` invoked exactly once on tap; `disabled` prop renders inert and tap is a no-op; exposes `accessibilityRole="button"` + `accessibilityState={{ disabled, selected: listening }}` (NFR-004)
- [x] T031 [P] [US1] Test `test/unit/modules/speech-recognition-lab/components/TranscriptView.test.tsx`: renders finalized layer in primary color and partial layer appended after, in muted color (FR-009); per-word opacity equals `clamp(0.4 + 0.6 * confidence, 0.4, 1)`; missing confidence defaults to opacity `1.0` (FR-009); empty state renders a placeholder ("Tap the mic to start"); uses `ThemedText` + `Spacing`
- [x] T032 [P] [US1] Test `test/unit/modules/speech-recognition-lab/components/ActionRow.test.tsx`: renders **Clear** + **Copy** buttons; tapping **Clear** invokes `onClear` regardless of listening state (FR-014); **Copy** disabled when `final` is empty (FR-016); when enabled, tapping **Copy** invokes `onCopy` once and surfaces a "Copied" inline confirmation for ~2s; on `onCopy` rejection the confirmation flips to "Copy failed" for ~2s with no thrown exception (FR-015, NFR-006); both buttons expose `accessibilityRole="button"` (NFR-004)
- [x] T033 [P] [US1] Test `test/unit/modules/speech-recognition-lab/hooks/useSpeechSession.test.tsx` using a mocked `EventEmitter` bridge:
  - `start({ locale, onDevice })` calls `bridge.start(...)` once and subscribes to `partial` / `final` / `error` events; `isListening` flips to `true` (FR-017)
  - `partial` event updates `partial` state; subsequent `final` event appends to `final` and resets `partial` to `''` (FR-017, FR-021)
  - `stop()` calls `bridge.stop()` once and unsubscribes all listeners; `isListening` flips to `false` (FR-018)
  - `error` event sets `error` and clears `isListening`; the next successful `start` clears `error` (FR-017, FR-024)
  - Unmount during an active session calls `bridge.stop()` and unsubscribes; no Jest "state update on unmounted component" warnings (FR-018, NFR-003, SC-010)
  - Re-`start` after a terminal error works (subscribes again, state resets) (FR-019)
  - Words from events propagate to `partial` / `final` carriers for `TranscriptView` consumption
- [x] T034 [P] [US1] Test `test/unit/modules/speech-recognition-lab/screen.test.tsx` (iOS variant): screen mounts with mocked bridge, mocked `expo-clipboard`, and mocked `useReducedMotion`; renders `AuthStatusPill` (status `authorized` injected), `AudioSessionIndicator` (initially **inactive**), `RecognitionModePicker` (Server preselected), `LocalePicker` (system locale preselected), `TranscriptView` (empty placeholder), `MicButton` (idle), `ActionRow` (Clear enabled, Copy disabled) (FR-005); tapping `MicButton` calls `bridge.start({ locale: 'en-US', onDevice: false })` once and flips `AudioSessionIndicator` to **active** within one render cycle (FR-011, NFR-002); a mocked `partial` event then a `final` event populate `TranscriptView`; tapping `MicButton` again calls `bridge.stop()` and returns indicator to **inactive**; tapping **Copy** invokes `Clipboard.setStringAsync(final)` with the current final transcript and shows "Copied" (FR-015); tapping **Clear** empties the transcript and disables **Copy** (FR-014, FR-016); a bridge `error` event renders an inline error banner without crashing (NFR-006)

### Implementation for User Story 1

- [x] T035 [P] [US1] Implement `src/modules/speech-recognition-lab/components/MicButton.tsx`: large round button using `react-native-reanimated` (`useSharedValue` + `withRepeat(withTiming(...))`) for a subtle scale + opacity pulse while `listening`; static icon when idle; `useReducedMotion()` short-circuits the pulse to a static "active" indicator (NFR-005, FR-006); props `{ listening, disabled, onPress }`; styled via `StyleSheet.create()` merged with the animated style; `ThemedView` chrome + `Spacing` — makes T030 pass
- [x] T036 [P] [US1] Implement `src/modules/speech-recognition-lab/components/TranscriptView.tsx`: scrollable container; props `{ finalText: string; partialText: string; finalWords?: WordToken[]; partialWords?: WordToken[] }`; renders finalized layer in primary text color and partial layer appended after in muted color; per-word opacity `clamp(0.4 + 0.6 * confidence, 0.4, 1)` with default `1.0` when undefined (FR-009); empty-state placeholder when both layers empty; `ThemedText` + `Spacing`; `StyleSheet.create()` — makes T031 pass
- [x] T037 [P] [US1] Implement `src/modules/speech-recognition-lab/components/ActionRow.tsx`: row containing **Clear** + **Copy** themed buttons; props `{ canCopy: boolean; onClear: () => void; onCopy: () => Promise<void> | void }`; **Copy** disabled when `!canCopy` (FR-016); on tap, awaits `onCopy()` inside `try/catch` and surfaces "Copied" / "Copy failed" inline confirmation for ~2s via local state (FR-015, NFR-006); **Clear** always enabled and invokes `onClear` (FR-014); `ThemedView` + `ThemedText` + `Spacing`; `StyleSheet.create()` — makes T032 pass
- [x] T038 [P] [US1] Implement `src/modules/speech-recognition-lab/components/RecognitionModePicker.tsx` (Server-only baseline): props `{ mode: RecognitionMode; onModeChange: (m: RecognitionMode) => void; onDeviceAvailable: boolean; disabled?: boolean }`; renders **Server** + **On-device** segments with **Server** preselected and **On-device** rendered visually disabled when `!onDeviceAvailable` (full disabled-tooltip behavior in US2); `ThemedView` + `ThemedText` + `Spacing`; `StyleSheet.create()` — partially supports the US1 screen (FR-007 baseline)
- [x] T039 [P] [US1] Implement `src/modules/speech-recognition-lab/components/LocalePicker.tsx` (system-locale baseline): props `{ locale: Locale; onLocaleChange: (l: Locale) => void; disabled?: boolean }`; static `LOCALES` constant `['en-US','zh-CN','ja-JP','es-ES','fr-FR','de-DE']`; preselect logic deferred to consumer; renders the system locale; `ThemedView` + `ThemedText` + `Spacing`; `StyleSheet.create()` — partially supports the US1 screen (FR-008 baseline)
- [x] T040 [US1] Implement `src/modules/speech-recognition-lab/hooks/useSpeechSession.ts`: returns `{ partial, final, isListening, error, start, stop }` (FR-017); subscribes to `bridge.events.addListener('partial' | 'final' | 'error', …)` only between `start` and `stop`; on `partial` event sets `partial` state; on `final` event appends `transcript` to `final` and resets `partial`; on `error` event sets `error` and flips `isListening` to `false` (terminating subscriptions); `start({ locale, onDevice })` awaits `bridge.start(...)` then subscribes; `stop()` awaits `bridge.stop()` and unsubscribes; unmount cleanup calls `stop()` if `isListening` and unsubscribes (NFR-003, SC-010); accepts an optional `bridgeOverride` for tests; uses `useEffect` cleanup + a `mountedRef` to no-op state updates after unmount — makes T033 pass (depends on T015, T016, T017)
- [x] T041 [US1] Implement `src/modules/speech-recognition-lab/screen.tsx` (iOS): mounts `AuthStatusPill`, `AudioSessionIndicator`, `RecognitionModePicker` (default `mode='server'`, `onDeviceAvailable=false` for now), `LocalePicker` (system locale via `Intl` or hardcoded `'en-US'` fallback), `TranscriptView`, `MicButton`, `ActionRow` in the FR-005 vertical order; instantiates `useSpeechSession()`; on `MicButton` press, calls `start({ locale, onDevice: mode === 'on-device' })` or `stop()`; **Audio Session indicator** is driven by `isListening` synchronously (FR-011, NFR-002); **Copy** invokes `Clipboard.setStringAsync(final)` from `expo-clipboard` (FR-015); **Clear** empties `final` + `partial` via a hook-exposed reset or a local mirror (FR-014); error banner displayed when `error != null` (NFR-006); fully consumes `useSpeechSession` cleanup on unmount (NFR-003, SC-010) — makes T034 pass (depends on T015, T017, T024–T026, T035–T040)
- [x] T042 [US1] Implement the Server-mode body in `native/ios/speech-recognition/SpeechRecognizer.swift`: instantiate `SFSpeechRecognizer(locale:)`, `SFSpeechAudioBufferRecognitionRequest`, `AVAudioEngine`; configure `AVAudioSession` for `.record` (`mode = .measurement`, `options = [.duckOthers]`); install the engine input tap; start the recognition task; on each `SFSpeechRecognitionResult` emit `partial` (transcript + words from `bestTranscription.segments` with `confidence`); when `result.isFinal == true` emit `final` with `isFinal: true`; `stop()` stops the engine, removes the tap, calls `request.endAudio()`, cancels the task, and deactivates `AVAudioSession`; `requestAuthorization` wraps `SFSpeechRecognizer.requestAuthorization` and maps to `AuthStatus`; `getAuthorizationStatus` reads `SFSpeechRecognizer.authorizationStatus()`; `isAvailable(locale:)` checks `SFSpeechRecognizer(locale:)?.isAvailable == true`; `availableLocales` returns `SFSpeechRecognizer.supportedLocales().map { $0.identifier }`; honors `onDevice == false` by leaving `request.requiresOnDeviceRecognition = false` (default); all entry points in `do/catch` surfacing typed errors via `expo-modules-core` rejection + `error` event channel (NFR-006, FR-021, FR-024, FR-025) — verifies on-device per quickstart (NFR-001, SC-001, SC-004)

**Checkpoint**: User Story 1 is complete. The module appears in the grid, the iOS Server-mode pipeline is fully exercised end-to-end on device, every native action surfaces a typed error without crashing, and `pnpm test` is green for the entire `speech-recognition-lab` JS-pure tree on Windows. **This is the MVP — deploy/demo from here.**

---

## Phase 4: User Story 2 — On-device recognition (private mode) (Priority: P2)

**Goal**: The developer switches Mode from **Server** to **On-device**; if the current locale supports on-device recognition on this device the toggle takes effect and the next `start` passes `onDevice: true`. Otherwise the **On-device** segment renders visually disabled with the documented accessibility label and Mode remains **Server**. Mode change while listening triggers a stop+restart cycle within one event-loop tick.

**Independent Test**: On a modern iPhone with `en-US`, switch Mode to **On-device**, tap mic toggle, speak. Verify (a) **On-device** is selected and not disabled, (b) `bridge.start` is invoked with `onDevice: true`, (c) latency parity with US1, (d) toggling Mode back to **Server** while listening triggers a restart per FR-013.

### Tests for User Story 2 (write FIRST)

- [ ] T043 [P] [US2] Extend `test/unit/modules/speech-recognition-lab/components/RecognitionModePicker.test.tsx`: renders Server + On-device segments; default selection follows `mode` prop; tapping a segment invokes `onModeChange(newMode)` exactly once; when `onDeviceAvailable={false}`, the **On-device** segment is rendered in a disabled visual state with `accessibilityState={{ disabled: true }}` and `accessibilityLabel="On-device recognition not available for this locale on this device"` (FR-007); tapping the disabled segment is a no-op (FR-007, NFR-004)
- [ ] T044 [P] [US2] Extend `test/unit/modules/speech-recognition-lab/screen.test.tsx`: switching `RecognitionModePicker` to `'on-device'` while idle commits the selection and the next `bridge.start` call passes `onDevice: true` (FR-007); switching mode while listening calls `bridge.stop()` then `bridge.start(...)` with the new mode within one event-loop tick (transcript NOT cleared, partial buffer reset; FR-013); when the locale change in US3 propagates an `onDeviceAvailable=false`, Mode auto-falls back to **Server** with an inline message (FR-007, FR-013)

### Implementation for User Story 2

- [ ] T045 [US2] Extend `src/modules/speech-recognition-lab/components/RecognitionModePicker.tsx` to honor the disabled-segment behavior per T043: when `!onDeviceAvailable`, render the **On-device** segment with reduced opacity, `accessibilityState={{ disabled: true }}`, and the documented `accessibilityLabel`; tap is a no-op — makes T043 pass (FR-007)
- [ ] T046 [US2] Extend `src/modules/speech-recognition-lab/screen.tsx` to compute `onDeviceAvailable` (read from a screen-level state seeded by `bridge.isAvailable(locale)` + a per-locale on-device support flag exposed via the bridge or assumed false on non-iOS); on mode change while `isListening`, sequence `stop()` then `start({ locale, onDevice: newMode === 'on-device' })` within one tick using `await stop(); start(...)`; on auto-fallback (locale ⇒ on-device unavailable while mode is `'on-device'`), set Mode back to `'server'` and surface an inline 3s "Switched to Server: on-device unavailable for {locale}" message (FR-013, US2 acceptance #4) — makes T044 pass (depends on T041, T045)
- [ ] T047 [US2] Extend the Swift `SpeechRecognizer.swift` Server-mode body to honor `onDevice == true`: when requested AND `recognizer.supportsOnDeviceRecognition` is true for the current locale, set `request.requiresOnDeviceRecognition = true` before starting the task; when on-device is requested but `supportsOnDeviceRecognition == false`, reject `start` with `SpeechRecognitionNotSupported` carrying a message identifying the locale (FR-025, NFR-007, US2 acceptance #1) (depends on T042)

**Checkpoint**: User Story 2 is complete. On-device branch is honored end-to-end; mode-change-while-listening restart works; auto-fallback to Server fires when locale loses on-device support.

---

## Phase 5: User Story 3 — Locale switching (Priority: P2)

**Goal**: The developer opens the Locale picker, sees exactly the top-6 locales with the system locale preselected (or `en-US` as documented fallback), selects `ja-JP`, and the next `start` uses the new locale. Selecting a locale while listening triggers a stop+restart cycle per FR-013. Selecting a locale for which `bridge.isAvailable(locale)` returns false surfaces an inline error and reverts to the previous valid locale.

**Independent Test**: Tap the picker, select `ja-JP`, tap the mic toggle, speak Japanese. Verify (a) exactly 6 locale options shown, system locale preselected, (b) selection mid-session triggers stop+start within one tick, (c) Japanese partials/finals render in Japanese script, (d) selecting an unsupported locale shows the inline error and reverts.

### Tests for User Story 3 (write FIRST)

- [ ] T048 [P] [US3] Extend `test/unit/modules/speech-recognition-lab/components/LocalePicker.test.tsx`: renders exactly 6 locale options (`en-US`, `zh-CN`, `ja-JP`, `es-ES`, `fr-FR`, `de-DE`) (FR-008); when system locale is in the list, it is preselected; when the system locale is not, `en-US` is preselected (documented fallback; FR-008); selecting a different locale invokes `onLocaleChange(newLocale)` exactly once; `disabled` prop renders inert and tap is a no-op (FR-008, NFR-004)
- [ ] T049 [P] [US3] Extend `test/unit/modules/speech-recognition-lab/screen.test.tsx`: changing `LocalePicker` selection while idle commits immediately and the next `bridge.start` call uses the new locale (FR-008); changing while listening calls `bridge.stop()` then `bridge.start({ locale: newLocale, onDevice })` within one tick (transcript preserved, partial buffer reset; FR-013); selecting a locale for which `bridge.isAvailable(locale)` returns false surfaces an inline error and reverts to the previous locale; no `start` is issued (US3 acceptance #5)

### Implementation for User Story 3

- [ ] T050 [US3] Extend `src/modules/speech-recognition-lab/components/LocalePicker.tsx` to render all 6 locales as a tappable list/segmented surface and to compute the preselected value from a `systemLocale` prop (or the host's `Intl.DateTimeFormat().resolvedOptions().locale` if not provided), falling back to `en-US` when not in the top-6 list (FR-008) — makes T048 pass
- [ ] T051 [US3] Extend `src/modules/speech-recognition-lab/screen.tsx` to own `locale` state seeded from system locale (with `en-US` fallback); on `onLocaleChange`, validate via `bridge.isAvailable(newLocale)`; if false, set inline error "Recognition not available for {locale} on this device" for ~3s and revert; if true, commit and — when `isListening` — sequence `stop()` then `start({ locale: newLocale, onDevice })` within one tick (FR-013); also recompute `onDeviceAvailable` for the new locale and trigger the US2 auto-fallback path when applicable — makes T049 pass (depends on T041, T046, T050)
- [ ] T052 [US3] Confirm the Swift `SpeechRecognizer.swift` `start({locale,onDevice})` body honors the `locale` parameter by constructing `SFSpeechRecognizer(locale: Locale(identifier: locale))` per call; ensure `availableLocales` returns the recognizer's `supportedLocales().map { $0.identifier }` so the JS layer can filter the top-6 list (FR-025, FR-020) (depends on T042)

**Checkpoint**: User Story 3 is complete. Locale picker drives the recognizer per call; mid-session locale changes restart cleanly; unsupported-locale path is non-fatal.

---

## Phase 6: User Story 4 — Authorization handling (denied, restricted, request flow) (Priority: P2)

**Goal**: When speech-recognition or microphone authorization is denied or restricted, the screen renders the pill in the correct state, disables the mic toggle, and surfaces an inline Settings affordance ("Open Settings to enable") that deep-links to the iOS Settings app. Tapping **Request** when status is `notDetermined` invokes `bridge.requestAuthorization()` exactly once and updates the pill on resolve. Microphone-specific errors during `start` surface inline without flipping the Audio Session indicator to **active**.

**Independent Test**: On a device where speech-recognition is denied in Settings, open the module. Verify (a) pill reads `denied`, (b) mic toggle visually disabled and inert, (c) inline Settings affordance shown, (d) tapping **Request** does not surface a system prompt and instead reinforces the Settings affordance.

### Tests for User Story 4 (write FIRST)

- [ ] T053 [P] [US4] Extend `test/unit/modules/speech-recognition-lab/components/AuthStatusPill.test.tsx`: when `status === 'denied'` or `status === 'restricted'`, the **Request** button is hidden and a Settings affordance is rendered with `accessibilityRole="link"` and label "Open Settings to enable"; tapping it invokes `onOpenSettingsPress` exactly once (FR-010, US4 acceptance #5); when `status === 'notDetermined'`, **Request** is visible and tapping invokes `onRequestPress` exactly once (FR-010)
- [ ] T054 [P] [US4] Extend `test/unit/modules/speech-recognition-lab/screen.test.tsx`: when `bridge.getAuthorizationStatus()` resolves to `denied`, the pill reads `denied`, the mic toggle is rendered with `accessibilityState={{ disabled: true }}` and tapping it does NOT call `bridge.start` (US4 acceptance #1); when status is `restricted`, the same disabled-toggle + Settings affordance applies (US4 acceptance #2); when status is `authorized` but `bridge.start` rejects with a `SpeechAudioEngineError` carrying microphone-permission semantics, the screen surfaces an inline "Microphone access required" error and the Audio Session indicator remains **inactive** (US4 acceptance #3, FR-011, NFR-006); when status is `notDetermined` and the user taps **Request**, `bridge.requestAuthorization()` is called once and the pill re-renders with the resolved status (US4 acceptance #4)

### Implementation for User Story 4

- [ ] T055 [US4] Extend `src/modules/speech-recognition-lab/components/AuthStatusPill.tsx` to render the Settings affordance in `denied` / `restricted` states per T053 (replacing the **Request** button); expose `onOpenSettingsPress` callback prop; affordance uses themed link styling — makes T053 pass (FR-010)
- [ ] T056 [US4] Extend `src/modules/speech-recognition-lab/screen.tsx` to:
  - Read initial authorization via `bridge.getAuthorizationStatus()` on mount; refresh on resolve from `requestAuthorization`
  - Disable `MicButton` (`disabled={true}`) when `status !== 'authorized'` (US4 acceptance #1, #2)
  - Wire **Request** button to `bridge.requestAuthorization()` exactly once (US4 acceptance #4)
  - Wire Settings affordance to `Linking.openURL('app-settings:')` (with try/catch fallback to a friendly inline message if `canOpenURL` is false; NFR-006)
  - Map `SpeechAudioEngineError` from `start` rejection to an inline "Microphone access required" message; ensure Audio Session indicator stays **inactive** (US4 acceptance #3, FR-011, NFR-006)
  - On any non-`authorized` status, hide the **Request** button when `status` is `denied` / `restricted` and show the Settings affordance instead (US4 acceptance #5)
  — makes T054 pass (depends on T041, T055)

**Checkpoint**: User Story 4 is complete. The full auth lifecycle is honored; the screen never crashes for any combination of speech-auth × mic-auth states.

---

## Phase 7: User Story 5 — Cross-platform graceful degradation (Android + Web) (Priority: P2)

**Goal**: On Android the screen renders every UI section but the mic toggle is disabled and the iOS-only banner is shown; no `bridge.start(...)` is callable. On Chromium-based browsers the module wires `webkitSpeechRecognition` for partial/final transcript parity (Server-only; **On-device** disabled). On non-Chromium browsers (no `webkitSpeechRecognition`), the screen falls back to the iOS-only banner pattern. Zero JavaScript exceptions across the lifecycle on any platform.

**Independent Test**: `pnpm android` — verify screen renders, mic disabled, banner shown, no `start` called, zero exceptions (SC-005). Chromium web — verify mic enabled, partials/finals stream from `webkitSpeechRecognition`, **Copy** works, zero exceptions (SC-006). Firefox web — verify banner + disabled mic, zero exceptions (SC-007).

### Tests for User Story 5 (write FIRST)

- [ ] T057 [P] [US5] Test `test/unit/modules/speech-recognition-lab/screen.android.test.tsx`: renders `AuthStatusPill`, `AudioSessionIndicator`, `RecognitionModePicker` (disabled), `LocalePicker` (disabled), `TranscriptView` (placeholder), `MicButton` (`disabled={true}`), `ActionRow` (Copy disabled) plus `IOSOnlyBanner` across the top (FR-012); tapping `MicButton` is a no-op and never invokes `bridge.start` (assert via spy) (FR-012, FR-022); `bridge.isAvailable(...)` returns `false` synchronously; zero exceptions across mount → tap-attempts → unmount (SC-005, NFR-006)
- [ ] T058 [P] [US5] Test `test/unit/modules/speech-recognition-lab/screen.web.test.tsx` (`webkitSpeechRecognition` mocked PRESENT): renders the full screen; **On-device** segment disabled (web forces Server; FR-023); tapping `MicButton` constructs `webkitSpeechRecognition`, requests browser mic permission via the API contract, and `onresult` events propagate to `TranscriptView` as partial/final (FR-023); **Copy** invokes mocked `expo-clipboard.setStringAsync`; **Clear** empties; zero exceptions (SC-006, NFR-006)
- [ ] T059 [P] [US5] Test `test/unit/modules/speech-recognition-lab/screen.web.test.tsx` (`webkitSpeechRecognition` mocked ABSENT, second describe block): renders `IOSOnlyBanner`, `MicButton` `disabled`; tapping mic is a no-op; `bridge.isAvailable(...)` returns `false`; zero exceptions across the lifecycle (SC-007, FR-023)
- [ ] T060 [P] [US5] Extend `test/unit/native/speech-recognition.web.test.ts` (split out from T009 if not already): with `webkitSpeechRecognition` present, `start({ locale, onDevice: true })` ignores the `onDevice` flag and behaves as `onDevice: false` (FR-023); `onresult` with `isFinal: false` emits `partial` event; `isFinal: true` emits `final` event; `onerror` emits `error` event with mapped `SpeechErrorKind`; `stop()` calls the recognizer's `stop()`; with `webkitSpeechRecognition` absent, every async method rejects with `SpeechRecognitionNotSupported` (FR-023, FR-024)

### Implementation for User Story 5

- [ ] T061 [P] [US5] Implement `src/modules/speech-recognition-lab/screen.android.tsx`: composes `AuthStatusPill`, `AudioSessionIndicator` (always **inactive**), `RecognitionModePicker` (`disabled`), `LocalePicker` (`disabled`), `TranscriptView` (placeholder), `MicButton` (`disabled`), `ActionRow` (Copy disabled), and `IOSOnlyBanner` across the top (FR-012); never instantiates `useSpeechSession`; never invokes any `speech-recognition` bridge method beyond `isAvailable()` — makes T057 pass (FR-012, FR-022)
- [ ] T062 [P] [US5] Complete the web bridge `src/native/speech-recognition.web.ts` `webkitSpeechRecognition` adapter: when present, `isAvailable(locale)` returns `true`; `availableLocales()` returns the top-6 list (best-effort; the API does not expose a locale enumeration); `requestAuthorization()` returns `'authorized'` (browser handles the prompt at `start` time); `start({ locale, onDevice })` constructs `new (globalThis as any).webkitSpeechRecognition()`, sets `recognition.lang = locale`, `recognition.continuous = true`, `recognition.interimResults = true`, ignores the `onDevice` flag (forces Server-mode parity per FR-023), wires `onresult` → `partial` / `final` events on the bridge `EventEmitter`, wires `onerror` → `error` event with mapped `SpeechErrorKind` (`'no-speech'` → `'audioEngine'`, `'audio-capture'` → `'audioEngine'`, `'not-allowed'` → `'authorization'`, `'network'` → `'network'`, others → `'unknown'`), and calls `recognition.start()`; `stop()` calls `recognition.stop()` and unsubscribes; when `webkitSpeechRecognition` is absent, all async methods reject with `new SpeechRecognitionNotSupported()` — makes T060 pass (depends on T019) (FR-023, FR-024)
- [ ] T063 [US5] Implement `src/modules/speech-recognition-lab/screen.web.tsx`: at module-load (or render time), feature-detect `(globalThis as any).webkitSpeechRecognition`; when PRESENT, render the same composition as `screen.tsx` but force `RecognitionModePicker` `mode='server'` + `onDeviceAvailable=false` (disabling the **On-device** segment) and use the web bridge wired in T062; when ABSENT, render the same skeleton as `screen.android.tsx` (banner + disabled toggle + inert pickers) — makes T058 + T059 pass (depends on T041, T061, T062)

**Checkpoint**: User Story 5 is complete. Module renders identically (educationally) on all three platforms; iOS-only behavior is explicit on Android and on non-Chromium web; Chromium web is interactively demonstrable end-to-end without an iOS device.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates and validation that span every story.

- [ ] T064 Run `pnpm format` from repo root and commit any formatting changes (FR-034)
- [ ] T065 Run `pnpm lint` from repo root; fix any lint errors introduced by the feature (no new `eslint-disable` comments) (FR-032, FR-034)
- [ ] T066 Run `pnpm typecheck` from repo root; resolve any TypeScript strict-mode errors (FR-032, FR-034)
- [ ] T067 Run `pnpm test` from repo root; confirm every speech-recognition-lab test from T008–T014, T030–T034, T043–T044, T048–T049, T053–T054, T057–T060 is green and the overall suite is green (FR-031, FR-032, SC-002)
- [ ] T068 Run `pnpm check` from repo root (the project's standard quality gate composing format / lint / typecheck / test) and verify a single green run end-to-end (FR-032, FR-033, SC-002) — **final gate**
- [ ] T069 [P] Walk through `quickstart.md` JS-pure verification on Windows — record pass observations in commit message or PR description (SC-002)
- [ ] T070 [P] Walk through `quickstart.md` iOS prebuild on macOS / EAS Build — verify `Info.plist` contains both `NSSpeechRecognitionUsageDescription` and `NSMicrophoneUsageDescription` after first prebuild and a second prebuild produces no diff (idempotency, SC-008); verify 007 / 014 / 015 / 016 / 017 plugin outputs are unaffected, in particular the 017 `NSCameraUsageDescription` value is preserved untouched (SC-009)
- [ ] T071 [P] Walk through `quickstart.md` iOS device run: full Server flow within 5s of speech (SC-001, SC-004), On-device branch when supported, Locale switch to `ja-JP`, Auth denied path, **Copy** + **Clear** action row, mic-pulse animation + reduced-motion short-circuit (NFR-001, NFR-005, FR-006)
- [ ] T072 [P] Walk through `quickstart.md` cross-platform graceful degradation on Android, Chromium web, and Firefox web — confirm zero console exceptions and the iOS-only banner renders where expected (SC-005, SC-006, SC-007, NFR-006)
- [ ] T073 Verify FR-035 / SC-003 additive-change-set constraint by running `git diff --stat main..HEAD -- src/ app.json package.json pnpm-lock.yaml` and confirming the only modifications to existing files are `src/modules/registry.ts` (≤ 2 lines), `app.json` (1 plugin entry), `package.json` (1 added dep), and `pnpm-lock.yaml` (auto-updated by `npx expo install`)
- [ ] T074 Verify NFR-009 / SC-011 size budget: total contributed bytes < 250 KB across Swift + JS + plugin + tests (no bundled media)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → no dependencies, run first
- **Foundational (Phase 2)** → depends on Setup; **BLOCKS all user-story phases**
- **User Story 1 (Phase 3, P1)** → depends on Foundational; independently testable; **MVP**
- **User Story 2 (Phase 4, P2)** → depends on Foundational + US1 (extends `RecognitionModePicker`, `screen.tsx`, and `SpeechRecognizer.swift` Server body)
- **User Story 3 (Phase 5, P2)** → depends on Foundational + US1 (extends `LocalePicker` and `screen.tsx`); independent of US2
- **User Story 4 (Phase 6, P2)** → depends on Foundational + US1 (extends `AuthStatusPill` and `screen.tsx`); independent of US2 / US3
- **User Story 5 (Phase 7, P2)** → depends on Foundational + US1 components (Android / web screens reuse `IOSOnlyBanner`, `AuthStatusPill`, `AudioSessionIndicator`, `RecognitionModePicker`, `LocalePicker`, `TranscriptView`, `MicButton`, `ActionRow`)
- **Polish (Phase 8)** → depends on whichever stories you intend to ship

### Within-Story Dependencies

- Tests precede implementation in every story (RED → GREEN → REFACTOR)
- T015 (speech-types) precedes T016 (bridge types re-export) and every test that imports event / error types
- T016 (bridge types) precedes T017 / T018 / T019 (bridge variants)
- T017 (iOS bridge) + T015 (types) precede T040 (hook) which precedes T041 (iOS screen)
- T020 (Swift scaffold) precedes T042 (US1 Server body), T047 (US2 on-device), T052 (US3 locale honoring)
- T024 (IOSOnlyBanner) precedes T061 (Android screen) and T063 (web screen)
- T025 (AuthStatusPill baseline) precedes T055 (US4 Settings affordance extension) and T056 (screen wiring)
- T038 (RecognitionModePicker baseline) precedes T045 (US2 disabled-segment behavior)
- T039 (LocalePicker baseline) precedes T050 (US3 full picker behavior)
- T041 (US1 screen) precedes T046, T051, T056, T063 (each extends or composes the iOS screen)
- T019 (web stub scaffold) precedes T062 (full webkit adapter)

### Parallel Opportunities

- T003–T007 (Setup directory creation) all parallel
- T008–T014 (Foundational test files) all parallel — different files
- T015, T016, T018, T019, T020, T021, T022, T023, T024, T025, T026 (Foundational implementation) mostly parallel — distinct files (T017 sequenced after T016)
- T030–T034 (US1 tests) all parallel
- T035–T039 (US1 component implementations) all parallel; T040 (hook) parallel with components; T041 (screen) sequenced after T035–T040; T042 (Swift) parallel with all JS work
- T043–T044 (US2 tests) parallel; T045 + T047 parallel; T046 sequenced after T045
- T048–T049 (US3 tests) parallel; T050 + T052 parallel; T051 sequenced after T050
- T053–T054 (US4 tests) parallel; T055 then T056
- T057–T060 (US5 tests) all parallel; T061 + T062 parallel; T063 sequenced after them
- T069–T072 (Polish quickstart walkthroughs) all parallel; T064–T068 sequential (format → lint → typecheck → test → check)

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "MicButton.test.tsx in test/unit/modules/speech-recognition-lab/components/"
Task: "TranscriptView.test.tsx in test/unit/modules/speech-recognition-lab/components/"
Task: "ActionRow.test.tsx in test/unit/modules/speech-recognition-lab/components/"
Task: "useSpeechSession.test.tsx in test/unit/modules/speech-recognition-lab/hooks/"
Task: "screen.test.tsx in test/unit/modules/speech-recognition-lab/"

# Launch all components for User Story 1 together:
Task: "MicButton.tsx in src/modules/speech-recognition-lab/components/"
Task: "TranscriptView.tsx in src/modules/speech-recognition-lab/components/"
Task: "ActionRow.tsx in src/modules/speech-recognition-lab/components/"
Task: "RecognitionModePicker.tsx in src/modules/speech-recognition-lab/components/"
Task: "LocalePicker.tsx in src/modules/speech-recognition-lab/components/"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Server-mode dictation)
4. **STOP and VALIDATE**: Test User Story 1 independently on iOS device + JS-pure suite on Windows
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Test independently → Demo (MVP — Server mode dictation)
3. Add US2 → Test independently → Demo (privacy on-device branch)
4. Add US3 → Test independently → Demo (locale switching)
5. Add US4 → Test independently → Demo (full auth UX)
6. Add US5 → Test independently → Demo (Android + Chromium web)
7. Polish → Final `pnpm check` + quickstart walkthroughs

### Parallel Team Strategy

With multiple developers post-Foundational:

- Developer A: US1 (MVP) → US2 (depends on US1)
- Developer B (after US1 lands): US3
- Developer C (after US1 lands): US4
- Developer D (after US1 lands): US5

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD per FR-031 + Constitution V)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same-file conflicts, cross-story dependencies that break independence

