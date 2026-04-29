# Implementation Plan: EventKit (Calendar + Reminders) Module

**Branch**: `037-eventkit` | **Date**: 2026-04-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/037-eventkit/spec.md`
**Branch parent**: `036-passkit-wallet`

## Summary

Add an "EventKit Lab" showcase module that demonstrates Apple's
EventKit surface — calendar event query/CRUD and reminder query/CRUD
— consumed cross-platform via the maintained
[`expo-calendar`](https://docs.expo.dev/versions/latest/sdk/calendar/)
library rather than a hand-written Swift bridge. The feature ships a
fully-functional iOS + Android educational module: every JS-pure path
(authorisation state machine, calendars/lists enumeration, events &
reminders query with predicate filters, full CRUD via the composers,
write-only / full-access iOS 17+ status branches, DST-stable date-range
presets, alarm-offset presets) is exercised under `pnpm check` against
mocked `expo-calendar` boundaries; on-device behaviour is validated via
`quickstart.md` on iOS 4+ and Android. The module is self-contained
inside `src/modules/eventkit-lab/` and registers as a single new card
(`id: 'eventkit-lab'`, `platforms: ['ios','android','web']`,
`minIOS: '4.0'`) appended to `src/modules/registry.ts`. A new config
plugin `plugins/with-eventkit/` adds the four required Info.plist
usage-description keys (`NSCalendarsUsageDescription`,
`NSCalendarsWriteOnlyAccessUsageDescription` for iOS 17+,
`NSRemindersUsageDescription`,
`NSRemindersFullAccessUsageDescription` for iOS 17+), idempotent
across re-runs and coexisting with all 23 prior plugins (002–036).
Integration is purely additive at the project boundary: registry +1
module entry, `app.json` `plugins` +1 entry, `package.json` +1
runtime dependency (`expo-calendar`). No edits to features 002–036.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict). React 19.2 + React
Native 0.83 + React Compiler enabled. **Zero new Swift / Kotlin /
Java sources** authored by this feature — `expo-calendar` ships its
own native bridge.
**Primary Dependencies**: Expo SDK 55, `expo-router` (typed routes),
`react-native-reanimated` Keyframe API + `react-native-worklets`
(carryover, not exercised here), `@expo/config-plugins` (consumed by
`plugins/with-eventkit`). **NEW runtime JS dep**: `expo-calendar`
(installed via `npx expo install expo-calendar` so the version is
SDK-55-compatible). All prior pinned packages are unchanged.
**Storage**: None. Authorisation status, calendars / lists arrays,
events / reminders query results, the active range / filter, the
`inFlight` flag, and `lastError` are in-memory and scoped to the
screen's lifetime. Calendar events and reminders themselves live in
the system's EventKit / Calendar Provider stores; the module reads
and writes them via `expo-calendar` and never persists copies to
disk.
**Testing**: Jest Expo + React Native Testing Library — JS-pure
tests only. All `expo-calendar` interactions are mocked **at the
import boundary** (Jest module mock of `expo-calendar`); hooks and
components are exercised through that single seam. This mirrors the
seam pattern established by features 030 / 031 / 032 / 033 / 034 /
035 / 036, except the seam is the upstream library module rather
than a project-owned `src/native/<feature>.ts` wrapper, because
`expo-calendar` already provides the typed surface this feature
needs. The full suite is Windows-runnable (no native, no device).
**Target Platform**: iOS 4+ (the spec's stated `minIOS: '4.0'` is
inherited from EventKit's original release; modern functionality is
gated by `expo-calendar`'s own runtime guards). On iOS 17+ the
Authorization card additionally honours the `writeOnly` (calendar)
and `fullAccess` (reminders) status branches. Android is functional
for the Calendar tab via `expo-calendar`'s Android implementation;
the Reminders tab renders an honest "limited / unavailable on
Android" notice. Web is a stub: an `IOSOnlyBanner` over a disabled
two-tab shell. `screen.web.tsx` MUST NOT eagerly import
`expo-calendar` at module-evaluation time (carryover from
030–036 SC-007 discipline).
**Project Type**: Mobile app (Expo) consuming a maintained Expo
library plus a thin Expo prebuild config plugin. Strictly additive:
no new extension target, no App Group changes, no edits to features
002–036 outside the single-line registry append + single-entry
`app.json` plugin append + single-line `package.json` dependency
addition.
**Performance Goals**: Screen mount → first meaningful paint
< 250 ms; authorisation request resolves < 1 s on a cold prompt;
`getCalendarsAsync()` returns < 200 ms for a typical device
(≤ 20 calendars); `getEventsAsync()` over a 30-day range returns
< 500 ms for a typical calendar (≤ 200 events). The two-tab layout
MUST scroll at 60 fps with up to 100 `EventRow` / `ReminderRow`
instances rendered.
**Constraints**: Purely additive at integration level — 1 import + 1
array entry in `src/modules/registry.ts`; +1 entry in `app.json`
`plugins`; +1 runtime JS dependency (`expo-calendar`); no edits to
prior plugin / screen / native sources; **no `eslint-disable`
directives anywhere** in added or modified code (FR-023, FR-025,
SC-010); `StyleSheet.create()` only (Constitution IV);
`.android.tsx` / `.web.tsx` splits for non-trivial platform
branches (Constitution III); `expo-calendar` is mocked at the
import boundary in tests (FR-022); `pnpm format` is mandatory
before the final commit (FR-028); no recurrence rules, no
attendees, no calendar/list creation (spec §"Out of Scope").
**Scale/Scope**: One module directory (`src/modules/eventkit-lab/`),
one new plugin (`plugins/with-eventkit/`), zero new bridge files
(consumes `expo-calendar` directly), zero new native sources, two
hooks (`useCalendarEvents.ts`, `useReminders.ts`), two pure helper
modules (`date-ranges.ts`, `alarm-offsets.ts`), eleven UI components
(across both tabs + shared), three screen variants. No bundled
assets. One new top-level dependency.
**Test baseline at branch start**: carried forward from feature
036's completion totals (recorded in 036's `plan.md` /
`retrospective.md`). 037's expected delta: **≥ +18 suites** (see
"Test baseline tracking" below).

## Constitution Check

*Constitution version checked*: **1.1.0**
(`.specify/memory/constitution.md`).

| Principle | Compliance |
|-----------|------------|
| I. Cross-Platform Parity | **PASS** — iOS ships the full module (Calendar tab: auth, calendars, events query, event composer, edit/delete; Reminders tab: auth, lists, reminders query, reminder composer, edit/delete). Android ships the same shell with the Calendar tab fully functional via `expo-calendar`'s Android implementation; the Reminders tab renders an honest "limited / unavailable on Android" notice (story P3, FR-012). Web ships the same two-tab shell with all controls disabled and an `IOSOnlyBanner` at the top (story P3, FR-012). The educational UI shape is itself part of the lesson and is preserved cross-platform. The asymmetry on Reminders/Web is dictated by the underlying library and platform reality and is documented in spec §"Out of Scope" + Story 4 + Assumptions. |
| II. Token-Based Theming | **PASS** — All chrome uses `ThemedView` / `ThemedText` and the `Spacing` scale from `src/constants/theme.ts`. Reuses existing semantic colour tokens (`textPrimary` / `surfaceElevated` / `accent` / `warning` / `error`); the segmented status pill, banner, list-row, and tab-bar shapes match the conventions established by 015 / 029 / 032 / 033 / 034 / 035 / 036. No new theme entries; no hardcoded hex values. The all-day badge and priority badge reuse the existing badge token set. |
| III. Platform File Splitting | **PASS** — `screen.tsx` / `screen.android.tsx` / `screen.web.tsx`. The module does NOT introduce a project-owned bridge file family (it consumes `expo-calendar` directly), so platform splitting happens entirely at the screen layer plus a small number of `Platform.OS` short-circuits inside the two hooks (web → return non-supported state without invoking `expo-calendar`). `Platform.select` is permitted only for trivial style / copy diffs (e.g., the Reminders tab's Android notice text vs. the iOS subtitle). Web's `screen.web.tsx` MUST NOT eagerly import `expo-calendar` (carryover discipline; verified by a static-analysis test in `screen.web.test.tsx`). |
| IV. StyleSheet Discipline | **PASS** — All styles via `StyleSheet.create()`; `Spacing` from theme tokens; no inline objects, no CSS-in-JS, no utility-class frameworks. The composer forms use the existing `FormField` / `SegmentedControl` / `Picker` style patterns. |
| V. Test-First for New Features | **PASS** — JS-pure tests are enumerated in the "Phased file inventory" section below and cover: every component (eleven components: `AuthorizationCard`, `CalendarsList`, `EventsQueryCard`, `EventRow`, `EventComposer`, `RemindersList`, `ReminderRow`, `ReminderComposer`, `RemindersQueryCard`, `IOSOnlyBanner`, `AndroidRemindersNotice`), the two hooks (`useCalendarEvents`, `useReminders`) including auth flow, refresh paths, query filter/range toggling, full CRUD success and error paths, and unmount cleanup, the two pure helpers (`date-ranges`, `alarm-offsets`) with exhaustive cases including DST boundaries, the `with-eventkit` plugin (idempotency + coexistence with all 23 prior plugins via the existing 002–036 fixture composition pattern), all three screen variants, and the manifest contract. Tests are written RED-first per the spec's FR-021 enumeration; implementation follows. |
| Validate-Before-Spec (workflow) | **PASS / N/A** — Not a build-pipeline feature in the sense of 004 (where a real build had to be attempted before the spec was written). The plugin's behaviour is verified by JS-pure tests against `@expo/config-plugins`'s `withInfoPlist` mod. A full `expo prebuild` smoke-test is recorded in `quickstart.md` §3 as the on-device gate. The library-consumer framing (no native authoring, `expo-calendar` is the chosen abstraction repeated for prominence in spec §"Assumptions") is the deliberate scope choice; no proof-of-concept build was required because every spec-level assumption is verifiable via JS-pure tests against the library's documented surface. |

**Initial Constitution Check: PASS — no violations, no entries needed
in Complexity Tracking.**

**Re-check after Phase 1 (post-design): PASS** — the Phase 1 artifacts
(data-model, contracts, quickstart) introduce zero new global stores
(no AsyncStorage key, no `UserDefaults` write, no state outside the
screen lifetime), zero new theme tokens, zero new project-owned native
modules, and no inline `Platform.select` beyond trivial style branches.
The hooks are the only public surface consumed by components
(invariant H1 in `contracts/hooks.md`); components MUST NOT import
`expo-calendar` directly. The `with-eventkit` plugin scopes its mods
to the four documented Info.plist keys and asserts no foreign-key
writes (invariant P7 in `contracts/with-eventkit-plugin.md`).

## Project Structure

### Documentation (this feature)

```text
specs/037-eventkit/
├── plan.md                        # this file
├── research.md                    # Phase 0 output (R-A through R-F)
├── data-model.md                  # Phase 1 output (entities 1–8)
├── quickstart.md                  # Phase 1 output
├── contracts/
│   ├── eventkit-lab-manifest.md       # Registry entry contract
│   │                                  #   (id 'eventkit-lab', label,
│   │                                  #    platforms, minIOS '4.0')
│   ├── hooks.md                       # useCalendarEvents +
│   │                                  #   useReminders return shapes,
│   │                                  #   actions, lifecycle, error
│   │                                  #   classification
│   ├── helpers.md                     # date-ranges + alarm-offsets
│   │                                  #   pure-function contracts
│   └── with-eventkit-plugin.md        # with-eventkit modifier shape +
│                                      #   four Info.plist keys +
│                                      #   idempotency invariants
└── tasks.md                       # Phase 2 output (NOT created here)
```

### Source Code (repository root)

```text
# NEW (this feature) — TypeScript module
src/modules/eventkit-lab/
├── index.tsx                              # ModuleManifest (id 'eventkit-lab',
│                                          #   minIOS '4.0', platforms ['ios','android','web'])
├── screen.tsx                             # iOS variant. Renders the two-tab
│                                          #   shell (Calendar / Reminders) with
│                                          #   tab-state preservation per FR-004.
│                                          #   Calendar tab: Authorization →
│                                          #   Calendars → EventsQueryCard →
│                                          #   EventComposer (+ per-row Edit/Delete).
│                                          #   Reminders tab: Authorization → Lists →
│                                          #   RemindersQueryCard → ReminderComposer.
├── screen.android.tsx                     # Android: same two-tab shell. Calendar
│                                          #   tab fully functional. Reminders tab
│                                          #   shows AndroidRemindersNotice and
│                                          #   disables CRUD controls.
├── screen.web.tsx                         # Web: IOSOnlyBanner over the two-tab
│                                          #   shell with all controls disabled.
│                                          #   MUST NOT eagerly import expo-calendar.
├── date-ranges.ts                         # Exports DateRangePreset union
│                                          #   ('today' | 'next7' | 'next30') and
│                                          #   pure computeRange(preset, now)
│                                          #   returning { startDate, endDate }.
│                                          #   DST-stable; local time zone.
├── alarm-offsets.ts                       # Exports AlarmOffsetPreset union
│                                          #   ('none' | '5min' | '15min' | '1hour'),
│                                          #   labels map, and pure
│                                          #   toAlarmsArray(preset) returning
│                                          #   undefined or [{ relativeOffset: -N }].
├── types.ts                               # Module-internal surface types:
│                                          #   AuthorizationStatus,
│                                          #   ReminderAuthorizationStatus,
│                                          #   CalendarSummary, EventSummary,
│                                          #   ReminderSummary, EventDraft,
│                                          #   ReminderDraft. Re-exported from
│                                          #   the data-model document.
├── hooks/
│   ├── useCalendarEvents.ts               # { status, requestAccess, calendars,
│   │                                      #   refreshCalendars, events, range,
│   │                                      #   setRange, refreshEvents,
│   │                                      #   createEvent, updateEvent, deleteEvent,
│   │                                      #   inFlight, lastError }; mutations
│   │                                      #   serialised through a closure-scoped
│   │                                      #   promise chain (R-A); cancels
│   │                                      #   in-flight on unmount; never
│   │                                      #   setState after unmount; classifies
│   │                                      #   bridge errors per R-D.
│   └── useReminders.ts                    # Mirror shape for reminders:
│                                          #   { status, requestAccess, lists,
│                                          #   refreshLists, reminders, filter,
│                                          #   setFilter, refreshReminders,
│                                          #   createReminder, updateReminder,
│                                          #   deleteReminder, inFlight,
│                                          #   lastError }; same lifecycle
│                                          #   guarantees.
└── components/
    ├── AuthorizationCard.tsx              # Parameterised by entity type
    │                                      #   ('calendar' | 'reminder'). Surfaces
    │                                      #   the precise status string and gates
    │                                      #   "Request Access" vs "Open Settings"
    │                                      #   per FR-006. Honors writeOnly /
    │                                      #   fullAccess on iOS 17+.
    ├── CalendarsList.tsx                  # Calls useCalendarEvents().calendars;
    │                                      #   renders title/type/color rows;
    │                                      #   Refresh re-invokes; empty-state row.
    ├── EventsQueryCard.tsx                # 3-segment date-range picker
    │                                      #   (Today / Next 7 / Next 30); on
    │                                      #   selection invokes
    │                                      #   setRange + refreshEvents; renders
    │                                      #   EventRow per result; empty state.
    ├── EventRow.tsx                       # Renders title/location/start-end/
    │                                      #   all-day badge. Tap → open composer
    │                                      #   in edit mode. Long-press → destructive
    │                                      #   confirm prompt → deleteEvent.
    ├── EventComposer.tsx                  # Form: title (required), location,
    │                                      #   startDate, endDate, allDay, calendarId
    │                                      #   (picker over writable calendars),
    │                                      #   alarmOffset (preset). Save disabled
    │                                      #   when title empty OR calendar is
    │                                      #   read-only. allDay normalises start
    │                                      #   to 00:00:00 / end to 23:59:59.
    │                                      #   Create vs update mode determined by
    │                                      #   the optional eventId prop.
    ├── RemindersQueryCard.tsx             # Completed / Incomplete / All toggle;
    │                                      #   on selection invokes setFilter +
    │                                      #   refreshReminders; renders ReminderRow
    │                                      #   per result; empty state.
    ├── RemindersList.tsx                  # Calls useReminders().lists; renders
    │                                      #   title/color rows; Refresh
    │                                      #   re-invokes; empty-state row.
    ├── ReminderRow.tsx                    # Renders title/dueDate?/priority badge.
    │                                      #   Tap → open composer in edit mode.
    │                                      #   Long-press → destructive confirm
    │                                      #   prompt → deleteReminder.
    ├── ReminderComposer.tsx               # Form: title (required), dueDate
    │                                      #   (optional), listId (picker),
    │                                      #   priority (none/low/medium/high).
    │                                      #   Save disabled when title empty.
    │                                      #   Create vs update mode by reminderId
    │                                      #   prop.
    ├── IOSOnlyBanner.tsx                  # Web banner; reused conventional
    │                                      #   "controls below are disabled"
    │                                      #   wording.
    └── AndroidRemindersNotice.tsx         # Reminders-tab-only notice on Android
                                            #   ("Reminders are limited or
                                            #   unavailable on Android"); inline,
                                            #   non-blocking.

# NEW (this feature) — Expo config plugin
plugins/with-eventkit/
├── index.ts                                # ConfigPlugin: withInfoPlist mod that
│                                            #   adds the four usage-description
│                                            #   keys with sensible defaults ONLY
│                                            #   when absent (preserves any value
│                                            #   set by the operator). Idempotent:
│                                            #   running the plugin twice on the
│                                            #   same Expo config produces a
│                                            #   deep-equal config. Documents
│                                            #   default strings + how to replace
│                                            #   them in a JSDoc block.
├── index.test.ts                            # Co-located smoke test importing
│                                            #   index.ts to verify the export
│                                            #   shape; thorough behavioural tests
│                                            #   live in
│                                            #   test/unit/plugins/with-eventkit/.
└── package.json                             # Same shape as plugins/with-passkit/
                                              #   package.json: name, version,
                                              #   main 'index.ts', private. NO
                                              #   dependencies (config plugins
                                              #   resolve @expo/config-plugins from
                                              #   the host package).

# MODIFIED (additive only)
src/modules/registry.ts                    # +1 import line, +1 array entry
                                            #   (eventkitLab, after passkitLab)
app.json                                   # +1 string entry in expo.plugins:
                                            #   "./plugins/with-eventkit"
package.json                               # +1 runtime dependency: expo-calendar
                                            #   (installed via
                                            #   `npx expo install expo-calendar`
                                            #   so the version pin matches SDK 55)

# NOT MODIFIED — verified non-regression in tests
plugins/with-{live-activity,app-intents,home-widgets,screentime,coreml,vision,
              speech-recognition,audio-recording,sign-in-with-apple,local-auth,
              keychain-services,mapkit,core-location,rich-notifications,
              lock-widgets,standby-widget,focus-filters,background-tasks,
              spotlight,documents,arkit,bluetooth,passkit}/**
                                            # All 23 prior plugins byte-identical.
src/modules/{intents-lab,widgets-lab,lock-widgets-lab,standby-lab,
              focus-filters-lab,background-tasks-lab,spotlight-lab,
              documents-lab,share-sheet-lab,arkit-lab,bluetooth-lab,
              passkit-lab,...}/**
                                            # All prior modules byte-identical.
src/native/**                              # All prior bridges byte-identical.
                                            # 037 does NOT add a project-owned
                                            # bridge file (it consumes
                                            # expo-calendar directly).

# Tests (NEW)
test/unit/modules/eventkit-lab/
├── manifest.test.ts                        # id 'eventkit-lab', label
│                                            #   'EventKit Lab', platforms
│                                            #   ['ios','android','web'],
│                                            #   minIOS '4.0'
├── date-ranges.test.ts                     # every preset produces correct
│                                            #   startDate/endDate; DST boundaries
│                                            #   (spring-forward + fall-back); pure
│                                            #   function purity (same input ⇒
│                                            #   same output across many runs)
├── alarm-offsets.test.ts                   # every preset has a unique key, label,
│                                            #   and correct toAlarmsArray output;
│                                            #   'none' returns undefined; non-none
│                                            #   returns
│                                            #   [{ relativeOffset: -<minutes> }]
├── screen.test.tsx                         # iOS flow: tabs render in order;
│                                            #   tab switching preserves transient
│                                            #   state (selected range, form
│                                            #   fields); IOSOnlyBanner hidden on
│                                            #   iOS
├── screen.android.test.tsx                 # Calendar tab functional; Reminders
│                                            #   tab disabled with
│                                            #   AndroidRemindersNotice; bridge
│                                            #   methods invoked only for the
│                                            #   Calendar surface
├── screen.web.test.tsx                     # IOSOnlyBanner present; all controls
│                                            #   disabled; assert expo-calendar is
│                                            #   NOT in the web bundle's import
│                                            #   closure (static-analysis check on
│                                            #   the resolved module graph)
├── hooks/
│   ├── useCalendarEvents.test.tsx          # auth-request flow
│   │                                        #   (notDetermined → authorized);
│   │                                        #   denied path with Open Settings
│   │                                        #   affordance; writeOnly path
│   │                                        #   disables enumeration; refreshCalendars;
│   │                                        #   refreshEvents per range;
│   │                                        #   create/update/delete success and
│   │                                        #   error paths; unmount cleanup
│   │                                        #   (zero post-unmount setState);
│   │                                        #   error classification (R-D)
│   └── useReminders.test.tsx               # auth flow including fullAccess
│                                            #   mapping; refreshLists; query
│                                            #   filter toggling
│                                            #   (completed/incomplete/all);
│                                            #   create/update/delete success and
│                                            #   error paths; unmount cleanup
└── components/
    ├── AuthorizationCard.test.tsx          # both entity types; all five status
    │                                        #   branches plus writeOnly /
    │                                        #   fullAccess; Request Access vs
    │                                        #   Open Settings affordance gating;
    │                                        #   Linking.openSettings() called on
    │                                        #   tap
    ├── CalendarsList.test.tsx              # empty state; populated rows with
    │                                        #   title/type/color; Refresh invokes
    │                                        #   hook once
    ├── EventsQueryCard.test.tsx            # segment selection invokes range
    │                                        #   change; renders rows; empty state
    ├── EventRow.test.tsx                   # renders title/location/times;
    │                                        #   all-day badge gating;
    │                                        #   tap → edit composer;
    │                                        #   long-press → destructive prompt
    ├── EventComposer.test.tsx              # required-field gating; allDay
    │                                        #   normalisation (start = 00:00:00,
    │                                        #   end = 23:59:59); alarm-offset
    │                                        #   wiring (none ⇒ no alarms field);
    │                                        #   read-only calendar disables Save;
    │                                        #   create vs update mode
    ├── RemindersQueryCard.test.tsx         # toggle invokes filter change;
    │                                        #   renders rows; empty state
    ├── RemindersList.test.tsx              # empty state; populated rows;
    │                                        #   Refresh once
    ├── ReminderRow.test.tsx                # renders title/due/priority; no due
    │                                        #   date renders without due badge;
    │                                        #   long-press destructive prompt
    ├── ReminderComposer.test.tsx           # required-field gating; no-due-date
    │                                        #   is allowed; create vs update
    ├── IOSOnlyBanner.test.tsx              # renders unsupported message;
    │                                        #   accessibilityRole="alert"
    └── AndroidRemindersNotice.test.tsx     # renders limitation copy; inline,
                                              #   non-blocking; no bridge call
                                              #   reachable from this surface

test/unit/plugins/with-eventkit/
└── index.test.ts                           # withInfoPlist adds the four
                                              #   usage-description keys with
                                              #   default copy when absent;
                                              #   preserves operator-supplied
                                              #   values; idempotent (deep-equal
                                              #   after two runs — SC-008);
                                              #   coexists with all 23 prior
                                              #   plugins (composed via the
                                              #   existing 002–036 fixture pattern;
                                              #   asserts each prior plugin's
                                              #   Info.plist / entitlements /
                                              #   project contributions are
                                              #   byte-identical post-composition
                                              #   — SC-009)
```

**Structure Decision**: Mirrors **036's** `Expo + iOS-main-app-target`
shape, with **two structural differences** versus 036:

1. **Zero new native sources, zero new project-owned bridge files** —
   036 authored one new Swift file (`PassKitBridge.swift`) plus a
   four-file bridge family (`src/native/passkit{,.android,.web,.types}.ts`).
   037 consumes the maintained `expo-calendar` library directly: there
   is no `src/native/eventkit*.ts` file family, no Swift / Kotlin
   sources, and no podspec changes. The mock seam is the upstream
   library module name (`expo-calendar`) rather than a project-owned
   wrapper. This is consistent with the spec's "use the maintained
   Expo library where one exists" philosophy (Assumptions §1).
2. **Two hooks, not one** — 036 had a single `usePassKit`. 037 has two
   parallel hooks (`useCalendarEvents`, `useReminders`) because EventKit
   exposes two independent permission entities; conflating them into
   one hook would force one of the entities into a second-class state
   machine and break the spec's requirement that the two Authorization
   cards be independent (FR-006, Story P1, Story P2). Each hook owns
   its own status, in-flight marker, and error classification.

Other carryovers from 036 are preserved:

- Closure-scoped promise chain `enqueue()` for mutating async calls
  (R-A inherited verbatim, applied independently in each hook).
- Hook-as-only-public-surface invariant for components (H1 in
  `contracts/hooks.md`).
- Plugin idempotency proof via JS-pure tests against
  `@expo/config-plugins` mods.
- `pnpm format` mandatory before final commit (FR-028).
- Zero `eslint-disable` directives (FR-023, SC-010).
- Module-name distinctness — 037 owns no native module name (it does
  not author one); the registry id `'eventkit-lab'` is unique.

## Resolved decisions

The spec was approved without clarifications. The following are the
plan-level technical decisions made autonomously, recorded in
`research.md` with full Decision / Rationale / Alternatives:

| # | Decision | Spec ref / location |
|---|----------|---------------------|
| R-A | **Hook-level mutation serialisation** via closure-scoped promise chain (inherited verbatim from 030–036). Two back-to-back mutating calls (e.g., two rapid Save taps in `EventComposer`) produce two `expo-calendar` invocations in submission order; the second is enqueued behind the first regardless of outcome. Read-only methods (`getCalendarsAsync`, `getEventsAsync`, `getRemindersAsync`) are NOT serialised. Applied independently in `useCalendarEvents` and `useReminders`. | research §1 |
| R-B | **Library choice**: consume `expo-calendar` directly (added via `npx expo install expo-calendar`) rather than authoring a custom Swift bridge over EventKit. Rationale: `expo-calendar` is maintained by the Expo team, ships iOS + Android implementations, exposes the precise surface this feature needs (calendars, events CRUD, reminders CRUD, predicate-based queries, alarm shapes), and matches the showcase's overall philosophy (spec §"Assumptions" §1). Trade-off: a small fidelity loss versus full EventKit, accepted explicitly. | research §2 |
| R-C | **Authorization card state machine** is parameterised by entity type (`'calendar' | 'reminder'`). Both entities map their `expo-calendar` permission status to the same state machine: `notDetermined | denied | restricted | authorized | writeOnly` (calendar) / `notDetermined | denied | restricted | authorized | fullAccess` (reminder iOS 17+). The card UI renders identically except for the entity name and the description copy. The two cards are rendered by independent hook instances and never share state. | research §3 / spec FR-006 |
| R-D | **Error classification** in each hook follows the same table as 030–036. Every mutating action is `try`/`catch`-wrapped; the classifier exported as `classifyEventKitError(e: unknown)`: known `expo-calendar` rejection shapes map to `'denied'` / `'restricted'` / `'write-only'` / `'not-found'` / `'invalid-input'`; everything else → `'failed'` with the error's `message` truncated to 120 chars. The classifier is tested with synthetic errors of each shape. | research §4 |
| R-E | **DST-stable date-range computation** in `date-ranges.ts`. Presets are computed in the device's local time zone using `Date` operations that step by calendar days, not by adding `24 * 60 * 60 * 1000` milliseconds. Spring-forward and fall-back boundaries are exhaustively unit-tested with fixture `now()` values pinned to 2025-03-09 (US DST start) and 2025-11-02 (US DST end). | research §5 / spec FR-015 |
| R-F | **Plugin: four Info.plist keys, one mod**. The `with-eventkit` plugin uses a single `withInfoPlist` mod that sets each of the four keys ONLY when absent (preserving operator-supplied values). The default copy is documented in the source and points at the educational purpose of the showcase ("This module demonstrates EventKit calendar / reminders access for educational purposes"). The plugin does not touch entitlements, frameworks, or any non-Info.plist surface. | research §6 / spec FR-017–FR-020 |

## Phased file inventory

The seed task list below is rendered in `/speckit.tasks` into the
final `tasks.md`; it is reproduced here so the plan-time TDD ordering
is auditable:

1. **T001 — Pure helpers (RED-first)**: write
   `test/unit/modules/eventkit-lab/date-ranges.test.ts` and
   `alarm-offsets.test.ts` covering every preset, DST boundaries,
   and `toAlarmsArray('none') === undefined`. Then implement
   `date-ranges.ts` and `alarm-offsets.ts` in
   `src/modules/eventkit-lab/`.
2. **T002 — `with-eventkit` plugin (RED-first)**:
   `plugins/with-eventkit/index.ts` + `package.json` + co-located
   smoke test. JS-pure tests in
   `test/unit/plugins/with-eventkit/index.test.ts` exercise: the
   four Info.plist keys are added when absent; operator-supplied
   values are preserved; idempotency (SC-008); coexistence with all
   23 prior plugins (composed via the existing 002–036 fixture
   pattern; asserts each prior plugin's contribution is
   byte-identical after composition — SC-009).
3. **T003 — Hooks (RED-first)**: write
   `hooks/useCalendarEvents.test.tsx` and `hooks/useReminders.test.tsx`
   covering the auth-request flow, denied / writeOnly / fullAccess
   branches, refresh paths, query toggling, full CRUD success / error
   paths, error classification (R-D), and unmount cleanup. Then
   implement the two hooks with the closure-scoped serialisation
   chain (R-A) and the platform-OS short-circuit (web → return a
   non-supported state without invoking `expo-calendar`).
4. **T004 — Components, top-down RED**: write component tests first
   for the eleven components in the inventory; then implement against
   them. `AuthorizationCard` MUST handle all five+two status branches
   (R-C). `EventComposer` MUST normalise `allDay` start/end times
   per FR-009 + spec §"Edge Cases".
5. **T005 — Manifest**:
   `src/modules/eventkit-lab/index.tsx` + `manifest.test.ts`
   (asserts id `'eventkit-lab'`, label `'EventKit Lab'`, platforms
   `['ios','android','web']`, `minIOS: '4.0'`).
6. **T006 — Screens**: implement `screen.tsx`,
   `screen.android.tsx`, `screen.web.tsx` with the two-tab layout
   per FR-004 / FR-005 / FR-011 / FR-012. Tests assert tab order,
   tab-state preservation, the `AndroidRemindersNotice` on Android
   Reminders, the `IOSOnlyBanner` on web, and that `screen.web.tsx`
   does NOT pull `expo-calendar` into the web bundle.
7. **T007 — Registry hook-up**: append `eventkitLab` import +
   array entry to `src/modules/registry.ts`. Update the registry
   test if it asserts a fixed length.
8. **T008 — `app.json` plugin entry**: append
   `"./plugins/with-eventkit"` to the `expo.plugins` array.
9. **T009 — Dependency install**: run
   `npx expo install expo-calendar` to add the SDK-55-pinned
   `expo-calendar` dependency to `package.json` + lockfile.
10. **T010 — Agent context update**: substitute
    `specs/037-eventkit/plan.md` between the
    `<!-- SPECKIT START -->` and `<!-- SPECKIT END -->`
    markers in `.github/copilot-instructions.md`.
11. **T011 — `pnpm check` gate**: format + lint + typecheck + tests
    must be green; no `eslint-disable` directives anywhere;
    `pnpm format` is a no-op after the final commit. Report delta
    from 036's closing baseline.
12. **T012 — On-device verification**: execute `quickstart.md`
    checklist on a real iOS 4+ device (with and without iOS 17+
    write-only / full-access modes) and on an Android device.
    Verify `expo prebuild` produces an Info.plist with the four
    new keys present exactly once and unchanged on a second run.

## Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|------------|--------|------------|
| R1 | **`expo-calendar` API drift** — the library introduces a breaking change between SDK 54 and SDK 55 to the rejection shape of `requestCalendarPermissionsAsync()` (e.g., the `'writeOnly'` enum value renamed). | Low | Medium | The hooks consume only the documented enum names from the SDK 55 entry in `expo-calendar`'s docs; the auth-request tests pin the expected values verbatim. A failing test would surface the drift before the feature ships. |
| R2 | **iOS 17+ status branch handled only on the JS side** — `expo-calendar` may not surface the `writeOnly` / `fullAccess` branches as distinct enum values on older library versions. | Medium | Medium | The hook normalises the library's raw status into the spec's documented union (`AuthorizationStatus` / `ReminderAuthorizationStatus`). If the library returns `'authorized'` for write-only on a downlevel version, the hook falls back to `'authorized'` and the UI still renders correctly (worse fidelity, not broken). Tests cover both shapes. |
| R3 | **Plugin coexistence regression** — the `withInfoPlist` mod inadvertently overwrites or reorders Info.plist entries declared by prior plugins (e.g., 020 audio-recording, 021 sign-in-with-apple, 023 mapkit). | Medium | High | The plugin reads → merges → writes the Info.plist dict and asserts it sets only the four documented keys. The composition test (T002) enables all 23 prior plugins + 037 in a fixture and asserts each prior plugin's contributions are byte-identical after composition (SC-009). |
| R4 | **DST-boundary drift in `date-ranges.ts`** — naive `Date` arithmetic crosses spring-forward / fall-back boundaries and produces 23-hour or 25-hour spans, surfacing as off-by-one events on the day of DST. | Medium | Medium | R-E: presets step by calendar days using `setDate(d.getDate() + N)`, never by adding `24 * 60 * 60 * 1000` ms. Tests pin `now()` to known DST-boundary dates and assert exact `startDate` / `endDate` timestamps. |
| R5 | **All-day event normalisation drift** — `expo-calendar` may interpret `endDate` differently (exclusive vs inclusive of the end-of-day) on iOS vs Android. | Low | Low | The composer normalises start to 00:00:00 and end to 23:59:59 of the start/end dates per spec §"Edge Cases"; if the library treats end as exclusive, the all-day badge still renders correctly because `allDay: true` is the canonical flag. Tests pin both fields. |
| R6 | **Read-only calendar selected as event target** — the user picks a calendar whose `allowsModifications` is false and the Save button silently fails. | Low | Medium | FR-009 + R-C: the composer disables Save when `allowsModifications === false` and renders an inline notice. Test covers the disabled-Save state explicitly. |
| R7 | **Hook state-update-after-unmount** — `createEvent` resolves after the user navigates away; the hook attempts a `setState`. | Medium | Low | FR-013 / FR-014: each hook owns a `mounted` ref; resolution paths check it before dispatching. Test asserts zero post-unmount setState calls (carryover from 030–036). |
| R8 | **Concurrent CRUD races** — the user taps Save twice in rapid succession; the second tap fires before the first resolves. | Low | Low | Spec §"Edge Cases": the hook's `inFlight` flag short-circuits the second submission; R-A's promise chain additionally orders the underlying library calls. Test covers the in-flight short-circuit. |
| R9 | **Android Reminders surface unexpectedly returns data** — `expo-calendar` on Android may expose a partial reminders surface; the Reminders tab's "unsupported" notice would then be misleading. | Low | Low | FR-012: the Reminders tab on Android renders the `AndroidRemindersNotice` AND disables CRUD controls. If the library returns data, the user sees it in read-only form (no harm); the notice remains accurate ("limited / unavailable"). |
| R10 | **Web bundle pulls in `expo-calendar`** — a careless import in a shared file (e.g., a hook re-exported from `screen.web.tsx`) drags the library into the web bundle, breaking the no-bridge-call invariant. | Low | Medium | `screen.web.test.tsx` performs a static-analysis check on the resolved module graph asserting `expo-calendar` is not present. Carryover discipline from 030–036 SC-007. |
| R11 | **Plugin Info.plist key collision with future iOS additions** — Apple introduces a new EventKit key in iOS 19 (e.g., a more granular reminders write-only key). | Very Low | Low | The plugin sets only the four documented keys; new keys would require a future feature delta (e.g., 0xx-eventkit-update). The placeholder strings are clearly demarcated as defaults in the source. |
| R12 | **Accessibility regression** — disabled-control state on Android Reminders / Web is not announced by screen readers. | Low | Low | All disabled controls carry `accessibilityState={{ disabled: true }}`; `IOSOnlyBanner` and `AndroidRemindersNotice` carry `accessibilityRole="alert"`. Component tests assert these props. |

## Test baseline tracking

- **Branch start**: carried forward from feature 036's completion
  totals (recorded in 036's `plan.md` / `retrospective.md`).
- **Expected delta** (sketch, finalised in `tasks.md`):
  - +1 `manifest.test.ts` suite
  - +1 `date-ranges.test.ts` suite
  - +1 `alarm-offsets.test.ts` suite
  - +3 `screen.{ios,android,web}.test.tsx` suites
  - +1 `useCalendarEvents.test.tsx` suite
  - +1 `useReminders.test.tsx` suite
  - +11 component test suites (`AuthorizationCard`, `CalendarsList`,
    `EventsQueryCard`, `EventRow`, `EventComposer`,
    `RemindersQueryCard`, `RemindersList`, `ReminderRow`,
    `ReminderComposer`, `IOSOnlyBanner`, `AndroidRemindersNotice`)
  - +1 `with-eventkit/index.test.ts` (plugin) suite
  - +1 (optional) export-shape smoke test co-located with the
    plugin
  - **Total target**: **≥ +20 suites at completion** (counting both
    the co-located plugin smoke test and a registry-length assertion
    update as their own suites; the spec-stipulated minimum is the
    18 enumerated in FR-021).
- Final deltas reported in
  `specs/037-eventkit/retrospective.md`.

## Progress Tracking

- [x] Spec authored and approved (`specs/037-eventkit/spec.md`, 2026-04-29)
- [x] Plan authored — this file (Phase 0 + Phase 1 outline complete)
- [x] Phase 0 — `research.md` written (resolves R-A through R-F)
- [x] Phase 1 — `data-model.md`, `contracts/*.md`, `quickstart.md` written
- [x] Agent context update (SPECKIT marker repointed to this plan)
- [ ] `/speckit.tasks` run; `tasks.md` written from the T001–T012 seeds above
- [ ] T001–T010 implemented; `pnpm check` green; baseline delta substituted into "Test baseline tracking"
- [ ] T011 (`pnpm check` gate) signed off
- [ ] T012 (on-device quickstart) signed off on a real iOS 4+ device (including iOS 17+ write-only / full-access modes), an Android device, and a desktop browser for the iOS-only banner path
- [ ] `retrospective.md` written; final test totals substituted; merged to main

## Complexity Tracking

> No constitution violations. Section intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| _(none)_  | _(n/a)_    | _(n/a)_                              |
