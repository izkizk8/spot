# Feature Specification: App Intents Showcase

**Feature Branch**: `013-app-intents`  
**Created**: 2026-04-28  
**Status**: Draft  
**Input**: User description: "A new module that demos Apple's App Intents framework — exposing app actions to Siri, Shortcuts, Spotlight, and (iOS 17+) Action Button / interactive widgets. Prove that an Expo app can declare typed Intents in Swift that Siri/Shortcuts can invoke, AND show the inverse (in-app UI to trigger / display recently-fired intents for self-test)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Self-test the three intents from inside the app on iOS (Priority: P1)

A user opens the Spot iOS Feature Showcase on an iPhone running iOS 16
or later, sees an "App Intents Lab" card on the Modules home grid, and
taps it. They land on a screen titled "App Intents Lab" with two halves:
on top, a self-test panel exposing three buttons — "Log mood",
"Get last mood", and "Greet user" — corresponding to the three intents
this module defines. They tap each button in turn (selecting a mood from
a happy / neutral / sad picker for Log mood, and typing a name for Greet
user) and immediately see, below the buttons, a result line ("Logged
happy at 14:02", "Last mood: happy", "Hello, Ada!") and a running event
log of the last 10 invocations showing timestamp, intent name,
parameters, and result.

**Why this priority**: This is the smallest end-to-end slice that proves
the module's core promise — a real App Intents bridge from JS into
typed Swift intents that round-trip a result. It exercises the registry
entry, the iOS 16+ gating, the JS bridge (`src/native/app-intents.ts`),
the three Swift intents, the shared mood store, and the event log. It
delivers value entirely on-device without any Siri / Shortcuts setup,
which is what makes it the MVP slice.

**Independent Test**: Install a dev build on an iPhone running iOS 16+,
open the Modules grid, tap the "App Intents Lab" card. In the self-test
panel, pick "happy" and tap Log mood — verify a result line appears and
a new entry is added to the event log with intent name `LogMoodIntent`,
parameters `{ mood: "happy" }`, and a recent timestamp. Tap Get last
mood — verify the result line shows `happy` and a `GetLastMoodIntent`
entry is added to the log. Type a name and tap Greet user — verify the
result line shows the greeting and a `GreetUserIntent` entry is added.

**Acceptance Scenarios**:

1. **Given** the user is on the Modules home grid on an iOS 16+ device,
   **When** they look at the list of available modules, **Then** an
   "App Intents Lab" card MUST be visible and tappable.
2. **Given** the user has tapped the App Intents Lab card on iOS 16+,
   **When** the screen first renders, **Then** the screen MUST present a
   self-test panel containing three controls — a mood picker plus a
   "Log mood" button, a "Get last mood" button, and a name text field
   plus a "Greet user" button — and an initially empty event log
   region with a heading such as "Recent intent invocations".
3. **Given** the self-test panel is visible, **When** the user selects a
   mood and taps "Log mood", **Then** the bridge MUST invoke
   `LogMoodIntent` with the selected mood, the screen MUST display a
   result line summarising the logged mood, and a new entry MUST be
   prepended to the event log with the intent name, parameter, result,
   and a timestamp.
4. **Given** at least one mood has been logged, **When** the user taps
   "Get last mood", **Then** the bridge MUST invoke `GetLastMoodIntent`,
   the screen MUST display the last logged mood as the result, and a
   new entry MUST be prepended to the event log.
5. **Given** the self-test panel is visible, **When** the user types a
   non-empty name and taps "Greet user", **Then** the bridge MUST
   invoke `GreetUserIntent` with that name, the screen MUST display
   the returned greeting string, and a new entry MUST be prepended to
   the event log.
6. **Given** the event log already contains 10 entries, **When** the
   user fires another intent, **Then** the new entry MUST be prepended
   and the oldest entry MUST be discarded so the log never exceeds
   exactly 10 entries.

---

### User Story 2 - See the mood history persist across screen reloads (Priority: P1)

The user wants to feel that the intents are doing real work, not just
echoing back. Below the self-test panel, on iOS 16+, they see a "Mood
History" list showing the last 20 logged moods, newest first, with the
mood label and a timestamp. Each Log mood invocation (whether from the
self-test button, Siri, Shortcuts, or Spotlight) immediately appears at
the top of this list. Navigating away from the screen and returning to
it shows the same history (because it is backed by AsyncStorage), and
the list is capped at 20 entries.

**Why this priority**: Persistent history is what makes "Log mood"
meaningful — it demonstrates that an App Intent invocation produces
durable side-effects observable by the JS UI. It is co-equal P1 with
Story 1 because Story 1's "Get last mood" call is only credible if the
log is actually persisted and visible.

**Independent Test**: After Story 1 is shipped, open the App Intents Lab
on iOS 16+, log three different moods in succession, and verify each
appears at the top of the Mood History list with a recent timestamp
and the most recent appearing first. Navigate away from the screen,
then return — verify the same three entries are still present in the
same order. Continue logging until 22 entries have been written and
verify only the 20 most recent are displayed.

**Acceptance Scenarios**:

1. **Given** the user is on the App Intents Lab screen on iOS 16+,
   **When** the screen renders, **Then** a "Mood History" list MUST be
   visible below the self-test panel and MUST display the last 20
   logged moods, ordered newest-first, each with the mood label and a
   timestamp.
2. **Given** the Mood History list is empty, **When** the user logs a
   mood via "Log mood", **Then** the new entry MUST appear at the top
   of the list within the same render pass.
3. **Given** the Mood History list contains N entries (0 ≤ N < 20),
   **When** the user logs a new mood, **Then** the list MUST contain
   N+1 entries with the new entry first.
4. **Given** the Mood History list contains exactly 20 entries,
   **When** the user logs a new mood, **Then** the list MUST contain
   exactly 20 entries with the new entry first and the oldest
   previously displayed entry removed.
5. **Given** the user has logged moods on the App Intents Lab screen,
   **When** they navigate away and return, **Then** the Mood History
   list MUST still display the previously logged moods in newest-first
   order.

---

### User Story 3 - Trigger the intents from Shortcuts and see them appear in the in-app log (Priority: P1)

The user wants to confirm that the intents are *really* exposed to the
system, not just locally callable. Below the self-test panel and Mood
History list, the screen presents a "Shortcuts integration guide" card
with a numbered step list explaining how to find the three intents in
Apple's Shortcuts app on the device, and a primary "Open Shortcuts"
button that deep-links into the Shortcuts app via `Linking`. Following
the steps, the user opens Shortcuts, finds "Spot" in the app list,
taps the "Log mood" action, runs it with mood `sad`, and returns to
Spot. The new entry appears in the Mood History list, and (on a
subsequent screen visit while the app is alive) in the event log.

**Why this priority**: This is the *point* of the module — proving the
Expo app's intents are visible to the system Shortcuts app. It depends
on Story 1 (the intents must be defined and registered) and Story 2
(the durable mood store must be wired in) but is the headline beat for
the showcase.

**Independent Test**: After Stories 1 and 2 are shipped, on an iOS 16+
device install the dev build, open the App Intents Lab, tap "Open
Shortcuts" and confirm the Shortcuts app opens. In Shortcuts, browse
the app actions list, find "Spot", and verify the three actions
(LogMoodIntent, GetLastMoodIntent, GreetUserIntent) are listed under
it with parameter prompts matching their declared parameters. Run the
"Log mood" action with `sad`, return to Spot, re-open the App Intents
Lab, and verify a `sad` entry appears at the top of the Mood History
list with a recent timestamp.

**Acceptance Scenarios**:

1. **Given** the user is on the App Intents Lab screen on iOS 16+,
   **When** the screen renders, **Then** a "Shortcuts integration
   guide" card MUST be visible below the Mood History list with a
   numbered step list and an "Open Shortcuts" button.
2. **Given** the Shortcuts integration guide is visible, **When** the
   user taps "Open Shortcuts", **Then** the Shortcuts app MUST be
   launched via the system URL scheme through `Linking`.
3. **Given** the user has installed the dev build on an iOS 16+ device
   and opened the Shortcuts app, **When** they browse the app actions
   list, **Then** the "Spot" app MUST appear with the three actions
   `LogMoodIntent`, `GetLastMoodIntent`, and `GreetUserIntent` listed
   under it, each with parameter prompts matching their declared
   parameters (mood enum / none / name string).
4. **Given** the user runs the Log mood action from Shortcuts with a
   chosen mood, **When** they return to the App Intents Lab screen,
   **Then** the Mood History list MUST include the new entry with the
   chosen mood and a timestamp matching the run.
5. **Given** the user has logged a mood from Siri or Shortcuts at
   least once, **When** the system surfaces Siri suggestions for the
   Spot app, **Then** the Log mood action MUST be eligible to appear
   as a suggestion (i.e. the intent MUST donate itself on each
   invocation).

---

### User Story 4 - Cross-platform fallback on Android, Web, and iOS < 16 (Priority: P2)

A user opens the App Intents Lab on Android, on Web, or on an iPhone
running iOS 15 or earlier. The screen still loads. At the top, a banner
reads "App Intents are iOS 16+ only" and explains that Siri / Shortcuts
integration is not available on this platform. Below the banner, an
RN-only "Mood Logger" panel still lets the user pick a mood and tap
Log to write to the same AsyncStorage-backed mood store used by the
iOS path, and the same Mood History list renders below it. A Greet
input field still works locally — typing a name and tapping Greet
returns the greeting string entirely in JS, without any native bridge.
The Shortcuts integration guide card and the Get last mood button are
hidden or disabled on this path; the event log is hidden because there
are no intent invocations to log.

**Why this priority**: Cross-platform parity for the *data half* of the
module is required by Constitution Principle I. Without this fallback,
the module is broken on Android, Web, and older iOS devices. It is P2
rather than P1 because the headline value of the module is the iOS
intents themselves; the fallback exists to keep the app structurally
sound across platforms, not to deliver Siri / Shortcuts.

**Independent Test**: Run the screen in a desktop web browser and on an
Android device (or simulator), and on an iPhone with iOS 15 or earlier
if available. In each case, verify the screen renders, the "App Intents
are iOS 16+ only" banner is visible, the Mood Logger panel and the
Greet input field render, the iOS-only self-test buttons (Get last mood
in particular) and the Shortcuts integration guide card and event log
are hidden, and logging a mood from the Mood Logger updates the Mood
History list below it.

**Acceptance Scenarios**:

1. **Given** the user opens the App Intents Lab on Android, Web, or
   iOS < 16, **When** the screen renders, **Then** an "App Intents are
   iOS 16+ only" banner MUST be visible at the top of the content area
   explaining that Siri / Shortcuts integration is unavailable.
2. **Given** the user is on a non-iOS-16+ platform, **When** the
   screen renders, **Then** the iOS-only self-test buttons that require
   the native bridge ("Log mood" via intent, "Get last mood"), the
   Shortcuts integration guide card, and the event log MUST NOT be
   shown; the JS-only Mood Logger, the Greet input field, and the
   Mood History list MUST be shown.
3. **Given** the user is on a non-iOS-16+ platform, **When** they pick
   a mood in the Mood Logger and tap Log, **Then** the mood MUST be
   written to the same AsyncStorage-backed mood store used by the iOS
   path and the Mood History list MUST update with the new entry at
   the top.
4. **Given** the user is on a non-iOS-16+ platform, **When** they type
   a name and tap Greet, **Then** the greeting string MUST be computed
   purely in JS and shown inline as a result, without any native
   bridge call.
5. **Given** the user is on Android, Web, or iOS < 16, **When** any
   code path attempts to call an iOS-only App Intents bridge method,
   **Then** the bridge MUST throw an `AppIntentsNotSupported` error
   rather than silently no-oping, so that misuse is loud.

---

### Edge Cases

- **Empty mood store + Get last mood**: When the user taps "Get last
  mood" before any mood has ever been logged, the intent MUST return
  a clearly-marked empty result (e.g. an explicit "No moods logged
  yet" string) rather than throwing or returning an undefined value;
  the event log entry MUST record this empty-result state.
- **Empty name on Greet user**: When the user taps "Greet user" with
  an empty or whitespace-only name field, the screen MUST either
  disable the Greet button or invoke the intent with a sensible
  default (e.g. "there") so the user always sees a coherent greeting;
  the chosen behaviour MUST be consistent on iOS and on the JS-only
  fallback.
- **Rapid intent firing**: Tapping any of the three intent buttons
  rapidly in succession MUST be safe; each invocation MUST appear in
  the event log in the order it was fired; the mood store MUST end
  in a state consistent with the most recent Log mood invocation.
- **AsyncStorage read/write failure**: If the underlying storage
  layer throws, the Mood Logger / Log mood path MUST surface a
  user-visible error and MUST NOT crash the screen; the Mood History
  list MUST gracefully render an empty list rather than an error
  state when the underlying read fails.
- **Mood History at exactly 20 entries**: When the store contains 20
  or more raw entries, the visible Mood History list MUST display
  exactly the 20 most recent entries; older entries MUST be either
  truncated from storage or filtered out of the displayed list in a
  documented manner.
- **Event log overflow during rapid firing**: When the user fires
  more than 10 intents in a single screen session, the event log
  MUST always show exactly the 10 most recent invocations; older
  entries MUST not reappear after being evicted.
- **Backgrounding mid-intent**: Backgrounding the app while an intent
  is in flight MUST not corrupt the mood store or the event log;
  on return to foreground, the store MUST reflect the completed
  invocation if it succeeded, and the event log MUST reflect either
  a success or a clearly-marked failure entry.
- **Shortcuts deep-link failure**: If `Linking` cannot open the
  Shortcuts app (e.g. simulator without Shortcuts installed, or
  permission denied), the "Open Shortcuts" button MUST surface a
  user-visible error and MUST NOT crash the screen.
- **Intent invoked from Siri or Shortcuts while app is in background
  or terminated**: A Log mood invocation that runs while the app is
  not in the foreground MUST still update the AsyncStorage-backed
  mood store; the next time the user opens the App Intents Lab
  screen, the Mood History list MUST reflect that entry. The event
  log (which is in-memory only) MAY omit invocations that occurred
  while the screen's React component was not mounted.

## Requirements *(mandatory)*

### Functional Requirements

#### Module registration & gating

- **FR-001**: The App Intents Lab module MUST be registered in the
  plugin registry introduced by feature 006, with id `app-intents-lab`,
  declaring supported platforms `['ios', 'android', 'web']` and
  `minIOS: '16.0'` (App Intents is iOS 16+).
- **FR-002**: The Modules home grid MUST display the App Intents Lab
  card alongside other registered modules using the same card visual
  treatment, with the iOS-version gating handled by spec 006's existing
  `minIOS` mechanism (no parallel gating in this module).
- **FR-003**: Tapping the App Intents Lab card MUST navigate to the
  App Intents Lab screen via the registry's standard navigation flow.
- **FR-004**: On iOS versions below 16.0, the registry's `minIOS`
  gating MUST mark the card as unavailable per spec 006; the module
  MUST NOT attempt to load the App Intents Swift bridge on those
  versions.

#### Defined intents

- **FR-005**: The module MUST define exactly three App Intents in
  Swift, each conforming to `AppIntent` and available from iOS 16:
  `LogMoodIntent`, `GetLastMoodIntent`, and `GreetUserIntent`. No
  additional intents MUST be exposed to the system in this feature.
- **FR-006**: `LogMoodIntent` MUST declare exactly one parameter,
  `mood`, of an enum type with exactly three cases: `happy`, `neutral`,
  `sad`. On invocation it MUST persist a record `{ mood, timestamp }`
  to the shared mood store and MUST donate itself for Siri suggestions.
  Its returned result MUST include a human-readable confirmation
  containing the mood and an indication that it was logged.
- **FR-007**: `GetLastMoodIntent` MUST declare zero parameters. On
  invocation it MUST read the most recently persisted record from the
  shared mood store and return its mood value as a result. When the
  store is empty it MUST return an explicitly-marked empty result
  (e.g. a documented "no moods logged yet" string) rather than an
  error.
- **FR-008**: `GreetUserIntent` MUST declare exactly one parameter,
  `name`, of string type. On invocation it MUST return a greeting
  string of the form `Hello, <name>!` (with the chosen empty-name
  behaviour from the Edge Cases section consistently applied). It
  MUST NOT touch the shared mood store.
- **FR-009**: All three intents MUST be registered with the system via
  a single `AppShortcutsProvider` declared in Swift, exposing each
  intent with at least one Apple-recommended phrase suitable for Siri
  invocation. Full localization of phrases is out of scope.

#### JS bridge

- **FR-010**: The module MUST expose a JS bridge module at
  `src/native/app-intents.ts` exporting at minimum:
  `logMood(mood)`, `getLastMood()`, `greetUser(name)`, and
  `isAvailable()`. `isAvailable()` MUST return `true` only on iOS 16+
  with the native bridge present, and `false` otherwise.
- **FR-011**: On non-iOS platforms and on iOS < 16, calls to
  `logMood`, `getLastMood`, or `greetUser` MUST throw an
  `AppIntentsNotSupported` error (or equivalent named error) rather
  than silently returning a default value, so the JS-only fallback
  path is forced to detect platform availability up front.
- **FR-012**: On iOS 16+, each of `logMood`, `getLastMood`, and
  `greetUser` MUST delegate to the corresponding Swift intent through
  the native bridge and return a typed result mirroring the intent's
  declared return value.

#### Shared mood store

- **FR-013**: The module MUST provide a shared mood store at
  `src/modules/app-intents-lab/mood-store.ts` backed by AsyncStorage
  under the storage key `spot.app-intents.moods`, written in
  platform-uniform pure JS so it can be invoked from both the JS UI
  path and (on iOS) the native intent path.
- **FR-014**: The mood store MUST expose at minimum: `push(record)`
  (append a `{ mood, timestamp }` entry), `list({ limit })` (return
  the most recent entries, newest first, capped at `limit`), and
  `clear()` (remove all entries). Behaviour MUST be deterministic and
  testable from pure JS.
- **FR-015**: `list()` MUST always return entries newest-first and
  MUST never return more than the requested `limit`; when no `limit`
  is requested, a documented default cap (e.g. 100) MUST apply so the
  store cannot grow unbounded in memory.
- **FR-016**: The mood store MUST tolerate underlying AsyncStorage
  read/write errors without crashing the caller; on read failure
  `list()` MUST return an empty array; on write failure `push()` MUST
  surface the error to its caller for UI display while leaving the
  store in a consistent state.

#### Screen layout

- **FR-017**: The App Intents Lab screen MUST present a header with
  the title "App Intents Lab".
- **FR-018**: On iOS 16+ the screen MUST present, in this fixed
  top-to-bottom order: (a) a self-test panel containing a mood
  picker + "Log mood" button, a "Get last mood" button, and a name
  text field + "Greet user" button, with a result line for the most
  recent invocation; (b) an event log region showing the last 10
  intent invocations newest-first, each with timestamp, intent name,
  parameters (if any), and result; (c) a "Mood History" list showing
  the last 20 entries from the mood store, newest-first; (d) a
  Shortcuts integration guide card with a numbered step list and an
  "Open Shortcuts" button.
- **FR-019**: On Android, Web, and iOS < 16 the screen MUST present,
  in this fixed top-to-bottom order: (a) an "App Intents are iOS 16+
  only" banner; (b) a JS-only Mood Logger panel containing the same
  mood picker + Log button writing to the shared mood store; (c) the
  Greet input field + Greet button returning the greeting inline;
  (d) the same "Mood History" list reading from the shared mood
  store. The event log region, the iOS-only "Get last mood" button,
  and the Shortcuts integration guide card MUST NOT be shown on
  these platforms.

#### Self-test panel & event log (iOS 16+)

- **FR-020**: The self-test panel's mood picker MUST present exactly
  three options matching the `LogMoodIntent` mood enum: happy,
  neutral, sad. A default selection MUST be set on first render (any
  one of the three is acceptable as long as it is documented).
- **FR-021**: Tapping "Log mood", "Get last mood", or "Greet user"
  MUST invoke the corresponding bridge method, display the returned
  result on the screen, and prepend a new entry to the in-memory
  event log capturing timestamp, intent name, parameters (if any),
  and result.
- **FR-022**: The event log MUST be backed by an in-memory ring
  buffer of capacity exactly 10, implemented with a local React
  reducer; it MUST NOT be persisted across screen unmounts. When a
  new entry is added beyond the buffer's capacity, the oldest entry
  MUST be evicted.
- **FR-023**: Bridge errors (including `AppIntentsNotSupported`) MUST
  be caught at the screen layer and rendered as a clearly-marked
  failure entry in the event log and a user-visible error line; the
  screen MUST NOT crash on a bridge throw.

#### Mood Logger & Mood History

- **FR-024**: The JS-only Mood Logger panel (rendered on Android /
  Web / iOS < 16) MUST present the same mood picker as the iOS
  self-test panel and a Log button that, on tap, writes a new
  `{ mood, timestamp }` record to the shared mood store via
  `mood-store.push()`.
- **FR-025**: The Mood History list MUST display the most recent 20
  entries returned by `mood-store.list({ limit: 20 })`, newest-first,
  each row showing the mood label and a timestamp formatted in the
  user's locale.
- **FR-026**: The Mood History list MUST refresh in response to
  every successful Log mood invocation on its own platform (iOS
  intent path or JS Mood Logger path) within the same render pass;
  on screen mount the list MUST reflect any prior entries written by
  Siri / Shortcuts / Spotlight while the app was backgrounded.

#### Shortcuts integration guide (iOS 16+ only)

- **FR-027**: The Shortcuts integration guide card MUST contain a
  numbered step list explaining how to find the Spot app's actions
  in Apple's Shortcuts app on the device, including at minimum:
  open Shortcuts, browse the app actions list, find "Spot", and
  verify the three actions are listed.
- **FR-028**: The card MUST contain a primary "Open Shortcuts"
  button that calls `Linking.openURL` with the documented Shortcuts
  app URL scheme (e.g. `shortcuts://`); on failure to open, the
  screen MUST surface a user-visible error and MUST NOT crash.

#### Native packaging

- **FR-029**: The Swift sources defining the three intents and the
  `AppShortcutsProvider` MUST live under `native/ios/app-intents/`
  in the repository, and MUST be added to the main app target by a
  TypeScript Expo config plugin at `plugins/with-app-intents/`
  invoked at `expo prebuild` time.
- **FR-030**: The `with-app-intents` config plugin MUST be
  idempotent (running prebuild twice MUST produce the same Xcode
  project state) and MUST NOT modify, remove, or otherwise conflict
  with files added by feature 007's `with-live-activity` plugin or
  by any other existing config plugin in `plugins/`.
- **FR-031**: On non-iOS targets, no symbol from the native App
  Intents bridge MUST be imported or evaluated at module load time;
  the iOS-only native bridge MUST be loaded only on iOS and only
  when the device meets the iOS 16+ requirement.

#### Lifecycle

- **FR-032**: Navigating away from the App Intents Lab screen MUST
  tear down the screen cleanly: no asynchronous bridge callbacks
  MUST update React state after unmount; no layout warnings MUST be
  emitted; the in-memory event log MUST be discarded on unmount per
  FR-022.
- **FR-033**: When the app is backgrounded with the screen visible
  and returns to foreground, the Mood History list MUST refresh
  from the shared mood store so that any moods logged via Siri /
  Shortcuts / Spotlight while the app was in the background are
  reflected.

#### Accessibility

- **FR-034**: The mood picker, the three intent buttons, the Greet
  text field, the Mood Logger Log button, the Mood History rows,
  and the "Open Shortcuts" button MUST each expose an accessibility
  label describing their function (e.g. "Mood: happy", "Log mood",
  "Get last mood", "Greet user", "Open Shortcuts app").
- **FR-035**: The event log MUST expose, at minimum, an accessible
  summary per row containing the intent name, parameters (if any),
  and result so a screen-reader user is not presented with an
  opaque collection of unlabelled `<View>` nodes.
- **FR-036**: The "iOS 16+ only" banner on Android / Web / iOS < 16
  MUST expose its message to assistive technologies as a single
  accessible announcement on screen mount.

#### Architecture & quality

- **FR-037**: The module's source MUST live under
  `src/modules/app-intents-lab/` with at minimum: `index.tsx`
  (manifest), `screen.tsx` plus the platform variants
  `screen.android.tsx` and `screen.web.tsx` (and any additional
  variants required to keep iOS-only imports off non-iOS targets),
  `mood-store.ts`, and a `components/` directory containing at
  least `MoodLogger`, `MoodHistory`, `IntentEventLog`, `GreetForm`,
  and `ShortcutsGuideCard`.
- **FR-038**: The JS bridge MUST live at `src/native/app-intents.ts`;
  the Expo config plugin MUST live at `plugins/with-app-intents/`;
  the Swift sources MUST live at `native/ios/app-intents/`. No
  other directory in the repository MUST be created or modified by
  this feature.
- **FR-039**: The module MUST be registered with the registry via a
  single import line and a single array entry added to
  `src/modules/registry.ts`. No other file outside the directories
  enumerated in FR-038 MUST be modified by this feature; in
  particular, files belonging to features 006, 007, 008, 009, 010,
  011, and 012 MUST NOT be touched.
- **FR-040**: All component state (selected mood, name input,
  result line, event log) MUST be local component state; no new
  global stores, contexts, or persistence layers MUST be introduced
  beyond the mood store explicitly defined by FR-013.
- **FR-041**: All styles MUST use `StyleSheet.create()` and the
  centralized theme tokens (`Spacing`, theme colors via the
  project's themed primitives, `ThemedText` / `ThemedView`); no
  hardcoded colors and no inline style objects outside StyleSheet.
- **FR-042**: TypeScript strict mode and the existing path aliases
  (`@/*`) MUST be honoured; no relaxations or new lint/test tooling
  MUST be introduced.
- **FR-043**: All quality gates (`pnpm check`: format, lint,
  typecheck, test) MUST pass before the feature is considered
  complete. The constitution at `.specify/memory/constitution.md`
  v1.0.1 MUST pass uniformly; this feature does not request any
  constitutional exemption.
- **FR-044**: Tests MUST cover, at minimum, the following JS-pure
  files in line with constitutional Principle V (Test-First):
  `mood-store.test.ts` (push, list, clear, ordering newest-first,
  max-N truncation, AsyncStorage error tolerance);
  `native/app-intents.test.ts` (bridge contract: non-iOS stubs
  throw `AppIntentsNotSupported`, iOS path delegates to a mocked
  native module);
  `plugins/with-app-intents/index.test.ts` (registers the Swift
  sources from `native/ios/app-intents/`, is idempotent across
  repeated invocations, does not touch feature 007's
  `with-live-activity` plugin);
  `components/MoodLogger.test.tsx`,
  `components/MoodHistory.test.tsx`,
  `components/IntentEventLog.test.tsx`,
  `components/GreetForm.test.tsx`, and
  `components/ShortcutsGuideCard.test.tsx`;
  `screen.test.tsx`, `screen.android.test.tsx`, and
  `screen.web.test.tsx` (banner shown on non-iOS, JS Mood Logger
  reachable, mocked intents on iOS path);
  `manifest.test.ts` (asserts `id === 'app-intents-lab'`,
  `platforms === ['ios','android','web']`, `minIOS === '16.0'`,
  `render` is a function).
- **FR-045**: The Swift sources are not unit-testable on the
  Windows-based developer environment used by this repository; the
  feature MUST therefore document explicit on-device verification
  steps (open the App Intents Lab card on iOS 16+; fire each of
  the three intents from the self-test panel; confirm Mood History
  updates; open Shortcuts and confirm the three actions are listed
  under "Spot"; run Log mood from Shortcuts and confirm the entry
  appears in Mood History on return) in the planning artifact and
  in the Shortcuts integration guide card copy.

### Key Entities

- **Mood**: One of `happy`, `neutral`, `sad`. Drives both the
  `LogMoodIntent` mood enum on the Swift side and the mood picker
  on the JS side.
- **MoodRecord**: A single entry in the shared mood store. Shape:
  `{ mood: Mood, timestamp: number }` where `timestamp` is a
  millisecond epoch value. Records are appended via `push` and
  read back newest-first via `list`.
- **MoodStore**: The AsyncStorage-backed store keyed at
  `spot.app-intents.moods`. Operations: `push(record)`,
  `list({ limit })`, `clear()`. Returns are deterministic and
  newest-first; errors are tolerated per FR-016.
- **IntentInvocation**: An entry in the in-memory event log.
  Shape: `{ id, timestamp, intentName, parameters, result, status }`
  where `status` is one of `success` or `failure`. The log is a
  ring buffer of capacity exactly 10.
- **AppIntentsAvailability**: Per-render flag derived from the
  runtime platform and iOS version; `true` iff iOS 16+ with the
  native bridge present. Drives whether the iOS-only self-test
  panel, event log, and Shortcuts integration guide card render
  versus the JS-only Mood Logger fallback.
- **GreetingResult**: The string returned by `GreetUserIntent`
  (and by the JS-only Greet form on the fallback path) — a
  `Hello, <name>!`-shaped greeting derived from the supplied
  name.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user lands on the Modules home grid on an iOS 16+
  device, opens the App Intents Lab, and successfully fires each of
  the three intents from the self-test panel within 60 seconds
  without consulting docs.
- **SC-002**: 100% of the three defined intents (LogMoodIntent,
  GetLastMoodIntent, GreetUserIntent) are invokable from the
  self-test panel on iOS 16+ and produce a visible result line and a
  new event log entry within the same render pass.
- **SC-003**: The event log displays exactly the 10 most recent
  intent invocations in 100% of states; the 11th invocation evicts
  the oldest entry; the log is discarded on screen unmount.
- **SC-004**: 100% of Log mood invocations (whether from the
  self-test panel, from Siri, or from Shortcuts) produce a new
  entry at the top of the Mood History list within the same render
  pass on the next screen visit; the Mood History list never
  displays more than 20 entries at once.
- **SC-005**: On iOS 16+, opening the Shortcuts app after a single
  successful run of the dev build surfaces the Spot app in the
  app actions list with the three actions LogMoodIntent,
  GetLastMoodIntent, and GreetUserIntent under it, with parameter
  prompts matching their declared parameters in 100% of fresh
  installs verified.
- **SC-006**: The "Open Shortcuts" button successfully launches
  the Shortcuts app via `Linking` in 100% of taps on iOS 16+
  devices where the Shortcuts app is installed; on failure the
  screen surfaces a user-visible error and does not crash.
- **SC-007**: On Android, Web, and iOS < 16, opening the App
  Intents Lab produces zero runtime errors related to missing
  iOS-only App Intents symbols; the "iOS 16+ only" banner is
  shown; the JS Mood Logger and Greet form are interactive; and
  any direct call to the bridge methods throws an
  `AppIntentsNotSupported` error rather than silently no-oping.
- **SC-008**: On iOS 16+, the App Intents Lab card is shown and
  the iOS-only self-test panel is rendered; on iOS < 16 the
  registry's `minIOS: '16.0'` gating marks the card as unavailable
  per spec 006 and the iOS-only App Intents bridge symbol is never
  imported.
- **SC-009**: The mood store correctly persists across app launches
  in 100% of round-trip tests: writing N entries, terminating the
  app, relaunching, and reading back returns the same N entries
  newest-first (capped at the documented store cap).
- **SC-010**: The change is purely additive at the registry level:
  exactly one import line and one array entry are added to
  `src/modules/registry.ts`; no other file outside
  `src/modules/app-intents-lab/`, `src/native/app-intents.ts`,
  `plugins/with-app-intents/`, and `native/ios/app-intents/` is
  modified by this feature; in particular features 006, 007, 008,
  009, 010, 011, and 012 source files are untouched.
- **SC-011**: The `with-app-intents` Expo config plugin is
  idempotent across repeated `expo prebuild` runs (re-running
  prebuild produces an identical Xcode project state) and does
  not touch any file written by feature 007's
  `with-live-activity` plugin in 100% of plugin unit-test runs.
- **SC-012**: All quality gates (`pnpm check`) pass on the feature
  branch with no warnings introduced by this module.

## Out of Scope

The following are explicitly **not** part of this feature and will be
deferred to a future spec if pursued:

- `AppEntity` and `EntityQuery` integrations (no model entity types
  are exposed to App Intents in this feature).
- Interactive widgets backed by App Intents (deferred to spec 014).
- iOS 17+ Action Button binding to a Spot intent.
- A fully-localised `AppShortcutsProvider` with multiple per-intent
  phrases per locale; a single Apple-recommended phrase per intent
  is sufficient.
- Focus filter intents (`SetFocusFilterIntent` and friends).
- `ShortcutsLink` and dynamic options providers
  (`DynamicOptionsProvider`) for parameter values.
- Spotlight indexing of mood records as `CSSearchableItem`s; only
  the implicit Spotlight surfacing that comes "for free" from
  declaring App Intents is in scope.
- A unit-tested Swift implementation: Swift code is not unit-tested
  on the Windows-based developer environment used by this
  repository, and on-device verification steps are documented per
  FR-045 instead.
- Migration of mood records from any pre-existing store; the mood
  store is brand-new for this feature.
- Exporting mood history as CSV / JSON or any other shareable
  artifact.

## Assumptions

- The plugin registry from feature 006 is in place, supports
  modules declaring `platforms: ['ios', 'android', 'web']` together
  with a `minIOS` value, and already gates module visibility by
  iOS version per spec 006's existing dispatch.
- Apple's App Intents framework is available on iOS 16 and later
  and exposes `AppIntent`, an enum-typed parameter mechanism
  sufficient for the three-case mood enum, a string-typed parameter
  mechanism sufficient for the name parameter, an
  `AppShortcutsProvider` registration surface, and an intent
  donation API sufficient to satisfy FR-006's Siri-suggestion
  donation requirement.
- Apple's Shortcuts app exposes a URL scheme reachable via React
  Native's `Linking.openURL` (e.g. `shortcuts://`) on iOS 16+
  devices where the Shortcuts app is installed.
- AsyncStorage is already a project dependency available to all
  modules and supports the small key-value workload required by
  the mood store; no new persistence dependency is introduced by
  this feature.
- The existing themed primitives (`ThemedView`, `ThemedText`,
  `Spacing`, theme colour tokens) are sufficient for all screen
  chrome, banner, panel, and card visuals in this module.
- The Swift sources can be added to the main app target by an Expo
  config plugin at `expo prebuild` time without requiring any
  manual Xcode configuration step on the developer's machine; if
  this assumption fails, the planning phase will document the
  manual step in the on-device verification guide.
- Feature 007's `with-live-activity` config plugin restricts its
  modifications to its own files and does not write to the same
  Xcode project regions touched by `with-app-intents`; the two
  plugins can therefore coexist additively.
- The constitution at `.specify/memory/constitution.md` v1.0.1
  applies uniformly; this feature does not request any
  constitutional exemption.

## Notes

- [NEEDS CLARIFICATION: empty-name behaviour for GreetUserIntent]
  The Edge Cases section requires the empty-name path to be
  consistent on iOS and on the JS-only fallback, but does not pin
  a specific behaviour. Recommended default during planning: the
  Greet button is disabled while the name field is empty or
  whitespace-only (no default substitution). Resolve in
  `/speckit.clarify` or `/speckit.plan`.
- [NEEDS CLARIFICATION: default mood selection on first render]
  FR-020 requires a documented default selection in the mood
  picker but does not pin which case. Recommended default during
  planning: `neutral` (the middle option, least judgemental).
  Resolve in `/speckit.clarify` or `/speckit.plan`.
- [NEEDS CLARIFICATION: mood store hard cap] FR-015 requires a
  documented default cap on `list()` when no limit is requested,
  and FR-013 / FR-014 leave the on-disk cap implicit.
  Recommended default during planning: 100 entries on disk; older
  entries are truncated on `push`. Resolve in `/speckit.clarify`
  or `/speckit.plan`.
