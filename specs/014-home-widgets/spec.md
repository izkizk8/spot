# Feature Specification: Home Screen Widgets Module

**Feature Branch**: `014-home-widgets`  
**Created**: 2026-04-28  
**Status**: Draft  
**Input**: User description: "Add Home Screen Widgets via WidgetKit — distinct from Live Activities (007) and App Intents (013), but reuses lessons learned. Prove an Expo app can ship a real WidgetKit widget that appears in the iOS Home Screen widget gallery, in three sizes (Small / Medium / Large), with a TimelineProvider driven by data shared from the main app."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure data in the app and push it to a real Home Screen widget on iOS 14+ (Priority: P1)

A user opens the Spot iOS Feature Showcase on an iPhone running iOS 14
or later, sees a "Widgets Lab" card on the Modules home grid, and taps
it. They land on a screen titled "Widgets Lab" that shows the data the
widget would currently display, plus three input controls — a
"showcase value" text field (defaulting to "Hello, Widget!"), a
counter input, and a four-swatch theme tint picker. They change the
showcase value, bump the counter, pick a tint, and tap "Push to
widget". The screen confirms the push happened, the widget reload
event log immediately gains a new entry, and any spot-showcase widget
already on the Home Screen refreshes within a second to display the
new values in the chosen tint.

**Why this priority**: This is the smallest end-to-end slice that
proves the module's core promise — an Expo app shipping a real
WidgetKit widget driven by app-controlled data through an App Group
and an explicit `WidgetCenter.reloadAllTimelines()` call. It exercises
the registry entry, the iOS 14+ gating, the JS bridge
(`src/native/widget-center.ts`), the Swift TimelineProvider, the App
Group `UserDefaults` suite, the SwiftUI widget views, and the reload
event log in one round-trip. Without this slice, the rest of the
module has nothing to demonstrate.

**Independent Test**: Install a dev build on an iPhone running iOS
14+, add the spot-showcase widget to the Home Screen at any size,
open the Modules grid, tap the "Widgets Lab" card. Change the
showcase value to a recognisable test string, bump the counter, pick
a non-default tint, tap "Push to widget", and within one second
confirm that the Home Screen widget displays the new string, the new
counter, and the new tint, and that a new entry appears at the top of
the in-app reload event log with a timestamp matching the push.

**Acceptance Scenarios**:

1. **Given** the user is on the Modules home grid on an iOS 14+
   device, **When** they look at the list of available modules,
   **Then** a "Widgets Lab" card MUST be visible and tappable.
2. **Given** the user has tapped the Widgets Lab card on iOS 14+,
   **When** the screen first renders, **Then** the screen MUST
   present a status panel showing the data the widget would
   currently display (showcase value, counter, tint, next refresh
   time), a configuration panel with a showcase-value text field, a
   counter input, and a four-swatch tint picker, and a "Push to
   widget" button.
3. **Given** the configuration panel is visible, **When** the user
   edits the showcase value, the counter, and the tint and taps
   "Push to widget", **Then** the bridge MUST write the new
   configuration to the shared App Group `UserDefaults` suite, MUST
   invoke `WidgetCenter.shared.reloadAllTimelines()`, MUST surface a
   user-visible confirmation that the push succeeded, and MUST
   prepend a new entry to the reload event log with a timestamp.
4. **Given** at least one spot-showcase widget is installed on the
   Home Screen, **When** the user taps "Push to widget" with a new
   configuration, **Then** the widget MUST refresh within one second
   to display the new showcase value, the new counter, and the new
   tint.
5. **Given** the reload event log already contains 10 entries,
   **When** the user pushes another configuration, **Then** the new
   entry MUST be prepended and the oldest entry MUST be discarded so
   the log never exceeds exactly 10 entries.

---

### User Story 2 - Add the spot-showcase widget to the Home Screen with clear in-app guidance (Priority: P1)

A user who has just installed the dev build wants to actually put the
widget on their Home Screen. On the Widgets Lab screen they find a
"How to add the widget" setup instructions card with a numbered step
list — long-press the Home Screen, tap +, search "spot showcase",
pick a size (Small / Medium / Large), tap Add Widget. The user
follows the steps, picks the Medium size, and the widget appears on
the Home Screen rendering the current configuration from the App
Group with the correct tint and Medium-size layout.

**Why this priority**: Without this guidance, a non-technical user
cannot complete the round-trip. The widget is real and shippable but
invisible until added. This story is co-equal P1 with Story 1
because Story 1's "the widget refreshes" beat is unverifiable until
a widget has actually been added to the Home Screen by following the
guidance from this story.

**Independent Test**: After Story 1 is shipped, open the Widgets Lab
on an iOS 14+ device with no spot-showcase widget yet on the Home
Screen, follow the setup instructions card verbatim, and verify that
the widget gallery contains a "spot showcase" entry, that all three
sizes (Small / Medium / Large) are listed in the size picker, and
that adding any size to the Home Screen results in a widget that
renders the current configuration from the App Group.

**Acceptance Scenarios**:

1. **Given** the user is on the Widgets Lab screen on iOS 14+,
   **When** the screen renders, **Then** a "How to add the widget"
   setup instructions card MUST be visible with a numbered step list
   covering at minimum: long-press the Home Screen, tap +, search
   "spot showcase", pick a size, tap Add Widget.
2. **Given** the user follows the setup instructions and reaches
   Apple's widget gallery, **When** they search for "spot showcase",
   **Then** the spot-showcase widget MUST appear as a single gallery
   entry exposing exactly three size options: `.systemSmall`,
   `.systemMedium`, and `.systemLarge`.
3. **Given** the user picks a size and adds the widget, **When** the
   widget first appears on the Home Screen, **Then** it MUST render
   the current configuration from the shared App Group `UserDefaults`
   suite (showcase value, counter, tint) — not a hardcoded
   placeholder — within the size family chosen.
4. **Given** no configuration has yet been pushed by the user,
   **When** the widget is first added, **Then** it MUST render the
   documented default configuration (showcase value "Hello,
   Widget!", counter `0`, the documented default tint) rather than
   crashing or showing an empty placeholder forever.
5. **Given** the user has added the widget at one size, **When**
   they remove it and re-add it at a different size, **Then** the
   widget MUST render the same configuration data adapted to the new
   size family without requiring any additional in-app action.

---

### User Story 3 - Preview all three widget sizes and inspect timeline / reload state inside the app (Priority: P2)

A user wants to see what the widget should look like in each size
without leaving the app, and to confirm that the configuration they
pushed is what the widget is reading. Below the configuration panel
on the Widgets Lab screen, three RN-rendered preview cards
approximate the Small, Medium, and Large widget layouts using the
same configuration data the real widget reads. Above the previews,
the status panel shows the next scheduled refresh time and the
current showcase value the widget is reading from the App Group.
Below the previews, the reload event log shows the last 10 reload
events with timestamp.

**Why this priority**: This story turns the screen into a usable
authoring surface — the user can iterate on the showcase value,
counter, and tint, see the previews update immediately, and only
push to the real widget when they like the result. It depends on
Story 1 (the configuration plumbing must exist) but is P2 because
the headline beat is the real Home Screen widget refresh, not the
in-app preview.

**Independent Test**: After Story 1 is shipped, open the Widgets
Lab on iOS 14+ (or any platform that supports the in-app preview),
edit the showcase value, the counter, and the tint, and verify
that all three preview cards (Small / Medium / Large) update in the
same render pass, that the status panel reflects the same values
and a sensible "next refresh" time, and that pushing to the widget
adds a new entry to the reload event log without disturbing the
previews.

**Acceptance Scenarios**:

1. **Given** the user is on the Widgets Lab screen, **When** the
   screen renders, **Then** three RN-rendered preview cards labelled
   Small, Medium, and Large MUST be visible below the configuration
   panel, each rendering the current configuration in a layout that
   approximates the corresponding WidgetKit family.
2. **Given** the preview cards are visible, **When** the user edits
   any field in the configuration panel (showcase value, counter, or
   tint), **Then** all three preview cards MUST update within the
   same render pass to reflect the new values; pushing to the widget
   MUST NOT be required for the previews to update.
3. **Given** the status panel is visible, **When** the screen
   renders, **Then** the panel MUST display the showcase value, the
   counter, the tint, and the next scheduled timeline refresh time
   that the real widget will read on its next refresh.
4. **Given** the reload event log is visible, **When** the user
   taps "Push to widget", **Then** a new log entry with timestamp
   MUST be prepended within the same render pass; the log MUST
   never display more than 10 entries.
5. **Given** the user has not pushed any configuration in the
   current session, **When** the screen first mounts, **Then** the
   reload event log MUST render an explicit empty-state line ("No
   reloads yet") rather than an empty list with no affordance.

---

### User Story 4 - Cross-platform fallback on Android, Web, and iOS < 14 (Priority: P2)

A user opens the Widgets Lab on Android, on Web, or on an iPhone
running iOS 13 or earlier. The screen still loads. At the top, a
banner reads "Home Screen Widgets are iOS only" and explains that
WidgetKit is not available on this platform. Below the banner, the
configuration panel and the three RN-rendered preview cards still
render so the user can experiment with the showcase value, counter,
and tint and see what the widget *would* look like; the "Push to
widget" button is disabled with an inline explanation; the status
panel's "next refresh time" line is hidden because there is no real
widget timeline; the reload event log is hidden because there are no
real reloads to log.

**Why this priority**: Cross-platform parity for the *preview half*
of the module is required by Constitution Principle I. Without this
fallback, the module is broken on Android, Web, and older iOS
devices. It is P2 rather than P1 because the headline value of the
module is the real WidgetKit widget on iOS 14+; the fallback exists
to keep the app structurally sound across platforms, not to deliver
Home Screen widgets where they cannot exist.

**Independent Test**: Run the screen in a desktop web browser, on
an Android device (or simulator), and on an iPhone with iOS 13 or
earlier if available. In each case verify the screen renders, the
"Home Screen Widgets are iOS only" banner is visible, the
configuration panel and the three preview cards render and update
with edits, the "Push to widget" button is disabled, the status
panel's next-refresh-time line is hidden, and the reload event log
is hidden.

**Acceptance Scenarios**:

1. **Given** the user opens the Widgets Lab on Android, Web, or
   iOS < 14, **When** the screen renders, **Then** a "Home Screen
   Widgets are iOS only" banner MUST be visible at the top of the
   content area explaining that WidgetKit is unavailable.
2. **Given** the user is on a non-iOS-14+ platform, **When** the
   screen renders, **Then** the configuration panel and the three
   RN-rendered preview cards MUST be shown; the "Push to widget"
   button MUST be visibly disabled with an inline explanation; the
   status panel's "next refresh time" line and the reload event log
   MUST NOT be shown.
3. **Given** the user is on a non-iOS-14+ platform, **When** they
   edit the showcase value, the counter, or the tint, **Then** the
   three preview cards MUST update within the same render pass
   exactly as on the iOS path.
4. **Given** the user is on a non-iOS-14+ platform, **When** any
   code path attempts to call an iOS-only Widget Center bridge
   method other than `isAvailable()`, **Then** the bridge MUST
   throw a `WidgetCenterNotSupported` error rather than silently
   no-oping, so that misuse is loud.
5. **Given** the user is on a non-iOS-14+ platform, **When** the
   bridge `isAvailable()` is called, **Then** it MUST return
   `false` without throwing, so the screen can branch on it
   defensively.

---

### Edge Cases

- **No widgets installed when Push to widget is tapped**: Tapping
  "Push to widget" when no spot-showcase widget has been added to
  the Home Screen MUST still write the configuration to the App
  Group and call `WidgetCenter.reloadAllTimelines()`; the bridge
  MUST resolve successfully (since WidgetKit treats reload of an
  empty set as a no-op) and the reload event log MUST still record
  the event so the user gets feedback.
- **Empty showcase value**: When the user clears the showcase value
  text field and taps "Push to widget", the screen MUST either
  disable the push button or push the documented default ("Hello,
  Widget!") so the widget never renders an empty headline; the
  chosen behaviour MUST be consistent across the iOS push path and
  the in-app previews.
- **Counter at extreme values**: Counter values outside a documented
  reasonable range (e.g. negative numbers or values larger than what
  fits in the widget layout) MUST be either clamped at the input
  layer or rendered with a documented overflow treatment in both
  the previews and the real widget; the Swift side MUST NOT crash
  on any 32-bit signed integer value.
- **Rapid Push to widget**: Tapping "Push to widget" rapidly in
  succession MUST be safe; each tap MUST appear in the reload event
  log in the order it was fired; the App Group `UserDefaults` suite
  MUST end in a state consistent with the most recent push.
- **App Group read failure on widget side**: If the widget extension
  fails to read the App Group `UserDefaults` suite (e.g. on first
  launch before any push, or if the suite is missing entirely), the
  TimelineProvider MUST return a placeholder entry with the
  documented default configuration rather than crashing the widget;
  the Home Screen MUST never display a broken-widget chrome.
- **Reload event log overflow**: When the user pushes more than 10
  reloads in a single screen session, the reload event log MUST
  always show exactly the 10 most recent reloads; older entries
  MUST not reappear after being evicted.
- **Backgrounding during Push**: Backgrounding the app while a Push
  to widget call is in flight MUST not corrupt the App Group
  `UserDefaults` suite; on return to foreground, the suite MUST
  reflect the completed push if it succeeded, and the reload event
  log MUST reflect either a success or a clearly-marked failure
  entry.
- **Reload event log empty state on first mount**: Per US3 AS5, the
  reload event log MUST render an explicit "No reloads yet" line on
  first mount rather than an empty list with no affordance.
- **Widget rendering when App Group is brand-new**: When the widget
  is added to the Home Screen before the user has ever opened the
  Widgets Lab screen, the widget MUST render the documented default
  configuration; the user MUST NOT be required to push at least once
  before the widget will display anything.
- **Widget removed while screen is open**: Removing the widget from
  the Home Screen while the Widgets Lab screen is open MUST NOT
  affect the in-app preview cards, the configuration panel, or the
  reload event log; the next "Push to widget" tap MUST still
  succeed (per the empty-set edge case above).

## Requirements *(mandatory)*

### Functional Requirements

#### Module registration & gating

- **FR-001**: The Widgets Lab module MUST be registered in the
  plugin registry introduced by feature 006, with id `widgets-lab`,
  declaring supported platforms `['ios', 'android', 'web']` and
  `minIOS: '14.0'` (WidgetKit Home Screen widgets are iOS 14+).
- **FR-002**: The Modules home grid MUST display the Widgets Lab
  card alongside other registered modules using the same card
  visual treatment, with the iOS-version gating handled by spec
  006's existing `minIOS` mechanism (no parallel gating in this
  module).
- **FR-003**: Tapping the Widgets Lab card MUST navigate to the
  Widgets Lab screen via the registry's standard navigation flow.
- **FR-004**: On iOS versions below 14.0, the registry's `minIOS`
  gating MUST mark the card as unavailable per spec 006; the
  module MUST NOT attempt to load the Widget Center Swift bridge
  on those versions.

#### WidgetKit widget definition (iOS 14+)

- **FR-005**: The module MUST define exactly one Home Screen
  widget kind, exposed to the system as a single entry in the
  iOS widget gallery and addressable as kind identifier
  `SpotShowcaseWidget`. No additional widget kinds MUST be
  exposed in this feature.
- **FR-006**: The widget MUST support exactly three size families:
  `.systemSmall`, `.systemMedium`, and `.systemLarge`. No other
  families (Lock Screen, accessory rectangular / circular /
  inline, StandBy) MUST be declared in this feature.
- **FR-007**: The widget MUST be declared with `StaticConfiguration`
  (no Intent / `IntentConfiguration`); user-facing per-widget
  configuration is explicitly out of scope for this feature.
- **FR-008**: The widget MUST be discoverable in Apple's widget
  gallery search by the user-visible display name "spot showcase"
  (case-insensitive), and MUST present a one-line description
  visible in the gallery suitable for non-technical users.

#### TimelineProvider & timeline policy

- **FR-009**: The widget's timeline provider MUST implement the
  three required `TimelineProvider` methods: `placeholder`,
  `getSnapshot`, and `getTimeline`. `placeholder` MUST return a
  hardcoded preview-friendly entry that does not depend on the App
  Group (because the system may render placeholders before the
  app has run).
- **FR-010**: `getSnapshot` MUST read the current configuration
  from the shared App Group `UserDefaults` suite and return a
  `ShowcaseEntry` reflecting that configuration; on read failure
  it MUST return the documented default configuration entry rather
  than throwing.
- **FR-011**: `getTimeline` MUST read the current configuration
  from the shared App Group `UserDefaults` suite, build a single
  `ShowcaseEntry` dated `now`, and return a timeline whose reload
  policy schedules the next refresh at a documented cadence (e.g.
  every 30 minutes) so the widget keeps refreshing even without
  an explicit `reloadAllTimelines()` call.
- **FR-012**: A `ShowcaseEntry` MUST contain at minimum the fields
  `date: Date`, `showcaseValue: String`, `counter: Int`, and
  `tint: Tint` where `Tint` enumerates the four documented
  swatches.

#### SwiftUI widget views

- **FR-013**: The widget MUST be rendered by a single SwiftUI view
  (e.g. `ShowcaseWidgetView`) that branches on
  `widgetFamily` and presents a layout appropriate to each of
  `.systemSmall`, `.systemMedium`, and `.systemLarge`.
- **FR-014**: All three size layouts MUST display the showcase
  value as the primary headline, the counter as a prominent
  numeric element, and use the configured tint as the dominant
  accent colour. The Small layout MAY abbreviate or truncate as
  needed to fit; the Medium and Large layouts MUST display the
  full showcase value.
- **FR-015**: The widget views MUST not perform any network calls,
  any disk reads other than the App Group `UserDefaults` suite
  read already performed by the timeline provider, or any
  long-running computation; rendering MUST complete within
  WidgetKit's documented per-render budget.

#### App Group & shared storage

- **FR-016**: The main app target and the widget extension target
  MUST both be members of a shared App Group whose identifier is
  derived from `ios.bundleIdentifier` in `app.json` (default form
  `group.<bundle-id>.showcase`, e.g.
  `group.com.izkizk8.spot.showcase`); the exact identifier MUST be
  documented in the planning artifact and used consistently by
  both targets.
- **FR-017**: All shared widget configuration MUST be stored in a
  single `UserDefaults(suiteName: <appGroupId>)` suite under
  documented keys (at minimum `showcaseValue`, `counter`, `tint`).
  No other persistence mechanism (file system, Core Data, Keychain)
  MUST be used for widget configuration in this feature.
- **FR-018**: The App Group entitlement MUST be configured by the
  Expo config plugin at prebuild time on both the main app target
  and the widget extension target; no manual Xcode configuration
  step MUST be required of the developer.

#### JS bridge

- **FR-019**: The module MUST expose a JS bridge module at
  `src/native/widget-center.ts` exporting at minimum:
  `reloadAllTimelines(): Promise<void>`,
  `getCurrentConfig(): Promise<WidgetConfig | null>`,
  `setConfig(config: WidgetConfig): Promise<void>`, and
  `isAvailable(): boolean`. `isAvailable()` MUST return `true`
  only on iOS 14+ with the native bridge present, and `false`
  otherwise.
- **FR-020**: On non-iOS platforms and on iOS < 14, calls to
  `reloadAllTimelines`, `getCurrentConfig`, or `setConfig` MUST
  throw a `WidgetCenterNotSupported` error (or equivalent named
  error) rather than silently returning a default value, so the
  JS-only fallback path is forced to detect platform availability
  up front. `isAvailable()` MUST NOT throw; it MUST return `false`
  on these platforms.
- **FR-021**: On iOS 14+, `setConfig` MUST write the supplied
  configuration to the App Group `UserDefaults` suite under the
  documented keys; `getCurrentConfig` MUST read those same keys
  and return the documented default configuration when the suite
  is empty; `reloadAllTimelines` MUST invoke
  `WidgetCenter.shared.reloadAllTimelines()` and resolve once the
  call has been issued (it does not wait for the system to
  actually re-render any widget).

#### Screen layout

- **FR-022**: The Widgets Lab screen MUST present a header with
  the title "Widgets Lab".
- **FR-023**: On iOS 14+ the screen MUST present, in this fixed
  top-to-bottom order: (a) a status panel showing the data the
  widget would currently display (showcase value, counter, tint,
  next refresh time); (b) a configuration panel containing a
  showcase-value text field, a counter input, a four-swatch tint
  picker, and a "Push to widget" button; (c) a setup
  instructions card explaining how to add the widget to the Home
  Screen; (d) three RN-rendered preview cards approximating
  Small / Medium / Large; (e) a reload event log showing the
  last 10 reload events with timestamp.
- **FR-024**: On Android, Web, and iOS < 14 the screen MUST
  present, in this fixed top-to-bottom order: (a) a "Home Screen
  Widgets are iOS only" banner; (b) the same configuration panel
  with a visibly disabled "Push to widget" button and an inline
  explanation; (c) the same three RN-rendered preview cards. The
  status panel's "next refresh time" line, the setup
  instructions card, and the reload event log MUST NOT be shown
  on these platforms.

#### Configuration panel

- **FR-025**: The showcase-value text field MUST accept any
  printable string and MUST be initialised on first render to the
  documented default `"Hello, Widget!"`. Empty / whitespace-only
  input MUST be handled per the Edge Cases section consistently
  on the iOS push path and in the previews.
- **FR-026**: The counter input MUST accept signed integer input
  and MUST be initialised on first render to the documented
  default `0`. Out-of-range values MUST be handled per the Edge
  Cases section consistently on the iOS push path and in the
  previews.
- **FR-027**: The tint picker MUST present exactly four swatches
  (the `Tint` enum from FR-012); a default selection MUST be set
  on first render and the chosen default MUST be documented.
- **FR-028**: Tapping "Push to widget" on iOS 14+ MUST call
  `setConfig` with the current configuration values and MUST then
  call `reloadAllTimelines`; on success it MUST surface a
  user-visible confirmation and MUST prepend a new entry to the
  reload event log; on failure it MUST surface a user-visible
  error and MUST prepend a clearly-marked failure entry to the
  reload event log.

#### Status panel

- **FR-029**: The status panel MUST display the showcase value,
  the counter, the tint, and (on iOS 14+) a next-refresh-time
  line indicating when the widget's TimelineProvider is next
  scheduled to read the App Group; the values MUST be the values
  most recently read by the screen from `getCurrentConfig`, not
  the in-flight edits in the configuration panel.
- **FR-030**: The status panel MUST refresh when the user pushes
  a new configuration so the displayed values stay consistent
  with what the real widget will read.

#### Setup instructions card (iOS 14+ only)

- **FR-031**: The setup instructions card MUST contain a numbered
  step list explaining how to add the spot-showcase widget to the
  Home Screen, including at minimum: long-press the Home Screen,
  tap +, search "spot showcase", pick a size, tap Add Widget.
- **FR-032**: The setup instructions card MUST be hidden on
  Android, Web, and iOS < 14 (per FR-024) since no widget
  gallery exists on those platforms.

#### Preview cards (all platforms)

- **FR-033**: The three RN-rendered preview cards MUST be
  labelled Small, Medium, and Large and MUST render layouts
  visually approximating the corresponding WidgetKit families
  using the same configuration data the user has currently
  selected in the configuration panel.
- **FR-034**: Edits to any field in the configuration panel MUST
  update all three preview cards within the same render pass;
  the previews MUST NOT depend on a successful "Push to widget"
  call.
- **FR-035**: The previews MUST honour the four tint swatches as
  the dominant accent colour in each card so the user can
  preview tint choices before pushing them to the real widget.

#### Reload event log (iOS 14+ only)

- **FR-036**: The reload event log MUST be backed by an in-memory
  ring buffer of capacity exactly 10, implemented with a local
  React reducer; it MUST NOT be persisted across screen
  unmounts. When a new entry is added beyond the buffer's
  capacity, the oldest entry MUST be evicted.
- **FR-037**: Each reload event log entry MUST display, at
  minimum, a timestamp formatted in the user's locale and a
  status indicator (success / failure); failure entries MUST
  include a short error message.
- **FR-038**: On first mount with no entries, the reload event
  log MUST render an explicit empty-state line ("No reloads
  yet"), not an empty list with no affordance.

#### Native packaging

- **FR-039**: The Swift sources defining the widget — at minimum
  `ShowcaseWidget.swift` (declares the `WidgetConfiguration`),
  `ShowcaseProvider.swift` (`TimelineProvider`),
  `ShowcaseEntry.swift` (`TimelineEntry`), and
  `ShowcaseWidgetView.swift` (SwiftUI view) — MUST live under
  `native/ios/home-widgets/` in the repository, and MUST be added
  to the iOS widget extension target by a TypeScript Expo config
  plugin at `plugins/with-home-widgets/` invoked at `expo
  prebuild` time.
- **FR-040**: The widget MUST be added to the *existing* widget
  extension target introduced by feature 007 via a `WidgetBundle`
  declaration that exposes both the existing 007 widget(s) and
  the new `SpotShowcaseWidget`. A separate widget extension
  target MUST NOT be created by this feature.
- **FR-041**: The `with-home-widgets` config plugin MUST be
  idempotent (running prebuild twice MUST produce the same Xcode
  project state) and MUST NOT modify, remove, or otherwise
  conflict with files added by feature 007's `with-live-activity`
  plugin or any other existing config plugin in `plugins/`.
- **FR-042**: The Swift bridge module backing
  `src/native/widget-center.ts` MUST live in the main app target
  (not the widget extension target) so it can call
  `WidgetCenter.shared.reloadAllTimelines()` from the host
  process.
- **FR-043**: On non-iOS targets, no symbol from the native
  Widget Center bridge MUST be imported or evaluated at module
  load time; the iOS-only native bridge MUST be loaded only on
  iOS and only when the device meets the iOS 14+ requirement.

#### Lifecycle

- **FR-044**: Navigating away from the Widgets Lab screen MUST
  tear down the screen cleanly: no asynchronous bridge callbacks
  MUST update React state after unmount; no layout warnings MUST
  be emitted; the in-memory reload event log MUST be discarded
  on unmount per FR-036.
- **FR-045**: When the app is backgrounded with the screen
  visible and returns to foreground, the status panel MUST
  refresh from `getCurrentConfig` so any externally-changed App
  Group state is reflected.

#### Accessibility

- **FR-046**: The showcase-value text field, the counter input,
  the four tint swatches, the "Push to widget" button, the three
  preview cards, the setup instruction steps, and the reload
  event log rows MUST each expose an accessibility label
  describing their function (e.g. "Showcase value", "Counter",
  "Tint: blue", "Push to widget", "Small preview", "Add widget
  step 1 of 5", "Reload at 14:02 succeeded").
- **FR-047**: The "Home Screen Widgets are iOS only" banner on
  Android / Web / iOS < 14 MUST expose its message to assistive
  technologies as a single accessible announcement on screen
  mount.
- **FR-048**: The four tint swatches MUST be distinguishable to
  users who cannot perceive colour differences (e.g. via
  accessibility labels naming the tint and / or a non-colour
  selection indicator such as a checkmark on the active swatch).

#### Architecture & quality

- **FR-049**: The module's source MUST live under
  `src/modules/widgets-lab/` with at minimum: `index.tsx`
  (manifest), `screen.tsx` plus the platform variants
  `screen.android.tsx` and `screen.web.tsx` (and any additional
  variants required to keep iOS-only imports off non-iOS
  targets), and a `components/` directory containing at least
  `StatusPanel`, `ConfigPanel`, `SetupInstructionsCard`,
  `PreviewCardSmall`, `PreviewCardMedium`, `PreviewCardLarge`,
  and `ReloadEventLog`.
- **FR-050**: The JS bridge MUST live at
  `src/native/widget-center.ts`; the Expo config plugin MUST
  live at `plugins/with-home-widgets/`; the Swift sources MUST
  live at `native/ios/home-widgets/`. No other directory in the
  repository MUST be created or modified by this feature.
- **FR-051**: The module MUST be registered with the registry
  via a single import line and a single array entry added to
  `src/modules/registry.ts`. The only other file outside the
  directories enumerated in FR-050 that MAY be modified is
  `app.json` (one entry added to the plugins array for
  `with-home-widgets`). No other file MUST be modified by this
  feature; in particular, files belonging to features 006, 007,
  008, 009, 010, 011, 012, and 013 MUST NOT be touched (a
  defensive comment in feature 007's `with-live-activity` plugin
  acknowledging the shared widget extension target is permitted
  if necessary, but no behavioural change to 007 is permitted).
- **FR-052**: All component state (showcase value, counter,
  tint, push status, reload event log) MUST be local component
  state; no new global stores, contexts, or persistence layers
  in JS MUST be introduced by this feature. The App Group
  `UserDefaults` suite is the *only* new persistence surface and
  it lives on the native side per FR-017.
- **FR-053**: All styles MUST use `StyleSheet.create()` and the
  centralized theme tokens (`Spacing`, theme colours via the
  project's themed primitives, `ThemedText` / `ThemedView`); no
  hardcoded colours and no inline style objects outside
  StyleSheet.
- **FR-054**: TypeScript strict mode and the existing path
  aliases (`@/*`) MUST be honoured; no relaxations or new
  lint / test tooling MUST be introduced.
- **FR-055**: All quality gates (`pnpm check`: format, lint,
  typecheck, test) MUST pass before the feature is considered
  complete. The constitution at `.specify/memory/constitution.md`
  v1.0.1 MUST pass uniformly; this feature does not request any
  constitutional exemption.
- **FR-056**: Tests MUST cover, at minimum, the following
  JS-pure files in line with constitutional Principle V
  (Test-First):
  `native/widget-center.test.ts` (bridge contract: non-iOS stubs
  throw `WidgetCenterNotSupported`, `isAvailable()` returns
  `false` without throwing, iOS path delegates to a mocked
  native module);
  `plugins/with-home-widgets/index.test.ts` (registers the Swift
  sources from `native/ios/home-widgets/`, configures the App
  Group entitlement on both main app and widget extension
  targets, adds the new widget to the existing 007 widget
  extension `WidgetBundle`, is idempotent across repeated
  invocations, does not modify feature 007's `with-live-activity`
  plugin behaviour);
  `components/StatusPanel.test.tsx`,
  `components/ConfigPanel.test.tsx`,
  `components/SetupInstructionsCard.test.tsx`,
  `components/PreviewCardSmall.test.tsx`,
  `components/PreviewCardMedium.test.tsx`,
  `components/PreviewCardLarge.test.tsx`, and
  `components/ReloadEventLog.test.tsx`;
  `screen.test.tsx`, `screen.android.test.tsx`, and
  `screen.web.test.tsx` (banner shown on non-iOS, push button
  disabled on non-iOS, previews interactive on all platforms,
  mocked bridge on iOS path);
  `manifest.test.ts` (asserts `id === 'widgets-lab'`,
  `platforms === ['ios','android','web']`,
  `minIOS === '14.0'`, `render` is a function).
- **FR-057**: The Swift sources are not unit-testable on the
  Windows-based developer environment used by this repository;
  the feature MUST therefore document explicit on-device
  verification steps in the planning artifact `quickstart.md`
  (open the Widgets Lab card on iOS 14+; add the widget to the
  Home Screen at each of the three sizes; push a recognisable
  configuration; confirm each Home Screen widget refreshes
  within one second; confirm the reload event log records the
  push; remove and re-add the widget at a different size and
  confirm the configuration is preserved).

### Key Entities

- **WidgetConfig**: The shared configuration the user pushes
  from the app to the widget. Shape:
  `{ showcaseValue: string, counter: number, tint: Tint }`. Lives
  in the App Group `UserDefaults` suite under documented keys
  and is read by both the iOS bridge (`getCurrentConfig`) and
  the widget's TimelineProvider.
- **Tint**: One of four documented swatches (the exact four are
  resolved during planning). Drives both the Swift `Tint` enum
  used by the widget views and the four-swatch picker in the
  configuration panel.
- **ShowcaseEntry**: The Swift `TimelineEntry` returned by the
  TimelineProvider. Shape: `{ date: Date, showcaseValue: String,
  counter: Int, tint: Tint }`. Built from the App Group
  `UserDefaults` suite at `getSnapshot` and `getTimeline` time;
  defaulted in `placeholder` and on read failure.
- **AppGroupSuite**: The `UserDefaults(suiteName:)` instance
  shared between the main app target and the widget extension
  target, identified by an App Group identifier derived from
  `ios.bundleIdentifier` per FR-016. The single source of truth
  for widget configuration.
- **ReloadEvent**: An entry in the in-memory reload event log.
  Shape: `{ id, timestamp, status, errorMessage? }` where
  `status` is one of `success` or `failure`. The log is a ring
  buffer of capacity exactly 10.
- **WidgetCenterAvailability**: Per-render flag derived from the
  runtime platform and iOS version; `true` iff iOS 14+ with the
  native bridge present. Drives whether the iOS-only status
  panel "next refresh time" line, setup instructions card, and
  reload event log render, and whether the "Push to widget"
  button is enabled.
- **WidgetFamilyPreview**: One of the three RN-rendered preview
  cards (Small / Medium / Large). Each preview consumes the same
  `WidgetConfig` the configuration panel is currently editing
  and renders a layout approximating the corresponding WidgetKit
  family.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user lands on the Modules home grid on an iOS
  14+ device, opens the Widgets Lab, follows the setup
  instructions card, and successfully adds a spot-showcase
  widget to the Home Screen at a chosen size within 90 seconds
  without consulting external docs.
- **SC-002**: 100% of "Push to widget" taps on iOS 14+ result
  in the App Group `UserDefaults` suite reflecting the new
  configuration on the next read by either the bridge
  (`getCurrentConfig`) or the widget's TimelineProvider.
- **SC-003**: 100% of "Push to widget" taps on iOS 14+ with at
  least one spot-showcase widget on the Home Screen result in
  every installed spot-showcase widget refreshing to display
  the pushed showcase value, counter, and tint within one
  second of the tap.
- **SC-004**: The reload event log displays exactly the 10 most
  recent reloads in 100% of states; the 11th reload evicts the
  oldest entry; the log is discarded on screen unmount; the
  empty-state line is shown on first mount.
- **SC-005**: The widget gallery on iOS 14+ surfaces the
  spot-showcase widget under a search for "spot showcase" with
  exactly three size options (Small / Medium / Large) in 100%
  of fresh dev-build installs verified.
- **SC-006**: A freshly added widget — added before any
  configuration has ever been pushed — renders the documented
  default configuration (showcase value "Hello, Widget!",
  counter `0`, documented default tint) in 100% of fresh
  installs verified, with no broken-widget chrome.
- **SC-007**: All three RN-rendered preview cards (Small,
  Medium, Large) update in the same render pass as edits to
  the configuration panel in 100% of edit operations on every
  supported platform (iOS 14+, Android, Web, iOS < 14).
- **SC-008**: On Android, Web, and iOS < 14, opening the
  Widgets Lab produces zero runtime errors related to missing
  iOS-only WidgetKit symbols; the "Home Screen Widgets are iOS
  only" banner is shown; the configuration panel and the three
  preview cards are interactive; the "Push to widget" button is
  visibly disabled with an inline explanation; any direct call
  to `reloadAllTimelines`, `getCurrentConfig`, or `setConfig`
  throws a `WidgetCenterNotSupported` error rather than
  silently no-oping; `isAvailable()` returns `false` without
  throwing.
- **SC-009**: On iOS 14+, the Widgets Lab card is shown and
  the iOS-only status panel + setup instructions card + reload
  event log are rendered; on iOS < 14 the registry's
  `minIOS: '14.0'` gating marks the card as unavailable per
  spec 006 and the iOS-only Widget Center bridge symbol is
  never imported.
- **SC-010**: The change is purely additive at the registry
  level: exactly one import line and one array entry are added
  to `src/modules/registry.ts`; exactly one array entry is
  added to `app.json` for the `with-home-widgets` plugin; no
  other file outside `src/modules/widgets-lab/`,
  `src/native/widget-center.ts`, `plugins/with-home-widgets/`,
  and `native/ios/home-widgets/` is modified by this feature;
  in particular features 006, 007, 008, 009, 010, 011, 012,
  and 013 source files are untouched (a single defensive
  comment in feature 007's `with-live-activity` plugin
  acknowledging the shared widget extension target is the only
  permitted exception per FR-051).
- **SC-011**: The `with-home-widgets` Expo config plugin is
  idempotent across repeated `expo prebuild` runs (re-running
  prebuild produces an identical Xcode project state),
  configures the App Group entitlement on both the main app
  target and the widget extension target, registers the new
  widget into the existing 007 widget extension via
  `WidgetBundle`, and does not change the behaviour of feature
  007's `with-live-activity` plugin in 100% of plugin
  unit-test runs.
- **SC-012**: The widget's `placeholder`, `getSnapshot`, and
  `getTimeline` methods all complete within WidgetKit's
  documented per-call budget on a representative iOS 14+
  device; no widget render produces broken-widget chrome on
  the Home Screen across 100% of on-device verification runs.
- **SC-013**: All quality gates (`pnpm check`) pass on the
  feature branch with no warnings introduced by this module.

## Out of Scope

The following are explicitly **not** part of this feature and
will be deferred to a future spec if pursued:

- Interactive widgets backed by App Intents (Button / Toggle
  inside the widget body). The widget in this feature is
  display-only; tapping it deep-links into the app via the
  default widget tap behaviour only.
- `IntentConfiguration` and per-widget user configuration via an
  `AppIntent`. The widget in this feature uses
  `StaticConfiguration`; any per-widget configuration would
  require a new spec.
- Lock Screen widgets and accessory families
  (`.accessoryRectangular`, `.accessoryCircular`,
  `.accessoryInline`).
- StandBy mode rendering optimisations beyond what falls out of
  the three system families declared.
- Multiple widget kinds (e.g. a second widget alongside the
  spot-showcase widget). Exactly one new widget kind is in scope.
- APNs-driven widget reloads (`WidgetCenter.reloadAllTimelines`
  triggered by a remote push). Reloads in this feature are
  app-driven from the in-app "Push to widget" button only.
- Live Activities (already covered by feature 007) and App
  Intents (already covered by feature 013); this feature adds
  Home Screen widgets distinct from both.
- A unit-tested Swift implementation: Swift code is not
  unit-tested on the Windows-based developer environment used by
  this repository, and on-device verification steps are
  documented per FR-057 instead.
- Localization of the widget's user-visible display name,
  description, or any in-widget copy beyond the user-supplied
  showcase value.
- Migration of widget configuration from any pre-existing store;
  the App Group `UserDefaults` suite is brand-new for this
  feature.

## Assumptions

- The plugin registry from feature 006 is in place, supports
  modules declaring `platforms: ['ios', 'android', 'web']`
  together with a `minIOS` value, and already gates module
  visibility by iOS version per spec 006's existing dispatch.
- Apple's WidgetKit framework is available on iOS 14 and later
  and exposes `Widget`, `StaticConfiguration`, `TimelineProvider`,
  `TimelineEntry`, the three system families
  (`.systemSmall` / `.systemMedium` / `.systemLarge`),
  `WidgetBundle`, and `WidgetCenter.shared.reloadAllTimelines()`
  on the host process side.
- Feature 007 already ships an iOS widget extension target into
  which a second widget can be additively introduced via a
  `WidgetBundle` declaration; the extension target's deployment
  target is iOS 14 or lower, allowing the Home Screen widget
  family declared by this feature to compile.
- The `ios.bundleIdentifier` value in `app.json` is stable across
  prebuilds and is in a form from which an App Group identifier
  (`group.<bundle-id>.showcase`) can be deterministically
  derived.
- Both the main app target and the widget extension target can
  be added to the App Group entitlement by an Expo config plugin
  at `expo prebuild` time without requiring any manual Xcode
  configuration step on the developer's machine; if this
  assumption fails, the planning phase will document the manual
  step in `quickstart.md`.
- Feature 007's `with-live-activity` config plugin restricts its
  modifications to its own files and to the widget extension
  target's `WidgetBundle` in a way that allows
  `with-home-widgets` to additively add a second widget to the
  same bundle without a behavioural conflict; the planning
  research will confirm this and document the resolution.
- The existing themed primitives (`ThemedView`, `ThemedText`,
  `Spacing`, theme colour tokens) are sufficient for all screen
  chrome, banner, panel, card, preview, and log visuals in this
  module; the four tint swatches will be sourced either from
  existing theme tokens or as a small documented swatch palette
  added inside the module's directory.
- The constitution at `.specify/memory/constitution.md` v1.0.1
  applies uniformly; this feature does not request any
  constitutional exemption.

## Notes

The three planning-time clarifications below are recorded in the
spec as `[NEEDS CLARIFICATION]` markers and will be resolved
during `/speckit.clarify` (or autonomously during `/speckit.plan`
using the recommended defaults captured here, mirroring feature
013's resolution pattern).

- **[NEEDS CLARIFICATION]** the four tint swatches: which exact
  four colours? Recommended default: borrow the four accent
  colours already defined in the project's theme tokens (or, if
  none of that shape exist, four named SwiftUI system colours
  such as `.blue`, `.green`, `.orange`, `.pink` mirrored on the
  JS side as four named theme tokens). Resolution must produce
  one Swift `Tint` enum and one matching JS `Tint` enum with the
  same four names.
- **[NEEDS CLARIFICATION]** the documented default tint: which
  of the four swatches is selected on first render and stored as
  the default in the App Group when no configuration has been
  pushed? Recommended default: the first swatch in the canonical
  ordering established by the resolution above (e.g. `blue`),
  applied identically in the configuration panel, the previews,
  and the widget's `placeholder` / default-on-read-failure
  paths.
- **[NEEDS CLARIFICATION]** the timeline refresh cadence used by
  `getTimeline`: every how many minutes does the widget schedule
  its next refresh in the absence of an explicit
  `reloadAllTimelines()` call? Recommended default: every 30
  minutes, which is generous enough to avoid waking the widget
  extension excessively, frequent enough that "the widget is
  alive" is observable on-device without an in-app push, and
  well within WidgetKit's documented budget.
