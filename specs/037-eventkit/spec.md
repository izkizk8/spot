# Feature Specification: EventKit (Calendar + Reminders) Module

**Feature Branch**: `037-eventkit`
**Feature Number**: 037
**Created**: 2026-04-29
**Status**: Approved (autonomous, no clarifications needed)
**Input**: iOS 4+ educational module showcasing Apple's EventKit framework — calendar event query/CRUD and reminder query/CRUD — implemented cross-platform via the `expo-calendar` library. Adds an "EventKit Lab" card to the 006 iOS Showcase registry (`id: 'eventkit-lab'`, `platforms: ['ios','android','web']`, `minIOS: '4.0'`). The screen presents two top-level tabs (Calendar / Reminders), each with their own permission card, list views, query controls, and CRUD composers. Config plugin `plugins/with-eventkit/` adds the four required Info.plist usage-description keys (`NSCalendarsUsageDescription`, `NSCalendarsWriteOnlyAccessUsageDescription` for iOS 17+, `NSRemindersUsageDescription`, `NSRemindersFullAccessUsageDescription` for iOS 17+). Branch parent is `036-passkit-wallet`. Additive only: registry +1 entry, `app.json` `plugins` +1.

---

## EventKit Permission Reality Check (READ FIRST)

EventKit is gated by **two separate runtime permission entities** managed independently by iOS:

1. **Calendar access** — `NSCalendarsUsageDescription` (read/write, all iOS versions) and, on iOS 17+, the more granular `NSCalendarsWriteOnlyAccessUsageDescription` for write-only mode.
2. **Reminders access** — `NSRemindersUsageDescription` (all iOS versions) and, on iOS 17+, `NSRemindersFullAccessUsageDescription` for full read/write.

A user can grant either one without the other, and on iOS 17+ may grant a "write-only" calendar mode that allows event creation but blocks event enumeration. Any module that conflates the two entities will produce broken UI states. This module therefore renders **two independent Authorization cards** (one per tab) and treats each entity's status enum (`notDetermined | denied | restricted | authorized | writeOnly`) as a first-class state machine.

Additionally, `expo-calendar` works on iOS, Android, and (with limitations) web. Android handles calendar/reminder access via separate runtime permissions; web has no native calendar access and renders an iOS/Android-only banner. The module is registered for `['ios','android','web']` so the educational artifact remains visible everywhere; the web variant degrades gracefully.

This reality check is repeated in the on-screen UI (the `AuthorizationCard` component, parameterized by entity type, surfaces the precise status string), in `quickstart.md`, and in the Assumptions section below.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Inspect calendars and query events on iOS (Priority: P1)

A developer studying the spot iOS showcase opens the app on an iOS 4+ device, taps the "EventKit Lab" card from the Modules grid, lands on the Calendar tab, taps "Request Access" in the Authorization card, approves the system prompt, and sees their device's calendars listed (title, type, color). They then use the **Events query** card to choose a date range (Today / Next 7 days / Next 30 days) and see matching events listed with title, location, start/end time, and an all-day badge when applicable.

**Why this priority**: This is the read-only MVP. Even without ever creating an event, the module delivers the core educational value of EventKit calendar enumeration: how to request authorization, list calendars, and query events with predicates. If only this story shipped, the module would still be valuable.

**Independent Test**: Build and run the app on an iOS 4+ device with at least one calendar. Open the EventKit Lab module, tap the Calendar tab, tap Request Access, approve. Verify the Authorization card transitions through `notDetermined → authorized` (or `writeOnly` on iOS 17+ if the user picked that path), the Calendars list populates with at least one calendar (title, type, color visible), and switching between the three date-range presets in the Events query card produces the expected event list (or "No events" empty state) without error.

**Acceptance Scenarios**:

1. **Given** a fresh install on iOS 4+ with `notDetermined` calendar access, **When** the user opens the module's Calendar tab, **Then** the Authorization card displays "notDetermined" with a "Request Access" button enabled and an "Open Settings" link hidden.
2. **Given** the user taps "Request Access", **When** the system prompt resolves with approval, **Then** the Authorization card transitions to "authorized" (or "writeOnly" on iOS 17+ if the user picked write-only), and the Calendars list and Events query card become enabled.
3. **Given** authorized calendar access, **When** the user taps Refresh in the Calendars list, **Then** `expo-calendar.getCalendarsAsync()` is invoked and rows render with `title`, `type`, and `color`.
4. **Given** authorized calendar access, **When** the user toggles between Today / Next 7 days / Next 30 days in the Events query card, **Then** the corresponding date range is computed by `date-ranges.ts`, `expo-calendar.getEventsAsync()` is invoked with that range, and the resulting events render with title, location, start/end time, and an all-day badge for all-day events.
5. **Given** the user previously denied access and the status reads "denied", **When** the Authorization card renders, **Then** the "Request Access" button is hidden and an "Open Settings" link is shown that opens the system Settings app via `Linking.openSettings()`.

---

### User Story 2 — Create, edit, and delete an event (Priority: P1)

The same developer, with `authorized` (not write-only) calendar access, taps the **Event composer**, fills in title, location, start, end, toggles all-day off, picks a target calendar, picks an alarm offset (none / 5 min / 15 min / 1 hour), and taps Save. The new event appears in the Events list immediately (after a query refresh). They tap the row, the composer re-opens prefilled with the event's fields, they edit the title, tap Save, and the row updates. They long-press the row, confirm the destructive prompt, and the row disappears.

**Why this priority**: Event CRUD is the primary EventKit demonstration the module exists to teach. P1 because it is the dominant educational outcome; only the Calendars/Events read flow (Story 1) ranks alongside it.

**Independent Test**: With authorized (read/write) calendar access, open the Event composer, create an event with all fields populated, save, then refresh the Events query and verify the new event appears. Tap the row, edit the title, save, and verify the title updates. Long-press the row, confirm the delete prompt, and verify the row is removed.

**Acceptance Scenarios**:

1. **Given** authorized read/write calendar access, **When** the user fills in title, location, start, end, all-day=false, calendar=Calendars[0], alarm=15 min, and taps Save, **Then** `expo-calendar.createEventAsync(calendarId, details)` is invoked with those fields and the alarm offset, and on success the events list refreshes to include the new row.
2. **Given** the all-day toggle is on, **When** the user submits the composer, **Then** the saved event has `allDay: true`, the start time is normalized to 00:00:00 of the start date, and the all-day badge renders on the row.
3. **Given** an event row in the events list, **When** the user taps the row, **Then** the composer opens prefilled with the event's id, title, location, start, end, all-day, calendarId, and alarm offset.
4. **Given** the prefilled composer, **When** the user changes the title and taps Save, **Then** `expo-calendar.updateEventAsync(eventId, details)` is invoked and the row reflects the new title after refresh.
5. **Given** an event row, **When** the user long-presses and confirms the destructive prompt, **Then** `expo-calendar.deleteEventAsync(eventId)` is invoked and the row is removed from the list; cancelling the prompt MUST NOT call delete.
6. **Given** calendar access is `writeOnly` on iOS 17+, **When** the user attempts to enumerate or edit existing events, **Then** the Events query and Edit/Delete affordances are disabled with an inline "Write-only access — cannot read events" notice; only the composer remains active for creating new events.

---

### User Story 3 — Reminders authorization, query, and CRUD (Priority: P2)

The developer switches to the Reminders tab, sees a fresh Authorization card (independent of the Calendar tab's status), requests access, approves, sees their reminder lists, toggles between completed / incomplete / all in the Reminders query card, sees matching reminders, and uses the Reminder composer (title, due date, list, priority) to create a new reminder. Tapping a row opens an editor; long-press deletes after confirmation.

**Why this priority**: Reminders are a separate EventKit entity with their own permission, list, and predicate semantics. P2 because Calendar (Stories 1+2) is the more frequently-needed surface and ships independently; Reminders extend the showcase but are not strictly required for an MVP.

**Independent Test**: Switch to the Reminders tab on iOS, request access, approve, verify the Lists section populates, exercise the completed/incomplete/all toggle and verify each call invokes `expo-calendar.getRemindersAsync()` with the correct status filter. Create a reminder via the composer and verify it appears after a refresh; edit and delete it.

**Acceptance Scenarios**:

1. **Given** a fresh install with `notDetermined` reminders access, **When** the user opens the Reminders tab, **Then** the Reminders Authorization card is independent of the Calendar tab's card and shows "notDetermined" with a "Request Access" button.
2. **Given** the user taps Request Access for reminders, **When** the system prompt resolves with approval, **Then** the status transitions to "authorized" (or "fullAccess" / "writeOnly" mappings on iOS 17+) and the Lists, query, and composer become enabled.
3. **Given** authorized reminders access, **When** the user taps Refresh in the Lists section, **Then** `expo-calendar.getCalendarsAsync('reminder')` is invoked and rows render.
4. **Given** authorized reminders access, **When** the user toggles between Completed / Incomplete / All, **Then** `expo-calendar.getRemindersAsync(...)` is called with the appropriate status predicate (completed=true, completed=false, or unfiltered) and the resulting reminders render with title, due date, and priority badge.
5. **Given** authorized read/write reminders access, **When** the user fills in title, due date, list, priority and taps Save, **Then** `expo-calendar.createReminderAsync(listId, details)` is invoked and the reminder appears in the list after refresh.
6. **Given** a reminder row, **When** the user long-presses and confirms, **Then** `expo-calendar.deleteReminderAsync(reminderId)` is invoked and the row is removed.

---

### User Story 4 — Cross-platform graceful degradation (Priority: P3)

A developer running the showcase on Android opens the EventKit Lab module and sees the same two-tab structure with both Authorization cards working against Android's runtime calendar/reminders permissions (reminders fall back to read-only or unsupported on Android, surfaced in the UI). A developer running on web opens the module and sees an `IOSOnlyBanner` with all interactive controls disabled.

**Why this priority**: The module is registered for `['ios','android','web']` to remain visible everywhere as an educational artifact. Android can exercise the calendar half of the module via `expo-calendar`; reminders are limited or unavailable on Android, which the UI must honestly reflect. Web has no real EventKit equivalent.

**Independent Test**: Run the app on Android — verify the Calendar tab works end-to-end via `expo-calendar`'s Android implementation and that the Reminders tab either disables itself or surfaces an "Unsupported on Android" notice. Run on web — verify the IOSOnlyBanner is shown and all controls are disabled.

**Acceptance Scenarios**:

1. **Given** the app is running on Android, **When** the user opens the Calendar tab, **Then** Authorization, Calendars, Events query, and Event composer all function via `expo-calendar`'s Android implementation.
2. **Given** the app is running on Android, **When** the user opens the Reminders tab, **Then** the tab renders with a clear "Reminders are limited / unavailable on Android" notice and disabled CRUD controls (or read-only behavior if `expo-calendar` exposes any), with no thrown errors.
3. **Given** the app is running on web, **When** the user opens the module, **Then** an `IOSOnlyBanner` is shown above the two-tab layout, both tabs render with disabled controls, and no native bridge calls are made.

---

### Edge Cases

- **Permission denied or restricted**: The Authorization card MUST hide "Request Access" and show "Open Settings" when status is `denied` or `restricted`; tapping it MUST call `Linking.openSettings()` without throwing.
- **iOS 17+ write-only calendar mode**: When status is `writeOnly`, the Events query and existing-event Edit/Delete affordances MUST be disabled with an inline notice; only the composer (create-new) remains active.
- **iOS 17+ reminders write-only mapping**: Likewise for `NSRemindersFullAccessUsageDescription` vs `NSRemindersUsageDescription`; the UI must reflect the actual granted level.
- **Empty calendars / empty events / empty reminders**: Each list MUST render an empty-state row ("No calendars", "No events in this range", "No reminders match") rather than throwing.
- **Date range that spans DST transitions**: `date-ranges.ts` MUST compute presets in the device's local time zone and MUST NOT drift due to DST; covered in unit tests.
- **All-day event time normalization**: When `allDay` is true, the composer MUST normalize start to 00:00:00 of the start date and end to 23:59:59 of the end date (or whatever EventKit semantics `expo-calendar` documents) before calling `createEventAsync`.
- **Alarm offset = none**: The composer MUST NOT pass an `alarms: [{...}]` array when offset is "none"; only pass alarms when an offset is explicitly chosen.
- **Read-only calendar selected as event target**: If the user picks a calendar whose `allowsModifications` is false, Save MUST be disabled with an inline "This calendar is read-only" notice.
- **Reminder with no due date**: The composer MUST allow creating reminders with no due date; the row MUST render without a due-date badge in that case.
- **Concurrent CRUD races**: If the user taps Save twice in rapid succession, the second tap MUST be ignored while the first call is in flight (covered by the hook's `inFlight` flag).
- **Component unmount during in-flight operation**: Hooks MUST cancel or discard pending operations on unmount; no `setState` after unmount.
- **Plugin coexistence**: The 037 plugin MUST cooperate with all 23 prior plugins (002–036) without disturbing their entitlements, target lists, App Groups, or Info.plist additions.
- **Web fallback**: On web, `expo-calendar` is unavailable; bridge calls MUST short-circuit before invoking the library and the IOSOnlyBanner MUST surface the unsupported state without thrown exceptions.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Module Surface & Registration

- **FR-001**: The system MUST register an "EventKit Lab" module entry in `src/modules/registry.ts` with `id: 'eventkit-lab'`, `platforms: ['ios','android','web']`, and `minIOS: '4.0'`. This MUST be the only registry edit (a single import + array entry line). The change MUST add exactly one entry to the registry array (parent count + 1).
- **FR-002**: The module MUST be discoverable from the 006 Modules grid and tappable to navigate into the showcase screen.
- **FR-003**: The module MUST provide three platform-specific screen entry files: `screen.tsx` (iOS default), `screen.android.tsx`, and `screen.web.tsx`.

#### On-Screen UI Sections

- **FR-004**: The module screen MUST present two top-level tabs labelled **Calendar** and **Reminders**. Tab switching MUST preserve each tab's transient UI state (form fields, selected range, query filters) for the lifetime of the screen.
- **FR-005** *(Calendar tab)*: The Calendar tab MUST render five cards in this order: **Authorization**, **Calendars**, **Events query**, **Event composer**, and (implicit) per-row **Edit / Delete** affordances on the events list.
- **FR-006**: The **Authorization** card (parameterized by entity type) MUST display the current EventKit authorization status string (one of `notDetermined | denied | restricted | authorized | writeOnly` for iOS, with parallel mappings for `fullAccess` on reminders iOS 17+). It MUST show a "Request Access" button when status is `notDetermined`, and an "Open Settings" link when status is `denied` or `restricted`. When status is `authorized` (or `writeOnly` / `fullAccess`), neither button MUST be shown; the card MUST display a brief description of what that status enables.
- **FR-007**: The **Calendars list** MUST list every calendar returned by `expo-calendar.getCalendarsAsync()` with `title`, `type`, and `color`. A Refresh button MUST re-invoke the query. An empty state MUST render when the array is empty.
- **FR-008**: The **Events query** card MUST present a 3-segment date-range picker (Today / Next 7 days / Next 30 days) computed by `date-ranges.ts`. Selecting a segment MUST invoke `expo-calendar.getEventsAsync()` with all calendar IDs and the computed range. Each result MUST render with `title`, `location`, formatted start/end time, and an `all-day` badge when `allDay` is true. An empty state MUST render when the array is empty.
- **FR-009**: The **Event composer** form MUST collect: `title` (required), `location` (optional), `startDate`, `endDate`, `allDay` toggle, `calendarId` (picker over the calendars list, defaulting to the first writable calendar), and `alarmOffset` (one of the presets in `alarm-offsets.ts`: none / 5 min / 15 min / 1 hour). The Save button MUST be disabled when title is empty or when the chosen calendar is read-only. On Save, the composer MUST call `useCalendarEvents().createEvent(...)` (which wraps `expo-calendar.createEventAsync(...)`).
- **FR-010**: Tapping an event row MUST open the composer prefilled with the event's fields and an "Update" Save button that calls `updateEvent(eventId, details)`. Long-pressing a row MUST display a destructive confirmation prompt; confirming MUST call `deleteEvent(eventId)` and dismiss; cancelling MUST NOT call delete.
- **FR-011** *(Reminders tab)*: The Reminders tab MUST render four cards in this order: **Authorization** (separate entity), **Lists**, **Reminders query** (completed / incomplete / all toggle), and **Reminder composer** (title, due date, list, priority). The Lists card MUST call `expo-calendar.getCalendarsAsync('reminder')`. The query card MUST call `expo-calendar.getRemindersAsync(...)` with the appropriate status filter. The composer MUST call `expo-calendar.createReminderAsync(...)`. Edit / Delete affordances MUST mirror the Calendar tab's pattern.
- **FR-012**: On web, the screen MUST render an `IOSOnlyBanner` and disable all interactive controls; the two-tab structure MUST still render. On Android, the Calendar tab MUST function via `expo-calendar`'s Android implementation; the Reminders tab MUST render with a clear "Reminders limited / unavailable on Android" notice.

#### Hooks & Data Layer

- **FR-013**: A custom hook `src/modules/eventkit-lab/hooks/useCalendarEvents.ts` MUST wrap `expo-calendar` and expose: `status` (auth status), `requestAccess()`, `calendars` array, `refreshCalendars()`, `events` array, `range` state, `setRange(range)`, `refreshEvents()`, `createEvent(details)`, `updateEvent(id, details)`, `deleteEvent(id)`, `inFlight` flag, and `lastError`. The hook MUST cancel or discard in-flight operations on unmount and MUST NOT `setState` after unmount.
- **FR-014**: A custom hook `src/modules/eventkit-lab/hooks/useReminders.ts` MUST mirror the same shape for reminders: `status`, `requestAccess()`, `lists`, `refreshLists()`, `reminders`, `filter` ('completed' | 'incomplete' | 'all'), `setFilter(filter)`, `refreshReminders()`, `createReminder(details)`, `updateReminder(id, details)`, `deleteReminder(id)`, `inFlight`, `lastError`. Same unmount safety guarantees apply.
- **FR-015**: `date-ranges.ts` MUST export a typed `DateRangePreset` union (`'today' | 'next7' | 'next30'`) and a pure function `computeRange(preset, now)` returning `{ startDate: Date; endDate: Date }`. Computation MUST use the device's local time zone, MUST NOT drift across DST boundaries, and MUST be exhaustively unit-tested.
- **FR-016**: `alarm-offsets.ts` MUST export a typed `AlarmOffsetPreset` union (`'none' | '5min' | '15min' | '1hour'`), a labels map, and a pure function `toAlarmsArray(preset)` returning either `undefined` (for `'none'`) or `[{ relativeOffset: -<minutes> }]` matching `expo-calendar`'s alarm shape. Exhaustively unit-tested.

#### Config Plugin

- **FR-017**: A config plugin at `plugins/with-eventkit/` MUST add the four Info.plist usage-description keys to the iOS project: `NSCalendarsUsageDescription`, `NSCalendarsWriteOnlyAccessUsageDescription` (iOS 17+), `NSRemindersUsageDescription`, and `NSRemindersFullAccessUsageDescription` (iOS 17+). Each value MUST be a sensible default sentence describing the educational purpose of the showcase; a comment MUST point users at where to customize the strings.
- **FR-018**: The plugin MUST be idempotent: running it multiple times MUST produce identical Info.plist state. Re-running MUST NOT duplicate keys or values.
- **FR-019**: The plugin MUST coexist with all 23 prior plugins (002 … 036) without disturbing their entitlements, App Groups, extension targets, or Info.plist additions. Fixture tests MUST verify that enabling 037 alongside the prior 23 produces a project whose other plugin outputs are unchanged.
- **FR-020**: The plugin MUST be registered in `app.json` as exactly one new entry in the `plugins` array (parent count + 1).

#### Test Suite (JS-pure, Windows-runnable)

- **FR-021**: The following test files MUST exist and pass under `pnpm check`:
  - `test/unit/modules/eventkit-lab/date-ranges.test.ts` — every preset produces correct `startDate`/`endDate`; DST boundaries; pure function purity.
  - `test/unit/modules/eventkit-lab/alarm-offsets.test.ts` — every preset has a unique key, label, and correct `toAlarmsArray` output (including `undefined` for `'none'`).
  - `test/unit/modules/eventkit-lab/hooks/useCalendarEvents.test.tsx` — auth-request flow (`notDetermined → authorized`), denied path with Open Settings affordance, calendar refresh, events refresh per range, create/update/delete success and error paths, unmount cleanup.
  - `test/unit/modules/eventkit-lab/hooks/useReminders.test.tsx` — auth flow, lists refresh, query filter toggling (completed/incomplete/all), create/update/delete success and error paths, unmount cleanup.
  - `test/unit/modules/eventkit-lab/components/CalendarTab.test.tsx` — renders all five cards in order; tab-state preservation contract.
  - `test/unit/modules/eventkit-lab/components/RemindersTab.test.tsx` — renders all four cards in order; independent auth state.
  - `test/unit/modules/eventkit-lab/components/AuthorizationCard.test.tsx` — both entity types; all five status branches; Request Access vs Open Settings affordance gating.
  - `test/unit/modules/eventkit-lab/components/CalendarsList.test.tsx` — empty state; populated rows with title/type/color; Refresh invokes hook once.
  - `test/unit/modules/eventkit-lab/components/EventsQueryCard.test.tsx` — segment selection invokes range change; renders rows; empty state.
  - `test/unit/modules/eventkit-lab/components/EventRow.test.tsx` — renders title/location/times; all-day badge gating; tap → edit; long-press → destructive prompt.
  - `test/unit/modules/eventkit-lab/components/EventComposer.test.tsx` — required-field gating; allDay normalization; alarm-offset wiring; read-only calendar disables Save; create vs update mode.
  - `test/unit/modules/eventkit-lab/components/RemindersList.test.tsx` — empty state; populated rows; Refresh once.
  - `test/unit/modules/eventkit-lab/components/ReminderRow.test.tsx` — renders title/due/priority; long-press destructive prompt.
  - `test/unit/modules/eventkit-lab/components/ReminderComposer.test.tsx` — required-field gating; no-due-date is allowed; create vs update.
  - `test/unit/modules/eventkit-lab/components/IOSOnlyBanner.test.tsx` — renders the unsupported message.
  - `test/unit/modules/eventkit-lab/screen.test.tsx` — integration: tabs render; switching preserves state; banner gating.
  - `test/unit/modules/eventkit-lab/screen.android.test.tsx` — Calendar tab functional; Reminders tab disabled with notice.
  - `test/unit/modules/eventkit-lab/screen.web.test.tsx` — IOSOnlyBanner shown; all controls disabled; no bridge calls.
  - `test/unit/plugins/with-eventkit/index.test.ts` — adds the four Info.plist keys; idempotent across repeated runs; coexists with all 23 prior plugins.
  - `test/unit/modules/eventkit-lab/manifest.test.ts` — manifest valid; `id === 'eventkit-lab'`; `platforms === ['ios','android','web']`; `minIOS === '4.0'`.
- **FR-022**: All `expo-calendar` interactions MUST be mocked at the import boundary (Jest module mock of `expo-calendar`) so the suite is fully JS-pure and Windows-runnable. Hooks MUST be tested through these mocks; no direct mocking of internal RN bridges.
- **FR-023**: NO `eslint-disable` directives MAY appear anywhere in the feature's code or tests.

#### Quality Gates

- **FR-024**: `pnpm check` MUST be green (format, lint, typecheck, tests).
- **FR-025**: Constitution v1.1.0 MUST pass (no `eslint-disable` directives anywhere; `ThemedText` / `ThemedView` used; `Spacing` scale used; styles via `StyleSheet.create`; path aliases honored; TypeScript strict).
- **FR-026**: Existing project conventions MUST be followed: `ThemedText` / `ThemedView`, `Spacing`, `StyleSheet.create()`, path aliases, TypeScript strict, no inline magic numbers.
- **FR-027**: The change set MUST be purely additive: only `src/modules/registry.ts` (1-line edit, +1 entry) and `app.json` (+1 plugin entry) may touch existing files. No edits to features 002–036. A `package.json` change is permitted only to add `expo-calendar` as a dependency.
- **FR-028**: `pnpm format` MUST be run before the final commit so no formatting drift remains.

### Key Entities

- **AuthorizationStatus**: union of `'notDetermined' | 'denied' | 'restricted' | 'authorized' | 'writeOnly'` (calendar) and the parallel reminder statuses including `'fullAccess'` on iOS 17+. Drives the Authorization card UI and gates downstream affordances.
- **CalendarSummary**: `{ id, title, type, color, allowsModifications }`. Surface representation of an `expo-calendar` calendar; the `allowsModifications` flag gates the Event composer's Save button.
- **EventSummary**: `{ id, title, location, startDate, endDate, allDay, calendarId, alarmOffset? }`. Surface representation of a calendar event used by the events list, the row, and the composer.
- **ReminderSummary**: `{ id, title, dueDate?, listId, priority, completed }`. Surface representation of a reminder.
- **DateRangePreset**: `'today' | 'next7' | 'next30'`. Drives the events query date-range picker.
- **AlarmOffsetPreset**: `'none' | '5min' | '15min' | '1hour'`. Drives the composer's alarm picker.
- **EventKitLabState**: composite in-memory state held by `useCalendarEvents` and `useReminders` hooks consisting of authorization status, lists, query results, range/filter, `inFlight`, and `lastError`. All transitions MUST be deterministic and exhaustively covered by hook tests.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer with a clean install can open the EventKit Lab module on an iOS 4+ device, request calendar access, and see their calendars + an event list for the "Today" range in under 60 seconds from a cold app launch.
- **SC-002**: 100% of the JS-pure test suite (date-ranges, alarm-offsets, hooks, components, screens, plugin, manifest) passes on Windows under `pnpm check`, with no native or device dependencies.
- **SC-003**: The module is purely additive: a `git diff` against the parent branch (`036-passkit-wallet`) for files outside `specs/037-eventkit/`, `plugins/with-eventkit/`, `src/modules/eventkit-lab/`, and the new test directories shows changes only in `src/modules/registry.ts` (≤ 2 lines), `app.json` (≤ 1 plugin entry), and `package.json` / lockfile (only the `expo-calendar` dependency addition).
- **SC-004**: A developer can create, edit, and delete a calendar event entirely through the composer and row affordances in under 90 seconds on iOS, with the events list reflecting each change after refresh.
- **SC-005**: A developer can request reminders access independently from calendar access, observe both Authorization cards reflect distinct statuses correctly across all five status branches, and create + delete a reminder via the composer.
- **SC-006**: Running the app on Android exercises the Calendar tab end-to-end (auth, list, query, CRUD) with zero JavaScript exceptions; the Reminders tab renders its limitation notice gracefully.
- **SC-007**: Running the app on web shows the IOSOnlyBanner with disabled controls and zero JavaScript exceptions thrown over a 60-second exploration.
- **SC-008**: The 037 config plugin runs idempotently: a second `expo prebuild` produces no additional changes to the iOS Info.plist.
- **SC-009**: Enabling the 037 plugin alongside all 23 prior plugins (002–036) in fixture tests produces an Info.plist with the four new keys present and zero changes to any prior plugin's outputs.
- **SC-010**: The codebase contains zero new `eslint-disable` directives in any file added or modified by this feature.

---

## Assumptions

- **`expo-calendar` is the chosen abstraction** *(repeated for prominence)*: Rather than authoring a bespoke Swift bridge over EventKit, this module consumes `expo-calendar` (added via `npx expo install expo-calendar`). This trades a small amount of fidelity (the library's surface is slightly less than full EventKit) for cross-platform reach (iOS + Android) and dramatically lower native maintenance cost, consistent with the showcase's overall "use the maintained Expo library where one exists" philosophy.
- **iOS 17+ permission granularity**: Apple introduced `NSCalendarsWriteOnlyAccessUsageDescription` and `NSRemindersFullAccessUsageDescription` in iOS 17. The plugin MUST add both pre-17 and post-17 keys; the Authorization card MUST handle the `writeOnly` and `fullAccess` status branches. Older iOS versions ignore the new keys harmlessly.
- **Two independent permission entities**: Calendar and Reminders permissions are granted independently. The UI renders two independent Authorization cards and never assumes one implies the other.
- **No on-device verification on Windows**: All tests are JS-pure and Windows-runnable. End-to-end verification of actual EventKit interaction requires an iOS or Android device/simulator.
- **Date computation in local time zone**: Events and reminders are scheduled in the user's local time zone; `date-ranges.ts` computes presets accordingly and is verified to be DST-stable in unit tests.
- **All-day event normalization**: Per `expo-calendar`'s convention, all-day events have their `startDate` and `endDate` normalized to date boundaries; the composer enforces this when `allDay` is true.
- **No alarm when offset is "none"**: The composer omits the `alarms` field entirely when the offset preset is `'none'`, rather than passing an empty array.
- **No recurrence rules**: Recurring events / reminders are out of scope for this iteration; the composer creates single-instance entities only. Recurrence support is captured as a future enhancement.
- **No attendees / invitees**: Event invitee management (`PKEventStoreSourceTypeExchange`-style flows) is out of scope.
- **Web is non-functional**: `expo-calendar` does not provide a meaningful web implementation in this showcase; the web variant is purely the IOSOnlyBanner. No polyfill or fallback storage is implemented.
- **Reminders on Android**: `expo-calendar`'s reminders surface on Android is limited / undocumented; the Reminders tab honestly reflects this rather than emulating an iOS-only API.
- **`pnpm format` is mandatory before commit**: Per project policy, the final commit MUST be preceded by `pnpm format` to eliminate formatting drift.
- **Constitution v1.1.0 applies**: All constitution rules apply; `eslint-disable` is forbidden in this feature.

---

## Out of Scope

- Recurrence rules (`RRULE` / repeating events / repeating reminders).
- Attendees, invitees, response tracking.
- iCloud / Exchange / CalDAV account configuration.
- Calendar / list creation, editing, or deletion (only events and reminders are CRUD'd here; calendars and lists are read-only enumerations).
- Subscription calendars (`expo-calendar.openEventInCalendarAsync`-style deep links beyond what the row affordance directly invokes).
- Authoring a bespoke native EventKit bridge (deferred to `expo-calendar`).
- A web fallback that emulates EventKit (out of scope; the web variant is the iOS/Android-only banner).
- Push-driven event/reminder updates.
- Modifications to features 002–036 (other than the single-line registry edit and the single new plugin entry).

---

## Reporting

- **`SPECIFY_FEATURE_DIRECTORY`**: `specs/037-eventkit`
- **`SPEC_FILE`**: `specs/037-eventkit/spec.md`
- **Branch**: `037-eventkit` (already created from `036-passkit-wallet`; no new branch was created by this command)
- **Next phase**: `/speckit.plan` (no clarifications outstanding; informed defaults documented in Assumptions).
