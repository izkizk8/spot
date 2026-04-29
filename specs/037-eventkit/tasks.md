---
description: "Task list for feature 037 — EventKit (Calendar + Reminders) Module"
---

# Tasks: EventKit (Calendar + Reminders) Module (037)

**Input**: Design documents from `/specs/037-eventkit/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md
**Branch parent**: `036-passkit-wallet`

**Tests**: REQUIRED. Per plan §"Test-First for New Features" and Constitution V
(v1.1.0), every JS-pure surface ships with tests authored before
implementation (TDD-first, RED → GREEN → REFACTOR). 037 authors **zero**
new project-owned native sources — `expo-calendar` ships its own native
bridge — so the entire feature is JS-pure and Windows-runnable. On-device
verification (iOS 4+, iOS 17+ write-only / full-access modes, Android,
web) belongs to `quickstart.md`.

**Organization**: Tasks are grouped by **technical layer** in dependency
order (scaffold → plugin `package.json` → pure helpers (RED then GREEN)
→ module-internal types → hooks (RED then GREEN, two parallel hooks) →
components (RED then GREEN, eleven components) → screens (RED then
GREEN, three platform variants) → manifest (RED then GREEN) → registry
append → config plugin (RED then GREEN) → `app.json` plugin entry →
runtime dependency install → final verification). Each pair follows a
strict RED → GREEN cadence: test files are added first, then the
matching implementation. User-story labels are attached to every
story-bound task for traceability:

- **[US1]** = User Story 1 — P1 — inspect calendars and query events on
  iOS (read-only MVP: authorization card, calendars list, events query
  card with the three date-range presets).
- **[US2]** = User Story 2 — P1 — full event CRUD (event composer,
  edit-on-tap, long-press destructive delete, alarm-offset wiring,
  all-day normalisation, read-only-calendar Save gating, write-only
  iOS 17+ enumeration disablement).
- **[US3]** = User Story 3 — P2 — reminders authorization, lists,
  query, CRUD (independent permission entity, fullAccess mapping on
  iOS 17+, completed/incomplete/all filter).
- **[US4]** = User Story 4 — P3 — cross-platform graceful degradation
  (Android Calendar tab functional via `expo-calendar`'s Android impl,
  Reminders tab disabled with `AndroidRemindersNotice`; web shows
  `IOSOnlyBanner` over the disabled two-tab shell).

**Constitution & FR compliance** (encoded in every task):

- NO `eslint-disable` directives anywhere in added or modified code
  (FR-023, SC-010).
- `expo-calendar` interactions are mocked **at the import boundary**
  via `jest.mock('expo-calendar')` (FR-022). Hooks are the ONLY public
  surface consumed by components (invariant **H1**); components MUST
  NOT import `expo-calendar` directly.
- `with-eventkit` plugin is idempotent (P5/SC-008), preserves any
  operator-supplied Info.plist key value (P3), and coexists with all
  23 prior plugins 002–036 (P6/SC-009).
- `screen.web.tsx` MUST NOT import `expo-calendar` at module
  evaluation time (carryover from 030–036 SC-007 discipline).
- `StyleSheet.create()` only (Constitution IV); `ThemedView` /
  `ThemedText` + `Spacing` tokens (Constitution II); `.android.tsx` /
  `.web.tsx` splits at the screen boundary (Constitution III). The
  module does NOT introduce a project-owned bridge file family — it
  consumes `expo-calendar` directly (plan §"Structure Decision").
- Strictly additive: `src/modules/registry.ts` +1 (31 → 32 modules);
  `app.json` `expo.plugins` +1 (23 → 24 plugins); +1 runtime JS
  dependency (`expo-calendar`); zero edits to prior modules / plugins
  / native sources.
- `pnpm format` is mandatory before the final commit (FR-028).
- Two **independent** Authorization cards — calendar permission and
  reminder permission are distinct iOS entities (spec §"EventKit
  Permission Reality Check"); the two hooks (`useCalendarEvents`,
  `useReminders`) own independent state machines (R-C).

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on
  incomplete tasks).
- **[Story]**: `[US1]`, `[US2]`, `[US3]`, or `[US4]` — present only
  on story-bound tasks. Setup / foundational / hook / manifest /
  registry / plugin / `app.json` / dep-install / polish phases carry
  no story label.
- All paths are absolute from repository root.
- Contract IDs (`H1`–`H8` + `C1`–`C5` + `R1`–`R5` from
  `contracts/hooks.md`; `D1`–`D7` + `A1`–`A6` from
  `contracts/helpers.md`; `M1`–`M7` from
  `contracts/eventkit-lab-manifest.md`; `P1`–`P8` from
  `contracts/with-eventkit-plugin.md`) are cited inline so every
  assertion traces back to a contract invariant.

---

## Phase 1: Setup, scaffold & plugin package

**Purpose**: Create the directory skeleton and the `with-eventkit`
plugin's `package.json`. No tests in this phase (pure scaffolding;
exercised transitively by every later test). No new runtime JS deps
yet (the `expo-calendar` install is deferred to Phase 14 so the
RED tests in Phases 3 / 5 mock the library before it physically
resolves on disk).

- [ ] T001 Create directory scaffolding:
  `src/modules/eventkit-lab/{components,hooks}/`,
  `plugins/with-eventkit/`,
  `test/unit/modules/eventkit-lab/{components,hooks}/`,
  `test/unit/plugins/with-eventkit/`.
  - Acceptance: every directory above exists; no source files added yet.
- [ ] T002 [P] Create `plugins/with-eventkit/package.json` matching
  the shape used by `plugins/with-passkit/package.json` and
  `plugins/with-bluetooth/package.json`: `name: 'with-eventkit'`,
  `version: '1.0.0'`, `main: 'index.ts'`, `private: true`, NO
  `dependencies` array entry (config plugins resolve
  `@expo/config-plugins` from the host package). Satisfies **P8**.
  - Acceptance: file parses as valid JSON;
    `node -e "require('./plugins/with-eventkit/package.json')"`
    succeeds.

---

## Phase 2: Pure helpers — RED → GREEN

**Purpose**: The two pure helper modules (`date-ranges.ts`,
`alarm-offsets.ts`) are imported by hooks, the events-query card,
and the event composer; they MUST land first so every later test
can import their typed surface. JS-pure, deterministic,
exhaustively unit-tested.

### Helper tests (RED)

- [ ] T003 [P] [US1] Author
  `test/unit/modules/eventkit-lab/date-ranges.test.ts` per
  `contracts/helpers.md` §A invariants **D1**–**D7**:
  - **D1 (purity)**: `computeRange(p, t)` deep-equals
    `computeRange(p, t)` across many calls.
  - **D2 / D3 / D4**: `startDate <= endDate`;
    `startDate.getHours() === 0` /
    `startDate.getMinutes() === 0` /
    `startDate.getSeconds() === 0`;
    `endDate.getHours() === 23` /
    `endDate.getMinutes() === 59` /
    `endDate.getSeconds() === 59`.
  - **D5 (day count)**: `'today'` → 1 calendar day,
    `'next7'` → 7 calendar days, `'next30'` → 30 calendar days, all
    measured in the device's local time zone.
  - **D6 (DST stability)**: with `now` pinned to 2025-03-09T12:00:00
    (US spring-forward) and 2025-11-02T12:00:00 (US fall-back),
    `next7` and `next30` produce ranges whose calendar-day count
    matches D5 exactly (no 23-hour or 25-hour drift).
  - **D7**: implementation uses `setDate(d.getDate() + N)` for day
    arithmetic, never `+ N * 24 * 60 * 60 * 1000`.
  - Acceptance: test fails (RED) before T005 lands.
- [ ] T004 [P] [US2] Author
  `test/unit/modules/eventkit-lab/alarm-offsets.test.ts` per
  `contracts/helpers.md` §B invariants **A1**–**A6**:
  - **A1**: the four preset keys are unique and exactly equal to
    `['none', '5min', '15min', '1hour']`.
  - **A2**: every preset has a non-empty label.
  - **A3**: `toAlarmsArray('none') === undefined` (strict equality;
    NOT `[]`).
  - **A4**: `toAlarmsArray('5min')` deep-equals
    `[{ relativeOffset: -5 }]`.
  - **A5**: `toAlarmsArray('15min')` deep-equals
    `[{ relativeOffset: -15 }]`.
  - **A6**: `toAlarmsArray('1hour')` deep-equals
    `[{ relativeOffset: -60 }]`.
  - Acceptance: test fails (RED) before T006 lands.

### Helper implementations (GREEN)

- [ ] T005 [P] [US1] Implement
  `src/modules/eventkit-lab/date-ranges.ts`: exports
  `DateRangePreset` union (`'today' | 'next7' | 'next30'`) and pure
  `computeRange(preset, now)` returning
  `{ startDate: Date; endDate: Date }`. Uses
  `setDate(d.getDate() + N)` for day arithmetic; computes in the
  device's local time zone; no `Date.now()` or other ambient
  reads.
  - Acceptance: T003 passes (GREEN); zero side effects; no
    `eslint-disable`.
- [ ] T006 [P] [US2] Implement
  `src/modules/eventkit-lab/alarm-offsets.ts`: exports
  `AlarmOffsetPreset` union, an `ALARM_OFFSET_LABELS` frozen
  record, and pure `toAlarmsArray(preset)` returning either
  `undefined` (for `'none'`) or
  `[{ relativeOffset: -<minutes> }]` matching `expo-calendar`'s
  alarm shape.
  - Acceptance: T004 passes (GREEN); no `eslint-disable`.

---

## Phase 3: Module-internal types

**Purpose**: Establish the typed surface (`AuthorizationStatus`,
`ReminderAuthorizationStatus`, `CalendarSummary`, `EventSummary`,
`ReminderSummary`, `EventDraft`, `ReminderDraft`, `EventKitLabState`
slices) that every later test/impl imports. Re-exported from
`data-model.md` Entities 1–8. No tests of its own — exercised
transitively by every subsequent test.

- [ ] T007 Author `src/modules/eventkit-lab/types.ts` per
  `data-model.md`:
  - `AuthorizationStatus` =
    `'notDetermined' | 'denied' | 'restricted' | 'authorized' | 'writeOnly'`
    (calendar; iOS 17+ adds `'writeOnly'`).
  - `ReminderAuthorizationStatus` =
    `'notDetermined' | 'denied' | 'restricted' | 'authorized' | 'fullAccess'`
    (reminders; iOS 17+ adds `'fullAccess'`).
  - `CalendarSummary` =
    `{ id: string; title: string; type: string; color: string; allowsModifications: boolean }`.
  - `EventSummary` =
    `{ id: string; title: string; location?: string; startDate: Date; endDate: Date; allDay: boolean; calendarId: string; alarmOffset?: AlarmOffsetPreset }`.
  - `ReminderSummary` =
    `{ id: string; title: string; dueDate?: Date; listId: string; priority: 'none' | 'low' | 'medium' | 'high'; completed: boolean }`.
  - `EventDraft` and `ReminderDraft` (composer payload shapes —
    same fields as the Summary types minus `id`).
  - `RemindersFilter` = `'completed' | 'incomplete' | 'all'`.
  - `ClassifiedError` =
    `'denied' | 'restricted' | 'write-only' | 'not-found' | 'invalid-input' | 'failed'`
    (error-classifier output, R-D / **H6**).
  - Acceptance: `pnpm typecheck` passes; every later test/impl
    imports from this file.

---

## Phase 4: Hooks — RED (test files first)

**Purpose**: The two hooks (`useCalendarEvents`, `useReminders`)
are the **only public surface** consumed by components (**H1**).
RED tests pin every invariant from `contracts/hooks.md`
(**H1**–**H8**, **C1**–**C5**, **R1**–**R5**) before the impls
land. All `expo-calendar` interactions mocked at the import
boundary via `jest.mock('expo-calendar')` (FR-022).

- [ ] T008 [US1] [US2] Author
  `test/unit/modules/eventkit-lab/hooks/useCalendarEvents.test.tsx`
  per `contracts/hooks.md` invariants:
  - **H1**: hook is the only surface; the test never imports
    `expo-calendar` directly outside the mock factory.
  - **H2 (default state)**: on mount, `status === 'notDetermined'`;
    `calendars === []`; `events === []`; `range === 'today'`
    (**C2**); `inFlight === false`; `lastError === null`.
  - **H3 (mount call)**: on mount, the hook calls
    `getCalendarPermissionsAsync()` exactly once; the mock is
    invoked once after first render and not again on a passive
    re-render.
  - **H4 (unmount safety)**: `unmount()` during an in-flight
    `createEvent` produces ZERO post-unmount `setState` calls
    (asserted via the `mounted` ref guard); advancing 5 s of fake
    timers post-unmount triggers no further dispatches.
  - **H5 (mutating serialisation, R-A)**: two rapid
    `createEvent(...)` calls produce two
    `expo-calendar.createEventAsync` invocations in submission
    order, even when the first rejects.
  - **H6 (error classification, R-D)**: synthetic errors with
    shapes for `'denied'`, `'restricted'`, `'write-only'`,
    `'not-found'`, `'invalid-input'`, and a generic `Error` map
    1:1 to the documented `ClassifiedError` union; the message
    is truncated to 120 characters.
  - **H7 (web short-circuit)**: with `Platform.OS === 'web'` mock,
    every action resolves to a non-supported state without
    invoking `expo-calendar`.
  - **H8 (lastError mutual exclusion)**: setting `lastError` does
    NOT clear data fields (`calendars`, `events` are preserved);
    a subsequent successful action clears `lastError`.
  - **C1**: `status` reflects the iOS 17+ `'writeOnly'` branch
    when the mocked permission API returns it.
  - **C2 (range)**: `range` defaults to `'today'`;
    `setRange('next7')` triggers `getEventsAsync` with the range
    computed by `date-ranges.ts`.
  - **C3 (writeOnly gating)**: when `status === 'writeOnly'`,
    `refreshEvents` short-circuits and `events` stays `[]`;
    `createEvent` is still permitted; `updateEvent` and
    `deleteEvent` reject synchronously with a `'write-only'`
    classified error.
  - **C4 (translation)**: `createEvent` / `updateEvent` translate
    `EventDraft` → `expo-calendar` event shape (alarm preset →
    `toAlarmsArray` output; `allDay` flag forwarded; `calendarId`
    forwarded as the first arg of `createEventAsync`).
  - **C5 (allDay normalisation)**: when `allDay === true`,
    `createEvent` normalises start to `00:00:00.000` of the
    start date and end to `23:59:59.999` of the end date BEFORE
    the bridge call.
  - **CRUD success / error**: `createEvent`, `updateEvent`,
    `deleteEvent` each tested for both success (data refresh
    occurs) and error (`lastError` populated, classified per
    R-D) paths.
  - **denied path**: when `requestAccess()` resolves with
    `'denied'`, the hook reflects the status; the screen-side
    "Open Settings" affordance is the responsibility of
    `AuthorizationCard` (T013/T024).
  - Acceptance: test fails (RED) before T010 lands; uses
    `jest.mock('expo-calendar')` at the import boundary
    (FR-022); zero post-unmount setState warnings.
- [ ] T009 [US3] Author
  `test/unit/modules/eventkit-lab/hooks/useReminders.test.tsx`
  per `contracts/hooks.md` invariants (mirrors T008 with
  reminders-specific deltas):
  - **H1 / H2 / H3 / H4 / H5 / H6 / H7 / H8** as above, with
    `getRemindersPermissionsAsync` substituted for the calendar
    permission call and `getRemindersAsync` for the read path.
  - **R1**: `status` is `ReminderAuthorizationStatus`; iOS 17+
    `'fullAccess'` branch is reflected when the mocked permission
    API returns it.
  - **R2 (filter)**: `filter` defaults to `'incomplete'`;
    `setFilter('completed')` and `setFilter('all')` trigger
    `getRemindersAsync(...)` with the appropriate predicate
    (completed=true, completed=false, or unfiltered).
  - **R3 (lists refresh)**: `refreshReminders()` calls
    `getRemindersAsync(...)` with the configured filter and the
    list IDs returned by `getCalendarsAsync('reminder')`.
  - **R4 (no due date)**: `createReminder({ ..., dueDate:
    undefined })` is permitted; the bridge call omits the
    `dueDate` field (or passes `undefined` per `expo-calendar`'s
    contract).
  - **R5 (Android limitation)**: with `Platform.OS === 'android'`
    mock, `refreshReminders`, `createReminder`, `updateReminder`,
    `deleteReminder` either short-circuit to a non-supported
    state OR pass through `expo-calendar`'s Android surface
    without throwing — the test asserts the hook never throws
    and `lastError` is populated with a `'failed'` classification
    if the library rejects.
  - **CRUD success / error** for `createReminder`,
    `updateReminder`, `deleteReminder`.
  - Acceptance: test fails (RED) before T011 lands; uses
    `jest.mock('expo-calendar')` at the import boundary;
    zero post-unmount setState warnings.

---

## Phase 5: Hooks — GREEN

- [ ] T010 [US1] [US2] Implement
  `src/modules/eventkit-lab/hooks/useCalendarEvents.ts` per
  **H1**–**H8**, **C1**–**C5**: single `useReducer` +
  `useCallback` action functions; `mounted` ref guarding every
  async resolution; closure-scoped `enqueue()` promise chain
  serialising mutating calls (R-A); `Platform.OS === 'web'`
  short-circuit at the top of every action (**H7**); error
  classifier `classifyEventKitError(e)` per R-D / **H6**;
  `allDay` start/end normalisation in `createEvent` /
  `updateEvent` (**C5**); `writeOnly` gating in `refreshEvents`
  / `updateEvent` / `deleteEvent` (**C3**); imports
  `expo-calendar` once at the module top (the only such import
  outside the `useReminders` peer).
  - Acceptance: T008 passes (GREEN); no `eslint-disable`.
- [ ] T011 [US3] Implement
  `src/modules/eventkit-lab/hooks/useReminders.ts` per
  **H1**–**H8**, **R1**–**R5**: same shape as T010 with
  reminders-specific actions (`refreshLists`,
  `refreshReminders`, `createReminder`, `updateReminder`,
  `deleteReminder`, `setFilter`); `filter` default `'incomplete'`
  (**R2**); `Platform.OS` short-circuit gates Android &
  Web (**R5** + **H7**); shares the `classifyEventKitError`
  helper from T010 (extracted to a sibling module if needed —
  same file family).
  - Acceptance: T009 passes (GREEN); no `eslint-disable`.

---

## Phase 6: Components — RED (test files first, all parallelisable)

**Purpose**: Pure presentational + light-state components consumed
by the three screen variants. Eleven components total
(`AuthorizationCard`, `CalendarsList`, `EventsQueryCard`,
`EventRow`, `EventComposer`, `RemindersQueryCard`, `RemindersList`,
`ReminderRow`, `ReminderComposer`, `IOSOnlyBanner`,
`AndroidRemindersNotice`). Each component test file is
disjoint — fully parallelisable.

- [ ] T012 [P] [US1] [US3] Author
  `test/unit/modules/eventkit-lab/components/AuthorizationCard.test.tsx`:
  parameterised by `entityType: 'calendar' | 'reminder'` (R-C);
  exercises all five status branches for calendar
  (`notDetermined | denied | restricted | authorized | writeOnly`)
  AND the iOS 17+ reminder branch `'fullAccess'`; "Request Access"
  button rendered iff `status === 'notDetermined'`; "Open
  Settings" link rendered iff `status === 'denied'` or
  `'restricted'`; tapping "Open Settings" calls
  `Linking.openSettings()` exactly once (the test mocks
  `react-native`'s `Linking`); when `status === 'authorized'` /
  `'writeOnly'` / `'fullAccess'`, neither button renders and the
  card displays an entity-specific description.
- [ ] T013 [P] [US1] Author
  `test/unit/modules/eventkit-lab/components/CalendarsList.test.tsx`:
  empty state ("No calendars") rendered when `calendars.length
  === 0`; populated rows render with `title`, `type`, and `color`
  (the colour is bound to a stylable surface, asserted via the
  rendered style or testID); tapping "Refresh" invokes
  `onRefresh` exactly once.
- [ ] T014 [P] [US1] Author
  `test/unit/modules/eventkit-lab/components/EventsQueryCard.test.tsx`:
  3-segment date-range picker
  (`'today' | 'next7' | 'next30'`); selecting a segment invokes
  `onRangeChange(next)` once with the chosen preset and triggers
  `onRefresh()`; renders `EventRow` per result; empty state
  ("No events in this range") rendered when `events.length ===
  0`; the segment picker reads its label set from
  `date-ranges.ts` exports.
- [ ] T015 [P] [US1] [US2] Author
  `test/unit/modules/eventkit-lab/components/EventRow.test.tsx`:
  renders `title`, `location` (omitted gracefully when empty),
  formatted start/end times, and an `all-day` badge iff
  `event.allDay === true`; tap → calls `onEdit(event)` once;
  long-press → opens a destructive confirmation prompt; confirm
  → calls `onDelete(event.id)` once; cancel → does NOT call
  `onDelete` (FR-010).
- [ ] T016 [P] [US2] Author
  `test/unit/modules/eventkit-lab/components/EventComposer.test.tsx`:
  required-field gating (Save disabled when `title` is empty);
  read-only calendar picker selection (`allowsModifications ===
  false`) disables Save with an inline "This calendar is
  read-only" notice; alarm-offset wiring — `'none'` ⇒ no
  `alarms` field on the dispatched draft, `'5min'` /
  `'15min'` / `'1hour'` ⇒ correct `relativeOffset` per
  `toAlarmsArray` (T006); `allDay` toggle ON ⇒ start/end times
  normalised in the dispatched draft per **C5**; create vs
  update mode determined by the optional `eventId` prop (Save
  button label flips between "Save" and "Update"); double-tap
  on Save while `inFlight === true` is short-circuited (the
  hook's `inFlight` flag is the source of truth — the test
  drives it via prop).
- [ ] T017 [P] [US3] Author
  `test/unit/modules/eventkit-lab/components/RemindersQueryCard.test.tsx`:
  Completed / Incomplete / All toggle invokes
  `onFilterChange(next)` once with the chosen `RemindersFilter`
  value; renders `ReminderRow` per result; empty state ("No
  reminders match") rendered when `reminders.length === 0`.
- [ ] T018 [P] [US3] Author
  `test/unit/modules/eventkit-lab/components/RemindersList.test.tsx`:
  empty state ("No lists") when `lists.length === 0`; populated
  rows render with `title` and `color`; tapping "Refresh" invokes
  `onRefresh` exactly once.
- [ ] T019 [P] [US3] Author
  `test/unit/modules/eventkit-lab/components/ReminderRow.test.tsx`:
  renders `title`, `dueDate` (when present; omitted gracefully
  when `undefined` — no due-date badge), and a priority badge
  whose colour reflects the `priority` field; tap → calls
  `onEdit(reminder)` once; long-press → destructive confirm
  prompt → confirm → calls `onDelete(reminder.id)` once; cancel
  → does NOT call `onDelete`.
- [ ] T020 [P] [US3] Author
  `test/unit/modules/eventkit-lab/components/ReminderComposer.test.tsx`:
  required-field gating (Save disabled when `title` is empty);
  no-due-date allowed (Save remains enabled with an unset due
  date — **R4**); list picker selection forwarded to the draft;
  priority picker (`'none' | 'low' | 'medium' | 'high'`)
  forwarded to the draft; create vs update mode determined by
  the optional `reminderId` prop.
- [ ] T021 [P] [US4] Author
  `test/unit/modules/eventkit-lab/components/IOSOnlyBanner.test.tsx`:
  renders the unsupported-platform message ("EventKit is
  iOS-only — controls below are disabled");
  `accessibilityRole === 'alert'`; reuses theme tokens (no
  hardcoded hex); renders identically under Android and Web
  platform mocks.
- [ ] T022 [P] [US4] Author
  `test/unit/modules/eventkit-lab/components/AndroidRemindersNotice.test.tsx`:
  renders the limitation copy ("Reminders are limited or
  unavailable on Android"); `accessibilityRole === 'alert'`;
  inline (does NOT replace the surrounding card chrome —
  appears within the Reminders tab body); does NOT trigger any
  bridge call (the test asserts `expo-calendar`'s mocked module
  is not invoked from this component's render).

---

## Phase 7: Components — GREEN (implementations, all parallelisable)

- [ ] T023 [P] [US1] [US3] Implement
  `src/modules/eventkit-lab/components/AuthorizationCard.tsx`
  per R-C: parameterised by `entityType`; renders the precise
  status string; gates Request Access vs Open Settings per
  FR-006; tapping Open Settings dispatches
  `Linking.openSettings()` (imported from `react-native`).
  Acceptance: T012 passes.
- [ ] T024 [P] [US1] Implement
  `src/modules/eventkit-lab/components/CalendarsList.tsx`:
  consumes `calendars` + `onRefresh` props; renders empty state
  or row list. Acceptance: T013 passes.
- [ ] T025 [P] [US1] Implement
  `src/modules/eventkit-lab/components/EventsQueryCard.tsx`:
  3-segment picker over `date-ranges.ts`'s `DateRangePreset`;
  consumes `range`, `events`, `onRangeChange`, `onRefresh`
  props; renders `EventRow` per event; empty state.
  Acceptance: T014 passes.
- [ ] T026 [P] [US1] [US2] Implement
  `src/modules/eventkit-lab/components/EventRow.tsx`: renders
  metadata; consumes `onEdit`, `onDelete` callbacks;
  long-press destructive confirm prompt via React Native's
  `Alert.alert`. Acceptance: T015 passes.
- [ ] T027 [P] [US2] Implement
  `src/modules/eventkit-lab/components/EventComposer.tsx`:
  consumes `useCalendarEvents` action callbacks via props (NOT
  via direct hook usage — keeps the component pure); fields per
  FR-009; alarm-offset picker bound to `alarm-offsets.ts`;
  read-only-calendar Save gating; `allDay` normalisation
  performed at submit time before the draft is dispatched.
  Acceptance: T016 passes.
- [ ] T028 [P] [US3] Implement
  `src/modules/eventkit-lab/components/RemindersQueryCard.tsx`:
  3-segment toggle over `RemindersFilter`; consumes `filter`,
  `reminders`, `onFilterChange`, `onRefresh` props; renders
  `ReminderRow` per reminder; empty state.
  Acceptance: T017 passes.
- [ ] T029 [P] [US3] Implement
  `src/modules/eventkit-lab/components/RemindersList.tsx`:
  consumes `lists` + `onRefresh` props; renders empty state or
  row list. Acceptance: T018 passes.
- [ ] T030 [P] [US3] Implement
  `src/modules/eventkit-lab/components/ReminderRow.tsx`:
  renders metadata; long-press destructive confirm prompt.
  Acceptance: T019 passes.
- [ ] T031 [P] [US3] Implement
  `src/modules/eventkit-lab/components/ReminderComposer.tsx`:
  fields per FR-011; due-date is optional; priority picker;
  create vs update mode by `reminderId` prop.
  Acceptance: T020 passes.
- [ ] T032 [P] [US4] Implement
  `src/modules/eventkit-lab/components/IOSOnlyBanner.tsx`:
  renders the iOS-only message; theme tokens only;
  `accessibilityRole="alert"`. Acceptance: T021 passes.
- [ ] T033 [P] [US4] Implement
  `src/modules/eventkit-lab/components/AndroidRemindersNotice.tsx`:
  renders the limitation copy; theme tokens only;
  `accessibilityRole="alert"`. Acceptance: T022 passes.

---

## Phase 8: Screens (3 platform variants) — RED → GREEN

**Purpose**: Compose the two top-level tabs (Calendar / Reminders)
per FR-004 / FR-005 / FR-011 / FR-012. Tab switching MUST preserve
each tab's transient UI state (selected range, form fields, query
filters) for the lifetime of the screen. `screen.web.tsx` MUST
NOT eagerly import `expo-calendar` (carryover SC-007).

### Screen tests (RED)

- [ ] T034 [P] [US1] [US2] [US3] Author
  `test/unit/modules/eventkit-lab/screen.test.tsx` (iOS):
  - Two top-level tabs render in order (Calendar, Reminders);
    Calendar tab is the default.
  - Calendar tab renders five sections in order: Authorization
    → Calendars → EventsQueryCard → EventComposer → (per-row
    Edit/Delete affordances on the events list).
  - Reminders tab renders four sections in order: Authorization
    (separate entity, independent `useReminders` instance) →
    Lists → RemindersQueryCard → ReminderComposer.
  - Tab-state preservation: selecting `'next30'` on the Calendar
    tab, switching to Reminders, then back to Calendar, the
    selected range remains `'next30'` (FR-004).
  - The two `AuthorizationCard` instances are independent: the
    Calendar tab's status update does NOT mutate the Reminders
    tab's status (R-C).
  - `IOSOnlyBanner` is hidden on iOS.
  - Mocks `useCalendarEvents` and `useReminders` so the screen
    test never invokes the real `expo-calendar` mock.
- [ ] T035 [P] [US4] Author
  `test/unit/modules/eventkit-lab/screen.android.test.tsx`:
  Calendar tab is fully functional (Authorization → Calendars
  → EventsQueryCard → EventComposer all render with enabled
  controls); Reminders tab renders its four sections with
  `AndroidRemindersNotice` at the top and CRUD controls
  disabled (`accessibilityState.disabled === true`); bridge
  methods on the `useReminders` mock are NEVER invoked at
  module evaluation time (asserted via mock spy);
  `IOSOnlyBanner` is hidden.
- [ ] T036 [P] [US4] Author
  `test/unit/modules/eventkit-lab/screen.web.test.tsx`:
  `IOSOnlyBanner` rendered at the top; the two-tab shell
  renders beneath it with all interactive controls disabled;
  statically asserts via `jest.isolateModules` +
  `jest.doMock('expo-calendar', () => { throw new Error(
  'eager-imported on web') })` that the web bundle does NOT
  pull in `expo-calendar` at module evaluation time
  (SC-007).

### Screen implementations (GREEN)

- [ ] T037 [US1] [US2] [US3] Implement
  `src/modules/eventkit-lab/screen.tsx` (iOS variant): consumes
  two independent hook instances (`useCalendarEvents`,
  `useReminders`); two `Tabs.Screen`-style or local-state tab
  switcher preserving transient state; renders the five Calendar
  cards and four Reminder cards in the documented order; wires
  component callbacks to hook actions.
  Acceptance: T034 passes.
- [ ] T038 [P] [US4] Implement
  `src/modules/eventkit-lab/screen.android.tsx`: same two-tab
  shell; Calendar tab fully functional; Reminders tab body
  renders `AndroidRemindersNotice` at the top and disables CRUD
  controls; consumes the same hooks (which short-circuit on
  Android per **R5**). Acceptance: T035 passes.
- [ ] T039 [P] [US4] Implement
  `src/modules/eventkit-lab/screen.web.tsx`: top-mount
  `IOSOnlyBanner`; renders the two-tab shell with all controls
  disabled; MUST NOT import `expo-calendar` (consumes the
  hooks' web short-circuit via **H7**); the file imports only
  typed shapes from `./types` and the platform-resolved hook
  modules (which themselves short-circuit on web).
  Acceptance: T036 passes — including the static-import
  assertion.

---

## Phase 9: Manifest — RED → GREEN

- [ ] T040 Author
  `test/unit/modules/eventkit-lab/manifest.test.ts` per
  `contracts/eventkit-lab-manifest.md`: `id === 'eventkit-lab'`
  (**M2**); `label === 'EventKit Lab'` (**M3**); `platforms`
  deep-equals `['ios', 'android', 'web']` (**M4**);
  `minIOS === '4.0'` (**M5**); `screen` resolves at runtime to a
  renderable React component (**M6**); the manifest object shape
  matches every other 0xx module manifest (**M1**).
  Acceptance: test fails (RED) before T041.
- [ ] T041 Implement `src/modules/eventkit-lab/index.tsx`:
  default-exports the `ModuleManifest` matching the test;
  re-exports the iOS / Android / Web `screen` via the
  platform-resolved entry. Acceptance: T040 passes (GREEN).

---

## Phase 10: Registry integration

- [ ] T042 Modify `src/modules/registry.ts` (**M7**): +1 import
  line for `eventkitLab` from `./eventkit-lab`; +1 array entry
  appended after the 036 (`passkitLab`) entry; no other edits.
  Re-run the existing `test/unit/modules/registry.test.ts` (no
  new test needed — T040 manifest test covers shape).
  - Acceptance: registry size grows by exactly 1 (31 → 32);
    existing registry test passes; ordering preserved; the new
    entry deep-equals the manifest exported by
    `src/modules/eventkit-lab/index.tsx`.

---

## Phase 11: Expo config plugin (`with-eventkit`) — RED → GREEN

**Purpose**: A single `withInfoPlist` mod that adds the four
EventKit usage-description keys (`NSCalendarsUsageDescription`,
`NSCalendarsWriteOnlyAccessUsageDescription` for iOS 17+,
`NSRemindersUsageDescription`,
`NSRemindersFullAccessUsageDescription` for iOS 17+) ONLY when
absent (preserving any operator-supplied value — **P3**);
idempotent (**P5** / SC-008); coexists with all 23 prior plugins
002–036 (**P6** / SC-009); does not touch entitlements,
frameworks, or any non-Info.plist surface (**P7**). JS-pure tests
against `@expo/config-plugins`.

- [ ] T043 Author
  `test/unit/plugins/with-eventkit/index.test.ts` per
  `contracts/with-eventkit-plugin.md`:
  - **P1 (export shape)**: default export is a `ConfigPlugin`
    function `(config) => config`.
  - **P2 (defaults)**: empty config → after running the plugin,
    `ios.infoPlist['NSCalendarsUsageDescription']`,
    `ios.infoPlist['NSCalendarsWriteOnlyAccessUsageDescription']`,
    `ios.infoPlist['NSRemindersUsageDescription']`, and
    `ios.infoPlist['NSRemindersFullAccessUsageDescription']` are
    all set to non-empty default strings describing the
    educational purpose of the showcase.
  - **P3 (preserve)**: when `ios.infoPlist` already contains a
    value for any of the four keys, the plugin does NOT
    overwrite it; the operator-supplied string round-trips
    verbatim. The test exercises every combination of
    pre-populated keys (one, several, all four).
  - **P4 (no foreign-key writes)**: snapshot the Info.plist
    dict pre-run minus the four owned keys; assert deep-equal
    post-run.
  - **P5 (idempotency / SC-008)**: running the plugin twice on
    the same Expo config produces a deep-equal config (snapshot
    comparison); no value drift; no key duplication.
  - **P6 (coexistence / SC-009)**: compose all 23 prior plugins
    (`with-live-activity`, `with-app-intents`,
    `with-home-widgets`, `with-screentime`, `with-coreml`,
    `with-vision`, `with-speech-recognition`,
    `with-audio-recording`, `with-sign-in-with-apple`,
    `with-local-auth`, `with-keychain-services`, `with-mapkit`,
    `with-core-location`, `with-rich-notifications`,
    `with-lock-widgets`, `with-standby-widget`,
    `with-focus-filters`, `with-background-tasks`,
    `with-spotlight`, `with-documents`, `with-arkit`,
    `with-bluetooth`, `with-passkit`) + `with-eventkit` and
    assert that every entitlement / Info.plist key set by a
    prior plugin is byte-identical after `with-eventkit` runs
    (uses the existing 002–036 fixture composition pattern).
  - **P7 (no entitlement / framework writes)**: the post-run
    `ios.entitlements` dict and `xcodeProject` framework list
    are byte-identical to the pre-run snapshots.
  - Acceptance: test fails (RED) before T044 lands.
- [ ] T044 Implement `plugins/with-eventkit/index.ts`:
  default-export `ConfigPlugin` per **P1**; one
  `withInfoPlist` mod that sets each of the four keys ONLY when
  absent (preserving operator-supplied values per **P3**);
  idempotent (**P5**); resolves `@expo/config-plugins` from the
  host package (no plugin-side dependency per **P8**). JSDoc
  block documents the four default strings and points operators
  at where to customise them.
  - Acceptance: T043 passes (GREEN); no `eslint-disable`.
- [ ] T045 [P] Author `plugins/with-eventkit/index.test.ts`
  (co-located smoke test): imports `./index` and asserts the
  export shape (`typeof default === 'function'`) — per the
  precedent set by 035's / 036's co-located smoke tests.
  Behavioural coverage lives in T043's
  `test/unit/plugins/with-eventkit/index.test.ts`.
  - Acceptance: file runs under Jest with no behavioural
    duplication; fails fast if the default export shape
    regresses.

---

## Phase 12: `app.json` plugin entry

- [ ] T046 Modify `app.json`: append the string
  `"./plugins/with-eventkit"` to `expo.plugins`; no other edits.
  Order: appended last (after 036's `"./plugins/with-passkit"`).
  Strictly additive — `expo.plugins` length grows by exactly 1
  (23 → 24).
  - Acceptance: `app.json` parses as valid JSON; `expo.plugins`
    length grows by exactly 1; the new entry is the literal
    string `"./plugins/with-eventkit"`; the existing
    `app-json.test.ts` (if present) is extended in-place to
    assert the new entry rather than duplicated.

---

## Phase 13: Runtime dependency install

- [ ] T047 Run `npx expo install expo-calendar` from the repo
  root (FR-022, plan §"Primary Dependencies"). Pins the
  SDK-55-compatible version into `package.json` `dependencies`
  and `pnpm-lock.yaml`.
  - Acceptance: `package.json` has exactly one new entry under
    `dependencies` (`expo-calendar`); `pnpm-lock.yaml` is updated;
    `pnpm install` is a no-op afterward; no other dependencies
    change. The pinned version satisfies `expo-calendar`'s
    `peerDependencies` against Expo SDK 55.

---

## Phase 14: Final integration & verification

- [ ] T048 Run `pnpm format` from the repo root (FR-028).
  - Acceptance: exits 0; the resulting diff is committed (or
    no-op if formatting is already clean); `pnpm format` is a
    no-op on a second run.
- [ ] T049 Run `pnpm typecheck`.
  - Acceptance: exits 0; no type errors introduced.
- [ ] T050 Run `pnpm lint` (or `pnpm oxlint` — match the
  project's existing script name).
  - Acceptance: exits 0; ZERO `eslint-disable` directives
    anywhere in the diff
    (`git diff main -- src plugins | rg 'eslint-disable'`
    returns no matches — FR-023, SC-010).
- [ ] T051 Run `pnpm test` (Jest Expo).
  - Acceptance: exits 0; suite delta ≥ +20 vs the 036 closing
    baseline (helpers +2, hooks +2, components +11, screens +3,
    manifest +1, plugin +1; co-located plugin smoke counts
    within the plugin suite — see plan §"Test baseline
    tracking").
- [ ] T052 Run `pnpm check` (composite: format + lint +
  typecheck + test) and create the final commit on branch
  `037-eventkit`.
  - Acceptance: `pnpm check` exits 0;
    `git status --porcelain` is clean after the commit; the
    commit message references the feature number and the
    additive-only invariants (registry +1, app.json +1, +1
    runtime JS dep `expo-calendar`, zero new native sources).
  - On-device quickstart (per `quickstart.md`) is documented
    but not gated in CI: verify on a real iOS 4+ device
    (including iOS 17+ write-only / full-access modes), an
    Android device, and a desktop browser for the iOS-only
    banner path. Run `expo prebuild` and inspect the
    generated `ios/<App>/Info.plist` for the four EventKit
    usage-description keys (or operator-supplied values);
    re-run `expo prebuild` and verify no diff (SC-008).

---

## Dependencies & Execution Order

### Phase dependencies

- **T001** (scaffold) blocks every later task (directories must
  exist).
- **T002** (plugin `package.json`) blocks T044 (plugin impl).
- **Helper tests (T003 / T004)** precede helper impls
  (T005 / T006) — TDD RED → GREEN.
- **Helper impls (T005 / T006)** block T008 / T010 (hooks
  consume `date-ranges` + `alarm-offsets`), T014 (events query
  card), and T016 (event composer).
- **Types (T007)** blocks T008–T046 (every later test/impl
  imports the shared types).
- **Hook tests (T008 / T009)** precede hook impls (T010 / T011)
  — TDD RED → GREEN.
- **Hook impls (T010 / T011)** block T034–T039 (screens
  indirectly via the hooks; component tests mock the hooks
  rather than depending on the impls).
- **Component tests (T012–T022)** precede component impls
  (T023–T033); no inter-component dependencies (each pair is
  independent — all eleven pairs parallelisable).
- **Component impls (T023–T033)** block screen tests
  (T034–T036) only insofar as the screen tests render real
  components — if components are mocked in screen tests this
  is a soft dependency.
- **Screen tests (T034–T036)** precede screen impls
  (T037–T039).
- **Manifest (T040 / T041)** is independent of components; can
  run in parallel with Phases 6–8 once T007 is done.
- **Registry (T042)** requires T041 (manifest export must
  exist).
- **Plugin test (T043)** precedes plugin impl (T044); plugin
  co-located smoke (T045) can run in parallel with T044 once
  T002 exists.
- **`app.json` (T046)** requires the plugin path to exist on
  disk (T044).
- **Dependency install (T047)** can be performed at any point
  after T001 but BEFORE T051 (`pnpm test` resolves
  `expo-calendar` during module loading even when mocked at
  the import boundary; the lockfile must include it).
- **Final verification (T048–T052)** requires every preceding
  task green.

### Parallel opportunities

- **Phase 1**: T002 runs in parallel with T001 once the
  `plugins/with-eventkit/` directory exists.
- **Phase 2 RED**: T003 / T004 are file-disjoint and
  parallelisable.
- **Phase 2 GREEN**: T005 / T006 are file-disjoint and
  parallelisable.
- **Phase 4 RED**: T008 / T009 are file-disjoint and
  parallelisable.
- **Phase 5 GREEN**: T010 / T011 are file-disjoint and
  parallelisable.
- **Phase 6 RED**: all eleven component tests T012–T022 are
  file-disjoint and parallelisable.
- **Phase 7 GREEN**: all eleven component impls T023–T033 are
  file-disjoint and parallelisable.
- **Phase 8 RED**: T034 / T035 / T036 are file-disjoint and
  parallelisable.
- **Phase 8 GREEN**: T038 / T039 (Android / Web screens) are
  file-disjoint and parallelisable; T037 (iOS) lands first
  because it carries the US1 + US2 + US3 surface composition.
- **Phase 11**: T045 (co-located plugin smoke) runs in parallel
  with T044.
- Manifest pair (T040 / T041) is parallel with Phases 6–8 once
  T007 is done.

### MVP-first execution path

The shortest path to a demoable MVP (User Story 1 — P1):

1. T001 → T002 → T007 (foundation).
2. T003 → T005 (date-ranges helper).
3. T008 → T010 (`useCalendarEvents`).
4. T012 / T013 / T014 / T015 (US1 component tests in parallel)
   → T023 / T024 / T025 / T026 (US1 component impls in
   parallel).
5. T034 → T037 (iOS screen tests + impl).
6. T040 → T041 → T042 (manifest + registry).
7. T043 → T044 → T045 → T046 (plugin + app.json).
8. T047 (`expo-calendar` install).
9. T048 → T049 → T050 → T051 → T052.

Stop at T037 + T041 + T042 to demo US1 only; complete
T004 / T006 / T016 / T027 to add US2; complete
T009 / T011 / T017–T020 / T028–T031 to add US3; complete
T021 / T022 / T032 / T033 / T035 / T036 / T038 / T039 to add
US4.

---

## Implementation Strategy

### MVP first (User Story 1 only — read-only Calendar)

1. Phase 1 → Phase 2 (helpers) → Phase 3 (types) → Phase 4
   (`useCalendarEvents` only) → Phase 5 (T010 only) → Phase 6
   (US1 subset: T012–T015) → Phase 7 (US1 subset:
   T023–T026) → Phase 8 (T034 + T037 only) → Phase 9 →
   Phase 10 → Phase 11 → Phase 12 → Phase 13 → Phase 14.
2. **STOP and VALIDATE**: build and run on any iOS 4+ device;
   verify Story 1 acceptance scenarios 1–5 from spec.md.
3. Demo if ready.

### Incremental delivery

1. MVP (US1) → Test independently → Demo.
2. Add US2 (T004 / T006 / T016 / T027) → Test on a device with
   read/write calendar permission → Demo.
3. Add US3 (T009 / T011 / T017–T020 / T028–T031) → Test
   reminders independently → Demo.
4. Add US4 (T021 / T022 / T032 / T033 / T035 / T036 / T038 /
   T039) → Test on Android + Web → Demo.

### Constraints summary

- Additive-only: `src/modules/registry.ts` +1 import + 1 array
  entry (T042); `app.json` `expo.plugins` +1 string (T046);
  `package.json` +1 runtime dep (T047); zero edits elsewhere.
- ONE new runtime JS dependency (`expo-calendar`); zero new
  Swift / Kotlin / Java sources; zero project-owned native
  bridge files (consumes `expo-calendar` directly per plan
  §"Structure Decision").
- `expo-calendar` mocked at the import boundary in tests
  (FR-022): all hook + screen tests use
  `jest.mock('expo-calendar')`.
- No `eslint-disable` directives anywhere (FR-023); enforced at
  T050.
- Plugin idempotent + coexistent with all 23 prior plugins
  (T043 / **P5** / **P6**).
- Two independent permission entities — `useCalendarEvents` and
  `useReminders` are parallel, never shared (R-C, FR-006).

---

## Notes

- **[P]** tasks operate on disjoint files with no completion
  dependency on any incomplete sibling.
- **[Story]** label maps the task to spec.md user stories US1 /
  US2 / US3 / US4 for traceability; phases without a story label
  (Setup, Foundational types, Manifest, Registry, Plugin,
  app.json, Dependency install, Final verification) span all
  stories.
- Contract IDs (H1–H8, C1–C5, R1–R5, D1–D7, A1–A6, M1–M7,
  P1–P8) are cited inline so every assertion traces back to a
  contract invariant in `specs/037-eventkit/contracts/`.
- TDD discipline: every test task is RED before its paired impl
  (verify with `pnpm test --watch=false` between the two).
- Commit cadence: one commit per RED → GREEN pair (or per phase
  boundary where pairs are tight); final commit at T052 after
  `pnpm check` passes green.
- Educational-scaffold framing — the "EventKit Permission
  Reality Check" is asserted at four locations: spec.md (the
  reality-check section), the on-screen `AuthorizationCard`
  parameterised per-entity (T012 / T023), `quickstart.md`, and
  the Assumptions section. No single task owns it; each
  touch-point has its own test.
