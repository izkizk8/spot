# Phase 0 Research — BackgroundTasks Framework Module (030)

**Companion to**: [plan.md](./plan.md) §"Resolved [NEEDS CLARIFICATION] markers"

This document records the code-level detail behind plan-level
decisions **R-A** through **R-E**. Spec-level open questions were
resolved upstream in `spec.md` §"Open Questions (resolved)" and
inherited verbatim into the plan; they are not re-litigated here.

All five sections below follow the
**Decision / Rationale / Alternatives considered** template.

---

## §1 — R-A: Bridge-level serialisation of concurrent schedules

### Decision

`src/native/background-tasks.ts` exposes an internal,
module-scoped promise chain:

```ts
let chain: Promise<unknown> = Promise.resolve();

function enqueue<T>(work: () => Promise<T>): Promise<T> {
  const next = chain.then(work, work); // run regardless of prior outcome
  chain = next.catch(() => undefined); // don't poison the chain
  return next;                          // preserve original rejection for the caller
}
```

Every mutating bridge method (`scheduleAppRefresh`,
`scheduleProcessing`, `cancelAll`) wraps its native call through
`enqueue(...)`. Read-only methods (`getLastRun`,
`getRegisteredIdentifiers`, `isAvailable`) are NOT serialised.

### Rationale

- **FR-083** mandates that "all bridge interactions MUST be
  serialised through the hook's reducer so concurrent schedules do
  not produce inconsistent status pills". The hook's reducer
  serialises *UI state*, but two parallel `scheduleAppRefresh()`
  awaits could still hit the native module out of order if the
  underlying RN bridge re-orders the calls or if one of them
  rejects mid-flight. Serialising at the **bridge** layer closes
  that gap and is the single tightest place to assert the invariant
  in tests (one mock module, one queue).
- The chain is a closure over module scope, not a class instance,
  so it cannot be accidentally bypassed by re-importing.
- Errors are preserved for the caller (R3 mitigation under Risks)
  but the chain itself is detoxified by `chain.catch(...)` so a
  rejected schedule does not block subsequent ones (EC-001).
- Read-only methods are not serialised because they have no
  side-effects and would only add latency to the AppState refetch
  path (NFR-001 / SC-002).

### Alternatives considered

- **No serialisation, rely on hook reducer alone**. Rejected: the
  hook's reducer cannot prevent overlapping native calls from
  resolving out of submission order (RN bridge does not guarantee
  ordering across `Promise.all`); the assertion required by
  AC-BGT-006 / FR-083 would be flakey.
- **`Mutex` or third-party queue library**. Rejected: adds a
  runtime dependency (NFR-005 forbids new deps) for ~6 lines of
  closure logic.
- **Serialise at the native module level (Swift)**. Rejected:
  Swift-side serialisation is harder to assert in JS tests and
  forces a Swift-side test (no Swift test infra on Windows;
  Constitution V exemption). The JS-side closure is testable via a
  `mockNative.scheduleAppRefresh` that records call order.

---

## §2 — R-B: `LastRunSnapshot` JSON shape on disk

### Decision

`spot.bgtasks.lastRun` (App Group `UserDefaults`) holds a
**single, fully-encoded** `LastRunSnapshot`:

```json
{
  "refresh":    null | { "id": "...", "type": "refresh", ... },
  "processing": null | { "id": "...", "type": "processing", ... }
}
```

Both keys are **always present**; absent runs serialise as JSON
`null`, not as missing fields. Every handler entry/exit performs a
read-modify-write of the entire snapshot (the writer first reads
the current snapshot, replaces only its task type's slot, and
writes the whole thing back).

### Rationale

- The JS bridge can validate the shape with a single check (both
  keys present, each is null or a valid `TaskRunRecord`); no
  partial-payload code path. Mirrors **029's** strict-parse
  decision (DECISION 12 in 029).
- Read-modify-write avoids a multi-write race between the refresh
  and processing handlers if they happen to run concurrently
  (extremely rare under iOS's coalescing, but documented).
- `UserDefaults.set` is synchronous on iOS, so the read-modify-write
  cycle is atomic from the perspective of any single handler
  invocation.
- Cross-platform variants (`background-tasks.android.ts` /
  `.web.ts`) never read this key; they degrade
  `getLastRun()` to throw `BackgroundTasksNotSupported` (FR-071).

### Alternatives considered

- **Two separate keys** (`spot.bgtasks.lastRun.refresh` and
  `spot.bgtasks.lastRun.processing`). Rejected: doubles the
  read-side work on the JS bridge, complicates the strict-parse
  surface, and offers no win — the snapshot is small (~ 200 bytes
  per task type), well below any UserDefaults size threshold.
- **Append-style log in App Group** (mirror AsyncStorage). Rejected:
  the App Group payload is meant to be the cold-launch hint, not
  the durable history (which is the AsyncStorage list). Mixing the
  two roles invites drift; the current shape keeps the
  responsibilities separate.

---

## §3 — R-C: AsyncStorage corruption tolerance

### Decision

`history-store.ts` exposes:

```ts
type HistoryStoreOptions = {
  onError?: (err: unknown) => void;
};

async function listRuns(opts?: HistoryStoreOptions): Promise<TaskRunRecord[]>;
async function appendRun(record: TaskRunRecord, opts?: HistoryStoreOptions): Promise<TaskRunRecord[]>;
async function clearRuns(opts?: HistoryStoreOptions): Promise<void>;
function parsePersistedArray(raw: unknown, opts?: HistoryStoreOptions): TaskRunRecord[];
```

`parsePersistedArray` returns `[]` on:
- `JSON.parse` throw,
- non-array root,
- any element failing `TaskRunRecord` shape validation (id non-empty
  string, type ∈ `'refresh'|'processing'`, status ∈
  `'completed'|'expired'|'canceled'`, timestamps numeric or null).

In every degraded path, the optional `onError` is invoked exactly
once with the underlying error. The hook supplies `onError` so it
can surface the failure on its `error` channel without coupling the
store to React state (Constitution V test-first; AC-BGT-005).

### Rationale

- **FR-044** mandates that AsyncStorage read/write failures MUST
  NOT crash the screen and MUST surface on the hook's `error`
  channel. Centralising the error funnel through `onError` keeps
  the store side-effect-free (no React imports) and makes it a
  pure unit-test target.
- Returning `[]` (rather than throwing) on parse failure is the
  user-friendly degradation path (EC-004): the Run History list
  renders the empty-state line, and the next successful append
  overwrites the corrupt key.
- The "exactly once" invocation discipline ensures the user sees a
  single error toast per session, not one per render cycle.

### Alternatives considered

- **Throw on corruption, let the hook catch**. Rejected: same
  reason as 029's bridge-level swallowing (R-D in 029) — repeated
  reads (e.g. AppState `'active'` refetch) would re-throw on every
  call; the hook would have to dedupe its own toast logic. Pushing
  the dedup down into the store keeps boundaries clean.
- **Return `Result<TaskRunRecord[], ParseError>`**. Rejected: adds
  a discriminated-union type to the public surface for negligible
  ergonomic gain; the optional callback is a lighter API.

---

## §4 — R-D: `Info.plist` union-merge ordering

### Decision

`plugins/with-background-tasks/index.ts` mutates two `Info.plist`
keys:

```ts
function mergeUniqueAppending(prior: string[] | undefined, additions: string[]): string[] {
  const result = [...(prior ?? [])];
  for (const v of additions) {
    if (!result.includes(v)) result.push(v);
  }
  return result;
}

const TASK_IDS = [
  'com.izkizk8.spot.refresh',
  'com.izkizk8.spot.processing',
] as const;
const BG_MODES = ['fetch', 'processing'] as const;

withInfoPlist(config, (mod) => {
  mod.modResults.BGTaskSchedulerPermittedIdentifiers =
    mergeUniqueAppending(mod.modResults.BGTaskSchedulerPermittedIdentifiers, TASK_IDS);
  mod.modResults.UIBackgroundModes =
    mergeUniqueAppending(mod.modResults.UIBackgroundModes, BG_MODES);
  return mod;
});
```

Test seeds `UIBackgroundModes: ['location']` (025's value) and
asserts post-mutation `toEqual(['location', 'fetch', 'processing'])`
by exact array equality, **not** `toContain`. Same exact-equality
assertion for `BGTaskSchedulerPermittedIdentifiers`.

### Rationale

- **FR-091 / EC-007** require preserving every prior entry in
  declared order; "preserve" is operationalised as
  `toEqual([...prior, ...missing])`, not `toEqual([...sorted set])`.
- `toEqual` (not `toContain`) catches accidental reorders that
  `toContain` would silently tolerate. SC-008 is operationalised at
  the test level.
- The merge function is shared between both keys (a single helper)
  to keep the mutation site small and the test surface tight.
- Idempotency follows directly: the second invocation finds every
  addition already present and produces a `toEqual`-identical
  array (R2 mitigation; SC-005).

### Alternatives considered

- **Set-based dedup** (`[...new Set([...prior, ...additions])]`).
  Rejected: `Set` preserves insertion order in modern JS, so the
  result would be the same — but the implementation is less
  explicit about the "append missing only" semantics, and tooling
  / readers might not immediately see the ordering guarantee.
- **Sort the output** (`[...prior, ...additions].sort()`).
  Rejected: would reorder 025's `'location'` after `'fetch'`,
  breaking FR-091's "preserve every prior entry" reading.

---

## §5 — R-E: Notification permission key ownership

### Decision

`plugins/with-background-tasks/index.ts` does **not** mutate any
notification-permission `Info.plist` key. The Swift handler posts
notifications best-effort via
`UNUserNotificationCenter.current().add(request)`; failure
(including `notDetermined` / `denied`) is swallowed at the native
side.

### Rationale

- **FR-064 / EC-008** mandate best-effort posting; failure must
  not affect the recorded run status.
- The project's existing notifications-permission flow is owned
  by feature 026 (`with-rich-notifications`) and the existing
  in-app permission affordance. Adding a permission key here would
  duplicate ownership and risk silent regressions during a
  permission-copy refactor in 026's domain.
- Keeping 030's plugin scoped to exactly two `Info.plist` keys
  (`BGTaskSchedulerPermittedIdentifiers`, `UIBackgroundModes`) is
  the smallest possible diff against the prebuild output, which
  makes coexistence + commutativity assertions (T008 (f) (g))
  trivially satisfiable.

### Alternatives considered

- **Add `NSUserNotificationsUsageDescription`**. Rejected: this
  key is iOS-pre-13 vintage and not the modern (`UNAuthorization`)
  permission path; it would not actually unlock notification
  posting on iOS 13+.
- **Have 030's plugin import 026's permission helper**. Rejected:
  introduces a cross-plugin dependency that violates the
  "additive only" / "coexists with all prior plugins" invariant
  (FR-093). The current flow assumes the developer has already
  granted notification permission via 026's UX; if not, the
  in-app posting silently fails (acceptable per EC-008).

---

## §6 — Build validation (Constitution v1.1.0 Validate-Before-Spec gate)

This feature is **not** a build-pipeline feature; the
Validate-Before-Spec mandate (constitution v1.1.0) does not require
a proof-of-concept `expo prebuild` invocation. The plugin's
mutation surface is fully testable via `@expo/config-plugins`'s
`withInfoPlist` mock; the test (T008) is the validation gate.

The on-device verification step (T013) is executed at the end of
implementation, not during research, because the BackgroundTasks
framework's actual launch behaviour cannot be deterministically
triggered without lldb's private-API bridge — and lldb verification
on a developer's local device is a separate concern from spec
back-patching.

If, during implementation, on-device behaviour diverges from the
spec's assumptions (e.g. `BGAppRefreshTask` requires an additional
`Info.plist` key the documentation didn't surface, or
`requiresExternalPower = true` causes `submit(...)` to throw on
simulators), the spec MUST be back-patched per Constitution v1.1.0
"Spec back-patching" before T013 is signed off. A "Discoveries"
appendix in `retrospective.md` will capture any such divergence.

---

## Cross-references

- spec.md §"Open Questions (resolved)" — DECISION 1..N
- plan.md §"Resolved [NEEDS CLARIFICATION] markers" — R-A..R-E
- plan.md §"Risks" — R1..R10 reference these decisions for
  mitigation strategy
- plan.md §"Constitution Check" — Validate-Before-Spec rationale
  recorded above in §6
