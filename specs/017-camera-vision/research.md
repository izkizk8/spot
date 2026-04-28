# Phase 0 — Research: Camera + Vision Live Frames Module

All "NEEDS CLARIFICATION" items from Technical Context have been resolved below. Each entry follows the Decision / Rationale / Alternatives format.

---

## R-001 — Why periodic `takePictureAsync` over experimental frame processors

**Decision**: Drive the analysis loop via periodic `takePictureAsync` snapshots at a configurable interval (default **250 ms**, exposed as `intervalMs` on the `useFrameAnalyzer` hook). Do **not** use any experimental, undocumented, or to-be-stabilized frame-processor surface in `expo-camera` 55. Do **not** fork or patch `expo-camera`.

**Rationale**:
- **Stable public API**: `takePictureAsync` is documented, supported, and stable across SDK upgrades. `expo-camera` 55 does not yet expose a stable, supported public per-frame processor API comparable to `react-native-vision-camera`'s frame processors. Building this module on a stable surface is the right trade for an educational showcase that is expected to survive multiple SDK bumps with zero churn.
- **Teardown safety**: A polling loop is trivially cancellable on unmount — clear the timer, drop the in-flight token, done. Frame-processor teardown (especially across SDK migrations) has historically been more error-prone, with reports of leaked native references and "state update on unmounted component" warnings under fast-mount/unmount cycles. NFR-003 (no Jest warnings about state updates on unmounted components) is much easier to satisfy with a polling loop.
- **Scope discipline**: Wiring an experimental processor would require either forking `expo-camera` or patching it via `patch-package`. Both are explicitly out of scope (the spec's Reality Check and Out-of-Scope sections both exclude it). For an educational module whose purpose is to demonstrate **Vision**, the camera-frame-source layer should be the boring, well-understood part.
- **Honest cadence disclosure**: The cost of this choice is real (2–6 fps achievable cadence, vs. 30–60 fps for true frame processors). The Stats Bar surfaces the achieved FPS in real time, the spec's Reality Check repeats the trade-off in three locations, and `quickstart.md` points readers wanting true real-time analysis at `react-native-vision-camera` as the canonical follow-up.
- **Single in-flight invariant is natural**: With a polling loop, "at most one snapshot+analyze in flight per screen" (FR-015 overlap-skip behavior) falls out from a single boolean token. A frame-processor variant would have to negotiate backpressure across the worklet boundary — strictly more complex.

**Trade-off**: Achievable analysis cadence is roughly **2–6 fps** at the default 250 ms interval on an A14+ device, depending on which Vision request is active (face rectangles is the cheapest; text recognition is the most expensive). The live preview surface is unaffected — `expo-camera` renders the preview off the JS thread, so the polling loop and the preview run independently.

**Alternatives considered**:
- *`react-native-vision-camera` frame processors*: True 30+ fps pipeline; correct tool if the goal were to ship a production scanner. Wrong tool for an educational Vision-framework demonstration in a multi-module showcase that already standardizes on `expo-camera` for any other camera-touching feature. Pointed at as the documented follow-up in `quickstart.md`.
- *Forking `expo-camera` to expose its experimental processor surface*: Multiplies maintenance cost across every SDK bump; out of scope.
- *Polling at 1000 ms*: Defensible but feels stale for face-rectangle demos. 250 ms is the published default; tests can override.
- *Polling at 100 ms*: Frequently exceeds analysis duration (text recognition ~150–250 ms on A14+), so the overlap-skip path would dominate and the Stats Bar would report ~4 fps regardless. 250 ms is a more honest target.

---

## R-002 — Vision request choice per mode

**Decision**: Map the three active modes 1-for-1 to a single Apple Vision request class each:

| Mode | Vision request class | iOS minimum | Output type |
|------|----------------------|-------------|-------------|
| `'faces'` | `VNDetectFaceRectanglesRequest` | iOS 11 | `VNFaceObservation` |
| `'text'` | `VNRecognizeTextRequest` | iOS 13 | `VNRecognizedTextObservation` |
| `'barcodes'` | `VNDetectBarcodesRequest` | iOS 11 | `VNBarcodeObservation` |

**Rationale**:
- **Built-in, no model file**: All three requests use Apple's first-party detectors that ship with Vision itself. No `.mlmodel` artifact, no operator-supplied download (this is the critical contrast with feature 016, which relies on an external MobileNetV2 file). Zero new build-time prerequisites.
- **Common output shape**: Every Vision observation exposes a `boundingBox: CGRect` in normalized `[0, 1]` Vision coordinates. The Swift bridge converts each request's observations into a uniform JS-side `{ kind, boundingBox: { x, y, width, height }, payload?: string }` shape — see R-003 for the coordinate-space convention. This keeps `OverlayCanvas` polymorphism-free: it iterates over `observations[]` and renders one rectangle per entry, irrespective of `kind`.
- **`VNRecognizeTextRequest` over `VNDetectTextRectanglesRequest`**: The "Recognize" variant returns the actual decoded string in addition to the bounding box (`topCandidates(1).first?.string`). The spec requires the recognized string to be exposed via the overlay's accessibility label (FR-007). The "Detect" variant returns only rectangles and would force a second request to extract strings — strictly more work for a strictly worse result.
- **Default revisions are fine**: All three requests are instantiated with their default `revision` (the latest version available on the runtime iOS). There is no current need to pin a specific revision; the spec does not require deterministic outputs across iOS versions, only that the bridge surfaces what Vision produced.
- **`recognitionLevel = .fast` for text**: Set on the `VNRecognizeTextRequest`. The spec accepts a 1.5 s detection latency; `.accurate` would push that significantly higher with no payoff for an educational demo. Operators wanting `.accurate` can change one line; the trade-off is documented inline in the Swift source.

**Alternatives considered**:
- *`VNDetectFaceLandmarksRequest`*: Returns landmarks (eyes, nose, mouth) in addition to rectangles; out of scope for this MVP and would require a different overlay strategy. Deferred.
- *`VNDetectTextRectanglesRequest` (rectangles only)*: Rejected — see above.
- *Multiple requests in a single `VNImageRequestHandler.perform([…])` call (e.g., faces + text simultaneously)*: Possible, but the spec defines `mode` as exclusive (one request per cycle). A future `'all'` mode could batch them, but it is explicitly out of scope (Out of Scope: "Vision request types beyond faces, text, and barcodes" — and the dispatch is also "one at a time").
- *Pinning request `revision`*: No payoff; raises maintenance burden across iOS upgrades. Skip.

---

## R-003 — Coordinate-space conversion (Vision normalized → React Native pixels)

**Decision**: The Swift bridge returns each observation's `boundingBox` in **normalized `[0, 1]` coordinates with origin at the top-left** of the captured image (i.e., already converted from Vision's native bottom-left origin to the JS / React Native top-left convention). The JS-side `OverlayCanvas` does **only** a multiply-by-view-dimensions transform — it does not perform any axis flipping.

**Rationale**:
- **Apple Vision uses bottom-left origin**: `VNRectangleObservation.boundingBox` (and all subclasses) returns a `CGRect` in `[0, 1]` with origin at the bottom-left of the image, following the Core Graphics convention. This is documented in <https://developer.apple.com/documentation/vision/vnrectangleobservation/2867227-boundingbox>.
- **React Native uses top-left origin**: Layout coordinates run top-down. A naive pass-through would render every face at the bottom of the screen mirrored vertically.
- **Convert at the Swift boundary, not in JS**: The conversion is exactly `y_top = 1 - (y_bottom + height)` (and `x` / `width` unchanged). Doing it once in `VisionDetector.swift` keeps the JS layer clean and trivially testable: `OverlayCanvas` tests can assert `top: bbox.y * containerHeight` without any conditional axis logic. The `vision-types.ts` `BoundingBox` JSDoc documents the convention in one place.
- **Why not convert in JS**: It would push the conversion into every JS consumer (or into a shared helper that every consumer must remember to call), and it would couple JS-side rendering code to a non-obvious Apple-platform convention. Doing it at the bridge boundary respects the principle that each side of an FFI presents data in *its own* native conventions.
- **Aspect-ratio + capture-orientation handling stays in JS**: The `OverlayCanvas` knows the preview view's pixel dimensions and the captured-image aspect ratio (the snapshot's width × height, returned alongside `analysisMs`). The component computes a "letterbox" mapping when the preview's aspect ratio differs from the captured image's. This is JS-side because it depends on view-layout values that are not available in Swift.

**Alternatives considered**:
- *Pass through Vision's bottom-left convention and convert in JS*: Rejected — pushes Apple-specific knowledge into the JS layer and risks every consumer forgetting the flip.
- *Return absolute pixel coordinates from Swift*: Couples Swift to view dimensions that Swift cannot know (the JS preview view may be smaller than the captured image). Wrong layer.
- *Convert in `OverlayCanvas` only and trust no one else needs the bbox*: Acceptable today but breaks the moment a second consumer (e.g., a hypothetical "save observation" flow) appears. Convert at the boundary; consumers stay simple.

---

## R-004 — `react-native-reanimated` for overlay smoothness

**Decision**: The `OverlayCanvas` renders one absolutely-positioned `Animated.View` per observation, with `top` / `left` / `width` / `height` driven by `useSharedValue` numbers and an `useAnimatedStyle` hook. Position / size transitions on each new analysis cycle use `withTiming(target, { duration: 150 })` (snappier than the bar-chart 300 ms because the box is already close to its target most of the time and a slow ease feels laggy on a moving subject). When `useReducedMotion()` returns `true`, transitions short-circuit to instantaneous assignments (`sharedValue.value = target` directly).

**Rationale**:
- **Project standard**: Reanimated is already a tier-1 dependency (used by feature 016's bar chart, feature 010's `Keyframe` API, etc.). The constitution's Technology Constraints section explicitly names `react-native-reanimated` Keyframe API + `react-native-worklets` and forbids RN's `Animated` API for new code. This module is bound by that constraint.
- **Off-main-thread**: Worklet-driven animations do not block the JS thread, so a fresh observation set arriving every ~250 ms does not stall the rectangle interpolation. This matters precisely because the analysis loop runs on the JS thread and any synchronous overlay update would compete with the next snapshot.
- **Per-rectangle granularity**: Each observation gets its own set of shared values, animated independently. When face A moves and face B stays still, only A's rectangle re-interpolates — no whole-canvas re-render storm.
- **150 ms duration is intentionally short**: Long durations (≥ 300 ms) feel laggy when the underlying detection refreshes at 4 fps (250 ms interval) — a 300 ms ease would still be in flight when the next observation arrives, producing visible "drag". 150 ms lets each transition almost-complete before the next one begins, which feels responsive without feeling teleporty. The number is a tunable constant in the component, not exposed as a prop.
- **`useReducedMotion()` short-circuit**: NFR-005 explicitly requires the reduced-motion path. Reanimated 3's `useReducedMotion` hook returns a reactive boolean; the animated style reads it and bypasses `withTiming` when set. Tested via `react-native-reanimated`'s mock that lets us flip the value in the component test suite.
- **Identity / continuity across cycles**: A naive implementation would key rectangles by array index, which causes jitter when the detected count changes (e.g., face B leaves frame and face C enters; the wrong shared values get recycled). The component keys by a stable index assigned in observation order *plus* a small dampening: when the count changes, the disappearing rectangles are unmounted and the new ones fade-in from `opacity: 0` rather than snapping in at full opacity. This is a small UX polish, not a spec requirement; it lives behind the same `useReducedMotion()` check.

**Alternatives considered**:
- *RN `Animated` API*: Forbidden by constitution Technology Constraints.
- *No animation, snap to new positions*: Rejected — produces visible jitter at 4 fps that reads as "broken" rather than "low frame rate". The spec's NFR-005 mentions reanimated specifically.
- *Skia-based overlay (`@shopify/react-native-skia`)*: Heavyweight; adds a dependency and a learning surface for a feature whose goal is to demonstrate Vision, not Skia. Could be a documented alternative for a "Skia overlay" follow-up module.

---

## R-005 — Plugin pattern for `NSCameraUsageDescription` (idempotent merge)

**Decision**: The 017 config plugin uses a single `withInfoPlist` mod that **conditionally writes** `NSCameraUsageDescription`: it sets the key to a sensible default ("Used to demonstrate on-device Vision analysis") **only if the key is absent**. If any prior plugin or operator-supplied `app.json` `ios.infoPlist` block has already populated the key, the existing value is preserved verbatim.

```ts
import { type ConfigPlugin, withInfoPlist } from 'expo/config-plugins';

const DEFAULT_CAMERA_USAGE_DESCRIPTION =
  'Used to demonstrate on-device Vision analysis (face / text / barcode detection).';

const withVision: ConfigPlugin = (config) =>
  withInfoPlist(config, (cfg) => {
    cfg.modResults.NSCameraUsageDescription ??= DEFAULT_CAMERA_USAGE_DESCRIPTION;
    return cfg;
  });

export default withVision;
```

**Rationale**:
- **Idempotency by construction**: `??=` (logical-nullish-assignment) writes only when the key is absent. Running the plugin twice produces byte-identical output. Composing it with another plugin that also sets the key (no current example, but defensively planned for) preserves the first writer's value.
- **Operator override is free**: An operator wanting a custom usage string just adds an `app.json` `ios.infoPlist.NSCameraUsageDescription` entry; Expo applies that *before* config plugins run, so the plugin's `??=` becomes a no-op. No documentation needed; the behavior is intuitive.
- **Coexistence with 007 / 014 / 015 / 016 (FR-029)**:
  - 007 (Live Activities) edits an `Activity` extension target + entitlements — disjoint from `NSCameraUsageDescription`.
  - 014 (Home Widgets) edits a Widget extension target + App Groups — disjoint.
  - 015 (ScreenTime) edits entitlements + capabilities — disjoint.
  - 016 (CoreML) edits the iOS app target's resources to declare the `.mlmodel` — disjoint from Info.plist usage strings.
  - The 017 plugin only ever writes a single Info.plist key, conditionally. There is no plausible interaction surface with the other four plugins.
- **Vision framework linkage lives in the podspec, not the plugin**: `native/ios/vision/Vision.podspec` declares `s.frameworks = 'Vision'`; the plugin doesn't need to mutate `xcodeproj` to wire the framework. This matches 016's split (CoreML linkage in the podspec; only Info.plist / resource declarations in the plugin).
- **Test surface is tiny**: Three assertions: (1) writes default when absent, (2) preserves existing value when present, (3) idempotent across two consecutive invocations. Plus one fixture-composition test that runs 017 alongside 007/014/015/016 fixtures and diffs the resulting config against the chain-without-017 — proving 017 only added the one key.

**Alternatives considered**:
- *Always overwrite `NSCameraUsageDescription`*: Hostile to operators who supply their own string. Rejected.
- *Use `withDangerousMod` to edit the raw `Info.plist` XML*: Overkill — `withInfoPlist` operates on the parsed dictionary and is the documented Expo path.
- *Add a custom usage string per-mode (e.g., different strings for faces / text / barcodes)*: Apple shows one string at the system permission prompt; the user grants camera access once, not per-feature. Single string is correct.
- *Skip the default and require operators to set it manually*: Would cause `expo prebuild` to succeed but `xcodebuild` to fail with App Store Connect rejecting any binary missing the key. Loud-on-publish failure mode is much worse than a sensible default.

---

## R-006 — iOS 13.0 minimum

**Decision**: The module's manifest declares `minIOS: '13.0'`. The 006 registry already filters modules out of the grid on older iOS.

**Rationale**:
- `VNRecognizeTextRequest` ships in iOS 13 (the most recent of the three request types used). Faces and barcodes are iOS 11+; text recognition is the floor.
- **Project alignment**: spot's overall iOS deployment target floor is iOS 13, matching feature 016's choice. Raising the floor to iOS 14+ would gate this module on a newer minimum than the showcase requires for no payoff.
- **Future "advanced" modes**: If a future mode pulls in an iOS 16+ Vision API (e.g., `VNGenerateOpticalFlowRequest`), that mode's dispatch branch can `if #available(iOS 16, *)` internally and the module can keep its 13.0 floor by surfacing `VisionAnalysisFailed` on older runtimes.

**Alternatives considered**:
- *iOS 11 minimum*: Would lose `VNRecognizeTextRequest`. Rejected.
- *iOS 16 minimum*: No functional payoff for the three modes in scope. Rejected.

---

## R-007 — Cross-platform stub strategy

**Decision**: Provide explicit `vision-detector.android.ts` and `vision-detector.web.ts` files. Both export the same `bridge` shape; `isAvailable()` returns `false` synchronously, and `analyze()` rejects with `new VisionNotSupported()`.

**Rationale**: Mirrors the precedent set by `src/native/coreml.{ts,android.ts,web.ts}`, `src/native/screentime.{ts,android.ts,web.ts}`, `src/native/widget-center.{ts,android.ts,web.ts}`, and `src/native/live-activity.{ts,android.ts,web.ts}`. Satisfies Constitution Principle III (Platform File Splitting) without inline `Platform.select()` for non-trivial fallback logic. The defensive guard is double-layered: the screen short-circuits on `bridge.isAvailable() === false` so the loop never starts, *and* the bridge itself rejects if anyone bypasses the guard.

**Alternatives considered**:
- *Single `vision-detector.ts` with `Platform.OS === 'ios'` branches*: Violates Principle III for non-trivial differences.

---

## R-008 — Non-iOS `CameraPreview` surface

**Decision**:
- **Android**: `CameraPreview.tsx` (the default — also serves iOS) renders `expo-camera`'s `<CameraView />`. On Android the preview renders normally; the screen above it (`screen.android.tsx`) does not instantiate the analysis hook.
- **Web**: `CameraPreview.web.tsx` renders a `ThemedView` placeholder containing a centered `ThemedText` with the string "Camera not available in this browser" and a subtle bordered surface to communicate the placeholder shape.

**Rationale**:
- `expo-camera` 55 supports Android; reusing the same component on Android is free and gives the educational continuity the spec calls for (US-5 requires the live preview to render on Android).
- On web, `expo-camera` does have a web implementation (`getUserMedia`-based), but it adds a permission prompt and a mediastream lifecycle for a surface that serves only as visual continuity for an iOS-only feature. The placeholder is honest about what the platform offers and avoids spurious browser permission prompts.
- The split is by suffix — `.web.tsx` — per Constitution Principle III. No inline `Platform.select()`.

**Alternatives considered**:
- *Use `expo-camera`'s web implementation*: Adds a permission prompt and a `getUserMedia` lifecycle for a feature whose iOS-only behavior cannot run anyway. Net negative for the user.
- *Render a fully blank surface on web*: Leaves the user wondering whether the screen is broken. The placeholder is more informative.

---

## R-009 — FPS computation method

**Decision**: The hook maintains a small ring buffer of the last N analysis-completion timestamps (N = 8, ~2 seconds at the default cadence). `fps` is computed as `(N - 1) / ((tail - head) / 1000)`. Update happens after every successful analysis. Reset on mode change (clears observations and zeros the ring).

**Rationale**:
- **Smoothing without lag**: A pure "1 / lastInterval" FPS readout flickers wildly when a single cycle takes longer (e.g., a 600 ms text recognition spike makes FPS drop to 1.6 then snap back to 4.0). An 8-sample window smooths this without introducing noticeable lag (~2 s settling time).
- **One decimal place display**: Matches FR-008. The Stats Bar formats the value with `.toFixed(1)`.
- **Reset on mode change is honest**: Switching modes invalidates the buffer because the new mode has a different per-cycle cost. Carrying old samples would mislead.
- **`fps` retains its last value when mode goes to `'off'`**: FR-018 explicitly permits this (the alternative — zeroing — was considered and rejected because the user has just paused the loop and immediately seeing "0.0 fps" reads as broken; the last-known value better communicates "this is what you were getting before you paused"). Same applies to `lastAnalysisMs`.

**Alternatives considered**:
- *EMA (exponential moving average)*: Marginally smoother but harder to reason about and harder to test with fake timers. Ring buffer wins on testability.
- *Simple last-interval FPS*: Rejected — flickers.

---

## R-010 — Snapshot loop overlap-skip semantics

**Decision**: The hook holds a single `inFlight` boolean. The interval timer fires every `intervalMs`; on each tick, if `inFlight` is `true`, the tick is **dropped** (no queue, no catch-up). When an analysis completes, `inFlight` becomes `false` and the next tick that fires will start a new cycle. If `mode` has changed by the time an in-flight analysis resolves, the result is **discarded** (no `setObservations` call).

**Rationale**:
- **Bounded memory**: A queueing model could accumulate pending base64 payloads across a slow stretch of analyses, blowing up memory. Drop-on-busy is bounded by construction.
- **Predictable cadence under load**: If text recognition takes 600 ms, the achieved cadence on a 250 ms timer is ~1.6 fps regardless of how long the slow stretch lasts. Queueing would produce a "burst" of catch-up calls on each recovery, doubling the apparent cadence transiently and confusing the FPS readout.
- **Simpler test**: One boolean flag, two transitions, fully testable with fake timers. Two assertions — "during a slow analyze, additional ticks do not start new cycles" and "after the slow analyze completes, the next tick starts a fresh cycle" — cover the entire surface.
- **Mode-change discard**: The hook captures the active mode in a closure when each cycle starts; on resolve it compares to the current mode and discards if they differ. This handles rapid toggling (e.g., Faces → Text → Faces) safely: the stale Text result never reaches the canvas.

**Alternatives considered**:
- *Bounded queue (max 1 pending)*: Equivalent to drop-on-busy with extra bookkeeping. Skip.
- *Cancel the in-flight Vision request on mode change*: `expo-modules-core` does not expose cancellation on the JS side; would require a Swift-side cancellation API. Drop-on-resolve is cheaper and just as correct from the user's perspective.

---

## R-011 — Permission lifecycle

**Decision**: The screen uses `expo-camera`'s `useCameraPermissions()` hook directly. When `permission?.granted === false`, the screen renders a non-crashing inline status message ("Camera access is required for this module") and a button that calls `requestPermission()`. The `useFrameAnalyzer` hook is **not instantiated** (or is instantiated with `mode: 'off'`) until permission is granted.

**Rationale**:
- **First-party, well-tested**: `useCameraPermissions` handles the granted/denied/limited/restricted cases uniformly; the permission state is reactive so the screen updates automatically when the user grants access from a Settings round-trip.
- **No analysis loop without permission**: Prevents `takePictureAsync` from being called before permission, which would itself trigger a permission prompt (double prompt) or fail noisily.
- **Mid-session revocation**: The next snapshot fails; the bridge surfaces an error; the hook surfaces it via `error`; the screen re-shows the permission affordance. No special handling beyond what the hook already does on any analysis failure.

**Alternatives considered**:
- *Roll our own permission state with `Camera.requestCameraPermissionsAsync`*: Loses the reactive-on-Settings-return behavior. Skip.

---

## Summary of resolved unknowns

| Item | Status |
|------|--------|
| Frame source (snapshot loop over experimental processors) | ✅ Resolved (R-001) |
| Vision request choice per mode | ✅ Resolved (R-002) |
| Coordinate-space conversion (Vision bottom-left → RN top-left) | ✅ Resolved (R-003) |
| Reanimated for overlay smoothness | ✅ Resolved (R-004) |
| Plugin pattern for NSCameraUsageDescription (idempotent) | ✅ Resolved (R-005) |
| iOS minimum version (13.0) | ✅ Resolved (R-006) |
| Cross-platform stub strategy | ✅ Resolved (R-007) |
| Non-iOS `CameraPreview` surface | ✅ Resolved (R-008) |
| FPS computation method | ✅ Resolved (R-009) |
| Snapshot loop overlap-skip semantics | ✅ Resolved (R-010) |
| Permission lifecycle | ✅ Resolved (R-011) |

No remaining `NEEDS CLARIFICATION` items.
