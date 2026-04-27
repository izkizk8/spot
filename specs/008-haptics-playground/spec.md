# Feature Specification: Haptics Playground

**Feature Branch**: `008-haptics-playground`  
**Created**: 2026-04-27  
**Status**: Draft  
**Input**: User description: "Interactive Haptics Playground module added to the iOS Feature Showcase plugin registry (spec 006). Users can trigger and compose haptic feedback patterns and feel them on device."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Trigger built-in haptic feedback (Priority: P1)

A user opens the Spot iOS Feature Showcase, sees a "Haptics Playground" card on
the Modules home grid, taps it, and lands on a screen where they can press
labeled buttons (Success / Warning / Error notification haptics; Light / Medium
/ Heavy / Soft / Rigid impact haptics; Selection) and immediately feel the
corresponding haptic on their device while also seeing a small visual pulse
animate next to the button.

**Why this priority**: This is the core demonstration value — without it the
module shows nothing useful. It is also the simplest slice (no persistence, no
sequencing) and proves that the haptics integration works end-to-end across
the registry, navigation, and the haptic driver.

**Independent Test**: Install a dev build on an iPhone, open the Modules grid,
tap the Haptics Playground card, then tap each of the nine haptic buttons.
Verify a physical haptic fires for each press and a visual pulse animates.
The MVP is shippable on this slice alone.

**Acceptance Scenarios**:

1. **Given** the user is on the Modules home grid, **When** they look at the
   list of available modules, **Then** a "Haptics Playground" card is visible
   and tappable.
2. **Given** the user is on the Haptics Playground screen on an iOS device,
   **When** they tap the "Success" notification button, **Then** a success
   notification haptic fires within 100 ms and a visual pulse animates on the
   button.
3. **Given** the user is on the Haptics Playground screen on an iOS device,
   **When** they tap any of the five impact buttons (Light, Medium, Heavy,
   Soft, Rigid), **Then** the corresponding impact haptic fires and the
   button shows a visual pulse.
4. **Given** the user is on the Haptics Playground screen on an iOS device,
   **When** they tap the "Selection" button, **Then** a selection haptic
   fires and the button shows a visual pulse.

---

### User Story 2 - Compose and play a haptic sequence (Priority: P2)

A user wants to feel a short composed pattern (e.g. three light taps followed
by a success notification). On the Pattern Composer section of the screen,
they fill up to 8 sequencer cells by tapping each cell to cycle through
options (off → Light → Medium → Heavy → Soft → Rigid → Success → Warning →
Error → off). They press Play and the device fires each non-empty cell in
order with ~120 ms spacing while the corresponding cell pulses visually.

**Why this priority**: Composition turns the module from a button board into
an actual playground and is the differentiator vs. a trivial demo. It depends
on Story 1 (the driver and the visual pulse) being in place.

**Independent Test**: After Story 1 is shipped, open the playground screen,
tap several cells to assign haptic types, press Play, and verify each
assigned cell fires its haptic in order with visible pulses and audible/felt
spacing roughly 120 ms apart.

**Acceptance Scenarios**:

1. **Given** an empty composer with 8 cells, **When** the user taps cell 1
   once, **Then** cell 1 advances from "off" to the next option in the cycle
   and displays its label/icon.
2. **Given** the composer has at least one non-empty cell, **When** the user
   presses Play, **Then** every non-empty cell triggers its assigned haptic
   in left-to-right order with ~120 ms between fires, and each firing cell
   pulses visually as it fires.
3. **Given** an entirely empty composer, **When** the user presses Play,
   **Then** nothing fires and the Play button briefly shows a disabled or
   no-op state (no error dialog).
4. **Given** a sequence is currently playing, **When** the user presses Play
   again or navigates away, **Then** the sequence stops cleanly without
   leaving timers or queued haptics behind.

---

### User Story 3 - Save and replay presets (Priority: P3)

A user composes a pattern they like and taps "Save preset". The pattern is
persisted locally with an auto-generated name (e.g. "Preset 1",
"Preset 2", …) and appears in a Presets list below the composer. Tapping a
preset row replays the saved pattern. Presets survive app restarts.

**Why this priority**: Persistence elevates the playground from a toy into
something a user can return to. It depends on Story 2.

**Independent Test**: After Story 2 is shipped, compose a pattern, save it,
fully kill and relaunch the app, return to the Haptics Playground, and tap
the saved preset row. Verify the pattern replays identically.

**Acceptance Scenarios**:

1. **Given** the composer has at least one non-empty cell, **When** the user
   taps "Save preset", **Then** a new preset entry appears in the Presets
   list with an auto-generated name and the saved pattern.
2. **Given** at least one preset exists, **When** the user taps a preset row,
   **Then** the saved pattern is replayed using the same playback rules as
   Story 2.
3. **Given** at least one preset exists, **When** the user kills and
   relaunches the app, **Then** the preset list still contains the same
   entries.
4. **Given** the composer is entirely empty, **When** the user taps "Save
   preset", **Then** no preset is saved and the user receives a brief
   inline indication that the pattern is empty.

---

### User Story 4 - Cross-platform fallbacks (Priority: P2)

A user opens the Haptics Playground on Android: notification, impact, and
selection haptics still trigger using the Android equivalents, and visual
pulses still animate. A user opens it on Web: a banner reads "Haptics not
supported on this platform", but every button is still tappable and produces
the visual pulse animation so the demo can still be shown in a browser.

**Why this priority**: Constitution Principle I (Cross-Platform Parity)
requires the feature to work on iOS, Android, and Web with platform-aware
fallbacks. This story validates that requirement.

**Independent Test**: Run the same screen on an Android device and verify
haptics fire and pulses animate. Run it in a web build and verify the banner
appears, no errors are thrown when buttons are pressed, and pulses still
animate.

**Acceptance Scenarios**:

1. **Given** the user is on the Haptics Playground on an Android device,
   **When** they tap any haptic button, **Then** the closest-equivalent
   Android haptic fires and the visual pulse animates.
2. **Given** the user is on the Haptics Playground on Web, **When** the
   screen loads, **Then** a clearly visible banner reads "Haptics not
   supported on this platform".
3. **Given** the user is on the Haptics Playground on Web, **When** they tap
   any haptic button or press Play, **Then** no error is raised and visual
   pulses still animate as expected.

---

### Edge Cases

- **Rapid repeated taps**: User mashes a haptic button 10 times in a second.
  The driver MUST not crash, queue indefinitely, or block the UI thread.
  Each tap SHOULD fire its haptic best-effort; coalescing is acceptable if
  the platform requires it.
- **Sequence playing while user navigates away**: Playback MUST be cancelled
  on screen unmount; no haptics fire after leaving the screen.
- **AsyncStorage read failure on launch**: The presets list MUST render as
  empty (not crash). The composer MUST remain usable.
- **AsyncStorage write failure on save**: The user MUST see a brief inline
  error indication; the in-memory composer state MUST be preserved.
- **Corrupted presets payload** (older/invalid schema): Invalid entries MUST
  be skipped and the remainder rendered; the app MUST NOT crash.
- **Reduced-motion / accessibility**: Visual pulses MUST respect the
  platform reduced-motion setting (degrade to a simple opacity flash or
  static highlight), but haptics still fire.
- **Web with no haptics API**: All haptic calls MUST be no-ops, never throw.

## Requirements *(mandatory)*

### Functional Requirements

#### Module registration

- **FR-001**: System MUST register a "Haptics Playground" module in the
  plugin registry introduced by feature 006, with id `haptics-playground`,
  declaring supported platforms `['ios', 'android', 'web']` and no minimum
  iOS version restriction.
- **FR-002**: The Modules home grid MUST display the Haptics Playground
  card alongside other registered modules using the same card visual
  treatment.
- **FR-003**: Tapping the Haptics Playground card MUST navigate to the
  Haptics Playground screen via the registry's standard navigation flow.

#### Single-fire haptic controls

- **FR-004**: The screen MUST present a "Notification" section with three
  buttons labeled Success, Warning, and Error.
- **FR-005**: The screen MUST present an "Impact" section with five buttons
  labeled Light, Medium, Heavy, Soft, and Rigid in a single row (wrapping
  permitted on narrow viewports).
- **FR-006**: The screen MUST present a "Selection" section with a single
  Selection button.
- **FR-007**: Tapping any of the nine single-fire buttons MUST trigger the
  corresponding haptic on iOS and the closest Android equivalent on
  Android, and MUST be a no-op on Web.
- **FR-008**: Tapping any of the nine single-fire buttons MUST animate a
  short visual pulse on or around that button on all three platforms,
  regardless of haptic support.

#### Pattern composer

- **FR-009**: The screen MUST present a Pattern Composer section
  containing exactly 8 sequencer cells arranged in a single row (wrapping
  permitted on narrow viewports).
- **FR-010**: Each cell MUST start in the "off" state and MUST cycle
  through the following options on tap: off → Light → Medium → Heavy →
  Soft → Rigid → Success → Warning → Error → off.
- **FR-011**: Each cell MUST visually indicate its current option (label,
  icon, or color) so the user can read the composed pattern at a glance.
- **FR-012**: The composer MUST include a Play button.
- **FR-013**: When Play is pressed, the system MUST fire each non-empty
  cell's haptic in left-to-right order with approximately 120 ms between
  fires.
- **FR-014**: As each cell fires during playback, that cell MUST animate a
  visual pulse synchronized with its trigger.
- **FR-015**: When Play is pressed with an entirely empty composer, the
  system MUST do nothing destructive and MUST NOT show an error dialog.
- **FR-016**: Playback MUST be cancellable: pressing Play during playback,
  or unmounting the screen, MUST stop further haptics from firing.

#### Presets persistence

- **FR-017**: The composer MUST include a "Save preset" button.
- **FR-018**: When Save preset is pressed with at least one non-empty cell,
  the system MUST persist the current pattern to local device storage
  under the key `spot.haptics.presets`.
- **FR-019**: New presets MUST receive an auto-generated name of the form
  "Preset N" where N is the next integer not already in use among existing
  presets.
- **FR-020**: When Save preset is pressed with an entirely empty composer,
  no preset MUST be saved and a brief inline indication MUST inform the
  user.
- **FR-021**: The screen MUST display a Presets list below the composer
  showing every saved preset (name + a compact pattern preview).
- **FR-022**: Tapping a preset row MUST replay that preset's pattern using
  the same rules as composer playback (FR-013, FR-014, FR-016).
- **FR-023**: Presets MUST survive app restarts (loaded from
  `spot.haptics.presets` on screen mount).
- **FR-024**: A failure to read or parse persisted presets MUST result in
  an empty presets list and MUST NOT prevent the rest of the screen from
  rendering or functioning.
- **FR-025**: Corrupted or schema-invalid preset entries MUST be skipped
  individually; valid entries MUST still be loaded.

#### Cross-platform behavior

- **FR-026**: On Android, all notification, impact, and selection haptics
  MUST invoke the corresponding cross-platform haptic API; visual pulses
  MUST behave identically to iOS.
- **FR-027**: On Web, the screen MUST display a clearly visible banner
  reading "Haptics not supported on this platform" at the top of the
  screen.
- **FR-028**: On Web, all haptic invocations MUST be safe no-ops and MUST
  NOT throw or surface errors to the user.
- **FR-029**: On Web, all visual pulses, the composer, presets, and Play
  flow MUST function so the demo is fully usable in a browser.

#### Architecture & quality

- **FR-030**: The module's source MUST live under
  `src/modules/haptics-playground/`.
- **FR-031**: All haptic API calls MUST go through a single thin wrapper
  module `haptic-driver.ts` to provide one seam for testing and for
  platform fallbacks.
- **FR-032**: Visual pulses MUST be implemented using the project's
  approved animation stack (Reanimated Keyframe API + worklets per the
  constitution); the React Native Animated API MUST NOT be used.
- **FR-033**: All styles MUST use `StyleSheet.create()` and the centralized
  theme tokens (`Spacing`, theme colors via `useTheme()`, `ThemedText` /
  `ThemedView`); no hardcoded colors and no inline style objects outside
  StyleSheet.
- **FR-034**: All quality gates (format, lint, typecheck, test) MUST pass
  before the feature is considered complete.
- **FR-035**: Tests MUST cover the haptic driver wrapper (mocked), the
  composer cycle/play logic, presets save/load (with mocked AsyncStorage),
  and the web no-op path, in line with constitutional Principle V
  (Test-First).

### Key Entities

- **Preset**: A saved haptic pattern.
  - `id`: stable unique identifier (string).
  - `name`: human-readable auto-generated name (e.g. "Preset 3").
  - `pattern`: ordered list of `cells` (length up to 8). Each cell is
    either `null` (off) or a tagged value identifying one of the nine
    haptic options (Light, Medium, Heavy, Soft, Rigid, Success, Warning,
    Error).
  - `createdAt`: ISO-8601 timestamp the preset was saved.
- **PresetsStore**: Persisted collection of `Preset` entries serialized
  under the AsyncStorage key `spot.haptics.presets`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user lands on the Modules home grid, opens the Haptics
  Playground, and feels at least one haptic in under 10 seconds without
  consulting docs.
- **SC-002**: From a tap on any single-fire haptic button, the
  corresponding device haptic begins firing in under 100 ms on supported
  platforms.
- **SC-003**: 100% of haptic option types (3 notification + 5 impact + 1
  selection = 9) are exercisable from the screen without writing code.
- **SC-004**: Pattern playback timing variance for the 120 ms inter-cell
  spacing stays within ±30 ms across an 8-cell sequence on a current-gen
  iPhone in non-throttled state.
- **SC-005**: Presets saved on the device persist across at least 100%
  of cold app restarts (no data loss in normal operation).
- **SC-006**: On Web, opening the playground screen produces zero runtime
  errors related to missing haptic APIs, and 100% of the UI controls
  remain interactive.
- **SC-007**: The Haptics Playground module ships with cross-platform
  parity: every acceptance scenario in Stories 1, 2, 3, and 4 passes on
  iOS, Android (where applicable), and Web (where applicable) before
  release.
- **SC-008**: All quality gates (format, lint, typecheck, test) pass on
  the feature branch with no warnings introduced by this module.

## Out of Scope

The following are explicitly **not** part of this feature and will be
deferred to a future spec if pursued:

- Custom Core Haptics AHAP pattern files or arbitrary
  amplitude/frequency curves beyond the built-in
  `expo-haptics` notification, impact, and selection types.
- Audio playback synchronized with haptic events.
- Recording haptic patterns from gesture or touch input.
- Sharing presets between devices or syncing them to the cloud.
- Editing or renaming existing presets (delete-and-resave is acceptable
  in v1; explicit edit/rename UI is out of scope).
- Tempo/spacing controls in the composer beyond the fixed ~120 ms
  inter-cell delay.

## Assumptions

- The plugin registry from feature 006 is in place and exposes a stable
  way for this module to register itself, declare supported platforms,
  and own its screen route.
- The project may add `expo-haptics` via `npx expo install expo-haptics`;
  it is JS-pure and requires no custom native module work.
- AsyncStorage (`@react-native-async-storage/async-storage`) is already
  available in the project (or may be added) and is the agreed
  persistence layer.
- The user has a physical device with a Taptic Engine (iPhone) or an
  Android device with a vibrator to fully experience the haptics; the
  simulator/emulator and web browsers are expected to fall back to the
  visual-only experience.
- The constitution's design-token, theming, animation, and StyleSheet
  rules apply uniformly; this feature does not request any constitutional
  exemption.
