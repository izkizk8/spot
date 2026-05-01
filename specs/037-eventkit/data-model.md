# Phase 1 Data Model — EventKit (Calendar + Reminders) Module (037)

**Companion to**: [plan.md](./plan.md) §"Project Structure" + spec.md §"Key Entities"

This document captures the typed shape and invariants for every
entity transmitted, rendered, or held in memory by feature 037.
JS-side type definitions live in
`src/modules/eventkit-lab/types.ts` (entities 1–8) plus the two
hook files (entities 7–8 reference the hook return shapes).

There is **no JS-side persistent store** and **no on-disk
persistence** (v1). All state is in-memory, scoped to the screen's
lifetime. The system's EventKit / Calendar Provider stores own the
persisted events and reminders; the module reads and writes them
read-write via `expo-calendar` and never persists copies to disk.

---

## Entity 1 — `AuthorizationStatus` (calendar)

Surface representation of the calendar permission state, normalised
from `expo-calendar`'s permission response.

### Type

```ts
export type AuthorizationStatus =
  | 'notDetermined'
  | 'denied'
  | 'restricted'
  | 'authorized'
  | 'writeOnly';            // iOS 17+ only
```

### Invariants

- `'writeOnly'` is iOS-17-only; on older iOS or non-iOS platforms
  the hook MUST NOT produce this value.
- The Authorization card maps each value to a distinct UI branch:
  `notDetermined` → "Request Access" button visible;
  `denied` / `restricted` → "Open Settings" link visible;
  `authorized` / `writeOnly` → neither button; description copy
  surfaces the granted level.
- Transitions are produced ONLY by the hook in response to:
  (a) initial mount (`getCalendarPermissionsAsync`),
  (b) `requestAccess()` resolving,
  (c) the screen returning from background (deferred; v1 does not
  re-poll on focus).

---

## Entity 2 — `ReminderAuthorizationStatus`

Surface representation of the reminders permission state.

### Type

```ts
export type ReminderAuthorizationStatus =
  | 'notDetermined'
  | 'denied'
  | 'restricted'
  | 'authorized'
  | 'fullAccess';           // iOS 17+ only
```

### Invariants

- `'fullAccess'` is iOS-17-only; on older iOS or non-iOS platforms
  the hook MUST NOT produce this value.
- The Authorization card mapping mirrors Entity 1's mapping; the
  description copy under `authorized` / `fullAccess` differs.
- The reminders entity is independent of the calendar entity. A
  user can be `authorized` for one and `denied` for the other.

---

## Entity 3 — `CalendarSummary`

Surface representation of an `expo-calendar` calendar (or reminder
list, when the entity type is `'reminder'`).

### Type

```ts
export interface CalendarSummary {
  readonly id: string;
  readonly title: string;
  readonly type: string;             // e.g., 'local', 'caldav', 'subscribed'
  readonly color: string;            // hex string
  readonly allowsModifications: boolean;
}
```

### Invariants

- `id` is the stable identifier returned by `expo-calendar`; the
  composer uses it as the target calendar / list when creating a
  new event or reminder.
- `allowsModifications === false` disables the composer's Save
  button when this calendar is selected (FR-009 + spec §"Edge
  Cases").
- `color` is a `#RRGGBB` hex string; the row renders a colour swatch
  using this value (no theme token; calendars own their own colour).
- `CalendarSummary` is reused for reminder lists with no shape
  change; `expo-calendar` returns the same record shape from
  `getCalendarsAsync('reminder')`.

---

## Entity 4 — `EventSummary`

Surface representation of a calendar event enumerated via
`getEventsAsync(...)`.

### Type

```ts
export interface EventSummary {
  readonly id: string;
  readonly title: string;
  readonly location: string;          // empty string when absent
  readonly startDate: Date;
  readonly endDate: Date;
  readonly allDay: boolean;
  readonly calendarId: string;
  readonly alarmOffsetMinutes?: number; // negative number = before start
}
```

### Invariants

- `startDate <= endDate` always.
- `allDay === true` ⇒ `startDate.getHours() === 0` and
  `endDate.getHours() === 23` (composer-enforced normalisation;
  external events from the system may not satisfy the second
  condition, in which case the all-day badge is gated on the
  `allDay` flag alone, not on the time arithmetic).
- `alarmOffsetMinutes`, when present, is the negative number of
  minutes BEFORE the start (e.g., `-15` for "15 minutes before").
  Mapped from / to `expo-calendar`'s `alarms` array shape via
  `alarm-offsets.ts`.
- `EventSummary` is used by the events list, the row component,
  and the composer's prefilled state.

---

## Entity 5 — `ReminderSummary`

Surface representation of a reminder enumerated via
`getRemindersAsync(...)`.

### Type

```ts
export interface ReminderSummary {
  readonly id: string;
  readonly title: string;
  readonly dueDate?: Date;
  readonly listId: string;
  readonly priority: 'none' | 'low' | 'medium' | 'high';
  readonly completed: boolean;
}
```

### Invariants

- `dueDate` is optional; the row renders without a due-date badge
  when absent (spec §"Edge Cases").
- `priority` is mapped from `expo-calendar`'s numeric priority
  (`0`/`1`/`5`/`9`) into the four-level union for display. The
  reverse mapping (preset → numeric) is performed by the composer
  on Save.
- `completed` drives the query filter: `completed === true` →
  matched by the `'completed'` filter; `false` → `'incomplete'`;
  always matched by `'all'`.

---

## Entity 6 — `DateRangePreset` and `AlarmOffsetPreset`

Pure helper unions exported from `date-ranges.ts` and
`alarm-offsets.ts`.

### Types

```ts
export type DateRangePreset = 'today' | 'next7' | 'next30';

export type AlarmOffsetPreset = 'none' | '5min' | '15min' | '1hour';
```

### Invariants

- `DateRangePreset` is the EXACT set of segments rendered by
  `EventsQueryCard`. Adding a new preset requires updating the
  segmented control's labels and the `computeRange` exhaustive
  switch (TypeScript `never` check enforces both).
- `AlarmOffsetPreset` is the EXACT set of options in the composer's
  alarm picker. `toAlarmsArray('none')` returns `undefined`; every
  other value returns `[{ relativeOffset: -<minutes> }]`.

### Helper signatures

```ts
export function computeRange(
  preset: DateRangePreset,
  now: Date,
): { startDate: Date; endDate: Date };

export const ALARM_OFFSET_LABELS: Readonly<Record<AlarmOffsetPreset, string>>;

export function toAlarmsArray(
  preset: AlarmOffsetPreset,
): readonly [{ readonly relativeOffset: number }] | undefined;
```

---

## Entity 7 — `EventDraft` and `ReminderDraft`

Composer-internal types used to capture form state before submitting
to the hook.

### Types

```ts
export interface EventDraft {
  readonly id?: string;                 // present iff edit mode
  title: string;
  location: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  calendarId: string;
  alarmOffset: AlarmOffsetPreset;
}

export interface ReminderDraft {
  readonly id?: string;                 // present iff edit mode
  title: string;
  dueDate?: Date;
  listId: string;
  priority: 'none' | 'low' | 'medium' | 'high';
}
```

### Invariants

- `id` distinguishes create vs update mode at the call site:
  `id === undefined` → `createEvent(draft)`;
  `id` present → `updateEvent(id, draft)`.
- `title.trim().length > 0` is the Save-enable condition for both
  drafts.
- For `EventDraft`, `allDay === true` triggers a normalisation step
  on Save (`startDate.setHours(0,0,0,0)`,
  `endDate.setHours(23,59,59,999)`).
- The composer DOES NOT mutate the source `EventSummary` /
  `ReminderSummary` directly; it copies into the draft on edit-open
  and replaces on Save.

---

## Entity 8 — `EventKitLabState` (composite)

Composite in-memory state held by `useCalendarEvents` and
`useReminders`. The two hooks have parallel shapes; the differences
are in the entity-specific fields (events vs reminders, range vs
filter).

### `useCalendarEvents` return

```ts
export interface UseCalendarEventsState {
  readonly status: AuthorizationStatus;
  readonly calendars: readonly CalendarSummary[];
  readonly events: readonly EventSummary[];
  readonly range: DateRangePreset;
  readonly inFlight:
    | { kind: 'idle' }
    | { kind: 'request-access' }
    | { kind: 'refresh-calendars' }
    | { kind: 'refresh-events' }
    | { kind: 'create' }
    | { kind: 'update'; id: string }
    | { kind: 'delete'; id: string };
  readonly lastError:
    | { kind: 'none' }
    | { kind: 'denied'; message: string }
    | { kind: 'restricted'; message: string }
    | { kind: 'write-only'; message: string }
    | { kind: 'not-found'; message: string }
    | { kind: 'invalid-input'; message: string }
    | { kind: 'failed'; message: string };

  readonly requestAccess: () => Promise<void>;
  readonly refreshCalendars: () => Promise<void>;
  readonly setRange: (next: DateRangePreset) => void;
  readonly refreshEvents: () => Promise<void>;
  readonly createEvent: (draft: EventDraft) => Promise<void>;
  readonly updateEvent: (id: string, draft: EventDraft) => Promise<void>;
  readonly deleteEvent: (id: string) => Promise<void>;
}
```

### `useReminders` return

```ts
export interface UseRemindersState {
  readonly status: ReminderAuthorizationStatus;
  readonly lists: readonly CalendarSummary[];
  readonly reminders: readonly ReminderSummary[];
  readonly filter: 'completed' | 'incomplete' | 'all';
  readonly inFlight: /* same shape as above with reminder kinds */;
  readonly lastError: /* same shape as above */;

  readonly requestAccess: () => Promise<void>;
  readonly refreshLists: () => Promise<void>;
  readonly setFilter: (next: 'completed' | 'incomplete' | 'all') => void;
  readonly refreshReminders: () => Promise<void>;
  readonly createReminder: (draft: ReminderDraft) => Promise<void>;
  readonly updateReminder: (id: string, draft: ReminderDraft) => Promise<void>;
  readonly deleteReminder: (id: string) => Promise<void>;
}
```

### Invariants

- **Default state on mount**:
  ```ts
  {
    status: 'notDetermined',
    calendars: [],   // (or lists: [])
    events: [],      // (or reminders: [])
    range: 'today',  // (or filter: 'incomplete')
    inFlight: { kind: 'idle' },
    lastError: { kind: 'none' },
  }
  ```
- **On mount**, each hook calls its respective
  `getXxxPermissionsAsync()` once to populate `status`. If the
  result is `'authorized'` (or `'writeOnly'` / `'fullAccess'`), the
  hook also kicks off `refreshCalendars` (or `refreshLists`) and
  the corresponding query refresh.
- **On unmount**, each hook flips an internal `mounted` ref to
  `false`; every subsequent dispatch is a no-op (zero post-unmount
  setState calls — carryover from 030–036 SC discipline).
- **Mutating actions** (`createXxx`, `updateXxx`, `deleteXxx`,
  `requestAccess`) are serialised through the closure-scoped promise
  chain (R-A). Read actions (`refreshXxx`, `setRange`, `setFilter`)
  are NOT serialised.
- **`setRange` / `setFilter`** dispatch a state update synchronously
  AND kick off a refresh. The refresh is debounced internally if
  rapid toggles occur (a single `inFlight: { kind: 'refresh-events' }`
  marker covers an in-progress refresh; subsequent toggles update
  the desired range and the most-recent refresh resolves with the
  most-recent range's data).
- **Error transitions**: setting `lastError` clears no other field;
  successful actions set `lastError: { kind: 'none' }` on resolve.

---

## Cross-entity invariants

- The two hooks are completely independent; neither imports the
  other. A status change in one MUST NOT cascade to the other.
- The composer (`EventComposer` / `ReminderComposer`) consumes only
  the hook's public API; it MUST NOT call `expo-calendar` directly.
- `EventSummary.calendarId` always matches some
  `CalendarSummary.id` from the same `calendars` array (within a
  single hook lifecycle). Stale `calendarId` references (after a
  user deletes a calendar in Settings) surface as the row's badge
  falling back to a generic "Unknown calendar" label without
  throwing.
- `ReminderSummary.listId` mirrors the same invariant against the
  `lists` array.
- Web platform: both hooks short-circuit to a fixed
  `status: 'restricted'` (or a dedicated `'unsupported'` value if
  the spec adds one in a future iteration) and never invoke
  `expo-calendar`. v1 reuses `'restricted'` for simplicity.

---

## Summary table

| # | Entity | Owner file |
|---|--------|------------|
| 1 | `AuthorizationStatus` | `src/modules/eventkit-lab/types.ts` |
| 2 | `ReminderAuthorizationStatus` | `src/modules/eventkit-lab/types.ts` |
| 3 | `CalendarSummary` | `src/modules/eventkit-lab/types.ts` |
| 4 | `EventSummary` | `src/modules/eventkit-lab/types.ts` |
| 5 | `ReminderSummary` | `src/modules/eventkit-lab/types.ts` |
| 6 | `DateRangePreset`, `AlarmOffsetPreset` | `date-ranges.ts`, `alarm-offsets.ts` |
| 7 | `EventDraft`, `ReminderDraft` | `src/modules/eventkit-lab/types.ts` |
| 8 | `UseCalendarEventsState`, `UseRemindersState` | `hooks/useCalendarEvents.ts`, `hooks/useReminders.ts` |
