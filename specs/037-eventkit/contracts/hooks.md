# Contract — `useCalendarEvents` and `useReminders` hooks

**Feature**: 037-eventkit
**See**: [spec.md](../spec.md) FR-013, FR-014, FR-022
**See**: [data-model.md](../data-model.md) Entity 8 (`UseCalendarEventsState`, `UseRemindersState`)
**See**: [research.md](../research.md) §1 (R-A serialisation), §4 (R-D classification)

Implementation files:

- `src/modules/eventkit-lab/hooks/useCalendarEvents.ts`
- `src/modules/eventkit-lab/hooks/useReminders.ts`

## Invariants — common (apply to BOTH hooks)

- **H1**. Each hook is the **only public surface** consumed by
  `screen.tsx` / `screen.android.tsx` / `screen.web.tsx` and by the
  components in its tab. Components MUST NOT import `expo-calendar`
  directly. (Static lint check optional but recommended.)
- **H2**. Default state on mount mirrors data-model Entity 8
  defaults (`status: 'notDetermined'`, empty arrays,
  `inFlight: { kind: 'idle' }`, `lastError: { kind: 'none' }`).
- **H3**. On mount, each hook calls its respective
  `getXxxPermissionsAsync()` exactly once. If the resolved status
  is `'authorized'` (or `'writeOnly'` / `'fullAccess'`), the hook
  also kicks off the corresponding initial refresh
  (`refreshCalendars` + `refreshEvents` for the calendar hook;
  `refreshLists` + `refreshReminders` for the reminders hook).
- **H4**. On unmount, the hook flips an internal `mounted` ref to
  `false`; every subsequent dispatch is a no-op (zero post-unmount
  setState calls — carryover from 030–036 SC discipline).
- **H5**. **Mutating actions** (`requestAccess`, `createXxx`,
  `updateXxx`, `deleteXxx`) are serialised through a hook-scoped
  closure-scoped promise chain (`enqueue(work)`) per R-A. Read
  actions (`refreshXxx`, `setRange`, `setFilter`) are NOT
  serialised.
- **H6**. **Error classification (R-D)** — every action that calls
  `expo-calendar` is `try`/`catch`-wrapped; the classifier
  `classifyEventKitError(e: unknown)` returns one of:
    - `{ kind: 'denied', message }` (permission denied at runtime)
    - `{ kind: 'restricted', message }` (parental controls /
      MDM / Web)
    - `{ kind: 'write-only', message }` (synthesised when status
      blocks a read attempt; not from a thrown error)
    - `{ kind: 'not-found', message }` (id no longer present)
    - `{ kind: 'invalid-input', message }` (synthesised by the
      composer; not from a thrown error)
    - `{ kind: 'failed', message }` (`message` truncated to 120
      chars).
- **H7**. On web (`Platform.OS === 'web'`), each hook short-circuits
  to `status: 'restricted'`, empty arrays, and rejects every
  mutating action with `lastError: { kind: 'restricted', message:
  'Web platform does not support EventKit.' }` WITHOUT importing
  or invoking `expo-calendar`. The library is not pulled into the
  web bundle's import closure (verified statically by
  `screen.web.test.tsx`).
- **H8**. Setting `lastError` does NOT clear the data fields
  (calendars, events, lists, reminders); a denied refresh that
  follows a successful refresh keeps the previous data visible
  while surfacing the error.

## Invariants — `useCalendarEvents`-specific

- **C1**. `status` is `AuthorizationStatus`. On iOS 17+ the
  `'writeOnly'` branch surfaces; on older iOS or non-iOS the value
  is one of the four pre-17 values.
- **C2**. `range` defaults to `'today'`. `setRange(next)`
  synchronously updates the field AND kicks off `refreshEvents()`.
- **C3**. `createEvent(draft)` requires `status` to be
  `'authorized'` OR `'writeOnly'` (write paths are valid in both).
  `refreshEvents()` and the `events` array require `'authorized'`
  (write-only blocks reads); attempting to refresh while
  write-only sets `lastError: { kind: 'write-only', ... }` without
  invoking `expo-calendar`.
- **C4**. `createEvent` / `updateEvent` translate
  `EventDraft.alarmOffset` via `toAlarmsArray(...)` from
  `alarm-offsets.ts` and pass either an `alarms` array or omit
  the field entirely (when preset is `'none'`).
- **C5**. `createEvent` normalises `allDay`-true drafts: start →
  00:00:00.000, end → 23:59:59.999 of the respective dates.

## Invariants — `useReminders`-specific

- **R1**. `status` is `ReminderAuthorizationStatus`. On iOS 17+ the
  `'fullAccess'` branch surfaces.
- **R2**. `filter` defaults to `'incomplete'`. `setFilter(next)`
  synchronously updates the field AND kicks off
  `refreshReminders()`.
- **R3**. `refreshReminders()` calls `getRemindersAsync(...)`
  passing the appropriate status filter:
    - `'incomplete'` → `null` start/end + `status: 'incomplete'`
    - `'completed'` → start = far past, end = now,
      `status: 'completed'`
    - `'all'` → unfiltered
- **R4**. `createReminder(draft)` allows `dueDate` to be `undefined`;
  the call to `createReminderAsync` omits the field entirely in
  that case.
- **R5**. On Android, `expo-calendar`'s reminders surface is
  limited; the hook MAY return `status: 'restricted'` if the
  library reports unsupported. The screen-level
  `AndroidRemindersNotice` is rendered regardless.

## Test surface (sketch)

`test/unit/modules/eventkit-lab/hooks/useCalendarEvents.test.tsx`:

- Mount → `getCalendarPermissionsAsync` called once; default state
  matches H2.
- `requestAccess()` happy path → status transitions through
  `notDetermined → authorized`; `refreshCalendars` + `refreshEvents`
  fired.
- `requestAccess()` denial → `status: 'denied'`,
  `lastError: { kind: 'denied' }`.
- iOS 17+ write-only: `status: 'writeOnly'`; `refreshEvents()`
  short-circuits with `lastError: { kind: 'write-only' }`.
- `setRange('next7')` → range updated, `refreshEvents` called with
  the computed range.
- `createEvent(draft)` happy path → `createEventAsync` invoked;
  `refreshEvents` fired on success.
- `createEvent` with `allDay: true` → start/end normalised before
  the bridge call.
- `createEvent` with `alarmOffset: 'none'` → `alarms` field omitted;
  with `'15min'` → `alarms: [{ relativeOffset: -15 }]`.
- `updateEvent` / `deleteEvent` happy + error paths.
- Concurrent `createEvent` calls produce two `expo-calendar`
  invocations in submission order (R-A).
- Unmount during in-flight `createEvent` → zero post-unmount
  setState calls.
- Error classifier: synthetic errors with each shape produce the
  expected `lastError.kind`.

`test/unit/modules/eventkit-lab/hooks/useReminders.test.tsx`:

- Mount → `getRemindersPermissionsAsync` called once.
- `requestAccess()` flows including iOS 17+ `'fullAccess'`
  mapping.
- `setFilter('completed' | 'incomplete' | 'all')` invokes
  `getRemindersAsync` with the correct predicate shape.
- `createReminder` with and without `dueDate`.
- `updateReminder`, `deleteReminder` happy + error paths.
- Concurrent mutations produce ordered library invocations.
- Unmount safety mirrors the calendar hook.
