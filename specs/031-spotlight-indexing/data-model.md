# Phase 1 Data Model — CoreSpotlight Indexing Module (031)

**Companion to**: [plan.md](./plan.md) §"Project Structure" + spec.md §"Key Entities"

This document captures the typed shape and invariants for every
entity transmitted, rendered, or held in memory by feature 031.
JS-side type definitions live in `src/native/spotlight.types.ts`
(re-exported from `src/modules/spotlight-lab/`). Swift-side
analogues live in `SpotlightIndexer.swift` and
`UserActivityHelper.swift`. The two MUST agree on the wire-format
JSON encoding documented below.

Unlike feature 030, this feature has **no persistent JS-side
store** — no AsyncStorage key, no App Group `UserDefaults` write.
The only "persisted" surface is the system Spotlight index itself,
which is owned by iOS. All entities below are either (a) wire-
format payloads exchanged with the native bridge or (b) in-memory
hook reducer state.

---

## Entity 1 — `SearchableItem`

A single record indexed into `CSSearchableIndex.default()`. Mapped
deterministically from a registry entry by
`searchable-items-source.ts` (research §2 / R-B).

### Fields

| Field                | Type                                         | Nullability | Source                                                 | Notes |
|----------------------|----------------------------------------------|-------------|--------------------------------------------------------|-------|
| `id`                 | `string`                                     | NOT NULL    | Computed: `${domainIdentifier}.${module.id}`           | Used as `CSSearchableItem.uniqueIdentifier` (Swift) and as React key in `IndexableItemsList`. |
| `title`              | `string`                                     | NOT NULL    | `module.title`, falls back to `module.id` when empty   | Renders as the row title and as `attributeSet.title` (Swift). |
| `contentDescription` | `string`                                     | NOT NULL    | `module.description`, defaults to `''` when missing    | Renders as the row description and as `attributeSet.contentDescription` (Swift). |
| `keywords`           | `readonly string[]`                          | NOT NULL    | `module.keywords ?? []`                                | Renders as inert chips in `ItemRow` and as `attributeSet.keywords` (Swift). Empty array is valid. |
| `domainIdentifier`   | `'com.izkizk8.spot.modules'` (frozen literal)| NOT NULL    | Constant; same for every item                          | DECISION 2 / FR-022 / FR-082. Used for `deleteAll()` namespacing. |

### Validation rules

- `id` MUST be non-empty and globally unique within the mapped set
  (FR-021 / FR-024). Duplicates are dropped by the mapper, not by
  the bridge; the dropped duplicate fires the optional `onError`
  callback exactly once.
- `title` MUST be non-empty after fallback application. The
  fallback transforms the empty case into a non-empty `module.id`
  string (FR-023).
- `keywords` MUST be an array (possibly empty). The mapper does
  not introduce non-array values.
- `domainIdentifier` MUST equal the literal
  `'com.izkizk8.spot.modules'` for every mapped item. Tests assert
  this via type-narrowing on the `as const` literal.

### Wire format (JSON)

```json
{
  "id": "com.izkizk8.spot.modules.haptics-playground",
  "title": "Haptics Playground",
  "contentDescription": "Demonstrates UIFeedbackGenerator and CHHapticEngine.",
  "keywords": ["haptics", "feedback", "tactile"],
  "domainIdentifier": "com.izkizk8.spot.modules"
}
```

Same encoding is used in three places:

1. JS → native: as the input to `index([items])`.
2. Native → JS: as the output of `search(query, limit)`.
3. JS in-memory: as the per-row props for `ItemRow`.

The `delete([ids])` bridge method takes only the `id` field
(`readonly string[]`), not the full record.

---

## Entity 2 — `UserActivityDescriptor`

The payload passed from JS to the bridge's
`markCurrentActivity(...)`. Smaller than `SearchableItem` because
many `NSUserActivity` properties are set by the Swift helper at
fixed values (`isEligibleForSearch = true`,
`isEligibleForPrediction = true`, `activityType =
'spot.showcase.activity'` per FR-062).

### Fields

| Field      | Type                          | Nullability | Source                                          | Notes |
|------------|-------------------------------|-------------|-------------------------------------------------|-------|
| `title`    | `string`                      | NOT NULL    | Hard-coded to `'Spotlight Indexing'` per FR-061 | Becomes `NSUserActivity.title`. |
| `keywords` | `readonly string[]`           | NOT NULL    | The screen's keyword set                        | Becomes `NSUserActivity.keywords` (a `Set<String>` on the Swift side; ordering is not preserved). |
| `userInfo` | `Readonly<Record<string,string>>` | nullable | Fixed to `{ source: 'spotlight-lab' }` per DECISION 9 | Becomes `NSUserActivity.userInfo`. PII-free per NFR-004. |

### Validation rules

- `title` MUST be non-empty.
- `keywords` MUST be an array (possibly empty).
- `userInfo` MUST contain only string values (NFR-004); the bridge
  does not serialise non-string values. The TS type enforces this.

### Wire format (JSON)

```json
{
  "title": "Spotlight Indexing",
  "keywords": ["spotlight", "core-spotlight", "search", "indexing", "user-activity"],
  "userInfo": { "source": "spotlight-lab" }
}
```

### Lifecycle

```text
                ┌─────────────┐
                │  inactive   │  ◀── initial; also after clearCurrentActivity()
                └──────┬──────┘
                       │  user taps "Mark this screen as current activity"
                       │  → bridge: markCurrentActivity(descriptor)
                       │  → Swift: becomeCurrent() + retain
                       ▼
                ┌─────────────┐
                │   active    │  ◀── status pill = 'active'; visible to Spotlight
                └──────┬──────┘
                       │  ┌── user taps "Clear current activity"
                       │  │   → bridge: clearCurrentActivity()
                       │  │   → Swift: resignCurrent() + invalidate() + release
                       │  │
                       │  └── screen unmount (R-C)
                       │      → hook cleanup: clearCurrentActivity() (fire-and-forget)
                       ▼
                ┌─────────────┐
                │  inactive   │
                └─────────────┘
```

The `active` state is reflected on the JS side as a single boolean
field (`activityActive: boolean`) in the hook reducer; the
authoritative state lives on the Swift side as a retained
`NSUserActivity?`. The two are eventually consistent within one
bridge round-trip.

---

## Entity 3 — `IndexedState` (per item, in-memory only)

A best-effort mirror of which `SearchableItem` ids the user has
caused this session to index into the system index. Authoritative
state is `CSSearchableIndex.default()`, which may evict at any
time (DECISION 5 / FR-102 / EC-006).

### Shape

```ts
type IndexedState = 'indexed' | 'not indexed';

// In the hook reducer:
type IndexedIdsSlice = {
  readonly indexedIds: ReadonlySet<string>; // SearchableItem.id
};
```

### Derivation rule

```text
IndexedState(item) =
  indexedIds.has(item.id) ? 'indexed' : 'not indexed'
```

Initial value at mount: `indexedIds = new Set()` (every item starts
at `'not indexed'` per DECISION 6).

### State transitions

```text
                ┌──────────────┐
                │ not indexed  │  ◀── initial on every mount
                └──────┬───────┘
        per-row toggle │  → reducer adds id to indexedIds
        OR bulk Index  │  → bridge: index([item]) or index(items)
        ──────────────▶│
                       ▼
                ┌──────────────┐
                │   indexed    │  ◀── badge = 'indexed'
                └──────┬───────┘
        per-row toggle │  → reducer removes id from indexedIds
        OR bulk Remove │  → bridge: delete([id]) or deleteAll()
        ──────────────▶│
                       │
                       │  bridge rejection (any path)
                       │  → reducer reverts the slice to its
                       │    pre-toggle value AND surfaces error
                       │    on the hook's `error` channel (FR-033 /
                       │    FR-104)
                       ▼
                ┌──────────────┐
                │ not indexed  │
                └──────────────┘
```

### Notes

- The reducer uses an immutable `Set` rebuild pattern (`new
  Set(prev)` + `add` / `delete`) so React can detect the state
  change via reference equality.
- The slice is **not persisted**. On the next mount, every item
  starts at `'not indexed'` regardless of whether the system index
  still holds the entry. The PersistenceNoteCard explains why.
- `EC-006` describes the user-visible consequence of system
  eviction: a row badge can read `'indexed'` while the next
  in-app `CSSearchQuery` returns zero matches (system evicted
  between flip and search). The badge reflects the user's
  *intent*, not the system's authoritative state.

---

## Entity 4 — `ActivityState` (in-memory only)

The status pill value on `UserActivityCard`.

### Shape

```ts
type ActivityState = 'active' | 'inactive';

// In the hook reducer:
type ActivityStateSlice = {
  readonly activityActive: boolean;
};
```

### Derivation rule

```text
ActivityState =
  activityActive ? 'active' : 'inactive'
```

Initial value at mount: `activityActive = false`.

### Lifecycle

See Entity 2 (`UserActivityDescriptor`) §"Lifecycle" — the
`ActivityState` mirrors the `NSUserActivity` lifecycle with one
boolean and is reset to `false` on screen unmount via R-C's
ref-tracked cleanup effect.

---

## Entity 5 — `SearchResult`

A `SearchableItem` returned from the bridge's `search(query,
limit)` method. **Identical shape to `SearchableItem`** — the
Swift indexer reconstructs the wire format from the
`CSSearchableItem.attributeSet` projection (FR-083). No additional
fields (no relevance score, no rank, no thumbnail URL — those are
out of scope per NG-006).

### Wire format

```json
[
  {
    "id": "com.izkizk8.spot.modules.haptics-playground",
    "title": "Haptics Playground",
    "contentDescription": "Demonstrates UIFeedbackGenerator and CHHapticEngine.",
    "keywords": ["haptics", "feedback", "tactile"],
    "domainIdentifier": "com.izkizk8.spot.modules"
  }
]
```

### Validation rules

- The array length MUST be ≤ `limit` (default 25 per DECISION 4 /
  FR-052). The Swift indexer enforces the cap before resolving;
  the bridge does not re-validate.
- An empty array is a valid response (FR-053 — renders the empty-
  state line "No matches in Spotlight").

### Relationship to `IndexedState`

`SearchResult` is the authoritative read; `IndexedState` is the
intent mirror. They can disagree (EC-006). The `PersistenceNoteCard`
explains that this is expected behaviour, not a bug.

---

## Storage layout summary

| Store / Surface                        | Owner                              | Shape                              | Persisted? |
|----------------------------------------|------------------------------------|------------------------------------|------------|
| `CSSearchableIndex.default()`          | iOS (system)                       | `CSSearchableItem[]` (system-managed) | Yes (with eviction) |
| Active `NSUserActivity?` on Swift side | `UserActivityHelper.swift`         | At most one `NSUserActivity`       | No (process-lifetime) |
| `indexedIds: ReadonlySet<string>`      | `useSpotlightIndex.ts` reducer     | `Set<SearchableItem.id>`           | No (mount-lifetime)   |
| `activityActive: boolean`              | `useSpotlightIndex.ts` reducer     | `true` / `false`                   | No (mount-lifetime)   |
| `results: readonly SearchableItem[]`   | `useSpotlightIndex.ts` reducer     | `SearchableItem[]`                 | No (mount-lifetime)   |
| `error: unknown`                       | `useSpotlightIndex.ts` reducer     | Error channel for FR-104           | No (mount-lifetime)   |

Disjoint from prior namespaces:

- 014: `spot.widget.config.*` (App Group) — not touched.
- 027: `spot.widget.lockConfig.*` (App Group) — not touched.
- 028: `spot.widget.standbyConfig.*` (App Group) — not touched.
- 029: `spot.focus.filterValues` (App Group) — not touched.
- 030: `spot.bgtasks.lastRun` (App Group), `spot.bgtasks.history`
  (AsyncStorage) — not touched.
- 031: **adds zero new persistence keys**. The system index and
  the active `NSUserActivity` are owned by iOS; the JS-side state
  is mount-scoped only.

This is asserted at the per-feature manifest test level: the
plugin test confirms the only mutated `Info.plist` key is
`NSUserActivityTypes`; the bridge test confirms no AsyncStorage
import.

---

## Cross-platform null contracts

On Android / Web (or iOS < 9):

- `index`, `delete`, `deleteAll`, `search`, `markCurrentActivity`,
  `clearCurrentActivity` all throw `SpotlightNotSupported`
  (FR-091).
- `isAvailable()` returns `false` (FR-091).
- The hook degrades gracefully: `items` is still computed from
  `searchable-items-source.ts` (the mapper is platform-agnostic),
  `indexedIds` stays `new Set()`, `activityActive` stays `false`,
  `results` stays `[]`. The screen variants (`screen.android.tsx`
  / `screen.web.tsx`) do not import the bridge and so do not
  invoke any of these methods; the IOSOnlyBanner +
  ExplainerCard + PersistenceNoteCard render statically.
- `screen.web.tsx` MUST NOT import `src/native/spotlight.ts` at
  module evaluation time (FR-012 / SC-007). The `web.test.tsx`
  asserts this by inspecting the rendered tree without triggering
  a bridge import.
