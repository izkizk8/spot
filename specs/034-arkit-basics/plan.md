# Implementation Plan: ARKit Basics Module

**Branch**: `034-arkit-basics` | **Date**: 2026-04-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/034-arkit-basics/spec.md`
**Branch parent**: `033-share-sheet`

## Summary

Add an iOS 11+ "ARKit Basics" showcase module that wraps a thin
`ARWorldTrackingConfiguration` + `RealityKit.ARView` integration with
plane detection (none / horizontal / vertical / both), tap-to-place
anchored cube entities via raycast, runtime reconfiguration, session
pause / resume / reset, and an introspection surface
(`getSessionInfo` polled at **500 ms** for FPS / tracking-state /
duration). The module is fully self-contained inside
`src/modules/arkit-lab/`, registers as a single new card
(`id: 'arkit-basics'`, `platforms: ['ios','android','web']`,
`minIOS: '11.0'`) appended to `src/modules/registry.ts`. iOS uses a new
Swift Expo Module pair: a **ViewDefinition** `ARKitView` wrapping
`RealityKit.ARView` (props `planeDetection`, `peopleOcclusion`,
`lightEstimation`; events `onSessionStateChange`, `onAnchorAdded`,
`onAnchorRemoved`, `onError`) plus an imperative **Module**
`ARKitBridge` (`AsyncFunction` `placeAnchorAt`, `clearAnchors`,
`pauseSession`, `resumeSession`, `getSessionInfo`; `Function`
`isAvailable`). Android and Web throw a typed `ARKitNotSupported` from
every imperative bridge entry point and render the educational UI
shell with `IOSOnlyBanner` substituted for the AR view (controls
visibly disabled). A new config plugin `plugins/with-arkit/` adds
`NSCameraUsageDescription` (coexisting with feature 017's
`with-vision` plugin — value preserved when already present) and
appends `arkit` to `UIRequiredDeviceCapabilities` exactly once
(idempotent across multiple prebuilds). Integration is purely
additive at the project boundary: registry +1, `app.json` `plugins`
+1 (`./plugins/with-arkit`). Soft anchor cap of **100** documented;
no virtualization in v1.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), Swift 5
(`@available(iOS 11.0, *)` on `ARKitBridge` and `ARKitView`; people
occlusion gated `@available(iOS 13.0, *)` at the call site). React
19.2 + React Native 0.83 + React Compiler enabled.
**Primary Dependencies**: Expo SDK 55, expo-router (typed routes),
`@expo/config-plugins` (the new `with-arkit` plugin authored this
feature), `expo-modules-core` (`requireOptionalNativeModule` +
`requireNativeViewManager` — the **first** native view this branch
introduces; same registration shape used by the SDK's bundled
modules), `ARKit`, `RealityKit`, `UIKit`. **REUSED** (no version
movement): `react-native-reanimated` (already pinned), no new
runtime JS dependencies.
**Storage**: None. Anchors and FPS samples are in-memory only (spec
§"Out of Scope"). World-map persistence is a v1 UI placeholder; no
on-disk write.
**Testing**: Jest Expo + React Native Testing Library — JS-pure
tests only. The Swift surface (`ARKitView.swift` +
`ARKitBridge.swift`) is not unit-testable on the Windows-based dev
environment (same exemption pattern features 007 / 013 / 014 /
027–033 applied; on-device verification documented in
`quickstart.md`). All native bridges (`requireOptionalNativeModule`,
`requireNativeViewManager`) MUST be mocked at the import boundary
per FR-022; the mock attaches to the module identity exposed by each
bridge variant.
**Target Platform**: iOS 11+ (real `ARWorldTrackingConfiguration` +
`RealityKit.ARView` with raycast and cube anchor); Android (UI
shell + `IOSOnlyBanner`; bridge throws `ARKitNotSupported`); Web
(UI shell + `IOSOnlyBanner`; no camera permission requested).
`screen.web.tsx` MUST NOT import `src/native/arkit.ts` at module
evaluation time (carryover from 030 / 031 / 032 / 033 SC-007
discipline).
**Project Type**: Mobile app (Expo) with native iOS sources appended
to the **main app target** via existing autolinking, plus a new
prebuild config plugin. Strictly additive (no new extension target,
no entitlement edits, no App Group). One `app.json` `plugins[]`
append; one `plugins/with-arkit/` directory.
**Performance Goals**: Screen mount → first meaningful paint < 250 ms
on a mid-tier iPhone; session start to `running` ≤ 5 s with camera
permission (SC-001); raycast tap → anchor placed ≤ 100 ms; FPS
sampling overhead ≤ 1 % of a 60 fps frame budget; AnchorsPanel
remains 60 fps with up to 100 entries (soft cap; no virtualization
required).
**Constraints**: Purely additive at integration level — 1 import +
1 array entry in `src/modules/registry.ts`, +1 entry in `app.json`
`plugins`, **0** new runtime JS dependencies; no edits to prior
plugin / screen / Swift sources; no new App Group; no
`eslint-disable` directives anywhere in added or modified code
(FR-023, user-stipulated); `StyleSheet.create()` only (Constitution
IV); `.android.tsx` / `.web.tsx` splits for non-trivial platform
branches (Constitution III); native bridges mocked at the import
boundary in tests (FR-022); `pnpm format` is a no-op after the final
commit; `with-arkit` plugin **MUST** preserve any existing
`NSCameraUsageDescription` (feature 017 wins on first prebuild;
`with-arkit` is a no-op for that key on second run).
**Scale/Scope**: One module directory (`src/modules/arkit-lab/`),
one new plugin (`plugins/with-arkit/`), one new bridge file family
(`src/native/arkit.ts` + `.android.ts` / `.web.ts` / `.types.ts`
siblings), two Swift files under `native/ios/arkit/`, one hook
(`hooks/useARKitSession.ts`), six UI components, three screen
variants, one bundled cube texture (64×64 PNG embedded in the Swift
module's resources).
**Test baseline at branch start**: carried forward from feature
033's completion totals (recorded in 033's `plan.md` /
`retrospective.md`). 034's expected delta: **≥ +14 suites** (see
"Test baseline tracking" below).

## Constitution Check

*Constitution version checked*: **1.1.0**
(`.specify/memory/constitution.md`).

| Principle | Compliance |
|-----------|------------|
| I. Cross-Platform Parity | **PASS** — iOS ships the full module: AR view, raycast tap-to-place, session lifecycle, configuration toggles, stats. Android and Web render the same six-panel structure (CapabilitiesCard / AR-region / ConfigurationCard / tap-controls / AnchorsPanel / StatsBar) with `IOSOnlyBanner` replacing the AR view and the configuration controls visibly disabled. The educational UI shape is itself part of the lesson and is preserved cross-platform. The user journey "open card → see panels → understand the ARKit surface" is equivalent across all targets; only iOS-specific affordances (live AR view, raycast, tracking telemetry) are intrinsically degraded. |
| II. Token-Based Theming | **PASS** — All chrome uses `ThemedView` / `ThemedText` and the `Spacing` scale from `src/constants/theme.ts`. Reuses existing semantic colour tokens (`textPrimary` / `surfaceElevated` / `accent` / `warning` / `error`); the segmented control + switch + status pill + stats row reuse the same shapes established by 016 / 029 / 032 / 033. No new theme entries; no hardcoded hex values. |
| III. Platform File Splitting | **PASS** — `screen.tsx` / `screen.android.tsx` / `screen.web.tsx`. Bridge has matching `arkit.ts` / `.android.ts` / `.web.ts` / `.types.ts` variants (mirrors 030 / 031 / 032 / 033 layouts). The web variant explicitly avoids importing `src/native/arkit.ts` at evaluation time. `Platform.select` is permitted only for trivial style / copy diffs. |
| IV. StyleSheet Discipline | **PASS** — All styles via `StyleSheet.create()`; `Spacing` from theme tokens; no inline objects, no CSS-in-JS, no utility-class frameworks. |
| V. Test-First for New Features | **PASS** — JS-pure tests are enumerated in the "Phased file inventory" section below and cover: every component (`CapabilitiesCard`, `ConfigurationCard`, `TapToPlaceControls`, `AnchorsPanel`, `StatsBar`, `IOSOnlyBanner` reuse), the `useARKitSession` hook (polling lifecycle, unmount safety, queued config), the bridge across all three platforms (iOS delegates to mocked native module + view manager; Android / Web throw `ARKitNotSupported`), the `with-arkit` plugin (idempotency + coexistence with `with-vision`), all three screen variants, and the manifest contract. Swift cannot be exercised on Windows; on-device verification documented in `quickstart.md`. |
| Validate-Before-Spec (workflow) | **PASS / N/A** — This is not a build-pipeline feature. The plugin's behaviour is verified by JS-pure tests against `@expo/config-plugins`'s `withInfoPlist` mod; a full `expo prebuild` smoke-test is recorded in `quickstart.md` §2 as the on-device gate (mirrors 017's prebuild verification). No proof-of-concept build is required to validate spec assumptions: ARKit / RealityKit are first-party Apple frameworks with stable iOS 11+ surfaces and the bridge is intentionally minimal. |

**Initial Constitution Check: PASS — no violations, no entries needed
in Complexity Tracking.**

**Re-check after Phase 1 (post-design): PASS** — the Phase 1 artifacts
(data-model, contracts, quickstart) introduce zero new global stores
(no AsyncStorage key, no `UserDefaults` write), zero new theme tokens,
zero new runtime JS dependencies, and no inline `Platform.select`
beyond trivial style branches. The bridge's typed surface keeps every
iOS-only symbol strictly inside `src/native/arkit.ts`; non-iOS
variants import only the shared `*.types.ts` and the typed error
class. The new native view (`ARKitView`) is the first ViewDefinition
in the repo; its mock surface is documented in
`contracts/native-module.contract.ts` so test code can attach to a
single, stable identity.

## Project Structure

### Documentation (this feature)

```text
specs/034-arkit-basics/
├── plan.md              # this file
├── research.md          # Phase 0 output (R-A through R-G)
├── data-model.md        # Phase 1 output (entities 1–7)
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── arkit-bridge.contract.ts       # JS bridge typed surface (5
│   │                                  #   AsyncFunctions + isAvailable)
│   │                                  #   + ARKitNotSupported error
│   ├── arkit-view.contract.ts         # ViewDefinition props + events
│   ├── manifest.contract.ts           # Registry entry contract
│   │                                  #   (id 'arkit-basics', label,
│   │                                  #    platforms, minIOS '11.0')
│   ├── native-module.contract.ts      # Expo Module Function shape
│   │                                  #   on the Swift side
│   └── plugin.contract.ts             # with-arkit modifier shape +
│                                      #   idempotency / coexistence
│                                      #   invariants
└── tasks.md             # Phase 2 output (NOT created here)
```

### Source Code (repository root)

```text
# NEW (this feature) — TypeScript module
src/modules/arkit-lab/
├── index.tsx                              # ModuleManifest (id 'arkit-basics',
│                                          #   minIOS '11.0', platforms ['ios','android','web'])
├── screen.tsx                             # iOS variant (six panels in fixed order:
│                                          #   CapabilitiesCard → AR view (or permission /
│                                          #   unsupported placeholder) → ConfigurationCard →
│                                          #   TapToPlaceControls → AnchorsPanel → StatsBar)
├── screen.android.tsx                     # Android: same panels minus live AR view;
│                                          #   AR region replaced by <IOSOnlyBanner />;
│                                          #   ConfigurationCard + TapToPlaceControls visibly
│                                          #   disabled with explanatory caption
├── screen.web.tsx                         # Web: same render set as android;
│                                          #   MUST NOT import src/native/arkit.ts at load
├── hooks/
│   └── useARKitSession.ts                 # { config, anchors, info, placeAnchorAt,
│                                          #   clearAnchors, pause, resume, reset, setConfig };
│                                          #   reducer-serialised mutations; polls
│                                          #   getSessionInfo() at 500 ms (R-D); cancels poll
│                                          #   + detaches listeners on unmount (FR-016);
│                                          #   queues config edits while paused (FR-025);
│                                          #   ONLY public surface consumed by screen variants
│                                          #   (FR-024); classifies bridge errors per R-D.
└── components/
    ├── CapabilitiesCard.tsx               # worldTrackingSupported flag + frame-semantics
    │                                      #   summary + status pill (idle/running/paused/error)
    ├── ConfigurationCard.tsx              # plane-detection segmented control +
    │                                      #   peopleOcclusion / lightEstimation / worldMap
    │                                      #   switches + Reset button. Disabled-on-non-iOS
    │                                      #   captions for the latter three switches when
    │                                      #   the device does not support the capability.
    ├── TapToPlaceControls.tsx             # anchor count + "Clear all" button + pause /
    │                                      #   resume button row; bridge calls go through hook
    ├── AnchorsPanel.tsx                   # ScrollView of AnchorRecord rows: short id (8 chars)
    │                                      #   + (x,y,z) rounded to 2 decimals in metres.
    │                                      #   Soft cap 100; no virtualization in v1.
    ├── StatsBar.tsx                       # FPS (1-second rolling avg) + tracking state
    │                                      #   ('normal'/'limited:<reason>'/'notAvailable') +
    │                                      #   session duration mm:ss
    └── IOSOnlyBanner.tsx (REUSED)         # Existing component imported, NOT redefined.
                                            #   Same import path the prior cross-platform
                                            #   modules use (017 / 029 / 030 / 031 / 032 /
                                            #   033). No copy in the module folder.

# NEW (this feature) — Swift sources, appended to MAIN APP TARGET via existing autolinking
native/ios/arkit/
├── ARKitBridge.swift                      # @available(iOS 11.0, *) Expo Module.
│                                          #   Module("ARKitBridge") {
│                                          #     AsyncFunction("placeAnchorAt") -> AnchorRecord
│                                          #     AsyncFunction("clearAnchors") -> Void
│                                          #     AsyncFunction("pauseSession") -> Void
│                                          #     AsyncFunction("resumeSession") -> Void
│                                          #     AsyncFunction("getSessionInfo") -> SessionInfo
│                                          #     Function("isAvailable") -> Bool   // checks
│                                          #         ARWorldTrackingConfiguration.isSupported
│                                          #   }
│                                          #   Holds a weak ref to the active ARKitView's
│                                          #   ARSession via a registry keyed by the view's
│                                          #   reactTag (R-C).
├── ARKitView.swift                        # @available(iOS 11.0, *) Expo Module
│                                          #   ViewDefinition wrapping RealityKit.ARView.
│                                          #   View("ARKitView") {
│                                          #     Prop("planeDetection") (none/horiz/vert/both)
│                                          #     Prop("peopleOcclusion") (Bool)
│                                          #     Prop("lightEstimation") (Bool)
│                                          #     Events("onSessionStateChange",
│                                          #            "onAnchorAdded", "onAnchorRemoved",
│                                          #            "onError")
│                                          #   }
│                                          #   Owns the ARSession + delegate; constructs
│                                          #   AnchorEntity(world:) with a 5 cm textured
│                                          #   ModelEntity(mesh: .generateBox(size: 0.05),
│                                          #   materials: [SimpleMaterial(... Texture)]) on
│                                          #   raycast hit (R-B). FPS sampler is a 60 Hz
│                                          #   ARSession delegate counter that emits a
│                                          #   1-second rolling average per getSessionInfo()
│                                          #   call (R-E).
└── Resources/
    └── cube-texture.png                   # 64×64 PNG; bundled into the Swift module's
                                            #   resources via the Expo Module's
                                            #   Resources(...) directive. No new asset
                                            #   pipeline.

# NEW (this feature) — JS bridge (mirrors 030 / 031 / 032 / 033 layout)
src/native/arkit.ts                        # iOS impl: requireOptionalNativeModule
                                            #   ('ARKitBridge') + Platform.OS === 'ios'
                                            #   gate; exports placeAnchorAt, clearAnchors,
                                            #   pauseSession, resumeSession, getSessionInfo,
                                            #   isAvailable, plus the ARKitNotSupported class.
                                            #   All AsyncFunctions serialise through a closure-
                                            #   scoped promise chain inherited verbatim from
                                            #   030 / 031 / 032 / 033 (research §1 / R-A).
src/native/arkit.android.ts                # Every AsyncFunction throws ARKitNotSupported.
                                            #   isAvailable() -> false (never throws).
src/native/arkit.web.ts                    # Identical contract to .android.ts; throws
                                            #   ARKitNotSupported on every AsyncFunction.
                                            #   isAvailable() -> false.
src/native/arkit.types.ts                  # ARKitBridge interface; ARKitNotSupported class
                                            #   declaration; PlaneDetectionMode / SessionState
                                            #   / TrackingState / ARKitConfiguration /
                                            #   AnchorRecord / SessionInfo type re-exports.
                                            #   Distinct module name 'ARKitBridge' (no
                                            #   collision with prior modules).

# NEW (this feature) — Expo config plugin
plugins/with-arkit/
├── index.ts                                # ConfigPlugin: idempotent withInfoPlist mod that
│                                            #   (a) sets NSCameraUsageDescription to a default
│                                            #   string ONLY when the key is absent (preserves
│                                            #   any value set by 017's with-vision or by a
│                                            #   project operator), and
│                                            #   (b) appends 'arkit' to UIRequiredDeviceCapabilities
│                                            #   exactly once (creates the array if absent;
│                                            #   no-ops if 'arkit' already present). See R-F.
└── package.json                            # Same shape as plugins/with-vision/package.json:
                                            #   name, version, main 'index.ts'. NO
                                            #   dependencies (config plugins resolve
                                            #   @expo/config-plugins from the host package).

# MODIFIED (additive only)
src/modules/registry.ts                    # +1 import line, +1 array entry (arkitLab)
                                            #   — registry size +1
app.json                                   # +1 string entry in expo.plugins:
                                            #   "./plugins/with-arkit". No other change.

# NOT MODIFIED — verified non-regression in tests
plugins/with-{live-activity,app-intents,home-widgets,screentime,coreml,vision,
              speech-recognition,audio-recording,sign-in-with-apple,local-auth,
              keychain-services,mapkit,core-location,rich-notifications,
              lock-widgets,standby-widget,focus-filters,background-tasks,
              spotlight,documents}/**     # All 21 prior plugins byte-identical.
                                            # In particular, with-vision/index.ts is NOT
                                            # touched; with-arkit defers to it for
                                            # NSCameraUsageDescription.
native/ios/{app-intents,widgets,focus-filters,background-tasks,spotlight,
              documents,share-sheet,...}/**  # All prior native sources byte-identical.
src/native/{app-intents,widget-center,focus-filters,background-tasks,spotlight,
              quicklook,share-sheet}.*    # All prior bridges byte-identical.
src/modules/{intents-lab,widgets-lab,lock-widgets-lab,standby-lab,
              focus-filters-lab,background-tasks-lab,spotlight-lab,
              documents-lab,share-sheet-lab,...}/**  # All prior modules byte-identical.
ios-widget/**                              # 014/027/028-owned widget extension; NOT touched.

# Tests (NEW)
test/unit/modules/arkit-lab/
├── manifest.test.ts                        # id 'arkit-basics', label 'ARKit Basics',
│                                            #   platforms ['ios','android','web'],
│                                            #   minIOS '11.0'
├── screen.test.tsx                         # iOS flow: six panels in fixed order.
│                                            #   Asserts CapabilitiesCard → AR view region →
│                                            #   ConfigurationCard → TapToPlaceControls →
│                                            #   AnchorsPanel → StatsBar. Permission-denied
│                                            #   path renders permission placeholder; the
│                                            #   isAvailable=false path renders 'Unsupported
│                                            #   on this device' placeholder.
├── screen.android.test.tsx                 # Android: same panels but AR region renders
│                                            #   <IOSOnlyBanner />; ConfigurationCard +
│                                            #   TapToPlaceControls have accessibilityState
│                                            #   .disabled === true
├── screen.web.test.tsx                     # Web: same render set as android; assert
│                                            #   src/native/arkit.ts is NOT pulled in by
│                                            #   the web bundle at module evaluation time
├── hooks/
│   └── useARKitSession.test.tsx            # mount default state; placeAnchorAt /
│                                            #   clearAnchors / pause / resume / reset /
│                                            #   setConfig; polling tick at 500 ms cadence
│                                            #   updates info; ARKitNotSupported on Android/Web
│                                            #   surfaces as state error (status pill 'error');
│                                            #   queued config while paused applies on resume
│                                            #   (FR-025); zero post-unmount calls (FR-016 +
│                                            #   SC-011). Uses jest fake timers.
└── components/
    ├── CapabilitiesCard.test.tsx           # supported / unsupported branches; status pill
    │                                        #   for each of idle/running/paused/error;
    │                                        #   error message visible when state==='error'
    ├── ConfigurationCard.test.tsx          # segmented control: 4 mutually-exclusive options;
    │                                        #   switches; Reset button; disabled rows when
    │                                        #   capability flag is false; non-iOS disable
    ├── TapToPlaceControls.test.tsx         # count display; "Clear all" calls clearAnchors;
    │                                        #   pause / resume buttons swap based on state
    ├── AnchorsPanel.test.tsx               # 0 / 1 / 100 entries; ids truncated to 8 chars;
    │                                        #   coordinates rounded to 2 decimals
    └── StatsBar.test.tsx                   # FPS rendering (0 when paused); tracking-state
                                              #   format 'normal' / 'limited:<reason>' /
                                              #   'notAvailable'; mm:ss formatter
test/unit/native/
└── arkit.test.ts                           # iOS path delegates to mocked native module +
                                              #   view manager; serialisation invariant
                                              #   (R-A); isAvailable mapped from
                                              #   ARWorldTrackingConfiguration.isSupported
                                              #   mock; Android: every AsyncFunction throws
                                              #   ARKitNotSupported, isAvailable returns false;
                                              #   Web: same as Android; web bundle does not
                                              #   import arkit.ts at evaluation time.
test/unit/plugins/
└── with-arkit.test.ts                      # withInfoPlist mod is idempotent (running it
                                              #   twice on the same Expo config produces a
                                              #   deep-equal config — SC-008); preserves an
                                              #   upstream NSCameraUsageDescription set by
                                              #   with-vision (coexistence — SC-009);
                                              #   appends 'arkit' to UIRequiredDeviceCapabilities
                                              #   when the array is absent, when present without
                                              #   'arkit', and is a no-op when 'arkit' is
                                              #   already present. Asserts there is NO
                                              #   face-tracking-related string anywhere in
                                              #   modResults (FR-017 stipulation).
```

**Structure Decision**: Mirrors **033's** `Expo + iOS-main-app-target`
shape. Differences from 033:

1. **One plugin, this time** — with-arkit adds two Info.plist
   modifications (camera-usage default + `UIRequiredDeviceCapabilities`
   append). 033 confirmed `UIActivityViewController` needed zero plist
   keys; ARKit specifically requires `UIRequiredDeviceCapabilities`
   contain `arkit` for App Store filtering, and the camera permission
   string is mandated by App Store review when any AR runtime is
   started. `app.json` `plugins` grows by one string entry.
2. **Two Swift files in a different shape** — `ARKitBridge.swift`
   (imperative `Module`) and `ARKitView.swift`
   (`ViewDefinition` wrapping `RealityKit.ARView`). 033's two Swift
   files were both presenter/activity classes; 034's split is
   `Module + View` and is the **first** ViewDefinition this branch
   introduces. The mock attaches to a stable JS identity exposed by
   `requireNativeViewManager('ARKitView')`.
3. **Bridge surface is wider** — five `AsyncFunction`s (placeAnchorAt,
   clearAnchors, pauseSession, resumeSession, getSessionInfo) plus
   `isAvailable`. 033 had one `present(opts)` plus `isAvailable`. The
   contract is therefore richer (see `arkit-bridge.contract.ts` and
   `arkit-view.contract.ts`).
4. **Polling lifecycle is JS-side** — `useARKitSession` polls
   `getSessionInfo()` at 500 ms via `setInterval`; on unmount it
   `clearInterval`s and best-effort calls `pauseSession()` (catching
   any rejection). 033 had no polling. SC-011 requires the test suite
   to assert zero post-unmount calls (R-D).
5. **Plugin coexistence concern** — 017's `with-vision` already sets
   `NSCameraUsageDescription`. `with-arkit` MUST preserve that value
   (no clobber) and only set a default when the key is absent.
   `UIRequiredDeviceCapabilities` is deduplicated by membership check
   so two prebuilds produce a byte-identical plist (SC-008). See R-F.
6. **Soft anchor cap 100** is enforced at the **AnchorsPanel**
   render boundary (no virtualization in v1) and documented in the UI
   caption. `useARKitSession` does not hard-cap; tests cover 100 as
   the largest expected list.
7. **Non-iOS bridge throws every imperative method** — there is no
   sensible "fallback" for ARKit (no Web AR, no AR Core wrapper in
   v1). The hook catches the error in a single classify-then-set-state
   path so the screen renders status pill **error** with
   `'ARKit not supported on this platform'` (R-D); the AR region
   itself is replaced upstream by `IOSOnlyBanner` so the bridge call
   never fires on Android / Web at the screen level — the hook is
   defensive in case the ConfigurationCard misroutes a tap.

## Resolved decisions

The spec was approved without clarifications. The following are the
plan-level technical decisions made autonomously, recorded in
`research.md` with full Decision / Rationale / Alternatives:

| # | Decision | Spec ref / location |
|---|----------|---------------------|
| R-A | Bridge serialisation via closure-scoped promise chain (inherited verbatim from 030 / 031 / 032 / 033). Two back-to-back `placeAnchorAt()` calls produce two native invocations in submission order. Applied on all three platforms (Android / Web reject in submission order). | research §1 |
| R-B | Raycast strategy: `RealityKit.ARView.raycast(from:allowing:alignment:)` with `.estimatedPlane` + the active alignment derived from the current `planeDetection` mode (`.horizontal` / `.vertical` / `.any`). On hit, build `AnchorEntity(world: hit.worldTransform)` and parent a `ModelEntity(mesh: .generateBox(size: 0.05), materials: [SimpleMaterial(color: .white, texture: cubeTexture)])`. The cube is 5 cm to be visible in typical room scenes. | research §2 |
| R-C | Session lifecycle ownership: `ARKitView` owns the `ARSession` and the `RealityKit.ARView`. `ARKitBridge` looks up the active view via a process-wide weak registry keyed by the view's `reactTag` (set in `onUpdate` of the ViewDefinition). When zero views are registered, every `AsyncFunction` rejects with `'no-active-view'`. This avoids holding the session in two places and matches the SDK's own ViewDefinition-owns-state convention. | research §3 |
| R-D | Polling cadence is **500 ms** (default; documented in `getSessionInfo` JSDoc). The JS hook uses `setInterval(500)` and stores both the interval id and a "mounted" ref in a `useEffect` cleanup; the cleanup clears the interval, sets `mounted.current = false`, and best-effort calls `pauseSession()` discarding any rejection. Bridge errors are classified by the hook into `'cancelled'` (the placement raycast missed — not an error), `'unsupported'` (ARKitNotSupported caught — flips status pill to **error** with `'ARKit not supported on this platform'`), or `'failed'` (any other Error — flips status pill to **error** with the message). | research §4 |
| R-E | FPS measurement: ARKit invokes `session(_:didUpdate:frame:)` at the camera frame rate (typically 60 Hz). The Swift side maintains a ring buffer of the last 60 timestamps; `getSessionInfo()` returns the rolling 1-second average computed at call time (no Swift-side timer). When paused, the ring buffer stops advancing and the next sample window naturally drops to 0 within 1 second of pause. | research §5 |
| R-F | `with-arkit` plugin uses `withInfoPlist`. For `NSCameraUsageDescription`: only sets the default `'Used to demonstrate ARKit world tracking and plane detection.'` when the key is absent (preserves 017's value and any operator override). For `UIRequiredDeviceCapabilities`: reads the existing array (or initialises `[]`), checks membership of `'arkit'`, appends only when absent. Two consecutive `withInfoPlist` invocations produce a deep-equal config (SC-008). The plugin is exported as a default `ConfigPlugin` and added to `app.json` `plugins[]` as the string `'./plugins/with-arkit'` (no options). The plugin **MUST NOT** add `NSFaceIDUsageDescription`, ARFaceTracking-related capabilities, or any other face/body-tracking strings (FR-017). | research §6 |
| R-G | `ARKitView` ViewDefinition props apply diff-style: `planeDetection` / `peopleOcclusion` / `lightEstimation` reconfigure the running session by calling `session.run(config, options: [])` (no `.resetTracking`, so existing anchors survive — FR-006 acceptance scenario US3-AS1). The `Reset` action separately invokes the imperative `clearAnchors()` then `session.run(config, options: [.removeExistingAnchors, .resetTracking])` to reload from a clean slate. The `worldMapPersistence` switch is wired to the JS hook only; the Swift side ignores the prop in v1 (placeholder). | research §7 |

## Phase 0 — Research

`research.md` resolves R-A through R-G with code-level detail.

- §1 R-A: Bridge serialisation (inherited from 030 / 031 / 032 / 033)
- §2 R-B: Raycast + RealityKit anchor entity construction
- §3 R-C: Session lifecycle + view-owns-state with weak registry
- §4 R-D: Polling cadence 500 ms + unmount safety + error
  classification
- §5 R-E: FPS measurement via ARSession delegate ring buffer
- §6 R-F: `with-arkit` plugin merge logic + idempotency proof +
  coexistence with 017
- §7 R-G: ViewDefinition prop diffing + Reset semantics
- §8 (Anchor cap and AnchorsPanel rendering): the soft cap of 100 is
  enforced at the render boundary (the panel receives at most 100
  rows; the hook does not hard-cap to keep the cap UI-only and
  documented). Performance verified informally via the existing
  `ScrollView` 60-fps target on a mid-tier iPhone.

## Phase 1 — Design & Contracts

**Prerequisites**: research.md complete (R-A through R-G resolved).

1. **`data-model.md`** — entities 1–7:
   - `PlaneDetectionMode` (`'none' | 'horizontal' | 'vertical' | 'both'`)
   - `SessionState` (`'idle' | 'running' | 'paused' | 'error'`)
   - `TrackingState` (`'normal' | 'limited:<reason>' | 'notAvailable'`)
   - `ARKitConfiguration` (the toggle set passed to the view as props)
   - `AnchorRecord` (JS-side projection of a native AR anchor)
   - `SessionInfo` (return shape of `getSessionInfo`)
   - `ARKitSession` (hook state composing all of the above)
2. **`contracts/`**:
   - `arkit-bridge.contract.ts` — JS bridge typed surface
     (`placeAnchorAt`, `clearAnchors`, `pauseSession`, `resumeSession`,
     `getSessionInfo`, `isAvailable`) + `ARKitNotSupported` error
   - `arkit-view.contract.ts` — ViewDefinition props + events
   - `manifest.contract.ts` — registry entry shape
   - `native-module.contract.ts` — Expo Module Function signatures on
     the Swift side
   - `plugin.contract.ts` — `with-arkit` modifier shape +
     idempotency / coexistence invariants
3. **`quickstart.md`** — JS-pure verification (Windows / CI) +
   on-device verification (iOS 11+ device with `ARWorldTrackingConfiguration
   .isSupported === true`; Android emulator; Web in Chrome). Adds an
   `expo prebuild` smoke-test step that asserts `ios/<app>/Info.plist`
   contains `arkit` in `UIRequiredDeviceCapabilities` exactly once and
   a non-empty `NSCameraUsageDescription` (whatever 017 set, or the
   plugin's default if 017 is removed).
4. **Agent context update**: the workspace's
   `.github/copilot-instructions.md` does not currently contain
   `<!-- SPECKIT START -->` / `<!-- SPECKIT END -->` markers (verified
   in 033's plan; unchanged here). The plan reference is recorded in
   this file; if/when those markers are introduced project-wide,
   `tasks.md` will substitute the path
   `specs/034-arkit-basics/plan.md` between them.

## Phased file inventory

NEW (TypeScript module):

- `src/modules/arkit-lab/index.tsx`
- `src/modules/arkit-lab/screen.tsx`
- `src/modules/arkit-lab/screen.android.tsx`
- `src/modules/arkit-lab/screen.web.tsx`
- `src/modules/arkit-lab/hooks/useARKitSession.ts`
- `src/modules/arkit-lab/components/{CapabilitiesCard,
  ConfigurationCard, TapToPlaceControls, AnchorsPanel, StatsBar}.tsx`

NEW (JS bridge):

- `src/native/arkit.ts`
- `src/native/arkit.android.ts`
- `src/native/arkit.web.ts`
- `src/native/arkit.types.ts`

NEW (tests):

- `test/unit/modules/arkit-lab/manifest.test.ts`
- `test/unit/modules/arkit-lab/screen.test.tsx`
- `test/unit/modules/arkit-lab/screen.android.test.tsx`
- `test/unit/modules/arkit-lab/screen.web.test.tsx`
- `test/unit/modules/arkit-lab/hooks/useARKitSession.test.tsx`
- `test/unit/modules/arkit-lab/components/{CapabilitiesCard,
  ConfigurationCard, TapToPlaceControls, AnchorsPanel,
  StatsBar}.test.tsx`
- `test/unit/native/arkit.test.ts`
- `test/unit/plugins/with-arkit.test.ts`

NEW (Swift, linked into main app target via existing autolinking):

- `native/ios/arkit/ARKitBridge.swift`
- `native/ios/arkit/ARKitView.swift`
- `native/ios/arkit/Resources/cube-texture.png` (64×64 bundled asset)

NEW (Expo config plugin):

- `plugins/with-arkit/index.ts`
- `plugins/with-arkit/package.json`

MODIFIED (additive only):

- `src/modules/registry.ts` (+1 import, +1 array entry `arkitLab`)
- `app.json` (+1 string entry `'./plugins/with-arkit'` in
  `expo.plugins`)

NOT MODIFIED:

- `package.json` / `pnpm-lock.yaml` — zero new runtime dependencies
- All prior plugins / Swift sources / bridges / modules — byte-identical

## Task seeds for tasks.md

These are sketches for the `/speckit.tasks` step, ordered by
dependency. The full enumeration belongs in `tasks.md`; these are
intentionally coarse so `/speckit.tasks` can split each into
RED → GREEN → REFACTOR sub-tasks.

1. **T001 — Bridge types + non-iOS variants (RED-first)**:
   `src/native/arkit.types.ts` declares the bridge interface +
   `ARKitNotSupported`. `arkit.android.ts` and `arkit.web.ts` throw
   the typed error from every AsyncFunction and return `false` from
   `isAvailable`. Tests cover both non-iOS platforms.
2. **T002 — iOS bridge**: `src/native/arkit.ts` implements the iOS
   path via `requireOptionalNativeModule('ARKitBridge')` +
   `Platform.OS === 'ios'` gate + closure-scoped serialisation chain
   per R-A. `isAvailable()` reads the mock-provided
   `worldTrackingSupported` field. Tests cover serialisation invariant
   + typed surface.
3. **T003 — Manifest**: `src/modules/arkit-lab/index.tsx` +
   `manifest.test.ts` (asserts id `'arkit-basics'`, label `'ARKit
   Basics'`, platforms `['ios','android','web']`, `minIOS: '11.0'`).
4. **T004 — Hook**: `hooks/useARKitSession.ts` returning the documented
   state object; reducer-serialised mutations; 500 ms polling with
   `setInterval`; unmount cleanup (FR-016, SC-011); queued config
   while paused (FR-025); error classification (R-D).
5. **T005 — Components, top-down RED**: write component tests first
   (`CapabilitiesCard`, `ConfigurationCard`, `TapToPlaceControls`,
   `AnchorsPanel`, `StatsBar`); then implement against them.
6. **T006 — Screens**: implement `screen.tsx`, `screen.android.tsx`,
   `screen.web.tsx` with full panel ordering per FR-003; tests assert
   layout order, banner visibility, hidden / disabled panels on
   non-iOS, permission-denied placeholder, unsupported-device
   placeholder, and that `screen.web.tsx` does NOT pull
   `src/native/arkit.ts` into the bundle.
7. **T007 — `with-arkit` plugin (RED-first)**:
   `plugins/with-arkit/index.ts` + `package.json`. JS-pure tests under
   `test/unit/plugins/with-arkit.test.ts` exercise idempotency
   (SC-008), coexistence with `with-vision` (SC-009), and the
   no-face-tracking guarantee.
8. **T008 — Swift sources**: write `ARKitBridge.swift` and
   `ARKitView.swift` under `native/ios/arkit/` plus the
   `Resources/cube-texture.png` asset. Bridge implements the Expo
   Module Function surface; view wraps `RealityKit.ARView` with the
   prop / event surface. No JS tests here (Constitution V exemption);
   on-device verification in `quickstart.md`.
9. **T009 — Registry hook-up**: append `arkitLab` import + array
   entry to `src/modules/registry.ts`. Update
   `test/unit/modules/registry.test.ts` if it asserts a fixed length.
10. **T010 — `app.json` plugin entry**: append
    `"./plugins/with-arkit"` to the `expo.plugins` array. Verify via
    a JS-pure parse + assertion test if the project keeps one;
    otherwise the plugin test (T007) plus the on-device prebuild step
    (quickstart §2) closes SC-007 / SC-008 / SC-009.
11. **T011 — `pnpm check` gate**: lint + typecheck + tests must be
    green; no `eslint-disable` directives anywhere; `pnpm format` is
    a no-op after the final commit. Report delta from 033's closing
    baseline.
12. **T012 — On-device verification**: execute `quickstart.md`
    checklist on a real iOS 11+ device with world-tracking support.
    Place at least 3 cubes; reset; pause / resume; toggle plane
    detection at runtime; verify FPS / tracking-state telemetry;
    verify `expo prebuild` produces a plist containing `arkit` in
    `UIRequiredDeviceCapabilities` exactly once and a non-empty
    `NSCameraUsageDescription`. Repeat the panel-render flow on
    Android and Web (banner + disabled controls).

## Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|------------|--------|------------|
| R1 | **Plugin clobbers feature 017's `NSCameraUsageDescription`** — operators upgrading to 034 lose the tailored Vision-module copy. | Medium | High | R-F: `with-arkit` only sets the key when **absent**. Test asserts that running `with-vision` then `with-arkit` produces 017's string verbatim (and vice versa: `with-arkit` then `with-vision` produces 017's string because 017 also defers when present — verified in `with-vision/index.ts`). SC-009 measurable on-device via prebuild. |
| R2 | **`UIRequiredDeviceCapabilities` `arkit` duplicated** by repeated prebuilds. | Medium | Medium | R-F + SC-008: membership check before append; idempotency test asserts deep-equal config across two `withInfoPlist` invocations. |
| R3 | **Bridge concurrency anomaly** — two rapid `placeAnchorAt()` calls stack two native raycasts, returning anchors in non-deterministic order. | Medium | Low | Per R-A, bridge serialises through a closure-scoped promise chain; the second call waits for the first to resolve. Test asserts two back-to-back calls produce two native invocations in submission order. |
| R4 | **iPad simulator / A8-class device returns `ARWorldTrackingConfiguration.isSupported === false`** and the screen crashes attempting to mount the AR view. | Low | High | FR-021: when `isAvailable()` returns false, the AR region renders the "Unsupported on this device" placeholder; the bridge MUST NOT call any imperative method that triggers session start. Test asserts the placeholder branch on the iOS variant when the mocked `isAvailable` returns false. |
| R5 | **People occlusion toggled on a non-supporting device** crashes the configuration. | Low | Medium | FR-006 + spec acceptance scenario US3-AS3: the toggle row is disabled in UI when the runtime capability flag is false. R-G also notes the Swift side ignores the prop when the device does not support it (logs once). |
| R6 | **`screen.web.tsx` accidentally pulls `src/native/arkit.ts` into the web bundle** via a transitive import. | Low | Medium | Tests for `screen.web.tsx` assert at module-graph level that `arkit.ts` is not in the import closure (mirrors 030 / 031 / 032 / 033 carryover). Bridge keeps platform-specific imports inside the `.ts` / `.android.ts` / `.web.ts` siblings only; types come from `arkit.types.ts`. |
| R7 | **FPS reads stale value during pause** — the ring buffer drains over 1 s, so the StatsBar shows non-zero FPS for up to 1 s after `pauseSession()`. | Low | Low | Documented behaviour in R-E: the value naturally falls to 0 within 1 s. The hook also forces a synthetic `fps: 0` sample on entering the `paused` state to surface the transition immediately to the StatsBar (test covers this). |
| R8 | **Anchor list grows past 100** in a long demo session, dropping render frame rate. | Low | Low | Soft cap documented in spec §"Out of Scope" and §"Edge Cases". The hook does NOT hard-cap; the AnchorsPanel render boundary slices to 100 newest. Test covers a 100-entry list rendering at 60 fps in JSDOM (smoke check; on-device verification in quickstart §2). |
| R9 | **Polling tick fires after unmount** because `setInterval` ran one more iteration before `clearInterval` settled. | Low | Medium | R-D: `mounted.current = false` flag is checked at the top of every tick handler before mutating state; cleanup runs synchronously inside `useEffect` return. SC-011 asserts zero post-unmount calls; test uses `jest.useFakeTimers()` and advances time past unmount. |
| R10 | **Bridge module-name collision** — adding `'ARKitBridge'` collides with a future Apple-shipped wrapper or third-party library. | Very Low | Low | Distinct module name `'ARKitBridge'`. No conflict with `'AppIntents'` / `'WidgetCenter'` / `'FocusFilters'` / `'BackgroundTasks'` / `'Spotlight'` / `'QuickLook'` / `'ShareSheet'`. ViewDefinition name `'ARKitView'` is similarly distinct. Test asserts both lookups exactly. |
| R11 | **RealityKit cube texture asset missing from app bundle** (autolinking does not pick up `Resources/`). | Low | Medium | The Swift module declares the resource via the Expo Module's `Resources(...)` directive; on-device quickstart §2 visually verifies a textured (not solid white) cube. Fallback: if texture loading fails at runtime, the cube still renders as `SimpleMaterial(color: .white)` (no crash). |
| R12 | **Camera permission dialog cancelled silently on first mount** — the OS suppresses repeated prompts after a "Don't Allow". | Low | Medium | FR-020: when permission is denied, the AR region renders the permission placeholder with an "Open Settings" affordance. Test covers the denied branch. |

## Test baseline tracking

- **Branch start**: carried forward from feature 033's completion
  totals (recorded in 033's `plan.md` / `retrospective.md`).
- **Expected delta** (sketch, finalised in `tasks.md`):
  - +1 `manifest.test.ts` suite
  - +3 `screen.{ios,android,web}.test.tsx` suites
  - +1 `useARKitSession.test.tsx` suite
  - +5 component test suites (`CapabilitiesCard`,
    `ConfigurationCard`, `TapToPlaceControls`, `AnchorsPanel`,
    `StatsBar`)
  - +1 `arkit.test.ts` (bridge, all three platforms) suite
  - +1 `with-arkit.test.ts` (plugin) suite
  - +1 (optional) `app.json` plugin-entry assertion if the project
    keeps one
  - **Total target**: **≥ +14 suites at completion** (smaller than
    033's ≥ +18 because 034 has five components vs 033's nine; the
    plugin suite is new vs 033 which had no plugin).
- Final deltas reported in
  `specs/034-arkit-basics/retrospective.md`.

## Progress Tracking

- [x] Spec authored and approved (`specs/034-arkit-basics/spec.md`, 2026-04-30)
- [x] Plan authored — this file (Phase 0 + Phase 1 outline complete)
- [ ] Phase 0 — `research.md` written (resolves R-A through R-G)
- [ ] Phase 1 — `data-model.md`, `contracts/*.contract.ts`, `quickstart.md` written
- [ ] `/speckit.tasks` run; `tasks.md` written from the T001-T012 seeds above
- [ ] T001-T010 implemented; `pnpm check` green; baseline delta substituted into "Test baseline tracking"
- [ ] T011 (`pnpm check` gate) signed off
- [ ] T012 (on-device quickstart) signed off on a real iOS 11+ device
- [ ] `retrospective.md` written; final test totals substituted; merged to main

## Complexity Tracking

> No constitution violations. Section intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| _(none)_  | _(n/a)_    | _(n/a)_                              |
