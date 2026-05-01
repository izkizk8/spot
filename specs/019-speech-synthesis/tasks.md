---
description: "Dependency-ordered task list for feature 019 — Speech Synthesis Module (`speech-synthesis-lab`)"
---

# Tasks: Speech Synthesis Module (`speech-synthesis-lab`)

**Input**: Design documents from `/specs/019-speech-synthesis/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/speech-synthesis-bridge.contract.ts, contracts/speech-synthesizer.swift.md, quickstart.md

**Tests**: REQUIRED. Constitution Principle V + plan.md Phase 1 mandate JS-pure tests for `synth-types`, `synth-mapping`, `sample-texts`, the `useSynthesisSession` hook (with a mocked `EventEmitter` bridge), the JS bridge (3 platform variants — iOS `requireOptionalNativeModule`, Android `expo-speech` adapter, Web `window.speechSynthesis` adapter), every component (7 total), every screen variant (3 total), and the manifest. The Swift source `SpeechSynthesizer.swift` is not Windows-testable; on-device verification is documented in `quickstart.md`.

**Organization**: Tasks are grouped by user story so each story can be implemented, tested, and demoed independently. Within each story, tests precede implementation (TDD: RED → GREEN → REFACTOR).

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Different file, no ordering dependency on any incomplete task — safe to run in parallel.
- **[Story]**: User story tag (US1 / US2 / US3 / US4 / US5 / US6). Setup, Foundational, and Polish phases carry no story tag.
- Every task lists the **exact** file path it touches and references the FR / NFR / SC / D IDs it satisfies.

## Path Conventions

Paths are relative to the repository root (`C:\Users\izkizk8\spot-019-speech-synth\`). The feature touches:

- `src/modules/speech-synthesis-lab/` — JS module (manifest + 3 screen variants + hook + 7 components + synth-types + sample-texts + synth-mapping)
- `src/native/speech-synthesis*.ts` — JS bridge (iOS default + Android `expo-speech` adapter + Web `window.speechSynthesis` adapter + types)
- `native/ios/speech-synthesis/` — Swift source + podspec (not Windows-testable)
- `test/unit/modules/speech-synthesis-lab/`, `test/unit/native/` — Jest tests
- `src/modules/registry.ts`, `package.json`, `pnpm-lock.yaml` — single-line additive edits (no `app.json`, no plugin, no Info.plist key — D-01 / FR-040 / FR-041 / FR-042)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Branch verification, install `expo-speech` (the only new dependency — R-003 confirmed it is not yet in `package.json`), and create the directory skeleton expected by every later phase. **Zero `app.json` edits, zero plugin, zero Info.plist key** (D-01, R-001).

- [ ] T001 Verify on branch `019-speech-synthesis` (`git rev-parse --abbrev-ref HEAD`) and the working tree is clean except for `specs/019-speech-synthesis/` (FR-002)
- [ ] T002 Install `expo-speech` via the SDK-aligned installer: run `pnpm add expo-speech` from the repo root (Expo SDK 55-compatible release; R-003 confirmed not in `package.json`); verify `package.json` and `pnpm-lock.yaml` updated and `expo-speech` resolves to a SDK 55-compatible version; record the resolved version in the commit message (R-003, R-004, FR-035)
- [ ] T003 [P] Create directories `src/modules/speech-synthesis-lab/`, `src/modules/speech-synthesis-lab/components/`, and `src/modules/speech-synthesis-lab/hooks/` (FR-037, FR-039)
- [ ] T004 [P] Ensure directory `src/native/` exists for the new `speech-synthesis` bridge variants (no files yet — scaffolded in Foundational)
- [ ] T005 [P] Create directory `native/ios/speech-synthesis/` (sibling of `native/ios/speech-recognition/` from feature 018)
- [ ] T006 [P] Create test directories `test/unit/modules/speech-synthesis-lab/components/`, `test/unit/modules/speech-synthesis-lab/hooks/`, and `test/unit/native/` (Constitution V)
- [ ] T007 Confirm — and record in commit message — that **no** `app.json`, **no** `plugins/with-speech-synthesis/`, and **no** Info.plist usage-description key are added at any point in this feature (D-01, FR-040, FR-041, FR-042, R-001)

**Checkpoint**: Branch verified, `expo-speech` installed, empty skeleton ready. No imports resolve yet — that is expected. `app.json` MUST be untouched (verify via `git status app.json`).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Ship the cross-cutting pieces every user story depends on — shared `synth-types` (typed errors + event shapes + transport state), `sample-texts` constants, `synth-mapping` pure preset-to-iOS-domain functions, the JS bridge (3 platform variants) wired to the contract surface but with per-feature behavior left as TODOs, the Swift native scaffold + podspec, the manifest, and the registry wiring.

**⚠️ CRITICAL**: No user story phase can begin until this phase is complete. The bridge, types, mapping, and sample texts are imported by every component; the registry edit is required for the module to appear in the grid.

### Foundational Tests (write FIRST, must FAIL before implementation)

- [ ] T008 [P] Write `test/unit/modules/speech-synthesis-lab/synth-types.test.ts`: covers union completeness for `VoiceQuality` (`'Default' | 'Enhanced' | 'Premium'`), `TransportState` (`'idle' | 'speaking' | 'paused'`), `PersonalVoiceAuthorizationStatus` (`'notDetermined' | 'authorized' | 'denied' | 'unsupported'`), `RatePreset`, `PitchPreset`, `VolumePreset`, `SynthesisErrorKind`; runtime `instanceof` for `SpeechSynthesisError`, `SpeechSynthesisNotSupported`, `SpeechSynthesisPauseUnsupported`, `SpeechSynthesisInterrupted`; each subclass exposes `kind` literal matching its constructor and `name` matches the class name (data-model §1, §4, §5, §6, §7)
- [ ] T009 [P] Write `test/unit/modules/speech-synthesis-lab/sample-texts.test.ts`: byte-equality for `EN_SAMPLE` (`The quick brown fox jumps over the lazy dog.`), `ZH_SAMPLE` (`敏捷的棕色狐狸跳过了懒狗。`), `JA_SAMPLE` (`素早い茶色の狐が怠け者の犬を飛び越えます。`); `SAMPLE_PRESETS.length === 3`; preset `text` fields equal the corresponding constants; preset `id`s are exactly `'en' | 'zh' | 'ja'` (FR-005, FR-006, A-02, data-model §11)
- [ ] T010 [P] Write `test/unit/modules/speech-synthesis-lab/synth-mapping.test.ts`: `RATE_PRESET_TO_IOS` exact values (`Slow=0.4`, `Normal=0.5`, `Fast=0.6`); `PITCH_PRESET_TO_IOS` (`Low=0.75`, `Normal=1.0`, `High=1.5`); `VOLUME_PRESET_TO_IOS` (`Low=0.3`, `Normal=0.7`, `High=1.0`); `mapRateForAndroid(x) === x * 2`, `mapPitchForAndroid(x) === x`, `mapVolumeForAndroid(x) === x`; `mapRateForWeb(x) === x * 2`, `mapPitchForWeb(x) === x`, `mapVolumeForWeb(x) === x`; identity-passthrough invariants for boundary values (0, 1, 0.5, 2) (D-03, D-04, D-05, R-007, data-model §6)
- [ ] T011 [P] Write `test/unit/modules/speech-synthesis-lab/manifest.test.ts`: manifest `id === 'speech-synthesis-lab'` (matches `/^[a-z][a-z0-9-]*$/`), `title === 'Speech Synthesis'`, `platforms` includes `'ios'`, `'android'`, `'web'`, `minIOS === '7.0'`, `render` is a function returning a React element (FR-001, A-06, data-model §10)
- [ ] T012 [P] Write JS bridge contract test `test/unit/native/speech-synthesis.test.ts` (default + `.android.test.ts` + `.web.test.ts` siblings) asserting the contract from `contracts/speech-synthesis-bridge.contract.ts`:
  - **iOS variant** (`requireOptionalNativeModule` mocked PRESENT): `availableVoices()` returns native voices mapped to `Voice` shape (id/name/language/quality/isPersonalVoice); `speak({text,rate,pitch,volume})` delegates to the native module; `pause()` / `continue()` / `stop()` delegate; `isSpeaking()` is synchronous; `requestPersonalVoiceAuthorization()` resolves to one of the four statuses; `events.addListener('didStart' | 'didFinish' | 'didPause' | 'didContinue' | 'didCancel' | 'willSpeakWord', …)` returns a subscription with `.remove()` (FR-029, FR-031)
  - **iOS variant** (mocked ABSENT): `availableVoices()` returns `[]`; every async method behaves like `NOOP_BRIDGE` — `speak`/`pause`/`continue` reject with `SpeechSynthesisNotSupported`; `stop()` resolves; `requestPersonalVoiceAuthorization()` resolves `'unsupported'` (data-model §7, contract `NOOP_BRIDGE`)
  - **Android variant** (`expo-speech` mocked): `availableVoices()` maps `Speech.getAvailableVoicesAsync()` to the `Voice` shape (`quality: 'Enhanced'` when exposed, else `'Default'`; `isPersonalVoice: false` always; D-08); `speak({text, voiceId, rate, pitch, volume})` calls `Speech.speak(text, { voice, rate: mapRateForAndroid(rate), pitch: mapPitchForAndroid(pitch), volume: mapVolumeForAndroid(volume), onStart, onDone, onStopped, onBoundary })` and wires the callbacks into the `EventEmitter`; `pause()` / `continue()` reject with `SpeechSynthesisPauseUnsupported` when `Speech.pause` / `Speech.resume` throw (FR-021); `requestPersonalVoiceAuthorization()` resolves `'unsupported'` (D-08, FR-030); `onBoundary` (when present) emits `willSpeakWord` (R-004, R-007)
  - **Web variant** (`window.speechSynthesis` mocked PRESENT): `availableVoices()` reads `getVoices()` mapped to the `Voice` shape (`quality: 'Default'` always; `isPersonalVoice: false` always); subscribes to `voiceschanged` for refresh; `speak({text, voiceId, rate, pitch, volume})` constructs `SpeechSynthesisUtterance`, sets `voice`/`rate`/`pitch`/`volume` (mapped via `mapRateForWeb` etc.), wires `onstart` / `onend` / `onpause` / `onresume` / `onerror` / `onboundary` to bridge events; `pause()` / `continue()` / `stop()` proxy to `speechSynthesis.{pause,resume,cancel}()`; `requestPersonalVoiceAuthorization()` resolves `'unsupported'` (D-08, R-005, R-007, FR-024)
  - **Web variant** (`window.speechSynthesis` ABSENT): bridge surface returns `NOOP_BRIDGE` semantics — `speak` rejects with `SpeechSynthesisNotSupported`, `availableVoices` returns `[]` (R-005)
  - Use jest mocking of `requireOptionalNativeModule`, `expo-speech`, `Platform`, and `globalThis.speechSynthesis` (FR-031, FR-036, contract §)

### Foundational Implementation

- [ ] T013 [P] Implement `src/modules/speech-synthesis-lab/synth-types.ts` per `data-model.md` §1 + §3 + §4 + §5 + §6 + §7 + §8: export `Voice`, `VoiceQuality`, `WordBoundaryEvent`, `PersonalVoiceAuthorizationStatus`, `TransportState`, `SpeakArgs`, `RatePreset`, `PitchPreset`, `VolumePreset`, `SynthesisErrorKind`, `SynthEventName`, `SynthEventPayloads`, and the typed `Error` subclasses (`SpeechSynthesisError`, `SpeechSynthesisNotSupported`, `SpeechSynthesisPauseUnsupported`, `SpeechSynthesisInterrupted`) — each with `readonly kind` literal and `name` matching the class name; makes T008 pass
- [ ] T014 [P] Implement `src/modules/speech-synthesis-lab/sample-texts.ts` per `data-model.md` §11: export `EN_SAMPLE`, `ZH_SAMPLE`, `JA_SAMPLE` constants byte-exact and `SAMPLE_PRESETS` array with three entries (`'en' | 'zh' | 'ja'` ids, `'English' | 'Chinese' | 'Japanese'` labels); makes T009 pass (FR-005, FR-006, A-02)
- [ ] T015 [P] Implement `src/modules/speech-synthesis-lab/synth-mapping.ts` per `data-model.md` §6: export `RATE_PRESET_TO_IOS` / `PITCH_PRESET_TO_IOS` / `VOLUME_PRESET_TO_IOS` `Readonly<Record<…, number>>` constants with the exact values (D-03 / D-04 / D-05); export pure functions `ratePresetToValue(p)`, `pitchPresetToValue(p)`, `volumePresetToValue(p)`; export `mapRateForAndroid`, `mapPitchForAndroid`, `mapVolumeForAndroid`, `mapRateForWeb`, `mapPitchForWeb`, `mapVolumeForWeb` per R-007; makes T010 pass
- [ ] T016 [P] Create shared bridge types `src/native/speech-synthesis.types.ts` per `contracts/speech-synthesis-bridge.contract.ts`: re-export the value types from `src/modules/speech-synthesis-lab/synth-types.ts`; declare and export the `SpeechSynthesisBridge` interface (`availableVoices`, `speak`, `pause`, `continue`, `stop`, `isSpeaking`, `requestPersonalVoiceAuthorization`, `events: SpeechBridgeEventEmitter`); declare and export `SpeechBridgeSubscription`, `SpeechBridgeEventEmitter`, `NOOP_SUBSCRIPTION`, `NOOP_BRIDGE` — supports T012 (FR-029, FR-031)
- [ ] T017 Implement iOS JS bridge `src/native/speech-synthesis.ts` using `requireOptionalNativeModule('SpeechSynthesis')`: when the native module is present, `availableVoices()` proxies to native and maps each row to the `Voice` shape; `speak`/`pause`/`continue`/`stop` delegate to the native async functions (clamping `rate ∈ [0,1]`, `pitch ∈ [0.5, 2]`, `volume ∈ [0,1]` defensively per data-model §2); `isSpeaking()` proxies synchronously; `requestPersonalVoiceAuthorization()` proxies to native (returning the four-state union); `events` exposes a `SpeechBridgeEventEmitter` constructed from the native module's `EventEmitter`; when the native module is absent, the bridge equals `NOOP_BRIDGE` (every async rejects with `SpeechSynthesisNotSupported` except `stop` which resolves; `events.addListener` returns `NOOP_SUBSCRIPTION`); partially makes T012 pass (depends on T016) (FR-029, FR-031, contract §)
- [ ] T018 [P] Implement Android JS bridge `src/native/speech-synthesis.android.ts` using `expo-speech`: `availableVoices()` calls `Speech.getAvailableVoicesAsync()` and maps to the unified `Voice` shape (`quality: 'Enhanced'` when the platform exposes the field, else `'Default'`; `'Premium'` never on Android per data-model §1; `isPersonalVoice: false` always per D-08); `speak({text, voiceId, rate, pitch, volume})` calls `Speech.speak(text, { voice: voiceId, rate: mapRateForAndroid(rate), pitch: mapPitchForAndroid(pitch), volume: mapVolumeForAndroid(volume), onStart: () => emit('didStart',{}), onDone: () => emit('didFinish',{}), onStopped: () => emit('didCancel',{}), onBoundary: (ev) => emit('willSpeakWord', { range: { location: ev.charIndex, length: ev.charLength ?? 1 }, fullText: text }) })`; `pause()` calls `Speech.pause()` inside try/catch and rejects with `SpeechSynthesisPauseUnsupported` on throw (FR-021); `continue()` calls `Speech.resume()` symmetrically; `stop()` calls `Speech.stop()` (idempotent); `isSpeaking()` returns the cached state from the last event (synchronous; `Speech.isSpeakingAsync()` is async so cannot be used here); `requestPersonalVoiceAuthorization()` resolves `'unsupported'` synchronously (D-08, FR-030); makes the Android branch of T012 pass (depends on T015, T016) (R-004, R-007, FR-024)
- [ ] T019 [P] Implement Web JS bridge `src/native/speech-synthesis.web.ts` using `window.speechSynthesis`: feature-detect `globalThis.speechSynthesis`; when ABSENT, export `NOOP_BRIDGE` (R-005); when PRESENT, `availableVoices()` reads `speechSynthesis.getVoices()` mapped to the `Voice` shape (`quality: 'Default'` always; `isPersonalVoice: false` always per D-08) and subscribes once at module-load to `voiceschanged` to keep an internal cache fresh (data-model §9); `speak({text, voiceId, rate, pitch, volume})` constructs `new SpeechSynthesisUtterance(text)`, looks up the voice by `voiceURI === voiceId`, sets `utt.rate = mapRateForWeb(rate)`, `utt.pitch = mapPitchForWeb(pitch)`, `utt.volume = mapVolumeForWeb(volume)`, wires `onstart` → `didStart`, `onend` → `didFinish`, `onpause` → `didPause`, `onresume` → `didContinue`, `onerror` → `didCancel`, `onboundary` → `willSpeakWord` (`{ range: { location: ev.charIndex, length: ev.charLength ?? 1 }, fullText: text }`; emit only when `ev.name === 'word'` per W3C spec), and calls `speechSynthesis.speak(utt)`; `pause()` → `speechSynthesis.pause()` (Web supports it; never rejects); `continue()` → `speechSynthesis.resume()`; `stop()` → `speechSynthesis.cancel()` (idempotent); `isSpeaking()` returns `speechSynthesis.speaking`; `requestPersonalVoiceAuthorization()` resolves `'unsupported'` (D-08, FR-030); makes the Web branch of T012 pass (depends on T015, T016) (R-005, R-007, FR-024)
- [ ] T020 [P] Create Swift `native/ios/speech-synthesis/SpeechSynthesizer.swift` scaffold per `contracts/speech-synthesizer.swift.md`: `import ExpoModulesCore / AVFoundation`; `public class SpeechSynthesisModule: Module` with `Name("SpeechSynthesis")`, `Events("didStart", "didFinish", "didPause", "didContinue", "didCancel", "willSpeakWord")`, owns one `AVSpeechSynthesizer` instance and a private `AVSpeechSynthesizerDelegate` conformer; `AsyncFunction` declarations for `availableVoices`, `speak({args})`, `pause`, `continue`, `stop`, `requestPersonalVoiceAuthorization`; `Function` declaration for synchronous `isSpeaking`. Bodies left as `// TODO US1: wire AVSpeechSynthesizer`, `// TODO US2: enumerate voices`, `// TODO US6: wrap requestPersonalVoiceAuthorization`. All entry points wrapped in `do/catch`; never surface uncaught native exceptions to JS (mirrors 018 NFR-006). Scaffold-only, not unit-testable on Windows (FR-029, FR-031, contract §1, §3, §5)
- [ ] T021 [P] Create `native/ios/speech-synthesis/SpeechSynthesis.podspec` (mirrors feature 018's `SpeechRecognition.podspec`): `s.name = 'SpeechSynthesis'`, `s.platforms = { :ios => '7.0' }` (A-06), `s.source_files = '*.swift'`, `s.dependency 'ExpoModulesCore'`, `s.swift_version = '5.9'`. **No `s.frameworks` declaration** — `AVFoundation` is part of the iOS SDK and linked transparently by the toolchain (R-001, contract §). No Info.plist key required.
- [ ] T022 Implement `src/modules/speech-synthesis-lab/index.tsx`: exports a `ModuleManifest` per `data-model.md` §10 with `id: 'speech-synthesis-lab'`, `title: 'Speech Synthesis'`, `description` matching §10, `icon: { ios: 'speaker.wave.2', fallback: '🔊' }`, `platforms: ['ios','android','web']`, `minIOS: '7.0'`, `render: () => <SpeechSynthesisLabScreen />` — makes T011 pass (FR-001, A-06)
- [ ] T023 Edit `src/modules/registry.ts`: add the import line and the array entry for the speech-synthesis-lab manifest (single additive 1–2 line edit; FR-001, FR-002, FR-035). **DO NOT edit `app.json`** (D-01, FR-040, FR-041, FR-042).

**Checkpoint**: Synth-types, sample-texts, synth-mapping, bridge (3 platform variants), Swift scaffold + podspec, manifest, and registry are wired. The module appears in the grid. Foundational tests T008 / T009 / T010 / T011 / T012 are green. `app.json` is untouched (verify via `git status app.json`). User-story phases can now begin.

---

## Phase 3: User Story 1 — Speak / Pause / Continue / Stop transport on iOS (Priority: P1) 🎯 MVP

**Goal**: An iOS 7+ developer opens Modules → Speech Synthesis, sees a multi-line text input (empty, with the **Speak** button disabled), types any text, taps **Speak**, hears the platform default voice begin, sees the transport state move to **speaking** with **Pause** + **Stop** enabled and **Continue** disabled, taps **Pause** (audio halts, **Continue** enables, **Pause** disables), taps **Continue** (audio resumes, transport returns to **speaking**), taps **Stop** (audio terminates immediately, transport returns to **idle**), and on a separate utterance lets it run to completion (transport returns to **idle** automatically via `didFinish`). All transitions complete within 200 ms (SC-002), first audio frame within 3 s of opening the screen (SC-001).

**Independent Test**: Build on iOS 7+ device, open the module, type "Hello world", tap **Speak**. Verify (a) audio plays in the default voice, (b) transport state matches the buttons' enabled/disabled states per FR-019, (c) Pause/Continue/Stop respond within 200 ms, (d) natural completion returns to **idle** without manual stop, (e) `pnpm test` is green for every test in this phase.

### Tests for User Story 1 (write FIRST, must FAIL before implementation)

- [ ] T024 [P] [US1] Write `test/unit/modules/speech-synthesis-lab/components/TextInputArea.test.tsx`: renders a multi-line `TextInput` controlled by `value` + `onChangeText` props; `accessibilityLabel === 'Text to speak'`; **without** `currentWordRange`, no overlay rendered (FR-024); empty `value` results in disabled-Speak signal propagated up (consumer responsibility but assert the input itself is non-empty when typed); uses `ThemedText` + `ThemedView` + `Spacing` (FR-020, NFR-004) — highlight overlay assertions deferred to US5 tests
- [ ] T025 [P] [US1] Write `test/unit/modules/speech-synthesis-lab/components/TransportControls.test.tsx`: renders four themed buttons (**Speak**, **Pause**, **Continue**, **Stop**); enabled states driven strictly by `status` prop per FR-019:
  - `status === 'idle'`: Speak enabled (when `canSpeak`); Pause/Continue/Stop disabled
  - `status === 'speaking'`: Speak disabled; Pause + Stop enabled; Continue disabled
  - `status === 'paused'`: Speak disabled; Pause disabled; Continue + Stop enabled
  - `pauseSupported === false`: Pause + Continue rendered disabled in every state (FR-021)
  - Each button invokes the corresponding callback exactly once on tap; disabled buttons are no-ops; each exposes `accessibilityRole="button"` + `accessibilityState={{ disabled }}` (FR-019, FR-021, NFR-004, data-model §5)
- [ ] T026 [P] [US1] Write `test/unit/modules/speech-synthesis-lab/hooks/useSynthesisSession.test.tsx` using a mocked bridge with a controllable `EventEmitter`:
  - On mount, calls `bridge.availableVoices()` once and exposes the result on `voices` (FR-029)
  - On mount, probes `bridge.pause()` → if rejects with `SpeechSynthesisPauseUnsupported`, sets `pauseSupported = false`; otherwise `true` (FR-021)
  - `speak({text, rate, pitch, volume})` calls `bridge.speak({...args, voiceId: selectedVoiceId})` once and subscribes to all six event channels; on `didStart` event, `status` flips to `'speaking'` (data-model §5)
  - `pause()` calls `bridge.pause()` once; on `didPause` event, `status` flips to `'paused'`
  - `continue()` calls `bridge.continue()` once; on `didContinue` event, `status` flips to `'speaking'`
  - `stop()` calls `bridge.stop()` once; on `didCancel` event, `status` flips to `'idle'` and `currentWordRange` clears within one frame (FR-023)
  - On `didFinish` event (natural completion), `status` flips to `'idle'` and `currentWordRange` clears within one frame (FR-023, data-model §5)
  - On `willSpeakWord` event, `currentWordRange` updates to the event's `range` (deferred to US5 but assert in stub form here)
  - Unmount during an active session calls `bridge.stop()` and unsubscribes from all channels; no Jest "state update on unmounted component" warnings (NFR-003, SC-010, data-model §9)
  - `selectedVoiceId` survives `idle → speaking → idle` cycles (D-09)
  - Re-`speak` after `stop()` resubscribes cleanly (no double-subscription leak)
  - Bridge `events.addListener` rejection is impossible (returns subscription synchronously) — assert subscriptions tracked in a list and all `.remove()`d on unmount
- [ ] T027 [P] [US1] Write `test/unit/modules/speech-synthesis-lab/screen.test.tsx` (iOS variant): screen mounts with mocked bridge; renders `TextInputArea` (empty initial value), `TransportControls` (Speak disabled because text empty per FR-020), and a non-mounted `PersonalVoiceCard` placeholder (US6 territory). Typing into `TextInputArea` enables Speak; tapping Speak calls `bridge.speak({ text: 'Hello', rate: 0.5, pitch: 1.0, volume: 0.7, voiceId: undefined })` (the iOS-domain defaults from `synth-mapping` `Normal` presets — D-03/D-04/D-05); on mocked `didStart` event, transport moves to `speaking`; tapping Pause calls `bridge.pause()` and on `didPause` transport moves to `paused`; tapping Continue calls `bridge.continue()` and on `didContinue` transport returns to `speaking`; tapping Stop calls `bridge.stop()` and on `didCancel` transport returns to `idle`; mocked `didFinish` (natural end) returns transport to `idle` without manual stop; uses mocked `useReducedMotion`; zero exceptions across the lifecycle (FR-005, FR-019, FR-020, NFR-006, SC-001, SC-002)

### Implementation for User Story 1

- [ ] T028 [P] [US1] Implement `src/modules/speech-synthesis-lab/components/TextInputArea.tsx`: multi-line `TextInput` (`multiline`, `numberOfLines={4}`, `textAlignVertical="top"`); props `{ value: string; onChangeText: (s: string) => void; currentWordRange?: { location: number; length: number } | null; accessibilityLabel?: string }`; consumes `useTheme()` for surface + text colors; `Spacing` for padding; `StyleSheet.create()` for layout; **no overlay rendered yet** (the overlay is added in US5 — leave a `// TODO US5: highlight overlay` marker referencing `currentWordRange`); `accessibilityLabel` defaults to `'Text to speak'` — makes T024 pass (FR-020, NFR-004)
- [ ] T029 [P] [US1] Implement `src/modules/speech-synthesis-lab/components/TransportControls.tsx`: four themed buttons (Speak / Pause / Continue / Stop) laid out in a `View` row; props `{ status: TransportState; canSpeak: boolean; pauseSupported: boolean; onSpeak: () => void; onPause: () => void; onContinue: () => void; onStop: () => void }`; enabled-state derivation strictly from FR-019 + FR-021 (table in T025); each button uses `ThemedText` label + themed surface; `accessibilityRole="button"` + `accessibilityState={{ disabled }}` per button; styled via `StyleSheet.create()` — makes T025 pass (FR-019, FR-021, NFR-004)
- [ ] T030 [US1] Implement `src/modules/speech-synthesis-lab/hooks/useSynthesisSession.ts` per `data-model.md` §9: returns `{ status, currentWordRange, voices, selectedVoiceId, personalVoiceStatus, pauseSupported, selectVoice, speak, pause, continue, stop, requestPersonalVoice }`; on mount calls `bridge.availableVoices()` and stores result in `voices` state, then probes `bridge.pause().catch(e => e.kind === 'PauseUnsupported' ? setPauseSupported(false) : null)` and immediately calls `bridge.stop()` to reset (the probe is mount-only); subscribes to all six event channels lazily on first `speak()` call (and re-subscribes cleanly on subsequent `speak`s); transport state machine per data-model §5; `currentWordRange` ratchets on `willSpeakWord` and clears on `didFinish` / `didCancel` within one frame; `selectVoice(id)` updates `selectedVoiceId`; `speak(args)` injects `voiceId: selectedVoiceId` into the bridge call; unmount cleanup invokes `stop()` if `status !== 'idle'`, unsubscribes via tracked subscription list, and uses a `mountedRef` to no-op state updates after unmount (NFR-003, SC-010); accepts an optional `bridgeOverride` for tests; makes T026 pass (depends on T013, T015, T016, T017) (FR-021, FR-023, FR-029, data-model §9)
- [ ] T031 [US1] Implement `src/modules/speech-synthesis-lab/screen.tsx` (iOS): mounts `TextInputArea` and `TransportControls` (US2's `VoicePicker`, US3's `RateControl`/`PitchControl`/`VolumeControl`, US4's preset chips, US5's overlay, and US6's `PersonalVoiceCard` are added in their respective phases — leave `// TODO US{n}` markers); owns controlled `text` state seeded to `''`; `canSpeak = text.trim().length > 0` (FR-020); instantiates `useSynthesisSession()`; on Speak press, calls `session.speak({ text: text.trim(), rate: ratePresetToValue('Normal'), pitch: pitchPresetToValue('Normal'), volume: volumePresetToValue('Normal') })` using `synth-mapping` defaults (D-03, D-04, D-05); on Pause/Continue/Stop press, delegates to the corresponding session method; honors `useSynthesisSession` cleanup on unmount (NFR-003, SC-010); makes T027 pass (depends on T013, T015, T017, T028, T029, T030) (FR-005, FR-019, FR-020)
- [ ] T032 [US1] Implement the Speak/Pause/Continue/Stop body of `native/ios/speech-synthesis/SpeechSynthesizer.swift` (replacing the US1 TODOs from T020): set the module's `AVSpeechSynthesizerDelegate` once at init; `speak({args})` reads `text`, optional `voiceId`, `rate`, `pitch`, `volume` from args, constructs `AVSpeechUtterance(string: text)`, sets `utterance.voice = AVSpeechSynthesisVoice(identifier: voiceId) ?? AVSpeechSynthesisVoice.defaultVoice` (or platform default when nil), clamps `rate` to `[AVSpeechUtteranceMinimumSpeechRate, AVSpeechUtteranceMaximumSpeechRate]`, clamps `pitchMultiplier` to `[0.5, 2.0]`, clamps `volume` to `[0.0, 1.0]`, calls `synthesizer.speak(utterance)`, resolves promise immediately (lifecycle is event-driven via delegate); `pause()` → `synthesizer.pauseSpeaking(at: .immediate)`; `continue()` → `synthesizer.continueSpeaking()`; `stop()` → `synthesizer.stopSpeaking(at: .immediate)` (idempotent); `isSpeaking()` returns `synthesizer.isSpeaking`; delegate methods emit `didStart` / `didFinish` / `didPause` / `didContinue` / `didCancel` (`willSpeakWord` deferred to US5); all entry points wrapped in `do/catch` with no uncaught exception (mirrors 018 NFR-006); no `AVAudioSession` configuration (contract §4); verifies on-device per quickstart §3 Check 1 (SC-001, SC-002, contract §1, §3)

**Checkpoint**: User Story 1 is complete. The module appears in the grid; the iOS Speak/Pause/Continue/Stop transport works end-to-end on device; `pnpm test` is green for the entire `speech-synthesis-lab` JS-pure tree on Windows. **This is the MVP — deploy/demo from here.**

---

## Phase 4: User Story 2 — Voice picker grouped by language with quality badges (Priority: P2)

**Goal**: The developer opens the voice picker, sees voices grouped under raw BCP-47 section headers (`en-US`, `zh-CN`, `ja-JP`, …) with each row showing the voice name and a quality badge (**Default** / **Enhanced** / **Premium**), alphabetically sorted within each section; selects a non-default voice; returns to the screen and taps **Speak** to hear the audible difference. The selected voice persists across `idle → speaking → idle` cycles within the screen-session (D-09). On iOS 17+ with at least one authorized Personal Voice, a **Personal Voice** section appears at the top of the list above all language sections (FR-009, FR-028).

**Independent Test**: Open voice picker on iOS, verify section grouping with raw BCP-47 headers, alphabetical voice ordering, and quality badge rendering; select a non-default voice, return, tap Speak — verify audible difference and that re-opening the picker shows the same selection. (See quickstart §3 Check 2.)

### Tests for User Story 2 (write FIRST)

- [ ] T033 [P] [US2] Write `test/unit/modules/speech-synthesis-lab/components/VoicePicker.test.tsx`:
  - Given a mocked `voices` array with mixed languages (`en-US`, `en-GB`, `zh-CN`, `ja-JP`) + qualities (`Default`, `Enhanced`, `Premium`), renders one section per BCP-47 language tag with the **raw** tag as the header (no humanization per D-12)
  - Within each section, voices are sorted alphabetically by `name` (FR-008)
  - Each row renders the voice name plus a badge with the exact label `'Default'` / `'Enhanced'` / `'Premium'` themed via `useTheme()` warning/info/success surface tokens (FR-008)
  - Selecting a row invokes `onSelectVoice(voiceId)` exactly once
  - The currently selected voice (matched by `selectedVoiceId` prop) renders with a checkmark / selected visual state and `accessibilityState={{ selected: true }}`
  - When at least one `voice.isPersonalVoice === true` exists AND `personalVoiceStatus === 'authorized'`, renders a **Personal Voice** section at the top of the list above all language sections (FR-009, FR-028); when no PV voices exist OR `personalVoiceStatus !== 'authorized'`, the Personal Voice section is suppressed
  - Empty `voices` array renders a placeholder ("No voices available")
  - Uses `ThemedText` + `ThemedView` + `Spacing`; `StyleSheet.create()` (NFR-004)
- [ ] T034 [P] [US2] Extend `test/unit/modules/speech-synthesis-lab/screen.test.tsx`: with a mocked bridge returning a non-empty `voices` list, screen mounts and renders `VoicePicker` populated; selecting a voice updates `session.selectedVoiceId`; tapping Speak afterwards calls `bridge.speak({...defaults, voiceId: <selectedId>})`; the selected voice persists across a complete `idle → speaking → idle` cycle (D-09); empty `voices` renders the placeholder without crashing (FR-008, FR-010, FR-011)

### Implementation for User Story 2

- [ ] T035 [P] [US2] Implement `src/modules/speech-synthesis-lab/components/VoicePicker.tsx`: `SectionList`-based picker; props `{ voices: Voice[]; selectedVoiceId: string | undefined; onSelectVoice: (id: string | undefined) => void; personalVoiceStatus: PersonalVoiceAuthorizationStatus }`; groups voices by `voice.language` (BCP-47 raw tag — D-12), sorted alphabetically by section header AND by voice name within each section (FR-008); renders a quality badge per voice (`Default` / `Enhanced` / `Premium`) using themed warning/info/success surface tokens; renders a top-most **Personal Voice** section iff `personalVoiceStatus === 'authorized'` AND any `voice.isPersonalVoice === true` (FR-009, FR-028); selected voice has a checkmark + `accessibilityState={{ selected: true }}`; empty-list placeholder; uses `ThemedView` + `ThemedText` + `Spacing`; styled via `StyleSheet.create()` — makes T033 pass (FR-008, FR-010, FR-011, FR-028, NFR-004, D-12)
- [ ] T036 [US2] Extend `src/modules/speech-synthesis-lab/screen.tsx` to mount `VoicePicker` (driven by `session.voices`, `session.selectedVoiceId`, `session.selectVoice`, `session.personalVoiceStatus`) above the `TransportControls`; verify Speak path picks up `selectedVoiceId` automatically through the hook's `speak()` (no additional wiring needed because the hook injects it); makes T034 pass (depends on T031, T035) (FR-008, FR-010, D-09)
- [ ] T037 [US2] Implement `availableVoices()` body in `native/ios/speech-synthesis/SpeechSynthesizer.swift` (replacing the US2 TODO from T020): enumerate `AVSpeechSynthesisVoice.speechVoices()`, map each to `{ id: voice.identifier, name: voice.name, language: voice.language, quality: <map of AVSpeechSynthesisVoiceQuality>, isPersonalVoice: <iOS17+ trait check> }` per `contracts/speech-synthesizer.swift.md` §2; quality mapping `.default → "Default"`, `.enhanced → "Enhanced"`, `.premium → "Premium"`; `isPersonalVoice` uses `#available(iOS 17, *) { voice.voiceTraits.contains(.isPersonalVoice) } else { false }` (R-008); never throws; verifies on-device per quickstart §3 Check 2

**Checkpoint**: User Story 2 is complete. Voice picker is fully populated on iOS (and on Android/Web after the parity story), grouped by raw BCP-47 with quality badges, with selection persistence and Personal Voice section gating ready for US6.

---

## Phase 5: User Story 3 — Adjust rate, pitch, and volume via segmented controls (Priority: P2)

**Goal**: The developer adjusts each of the three 3-segment controls (Rate / Pitch / Volume — each with **Slow** / **Normal** / **Fast** or **Low** / **Normal** / **High** — D-03 / D-04 / D-05) and taps **Speak** between changes to hear audible differences (slower vs faster cadence, lower vs higher voice, softer vs louder). Changing a control mid-utterance does not affect the current utterance — the new value applies on the next **Speak** (FR-016).

**Independent Test**: For each control, tap each segment and tap **Speak** between changes; verify audible differences. Begin a long utterance, change a control mid-speech, verify the current utterance is unchanged and the new value applies on the next **Speak**. (See quickstart §3 Check 3.)

### Tests for User Story 3 (write FIRST)

- [ ] T038 [P] [US3] Write `test/unit/modules/speech-synthesis-lab/components/RateControl.test.tsx`: renders three segments with labels exactly **Slow** / **Normal** / **Fast**; default selection is **Normal** when `value === 'Normal'`; tapping a segment invokes `onChange(preset)` exactly once with the correct enum literal; selected segment has distinct visual + `accessibilityState={{ selected: true }}`; uses `ThemedView` + `ThemedText` + `Spacing`; `StyleSheet.create()` (FR-013, FR-014, FR-015, NFR-004, D-03)
- [ ] T039 [P] [US3] Write `test/unit/modules/speech-synthesis-lab/components/PitchControl.test.tsx`: same structure as T038 but with labels **Low** / **Normal** / **High** and `PitchPreset` enum (FR-013, FR-014, FR-015, NFR-004, D-04)
- [ ] T040 [P] [US3] Write `test/unit/modules/speech-synthesis-lab/components/VolumeControl.test.tsx`: same structure as T038 but with labels **Low** / **Normal** / **High** and `VolumePreset` enum (FR-013, FR-014, FR-015, NFR-004, D-05)
- [ ] T041 [P] [US3] Extend `test/unit/modules/speech-synthesis-lab/screen.test.tsx`: rendering the three controls; changing each preset updates the corresponding screen state without invoking `bridge.speak`; the next Speak call uses the mapped iOS-domain values from `synth-mapping` (e.g., changing Rate to **Fast** + Pitch to **Low** + Volume to **High** → `bridge.speak({ ..., rate: 0.6, pitch: 0.75, volume: 1.0 })`); changing a preset while `status === 'speaking'` does NOT call `bridge.speak` again and does NOT call `bridge.stop()` (FR-016) — the current utterance continues unchanged; the next Speak after natural completion uses the new values (FR-013–FR-016, D-03/D-04/D-05)

### Implementation for User Story 3

- [ ] T042 [P] [US3] Implement `src/modules/speech-synthesis-lab/components/RateControl.tsx`: 3-segmented themed control; props `{ value: RatePreset; onChange: (v: RatePreset) => void; disabled?: boolean }`; segments labeled **Slow** / **Normal** / **Fast**; selected visual via `useTheme()` + `accessibilityState={{ selected }}`; tap on disabled segment is a no-op; `ThemedView` + `ThemedText` + `Spacing`; `StyleSheet.create()` — makes T038 pass (FR-013, NFR-004, D-03)
- [ ] T043 [P] [US3] Implement `src/modules/speech-synthesis-lab/components/PitchControl.tsx`: same structure as T042 but with `PitchPreset` and labels **Low** / **Normal** / **High** — makes T039 pass (FR-014, NFR-004, D-04)
- [ ] T044 [P] [US3] Implement `src/modules/speech-synthesis-lab/components/VolumeControl.tsx`: same structure as T042 but with `VolumePreset` and labels **Low** / **Normal** / **High** — makes T040 pass (FR-015, NFR-004, D-05)
- [ ] T045 [US3] Extend `src/modules/speech-synthesis-lab/screen.tsx` to own `ratePreset` / `pitchPreset` / `volumePreset` state (each defaulting to `'Normal'`), mount the three controls above `TransportControls`, and translate the presets to iOS-domain numbers via `ratePresetToValue` / `pitchPresetToValue` / `volumePresetToValue` from `synth-mapping` immediately before calling `session.speak(...)`; ensure that mid-utterance preset changes do NOT trigger a re-speak or stop (FR-016) — the next Speak picks up the new values; makes T041 pass (depends on T015, T031, T042, T043, T044) (FR-013, FR-014, FR-015, FR-016, D-03, D-04, D-05)

**Checkpoint**: User Story 3 is complete. All three controls are wired end-to-end; iOS-domain mapping is exercised; mid-utterance change semantics match FR-016.

---

## Phase 6: User Story 4 — Quick-fill from sample text presets (Priority: P3)

**Goal**: The developer taps an **English** / **Chinese** / **Japanese** preset chip; the input is replaced with the locked sample text for that locale (the exact strings from `data-model.md` §11 / FR-005 / FR-006 / A-02). Tapping **Speak** with a matching-locale voice produces intelligible audio.

**Independent Test**: Tap each preset chip in turn; verify the input updates to the byte-exact preset string; tap Speak after each preset (with a matching-locale voice selected) and verify audio plays. (See quickstart §3 Check 4.)

### Tests for User Story 4 (write FIRST)

- [ ] T046 [P] [US4] Extend `test/unit/modules/speech-synthesis-lab/screen.test.tsx`: renders three preset chips labeled **English** / **Chinese** / **Japanese** above the text input (or in a row alongside); tapping **English** sets `text` to `EN_SAMPLE` exactly (`The quick brown fox jumps over the lazy dog.`); tapping **Chinese** sets `text` to `ZH_SAMPLE` exactly (`敏捷的棕色狐狸跳过了懒狗。`); tapping **Japanese** sets `text` to `JA_SAMPLE` exactly (`素早い茶色の狐が怠け者の犬を飛び越えます。`); each chip is reachable via `accessibilityRole="button"` with the locale label; tapping a chip while `status === 'speaking'` updates the input but does NOT trigger Speak automatically — the user explicitly taps Speak (FR-005, FR-006, A-02, NFR-004)

### Implementation for User Story 4

- [ ] T047 [US4] Extend `src/modules/speech-synthesis-lab/screen.tsx` to render a row of three preset chips (mapped from `SAMPLE_PRESETS` in `sample-texts.ts`) above (or alongside) the `TextInputArea`; tapping a chip calls `setText(preset.text)`; chips use themed surface + `ThemedText` labels; styled via `StyleSheet.create()`; chips are always enabled (regardless of transport state); makes T046 pass (depends on T014, T031) (FR-005, FR-006, A-02, NFR-004)

**Checkpoint**: User Story 4 is complete. All three preset chips populate the input with byte-exact constants from `sample-texts.ts`.

---

## Phase 7: User Story 5 — Highlighted-word display while speaking (Priority: P3)

**Goal**: While the platform fires word-boundary events, the input area visually highlights the word currently being spoken, advancing in sync with audio. On Pause, the highlight freezes on the most recently spoken word. On Continue, it resumes. On Stop or natural completion, the highlight clears within one frame (FR-023). When the platform does not fire boundary events (some Android OEMs, some Safari voices), the highlight is silently absent — no error (FR-024). Reduced-motion preference short-circuits the fade animation to a static highlight (NFR-005).

**Independent Test**: Load any preset (≥ 8 words), tap Speak, watch the highlight advance with audio; tap Pause and verify the highlight freezes; tap Continue and verify it resumes; tap Stop and verify it clears within one frame; let an utterance run to natural completion and verify the highlight clears within one frame; toggle iOS Settings → Accessibility → Reduce Motion ON and re-run, verifying the highlight appears/disappears statically with no fade. (See quickstart §3 Check 5.)

### Tests for User Story 5 (write FIRST)

- [ ] T048 [P] [US5] Extend `test/unit/modules/speech-synthesis-lab/components/TextInputArea.test.tsx`: with `currentWordRange = { location: 4, length: 5 }` and `value = 'The quick brown fox.'`, renders the highlight overlay positioned over characters `[4, 9)` (the word `quick`); when `currentWordRange === null` OR omitted, NO overlay is rendered (FR-024); when `useReducedMotion()` returns `true`, the overlay renders without the Reanimated fade (static appear/disappear; NFR-005); when `useReducedMotion()` returns `false`, the overlay uses Reanimated `useAnimatedStyle` for a fade-in/out (assert via spy on `useSharedValue` or an injected animated-style probe); the overlay color comes from `useTheme()` highlight surface token (no hardcoded hex — Constitution II); the overlay is `pointerEvents="none"` so it does not intercept taps on the underlying `TextInput` (FR-022, FR-023, FR-024, NFR-005, R-006)
- [ ] T049 [P] [US5] Extend `test/unit/modules/speech-synthesis-lab/hooks/useSynthesisSession.test.tsx`: on `willSpeakWord` event with `{ range: { location: 4, length: 5 }, fullText: '...' }`, `currentWordRange` updates to `{ location: 4, length: 5 }` synchronously (FR-022); on `didPause` event, `currentWordRange` is preserved (highlight freezes, A.S. 2 of US-5); on `didContinue`, subsequent `willSpeakWord` events advance the range; on `didCancel` AND `didFinish`, `currentWordRange` clears to `null` within one frame (FR-023); when no `willSpeakWord` events fire (boundary unsupported), `currentWordRange` stays `null` and `status` still transitions correctly (FR-024) — invariant: `currentWordRange === null` whenever `status === 'idle'` (data-model §5)
- [ ] T050 [P] [US5] Extend `test/unit/modules/speech-synthesis-lab/screen.test.tsx`: a sequence of mocked events `didStart` → `willSpeakWord({range:{location:0,length:3}})` → `willSpeakWord({range:{location:4,length:5}})` → `didFinish` results in `TextInputArea` rendering the overlay over `[0,3)` then `[4,9)` then no overlay (cleared within one frame on `didFinish`); same sequence with `didCancel` substituted for `didFinish` clears the overlay; `useReducedMotion()` is honored (FR-022, FR-023, FR-024, NFR-005)

### Implementation for User Story 5

- [ ] T051 [US5] Extend `src/modules/speech-synthesis-lab/components/TextInputArea.tsx` to add the highlight overlay (replacing the US5 TODO from T028): an absolutely-positioned `<Text>` (or `<View>` with computed `left` / `top` / `width`) sized to the substring `value.substring(location, location + length)` (UTF-16 offsets per `contracts/speech-synthesizer.swift.md` §3); the overlay matches the input's typography (font family / size / line height) so the visual position is byte-aligned; uses `react-native-reanimated`'s `useSharedValue` + `useAnimatedStyle` for a fade-in/out within one frame; `useReducedMotion()` short-circuits the animated style to a static opacity (NFR-005, R-006); overlay color from `useTheme()` highlight surface token (Constitution II); overlay is `pointerEvents="none"`; suppressed entirely when `currentWordRange === null` (FR-024); makes T048 pass (FR-022, FR-023, FR-024, NFR-005, R-006)
- [ ] T052 [US5] Extend `src/modules/speech-synthesis-lab/hooks/useSynthesisSession.ts` to wire the `willSpeakWord` channel into `currentWordRange` state per data-model §5; ensure clearing on `didFinish` / `didCancel` happens in the same React batch as the `status` transition so the overlay clears within one frame (FR-023); makes T049 pass (depends on T030)
- [ ] T053 [US5] Extend `src/modules/speech-synthesis-lab/screen.tsx` to pass `session.currentWordRange` into `TextInputArea` as a prop; makes T050 pass (depends on T031, T051, T052)
- [ ] T054 [US5] Extend `native/ios/speech-synthesis/SpeechSynthesizer.swift` `AVSpeechSynthesizerDelegate` to implement `speechSynthesizer(_:willSpeakRangeOfSpeechString:utterance:)` and emit `willSpeakWord` with `{ range: { location: NSRange.location, length: NSRange.length }, fullText: utterance.speechString }` — UTF-16 offsets passed verbatim per `contracts/speech-synthesizer.swift.md` §3; verifies on-device per quickstart §3 Check 5 (R-006)

**Checkpoint**: User Story 5 is complete. Word highlighting is functional on iOS and on Android/Web where the platform fires boundary events; degrades silently elsewhere; reduced-motion is honored.

---

## Phase 8: User Story 6 — Personal Voice (iOS 17+ only) (Priority: P3)

**Goal**: On iOS 17+ with at least one user-created Personal Voice, the screen renders a `PersonalVoiceCard` with a status pill (`notDetermined` / `authorized` / `denied`) and a **Request Personal Voice authorization** button. Tapping Request triggers the system permission prompt; on **Allow**, the status pill updates to `authorized` within ~1 s (SC-006), and the voice picker now shows a top-of-list **Personal Voice** section. On iOS < 17, Android, and Web, the card MUST NOT mount at all (FR-025, D-08).

**Independent Test**: On an iOS 17+ device with a Personal Voice created in Settings, open the screen; verify the card appears, status reads `notDetermined`; tap Request, tap Allow on the system prompt; verify status transitions to `authorized` within ~1 s and the picker now shows a Personal Voice section. On iOS 16 / Android / Web, verify the card is absent. (See quickstart §3 Check 6.)

### Tests for User Story 6 (write FIRST)

- [ ] T055 [P] [US6] Write `test/unit/modules/speech-synthesis-lab/components/PersonalVoiceCard.test.tsx`:
  - Props `{ status: PersonalVoiceAuthorizationStatus; onRequest: () => Promise<PersonalVoiceAuthorizationStatus> }`
  - Renders a status pill with the literal label matching `status` (`notDetermined` / `authorized` / `denied`) and a corresponding theme token (`info` / `success` / `error`)
  - Renders a **Request Personal Voice authorization** button visible **only** when `status === 'notDetermined'`; tapping it invokes `onRequest` exactly once; on resolve, the pill re-renders to the resolved status
  - When `status === 'unsupported'`, the component returns `null` (the screen guards against rendering, but the component is double-defensive — D-08, FR-025)
  - Uses `ThemedText` + `ThemedView` + `Spacing` + theme tokens (no hardcoded hex — Constitution II); `StyleSheet.create()`; `accessibilityRole="text"` for the pill, `accessibilityRole="button"` for the Request button (NFR-004)
- [ ] T056 [P] [US6] Extend `test/unit/modules/speech-synthesis-lab/hooks/useSynthesisSession.test.tsx`: `requestPersonalVoice()` calls `bridge.requestPersonalVoiceAuthorization()` exactly once and updates `personalVoiceStatus` to the resolved value; on mount, `personalVoiceStatus` is seeded by an initial `bridge.requestPersonalVoiceAuthorization()` call only when iOS 17+ is detected (assert via mocked `Platform.OS`/`Platform.Version`), otherwise `'unsupported'` synchronously without invoking the bridge (D-08, FR-030); state transitions are terminal — once settled at `authorized` / `denied`, no further transitions occur during the session (D-09, data-model §4)
- [ ] T057 [P] [US6] Extend `test/unit/modules/speech-synthesis-lab/screen.test.tsx`: with mocked `Platform.OS === 'ios'` AND `Platform.Version >= 17`, screen renders `PersonalVoiceCard` mounted; with `Platform.Version < 17`, the card MUST NOT mount at all (assert `queryByTestId('personal-voice-card') === null`; D-08, FR-025); the screen iOS-only `screen.tsx` runtime gate is exactly `Platform.OS === 'ios' && Number(Platform.Version) >= 17`; tapping Request invokes `session.requestPersonalVoice()`; on resolve to `'authorized'`, the `VoicePicker` re-renders with the Personal Voice section at top (covered jointly with US2's selectable PV voices); on `'denied'`, the pill updates and the section stays hidden (FR-025, FR-028, data-model §4)

### Implementation for User Story 6

- [ ] T058 [P] [US6] Implement `src/modules/speech-synthesis-lab/components/PersonalVoiceCard.tsx`: themed card with a status pill + Request button per T055; `accessibilityRole` per element; returns `null` when `status === 'unsupported'` (defensive — the screen also gates the mount per FR-025); styled via `StyleSheet.create()`; theme tokens for status colors (Constitution II) — makes T055 pass (FR-025, NFR-004)
- [ ] T059 [US6] Extend `src/modules/speech-synthesis-lab/hooks/useSynthesisSession.ts` to expose `requestPersonalVoice()` (proxy to `bridge.requestPersonalVoiceAuthorization()`) and seed `personalVoiceStatus` on mount: when iOS 17+ is detected, call `bridge.requestPersonalVoiceAuthorization()` once at mount to read the current authorization status without prompting (the API returns the current state without re-prompting if already settled); otherwise set `'unsupported'` synchronously (D-08, FR-030); ensure terminal-state semantics (D-09) — makes T056 pass (depends on T030)
- [ ] T060 [US6] Extend `src/modules/speech-synthesis-lab/screen.tsx` to mount `PersonalVoiceCard` **only** when `Platform.OS === 'ios' && Number(Platform.Version) >= 17` (FR-025, D-08); pass `session.personalVoiceStatus` and `session.requestPersonalVoice` to the card; makes T057 pass (depends on T031, T058, T059)
- [ ] T061 [US6] Implement `requestPersonalVoiceAuthorization()` body in `native/ios/speech-synthesis/SpeechSynthesizer.swift` (replacing the US6 TODO from T020): on iOS < 17, resolve `'unsupported'` synchronously; on iOS 17+, wrap `AVSpeechSynthesizer.requestPersonalVoiceAuthorization { status in resolve(map(status)) }` per `contracts/speech-synthesizer.swift.md` §1; map `.notDetermined → 'notDetermined'`, `.authorized → 'authorized'`, `.denied → 'denied'`, `.unsupported → 'unsupported'`; never throws (R-008, contract §1); also extend the `availableVoices()` mapping (already done in T037) so `isPersonalVoice: true` flows through for PV voices on iOS 17+ — verifies on-device per quickstart §3 Check 6 (FR-028, FR-030, R-008)

**Checkpoint**: User Story 6 is complete. Personal Voice card renders only on iOS 17+; authorization flows end-to-end; voice picker top-of-list PV section appears once authorized.

---

## Phase 9: Cross-Platform Parity (Android + Web)

**Purpose**: Ship the parity screens that compose the same hook + components against the Android (`expo-speech`) and Web (`window.speechSynthesis`) bridges already implemented in Foundational (T018, T019). These are intentionally last because the iOS feedback loop dominates US1–US6; the components and hook are byte-identical across platforms — only the bridge differs (FR-036, plan.md Phase 7).

### Tests (write FIRST)

- [ ] T062 [P] Write `test/unit/modules/speech-synthesis-lab/screen.android.test.tsx`: renders the same composition as `screen.tsx` (TextInputArea, preset chips, VoicePicker, RateControl/PitchControl/VolumeControl, TransportControls) but with `PersonalVoiceCard` MUST NOT mount (D-08, FR-025); when the Android bridge probe sets `pauseSupported = false`, Pause + Continue buttons are rendered disabled (FR-021); tapping Speak calls `bridge.speak({...})` (the mocked `expo-speech` adapter); `willSpeakWord` events (when fired by the mocked Android `onBoundary`) populate the overlay; absence of `onBoundary` results in no overlay and no crash (FR-024); zero exceptions across mount → tap-attempts → unmount (SC-005, NFR-006)
- [ ] T063 [P] Write `test/unit/modules/speech-synthesis-lab/screen.web.test.tsx` with `globalThis.speechSynthesis` mocked PRESENT: renders the same composition; `PersonalVoiceCard` MUST NOT mount (D-08, FR-025); tapping Speak constructs `SpeechSynthesisUtterance` (asserted via the mock), wires `onstart` → didStart, etc.; `voiceschanged` event refreshes voices; pause/resume/cancel proxy correctly; when `onboundary` fires with `name === 'word'`, overlay updates; zero exceptions (R-005, FR-024, SC-005)
- [ ] T064 [P] Write a second describe block in `test/unit/modules/speech-synthesis-lab/screen.web.test.tsx` with `globalThis.speechSynthesis` mocked ABSENT: screen renders gracefully — Speak button disabled, no crash; `bridge.availableVoices()` returns `[]` and the picker shows the empty placeholder; zero exceptions across the lifecycle (R-005, NFR-006)

### Implementation

- [ ] T065 [P] Implement `src/modules/speech-synthesis-lab/screen.android.tsx`: composes the same components as `screen.tsx` (TextInputArea, preset chips, VoicePicker, RateControl/PitchControl/VolumeControl, TransportControls) using `useSynthesisSession()`; **does not** mount `PersonalVoiceCard` (D-08, FR-025); the Android bridge from T018 supplies the events; `pauseSupported` from the hook drives the Pause/Continue disabled state (FR-021) — makes T062 pass (depends on T018, T028, T029, T030, T035, T042, T043, T044, T047, T051, T058) (FR-036)
- [ ] T066 [P] Implement `src/modules/speech-synthesis-lab/screen.web.tsx`: composes the same components as `screen.tsx`; **does not** mount `PersonalVoiceCard` (D-08, FR-025); the Web bridge from T019 supplies the events; identical UX to iOS apart from absence of PV card; degrades silently if `globalThis.speechSynthesis` is absent (placeholder voice list, disabled transport) — makes T063 + T064 pass (depends on T019, T028, T029, T030, T035, T042, T043, T044, T047, T051, T058) (FR-036, R-005)

**Checkpoint**: Cross-platform parity is complete. Module is interactively demonstrable on iOS, Android, and Chromium/Safari Web; degrades gracefully where the underlying API is absent.

---

## Phase 10: Polish & Quality Gate

**Purpose**: Quality gates and validation that span every story. **Sequential** — each must pass before the next.

- [ ] T067 Run `pnpm format` from repo root and commit any formatting changes (FR-046)
- [ ] T068 Run `pnpm lint` from repo root; fix any lint errors introduced by the feature (no new `eslint-disable` comments) (FR-046)
- [ ] T069 Run `pnpm typecheck` from repo root; resolve any TypeScript strict-mode errors (FR-046)
- [ ] T070 Run `pnpm test` from repo root; confirm every speech-synthesis-lab test from T008–T012, T024–T027, T033–T034, T038–T041, T046, T048–T050, T055–T057, T062–T064 is green and the overall suite is green (Constitution V, FR-046, SC-008)
- [ ] T071 Run `pnpm check` from repo root (the project's standard quality gate composing format / lint / typecheck / test) and verify a single green run end-to-end (FR-046, SC-008) — **final merge gate**
- [ ] T072 [P] Walk through `quickstart.md` §6 JS-pure verification on Windows — record pass observations in commit message or PR description (SC-008)
- [ ] T073 [P] Walk through `quickstart.md` §3 iOS device run: Check 1 (transport), Check 2 (voice picker grouping + badges + selection persistence), Check 3 (rate/pitch/volume audible differences + FR-016 mid-utterance no-effect), Check 4 (sample preset chips byte-equality), Check 5 (highlight advance/freeze/clear + reduced-motion fallback), Check 6 (Personal Voice card iOS 17+ flow) (SC-001, SC-002, SC-003, SC-006, FR-005, FR-006, FR-013–FR-016, FR-019, FR-022, FR-023, FR-025, FR-028, NFR-005)
- [ ] T074 [P] Walk through `quickstart.md` §4 Android device run: transport (with disabled Pause/Continue on OEMs that don't support it per FR-021), voice picker grouping (no Premium quality, no Personal Voice section per D-08), rate/pitch/volume, presets, highlighting where supported / silent absence elsewhere (FR-024); zero crashes (SC-005)
- [ ] T075 [P] Walk through `quickstart.md` §5 Web walkthrough on current Chromium and Safari (SC-009): voice picker (handle initial empty + `voiceschanged` refresh), transport, controls, presets, highlighting (Chromium fires `boundary`, Safari may not — verify graceful absence per FR-024); zero console exceptions (NFR-006)
- [ ] T076 Verify FR-002 / FR-035 additive-change-set constraint by running `git diff --stat main..HEAD -- src/ app.json package.json pnpm-lock.yaml` and confirming the only modifications to existing files are: `src/modules/registry.ts` (≤ 2 lines), `package.json` (1 added dep `expo-speech`), `pnpm-lock.yaml` (auto-updated). **Confirm `app.json` shows zero changes** (D-01, FR-040, FR-041, FR-042) — if any line in `app.json` changed, the feature has drifted from spec; revert before merge.
- [ ] T077 Verify size budget: total contributed bytes < 250 KB across Swift + JS + tests (no bundled media, no plugin folder, no Info.plist key)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → no dependencies, run first
- **Foundational (Phase 2)** → depends on Setup; **BLOCKS all user-story phases**
- **User Story 1 (Phase 3, P1)** → depends on Foundational; independently testable; **MVP**
- **User Story 2 (Phase 4, P2)** → depends on Foundational + US1 (extends `screen.tsx`; reuses hook's `voices` / `selectedVoiceId`)
- **User Story 3 (Phase 5, P2)** → depends on Foundational + US1 (extends `screen.tsx`); independent of US2
- **User Story 4 (Phase 6, P3)** → depends on Foundational + US1 (extends `screen.tsx`); independent of US2 / US3
- **User Story 5 (Phase 7, P3)** → depends on Foundational + US1 (extends `TextInputArea`, hook, `screen.tsx`, Swift delegate); independent of US2 / US3 / US4
- **User Story 6 (Phase 8, P3)** → depends on Foundational + US1 + US2 (the PV section in VoicePicker is gated by hook's `personalVoiceStatus`); independent of US3 / US4 / US5
- **Cross-Platform Parity (Phase 9)** → depends on Foundational + US1 (component skeletons); benefits from US2 / US3 / US4 / US5 being landed but is technically composable any time after US1
- **Polish (Phase 10)** → depends on whichever stories you intend to ship

### Within-Story Dependencies

- Tests precede implementation in every story (RED → GREEN → REFACTOR per Constitution V)
- T013 (synth-types) precedes T016 (bridge types re-export) and every test that imports value/error types
- T015 (synth-mapping) precedes T018 / T019 (Android/Web bridges) and T031 (screen) and T045 (US3 wiring)
- T016 (bridge types) precedes T017 / T018 / T019 (bridge variants)
- T017 (iOS bridge) + T013 + T015 precede T030 (hook) which precedes T031 (iOS screen)
- T020 (Swift scaffold) precedes T032 (US1 transport body), T037 (US2 voice enumeration), T054 (US5 word boundary delegate), T061 (US6 PV authorization)
- T028 (TextInputArea baseline) precedes T051 (US5 highlight overlay)
- T030 (hook baseline) precedes T052 (US5 word-range wiring) and T059 (US6 PV mount-time probe)
- T031 (US1 screen) precedes T036 (US2), T045 (US3), T047 (US4), T053 (US5), T060 (US6) — each extends or composes the iOS screen
- T035 (VoicePicker) needs `personalVoiceStatus` prop for the PV section gate (defined in US2; consumed by US6)
- T058 (PersonalVoiceCard) precedes T060 (screen mount)
- T065 / T066 (Android / Web screens) depend on every component already landed in US1–US6

### Parallel Opportunities

- T003–T006 (Setup directory creation) all parallel
- T008–T012 (Foundational test files) all parallel — different files
- T013, T014, T015, T016, T018, T019, T020, T021 (Foundational implementation) mostly parallel — distinct files (T017 sequenced after T016)
- T024–T027 (US1 tests) all parallel
- T028, T029 (US1 components) parallel; T030 (hook) parallel with components; T031 (screen) sequenced after T028–T030; T032 (Swift) parallel with all JS work
- T033–T034 (US2 tests) parallel; T035 + T037 parallel; T036 sequenced after T035
- T038–T041 (US3 tests) all parallel; T042–T044 (controls) all parallel; T045 (screen wiring) sequenced after them
- T046 (US4 test) standalone; T047 (screen wiring) follows
- T048–T050 (US5 tests) parallel; T051, T052, T054 parallel implementations; T053 sequenced after T051+T052
- T055–T057 (US6 tests) parallel; T058 + T061 parallel implementations; T059 → T060 sequential
- T062–T064 (parity tests) parallel; T065 + T066 parallel implementations
- T072–T075 (Polish quickstart walkthroughs) all parallel; T067–T071 strictly sequential (format → lint → typecheck → test → check)

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (different files, no shared state):
Task: "TextInputArea.test.tsx in test/unit/modules/speech-synthesis-lab/components/"
Task: "TransportControls.test.tsx in test/unit/modules/speech-synthesis-lab/components/"
Task: "useSynthesisSession.test.tsx in test/unit/modules/speech-synthesis-lab/hooks/"
Task: "screen.test.tsx in test/unit/modules/speech-synthesis-lab/"

# Launch the JS components for User Story 1 in parallel:
Task: "TextInputArea.tsx in src/modules/speech-synthesis-lab/components/"
Task: "TransportControls.tsx in src/modules/speech-synthesis-lab/components/"
# (hook + screen are sequential after components land)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (install `expo-speech`, create directories)
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories; ship types, mapping, sample-texts, all 3 bridge variants, Swift scaffold + podspec, manifest, registry)
3. Complete Phase 3: User Story 1 (Speak/Pause/Continue/Stop transport)
4. **STOP and VALIDATE**: Test User Story 1 independently on iOS device + JS-pure suite on Windows (`pnpm check`)
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Test independently → Demo (MVP — transport)
3. Add US2 → Test independently → Demo (voice picker)
4. Add US3 → Test independently → Demo (rate/pitch/volume)
5. Add US4 → Test independently → Demo (preset chips)
6. Add US5 → Test independently → Demo (word highlighting)
7. Add US6 → Test independently → Demo (Personal Voice — iOS 17+ device required)
8. Add Cross-Platform Parity → Test on Android + Chromium / Safari Web
9. Polish → Final `pnpm check` + quickstart walkthroughs

### Parallel Team Strategy

With multiple developers post-Foundational:

- Developer A: US1 (MVP) → US2 (depends on US1)
- Developer B (after US1 lands): US3
- Developer C (after US1 lands): US4 + US5
- Developer D (after US2 lands): US6
- Developer E (after US1 lands, in parallel with C/D): Cross-Platform Parity (Phase 9)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD per Constitution V)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **Never** edit `app.json`, **never** add a `plugins/with-speech-synthesis/` folder, **never** add an Info.plist key (D-01, FR-040, FR-041, FR-042, R-001) — if the implementation drifts in any of these directions, revert to spec
- Avoid: vague tasks, same-file conflicts, cross-story dependencies that break independence
