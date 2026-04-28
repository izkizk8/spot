# Feature Specification: Camera + Vision Live Frames Module

**Feature Branch**: `017-camera-vision`
**Created**: 2026-05-12
**Status**: Draft
**Input**: User description: "Feature 017 — Camera + Vision Live Frames module — an iOS-focused educational module that wires `expo-camera`'s live preview to Apple's Vision framework via a thin native bridge, runs face / text / barcode detection on a periodic snapshot loop, and renders detection results as an overlay on top of the preview, with cross-platform graceful degradation."

---

## ⚠️ Frame Source Reality Check (READ FIRST)

`expo-camera` 55 does not yet expose a stable, supported public API for per-frame processors comparable to `react-native-vision-camera`'s frame processors. This module deliberately uses a **periodic `takePictureAsync` snapshot loop** (default cadence ~250 ms, configurable via `useFrameAnalyzer`) as the frame source instead of any experimental or undocumented frame-processor surface.

**Why this matters**:

- **Stability**: `takePictureAsync` is a public API documented by Expo and supported across SDK upgrades; experimental frame processors are not.
- **Scope**: Wiring an experimental processor would require forking or patching `expo-camera`, which is explicitly out of scope.
- **Teardown safety**: A polling loop is trivially cancellable on unmount; processor teardown is more error-prone.

The cost is honest: this is not a true real-time pipeline. Achievable cadence on a modern iOS device is roughly **2–6 frames per second** depending on Vision request type and capture resolution. The module surfaces this transparently in the Stats Bar (FPS counter). The frame-source decision is documented again in `research.md`; users wanting true 30/60 fps frame processing are pointed at `react-native-vision-camera` as a follow-up.

**On-device verification is conditional on a real iOS device.** The simulator provides a static / animated camera feed but can run Vision requests against captured frames. Windows-based development verifies only the JS-pure layer (hooks with fake timers, components, screen integration with mocked bridge, plugin presence checks, manifest).

This reality check is repeated in two additional locations: the module's `quickstart.md` and the Assumptions section below.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Detect faces in the live preview on iOS (Priority: P1)

A developer studying the spot iOS showcase opens the app on an iOS 13+ device, taps the "Camera Vision" card from the Modules grid, grants camera access at the system prompt, and sees the live rear-camera preview fill the screen. The Mode Picker is preselected to "Faces". As the developer points the camera at a face, one or more green bounding-box rectangles appear over each detected face, updating a few times per second. A Stats Bar at the bottom reports the current cadence (FPS), the last analysis duration in milliseconds, and the count of faces detected in the most recent frame.

**Why this priority**: This is the MVP. It validates the end-to-end pipeline this module exists to demonstrate: `expo-camera` preview + permission → snapshot loop → Vision native bridge (`VNDetectFaceRectanglesRequest`) → JS observation array → reanimated overlay rectangles → live stats. Faces is chosen as P1 because it has the lowest external dependency (no specific text or barcode props required to validate) and is visually unmistakable.

**Independent Test**: Build the app on an iOS 13+ device, open the Camera Vision module, grant camera permission, and point the rear camera at any face. Verify (a) the live preview renders without dropped frames in the camera surface itself, (b) at least one bounding-box rectangle appears within ~1 second of a face entering frame, (c) the Stats Bar shows a non-zero FPS, a positive `lastAnalysisMs` value, and a `detected` count matching the number of visible boxes, and (d) all rectangles disappear within ~1 second of the camera being pointed away.

**Acceptance Scenarios**:

1. **Given** an iOS 13+ device with camera permission not yet granted, **When** the user opens the Camera Vision module, **Then** the screen renders a permission-request affordance (provided by `useCameraPermissions`) and no preview is shown until permission is granted.
2. **Given** camera permission has been granted, **When** the screen mounts, **Then** the live preview fills the available area, the Mode Picker shows four segments (Faces / Text / Barcodes / Off) with "Faces" preselected, the Camera Controls show camera-flip and flash-mode buttons, and the Stats Bar renders with zeroed metrics.
3. **Given** the preview is live and Mode is "Faces", **When** the user points the camera at a face, **Then** within ~1 second one or more bounding-box overlays appear positioned over each face, the Stats Bar `detected` count matches the number of overlays, and `lastAnalysisMs` reports a positive integer.
4. **Given** the preview is live and faces are visible, **When** the user changes Mode to "Off", **Then** all overlays are cleared within one analysis cycle, no further snapshots are taken, and the Stats Bar `detected` count is 0 (FPS / `lastAnalysisMs` may freeze at the last value or reset — see FR-018).
5. **Given** the preview is live, **When** the user navigates away from the screen (unmount), **Then** the snapshot loop is fully torn down, no further `takePictureAsync` calls are issued, and no warnings about unmounted updates appear in the logs.

---

### User Story 2 — Recognize text in the live preview (Priority: P2)

The same developer switches the Mode Picker from "Faces" to "Text", points the camera at a printed page or signage, and sees bounding boxes drawn around each recognized text region. Hovering / inspecting a box exposes the recognized string via the accessibility label (visible to screen readers and to test fixtures); the on-screen UI itself draws only the rectangles — text strings are not rendered as overlay labels in this spec to keep the overlay readable.

**Why this priority**: Demonstrates a second Vision request type (`VNRecognizeTextRequest`) and validates that the bridge is mode-parameterized, not hard-wired to faces. Secondary to Story 1 because it is a strict superset of the same machinery.

**Independent Test**: With the app running on an iOS 13+ device and camera permission granted, switch Mode to "Text" and point the camera at a printed page. Verify that bounding boxes appear around at least one recognized text region within ~1.5 seconds and that the Stats Bar `detected` count matches the number of overlays.

**Acceptance Scenarios**:

1. **Given** the screen is mounted with permission granted, **When** the user selects Mode "Text", **Then** any existing face overlays are cleared, the analysis loop continues at the same cadence, and the next frame is analyzed via `VNRecognizeTextRequest`.
2. **Given** Mode is "Text" and the camera is pointed at printed text, **When** the next analysis cycle completes, **Then** one or more bounding-box overlays appear over each recognized text region; each overlay's accessibility label MUST contain the recognized string.
3. **Given** Mode is "Text" and the camera is pointed at a blank surface, **When** an analysis cycle completes, **Then** zero overlays are rendered and the Stats Bar `detected` count is 0.

---

### User Story 3 — Scan barcodes / QR codes (Priority: P2)

The developer switches Mode to "Barcodes", points the camera at a QR code or 1D barcode, and sees a bounding box appear around each detected symbol. The recognized payload is exposed via the overlay's accessibility label (mirroring Story 2's text behavior); the Stats Bar `detected` count reflects the number of symbols found in the latest frame.

**Why this priority**: Demonstrates the third Vision request type (`VNDetectBarcodesRequest`) and rounds out the "what can Vision do for free?" tour. Secondary because it is the same machinery as Story 2 with a different request class.

**Independent Test**: With the app running on an iOS 13+ device and camera permission granted, switch Mode to "Barcodes" and point the camera at a QR code or product barcode. Verify a bounding-box overlay appears within ~1 second and the overlay's accessibility label contains the decoded payload.

**Acceptance Scenarios**:

1. **Given** the screen is mounted with permission granted, **When** the user selects Mode "Barcodes", **Then** any existing overlays are cleared and subsequent frames are analyzed via `VNDetectBarcodesRequest`.
2. **Given** Mode is "Barcodes" and the camera is pointed at a QR code, **When** the next analysis cycle completes, **Then** one bounding-box overlay appears around the symbol and the overlay's accessibility label contains the decoded payload string.
3. **Given** Mode is "Barcodes" and multiple barcodes are visible, **When** an analysis cycle completes, **Then** an overlay appears for each detected symbol and the Stats Bar `detected` count matches.

---

### User Story 4 — Camera controls: flip and flash (Priority: P2)

The developer taps the camera-flip button to switch from rear to front camera; the preview swaps and analysis continues uninterrupted (same Mode, same cadence). They tap the flash-mode button to cycle through Off → Auto → On (where supported by the active camera). Flash mode is hidden / non-interactive on cameras that do not support flash (e.g., the front camera on most devices).

**Why this priority**: Standard expectations for any camera UI; required to feel like a real module rather than a tech demo. The controls must not interfere with the analysis loop.

**Independent Test**: With Mode set to "Faces" and the rear camera active, tap the camera-flip button — verify the preview switches to the front camera, face overlays continue to appear, and the Stats Bar continues to update. Tap the flash-mode button on the rear camera and verify the icon cycles Off → Auto → On with each tap; verify the flash-mode button is disabled / hidden when the front camera is active and that camera lacks flash hardware.

**Acceptance Scenarios**:

1. **Given** the rear camera is active and Mode is "Faces", **When** the user taps the camera-flip button, **Then** the preview switches to the front camera within one frame, the analysis loop continues at the same cadence, and overlays update against the new feed.
2. **Given** a camera that supports flash is active, **When** the user taps the flash-mode button, **Then** the flash mode cycles Off → Auto → On → Off with each tap and the icon updates accordingly.
3. **Given** a camera that does not support flash is active, **When** the screen renders Camera Controls, **Then** the flash-mode button is hidden or rendered in a non-interactive disabled state with an accessible label "Flash not available on this camera".

---

### User Story 5 — Cross-platform graceful degradation (Priority: P2)

A developer running the showcase on Android opens the Modules grid, taps the "Camera Vision" card, and sees the live preview (Android also supports `expo-camera`) with the Mode Picker rendered but a prominent "Vision is iOS-only" banner across the top. Switching modes does not start any analysis and no overlays are drawn. On web, the developer sees a static "Camera not available in this browser" placeholder where the preview would be, the Mode Picker rendered as inert, and the same iOS-only banner.

**Why this priority**: The module is registered for `['ios','android','web']` to remain visible everywhere as an educational artifact; without this story the registry would either hide the module on non-iOS or crash on it.

**Independent Test**: Run the app on Android (emulator or device) and verify the live camera preview renders, the Mode Picker is rendered but inert, the iOS-only banner is shown, and zero JavaScript exceptions are thrown across the screen lifecycle. Run the app in a desktop web browser and verify the camera placeholder, the inert Mode Picker, and the iOS-only banner — again without exceptions.

**Acceptance Scenarios**:

1. **Given** the app is running on Android, **When** the user opens the Camera Vision module, **Then** the camera preview renders via `expo-camera`, the Mode Picker is rendered as visually disabled, the "Vision is iOS-only" banner is shown, and no analysis loop is started.
2. **Given** the app is running on web, **When** the user opens the Camera Vision module, **Then** a static "Camera not available in this browser" placeholder replaces the preview, the Mode Picker is rendered as inert, and the iOS-only banner is shown.
3. **Given** the app is running on Android or web, **When** any internal code path calls `bridge.isAvailable()`, **Then** it returns `false` synchronously without throwing.
4. **Given** the same context, **When** any other bridge method is invoked (e.g., `analyze`), **Then** it rejects with a `VisionNotSupported` error rather than crashing.

---

### Edge Cases

- **Camera permission denied**: The screen surfaces a non-crashing inline status message ("Camera access is required for this module") and a button to re-request permission via `useCameraPermissions`; no analysis loop is started.
- **Camera permission "limited" / restricted (parental controls)**: Treated identically to denied; the same inline message is shown.
- **Permission granted then revoked while screen is mounted**: The next snapshot attempt fails; the bridge surfaces a typed error, the analysis loop pauses, and the inline status message reappears.
- **Snapshot loop overlap**: If a frame analysis takes longer than the configured interval, the next snapshot is **skipped** rather than queued; only one snapshot+analyze cycle is in flight at a time. The Stats Bar FPS reflects the actual achieved cadence, not the configured target.
- **Vision request throws at runtime**: The bridge catches and surfaces a typed `VisionAnalysisFailed` error; overlays are cleared for that cycle and the Stats Bar reports `detected: 0` and the error count increments. The loop continues with the next cycle.
- **Mode switched mid-analysis**: An in-flight analysis is allowed to complete but its result is **discarded** if the mode changed during execution; overlays are cleared immediately on mode change.
- **Rapid mode switching**: Repeatedly toggling modes does not leak in-flight requests; each cycle's result is discarded if it does not match the current mode at completion time.
- **Camera flip mid-analysis**: An in-flight analysis completes and its result is discarded; the next cycle uses the new camera. The analysis loop is not torn down across a flip.
- **Front camera lacks flash**: The flash-mode button is hidden or disabled (FR-013); cycling has no effect.
- **Very dark scene**: No detections is a valid result; the Stats Bar reports `detected: 0` and no overlays are rendered. No error is surfaced.
- **Screen unmounts mid-analysis**: The in-flight analysis is allowed to complete but its result is discarded (no `setState` on unmounted component); the loop is fully torn down (no further `takePictureAsync` calls); no warnings are logged.
- **Backgrounding the app**: The snapshot loop is paused while the app is in the background and resumed when foregrounded; this is a function of `expo-camera` itself plus the hook's lifecycle (no additional code required, but the behavior is asserted in tests via fake timers).
- **iOS < 13**: The module's manifest declares `minIOS: '13.0'`. The 006 registry filters it from the grid on older iOS; if it is somehow opened, the module shows the iOS-only banner.
- **Coexistence with prior plugins**: The 017 config plugin must add `NSCameraUsageDescription` if not already present (idempotent) and must not modify the targets, entitlements, or App Groups added by features 007 (Live Activities), 014 (Home Widgets), 015 (ScreenTime), or 016 (CoreML Playground).

---

## Requirements *(mandatory)*

### Functional Requirements

#### Module Surface & Registration

- **FR-001**: The system MUST register a "Camera Vision" module entry in `src/modules/registry.ts` with `platforms: ['ios','android','web']` and `minIOS: '13.0'`. This MUST be the only registry edit (a single import + array entry line).
- **FR-002**: The module MUST be discoverable from the 006 Modules grid and tappable to navigate into the showcase screen.
- **FR-003**: The module MUST provide three platform-specific screen entry files: `screen.tsx` (iOS default), `screen.android.tsx`, and `screen.web.tsx`, all under `src/modules/camera-vision/`.

#### On-Screen UI Sections

- **FR-004**: The iOS screen MUST render the following elements: a full-area `CameraPreview` (live `expo-camera` view), an `OverlayCanvas` absolutely positioned on top of the preview holding bounding-box `<View>` rectangles, a `ModePicker` (Faces / Text / Barcodes / Off), `CameraControls` (camera-flip + flash-mode), and a `StatsBar` showing FPS, `lastAnalysisMs`, and `detected` count.
- **FR-005**: The `ModePicker` MUST be a four-segment control with "Faces" selected by default on first mount. Mode "Off" stops the analysis loop without unmounting the preview.
- **FR-006**: The `OverlayCanvas` MUST render exactly one absolutely-positioned `<View>` per detected observation in the latest analysis result, sized and positioned from the observation's normalized bounding box. Rectangle position / size transitions MUST use `react-native-reanimated` for smoothness; reduced-motion preferences MUST short-circuit animations to instantaneous updates.
- **FR-007**: Overlay rectangles for face observations MUST have an accessible label of `Face` (no recognized payload). Text and barcode observations MUST set the accessible label to the recognized string / decoded payload respectively (truncated to a sensible length, e.g., 80 characters).
- **FR-008**: The `StatsBar` MUST display three values: `fps` (computed as a rolling average over the last ~1 second of analysis cycles, displayed to one decimal place), `lastAnalysisMs` (positive integer of the most recent cycle's analysis duration), and `detected` (count of observations in the most recent result).
- **FR-009**: On Android, the screen MUST render the `CameraPreview`, the `ModePicker` (visually disabled), and the "Vision is iOS-only" banner; no overlay canvas, no analysis loop, no Vision bridge calls.
- **FR-010**: On web, the screen MUST render a static "Camera not available in this browser" placeholder in place of the preview, the inert `ModePicker`, and the iOS-only banner; no analysis loop and no bridge calls.

#### Camera Controls & Permissions

- **FR-011**: The module MUST acquire camera permission via `expo-camera`'s `useCameraPermissions` hook. The screen MUST not start the analysis loop until permission is granted.
- **FR-012**: When permission is denied, restricted, or "limited", the screen MUST surface a non-crashing inline message ("Camera access is required for this module") and a button to re-request permission. No preview, no analysis.
- **FR-013**: `CameraControls` MUST expose two buttons: camera-flip (rear ↔ front) and flash-mode cycle (Off → Auto → On → Off). The flash-mode button MUST be hidden or non-interactive on cameras that do not support flash (e.g., the front camera on most devices); its inactive state MUST expose an accessible label "Flash not available on this camera".
- **FR-014**: Flipping the camera MUST NOT tear down the analysis loop; the next snapshot uses the new camera direction.

#### Frame Analyzer Hook

- **FR-015**: The module MUST expose a `useFrameAnalyzer({ mode, intervalMs, cameraRef })` hook from `src/modules/camera-vision/hooks/useFrameAnalyzer.ts`. The hook MUST:
  - Start a snapshot+analyze loop when `mode !== 'off'` and `cameraRef.current` is non-null.
  - Default `intervalMs` to 250 ms; accept overrides for tests.
  - On each tick, call `cameraRef.current.takePictureAsync(...)` then pass the resulting base64 / URI to `bridge.analyze(mode, payload)`.
  - Skip the next tick (do not queue) if a previous cycle is still in flight.
  - Stop and fully tear down the loop on unmount, on `mode === 'off'`, and on camera permission revocation.
  - Discard the result of any in-flight cycle whose mode has changed by completion time.
- **FR-016**: `useFrameAnalyzer` MUST expose `{ fps, lastAnalysisMs, detected, observations, error }` reactive values consumed by `OverlayCanvas` and `StatsBar`.
- **FR-017**: The hook MUST be covered by JS-pure tests using `jest.useFakeTimers()` to assert: start/stop based on mode, configured interval respected, unmount cleans up, mode change clears observations, permission denied path skips analysis entirely, and overlap-skip behavior.
- **FR-018**: When mode transitions to "Off", the hook MUST clear `observations` and `detected` to empty / 0; `fps` and `lastAnalysisMs` MAY retain their last values until the next start (decision documented in `research.md`).

#### Native Bridge Contract

- **FR-019**: The JS bridge `src/native/vision-detector.ts` MUST expose these methods with the listed signatures:
  - `isAvailable(): boolean` — synchronous; returns false on non-iOS or iOS < 13.
  - `analyze(mode: 'faces' | 'text' | 'barcodes', payload: { base64?: string; uri?: string }): Promise<{ observations: Observation[]; analysisMs: number }>`
- **FR-020**: On non-iOS platforms, `isAvailable()` MUST return false; `analyze` MUST reject with a `VisionNotSupported` error. The non-iOS stubs live in `src/native/vision-detector.android.ts` and `src/native/vision-detector.web.ts`.
- **FR-021**: The bridge MUST expose typed errors `VisionNotSupported`, `VisionAnalysisFailed`, and `InvalidInput`; native failures MUST surface as one of these and MUST NOT propagate as uncaught promise rejections.
- **FR-022**: The bridge MUST measure the wall time of the Vision request (in milliseconds) and include it as `analysisMs` in the result.

#### Native Implementation (iOS)

- **FR-023**: One Swift source `VisionDetector.swift` MUST exist under `native/ios/vision/`. It MUST:
  - Expose `analyze(mode:payload:)` to JS via `expo-modules-core`.
  - Dispatch to `VNDetectFaceRectanglesRequest`, `VNRecognizeTextRequest`, or `VNDetectBarcodesRequest` based on `mode`.
  - Construct a `VNImageRequestHandler` from the payload (decode base64 to `CGImage` or load via URI).
  - Convert each request's observations to a JS-friendly shape (`{ kind, boundingBox: { x, y, width, height }, payload?: string }`) using normalized coordinates in `[0, 1]`.
  - Wrap all entry points in `do/catch` and surface typed errors via `expo-modules-core`'s rejection mechanism.

#### Vision Types

- **FR-024**: `src/modules/camera-vision/vision-types.ts` MUST define discriminated-union TypeScript types for observations:
  - `FaceObservation = { kind: 'face'; boundingBox: BoundingBox }`
  - `TextObservation = { kind: 'text'; boundingBox: BoundingBox; text: string }`
  - `BarcodeObservation = { kind: 'barcode'; boundingBox: BoundingBox; payload: string; symbology?: string }`
  - `Observation = FaceObservation | TextObservation | BarcodeObservation`
  - `BoundingBox = { x: number; y: number; width: number; height: number }` with all values in `[0, 1]` normalized to the captured image dimensions.
- **FR-025**: `vision-types.ts` MUST export type-guard helper functions `isFace`, `isText`, `isBarcode`, each covered by unit tests.

#### Config Plugin

- **FR-026**: A config plugin at `plugins/with-vision/` MUST add `NSCameraUsageDescription` to the iOS `Info.plist` if not already present (with a sensible default message such as "Used to demonstrate on-device Vision analysis"). The plugin MUST NOT overwrite an existing value.
- **FR-027**: The plugin MUST link `Vision.framework` to the iOS app target via podspec metadata or equivalent declaration so that the Swift bridge compiles against the framework.
- **FR-028**: The plugin MUST be idempotent — running it multiple times produces the same result.
- **FR-029**: The 017 plugin MUST coexist with the 007, 014, 015, and 016 plugins without modifying their targets, entitlements, or App Groups.
- **FR-030**: The plugin MUST be enabled by adding a single entry to `app.json`'s `plugins` array; no other `app.json` edits are required for this module.

#### Dependencies

- **FR-031**: The module MUST add `expo-camera` as a dependency via `npx expo install expo-camera`. No other new runtime dependencies are introduced.

#### Test Suite (JS-pure, Windows-runnable)

- **FR-032**: The following test files MUST exist and pass under `pnpm check`:
  - `vision-types.test.ts` — type-guard helpers (`isFace`, `isText`, `isBarcode`) for valid and invalid inputs.
  - `hooks/useFrameAnalyzer.test.tsx` — start/stop based on mode, configured `intervalMs` respected (fake timers), unmount cleans up (no further timer ticks), mode change clears observations and discards in-flight results, permission denied path skips analysis entirely, overlap-skip behavior.
  - `components/CameraPreview.test.tsx` — renders the camera surface; passes `ref` through; honors flip / flash props; renders the placeholder on web.
  - `components/OverlayCanvas.test.tsx` — renders one rectangle per observation, positions / sizes from normalized bounding box, accessibility label set per observation kind, no rectangles when observations is empty.
  - `components/ModePicker.test.tsx` — renders four segments, default "Faces", calls `onModeChange` on tap, renders disabled state when `disabled` prop set.
  - `components/StatsBar.test.tsx` — renders `fps`, `lastAnalysisMs`, `detected` from props; empty / zeroed state.
  - `components/CameraControls.test.tsx` — renders flip and flash buttons; flash button hidden / disabled when `flashAvailable={false}`; callbacks invoked on tap.
  - `screen.test.tsx`, `screen.android.test.tsx`, `screen.web.test.tsx` — integration with mocked `vision-detector`: iOS shows preview + analysis loop drives overlays; Android shows preview + iOS-only banner + no bridge calls; web shows placeholder + iOS-only banner + no bridge calls.
  - `native/vision-detector.test.ts` — bridge contract: `isAvailable` returns boolean; non-iOS stubs (`.android.ts`, `.web.ts`) reject with `VisionNotSupported`; `analyze` rejects on `InvalidInput`.
  - `plugins/with-vision/index.test.ts` — adds `NSCameraUsageDescription` when missing; preserves existing value when present; idempotent across repeated invocations; does not modify 007 / 014 / 015 / 016 plugin fixtures.
  - `manifest.test.ts` — manifest valid; `minIOS = '13.0'`; `platforms` includes ios / android / web.

#### Quality Gates

- **FR-033**: `pnpm check` MUST be green (typecheck, lint, tests).
- **FR-034**: Constitution v1.0.1 MUST pass (cross-platform parity via graceful degradation banners; no platform-specific imports leak into shared code).
- **FR-035**: Existing project conventions MUST be followed: `ThemedText` / `ThemedView`, `Spacing` scale, `StyleSheet.create()` only (no inline styles), path aliases (`@/`), TypeScript strict, `.web.ts` / `.android.ts` suffix-based platform splits.
- **FR-036**: The change set MUST be purely additive: only `src/modules/registry.ts` (1-line edit), `app.json` (1 plugin entry), and `package.json` / `pnpm-lock.yaml` (for `expo-camera`) may touch existing files. No edits to features 006–016.

### Non-Functional Requirements

- **NFR-001** (Performance): On a modern iOS device (A14 Bionic or newer), achieved analysis cadence with the default 250 ms interval SHOULD be in the range of 2–6 fps depending on the active Vision request. The live camera preview itself MUST remain visually smooth (no perceptible frame drops in the preview surface) regardless of analysis cadence — analysis runs off the preview's render path.
- **NFR-002** (Responsiveness): Mode switches and camera flips MUST take visible effect within one analysis cycle (≤ ~300 ms at the default interval).
- **NFR-003** (Resource cleanup): Unmounting the screen MUST stop all timers and discard any in-flight analysis result; no Jest warnings about state updates on unmounted components in the test suite.
- **NFR-004** (Accessibility): All controls MUST have accessible labels. Detection overlays MUST expose meaningful accessibility labels (`Face`, recognized text, decoded barcode payload). The "Vision is iOS-only" banner MUST be announced by screen readers on Android / web.
- **NFR-005** (Animation): Overlay rectangles SHOULD use `react-native-reanimated` for position / size transitions; reduced-motion preferences MUST short-circuit animations.
- **NFR-006** (Robustness): No code path in the module may surface an uncaught JS exception or native crash for any combination of platform, permission state, or mode. All bridge errors MUST be typed.
- **NFR-007** (Maintainability): Adding a fourth Vision request type in a follow-up MUST require only (a) extending the `mode` union, (b) adding a request branch in `VisionDetector.swift`, and (c) adding a new observation variant in `vision-types.ts`. No edits to the hook or to existing components.
- **NFR-008** (Repo size): The repository MUST NOT grow by more than ~300 KB as a result of this feature (Swift + JS sources + plugin + tests; no bundled media).

### Key Entities

- **Mode**: `'faces' | 'text' | 'barcodes' | 'off'`. The current analysis mode; `'off'` halts the analysis loop without unmounting the preview.
- **BoundingBox**: `{ x: number; y: number; width: number; height: number }` with values normalized to `[0, 1]` against the captured image dimensions. Origin convention is documented in `vision-types.ts` and matches `expo-camera`'s capture orientation.
- **FaceObservation**: `{ kind: 'face'; boundingBox: BoundingBox }`. Output of `VNDetectFaceRectanglesRequest`. No payload string.
- **TextObservation**: `{ kind: 'text'; boundingBox: BoundingBox; text: string }`. Output of `VNRecognizeTextRequest`.
- **BarcodeObservation**: `{ kind: 'barcode'; boundingBox: BoundingBox; payload: string; symbology?: string }`. Output of `VNDetectBarcodesRequest`.
- **Observation**: discriminated union of the three above; the JS-side payload returned from `bridge.analyze`.
- **AnalysisResult**: `{ observations: Observation[]; analysisMs: number }`. The shape returned by `bridge.analyze`.
- **FrameAnalyzerState**: in-memory hook state holding `fps`, `lastAnalysisMs`, `detected`, `observations`, `error`.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer with the app installed on an iOS 13+ device can open the Camera Vision module, grant camera permission, and see at least one face bounding-box overlay within 5 seconds of pointing the camera at a face — without changing any setting beyond the permission grant.
- **SC-002**: 100% of the JS-pure test suite (vision-types, `useFrameAnalyzer`, all components, all three screen variants, bridge stubs, config plugin, manifest) passes on Windows under `pnpm check`, with no native or device dependencies.
- **SC-003**: The module is purely additive: a `git diff` against `main` for files outside `specs/`, `plugins/with-vision/`, `native/ios/vision/`, `src/modules/camera-vision/`, and `src/native/vision-detector*.ts` shows changes only in `src/modules/registry.ts` (≤ 2 lines), `app.json` (≤ 1 plugin entry), and `package.json` / `pnpm-lock.yaml` (for `expo-camera`).
- **SC-004**: On a modern iOS device (A14+) with default `intervalMs = 250`, the achieved analysis cadence reported by the Stats Bar is at least 2 fps in 95% of consecutive 10-second sampling windows across all three active modes.
- **SC-005**: Running the app on Android shows the live camera preview, the inert Mode Picker, the "Vision is iOS-only" banner, and zero JavaScript exceptions across the full screen lifecycle.
- **SC-006**: Running the app on web shows the "Camera not available in this browser" placeholder, the inert Mode Picker, the iOS-only banner, and zero JavaScript exceptions across the full screen lifecycle.
- **SC-007**: The 017 config plugin runs idempotently: a second `expo prebuild` after the first produces no additional changes to `Info.plist` or to the iOS project file.
- **SC-008**: Enabling the 017 plugin alongside the 007, 014, 015, and 016 plugins (in fixture tests) produces a project where `NSCameraUsageDescription` is added without disturbing any existing extension/widget targets, entitlements, or App Groups added by those plugins.
- **SC-009**: Unmounting the Camera Vision screen stops all `takePictureAsync` calls within one configured `intervalMs` window; no Jest warnings about state updates on unmounted components are produced by the test suite.
- **SC-010**: The total size of files contributed by this feature (Swift + JS sources + tests + plugin) is under 300 KB.

---

## Dependencies

- **Feature 006 (Modules registry)**: This feature consumes the registry contract and adds exactly one entry. No edits to 006 source.
- **`expo-camera`** (new dependency): Installed via `npx expo install expo-camera`. Provides the live preview, the `useCameraPermissions` hook, and `takePictureAsync` used by the snapshot loop. Used directly on iOS; provides the Android preview (without analysis); not used on web (placeholder).
- **`expo-modules-core`** (existing): Used by the Swift bridge for typed errors and JS↔native plumbing.
- **`react-native-reanimated`** (existing): Used by `OverlayCanvas` for smooth bounding-box transitions.
- **Apple `Vision.framework`** (system): Linked into the iOS app target by the 017 plugin; provides `VNDetectFaceRectanglesRequest`, `VNRecognizeTextRequest`, and `VNDetectBarcodesRequest`.
- **Features 007 / 014 / 015 / 016 plugins**: Co-resident on iOS. The 017 plugin must not modify their targets, entitlements, or App Groups.

---

## Assumptions

- **Frame source is `takePictureAsync`** *(repeated for prominence)*: The analysis loop drives Vision via periodic `takePictureAsync` snapshots at a configurable interval (default 250 ms). True per-frame processors are explicitly out of scope (see Reality Check). Achievable cadence is approximately 2–6 fps on modern iOS devices.
- **iOS minimum version**: iOS 13.0 is the assumed minimum. The three Vision request types used (`VNDetectFaceRectangles`, `VNRecognizeText`, `VNDetectBarcodes`) all predate iOS 13 (text recognition shipped in iOS 13 itself), so iOS 13 is a safe floor that includes all three.
- **Bounding-box coordinate convention**: Normalized `[0, 1]` against the captured image dimensions, with origin convention chosen to match `expo-camera`'s capture orientation. Documented in `vision-types.ts`. The overlay code translates from normalized image space to view space.
- **Single in-flight cycle**: The hook enforces at most one snapshot+analyze cycle in flight at a time per screen instance; if a cycle exceeds `intervalMs`, the next tick is skipped (not queued).
- **Mode switch discards in-flight result**: An analysis whose mode changed by completion time is discarded; the next cycle uses the new mode.
- **Camera permission revocation mid-session**: The next snapshot fails; the hook surfaces a typed error and pauses; the screen re-shows the permission affordance.
- **Swift sources are not unit-testable on Windows**: Swift is written, reviewed, and compiled on macOS or via EAS Build. JS-side mocks substitute for the native module in all Windows-runnable tests. On-device verification is a manual quickstart step.
- **No telemetry**: Vision results, timings, and counts are displayed in-process only; nothing is uploaded.
- **Single-line registry edit**: Adding the module to `src/modules/registry.ts` requires only one import statement and one entry in the modules array; this is the only edit to existing files outside `app.json` and `package.json`.
- **No bundled media**: Unlike feature 016, this module ships zero binary assets. All sample inputs are live-captured by the user's camera.

---

## Out of Scope

- True per-frame processors (e.g., `react-native-vision-camera` frame processors). Deferred to a follow-up; the snapshot-loop approach is an explicit, documented choice.
- Vision request types beyond faces, text, and barcodes (no object detection, no horizon detection, no body / hand pose, no animal / pet detection, no saliency, no document segmentation).
- CoreML-backed Vision requests (i.e., `VNCoreMLRequest`). Feature 016 covers CoreML; 017 uses only Vision's built-in detectors.
- Persisting captured frames or detection history to disk.
- Recording video.
- Exporting / sharing detected text or barcode payloads outside the screen (no clipboard, no deep links, no callbacks to host apps).
- Multi-camera simultaneous use (e.g., front + rear at once).
- Adjustable capture resolution, exposure, focus, or white balance controls beyond what `expo-camera` exposes by default.
- Tracking observations across frames (no temporal smoothing, no object IDs); each cycle's observations are independent.
- Drawing recognized text strings on the overlay itself (only bounding boxes are drawn; the text is exposed via accessibility labels).
- Modifications to features 006–016 (other than the single-line registry edit and the single `app.json` plugin entry).
