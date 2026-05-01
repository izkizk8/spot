# Phase 0 Research — CoreSpotlight Indexing Module (031)

**Companion to**: [plan.md](./plan.md) §"Resolved [NEEDS CLARIFICATION] markers"

This document records the code-level detail behind plan-level
decisions **R-A** through **R-E**. Spec-level open questions were
resolved upstream in `spec.md` §"Open Questions (resolved)" and
inherited verbatim into the plan; they are not re-litigated here.

All five sections below follow the
**Decision / Rationale / Alternatives considered** template.

---

## §1 — R-A: Bridge-level serialisation of concurrent mutations

### Decision

`src/native/spotlight.ts` exposes an internal, module-scoped
promise chain inherited verbatim from feature 030's bridge:

```ts
let chain: Promise<unknown> = Promise.resolve();

function enqueue<T>(work: () => Promise<T>): Promise<T> {
  const next = chain.then(work, work); // run regardless of prior outcome
  chain = next.catch(() => undefined); // don't poison the chain
  return next;                          // preserve original rejection for the caller
}
```

Every mutating bridge method (`index`, `delete`, `deleteAll`,
`markCurrentActivity`, `clearCurrentActivity`) wraps its native
call through `enqueue(...)`. Read-only methods (`search`,
`isAvailable`) are NOT serialised.

### Rationale

- **FR-103** mandates that "the hook MUST serialise concurrent
  calls so `indexedIds` cannot be left inconsistent". The hook's
  reducer serialises *UI state*, but two parallel `index([item])`
  awaits could still hit the native module out of order if the
  underlying RN bridge re-orders the calls or if one of them
  rejects mid-flight. Serialising at the **bridge** layer closes
  that gap and is the single tightest place to assert the invariant
  in tests (one mock module, one queue).
- The chain is a closure over module scope, not a class instance,
  so it cannot be accidentally bypassed by re-importing.
- Errors are preserved for the caller (R3 mitigation under Risks)
  but the chain itself is detoxified by `chain.catch(...)` so a
  rejected mutation does not block subsequent ones (EC-001).
- Read-only `search` is not serialised because it has no
  side-effects and the user-facing experience benefits from
  parallelism (a search can render while a bulk-index is still
  resolving — the search hits the system index, which is the
  same authoritative store the bulk-index is writing to, and
  iOS handles the read/write concurrency internally).
- Inheriting the helper verbatim from 030 reduces reviewer
  cognitive load and gives 031 the same flake-free guarantee that
  030's bridge test demonstrated.

### Alternatives considered

- **No serialisation, rely on hook reducer alone**. Rejected for
  the same reason 030 rejected it: the hook's reducer cannot
  prevent overlapping native calls from resolving out of submission
  order (RN bridge does not guarantee ordering across
  `Promise.all`); the assertion required by AC-SPL-006 / FR-103
  would be flakey.
- **`Mutex` or third-party queue library**. Rejected: adds a
  runtime dependency (NFR-005 forbids new deps) for ~6 lines of
  closure logic.
- **Serialise at the native module level (Swift)**. Rejected:
  Swift-side serialisation is harder to assert in JS tests and
  forces a Swift-side test (no Swift test infra on Windows;
  Constitution V exemption). The JS-side closure is testable via a
  `mockNative.index` that records call order across two
  back-to-back submissions.

---

## §2 — R-B: Pure mapper for registry → SearchableItem

### Decision

`src/modules/spotlight-lab/searchable-items-source.ts` exposes:

```ts
export type SearchableItem = {
  readonly id: string;
  readonly title: string;
  readonly contentDescription: string;
  readonly keywords: readonly string[];
  readonly domainIdentifier: 'com.izkizk8.spot.modules';
};

export type MapOptions = {
  readonly onError?: (err: { kind: 'duplicate-id'; id: string } | { kind: 'minimal-metadata'; moduleId: string }) => void;
};

export function mapRegistryToItems(
  registry: readonly { id: string; title?: string; description?: string; keywords?: readonly string[] }[],
  opts?: MapOptions,
): readonly SearchableItem[];
```

The function is **pure** — no React imports, no I/O, no global
mutation. It accepts the registry as an argument so tests can
inject a deterministic registry without mocking
`src/modules/registry.ts`.

Pipeline (single pass):

1. For each registry entry, compute
   `id = ` `${'com.izkizk8.spot.modules'}.${module.id}`.
2. Apply empty-label fallback: if `module.title` is empty / missing,
   use `module.id` as `title` and invoke `onError({ kind:
   'minimal-metadata', moduleId })` exactly once.
3. Apply empty-keywords fallback: if `module.keywords` is empty /
   missing, use `[]`.
4. Track seen ids in a `Set`; on collision, drop the second
   occurrence and invoke `onError({ kind: 'duplicate-id', id })`
   exactly once per duplicate.
5. Return the deduplicated, fallback-applied array (read-only).

### Rationale

- **FR-020..024** mandate id determinism, dedup, and empty-label
  fallback without throwing. Centralising the logic in a pure
  function gives the hook a clean unit to test against
  (`searchable-items-source.test.ts` per AC-SPL-005) and keeps
  the hook free of mapping concerns.
- The optional `onError` funnel mirrors **030's R-C** error
  funnel: the store / mapper does not couple to React state;
  the hook supplies the callback and translates the result into
  its `error` channel. Same idempotency discipline ("exactly
  once per failure") so the user sees a single warning per
  mount, not one per render cycle.
- A discriminated union for the error payload (`'duplicate-id'`
  vs. `'minimal-metadata'`) lets the hook choose whether to
  surface a warning to the user or merely log it (e.g. the
  minimal-metadata case is informational; the duplicate-id case
  is a registry-level data-quality regression).
- The function returns a read-only array (`readonly
  SearchableItem[]`) so consumers cannot mutate the cached value
  in place, preserving React's referential-equality
  optimisations.

### Alternatives considered

- **Embed the mapping inline in `useSpotlightIndex.ts`**.
  Rejected: tightly couples the mapper to React state, makes the
  dedup / fallback logic untestable without rendering a hook,
  and breaks Constitution V's preference for testing pure logic
  at one boundary.
- **Use a class with an injected error reporter**. Rejected:
  adds OOP ceremony for a one-shot pure function; the optional
  callback is a lighter API.
- **Return a `Result<SearchableItem[], MapError[]>`**. Rejected:
  same reason 030 rejected it for `parsePersistedArray`: adds a
  discriminated-union to the public surface for negligible
  ergonomic gain. The optional callback covers all observability
  needs.

---

## §3 — R-C: `NSUserActivity` cleanup via ref-tracked latest reducer state

### Decision

`useSpotlightIndex.ts` retains `activityActive` in reducer state
AND mirrors the latest value through a `ref`:

```ts
const [state, dispatch] = useReducer(reducer, initial);
const activityActiveRef = useRef(state.activityActive);
useEffect(() => { activityActiveRef.current = state.activityActive; }, [state.activityActive]);

useEffect(() => {
  return () => {
    if (activityActiveRef.current) {
      // Fire-and-forget; the screen is unmounting and we cannot
      // wait on the promise without a memory leak. The bridge's
      // serialisation chain (R-A) ensures the call is enqueued
      // even if other mutations are still in flight.
      void clearCurrentActivity().catch(() => undefined);
    }
  };
}, []); // run cleanup ONCE on unmount, NOT on every activityActive change
```

The cleanup effect has an empty dependency array so it runs
**only on unmount**. Reading `activityActiveRef.current` (not
the closure-captured `state.activityActive`) ensures we observe
the latest value, even if the user tapped **Mark** seconds before
unmounting.

### Rationale

- **FR-106 / SC-009** mandate that "no `NSUserActivity` outlives
  the screen". Apple's documentation likewise recommends pairing
  `becomeCurrent()` with `resignCurrent()` + `invalidate()` at
  the natural lifecycle boundary of the producing UI.
- The naive implementation — `useEffect(() => { return () => { if
  (state.activityActive) ... } }, [state.activityActive])` — fires
  the cleanup on EVERY `activityActive` change (including
  `true → false` transitions caused by the user tapping
  **Clear**), which would double-call `clearCurrentActivity()` and
  risk the hook's reducer racing with itself. The ref-tracked
  pattern with a single mount/unmount effect avoids that race.
- Fire-and-forget is acceptable here because the screen is
  unmounting; we have no UI surface to render an error and the
  bridge's serialisation chain (R-A) guarantees the native call
  is enqueued before the JS module is torn down.
- Test (`useSpotlightIndex.test.tsx`) exercises mount → tap mark
  → unmount → assert `mockBridge.clearCurrentActivity` was called
  exactly once. A second test asserts mount → tap mark → tap
  clear → unmount results in `clearCurrentActivity` being called
  exactly once total (the unmount cleanup sees `activityActive
  === false` via the ref and skips the call).

### Alternatives considered

- **`useLayoutEffect` + `state.activityActive` dependency**.
  Rejected: same double-call problem; layout vs. effect timing
  doesn't change the dependency-array semantics.
- **`activityActive` tracked only in a `ref` (not reducer
  state)**. Rejected: the status pill needs to re-render when
  the value changes; refs don't trigger renders. The reducer +
  mirror pattern is the standard React idiom.
- **Bind cleanup to the screen component's `useEffect` instead
  of the hook**. Rejected: the activity lifecycle is owned by
  the hook (it owns the bridge calls); pushing cleanup to the
  screen would scatter the contract across two modules and break
  the hook's "single error funnel" invariant.

---

## §4 — R-D: `Info.plist` `NSUserActivityTypes` union-merge ordering

### Decision

`plugins/with-spotlight/index.ts` mutates one `Info.plist` key:

```ts
function mergeUniqueAppending(prior: string[] | undefined, additions: readonly string[]): string[] {
  const result = [...(prior ?? [])];
  for (const v of additions) {
    if (!result.includes(v)) result.push(v);
  }
  return result;
}

const ACTIVITY_TYPES = ['spot.showcase.activity'] as const;

withInfoPlist(config, (mod) => {
  mod.modResults.NSUserActivityTypes =
    mergeUniqueAppending(mod.modResults.NSUserActivityTypes as string[] | undefined, ACTIVITY_TYPES);
  return mod;
});
```

Test seeds `NSUserActivityTypes: ['com.example.priorActivity']`
and asserts post-mutation `toEqual(['com.example.priorActivity',
'spot.showcase.activity'])` by exact array equality, **not**
`toContain`.

### Rationale

- **FR-110 / FR-113 / EC-007** require preserving every prior
  entry in declared order; "preserve" is operationalised as
  `toEqual([...prior, ...missing])`, not
  `toEqual([...sorted set])`.
- `toEqual` (not `toContain`) catches accidental reorders that
  `toContain` would silently tolerate. SC-008 is operationalised
  at the test level.
- Inherited verbatim from 030's R-D mergeUniqueAppending helper
  (the implementation is small enough to copy rather than
  factor into a shared util — sharing would couple two plugin
  release cycles unnecessarily).
- Idempotency follows directly: the second invocation finds
  every addition already present and produces a `toEqual`-
  identical array (R1 mitigation; SC-005).
- When `NSUserActivityTypes` is absent (the common case for
  this project, since no prior plugin sets it), the helper's
  `prior ?? []` fallback creates the array with the single
  literal — no special-case branching.

### Alternatives considered

- **Set-based dedup** (`[...new Set([...prior, ...additions])]`).
  Rejected: same reason 030 rejected it — `Set` preserves
  insertion order in modern JS, but the implementation is less
  explicit about the "append missing only" semantics.
- **Sort the output** (`[...prior, ...additions].sort()`).
  Rejected: would reorder hypothetical prior entries
  alphabetically, breaking FR-113's "preserve every prior entry"
  reading.
- **Skip the helper entirely; just push** (`(prior ?? []).push(
  'spot.showcase.activity')`). Rejected: violates idempotency on
  re-runs (SC-005 / R1).

---

## §5 — R-E: `CoreSpotlight.framework` linkage via autolinking, not pbxproj

### Decision

`plugins/with-spotlight/index.ts` does **not** mutate `pbxproj`
to add framework linkage. The Swift sources under
`native/ios/spotlight/` import `CoreSpotlight`, `CoreServices`
(for `kUTTypeData` on iOS 9–13), and
`UniformTypeIdentifiers` (for `UTType.data` on iOS 14+); the
project's existing autolinking pipeline (the same path the
existing `native/ios/{app-intents,coreml,focus-filters,
background-tasks}/` directories use) resolves these imports
automatically at `expo prebuild` time.

The `kUTTypeData` ↔ `UTType.data` choice is made at the Swift
implementation layer:

```swift
@available(iOS 9.0, *)
private func attributeSet() -> CSSearchableItemAttributeSet {
  if #available(iOS 14.0, *) {
    return CSSearchableItemAttributeSet(contentType: UTType.data)
  } else {
    return CSSearchableItemAttributeSet(itemContentType: kUTTypeData as String)
  }
}
```

### Rationale

- The plugin's mutation surface stays minimal (one `Info.plist`
  key), which makes coexistence + commutativity assertions
  (T008 (d) (e)) trivially satisfiable: the only way 031's
  plugin can interact with prior plugins is by both touching
  `NSUserActivityTypes`, and no prior plugin in the pipeline
  does (007 / 013 / 014 / 019 / 023 / 025 / 026 / 027 / 028 /
  029 / 030 all touch other keys).
- Autolinking is the project-wide convention for native module
  framework linkage (verified in `native/ios/{app-intents,
  background-tasks}/` directories). Adding pbxproj manipulation
  here would diverge from the established pattern.
- Branching `kUTTypeData` ↔ `UTType.data` at the Swift layer
  (rather than exposing a knob in the JS bridge) keeps the bridge
  contract platform-version-agnostic and avoids leaking an
  iOS-version-conditional type into the typed surface.

### Alternatives considered

- **Add `CoreSpotlight.framework` to `pbxproj`** via a
  `withXcodeProject` mod. Rejected: redundant with autolinking;
  introduces a new mutation surface that has to be tested for
  idempotency / commutativity / coexistence, which inflates the
  plugin test surface for zero functional gain.
- **Force iOS 14+ (drop iOS 9–13 support, use only `UTType.data`)**.
  Rejected: spec mandates iOS 9.0 floor (FR-002 / DECISION 15);
  CoreSpotlight has been available since iOS 9 and there is no
  reviewer benefit to artificially raising the floor.
- **Use a string literal `"public.data"`** (the UTI raw value).
  Rejected: bypasses Apple's typed UTI surface and is harder to
  audit / refactor; the typed `kUTTypeData` / `UTType.data` path
  is the documented convention.

---

## §6 — Build validation (Constitution v1.1.0 Validate-Before-Spec gate)

This feature is **not** a build-pipeline feature; the
Validate-Before-Spec mandate (constitution v1.1.0) does not require
a proof-of-concept `expo prebuild` invocation. The plugin's
mutation surface is fully testable via `@expo/config-plugins`'s
`withInfoPlist` mock; the test (T008) is the validation gate.

The on-device verification step (T013) is executed at the end of
implementation, not during research, because CoreSpotlight's
actual indexing latency (the SC-004 5-second window) cannot be
deterministically measured in CI — it is a property of the live
iOS system index, which coalesces and de-prioritises under thermal
/ battery pressure.

If, during implementation, on-device behaviour diverges from the
spec's assumptions (e.g. `CSSearchQuery` requires an additional
attribute key projection the documentation didn't surface, or
`domainIdentifier` collisions with another app produce unexpected
behaviour), the spec MUST be back-patched per Constitution v1.1.0
"Spec back-patching" before T013 is signed off. A "Discoveries"
appendix in `retrospective.md` will capture any such divergence.

---

## Cross-references

- spec.md §"Open Questions (resolved)" — DECISION 1..15
- plan.md §"Resolved [NEEDS CLARIFICATION] markers" — R-A..R-E
- plan.md §"Risks" — R1..R10 reference these decisions for
  mitigation strategy
- plan.md §"Constitution Check" — Validate-Before-Spec rationale
  recorded above in §6
- 030's research.md §1 — bridge serialisation pattern inherited
  verbatim into 031 R-A
- 030's research.md §3 — error-funnel pattern inherited into
  031 R-B
- 030's research.md §4 — union-merge ordering pattern inherited
  verbatim into 031 R-D
