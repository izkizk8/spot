# Feature Specification: Focus Filter Intents Module

**Feature Branch**: `029-focus-filters`
**Feature Number**: 029
**Created**: 2026-05-07
**Status**: Approved (autonomous, no clarifications needed)
**Input**: iOS 16+ module showcasing **Focus Filters** — the
mechanism by which an app exposes user-toggleable, per-Focus
configuration values via a `SetFocusFilterIntent` AppIntent
subclass. The user binds the filter to a system Focus
(e.g. Work Focus) in Settings → Focus → Add Filter; when that
Focus activates, iOS invokes the filter intent on the app's
behalf, the app persists the filter values to its App Group,
and the in-app UI adapts to those values. Builds additively
on feature 013 (App Intents — establishes the AppIntent
toolchain) and reuses feature 014's App Group identifier and
entitlement (no new App Group). Branch parent is
028-standby-mode.

## Overview

The Focus Filter Intents module ("Focus Filters") is a
feature card in the iOS Showcase registry (`id:
'focus-filters-lab'`, label `"Focus Filters"`, `platforms:
['ios','android','web']`, `minIOS: '16.0'`). Tapping the card
opens a single screen with six panels arranged in a fixed
top-to-bottom order:

1. **Explainer card** — what Focus Filters are; how the user
   binds the filter in Settings → Focus → pick a Focus → Add
   Filter; how iOS invokes the filter intent at Focus
   activation / deactivation; what the demo filter exposes
   (`mode` enum + `accentColor` string).
2. **Filter definition card** — describes the single demo
   filter `ShowcaseModeFilter` and its two parameters: a
   three-segment `mode` picker (`relaxed` / `focused` /
   `quiet`) and a four-swatch `accentColor` picker. Both
   controls let the user **preview the filter's effect**
   in-app via segmented controls / swatch buttons; the draft
   selection feeds the in-app demo (panel 4) but does NOT
   itself write to the App Group — only the system-invoked
   filter does that.
3. **Current filter state panel** — reads the most recently
   persisted filter values from the App Group (which the
   native filter writes when iOS invokes it) and displays
   them. Refreshes on screen mount and whenever the app
   transitions to the foreground (`AppState === 'active'`).
   When no values have been persisted yet, the panel renders
   an empty-state line ("No Focus filter has been applied
   yet").
4. **In-app demo** — a status pill at the top of the demo
   block shows the **active filter values**: the persisted
   `mode` and `accentColor`, OR — when the "Pretend filter is
   active" toggle is ON — the user-authored draft from panel
   2. The demo body re-tints and re-labels itself based on
   whichever values are active so the reviewer can see the
   filter take effect without setting up a real Focus on the
   device. The pill is also where the system Focus name is
   displayed when one is associated with the most recent
   activation event (best-effort; see DECISION 4 in *Open
   Questions (resolved)*).
5. **Setup instructions card** — numbered step list for
   binding the filter to a real Focus: open Settings → Focus
   → pick a Focus (e.g. Work) → Add Filter → search "spot" →
   tap "Showcase Mode" → set `mode` and `accentColor` → Done.
6. **Event log** — independent FIFO log of the last 10
   filter activation / deactivation events, kept in-memory
   for the lifetime of the screen. Each entry shows a
   timestamp, the event type (`activated` / `deactivated` /
   `simulated`), and the resulting filter values; simulated
   events come from the "Pretend filter is active" toggle
   (panel 4).

The feature is purely additive at the integration boundary:

1. `src/modules/registry.ts` — one new import line + one new
   array entry (registry size +1). No existing entry is
   modified.
2. `app.json` `plugins` array — one new entry
   (`./plugins/with-focus-filters`). Coexists with all prior
   plugins including 007's `with-live-activity`, 013's
   `with-app-intents`, 014's `with-home-widgets`, 026's
   `with-rich-notifications`, 027's `with-lock-widgets`, and
   028's `with-standby-widget`.
3. `package.json` / `pnpm-lock.yaml` — **no new runtime
   dependency**. AppIntents and Focus Filters ship with iOS
   16+; the JS bridge is a thin wrapper over an
   `expo-modules-core` optional native module read of the
   same App Group `UserDefaults` suite 014 / 027 / 028
   already use; no new package is added.
4. `plugins/with-focus-filters/` — new Expo config plugin
   that idempotently APPENDS the two new Swift files
   (`ShowcaseModeFilter.swift`, `FocusFilterStorage.swift`)
   to the main app target's compile sources. The plugin
   MUST NOT create a new target, MUST NOT modify the App
   Group entitlement (014 owns it), MUST NOT modify 013's
   `with-app-intents` plugin or its Swift sources, and MUST
   NOT modify or remove any file owned by features 014 /
   027 / 028 / 026 / 007. The plugin MUST be commutative
   with all prior plugins (the order of plugin entries in
   `app.json` MUST NOT affect the final Xcode project
   state).
5. `src/native/focus-filters.ts` — new bridge module added
   alongside the other `src/native/*.ts` bridges. Mirrors
   013's `app-intents.ts` shape (`requireOptionalNativeModule`
   + Platform / version gate + typed error class). No
   existing bridge is modified.

No existing module, screen, plugin, registry entry, or
shared App Group identifier is modified beyond the documented
additive lines above. Features 007, 013, 014, 024, 025, 026,
027, and 028 continue to work unchanged.

## Goals

- Demonstrate iOS 16+ Focus Filters by shipping a real
  `SetFocusFilterIntent` subclass that the system can invoke
  when the user binds it to a Focus, proving the showcase
  principle that an Expo app can expose a Focus-aware
  configuration surface using stock platform APIs and zero
  third-party libraries.
- Cover both supported parameter shapes that
  `SetFocusFilterIntent` exposes — an `AppEnum` parameter
  (`mode`) and a primitive parameter (`accentColor` string
  identifier) — so a reviewer can see how multi-parameter
  filters are declared in `@Parameter(...)` and how the
  resulting Settings UI lays them out.
- Prove that an Expo app can ship a Focus Filter without a
  separate target — by adding the `SetFocusFilterIntent`
  Swift sources directly to the main app target via an
  idempotent, additive config plugin, reusing 014's existing
  App Group entitlement to communicate the persisted filter
  values to the JS layer.
- Provide a self-contained authoring loop (preview the
  filter's effect via the in-app pretend-toggle → bind it to
  a real Focus → activate that Focus on the device → see the
  in-app demo and current-state panel update with the
  persisted values → see an entry appear in the event log)
  that a reviewer can exercise end-to-end with no external
  dependencies.
- Keep the integration footprint minimal: one registry line,
  one plugin entry, zero new runtime dependencies, two
  Swift files (`ShowcaseModeFilter.swift` and
  `FocusFilterStorage.swift`), one JS bridge file.
- Demonstrate the **graceful in-app simulation path** so the
  module remains demoable even when the reviewer cannot or
  does not want to bind a real Focus on their device — the
  "Pretend filter is active" toggle produces the same
  visible effect on the in-app demo as a real filter
  invocation would.

## Non-Goals

- **No new App Group.** 014's App Group identifier (already
  in use by 014, 027, and 028) is reused as-is; the plugin
  MUST NOT modify the App Group entitlement on the main app
  target or the widget extension target.
- **No iOS < 16 support.** `SetFocusFilterIntent` is iOS 16+
  only. The card is gated by `minIOS: '16.0'`; older iOS
  versions, Android, and Web see only the explainer +
  filter-definition + in-app demo half plus the
  iOS-16-only banner.
- **No widget integration.** The Focus filter values are
  consumed only by the in-app demo screen; this feature does
  NOT wire the filter values into 014's home widget, 027's
  lock-screen widget, or 028's StandBy widget. Cross-feature
  wiring (e.g. "Work Focus retints the home widget") is a
  separate future feature.
- **No multi-filter showcase.** Exactly one
  `SetFocusFilterIntent` subclass is shipped
  (`ShowcaseModeFilter`). Demonstrating multiple filters
  per app would dilute the showcase.
- **No `INFocusStatus` / `NSFocusFilterAvailabilityCenter`
  read of the system's currently-active Focus.** The module
  reads the persisted filter values written by its own
  intent invocation; it does NOT call any private or
  semi-private API to inspect the system Focus state.
- **No editing of feature 013's `with-app-intents` plugin or
  its Swift sources** (`LogMoodIntent.swift`,
  `GetLastMoodIntent.swift`, `GreetUserIntent.swift`,
  `SpotAppShortcuts.swift`). 013's plugin and 013's
  `AppShortcutsProvider` remain untouched. Per DECISION 2
  below, this feature does NOT declare its filter via an
  `AppShortcutsProvider`.
- **No editing of any prior module, plugin, screen, or
  registry entry** beyond the additive registry / plugin /
  bridge lines described in *Overview*.
- **No persistence of the in-memory event log across screen
  unmounts.** The log is a per-screen-session affordance.
- **No localisation of the filter parameter labels beyond
  what `LocalizedStringResource` ships with iOS 16's
  default locale.** Production-grade localisation is out of
  scope for the showcase.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Bind the showcase filter to a real Focus and observe the app adapt when that Focus activates (Priority: P1)

A user opens the Spot iOS Feature Showcase on an iPhone
running iOS 16 or later, sees a "Focus Filters" card on the
Modules home grid, and taps it. They land on a screen titled
"Focus Filters" that opens with the explainer card, the
filter definition card, the current filter state panel, the
in-app demo, the setup instructions card, and the event log.
They follow the setup instructions: open Settings → Focus →
pick the Work Focus → Add Filter → search "spot" → tap
"Showcase Mode" → set `mode = focused` and `accentColor =
blue` → Done. They activate the Work Focus from Control
Centre. They return to the Spot app. The current filter
state panel now displays `mode: focused, accentColor: blue`,
the in-app demo's status pill shows the same values (and the
Focus name "Work" if the system surfaces it), the demo body
re-tints with the blue accent and the focused-mode label,
and a new entry appears at the top of the event log with
type `activated`, the timestamp of the Focus activation, and
the resulting values.

**Why P1**: This is the smallest end-to-end slice that proves
the module's core promise — a Focus-aware app driven by
system filter invocations that persist values via 014's App
Group and surface in the in-app UI. It exercises the
registry entry, the iOS 16 gating, the JS bridge
(`getCurrentFilterValues` + `isAvailable`), the
`SetFocusFilterIntent` subclass and its `@Parameter`
declarations, the App Group `UserDefaults` suite under the
filter-config key namespace, and the foreground-refresh
hook in one round-trip. Without this slice the rest of the
module has nothing to demonstrate.

**Independent Test**: Install a dev build on an iPhone
running iOS 16+, open Settings → Focus → Work → Add Filter →
"spot" → "Showcase Mode" → set `mode = focused`,
`accentColor = blue` → Done. Activate Work Focus from
Control Centre. Open the Spot app, tap the Focus Filters
card, and within one second of foregrounding the screen,
verify (a) the current filter state panel reads `mode:
focused, accentColor: blue`, (b) the in-app demo status pill
shows the same values plus the Focus name when available,
(c) the demo body re-tints with the blue accent and shows
the focused-mode label, and (d) the event log gained a new
entry tagged `activated` with the timestamp and values.

**Acceptance Scenarios**:

1. **Given** the user is on the Modules home grid on an iOS
   16+ device, **When** they look at the list of available
   modules, **Then** a "Focus Filters" card MUST be visible
   and tappable.
2. **Given** the user has tapped the Focus Filters card on
   iOS 16+, **When** the screen first renders, **Then** it
   MUST present the six panels in this fixed order:
   explainer card, filter definition card, current filter
   state panel, in-app demo, setup instructions card, event
   log.
3. **Given** the user has bound `ShowcaseModeFilter` to a
   Focus and that Focus activates while the app is
   backgrounded, **When** the user foregrounds the app and
   the Focus Filters screen is visible (or is the screen
   they navigate to), **Then** the current filter state
   panel and the in-app demo status pill MUST refresh
   within 500 ms of the `AppState` change to `active` to
   reflect the persisted values written by the native
   filter invocation.
4. **Given** the App Group contains a previously-written
   filter values payload under the documented key
   (`spot.focus.filterValues`), **When** the user mounts
   the screen, **Then** the screen MUST read those values
   on mount and render them in the current filter state
   panel and the in-app demo without requiring the user to
   re-foreground.
5. **Given** the event log already contains 10 entries,
   **When** a new activation / deactivation / simulated
   event occurs, **Then** the new entry MUST be prepended
   and the oldest entry MUST be discarded so the log never
   exceeds exactly 10 entries.
6. **Given** the iOS 16+ device is running this dev build,
   **When** Settings → Focus → (any Focus) → Add Filter is
   opened and the user searches "spot", **Then** an entry
   labelled "Showcase Mode" MUST appear and tapping it MUST
   present a configuration sheet with two controls: a
   `mode` picker exposing exactly the three values
   `Relaxed` / `Focused` / `Quiet`, and an `accentColor`
   picker / input exposing at minimum the four swatch
   identifiers documented in this spec.

---

### User Story 2 — Preview the filter's effect in-app without binding a real Focus (Priority: P1)

A user who has just installed the dev build wants to see
what the Focus Filter does without going through the
Settings → Focus → Add Filter flow first. On the Focus
Filters screen they edit the filter definition card's
segmented `mode` picker and the four-swatch `accentColor`
picker. Below the in-app demo block they tap "Pretend
filter is active". The status pill, the demo body, and a
new event log entry (typed `simulated`) immediately reflect
the user's draft selection — exactly as if a real Focus had
just activated. They toggle the pretend switch off, and the
in-app demo reverts to whatever the persisted App Group
values dictate (or to the empty / no-filter state if no
values have been persisted yet).

**Why P1**: Co-equal P1 with Story 1 because, without this
in-app simulation path, a reviewer who cannot or will not
bind a real Focus on their device cannot observe the demo
at all. Story 1 proves the *real* path; Story 2 proves the
*demoable-anywhere* path. Both are required for the module
to be useful in fleet review and in cross-platform CI.

**Independent Test**: On any platform that renders the
screen (iOS 16+, iOS < 16, Android, or Web — see Story 3),
do NOT bind any Focus. On the Focus Filters screen, change
the segmented `mode` picker to `quiet`, tap the orange
swatch in the `accentColor` picker, then toggle "Pretend
filter is active" ON. Verify (a) the in-app demo status
pill displays `mode: quiet, accentColor: orange`, (b) the
demo body re-tints with the orange accent and shows the
quiet-mode label, and (c) a new event log entry of type
`simulated` appears at the top with the same values. Toggle
the pretend switch OFF and verify the in-app demo reverts
to the persisted values (or to the empty / no-filter state
when nothing is persisted).

**Acceptance Scenarios**:

1. **Given** the user is on the Focus Filters screen,
   **When** they edit the `mode` segmented picker or the
   `accentColor` swatch picker in the filter definition
   card and the "Pretend filter is active" toggle is OFF,
   **Then** the in-app demo status pill and demo body MUST
   NOT change — drafts only affect the demo while the
   pretend toggle is ON.
2. **Given** the user has selected a non-default draft
   (`mode = quiet`, `accentColor = orange`), **When** they
   toggle "Pretend filter is active" ON, **Then** the
   status pill MUST update to display the draft values
   within the same render pass, the demo body MUST re-tint
   accordingly, and a new event log entry of type
   `simulated` MUST be prepended with the timestamp and
   the draft values.
3. **Given** "Pretend filter is active" is ON, **When** the
   user changes the `mode` picker or `accentColor` swatch,
   **Then** the status pill and demo body MUST update
   within the same render pass to the new values; each
   change MUST produce at most one new event log entry per
   user-initiated update (debounced reasonably) so the log
   does not explode on rapid input.
4. **Given** "Pretend filter is active" is ON, **When** the
   user toggles it OFF, **Then** the status pill and demo
   body MUST revert to whatever the App Group's persisted
   filter values dictate; if no values have been persisted
   yet, the demo MUST display the documented empty-state
   ("No Focus filter has been applied yet") rather than a
   stale or blank rendering.
5. **Given** simulated events have been logged in the same
   screen session as real activation events, **When** the
   user reads the event log, **Then** simulated entries
   MUST be visually distinguishable from real ones (e.g. a
   "simulated" badge) so the reviewer can tell them apart.

---

### User Story 3 — Cross-platform parity for the explainer + filter-definition + in-app demo half (Priority: P2)

A user opens the Focus Filters screen on Android, on the
web build, or on iPhone running iOS < 16. The screen
renders an "iOS 16+ only" banner at the top, but
critically the **explainer card, the filter definition
card, the in-app demo, and the "Pretend filter is active"
toggle still render** so the user can still read what
Focus Filters are and see the simulated filter take effect
as they edit the `mode` picker and the `accentColor`
swatches. The current filter state panel, the setup
instructions card (Settings → Focus does not exist on
Android / Web), and the event log's `activated` /
`deactivated` event paths are hidden / suppressed; the
event log itself still records `simulated` events from
panel 4.

**Why P2**: Cross-platform parity for the *demoable half*
of the module is required by Constitution Principle I.
Without this fallback, the module is broken on Android,
Web, and iOS < 16. P2 rather than P1 because the headline
value of the module is the real Focus Filter on iOS 16+;
the fallback exists to keep the app structurally sound
across platforms, not to deliver Focus Filters where they
cannot exist.

**Independent Test**: Run the screen in a desktop web
browser, on an Android device or simulator, and (if
available) on an iPhone with iOS 15.x or earlier. In each
case verify the screen renders, the iOS-16-only banner is
visible, the explainer card, the filter definition card,
and the in-app demo with the "Pretend filter is active"
toggle render and operate as on iOS 16+, the current filter
state panel and the setup instructions card are hidden,
the event log is shown but contains only `simulated`
entries, and any code path that attempts to call
`getCurrentFilterValues()` throws `FocusFiltersNotSupported`.

**Acceptance Scenarios**:

1. **Given** the user opens the Focus Filters screen on
   Android, Web, or iOS < 16, **When** the screen renders,
   **Then** an "iOS 16+ only" banner MUST be visible at
   the top of the content area explaining that the Focus
   Filters capability is unavailable on this platform /
   version.
2. **Given** the user is on a non-iOS-16+ platform,
   **When** the screen renders, **Then** the explainer
   card, the filter definition card, the in-app demo, and
   the "Pretend filter is active" toggle MUST be shown;
   the current filter state panel and the setup
   instructions card MUST NOT be shown.
3. **Given** the user is on a non-iOS-16+ platform,
   **When** they edit the `mode` picker or `accentColor`
   swatches and toggle "Pretend filter is active" ON,
   **Then** the in-app demo MUST update exactly as on iOS
   16+ and a new `simulated` event log entry MUST be
   prepended.
4. **Given** the user is on a non-iOS-16+ platform,
   **When** any code path attempts to call
   `getCurrentFilterValues()`, **Then** the bridge MUST
   throw a `FocusFiltersNotSupported` error rather than
   silently no-oping, so misuse is loud.
5. **Given** the user is on a non-iOS-16+ platform,
   **When** `isAvailable()` is called, **Then** it MUST
   return `false` without throwing so the screen can
   branch on it defensively.

---

### Edge Cases

- **No filter has ever been bound** — On first mount on a
  device where no Focus has the showcase filter bound (so
  the App Group key has never been written), the current
  filter state panel MUST render the documented empty
  state ("No Focus filter has been applied yet") rather
  than showing a partially-default values row that would
  mislead the reviewer.
- **Filter bound but the bound Focus has never activated** —
  Equivalent to the above from the app's perspective: the
  App Group key has not yet been written. The current
  filter state panel MUST render the empty state.
- **Filter values persisted but the bound Focus has been
  deactivated** — The App Group key contains the most
  recently activated values; iOS does NOT clear the App
  Group when a Focus deactivates. The current filter state
  panel MUST therefore display **the values from the most
  recent activation event** with a visible indicator that
  the Focus is no longer active (best-effort: a "last seen
  at <time>" line; the module does NOT claim to know
  whether the Focus is currently active without using
  private API). On iOS-side filter invocation for a
  deactivation event (when `SetFocusFilterIntent` is
  invoked with a deactivation), the native filter MUST
  write a `deactivatedAt` timestamp to the App Group so
  the JS layer can surface this distinction.
- **Foregrounding without an `AppState` change** — If the
  screen is mounted and the `AppState` listener never
  fires `'active'` (e.g. cold-launch directly to the
  screen via deep link), the screen MUST still read the
  App Group on mount per US1 AS4 so the user does not see
  the empty state when persisted values exist.
- **App Group read failure** — If reading
  `UserDefaults(suiteName: <appGroupId>)` fails (e.g. the
  suite is missing, the entitlement is misconfigured on a
  dev build, or the JSON payload is malformed), the bridge
  MUST resolve with `null` rather than throwing, the
  current filter state panel MUST render the empty state,
  and a single `__DEV__`-gated `console.warn` MUST be
  emitted describing the failure mode (no `console.error`,
  no user-visible crash).
- **Pretend toggle ON when persisted values change** — If
  the bound Focus activates while the user has the
  "Pretend filter is active" toggle ON, the demo MUST
  continue to display the *draft* values (pretend takes
  precedence over persisted) but the event log MUST still
  record an `activated` entry with the persisted values so
  the reviewer can see that a real activation occurred
  underneath the simulation.
- **Rapid Focus activations / deactivations** — When iOS
  invokes the filter intent in rapid succession (e.g. the
  user toggles the bound Focus off and on multiple times
  within a few seconds), the App Group write path MUST be
  idempotent and the JS layer MUST coalesce multiple
  reads on a single foreground transition into one render
  update. The event log MUST record one entry per
  invocation iOS actually delivered.
- **Empty / unknown `accentColor` payload** — If the App
  Group's persisted `accentColor` value does not match any
  documented swatch identifier (e.g. the user picked a
  custom string in some future native UI, or the JSON is
  partially corrupt), the in-app demo MUST fall back to
  the documented default swatch and continue rendering;
  it MUST NOT crash.
- **Unknown `mode` payload** — Symmetrically, if the
  persisted `mode` value is not one of `relaxed` /
  `focused` / `quiet`, the in-app demo MUST fall back to
  the documented default mode (`relaxed`) and continue
  rendering.
- **Filter intent invocation while the app is suspended** —
  iOS may invoke the filter intent while the host app is
  not running. The native intent's `perform()` body MUST
  complete its App Group write within iOS's documented
  background execution budget for filter intents and MUST
  NOT touch any UIKit / SwiftUI symbol that requires a
  foreground process. The in-app screen will pick up the
  values on the next foreground transition (US1 AS3).
- **Plugin re-prebuild idempotency** — Running `npx expo
  prebuild` twice MUST NOT duplicate the two Swift sources
  in the main app target's `Sources` build phase, MUST
  NOT modify or remove any region owned by 013's
  `with-app-intents` plugin, and MUST NOT regress the
  previously-installed plugin output. The order of plugin
  invocation in `app.json` MUST NOT affect the final
  Xcode project state — 013 / 014 / 026 / 027 / 028 / 029
  plugins MUST be commutative.
- **AppEnum localisation** — The `mode` `AppEnum`'s case
  display labels MUST be declared via
  `LocalizedStringResource` so iOS's Settings → Focus →
  Add Filter UI displays human-readable case names; the
  raw Swift case identifiers MUST NOT leak into the user
  visible Settings UI. The default locale's display
  strings MUST be `"Relaxed"` / `"Focused"` / `"Quiet"`.
- **Settings discoverability without `AppShortcutsProvider`**
  — Per DECISION 2 below, this feature does NOT declare an
  `AppShortcutsProvider` for the filter; iOS auto-discovers
  `SetFocusFilterIntent` subclasses linked into the main
  app target. The plugin and Swift sources MUST therefore
  ensure the filter type is reachable from the main app's
  module graph (i.e. linked into the app target, not into
  a sibling framework that the app target does not
  embed).

## Requirements *(mandatory)*

### Functional Requirements

#### Module registration & gating

- **FR-FF-001**: The Focus Filters module MUST be registered
  in the registry introduced by feature 006 with id
  `focus-filters-lab`, label `"Focus Filters"`, supported
  platforms `['ios','android','web']`, and `minIOS:
  '16.0'`. No existing registry entry may be modified.
- **FR-FF-002**: The Modules home grid MUST display the
  Focus Filters card alongside other registered modules
  using the same card visual treatment, with iOS-version
  gating handled by spec 006's existing `minIOS` mechanism
  (no parallel gating in this module).
- **FR-FF-003**: Tapping the Focus Filters card MUST
  navigate to the Focus Filters screen via the registry's
  standard navigation flow.
- **FR-FF-004**: On iOS versions below 16.0, the registry's
  `minIOS` gating MUST mark the card as unavailable per
  spec 006 conventions; the module MUST NOT attempt to
  load iOS-16-only native bridge symbols on those
  versions.

#### `SetFocusFilterIntent` definition (iOS 16+)

- **FR-FF-005**: The module MUST define exactly one
  `SetFocusFilterIntent` subclass — `ShowcaseModeFilter` —
  in `native/ios/focus-filters/ShowcaseModeFilter.swift`.
  The type MUST be `@available(iOS 16.0, *)` and MUST be
  linked into the **main app target** (not a sibling
  framework), so iOS's filter-intent discovery picks it up.
- **FR-FF-006**: `ShowcaseModeFilter` MUST declare a
  human-readable `static var title:
  LocalizedStringResource` of `"Showcase Mode"` (the
  string displayed in Settings → Focus → Add Filter
  search results) and a `static var description:
  IntentDescription` providing a short subtitle suitable
  for non-technical users.
- **FR-FF-007**: `ShowcaseModeFilter` MUST declare exactly
  two `@Parameter` properties:
  - `mode: ShowcaseFilterMode`, an `AppEnum` declaring
    exactly three cases — `relaxed`, `focused`, `quiet` —
    each with a `LocalizedStringResource` display label
    (`"Relaxed"` / `"Focused"` / `"Quiet"`). The enum's
    `caseDisplayRepresentations` MUST cover all three
    cases.
  - `accentColor: String`, a primitive parameter accepting
    one of the documented swatch identifiers (at minimum
    `blue`, `orange`, `green`, `purple`). Default values
    on parameter declaration MUST be `mode = .relaxed`
    and `accentColor = "blue"`.
- **FR-FF-008**: `ShowcaseModeFilter`'s `perform()`
  implementation MUST persist a JSON payload of the
  current parameter values to the shared App Group
  `UserDefaults` suite under the key `spot.focus.filterValues`
  (see FR-FF-014 for the exact payload shape) and MUST
  return `.result()` (the documented success result for
  filter intents) without surfacing any UI side effect.
- **FR-FF-009**: `ShowcaseModeFilter` MUST be discoverable
  by Apple's Settings → Focus → Add Filter search via the
  substring `"spot"` (case-insensitive) — i.e. the
  intent's surfaced strings (title, description, or
  bundle identifier) MUST contain "spot" so the search
  matches.
- **FR-FF-010**: The Swift sources MUST be gated with
  `@available(iOS 16.0, *)` (or `if #available(iOS 16,
  *)` guards at registration sites) so the main app
  target continues to compile and ship on iOS 15.x — the
  filter simply does not register itself on iOS < 16.

#### Native filter storage

- **FR-FF-011**: `FocusFilterStorage.swift` (in
  `native/ios/focus-filters/`) MUST expose a single
  `enum FocusFilterStorage` (or static-only struct) with
  a `static func write(values: ShowcaseFilterValues,
  event: ShowcaseFilterEvent)` method that persists the
  payload to the shared App Group `UserDefaults` suite
  under key `spot.focus.filterValues` and a
  corresponding `static func read() ->
  ShowcaseFilterPersistedPayload?` that returns `nil`
  when the key is unset or the JSON is malformed.
- **FR-FF-012**: `FocusFilterStorage` MUST use the
  **same App Group identifier** declared by feature 014
  and reused by 027 / 028. The plugin MUST NOT add a new
  App Group, MUST NOT modify the existing App Group
  identifier, and MUST NOT alter the App Group
  entitlement on the main app target or the widget
  extension target.
- **FR-FF-013**: `FocusFilterStorage` MUST NOT touch any
  UIKit / SwiftUI symbol so it remains safe to call from
  `ShowcaseModeFilter.perform()` while the app is
  suspended (FR-FF-008 / per Edge Case "Filter intent
  invocation while the app is suspended").
- **FR-FF-014**: The persisted JSON payload at
  `spot.focus.filterValues` MUST be `{ mode: string,
  accentColor: string, event: 'activated' |
  'deactivated', updatedAt: string-iso8601, focusName?:
  string }`. The `event` field MUST reflect whether
  `SetFocusFilterIntent` was invoked for activation or
  deactivation (Apple delivers both). `focusName`, when
  present, MUST be the user-bound Focus's name as
  obtained from `IntentParameter`'s system-supplied
  context (best-effort; per DECISION 4 this MAY be
  absent on devices / OS revisions that do not provide
  it). The `accentColor` field MUST be one of the
  documented swatch identifiers.

#### JS bridge

- **FR-FF-015**: `src/native/focus-filters.ts` MUST be a
  new bridge module (alongside the existing `src/native/
  *.ts` bridges) that exports at minimum:
  - `isAvailable(): boolean` — returns `true` on iOS
    16+ and the native module is present, `false`
    otherwise. MUST NOT throw.
  - `getCurrentFilterValues(): Promise<{ mode:
    'relaxed' | 'focused' | 'quiet'; accentColor:
    string; event: 'activated' | 'deactivated';
    updatedAt: string; focusName?: string } | null>` —
    on iOS 16+, reads the App Group key and returns
    the parsed payload, or `null` if the key is unset
    / malformed. On non-iOS / iOS < 16, throws
    `FocusFiltersNotSupported`.
- **FR-FF-016**: A `FocusFiltersNotSupported` error class
  MUST be exported from `src/native/focus-filters.ts`,
  mirroring `AppIntentsNotSupported` from
  `src/native/app-intents.ts`. The error name MUST be
  `'FocusFiltersNotSupported'`.
- **FR-FF-017**: The native module MUST be looked up via
  `requireOptionalNativeModule` (the same pattern 013's
  `src/native/app-intents.ts` uses), so the JS bundle
  loads cleanly when the native module is absent (e.g.
  in JS-only test runs and on non-iOS platforms).
- **FR-FF-018**: The bridge MUST NOT introduce parallel
  symbols for reading the App Group: it MUST own its
  own JS-side read of `spot.focus.filterValues` via the
  iOS-side native module read, but MUST NOT shadow,
  alias, or rename any existing symbol exported from
  `src/native/widget-center.ts` or
  `src/native/app-intents.ts`. Existing exports from
  those bridges MUST NOT be removed or renamed.

#### Screen layout (TS)

- **FR-FF-019**: The Focus Filters screen MUST present a
  header with the title `"Focus Filters"`.
- **FR-FF-020**: On iOS 16+ the screen MUST present, in
  this fixed top-to-bottom order: (a) explainer card;
  (b) filter definition card with the segmented `mode`
  picker and the four-swatch `accentColor` picker;
  (c) current filter state panel; (d) in-app demo with
  the status pill, the demo body, and the "Pretend
  filter is active" toggle; (e) setup instructions card;
  (f) event log showing the last 10 events.
- **FR-FF-021**: On Android, Web, and iOS < 16 the
  screen MUST present, in this fixed top-to-bottom
  order: (a) "iOS 16+ only" banner; (b) explainer card;
  (c) filter definition card; (d) in-app demo with the
  status pill, the demo body, and the "Pretend filter
  is active" toggle; (e) event log. The current filter
  state panel and the setup instructions card MUST NOT
  be shown on these platforms.

#### Filter definition card

- **FR-FF-022**: The filter definition card MUST display:
  (a) the filter's display name (`"Showcase Mode"`);
  (b) a one-line description of what the filter does;
  (c) a three-segment `mode` picker labelled `"Relaxed"`
  / `"Focused"` / `"Quiet"`; (d) a four-swatch
  `accentColor` picker exposing exactly the swatch
  identifiers `blue`, `orange`, `green`, `purple` with
  human-readable labels.
- **FR-FF-023**: Selecting a `mode` segment or an
  `accentColor` swatch MUST update the in-memory **draft
  values** for the in-app demo only; it MUST NOT write to
  the App Group, MUST NOT call any native bridge method,
  and MUST NOT produce an event log entry by itself.
  Real writes happen only through the system-invoked
  filter intent.
- **FR-FF-024**: The default draft on first mount MUST be
  `mode = relaxed`, `accentColor = blue` (matching
  FR-FF-007's parameter defaults). These defaults MUST
  be exported as constants from `filter-modes.ts` so
  tests can reference them.

#### Current filter state panel (iOS 16+ only)

- **FR-FF-025**: The current filter state panel MUST
  read the App Group via the bridge on screen mount and
  on every `AppState` transition to `'active'`. Reads
  MUST be debounced reasonably (e.g. coalesced within
  100 ms) so back-to-back foreground transitions do not
  trigger duplicate reads.
- **FR-FF-026**: The panel MUST render at minimum: the
  `mode` value with its display label, the
  `accentColor` value with the corresponding swatch
  rendered visually, the `event` field
  (`activated` / `deactivated`) with a visible
  indicator (e.g. a green dot for activated, a grey dot
  for deactivated), the `updatedAt` timestamp formatted
  in the user's locale, and the `focusName` if present.
- **FR-FF-027**: When the bridge resolves with `null`
  (no values persisted yet, or read failure per the
  Edge Case "App Group read failure"), the panel MUST
  render the documented empty-state line ("No Focus
  filter has been applied yet").
- **FR-FF-028**: The panel MUST be hidden on Android,
  Web, and iOS < 16 per FR-FF-021.

#### In-app demo & pretend toggle

- **FR-FF-029**: The in-app demo block MUST contain a
  status pill at the top displaying the **active filter
  values**. When "Pretend filter is active" is OFF, the
  active values are the persisted App Group values (or
  the empty state when none are persisted). When
  "Pretend filter is active" is ON, the active values
  are the user's draft from the filter definition card.
  The pill MUST display the `mode` display label, a
  visual swatch for the `accentColor`, and the
  `focusName` when active values include one (real
  activations only — drafts have no `focusName`).
- **FR-FF-030**: The demo body MUST re-tint based on
  the active `accentColor` (background, accent line,
  or icon tint — implementation choice, but the change
  MUST be visible to a sighted reviewer at a glance)
  and MUST display copy varying with the active `mode`
  (e.g. `"Relax — calm spacing, soft tints"` /
  `"Focused — dense, high-contrast"` / `"Quiet —
  reduced UI, muted palette"`). The body MUST update
  within the same render pass when the active values
  change.
- **FR-FF-031**: The "Pretend filter is active" toggle
  MUST start OFF on first mount. Toggling it ON MUST
  prepend a `simulated` event to the event log with
  the current draft values; toggling it OFF MUST NOT
  prepend a new entry. Subsequent draft changes while
  the toggle remains ON MUST debounce to at most one
  new `simulated` entry per ~300 ms of continuous
  editing so the log does not explode on rapid input.
- **FR-FF-032**: The demo block (status pill, demo
  body, pretend toggle) MUST be rendered on every
  platform per FR-FF-021 — including Android, Web, and
  iOS < 16 — so the simulation path stays available
  cross-platform.

#### Event log

- **FR-FF-033**: The event log MUST be backed by an
  in-memory ring buffer of capacity exactly 10,
  implemented with a local React reducer; it MUST NOT
  be persisted across screen unmounts. When a new
  entry is added beyond capacity, the oldest entry
  MUST be evicted.
- **FR-FF-034**: Each entry MUST display, at minimum,
  a timestamp formatted in the user's locale, the
  event type (`activated` / `deactivated` /
  `simulated`), the resulting `mode` and
  `accentColor`, and an optional `focusName` when the
  source is a real activation that carried one.
  Simulated entries MUST be visually distinguishable
  from real ones (per US2 AS5).
- **FR-FF-035**: On first mount with no entries, an
  explicit empty-state line ("No filter events yet")
  MUST be rendered.
- **FR-FF-036**: On iOS 16+ the event log MUST gain a
  new `activated` or `deactivated` entry whenever a
  fresh foreground read of the App Group surfaces a
  payload with an `updatedAt` newer than the last
  entry of the same `event` type already in the log
  (or there is no such entry). On all platforms the
  log MUST gain a `simulated` entry per FR-FF-031.

#### Explainer card (all platforms)

- **FR-FF-037**: The explainer card MUST contain a
  short prose explanation of: (a) what Focus Filters
  are; (b) how the user binds the filter in Settings
  → Focus → Add Filter on iOS 16+; (c) what the demo
  filter exposes (the two `@Parameter` properties);
  (d) the difference between the simulated path
  (Story 2) and the real path (Story 1). The
  explainer MUST be rendered on every platform so the
  cross-platform fallback remains educational.

#### Setup instructions card (iOS 16+ only)

- **FR-FF-038**: The setup instructions card MUST
  contain a numbered step list explaining how to bind
  the filter, including at minimum: open Settings →
  Focus; pick a Focus (e.g. Work); tap Add Filter;
  search "spot"; tap "Showcase Mode"; set `mode` and
  `accentColor`; tap Done; activate the chosen Focus
  from Control Centre.
- **FR-FF-039**: The setup instructions card MUST be
  hidden on Android, Web, and iOS < 16 per FR-FF-021,
  since Settings → Focus → Add Filter does not exist
  on those platforms.

#### Native packaging

- **FR-FF-040**: The Swift sources defining the filter
  — `ShowcaseModeFilter.swift` and
  `FocusFilterStorage.swift` — MUST live under
  `native/ios/focus-filters/` in the repository, and
  MUST be added to the **main app target's** `Sources`
  build phase by the `with-focus-filters` config
  plugin at `expo prebuild` time. They MUST NOT be
  added to any widget extension target.
- **FR-FF-041**: The `with-focus-filters` config
  plugin MUST be idempotent (running `npx expo
  prebuild` twice MUST produce the same Xcode project
  state), MUST NOT modify or remove any file owned by
  feature 013's `with-app-intents` plugin, MUST NOT
  modify or remove any file owned by features 014 /
  026 / 027 / 028 plugins, and MUST live in its own
  directory `plugins/with-focus-filters/` (separate
  from 013's plugin per DECISION 1 below).
- **FR-FF-042**: The plugin MUST NOT modify the App
  Group entitlement on either the main app target or
  the widget extension target (FR-FF-012 mandates
  reuse of 014's existing App Group). On a fresh
  prebuild from a clean checkout, the only diff
  attributable to this plugin in the generated Xcode
  project MUST be the addition of the two Swift
  sources to the main app target's `Sources` build
  phase plus the corresponding PBXFileReference /
  PBXGroup entries.
- **FR-FF-043**: On non-iOS targets, no symbol from
  the focus-filters native bridge MUST be imported or
  evaluated at module load time; the iOS-only native
  bridge MUST be loaded only on iOS and only when the
  device meets the iOS 16+ requirement (handled by
  `requireOptionalNativeModule` + Platform / version
  gate per FR-FF-017).
- **FR-FF-044**: The plugin MUST NOT declare or
  register an `AppShortcutsProvider` for the filter
  (per DECISION 2 below). 013's existing
  `SpotAppShortcuts.swift` MUST remain untouched.

#### Architecture (TS)

- **FR-FF-045**: The module's source MUST live under
  `src/modules/focus-filters-lab/` with at minimum:
  `index.tsx` (manifest), `screen.tsx`,
  `screen.android.tsx`, `screen.web.tsx`, a
  `filter-modes.ts` module, a `hooks/useFocusFilter.ts`
  hook, and a `components/` directory containing at
  least `ExplainerCard.tsx`,
  `FilterDefinitionCard.tsx`, `CurrentStateCard.tsx`,
  `PretendFilterToggle.tsx`, `SetupInstructions.tsx`,
  `EventLog.tsx`, and `IOSOnlyBanner.tsx`.
- **FR-FF-046**: `filter-modes.ts` MUST expose: the
  `ShowcaseFilterMode` enum (`'relaxed' | 'focused'
  | 'quiet'`), the human-readable display labels for
  each mode, the accent-color catalog (the four
  documented swatch identifiers and their hex / named
  colour values), the documented draft defaults, and
  the matching JSON-schema-compatible parsers used by
  the bridge to validate the App Group payload.
- **FR-FF-047**: `hooks/useFocusFilter.ts` MUST expose
  a single hook returning an object of at minimum
  `{ values, refresh, eventLog, simulateActivation }`,
  where `values` is the most recent
  `getCurrentFilterValues()` result (or `null`),
  `refresh` is an explicit refetch function,
  `eventLog` is the bounded list of the last 10
  events, and `simulateActivation` is the function
  the pretend toggle calls to log a `simulated`
  event with given draft values. The hook MUST
  refetch on mount and on every `AppState`
  transition to `'active'` (per FR-FF-025) and MUST
  tolerate `getCurrentFilterValues()` throwing
  `FocusFiltersNotSupported` on non-iOS platforms by
  resolving `values` to `null` and not propagating
  the error (the pretend path stays usable per
  FR-FF-032).
- **FR-FF-048**: Platform-suffixed screen splits
  (`screen.android.tsx`, `screen.web.tsx`) MUST be
  used for the cross-platform fallback rather than
  `Platform.select` for any diff that touches more
  than a handful of style props. `Platform.select`
  is permitted only for trivial style or copy diffs.

#### Lifecycle

- **FR-FF-049**: Navigating away from the Focus
  Filters screen MUST tear down the screen cleanly:
  no asynchronous bridge callbacks MUST update React
  state after unmount; no `AppState` listener MUST
  remain registered after unmount; no layout
  warnings MUST be emitted; the in-memory event log
  MUST be discarded on unmount per FR-FF-033.
- **FR-FF-050**: When the app is backgrounded with
  the screen visible and returns to foreground, the
  current filter state panel and the in-app demo
  status pill MUST refresh per FR-FF-025 / FR-FF-029
  so any externally-changed App Group state is
  reflected within 500 ms of the `AppState` change.

#### Accessibility

- **FR-FF-051**: The three `mode` segments, the four
  `accentColor` swatches, the "Pretend filter is
  active" toggle, the in-app demo status pill, the
  current filter state panel rows, the setup
  instruction steps, and the event log entries MUST
  each expose an accessibility label describing
  their function (e.g. `"Mode: Focused"`,
  `"Accent color: blue"`, `"Pretend filter is
  active, off"`, `"Active filter: Focused, blue,
  Work Focus"`, `"Bind step 1 of 7"`, `"Activated
  at 14:02 — Focused, blue"`).
- **FR-FF-052**: The "iOS 16+ only" banner on
  Android / Web / iOS < 16 MUST expose its message
  to assistive technologies as a single accessible
  announcement on screen mount.
- **FR-FF-053**: The four `accentColor` swatches and
  the three `mode` segments MUST be distinguishable
  to users who cannot perceive colour differences
  (accessibility labels naming the swatch / mode
  and / or a non-colour selection indicator such as
  a checkmark on the active swatch / segment).

#### Quality & integration

- **FR-FF-054**: The full `pnpm check` suite (lint,
  typecheck, tests) MUST pass after the feature
  lands. No existing test may regress. `pnpm format`
  MUST be run before commits. NO `eslint-disable`
  directives for unregistered rules MUST be
  introduced.
- **FR-FF-055**: Comprehensive unit tests MUST exist:
  `filter-modes.test.ts` (catalog validity, parser
  round-trips, default values, error tolerance for
  malformed payloads — unknown mode, unknown
  accentColor, missing fields), one test file per
  component (`ExplainerCard.test.tsx`,
  `FilterDefinitionCard.test.tsx`,
  `CurrentStateCard.test.tsx`,
  `PretendFilterToggle.test.tsx`,
  `SetupInstructions.test.tsx`, `EventLog.test.tsx`,
  `IOSOnlyBanner.test.tsx`),
  `useFocusFilter.test.tsx` (refresh on mount,
  `AppState` change re-reads, `simulateActivation`
  logs a `simulated` event, error tolerance when
  the bridge throws `FocusFiltersNotSupported`),
  `screen.test.tsx`, `screen.android.test.tsx`,
  `screen.web.test.tsx`,
  `native/focus-filters.test.ts` (bridge contract:
  `isAvailable()` truthiness on iOS 16+, throws
  `FocusFiltersNotSupported` on non-iOS / iOS <
  16, iOS path delegates to the mocked native
  module, reads / parses the App Group payload),
  `plugins/with-focus-filters/index.test.ts`
  (verifies the plugin appends the two Swift
  sources to the main app target, is idempotent on
  second run, coexists with 013 / 014 / 026 / 027
  / 028 plugins without regression, and is
  commutative w.r.t. plugin order in `app.json`),
  and `manifest.test.ts` (registry contract: id,
  label, platforms, minIOS).
- **FR-FF-056**: Native bridges MUST be mocked at
  the import boundary per the 013 / 024 pattern
  (mock `src/native/focus-filters.ts` in the JS
  test layer; do not load the real native module
  under test).
- **FR-FF-057**: The baseline test totals at the
  start of this feature MUST be carried forward
  from feature 028's completion totals (recorded in
  028's plan.md / retrospective). The delta
  introduced by feature 029 MUST be tracked in
  plan.md and reported in the retrospective.

### Key Entities

- **RegistryEntry** — the new
  `{ id: 'focus-filters-lab', title: 'Focus
  Filters', platforms: ['ios','android','web'],
  minIOS: '16.0', render }` record appended to
  `src/modules/registry.ts`.
- **ShowcaseFilterMode** — `'relaxed' | 'focused' |
  'quiet'`; mirrors the Swift `AppEnum` cases and is
  validated by the bridge / `filter-modes.ts`
  parser when reading the App Group payload.
- **AccentColor** — `'blue' | 'orange' | 'green' |
  'purple'`; mirrors the documented swatch catalog
  exposed by the filter definition card and accepted
  by the `accentColor: String` parameter on
  `ShowcaseModeFilter`.
- **ShowcaseFilterValues** — `{ mode:
  ShowcaseFilterMode, accentColor: AccentColor }`;
  the in-memory draft shape and the runtime shape
  parsed from the App Group payload.
- **ShowcaseFilterPersistedPayload** — `{ mode:
  ShowcaseFilterMode, accentColor: AccentColor,
  event: 'activated' | 'deactivated', updatedAt:
  string-iso8601, focusName?: string }`; the
  persisted JSON shape at App Group key
  `spot.focus.filterValues`.
- **FilterEvent** — `{ at: Date, type: 'activated' |
  'deactivated' | 'simulated', values:
  ShowcaseFilterValues, focusName?: string }`. The
  in-memory event log entry. Bounded to the last 10
  entries by FR-FF-033.
- **FocusFiltersNotSupported** — error thrown by the
  JS bridge on non-iOS / iOS < 16 callers (mirrors
  013's `AppIntentsNotSupported` contract).

## Non-Functional Requirements

- **NFR-FF-001 (Performance)**: Opening the Focus
  Filters screen MUST render to first paint within
  500 ms on a recent iPhone; the in-app demo MUST
  update within one render pass (≤ 16 ms on a 60 Hz
  screen) when the user changes any control or
  toggles "Pretend filter is active".
- **NFR-FF-002 (Responsiveness)**: A foreground
  transition MUST refresh the current filter state
  panel and the in-app demo status pill within 500 ms
  per US1 AS3 / FR-FF-025 / FR-FF-050.
- **NFR-FF-003 (Footprint)**: No new runtime
  dependency is added by this feature.
  `package.json` and `pnpm-lock.yaml` MUST remain
  unchanged at the dependency level (lockfile churn
  unrelated to dependency changes is acceptable).
- **NFR-FF-004 (Idempotency / commutativity)**:
  Running `npx expo prebuild` twice in succession
  MUST produce an Xcode project state with no
  duplicated source files in the main app target's
  `Sources` build phase, no regression of any prior
  plugin's output, and no drift in the App Group
  entitlement. Reordering the
  `with-app-intents`, `with-home-widgets`,
  `with-rich-notifications`, `with-lock-widgets`,
  `with-standby-widget`, and `with-focus-filters`
  entries in `app.json` MUST produce byte-identical
  Xcode project state.
- **NFR-FF-005 (Offline)**: The module MUST be
  fully functional with the device in airplane
  mode. No code path may require network.
- **NFR-FF-006 (Coexistence)**: Features 007 (Live
  Activities), 013 (App Intents), 014 (Home
  Widgets), 024 (MapKit), 025 (Core Location), 026
  (Rich Notifications), 027 (Lock Screen Widgets),
  and 028 (StandBy Mode) MUST continue to function
  unchanged with the new plugin installed.
  Specifically: 013's `LogMoodIntent` /
  `GetLastMoodIntent` / `GreetUserIntent` /
  `SpotAppShortcuts` continue to be discoverable
  via Siri / Shortcuts; 014/027/028 widgets
  continue to render their previous behaviour;
  014's `reloadAllTimelines()` and 027/028's
  `reloadTimelinesByKind(...)` calls continue to
  work as before.
- **NFR-FF-007 (Accessibility)**: All buttons and
  controls in the panels MUST have
  `accessibilityLabel`s; the in-app demo body, the
  explainer card, and the current filter state
  panel MUST be readable by VoiceOver.
- **NFR-FF-008 (Logging hygiene)**: The in-memory
  event log is the only sink for filter-lifecycle
  data; no `console.log` of filter values may ship
  in release builds (gated by `__DEV__`). The App
  Group read failure path MUST emit at most one
  `__DEV__`-gated `console.warn`.
- **NFR-FF-009 (Background safety)**: The native
  filter intent's `perform()` body MUST complete
  its App Group write within iOS's documented
  background execution budget for filter intents
  and MUST NOT touch any UIKit / SwiftUI symbol
  (per FR-FF-013 / Edge Case "Filter intent
  invocation while the app is suspended").
- **NFR-FF-010 (Constitution v1.1.0)**: Additive
  integration only; no edits to unrelated modules,
  screens, or plugins; the only on-disk changes
  attributable to this feature are the new
  `src/modules/focus-filters-lab/` tree, the new
  `src/native/focus-filters.ts` bridge, the new
  `native/ios/focus-filters/` Swift sources, the
  new `plugins/with-focus-filters/` plugin, the
  one-line registry import + array entry, and the
  one-line `app.json` plugin entry. All changes
  pass `pnpm check`.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A reviewer with an iPhone running
  iOS 16+ can go from a fresh dev-build install to
  observing the in-app UI adapt to a real Focus
  Filter activation in under 5 minutes by following
  only the in-app explainer + filter definition +
  setup instructions card (no external
  documentation required).
- **SC-002**: Settings → Focus → Add Filter →
  search "spot" surfaces "Showcase Mode" within
  one search keystroke session, and tapping it
  presents a configuration sheet with exactly two
  controls (`mode` picker with three options;
  `accentColor` picker / input with at minimum
  the four documented swatch identifiers) per
  US1 AS6.
- **SC-003**: Activating a Focus that has
  `ShowcaseModeFilter` bound results in the in-app
  current filter state panel updating within 500 ms
  of the next foreground transition (verified by
  US1 AS3).
- **SC-004**: The full `pnpm check` suite passes
  with zero new failures on every commit; 013's,
  014's, 027's, and 028's existing test suites
  continue to pass unchanged.
- **SC-005**: Running `npx expo prebuild` twice in
  succession produces byte-identical Xcode project
  state on the second run; reordering the new
  `with-focus-filters` plugin entry with respect
  to all prior plugins in `app.json` produces
  byte-identical Xcode project state.
- **SC-006**: The pretend-toggle path (Story 2)
  works on Android, Web, iOS < 16, and iOS 16+
  with identical visible behaviour: toggling the
  switch ON re-tints the demo body and prepends a
  `simulated` event log entry within one render
  pass.
- **SC-007**: On Android, Web, and iOS < 16 the
  screen renders the explainer + filter definition
  + in-app demo half without crashing and without
  attempting to load any iOS-16-only native bridge
  symbol (verified by US3).
- **SC-008**: Inspecting the generated Xcode
  project after `expo prebuild` shows zero new
  targets added by feature 029 — the two 029 Swift
  sources appear in the **main app target's**
  `Sources` build phase and nowhere else; the App
  Group entitlement on every target is byte
  identical to the state produced by features 014
  / 027 / 028 alone.
- **SC-009**: The event log displays at most 10
  entries at any time (verified by US1 AS5 /
  FR-FF-033) with `simulated` entries visually
  distinguishable from `activated` /
  `deactivated` entries (verified by US2 AS5 /
  FR-FF-034).

## Acceptance Criteria

A feature delivery is accepted when **all** of the
following hold:

- **AC-FF-001**: The registry contains a single new
  entry with `id: 'focus-filters-lab'` and the
  platforms / minIOS fields above. Diff against the
  branch parent shows registry size +1 and no other
  registry edits.
- **AC-FF-002**: `app.json` `plugins` contains a
  single new entry `./plugins/with-focus-filters`.
  Diff shows +1 plugin and no other plugin edits.
- **AC-FF-003**: `package.json` adds zero new
  dependencies; the dependency block diff is empty.
- **AC-FF-004**: `pnpm check` (lint, typecheck,
  tests) passes with zero new failures. Test totals
  are at least the baseline carried from feature
  028's completion; the delta introduced by 029 is
  reported in plan.md and the retrospective.
- **AC-FF-005**: On a fresh install on iOS 16+, US1
  end-to-end test passes: bind the filter to a
  Focus → activate the Focus → foreground the app →
  current filter state panel + in-app demo status
  pill display the persisted values within 500 ms →
  event log records an `activated` entry.
- **AC-FF-006**: US2 end-to-end test passes: on any
  platform, the "Pretend filter is active" toggle
  re-tints the demo body, updates the status pill,
  and prepends a `simulated` event log entry within
  one render pass; toggling OFF reverts the demo to
  the persisted values or to the empty state.
- **AC-FF-007**: US3 cross-platform test passes:
  the screen renders on Android, Web, and iOS < 16
  with the iOS-16-only banner, the explainer card,
  the filter definition card, and the in-app demo
  with the pretend toggle; the current filter state
  panel and the setup instructions card are
  hidden; the event log shows only `simulated`
  entries; calling `getCurrentFilterValues()` on
  these platforms throws `FocusFiltersNotSupported`.
- **AC-FF-008**: Idempotency + commutativity test
  passes: running `npx expo prebuild` twice
  produces unchanged main-app-target `Sources`
  build phase on the second run; reordering the
  new `with-focus-filters` plugin with respect to
  013 / 014 / 026 / 027 / 028 entries in
  `app.json` produces byte-identical project
  state.
- **AC-FF-009**: Cross-feature isolation test
  passes: 013's App Intents (Siri / Shortcuts)
  continue to be discoverable and to perform; 014
  / 027 / 028 widgets continue to render and
  refresh; the App Group key namespaces
  (`spot.widget.config` / `spot.widget.lockConfig`
  / `spot.widget.standbyConfig` /
  `spot.focus.filterValues`) remain disjoint —
  reading one namespace MUST NOT return values
  written into another.
- **AC-FF-010**: 013/014/027/028 regression test
  passes: their flows continue to work unchanged
  after 029's plugin is installed and after a
  clean `expo prebuild`.
- **AC-FF-011**: No-new-target audit passes:
  inspecting the generated Xcode project shows
  that no new target was created by feature 029
  and the two 029 Swift files appear in the main
  app target's `Sources` build phase.
- **AC-FF-012**: Comprehensive unit-test coverage
  exists per FR-FF-055; every listed test file is
  present and passes. Native bridges are mocked at
  the import boundary per FR-FF-056.
- **AC-FF-013**: No `eslint-disable` directive for
  an unregistered rule appears anywhere in 029's
  source. `pnpm format` was run before the merge
  commit.
- **AC-FF-014**: The Settings → Focus → Add Filter
  flow on a real iOS 16+ device surfaces "Showcase
  Mode" via search "spot" and presents a
  configuration sheet matching FR-FF-007 (three
  `mode` cases, ≥ four `accentColor` swatch
  identifiers, both with localised display
  strings).

## Out of Scope

- Multi-filter showcase (forbidden by Non-Goals).
- iOS < 16 backports (`SetFocusFilterIntent` is iOS
  16+ only).
- Wiring the persisted filter values into 014's
  home widget, 027's lock-screen widget, or 028's
  StandBy widget.
- Reading the system's currently-active Focus via
  `INFocusStatus` / `NSFocusFilterAvailabilityCenter`
  or any private API.
- Editing 013's, 014's, 026's, 027's, or 028's
  plugin, screen, registry entry, or Swift sources.
  The only permitted change to any prior feature's
  source tree is via this feature's own plugin
  appending its own Swift sources to the main app
  target's `Sources` build phase (no edit to any
  prior file).
- Persistence of the in-memory event log across
  screen unmounts or app launches.
- Localisation of filter parameter labels beyond
  iOS 16's default-locale `LocalizedStringResource`
  coverage.
- Adding a new App Group, modifying the existing
  App Group identifier, or migrating any 014 / 027
  / 028 keys.
- Declaring the filter via an `AppShortcutsProvider`
  (per DECISION 2 below — not required for filter
  discovery on iOS 16+).
- Server-side push of filter values, remote
  configuration of the filter, or background
  refresh independent of system Focus invocations.

## Open Questions (resolved)

All ambiguities below were resolved autonomously
with reasonable defaults; none remain blocking.

1. **Reuse 013's `with-app-intents` plugin or create
   a separate `with-focus-filters` plugin?** —
   Resolved: **separate plugin** at
   `plugins/with-focus-filters/` (FR-FF-041).
   013's plugin hard-codes its four Swift source
   filenames; extending it to also append 029's
   sources would require editing 013's plugin, which
   the additive-integration constitution forbids. A
   separate plugin keeps ownership clean: 013 owns
   `LogMoodIntent` / `GetLastMoodIntent` /
   `GreetUserIntent` / `SpotAppShortcuts`; 029 owns
   `ShowcaseModeFilter` / `FocusFilterStorage`.
   Both plugins target the same main app target and
   are commutative because each plugin only adds
   files (no plugin reorders or removes the other's
   contributions).
2. **Declare the filter via `AppShortcutsProvider`
   or rely on iOS auto-discovery?** — Resolved:
   **rely on iOS auto-discovery** (FR-FF-044 /
   Out-of-Scope). Per Apple's `SetFocusFilterIntent`
   documentation, filter intents are discoverable
   by the system whenever the conforming type is
   linked into the main app target — they do NOT
   require registration via `AppShortcutsProvider`.
   `AppShortcutsProvider` is the discovery
   mechanism for **App Shortcuts** (Siri / Spotlight
   suggestions), not for Focus Filters. Declaring
   the filter as an App Shortcut would also clutter
   the Shortcuts gallery with an entry that isn't
   meant to be invoked manually. 013's existing
   `SpotAppShortcuts.swift` therefore remains
   untouched.
3. **Reuse 014's App Group identifier or add a
   new App Group for the filter values?** —
   Resolved: **reuse 014's App Group**
   (FR-FF-012). The filter values are read by the
   main app from the JS bridge; the main app
   target already has 014's App Group entitlement;
   adding a second App Group would require
   modifying entitlements on the main app target
   (and the widget extension target), which is
   exactly the kind of cross-feature edit the
   constitution forbids. The key namespace
   (`spot.focus.filterValues`) is disjoint from
   014's (`spot.widget.config`), 027's
   (`spot.widget.lockConfig`), and 028's
   (`spot.widget.standbyConfig`) namespaces, so
   the four features cannot accidentally read each
   other's payloads.
4. **Display the system Focus name in the status
   pill?** — Resolved: **best-effort display**
   (FR-FF-014 / FR-FF-029). When iOS supplies the
   Focus name to the filter intent's `perform()`
   call (via the system-supplied
   `IntentParameter` context for filter intents),
   the native code persists it in the
   `focusName?` field of the App Group payload
   and the JS layer surfaces it in the status
   pill / event log. When the system does not
   supply the name (older OS revision, certain
   privacy modes, or simulator quirks), the field
   is omitted and the pill / event log row simply
   omits the name without crashing or showing an
   empty placeholder.
5. **In-app `simulateActivation` should write to
   the App Group or stay in-memory only?** —
   Resolved: **in-memory only** (FR-FF-031 /
   FR-FF-023). Writing simulated activations to
   the App Group would pollute the storage shared
   with the real filter intent, would be visible
   to widget extensions if any future feature
   reads `spot.focus.filterValues`, and would
   blur the line between simulated and real
   activations. Keeping simulation in-memory
   leaves the persisted shape pristine and makes
   the pretend-toggle a pure UI affordance.
6. **Where do the Swift sources live?** —
   Resolved: `native/ios/focus-filters/`
   (FR-FF-040). Mirrors 013's
   `native/ios/app-intents/` and 028's
   `native/ios/widgets/standby/` (or wherever the
   StandBy sources land per 028's plan)
   conventions of one feature-folder per native
   capability.
7. **Cap on event log entries?** — Resolved:
   **10 entries**, FIFO, in-memory only
   (FR-FF-033 / FR-FF-035). Matches 028's
   per-kind reload event log capacity and 014's
   reload event log capacity, keeping the visual
   density consistent across the three demos.
8. **Should the filter be exposed in Shortcuts as
   well as Focus Filters?** — Resolved: **no**
   (Out-of-Scope, Non-Goal "No multi-filter
   showcase" + DECISION 2). The feature's
   showcase value is the Focus Filter binding
   surface; surfacing it as a Shortcuts entry too
   would dilute the demo and require an
   `AppShortcutsProvider` registration, which
   would in turn require editing 013's
   `SpotAppShortcuts.swift` (forbidden).
9. **What happens on deactivation — does the App
   Group payload get cleared?** — Resolved:
   **payload retained, `event` field flipped to
   `'deactivated'`** (FR-FF-014 / FR-FF-026 /
   Edge Case "Filter values persisted but the
   bound Focus has been deactivated"). Clearing
   the payload would lose the "last seen" history
   that the current filter state panel surfaces
   for review. Retaining the payload with an
   updated `event` and `updatedAt` lets the panel
   render a meaningful "Focus is no longer
   active, last seen at <time>" indicator.
10. **AsyncStorage shadow store for the
    cross-platform fallback?** — Resolved:
    **none** (FR-FF-032 / FR-FF-046). Unlike
    014/027/028 (which use AsyncStorage to mirror
    widget configuration on non-iOS platforms),
    029's filter values are exclusively
    system-driven; there is no equivalent of a
    "user pushes a configuration" path on Android
    / Web. The pretend-toggle handles the
    cross-platform demo path entirely in memory,
    so an AsyncStorage shadow would carry no
    value and would create another corner case to
    test.
11. **Default values on first mount?** —
    Resolved: `mode = relaxed`, `accentColor =
    blue` (FR-FF-007 / FR-FF-024). Matches the
    Swift `@Parameter` defaults so the in-app
    draft and the Settings → Focus → Add Filter
    sheet open on the same configuration.
12. **Should the bridge surface the raw App Group
    JSON or a typed object?** — Resolved: **typed
    object with strict parsing** (FR-FF-015 /
    FR-FF-046). Unknown `mode` / `accentColor`
    values fall back to documented defaults per
    the Edge Cases; missing required fields
    cause the bridge to resolve `null`; malformed
    JSON resolves `null` with a `__DEV__`-gated
    warn. This matches 013's bridge error
    discipline.
13. **Where do the parameter display strings come
    from?** — Resolved: **`LocalizedStringResource`
    in the Swift `AppEnum` declaration**
    (FR-FF-007 / Edge Case "AppEnum
    localisation"). Hard-coded English fallbacks
    are acceptable for the showcase; production
    grade localisation is out of scope per
    Non-Goals.
14. **Should the screen restore draft values
    across mounts?** — Resolved: **no** —
    drafts reset to documented defaults
    (`relaxed` / `blue`) on every screen mount
    (FR-FF-024). Drafts are a UI affordance for
    the pretend-toggle path and are not the
    canonical persisted state; persisting them
    would invite confusion about which values
    are "real". The persisted App Group payload
    remains the only durable state.
