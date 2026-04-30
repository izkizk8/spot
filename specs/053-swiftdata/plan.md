# Plan — 053 SwiftData

## Architecture

```
                ┌──────────────────────────────────────┐
                │       Modules tab → /modules/[id]    │
                └────────────────┬─────────────────────┘
                                 │
              src/modules/swiftdata-lab/
              ├── index.tsx           — manifest (lazy render)
              ├── screen.tsx          — iOS UI (sections 1–6)
              ├── screen.android.tsx  — IOSOnlyBanner gate
              ├── screen.web.tsx      — IOSOnlyBanner gate
              ├── task-types.ts       — value types + helpers
              ├── query-builder.ts    — JS predicate/sort mirror
              ├── components/         — 9 UI primitives
              │   ├── CapabilityCard.tsx
              │   ├── TasksList.tsx
              │   ├── TaskRow.tsx
              │   ├── TaskEditor.tsx
              │   ├── FilterPicker.tsx
              │   ├── SortPicker.tsx
              │   ├── StatsCard.tsx
              │   ├── SetupInstructions.tsx
              │   └── IOSOnlyBanner.tsx
              └── hooks/
                  └── useSwiftDataTasks.ts — CRUD + filter + sort

              src/native/
              ├── swiftdata.ts          — iOS resolver
              ├── swiftdata.android.ts  — rejects everywhere
              ├── swiftdata.web.ts      — rejects everywhere
              └── swiftdata.types.ts    — bridge contract

              native/ios/swiftdata/
              └── SwiftDataBridge.swift — @Model class scaffold
```

No plugin, no `app.json` change.

## Bridge contract (TypeScript)

```ts
type Priority = 'low' | 'medium' | 'high';

interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  dueDate: number | null; // epoch ms
  createdAt: number;
  updatedAt: number;
}

interface TaskDraft {
  title: string;
  completed?: boolean;
  priority?: Priority;
  dueDate?: number | null;
}

type TaskFilter = 'all' | 'active' | 'completed' | 'today';
type TaskSort   = 'created' | 'priority' | 'dueDate';

interface SchemaInfo {
  available: boolean;
  containerName: string;
  modelNames: readonly string[];
}

interface SwiftDataBridge {
  getSchemaInfo(): Promise<SchemaInfo>;
  fetchTasks(query?: { filter?: TaskFilter; sort?: TaskSort }): Promise<readonly TaskItem[]>;
  createTask(draft: TaskDraft): Promise<TaskItem>;
  updateTask(id: string, patch: Partial<TaskDraft>): Promise<TaskItem>;
  deleteTask(id: string): Promise<void>;
}
```

## Hook responsibilities

- Loads schema on mount (`refreshSchema`) and tasks on mount
  (`refreshTasks`).
- Owns local `filter` and `sort` state.
- Re-derives the visible list with `applyQuery` so a UI change
  doesn't require a network round-trip.
- Records the last error per operation; CRUD errors do not clear
  the list.
- Computes `stats` via `computeStats(tasks)`.
- Exposes `__setSwiftDataBridgeForTests` for unit tests.

## query-builder

```ts
applyQuery(
  tasks: readonly TaskItem[],
  filter: TaskFilter,
  sort: TaskSort,
  now: number,
): readonly TaskItem[]
```

- `all` returns the full list.
- `active` keeps `!completed`.
- `completed` keeps `completed`.
- `today` keeps tasks whose `dueDate` falls inside `[startOfDay,
  startOfDay + 24h)` for the supplied `now`.
- `created` sorts by `createdAt` desc.
- `priority` sorts by priority weight (`high=3 > med=2 > low=1`)
  then `createdAt` desc.
- `dueDate` sorts by `dueDate` asc with `null` last, then
  `createdAt` desc.

`buildFetchDescriptor(filter, sort, now)` returns a serializable
`{ predicate?, sortBy }` shape passed to the native bridge so the
Swift side can assemble its `FetchDescriptor`.

## Test inventory

| Test file | Cases (≈) |
|-----------|-----------|
| `test/unit/native/swiftdata-bridge.test.ts` | web stub for every method rejects; android stub equivalent; type-name export |
| `test/unit/modules/swiftdata-lab/manifest.test.ts` | id / title / description / platforms / minIOS '17.0' / render |
| `test/unit/modules/swiftdata-lab/task-types.test.ts` | `createDraft` defaults; `isToday`; `computeStats` |
| `test/unit/modules/swiftdata-lab/query-builder.test.ts` | filter & sort matrix; `today` boundary; `dueDate` null tie-break; descriptor shape |
| `test/unit/modules/swiftdata-lab/useSwiftDataTasks.test.tsx` | CRUD; filter; sort; stats; error paths |
| `test/unit/modules/swiftdata-lab/screen.test.tsx` | iOS screen renders all sections |
| `test/unit/modules/swiftdata-lab/screen.android.test.tsx` | IOSOnlyBanner |
| `test/unit/modules/swiftdata-lab/screen.web.test.tsx` | IOSOnlyBanner |
| `test/unit/modules/swiftdata-lab/components/*.test.tsx` (9 files) | each renders with sane defaults; user interactions |

Total: 16 new test files. No `with-mapkit` count change (no plugin
added).

## Risks & mitigations

- **R1** — Hook recomputation cost. *Mitigation:* `applyQuery` is
  memoised in the hook on `[tasks, filter, sort]`.
- **R2** — Time-zone drift in `today` filter. *Mitigation:** the
  filter is parameterised by `now` so tests can pin time.
- **R3** — Registry import ordering. *Mitigation:* append-only at
  the tail.
