# Feature Specification: ARKit Basics Module

**Feature Branch**: `034-arkit-basics`
**Feature Number**: 034
**Created**: 2026-04-30
**Status**: Approved (autonomous, no clarifications needed)
**Input**: iOS 11+ educational module showcasing the fundamentals of
ARKit + RealityKit: `ARWorldTrackingConfiguration`, plane detection
(horizontal / vertical), anchor placement via raycast, and rendering
a simple textured cube entity at the tapped point. Adds an "ARKit
Basics" card to the 006 iOS Showcase registry (`id: 'arkit-basics'`,
`platforms: ['ios','android','web']`, `minIOS: '11.0'`). Native
side is a thin Swift Expo Module (`ARKitView` ViewDefinition wrapping
`ARView` from RealityKit, plus `ARKitBridge` imperative module). JS
bridge `src/native/arkit.ts` exposes `placeAnchorAt`, `clearAnchors`,
`pauseSession`, `resumeSession`, `getSessionInfo`, and `isAvailable`.
Android and Web render the educational UI with an `IOSOnlyBanner`
in place of the AR view; no camera or AR runtime is invoked off
iOS. A new config plugin `plugins/with-arkit/` adds
`NSCameraUsageDescription` (coexisting with feature 017's vision
plugin) and appends `arkit` to `UIRequiredDeviceCapabilities`.
Branch parent is `033-share-sheet`. Additive only: registry +1,
`app.json` `plugins` +1.

## Overview

The ARKit Basics module ("ARKit Basics") is a feature card in the
006 iOS Showcase registry (`id: 'arkit-basics'`, label
`"ARKit Basics"`, `platforms: ['ios','android','web']`,
`minIOS: '11.0'`). Tapping the card opens a single screen with
six panels arranged in a fixed top-to-bottom order:

1. **CapabilitiesCard** — read-only summary: whether
   `ARWorldTrackingConfiguration.isSupported` returns true on the
   current device, the chosen frame semantics (people occlusion,
   scene depth) when supported, and a status pill showing the
   current session state: **idle**, **running**, **paused**, or
   **error** (with the last error message when applicable).
2. **AR view** — a full-width AR view (with the screen header
   overlaid) hosting the native `ARKitView` ViewDefinition that
   wraps RealityKit's `ARView`. The view fills the available
   vertical space between CapabilitiesCard and the controls panel.
   Camera permission is requested on first mount via the project's
   existing permission helper; if denied, the view is replaced by
   a permission-prompt placeholder with a "Open Settings" button.
3. **ConfigurationCard** — controls that re-configure the session
   without recreating the screen:
   - **Plane detection** segmented control: `none` / `horizontal`
     / `vertical` / `both`.
   - **People occlusion** switch (visible only when supported by
     the device; otherwise rendered as a disabled row with an
     explanatory caption).
   - **Light estimation** switch.
   - **World map persistence** switch — placeholder for v1; toggle
     is functional but its behaviour is documented as
     "session-scoped only" (no on-disk persistence in v1).
   - **Reset** primary button — removes all anchors and reloads
     the session with the current configuration.
4. **Tap-to-place** — tapping anywhere inside the AR view
   raycasts against detected planes and, on a hit, places a small
   textured cube anchor at the hit point. Each placement appends
   to the in-memory anchor list. A **Clear all** button below the
   view removes all anchors. The anchor count is shown next to
   the button.
5. **AnchorsPanel** — a scrollable list of placed anchors. Each
   row shows the anchor `id` (short form, first 8 chars) and its
   position as `(x, y, z)` rounded to 2 decimal places in metres.
   Rotation is omitted for v1 to keep the row compact.
6. **StatsBar** — a fixed-height row at the bottom of the screen
   showing **FPS** (rolling 1-second average), **tracking state**
   (`normal` / `limited:<reason>` / `notAvailable`), and **session
   duration** (`mm:ss` since session start, paused time excluded).

The module is fully self-contained inside
`src/modules/arkit-lab/`. iOS uses a Swift native module for the
ARKit/RealityKit integration; Android and Web render the same UI
shell with an `IOSOnlyBanner` substituted for the AR view and
with the configuration controls visibly disabled, so the
educational content (panel labels, anchor list shape, stats
shape) is still legible cross-platform.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Launch a world-tracking session and observe capabilities (Priority: P1)

A user opens the ARKit Basics card on a supported iOS device,
grants camera permission, and observes the session move from
**idle** to **running** while the AR view shows the live camera
feed and the StatsBar reports a non-zero FPS and a `normal`
tracking state.

**Why this priority**: Establishing a world-tracking session is
the foundational capability of ARKit; everything else depends on
it. This is the MVP demo flow.

**Independent Test**: With the module screen open on a supported
device, grant camera permission, and verify the status pill
transitions to **running**, the AR view renders the camera feed,
and the StatsBar shows FPS > 0 and tracking state `normal` within
5 seconds of mount.

**Acceptance Scenarios**:

1. **Given** a supported iOS device with camera permission
   granted, **When** the ARKit Basics screen mounts, **Then** the
   CapabilitiesCard reports `worldTrackingSupported: true`, the
   status pill shows **running** within 5 seconds, and the
   StatsBar reports a non-zero FPS.
2. **Given** the user denies camera permission, **When** the
   screen mounts, **Then** the AR view renders a permission
   placeholder with an "Open Settings" affordance, the status
   pill shows **error**, and no native AR session is started.
3. **Given** an iOS device on which
   `ARWorldTrackingConfiguration.isSupported` returns `false`,
   **When** the screen mounts, **Then** the CapabilitiesCard
   shows `worldTrackingSupported: false`, the AR view is replaced
   with an "Unsupported on this device" placeholder, and no
   session start is attempted.

---

### User Story 2 - Detect planes and place an anchored cube on tap (Priority: P1)

A user points the device at a flat surface, waits for plane
detection, taps inside the AR view, and sees a small textured
cube appear anchored to that surface. The anchor count
increments and a new row appears in the AnchorsPanel.

**Why this priority**: Plane detection + raycast-based anchor
placement is the second core ARKit capability and the most
visually demonstrable; it exercises the full bridge round-trip
(`placeAnchorAt` → native raycast → `onAnchorAdded` event → JS
state).

**Independent Test**: With plane detection set to **horizontal**
and a horizontal plane visible in the AR view, tap once inside
the view and verify a cube appears, the anchor count goes from
0 to 1, and the AnchorsPanel shows exactly one row with a
position triple.

**Acceptance Scenarios**:

1. **Given** plane detection is **horizontal** and a horizontal
   plane has been detected, **When** the user taps inside the
   AR view at a point that raycasts onto the plane, **Then**
   the bridge receives `placeAnchorAt({x, y})`, an anchor is
   added with a textured cube entity, the AnchorsPanel gains a
   new row, and the count increments by 1.
2. **Given** plane detection is **none**, **When** the user taps
   inside the AR view, **Then** the raycast misses, no anchor
   is added, and the count is unchanged.
3. **Given** at least one anchor exists, **When** the user taps
   **Clear all**, **Then** all anchors are removed, the
   AnchorsPanel is empty, the count is 0, and the cubes
   disappear from the AR view.

---

### User Story 3 - Reconfigure session at runtime (Priority: P2)

A user changes plane detection (none / horizontal / vertical /
both), toggles people occlusion, toggles light estimation, and
the running session updates without being torn down.

**Why this priority**: Demonstrates that ARKit configurations
can be applied to a running session via `session.run(config,
options:)` and is a frequent real-world requirement.

**Independent Test**: With a running session, change plane
detection from **horizontal** to **vertical** and verify
existing horizontal-plane anchors remain, but new taps now
require a vertical plane to land.

**Acceptance Scenarios**:

1. **Given** a running session with plane detection
   **horizontal**, **When** the user changes plane detection to
   **both**, **Then** the bridge receives the new configuration,
   the session continues running (status pill stays **running**),
   and previously placed anchors are preserved.
2. **Given** the device supports people occlusion, **When** the
   user toggles people occlusion **on**, **Then** the
   ConfigurationCard reflects the new state and the session is
   reconfigured; toggling **off** restores the previous state.
3. **Given** the device does not support people occlusion,
   **When** the screen renders, **Then** the people-occlusion
   row is visibly disabled with an explanatory caption and the
   underlying configuration is not changed.

---

### User Story 4 - Pause, resume, and reset the session (Priority: P2)

A user pauses the session (e.g., to demonstrate the lifecycle),
resumes it, and uses **Reset** to remove all anchors and reload
the session.

**Why this priority**: Lifecycle correctness is required for the
module to coexist with screen navigation (no session leaks) and
to demonstrate the typical `session.pause()` / `session.run()`
pattern.

**Independent Test**: Tap **Pause**, verify status pill shows
**paused** and FPS drops to 0; tap **Resume**, verify status
pill returns to **running**. Tap **Reset**, verify the anchor
list empties and a fresh session start time is reflected in the
duration counter.

**Acceptance Scenarios**:

1. **Given** a running session, **When** the user taps the pause
   control, **Then** the bridge receives `pauseSession()`, the
   status pill shows **paused**, the FPS reads 0 in the StatsBar,
   and the session-duration counter freezes.
2. **Given** a paused session, **When** the user taps resume,
   **Then** the bridge receives `resumeSession()`, status
   returns to **running**, and the duration counter advances
   from the value at pause time (paused interval excluded).
3. **Given** any number of placed anchors, **When** the user
   taps **Reset**, **Then** all anchors are cleared, the session
   is reloaded with the current configuration, and the duration
   counter restarts from zero.

---

### User Story 5 - Cross-platform fallback on Android and Web (Priority: P3)

A user runs the same module on Android or Web. The screen
renders the same panel structure (CapabilitiesCard,
ConfigurationCard, AnchorsPanel, StatsBar) but the AR view is
replaced by an `IOSOnlyBanner` and all interactive AR controls
are visibly disabled.

**Why this priority**: Constitution v1.1.0 requires graceful
non-iOS fallbacks; the module is educational and its UI shape
is itself part of the lesson, so the structure must remain
visible cross-platform.

**Independent Test**: Open the module on Android and on Web,
verify the AR view region is replaced by an `IOSOnlyBanner`,
the configuration controls do not invoke the bridge, and no
unhandled errors appear in the console.

**Acceptance Scenarios**:

1. **Given** the platform is Android, **When** the screen
   renders, **Then** the AR view region shows `IOSOnlyBanner`,
   `placeAnchorAt` / `clearAnchors` / `pauseSession` /
   `resumeSession` / `getSessionInfo` throw
   `ARKitNotSupported` if invoked, and the configuration
   controls are visibly disabled with an explanatory caption.
2. **Given** the platform is Web, **When** the screen renders,
   **Then** the same fallback applies and no camera permission
   prompt is triggered.
3. **Given** any non-iOS platform, **When** `isAvailable()` is
   called, **Then** it returns `false` and never throws.

---

### User Story 6 - Inspect tracking-state degradation in StatsBar (Priority: P3)

A user covers the camera or moves the device too quickly and
observes the tracking state in the StatsBar transition from
`normal` to `limited:<reason>` (e.g.,
`limited:excessiveMotion`, `limited:insufficientFeatures`),
then back to `normal`.

**Why this priority**: Tracking-state introspection is a key
ARKit teaching point; surfacing the reason string helps
developers learn the full enum without reading docs.

**Independent Test**: With a running session, cover the camera
lens for 2 seconds and verify the StatsBar tracking state
changes to `limited:<reason>`; uncover and verify it returns
to `normal` within 2 seconds.

**Acceptance Scenarios**:

1. **Given** a running session in `normal` tracking, **When**
   the underlying `ARSession` reports a `limited` tracking
   state with reason `excessiveMotion`, **Then** the StatsBar
   shows `limited:excessiveMotion` within 1 second.
2. **Given** the session subsequently returns to `normal`,
   **When** the next polling tick fires, **Then** the StatsBar
   shows `normal` again.

### Edge Cases

- Camera permission denied → status pill **error**, AR view
  replaced by permission placeholder, no session started, no
  unhandled rejection.
- `ARWorldTrackingConfiguration.isSupported` returns `false`
  (e.g., simulator, A8 / older devices) → CapabilitiesCard
  reports unsupported, AR view shows "Unsupported on this
  device" placeholder, configuration controls disabled.
- Tap raycast misses (no plane under tap point) → no anchor
  added, no error surfaced; tap is silently ignored.
- People occlusion toggled on a device that does not support
  it → row is disabled at the UI layer; if the toggle state
  somehow reaches the bridge, the bridge ignores the flag and
  logs once.
- Bridge `placeAnchorAt` rejects (e.g., session not running)
  → status pill flips to **error** with the message; user can
  tap **Reset** to recover.
- Screen unmount while session running → the hook calls
  `pauseSession()` (best-effort) and detaches all event
  listeners; no anchor or FPS callbacks fire after unmount.
- Configuration change while session is paused → change is
  recorded in JS state and applied on next `resumeSession()`.
- Anchor list grows large (>100 entries) → AnchorsPanel
  remains scrollable; no virtualization required for v1 (cap
  documented in Out of Scope).
- World-map persistence toggle on → state is reflected in UI
  only; on-disk persistence is not implemented in v1 and the
  caption documents this.
- Non-iOS platform invokes any bridge method → throws typed
  `ARKitNotSupported` error; never crashes the screen.
- Plugin runs alongside feature 017's vision plugin → both
  declare `NSCameraUsageDescription`; the with-arkit plugin
  MUST be idempotent and MUST NOT clobber an existing value
  set by 017 (last-wins semantics with deterministic ordering
  is acceptable provided both strings are non-empty).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST register an **ARKit Basics** card
  in the 006 iOS Showcase registry with `id: 'arkit-basics'`,
  `platforms: ['ios','android','web']`, and `minIOS: '11.0'`.
- **FR-002**: Tapping the registry card MUST navigate to the
  ARKit Basics module screen.
- **FR-003**: The screen MUST render six panels in a fixed
  top-to-bottom order: CapabilitiesCard, AR view (or
  IOSOnlyBanner off iOS), ConfigurationCard, tap-to-place
  controls (count + Clear all), AnchorsPanel, StatsBar.
- **FR-004**: CapabilitiesCard MUST display
  `worldTrackingSupported`, the active frame semantics
  (people occlusion, scene depth, light estimation) where
  supported, and a status pill with values **idle**,
  **running**, **paused**, or **error**.
- **FR-005**: The AR view MUST be implemented as a native
  Expo Module ViewDefinition (`ARKitView`) wrapping
  RealityKit's `ARView`, exposing props `planeDetection`,
  `peopleOcclusion`, `lightEstimation`, and emitting events
  `onSessionStateChange`, `onAnchorAdded`, `onAnchorRemoved`,
  `onError`.
- **FR-006**: ConfigurationCard MUST expose plane detection
  (none / horizontal / vertical / both), people occlusion,
  light estimation, world-map persistence (v1 placeholder),
  and a Reset action.
- **FR-007**: Tapping inside the AR view MUST invoke
  `arkit.placeAnchorAt(x, y)` with the touch coordinates in
  the AR view's local coordinate space; on a successful raycast
  the native side MUST place a textured cube entity at the hit
  point and emit `onAnchorAdded`.
- **FR-008**: `arkit.clearAnchors()` MUST remove all anchors
  added by this session, drop the corresponding cube entities,
  and emit `onAnchorRemoved` for each.
- **FR-009**: `arkit.pauseSession()` MUST pause the underlying
  `ARSession` and freeze the duration counter; `arkit.resumeSession()`
  MUST resume with the current configuration and continue
  the duration from the pause point.
- **FR-010**: `arkit.getSessionInfo()` MUST return a Promise
  resolving to `{ state, anchorCount, fps, duration }` where
  `state` is one of `idle | running | paused | error`,
  `fps` is a rolling 1-second average, and `duration` is the
  cumulative running time in seconds.
- **FR-011**: `arkit.isAvailable()` MUST return `true` only on
  iOS at runtime when `ARWorldTrackingConfiguration.isSupported`
  is true; it MUST return `false` on Android, Web, and on
  unsupported iOS devices.
- **FR-012**: Non-iOS implementations of `placeAnchorAt`,
  `clearAnchors`, `pauseSession`, `resumeSession`, and
  `getSessionInfo` MUST throw a typed `ARKitNotSupported` error.
- **FR-013**: AnchorsPanel MUST render a row per placed anchor
  showing a short id (first 8 chars) and position
  `(x, y, z)` rounded to 2 decimal places in metres; rotation
  is omitted in v1.
- **FR-014**: StatsBar MUST display FPS (1-second rolling
  average), tracking state (`normal` / `limited:<reason>` /
  `notAvailable`), and session duration as `mm:ss`.
- **FR-015**: The hook `useARKitSession` MUST poll
  `getSessionInfo()` at a documented cadence (default 500ms)
  and MUST stop polling on unmount.
- **FR-016**: On unmount, the hook MUST call `pauseSession()`
  best-effort and detach all event listeners; no callback
  MUST fire after unmount.
- **FR-017**: A new config plugin `plugins/with-arkit/` MUST
  add `NSCameraUsageDescription` to `Info.plist` (coexisting
  with feature 017's vision plugin) and append `arkit` to
  `UIRequiredDeviceCapabilities`. The plugin MUST NOT add
  any face-tracking-related strings.
- **FR-018**: The plugin MUST be idempotent: running the
  modifier twice MUST produce a byte-identical
  `Info.plist` outcome; an existing `NSCameraUsageDescription`
  MUST NOT be silently dropped — the plugin's value applies
  only when no upstream value is present.
- **FR-019**: The module MUST NOT modify any existing registry
  entry or any prior feature's plugin; the registry change is
  one new card and the `app.json` change is one new
  `plugins` entry.
- **FR-020**: When camera permission is not granted, the AR
  view region MUST render a permission placeholder with an
  "Open Settings" affordance and the bridge MUST NOT be
  invoked.
- **FR-021**: When `ARWorldTrackingConfiguration.isSupported`
  is `false`, the AR view region MUST render an "Unsupported
  on this device" placeholder, and the bridge MUST NOT start
  a session.
- **FR-022**: All native bridge entry points MUST be mocked
  at the import boundary in tests; no test MUST require a
  live iOS runtime, simulator, or camera.
- **FR-023**: The module MUST run `pnpm format` before its
  final commit and MUST NOT add any `eslint-disable`
  directives.
- **FR-024**: Bridge errors MUST flip the status pill to
  **error** with the error message, MUST NOT crash the
  screen, and MUST NOT surface as unhandled promise
  rejections.
- **FR-025**: Configuration changes while the session is
  paused MUST be queued in JS state and applied on the
  next `resumeSession()`.
- **FR-026**: Off iOS, ConfigurationCard controls MUST be
  visibly disabled with an explanatory caption and MUST NOT
  invoke the bridge when interacted with.

### Key Entities

- **PlaneDetectionMode**: a string enum
  `'none' | 'horizontal' | 'vertical' | 'both'`. Mapped to
  ARKit's `ARWorldTrackingConfiguration.planeDetection` option
  set on the native side.
- **SessionState**: a string enum
  `'idle' | 'running' | 'paused' | 'error'` driving the
  CapabilitiesCard status pill.
- **TrackingState**: a string of shape `'normal'`,
  `'limited:<reason>'`, or `'notAvailable'`, derived from
  `ARCamera.TrackingState`.
- **ARKitConfiguration**: `{ planeDetection: PlaneDetectionMode,
  peopleOcclusion: boolean, lightEstimation: boolean,
  worldMapPersistence: boolean }` — the toggle set passed to
  the native view as props.
- **AnchorRecord**: `{ id: string, x: number, y: number,
  z: number, createdAt: number }` — the JS-side projection of
  a native AR anchor; rotation is intentionally omitted for
  v1.
- **SessionInfo**: `{ state: SessionState, anchorCount: number,
  fps: number, duration: number, trackingState: TrackingState,
  lastError?: string }` — return shape of
  `arkit.getSessionInfo()`.
- **ARKitSession** (hook state): `{ config: ARKitConfiguration,
  anchors: AnchorRecord[], info: SessionInfo }` plus actions
  `placeAnchorAt`, `clearAnchors`, `pause`, `resume`,
  `reset`, and `setConfig`.
- **ARKitNotSupported**: typed error thrown by all bridge
  methods on Android and Web (and on iOS devices where
  `isAvailable()` returns `false`); carries a stable `code`
  field.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a supported iOS device with camera permission
  granted, a user can launch the screen and observe a running
  AR session (status pill **running**, FPS > 0) within 5
  seconds of mount.
- **SC-002**: With plane detection **horizontal** and a flat
  surface visible, a single tap places exactly one cube and
  the AnchorsPanel gains exactly one row in 100% of
  invocations where the raycast hits a plane.
- **SC-003**: **Clear all** removes every anchor and empties
  the AnchorsPanel in 100% of invocations, with no leaked
  cube entity remaining in the AR view.
- **SC-004**: Pausing then resuming the session produces a
  duration counter whose value at resume + delta equals the
  total elapsed running time within ±1 second over a 60-second
  test interval.
- **SC-005**: `pnpm test` for the module's test suite passes
  with 100% pass rate; project-wide `pnpm check` is green
  (lint, types, tests).
- **SC-006**: On Android and Web, no AR-related call produces
  an unhandled promise rejection or visible crash across all
  panel interactions; `IOSOnlyBanner` is shown in place of
  the AR view.
- **SC-007**: The module adds exactly one registry entry, one
  `app.json` `plugins` entry (`with-arkit`), and zero
  modifications to any prior feature's files outside the
  registry index, the module folder, the native folder, and
  `app.json`.
- **SC-008**: Running `expo prebuild` (or the project's
  equivalent plugin-application step) twice produces a
  byte-identical `Info.plist` outcome (idempotency).
- **SC-009**: The plugin coexists with feature 017's vision
  plugin: both modifications apply, the camera-usage string
  is non-empty, and `UIRequiredDeviceCapabilities` contains
  `arkit` exactly once.
- **SC-010**: First-time users complete the full demo flow
  (launch → grant permission → place 3 cubes → reset) in
  under 60 seconds without consulting external docs.
- **SC-011**: After screen unmount, no `getSessionInfo`
  polling tick or anchor event callback fires (verified by
  test asserting zero post-unmount calls).

## Assumptions

- The feature branch `034-arkit-basics` already exists and is
  checked out; branch creation is delegated to the
  `before_specify` git hook and is not part of this
  command's responsibilities.
- Constitution v1.1.0 applies: cross-platform safety,
  additive changes, no breaking edits, full `pnpm check`
  green.
- The Expo Modules API is available in the project (used by
  prior native features) and supports both ViewDefinition
  and imperative Module patterns within a single Swift
  package.
- RealityKit's `ARView` is preferred over a raw `ARSCNView`
  for v1 because it provides a simpler textured-cube
  rendering path; switching to SceneKit is out of scope.
- Camera permission is requested via the project's existing
  permission helper (the same one used by feature 017
  vision); no new permission abstraction is introduced.
- `NSCameraUsageDescription` is shared between feature 017
  and 034; the 034 plugin only sets a default value when no
  prior plugin has set one — it does not overwrite an
  existing string.
- iOS 11.0 minimum is the correct floor (ARKit shipped in
  iOS 11); world-tracking-only features are stable from
  11.0. People occlusion (iOS 13+) is gated by a runtime
  capability check.
- The cube texture is a small bundled PNG (e.g., 64x64) and
  can be embedded in the Swift module's resources; no new
  asset pipeline is required.
- Polling cadence for `getSessionInfo()` defaults to 500ms;
  this can be tuned in planning without changing the
  contract.
- Unit tests run in a JS-only environment (Jest + React
  Native Testing Library) and mock the native bridge at the
  import boundary; no on-device or simulator test rig is
  needed.
- `Platform.OS` checks are sufficient for iOS-vs-non-iOS
  routing; no new platform-detection abstraction is
  introduced.
- `UIRequiredDeviceCapabilities` already exists in the
  project's plist (or is added by an earlier plugin); the
  with-arkit plugin appends `arkit` if absent and is a
  no-op otherwise.
- The world-map persistence toggle is a v1 placeholder; the
  toggle's UI state is preserved across the screen's
  lifetime but on-disk persistence is deferred to a
  follow-up feature.

## Out of Scope

- On-disk world-map persistence (`ARWorldMap` save/load).
- Face tracking, body tracking, image tracking, object
  scanning — explicitly excluded; the `with-arkit` plugin
  MUST NOT add face-tracking strings.
- Custom shaders or advanced RealityKit materials beyond a
  single textured cube entity.
- Multi-user / collaborative AR sessions.
- Recording / exporting AR video.
- Anchor list virtualization — a soft cap of 100 anchors is
  acceptable for v1 (no enforcement; documented).
- Automated UI tests on real iOS devices; coverage is
  JS-pure and mocks the native bridge.
- Replacing or modifying any prior feature's plugin or
  registry entry.
