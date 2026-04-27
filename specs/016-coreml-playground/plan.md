# Implementation Plan: CoreML Playground Module

**Branch**: `016-coreml-playground` | **Date**: 2026-04-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/016-coreml-playground/spec.md`

## Summary

Ship a code-complete educational module that demonstrates Apple's **CoreML** and **Vision** frameworks by running a bundled **MobileNetV2** image-classification model on-device. The module accepts two image sources (a curated grid of bundled PNG samples, or the user's Photo Library via `expo-image-picker`), runs `VNCoreMLRequest` against `MLModel(contentsOf:)`, and surfaces the **top-5 ImageNet predictions** as an animated horizontal bar chart alongside a perf row (inference ms + selected compute units).

The MobileNetV2 `.mlmodel` is **operator-supplied**, not vendored — Apple distributes it from their developer model gallery and the file is too large + license-encumbered to commit. The 016 config plugin verifies its presence at prebuild time and fails fast (with a single-step recovery message) when missing. Xcode's iOS build pipeline auto-compiles `.mlmodel` → `.mlmodelc`; the Swift bridge locates the compiled artifact via `Bundle.main.url(forResource:withExtension:"mlmodelc")` at runtime.

Technical approach:

1. **Native layer** (`native/ios/coreml/`, two Swift files):
   - `CoreMLClassifier.swift` — wraps a `VNCoreMLRequest` against an `MLModel` loaded with `MLComputeUnits.all`; reads back the actual selected units; performs a single classification per call; returns the top-K labelled results plus the wall-clock inference duration.
   - `CoreMLBridge.swift` — exposes `loadModel(name:)` and `classify(imageBase64:)` through `expo-modules-core`; every entry point is wrapped in `do/catch` so native failures surface as typed rejections, never uncaught exceptions.
2. **JS bridge** (`src/native/coreml.{ts,android.ts,web.ts}` + `coreml.types.ts`): typed Promise API; sentinel `CoreMLNotSupported` rejections on Android/web; `isAvailable()` is synchronous and false off-iOS / iOS < 13.
3. **Module UI** (`src/modules/coreml-lab/`): five components (Image Source Picker, Sample Image Grid, Predictions Chart, Performance Metrics, Model Picker) + a banner on non-iOS, driven by a pure reducer in `coreml-state.ts`. Animations are `react-native-reanimated`-based bar widths with `useReducedMotion()` opt-out. Three platform screens (`screen.tsx`, `screen.android.tsx`, `screen.web.tsx`); registered via a single import + array entry in `src/modules/registry.ts`.
4. **Sample assets** (`src/modules/coreml-lab/samples/*.png`): 3–4 small (64×64 solid-colour-or-glyph) PNG fixtures referenced via `require()` so Metro bundles them. Each < 100 KB; total samples directory < 400 KB.
5. **Config plugin** (`plugins/with-coreml/`): single `withConfig` mod that (a) verifies the model file exists at prebuild time, (b) declares the `.mlmodel` as an Xcode build resource so the Xcode build phase compiles it to `.mlmodelc` and copies it into the app bundle, (c) is idempotent, and (d) is added with one entry in `app.json`'s `plugins` array.

The change set is purely additive: only `src/modules/registry.ts` (≤ 2 lines), `app.json` (one plugin entry), `package.json` / `pnpm-lock.yaml` (`expo-image-picker`), and `.gitignore` (model artifact path) touch existing files.

## Technical Context

**Language/Version**: TypeScript 5.9 strict (JS layer), Swift 5.9 (iOS native, compiled via EAS Build / macOS only — not testable on Windows).
**Primary Dependencies**: Expo SDK 55, React Native 0.83, React 19.2, `expo-router` (typed routes), `expo-modules-core` (native module wrapper), `react-native-reanimated` + `react-native-worklets`, `expo-image-picker` (NEW), Apple frameworks `CoreML` + `Vision` (iOS 13+).
**Storage**: None persisted by this feature. All state is in-memory React reducer state for the lifetime of the screen.
**Testing**: Jest Expo + React Native Testing Library under `test/unit/` mirroring `src/`. JS-pure layer only (reducer, bridge contract with mocked native, config plugin against fixtures, components, screens, manifest). The Swift sources are not Windows-testable; on-device verification is documented in `quickstart.md`.
**Target Platform**: iOS 13+ (functional path), Android + Web (iOS-only banner + disabled inference).
**Project Type**: Mobile app module — additive feature inside the existing spot showcase.
**Performance Goals**: 60 fps interactions; bar-chart animation ~300 ms ease-out; per-inference budget < 100 ms on A14+ hardware (NFR-001), < 500 ms on simulator / older devices.
**Constraints**:
- Purely additive change set (FR-034 / SC-003).
- Must coexist with features 007 (Live Activities), 014 (Home Widgets), and 015 (ScreenTime) plugins without modifying their targets, entitlements, or App Groups (FR-028).
- Model file is gitignored and operator-supplied; absence is a hard prebuild failure with a recoverable message (FR-020 / SC-008).
- No code path may surface an uncaught JS exception or native crash (NFR-006).
**Scale/Scope**: Single feature module — ~2 Swift files, 1 bridge module (3 platform variants + types), 1 reducer, 5 components + 1 banner, 3 screens, 1 config plugin, 1 manifest, 3–4 sample PNGs, ~12 JS-pure test files.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence in this plan |
|-----------|--------|-----------------------|
| **I. Cross-Platform Parity** | ✅ Pass | Module is registered for `['ios','android','web']`. The screen layout — Image Source Picker, Sample Image Grid, selected-image preview, Predictions Chart shell, Performance Metrics shell, Model Picker — renders on all three platforms; Android + Web show an "iOS-only" banner with the inference button disabled (FR-011). Sample images remain selectable on non-iOS for visual continuity. The "core user journey" — exploring the educational scaffold — is equivalent everywhere; iOS-restricted behaviour (actual inference) is permitted as a platform-specific UX improvement per the principle. |
| **II. Token-Based Theming** | ✅ Pass | All components use `ThemedText` / `ThemedView` and the `Spacing` scale from `src/constants/theme.ts`. Bar-chart fill colours come from `useTheme()`; no hardcoded hex. |
| **III. Platform File Splitting** | ✅ Pass | Bridge uses `coreml.ts` (iOS default) + `coreml.android.ts` + `coreml.web.ts`. Screen uses `screen.tsx` / `screen.android.tsx` / `screen.web.tsx`. No inline `Platform.select()` for non-trivial logic; only single-value `Platform.OS === 'ios'` checks are used inside `isAvailable()` (acceptable per principle: single-value difference). |
| **IV. StyleSheet Discipline** | ✅ Pass | All component styles via `StyleSheet.create()` co-located with the component. No CSS-in-JS, no inline objects, no utility framework. Spacing values from the `Spacing` scale. |
| **V. Test-First** | ✅ Pass | FR-030 enumerates 12+ JS-pure test files (reducer, bridge contract with mocked native, config plugin against fixtures, all five components, three screens, manifest). Tests are written alongside or before implementation. Swift native sources are exempt from JS-side test-first because no Windows-runnable Swift test framework is configured; on-device verification steps are documented in `quickstart.md` per the principle's exemption clause for code that depends on infrastructure not yet available (a real iOS device + an operator-supplied model file). |

**Gate decision**: PASS. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/016-coreml-playground/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── coreml-bridge.contract.ts   # JS bridge TypeScript contract
│   └── coreml-state.contract.ts    # Reducer state + action contracts
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── modules/
│   ├── registry.ts                     # +1 import line, +1 array entry (ONLY edit)
│   └── coreml-lab/                     # NEW
│       ├── index.tsx                   # ModuleManifest export (id, platforms, minIOS:'13.0')
│       ├── screen.tsx                  # iOS screen — full functional path
│       ├── screen.android.tsx          # iOS-only banner + disabled inference
│       ├── screen.web.tsx              # iOS-only banner + disabled inference
│       ├── coreml-state.ts             # Pure reducer (state + actions)
│       ├── model-registry.ts           # JS-side ModelDescriptor list (MobileNetV2 only)
│       ├── components/
│       │   ├── ImageSourcePicker.tsx
│       │   ├── SampleImageGrid.tsx
│       │   ├── PredictionsChart.tsx
│       │   ├── PerformanceMetrics.tsx
│       │   └── ModelPicker.tsx
│       └── samples/                    # NEW PNG assets, < 100 KB each
│           ├── labrador.png
│           ├── coffee-mug.png
│           ├── bicycle.png
│           └── LICENSE.md              # CC0 / Apache-2.0 attribution
└── native/
    ├── coreml.ts                       # iOS bridge (uses requireOptionalNativeModule)
    ├── coreml.android.ts               # Android stub — CoreMLNotSupported rejections
    ├── coreml.web.ts                   # Web stub — CoreMLNotSupported rejections
    └── coreml.types.ts                 # Shared types + CoreMLNotSupported error class

native/
└── ios/
    └── coreml/                         # NEW (sibling of native/ios/screentime)
        ├── CoreMLClassifier.swift
        ├── CoreMLBridge.swift
        ├── CoreML.podspec              # expo-modules-core registration
        └── models/                     # GITIGNORED — operator drops the file here
            └── MobileNetV2.mlmodel     # NOT in repo; documented in quickstart.md

plugins/
└── with-coreml/                        # NEW
    ├── index.ts                        # Default export: ConfigPlugin (withCoreML)
    ├── package.json                    # name, main, types
    └── verify-model-presence.ts        # Prebuild-time existence check (FR-020)

test/unit/
├── modules/coreml-lab/
│   ├── coreml-state.test.ts
│   ├── model-registry.test.ts
│   ├── manifest.test.ts
│   ├── screen.test.tsx
│   ├── screen.android.test.tsx
│   ├── screen.web.test.tsx
│   └── components/
│       ├── ImageSourcePicker.test.tsx
│       ├── SampleImageGrid.test.tsx
│       ├── PredictionsChart.test.tsx
│       ├── PerformanceMetrics.test.tsx
│       └── ModelPicker.test.tsx
├── native/
│   └── coreml.test.ts
└── plugins/
    └── with-coreml/
        └── index.test.ts

app.json                                # +1 plugin entry: "./plugins/with-coreml"
.gitignore                              # +1 entry: native/ios/coreml/models/*.mlmodel*
package.json                            # +1 dep: expo-image-picker
```

**Structure Decision**: Standard spot module layout (mirrors features 006–015). The triad of `native/ios/<feature>/`, `src/native/<feature>.{ts,android.ts,web.ts}`, and `src/modules/<feature>-lab/` is the established pattern. The module slug `coreml-lab` follows the `<topic>-lab` convention (`swift-charts-lab`, `app-intents-lab`, `widgets-lab`, `sf-symbols-lab`, `screentime-lab`). The config plugin slug `with-coreml` matches `with-app-intents`, `with-home-widgets`, `with-live-activity`, `with-screentime`.

## Complexity Tracking

> No Constitution Check violations to justify. The feature stays inside the established additive-module pattern. The two atypical aspects — (a) a config plugin that is allowed to **fail prebuild** when an external artifact is absent, and (b) an asset (the `.mlmodel`) that is intentionally **not committed** — are both forced by external constraints (artifact size + Apple licensing) and are documented prominently in spec.md, quickstart.md, and the plugin's own error message.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| _(none)_ | _(n/a)_ | _(n/a)_ |
