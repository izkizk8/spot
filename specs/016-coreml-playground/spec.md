# Feature Specification: CoreML Playground Module

**Feature Branch**: `016-coreml-playground`
**Created**: 2026-04-28
**Status**: Draft
**Input**: User description: "Feature 016 — CoreML Playground module — a code-complete educational module that demonstrates Apple's CoreML and Vision frameworks by running a bundled MobileNetV2 image-classification model on-device, with photo-library and bundled-sample image inputs, animated top-5 results, and graceful cross-platform degradation."

---

## ⚠️ Bundled Model Reality Check (READ FIRST)

CoreML model artifacts (`.mlmodel` / compiled `.mlmodelc`) are too large to commit to the repository. The MobileNetV2 model used by this module ships from **Apple's developer model gallery** and MUST be downloaded and dropped into `native/ios/coreml/models/MobileNetV2.mlmodel` **before EAS Build or local prebuild**. The model file is gitignored.

The 016 config plugin **verifies the presence of the model file at prebuild time** and fails fast with a clear actionable error if it is missing. EAS Build will fail at the prebuild step (not at runtime, not at upload) when the model is absent — the failure is loud, early, and recoverable by the documented one-step download.

**On-device verification is conditional on a real iOS device.** The simulator can run CoreML but the Neural Engine is unavailable; CPU/GPU compute is exercised in the simulator while ANE-backed inference is verifiable only on physical hardware. Windows-based development verifies only the JS-pure layer (reducer, bridge contract, plugin presence checks, components, manifest).

This reality check is repeated in two additional locations: the module's `quickstart.md` and the Assumptions section below.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Classify a bundled sample image on iOS (Priority: P1)

A developer studying the spot iOS showcase opens the app on an iOS 13+ device, taps the "CoreML Lab" card from the Modules grid, picks one of the 3–4 curated bundled sample images (e.g., a labrador, a coffee mug, a bicycle), taps "Run Inference", and sees the top-5 MobileNetV2 predictions appear as an animated horizontal bar chart with confidence percentages. A small metrics row reports the inference time in milliseconds and the compute units used (CPU / GPU / Neural Engine).

**Why this priority**: This is the MVP. It validates that an Expo app can bundle a `.mlmodelc`, load it via `MLModel(contentsOf:)`, run a `VNCoreMLRequest` against an in-memory image, and surface results to JS — the entire end-to-end story this module exists to demonstrate. It works without granting any system permission (no Photo Library access required) and ships its own deterministic test inputs.

**Independent Test**: Build the app on an iOS 13+ device or simulator with the MobileNetV2 model in place. Open the CoreML Lab module. Tap a sample image, then tap "Run Inference". Verify (a) five labeled bars animate from 0 → confidence percentage within ~300 ms, (b) the metrics row shows a positive integer in ms and a non-empty compute-units string, and (c) tapping a different sample and re-running produces a fresh result.

**Acceptance Scenarios**:

1. **Given** an iOS 13+ device with the MobileNetV2 model bundled, **When** the user opens the CoreML Lab module, **Then** the screen renders an Image Source Picker, a disabled "Run Inference" button, an empty Predictions panel, an empty Performance Metrics row, and a Model Picker preselected to "MobileNetV2".
2. **Given** the same screen, **When** the user taps a bundled sample image, **Then** that sample becomes the selected image (visually highlighted) and the "Run Inference" button becomes enabled.
3. **Given** a sample image is selected, **When** the user taps "Run Inference", **Then** within a reasonable time (target < 500 ms on modern hardware) the Predictions panel renders exactly five bars, each labeled with a class name and a percentage, sorted descending by confidence, with bar widths animated from 0 to their final values.
4. **Given** a successful inference, **When** the Performance Metrics row updates, **Then** it displays the last inference time in ms (positive integer) and the compute units used (one of `CPU`, `CPU+GPU`, `CPU+NeuralEngine`, or `All`).
5. **Given** a previous result is on screen, **When** the user picks a different sample and runs inference again, **Then** the bar chart resets to zero and re-animates to the new top-5; metrics update.

---

### User Story 2 — Classify an image from the Photo Library (Priority: P2)

The same developer wants to try the model on their own photos. They tap "Pick from Photo Library", grant Photo Library access at the system prompt, choose an image, return to the module, and run inference. The selected image is shown as a thumbnail in place of the sample grid selection; results behave identically to Story 1.

**Why this priority**: Demonstrates real-world inputs and exercises `expo-image-picker` integration. Secondary to Story 1 because it requires a runtime permission and depends on an external image source; the module is fully usable without it via the bundled samples.

**Independent Test**: With the app running on an iOS 13+ device, open the module, tap "Pick from Photo Library", grant access, select any photo, and tap "Run Inference". Verify the chosen image is shown as the active selection thumbnail and that top-5 predictions render as in Story 1.

**Acceptance Scenarios**:

1. **Given** the user has not yet granted Photo Library access, **When** they tap "Pick from Photo Library" for the first time, **Then** the system permission prompt is presented; on grant, the picker opens; on deny, the screen surfaces a non-crashing status message ("Photo Library access denied — pick a sample image instead") and no image is selected.
2. **Given** Photo Library access is granted, **When** the user selects a photo, **Then** the selected image replaces any previously selected sample image as the active selection (shown as a thumbnail), and the "Run Inference" button becomes enabled.
3. **Given** a Photo Library image is selected, **When** the user taps "Run Inference", **Then** the model receives the image (resized to the model's expected input dimensions by the Vision request) and returns top-5 predictions identical in shape to Story 1.
4. **Given** the user dismisses the picker without selecting, **When** the picker closes, **Then** the previously selected image (sample or photo) remains the active selection unchanged.

---

### User Story 3 — Switch models via the Model Picker (Priority: P3)

The module's Model Picker is a segmented control listing available bundled models. For this spec only **MobileNetV2** is shipped, so the picker has a single option selected by default. The architecture supports adding more models in follow-ups (each registered model exposes a `name` and the bridge's `loadModel(name)` returns a handle).

**Why this priority**: Useful as scaffolding for follow-up features but not required to deliver the core demonstration. Validates that the bridge's `loadModel(name)` contract is honored and that the UI is forward-compatible with a multi-model future.

**Independent Test**: With the app running on iOS, open the module and inspect the Model Picker. Verify it renders a single "MobileNetV2" segment, selected, and that programmatically adding a second mock entry to the registry causes a second segment to appear without other code changes (verifiable in unit tests).

**Acceptance Scenarios**:

1. **Given** the module ships with one bundled model, **When** the screen mounts, **Then** the Model Picker renders one segment labeled "MobileNetV2" and selected by default.
2. **Given** the picker has a single option, **When** the user taps it, **Then** no state change occurs and no inference is triggered (selection is idempotent).
3. **Given** a future entry is added to the model registry (verified via test fixture), **When** the screen renders, **Then** the picker shows N segments and selecting a different segment calls `bridge.loadModel(name)` and clears any prior result.

---

### User Story 4 — Cross-platform graceful degradation (Priority: P2)

A developer running the showcase on Android or in a web browser opens the Modules grid, sees the "CoreML Lab" card (registered for all platforms for educational purposes), taps it, and sees the same overall screen layout with a prominent "CoreML is iOS-only" banner. The Image Source Picker and Sample Image Grid still work for visual continuity; the "Run Inference" button is disabled and a tooltip / inline message explains why. No bridge calls are made.

**Why this priority**: The module is registered for `['ios','android','web']` to remain visible everywhere as an educational artifact; without this story the registry would either hide the module on non-iOS or crash on it.

**Independent Test**: Run the app on Android (emulator or device) and on web; open the module; verify the iOS-only banner is shown, sample images render and are tappable, the "Run Inference" button is disabled, and `bridge.isAvailable()` returns false (visible via the disabled state).

**Acceptance Scenarios**:

1. **Given** the app is running on Android or web, **When** the user opens the CoreML Lab module, **Then** an "CoreML is iOS-only" banner is displayed at the top and the "Run Inference" button is disabled with a tooltip / accessible label "CoreML is iOS-only".
2. **Given** the same context, **When** the user taps a sample image or picks a Photo Library image, **Then** the selection is recorded in UI state and the image is shown as a thumbnail (visual continuity), but the inference button remains disabled.
3. **Given** the same context, **When** any internal code path calls `bridge.isAvailable()`, **Then** it returns `false` synchronously without throwing.
4. **Given** the same context, **When** any other bridge method is invoked, **Then** it rejects with a `CoreMLNotSupported` error rather than crashing.

---

### Edge Cases

- **Model file missing at prebuild**: The 016 config plugin checks for `native/ios/coreml/models/MobileNetV2.mlmodel` (or `.mlpackage`) and fails the prebuild with a clear actionable error message including the download URL and target path; the project does not produce a partial / broken iOS build.
- **Model file present but corrupt**: `MLModel(contentsOf:)` throws; the bridge surfaces a typed `CoreMLLoadFailed` error; the screen displays "Model failed to load — see quickstart.md" and disables the inference button.
- **Inference throws at runtime** (e.g., unsupported image format): The bridge catches and surfaces a `CoreMLInferenceFailed` error; the chart clears and the status text reads "Inference failed: <message>".
- **Photo Library permission denied**: The "Pick from Photo Library" path surfaces a non-crashing message; sample images remain selectable and runnable.
- **Photo Library permission "limited"** (iOS 14+): Treated as granted for the picker flow; only photos the user shared with the app are visible.
- **Very large user photo**: The Vision request handles resizing to the model's expected input dimensions; the bridge does not need to pre-resize on the JS side.
- **Inference invoked with no image selected**: The "Run Inference" button is disabled in this state; if invoked programmatically, the bridge rejects with an `InvalidInput` error.
- **Tapping "Run Inference" repeatedly while a request is in flight**: Subsequent taps are ignored (button enters a "running" state) until the first request resolves; only one inference is in flight at a time.
- **iOS < 13**: The module's manifest declares `minIOS: '13.0'`. The 006 registry filters it from the grid on older iOS versions; if it is somehow opened, the module shows the iOS-only banner (treated identically to non-iOS).
- **Coexistence with 007/014/015 plugins**: The 016 config plugin must add the model `.mlmodelc` as a Bundle Resource without disturbing existing extension/widget targets from features 007 (Live Activities), 014 (Home Widgets), or 015 (ScreenTime).
- **Neural Engine unavailable**: On simulator or older hardware, the compute units string reports `CPU+GPU` or `CPU`; the inference still completes successfully.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Module Surface & Registration

- **FR-001**: The system MUST register a "CoreML Lab" module entry in `src/modules/registry.ts` with `platforms: ['ios','android','web']` and `minIOS: '13.0'`. This MUST be the only registry edit (a single import + array entry line).
- **FR-002**: The module MUST be discoverable from the 006 Modules grid and tappable to navigate into the showcase screen.
- **FR-003**: The module MUST provide three platform-specific screen entry files: `screen.tsx` (iOS default), `screen.android.tsx`, and `screen.web.tsx`.

#### On-Screen UI Sections

- **FR-004**: The iOS screen MUST render the following sections, in order: Image Source Picker, Sample Image Grid, selected-image preview, Run Inference button, Predictions Chart, Performance Metrics, Model Picker.
- **FR-005**: The Image Source Picker MUST offer two options: "Pick from Photo Library" and "Pick a sample image". A camera option MUST NOT appear (deferred).
- **FR-006**: The Sample Image Grid MUST render 3–4 bundled PNG sample images from `src/modules/coreml-lab/samples/`; each image asset MUST be < 100 KB. Tapping a sample selects it as the active image and visually highlights it.
- **FR-007**: The Run Inference button MUST be disabled until an image is selected and MUST enter a non-interactive "running" state while an inference request is in flight (FR-022).
- **FR-008**: The Predictions Chart MUST render exactly five horizontal bars sorted descending by confidence after a successful inference, each labeled with the class name and confidence percentage (e.g., `Labrador retriever — 87.4%`). Bar widths MUST animate from 0 to their final value over a short duration (target ~300 ms).
- **FR-009**: The Performance Metrics row MUST display (a) the last inference time in milliseconds as a positive integer, and (b) the compute units used as one of `CPU`, `CPU+GPU`, `CPU+NeuralEngine`, or `All`.
- **FR-010**: The Model Picker MUST render as a segmented control listing all bundled models from a JS-side model registry. It MUST default to the first registered model and MUST show "MobileNetV2" as the only entry in this spec.
- **FR-011**: On Android and web, the screen MUST render a "CoreML is iOS-only" banner at the top, MUST disable the "Run Inference" button (with an accessible tooltip / label), and MUST still render the Image Source Picker, Sample Image Grid, selected-image preview, Predictions Chart shell, Performance Metrics shell, and Model Picker for educational continuity.

#### Native Bridge Contract

- **FR-012**: The JS bridge `src/native/coreml.ts` MUST expose these methods with the listed signatures:
  - `isAvailable(): boolean` — synchronous; returns false on non-iOS or iOS < 13.
  - `loadModel(name: string): Promise<{ handle: string; computeUnits: 'CPU' | 'CPU+GPU' | 'CPU+NeuralEngine' | 'All' }>`
  - `classify(imageBase64: string, options?: { topK?: number }): Promise<{ predictions: Array<{ label: string; confidence: number }>; inferenceMs: number; computeUnits: 'CPU' | 'CPU+GPU' | 'CPU+NeuralEngine' | 'All' }>`
- **FR-013**: On non-iOS platforms, `isAvailable()` MUST return false; `loadModel` and `classify` MUST reject with a `CoreMLNotSupported` error.
- **FR-014**: The bridge MUST expose typed errors `CoreMLNotSupported`, `CoreMLLoadFailed`, `CoreMLInferenceFailed`, and `InvalidInput`; native failures MUST surface as one of these and MUST NOT propagate as uncaught promise rejections.
- **FR-015**: `classify` MUST default to `topK = 5` when the option is omitted, and the returned `predictions` array MUST be sorted descending by `confidence`.

#### Native Implementation

- **FR-016**: Two Swift sources MUST exist under `native/ios/coreml/`:
  - `CoreMLClassifier.swift` — wraps a `VNCoreMLRequest` against an `MLModel` loaded via `MLModel(contentsOf:)`; performs classification; returns top-K labeled results.
  - `CoreMLBridge.swift` — exposes `loadModel(name:)` and `classify(imageBase64:options:)` to JS via `expo-modules-core`; all entry points are wrapped in `do/catch` and surface typed errors.
- **FR-017**: `CoreMLClassifier` MUST report the actual `MLComputeUnits` selected for inference (CPU / CPU+GPU / CPU+NeuralEngine / All) by reading back the model configuration after load.
- **FR-018**: The Swift bridge MUST measure inference wall time (in milliseconds) around the `VNCoreMLRequest` execution and include it in the `classify` result.

#### Bundled Model & Asset Handling

- **FR-019**: A model file MUST be expected at `native/ios/coreml/models/MobileNetV2.mlmodel` (or `.mlpackage`). The path MUST be gitignored. The repository MUST NOT contain the model bytes.
- **FR-020**: The 016 config plugin MUST verify the model file's presence at prebuild time. If absent, the plugin MUST fail with a clear actionable error message that names the expected path and the documented download source (Apple developer model gallery).
- **FR-021**: When present, the plugin MUST add the compiled `.mlmodelc` to the iOS app target as a Bundle Resource. The Swift bridge MUST locate it at runtime via `Bundle.main.url(forResource:withExtension:)`.

#### Inference Lifecycle & State

- **FR-022**: At most one inference request MAY be in flight at a time per screen instance. While running, the "Run Inference" button MUST be non-interactive; subsequent invocations MUST be ignored (or queued only after the in-flight request resolves).
- **FR-023**: The module's reducer in `src/modules/coreml-lab/coreml-state.ts` MUST track: `selectedImage` (`{ kind: 'sample' | 'photo' | null; uri?: string }`), `selectedModel` (string), `isRunning` (boolean), `lastResult` (`{ predictions, inferenceMs, computeUnits } | null`), `lastError` (string | null). All transitions MUST be pure functions covered by tests.
- **FR-024**: Each card / panel MUST surface the most recent error (if any) as inline status text; errors MUST never propagate as uncaught promise rejections.

#### Photo Library Integration

- **FR-025**: The module MUST integrate `expo-image-picker` for the "Pick from Photo Library" path; the dependency MUST be installed via `npx expo install expo-image-picker` and recorded in `package.json`.
- **FR-026**: If Photo Library access is denied, the module MUST surface a non-crashing inline status message and remain usable via bundled samples.

#### Config Plugin

- **FR-027**: A config plugin at `plugins/with-coreml/` MUST (a) verify the model file presence (FR-020), (b) add the `.mlmodelc` as a Bundle Resource (FR-021), and (c) be idempotent — running it multiple times produces the same result.
- **FR-028**: The 016 plugin MUST coexist with the 007 (Live Activities), 014 (Home Widgets), and 015 (ScreenTime) plugins without modifying their targets, entitlements, or App Groups.
- **FR-029**: The plugin MUST be enabled by adding a single entry to `app.json`'s `plugins` array; no other `app.json` edits are required for this module.

#### Test Suite (JS-pure, Windows-runnable)

- **FR-030**: The following test files MUST exist and pass under `pnpm check`:
  - `coreml-state.test.ts` — reducer transitions (selection, run start, run success, run failure, model switch).
  - `native/coreml.test.ts` — bridge contract: `isAvailable` returns boolean; non-iOS stubs throw `CoreMLNotSupported`; `classify` default `topK = 5`; predictions sorted descending.
  - `plugins/with-coreml/index.test.ts` — model-presence check fails when missing; succeeds and adds bundle resource when present; idempotent; does not modify 007/014/015 fixtures.
  - `components/ImageSourcePicker.test.tsx` — renders two options (Library, Sample); no Camera option.
  - `components/SampleImageGrid.test.tsx` — renders the bundled sample images; tap selects.
  - `components/PredictionsChart.test.tsx` — renders five bars from a fixture; sorted descending; animation prop applied.
  - `components/PerformanceMetrics.test.tsx` — renders `inferenceMs` and `computeUnits`; empty state when no result.
  - `components/ModelPicker.test.tsx` — renders one segment from a single-model fixture; renders N segments from a multi-model fixture; selection calls `bridge.loadModel`.
  - `screen.test.tsx`, `screen.android.test.tsx`, `screen.web.test.tsx` — integration; iOS-only banner on non-iOS; "Run Inference" disabled when no image; chart updates after a mocked successful classify.
  - `manifest.test.ts` — manifest valid; `minIOS = '13.0'`; `platforms` includes ios/android/web.

#### Quality Gates

- **FR-031**: `pnpm check` MUST be green (typecheck, lint, tests).
- **FR-032**: Constitution v1.0.1 MUST pass (cross-platform parity via graceful degradation banners).
- **FR-033**: Existing project conventions MUST be followed: `ThemedText` / `ThemedView`, `Spacing` scale, `StyleSheet.create()`, path aliases (`@/`), TypeScript strict.
- **FR-034**: The change set MUST be purely additive: only `src/modules/registry.ts` (1-line edit) and `app.json` (1 plugin entry) may touch existing files. No edits to features 006–015.

### Non-Functional Requirements

- **NFR-001** (Performance): On a modern iOS device (A14 Bionic or newer), inference on a single 224×224 input via MobileNetV2 SHOULD complete in under 100 ms; on simulator or older devices it SHOULD complete in under 500 ms. The UI MUST remain responsive during inference (no main-thread blocking visible to the user).
- **NFR-002** (Asset budget): Bundled sample PNGs MUST each be under 100 KB; total samples directory MUST be under 400 KB.
- **NFR-003** (Repo size): The repository MUST NOT grow by more than ~500 KB as a result of this feature (samples + sources); the model itself is excluded by `.gitignore`.
- **NFR-004** (Accessibility): All controls MUST have accessible labels; the disabled "Run Inference" button on non-iOS platforms MUST expose a screen-reader–readable reason ("CoreML is iOS-only").
- **NFR-005** (Animation): The bar chart animation duration SHOULD be ~300 ms with an ease-out curve; users with reduced-motion preferences MUST see bars appear at their final width without animation.
- **NFR-006** (Robustness): No code path in the module may surface an uncaught JS exception or native crash for any combination of platform, permission state, or missing model.
- **NFR-007** (Maintainability): Adding a second bundled model in a follow-up MUST require only (a) a new entry in the JS-side model registry and (b) the new model file under `native/ios/coreml/models/`; no edits to the bridge or the UI components.

### Key Entities

- **ModelDescriptor**: `{ name: string; displayName: string; resourceName: string }`. The JS-side registry of bundled models. This spec ships exactly one: MobileNetV2.
- **ModelHandle**: opaque string returned from `bridge.loadModel(name)`; used internally by the bridge to refer to the loaded `MLModel`. Not directly inspected by JS.
- **Prediction**: `{ label: string; confidence: number }`. `label` is the human-readable class name from the model's output; `confidence` is in `[0, 1]`.
- **InferenceResult**: `{ predictions: Prediction[]; inferenceMs: number; computeUnits: 'CPU' | 'CPU+GPU' | 'CPU+NeuralEngine' | 'All' }`.
- **SelectedImage**: `{ kind: 'sample' | 'photo'; uri: string } | null`. Tracks the currently selected input image; `uri` is a bundled-asset reference for samples and a Photo Library URI for picked images.
- **CoreMLState**: in-memory React reducer state holding `selectedImage`, `selectedModel`, `isRunning`, `lastResult`, `lastError`.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer with the MobileNetV2 model in place can open the CoreML Lab module on an iOS 13+ device, select a bundled sample image, run inference, and see top-5 results with metrics in under 60 seconds from a cold app launch — without touching any settings or granting any permission.
- **SC-002**: 100% of the JS-pure test suite (reducer, bridge contract, config plugin, components, screen integration, manifest) passes on Windows under `pnpm check`, with no native or device dependencies.
- **SC-003**: The module is purely additive: a `git diff` against `main` for files outside `specs/`, `plugins/with-coreml/`, `native/ios/coreml/`, `src/modules/coreml-lab/`, and `src/native/coreml.ts` shows changes only in `src/modules/registry.ts` (≤ 2 lines), `app.json` (≤ 1 plugin entry), `package.json` / `pnpm-lock.yaml` (for `expo-image-picker`), and `.gitignore` (for the model artifact path).
- **SC-004**: On a modern iOS device (A14+), end-to-end inference time reported in the Performance Metrics row is under 100 ms in 95% of consecutive runs against the same input.
- **SC-005**: Running the app on Android and on web shows the "CoreML is iOS-only" banner with the inference button disabled, sample images selectable, and zero JavaScript exceptions thrown across the full screen lifecycle.
- **SC-006**: The 016 config plugin runs idempotently: a second `expo prebuild` after the first produces no additional changes to the iOS project file.
- **SC-007**: Enabling the 016 plugin alongside the 007, 014, and 015 plugins (in fixture tests) produces a project where the `.mlmodelc` Bundle Resource is added without disturbing any existing extension/widget targets or entitlements.
- **SC-008**: When the model file is missing, `expo prebuild` fails within 5 seconds with an error message that includes the expected file path and the documented download instruction.
- **SC-009**: Total bundled assets contributed by this feature (sample PNGs + Swift sources + JS sources) add less than 500 KB to the repository.

---

## Dependencies

- **Feature 006 (Modules registry)**: This feature consumes the registry contract and adds exactly one entry. No edits to 006 source.
- **`expo-image-picker`** (new dependency): Installed via `npx expo install expo-image-picker`. Used only for the Photo Library path on iOS; on Android/web the dependency is present but the bridge call path is short-circuited by the iOS-only banner.
- **`expo-modules-core`** (existing): Used by the Swift bridge for typed errors and JS↔native plumbing.
- **Apple developer model gallery (external)**: Source of the MobileNetV2 `.mlmodel` artifact. Documented in `quickstart.md`. Not vendored.
- **Features 007 / 014 / 015 plugins**: Co-resident on iOS. The 016 plugin must not modify their targets, entitlements, or App Groups.

---

## Assumptions

- **Bundled model is operator-supplied** *(repeated for prominence)*: The MobileNetV2 `.mlmodel` is downloaded from Apple's developer model gallery and dropped into `native/ios/coreml/models/` before EAS Build or local prebuild. The repository is gitignored for this path. The 016 plugin fails fast at prebuild when the model is missing; this is the documented expected workflow.
- **iOS minimum version**: iOS 13.0 is assumed as the minimum. CoreML predates iOS 13, but the Vision-based image-classification request flow used here is reliable from iOS 13 onward. Older versions are excluded by the manifest's `minIOS`.
- **Model output shape**: MobileNetV2 emits a `classLabel` string and a `classLabelProbs: [String: Double]` dictionary; the Vision request surfaces these as `VNClassificationObservation`s. The bridge converts them to `Prediction[]` and slices the top-K.
- **Compute units selection**: The classifier uses `MLComputeUnits.all` (let CoreML choose); the actual unit used is read back from the model configuration and reported to JS. ANE availability is hardware-dependent.
- **Swift sources are not unit-testable on Windows**: Swift is written, reviewed, and compiled on macOS or via EAS Build. JS-side mocks substitute for the native module in all Windows-runnable tests. On-device verification is a manual quickstart step.
- **Photo Library access is optional**: The module is fully usable on iOS via bundled samples even if the user denies Photo Library access. The denial path is non-crashing.
- **No telemetry**: Inference results and timings are displayed in-process only; nothing is uploaded.
- **Single-line registry edit**: Adding the module to `src/modules/registry.ts` requires only one import statement and one entry in the modules array; this is the only edit to existing files outside `app.json` and `package.json`.
- **Sample images are public-domain or Apache-2.0 / CC0**: The 3–4 bundled PNGs are sourced from public-domain or permissively licensed image sets; license attribution (if required) lives in `src/modules/coreml-lab/samples/LICENSE.md`.

---

## Out of Scope

- Live camera frames / real-time video classification (deferred to a follow-up).
- Custom model training.
- On-device model fine-tuning or Core ML Tools personalization.
- Vision detection requests other than classification (no object detection, no face detection, no text recognition).
- Multiple bundled models (the architecture supports it; only MobileNetV2 ships in this spec).
- Audio classification (e.g., SoundAnalysis) and text classification (e.g., NaturalLanguage / Create ML text models).
- Custom shielding or system UI integrations.
- App-store-shipping-quality UX (this is an educational scaffold).
- Persisting selected image / last inference result across app relaunches (in-memory only for the session).
- Modifications to features 006–015 (other than the single-line registry edit).
