---
description: "Dependency-ordered task list for feature 016 — CoreML Playground Module"
---

# Tasks: CoreML Playground Module (`coreml-lab`)

**Input**: Design documents from `/specs/016-coreml-playground/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/coreml-bridge.contract.ts, contracts/coreml-state.contract.ts, quickstart.md

**Tests**: REQUIRED. FR-030 + Constitution Principle V mandate JS-pure tests for the reducer, the JS bridge (3 platform variants), the config plugin, every component, every screen variant, and the manifest. Native Swift sources are not Windows-testable; on-device verification is documented in `quickstart.md`.

**Organization**: Tasks are grouped by user story so each story can be implemented, tested, and demoed independently. Within each story, tests precede implementation (TDD: write → fail → implement → pass).

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Different file, no ordering dependency on any incomplete task — safe to run in parallel.
- **[Story]**: User story tag (US1 / US2 / US3). Setup, Foundational, and Polish phases carry no story tag.
- Every task lists the **exact** file path it touches.

## Path Conventions

Paths are relative to the repository root (`C:\Users\izkizk8\spot-016-coreml\`). The feature touches:

- `src/modules/coreml-lab/` — JS module (manifest + 3 screen variants + reducer + 5 components + sample PNGs)
- `src/native/coreml*.ts` — JS bridge (iOS default + Android + Web variants + types)
- `plugins/with-coreml/` — TS Expo config plugin (verifies operator-supplied `.mlmodel`, declares Xcode build resource)
- `native/ios/coreml/` — Swift sources (scaffold + happy-path bodies, not Windows-testable)
- `test/unit/modules/coreml-lab/`, `test/unit/native/`, `test/unit/plugins/with-coreml/` — Jest tests
- `src/modules/registry.ts`, `app.json`, `.gitignore`, `package.json` — single-line additive edits (only existing files touched)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the empty directory skeleton expected by every later phase. No production code yet.

- [ ] T001 Create directory `src/modules/coreml-lab/` and `src/modules/coreml-lab/components/` and `src/modules/coreml-lab/samples/`
- [ ] T002 [P] Ensure directory `src/native/` exists for the new coreml bridge variants (no files yet — scaffolded in Foundational)
- [ ] T003 [P] Create directory `plugins/with-coreml/`
- [ ] T004 [P] Create directory `native/ios/coreml/` and `native/ios/coreml/models/`
- [ ] T005 [P] Create test directories `test/unit/modules/coreml-lab/components/`, `test/unit/native/`, `test/unit/plugins/with-coreml/`

**Checkpoint**: Empty skeleton ready. No imports resolve yet — that is expected.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Ship the cross-cutting pieces every user story depends on: shared types + `CoreMLNotSupported` error class, reducer, JS bridge with platform stubs, the Swift native scaffold, the config plugin (with model-presence check), and the registry / app.json / .gitignore / package.json wiring.

**⚠️ CRITICAL**: No user story phase can begin until this phase is complete. The reducer and bridge are imported by every component; the plugin is required for any iOS build to bundle the `.mlmodel`; the registry edit is required for the module to appear in the grid.

### Foundational Tests (write FIRST, must FAIL before implementation)

- [ ] T006 [P] Write reducer test `test/unit/modules/coreml-lab/coreml-state.test.ts` covering the full transition table from `data-model.md` and `contracts/coreml-state.contract.ts` (every action, every guard: `MODEL_LOADED`, `IMAGE_SELECTED` from sample + library, `INFERENCE_STARTED` / `INFERENCE_SUCCEEDED` / `INFERENCE_FAILED`, `BRIDGE_ERROR` does not mutate other fields, `lastError` cleared on next success, top-K invariant)
- [ ] T007 [P] Write JS bridge contract test `test/unit/native/coreml.test.ts` asserting:
  - `isAvailable()` is synchronous and returns `false` when the optional native module is absent or `Platform.OS !== 'ios'`
  - `loadModel(name)` and `classify(imageBase64)` reject with `CoreMLNotSupportedError` on the android/web stubs
  - On iOS with the native module mocked present, both methods resolve through to the mocked native module call
  - (use jest mocking of `requireOptionalNativeModule` and platform module resolution)
- [ ] T008 [P] Write config plugin test `test/unit/plugins/with-coreml/index.test.ts` asserting against fixture Expo configs:
  - Fails the build with a single-step recovery message when `native/ios/coreml/models/MobileNetV2.mlmodel` is absent (FR-020)
  - Declares the `.mlmodel` as an Xcode build resource on the main iOS target so Xcode auto-compiles it to `.mlmodelc`
  - Coexists with feature 007's `LiveActivityWidget` target, feature 014's `HomeWidget` target, and feature 015's `DeviceActivityMonitorExtension` target without collision (FR-028)
  - Does not modify any entitlements or App Groups belonging to features 007 / 014 / 015
  - Idempotent: running the plugin twice produces deep-equal config (FR-022 equivalent for this plugin)

### Foundational Implementation

- [ ] T009 [P] Create shared types + error classes `src/native/coreml.types.ts` per `contracts/coreml-bridge.contract.ts` (export `Prediction`, `ClassificationResult`, `ComputeUnits`, `CoreMLBridge` interface, `CoreMLNotSupportedError`, `ModelLoadError`, `InferenceError`)
- [ ] T010 Implement reducer `src/modules/coreml-lab/coreml-state.ts` per `data-model.md` and `contracts/coreml-state.contract.ts` (pure functions, all action types, all guards, exported `initialState`, exported `reducer`) — makes T006 pass
- [ ] T011 Implement iOS JS bridge `src/native/coreml.ts` using `requireOptionalNativeModule('SpotCoreML')`; on `null`, route every async method through a sentinel-rejecting wrapper that throws `CoreMLNotSupportedError`; `isAvailable()` returns `Platform.OS === 'ios' && nativeModule != null` synchronously — partially makes T007 pass (depends on T009)
- [ ] T012 [P] Implement Android stub `src/native/coreml.android.ts`: `isAvailable() => false`, `loadModel` and `classify` reject with `new CoreMLNotSupportedError()` — completes T007 (depends on T009)
- [ ] T013 [P] Implement Web stub `src/native/coreml.web.ts`: same shape as android stub — completes T007 (depends on T009)
- [ ] T014 [P] Create Swift `native/ios/coreml/CoreMLClassifier.swift` scaffold: wraps a `VNCoreMLRequest` against an `MLModel` loaded with `MLComputeUnits.all`; exposes `loadModel(name:)` and `classify(image:topK:)`; reads back the actually-selected compute units via `model.configuration.computeUnits`; returns top-K labelled `Prediction`s + wall-clock inference duration; every entry point wrapped in `do/catch` (R-001, NFR-006) — scaffold-only, not unit-testable on Windows
- [ ] T015 [P] Create Swift `native/ios/coreml/CoreMLBridge.swift` scaffold: expo-modules-core `Module` definition exposing `loadModel(name:)` and `classify(imageBase64:)`; decodes base64 → `UIImage` → `CIImage`; calls into `CoreMLClassifier` (T014); maps Swift errors to typed JS rejections (`ModelLoadError` / `InferenceError`); never throws an uncaught exception (FR-014, NFR-006) — scaffold-only, not unit-testable on Windows
- [ ] T016 [P] Create `native/ios/coreml/CoreML.podspec` registering the Swift sources with expo-modules-core
- [ ] T017 [P] Create `native/ios/coreml/.gitignore` containing `models/*.mlmodel` and `models/*.mlmodelc` so the operator-supplied model file is never accidentally committed (FR-020)
- [ ] T018 [P] Create `native/ios/coreml/models/.gitkeep` so the otherwise-empty models directory exists in the repo for the plugin's presence check to read against
- [ ] T019 [P] Create plugin entry point `plugins/with-coreml/index.ts` (default-exported `ConfigPlugin`, `withCoreML`) that composes the model-presence check with an `withDangerousMod` (`ios`) hook that declares the `.mlmodel` as a `PBXBuildFile` resource on the main iOS target
- [ ] T020 [P] Create `plugins/with-coreml/verify-model-presence.ts` that, at prebuild time, checks `native/ios/coreml/models/MobileNetV2.mlmodel` exists; on absence throws an `Error` whose message includes a single-step recovery instruction pointing at `quickstart.md` (FR-020, SC-008) — completes T008 (depends on T019)
- [ ] T021 [P] Create `plugins/with-coreml/package.json` with `name`, `main: "./index.ts"`, `types`, no runtime deps
- [ ] T022 [P] Create `src/modules/coreml-lab/model-registry.ts`: JS-side `ModelDescriptor` list with a single entry for MobileNetV2 (`id: 'mobilenetv2'`, `displayName: 'MobileNetV2'`, `inputSize: { width: 224, height: 224 }`, `topK: 5`); exported as a typed const array
- [ ] T023 [P] Create `src/modules/coreml-lab/samples/LICENSE.md` (CC0 / Apache-2.0 attribution for the bundled sample images)
- [ ] T024 [P] Add 3–4 sample PNG fixtures under `src/modules/coreml-lab/samples/` (e.g. `labrador.png`, `coffee-mug.png`, `bicycle.png`) — each ≤ 100 KB, total directory ≤ 400 KB; chosen so MobileNetV2 yields recognisable top-1 labels for demo purposes
- [ ] T025 Edit `app.json`: add `"./plugins/with-coreml"` to the `expo.plugins` array (single additive line, after the existing 015 `with-screentime` entry; FR-034)
- [ ] T026 Edit `.gitignore`: add `native/ios/coreml/models/*.mlmodel` and `native/ios/coreml/models/*.mlmodelc` (single additive block; FR-020)
- [ ] T027 Edit `package.json`: add `expo-image-picker` to `dependencies` (orchestrator will run `npx expo install expo-image-picker` to pin the SDK-aligned version and update `pnpm-lock.yaml`)
- [ ] T028 Edit `src/modules/registry.ts`: add the import line and the array entry for the coreml-lab manifest (single additive 1–2 line edit; FR-001, FR-034)

**Checkpoint**: Reducer, bridge (3 platform variants), Swift scaffold, config plugin (with model-presence guard), app.json, .gitignore, package.json, and registry are wired. The module appears in the grid. Foundational tests T006 / T007 / T008 are green. User-story phases can now begin in parallel.

---

## Phase 3: User Story 1 — Classify a bundled sample image on iOS (Priority: P1) 🎯 MVP

**Goal**: A developer on an entitled iOS 13+ device opens Modules → CoreML Playground, sees the curated grid of bundled sample PNGs, taps one, watches the selected image render in the preview, taps "Classify" and within ~100 ms sees the **top-5 ImageNet predictions** animate into a horizontal bar chart alongside a perf row showing inference milliseconds and the actually-selected compute units.

**Independent Test**: On an iOS device or simulator with the operator-supplied `MobileNetV2.mlmodel` present (Quickstart §2), navigate to the module. Verify (a) sample grid renders 3–4 thumbnails, (b) tapping a thumbnail updates the preview, (c) tapping "Classify" produces 5 labelled bars in descending probability order within the perf budget, (d) `pnpm test` is green for every test in this phase.

### Tests for User Story 1 (write FIRST, must FAIL before implementation)

- [ ] T029 [P] [US1] Test `test/unit/modules/coreml-lab/components/SampleImageGrid.test.tsx`: renders a thumbnail per entry from a `samples` prop; tapping a thumbnail invokes `onSelect(sample)` exactly once; the currently-selected thumbnail receives a visual selected-state style; uses `ThemedView` / `ThemedText` and the `Spacing` scale (FR-002)
- [ ] T030 [P] [US1] Test `test/unit/modules/coreml-lab/components/PredictionsChart.test.tsx`: renders one bar per prediction (max 5); bar widths are proportional to `prediction.probability` (largest = 100 %); empty `predictions` prop renders the empty-state copy; honours `useReducedMotion()` by skipping the width animation (FR-005, NFR-003)
- [ ] T031 [P] [US1] Test `test/unit/modules/coreml-lab/components/PerformanceMetrics.test.tsx`: renders "—" for both inference ms and compute units when `metrics === null`; renders `${ms} ms` and the compute-units string (`all` / `cpuOnly` / `cpuAndGPU` / `cpuAndNeuralEngine`) when populated; uses `ThemedText` and the `Spacing` scale (FR-006)
- [ ] T032 [P] [US1] Test `test/unit/modules/coreml-lab/components/ImageSourcePicker.test.tsx` (sample-source mode only): renders a segmented control with "Sample" and "Photo Library" segments; tapping "Sample" invokes `onSourceChange('sample')`; the "Photo Library" segment is rendered but its behaviour is exercised in US2's tests (FR-003)
- [ ] T033 [P] [US1] Test `test/unit/modules/coreml-lab/screen.test.tsx`: iOS screen mounts the reducer; renders `ImageSourcePicker` + `SampleImageGrid` + selected-image preview + `PredictionsChart` + `PerformanceMetrics`; tapping a sample then the Classify button dispatches `INFERENCE_STARTED` → calls `bridge.classify` → on resolve dispatches `INFERENCE_SUCCEEDED` with predictions + metrics; on reject dispatches `INFERENCE_FAILED` and surfaces an error banner without crashing (FR-004, FR-013, NFR-006)
- [ ] T034 [P] [US1] Test `test/unit/modules/coreml-lab/manifest.test.ts`: manifest `id === 'coreml-lab'`, `platforms` includes `'ios'`, `'android'`, `'web'`, `minIOS === '13.0'`, `screen` reference resolves (FR-001)
- [ ] T035 [P] [US1] Test `test/unit/modules/coreml-lab/model-registry.test.ts`: registry exports a non-empty array; every `ModelDescriptor` has `id`, `displayName`, `inputSize`, `topK`; `mobilenetv2` entry has `topK === 5` and `inputSize === { width: 224, height: 224 }`

### Implementation for User Story 1

- [ ] T036 [P] [US1] Implement `src/modules/coreml-lab/components/SampleImageGrid.tsx` (props: `{ samples, selectedId, onSelect }`; uses `ThemedView` + `Spacing`; styles via `StyleSheet.create()`; samples referenced via `require('./samples/<name>.png')` so Metro bundles them) — makes T029 pass
- [ ] T037 [P] [US1] Implement `src/modules/coreml-lab/components/PredictionsChart.tsx` using `react-native-reanimated` for bar-width animations (~300 ms ease-out); honours `useReducedMotion()`; renders top-5 bars in descending probability order; bar fill colour from `useTheme()` (no hardcoded hex) — makes T030 pass
- [ ] T038 [P] [US1] Implement `src/modules/coreml-lab/components/PerformanceMetrics.tsx` (props: `{ metrics: { inferenceMs, computeUnits } | null }`; `ThemedText` + `Spacing`; styles via `StyleSheet.create()`) — makes T031 pass
- [ ] T039 [P] [US1] Implement `src/modules/coreml-lab/components/ImageSourcePicker.tsx` (segmented control over `'sample' | 'library'`; the library-side behaviour is wired in US2; the sample side is fully functional here) — makes T032 pass
- [ ] T040 [US1] Implement `src/modules/coreml-lab/screen.tsx`: mounts `useReducer(reducer, initialState)`; on mount calls `bridge.loadModel('mobilenetv2')` and dispatches `MODEL_LOADED` / `BRIDGE_ERROR`; renders the `ImageSourcePicker` + `SampleImageGrid` + selected preview + Classify button + `PredictionsChart` + `PerformanceMetrics`; threads state + dispatch into each component — makes T033 pass (depends on T010, T011, T036–T039)
- [ ] T041 [US1] Implement `src/modules/coreml-lab/index.tsx`: exports a `ModuleManifest` with `id: 'coreml-lab'`, `title: 'CoreML Playground'`, `platforms: ['ios','android','web']`, `minIOS: '13.0'`, `screen: () => import('./screen')` — makes T034 pass
- [ ] T042 [US1] Complete Swift `native/ios/coreml/CoreMLClassifier.swift` happy-path body: load `MLModel(contentsOf: Bundle.main.url(forResource: name, withExtension: "mlmodelc")!)` with `MLComputeUnits.all`; build a `VNCoreMLRequest`; on `classify(image:topK:)` measure wall-clock duration with `CFAbsoluteTimeGetCurrent()`, run the request via `VNImageRequestHandler`, sort `VNClassificationObservation`s by confidence, return the first `topK` mapped to `Prediction(label, probability)` plus `inferenceMs` + the resolved `model.configuration.computeUnits` — verifies on-device per quickstart §3a (NFR-001)
- [ ] T043 [US1] Complete Swift `native/ios/coreml/CoreMLBridge.swift` happy-path bodies for `loadModel(name:)` and `classify(imageBase64:)`: base64-decode → `UIImage` → `CIImage`; delegate to `CoreMLClassifier`; map any thrown Swift error to a typed `Promise.reject(code, message)` matching `ModelLoadError` / `InferenceError` from T009 (R-001, FR-014, NFR-006)

**Checkpoint**: User Story 1 is complete. The module appears in the Modules grid, the iOS sample-image inference path is fully exercised end-to-end on device, every native action surfaces a typed error without crashing, and `pnpm test` is green for the entire coreml-lab tree on Windows. **This is the MVP — deploy/demo from here.**

---

## Phase 4: User Story 2 — Classify an image from the Photo Library (Priority: P2)

**Goal**: A developer taps the "Photo Library" segment of the source picker, the system permission prompt appears (first time only), they choose an image from their library, the chosen image renders in the preview, and tapping Classify produces top-5 predictions + perf metrics identical in shape to the US1 path.

**Independent Test**: On an iOS device with US1 working, switch the source picker to "Photo Library", grant permission, choose a photo, tap Classify, observe predictions populated within the perf budget. Permission denial shows a recoverable banner; cancel from the picker leaves the previous selection intact.

### Tests for User Story 2 (write FIRST)

- [ ] T044 [P] [US2] Extend `test/unit/modules/coreml-lab/components/ImageSourcePicker.test.tsx` (or add `ImageSourcePicker.library.test.tsx` if cleaner) with library-mode assertions: tapping "Photo Library" invokes `onPickFromLibrary`; on resolve with an asset, invokes `onImagePicked(asset)`; on permission denial, invokes `onPermissionDenied()`; on user-cancel, invokes neither callback and leaves prior selection intact (FR-003, FR-012)
- [ ] T045 [P] [US2] Extend `test/unit/modules/coreml-lab/screen.test.tsx` with a library-flow group: switching source to `'library'` and triggering a successful pick dispatches `IMAGE_SELECTED` with `source === 'library'`; permission denial surfaces a recoverable banner; subsequent Classify uses the picked asset's base64 (FR-004, FR-012, FR-013)

### Implementation for User Story 2

- [ ] T046 [US2] Extend `src/modules/coreml-lab/components/ImageSourcePicker.tsx` to call `expo-image-picker`'s `requestMediaLibraryPermissionsAsync()` + `launchImageLibraryAsync({ mediaTypes: 'Images', base64: true, quality: 0.8 })`; surface the three result paths (asset / cancel / denied) via the props introduced in T044 — makes T044 pass (depends on T039)
- [ ] T047 [US2] Extend `src/modules/coreml-lab/screen.tsx` to wire the new `ImageSourcePicker` callbacks into reducer dispatches (`IMAGE_SELECTED` for the resolved asset, a permission-denied banner state for denial, no-op on cancel); the existing Classify button works unchanged because it operates on whichever image is currently in reducer state — makes T045 pass (depends on T040, T046)
- [ ] T048 [US2] Verify (no new file) that the Swift `CoreMLBridge.classify(imageBase64:)` from T043 already accepts arbitrary base64-PNG / base64-JPEG payloads — Photo Library assets are JPEG-encoded — and add a guard that rejects with `InferenceError("UnsupportedImageEncoding")` if `UIImage(data:)` returns nil (NFR-006)

**Checkpoint**: User Story 2 is complete. The module supports both bundled-sample and Photo-Library sources on iOS. Permission denial and user-cancel are handled without crashing. JS-pure test suite remains green.

---

## Phase 5: User Story 3 — Cross-platform graceful degradation + Model Picker (Priority: P3)

**Goal**: (a) On Android and Web, the module appears in the grid, opens to a "CoreML is iOS-only" banner, renders the educational scaffold (sample grid, chart shell, perf row, model picker) with the Classify button disabled — no exceptions ever reach the JS console. (b) On iOS, a `ModelPicker` UI surfaces the JS-side `ModelDescriptor` registry; today only `mobilenetv2` is available, but the picker is wired so adding a second descriptor in the future requires no screen changes.

**Independent Test**: `pnpm android` and `pnpm web` — open the module, verify the iOS-only banner, verify all controls render in disabled mode, verify `bridge.isAvailable()` returns `false` synchronously, verify no console errors. On iOS, open the picker, verify "MobileNetV2" is the single selectable entry, verify selecting it dispatches `MODEL_SELECTED`.

### Tests for User Story 3 (write FIRST)

- [ ] T049 [P] [US3] Test `test/unit/modules/coreml-lab/components/ModelPicker.test.tsx`: renders one row per `ModelDescriptor` from the registry; the row matching `selectedModelId` receives a selected style; tapping a row invokes `onSelect(model.id)`; uses `ThemedText` + `Spacing`; styles via `StyleSheet.create()` (FR-007)
- [ ] T050 [P] [US3] Test `test/unit/modules/coreml-lab/screen.android.test.tsx`: renders "CoreML is iOS-only" banner; renders the educational scaffold (sample grid, chart shell, perf row, model picker) with the Classify button in its disabled state; never throws; never invokes any async bridge method (FR-011)
- [ ] T051 [P] [US3] Test `test/unit/modules/coreml-lab/screen.web.test.tsx`: identical assertions to T050 but for the web variant (FR-011)

### Implementation for User Story 3

- [ ] T052 [P] [US3] Implement `src/modules/coreml-lab/components/ModelPicker.tsx` (props: `{ models: ModelDescriptor[], selectedModelId, onSelect }`; uses `ThemedView` + `ThemedText` + `Spacing`; styles via `StyleSheet.create()`) — makes T049 pass
- [ ] T053 [US3] Wire `ModelPicker` into `src/modules/coreml-lab/screen.tsx`: render below `PerformanceMetrics`; on select dispatch `MODEL_SELECTED` and re-call `bridge.loadModel(id)` (depends on T040, T052)
- [ ] T054 [P] [US3] Implement `src/modules/coreml-lab/screen.android.tsx`: renders an iOS-only banner (sibling `IosOnlyBanner` reusing themed primitives) + the educational scaffold (sample grid, chart shell, perf row, model picker) in disabled mode; no bridge calls; samples remain selectable for visual continuity (FR-011, Constitution I) — makes T050 pass
- [ ] T055 [P] [US3] Implement `src/modules/coreml-lab/screen.web.tsx`: identical to T054 but for web — makes T051 pass

**Checkpoint**: User Story 3 is complete. The module renders identically (educationally) on all three platforms; iOS-only behaviour is explicit, never a silent failure. The Model Picker is wired for future model additions with no screen-side churn required.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates and validation that span every story.

- [ ] T056 Run `pnpm format` from repo root and commit any formatting changes
- [ ] T057 Run `pnpm lint` from repo root; fix any lint errors introduced by the feature (no new disable comments)
- [ ] T058 Run `pnpm typecheck` from repo root; resolve any TypeScript strict-mode errors (FR-034)
- [ ] T059 Run `pnpm test` from repo root; confirm every coreml-lab test from T006–T008, T029–T035, T044–T045, T049–T051 is green and overall suite is green (FR-030)
- [ ] T060 [P] Walk through `quickstart.md` §3a (run JS-pure suite on Windows) and §3b (operator drops `MobileNetV2.mlmodel` into `native/ios/coreml/models/`, then `npx expo prebuild` succeeds and the model file is bundled) — record observations in commit message or PR description
- [ ] T061 [P] Walk through `quickstart.md` §3c (cross-platform graceful degradation on Android + Web) — confirm no console exceptions and the iOS-only banner renders
- [ ] T062 [P] Walk through `quickstart.md` §3d (iOS device run: sample-image classification, then Photo-Library classification, then Model Picker selection) — verify per-inference budget < 100 ms on A14+ hardware (NFR-001)
- [ ] T063 Verify FR-034 additive-change-set constraint by running `git diff --stat main..HEAD -- src/ app.json .gitignore package.json` and confirming the only modifications to existing files are `src/modules/registry.ts` (≤ 2 lines), `app.json` (1 plugin entry), `.gitignore` (model-artifact ignore block), and `package.json` (1 added dep)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → no dependencies, run first
- **Foundational (Phase 2)** → depends on Setup; **BLOCKS all user-story phases**
- **User Story 1 (Phase 3, P1)** → depends on Foundational; independently testable; **MVP**
- **User Story 2 (Phase 4, P2)** → depends on Foundational + US1 (extends `ImageSourcePicker` and `screen.tsx`); on-device verification only for the success path
- **User Story 3 (Phase 5, P3)** → depends on Foundational only at the JS level for the cross-platform screens; the iOS Model Picker depends on US1 (`screen.tsx` exists); independent of US2
- **Polish (Phase 6)** → depends on whichever stories you intend to ship

### Within-Story Dependencies

- Tests precede implementation in every story (RED → GREEN)
- T010 (reducer) must precede every component that dispatches actions (T036–T040, T046–T047, T053)
- T009 (types) must precede T011/T012/T013 (bridge variants) and any test that imports the error classes
- T011 (iOS bridge) must precede T040 (iOS screen mount) — the screen calls the bridge at mount
- T019 (plugin index) must precede T020 (verify-presence sub-module wired into the index)
- T022 (model-registry) must precede T035 (registry test) and T049 / T052 (ModelPicker test + impl)
- T024 (sample PNGs) must precede T029 (SampleImageGrid test) and T036 (impl) at runtime — Jest `require()` resolution checks the file exists
- T039 (sample-mode `ImageSourcePicker`) must precede T046 (library-mode extension)
- T040 (iOS screen) must precede T047 (library-flow wiring) and T053 (ModelPicker wiring)
- T042 + T043 (Swift bodies) live in two files; T042 precedes T043 because the bridge delegates to the classifier

### Parallel Opportunities

- T002–T005 (Setup directory creation) all parallel
- T006, T007, T008 (Foundational test files) all parallel — different files
- T009 + T014–T024 (types, Swift scaffold pair + podspec + .gitignore + .gitkeep, plugin trio, model-registry, sample LICENSE + PNGs) all parallel after T006–T008 are written — different files
- T012, T013 (Android + Web stubs) parallel to each other once T009 lands
- T029–T035 (US1 component tests + screen test + manifest + model-registry tests) all parallel — different files
- T036–T039 (US1 components) all parallel — different files
- T044 + T045 (US2 tests) parallel; T046 sequences before T047 because they edit related files in the screen wiring chain
- T049 + T050 + T051 (US3 tests) all parallel; T052 + T054 + T055 (US3 ModelPicker + 2 screens) all parallel
- T060 + T061 + T062 (Polish manual walkthroughs) parallel

### Cross-story coordination

- US1 and US3 share `SampleImageGrid.tsx`, `PredictionsChart.tsx`, `PerformanceMetrics.tsx`, and `ModelPicker.tsx` (T036–T038, T052) — US3 screens (T054 / T055) consume them in disabled mode after US1 lands
- US2 extends two US1 files (`ImageSourcePicker.tsx`, `screen.tsx`); branch from the US1 commit and merge linearly — concurrent work on US2 + US3 should branch from US1's tip
- The reducer (T010) is a single file shared by every component test — write once, then T029–T035 can all run

---

## Parallel Example: User Story 1 component tests

```bash
# Launch all five US1 component tests in parallel — independent files:
Task: "Test test/unit/modules/coreml-lab/components/SampleImageGrid.test.tsx"
Task: "Test test/unit/modules/coreml-lab/components/PredictionsChart.test.tsx"
Task: "Test test/unit/modules/coreml-lab/components/PerformanceMetrics.test.tsx"
Task: "Test test/unit/modules/coreml-lab/components/ImageSourcePicker.test.tsx"
Task: "Test test/unit/modules/coreml-lab/screen.test.tsx"

# Then launch all four US1 component implementations in parallel:
Task: "Implement src/modules/coreml-lab/components/SampleImageGrid.tsx"
Task: "Implement src/modules/coreml-lab/components/PredictionsChart.tsx"
Task: "Implement src/modules/coreml-lab/components/PerformanceMetrics.tsx"
Task: "Implement src/modules/coreml-lab/components/ImageSourcePicker.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1: Setup
2. Phase 2: Foundational (reducer + bridge + plugin + Swift scaffold + model-registry + sample PNGs + registry + app.json + .gitignore + package.json)
3. Phase 3: User Story 1
4. **STOP and VALIDATE**: walk Quickstart §3a (Windows JS-pure suite) + §3b (prebuild with operator-supplied model) + §3d (iOS device classification of bundled sample)
5. Ship/demo. The bundled-sample inference experience is fully working and tested.

### Incremental Delivery

- Setup + Foundational → Foundation ready
- Add US1 → Quickstart §3a + §3b + §3d validate → MVP ships
- Add US2 → Photo-Library flow validates on device → user-supplied images shipped
- Add US3 → Quickstart §3c validates on Android + Web → cross-platform + Model Picker shipped
- Polish (Phase 6) → quality gates green on every shipped increment

### Parallel Team Strategy

After Foundational completes:
- Developer A: US1 (P1, MVP) — JS components + screen on Windows; Swift bodies (T042 / T043) on macOS in parallel
- Developer B: US3 (P3) cross-platform screens — pure JS, Windows-runnable, parallel to A; the ModelPicker wiring into `screen.tsx` (T053) waits for A's T040 to land
- Developer C: US2 (P2) — branches from A's US1 tip once T039 + T040 are merged; pure JS extensions plus a small Swift guard (T048) on macOS

