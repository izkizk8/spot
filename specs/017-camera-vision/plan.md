# Implementation Plan: Camera + Vision Live Frames Module

**Branch**: `017-camera-vision` | **Date**: 2026-05-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/017-camera-vision/spec.md`

## Summary

Ship a code-complete educational module that wires `expo-camera`'s live preview to Apple's **Vision** framework via a thin native bridge, runs face / text / barcode detection on a **periodic `takePictureAsync` snapshot loop** (default cadence ~250 ms, configurable via `useFrameAnalyzer`), and renders detection results as a `react-native-reanimated`-driven overlay of bounding-box rectangles on top of the preview.

The module is **iOS-functional** and degrades gracefully on Android and web: Android renders the live `expo-camera` preview but no analysis (Vision is iOS-only), and web renders a static "Camera not available in this browser" placeholder. Both non-iOS surfaces show a prominent "Vision is iOS-only" banner and an inert `ModePicker` for educational continuity.

The frame-source decision deserves up-front acknowledgement: `expo-camera` 55 does not expose a stable, supported public per-frame processor API comparable to `react-native-vision-camera`'s frame processors. The snapshot loop is a deliberate trade-off (stability + teardown-safety + scope) that costs honest cadence (2–6 fps on modern iOS hardware vs. 30+ fps for true frame processors). The Stats Bar surfaces this transparently. R-001 in `research.md` documents the decision in full and points the reader at `react-native-vision-camera` as the documented follow-up if true real-time frame processing is required.

Technical approach:

1. **Native layer** (`native/ios/vision/`, one Swift file):
   - `VisionDetector.swift` — exposes `analyze(mode:payload:)` to JS via `expo-modules-core`. Dispatches to `VNDetectFaceRectanglesRequest`, `VNRecognizeTextRequest`, or `VNDetectBarcodesRequest` based on `mode`. Constructs a `VNImageRequestHandler` from the payload (decode base64 → `CGImage`, or load via file URI), runs the request, converts each observation to a JS-friendly normalized-coordinate shape, measures wall-clock duration, wraps every entry point in `do/catch` so native failures surface as typed `expo-modules-core` rejections — never uncaught exceptions.
2. **JS bridge** (`src/native/vision-detector.{ts,android.ts,web.ts}` + `vision-detector.types.ts`): typed Promise API mirroring 015 / 016 precedent. `isAvailable()` is synchronous and returns `false` off-iOS / iOS < 13. Non-iOS stubs reject with `VisionNotSupported`. Two additional typed errors — `VisionAnalysisFailed` and `InvalidInput` — cover the iOS runtime surface (FR-021).
3. **Module UI** (`src/modules/camera-vision/`): five components (`CameraPreview`, `OverlayCanvas`, `ModePicker`, `CameraControls`, `StatsBar`) plus an `IOSOnlyBanner` shared with non-iOS screens. The preview lifecycle and analysis loop are owned by a `useFrameAnalyzer({ mode, intervalMs, cameraRef })` hook (FR-015 / FR-016) that exposes `{ fps, lastAnalysisMs, detected, observations, error }` to the screen. Three platform screens (`screen.tsx`, `screen.android.tsx`, `screen.web.tsx`); registered via a single import + array entry in `src/modules/registry.ts`.
4. **Vision types** (`src/modules/camera-vision/vision-types.ts`): discriminated union of `FaceObservation | TextObservation | BarcodeObservation` + `BoundingBox` + type-guard helpers `isFace` / `isText` / `isBarcode`. Authoritative types live here; the bridge contract re-exports them.
5. **Config plugin** (`plugins/with-vision/`): single `withInfoPlist`-based mod that adds `NSCameraUsageDescription` if not already present (idempotent; preserves any existing operator-supplied value), and declares the Vision framework dependency through podspec metadata so the Swift bridge compiles. Coexists with 007 / 014 / 015 / 016 plugins without touching their targets, entitlements, or App Groups (FR-029).

The change set is purely additive: only `src/modules/registry.ts` (≤ 2 lines), `app.json` (one plugin entry), and `package.json` / `pnpm-lock.yaml` (`expo-camera`) touch existing files.

## Technical Context

**Language/Version**: TypeScript 5.9 strict (JS layer), Swift 5.9 (iOS native, compiled via EAS Build / macOS only — not testable on Windows).
**Primary Dependencies**: Expo SDK 55, React Native 0.83, React 19.2, `expo-router` (typed routes), `expo-modules-core` (native module wrapper), `react-native-reanimated` + `react-native-worklets`, `expo-camera` (NEW), Apple frameworks `Vision` (iOS 13+) — `CoreML` is **not** linked by this module (017 uses Vision's built-in detectors only; CoreML is feature 016's territory).
**Storage**: None persisted by this feature. All state is in-memory hook state for the lifetime of the screen instance. No frame caching, no observation history.
**Testing**: Jest Expo + React Native Testing Library under `test/unit/` mirroring `src/`. JS-pure layer only (vision-types, `useFrameAnalyzer` with `jest.useFakeTimers()`, all five components, three screens with mocked bridge, bridge contract, config plugin against fixtures, manifest). The Swift source is not Windows-testable; on-device verification is documented in `quickstart.md`.
**Target Platform**: iOS 13+ (functional path), Android (preview-only + banner), Web (placeholder + banner).
**Project Type**: Mobile app module — additive feature inside the existing spot showcase.
**Performance Goals**: Live preview surface MUST remain visually smooth (no perceptible drops) regardless of analysis cadence — analysis runs off the preview's render path. Achievable analysis cadence at the default 250 ms interval is 2–6 fps on A14+ depending on the active Vision request (NFR-001). Mode switches and camera flips take effect within one analysis cycle (≤ ~300 ms; NFR-002).
**Constraints**:
- Purely additive change set (FR-036 / SC-003).
- Must coexist with features 007 / 014 / 015 / 016 plugins without modifying their targets, entitlements, or App Groups (FR-029).
- Must use the public, supported `expo-camera` API surface; no forking, no patching, no experimental frame-processor APIs (Reality Check + R-001).
- No code path may surface an uncaught JS exception or native crash (NFR-006). All bridge errors typed.
- Strict single-in-flight cycle invariant: if a cycle exceeds `intervalMs`, the next tick is **skipped**, never queued (FR-015 / Edge Case "Snapshot loop overlap").
**Scale/Scope**: Single feature module — 1 Swift file, 1 bridge module (3 platform variants + types), 1 hook, 5 components + 1 shared banner, 3 screens, 1 config plugin, 1 manifest, ~12 JS-pure test files. No bundled media (NFR-008: < 300 KB total feature footprint).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution version consulted: `1.1.0` (`.specify/memory/constitution.md`).

| Principle | Status | Evidence in this plan |
|-----------|--------|-----------------------|
| **I. Cross-Platform Parity** | ✅ Pass | Module is registered for `['ios','android','web']`. The screen layout — preview surface (live on iOS / Android, placeholder on web), `ModePicker`, `CameraControls`, `StatsBar` shell, `IOSOnlyBanner` on non-iOS — renders on all three platforms (FR-009 / FR-010). The "core user journey" is the *educational scaffold*: open the module, see the preview, see what the controls would do, read the iOS-only banner explaining where actual Vision analysis lives. iOS-restricted behavior (running Vision requests) is permitted as a platform-specific UX improvement per the principle's allowance for platform-specific UX where it improves the experience. |
| **II. Token-Based Theming** | ✅ Pass | All components use `ThemedText` / `ThemedView` and the `Spacing` scale from `src/constants/theme.ts`. Bounding-box stroke / fill colours come from `useTheme()`; no hardcoded hex. The iOS-only banner uses the same warning surface tokens as feature 015's banner. |
| **III. Platform File Splitting** | ✅ Pass | Bridge uses `vision-detector.ts` (iOS default) + `vision-detector.android.ts` + `vision-detector.web.ts`. Screen uses `screen.tsx` / `screen.android.tsx` / `screen.web.tsx`. `CameraPreview` uses `CameraPreview.tsx` (iOS / Android default — both render `expo-camera`) + `CameraPreview.web.tsx` (placeholder). No inline `Platform.select()` for non-trivial logic; only single-value `Platform.OS === 'ios'` checks inside `isAvailable()` (acceptable per principle: single-value difference). |
| **IV. StyleSheet Discipline** | ✅ Pass | All component styles via `StyleSheet.create()` co-located with the component. No CSS-in-JS, no inline objects, no utility framework. Reanimated `useAnimatedStyle` is used only for the per-rectangle transform / size shared values (the static rectangle skeleton is a `StyleSheet.create()` style merged with the animated style — the standard Reanimated pattern). Spacing values from the `Spacing` scale. |
| **V. Test-First** | ✅ Pass | FR-032 enumerates 12+ JS-pure test files (vision-types, the hook with fake timers, all five components, three screens with mocked bridge, bridge contract + non-iOS stubs, config plugin against 007/014/015/016 fixtures, manifest). Tests are written alongside or before implementation. The Swift source is exempt from JS-side test-first because no Windows-runnable Swift test framework is configured; on-device verification is documented in `quickstart.md` per the principle's exemption clause for code that depends on infrastructure not yet available (a real iOS device). |

**Validate-Before-Spec** (constitution v1.1.0): The frame-source choice (snapshot loop vs. experimental processors) was validated against `expo-camera` 55's documented public API surface in research (R-001) before the spec finalized the cadence and ergonomics. No build / EAS proof-of-concept is required for this feature: it does not introduce a build pipeline, infrastructure layer, or external service integration. The plugin's behavior (Info.plist merge) is well-precedented by 007 / 014 / 015 / 016 plugins; no novel build-pipeline assumptions are being made.

**Gate decision**: PASS. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/017-camera-vision/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── vision-bridge.contract.ts   # JS bridge TypeScript contract
│   └── vision-detector.swift.md    # Native Swift surface contract
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── modules/
│   ├── registry.ts                       # +1 import line, +1 array entry (ONLY edit)
│   └── camera-vision/                    # NEW
│       ├── index.tsx                     # ModuleManifest export (id, platforms, minIOS:'13.0')
│       ├── screen.tsx                    # iOS — full functional path
│       ├── screen.android.tsx            # Preview + iOS-only banner + inert ModePicker
│       ├── screen.web.tsx                # Placeholder + iOS-only banner + inert ModePicker
│       ├── vision-types.ts               # Observation discriminated union + type guards
│       ├── hooks/
│       │   └── useFrameAnalyzer.ts       # Snapshot+analyze loop owner
│       └── components/
│           ├── CameraPreview.tsx         # iOS/Android — wraps expo-camera
│           ├── CameraPreview.web.tsx     # Web placeholder
│           ├── OverlayCanvas.tsx         # Absolutely-positioned reanimated rectangles
│           ├── ModePicker.tsx            # Faces / Text / Barcodes / Off segmented control
│           ├── CameraControls.tsx        # Camera-flip + flash-mode buttons
│           ├── StatsBar.tsx              # FPS / lastAnalysisMs / detected
│           └── IOSOnlyBanner.tsx         # Shared with screen.android.tsx + screen.web.tsx
└── native/
    ├── vision-detector.ts                # iOS bridge (uses requireOptionalNativeModule)
    ├── vision-detector.android.ts        # Android stub — VisionNotSupported rejections
    ├── vision-detector.web.ts            # Web stub — VisionNotSupported rejections
    └── vision-detector.types.ts          # Re-exports from vision-types.ts + error classes

native/
└── ios/
    └── vision/                           # NEW (sibling of native/ios/coreml/)
        ├── VisionDetector.swift
        └── Vision.podspec                # expo-modules-core registration; links Vision.framework

plugins/
└── with-vision/                          # NEW
    ├── index.ts                          # Default export: ConfigPlugin (withVision)
    └── package.json                      # name, main, types

test/unit/
├── modules/camera-vision/
│   ├── vision-types.test.ts
│   ├── manifest.test.ts
│   ├── screen.test.tsx
│   ├── screen.android.test.tsx
│   ├── screen.web.test.tsx
│   ├── hooks/
│   │   └── useFrameAnalyzer.test.tsx
│   └── components/
│       ├── CameraPreview.test.tsx
│       ├── OverlayCanvas.test.tsx
│       ├── ModePicker.test.tsx
│       ├── CameraControls.test.tsx
│       ├── StatsBar.test.tsx
│       └── IOSOnlyBanner.test.tsx
├── native/
│   └── vision-detector.test.ts
└── plugins/
    └── with-vision/
        └── index.test.ts

app.json                                  # +1 plugin entry: "./plugins/with-vision"
package.json                              # +1 dep: expo-camera
```

**Structure Decision**: Standard spot module layout (mirrors features 006–016). The triad of `native/ios/<feature>/`, `src/native/<feature>.{ts,android.ts,web.ts}`, and `src/modules/<feature>/` is the established pattern. The module slug is `camera-vision` (not `camera-vision-lab`) because the slug already encodes both surfaces (`camera` + `vision`) and the `-lab` suffix would read as redundant; this matches the spec's section headers which consistently use "Camera Vision". The config plugin slug `with-vision` matches `with-app-intents`, `with-home-widgets`, `with-live-activity`, `with-screentime`, `with-coreml`.

## Module Boundaries & Native Bridge Contract (summary)

The contracts/ directory holds the authoritative declarations. A short summary follows so the plan reads stand-alone:

- **JS bridge → Swift** (`bridge.analyze(mode, payload)`):
  - Inputs: `mode: 'faces' | 'text' | 'barcodes'`, `payload: { base64?: string; uri?: string }` (exactly one of `base64` / `uri` is required; both present → `InvalidInput` rejection).
  - Output: `{ observations: Observation[]; analysisMs: number }` where `observations` is the discriminated union and `analysisMs` is a positive integer measured in Swift around the `VNImageRequestHandler.perform([request])` call.
  - Error envelope: every iOS rejection carries one of three code strings — `VisionNotSupported`, `VisionAnalysisFailed`, `InvalidInput` — surfaced as the corresponding JS Error subclass.
- **Hook → bridge** (`useFrameAnalyzer`): owns the timer, the in-flight token, the FPS rolling-window calculator, the mode-change discard logic, and the unmount teardown. Delegates 100% of native work to `bridge.analyze`. Reads `bridge.isAvailable()` at mount and short-circuits if `false` (the screen-level branching to the iOS-only banner happens above the hook, but the hook is also internally robust to being instantiated on a non-iOS surface — it simply never starts the loop).
- **Hook → components**: exposes `{ fps, lastAnalysisMs, detected, observations, error }` (FR-016). The `OverlayCanvas` consumes `observations`; the `StatsBar` consumes `fps`, `lastAnalysisMs`, `detected`. No component reads from `bridge` directly.

## Plugin Design

`plugins/with-vision/index.ts` is a single default-exported `ConfigPlugin` that composes one mod:

1. `withInfoPlist((config) => { … })` — sets `NSCameraUsageDescription` to a sensible default ("Used to demonstrate on-device Vision analysis") **only if absent**. If the operator has already supplied a value (e.g., from a prior plugin or an `app.json` `ios.infoPlist` block), the existing value is preserved untouched. This is the idempotency contract (FR-028).

The Vision framework itself is exposed through the bridge's podspec (`native/ios/vision/Vision.podspec` declares `s.frameworks = 'Vision'`); the plugin does not need to mutate the Xcode project to link it. This split mirrors how 016's CoreML plugin handles framework linkage versus Info.plist merging.

The plugin does **not** add any extension target, App Group, entitlement, or capability — none are required for Vision. This is what makes coexistence with 007 (Live Activities), 014 (Home Widgets), 015 (ScreenTime), and 016 (CoreML) trivially safe (FR-029): 017's plugin only ever touches `Info.plist`, and only an additive key, and only conditionally.

## Test Strategy

Three layers, all Windows-runnable under `pnpm check`:

1. **Pure-data tests**:
   - `vision-types.test.ts` — `isFace` / `isText` / `isBarcode` for valid + invalid + adversarial inputs (extra fields, missing fields, wrong `kind` literal).
2. **Hook test** with `jest.useFakeTimers()`:
   - `hooks/useFrameAnalyzer.test.tsx` — start/stop based on mode; configured `intervalMs` respected (advance N×interval, assert N calls); unmount cleans up (no further timer ticks after unmount); mode change clears `observations` and discards in-flight; permission denied path skips analysis entirely; overlap-skip behavior (resolve a slow `analyze` after the next tick has been skipped, assert the skipped tick did not queue).
3. **Component + screen tests** with mocked `vision-detector` bridge (the bridge module is jest-mocked; `bridge.isAvailable()` returns the platform-appropriate boolean, `bridge.analyze` returns canned `Observation[]` arrays):
   - One test file per component (`CameraPreview`, `OverlayCanvas`, `ModePicker`, `CameraControls`, `StatsBar`, `IOSOnlyBanner`).
   - One screen test per platform variant; iOS asserts the analysis loop drives overlays through the mock; Android asserts banner + zero bridge calls; web asserts placeholder + banner + zero bridge calls.
4. **Bridge contract test**:
   - `native/vision-detector.test.ts` — `isAvailable` returns boolean; `.android.ts` / `.web.ts` stubs reject with `VisionNotSupported`; `analyze` rejects with `InvalidInput` when both `base64` and `uri` are present (or neither).
5. **Plugin test** with config-plugin fixture pattern (precedent: `plugins/with-coreml/`, `plugins/with-screentime/`):
   - Adds `NSCameraUsageDescription` when missing.
   - Preserves an existing value when present.
   - Idempotent across two consecutive invocations (deep-equal on the resulting config).
   - Does not modify 007 / 014 / 015 / 016 plugin fixture outputs (run through a composed plugin chain and diff against the chain without 017).
6. **Manifest test**:
   - `manifest.test.ts` — manifest valid, `minIOS = '13.0'`, `platforms` includes ios / android / web.

The Swift source has **no Windows-runnable test**; its behavior is asserted manually via the on-device steps in `quickstart.md` (US-1 through US-5 from the spec map directly to numbered checks).

## Phasing

Per the SDD lifecycle, the plan generation completes Phase 0 (research) and Phase 1 (data model + contracts + quickstart). Implementation phasing — once `/speckit.tasks` runs — will follow the spec's user-story priorities:

- **MVP slice (US-1, P1)**: Faces mode end-to-end. Module entry, `screen.tsx`, `useFrameAnalyzer`, `vision-detector.ts` + `VisionDetector.swift` faces branch only, `OverlayCanvas`, `StatsBar`, `CameraPreview`, plugin, manifest, and the JS-pure tests for everything in scope. This slice validates the entire pipeline end-to-end on device.
- **Second slice (US-2 + US-3, P2)**: Add `text` and `barcodes` branches in `VisionDetector.swift` (mostly mechanical given the dispatch table is already in place from US-1) and the corresponding type-guard / observation variants. `ModePicker` becomes interactive across all four modes.
- **Third slice (US-4, P2)**: `CameraControls` (flip + flash) wiring. The `CameraPreview` already accepts the `facing` and `flashMode` props from US-1 (defaulted to `back` / `off`); this slice adds the buttons and the small props plumbing.
- **Fourth slice (US-5, P2)**: `screen.android.tsx`, `screen.web.tsx`, `IOSOnlyBanner`, `CameraPreview.web.tsx`, and the corresponding tests. (These technically can land before US-2 / US-3 / US-4 since they are independent surface area; sequencing them last keeps the device-verification feedback loop tight on the iOS path.)

Each slice ends green under `pnpm check` and leaves the previous slice's behavior intact.

## Complexity Tracking

> No Constitution Check violations to justify. The feature stays inside the established additive-module pattern. The single atypical aspect — a **periodic-snapshot frame source** instead of a true frame-processor pipeline — is forced by `expo-camera` 55's public API surface and is documented prominently in the spec's Reality Check, in the Stats Bar UI itself (the FPS counter is the live disclosure), in `research.md` R-001, and in `quickstart.md`.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| _(none)_ | _(n/a)_ | _(n/a)_ |
