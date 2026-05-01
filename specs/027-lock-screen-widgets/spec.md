# Feature Specification: Lock Screen Widgets Module

**Feature Branch**: `027-lock-screen-widgets`
**Feature Number**: 027
**Created**: 2026-04-30
**Status**: Approved (autonomous, no clarifications needed)
**Input**: iOS 16+ module showcasing WidgetKit's Lock Screen
accessory widget families (`.accessoryRectangular`,
`.accessoryCircular`, `.accessoryInline`). Builds additively on
feature 014's existing widget extension target and shared App
Group; adds three accessory views to the SAME `WidgetBundle` —
this feature does NOT create a new extension target. Branch parent
is 026-rich-notifications.

## Overview

The Lock Screen Widgets module ("Lock Screen Widgets") is a feature
card in the iOS Showcase registry (`id: 'lock-widgets-lab'`, label
`"Lock Screen Widgets"`, `platforms: ['ios','android','web']`,
`minIOS: '16.0'`). Tapping the card opens a single screen with five
panels arranged in a fixed top-to-bottom order:

1. **Status panel** — current accessory widget configuration
   (showcase value + counter + tint) as most recently read from the
   shared App Group `UserDefaults` suite. Mirrors 014's status
   panel shape but reads a separate App Group key namespace
   (`spot.widget.lockConfig`) so the home-screen and lock-screen
   demos remain independently observable.
2. **Configuration panel** — same control shape as 014's home
   widget config (a showcase-value text field defaulting to
   `"Hello, Lock!"`, a signed-integer counter defaulting to `0`,
   and a four-swatch tint picker). The panel feeds the
   lock-screen widget kind only; the 014 home-widget config
   remains untouched.
3. **Push to lock-screen widget button** — writes the current
   draft to the App Group under the lock-config key namespace and
   then calls
   `WidgetCenter.shared.reloadTimelines(ofKind: "SpotLockScreenWidget")`
   via the JS bridge (a per-kind reload, NOT a global
   reloadAllTimelines).
4. **Live preview panel** — three RN-rendered preview cards
   approximating the three accessory families
   (`.accessoryRectangular`, `.accessoryCircular`, `.accessoryInline`)
   with the configured data and tint. Renders on every platform so
   Android / Web users still see the visual approximation.
5. **Setup instructions card** — numbered step list explaining
   long-press the Lock Screen → Customize → tap a widget slot →
   search "spot" → pick rectangular / circular / inline.
6. **Reload event log** — independent FIFO log of the last 10
   per-kind reload events, kept in-memory for the lifetime of the
   screen. Per the autonomously-resolved DECISION below, the log
   is keyed per widget kind (lock-screen reloads do NOT appear in
   014's home-widget log and vice versa), so the two demos never
   contaminate each other's event history.

The feature is purely additive at the integration boundary:

1. `src/modules/registry.ts` — one new import line + one new array
   entry (registry size +1).
2. `app.json` `plugins` array — one new entry
   (`./plugins/with-lock-widgets`). Coexists with all prior
   plugins including 007's `with-live-activity`, 014's
   `with-home-widgets`, 025's `with-core-location`, and 026's
   `with-rich-notifications`.
3. `package.json` / `pnpm-lock.yaml` — **no new runtime
   dependency**. WidgetKit ships with iOS; the JS bridge extends
   `src/native/widget-center.ts` and the AsyncStorage shadow store
   reuses the dependency 014 already brought in.
4. `plugins/with-lock-widgets/` — new Expo config plugin that
   idempotently APPENDS the new Swift files
   (`LockScreenAccessoryWidget.swift`,
   `LockScreenAccessoryProvider.swift`,
   `LockScreenAccessoryEntry.swift`,
   `LockScreenAccessoryViews.swift`) to the existing widget
   extension target introduced by feature 014, and inserts a
   marker-guarded edit into 014's `WidgetBundle` source that adds
   one more `LockScreenAccessoryWidget()` entry. The plugin MUST
   NOT create a new extension target, MUST NOT modify any 014
   plugin file, and MUST NOT regress 014's home-widget plugin on
   re-prebuild.
5. `src/native/widget-center.ts` — extended (additively) with a
   `reloadTimelinesByKind(kind: string)` function. The existing
   `reloadAllTimelines` API stays as-is so 014's call sites are
   not edited.

No existing module, screen, plugin, or registry entry is modified
beyond the documented additive lines above. Features 007 (Live
Activities), 014 (Home Widgets), 024 (MapKit), 025 (Core
Location), and 026 (Rich Notifications) continue to work unchanged.

## Goals

- Demonstrate every Lock Screen accessory widget family WidgetKit
  exposes on iOS 16+ — `.accessoryRectangular`,
  `.accessoryCircular`, `.accessoryInline` — driven from the same
  App Group that 014 established, so the proof of "shared data
  between app and widget" extends naturally from home-screen to
  lock-screen surfaces.
- Prove an Expo app can ship lock-screen accessory widgets without
  spawning a new extension target — by ADDING views to 014's
  existing `WidgetBundle` through an idempotent, marker-guarded
  config plugin edit.
- Provide a self-contained authoring loop (configure → push →
  observe widget refresh on Lock Screen → see per-kind reload
  event in the log) that a reviewer can exercise end-to-end with
  no external dependencies.
- Keep the integration footprint minimal: one registry line, one
  plugin entry, zero new runtime dependencies, one Swift file per
  conceptual responsibility.
- Demonstrate the per-kind reload API
  (`WidgetCenter.shared.reloadTimelines(ofKind:)`) as distinct
  from 014's global `reloadAllTimelines()`, so the showcase
  illustrates both reload strategies.

## Non-Goals

- **No new widget extension target.** All Swift files added by
  this feature land in 014's existing extension target via the
  config plugin's marker-guarded edit. Creating a separate target
  is explicitly forbidden by FR-LW-018 below.
- **No StandBy mode / accessory family on iOS 17+ widgets beyond
  the three lock-screen families.** StandBy reuse, Always-On
  rendering modes, and complex-rendering-mode handling are
  explicitly out of scope.
- **No interactive widgets (iOS 17+ App Intents in widgets).**
  The widgets are render-only; no `Button(intent:)` or
  `Toggle(intent:)` is declared. Belongs with feature 013.
- **No remote configuration of the widget.** Configuration is
  authored exclusively in-app and pushed via the App Group;
  no APNs background refresh, no server-side push.
- **No editing of feature 014's plugin, registry entry, screen,
  Swift sources, or App Group key layout.** The only edit to a
  014 file is a single marker-guarded insertion into the
  `WidgetBundle` source performed by 027's plugin at prebuild
  time.
- **No editing of any prior module, plugin, screen, or registry
  entry** beyond the additive registry / plugin lines and the
  marker-guarded `WidgetBundle` insertion described above.
- **No support for iOS < 16.** The card is gated by
  `minIOS: '16.0'` (Lock Screen Widgets are an iOS 16
  capability). Older iOS versions, Android, and Web see only the
  in-app preview panel plus the iOS-only banner.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Configure data in the app and push it to a real Lock Screen widget on iOS 16+ (Priority: P1)

A user opens the Spot iOS Feature Showcase on an iPhone running
iOS 16 or later, sees a "Lock Screen Widgets" card on the Modules
home grid, and taps it. They land on a screen titled "Lock Screen
Widgets" that shows the configuration the lock-screen widget would
currently display, plus the same configuration controls as 014 — a
showcase-value text field defaulting to `"Hello, Lock!"`, a
counter input, and a four-swatch tint picker. They edit the
showcase value, bump the counter, pick a tint, and tap "Push to
lock-screen widget". The screen confirms the push happened, the
per-kind reload event log immediately gains a new entry tagged
with the kind `SpotLockScreenWidget`, and any spot lock-screen
accessory widget already added to the user's Lock Screen refreshes
within a second to display the new values in the chosen tint.

**Why P1**: This is the smallest end-to-end slice that proves the
module's core promise — three accessory widget families driven by
app-controlled data through the same App Group 014 established,
with refreshes triggered by an explicit per-kind reload call. It
exercises the registry entry, the iOS 16 gating, the JS bridge
extension (`reloadTimelinesByKind`), the Swift TimelineProvider,
the App Group `UserDefaults` suite (under the lock-config key
namespace), the three SwiftUI accessory views, and the per-kind
reload event log in one round-trip. Without this slice the rest of
the module has nothing to demonstrate.

**Independent Test**: Install a dev build on an iPhone running iOS
16+, add a spot lock-screen accessory widget (any of the three
families) to the Lock Screen, open the Modules grid, tap the
"Lock Screen Widgets" card. Change the showcase value to a
recognisable test string, bump the counter, pick a non-default
tint, tap "Push to lock-screen widget", and within one second
confirm that the Lock Screen accessory widget displays the new
string, the new counter, and the new tint, and that a new entry
appears at the top of the per-kind reload event log with the kind
identifier `SpotLockScreenWidget` and a timestamp matching the
push.

**Acceptance Scenarios**:

1. **Given** the user is on the Modules home grid on an iOS 16+
   device, **When** they look at the list of available modules,
   **Then** a "Lock Screen Widgets" card MUST be visible and
   tappable.
2. **Given** the user has tapped the Lock Screen Widgets card on
   iOS 16+, **When** the screen first renders, **Then** it MUST
   present the five panels in this fixed order: status panel,
   configuration panel + push button, live preview panel (three
   accessory family approximations), setup instructions card,
   per-kind reload event log.
3. **Given** the configuration panel is visible, **When** the
   user edits the showcase value, the counter, and the tint and
   taps "Push to lock-screen widget", **Then** the bridge MUST
   write the new configuration to the shared App Group
   `UserDefaults` suite under the documented lock-config keys
   (key namespace `spot.widget.lockConfig`), MUST invoke
   `WidgetCenter.shared.reloadTimelines(ofKind: "SpotLockScreenWidget")`,
   MUST surface a user-visible confirmation that the push
   succeeded, and MUST prepend a new entry to the per-kind reload
   event log with a timestamp and the kind identifier.
4. **Given** at least one spot lock-screen accessory widget is
   installed on the Lock Screen, **When** the user taps "Push to
   lock-screen widget" with a new configuration, **Then** the
   widget MUST refresh within one second to display the new
   showcase value, the new counter, and the new tint within the
   accessory family the user added.
5. **Given** the per-kind reload event log already contains 10
   entries, **When** the user pushes another configuration,
   **Then** the new entry MUST be prepended and the oldest entry
   MUST be discarded so the log never exceeds exactly 10 entries.
6. **Given** 014's home widget is also installed on the Home
   Screen, **When** the user pushes a lock-screen configuration,
   **Then** the home widget MUST NOT refresh (the reload is
   targeted at kind `SpotLockScreenWidget` only) and 014's
   home-widget reload event log (if visible in another screen)
   MUST NOT gain an entry.

---

### User Story 2 — Add a spot lock-screen accessory widget with clear in-app guidance (Priority: P1)

A user who has just installed the dev build wants to actually put
a lock-screen widget on their Lock Screen. On the Lock Screen
Widgets screen they find a "How to add the widget" setup
instructions card with a numbered step list — long-press the Lock
Screen, tap Customize, tap a widget slot below the clock, search
"spot", pick one of the three families (rectangular, circular,
inline), tap to add. The user follows the steps, picks the
rectangular family, and the widget appears in the Lock Screen
slot rendering the current configuration from the App Group with
the correct tint.

**Why P1**: Without this guidance, a non-technical reviewer
cannot complete the round-trip. The widgets are real and shippable
but invisible until added. Co-equal P1 with Story 1 because Story
1's "the widget refreshes" beat is unverifiable until at least one
lock-screen accessory widget has actually been added by following
the guidance in this story.

**Independent Test**: After Story 1 is shipped, open the Lock
Screen Widgets screen on an iOS 16+ device with no spot
lock-screen widget yet on the Lock Screen, follow the setup
instructions card verbatim, and verify that searching "spot" in
the Lock Screen widget gallery returns a single entry exposing
exactly three accessory family options (rectangular, circular,
inline), and that adding any family results in a widget that
renders the current configuration from the App Group lock-config
keys.

**Acceptance Scenarios**:

1. **Given** the user is on the Lock Screen Widgets screen on
   iOS 16+, **When** the screen renders, **Then** a "How to add
   the widget" setup instructions card MUST be visible with a
   numbered step list covering at minimum: long-press the Lock
   Screen, tap Customize, tap a widget slot, search "spot", pick
   rectangular / circular / inline, tap to add.
2. **Given** the user follows the setup instructions and reaches
   Apple's Lock Screen widget gallery, **When** they search for
   "spot", **Then** the spot lock-screen widget MUST appear as a
   single gallery entry exposing exactly three accessory family
   options: `.accessoryRectangular`, `.accessoryCircular`, and
   `.accessoryInline`.
3. **Given** the user picks an accessory family and adds the
   widget, **When** the widget first appears on the Lock Screen,
   **Then** it MUST render the current configuration from the
   shared App Group `UserDefaults` suite under the lock-config
   key namespace (showcase value, counter, tint) — not a
   hardcoded placeholder — within the accessory family chosen.
4. **Given** no configuration has yet been pushed by the user,
   **When** the lock-screen widget is first added, **Then** it
   MUST render the documented default configuration (showcase
   value `"Hello, Lock!"`, counter `0`, the documented default
   tint) rather than a blank or error chrome.
5. **Given** the user has added all three accessory families to
   different Lock Screen slots, **When** any push is performed,
   **Then** all three slots MUST refresh within one second and
   each MUST render the same shared configuration in its
   family-appropriate layout.

---

### User Story 3 — Cross-platform parity for the in-app preview half (Priority: P2)

A user opens the Lock Screen Widgets screen on Android, on the
web build, or on iPhone running iOS < 16. The screen renders a
"Lock Screen Widgets are iOS 16+ only" banner at the top, but
critically the **live preview panel still renders** so the user
can still see the three accessory family approximations updating
as they edit the configuration. The configuration panel is shown
but its push button is visibly disabled with an inline
explanation ("Lock Screen Widgets require iOS 16 or later"). The
status panel hides the "next refresh time" line, the setup
instructions card is hidden, and the reload event log is hidden.

**Why P2**: Cross-platform parity for the *preview half* of the
module is required by Constitution Principle I. Without this
fallback, the module is broken on Android, Web, and iOS < 16. P2
rather than P1 because the headline value of the module is the
real Lock Screen widget on iOS 16+; the fallback exists to keep
the app structurally sound across platforms, not to deliver
Lock Screen widgets where they cannot exist.

**Independent Test**: Run the screen in a desktop web browser, on
an Android device or simulator, and (if available) on an iPhone
with iOS 15 or earlier. In each case verify the screen renders,
the iOS-only banner is visible, the configuration panel and the
three accessory preview cards render and update with edits, the
"Push to lock-screen widget" button is disabled, the status
panel's next-refresh-time line is hidden, the setup instructions
card is hidden, and the reload event log is hidden.

**Acceptance Scenarios**:

1. **Given** the user opens the Lock Screen Widgets screen on
   Android, Web, or iOS < 16, **When** the screen renders,
   **Then** a "Lock Screen Widgets are iOS 16+ only" banner MUST
   be visible at the top of the content area explaining that
   WidgetKit lock-screen accessories are unavailable on this
   platform / version.
2. **Given** the user is on a non-iOS-16+ platform, **When** the
   screen renders, **Then** the configuration panel and the
   three accessory preview cards (rectangular / circular /
   inline) MUST be shown; the "Push to lock-screen widget"
   button MUST be visibly disabled with an inline explanation;
   the status panel's "next refresh time" line, the setup
   instructions card, and the reload event log MUST NOT be
   shown.
3. **Given** the user is on a non-iOS-16+ platform, **When** they
   edit the showcase value, the counter, or the tint, **Then**
   the three accessory preview cards MUST update within the same
   render pass exactly as on the iOS path.
4. **Given** the user is on a non-iOS-16+ platform, **When** any
   code path attempts to call `reloadTimelinesByKind`, **Then**
   the bridge MUST throw a `WidgetCenterNotSupported` error
   (consistent with 014's bridge contract) rather than silently
   no-oping, so misuse is loud.
5. **Given** the user is on a non-iOS-16+ platform, **When**
   `isAvailable()` is called, **Then** it MUST return `false`
   without throwing so the screen can branch on it defensively.

---

### Edge Cases

- **No widget installed when Push is tapped** — Tapping
  "Push to lock-screen widget" when no spot lock-screen widget
  has been added to the Lock Screen MUST still write the
  configuration to the App Group and call
  `reloadTimelines(ofKind: "SpotLockScreenWidget")`; the bridge
  MUST resolve successfully (WidgetKit treats reload of an empty
  set of kind instances as a no-op) and the per-kind reload
  event log MUST still record the event so the user gets
  feedback.
- **Empty showcase value** — When the user clears the
  showcase-value text field and taps Push, the screen MUST
  either disable the push button or push the documented default
  (`"Hello, Lock!"`); the chosen behaviour MUST be consistent
  across the iOS push path and the in-app accessory previews.
  The behaviour MUST match 014's empty-input policy so the two
  demos do not diverge in unrelated ways.
- **Counter at extreme values** — Counter values outside the
  documented reasonable range (negative, or values too large to
  fit `.accessoryRectangular` / `.accessoryCircular` /
  `.accessoryInline` layouts) MUST be either clamped at the
  input layer or rendered with a documented overflow treatment;
  the Swift side MUST NOT crash on any 32-bit signed integer
  value. `.accessoryInline` (the single-line family) MUST
  truncate gracefully; `.accessoryCircular` (smallest family)
  MUST abbreviate.
- **Rapid Push to lock-screen widget** — Tapping Push rapidly in
  succession MUST be safe; each tap MUST appear in the per-kind
  reload event log in the order it was fired; the App Group
  `UserDefaults` suite MUST end in a state consistent with the
  most recent push.
- **App Group read failure on widget side** — If the lock-screen
  widget extension fails to read the App Group `UserDefaults`
  suite (e.g. on first launch before any push, or if the suite
  is missing entirely), the TimelineProvider MUST return a
  placeholder entry with the documented default configuration
  rather than crashing the widget; the Lock Screen MUST never
  display a broken-widget chrome.
- **Per-kind reload event log overflow** — When the user pushes
  more than 10 reloads in a single screen session, the per-kind
  reload event log MUST always show exactly the 10 most recent
  reloads; older entries MUST not reappear after eviction.
- **Backgrounding during Push** — Backgrounding the app while a
  Push call is in flight MUST not corrupt the App Group
  `UserDefaults` suite; on return to foreground the suite MUST
  reflect the completed push if it succeeded, and the per-kind
  reload event log MUST reflect either a success or a
  clearly-marked failure entry.
- **Reload event log empty state on first mount** — Per US1
  AS5 / FR-LW-029, the per-kind reload event log MUST render an
  explicit "No reloads yet" line on first mount rather than an
  empty list with no affordance.
- **Widget rendering when App Group is brand-new** — When a
  lock-screen accessory widget is added to the Lock Screen
  before the user has ever opened the Lock Screen Widgets
  screen, the widget MUST render the documented default
  configuration; the user MUST NOT be required to push at
  least once before the widget will display anything.
- **Widget removed while screen is open** — Removing a
  lock-screen accessory widget from the Lock Screen while the
  Lock Screen Widgets screen is open MUST NOT affect the in-app
  preview cards, the configuration panel, or the per-kind
  reload event log; the next Push tap MUST still succeed (per
  the empty-set edge case above).
- **014 home widget and 027 lock widget pushed in alternation** —
  Pushing 014's home widget config MUST NOT cause 027's
  lock-screen widget to refresh, and pushing 027's lock-screen
  config MUST NOT cause 014's home widget to refresh. Both
  reload event logs MUST remain independent.
- **App Group key collision with 014** — 014's home widget keys
  (under `spot.widget.config`) and 027's lock-screen keys (under
  `spot.widget.lockConfig`) MUST live under disjoint key
  namespaces in the same App Group `UserDefaults` suite; reading
  one namespace MUST NOT return values written into the other.
- **Plugin re-prebuild idempotency** — Running `npx expo
  prebuild` twice MUST NOT duplicate the four Swift sources in
  the widget extension target's `Sources` build phase, MUST NOT
  duplicate the marker-guarded insertion into 014's
  `WidgetBundle`, and MUST NOT regress 014's
  `with-home-widgets` plugin output. The order of plugin
  invocation in `app.json` MUST NOT affect the final Xcode
  project state.
- **iOS 17+ widget container chrome** — On iOS 17+ the accessory
  views MUST apply `.containerBackground(.fill.tertiary, for:
  .widget)` so the widget renders inside the system-provided
  container; on iOS 16.0–16.x (no `containerBackground` API)
  the views MUST fall back to a transparent background and
  `.contentMarginsDisabled()` so the layout still fits inside
  the lock-screen accessory bounds.

## Requirements *(mandatory)*

### Functional Requirements

#### Module registration & gating

- **FR-LW-001**: The Lock Screen Widgets module MUST be registered
  in the registry introduced by feature 006 with id
  `lock-widgets-lab`, label `"Lock Screen Widgets"`, supported
  platforms `['ios','android','web']`, and `minIOS: '16.0'`.
  No existing registry entry may be modified.
- **FR-LW-002**: The Modules home grid MUST display the Lock
  Screen Widgets card alongside other registered modules using
  the same card visual treatment, with iOS-version gating
  handled by spec 006's existing `minIOS` mechanism (no
  parallel gating in this module).
- **FR-LW-003**: Tapping the Lock Screen Widgets card MUST
  navigate to the Lock Screen Widgets screen via the registry's
  standard navigation flow.
- **FR-LW-004**: On iOS versions below 16.0, the registry's
  `minIOS` gating MUST mark the card as unavailable per spec 006
  conventions; the module MUST NOT attempt to load
  iOS-16-only native bridge symbols on those versions.

#### WidgetKit lock-screen widget definition (iOS 16+)

- **FR-LW-005**: The module MUST define exactly one widget kind
  identifier — `SpotLockScreenWidget` — declared via
  `StaticConfiguration` and exposing exactly the three accessory
  families: `.accessoryRectangular`, `.accessoryCircular`,
  `.accessoryInline`. No other families (`.systemSmall` etc.)
  MUST be declared on this kind.
- **FR-LW-006**: The widget MUST be added to the **existing**
  `WidgetBundle` introduced by feature 014 by appending a
  `LockScreenAccessoryWidget()` entry between the existing
  marker comments. A new widget extension target MUST NOT be
  created.
- **FR-LW-007**: The configuration MUST use `StaticConfiguration`
  (no Intent / `IntentConfiguration`); user-facing per-widget
  configuration is explicitly out of scope.
- **FR-LW-008**: The widget MUST be discoverable in Apple's Lock
  Screen widget gallery search by the substring `"spot"`
  (case-insensitive), and MUST present a one-line description
  visible in the gallery suitable for non-technical users.

#### TimelineProvider & timeline policy

- **FR-LW-009**: The lock-screen widget's TimelineProvider
  (`LockScreenAccessoryProvider`) MUST implement the three
  required `TimelineProvider` methods: `placeholder`,
  `getSnapshot`, and `getTimeline`. `placeholder` MUST return a
  hardcoded preview-friendly entry that does not depend on the
  App Group (because the system may render placeholders before
  the app has run).
- **FR-LW-010**: `getSnapshot` MUST read the current
  configuration from the shared App Group `UserDefaults` suite
  under the lock-config key namespace and return a
  `LockScreenAccessoryEntry` reflecting that configuration; on
  read failure it MUST return the documented default
  configuration entry rather than throwing.
- **FR-LW-011**: `getTimeline` MUST read the current
  configuration from the same suite, build a single
  `LockScreenAccessoryEntry` dated `now`, and return a timeline
  whose reload policy schedules the next refresh at a documented
  cadence (e.g. `.after(now + 30 min)`) so the widget keeps
  refreshing even without an explicit per-kind reload call. The
  cadence MUST be the same as 014 uses unless documented
  otherwise in plan.md.
- **FR-LW-012**: A `LockScreenAccessoryEntry` MUST contain at
  minimum the fields `date: Date`, `showcaseValue: String`,
  `counter: Int`, and `tint: Tint`, where `Tint` enumerates the
  same four documented swatches 014 uses (so swatch labels stay
  consistent across the home and lock screen demos).

#### SwiftUI accessory views

- **FR-LW-013**: The three accessory family views MUST live in
  `LockScreenAccessoryViews.swift` and MUST branch on
  `@Environment(\.widgetFamily)` to render
  `.accessoryRectangular`, `.accessoryCircular`, and
  `.accessoryInline` layouts. The Swift source MUST NOT define
  separate Widget kinds per family.
- **FR-LW-014**: All three layouts MUST display the showcase
  value and the counter in family-appropriate prominence and
  MUST honour the configured tint as the dominant accent (where
  Lock Screen rendering rules permit — Lock Screen widgets are
  rendered in `vibrantForegroundStyle` on most iOS versions, so
  tint may be expressed via shape contrast rather than colour;
  the design MUST nonetheless make the four tint values visually
  distinguishable).
  - `.accessoryRectangular` MUST display the showcase value as
    the primary line and the counter as a secondary line.
  - `.accessoryCircular` MUST display the counter prominently
    (single-glyph layout) with the showcase value abbreviated or
    omitted.
  - `.accessoryInline` MUST collapse to a single line of the
    form `<showcaseValue> · <counter>` and MUST truncate
    gracefully.
- **FR-LW-015**: All three accessory views MUST apply
  `.contentMarginsDisabled()` so they fit inside the system
  accessory bounds, and on iOS 17+ MUST apply
  `.containerBackground(.fill.tertiary, for: .widget)`. iOS 16.x
  fallback MUST not call `.containerBackground` (API
  unavailable) and MUST render with a transparent background
  instead.
- **FR-LW-016**: The accessory views MUST not perform any
  network calls, any disk reads other than the App Group
  `UserDefaults` suite read already performed by the timeline
  provider, or any long-running computation; rendering MUST
  complete within WidgetKit's documented per-render budget for
  Lock Screen accessories.

#### App Group & shared storage

- **FR-LW-017**: The lock-screen widget MUST read from the
  **same App Group identifier** declared by feature 014; the
  config plugin MUST NOT add a new App Group, MUST NOT modify
  the existing App Group identifier, and MUST NOT alter the
  App Group entitlement on either the main app target or the
  widget extension target. This feature reuses 014's App Group
  wiring exactly.
- **FR-LW-018**: A separate widget extension target MUST NOT
  be created. The four new Swift sources MUST be added to 014's
  existing widget extension target by appending them to that
  target's `Sources` build phase via the
  `with-lock-widgets` config plugin.
- **FR-LW-019**: All shared lock-screen widget configuration
  MUST be stored in the same `UserDefaults(suiteName: <appGroupId>)`
  suite that 014 uses, but under a **disjoint key namespace**
  rooted at `spot.widget.lockConfig` (at minimum:
  `spot.widget.lockConfig.showcaseValue`,
  `spot.widget.lockConfig.counter`,
  `spot.widget.lockConfig.tint`). 014's keys (under
  `spot.widget.config`) MUST NOT be read or written by this
  feature.

#### JS bridge

- **FR-LW-020**: `src/native/widget-center.ts` MUST be extended
  additively with a function
  `reloadTimelinesByKind(kind: string): Promise<void>` that
  invokes
  `WidgetCenter.shared.reloadTimelines(ofKind: <kind>)`
  on the native side. If the bridge already provides this
  function, the existing implementation MUST be reused; if not,
  it MUST be added without breaking any existing exported
  symbol. The existing `reloadAllTimelines`, `getCurrentConfig`,
  `setConfig`, and `isAvailable` symbols MUST NOT be removed
  or renamed.
- **FR-LW-021**: On non-iOS platforms and on iOS < 16, calling
  `reloadTimelinesByKind` MUST throw a
  `WidgetCenterNotSupported` error (matching 014's bridge
  contract for unsupported platforms) rather than silently
  returning. `isAvailable()` MUST NOT throw and MUST return
  `false` on these platforms.
- **FR-LW-022**: The lock-config setter / getter pair MUST be
  implemented either by extending the existing native
  `setConfig` / `getCurrentConfig` to accept a key-namespace
  argument, or by introducing dedicated
  `setLockConfig(config)` / `getLockConfig()` symbols. The
  chosen approach MUST be additive (no removal of existing
  exports) and MUST be documented in plan.md.

#### Screen layout (TS)

- **FR-LW-023**: The Lock Screen Widgets screen MUST present a
  header with the title `"Lock Screen Widgets"`.
- **FR-LW-024**: On iOS 16+ the screen MUST present, in this
  fixed top-to-bottom order: (a) status panel showing the
  configuration the lock-screen widget would currently display
  (showcase value, counter, tint, next refresh time);
  (b) configuration panel containing a showcase-value text
  field, a counter input, a four-swatch tint picker, and a
  "Push to lock-screen widget" button; (c) live preview panel
  containing three accessory family preview cards
  (rectangular / circular / inline); (d) setup instructions
  card; (e) per-kind reload event log showing the last 10
  reload events.
- **FR-LW-025**: On Android, Web, and iOS < 16 the screen MUST
  present, in this fixed top-to-bottom order: (a) "Lock Screen
  Widgets are iOS 16+ only" banner; (b) the configuration panel
  with a visibly disabled "Push to lock-screen widget" button
  and an inline explanation; (c) the same three accessory
  preview cards. The status panel's "next refresh time" line,
  the setup instructions card, and the reload event log MUST
  NOT be shown on these platforms.

#### Configuration panel

- **FR-LW-026**: The configuration panel MUST follow 014's
  ConfigPanel control shape (showcase-value text field, counter
  input, four-swatch tint picker). DECISION: the panel MUST
  import the existing `ConfigPanel` (or its inner controls)
  from 014's module to avoid duplication. If during planning
  the cross-module import proves problematic (e.g. circular
  dependency, type drift, or ownership concerns), the planner
  MUST fall back to a local copy under
  `src/modules/lock-widgets-lab/components/ConfigPanel.tsx`
  and document the rationale in research.md. Either way the
  visible behaviour MUST match the FR descriptions in this
  document.
- **FR-LW-027**: The default values on first render MUST be:
  showcase value `"Hello, Lock!"`, counter `0`, the documented
  default tint (same swatch set as 014; default swatch
  identifier inherited from 014). These defaults MUST be
  exported as constants from `lock-config.ts` so tests can
  reference them.
- **FR-LW-028**: Tapping "Push to lock-screen widget" on iOS 16+
  MUST persist the current configuration to the App Group via
  the bridge (per FR-LW-022) and MUST then call
  `reloadTimelinesByKind('SpotLockScreenWidget')`; on success
  it MUST surface a user-visible confirmation and MUST prepend
  a new entry to the per-kind reload event log; on failure it
  MUST surface a user-visible error and MUST prepend a
  clearly-marked failure entry to the per-kind reload event
  log.

#### Per-kind reload event log

- **FR-LW-029**: The reload event log MUST be backed by an
  in-memory ring buffer of capacity exactly 10, implemented
  with a local React reducer; it MUST NOT be persisted across
  screen unmounts. When a new entry is added beyond capacity,
  the oldest entry MUST be evicted. Each entry MUST display, at
  minimum, a timestamp formatted in the user's locale, the
  kind identifier (`SpotLockScreenWidget`), and a status
  indicator (success / failure); failure entries MUST include a
  short error message. On first mount with no entries, an
  explicit empty-state line ("No reloads yet") MUST be
  rendered.
- **FR-LW-030**: The per-kind reload event log MUST be
  independent of any log maintained by feature 014. DECISION:
  per-kind logs are the chosen design so the lock-screen and
  home-screen demos can be observed without cross-talk. Cross
  contamination MUST be prevented by storing the log inside
  this module's screen state (not in any shared store).

#### Live preview panel (all platforms)

- **FR-LW-031**: The live preview panel MUST contain exactly
  three RN-rendered preview cards labelled "Rectangular",
  "Circular", and "Inline" approximating
  `.accessoryRectangular`, `.accessoryCircular`, and
  `.accessoryInline` respectively. Each MUST render with the
  configuration currently selected in the configuration panel.
- **FR-LW-032**: Edits to any field in the configuration panel
  MUST update all three preview cards within the same render
  pass; the previews MUST NOT depend on a successful Push call.
- **FR-LW-033**: The previews MUST honour the four tint
  swatches as the dominant accent in each card so the user can
  preview tint choices before pushing them to the real widget.
- **FR-LW-034**: The live preview panel MUST render on Android,
  Web, and iOS < 16 (per FR-LW-025) so non-iOS-16+ users still
  see the visual approximation of the three accessory families.

#### Setup instructions card (iOS 16+ only)

- **FR-LW-035**: The setup instructions card MUST contain a
  numbered step list explaining how to add a spot lock-screen
  accessory widget to the Lock Screen, including at minimum:
  long-press the Lock Screen, tap Customize, tap a widget slot
  (below the clock or above per iOS version), search "spot",
  pick rectangular / circular / inline, tap to add.
- **FR-LW-036**: The setup instructions card MUST be hidden on
  Android, Web, and iOS < 16 (per FR-LW-025) since no Lock
  Screen widget gallery exists on those platforms.

#### Status panel

- **FR-LW-037**: The status panel MUST display the showcase
  value, the counter, the tint, and (on iOS 16+) a
  next-refresh-time line indicating when the lock-screen
  TimelineProvider is next scheduled to read the App Group;
  the values MUST be the values most recently read by the
  screen from the lock-config getter, NOT the in-flight edits
  in the configuration panel.
- **FR-LW-038**: The status panel MUST refresh when the user
  pushes a new configuration so the displayed values stay
  consistent with what the real lock-screen widget will read.

#### Native packaging

- **FR-LW-039**: The Swift sources defining the lock-screen
  widget — `LockScreenAccessoryWidget.swift`,
  `LockScreenAccessoryProvider.swift`,
  `LockScreenAccessoryEntry.swift`, and
  `LockScreenAccessoryViews.swift` — MUST live under
  `native/ios/widgets/lock-screen/` in the repository, and
  MUST be added to feature 014's existing widget extension
  target by the `with-lock-widgets` config plugin at `expo
  prebuild` time.
- **FR-LW-040**: The `with-lock-widgets` config plugin MUST be
  idempotent (running `npx expo prebuild` twice MUST produce
  the same Xcode project state), MUST NOT modify or remove any
  file owned by feature 014's `with-home-widgets` plugin, MUST
  NOT modify or remove any file owned by feature 007's
  `with-live-activity` plugin, and MUST live in its own
  directory `plugins/with-lock-widgets/` (separate from 014's
  plugin per the autonomous DECISION below).
- **FR-LW-041**: The `with-lock-widgets` plugin MUST insert the
  `LockScreenAccessoryWidget()` entry into 014's `WidgetBundle`
  source by locating documented marker comments (e.g.
  `// MARK: spot-widgets:bundle:additional-widgets:start` /
  `:end`) and appending the entry between them. If the markers
  are absent, the plugin MUST fail loudly with a descriptive
  error rather than blindly editing arbitrary source. The
  plugin MUST be order-independent with respect to 014's plugin
  in the `app.json` plugins array (014 establishes the markers;
  027 only inserts between them).
- **FR-LW-042**: On non-iOS targets, no symbol from the
  lock-screen native bridge MUST be imported or evaluated at
  module load time; the iOS-only native bridge MUST be loaded
  only on iOS and only when the device meets the iOS 16+
  requirement.

#### Architecture (TS)

- **FR-LW-043**: The module's source MUST live under
  `src/modules/lock-widgets-lab/` with at minimum:
  `index.tsx` (manifest), `screen.tsx`, `screen.android.tsx`,
  `screen.web.tsx`, a `lock-config.ts` module, and a
  `components/` directory containing at least
  `StatusPanel.tsx`, `ConfigPanel.tsx` (or a re-export from
  014; per FR-LW-026), `AccessoryPreview.tsx`,
  `SetupInstructions.tsx`, `ReloadEventLog.tsx`.
- **FR-LW-044**: `lock-config.ts` MUST expose: a Zod-style or
  hand-rolled schema for the lock config shape, the documented
  default values, an AsyncStorage shadow store rooted at the
  key `spot.widget.lockConfig` (separate from 014's
  `spot.widget.config` key), and read / write helpers tolerant
  of malformed AsyncStorage payloads (returning defaults on
  parse failure rather than throwing).
- **FR-LW-045**: Platform-suffixed screen splits
  (`screen.android.tsx`, `screen.web.tsx`) MUST be used for the
  cross-platform fallback rather than `Platform.select` for any
  diff that touches more than a handful of style props.
  `Platform.select` is permitted only for trivial style or
  copy diffs.

#### Lifecycle

- **FR-LW-046**: Navigating away from the Lock Screen Widgets
  screen MUST tear down the screen cleanly: no asynchronous
  bridge callbacks MUST update React state after unmount; no
  layout warnings MUST be emitted; the in-memory per-kind
  reload event log MUST be discarded on unmount per
  FR-LW-029.
- **FR-LW-047**: When the app is backgrounded with the screen
  visible and returns to foreground, the status panel MUST
  refresh from the lock-config getter so any
  externally-changed App Group state is reflected.

#### Accessibility

- **FR-LW-048**: The showcase-value text field, the counter
  input, the four tint swatches, the "Push to lock-screen
  widget" button, the three accessory preview cards, the
  setup instruction steps, and the per-kind reload event log
  rows MUST each expose an accessibility label describing
  their function (e.g. "Showcase value", "Counter",
  "Tint: blue", "Push to lock-screen widget", "Rectangular
  preview", "Add lock-screen widget step 1 of 5", "Reload at
  14:02 succeeded").
- **FR-LW-049**: The "Lock Screen Widgets are iOS 16+ only"
  banner on Android / Web / iOS < 16 MUST expose its message
  to assistive technologies as a single accessible
  announcement on screen mount.
- **FR-LW-050**: The four tint swatches MUST be
  distinguishable to users who cannot perceive colour
  differences (accessibility labels naming the tint and / or a
  non-colour selection indicator such as a checkmark on the
  active swatch).

#### Quality & integration

- **FR-LW-051**: The full `pnpm check` suite (lint, typecheck,
  tests) MUST pass after the feature lands. No existing test
  may regress. `pnpm format` MUST be run before commits. NO
  `eslint-disable` directives for unregistered rules MUST be
  introduced.
- **FR-LW-052**: Comprehensive unit tests MUST exist:
  `lock-config.test.ts` (schema, defaults, AsyncStorage
  round-trip, error tolerance), one test file per component
  (`StatusPanel.test.tsx`, `ConfigPanel.test.tsx`,
  `AccessoryPreview.test.tsx`, `SetupInstructions.test.tsx`,
  `ReloadEventLog.test.tsx`), `screen.test.tsx`,
  `screen.android.test.tsx`, `screen.web.test.tsx`,
  `plugins/with-lock-widgets/index.test.ts` (verifies the
  plugin appends the four Swift sources to 014's widget
  extension target, is idempotent on second run, fails loudly
  if 014's bundle markers are absent, and does not regress
  014's plugin output), and `manifest.test.ts` (registry
  contract: id, label, platforms, minIOS).
- **FR-LW-053**: The baseline test totals at the start of this
  feature are 290 suites / 1984 tests (carried from feature
  026). The delta introduced by feature 027 MUST be tracked
  in plan.md and reported in the retrospective.

### Key Entities

- **RegistryEntry** — the new
  `{ id: 'lock-widgets-lab', label: 'Lock Screen Widgets',
  platforms: ['ios','android','web'], minIOS: '16.0', screen }`
  record appended to `src/modules/registry.ts`.
- **LockConfig** — the in-app draft / persisted shape:
  `{ showcaseValue: string, counter: number, tint: Tint }`,
  defined by the schema in `lock-config.ts` with documented
  defaults `{ showcaseValue: 'Hello, Lock!', counter: 0,
  tint: <014-default-tint> }`.
- **Tint** — same four-swatch enum 014 exports (re-imported,
  not redefined, to keep label parity); shared visual language
  between the home-screen and lock-screen demos.
- **AccessoryFamily** — `'rectangular' | 'circular' | 'inline'`;
  used by the live preview panel to discriminate which
  approximation card is being rendered. Mirrors WidgetKit's
  `WidgetFamily` cases for the three accessory families.
- **LockScreenAccessoryEntry** (Swift) — `TimelineEntry`
  carrying `{ date: Date, showcaseValue: String, counter: Int,
  tint: Tint }`; consumed by all three accessory views.
- **ReloadLogEntry** — `{ at: Date, kind: 'SpotLockScreenWidget',
  status: 'success' | 'failure', error?: string }`. Bounded
  to the last 10 entries by FR-LW-029.
- **WidgetCenterError** — `WidgetCenterNotSupported` thrown by
  the JS bridge on non-iOS / iOS < 16 callers (matches 014's
  contract; not redefined here).

## Non-Functional Requirements

- **NFR-LW-001 (Performance)**: Opening the Lock Screen Widgets
  screen MUST render to first paint within 500 ms on a recent
  iPhone; the status panel MUST populate within 1 s of mount
  from the lock-config getter.
- **NFR-LW-002 (Responsiveness)**: A successful Push to
  lock-screen widget MUST update the per-kind reload event log
  within 500 ms of the bridge call resolving; the lock-screen
  widget on the device MUST refresh within 1 s of the reload
  call (per US1 AS4).
- **NFR-LW-003 (Footprint)**: No new runtime dependency is
  added by this feature. `package.json` and `pnpm-lock.yaml`
  MUST remain unchanged at the dependency level (lockfile churn
  unrelated to dependency changes is acceptable).
- **NFR-LW-004 (Idempotency)**: Running `npx expo prebuild`
  twice in succession MUST produce an Xcode project state with
  no duplicated source files in the widget extension target's
  `Sources` build phase, no duplicated marker-bounded
  `LockScreenAccessoryWidget()` insertion in 014's
  `WidgetBundle`, and no regression of 014's
  `with-home-widgets` output.
- **NFR-LW-005 (Offline)**: The module MUST be fully functional
  with the device in airplane mode. No code path may require
  network.
- **NFR-LW-006 (Coexistence)**: Features 007 (Live Activities),
  014 (Home Widgets), 024 (MapKit), 025 (Core Location), and
  026 (Rich Notifications) MUST continue to function unchanged
  with the new plugin installed. Specifically: 007's Live
  Activity widgets and 014's home-screen widget MUST continue
  to render their previous behaviour, and 014's
  `reloadAllTimelines()` call MUST continue to work as before.
- **NFR-LW-007 (Accessibility)**: All buttons and controls in
  the five panels MUST have `accessibilityLabel`s; the status
  panel and preview cards MUST be readable by VoiceOver.
- **NFR-LW-008 (Logging hygiene)**: The in-memory per-kind
  reload event log is the only sink for reload-lifecycle data;
  no `console.log` of widget configuration may ship in release
  builds (gated by `__DEV__`).
- **NFR-LW-009 (Constitution v1.1.0)**: Additive integration
  only; no edits to unrelated modules, screens, or plugins; the
  only modification of any 014 file is the marker-guarded
  `WidgetBundle` insertion performed at prebuild time by 027's
  plugin (no source-tree edits to 014's plugin or screen). All
  changes pass `pnpm check`.

## Acceptance Criteria

A feature delivery is accepted when **all** of the following
hold:

- **AC-LW-001**: The registry contains a single new entry with
  `id: 'lock-widgets-lab'` and the platforms / minIOS fields
  above. Diff against the branch parent shows registry size +1
  and no other registry edits.
- **AC-LW-002**: `app.json` `plugins` contains a single new
  entry `./plugins/with-lock-widgets`. Diff shows +1 plugin and
  no other plugin edits.
- **AC-LW-003**: `package.json` adds zero new dependencies; the
  dependency block diff is empty.
- **AC-LW-004**: `pnpm check` (lint, typecheck, tests) passes
  with zero new failures. The test totals are at least 290
  suites / 1984 tests (the baseline from feature 026); the
  delta introduced by 027 is reported in plan.md and the
  retrospective.
- **AC-LW-005**: On a fresh install on iOS 16+, US1 end-to-end
  test passes: configure → push → lock-screen accessory widget
  refreshes within 1 s → per-kind reload event log records the
  event tagged with kind `SpotLockScreenWidget`.
- **AC-LW-006**: US2 end-to-end test passes: searching "spot"
  in the Lock Screen widget gallery returns a single entry
  exposing exactly the three accessory families; adding any
  family renders the current App Group lock-config.
- **AC-LW-007**: US3 cross-platform test passes: the screen
  renders on Android, Web, and iOS < 16 with the iOS-only
  banner, the disabled push button, the three accessory preview
  cards, and no setup instructions card / reload event log
  visible. Calling `reloadTimelinesByKind` on these platforms
  throws `WidgetCenterNotSupported`.
- **AC-LW-008**: Idempotency test passes: running `npx expo
  prebuild` twice produces unchanged widget extension target
  `Sources` and unchanged 014 `WidgetBundle` source on the
  second run; no duplicate marker insertion is observed.
- **AC-LW-009**: Cross-feature isolation test passes: pushing
  014's home-widget config does not refresh 027's lock-screen
  widget and vice versa; the two reload event logs remain
  independent; the App Group key namespaces
  (`spot.widget.config` vs `spot.widget.lockConfig`) remain
  disjoint.
- **AC-LW-010**: 014 regression test passes: 014's home-widget
  config flow (push, reloadAllTimelines, status panel,
  ReloadEventLog) continues to work unchanged after 027's
  plugin is installed and after a clean `expo prebuild`.
- **AC-LW-011**: No-new-extension-target audit passes:
  inspecting the generated Xcode project shows that no new
  widget extension target was created and the four 027 Swift
  files appear in 014's existing widget extension target's
  `Sources` build phase.
- **AC-LW-012**: Comprehensive unit-test coverage exists per
  FR-LW-052; every listed test file is present and passes.
- **AC-LW-013**: No `eslint-disable` directive for an
  unregistered rule appears anywhere in 027's source. `pnpm
  format` was run before the merge commit.

## Out of Scope

- New widget extension target creation (forbidden by
  FR-LW-018).
- Interactive widgets (App Intents / Button(intent:) /
  Toggle(intent:)) — belongs with feature 013.
- StandBy mode optimisation, Always-On rendering modes, and
  complex `widgetRenderingMode` handling.
- iOS < 16 backports of accessory widgets (not technically
  feasible).
- Editing 014's plugin, screen, registry entry, or App Group
  identifier; editing any 007 / 024 / 025 / 026 file. The only
  permitted touch on a 014 file is the marker-guarded
  `WidgetBundle` insertion performed by 027's plugin at
  prebuild time.
- Persistence of the per-kind reload event log across screen
  unmounts or app launches.
- Localisation of widget copy beyond what the user types into
  the showcase-value field.
- Adding a new App Group, modifying the existing App Group
  identifier, or migrating any 014 keys.

## Open Questions (resolved)

All ambiguities below were resolved autonomously with reasonable
defaults; none remain blocking.

1. **One widget kind exposing three families, or three widget
   kinds (one per family)?** — Resolved: **one widget kind**,
   `SpotLockScreenWidget`, declared via `StaticConfiguration`
   with `supportedFamilies: [.accessoryRectangular,
   .accessoryCircular, .accessoryInline]`. Three kinds would
   force three separate gallery entries and three reload-by-kind
   calls, contradicting the "single kind, three families"
   shape that mirrors how WidgetKit's documentation models
   accessory widgets.
2. **Same widget extension target as 014, or a new one?** —
   Resolved: **same target as 014** (FR-LW-006 / FR-LW-018). A
   new target would duplicate App Group entitlement wiring,
   bundle-id derivation, and code signing, all already solved
   by 014. The 027 plugin appends Swift files to 014's existing
   target.
3. **Same App Group as 014, or a new one?** — Resolved: **same
   App Group as 014** (FR-LW-017). The widget extension is the
   same target; the App Group is part of that target's
   entitlement; introducing a second App Group would add
   complexity without value.
4. **Same App Group key namespace as 014, or a separate one?** —
   Resolved: **separate key namespace** (FR-LW-019), rooted at
   `spot.widget.lockConfig`. This keeps the home-screen and
   lock-screen demos independently observable, prevents
   accidental cross-contamination during testing, and lets the
   reviewer push different configurations to the two surfaces
   simultaneously.
5. **Single Expo plugin or separate plugin?** — Resolved:
   **separate plugin** at `plugins/with-lock-widgets/`
   (FR-LW-040). 014's plugin remains untouched. 027's plugin
   appends Swift sources and inserts a marker-guarded entry
   into 014's `WidgetBundle`. This isolates ownership: 014
   continues to own the extension target's existence and the
   App Group entitlement; 027 owns adding lock-screen
   accessory widget files. A single combined plugin would
   require editing 014's plugin, which is forbidden by the
   additive-integration rule.
6. **`reloadAllTimelines` or `reloadTimelines(ofKind:)`?** —
   Resolved: **per-kind reload** (FR-LW-020 /
   FR-LW-028). This is the minimum-blast-radius reload call
   and demonstrates the surface that 014's global reload does
   not. It also keeps the 014 home widget from refreshing
   spuriously when the user is exercising the 027 demo.
7. **Per-kind reload event log, or shared with 014?** —
   Resolved: **per-kind log** (FR-LW-029 / FR-LW-030), kept in
   the 027 module's screen state. Sharing a log with 014 would
   require either editing 014's screen (forbidden by additive
   integration) or introducing a global store (overkill for a
   demo affordance).
8. **Reuse 014's `ConfigPanel` component or copy it?** —
   Resolved: **import from 014** (FR-LW-026) by default, with
   an explicit fall-back-to-local-copy clause if cross-module
   import becomes problematic during planning. Keeping the
   import path live ensures the two demos stay visually
   consistent without manual sync. The fall-back exists so a
   discovered ownership / circular-import issue does not block
   delivery.
9. **Default showcase value: reuse 014's `"Hello, Widget!"` or
   pick a new one?** — Resolved: **`"Hello, Lock!"`**
   (FR-LW-027). A distinct default makes it visually obvious
   in the demo which surface a given push targeted.
10. **iOS 17+ `containerBackground` handling?** — Resolved:
    **gate on iOS 17+** (FR-LW-015) using
    `if #available(iOS 17, *)` in Swift. iOS 16.0–16.x renders
    with a transparent background and `.contentMarginsDisabled()`.
    This is the documented WidgetKit migration path.
11. **Where do the Swift sources live?** — Resolved:
    `native/ios/widgets/lock-screen/` (FR-LW-039). Mirrors
    014's `native/ios/home-widgets/` layout under a single
    `widgets/` parent directory so future widget surfaces
    (e.g. StandBy, watchOS) can be added with a clear pattern.
12. **AsyncStorage shadow store key naming?** — Resolved:
    `spot.widget.lockConfig` (FR-LW-044), parallel to 014's
    `spot.widget.config`. The shadow store exists so non-iOS
    platforms can still configure the live preview panel
    without an App Group.
13. **Plugin failure mode if 014's `WidgetBundle` markers are
    missing?** — Resolved: **fail loudly** (FR-LW-041) with a
    descriptive error pointing at 014's plugin. Silent
    no-op or blind regex insertion would risk subtle
    Xcode-project corruption.
14. **What does iOS 16 lock-screen rendering do with the tint?** —
    Resolved: Lock Screen widgets render in `vibrantForegroundStyle`,
    so colour fidelity is limited; the tint is expressed via
    shape contrast where colour cannot be honoured (FR-LW-014).
    Accessibility labels still name the tint per FR-LW-050.
15. **Test baseline tracking?** — Resolved: baseline at start
    is **290 suites / 1984 tests** (carried from feature 026
    completion). The 027 delta is tracked in plan.md and the
    retrospective per FR-LW-053.

## Assumptions

- Feature 014's widget extension target exists and is wired up
  with a working App Group entitlement, an `Info.plist` that
  declares the extension's `NSExtensionPointIdentifier`, a
  `WidgetBundle` source containing the agreed marker comments,
  and a Swift bridge in the main app target that already
  exposes `WidgetCenter.shared.reloadAllTimelines()`.
- Feature 014's `WidgetBundle` source either already contains
  the marker comments
  (`spot-widgets:bundle:additional-widgets:start` / `:end`) or
  will be updated by feature 014's owners to add them. If the
  markers are absent at the time 027 is implemented, the planner
  MUST coordinate with 014's owners to add them as a
  prerequisite; 027's plugin MUST fail loudly if the markers
  are still missing at prebuild time (FR-LW-041).
- `src/native/widget-center.ts` already exists from feature 014;
  this feature extends it additively. If
  `reloadTimelinesByKind` is already exposed (e.g. as a private
  helper), the existing implementation is reused; otherwise it
  is added without breaking existing exports (FR-LW-020).
- Feature 026's tests pass at the documented baseline of 290
  suites / 1984 tests on the feature branch parent
  (`026-rich-notifications`); 027's `pnpm check` runs against
  that baseline.
- iOS 16.0 is the floor for Lock Screen accessory widgets; the
  registry enforces `minIOS: '16.0'`. iOS 16.x renders without
  `.containerBackground`; iOS 17+ uses the new container API.
- The same `Tint` enum and the same four-swatch design carry
  over from 014; the lock-screen demo does not introduce new
  swatches.
- The `expo-task-manager`, `expo-location`, and
  `expo-notifications` packages added by features 024 / 025 /
  026 are NOT used by this feature; no transitive dependency is
  taken on them.
- The bundle-identifier-derived App Group used by 014 (e.g.
  `group.com.izkizk8.spot.showcase`) remains the canonical
  identifier; 027 reads from and writes to this exact suite.
- `AsyncStorage` (already a transitive dependency of the project
  via 014) is the AsyncStorage shadow store used by
  `lock-config.ts`. No new storage dependency is introduced.
- Constitution v1.1.0 governs this feature: additive
  integration only, no edits to unrelated modules, all changes
  pass `pnpm check`, `pnpm format` is run before commits, and
  no `eslint-disable` directive for an unregistered rule is
  introduced.
