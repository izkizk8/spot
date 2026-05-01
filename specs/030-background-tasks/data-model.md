# Phase 1 Data Model — BackgroundTasks Framework Module (030)

**Companion to**: [plan.md](./plan.md) §"Project Structure" + spec.md §"Key Entities"

This document captures the typed shape and invariants for every
entity persisted, transmitted, or rendered by feature 030. JS-side
type definitions live in `src/native/background-tasks.types.ts`
(re-exported from `src/modules/background-tasks-lab/`). Swift-side
analogues live in `BackgroundTaskManager.swift`. The two MUST agree
on the wire-format JSON encoding documented below.

---

## Entity 1 — `TaskRunRecord`

A single historical execution of a background task.

### Fields

| Field          | Type                                    | Nullability | Source                                  | Notes |
|----------------|-----------------------------------------|-------------|-----------------------------------------|-------|
| `id`           | `string` (UUID v4)                      | NOT NULL    | Generated at handler entry              | Stable across read/write; used as React key in `RunHistoryList`. |
| `type`         | `'refresh' \| 'processing'`             | NOT NULL    | Set by which handler emitted the record | Drives status pill colour + run-history badge. |
| `scheduledAt`  | `number` (epoch ms)                     | NOT NULL    | Bridge captures at submission time      | Used for "Submitted at" copy if surfaced. |
| `startedAt`    | `number \| null` (epoch ms)             | nullable    | Set on handler entry; null if request was canceled before launch | EC-005 / FR-042. |
| `endedAt`      | `number \| null` (epoch ms)             | nullable    | Set on handler exit (normal or expired) | Used to compute `durationMs`. |
| `durationMs`   | `number \| null` (≥ 0)                  | nullable    | `endedAt - startedAt` when both non-null | Surfaced verbatim on schedule cards (FR-023). |
| `status`       | `'completed' \| 'expired' \| 'canceled'`| NOT NULL    | Set on terminal transition              | EC-005 / FR-042 / FR-061..062. |

### Validation rules

- `id` MUST be non-empty.
- If `status === 'completed'`, both `startedAt` and `endedAt`
  MUST be non-null and `durationMs` MUST equal
  `endedAt - startedAt`.
- If `status === 'expired'`, `startedAt` MUST be non-null,
  `endedAt` MUST be non-null and equal to the expiration
  timestamp, and `durationMs` MUST equal the truncated runtime.
- If `status === 'canceled'`, `startedAt` MAY be null (request
  canceled before launch); `endedAt` and `durationMs` MUST be
  null in that subcase.

### Wire format (JSON)

```json
{
  "id": "5e3c…",
  "type": "refresh",
  "scheduledAt": 1733000000000,
  "startedAt":   1733000060000,
  "endedAt":     1733000062014,
  "durationMs":  2014,
  "status":      "completed"
}
```

Same encoding is used in both AsyncStorage (`spot.bgtasks.history`,
inside an array) and App Group `UserDefaults`
(`spot.bgtasks.lastRun`, inside a `LastRunSnapshot` slot).

### State transitions

```text
                       ┌────────────┐
                       │  scheduled │  (UI-only; no record yet)
                       └─────┬──────┘
              cancelAll()    │     iOS launches handler
              ──────────┐    │   ┌─────────────────┐
                        ▼    ▼   ▼                 │
                   ┌──────────────┐                │
                   │   running    │                │
                   └──┬─────────┬─┘                │
        normal exit  │         │  expirationHandler
                     ▼         ▼                   │
              ┌───────────┐ ┌──────────┐           │
              │ completed │ │ expired  │           │
              └───────────┘ └──────────┘           │
                                                   │
                   (record only created on terminal│
                    transition or cancellation)    │
                                                   │
                   ┌──────────┐                    │
                   │ canceled │ ◀──────────────────┘
                   └──────────┘
```

A `TaskRunRecord` is appended to `spot.bgtasks.history` ONLY on
terminal transitions (`completed`, `expired`, `canceled`).
"Scheduled" and "running" are in-memory UI states surfaced through
the hook's `lastRunByType` + `error` + `scheduledState` reducer
slices, not records.

---

## Entity 2 — `LastRunSnapshot`

The cross-process cold-launch hint, persisted to App Group
`UserDefaults` under `spot.bgtasks.lastRun`. See research.md §2 for
the read-modify-write discipline.

### Fields

| Field        | Type                       | Nullability | Notes |
|--------------|----------------------------|-------------|-------|
| `refresh`    | `TaskRunRecord \| null`    | NOT NULL    | Always present; null when no refresh has terminated yet. |
| `processing` | `TaskRunRecord \| null`    | NOT NULL    | Always present; null when no processing has terminated yet. |

### Validation rules

- Both keys MUST be present in the on-disk JSON; absent slots
  serialise as JSON `null`. Parser rejects any payload missing
  either key (parser returns `null` snapshot per FR-070 contract).
- If non-null, the slot MUST validate as a `TaskRunRecord` per
  Entity 1 rules.
- `LastRunSnapshot.refresh.type === 'refresh'` if present;
  `LastRunSnapshot.processing.type === 'processing'` if present.

### Wire format (JSON)

```json
{
  "refresh":    null,
  "processing": { "id": "…", "type": "processing", ... }
}
```

### Relationship to `TaskRunRecord` history

The `LastRunSnapshot` is the **most-recent terminal record per
task type**. It is fully derivable from the AsyncStorage history
(`spot.bgtasks.history`), but is duplicated into App Group
storage so the bridge can serve `getLastRun()` from native code on
cold launch without needing to wait for AsyncStorage hydration.
The two stores are eventually consistent: in the rare race where
AsyncStorage is older than the App Group snapshot (post-relaunch,
pre-`AppState.active` refetch), the hook's reducer prefers the
App Group snapshot for `lastRunByType` and the AsyncStorage list
for the full `history` array. Drift is bounded to one AppState
cycle.

---

## Entity 3 — `ScheduledState` (in-memory only)

Per-task UI state for the status pill on the schedule cards. Not
persisted; rebuilt from `LastRunSnapshot` + in-flight reducer
state on every mount.

### Fields

| Field   | Type                                                                | Notes |
|---------|---------------------------------------------------------------------|-------|
| `state` | `'idle' \| 'scheduled' \| 'running' \| 'completed' \| 'expired' \| 'canceled'` | Drives status pill copy + colour. |
| `since` | `number` (epoch ms)                                                 | When the current state was entered; used for "scheduled 2m ago" copy if surfaced. |

### Derivation rule

```text
scheduledState(type):
  - if user just tapped Schedule and bridge promise pending: 'scheduled'
  - else if last record for type has status 'running' (in-memory only — not persisted): 'running'
  - else if no record yet for type: 'idle'
  - else: lastRecord.status (one of 'completed' / 'expired' / 'canceled')
```

A pending bridge promise transitions to `'idle'` on rejection (the
error surfaces via the hook's `error` channel; FR-082-equivalent
behaviour for individual schedules) or stays in `'scheduled'` on
fulfilment until iOS launches the handler.

---

## Storage layout summary

| Store                     | Key                          | Owner                        | Shape                                  |
|---------------------------|------------------------------|------------------------------|----------------------------------------|
| AsyncStorage              | `spot.bgtasks.history`       | `history-store.ts` (JS)      | `TaskRunRecord[]` (length ≤ 20, FIFO)  |
| App Group `UserDefaults`  | `spot.bgtasks.lastRun`       | `BackgroundTaskManager.swift`| `LastRunSnapshot` (one JSON object)    |

Disjoint from prior namespaces:

- 014: `spot.widget.config.*` (App Group)
- 027: `spot.widget.lockConfig.*` (App Group)
- 028: `spot.widget.standbyConfig.*` (App Group)
- 029: `spot.focus.filterValues` (App Group)
- 030: `spot.bgtasks.lastRun` (App Group), `spot.bgtasks.history` (AsyncStorage)

The five App Group namespaces are documented in spec.md / plan.md
and asserted disjoint at the per-feature manifest test level.

---

## Cross-platform null contracts

On Android / Web (or iOS < 13):

- `getLastRun()` throws `BackgroundTasksNotSupported` (FR-071) —
  the hook catches and falls through to `lastRunByType = { refresh:
  null, processing: null }`.
- `listRuns()` returns whatever AsyncStorage holds (history-store
  is platform-agnostic; FR-040 doesn't require iOS-only
  enforcement). On non-iOS, the list is typically empty because no
  `appendRun(...)` is ever called there.
- `getRegisteredIdentifiers()` returns `[]` (FR-071).
