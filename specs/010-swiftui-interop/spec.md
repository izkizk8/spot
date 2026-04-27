# Feature Specification: SwiftUI Interop Showcase

**Feature Branch**: `010-swiftui-interop`  
**Created**: 2026-04-28  
**Status**: Draft  
**Input**: User description: "A new module added to the iOS Feature Showcase app's plugin registry demonstrating direct use of SwiftUI views from React Native via the `@expo/ui/swift-ui` package. The point: prove an Expo app can mount real SwiftUI views — not React Native components styled to look iOS-like — directly inline in a screen, and that they participate naturally in the iOS look and feel."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Interact with real SwiftUI views inside an Expo screen on iOS 16+ (Priority: P1)

A user opens the Spot iOS Feature Showcase on an iPhone running iOS 16 or
later, sees a "SwiftUI Interop" card on the Modules home grid, taps it,
and lands on a screen that scrolls vertically through several demo blocks.
Each block contains a real SwiftUI control (Picker, ColorPicker,
DatePicker, Slider, Stepper + Toggle) rendered inline by the Expo app via
`@expo/ui/swift-ui`. The user touches a SwiftUI control (e.g. spins the
wheel Picker, taps the ColorPicker swatch and chooses a color, drags the
Slider) and immediately sees a React Native label or visual element above
or below the control update to reflect the new value, proving that the
SwiftUI view's value flows back into JS and is rendered by RN UI.

**Why this priority**: This is the entire point of the module — without
SwiftUI views actually rendering and round-tripping their values into
React Native, the feature has no demonstration value. It is also the
smallest slice that proves the registry entry, the iOS 16 gating, and
the `@expo/ui/swift-ui` integration all work end-to-end.

**Independent Test**: Install a dev build on an iPhone running iOS 16+,
open the Modules home grid, tap the "SwiftUI Interop" card, scroll
through the demo blocks, interact with at least the SwiftUI Picker,
ColorPicker, DatePicker, Slider, and Stepper/Toggle, and verify that the
React Native echo (text label, swatch, or bar) above or below each
control updates as the SwiftUI value changes. The MVP is shippable on
this slice alone.

**Acceptance Scenarios**:

1. **Given** the user is on the Modules home grid on an iOS 16+ device,
   **When** they look at the list of available modules, **Then** a
   "SwiftUI Interop" card is visible and tappable.
2. **Given** the user is on the SwiftUI Interop screen on iOS 16+,
   **When** the screen first renders, **Then** five demo blocks are
   visible in a vertical stack in this order: Native Picker, Native
   ColorPicker, Native DatePicker, Native Slider, Native Stepper /
   Toggle row.
3. **Given** the user is on the SwiftUI Interop screen, **When** they
   change the selected option in the SwiftUI Picker (segmented or wheel
   variant), **Then** a React Native text element in the Picker block
   updates to display the new selected value.
4. **Given** the user is on the SwiftUI Interop screen, **When** they
   pick a new color in the SwiftUI ColorPicker, **Then** the React
   Native preview swatch in the ColorPicker block re-tints to the
   chosen color.
5. **Given** the user is on the SwiftUI Interop screen, **When** they
   pick a new date in either SwiftUI DatePicker style (compact or
   wheel), **Then** a React Native text label in the DatePicker block
   echoes the selected date.
6. **Given** the user is on the SwiftUI Interop screen, **When** they
   drag the SwiftUI Slider between 0 and 100, **Then** the width of the
   React Native bar above the slider updates proportionally to the
   slider value.
7. **Given** the user is on the SwiftUI Interop screen, **When** they
   change the SwiftUI Stepper value or toggle the SwiftUI Toggle,
   **Then** a React Native readout in that block updates to show both
   the current stepper number and the current toggle on/off state.
8. **Given** any demo block, **When** the user reads the block,
   **Then** a short caption is visible explaining that the control is
   a real SwiftUI view and that the value below (or above) is read by
   React Native.

---

### User Story 2 - Material/RN fallback on Android (Priority: P2)

A user opens the same Spot build on Android, taps the "SwiftUI Interop"
card from the Modules grid, and lands on a screen that displays a
banner stating "SwiftUI is iOS-only — here's the Material counterpart"
followed by equivalent React Native components (RN Picker, an RN-based
slider via segments, an RN date input, RN switch/stepper) so the page
still has meaningful, interactive content rather than appearing broken.

**Why this priority**: Cross-platform parity is a project-wide
expectation for showcase modules. Without it, Android users see a blank
or crashing screen, which undermines the showcase. It depends on Story 1
shipping the module skeleton, manifest, and registry entry.

**Independent Test**: After Story 1 is shipped, install the build on
an Android device, open the Modules grid, tap "SwiftUI Interop", and
verify that the banner is shown at the top, that no SwiftUI native call
is attempted, and that each fallback control is interactive.

**Acceptance Scenarios**:

1. **Given** the user is on the Modules home grid on Android, **When**
   they look at the list of available modules, **Then** a "SwiftUI
   Interop" card is visible and tappable.
2. **Given** the user is on the SwiftUI Interop screen on Android,
   **When** the screen first renders, **Then** a banner reading
   "SwiftUI is iOS-only — here's the Material counterpart" is visible
   at the top.
3. **Given** the user is on the SwiftUI Interop screen on Android,
   **When** the screen first renders, **Then** React Native fallback
   equivalents for picker, slider, date, and stepper/toggle are
   rendered in place of the SwiftUI demos and are interactive.
4. **Given** the SwiftUI Interop screen is open on Android, **When**
   the user interacts with any fallback control, **Then** no runtime
   error is raised and no SwiftUI/native iOS API is invoked.

---

### User Story 3 - Plain Web fallback (Priority: P3)

A user opens the same Spot build in a browser, taps the "SwiftUI
Interop" card, and lands on a screen that shows the same banner as
Android ("Native SwiftUI is iOS-only") followed by plain HTML / RN-Web
equivalents (a `<select>`-style picker, an HTML range input or
segmented fallback, a date input, a stepper/toggle row) so that the
showcase still has visible content on the web.

**Why this priority**: Web is the lowest-traffic surface for this app
but the project's showcase modules are expected to render on every
declared platform. It depends on Story 1 shipping the module skeleton.

**Independent Test**: After Story 1 is shipped, open the build in a
browser, navigate to the Modules grid, click the "SwiftUI Interop"
card, and verify the banner and the plain HTML / RN-Web fallback
controls render without error.

**Acceptance Scenarios**:

1. **Given** the user is on the Modules home grid on the web build,
   **When** they look at the list of available modules, **Then** a
   "SwiftUI Interop" card is visible and clickable.
2. **Given** the user is on the SwiftUI Interop screen on web,
   **When** the screen first renders, **Then** a banner reading
   "Native SwiftUI is iOS-only" is visible at the top.
3. **Given** the user is on the SwiftUI Interop screen on web,
   **When** the screen first renders, **Then** plain HTML / RN-Web
   equivalents for picker, slider, date, and stepper/toggle are
   rendered and interactive.
4. **Given** the SwiftUI Interop screen is open on web, **When** the
   user interacts with any fallback control, **Then** no runtime error
   is raised and no `@expo/ui/swift-ui` native code path is invoked.

---

### Edge Cases

- What happens if the device is on iOS 15 or earlier? The "SwiftUI
  Interop" card MUST be hidden by the registry's `minIOS: '16.0'`
  gate, identical to how feature 006 hides modules below their
  declared minimum iOS version.
- What happens if `@expo/ui/swift-ui` is not yet linked in the running
  binary (e.g. running JS-only in dev without a fresh native build)?
  The screen MUST not crash; the iOS branch MAY render the same
  fallback content as Android with the existing iOS-styled banner, or
  surface a clear in-screen message, but MUST NOT throw an unhandled
  error.
- What happens when a user rapidly drags the SwiftUI Slider? The
  React Native bar MUST track without crashing or dropping below the
  most recent emitted value.
- What happens when the user navigates away from the screen
  mid-interaction? All transient state (selected color, picker value,
  date, slider value, stepper value, toggle state) MUST be discarded;
  no persistence is required.
- What happens when the SwiftUI ColorPicker returns a color in a form
  that React Native cannot directly use as a style value? The module
  MUST normalise the color to an RN-compatible string before applying
  it to the preview swatch.

## Requirements *(mandatory)*

### Functional Requirements

#### Registry & gating

- **FR-001**: The module MUST be registered in the feature 006 module
  registry as a single new entry with `platforms: ['ios', 'android',
  'web']` and `minIOS: '16.0'`.
- **FR-002**: The module MUST be presented on the Modules home grid as
  a "SwiftUI Interop" card on every supported platform when the device
  meets the `minIOS` gate (iOS) or unconditionally (Android, Web).
- **FR-003**: Tapping the "SwiftUI Interop" card MUST open the module's
  screen as a child route under the existing showcase navigation, with
  no special-case routing changes outside the new module folder.

#### iOS demo blocks

- **FR-004**: On iOS 16+, the module screen MUST render five demo
  blocks in a single vertical scroll, in this order: (1) Native
  Picker, (2) Native ColorPicker, (3) Native DatePicker, (4) Native
  Slider, (5) Native Stepper / Toggle row.
- **FR-005**: The Native Picker block MUST render two real SwiftUI
  `Picker` views side by side: one in segmented style and one in
  wheel style, sharing a small fixed option set defined in the module.
- **FR-006**: When the user changes either Picker on iOS, the
  currently selected option value MUST be shown below the pickers in
  React Native UI (not in a SwiftUI view), proving the value bridges
  back into JS.
- **FR-007**: The Native ColorPicker block MUST render a real SwiftUI
  `ColorPicker` and an RN preview swatch above it; selecting a color
  in the SwiftUI ColorPicker MUST re-tint the RN swatch.
- **FR-008**: The Native DatePicker block MUST render a real SwiftUI
  `DatePicker` in compact style and a real SwiftUI `DatePicker` in
  wheel style; the selected date from the most recently changed
  picker MUST be echoed as a React Native text label in the same
  block.
- **FR-009**: The Native Slider block MUST render a real SwiftUI
  `Slider` bound to a value in the range 0..100; the value MUST drive
  the width of an RN bar rendered above the slider, scaling from 0%
  to 100% of the bar's container.
- **FR-010**: The Native Stepper / Toggle block MUST render a real
  SwiftUI `Stepper` and a real SwiftUI `Toggle` together (e.g. in a
  single row or stacked); both values MUST be displayed in React
  Native text in the same block.
- **FR-011**: Each iOS demo block MUST display a short caption,
  approximately of the form "This is a real SwiftUI <name>; the value
  below is read in React", to make the educational point obvious.

#### Android fallback

- **FR-012**: On Android, the module screen MUST display a banner at
  the top reading "SwiftUI is iOS-only — here's the Material
  counterpart".
- **FR-013**: On Android, the module screen MUST render React Native
  equivalents for picker, slider, date, and stepper/toggle (e.g. an
  RN Picker, a simple slider via segments, an RN date input, RN
  switch/stepper components) in place of the SwiftUI demos.
- **FR-014**: On Android, the module MUST NOT import or invoke any
  `@expo/ui/swift-ui` runtime entry point; the iOS demo modules MUST
  not be reachable via the Android render path.

#### Web fallback

- **FR-015**: On Web, the module screen MUST display a banner at the
  top reading "Native SwiftUI is iOS-only".
- **FR-016**: On Web, the module screen MUST render plain HTML or
  RN-Web equivalents (e.g. a `<select>`, an HTML range input or
  segmented fallback, an HTML date input, a stepper/toggle row) in
  place of the SwiftUI demos.
- **FR-017**: On Web, the module MUST NOT import or invoke any
  `@expo/ui/swift-ui` runtime entry point; the iOS demo modules MUST
  not be reachable via the Web render path.

#### Architecture & quality

- **FR-018**: The module's source MUST live under
  `src/modules/swiftui-interop/` with the following structure:
  `index.tsx` (manifest), `screen.tsx`, and a `demos/` directory
  containing `PickerDemo.tsx`, `ColorPickerDemo.tsx`,
  `DatePickerDemo.tsx`, `SliderDemo.tsx`, and `StepperToggleDemo.tsx`.
- **FR-019**: Platform fallbacks MUST be wired via platform-resolved
  `.web.tsx` / `.android.tsx` files (or a directory-based equivalent
  consistent with the pattern used by the feature 006 glass module),
  so the iOS-only `@expo/ui/swift-ui` import is not pulled into
  Android or Web bundles.
- **FR-020**: Registration MUST consist of a single line edit to
  `src/modules/registry.ts` to add the new module's manifest;
  no other file outside `src/modules/swiftui-interop/` MUST be
  modified by this feature.
- **FR-021**: All SwiftUI views MUST be obtained from the
  `@expo/ui/swift-ui` package; no hand-written SwiftUI source files,
  no custom Expo native modules, and no other native bridging layers
  MUST be introduced by this feature.
- **FR-022**: All component state MUST be local component state; no
  new global stores, contexts, or persistence layers MUST be
  introduced.
- **FR-023**: All React Native styles MUST use `StyleSheet.create()`,
  the centralized `Spacing` scale, and the project's themed primitives
  (`ThemedText`, `ThemedView`); no hardcoded colors and no inline
  style objects outside StyleSheet (with the necessary exception of
  the dynamic Slider-driven bar width and the dynamic ColorPicker
  swatch tint, both of which derive their dynamic value from state).
- **FR-024**: TypeScript strict mode and the existing `@/*` path
  alias MUST be honoured; no relaxations or new lint/test tooling
  MUST be introduced.
- **FR-025**: All quality gates (`pnpm check`: format, lint,
  typecheck, test) MUST pass before the feature is considered
  complete.

#### Tests

- **FR-026**: Tests MUST be JS-side only; no native integration tests
  MUST be added for this feature.
- **FR-027**: Tests MUST mock the `@expo/ui/swift-ui` package, simulate
  the SwiftUI controls' `onChange` callbacks, and assert that the
  React Native echo (text label, swatch tint, bar width, stepper
  number, toggle state) updates accordingly.
- **FR-028**: Fallback tests for Android and Web MUST use the
  explicit-filename import pattern established by feature 006 to
  bypass the platform resolver and exercise the `.android.tsx` and
  `.web.tsx` modules directly under the Jest environment.
- **FR-029**: Test coverage MUST include, at minimum, one test file
  per demo block, one test file for the iOS screen, one test file
  each for the Android and Web fallback screens, and a manifest
  registration test.

### Key Entities

- **DemoBlock**: One of the five SwiftUI interop demonstrations
  rendered on the iOS screen.
  - `id`: stable identifier (`picker`, `colorPicker`, `datePicker`,
    `slider`, `stepperToggle`).
  - `title`: short title shown above the SwiftUI control(s).
  - `caption`: short educational caption shown next to the block.
  - `swiftUIValue`: the current value(s) emitted by the underlying
    SwiftUI control(s).
  - `rnEcho`: the React Native rendering of `swiftUIValue` (text
    label, swatch tint, or bar width).
- **PickerOption**: A single option exposed by the Native Picker demo.
  - `id`: stable identifier used as the SwiftUI selection value.
  - `label`: human-readable label shown in both the segmented and
    wheel SwiftUI pickers and in the RN echo.
- **InteropState**: The transient, in-memory state held by the iOS
  screen.
  - `selectedPickerOption`: the currently selected `PickerOption`.
  - `selectedColor`: the most recent color emitted by the SwiftUI
    ColorPicker, normalised to an RN-compatible color string.
  - `selectedDate`: the most recent date emitted by either SwiftUI
    DatePicker.
  - `sliderValue`: a number in the range 0..100 driven by the SwiftUI
    Slider.
  - `stepperValue`: an integer driven by the SwiftUI Stepper.
  - `toggleOn`: a boolean driven by the SwiftUI Toggle.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user opens the Modules home grid on an iOS 16+
  device, opens the SwiftUI Interop screen, and successfully
  interacts with at least one SwiftUI control and observes the
  corresponding React Native echo update in under 10 seconds without
  consulting docs.
- **SC-002**: From the moment a SwiftUI control emits a new value,
  the corresponding React Native echo updates in under 100 ms on
  iOS 16+ on a current-generation device.
- **SC-003**: 100% of the five SwiftUI controls (Picker, ColorPicker,
  DatePicker, Slider, Stepper + Toggle) are visible, interactive,
  and round-trip their values into React Native UI on iOS 16+.
- **SC-004**: 100% of the five demo blocks have a visible educational
  caption that names the SwiftUI control and indicates that the
  value is read in React.
- **SC-005**: On Android and on Web, opening the SwiftUI Interop
  screen produces zero runtime errors related to missing native
  SwiftUI APIs and 100% of the fallback controls remain interactive.
- **SC-006**: The change is purely additive at the registry level:
  exactly one line is added to `src/modules/registry.ts` and no other
  file outside `src/modules/swiftui-interop/` is modified by this
  feature.
- **SC-007**: All quality gates (`pnpm check`) pass on the feature
  branch with no warnings introduced by this module.
- **SC-008**: The module satisfies the constitution at
  `.specify/memory/constitution.md` v1.0.1 with no requested
  exemption.

## Out of Scope

The following are explicitly **not** part of this feature and will be
deferred to a future spec if pursued:

- Complex SwiftUI compositions such as `Form` or `List` with sections.
- Two-way binding edge cases beyond the simple value flow shown
  (SwiftUI control → JS state → RN echo).
- The SwiftUI `Charts` framework.
- Deep dives into SwiftUI ↔ RN layout / size negotiation; the module
  uses the library's default sizing for each control.
- iOS 15 or earlier fallbacks for individual SwiftUI controls; the
  entire module gates on iOS 16 at the registry level.
- Per-user persistence of any selected value; all state is in-memory
  and resets on screen unmount.
- Driving SwiftUI control values from React Native (i.e. RN as the
  source of truth that pushes into the SwiftUI view); the
  demonstration is one-way SwiftUI → RN.
- Custom hand-written SwiftUI source files or new Expo native
  modules; this feature uses only what `@expo/ui/swift-ui` exposes.

## Assumptions

- The plugin registry from feature 006 is in place, exposes a stable
  `minIOS` field on module manifests, and already gates module
  visibility on iOS version, so this module does not need to
  reimplement gating.
- `@expo/ui/swift-ui` is (or will be) a project dependency and
  exposes SwiftUI `Picker`, `ColorPicker`, `DatePicker`, `Slider`,
  `Stepper`, and `Toggle` views with `onChange`-style callbacks
  suitable for round-tripping values into JS state.
- The project's `Expo-UI-SwiftUI` skill is the authoritative source
  for how to import, mount, and pass props/callbacks to SwiftUI
  views from React Native; the implementation phase will consult it.
- The platform-resolved file convention (`.web.tsx`, `.android.tsx`,
  or directory-based equivalent) used by the feature 006 glass
  module is sufficient to keep `@expo/ui/swift-ui` out of the
  Android and Web bundles.
- The "explicit-filename import" trick established by feature 006
  is sufficient for unit-testing the Android and Web fallbacks
  under Jest without needing a multi-platform Jest configuration.
- The project's centralized theme tokens (`Spacing`, `ThemedText`,
  `ThemedView`) and `StyleSheet.create()` conventions are already in
  place and require no extension to render the demo blocks.
- The existing showcase navigation accepts a new module manifest
  without bespoke routing changes beyond the single registry edit.
- Animations, accessibility tuning beyond what the SwiftUI controls
  provide by default, and right-to-left layout testing are not part
  of this feature's acceptance bar; SwiftUI's defaults are accepted.
- The constitution at `.specify/memory/constitution.md` v1.0.1
  applies uniformly; this feature does not request any
  constitutional exemption.
