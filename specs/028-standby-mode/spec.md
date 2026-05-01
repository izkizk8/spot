# Feature Specification: StandBy Mode Showcase Module

**Feature Branch**: `028-standby-mode`
**Feature Number**: 028
**Created**: 2026-04-30
**Status**: Approved (autonomous, no clarifications needed)
**Input**: iOS 17+ module showcasing how to make WidgetKit
widgets render correctly in **StandBy Mode** (iPhone charging,
held in landscape). StandBy is built FROM widgets — there is no
separate "StandBy SDK". This module therefore demonstrates how
to opt a widget into the StandBy experience by branching on
`@Environment(\.widgetRenderingMode)`, declaring
`.systemMedium` / `.systemLarge` families, and supplying
`.widgetAccentedRenderingMode(.accented)` so the Smart Stack
view in StandBy renders the widget with the documented
`.fullColor` / `.accented` / `.vibrant` rendering modes. Builds
additively on feature 014's existing widget extension target
and shared App Group; adds one more widget kind
(`SpotStandByWidget`) to the SAME `WidgetBundle` — this feature
does NOT create a new extension target. Branch parent is
027-lock-screen-widgets.

## Overview

The StandBy Mode module ("StandBy Mode") is a feature card in
the iOS Showcase registry (`id: 'standby-lab'`, label
`"StandBy Mode"`, `platforms: ['ios','android','web']`,
`minIOS: '17.0'`). Tapping the card opens a single screen with
six panels arranged in a fixed top-to-bottom order:

1. **Explainer card** — what StandBy Mode is, when iOS
   activates it (charging + landscape + locked, iOS 17+), how
   widgets render in the Smart Stack view, and how the three
   rendering modes (`.fullColor`, `.accented`, `.vibrant`)
   differ visually.
2. **Configuration panel** — same control shape as 014's home
   widget config (a showcase-value text field defaulting to
   `"StandBy"`, a signed-integer counter defaulting to `0`,
   and a four-swatch tint picker). The panel feeds the
   StandBy widget kind only; 014's home-widget config and
   027's lock-screen config remain untouched. The panel also
   exposes a fourth control — the rendering-mode segmented
   picker (see panel 3) — co-located with the data controls
   so the user authors data and rendering mode together
   before pushing.
3. **Rendering-mode segmented picker** — three segments,
   `.fullColor` / `.accented` / `.vibrant`. The selected
   segment is persisted as the `mode` field of the StandBy
   config and is read by the live preview panel (panel 4) and
   the native StandBy widget views (which branch on
   `@Environment(\.widgetRenderingMode)` at render time).
4. **Live StandBy preview** — RN-rendered preview of how the
   StandBy widget appears in the Smart Stack view: a wide
   landscape card approximating `.systemMedium` / `.systemLarge`
   families with large numerals, a high-contrast monochrome +
   tint approximation for `.accented`, a translucent
   neon-style approximation for `.vibrant`, and a saturated
   `.fullColor` approximation. The preview re-renders within
   the same render pass when the user changes the
   rendering-mode segment, the showcase value, the counter,
   or the tint.
5. **Push to StandBy widget button** — writes the current
   draft (showcase value + counter + tint + mode) to the App
   Group under the StandBy-config key namespace and then
   calls `WidgetCenter.shared.reloadTimelines(ofKind:
   "SpotStandByWidget")` via the JS bridge (a per-kind reload,
   NOT a global `reloadAllTimelines`). The button lives at
   the bottom of the Configuration panel (panel 2), grouping
   write actions with the controls that produce them.
6. **Setup instructions card** — numbered step list explaining
   how the user enters StandBy on a real device: open
   Settings → StandBy → enable StandBy; charge the phone with
   a MagSafe / Qi puck or Lightning / USB-C cable; place the
   phone on its side in landscape; lock the screen; the
   StandBy view appears; swipe vertically on the right widget
   stack until the spot StandBy widget surfaces.
7. **Reload event log** — independent FIFO log of the last 10
   per-kind reload events for `SpotStandByWidget`, kept
   in-memory for the lifetime of the screen. Per the
   autonomously-resolved DECISION below, the log is keyed per
   widget kind (StandBy reloads do NOT appear in 014's or
   027's logs and vice versa), so the three demos never
   contaminate each other's event history.

The feature is purely additive at the integration boundary:

1. `src/modules/registry.ts` — one new import line + one new
   array entry (registry size +1). No existing entry is
   modified.
2. `app.json` `plugins` array — one new entry
   (`./plugins/with-standby-widget`). Coexists with all prior
   plugins including 007's `with-live-activity`, 013's
   `with-app-intents`, 014's `with-home-widgets`, 026's
   `with-rich-notifications`, and 027's `with-lock-widgets`.
3. `package.json` / `pnpm-lock.yaml` — **no new runtime
   dependency**. WidgetKit ships with iOS; the JS bridge
   extends `src/native/widget-center.ts` and the AsyncStorage
   shadow store reuses the dependency 014 already brought in.
4. `plugins/with-standby-widget/` — new Expo config plugin
   that idempotently APPENDS the new Swift files
   (`StandByWidget.swift`, `StandByProvider.swift`,
   `StandByEntry.swift`, `StandByViews.swift`) to the existing
   widget extension target introduced by feature 014, and
   inserts a marker-guarded edit into 014's `WidgetBundle`
   source that adds one more `StandByWidget()` entry between
   the documented marker comments. The plugin MUST NOT create
   a new extension target, MUST NOT modify any 014 or 027
   plugin file, and MUST NOT regress those plugins on
   re-prebuild. The plugin MUST be commutative with 014 and
   027 (the order of the three plugin entries in `app.json`
   MUST NOT affect the final Xcode project state).
5. `src/native/widget-center.ts` — extended (additively) with
   `setStandByConfig(config) / getStandByConfig()` helpers
   following the per-kind setter / getter pattern 027 already
   established. The existing `reloadAllTimelines`,
   `reloadTimelinesByKind`, `setConfig`, `getCurrentConfig`,
   `setLockConfig`, `getLockConfig`, and `isAvailable` symbols
   MUST NOT be removed or renamed.

No existing module, screen, plugin, or registry entry is
modified beyond the documented additive lines above. Features
007 (Live Activities), 013 (App Intents), 014 (Home Widgets),
024 (MapKit), 025 (Core Location), 026 (Rich Notifications),
and 027 (Lock Screen Widgets) continue to work unchanged.

## Goals

- Demonstrate iOS 17+ StandBy Mode by extending the existing
  WidgetKit pipeline — not by introducing a new SDK — proving
  the showcase principle that StandBy is a *rendering
  surface* for widgets, not a separate framework.
- Cover all three documented widget rendering modes that
  StandBy exposes (`.fullColor`, `.accented`, `.vibrant`) so a
  reviewer can compare the same widget in three visual states
  side-by-side and understand when each mode applies.
- Prove that an Expo app can ship a StandBy-aware widget
  without spawning a new extension target — by ADDING one
  more widget kind (with `.systemMedium` / `.systemLarge`
  families) to 014's existing `WidgetBundle` through an
  idempotent, marker-guarded config plugin edit.
- Provide a self-contained authoring loop (configure data +
  pick rendering mode → push → see preview update → place
  phone in StandBy and observe widget refresh → see per-kind
  reload event in the log) that a reviewer can exercise
  end-to-end with no external dependencies.
- Demonstrate the use of `.widgetAccentedRenderingMode(.accented)`
  on the widget configuration so the Smart Stack view in
  StandBy renders the widget with the correct accent
  treatment.
- Demonstrate `.widgetURL(_:)` deep-link annotation on the
  StandBy views so tapping the widget while charging launches
  the app at the StandBy module screen rather than the
  default landing route.
- Keep the integration footprint minimal: one registry line,
  one plugin entry, zero new runtime dependencies, one Swift
  file per conceptual responsibility.

## Non-Goals

- **No new widget extension target.** All Swift files added
  by this feature land in 014's existing extension target via
  the config plugin's marker-guarded edit. Creating a
  separate target is explicitly forbidden by FR-SB-018 below.
- **No iOS < 17 support.** StandBy Mode is an iOS 17+
  capability. The card is gated by `minIOS: '17.0'`; older
  iOS versions, Android, and Web see only the in-app
  preview half plus the iOS-17-only banner.
- **No new accessory families.** The 027 lock-screen
  accessory families (`.accessoryRectangular`,
  `.accessoryCircular`, `.accessoryInline`) belong to that
  feature. StandBy renders existing system families
  (`.systemMedium`, `.systemLarge`) — this feature declares
  exactly those two and no others on the StandBy widget
  kind.
- **No interactive widgets (App Intents in widgets).** The
  StandBy widget is render-only; no `Button(intent:)` or
  `Toggle(intent:)` is declared. App Intents belong with
  feature 013.
- **No remote configuration of the widget.** Configuration
  is authored exclusively in-app and pushed via the App
  Group; no APNs background refresh, no server-side push.
- **No Always-On Display (AOD) optimisation beyond what
  StandBy itself provides.** AOD on iPhone 14 Pro / 15 Pro
  is implicit when StandBy is enabled with the device dimmed;
  this feature does not add separate `.alwaysOn` rendering
  mode handling.
- **No editing of 014's plugin, registry entry, screen,
  Swift sources, App Group key layout, OR 027's plugin /
  screen / Swift sources.** The only edit to a 014 file is a
  single marker-guarded insertion into the `WidgetBundle`
  source performed by 028's plugin at prebuild time
  (identical mechanism to 027's). 027's `WidgetBundle`
  insertion remains untouched.
- **No editing of any prior module, plugin, screen, or
  registry entry** beyond the additive registry / plugin /
  bridge lines and the marker-guarded `WidgetBundle`
  insertion described above.
- **No clock / weather / calendar widget look-alikes.** The
  showcase widget displays the user-authored showcase value +
  counter + tint, not system data, to keep the demo focused
  on the StandBy *rendering pipeline* rather than on
  imitating Apple's first-party StandBy widgets.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Configure data, pick a rendering mode, and push it to a real StandBy widget on iOS 17+ (Priority: P1)

A user opens the Spot iOS Feature Showcase on an iPhone
running iOS 17 or later, sees a "StandBy Mode" card on the
Modules home grid, and taps it. They land on a screen titled
"StandBy Mode" that opens with an explainer card describing
when iOS activates StandBy. Below the explainer they see the
configuration panel (showcase value, counter, tint, plus a
three-segment rendering-mode picker — `.fullColor` /
`.accented` / `.vibrant`), the live StandBy preview card
mirroring the current selection, the "Push to StandBy widget"
button, the setup instructions card, and the reload event
log. They edit the showcase value to `"Demo at 14:02"`, bump
the counter, pick the orange tint, switch the rendering-mode
segment to `.accented`, watch the preview re-render
immediately as a high-contrast monochrome+orange-tint card,
and tap "Push to StandBy widget". The screen confirms the
push happened, the per-kind reload event log immediately
gains a new entry tagged with the kind `SpotStandByWidget`,
and any spot StandBy widget already added to the user's
StandBy stack refreshes within a second to display the new
values in the chosen rendering mode and tint.

**Why P1**: This is the smallest end-to-end slice that proves
the module's core promise — a StandBy-aware widget driven by
app-controlled data and rendering-mode selection through the
same App Group 014 established, with refreshes triggered by
an explicit per-kind reload call. It exercises the registry
entry, the iOS 17 gating, the JS bridge extension
(`setStandByConfig` + `reloadTimelinesByKind`), the Swift
TimelineProvider, the App Group `UserDefaults` suite (under
the StandBy-config key namespace), the SwiftUI views that
branch on `@Environment(\.widgetRenderingMode)`, the
`.widgetAccentedRenderingMode(.accented)` configuration
modifier, and the per-kind reload event log in one
round-trip. Without this slice the rest of the module has
nothing to demonstrate.

**Independent Test**: Install a dev build on an iPhone
running iOS 17+, add a spot StandBy widget to the StandBy
stack (per Story 2), open the Modules grid, tap the
"StandBy Mode" card. Change the showcase value to a
recognisable test string, bump the counter, pick a non-default
tint, switch the rendering-mode segment to `.accented`, tap
"Push to StandBy widget", place the phone on its charger in
landscape, lock the screen, and within one second confirm
that the StandBy widget displays the new string, the new
counter, and the chosen tint with the `.accented` rendering
treatment, and that a new entry appears at the top of the
per-kind reload event log with the kind identifier
`SpotStandByWidget` and a timestamp matching the push.

**Acceptance Scenarios**:

1. **Given** the user is on the Modules home grid on an iOS
   17+ device, **When** they look at the list of available
   modules, **Then** a "StandBy Mode" card MUST be visible
   and tappable.
2. **Given** the user has tapped the StandBy Mode card on
   iOS 17+, **When** the screen first renders, **Then** it
   MUST present the seven panels in this fixed order:
   explainer card, configuration panel + rendering-mode
   segmented picker + push button, live StandBy preview, setup
   instructions card, per-kind reload event log.
3. **Given** the configuration panel is visible, **When** the
   user edits the showcase value, the counter, the tint,
   and the rendering-mode segment and taps "Push to StandBy
   widget", **Then** the bridge MUST write the new
   configuration (including the `mode` field) to the shared
   App Group `UserDefaults` suite under the documented
   StandBy-config keys (key namespace
   `spot.widget.standbyConfig`), MUST invoke
   `WidgetCenter.shared.reloadTimelines(ofKind: "SpotStandByWidget")`,
   MUST surface a user-visible confirmation that the push
   succeeded, and MUST prepend a new entry to the per-kind
   reload event log with a timestamp and the kind
   identifier.
4. **Given** at least one spot StandBy widget is installed in
   the user's StandBy stack and the device is in StandBy
   (charging + landscape + locked), **When** the user taps
   "Push to StandBy widget" with a new configuration,
   **Then** the widget MUST refresh within one second to
   display the new showcase value, the new counter, and the
   new tint with the rendering treatment matching the
   selected mode.
5. **Given** the per-kind reload event log already contains
   10 entries, **When** the user pushes another
   configuration, **Then** the new entry MUST be prepended
   and the oldest entry MUST be discarded so the log never
   exceeds exactly 10 entries.
6. **Given** 014's home widget and 027's lock-screen widget
   are also installed, **When** the user pushes a StandBy
   configuration, **Then** neither the home widget nor the
   lock-screen widget MUST refresh (the reload is targeted at
   kind `SpotStandByWidget` only) and 014's and 027's reload
   event logs (if visible in another screen) MUST NOT gain
   an entry.
7. **Given** the user toggles the rendering-mode segment
   between `.fullColor`, `.accented`, and `.vibrant` without
   tapping Push, **When** each segment is selected, **Then**
   the live StandBy preview card MUST re-render in the same
   render pass with the corresponding visual treatment, but
   the App Group `UserDefaults` suite MUST NOT be written —
   write happens only on Push.

---

### User Story 2 — Add a spot StandBy widget and observe it render in StandBy with clear in-app guidance (Priority: P1)

A user who has just installed the dev build wants to actually
see the spot StandBy widget render in StandBy mode on a real
device. On the StandBy Mode screen they find a "How to enter
StandBy" setup instructions card with a numbered step list:
open Settings → StandBy and enable StandBy; charge the phone
with MagSafe / Qi / cable; place the phone on its side in
landscape; lock the screen; if no spot widget appears,
long-press the right widget stack and add the spot StandBy
widget from the gallery; swipe vertically on the right
widget stack until the spot StandBy widget surfaces. The user
follows the steps, places their phone on its charger in
landscape, locks it, swipes the right stack until the spot
StandBy widget appears, and sees it rendering the current
configuration from the App Group with the correct tint and
selected rendering mode.

**Why P1**: Without this guidance, a non-technical reviewer
cannot complete the round-trip. StandBy is invisible until
the device is on a charger in landscape and locked — three
preconditions that are non-obvious to anyone who has not
read Apple's StandBy launch material. Co-equal P1 with Story
1 because Story 1's "the widget refreshes" beat is
unverifiable until at least one spot StandBy widget is
actually visible in the StandBy stack on a real device.

**Independent Test**: After Story 1 is shipped, open the
StandBy Mode screen on an iOS 17+ device with no spot
StandBy widget yet in the StandBy stack, follow the setup
instructions card verbatim, and verify (a) StandBy activates
on the device when the three preconditions are met, (b)
searching "spot" in the StandBy widget gallery returns a
single entry exposing exactly two family options
(`.systemMedium`, `.systemLarge`), and (c) adding the widget
results in a stack entry that renders the current
configuration from the App Group StandBy-config keys.

**Acceptance Scenarios**:

1. **Given** the user is on the StandBy Mode screen on iOS
   17+, **When** the screen renders, **Then** a "How to
   enter StandBy" setup instructions card MUST be visible
   with a numbered step list covering at minimum: open
   Settings → StandBy and enable StandBy; charge the phone
   (MagSafe / Qi / cable); place the phone in landscape;
   lock the screen; (if needed) long-press the right widget
   stack to add the spot StandBy widget; swipe vertically
   on the stack to surface the spot widget.
2. **Given** the user follows the setup instructions and
   reaches Apple's StandBy widget gallery, **When** they
   search for "spot", **Then** the spot StandBy widget MUST
   appear as a single gallery entry exposing exactly two
   family options: `.systemMedium` and `.systemLarge`.
3. **Given** the user picks a family and adds the widget,
   **When** the widget first appears in the StandBy stack,
   **Then** it MUST render the current configuration from
   the shared App Group `UserDefaults` suite under the
   StandBy-config key namespace (showcase value, counter,
   tint, mode) — not a hardcoded placeholder — within the
   family chosen.
4. **Given** no configuration has yet been pushed by the
   user, **When** the StandBy widget is first added,
   **Then** it MUST render the documented default
   configuration (showcase value `"StandBy"`, counter `0`,
   the documented default tint, mode `.fullColor`) rather
   than a blank or error chrome.
5. **Given** the user has added both `.systemMedium` and
   `.systemLarge` instances of the spot StandBy widget to
   their StandBy stack, **When** any push is performed,
   **Then** both family instances MUST refresh within one
   second and each MUST render the same shared
   configuration in its family-appropriate layout.
6. **Given** the user taps the spot StandBy widget while it
   is rendered in StandBy and the device is unlocked,
   **When** the tap is recognised, **Then** iOS MUST open
   the Spot app at the StandBy Mode module screen route
   (per the `.widgetURL(_:)` annotation) rather than the
   default landing route.

---

### User Story 3 — Cross-platform parity for the in-app preview half (Priority: P2)

A user opens the StandBy Mode screen on Android, on the web
build, or on iPhone running iOS < 17. The screen renders a
"StandBy Mode is iOS 17+ only" banner at the top, but
critically the **explainer card and the live StandBy preview
panel still render** so the user can still read what StandBy
is and see the three rendering-mode approximations updating
as they edit the configuration. The configuration panel and
rendering-mode segmented picker are shown but the push button
is visibly disabled with an inline explanation ("StandBy
Mode requires iOS 17 or later"). The setup instructions card
is hidden, and the reload event log is hidden.

**Why P2**: Cross-platform parity for the *preview half* of
the module is required by Constitution Principle I. Without
this fallback, the module is broken on Android, Web, and iOS
< 17. P2 rather than P1 because the headline value of the
module is the real StandBy widget on iOS 17+; the fallback
exists to keep the app structurally sound across platforms,
not to deliver StandBy where it cannot exist.

**Independent Test**: Run the screen in a desktop web
browser, on an Android device or simulator, and (if
available) on an iPhone with iOS 16.x or earlier. In each
case verify the screen renders, the iOS-17-only banner is
visible, the explainer card and the live StandBy preview
render and update with edits and rendering-mode segment
changes, the "Push to StandBy widget" button is disabled, the
setup instructions card is hidden, and the reload event log
is hidden.

**Acceptance Scenarios**:

1. **Given** the user opens the StandBy Mode screen on
   Android, Web, or iOS < 17, **When** the screen renders,
   **Then** a "StandBy Mode is iOS 17+ only" banner MUST be
   visible at the top of the content area explaining that
   the StandBy capability is unavailable on this platform /
   version.
2. **Given** the user is on a non-iOS-17+ platform, **When**
   the screen renders, **Then** the explainer card, the
   configuration panel, the rendering-mode segmented picker,
   and the live StandBy preview MUST be shown; the "Push to
   StandBy widget" button MUST be visibly disabled with an
   inline explanation; the setup instructions card and the
   reload event log MUST NOT be shown.
3. **Given** the user is on a non-iOS-17+ platform, **When**
   they edit the showcase value, the counter, the tint, or
   the rendering-mode segment, **Then** the live StandBy
   preview MUST update within the same render pass exactly
   as on the iOS path.
4. **Given** the user is on a non-iOS-17+ platform, **When**
   any code path attempts to call `setStandByConfig` or
   `reloadTimelinesByKind('SpotStandByWidget')`, **Then** the
   bridge MUST throw a `WidgetCenterNotSupported` error
   (consistent with 014/027's bridge contract) rather than
   silently no-oping, so misuse is loud.
5. **Given** the user is on a non-iOS-17+ platform, **When**
   `isAvailable()` is called, **Then** it MUST return
   `false` without throwing so the screen can branch on it
   defensively.

---

### Edge Cases

- **No widget installed when Push is tapped** — Tapping
  "Push to StandBy widget" when no spot StandBy widget has
  been added to the StandBy stack MUST still write the
  configuration to the App Group and call
  `reloadTimelines(ofKind: "SpotStandByWidget")`; the bridge
  MUST resolve successfully (WidgetKit treats reload of an
  empty set of kind instances as a no-op) and the per-kind
  reload event log MUST still record the event so the user
  gets feedback.
- **Phone not on charger / not in landscape** — When the
  user pushes a configuration but the device is not in
  StandBy (no charger or not in landscape or unlocked), the
  push MUST still succeed (the App Group write and per-kind
  reload call are independent of StandBy presentation); the
  next time the device enters StandBy, the widget MUST
  render the most recently pushed configuration.
- **Empty showcase value** — When the user clears the
  showcase-value text field and taps Push, the screen MUST
  either disable the push button or push the documented
  default (`"StandBy"`); the chosen behaviour MUST be
  consistent across the iOS push path and the in-app preview.
  The behaviour MUST match 014's and 027's empty-input policy
  so the three demos do not diverge in unrelated ways.
- **Counter at extreme values** — Counter values outside the
  documented reasonable range (negative, or values too large
  to fit `.systemMedium` / `.systemLarge` layouts) MUST be
  either clamped at the input layer or rendered with a
  documented overflow treatment; the Swift side MUST NOT
  crash on any 32-bit signed integer value. Both StandBy
  families MUST truncate gracefully rather than overflow
  their layout bounds.
- **Rapid Push to StandBy widget** — Tapping Push rapidly in
  succession MUST be safe; each tap MUST appear in the
  per-kind reload event log in the order it was fired; the
  App Group `UserDefaults` suite MUST end in a state
  consistent with the most recent push.
- **App Group read failure on widget side** — If the StandBy
  widget extension fails to read the App Group `UserDefaults`
  suite (e.g. on first launch before any push, or if the
  suite is missing entirely), the TimelineProvider MUST
  return a placeholder entry with the documented default
  configuration rather than crashing the widget; the StandBy
  stack MUST never display a broken-widget chrome.
- **Per-kind reload event log overflow** — When the user
  pushes more than 10 reloads in a single screen session,
  the per-kind reload event log MUST always show exactly the
  10 most recent reloads; older entries MUST not reappear
  after eviction.
- **Backgrounding during Push** — Backgrounding the app
  while a Push call is in flight MUST not corrupt the App
  Group `UserDefaults` suite; on return to foreground the
  suite MUST reflect the completed push if it succeeded, and
  the per-kind reload event log MUST reflect either a
  success or a clearly-marked failure entry.
- **Reload event log empty state on first mount** — Per US1
  AS5 / FR-SB-029, the per-kind reload event log MUST render
  an explicit "No reloads yet" line on first mount rather
  than an empty list with no affordance.
- **Widget rendering when App Group is brand-new** — When a
  spot StandBy widget is added to the StandBy stack before
  the user has ever opened the StandBy Mode screen, the
  widget MUST render the documented default configuration;
  the user MUST NOT be required to push at least once before
  the widget will display anything.
- **Widget removed while screen is open** — Removing a spot
  StandBy widget from the StandBy stack while the StandBy
  Mode screen is open MUST NOT affect the in-app preview,
  the configuration panel, or the per-kind reload event log;
  the next Push tap MUST still succeed (per the empty-set
  edge case above).
- **014 / 027 / 028 pushed in alternation** — Pushing 014's
  home widget config MUST NOT cause 027's lock-screen
  widget or 028's StandBy widget to refresh; pushing 027's
  lock-screen config MUST NOT cause 014's home widget or
  028's StandBy widget to refresh; pushing 028's StandBy
  config MUST NOT cause 014's home widget or 027's
  lock-screen widget to refresh. All three reload event logs
  MUST remain independent.
- **App Group key collision with 014 / 027** — 014's home
  widget keys (under `spot.widget.config`), 027's
  lock-screen keys (under `spot.widget.lockConfig`), and
  028's StandBy keys (under `spot.widget.standbyConfig`)
  MUST live under disjoint key namespaces in the same App
  Group `UserDefaults` suite; reading one namespace MUST NOT
  return values written into another.
- **Plugin re-prebuild idempotency** — Running `npx expo
  prebuild` twice MUST NOT duplicate the four Swift sources
  in the widget extension target's `Sources` build phase,
  MUST NOT duplicate the marker-guarded insertion into
  014's `WidgetBundle`, and MUST NOT regress 014's
  `with-home-widgets` plugin or 027's `with-lock-widgets`
  plugin output. The order of plugin invocation in
  `app.json` MUST NOT affect the final Xcode project state
  — 014 / 027 / 028 plugins MUST be commutative.
- **Rendering mode `.vibrant` vs `.accented` vs `.fullColor`
  visual fidelity** — The Swift views MUST branch on
  `@Environment(\.widgetRenderingMode)` and apply the
  documented per-mode treatments. iOS may also override the
  mode contextually (e.g. force `.vibrant` in night-mode
  StandBy on iPhone 14 Pro / 15 Pro after dimming); the
  views MUST tolerate the system overriding their preferred
  mode without crashing. The in-app live preview MUST treat
  the user-selected mode as authoritative for preview
  purposes (i.e. the preview is a deliberately faithful
  approximation, not a real screenshot of StandBy chrome).
- **Widget container chrome on iOS 17+** — All StandBy
  views MUST apply `.containerBackground(.fill.tertiary,
  for: .widget)` (iOS 17 minimum). No iOS 16 fallback is
  needed because the card is `minIOS: '17.0'`.
- **`.widgetAccentedRenderingMode(.accented)` configuration
  modifier** — The `StandByWidget` `StaticConfiguration`
  MUST chain `.widgetAccentedRenderingMode(.accented)` so
  iOS knows the widget supports accented rendering and the
  Smart Stack view picks an appropriate accent treatment
  (rather than rendering the widget in `.fullColor` only).

## Requirements *(mandatory)*

### Functional Requirements

#### Module registration & gating

- **FR-SB-001**: The StandBy Mode module MUST be registered
  in the registry introduced by feature 006 with id
  `standby-lab`, label `"StandBy Mode"`, supported
  platforms `['ios','android','web']`, and `minIOS: '17.0'`.
  No existing registry entry may be modified.
- **FR-SB-002**: The Modules home grid MUST display the
  StandBy Mode card alongside other registered modules using
  the same card visual treatment, with iOS-version gating
  handled by spec 006's existing `minIOS` mechanism (no
  parallel gating in this module).
- **FR-SB-003**: Tapping the StandBy Mode card MUST navigate
  to the StandBy Mode screen via the registry's standard
  navigation flow.
- **FR-SB-004**: On iOS versions below 17.0, the registry's
  `minIOS` gating MUST mark the card as unavailable per spec
  006 conventions; the module MUST NOT attempt to load
  iOS-17-only native bridge symbols on those versions.

#### WidgetKit StandBy widget definition (iOS 17+)

- **FR-SB-005**: The module MUST define exactly one widget
  kind identifier — `SpotStandByWidget` — declared via
  `StaticConfiguration` and exposing exactly two families:
  `.systemMedium` and `.systemLarge`. No other families
  (e.g. `.systemSmall`, `.accessoryRectangular`) MUST be
  declared on this kind.
- **FR-SB-006**: The widget MUST be added to the **existing**
  `WidgetBundle` introduced by feature 014 by appending a
  `StandByWidget()` entry between the existing marker
  comments (`spot-widgets:bundle:additional-widgets:start`
  / `:end`). A new widget extension target MUST NOT be
  created. The 027 `LockScreenAccessoryWidget()` entry
  already inserted between those markers MUST remain
  untouched and MUST coexist with the new
  `StandByWidget()` entry (both entries between the same
  marker pair).
- **FR-SB-007**: The configuration MUST use
  `StaticConfiguration` (no Intent / `IntentConfiguration`)
  AND MUST chain
  `.widgetAccentedRenderingMode(.accented)` so the widget
  declares support for the accented rendering treatment used
  by StandBy's Smart Stack view. User-facing per-widget
  configuration via Intents is explicitly out of scope.
- **FR-SB-008**: The widget MUST be discoverable in Apple's
  StandBy / widget gallery search by the substring `"spot"`
  (case-insensitive), and MUST present a one-line
  description visible in the gallery suitable for
  non-technical users.
- **FR-SB-009**: The widget Swift sources MUST be gated with
  `@available(iOS 17.0, *)` (or `if #available(iOS 17, *)`
  guards inside the bundle entry registration) so the
  extension target continues to compile and ship on iOS
  16.x — the StandBy widget simply does not register itself
  in the bundle on iOS < 17.

#### TimelineProvider & timeline policy

- **FR-SB-010**: The StandBy widget's TimelineProvider
  (`StandByProvider`) MUST implement the three required
  `TimelineProvider` methods: `placeholder`, `getSnapshot`,
  and `getTimeline`. `placeholder` MUST return a hardcoded
  preview-friendly entry that does not depend on the App
  Group (because the system may render placeholders before
  the app has run).
- **FR-SB-011**: `getSnapshot` MUST read the current
  configuration from the shared App Group `UserDefaults`
  suite under the StandBy-config key namespace and return a
  `StandByEntry` reflecting that configuration; on read
  failure it MUST return the documented default
  configuration entry rather than throwing.
- **FR-SB-012**: `getTimeline` MUST read the current
  configuration from the same suite, build a single
  `StandByEntry` dated `now`, and return a timeline whose
  reload policy schedules the next refresh at a documented
  cadence (e.g. `.after(now + 30 min)`) so the widget keeps
  refreshing even without an explicit per-kind reload call.
  The cadence MUST match 014 / 027 unless documented
  otherwise in plan.md.
- **FR-SB-013**: A `StandByEntry` MUST contain at minimum
  the fields `date: Date`, `showcaseValue: String`,
  `counter: Int`, `tint: Tint`, and `mode: RenderingMode`
  (where `RenderingMode` enumerates `.fullColor`,
  `.accented`, `.vibrant`). `Tint` MUST be the same
  four-swatch enum 014 / 027 use, re-imported (not
  redefined).

#### SwiftUI StandBy views

- **FR-SB-014**: The StandBy family views MUST live in
  `StandByViews.swift` and MUST branch on
  `@Environment(\.widgetFamily)` to render `.systemMedium`
  and `.systemLarge` layouts. The views MUST also branch on
  `@Environment(\.widgetRenderingMode)` to apply the
  appropriate per-mode treatment — `.fullColor` (saturated
  brand tint), `.accented` (high-contrast monochrome with
  tint accent zones), `.vibrant` (translucent / luminance-
  preserving treatment for night-mode StandBy on AOD-capable
  iPhones). The Swift source MUST NOT define separate
  Widget kinds per family.
- **FR-SB-015**: All layouts MUST display the showcase
  value and the counter in family-appropriate prominence
  with the configured tint as the dominant accent (subject
  to the rendering-mode override the system applies in
  practice). At minimum:
  - `.systemMedium` MUST show the showcase value as a
    primary headline and the counter as a large numeric
    secondary element.
  - `.systemLarge` MUST show the showcase value as a
    primary headline, the counter as a very-large numeric
    element (StandBy's hallmark "large numerals"
    treatment), and a subtle row indicating the active
    rendering mode and tint name.
- **FR-SB-016**: All StandBy views MUST apply
  `.containerBackground(.fill.tertiary, for: .widget)` (iOS
  17+ requirement). The views MUST NOT call
  `.contentMarginsDisabled()` (StandBy uses standard widget
  insets unlike the lock-screen accessory views).
- **FR-SB-017**: The StandBy views MUST annotate the root
  view with `.widgetURL(URL(string:
  "spot://modules/standby-lab")!)` so tapping the widget
  while the device is unlocked launches the Spot app at the
  StandBy Mode module screen route. The route string MUST
  match the module's deep-link route in the registry / Expo
  Router; if the route differs the planner MUST update the
  string in `StandByViews.swift` accordingly and document
  the choice in research.md.
- **FR-SB-018**: The StandBy views MUST not perform any
  network calls, any disk reads other than the App Group
  `UserDefaults` suite read already performed by the
  timeline provider, or any long-running computation;
  rendering MUST complete within WidgetKit's documented
  per-render budget for system-family widgets.

#### App Group & shared storage

- **FR-SB-019**: The StandBy widget MUST read from the
  **same App Group identifier** declared by feature 014 and
  reused by 027; the config plugin MUST NOT add a new App
  Group, MUST NOT modify the existing App Group identifier,
  and MUST NOT alter the App Group entitlement on either
  the main app target or the widget extension target. This
  feature reuses 014's App Group wiring exactly.
- **FR-SB-020**: A separate widget extension target MUST
  NOT be created. The four new Swift sources MUST be added
  to 014's existing widget extension target by appending
  them to that target's `Sources` build phase via the
  `with-standby-widget` config plugin (same mechanism 027
  uses).
- **FR-SB-021**: All shared StandBy widget configuration
  MUST be stored in the same `UserDefaults(suiteName:
  <appGroupId>)` suite that 014 / 027 use, but under a
  **disjoint key namespace** rooted at
  `spot.widget.standbyConfig` (at minimum:
  `spot.widget.standbyConfig.showcaseValue`,
  `spot.widget.standbyConfig.counter`,
  `spot.widget.standbyConfig.tint`,
  `spot.widget.standbyConfig.mode`). 014's keys (under
  `spot.widget.config`) and 027's keys (under
  `spot.widget.lockConfig`) MUST NOT be read or written by
  this feature.

#### JS bridge

- **FR-SB-022**: `src/native/widget-center.ts` MUST be
  extended additively with `setStandByConfig(config:
  StandByConfig): Promise<void>` and `getStandByConfig():
  Promise<StandByConfig>` functions that read / write the
  StandBy-config key namespace via the existing native
  bridge. If the bridge already provides a generic
  key-namespace setter / getter from 027, the existing
  implementation MUST be reused; otherwise dedicated
  symbols MUST be added without breaking any existing
  exported symbol. The existing `reloadAllTimelines`,
  `reloadTimelinesByKind`, `getCurrentConfig`, `setConfig`,
  `setLockConfig`, `getLockConfig`, and `isAvailable`
  symbols MUST NOT be removed or renamed.
- **FR-SB-023**: On non-iOS platforms and on iOS < 17,
  calling `setStandByConfig` /  `getStandByConfig` MUST
  throw a `WidgetCenterNotSupported` error (matching
  014/027's bridge contract for unsupported platforms)
  rather than silently returning. `isAvailable()` MUST NOT
  throw and MUST return `false` on these platforms.
- **FR-SB-024**: The JS bridge MUST consume the existing
  `reloadTimelinesByKind` symbol (added by 027) when
  reloading the StandBy widget — it MUST NOT introduce a
  parallel `reloadStandByTimelines` symbol. Reload calls
  MUST pass the kind identifier `"SpotStandByWidget"`.

#### Screen layout (TS)

- **FR-SB-025**: The StandBy Mode screen MUST present a
  header with the title `"StandBy Mode"`.
- **FR-SB-026**: On iOS 17+ the screen MUST present, in
  this fixed top-to-bottom order: (a) explainer card;
  (b) configuration panel containing a showcase-value text
  field, a counter input, a four-swatch tint picker, the
  rendering-mode segmented picker, and a "Push to StandBy
  widget" button; (c) live StandBy preview card mirroring
  the current selection and rendering-mode segment;
  (d) setup instructions card; (e) per-kind reload event
  log showing the last 10 reload events.
- **FR-SB-027**: On Android, Web, and iOS < 17 the screen
  MUST present, in this fixed top-to-bottom order: (a)
  "StandBy Mode is iOS 17+ only" banner; (b) explainer
  card; (c) configuration panel with the rendering-mode
  segmented picker and a visibly disabled "Push to StandBy
  widget" button with an inline explanation; (d) live
  StandBy preview card. The setup instructions card and
  the reload event log MUST NOT be shown on these
  platforms.

#### Configuration panel

- **FR-SB-028**: The configuration panel MUST follow 014's
  ConfigPanel control shape (showcase-value text field,
  counter input, four-swatch tint picker) and MUST add a
  three-segment rendering-mode picker
  (`.fullColor` / `.accented` / `.vibrant`). DECISION: the
  panel MUST import the existing data-control inner widgets
  from 014 / 027 to avoid duplication of the showcase-value
  field, counter input, and tint picker. The
  rendering-mode segmented picker is new and lives in this
  module under
  `src/modules/standby-lab/components/RenderingModePicker.tsx`.
  If during planning a cross-module import proves
  problematic (e.g. circular dependency, type drift, or
  ownership concerns), the planner MUST fall back to a
  local copy under
  `src/modules/standby-lab/components/StandByConfigPanel.tsx`
  and document the rationale in research.md. Either way the
  visible behaviour MUST match the FR descriptions in this
  document.
- **FR-SB-029**: The default values on first render MUST
  be: showcase value `"StandBy"`, counter `0`, the
  documented default tint (same swatch set as 014 / 027;
  default swatch identifier inherited from 014), rendering
  mode `.fullColor`. These defaults MUST be exported as
  constants from `standby-config.ts` so tests can reference
  them.
- **FR-SB-030**: Tapping "Push to StandBy widget" on iOS
  17+ MUST persist the current configuration (including the
  `mode` field) to the App Group via the bridge (per
  FR-SB-022) and MUST then call
  `reloadTimelinesByKind('SpotStandByWidget')`; on success
  it MUST surface a user-visible confirmation and MUST
  prepend a new entry to the per-kind reload event log; on
  failure it MUST surface a user-visible error and MUST
  prepend a clearly-marked failure entry to the per-kind
  reload event log.

#### Rendering-mode segmented picker

- **FR-SB-031**: The rendering-mode segmented picker MUST
  expose exactly three segments labelled `"Full Color"`,
  `"Accented"`, and `"Vibrant"` mapping to the
  `RenderingMode` enum values `.fullColor`, `.accented`, and
  `.vibrant` respectively. Selecting a segment MUST update
  the in-memory draft (read by the live preview within the
  same render pass) and MUST NOT itself write to the App
  Group — write happens only on Push.
- **FR-SB-032**: The currently-selected segment MUST be
  visually distinct (selected-state styling) and MUST be
  exposed to assistive technologies as the active segment
  with an accessibility label naming the mode.

#### Per-kind reload event log

- **FR-SB-033**: The reload event log MUST be backed by an
  in-memory ring buffer of capacity exactly 10, implemented
  with a local React reducer; it MUST NOT be persisted
  across screen unmounts. When a new entry is added beyond
  capacity, the oldest entry MUST be evicted. Each entry
  MUST display, at minimum, a timestamp formatted in the
  user's locale, the kind identifier (`SpotStandByWidget`),
  and a status indicator (success / failure); failure
  entries MUST include a short error message. On first
  mount with no entries, an explicit empty-state line
  ("No reloads yet") MUST be rendered.
- **FR-SB-034**: The per-kind reload event log MUST be
  independent of any log maintained by features 014 / 027.
  DECISION: per-kind logs are the chosen design so the
  three demos can be observed without cross-talk. Cross
  contamination MUST be prevented by storing the log inside
  this module's screen state (not in any shared store).

#### Live StandBy preview (all platforms)

- **FR-SB-035**: The live StandBy preview MUST render a
  single wide landscape card approximating
  `.systemMedium` / `.systemLarge` proportions (16:9 or
  similar) with very large numerals (the StandBy hallmark)
  and the configured showcase value, counter, tint, and
  rendering mode.
- **FR-SB-036**: Edits to any field in the configuration
  panel — including the rendering-mode segment — MUST update
  the preview within the same render pass; the preview
  MUST NOT depend on a successful Push call.
- **FR-SB-037**: The preview MUST honour each rendering
  mode visibly — `.fullColor` MUST render with the saturated
  tint as background or dominant fill; `.accented` MUST
  render with a high-contrast monochrome treatment with the
  tint applied to designated accent zones (numeric text or
  border); `.vibrant` MUST render with a translucent /
  luminance-preserving approximation. The three modes MUST
  be visually distinguishable to a sighted reviewer at a
  glance.
- **FR-SB-038**: The live StandBy preview MUST render on
  Android, Web, and iOS < 17 (per FR-SB-027) so non-iOS-17+
  users still see the visual approximation of the StandBy
  surface.

#### Explainer card (all platforms)

- **FR-SB-039**: The explainer card MUST contain a short
  prose explanation of: (a) what StandBy Mode is; (b) when
  iOS activates it (charging + landscape + locked, iOS
  17+); (c) how widgets render in StandBy via the
  `widgetRenderingMode` environment value; (d) the
  difference between `.fullColor`, `.accented`, and
  `.vibrant` rendering modes. The explainer MUST be
  rendered on every platform so the cross-platform fallback
  remains educational.

#### Setup instructions card (iOS 17+ only)

- **FR-SB-040**: The setup instructions card MUST contain
  a numbered step list explaining how to enter StandBy on
  the device, including at minimum: open Settings →
  StandBy and enable StandBy; charge the phone (MagSafe /
  Qi / cable); place the phone in landscape; lock the
  screen; (if needed) long-press the right widget stack to
  add the spot StandBy widget from the gallery; swipe
  vertically on the right widget stack until the spot
  StandBy widget surfaces.
- **FR-SB-041**: The setup instructions card MUST be
  hidden on Android, Web, and iOS < 17 (per FR-SB-027)
  since StandBy does not exist on those platforms.

#### Native packaging

- **FR-SB-042**: The Swift sources defining the StandBy
  widget — `StandByWidget.swift`, `StandByProvider.swift`,
  `StandByEntry.swift`, and `StandByViews.swift` — MUST
  live under `native/ios/widgets/standby/` in the
  repository, and MUST be added to feature 014's existing
  widget extension target by the `with-standby-widget`
  config plugin at `expo prebuild` time.
- **FR-SB-043**: The `with-standby-widget` config plugin
  MUST be idempotent (running `npx expo prebuild` twice
  MUST produce the same Xcode project state), MUST NOT
  modify or remove any file owned by feature 014's
  `with-home-widgets` plugin, MUST NOT modify or remove any
  file owned by feature 027's `with-lock-widgets` plugin,
  MUST NOT modify or remove any file owned by feature 007's
  `with-live-activity` plugin, and MUST live in its own
  directory `plugins/with-standby-widget/` (separate from
  014/027 plugins per the autonomous DECISION below).
- **FR-SB-044**: The `with-standby-widget` plugin MUST
  insert the `StandByWidget()` entry into 014's
  `WidgetBundle` source by locating the documented marker
  comments
  (`// MARK: spot-widgets:bundle:additional-widgets:start`
  / `:end`) and appending the entry between them, after
  any prior entry inserted by 027. If the markers are
  absent, the plugin MUST fail loudly with a descriptive
  error rather than blindly editing arbitrary source. The
  plugin MUST be order-independent with respect to 014's
  and 027's plugins in the `app.json` plugins array (014
  establishes the markers; 027 inserts one entry between
  them; 028 inserts another entry between them — the final
  state MUST be the same regardless of plugin invocation
  order).
- **FR-SB-045**: The bundle-entry insertion MUST be wrapped
  in `if #available(iOS 17, *) { StandByWidget() }` (or
  equivalent guard) so the bundle entry compiles on iOS
  16.x toolchains and registers only on iOS 17+ devices.
  The `StandByWidget` Swift type itself MAY be marked
  `@available(iOS 17.0, *)` provided the type signature
  remains compilable on iOS 16.x SDKs.
- **FR-SB-046**: On non-iOS targets, no symbol from the
  StandBy native bridge MUST be imported or evaluated at
  module load time; the iOS-only native bridge MUST be
  loaded only on iOS and only when the device meets the
  iOS 17+ requirement.

#### Architecture (TS)

- **FR-SB-047**: The module's source MUST live under
  `src/modules/standby-lab/` with at minimum:
  `index.tsx` (manifest), `screen.tsx`, `screen.android.tsx`,
  `screen.web.tsx`, a `standby-config.ts` module, and a
  `components/` directory containing at least
  `ExplainerCard.tsx`, `StandByConfigPanel.tsx` (which MAY
  re-export 014's data controls per FR-SB-028),
  `RenderingModePicker.tsx`, `StandByPreview.tsx`,
  `SetupInstructions.tsx`, `ReloadEventLog.tsx`, and
  `IOSOnlyBanner.tsx`.
- **FR-SB-048**: `standby-config.ts` MUST expose: a
  Zod-style or hand-rolled schema for the StandBy config
  shape `{ showcaseValue: string, counter: number, tint:
  Tint, mode: RenderingMode }`, the documented default
  values, an AsyncStorage shadow store rooted at the key
  `spot.widget.standbyConfig` (separate from 014's
  `spot.widget.config` and 027's `spot.widget.lockConfig`),
  and read / write helpers tolerant of malformed
  AsyncStorage payloads (returning defaults on parse
  failure rather than throwing).
- **FR-SB-049**: Platform-suffixed screen splits
  (`screen.android.tsx`, `screen.web.tsx`) MUST be used
  for the cross-platform fallback rather than
  `Platform.select` for any diff that touches more than a
  handful of style props. `Platform.select` is permitted
  only for trivial style or copy diffs.

#### Lifecycle

- **FR-SB-050**: Navigating away from the StandBy Mode
  screen MUST tear down the screen cleanly: no
  asynchronous bridge callbacks MUST update React state
  after unmount; no layout warnings MUST be emitted; the
  in-memory per-kind reload event log MUST be discarded on
  unmount per FR-SB-033.
- **FR-SB-051**: When the app is backgrounded with the
  screen visible and returns to foreground, the live
  preview MUST refresh from the StandBy-config getter so
  any externally-changed App Group state is reflected.
- **FR-SB-052**: When iOS opens the app via the
  `widgetURL` deep link
  (`spot://modules/standby-lab`), the app MUST navigate to
  the StandBy Mode screen (best-effort: the deep-link
  routing wires through Expo Router's standard scheme
  handling; no custom URL parser is required).

#### Accessibility

- **FR-SB-053**: The showcase-value text field, the
  counter input, the four tint swatches, the three
  rendering-mode segments, the "Push to StandBy widget"
  button, the live StandBy preview card, the setup
  instruction steps, and the per-kind reload event log
  rows MUST each expose an accessibility label describing
  their function (e.g. "Showcase value", "Counter",
  "Tint: blue", "Rendering mode: Accented", "Push to
  StandBy widget", "StandBy preview", "Enter StandBy step
  1 of 6", "Reload at 14:02 succeeded").
- **FR-SB-054**: The "StandBy Mode is iOS 17+ only"
  banner on Android / Web / iOS < 17 MUST expose its
  message to assistive technologies as a single accessible
  announcement on screen mount.
- **FR-SB-055**: The four tint swatches and the three
  rendering-mode segments MUST be distinguishable to users
  who cannot perceive colour differences (accessibility
  labels naming the tint / mode and / or a non-colour
  selection indicator such as a checkmark on the active
  swatch / segment).

#### Quality & integration

- **FR-SB-056**: The full `pnpm check` suite (lint,
  typecheck, tests) MUST pass after the feature lands. No
  existing test may regress. `pnpm format` MUST be run
  before commits. NO `eslint-disable` directives for
  unregistered rules MUST be introduced.
- **FR-SB-057**: Comprehensive unit tests MUST exist:
  `standby-config.test.ts` (schema, defaults, AsyncStorage
  round-trip, error tolerance, mode field round-trip), one
  test file per component
  (`ExplainerCard.test.tsx`,
  `StandByConfigPanel.test.tsx`,
  `RenderingModePicker.test.tsx` (verifies tint + mode
  change behaviour reflected in the preview),
  `StandByPreview.test.tsx`, `SetupInstructions.test.tsx`,
  `ReloadEventLog.test.tsx`, `IOSOnlyBanner.test.tsx`),
  `screen.test.tsx`, `screen.android.test.tsx`,
  `screen.web.test.tsx`,
  `plugins/with-standby-widget/index.test.ts` (verifies
  the plugin appends the four Swift sources to 014's
  widget extension target, is idempotent on second run,
  fails loudly if 014's bundle markers are absent, is
  commutative with 014 and 027 plugins, and does not
  regress 014's or 027's plugin output), and
  `manifest.test.ts` (registry contract: id, label,
  platforms, minIOS).
- **FR-SB-058**: Native bridges MUST be mocked at the
  import boundary per the 024 pattern (mock
  `src/native/widget-center.ts` in the JS test layer; do
  not load the real native module under test).
- **FR-SB-059**: The baseline test totals at the start of
  this feature MUST be carried forward from feature 027's
  completion totals (recorded in 027's plan.md /
  retrospective). The delta introduced by feature 028 MUST
  be tracked in plan.md and reported in the retrospective.

### Key Entities

- **RegistryEntry** — the new
  `{ id: 'standby-lab', title: 'StandBy Mode', platforms:
  ['ios','android','web'], minIOS: '17.0', render }` record
  appended to `src/modules/registry.ts`.
- **StandByConfig** — the in-app draft / persisted shape:
  `{ showcaseValue: string, counter: number, tint: Tint,
  mode: RenderingMode }`, defined by the schema in
  `standby-config.ts` with documented defaults
  `{ showcaseValue: 'StandBy', counter: 0, tint:
  <014-default-tint>, mode: 'fullColor' }`.
- **Tint** — same four-swatch enum 014 / 027 export
  (re-imported, not redefined, to keep label parity);
  shared visual language across the home, lock-screen, and
  StandBy demos.
- **RenderingMode** — `'fullColor' | 'accented' | 'vibrant'`;
  used by the configuration panel, the live preview, the
  AsyncStorage shadow, and the App Group write to
  communicate the user's preferred StandBy rendering
  treatment to the widget. Mirrors WidgetKit's
  `WidgetRenderingMode` enum cases.
- **StandByEntry** (Swift) — `TimelineEntry` carrying
  `{ date: Date, showcaseValue: String, counter: Int,
  tint: Tint, mode: RenderingMode }`; consumed by both
  `.systemMedium` and `.systemLarge` views.
- **ReloadLogEntry** — `{ at: Date, kind:
  'SpotStandByWidget', status: 'success' | 'failure',
  error?: string }`. Bounded to the last 10 entries by
  FR-SB-033.
- **WidgetCenterError** — `WidgetCenterNotSupported` thrown
  by the JS bridge on non-iOS / iOS < 17 callers (matches
  014/027's contract; not redefined here).

## Non-Functional Requirements

- **NFR-SB-001 (Performance)**: Opening the StandBy Mode
  screen MUST render to first paint within 500 ms on a
  recent iPhone; the live preview MUST update within one
  render pass (≤ 16 ms on a 60 Hz screen) when the user
  changes any control.
- **NFR-SB-002 (Responsiveness)**: A successful Push to
  StandBy widget MUST update the per-kind reload event log
  within 500 ms of the bridge call resolving; the StandBy
  widget on the device MUST refresh within 1 s of the
  reload call when the device is in StandBy (per US1 AS4).
- **NFR-SB-003 (Footprint)**: No new runtime dependency is
  added by this feature. `package.json` and
  `pnpm-lock.yaml` MUST remain unchanged at the dependency
  level (lockfile churn unrelated to dependency changes is
  acceptable).
- **NFR-SB-004 (Idempotency / commutativity)**: Running
  `npx expo prebuild` twice in succession MUST produce an
  Xcode project state with no duplicated source files in
  the widget extension target's `Sources` build phase, no
  duplicated marker-bounded `StandByWidget()` insertion in
  014's `WidgetBundle`, and no regression of 014's or
  027's plugin output. Reordering the
  `with-home-widgets`, `with-lock-widgets`, and
  `with-standby-widget` entries in `app.json` MUST produce
  byte-identical Xcode project state.
- **NFR-SB-005 (Offline)**: The module MUST be fully
  functional with the device in airplane mode. No code
  path may require network.
- **NFR-SB-006 (Coexistence)**: Features 007 (Live
  Activities), 013 (App Intents), 014 (Home Widgets), 024
  (MapKit), 025 (Core Location), 026 (Rich Notifications),
  and 027 (Lock Screen Widgets) MUST continue to function
  unchanged with the new plugin installed. Specifically:
  007's Live Activity widgets, 014's home-screen widget,
  and 027's lock-screen accessory widgets MUST continue to
  render their previous behaviour, and 014's
  `reloadAllTimelines()` and 027's
  `reloadTimelinesByKind('SpotLockScreenWidget')` calls
  MUST continue to work as before.
- **NFR-SB-007 (Accessibility)**: All buttons and controls
  in the panels MUST have `accessibilityLabel`s; the live
  preview card and explainer card MUST be readable by
  VoiceOver.
- **NFR-SB-008 (Logging hygiene)**: The in-memory per-kind
  reload event log is the only sink for reload-lifecycle
  data; no `console.log` of widget configuration may ship
  in release builds (gated by `__DEV__`).
- **NFR-SB-009 (Constitution v1.1.0)**: Additive
  integration only; no edits to unrelated modules,
  screens, or plugins; the only modification of any 014 or
  027 file is the marker-guarded `WidgetBundle` insertion
  performed at prebuild time by 028's plugin (no
  source-tree edits to 014's or 027's plugin or screen).
  All changes pass `pnpm check`.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A reviewer with an iPhone running iOS 17+ can
  go from a fresh dev-build install to seeing a customised
  StandBy widget render on the StandBy stack in under 5
  minutes by following only the in-app explainer +
  configuration panel + setup instructions card (no
  external documentation required).
- **SC-002**: 100% of the three documented rendering modes
  (`.fullColor`, `.accented`, `.vibrant`) are visibly
  distinguishable in the in-app live preview at a glance to
  a sighted reviewer.
- **SC-003**: Pushing a configuration with a non-default
  rendering mode results in the on-device StandBy widget
  refreshing within 1 second when the device is in StandBy
  (charging + landscape + locked).
- **SC-004**: The full `pnpm check` suite passes with zero
  new failures on every commit; 014's and 027's existing
  test suites continue to pass unchanged.
- **SC-005**: Running `npx expo prebuild` twice in
  succession produces byte-identical Xcode project state on
  the second run; reordering the three widget plugins in
  `app.json` produces byte-identical Xcode project state.
- **SC-006**: The StandBy widget kind, the lock-screen
  accessory widget kind, and the home-screen widget kind
  refresh independently — pushing one kind does not refresh
  the other two and does not produce events in the other
  two reload event logs (verified by US1 AS6 / AC-SB-009).
- **SC-007**: On Android, Web, and iOS < 17 the screen
  renders the explainer + preview half without crashing
  and without attempting to load any iOS-17-only native
  bridge symbol (verified by US3).
- **SC-008**: Inspecting the generated Xcode project after
  `expo prebuild` shows zero new widget extension targets
  added by feature 028 — the four 028 Swift sources appear
  in 014's existing widget extension target's `Sources`
  build phase alongside 014's and 027's sources.
- **SC-009**: Tapping the spot StandBy widget while the
  device is unlocked launches the Spot app at the StandBy
  Mode module screen route (per the `.widgetURL(_:)`
  annotation, FR-SB-017 / FR-SB-052).

## Acceptance Criteria

A feature delivery is accepted when **all** of the
following hold:

- **AC-SB-001**: The registry contains a single new entry
  with `id: 'standby-lab'` and the platforms / minIOS
  fields above. Diff against the branch parent shows
  registry size +1 and no other registry edits.
- **AC-SB-002**: `app.json` `plugins` contains a single
  new entry `./plugins/with-standby-widget`. Diff shows +1
  plugin and no other plugin edits.
- **AC-SB-003**: `package.json` adds zero new
  dependencies; the dependency block diff is empty.
- **AC-SB-004**: `pnpm check` (lint, typecheck, tests)
  passes with zero new failures. Test totals are at least
  the baseline carried from feature 027's completion; the
  delta introduced by 028 is reported in plan.md and the
  retrospective.
- **AC-SB-005**: On a fresh install on iOS 17+, US1
  end-to-end test passes: configure data + pick rendering
  mode → push → StandBy widget refreshes within 1 s →
  per-kind reload event log records the event tagged with
  kind `SpotStandByWidget`.
- **AC-SB-006**: US2 end-to-end test passes: searching
  "spot" in the StandBy widget gallery returns a single
  entry exposing exactly two families (`.systemMedium`,
  `.systemLarge`); adding either family renders the
  current App Group standby-config; tapping the widget
  launches the app at the StandBy Mode module screen.
- **AC-SB-007**: US3 cross-platform test passes: the
  screen renders on Android, Web, and iOS < 17 with the
  iOS-17-only banner, the explainer card, the disabled
  push button, the rendering-mode segmented picker, and
  the live StandBy preview, with no setup instructions
  card / reload event log visible. Calling
  `setStandByConfig` on these platforms throws
  `WidgetCenterNotSupported`.
- **AC-SB-008**: Idempotency + commutativity test passes:
  running `npx expo prebuild` twice produces unchanged
  widget extension target `Sources` and unchanged 014
  `WidgetBundle` source on the second run; reordering
  014/027/028 plugin entries in `app.json` produces
  byte-identical project state.
- **AC-SB-009**: Cross-feature isolation test passes:
  pushing 014's home-widget config does not refresh 027's
  lock-screen widget or 028's StandBy widget; pushing
  027's lock-screen config does not refresh 014's or
  028's widgets; pushing 028's StandBy config does not
  refresh 014's or 027's widgets; the three reload event
  logs remain independent; the App Group key namespaces
  (`spot.widget.config` / `spot.widget.lockConfig` /
  `spot.widget.standbyConfig`) remain disjoint.
- **AC-SB-010**: 014/027 regression test passes: 014's
  home-widget flow and 027's lock-screen flow continue to
  work unchanged after 028's plugin is installed and after
  a clean `expo prebuild`.
- **AC-SB-011**: No-new-extension-target audit passes:
  inspecting the generated Xcode project shows that no new
  widget extension target was created and the four 028
  Swift files appear in 014's existing widget extension
  target's `Sources` build phase.
- **AC-SB-012**: Comprehensive unit-test coverage exists
  per FR-SB-057; every listed test file is present and
  passes. Native bridges are mocked at the import boundary
  per FR-SB-058.
- **AC-SB-013**: No `eslint-disable` directive for an
  unregistered rule appears anywhere in 028's source.
  `pnpm format` was run before the merge commit.
- **AC-SB-014**: The three rendering-mode segments
  (`.fullColor`, `.accented`, `.vibrant`) are visibly
  distinct in the in-app live preview AND on the device's
  real StandBy widget when each mode is pushed in
  sequence.

## Out of Scope

- New widget extension target creation (forbidden by
  FR-SB-020).
- iOS < 17 backports (StandBy is iOS 17+ only).
- Lock-screen accessory family widgets (belong with
  feature 027).
- Home-screen widget configuration (belongs with feature
  014).
- Interactive widgets (App Intents / Button(intent:) /
  Toggle(intent:)) — belongs with feature 013.
- Always-On Display (AOD) optimisation beyond what
  StandBy provides implicitly on iPhone 14 Pro / 15 Pro.
- Imitating Apple's first-party StandBy widgets (clock,
  weather, calendar, photos). The showcase widget displays
  user-authored data, not system data.
- Editing 014's or 027's plugin, screen, registry entry,
  Swift sources, or App Group identifier; editing any 007
  / 013 / 024 / 025 / 026 file. The only permitted touch
  on a 014 file is the marker-guarded `WidgetBundle`
  insertion performed by 028's plugin at prebuild time.
- Persistence of the per-kind reload event log across
  screen unmounts or app launches.
- Localisation of widget copy beyond what the user types
  into the showcase-value field.
- Adding a new App Group, modifying the existing App
  Group identifier, or migrating any 014 / 027 keys.

## Open Questions (resolved)

All ambiguities below were resolved autonomously with
reasonable defaults; none remain blocking.

1. **One StandBy widget kind exposing two families, or two
   widget kinds (one per family)?** — Resolved: **one
   widget kind**, `SpotStandByWidget`, declared via
   `StaticConfiguration` with `supportedFamilies:
   [.systemMedium, .systemLarge]`. Two kinds would force
   two gallery entries and two reload-by-kind calls,
   contradicting the "single kind, multiple families"
   shape that 027 already established.
2. **Same widget extension target as 014 (and 027), or a
   new one?** — Resolved: **same target as 014** (FR-SB-006
   / FR-SB-020). A new target would duplicate App Group
   entitlement wiring, bundle-id derivation, and code
   signing, all already solved by 014. The 028 plugin
   appends Swift files to 014's existing target — the same
   pattern 027 uses.
3. **Same App Group as 014 / 027, or a new one?** —
   Resolved: **same App Group as 014** (FR-SB-019). The
   widget extension is the same target; the App Group is
   part of that target's entitlement; introducing a third
   App Group would add complexity without value.
4. **Same App Group key namespace as 014 / 027, or a
   separate one?** — Resolved: **separate key namespace**
   (FR-SB-021), rooted at `spot.widget.standbyConfig`.
   This keeps the three demos independently observable,
   prevents accidental cross-contamination during testing,
   and lets the reviewer push different configurations to
   the three surfaces simultaneously. The user description
   asked us to DECIDE between sharing 014's store and a
   separate namespace; the chosen answer is "share the App
   Group + UserDefaults *suite*, but use a disjoint key
   namespace and add a `mode` field" — i.e. the parent
   storage is shared, the keys are disjoint, the schema
   gains one field. Documented further in research.md
   during planning.
5. **Single Expo plugin or separate plugin?** — Resolved:
   **separate plugin** at `plugins/with-standby-widget/`
   (FR-SB-043). 014's and 027's plugins remain untouched.
   028's plugin appends Swift sources and inserts a
   marker-guarded entry into 014's `WidgetBundle`. This
   isolates ownership: 014 owns the extension target's
   existence and the App Group entitlement; 027 owns
   adding lock-screen accessory widget files; 028 owns
   adding StandBy widget files. Combining plugins would
   require editing 014's plugin, which is forbidden by
   the additive-integration rule.
6. **`reloadAllTimelines` or `reloadTimelinesByKind`?** —
   Resolved: **per-kind reload** (FR-SB-024 / FR-SB-030).
   This is the minimum-blast-radius reload call, reuses
   the symbol 027 already added, and keeps 014's home
   widget and 027's lock-screen widget from refreshing
   spuriously when the user is exercising the 028 demo.
7. **Per-kind reload event log, or shared with 014 /
   027?** — Resolved: **per-kind log** (FR-SB-033 /
   FR-SB-034), kept in the 028 module's screen state.
   Sharing a log with 014/027 would require either editing
   their screens (forbidden by additive integration) or
   introducing a global store (overkill for a demo
   affordance).
8. **Reuse 014's data controls (showcase-value field,
   counter input, tint picker) or copy them?** —
   Resolved: **import from 014** (FR-SB-028) by default,
   with an explicit fall-back-to-local-copy clause if
   cross-module import becomes problematic during
   planning. The rendering-mode segmented picker is new
   and lives in this module.
9. **Default showcase value: reuse 014's `"Hello, Widget!"`
   or 027's `"Hello, Lock!"` or pick a new one?** —
   Resolved: **`"StandBy"`** (FR-SB-029). A distinct
   default makes it visually obvious in the demo which
   surface a given push targeted.
10. **iOS 17+ `containerBackground` handling?** —
    Resolved: **always apply** (FR-SB-016). No iOS 16
    fallback is needed because the card is `minIOS:
    '17.0'`. The StandBy views also do NOT call
    `.contentMarginsDisabled()` (StandBy uses standard
    widget insets, unlike accessory widgets).
11. **`.widgetAccentedRenderingMode` and `.widgetURL`
    handling?** — Resolved: **declare both on the widget
    configuration / view root** (FR-SB-007 / FR-SB-017).
    `.widgetAccentedRenderingMode(.accented)` opts the
    widget into the accented Smart Stack treatment;
    `.widgetURL(URL(string:
    "spot://modules/standby-lab")!)` deep-links taps
    while the device is unlocked back to the StandBy Mode
    module screen.
12. **Where do the Swift sources live?** — Resolved:
    `native/ios/widgets/standby/` (FR-SB-042). Mirrors
    014's `native/ios/home-widgets/` (now also at
    `native/ios/widgets/`) and 027's
    `native/ios/widgets/lock-screen/` layout under the
    single `widgets/` parent directory established by 027.
13. **AsyncStorage shadow store key naming?** — Resolved:
    `spot.widget.standbyConfig` (FR-SB-048), parallel to
    014's `spot.widget.config` and 027's
    `spot.widget.lockConfig`. The shadow store exists so
    non-iOS platforms can still configure the live
    preview without an App Group.
14. **Plugin failure mode if 014's `WidgetBundle` markers
    are missing?** — Resolved: **fail loudly**
    (FR-SB-044) with a descriptive error pointing at
    014's plugin. Silent no-op or blind regex insertion
    would risk subtle Xcode-project corruption. The 027
    plugin already short-circuits with a no-op if the
    bundle file does not yet exist (014 plugin not run);
    028 MUST follow the same convention.
15. **Should StandBy widgets be `.systemSmall` too?** —
    Resolved: **no — `.systemMedium` + `.systemLarge`
    only** (FR-SB-005). StandBy's hallmark is the
    landscape "large numerals" treatment which only the
    medium and large families do justice to; `.systemSmall`
    is not part of the StandBy demo and would dilute the
    showcase.
16. **What does `.widgetRenderingMode` return on iOS 16
    when the toolchain compiles for iOS 17?** —
    Resolved: not relevant — the StandBy widget kind
    registers itself only on iOS 17+ via the `if
    #available` guard inside the bundle entry (FR-SB-045).
    On iOS 16.x the widget kind is simply not in the
    gallery.
17. **Test baseline tracking?** — Resolved: baseline at
    start is **carried forward from 027's completion
    totals** (recorded in 027's plan.md /
    retrospective). The 028 delta is tracked in plan.md
    and the retrospective per FR-SB-059.

## Assumptions

- Feature 014's widget extension target exists and is
  wired up with a working App Group entitlement, an
  `Info.plist` that declares the extension's
  `NSExtensionPointIdentifier`, a `WidgetBundle` source
  containing the agreed marker comments
  (`spot-widgets:bundle:additional-widgets:start` /
  `:end`), and a Swift bridge in the main app target that
  already exposes `WidgetCenter.shared.reloadAllTimelines()`.
- Feature 027 is merged and its `LockScreenAccessoryWidget()`
  entry between the marker pair coexists peacefully with
  any new entry inserted by 028's plugin. 027's plugin and
  028's plugin both insert between the same marker pair;
  the two insertions MUST commute (insertion order MUST
  NOT affect Xcode project state).
- The Spot app exposes a deep-link route reachable as
  `spot://modules/standby-lab` (or the registry-derived
  equivalent). If the route differs at planning time, the
  planner MUST document the actual route and update
  FR-SB-017 accordingly without changing the FR's intent.
- The `widgetRenderingMode` SwiftUI environment value and
  `WidgetRenderingMode` enum (`.fullColor`, `.accented`,
  `.vibrant`) are available on iOS 17+ exactly as
  documented in Apple's WidgetKit release notes for iOS
  17. If a pre-release SDK rename surfaces during
  planning, the planner MUST document the rename in
  research.md and update Swift call sites without
  changing the FR-level contract.
- The four-swatch `Tint` enum exported by 014 is
  `import`able from `src/modules/widgets-lab/...` (or
  wherever 014 placed it) without introducing a circular
  dependency. If a circular import is discovered, the
  planner MUST follow the FR-SB-028 fall-back clause and
  copy the enum locally with documented rationale.
- The `Tint` Swift type used by 014's home widget and
  027's lock-screen widget is shareable across all three
  Swift sources in the same widget extension target (same
  module — they import the same enum file). If the file
  layout requires duplication, the duplication MUST be a
  copy of an enum, not a redefinition with different
  cases.
- StandBy is not available on iPad, only on iPhone with
  iOS 17+. This is fine — the registry's `minIOS: '17.0'`
  gating + the `platforms: ['ios','android','web']`
  declaration cover the case (iPad is included in `'ios'`
  but the widget will simply never render in StandBy on
  an iPad because StandBy does not exist there). No
  iPad-specific gating is required.
- Constitution v1.1.0 remains the active governance
  version. If a v1.2.x update lands during planning, the
  planner MUST re-validate this spec against the new
  constitution and patch any divergences.
