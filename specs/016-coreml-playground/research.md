# Phase 0 — Research: CoreML Playground Module

All "NEEDS CLARIFICATION" items from Technical Context have been resolved below. Each entry follows the Decision / Rationale / Alternatives format.

---

## R-001 — Why MobileNetV2 (and not MobileNetV3, ResNet50, EfficientNet, etc.)

**Decision**: Ship **MobileNetV2** (Apple's `MobileNetV2.mlmodel` from the developer model gallery, ~17 MB compiled `.mlmodelc`, ImageNet 1000-class classifier).

**Rationale**:
- **Size / accuracy sweet spot for a demo**: ~17 MB vs. ResNet50's ~100 MB; top-5 accuracy of ~92% on ImageNet, more than sufficient to produce convincing demonstration results on the 3–4 bundled sample images (a labrador, a coffee mug, a bicycle).
- **Universally recognised**: MobileNetV2 is the canonical "first CoreML model" in tutorials and Apple's own samples. Using it makes the educational intent immediately legible to anyone studying the module.
- **First-party Apple distribution**: The model lives at <https://developer.apple.com/machine-learning/models/> with explicit Apple licensing terms — appropriate for a demo without bundling a third-party model.
- **Vision compatibility**: Has the standard `Image (Color 224×224)` input and `classLabel` + `classLabelProbs` outputs that `VNCoreMLRequest` understands natively, so the bridge does not need custom preprocessing or output decoding.
- **Forward-compatible architecture**: The JS-side `model-registry.ts` accepts `ModelDescriptor[]`; adding MobileNetV3 / ResNet50 / a custom Create-ML model in a follow-up requires only a new entry + a new file under `native/ios/coreml/models/`.

**Alternatives considered**:
- *MobileNetV3*: Slightly better accuracy/efficiency but less universally recognised; not in Apple's first-party gallery in `.mlmodel` form (would require third-party conversion).
- *ResNet50*: ~6× larger; the inference time delta is interesting on a chart but the bundle weight is hostile to a demo module.
- *Apple's `Resnet50.mlmodel`*: Same gallery, but file size pushes the operator-download UX into uncomfortable territory.
- *A Create-ML / custom model*: Adds an upstream training step; out of scope for an educational module.

---

## R-002 — Why the model file is NOT committed to the repository

**Decision**: The `.mlmodel` artifact lives at `native/ios/coreml/models/MobileNetV2.mlmodel` and is **gitignored**. The operator must download it from Apple's developer model gallery before the first iOS build. The 016 config plugin verifies presence at prebuild time and fails fast with a one-step recovery message if absent.

**Rationale**:
- **Binary size**: ~17 MB. Even with Git LFS, the repo footprint and clone-time cost are user-hostile for a module that 99% of contributors will never touch on iOS.
- **Apple licensing**: The model gallery's distribution terms require download from Apple's site. Bundling the bytes inside this repository would shift the licensing surface from "operator pulls from Apple" to "this repo redistributes Apple-licensed bytes" — strictly more legally complex and unnecessary.
- **Operator-driven workflow is canonical for CoreML**: Apple's own sample projects routinely require the developer to drop a model file into a known location before building; this is not an unfamiliar UX for the target audience.
- **Deterministic failure**: Because the plugin fails at prebuild (not at runtime, not on the App Store), the failure is loud, early, and recoverable. The error message names the expected path AND the download URL — a single click + drag fixes it.
- **Repository hygiene**: NFR-003 caps the feature's repo growth at ~500 KB; vendoring the model would breach this by ~35×.

**Alternatives considered**:
- *Vendor via Git LFS*: Adds an LFS dependency to the repo for one file; legally still redistributes Apple bytes; clone time still suffers for non-iOS contributors.
- *Download in a `postinstall` script*: Hides a network call inside `pnpm install`; opaque failure modes; CI flakiness.
- *Have the plugin auto-download at prebuild*: Moves a multi-MB network fetch into the build pipeline; opaque licensing-acceptance UX (the operator must accept Apple's terms, not the script).

---

## R-003 — Why `expo-image-picker` over `expo-camera` for v1

**Decision**: Use `expo-image-picker` for the "Pick from Photo Library" path. **No camera capture path** in v1.

**Rationale**:
- **Permission scope is narrower**: Photo Library access (`NSPhotoLibraryUsageDescription`) is a single, well-understood prompt. Camera access (`NSCameraUsageDescription`) adds a second prompt and a separate denial path to handle.
- **No live preview UI to maintain**: A camera-capture path implies either a full-screen `expo-camera` view (a sibling concern with its own lifecycle, dimensions, orientation, and animation considerations) or a system camera launcher. Either pulls scope away from the actual demonstration (CoreML inference).
- **Deterministic test inputs**: The bundled sample grid (FR-006) provides reproducible inputs that exercise the entire pipeline without any permission dependency. The Photo Library path is a value-add, not the MVP.
- **`expo-image-picker` is universally available**: Already a tier-1 Expo SDK module with first-class iOS / Android / web stubs; no custom native work required.
- **Forward-compatible**: A camera-capture path can be added in a follow-up by extending the `ImageSourcePicker` component with a third option and adding a thin `expo-camera` integration — no changes required to the bridge, the reducer, or the model.

**Alternatives considered**:
- *`expo-camera` with live preview + frame capture*: Major additional surface area (preview view, capture button, retake flow, orientation) for a feature whose demo value is mostly already delivered by samples + library photos.
- *System camera via `expo-image-picker`'s `launchCameraAsync`*: A reasonable middle ground; deferred to a follow-up to keep v1's permission story to a single prompt.

---

## R-004 — Why `VNCoreMLRequest` over raw `MLModel.prediction(...)`

**Decision**: Run inference via `VNCoreMLRequest` against a `VNImageRequestHandler`, **not** by calling `MLModel.prediction(from:)` directly with a hand-built `MLFeatureProvider`.

**Rationale**:
- **Vision handles preprocessing**: The Vision request automatically handles image decoding, colour-space conversion, resizing to the model's expected `Image (Color 224×224)` input, and pixel-buffer construction. Doing this by hand requires roughly 40–60 lines of `CVPixelBuffer` plumbing per image format we want to support.
- **Vision handles output decoding**: For classification models, the request surfaces results as `[VNClassificationObservation]` with `identifier: String` and `confidence: VNConfidence (Float)` — already the shape the JS bridge wants. Raw `MLModel.prediction` returns the model's native dictionary type and requires per-model output handling code.
- **Vision is the Apple-recommended path**: For image-classification models that declare a `VNCoreMLModel`-compatible input, Apple's documentation and WWDC sessions (2017+) consistently recommend the Vision wrapper.
- **Top-K is trivial**: `request.results?.prefix(k)` after sorting by `confidence`; no manual softmax / argmax.
- **Future-proof for object detection**: `VNCoreMLRequest` also surfaces `VNRecognizedObjectObservation` for detection models — extending the bridge to additional model types in the future is easier when starting from Vision.

**Trade-off**: Vision adds a ~3–5 ms preprocessing overhead per call vs. raw `MLModel.prediction` with a pre-built `CVPixelBuffer`. Acceptable: NFR-001's < 100 ms target on A14+ has plenty of headroom; the simplicity dividend is large.

**Alternatives considered**:
- *Raw `MLModel.prediction`*: Faster by single-digit ms, but multiplies preprocessing code and couples the bridge to per-model output schemas.
- *Core Image (`CIImage`) preprocessing into Vision*: Strictly redundant — Vision already accepts `CGImage` / `Data` / `URL` directly.

---

## R-005 — Risk: model file missing at build time → graceful warning, not failure

**Decision**: At prebuild time, the 016 config plugin **fails fast** with an actionable error message when the model file is absent. At **runtime**, if the bundled `.mlmodelc` is somehow missing (e.g., a malformed dev build that skipped prebuild verification), the bridge surfaces a typed `CoreMLLoadFailed`-style rejection and the screen renders an inline status — never a crash.

**Rationale**:
- **Two failure surfaces, two tactics**:
  - **Prebuild** is loud-and-early because the operator can fix it in one step (download + drop the file). A warning that lets the build proceed would produce an iOS app with a non-functional demo and no clear pointer to the cause.
  - **Runtime** is graceful because the user is already inside the app; a crash is the worst possible UX. NFR-006 forbids any uncaught crash regardless of state.
- **Symmetric with feature 015's pattern**: 015 handles a missing entitlement via runtime banner + graceful fallback because the operator cannot fix it (Apple must approve). 016 handles a missing model via prebuild failure + recovery message because the operator *can* fix it. Each chosen tactic matches the recoverability of the underlying cause.
- **The plugin's error message is the documentation**: It includes the expected path AND the download URL, so the operator does not need to read `quickstart.md` to recover. `quickstart.md` exists for the broader workflow (how to verify on device, fallback behaviour on Android/web, etc.).

**Alternatives considered**:
- *Silent skip if model is absent at prebuild*: Produces a build that ships, then crashes-or-degrades at runtime. Worse UX, harder to debug.
- *Hard runtime crash if model is missing*: Violates NFR-006 unconditionally.
- *Auto-download in the plugin*: See R-002 — opaque licensing UX, hidden network calls.

---

## R-006 — iOS 13.0 minimum (CoreML 3 + Vision)

**Decision**: The module's manifest declares `minIOS: '13.0'`. The 006 registry already filters modules out of the grid on older iOS.

**Rationale**:
- **CoreML 3** (iOS 13) introduced the on-device personalization / runtime model APIs and is the floor for any modern `MLComputeUnits.all` flow. CoreML 4 (iOS 14) added encrypted models, and CoreML 5/6 (iOS 15/16) added further refinements that this feature does not depend on.
- **Vision framework reliability for classification**: `VNCoreMLRequest` exists from iOS 11, but the configuration / compute-unit selection plumbing this feature uses (`MLModelConfiguration.computeUnits = .all`) is reliable from iOS 13+.
- **Project alignment**: spot's overall iOS deployment target floor is iOS 13 (verified by reading the project's existing native modules' deployment targets); raising the floor to 15 or 16 just for this module would create a divergence with no functional payoff.
- **Neural Engine gating**: ANE availability is hardware-dependent (A12+ chips) and is reported back via the `computeUnits` field rather than via a minimum-OS gate. iOS 13+ on A11 and earlier transparently falls back to CPU/GPU.

**Alternatives considered**:
- *iOS 14 minimum*: Would gain encrypted model support that this feature does not need.
- *iOS 16 minimum*: Aligned with feature 015 but unjustified — CoreML in this configuration works correctly on 13+.
- *No minimum / iOS 11*: Would force handling the iOS-11 / iOS-12 CoreML idiosyncrasies (no `MLComputeUnits.all`); not worth the test matrix.

---

## R-007 — Cross-platform stub strategy

**Decision**: Provide explicit `coreml.android.ts` and `coreml.web.ts` files. Both export the same `bridge` shape; `isAvailable()` returns `false` synchronously, and every other method rejects with `new CoreMLNotSupported()`.

**Rationale**: Mirrors the precedent set by `src/native/screentime.{ts,android.ts,web.ts}`, `src/native/widget-center.{ts,android.ts,web.ts}`, and `src/native/live-activity.{ts,android.ts,web.ts}`. Satisfies Constitution Principle III (Platform File Splitting) without inline `Platform.select()` for non-trivial fallback logic.

**Alternatives considered**:
- *Single `coreml.ts` with `Platform.OS === 'ios'` branches*: Violates Principle III for non-trivial differences.

---

## R-008 — Animation strategy for the bar chart

**Decision**: Use `react-native-reanimated`'s `withTiming` to animate `useSharedValue` widths over ~300 ms with an ease-out curve. Honour `useReducedMotion()`: when the user has reduced-motion enabled, set widths to their final values immediately (no animation).

**Rationale**:
- **Project standard**: Reanimated is already a tier-1 dependency and is used by other animation-bearing modules in the showcase.
- **Off-main-thread**: Worklet-driven animations do not block the JS thread, so a fresh inference result on a slower device does not stall the bar update.
- **Accessibility**: NFR-005 requires a reduced-motion code path; `useReducedMotion()` is the documented Reanimated 3 hook for this.

**Alternatives considered**:
- *RN's `Animated`*: Acceptable but inferior thread story; project precedent prefers Reanimated.
- *No animation*: Misses NFR-005's positive directive ("animation duration SHOULD be ~300 ms with ease-out") for the non-reduced-motion case.

---

## Summary of resolved unknowns

| Item | Status |
|------|--------|
| Model selection (MobileNetV2) | ✅ Resolved (R-001) |
| Why model file is not committed | ✅ Resolved (R-002) |
| Image source choice (image-picker over camera) | ✅ Resolved (R-003) |
| Inference path (VNCoreMLRequest over raw MLModel) | ✅ Resolved (R-004) |
| Missing-model risk handling | ✅ Resolved (R-005) |
| iOS minimum version (13.0) | ✅ Resolved (R-006) |
| Cross-platform stubs | ✅ Resolved (R-007) |
| Animation strategy | ✅ Resolved (R-008) |

No remaining `NEEDS CLARIFICATION` items.
