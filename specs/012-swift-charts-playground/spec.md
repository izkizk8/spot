# Feature Specification: Swift Charts Playground

**Feature Branch**: `012-swift-charts-playground`  
**Created**: 2026-04-28  
**Status**: Draft  
**Input**: User description: "A new module that demos Apple's Swift Charts framework. Shows real native charts rendered by `Charts` framework — line, bar, area, point — with smooth animations, themed marks, and interactive selection."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See a real Swift Charts line chart and switch chart types (Priority: P1)

A user opens the Spot iOS Feature Showcase on an iPhone running iOS 16 or
later, sees a "Swift Charts Lab" card on the Modules home grid, and taps
it. They land on a screen titled "Swift Charts Lab" with a segmented
control at the top reading Line / Bar / Area / Point and, below it, a
real native chart at least 300 pt tall rendered by Apple's `Charts`
framework, plotting a sample dataset of 12 monthly values (e.g. mock
monthly temperatures). The chart appears with a smooth entrance
animation. Tapping a different segment animates the chart cross-fading /
morphing into the new chart type with the same dataset.

**Why this priority**: This is the smallest end-to-end slice that
delivers the module's core promise — a *real* Swift Charts surface
rendered by Apple's `Charts` framework, not a JavaScript reimplementation.
It exercises the registry entry, the iOS 16+ gating, the SwiftUI host,
the dataset plumbing, and chart-type switching. Without it, none of the
other interactions have anything to render.

**Independent Test**: Install a dev build on an iPhone running iOS 16+,
open the Modules grid, tap the "Swift Charts Lab" card, and verify a
native chart at least 300 pt tall renders with 12 data points. Tap each
segment in turn (Line, Bar, Area, Point) and verify the chart animates
into the new type while preserving the same 12 values.

**Acceptance Scenarios**:

1. **Given** the user is on the Modules home grid on an iOS 16+ device,
   **When** they look at the list of available modules, **Then** a
   "Swift Charts Lab" card MUST be visible and tappable.
2. **Given** the user has tapped the Swift Charts Lab card on iOS 16+,
   **When** the screen first renders, **Then** the screen MUST show a
   four-segment control (Line / Bar / Area / Point) with Line selected
   by default and a native Swift Charts chart at least 300 pt tall
   plotting the initial 12-month sample dataset.
3. **Given** the screen has rendered with the Line chart visible,
   **When** the user taps another segment, **Then** the chart MUST
   transition to the corresponding chart type within an animated
   transition, preserving the same 12 underlying data values.
4. **Given** any chart type is selected, **When** the screen renders,
   **Then** the chart MUST display all 12 data points and an
   axis-appropriate set of axis ticks/labels for both the x-axis (month)
   and y-axis (value).

---

### User Story 2 - Mutate the dataset and watch marks animate (Priority: P1)

The user wants to *feel* Swift Charts' built-in animation system. Below
the chart they see three buttons: "Randomize data", "Add point", and
"Remove point". Tapping Randomize regenerates all 12 values within a
plausible range and the chart animates each mark from its old value to
its new value. Tapping Add point appends one new value at the end of the
series and the chart animates the new mark sliding/fading in. Tapping
Remove point removes the most recent value and the chart animates that
mark out. Add point is disabled when the series already has the
configured maximum number of points; Remove point is disabled when the
series is at the configured minimum.

**Why this priority**: Animated mark transitions are the showcase hook
for Swift Charts beyond "static native chart". They depend on Story 1
being in place but build directly on the same dataset and host.

**Independent Test**: After Story 1 is shipped, open the Swift Charts
Lab screen on iOS 16+, tap Randomize and verify each mark visibly
animates to its new value. Tap Add point repeatedly and verify a new
mark animates in each time, and that the button disables when the
series reaches its maximum size. Tap Remove point repeatedly and verify
marks animate out, and that the button disables at the configured
minimum size.

**Acceptance Scenarios**:

1. **Given** the chart is rendered with the initial 12-value dataset,
   **When** the user taps "Randomize data", **Then** every mark MUST
   animate from its old value to a new value within the configured
   plausible range, and the underlying series MUST still contain
   exactly 12 values.
2. **Given** the chart is rendered with N values where N is below the
   maximum series size, **When** the user taps "Add point", **Then** a
   new value MUST be appended to the series and the new mark MUST
   animate into the chart.
3. **Given** the chart is rendered with N values where N is above the
   minimum series size, **When** the user taps "Remove point",
   **Then** the most recent value MUST be removed and the corresponding
   mark MUST animate out of the chart.
4. **Given** the series is at its maximum size, **When** the user views
   the controls, **Then** the "Add point" button MUST be disabled.
5. **Given** the series is at its minimum size, **When** the user views
   the controls, **Then** the "Remove point" button MUST be disabled.
6. **Given** the user taps Randomize, Add, or Remove rapidly in
   succession, **When** subsequent taps fire while a previous animation
   is still in flight, **Then** the chart MUST remain visually
   consistent with the latest dataset state without crashing or leaving
   orphan marks.

---

### User Story 3 - Recolor and restyle marks (Priority: P2)

The user wants to see how Swift Charts marks pick up tint and style.
Below the dataset controls the screen presents a horizontal row of four
color swatches and, beneath them, a "Show foreground style" toggle.
Tapping a swatch immediately recolors the chart marks (line stroke / bar
fill / area fill / point fill) to the chosen tint with a brief animated
transition; the currently selected swatch is visually marked as
selected. Toggling "Show foreground style" applies a gradient
foreground style on Line and Area chart types (turning the line into a
gradient stroke and the area into a gradient fill); on Bar and Point
chart types the toggle has no visible effect (it remains togglable but
does not error or crash).

**Why this priority**: These controls deliver the "themed marks" beat
of the module description. They build on Stories 1 and 2 and can be
delivered in a single increment without affecting dataset behaviour.

**Independent Test**: After Stories 1 and 2 are shipped, open the Swift
Charts Lab screen on iOS 16+, tap each of the four tint swatches in
turn and verify the chart marks recolor to match each tint with a
visible animated transition. Toggle "Show foreground style" on while a
Line or Area chart is visible and verify a gradient is applied to the
line stroke or area fill respectively; toggle it off and verify the
gradient is removed. Switch to Bar or Point with the toggle on and
verify nothing crashes.

**Acceptance Scenarios**:

1. **Given** the screen has rendered, **When** the user views the
   styling controls, **Then** exactly four tint swatches MUST be
   visible, with one swatch marked as the currently selected tint.
2. **Given** any chart type is rendered, **When** the user taps a
   different tint swatch, **Then** the chart marks MUST transition to
   the new tint within an animated transition and the selected-swatch
   indicator MUST move to the tapped swatch.
3. **Given** Line or Area is the active chart type, **When** the user
   toggles "Show foreground style" on, **Then** the chart MUST render
   the marks with a gradient foreground style derived from the current
   tint; toggling it off MUST revert to a flat foreground style.
4. **Given** Bar or Point is the active chart type, **When** the user
   toggles "Show foreground style" on or off, **Then** the chart MUST
   continue to render correctly with no visual error and no crash; the
   toggle's state MUST be preserved so that switching back to Line or
   Area applies the gradient as in (3).

---

### User Story 4 - Tap a mark to see its value (Priority: P2)

The user wants to read off a specific value. They tap (or tap-and-hold)
on a mark in the chart and a small inline indicator appears showing the
month label and value of the tapped mark. Tapping elsewhere on the
chart, switching chart types, or mutating the dataset dismisses the
indicator. On chart types where direct mark hit-testing is impractical
(e.g. a continuous line), tapping near the line MUST snap to the
nearest data point's month and value.

**Why this priority**: Interactive selection is called out in the
feature description. It depends on Stories 1–3 being in place and
delivers a small but recognizable Swift Charts beat (chart gestures /
selection).

**Independent Test**: After Stories 1–3 are shipped, open the Swift
Charts Lab screen on iOS 16+, tap a mark in the Bar chart and verify a
small indicator appears showing that mark's month and value. Switch to
Line and tap near the curve and verify the indicator snaps to the
nearest data point. Mutate the dataset (Randomize / Add / Remove) and
verify the indicator dismisses. Switch chart types and verify the
indicator dismisses.

**Acceptance Scenarios**:

1. **Given** any chart type is rendered, **When** the user taps a mark
   (or, for Line, the area near the curve), **Then** an inline
   indicator MUST appear showing the month label and the value of the
   selected data point.
2. **Given** an inline indicator is visible, **When** the user taps
   elsewhere on the chart, switches chart types, or invokes Randomize /
   Add / Remove, **Then** the indicator MUST dismiss.
3. **Given** the Line chart type is active, **When** the user taps
   between data points, **Then** the indicator MUST snap to the nearest
   data point rather than interpolating a value.

---

### User Story 5 - Cross-platform fallback on Android, Web, and iOS < 16 (Priority: P2)

A user opens the Swift Charts Lab on Android, on Web, or on an iPhone
running iOS 15 or earlier. The screen still loads. At the top, a banner
explains that Swift Charts is iOS 16+ only and that what they are
seeing is a React Native fallback rendering. Below the banner, the same
controls as on iOS — segmented chart-type control, Randomize / Add /
Remove buttons, tint swatches, and the "Show foreground style" toggle —
drive a simple bar-style fallback chart implemented with plain
`<View>`-based primitives (no new chart library dependency). The
fallback chart visibly responds to chart-type changes (its presentation
adjusts), dataset mutations (bars animate in / out / to new heights),
tint changes (bar fill recolors), and the foreground-style toggle (bars
adopt a gradient fill where feasible).

**Why this priority**: Cross-platform parity is required by Constitution
Principle I. Without the fallback, the module is broken on Android, Web,
and older iOS devices and the registry card cannot be safely surfaced
on those platforms.

**Independent Test**: Run the screen in a desktop web browser and on an
Android device (or simulator), and on an iPhone with iOS 15 or earlier
if available. In each case, verify the screen renders, the iOS-16+ -only
banner is visible, the segmented control / Randomize / Add / Remove /
tint / foreground-style controls all render and respond to interaction,
and the fallback chart visibly updates in response to each control. On
iOS 16+, verify the banner is *not* shown and the real Swift Charts
view is rendered instead.

**Acceptance Scenarios**:

1. **Given** the user opens the Swift Charts Lab on Android, Web, or
   iOS < 16, **When** the screen renders, **Then** an "iOS 16+ only"
   banner MUST be visible at the top of the content area explaining
   that the displayed chart is a React Native fallback.
2. **Given** the user is on a non-iOS-16+ platform, **When** the screen
   renders, **Then** all five user-visible controls (chart-type
   segmented control, Randomize, Add point, Remove point, tint
   swatches, foreground-style toggle) MUST be present and interactive,
   with the same enable/disable semantics as on iOS (e.g. Add point
   disabled at max size, Remove point disabled at min size).
3. **Given** the user is on a non-iOS-16+ platform, **When** they
   change the chart type, mutate the dataset, change the tint, or
   toggle the foreground style, **Then** the fallback chart MUST
   visibly update in response to that interaction.
4. **Given** the user is on iOS 16+, **When** the screen renders,
   **Then** the iOS-16+ -only banner MUST NOT be shown and the real
   Swift Charts view MUST be rendered.
5. **Given** the user is on iOS 15 or earlier, **When** they look at
   the Modules grid, **Then** the registry's existing `minIOS: '16.0'`
   gating MAY hide or visibly mark the card as unavailable per spec
   006; in either case the module MUST NOT crash if the user reaches
   the screen via deep link or any other entry point — the React Native
   fallback MUST render in that case.

---

### Edge Cases

- **Rapid control tapping**: Tapping Randomize / Add / Remove or
  switching chart types rapidly in succession MUST be safe; the chart
  MUST always end in a state consistent with the most recent control
  intent, and animations MAY be cancelled / coalesced but MUST NOT
  leave orphan marks, leak memory, or crash.
- **Add point at maximum, Remove point at minimum**: The Add and Remove
  buttons MUST be disabled at their respective bounds (configured
  maximum and minimum series size); tapping a disabled button MUST be a
  no-op and MUST NOT mutate the series.
- **Switching chart types while an animation is in flight**: Switching
  chart type during a Randomize / Add / Remove animation MUST not
  leave the chart in a partially-animated state; the new chart type
  MUST render with the latest dataset values.
- **Selection across chart-type changes**: If a mark is selected
  (Story 4) and the user switches chart type, the selection indicator
  MUST dismiss; the new chart type MUST NOT inherit a stale selection
  from the previous type.
- **Foreground-style toggle on non-supporting types**: Toggling the
  foreground-style switch while Bar or Point is active MUST be a safe
  no-op visually; the toggle's state MUST persist so switching back to
  Line or Area applies the gradient without requiring a re-toggle.
- **Navigating away mid-animation**: Navigating away from the Swift
  Charts Lab while an animation is in flight MUST tear down the chart
  host cleanly; no animation callbacks MUST fire after unmount and no
  layout warnings MUST be emitted.
- **App backgrounded with chart visible**: Backgrounding the app while
  the chart is on screen and returning to foreground MUST restore the
  chart with the same dataset, chart type, tint, and foreground-style
  toggle state; in-flight animations MAY simply settle to their final
  values rather than resuming.
- **Web with no iOS 16+ Swift Charts native bridge**: On Web, the
  iOS-only native module MUST NOT be imported or evaluated at module
  load time; only the React Native fallback path MUST execute.
- **Accessibility on the fallback chart**: The React Native fallback
  chart MUST expose at minimum the dataset's series of values to
  assistive technologies as a single accessible summary (e.g. "Chart
  with 12 values, currently in Bar mode, current values …") so that a
  user navigating with VoiceOver / TalkBack / a screen reader is not
  presented with an opaque collection of unlabelled `<View>` nodes.

## Requirements *(mandatory)*

### Functional Requirements

#### Module registration

- **FR-001**: System MUST register a "Swift Charts Lab" module in the
  plugin registry introduced by feature 006, with id `swift-charts-lab`,
  declaring supported platforms `['ios', 'android', 'web']` and
  `minIOS: '16.0'` (Swift Charts is iOS 16+).
- **FR-002**: The Modules home grid MUST display the Swift Charts Lab
  card alongside other registered modules using the same card visual
  treatment, with the iOS-version gating handled by spec 006's existing
  `minIOS` mechanism (no parallel gating in this module).
- **FR-003**: Tapping the Swift Charts Lab card MUST navigate to the
  Swift Charts Lab screen via the registry's standard navigation flow.
- **FR-004**: On iOS versions below 16.0, the registry's `minIOS`
  gating MUST mark the card as unavailable per spec 006; the module
  MUST NOT attempt to load Apple's `Charts` framework on those
  versions.

#### Screen layout

- **FR-005**: The screen MUST present a header containing the title
  "Swift Charts Lab".
- **FR-006**: The screen MUST present, in this fixed top-to-bottom
  order: (a) on non-iOS-16+ platforms only, an "iOS 16+ only" fallback
  banner; (b) a chart-type segmented control with exactly four options
  (Line / Bar / Area / Point); (c) the chart region (real Swift Charts
  view on iOS 16+, React Native fallback otherwise); (d) the dataset
  controls row containing "Randomize data", "Add point", and "Remove
  point" buttons; (e) the styling controls row containing four tint
  swatches and the "Show foreground style" toggle.
- **FR-007**: The chart region MUST occupy a height of at least 300
  points on all platforms regardless of chart type or fallback state.

#### Chart-type segmented control

- **FR-008**: The chart-type segmented control MUST present exactly
  four options in this fixed order: Line, Bar, Area, Point.
- **FR-009**: The chart-type segmented control MUST default to Line on
  first render.
- **FR-010**: Changing the chart-type segmented control MUST update the
  rendered chart on iOS 16+ (real Swift Charts) and on the fallback
  path within an animated transition; the underlying dataset MUST be
  preserved unchanged across the transition.

#### Dataset and dataset controls

- **FR-011**: On first render the dataset MUST contain exactly 12
  values, each labelled with a month (January through December) and a
  numeric value within a plausible mock-temperature range.
- **FR-012**: The dataset MUST have a configured minimum size and a
  configured maximum size; the minimum MUST be at least 2 (so a chart
  remains renderable) and the maximum MUST be no less than the initial
  size of 12.
- **FR-013**: The "Randomize data" button MUST regenerate every value
  in the current series within the configured plausible range, leaving
  the series length unchanged. On iOS 16+ each affected mark MUST
  animate from its old value to its new value via Swift Charts' built-in
  animation. On the fallback path each bar MUST animate to its new
  height.
- **FR-014**: The "Add point" button MUST append exactly one new value
  to the series, with a month label that continues the existing
  sequence (wrapping or extending in a documented manner if past
  December). On iOS 16+ the new mark MUST animate into the chart; on
  the fallback path the new bar MUST animate in.
- **FR-015**: The "Remove point" button MUST remove the last value in
  the series. On iOS 16+ the removed mark MUST animate out; on the
  fallback path the removed bar MUST animate out.
- **FR-016**: The "Add point" button MUST be disabled when the series
  is at its configured maximum size; the "Remove point" button MUST be
  disabled when the series is at its configured minimum size.

#### Styling controls

- **FR-017**: The styling controls row MUST present exactly four tint
  swatches in a fixed visual order; each swatch MUST be tappable and
  the currently selected swatch MUST be visually distinguished.
- **FR-018**: Tapping a tint swatch MUST set that tint as the active
  mark colour. On iOS 16+ all chart marks (line stroke / bar fill /
  area fill / point fill) MUST recolor to the selected tint. On the
  fallback path the fallback bars MUST recolor to the selected tint.
- **FR-019**: The first swatch MUST be the default selected tint on
  first render.
- **FR-020**: The screen MUST present a "Show foreground style" toggle
  with a clear on/off visual state.
- **FR-021**: With the toggle on and the active chart type being Line,
  the iOS 16+ chart MUST render the line with a gradient foreground
  style derived from the active tint; with the active chart type being
  Area, the iOS 16+ chart MUST render the area fill with a gradient
  foreground style derived from the active tint.
- **FR-022**: With the toggle on and the active chart type being Bar
  or Point, the iOS 16+ chart MUST continue to render correctly with
  no visual error; the toggle's value MUST be preserved so switching
  back to Line or Area applies the gradient without requiring a
  re-toggle.
- **FR-023**: The fallback path MUST honour the foreground-style
  toggle on its bar fallback by applying a gradient bar fill where
  feasible; if a gradient fill is not feasible on a given target, a
  flat tinted fill is acceptable as a documented fallback.

#### Interactive selection

- **FR-024**: On iOS 16+, tapping a mark MUST display an inline
  indicator showing the month label and the value of the tapped data
  point.
- **FR-025**: For chart types where direct mark hit-testing is
  impractical (notably Line), tapping near the curve MUST snap the
  selection indicator to the nearest data point.
- **FR-026**: The selection indicator MUST dismiss when (a) the user
  taps elsewhere on the chart, (b) the chart type changes, or (c) the
  series is mutated by Randomize / Add / Remove.
- **FR-027**: On the fallback path, an equivalent selection
  affordance is **optional** in v1; if implemented it MUST follow the
  same dismiss semantics as iOS.

#### Cross-platform availability

- **FR-028**: On Android, Web, and iOS < 16, the screen MUST display
  an "iOS 16+ only" banner above the chart region explaining that the
  rendered chart is a React Native fallback.
- **FR-029**: On Android, Web, and iOS < 16, all five user-visible
  controls (chart-type segmented control, Randomize, Add point, Remove
  point, tint swatches, foreground-style toggle) MUST be present and
  interactive, and they MUST drive the fallback chart with the same
  enable/disable semantics as on iOS 16+.
- **FR-030**: The fallback chart MUST be implemented using only plain
  React Native primitives (`<View>`, `<Text>`, etc.) and animated
  width / height; this feature MUST NOT introduce a new charting
  dependency. If the existing `BarChart` component from the
  `sensors-playground` module (feature 011) can be reused without
  modification, it SHOULD be reused; otherwise an inline simple bar
  fallback in this module's own `components/` directory is acceptable.
- **FR-031**: On non-iOS-16+ platforms, no symbol from Apple's `Charts`
  framework or any iOS-only Swift Charts wrapper MUST be imported or
  evaluated at module load time; the iOS-only native bridge MUST be
  loaded only on iOS and only when the device meets the iOS 16+
  requirement.

#### Lifecycle

- **FR-032**: Navigating away from the Swift Charts Lab screen MUST
  tear down the chart host cleanly: no animation callbacks MUST fire
  after unmount; no layout warnings MUST be emitted; no native chart
  resources MUST leak.
- **FR-033**: When the app is backgrounded with the screen visible
  and returns to foreground, the chart MUST restore with the same
  dataset, chart type, active tint, and foreground-style toggle state;
  in-flight animations MAY settle directly to their final values
  rather than resuming.

#### Accessibility

- **FR-034**: The chart-type segmented control, dataset buttons, tint
  swatches, and foreground-style toggle MUST each expose an
  accessibility label describing their function (e.g. "Chart type:
  Line", "Randomize data", "Tint: blue", "Show foreground style on").
- **FR-035**: Tint swatches MUST be distinguishable to users who
  cannot perceive colour differences alone (e.g. a selected-state
  ring, checkmark, or other non-colour indicator on the active
  swatch).
- **FR-036**: Buttons in the disabled state (Add point at max, Remove
  point at min) MUST expose their disabled state to assistive
  technologies.
- **FR-037**: The fallback chart MUST expose, at minimum, an
  accessible summary of the current dataset, chart type, and active
  tint so that a screen-reader user is not presented with a collection
  of unlabelled `<View>` nodes.

#### Architecture & quality

- **FR-038**: The module's source MUST live under
  `src/modules/swift-charts-lab/` with at minimum: `index.tsx`
  (manifest), `screen.tsx` (and any platform variants such as
  `screen.ios.tsx` / `screen.android.tsx` / `screen.web.tsx` as
  required to keep iOS-only imports off non-iOS targets), `catalog.ts`,
  and a `components/` directory containing at least the chart-type
  segmented control, the dataset controls row, the tint swatch row,
  the foreground-style toggle, and either the reused `BarChart` from
  feature 011 or an inline fallback chart component.
- **FR-039**: The module MUST be registered with the registry via a
  single import line added to `src/modules/registry.ts` and MUST NOT
  modify any other file outside `src/modules/swift-charts-lab/`,
  except for the optional minimal change required to expose the
  feature-011 `BarChart` for cross-module reuse if FR-030's reuse path
  is taken (in which case any such change MUST be additive and MUST
  NOT alter feature 011's behaviour).
- **FR-040**: All component state (chart type, dataset, active tint,
  foreground-style toggle, current selection) MUST be local component
  state; no new global stores, contexts, or persistence layers MUST
  be introduced.
- **FR-041**: All styles MUST use `StyleSheet.create()` and the
  centralized theme tokens (`Spacing`, theme colors via the project's
  themed primitives, `ThemedText` / `ThemedView`); no hardcoded colors
  outside the four tint swatches' palette and no inline style objects
  outside StyleSheet.
- **FR-042**: TypeScript strict mode and the existing path aliases
  MUST be honoured; no relaxations or new lint/test tooling MUST be
  introduced.
- **FR-043**: All quality gates (`pnpm check`: format, lint, typecheck,
  test) MUST pass before the feature is considered complete.
- **FR-044**: Tests MUST cover, at minimum: `catalog.test.ts`,
  `manifest.test.ts` (asserting `id === 'swift-charts-lab'`,
  `platforms === ['ios','android','web']`, `minIOS === '16.0'`,
  `render` is a function), `screen.test.tsx` (initial render: 12
  values, Line selected by default, four tint swatches present, all
  controls present), a dataset-mutation test (Randomize preserves
  length; Add appends one; Remove pops one; Add disabled at max;
  Remove disabled at min), a chart-type-switching test (changing the
  segmented control updates the rendered chart type prop / fallback
  presentation), a tint test (changing the swatch updates the active
  tint prop), a foreground-style test (toggling the switch updates
  the prop and is preserved across chart-type changes), and a
  fallback test (on non-iOS-16+ targets the iOS-only Swift Charts
  symbol MUST NOT be imported and the fallback chart MUST render),
  in line with constitutional Principle V (Test-First).

### Key Entities

- **ChartType**: One of `line`, `bar`, `area`, `point`. Drives both
  the iOS 16+ Swift Charts mark type and the fallback chart's
  presentation.
- **DataPoint**: A single value in the series. Shape: `{ month: string,
  value: number }`. The `month` label is one of January through
  December, extended in a documented manner if the series grows past
  12 entries.
- **Dataset**: An ordered list of `DataPoint`s with a configured
  minimum and maximum size. Operations: `randomize()`, `addPoint()`,
  `removePoint()`. Length is invariant under `randomize()` and changes
  by exactly ±1 under `addPoint()` / `removePoint()`.
- **Tint**: One of four predefined swatch colours; identifies the
  active mark fill / stroke colour for both the Swift Charts marks and
  the fallback bars.
- **ForegroundStyle**: A boolean derived from the "Show foreground
  style" toggle. When true and the active `ChartType` is `line` or
  `area`, marks render with a gradient foreground style derived from
  the active `Tint`.
- **Selection**: Optional `{ index: number, point: DataPoint }`
  describing the currently selected data point on iOS 16+; cleared on
  chart-type change or dataset mutation.
- **PlatformAvailability**: Per-render flag derived from the runtime
  platform and iOS version: `swiftCharts` on iOS 16+, `fallback`
  otherwise. Drives whether the iOS-only Swift Charts host or the
  React Native fallback chart is rendered.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user lands on the Modules home grid on an iOS 16+
  device, opens the Swift Charts Lab, and sees a real native chart at
  least 300 pt tall plotting 12 values in under 5 seconds without
  consulting docs.
- **SC-002**: 100% of the four chart types (Line, Bar, Area, Point)
  render correctly with the same 12-value dataset on iOS 16+ and
  transition between each other via the segmented control without
  errors.
- **SC-003**: 100% of the three dataset operations (Randomize, Add
  point, Remove point) produce a visible animated transition on iOS
  16+ and on the fallback path; Randomize preserves series length;
  Add changes length by exactly +1; Remove changes length by exactly
  −1.
- **SC-004**: The Add point button is disabled in 100% of states where
  the series is at its configured maximum size; the Remove point button
  is disabled in 100% of states where the series is at its configured
  minimum size.
- **SC-005**: 100% of the four tint swatches recolor the chart marks
  on iOS 16+ and the fallback bars on Android / Web / iOS < 16 within
  an animated transition under 300 ms.
- **SC-006**: With the foreground-style toggle on, the active chart
  type being Line or Area on iOS 16+ produces a visibly gradient
  stroke / fill in 100% of test renderings; toggling it off reverts
  to a flat foreground style; toggling on Bar or Point produces no
  visible regression and zero crashes.
- **SC-007**: On iOS 16+, tapping a mark (or tapping near the Line
  curve) produces an inline indicator with the correct month label
  and value in 100% of taps; the indicator dismisses on tap-out, on
  chart-type change, and on every dataset mutation.
- **SC-008**: On Android, Web, and iOS < 16, opening the Swift Charts
  Lab produces zero runtime errors related to missing iOS-only Swift
  Charts symbols; the fallback banner is shown, every control is
  interactive, and the fallback chart updates in response to every
  control.
- **SC-009**: On iOS 16+, the Swift Charts Lab card is shown and the
  real Swift Charts host is rendered; on iOS < 16, the registry's
  `minIOS: '16.0'` gating marks the card as unavailable per spec 006
  and the iOS-only Swift Charts symbol is never imported.
- **SC-010**: The change is purely additive at the registry level:
  exactly one line is added to `src/modules/registry.ts` and no other
  file outside `src/modules/swift-charts-lab/` is modified by this
  feature, with the only documented exception being a minimal
  additive export change in feature 011 if and only if the
  `BarChart` reuse path of FR-030 is taken.
- **SC-011**: All quality gates (`pnpm check`) pass on the feature
  branch with no warnings introduced by this module.

## Out of Scope

The following are explicitly **not** part of this feature and will be
deferred to a future spec if pursued:

- Multi-series charts (stacked, grouped, or overlaid).
- Real data sources (e.g. weather APIs); the dataset is mock-only.
- Pie, donut, sector, or radial chart types.
- Swift Charts annotations API (`.chartXAxis { ... }` annotations,
  callout annotations on marks, reference lines beyond defaults).
- Persisting the user's chart type, tint, dataset, or
  foreground-style toggle across screen unmounts or app restarts.
- Exporting the chart as an image, PDF, or shareable artifact.
- Pinch-to-zoom, scroll-to-pan, or any gesture beyond mark
  selection on iOS 16+.
- 3D charts, augmented reality chart projection, or any
  RealityKit / SceneKit integration.
- A Material-style chart fallback designed for parity with platform
  Android conventions; the fallback chart is intentionally a simple
  RN-View bar visual.

## Assumptions

- The plugin registry from feature 006 is in place, supports modules
  declaring `platforms: ['ios', 'android', 'web']` together with a
  `minIOS` value, and already gates module visibility by iOS version
  per spec 006's existing dispatch.
- Apple's `Charts` framework (Swift Charts) is available on iOS 16
  and later and exposes the `LineMark`, `BarMark`, `AreaMark`, and
  `PointMark` mark types, animated mark transitions, mark
  foreground-style gradients, and a tap-selection affordance
  sufficient to satisfy User Story 4.
- A SwiftUI-to-React-Native bridge (e.g. an Expo Module hosting a
  SwiftUI view) is available or will be introduced during planning to
  host the Swift Charts view; the choice of bridge is a planning
  concern, not a spec concern.
- The `BarChart` component introduced in feature 011 uses only plain
  React Native primitives and is reusable cross-module without
  modification, *or* it is acceptable to inline a small simple
  bar-fallback component in this module if it is not.
- The constitution at `.specify/memory/constitution.md` v1.0.1 applies
  uniformly; this feature does not request any constitutional
  exemption.
- The existing themed primitives (`ThemedView`, `ThemedText`,
  `Spacing`, theme colour tokens) are sufficient for the screen
  chrome; the four tint swatches MAY introduce a small palette of
  hard-coded swatch colours since "tint picker" is intrinsically
  about specific colours.

## Notes

- [NEEDS CLARIFICATION: configured maximum series size] FR-012 fixes
  the minimum at ≥ 2 and the maximum at ≥ 12 (the initial size), but
  does not pin a specific maximum. Recommended default during
  planning: 24 (allowing the user to roughly double the series via Add
  point before the button disables). Resolve in `/speckit.clarify` or
  `/speckit.plan`.
- [NEEDS CLARIFICATION: month label sequence past December] FR-014
  requires Add point to extend the month label sequence in a
  documented manner past December. Recommended default during
  planning: wrap back to January, January, …, distinguishing repeats
  by an appended year-offset suffix only if the planning team
  considers it necessary. Resolve in `/speckit.clarify` or
  `/speckit.plan`.
- [NEEDS CLARIFICATION: fallback selection affordance] FR-027 leaves
  selection on the fallback path optional. Recommended default during
  planning: omit selection on the fallback to keep the fallback
  intentionally simple, and document the omission in the iOS-16+ -only
  banner copy.
