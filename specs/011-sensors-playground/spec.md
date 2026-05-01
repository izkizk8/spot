# Feature Specification: Sensors Playground

**Feature Branch**: `011-sensors-playground`  
**Created**: 2026-05-21  
**Status**: Draft  
**Input**: User description: "A new module added to the iOS Feature Showcase app's plugin registry that visualizes live device sensor data — accelerometer, gyroscope, magnetometer, and device motion (combined orientation). The point: show off how iOS exposes rich motion data and let the user 'feel' their phone moving on screen."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Feel the accelerometer move on screen (Priority: P1)

A user opens the Spot iOS Feature Showcase on an iPhone, sees a "Sensors
Playground" card on the Modules home grid, taps it, and lands on a screen
with four stacked sensor cards. The Accelerometer card is at the top. They
tap its Start button and immediately see three live numeric readouts (x,
y, z) update many times per second, plus a small live bar chart that
animates with each axis's last ~30 samples as they tilt the phone. Tapping
Stop freezes the readouts and chart.

**Why this priority**: This is the smallest end-to-end slice that proves
the module's value — registry entry, screen scaffold, sensor subscription
plumbing, ring buffer, and the simple animated bar chart. Without it, no
other card has anything to render. It is also the slice that most directly
delivers the "feel your phone move on screen" promise of the module.

**Independent Test**: Install a dev build on an iPhone, open the Modules
grid, tap the "Sensors Playground" card, tap the Accelerometer card's
Start button, physically tilt the phone, and verify the x/y/z readouts
update many times per second and the bar chart animates a sliding window
of recent samples. Tap Stop and verify the readouts and chart freeze.

**Acceptance Scenarios**:

1. **Given** the user is on the Modules home grid on iOS, **When** they
   look at the list of available modules, **Then** a "Sensors Playground"
   card is visible and tappable.
2. **Given** the user has tapped the Sensors Playground card, **When**
   the screen first renders, **Then** four cards are visible stacked
   vertically in the order Accelerometer, Gyroscope, Magnetometer,
   Device Motion, and all four are in the Stopped state with their
   readouts showing zero or em-dashes.
3. **Given** the Accelerometer card is in the Stopped state, **When** the
   user taps its Start button, **Then** the card transitions to the
   Started state, the Start button label/visual changes to Stop, and the
   x/y/z numeric readouts begin updating at the card's currently selected
   sample rate.
4. **Given** the Accelerometer card is in the Started state, **When** the
   user tilts the device, **Then** the bar chart's three rows animate to
   reflect the most recent ~30 samples per axis as a sliding window.
5. **Given** the Accelerometer card is in the Started state, **When** the
   user taps Stop, **Then** updates cease, the readouts and chart freeze
   on their last value, and the button visual returns to Start.

---

### User Story 2 - Visualize gyroscope, magnetometer, and device motion (Priority: P1)

After Story 1, the user taps Start on each of the remaining three cards
in turn. The Gyroscope card shows three live x/y/z readouts plus a small
glyph (an SF Symbol on iOS 17+, or a fallback glyph on older iOS,
Android, and Web) that visually rotates according to integrated yaw. The
Magnetometer card shows three live readouts plus a compass needle that
points to magnetic north (computed from x and y). The Device Motion card
shows pitch / roll / yaw readouts plus a "spirit level" — a small inner
disc that moves within an outer circle to show device tilt based on
pitch and roll. Each card's visualization updates in real time while
its sensor is started.

**Why this priority**: These three cards are co-equal with the
Accelerometer in delivering the module's promise. They share the same
card scaffold, ring-buffer pattern, and Start/Stop + sample-rate
controls established in Story 1, so they can be implemented as parallel
slices on top of the same foundation. Without them, the module is a
single-sensor demo rather than a sensors playground.

**Independent Test**: After Story 1 is shipped, on an iPhone, tap Start
on the Gyroscope card and rotate the phone — verify the rotation
indicator visibly rotates. Tap Start on the Magnetometer card and rotate
the phone in the horizontal plane — verify the compass needle continues
to point in a stable absolute direction. Tap Start on the Device Motion
card and tilt the phone — verify the spirit level disc moves within its
outer circle in the direction of tilt.

**Acceptance Scenarios**:

1. **Given** the Gyroscope card is in the Started state, **When** the
   user rotates the device about its vertical axis, **Then** the rotation
   indicator glyph rotates visibly in proportion to integrated yaw, and
   the x/y/z readouts update.
2. **Given** the Magnetometer card is in the Started state and on a
   device whose magnetometer is available, **When** the user rotates the
   phone in the horizontal plane, **Then** the compass needle continues
   to point in a stable absolute direction (i.e. it counter-rotates
   relative to the device frame), and the x/y/z readouts update.
3. **Given** the Device Motion card is in the Started state, **When** the
   user tilts the device forward, backward, left, or right, **Then** the
   inner spirit-level disc moves toward the corresponding edge of the
   outer circle and the pitch/roll/yaw readouts update.
4. **Given** any of the four cards is in the Started state, **When** the
   user taps Stop on that card, **Then** that card stops updating without
   affecting the started/stopped state of any other card.

---

### User Story 3 - Choose sample rate and use Start All / Stop All (Priority: P2)

The user wants to drive the sensors harder, or stop them all at once to
save battery. Each card has a 3-segment "Sample rate" control with
options 30 / 60 / 120 Hz, defaulting to 60 Hz. Changing it while the
sensor is running takes effect immediately by changing the underlying
update interval. A Start All / Stop All button in the screen header
starts (or stops) every card at once using each card's currently
selected sample rate.

**Why this priority**: Sample-rate switching is the differentiating
"playground" affordance — it lets a user feel the difference between 30
and 120 Hz updates. Start All / Stop All is a small but meaningful UX
nicety for demoing the screen. Both depend on Stories 1 and 2 being in
place.

**Independent Test**: After Stories 1 and 2 are shipped, open the
Sensors Playground screen, tap Start All in the header, and verify all
four cards transition to the Started state and begin updating
simultaneously. On any started card, change the Sample rate from 60 Hz
to 120 Hz and verify the readouts and visualization visibly update
faster; switch to 30 Hz and verify they slow down. Tap Stop All and
verify all four cards transition to Stopped at once.

**Acceptance Scenarios**:

1. **Given** the screen has just rendered, **When** the user inspects
   each card, **Then** each card's Sample rate segmented control is
   present, shows three options (30 / 60 / 120 Hz), and is set to 60 Hz
   by default.
2. **Given** a card is in the Started state, **When** the user changes
   its Sample rate to a different value, **Then** the underlying sensor
   update interval changes immediately (without requiring a Stop+Start
   toggle) and the visualization's update cadence visibly changes.
3. **Given** at least one card is in the Stopped state, **When** the
   user taps the header Start All button, **Then** every available card
   transitions to the Started state, each at its own currently selected
   sample rate.
4. **Given** at least one card is in the Started state, **When** the
   user taps the header Stop All button, **Then** every card transitions
   to the Stopped state.
5. **Given** a card is unavailable on the current platform (per Story
   4), **When** Start All is tapped, **Then** that card MUST remain in
   its disabled state and MUST NOT raise an error.

---

### User Story 4 - Cross-platform availability and permissions (Priority: P2)

A user opens the Sensors Playground on the web. The screen still loads
and all four cards still render their titles, readouts row, sample-rate
control, and Start button. For each sensor that the browser does not
expose (commonly some or all of magnetometer / device motion in
desktop browsers), that card shows an inline "Not supported in this
browser" notice and its controls are disabled, while the supported
cards remain fully interactive. Separately, on iOS, if the magnetometer
requires a permission that the user has denied, that card shows an
inline notice with an "Open Settings" link that deep-links to the
system settings.

**Why this priority**: Cross-platform parity with platform-aware
fallbacks is required by Constitution Principle I. Permission denial is
a realistic state on iOS for the magnetometer in particular and must
not crash the screen or leave the user stranded.

**Independent Test**: Run the screen in a desktop web browser and
verify each card renders; for any sensor the browser does not expose,
verify a "Not supported in this browser" notice appears and the card's
Start button is disabled while the rest of the cards remain interactive.
On an iPhone, deny the magnetometer permission when prompted (or
revoke it in Settings), reopen the screen, and verify the Magnetometer
card shows a "Permission denied" inline notice with an "Open Settings"
link that, when tapped, opens the system Settings app for Spot.

**Acceptance Scenarios**:

1. **Given** the user is on Web in a browser that does not expose a
   given sensor, **When** the screen renders, **Then** that sensor's
   card MUST display a "Not supported in this browser" inline notice
   and its Start button MUST be disabled.
2. **Given** the user is on Web, **When** the screen renders, **Then**
   the title, readouts row, and sample-rate control of every card MUST
   still render (even for unsupported sensors), and supported cards
   MUST remain fully interactive.
3. **Given** the user is on iOS and a sensor (e.g. magnetometer)
   requires a runtime permission that has not yet been granted, **When**
   the user taps Start on that card, **Then** the system MUST request
   the permission and proceed normally if granted.
4. **Given** the user is on iOS and a sensor's required permission has
   been denied, **When** the screen renders, **Then** that card MUST
   display an inline notice indicating the permission is denied and an
   "Open Settings" link that opens the system Settings app for Spot.
5. **Given** any sensor is unavailable or denied on any platform,
   **When** Start All is tapped, **Then** the screen MUST NOT raise an
   error and MUST start only the cards whose sensors are available and
   permitted.

---

### Edge Cases

- **Rapid Start/Stop tapping**: Tapping a card's Start/Stop button
  rapidly MUST be safe; the system MUST NOT leak subscriptions, spawn
  duplicate listeners, or crash. The most recent tap's intent (Started
  vs. Stopped) MUST win.
- **Navigating away with sensors running**: When the user leaves the
  Sensors Playground screen, every active sensor subscription MUST be
  torn down before the next frame; no sensor callbacks MUST continue
  firing after unmount.
- **App backgrounded while running**: When the app is backgrounded with
  one or more cards started, sensor updates MAY pause for the platform's
  default reasons; on returning to foreground, the previously started
  cards MUST automatically resume without the user needing to tap Stop
  then Start. (If automatic resume is not feasible on a given platform,
  the cards MUST visibly reflect their Stopped state on return.)
- **Sample-rate change while stopped**: Changing the Sample rate on a
  Stopped card MUST update the value the next Start will use; it MUST
  NOT implicitly start the sensor.
- **Ring-buffer overflow**: The per-axis sample buffer MUST be a fixed
  ring buffer of capacity 60; appending the 61st sample MUST evict the
  oldest sample, and total memory MUST remain bounded regardless of how
  long the card runs.
- **Magnetometer near zero magnitude**: If the magnetometer's x/y
  magnitude is effectively zero (e.g. inside an MRI or a strong shielded
  enclosure), the compass needle MUST NOT jitter wildly; it MUST hold
  its previous direction or render in a neutral "no signal" pose.
- **Gyroscope drift over time**: Integrated yaw used by the rotation
  indicator MAY drift over long sessions; this is acceptable and MUST
  NOT be corrected via fusion in v1.
- **Permission revoked mid-session**: If the OS revokes a permission
  while a card is running, the card MUST stop cleanly and switch to the
  "Permission denied + Open Settings" inline notice without crashing.
- **Web with no Permissions/Sensor APIs**: On browsers that throw on
  feature detection probes themselves, detection MUST be wrapped so the
  screen renders the "Not supported in this browser" notice rather than
  crashing.

## Requirements *(mandatory)*

### Functional Requirements

#### Module registration

- **FR-001**: System MUST register a "Sensors Playground" module in the
  plugin registry introduced by feature 006, with id
  `sensors-playground` and declaring supported platforms
  `['ios', 'android', 'web']`.
- **FR-002**: The Modules home grid MUST display the Sensors Playground
  card alongside other registered modules using the same card visual
  treatment.
- **FR-003**: Tapping the Sensors Playground card MUST navigate to the
  Sensors Playground screen via the registry's standard navigation flow.
- **FR-004**: The module MUST NOT introduce a parallel platform-gating
  mechanism; per-sensor availability is handled at the card level (see
  FR-030..FR-035), not the registry level.

#### Screen layout

- **FR-005**: The screen MUST present a header containing a title and a
  single header action button that toggles between "Start All" and
  "Stop All" labels based on whether any card is currently running.
- **FR-006**: The screen MUST present exactly four sensor cards stacked
  vertically in this fixed order: Accelerometer, Gyroscope,
  Magnetometer, Device Motion.
- **FR-007**: Each card MUST contain, in this order: a title, a
  readouts row, a visualization region, a Sample rate segmented
  control, and a Start/Stop button.

#### Per-card controls

- **FR-008**: Each card MUST present a Start/Stop button that toggles
  the card's subscription state. The button visual MUST clearly
  indicate the current state (Started vs. Stopped).
- **FR-009**: Each card MUST present a Sample rate segmented control
  with exactly three options: 30 Hz, 60 Hz, 120 Hz.
- **FR-010**: Each card's Sample rate MUST default to 60 Hz on first
  render.
- **FR-011**: Changing the Sample rate while the card is in the Started
  state MUST update the underlying sensor update interval immediately
  (mapped to the corresponding interval in milliseconds, rounded as
  needed) without requiring the user to Stop and Start the card.
- **FR-012**: Changing the Sample rate while the card is in the Stopped
  state MUST update only the value used by the next Start; it MUST NOT
  implicitly start the sensor.

#### Header Start All / Stop All

- **FR-013**: The header action button MUST read "Start All" when no
  card is currently in the Started state, and "Stop All" otherwise.
- **FR-014**: Tapping "Start All" MUST start every card whose sensor is
  available and permitted on the current platform, each at its own
  currently selected sample rate; cards whose sensors are unavailable
  or whose permissions are denied MUST be skipped silently.
- **FR-015**: Tapping "Stop All" MUST stop every card currently in the
  Started state.

#### Accelerometer card

- **FR-016**: The Accelerometer card MUST display three live numeric
  readouts labeled x, y, and z, formatted to a fixed number of decimal
  places consistent across all four cards.
- **FR-017**: While Started, the Accelerometer card MUST render a small
  live bar chart with three rows (one per axis), where each row's bars
  represent the last 30 samples of that axis in chronological order
  (oldest at one end, newest at the other), using only animated `<View>`
  width to express bar magnitude (no chart library dependency).

#### Gyroscope card

- **FR-018**: The Gyroscope card MUST display three live numeric
  readouts labeled x, y, and z.
- **FR-019**: While Started, the Gyroscope card MUST render a small
  rotation indicator (an SF Symbol on iOS 17+ where available, or a
  fallback glyph elsewhere) whose visual rotation is driven by yaw
  integrated from the gyroscope's z-axis samples since Start was
  tapped.
- **FR-020**: Tapping Stop on the Gyroscope card MUST freeze the
  rotation indicator at its current angle; tapping Start again MUST
  resume integration from that frozen angle (i.e. integration state
  persists for the lifetime of the card).

#### Magnetometer card

- **FR-021**: The Magnetometer card MUST display three live numeric
  readouts labeled x, y, and z.
- **FR-022**: While Started, the Magnetometer card MUST render a
  compass needle whose direction is derived from the magnetometer's x
  and y components and points toward magnetic north relative to the
  device frame; the needle MUST update smoothly as the device rotates.
- **FR-023**: The Magnetometer card MUST NOT attempt to compute true
  north (no location pairing); magnetic-north only.

#### Device Motion card

- **FR-024**: The Device Motion card MUST display three live numeric
  readouts labeled pitch, roll, and yaw, in radians or degrees
  consistent across all readouts on this card.
- **FR-025**: While Started, the Device Motion card MUST render a
  "spirit level" visualization consisting of an outer circle containing
  an inner disc; the inner disc's offset within the outer circle MUST
  be driven by pitch (vertical axis offset) and roll (horizontal axis
  offset), saturating at the outer circle's edge.

#### Ring buffers and memory

- **FR-026**: Each axis of each sensor card MUST store at most 60
  samples in a ring buffer. The 61st sample MUST evict the oldest.
- **FR-027**: The Accelerometer bar chart MUST visualize a sliding
  window of the most recent 30 samples per axis (a subset of the 60
  retained), so the chart shows a sliding window in time.
- **FR-028**: Total memory used by retained samples per card MUST be
  bounded and MUST NOT grow with run time.

#### Permissions and platform detection

- **FR-029**: For each card, the system MUST detect at mount time
  whether the underlying sensor is available on the current platform.
- **FR-030**: If a sensor is not available on the current platform
  (most commonly applicable on Web), that card MUST display an inline
  "Not supported in this browser" notice (or platform-equivalent
  wording on non-web platforms), and its Start button and Sample rate
  control MUST be disabled while the rest of the screen continues to
  function.
- **FR-031**: For each card whose underlying sensor requires a runtime
  permission (notably the magnetometer on iOS), the system MUST request
  that permission on the first Start tap if not already granted.
- **FR-032**: If a required permission is denied, the affected card
  MUST display an inline notice indicating the permission is denied,
  along with an "Open Settings" link that opens the system Settings app
  for the host application via the platform's standard
  open-settings affordance.
- **FR-033**: If a required permission is revoked while the card is
  Started, the card MUST stop cleanly (no crash, no leaked subscription)
  and switch to the denied-permission inline notice.
- **FR-034**: Sensors that do not require an explicit permission on iOS
  (accelerometer, gyroscope) MUST NOT trigger any permission prompt.
- **FR-035**: All availability and permission detection MUST be wrapped
  defensively so that browsers or platforms that throw on detection
  probes do not crash the screen; the affected card MUST simply render
  the "Not supported" notice.

#### Lifecycle

- **FR-036**: Every active sensor subscription MUST be torn down on
  screen unmount; no sensor callbacks MUST continue firing after the
  user navigates away from the Sensors Playground screen.
- **FR-037**: When the app is backgrounded with one or more cards in
  the Started state, sensor callbacks MAY be paused per platform
  default; on returning to foreground, the previously Started cards
  MUST either automatically resume or visibly reflect their Stopped
  state — they MUST NOT be left in an inconsistent "Started but not
  receiving data" state.

#### Architecture & quality

- **FR-038**: The module's source MUST live under
  `src/modules/sensors-playground/` with the following structure:
  `index.tsx` (manifest), `screen.tsx`, `catalog.ts`, and a
  `components/` directory containing at least `SensorCard`,
  `AccelerometerCard`, `GyroscopeCard`, `MagnetometerCard`,
  `DeviceMotionCard`, `SampleRateControl`, `BarChart`,
  `RotationIndicator`, `CompassNeedle`, `SpiritLevel`, and
  `PermissionNotice`.
- **FR-039**: The module MUST be registered with the registry via a
  single import line added to `src/modules/registry.ts` and MUST NOT
  modify any other file outside `src/modules/sensors-playground/`.
- **FR-040**: All sensor subscriptions MUST go through a thin
  per-sensor seam (e.g. one hook per sensor — `useAccelerometer`,
  `useGyroscope`, `useMagnetometer`, `useDeviceMotion`) wrapping
  `expo-sensors` so that tests can mock the seam rather than the
  underlying library.
- **FR-041**: All component state MUST be local component state; no
  new global stores, contexts, or persistence layers MUST be
  introduced.
- **FR-042**: All styles MUST use `StyleSheet.create()` and the
  centralized theme tokens (`Spacing`, theme colors via the project's
  themed primitives, `ThemedText` / `ThemedView`); no hardcoded colors
  and no inline style objects outside StyleSheet.
- **FR-043**: TypeScript strict mode and the existing path aliases
  MUST be honoured; no relaxations or new lint/test tooling MUST be
  introduced.
- **FR-044**: All quality gates (`pnpm check`: format, lint, typecheck,
  test) MUST pass before the feature is considered complete.
- **FR-045**: Tests MUST cover, at minimum: `catalog.test.ts`,
  `manifest.test.ts`, `screen.test.tsx`, one card test per sensor
  (`AccelerometerCard.test.tsx`, `GyroscopeCard.test.tsx`,
  `MagnetometerCard.test.tsx`, `DeviceMotionCard.test.tsx`) each
  mocking the corresponding sensor seam, `SampleRateControl.test.tsx`,
  `BarChart.test.tsx` (ring-buffer + sliding-window behavior), and
  `PermissionNotice.test.tsx` (denied-state rendering and Open
  Settings affordance), in line with constitutional Principle V
  (Test-First).

### Key Entities

- **SensorKind**: One of `accelerometer`, `gyroscope`, `magnetometer`,
  `deviceMotion`. Drives card identity, sensor seam selection, and
  permission requirements.
- **SampleRate**: One of 30, 60, 120 (Hz). Maps deterministically to
  an update interval in milliseconds passed to the sensor's
  `setUpdateInterval`.
- **SensorSample**: A single reading.
  - For accelerometer / gyroscope / magnetometer: `{ x, y, z, timestamp }`.
  - For device motion: `{ pitch, roll, yaw, timestamp }`.
- **RingBuffer**: Fixed-capacity (60) per-axis buffer; appending past
  capacity evicts the oldest sample. Exposes the most recent N samples
  in chronological order for visualization.
- **CardState**: Per-card transient state: `running` (bool), `rate`
  (SampleRate), `availability` (`available` | `unsupported` |
  `permissionDenied`), and per-card derived state (e.g. integrated yaw
  for the Gyroscope card).
- **PermissionStatus**: One of `granted`, `denied`, `notRequested`,
  `notRequired`. Drives whether a Start tap triggers a permission
  prompt and whether the denied-permission notice is shown.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user lands on the Modules home grid on iOS, opens the
  Sensors Playground, taps the Accelerometer card's Start, and sees
  live x/y/z readouts updating in under 5 seconds without consulting
  docs.
- **SC-002**: Each Started card produces visible UI updates at a rate
  consistent with its selected sample rate (30 / 60 / 120 Hz), within
  the platform's display refresh limits, with no dropped or duplicated
  axes.
- **SC-003**: 100% of the four sensor cards (Accelerometer, Gyroscope,
  Magnetometer, Device Motion) render their title, readouts row,
  sample-rate control, and Start/Stop button on all three platforms
  (iOS, Android, Web), regardless of underlying sensor availability.
- **SC-004**: 100% of the four sensor cards' visualizations
  (bar chart, rotation indicator, compass needle, spirit level)
  render correctly and animate when their sensor is available and
  Started.
- **SC-005**: Per-axis sample storage stays at or below 60 entries
  indefinitely while a card is Started; total retained-sample memory
  per card does not grow with run time.
- **SC-006**: Switching a card's Sample rate while Started changes the
  underlying update interval in under 100 ms, with no Stop+Start cycle
  required.
- **SC-007**: Tapping Stop or navigating away from the screen
  terminates 100% of in-flight sensor subscriptions before the next
  frame; zero sensor callbacks fire after unmount.
- **SC-008**: On Web, opening the Sensors Playground produces zero
  runtime errors related to missing browser sensor APIs; cards for
  unsupported sensors show the "Not supported in this browser" notice
  with their Start and sample-rate controls disabled, and supported
  cards remain fully interactive.
- **SC-009**: On iOS, denying the magnetometer permission (or any
  other sensor's required permission) produces an inline denied
  notice with a working "Open Settings" link and zero crashes.
- **SC-010**: The change is purely additive at the registry level:
  exactly one line is added to `src/modules/registry.ts` and no other
  file outside `src/modules/sensors-playground/` is modified by this
  feature.
- **SC-011**: All quality gates (`pnpm check`) pass on the feature
  branch with no warnings introduced by this module.

## Out of Scope

The following are explicitly **not** part of this feature and will be
deferred to a future spec if pursued:

- Barometer, Pedometer, Altitude, or any other sensor not in the
  four-card list (Accelerometer, Gyroscope, Magnetometer, Device
  Motion).
- Recording sensor data to a file, exporting it, or sharing it.
- Any chart library dependency or d3-style charting; the bar chart
  MUST be implemented with simple animated `<View>` width only.
- Pairing magnetometer readings with location data to compute true
  north; magnetic-north only.
- Sensor fusion to correct gyroscope drift; integrated yaw is allowed
  to drift over long sessions.
- Per-user persistence of started/stopped state, sample rate, or any
  other card setting across screen unmounts or app restarts.
- Background sensor sampling while the app is not in the foreground.
- A "shake to do X" or other gesture-recognition layer on top of the
  raw readouts.

## Assumptions

- The plugin registry from feature 006 is in place and supports
  modules declaring `platforms: ['ios', 'android', 'web']` without any
  additional iOS-version gating, so this module does not need to set a
  `minIOS` value.
- `expo-sensors` is already a project dependency (per the feature
  description) and exposes `Accelerometer`, `Gyroscope`,
  `Magnetometer`, and `DeviceMotion` modules with `addListener`,
  `removeAllListeners`, `setUpdateInterval`, and per-platform
  availability / permission helpers.
- React Native's `Linking.openSettings()` is available and reliably
  opens the host app's settings entry on iOS; this is the standard
  affordance behind the "Open Settings" link.
- 60 samples per axis per card is sufficient for both the 30-sample
  bar chart sliding window and any near-term visualization needs;
  expanding the ring buffer is out of scope.
- The 30 / 60 / 120 Hz sample-rate options are mapped to update
  intervals as `1000 / Hz` milliseconds; platforms that cannot honour
  120 Hz MAY clamp to their supported maximum without the UI changing,
  per platform-aware fallback.
- The static plain-text or fallback-glyph rendering for the gyroscope
  rotation indicator on platforms without SF Symbols is acceptable as
  a "showcase" — there is no requirement to ship a Material Symbols
  parity layer in v1.
- The constitution at `.specify/memory/constitution.md` v1.0.1 applies
  uniformly; this feature does not request any constitutional
  exemption.

## Notes

- [NEEDS CLARIFICATION: numeric readout units & precision] The spec
  fixes that all four cards render with consistent decimal precision,
  but does not pin a specific decimal place count or choose between
  radians vs. degrees for Device Motion. Recommended default during
  planning: 3 decimal places everywhere, radians for Device Motion to
  match `expo-sensors` native units. Resolve in `/speckit.clarify` or
  `/speckit.plan`.
