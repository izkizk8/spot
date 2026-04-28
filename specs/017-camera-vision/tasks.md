---
description: "Dependency-ordered task list for feature 017 — Camera + Vision Live Frames Module"
---

# Tasks: Camera + Vision Live Frames Module (`camera-vision`)

**Input**: Design documents from `/specs/017-camera-vision/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/vision-bridge.contract.ts, contracts/vision-detector.swift.md, quickstart.md

**Tests**: REQUIRED. FR-032 + Constitution Principle V mandate JS-pure tests for `vision-types`, the `useFrameAnalyzer` hook (with fake timers), the JS bridge (3 platform variants), the config plugin, every component, every screen variant, and the manifest. Native Swift sources are not Windows-testable; on-device verification is documented in `quickstart.md`.

**Organization**: Tasks are grouped by user story so each story can be implemented, tested, and demoed independently. Within each story, tests precede implementation (TDD: RED → GREEN → REFACTOR).

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Different file, no ordering dependency on any incomplete task — safe to run in parallel.
- **[Story]**: User story tag (US1 / US2 / US3 / US4 / US5). Setup, Foundational, and Polish phases carry no story tag.
- Every task lists the **exact** file path it touches.

## Path Conventions

Paths are relative to the repository root (`C:\Users\izkizk8\spot-017-camera-vision\`). The feature touches:

- `src/modules/camera-vision/` — JS module (manifest + 3 screen variants + hook + 6 components + vision-types)
- `src/native/vision-detector*.ts` — JS bridge (iOS default + Android + Web variants + types)
- `plugins/with-vision/` — TS Expo config plugin (idempotent `NSCameraUsageDescription` injection)
- `native/ios/vision/` — Swift sources (scaffold + per-mode bodies, not Windows-testable)
- `test/unit/modules/camera-vision/`, `test/unit/native/`, `test/unit/plugins/with-vision/` — Jest tests
- `src/modules/registry.ts`, `app.json`, `package.json` — single-line additive edits (only existing files touched)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Branch verification (already complete — on `017-camera-vision`), install `expo-camera`, and create the directory skeleton expected by every later phase. No production code yet.

- [ ] T001 Verify on branch `017-camera-vision` (`git rev-parse --abbrev-ref HEAD`) and the working tree is clean except for `specs/017-camera-vision/`
- [ ] T002 Install `expo-camera` via the SDK-aligned installer: run `npx expo install expo-camera` from the repo root; verify `package.json` and `pnpm-lock.yaml` updated and `expo-camera` resolves at the SDK 55-pinned version
- [ ] T003 [P] Create directories `src/modules/camera-vision/`, `src/modules/camera-vision/components/`, and `src/modules/camera-vision/hooks/`
- [ ] T004 [P] Ensure directory `src/native/` exists for the new vision-detector bridge variants (no files yet — scaffolded in Foundational)
- [ ] T005 [P] Create directory `plugins/with-vision/`
- [ ] T006 [P] Create directory `native/ios/vision/`
- [ ] T007 [P] Create test directories `test/unit/modules/camera-vision/components/`, `test/unit/modules/camera-vision/hooks/`, `test/unit/native/`, `test/unit/plugins/with-vision/`

**Checkpoint**: Branch verified, `expo-camera` installed, empty skeleton ready. No imports resolve yet — that is expected.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Ship the cross-cutting pieces every user story depends on: shared `vision-types` (discriminated union + type guards) + bridge error classes, JS bridge (3 platform variants) with the iOS bridge wired to the dispatch shape but no per-mode logic yet, the Swift native scaffold + podspec, the config plugin (idempotent `NSCameraUsageDescription` mod), the `IOSOnlyBanner` shared component, the manifest, and the registry / app.json wiring.

**⚠️ CRITICAL**: No user story phase can begin until this phase is complete. The bridge and types are imported by every component; the plugin is required for any iOS build to grant camera permission; the registry edit is required for the module to appear in the grid.

### Foundational Tests (write FIRST, must FAIL before implementation)

- [ ] T008 [P] Write vision-types test `test/unit/modules/camera-vision/vision-types.test.ts` covering: `isFace` / `isText` / `isBarcode` for valid `Observation` inputs of each kind; for invalid inputs (wrong `kind` literal, missing `kind`, extra fields, null, undefined); `labelFor` returns `'Face'` for face observations, returns the text for text observations (truncated to 80 chars + ellipsis when longer), returns the payload for barcode observations (also truncated) (FR-024, FR-025, FR-007)
- [ ] T009 [P] Write JS bridge contract test `test/unit/native/vision-detector.test.ts` asserting:
  - `isAvailable()` is synchronous and returns `false` when the optional native module is absent or `Platform.OS !== 'ios'`
  - `analyze('faces', payload)` rejects with `VisionNotSupported` on the android/web stubs
  - `analyze('faces', { base64: 'x', uri: 'y' })` rejects with `InvalidInput` on iOS (both present)
  - `analyze('faces', {})` rejects with `InvalidInput` on iOS (neither present)
  - On iOS with the native module mocked present, a single-key payload resolves through to the mocked native module call and the returned shape contains `observations`, `analysisMs`, `imageWidth`, `imageHeight`
  - (use jest mocking of `requireOptionalNativeModule` and platform module resolution)
- [ ] T010 [P] Write config plugin test `test/unit/plugins/with-vision/index.test.ts` asserting against fixture Expo configs:
  - Adds `NSCameraUsageDescription` with the default copy ("Used to demonstrate on-device Vision analysis") when the key is absent (FR-026)
  - Preserves an existing `NSCameraUsageDescription` value when present (does not overwrite operator-supplied copy; FR-026)
  - Idempotent: running the plugin twice on the same config produces deep-equal output (FR-028)
  - Coexists with feature 007's `LiveActivityWidget` target, feature 014's `HomeWidget` target, feature 015's `DeviceActivityMonitorExtension` target, and feature 016's CoreML config without collision (FR-029)
  - Does not modify any entitlements, App Groups, or extension targets belonging to features 007 / 014 / 015 / 016
- [ ] T011 [P] Write manifest test `test/unit/modules/camera-vision/manifest.test.ts`: manifest `id === 'camera-vision'`, `platforms` includes `'ios'`, `'android'`, `'web'`, `minIOS === '13.0'`, `screen` reference resolves (FR-001, FR-003)

### Foundational Implementation

- [ ] T012 [P] Implement `src/modules/camera-vision/vision-types.ts` per `data-model.md` §1–§2 and `contracts/vision-bridge.contract.ts`: export `BoundingBox`, `FaceObservation`, `TextObservation`, `BarcodeObservation`, `Observation` discriminated union, `VisionMode`, `ActiveVisionMode`, `AnalysisResult`, `AnalyzePayload`, type-guard helpers `isFace` / `isText` / `isBarcode`, and `labelFor(o)` with 80-char truncation — partially makes T008 pass
- [ ] T013 [P] Create shared bridge types + error classes `src/native/vision-detector.types.ts` per `contracts/vision-bridge.contract.ts`: re-export the value types from `vision-types.ts`, declare and export `VisionBridge` interface, `VisionNotSupported`, `VisionAnalysisFailed`, `InvalidInput` error classes (each with a `readonly code` literal and a `name` matching the class name) — completes T008's error-class assertions
- [ ] T014 Implement iOS JS bridge `src/native/vision-detector.ts` using `requireOptionalNativeModule('Vision')`; `isAvailable()` returns `Platform.OS === 'ios' && nativeModule != null` synchronously; `analyze(mode, payload)` validates the `InvalidInput` cases (both keys, neither key) before delegating to the native module's async function; on `nativeModule === null`, every async method rejects with `new VisionNotSupported()` — partially makes T009 pass (depends on T013)
- [ ] T015 [P] Implement Android stub `src/native/vision-detector.android.ts`: `isAvailable() => false`, `analyze` rejects with `new VisionNotSupported()` — completes T009 (depends on T013)
- [ ] T016 [P] Implement Web stub `src/native/vision-detector.web.ts`: same shape as android stub — completes T009 (depends on T013)
- [ ] T017 [P] Create Swift `native/ios/vision/VisionDetector.swift` scaffold per `contracts/vision-detector.swift.md` §2: `import ExpoModulesCore / Vision / CoreImage / UIKit`; `public class VisionDetectorModule: Module` with `Name("Vision")` and an `AsyncFunction("analyze")` whose body validates the payload (`InvalidInputError` cases) and dispatches on `mode`. Per-mode request bodies left as `// TODO US1/US2/US3` markers; the request switch surface is in place. Define `InvalidInputError` and `VisionAnalysisFailedError` typed-throw helpers per §3. Wrap every entry point in `do/catch` so no Swift error escapes uncaught (NFR-006) — scaffold-only, not unit-testable on Windows
- [ ] T018 [P] Create `native/ios/vision/Vision.podspec` per `contracts/vision-detector.swift.md` §1: `s.name = 'Vision'`, `s.platforms = { :ios => '13.0' }`, `s.source_files = '*.swift'`, `s.dependency 'ExpoModulesCore'`, `s.frameworks = 'Vision', 'CoreImage'`, `s.swift_version = '5.9'` (this is what links Vision.framework into the iOS app target — the plugin does NOT mutate the Xcode project for framework linkage; research.md R-005)
- [ ] T019 [P] Create plugin entry point `plugins/with-vision/index.ts`: default-exported `ConfigPlugin` named `withVision` that composes a single `withInfoPlist` mod which sets `NSCameraUsageDescription` to "Used to demonstrate on-device Vision analysis." only when the key is absent; preserves any existing value untouched (idempotent per FR-028) — makes T010 pass
- [ ] T020 [P] Create `plugins/with-vision/package.json` with `name: "with-vision"`, `main: "./index.ts"`, `types: "./index.ts"`, no runtime deps
- [ ] T021 [P] Implement `src/modules/camera-vision/components/IOSOnlyBanner.tsx`: themed banner using `ThemedView` + `ThemedText` + `Spacing` + warning surface tokens from `useTheme()`; copy "Vision is iOS-only — open this module on an iOS 13+ device to see live face / text / barcode detection."; styled via `StyleSheet.create()`; sets `accessibilityRole="alert"` so screen readers announce it on Android / web (NFR-004)
- [ ] T022 [P] Write `test/unit/modules/camera-vision/components/IOSOnlyBanner.test.tsx`: renders the banner copy; uses `ThemedText` / `ThemedView`; sets `accessibilityRole="alert"`; uses the `Spacing` scale (validates T021)
- [ ] T023 Implement `src/modules/camera-vision/index.tsx`: exports a `ModuleManifest` with `id: 'camera-vision'`, `title: 'Camera Vision'`, `platforms: ['ios','android','web']`, `minIOS: '13.0'`, `screen: () => import('./screen')` — makes T011 pass
- [ ] T024 Edit `app.json`: add `"./plugins/with-vision"` to the `expo.plugins` array (single additive line, after the existing 016 `with-coreml` entry; FR-030, FR-036)
- [ ] T025 Edit `src/modules/registry.ts`: add the import line and the array entry for the camera-vision manifest (single additive 1–2 line edit; FR-001, FR-036)

**Checkpoint**: Vision-types, bridge (3 platform variants), Swift scaffold + podspec, config plugin, `IOSOnlyBanner`, manifest, app.json, and registry are wired. The module appears in the grid. Foundational tests T008 / T009 / T010 / T011 / T022 are green. User-story phases can now begin in parallel.

---

## Phase 3: User Story 1 — Detect faces in the live preview on iOS (Priority: P1) 🎯 MVP

**Goal**: A developer on an iOS 13+ device opens Modules → Camera Vision, grants camera permission at the system prompt, sees the live rear-camera preview fill the screen with the Mode Picker preselected to "Faces", and within ~1 second of pointing the camera at a face sees one or more green bounding-box rectangles appear over each detected face. The Stats Bar at the bottom reports a non-zero FPS, a positive `lastAnalysisMs`, and a `detected` count matching the number of visible boxes.

**Independent Test**: Build the app on an iOS 13+ device, open Camera Vision, grant camera permission, point the rear camera at any face. Verify (a) the preview renders without dropped frames in the camera surface itself, (b) at least one bounding box appears within ~1 second of a face entering frame, (c) the Stats Bar shows non-zero FPS + positive `lastAnalysisMs` + correct `detected` count, (d) all rectangles disappear within ~1 second of the camera being pointed away, (e) `pnpm test` is green for every test in this phase.

### Tests for User Story 1 (write FIRST, must FAIL before implementation)

- [ ] T026 [P] [US1] Test `test/unit/modules/camera-vision/components/CameraPreview.test.tsx`: renders an `expo-camera` `CameraView`; forwards the `ref` prop to the underlying `CameraView`; passes `facing` and `flashMode` props through; on `.web.tsx` variant renders the static "Camera not available in this browser" placeholder instead (FR-004, FR-010)
- [ ] T027 [P] [US1] Test `test/unit/modules/camera-vision/components/OverlayCanvas.test.tsx`: renders zero `<View>` children for `observations: []`; renders one absolutely-positioned `<View>` per observation, sized and positioned from `boundingBox` (assert width/height/left/top translate from normalized to view-pixel space using a fixed parent layout); each rectangle's `accessibilityLabel` matches `labelFor(observation)` (`"Face"` for faces); honours `useReducedMotion()` by rendering instantaneously (no animation) (FR-006, FR-007, NFR-005)
- [ ] T028 [P] [US1] Test `test/unit/modules/camera-vision/components/ModePicker.test.tsx`: renders four segments labelled "Faces", "Text", "Barcodes", "Off"; default selected segment when `mode === 'faces'`; tapping a segment invokes `onModeChange(newMode)` exactly once with the correct value; when `disabled` prop is set, segments render in visually disabled state and tap is a no-op (FR-005, FR-009)
- [ ] T029 [P] [US1] Test `test/unit/modules/camera-vision/components/StatsBar.test.tsx`: renders `fps` to one decimal place; renders `lastAnalysisMs` as `${ms} ms` for positive values and `—` when null; renders `detected` count; uses `ThemedText` and the `Spacing` scale (FR-008)
- [ ] T030 [P] [US1] Test `test/unit/modules/camera-vision/hooks/useFrameAnalyzer.test.tsx` using `jest.useFakeTimers()` and `bridgeOverride`:
  - Mounting with `mode: 'faces'`, granted permission, and a non-null `cameraRef.current` causes a `takePictureAsync` call within `intervalMs` (default 250 ms); the result is passed to `bridge.analyze('faces', payload)`; on resolve `observations` / `detected` / `lastAnalysisMs` / `fps` update
  - Mounting with `mode: 'off'` triggers no `takePictureAsync` calls regardless of how many ticks fire
  - Switching `mode` from `'faces'` to `'off'` clears `observations` to `[]` and `detected` to `0`; `fps` and `lastAnalysisMs` retain their last values (FR-018)
  - Switching `mode` mid-cycle (between two non-`'off'` values) discards the in-flight result if it resolves after the change (single in-flight token; FR-015)
  - Overlap-skip: if a previous cycle is still in flight when the next tick fires, no second `analyze` call is issued (FR-015)
  - Custom `intervalMs: 500` causes ticks at 500 ms cadence
  - Unmount fully tears down the loop: no further `takePictureAsync` calls, no `setState` warnings, no leaked timers (NFR-003, FR-015)
  - Permission denied path skips analysis entirely (no `takePictureAsync` calls)
  - `analyze` rejecting with `VisionAnalysisFailed` populates `error`; previous `observations` are unchanged; the next successful cycle clears `error`
- [ ] T031 [P] [US1] Test `test/unit/modules/camera-vision/screen.test.tsx`: iOS screen mounts, asks for camera permission via the mocked `useCameraPermissions`; on denied, renders the inline message + retry button and never starts the loop (FR-011, FR-012); on granted, renders `CameraPreview` + `OverlayCanvas` + `ModePicker` (preselected "Faces") + `CameraControls` + `StatsBar`; the analysis loop drives overlays through the mocked `vision-detector` (face-mode resolutions populate `OverlayCanvas`); on bridge rejection, renders an error banner without crashing (FR-004, FR-013, NFR-006)

### Implementation for User Story 1

- [ ] T032 [P] [US1] Implement `src/modules/camera-vision/components/CameraPreview.tsx` (iOS / Android default): wraps `expo-camera`'s `CameraView`; forwards `ref`; accepts `facing: 'back' | 'front'` and `flashMode: 'off' | 'auto' | 'on'` props (defaulted to `'back'` / `'off'`); fills the available area; styled via `StyleSheet.create()`; uses `ThemedView` only for any chrome around the surface — makes the iOS portion of T026 pass
- [ ] T033 [P] [US1] Implement `src/modules/camera-vision/components/OverlayCanvas.tsx`: absolutely-positioned container; renders one `Animated.View` per observation using `react-native-reanimated` shared values for `left` / `top` / `width` / `height`; transitions use a ~150 ms ease-out timing; honours `useReducedMotion()` by skipping the animation; sets `accessibilityLabel` from `labelFor(observation)`; bounding-box stroke colour from `useTheme()` (no hardcoded hex); styles via `StyleSheet.create()` merged with the animated style (the standard Reanimated pattern) — makes T027 pass
- [ ] T034 [P] [US1] Implement `src/modules/camera-vision/components/ModePicker.tsx`: four-segment control over `'faces' | 'text' | 'barcodes' | 'off'`; props `{ mode, onModeChange, disabled }`; uses `ThemedView` + `ThemedText` + `Spacing`; styled via `StyleSheet.create()`; `disabled` renders inert with reduced opacity — makes T028 pass
- [ ] T035 [P] [US1] Implement `src/modules/camera-vision/components/StatsBar.tsx`: props `{ fps, lastAnalysisMs, detected }`; renders `fps.toFixed(1)`, `${lastAnalysisMs} ms` (or `—` when null), and `detected`; uses `ThemedText` + `Spacing`; styled via `StyleSheet.create()` — makes T029 pass
- [ ] T036 [US1] Implement `src/modules/camera-vision/hooks/useFrameAnalyzer.ts` per `data-model.md` §5–§7 and `contracts/vision-bridge.contract.ts`:
  - Input: `{ mode, intervalMs = 250, cameraRef, bridgeOverride? }`
  - State: `{ fps, lastAnalysisMs, detected, observations, error }` (initialised per `initialFrameAnalyzerState`)
  - Internal: `inFlightRef: boolean`, `currentModeRef: VisionMode` (read inside the resolve callback to detect mode-change discards), FPS rolling-window ring buffer (8 samples), tick `setInterval` registered only when `mode !== 'off'` and `cameraRef.current != null` and `bridge.isAvailable()`
  - Tick body: if `inFlightRef` set → skip (overlap-skip); otherwise mark in-flight, capture mode-at-tick, call `cameraRef.current.takePictureAsync({ base64: true, quality: 0.5, skipProcessing: true })`, await `bridge.analyze(modeAtTick, { base64 })`; on resolve, if `modeAtTick !== currentModeRef.current` discard; else update state atomically (`observations`, `detected = observations.length`, `lastAnalysisMs`, `fps` from rolling window, `error = null`); on reject populate `error`, leave `observations` untouched, clear `inFlightRef`; always clear `inFlightRef` in `finally`
  - Mode change to `'off'`: clear interval, set `observations: []` + `detected: 0`, retain `fps` + `lastAnalysisMs` (FR-018)
  - Unmount: clear interval, set a `unmountedRef`, `setState` calls inside the resolve / reject callbacks no-op when `unmountedRef.current` is true (NFR-003)
  - Permission denied: hook is gated by the screen passing `cameraRef.current = null` until permission granted; the hook never starts the loop in that state (FR-011)
  - makes T030 pass
- [ ] T037 [US1] Implement `src/modules/camera-vision/screen.tsx`: imports `useCameraPermissions` from `expo-camera`; renders the permission affordance + inline message + retry button when not granted (FR-012); when granted, mounts `CameraPreview` (with a `useRef<CameraView | null>(null)`), instantiates `useFrameAnalyzer({ mode, intervalMs: 250, cameraRef })`, renders `OverlayCanvas` (consuming `observations`), `ModePicker` (state-driven `mode`, default `'faces'`, FR-005), `CameraControls` (with default `facing: 'back'` / `flashMode: 'off'` — wiring to actually mutate them lives in US4), and `StatsBar` (consuming `fps` / `lastAnalysisMs` / `detected`); renders an error banner when the hook surfaces a non-`VisionNotSupported` error — makes T031 pass (depends on T012, T014, T032–T036)
- [ ] T038 [US1] Complete the `'faces'` branch in Swift `native/ios/vision/VisionDetector.swift`: instantiate `VNDetectFaceRectanglesRequest`; build `VNImageRequestHandler(cgImage:options:)` from the decoded payload; measure wall-clock duration via `CFAbsoluteTimeGetCurrent()` around `handler.perform([request])`; convert each `VNFaceObservation` to the JS shape with the bottom-left → top-left Y-flip (`yTop = 1.0 - (bbox.origin.y + bbox.height)`, contracts/vision-detector.swift.md §5); return `{ observations, analysisMs, imageWidth, imageHeight }` — verifies on-device per quickstart §4 (NFR-001)

**Checkpoint**: User Story 1 is complete. The module appears in the Modules grid, the iOS faces-mode pipeline is fully exercised end-to-end on device, every native action surfaces a typed error without crashing, and `pnpm test` is green for the entire camera-vision tree on Windows. **This is the MVP — deploy/demo from here.**

---

## Phase 4: User Story 2 — Recognize text in the live preview (Priority: P2)

**Goal**: The developer switches the Mode Picker from "Faces" to "Text", points the camera at a printed page or signage, and within ~1.5 seconds sees bounding boxes drawn around each recognized text region. Each overlay's `accessibilityLabel` contains the recognized string (visible to screen readers and to test fixtures); the on-screen UI itself draws only the rectangles.

**Independent Test**: With US1 working and the device camera permission granted, switch Mode to "Text" and point the camera at printed text. Verify bounding boxes appear within ~1.5 seconds, the Stats Bar `detected` count matches the number of overlays, and the next mode switch back to "Faces" clears text overlays within one analysis cycle.

### Tests for User Story 2 (write FIRST)

- [ ] T039 [P] [US2] Extend `test/unit/modules/camera-vision/components/OverlayCanvas.test.tsx` (or add `OverlayCanvas.text.test.tsx` if cleaner): renders text observations with `accessibilityLabel` set to the recognized string, truncated to 80 chars + ellipsis when longer (FR-007); strings with non-ASCII / multi-byte content are preserved
- [ ] T040 [P] [US2] Extend `test/unit/modules/camera-vision/screen.test.tsx`: switching `ModePicker` to `'text'` clears prior face overlays within one analysis cycle (in-flight discard); the next analysis call is `bridge.analyze('text', …)`; text observations populate the `OverlayCanvas` and the Stats Bar `detected` count (FR-005, FR-006)

### Implementation for User Story 2

- [ ] T041 [US2] Extend `src/modules/camera-vision/components/OverlayCanvas.tsx` so the per-observation `accessibilityLabel` already comes from `labelFor(o)` — verify the `text` branch is exercised (no code change expected if T033 already used `labelFor`; this task is the audit + the test-driven extension if not) — makes T039 pass (depends on T033)
- [ ] T042 [US2] Verify `screen.tsx` mode-change wiring already discards in-flight cycles when mode changes (T036 enforces this in the hook); add a focused screen test assertion that the discard path holds — makes T040 pass (depends on T036, T037)
- [ ] T043 [US2] Complete the `'text'` branch in Swift `native/ios/vision/VisionDetector.swift`: instantiate `VNRecognizeTextRequest` with `recognitionLevel = .fast` (research.md R-002); for each `VNRecognizedTextObservation` extract `topCandidates(1).first?.string ?? ""`; convert bounding box with the same Y-flip; emit `{ kind: "text", boundingBox, text }` (depends on T038's dispatch surface)

**Checkpoint**: User Story 2 is complete. Text mode produces overlays with accessibility labels containing the recognized string. JS-pure suite remains green; on-device verification per quickstart §4.

---

## Phase 5: User Story 3 — Scan barcodes / QR codes (Priority: P2)

**Goal**: The developer switches Mode to "Barcodes", points the camera at a QR code or 1D barcode, and within ~1 second sees a bounding-box overlay appear around each detected symbol. The overlay's `accessibilityLabel` contains the decoded payload string.

**Independent Test**: Switch Mode to "Barcodes", point at a QR code, verify a bounding box appears within ~1 second, verify the overlay's `accessibilityLabel` contains the decoded payload, verify multiple barcodes in frame produce one overlay each.

### Tests for User Story 3 (write FIRST)

- [ ] T044 [P] [US3] Extend `test/unit/modules/camera-vision/vision-types.test.ts` with barcode-symbology assertions: `BarcodeObservation` may omit `symbology`; `labelFor` for a barcode returns the `payload` (truncated to 80 chars when longer)
- [ ] T045 [P] [US3] Extend `test/unit/modules/camera-vision/screen.test.tsx`: switching `ModePicker` to `'barcodes'` causes the next `bridge.analyze` call to use `'barcodes'`; barcode observations populate the canvas and `accessibilityLabel` carries the decoded payload (FR-007)

### Implementation for User Story 3

- [ ] T046 [US3] Audit `src/modules/camera-vision/vision-types.ts` `labelFor` for the barcode branch — completes T044 (depends on T012)
- [ ] T047 [US3] Complete the `'barcodes'` branch in Swift `native/ios/vision/VisionDetector.swift`: instantiate `VNDetectBarcodesRequest`; for each `VNBarcodeObservation` read `payloadStringValue ?? ""`; strip the `VNBarcodeSymbology` prefix from `symbology.rawValue` and emit it (omit when stripping fails); same Y-flipped bounding box; emit `{ kind: "barcode", boundingBox, payload, symbology? }` (depends on T038)

**Checkpoint**: User Story 3 is complete. All three Vision request types are wired; the bridge surface is mode-parameterized end-to-end.

---

## Phase 6: User Story 4 — Camera controls: flip and flash (Priority: P2)

**Goal**: The developer taps the camera-flip button to swap rear ↔ front camera; the preview swaps and analysis continues at the same cadence. They tap the flash-mode button to cycle Off → Auto → On (where supported). Flash is hidden / non-interactive on cameras that lack flash hardware (e.g., the front camera on most devices).

**Independent Test**: With Mode "Faces" and rear camera active, tap camera-flip — verify preview swaps within one frame, overlays continue, Stats Bar continues. Tap flash-mode on the rear camera — verify icon cycles Off → Auto → On → Off. Verify flash button is hidden / disabled with the accessibility label "Flash not available on this camera" when the front camera (no flash) is active.

### Tests for User Story 4 (write FIRST)

- [ ] T048 [P] [US4] Test `test/unit/modules/camera-vision/components/CameraControls.test.tsx`: renders camera-flip + flash-mode buttons; tapping camera-flip invokes `onFlipCamera` once; tapping flash-mode cycles `'off' → 'auto' → 'on' → 'off'` via `onFlashModeChange`; when `flashAvailable={false}`, flash button is hidden or rendered in a non-interactive disabled state with `accessibilityLabel="Flash not available on this camera"` (FR-013)
- [ ] T049 [P] [US4] Extend `test/unit/modules/camera-vision/screen.test.tsx` with a flip-flow group: tapping camera-flip in the controls toggles the `facing` prop passed to `CameraPreview` between `'back'` and `'front'`; the `useFrameAnalyzer` instance is NOT torn down across the flip (same hook identity; analysis loop continues) (FR-014)

### Implementation for User Story 4

- [ ] T050 [P] [US4] Implement `src/modules/camera-vision/components/CameraControls.tsx`: props `{ facing, flashMode, flashAvailable, onFlipCamera, onFlashModeChange }`; renders two `Pressable`s with themed icon glyphs (camera-flip + flash-mode); flash-mode `Pressable` is hidden or rendered as `accessibilityState={{ disabled: true }}` with `accessibilityLabel="Flash not available on this camera"` when `flashAvailable === false`; styled via `StyleSheet.create()`; uses `ThemedView` + `Spacing` — makes T048 pass
- [ ] T051 [US4] Wire `CameraControls` into `src/modules/camera-vision/screen.tsx`: `useState` for `facing` (default `'back'`) and `flashMode` (default `'off'`); compute `flashAvailable` from `facing === 'back'` (front camera lacks flash on most devices); pass through to `CameraPreview` and `CameraControls`; the analyzer hook is NOT recreated when `facing` or `flashMode` change (verify by stable hook identity in T049) — makes T049 pass (depends on T037, T050)

**Checkpoint**: User Story 4 is complete. Camera controls feel like a real camera UI; analysis loop is uninterrupted across flips.

---

## Phase 7: User Story 5 — Cross-platform graceful degradation (Priority: P2)

**Goal**: On Android, the screen renders the live `expo-camera` preview, the inert `ModePicker`, and the "Vision is iOS-only" banner. On web, the screen renders the static "Camera not available in this browser" placeholder, the inert `ModePicker`, and the iOS-only banner. Neither platform starts the analysis loop, neither calls the bridge, and zero JavaScript exceptions reach the console across the screen lifecycle.

**Independent Test**: `pnpm android` and `pnpm web` — open the module, verify the live preview (Android) / placeholder (web), the inert Mode Picker, the iOS-only banner; verify `bridge.isAvailable()` returns `false` synchronously; verify no console errors across mount → mode-tap-attempts → unmount.

### Tests for User Story 5 (write FIRST)

- [ ] T052 [P] [US5] Test `test/unit/modules/camera-vision/screen.android.test.tsx`: renders `CameraPreview` (live `expo-camera`), `ModePicker` in `disabled` state, `IOSOnlyBanner`; never instantiates `useFrameAnalyzer`; never invokes any `vision-detector` bridge method (assert via mocked-bridge spy that `analyze` was never called); zero exceptions across mount / mode-tap / unmount (FR-009)
- [ ] T053 [P] [US5] Test `test/unit/modules/camera-vision/screen.web.test.tsx`: renders the `CameraPreview.web.tsx` placeholder ("Camera not available in this browser"), `ModePicker` disabled, `IOSOnlyBanner`; no analyzer; no bridge calls; zero exceptions (FR-010)
- [ ] T054 [P] [US5] Test `test/unit/modules/camera-vision/components/CameraPreview.test.tsx` (web variant assertion, may have been split out earlier in T026): renders the static placeholder text and not a `CameraView`

### Implementation for User Story 5

- [ ] T055 [P] [US5] Implement `src/modules/camera-vision/components/CameraPreview.web.tsx`: themed `<View>` with centered `ThemedText` "Camera not available in this browser"; uses `Spacing`; styled via `StyleSheet.create()`; same outward props shape as the iOS / Android variant (no-op `ref`, accepts `facing` / `flashMode` but ignores them) — makes T054 pass
- [ ] T056 [P] [US5] Implement `src/modules/camera-vision/screen.android.tsx`: renders `CameraPreview` (live, no overlay), `ModePicker` with `disabled={true}` and `mode='faces'` (visual default), and `IOSOnlyBanner`; no `useFrameAnalyzer` instance (FR-009, Constitution I) — makes T052 pass
- [ ] T057 [P] [US5] Implement `src/modules/camera-vision/screen.web.tsx`: renders the web `CameraPreview` placeholder, `ModePicker` disabled, and `IOSOnlyBanner`; no analyzer; no bridge calls (FR-010) — makes T053 pass

**Checkpoint**: User Story 5 is complete. The module renders identically (educationally) on all three platforms; iOS-only behaviour is explicit, never a silent failure. The `bridge.isAvailable()` short-circuit is enforced at the screen layer above the hook.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates and validation that span every story.

- [ ] T058 Run `pnpm format` from repo root and commit any formatting changes
- [ ] T059 Run `pnpm lint` from repo root; fix any lint errors introduced by the feature (no new `eslint-disable` comments)
- [ ] T060 Run `pnpm typecheck` from repo root; resolve any TypeScript strict-mode errors (FR-035)
- [ ] T061 Run `pnpm test` from repo root; confirm every camera-vision test from T008–T011, T022, T026–T031, T039–T040, T044–T045, T048–T049, T052–T054 is green and the overall suite is green (FR-032, FR-033)
- [ ] T062 Run `pnpm check` from repo root (the project's standard quality gate composing format / lint / typecheck / test) and verify a single green run end-to-end (FR-033)
- [ ] T063 [P] Walk through `quickstart.md` §2 (JS-pure verification on Windows) — record pass observations in commit message or PR description
- [ ] T064 [P] Walk through `quickstart.md` §3 (iOS prebuild on macOS / EAS Build) — verify `Info.plist` contains `NSCameraUsageDescription` after first prebuild and a second prebuild produces no diff (idempotency, SC-007); verify 007 / 014 / 015 / 016 plugin outputs are unaffected (SC-008)
- [ ] T065 [P] Walk through `quickstart.md` §4 (iOS device run): faces mode within 5 s of pointing at a face (SC-001); text mode produces text-region overlays; barcode mode decodes a QR; camera-flip swaps the preview without tearing down the loop; flash-mode cycles on rear, hidden / disabled on front; achieved cadence ≥ 2 fps in 95 % of 10 s windows (SC-004, NFR-001)
- [ ] T066 [P] Walk through `quickstart.md` §5 (cross-platform graceful degradation on Android + Web) — confirm zero console exceptions and the iOS-only banner renders (SC-005, SC-006)
- [ ] T067 Verify FR-036 / SC-003 additive-change-set constraint by running `git diff --stat main..HEAD -- src/ app.json package.json pnpm-lock.yaml` and confirming the only modifications to existing files are `src/modules/registry.ts` (≤ 2 lines), `app.json` (1 plugin entry), `package.json` (1 added dep), and `pnpm-lock.yaml` (auto-updated by `npx expo install`)
- [ ] T068 Verify NFR-008 / SC-010 size budget: `git diff --stat main..HEAD` total contributed bytes < 300 KB across Swift + JS + plugin + tests (no bundled media)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → no dependencies, run first
- **Foundational (Phase 2)** → depends on Setup; **BLOCKS all user-story phases**
- **User Story 1 (Phase 3, P1)** → depends on Foundational; independently testable; **MVP**
- **User Story 2 (Phase 4, P2)** → depends on Foundational + US1 (extends `OverlayCanvas` + `screen.tsx` tests; reuses the dispatch shape established by US1's Swift faces branch)
- **User Story 3 (Phase 5, P2)** → depends on Foundational + US1 (same Swift dispatch table); independent of US2
- **User Story 4 (Phase 6, P2)** → depends on Foundational + US1 (extends `screen.tsx` with state for `facing` / `flashMode` and adds `CameraControls`); independent of US2 / US3
- **User Story 5 (Phase 7, P2)** → depends on Foundational only at the JS level for the cross-platform screens; the Android / web screens consume `IOSOnlyBanner` (T021) and `CameraPreview` / `CameraPreview.web.tsx` (T032 / T055); independent of US1 functionally but the `CameraPreview` variant from T032 is referenced
- **Polish (Phase 8)** → depends on whichever stories you intend to ship

### Within-Story Dependencies

- Tests precede implementation in every story (RED → GREEN → REFACTOR)
- T012 (vision-types) must precede T013 (bridge types re-export) and every test that imports `Observation` / `labelFor`
- T013 (bridge types) must precede T014 / T015 / T016 (bridge variants)
- T014 (iOS bridge) must precede T036 (hook bridge calls) which must precede T037 (iOS screen mounts the hook)
- T017 (Swift scaffold) must precede T038 (US1 faces branch), T043 (US2 text branch), T047 (US3 barcodes branch)
- T021 (IOSOnlyBanner) must precede T056 / T057 (Android / web screens)
- T032 (CameraPreview iOS / Android) must precede T037 (iOS screen) and T056 (Android screen)
- T055 (CameraPreview web) must precede T057 (web screen)
- T036 (hook) must precede T037 (screen wires it) and T042 (mode-change discard verification)
- T037 (US1 screen) must precede T040 / T042 / T045 / T049 / T051 (each extends or asserts against the iOS screen)
- T050 (CameraControls) must precede T051 (screen wires it in)

### Parallel Opportunities

- T003–T007 (Setup directory creation) all parallel
- T008, T009, T010, T011 (Foundational test files) all parallel — different files
- T012 + T013 + T015 + T016 + T017 + T018 + T019 + T020 + T021 (Foundational implementation excluding the iOS bridge and the manifest) all parallel after the Foundational tests are written — different files
- T022 (banner test) parallel with T021 (banner impl) once T021 is in place
- T026–T031 (US1 component + hook + screen tests) all parallel — different files
- T032–T035 (US1 components: CameraPreview, OverlayCanvas, ModePicker, StatsBar) all parallel — different files; T036 (hook) parallel to them but feeds into T037
- T039 + T040 (US2 tests) parallel; T041 + T043 sequence after their tests; T042 depends on T037
- T044 + T045 (US3 tests) parallel; T046 + T047 sequence after their tests
- T048 + T049 (US4 tests) parallel; T050 (component) parallel to T049's screen test; T051 (screen wiring) sequences after T050
- T052 + T053 + T054 (US5 tests) all parallel; T055 + T056 + T057 (US5 screens + web preview) all parallel — different files
- T063 + T064 + T065 + T066 (Polish manual walkthroughs) parallel

### Cross-story coordination

- US1 establishes the Swift dispatch surface (T038); US2 (T043) and US3 (T047) extend it without restructuring it
- US1 + US2 + US3 share `OverlayCanvas.tsx` (T033) — `labelFor` polymorphism keeps the per-mode work isolated to the hook + Swift; no per-mode component
- US4 extends two US1 files (`screen.tsx` for state, plus the new `CameraControls.tsx`); branch from US1's tip
- US5 reuses `IOSOnlyBanner` (T021, foundational) and `CameraPreview` (T032, US1); the Android / web screens are independent of US2 / US3 / US4 because they never start the analyzer
- The `vision-types.ts` module (T012) is the single shared file imported by every component test, the hook test, the screen tests, the bridge contract test, and the Swift bridge's JS-side mock

---

## Parallel Example: User Story 1 component tests

```bash
# Launch all six US1 test files in parallel — independent files:
Task: "Test test/unit/modules/camera-vision/components/CameraPreview.test.tsx"
Task: "Test test/unit/modules/camera-vision/components/OverlayCanvas.test.tsx"
Task: "Test test/unit/modules/camera-vision/components/ModePicker.test.tsx"
Task: "Test test/unit/modules/camera-vision/components/StatsBar.test.tsx"
Task: "Test test/unit/modules/camera-vision/hooks/useFrameAnalyzer.test.tsx"
Task: "Test test/unit/modules/camera-vision/screen.test.tsx"

# Then launch the four US1 component implementations in parallel:
Task: "Implement src/modules/camera-vision/components/CameraPreview.tsx"
Task: "Implement src/modules/camera-vision/components/OverlayCanvas.tsx"
Task: "Implement src/modules/camera-vision/components/ModePicker.tsx"
Task: "Implement src/modules/camera-vision/components/StatsBar.tsx"

# Hook (T036) and screen (T037) sequence after the components land.
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1: Setup (branch verify, `npx expo install expo-camera`, directory skeleton)
2. Phase 2: Foundational (vision-types + bridge types + 3-platform bridge + Swift scaffold + podspec + plugin + IOSOnlyBanner + manifest + app.json + registry)
3. Phase 3: User Story 1 (faces mode end-to-end: components, hook, screen, Swift faces branch)
4. **STOP and VALIDATE**: walk Quickstart §2 (JS-pure suite) + §3 (iOS prebuild idempotency) + §4 face-detection on device
5. Ship/demo. The faces pipeline is fully working and tested.

### Incremental Delivery

- Setup + Foundational → Foundation ready
- Add US1 → Quickstart §2 + §3 + §4 (faces) validate → MVP ships
- Add US2 → text mode validates on device → text recognition shipped
- Add US3 → barcode mode validates on device → barcode scanning shipped
- Add US4 → camera-flip + flash validate on device → controls shipped
- Add US5 → Quickstart §5 validates on Android + Web → cross-platform shipped
- Polish (Phase 8) → quality gates green on every shipped increment

### Parallel Team Strategy

After Foundational completes:

- Developer A (P1, MVP): US1 — JS components + hook + screen on Windows; Swift faces branch (T038) on macOS in parallel
- Developer B (P2): US5 cross-platform screens — pure JS, Windows-runnable, parallel to A; depends only on T021 (IOSOnlyBanner) + T032 (CameraPreview) being in place
- Developer C (P2): US2 + US3 — branches from A's US1 tip once T037 + T038 are merged; pure JS extensions plus the Swift `text` (T043) and `barcodes` (T047) branches on macOS
- Developer D (P2): US4 — branches from A's US1 tip once T037 is merged; pure JS (CameraControls + screen state); no Swift work

All four streams converge into Polish (Phase 8) once their respective stories are merged.
