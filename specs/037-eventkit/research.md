# Phase 0 Research — EventKit (Calendar + Reminders) Module (037)

**Companion to**: [plan.md](./plan.md) §"Resolved decisions"

This document records the code-level detail behind plan-level
decisions **R-A** through **R-F**. Spec-level decisions were already
approved in `spec.md`; they are not re-litigated here.

All sections below follow the **Decision / Rationale / Alternatives
considered** template.

---

## §1 — R-A: Hook-level serialisation of concurrent mutations

### Decision

Each hook (`useCalendarEvents`, `useReminders`) owns a hook-scoped
promise chain inherited verbatim from features 030–036:

```ts
let chain: Promise<unknown> = Promise.resolve();

function enqueue<T>(work: () => Promise<T>): Promise<T> {
  const next = chain.then(work, work); // run regardless of prior outcome
  chain = next.catch(() => undefined); // don't poison the chain
  return next;                          // preserve original rejection for the caller
}
```

Every **mutating** action (`createEvent`, `updateEvent`, `deleteEvent`,
`requestAccess`, and the reminder counterparts) wraps its
`expo-calendar` call through `enqueue(...)`. The **read-only** actions
(`refreshCalendars`, `refreshEvents`, `refreshLists`,
`refreshReminders`) are NOT serialised: they are pure reads, and
forcing them through the chain would unnecessarily delay UI updates
after a heavy mutation (e.g., delaying the events refresh that
follows a successful create).

### Rationale

- Two rapid Save taps on `EventComposer` could otherwise stack two
  `createEventAsync` calls; the second could land before the first
  resolves and produce duplicate events. Serialising at the hook
  ensures the second call only fires AFTER the first has resolved
  (success or failure), giving tests the deterministic invariant:
  "two back-to-back creates produce two `expo-calendar` invocations
  in submission order".
- Inheriting the helper verbatim from 030–036 reduces reviewer
  cognitive load and reuses the same flake-free guarantee prior
  hook tests demonstrated.
- Errors are preserved for the caller but the chain is detoxified
  by `chain.catch(...)` so a rejected call does not block subsequent
  ones.

### Alternatives considered

- **No serialisation** — rejected; double-create is observably broken
  and surfaces as flaky tests on slow simulators.
- **Serialise reads too** — rejected; reads must remain responsive
  even while a long-running create is in flight (the user can still
  toggle the date-range while a save is processing).
- **Native-side queueing** — rejected; `expo-calendar` is the
  abstraction boundary, and we do not author native code in this
  feature.

---

## §2 — R-B: Library choice — consume `expo-calendar` directly

### Decision

The module consumes the maintained
[`expo-calendar`](https://docs.expo.dev/versions/latest/sdk/calendar/)
library directly via standard ES imports. No project-owned bridge
file family (`src/native/eventkit*.ts`) is authored. Dependency is
added via `npx expo install expo-calendar` so the resolved version
matches Expo SDK 55. The mock seam in tests is the upstream module
name (`jest.mock('expo-calendar', ...)`), not a project-owned wrapper.

### Rationale

- `expo-calendar` is maintained by the Expo team, ships iOS + Android
  implementations, and exposes the precise surface this feature needs:
  - Authorization: `getCalendarPermissionsAsync`,
    `requestCalendarPermissionsAsync`,
    `getRemindersPermissionsAsync`,
    `requestRemindersPermissionsAsync`.
  - Read: `getCalendarsAsync(entityType?)`, `getEventsAsync(...)`,
    `getRemindersAsync(...)`.
  - Write: `createEventAsync`, `updateEventAsync`, `deleteEventAsync`;
    `createReminderAsync`, `updateReminderAsync`,
    `deleteReminderAsync`.
- Authoring a custom Swift bridge over EventKit would duplicate the
  library's iOS implementation with no fidelity gain at the surface
  this feature exercises (the spec's Out of Scope §"Out of Scope"
  excludes recurrence rules, attendees, and CalDAV configuration —
  exactly the parts of EventKit that `expo-calendar` simplifies).
- Matches the showcase's overall "use the maintained Expo library
  where one exists" philosophy (spec §"Assumptions" §1, repeated for
  prominence).

### Alternatives considered

- **Hand-written Swift + Kotlin bridges** (036's pattern) — rejected;
  doubles the native maintenance surface, requires authoring iOS +
  Android implementations of permission flows, calendar enumeration,
  event predicates, and the alarm shape. No pedagogical gain because
  EventKit's interesting surface (recurrence, attendees) is out of
  scope.
- **`react-native-calendar-events`** (third-party) — rejected; not
  Expo-config-plugin-aware, requires manual Pod / Gradle linking,
  not maintained on the same release cadence as Expo SDK.
- **iOS-only via `expo-calendar` + Android stub** — rejected; the
  spec explicitly lists Android in `platforms` (story P3) so the
  Calendar tab MUST function on Android.

---

## §3 — R-C: Authorization card state machine, parameterised

### Decision

Both Authorization cards consume the same `<AuthorizationCard
entity="calendar" | "reminder" />` component, parameterised by the
entity type. Each entity maps `expo-calendar`'s permission status
into a stable union:

```ts
export type AuthorizationStatus =
  | 'notDetermined'
  | 'denied'
  | 'restricted'
  | 'authorized'
  | 'writeOnly';            // calendar only, iOS 17+

export type ReminderAuthorizationStatus =
  | 'notDetermined'
  | 'denied'
  | 'restricted'
  | 'authorized'
  | 'fullAccess';           // reminders, iOS 17+
```

The card UI is identical except for the entity name and the
description copy under `authorized` / `writeOnly` / `fullAccess`.

The two cards are rendered by independent hook instances
(`useCalendarEvents` + `useReminders`) and never share state. A
user can be `authorized` for calendar and `denied` for reminders
(or any other combination); the UI always reflects this honestly
(spec §"EventKit Permission Reality Check").

### Rationale

- Two separate iOS permission entities require two separate state
  machines; conflating them would surface as broken UI states (e.g.,
  showing the Reminders empty state when the user actually has
  reminders denied).
- Parameterising the card avoids component duplication while
  preserving the spec's requirement that each tab render its own
  card (FR-006).
- The `writeOnly` (calendar) and `fullAccess` (reminders) branches
  are first-class values; on iOS < 17 they simply never appear.

### Alternatives considered

- **Two independent components (`CalendarAuthCard`,
  `ReminderAuthCard`)** — rejected; ~95% duplication.
- **One unified status enum** — rejected; the iOS 17+ write-only
  vs full-access semantics are entity-specific.

---

## §4 — R-D: Error classification table

### Decision

Each hook exports a pure classifier:

```ts
export function classifyEventKitError(e: unknown): HookLastError {
  // ...
}
```

with the following table (informal):

| Source | `lastError.kind` | Notes |
|--------|------------------|-------|
| `e?.code === 'ERR_CALENDAR_PERMISSIONS_DENIED'` | `'denied'` | Surface "Open Settings" |
| `e?.code === 'ERR_CALENDAR_PERMISSIONS_RESTRICTED'` | `'restricted'` | Surface "Open Settings" |
| Status returned write-only on a read attempt | `'write-only'` | Internally produced, not from a thrown error |
| `e?.code === 'ERR_CALENDAR_NOT_FOUND'` (or library-specific not-found) | `'not-found'` | Surface "Item no longer exists" |
| Validation failure inside the composer (synchronous) | `'invalid-input'` | Not from a thrown error; from form validation |
| Anything else | `'failed'` | `message` truncated to 120 chars |
| `e === undefined` | `'none'` | No-op |

The classifier is a pure function and is tested in isolation against
synthetic errors of each shape.

### Rationale

- A typed classifier keeps every component's "show error" branch
  exhaustive and refactor-safe.
- Truncating arbitrary `message` strings to 120 chars prevents
  unbounded growth in the UI when the library surfaces verbose
  rejection messages.
- The `'write-only'` and `'invalid-input'` kinds are produced
  internally (not from thrown errors), but live in the same union
  for uniformity at the consumer.

### Alternatives considered

- **Throwing typed error classes** (036's pattern) — partially
  applicable. We prefer a flat `lastError` discriminated union over
  five typed classes here because `expo-calendar` does NOT consistently
  throw typed instances; it throws `Error` with a `code` string. A
  classifier translates that into our union without forcing every
  consumer to know the library's error idioms.
- **String-only `lastError: string | null`** — rejected; loses the
  distinction between "permission denied" and "item not found",
  which the UI needs to render different affordances.

---

## §5 — R-E: DST-stable date-range computation

### Decision

`date-ranges.ts` computes presets in the device's local time zone
using calendar-day arithmetic, NOT millisecond addition:

```ts
export type DateRangePreset = 'today' | 'next7' | 'next30';

export function computeRange(
  preset: DateRangePreset,
  now: Date,
): { startDate: Date; endDate: Date } {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  switch (preset) {
    case 'today':
      end.setDate(start.getDate() + 1);
      end.setMilliseconds(end.getMilliseconds() - 1);
      return { startDate: start, endDate: end };
    case 'next7':
      end.setDate(start.getDate() + 7);
      end.setMilliseconds(end.getMilliseconds() - 1);
      return { startDate: start, endDate: end };
    case 'next30':
      end.setDate(start.getDate() + 30);
      end.setMilliseconds(end.getMilliseconds() - 1);
      return { startDate: start, endDate: end };
  }
}
```

DST-stability is verified by exhaustive unit tests with `now()`
fixtures pinned to known DST-boundary dates (US: 2025-03-09
spring-forward, 2025-11-02 fall-back; EU: 2025-03-30, 2025-10-26).

### Rationale

- Naive `+ 24 * 60 * 60 * 1000` arithmetic crosses DST boundaries
  incorrectly: on the day of spring-forward the user sees a 23-hour
  range; on fall-back, a 25-hour range. Off-by-one events would
  surface inconsistently.
- `setDate(d.getDate() + N)` is documented to handle DST and
  end-of-month rollovers correctly in JavaScript's `Date` semantics.
- Pinning `now()` in tests (via `jest.useFakeTimers().setSystemTime`
  or by passing `now` directly to the pure function) makes the test
  deterministic across CI environments.

### Alternatives considered

- **Use `date-fns`** — rejected; adds a runtime dependency for two
  preset computations. The pure-function approach above is ~25 LOC.
- **Use UTC throughout** — rejected; events scheduled "today" by
  the user are bounded by their local-day, not UTC-day.

---

## §6 — R-F: Plugin shape — four Info.plist keys, one mod

### Decision

`plugins/with-eventkit/index.ts` is a single `withInfoPlist` mod
that sets each of the four usage-description keys ONLY when absent
(preserving operator-supplied values):

```ts
import { ConfigPlugin, withInfoPlist } from '@expo/config-plugins';

const KEYS = {
  NSCalendarsUsageDescription:
    'This module demonstrates EventKit calendar access for educational purposes.',
  NSCalendarsWriteOnlyAccessUsageDescription:
    'This module may demonstrate write-only calendar event creation on iOS 17+.',
  NSRemindersUsageDescription:
    'This module demonstrates EventKit reminders access for educational purposes.',
  NSRemindersFullAccessUsageDescription:
    'This module demonstrates full reminders access on iOS 17+ for educational purposes.',
} as const;

const withEventKit: ConfigPlugin = (config) =>
  withInfoPlist(config, (cfg) => {
    for (const [key, defaultCopy] of Object.entries(KEYS)) {
      if (typeof cfg.modResults[key] !== 'string' || cfg.modResults[key].trim() === '') {
        cfg.modResults[key] = defaultCopy;
      }
    }
    return cfg;
  });

export default withEventKit;
```

The plugin does NOT touch entitlements, frameworks, build phases,
or any non-Info.plist surface.

### Rationale

- `expo-calendar` already declares its own iOS pod / Gradle linkage
  via the library's own config-plugin contributions; the only
  remaining iOS authoring step is the four Info.plist keys per
  Apple's privacy requirements.
- Setting only-when-absent preserves operator customisation (e.g.,
  a real product would replace the educational copy with
  user-facing language matching their app).
- A single mod keeps the plugin auditable in ~30 LOC and makes
  idempotency obvious (re-running on a populated config is a no-op
  for each key).

### Alternatives considered

- **Use four separate `withInfoPlist` invocations** — rejected;
  forces four mod traversals where one suffices, and clutters the
  diff in `expo prebuild` logs.
- **Force overwrite of operator values** — rejected; would defeat
  the spec's "sensible defaults; comment points at where to
  customize" requirement (FR-017).

---

## §7 — Pass-through library version pinning

### Decision

`expo-calendar` is installed with `npx expo install expo-calendar`
so the resolved version matches the SDK 55 entry in Expo's bundled
modules list. The `package.json` line is committed verbatim with the
caret-prefixed version that the install command produces.

### Rationale

- `npx expo install` is the documented entry point for adding any
  Expo SDK module; it consults `expo` package's bundled version map
  and pins to the SDK-compatible version.
- Hard-pinning vs caret-pinning is decided by the existing project
  convention in `package.json` (other Expo SDK modules already
  declared there); we follow that convention without altering it.

### Alternatives considered

- **Hand-edit `package.json` with a guessed version** — rejected;
  drifts from the SDK 55 bundled-modules pin.
- **Use `pnpm add expo-calendar`** — rejected; bypasses the SDK
  version map and risks installing an SDK-56-only version.

---

## Summary table

| ID | Topic | Outcome |
|----|-------|---------|
| R-A | Mutation serialisation | Closure-scoped promise chain inherited from 030–036, applied per-hook |
| R-B | Library choice | `expo-calendar` directly; no project-owned bridge |
| R-C | Auth state machine | Parameterised `AuthorizationCard`, two independent hook instances |
| R-D | Error classification | Pure `classifyEventKitError` with a 7-kind discriminated union |
| R-E | DST-stable presets | `setDate(...)` arithmetic; pinned-`now()` tests for spring-forward + fall-back |
| R-F | Plugin shape | Single `withInfoPlist` mod, four keys, set-only-when-absent |

All decisions have unit-test coverage scoped in `plan.md` Phased
file inventory T001–T012. No NEEDS CLARIFICATION entries remain.
