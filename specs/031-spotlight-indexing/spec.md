# Feature Specification: CoreSpotlight Indexing Module

**Feature Branch**: `031-spotlight-indexing`
**Feature Number**: 031
**Created**: 2026-04-29
**Status**: Approved (autonomous, no clarifications needed)
**Input**: iOS 9+ module showcasing CoreSpotlight: indexing app content so it
appears in iOS Spotlight Search via `CSSearchableIndex`, plus
`NSUserActivity` for current-state indexing. Adds a "Spotlight Indexing"
card to the iOS Showcase registry, an in-app screen with explainer +
indexable items list (sourced from the existing module registry) +
bulk-index controls + in-app `CSSearchQuery` test + `NSUserActivity`
demo, a Swift wrapper around `CSSearchableIndex.default()`, a Swift
`UserActivityHelper`, a JS bridge with non-iOS stubs, and an Expo config
plugin that ensures `NSUserActivityTypes` contains the demo activity
type. Branch parent is `030-background-tasks`. Builds additively on
prior modules; coexists with all prior plugins (007/013/014/019/023/
025/026/027/028/029/030).

## Overview

The Spotlight Indexing module ("Spotlight Indexing") is a feature card
in the iOS Showcase registry (`id: 'spotlight-lab'`, label
`"Spotlight Indexing"`, `platforms: ['ios','android','web']`,
`minIOS: '9.0'`). Tapping the card opens a single screen with six
panels arranged in a fixed top-to-bottom order:

1. **ExplainerCard** — what CoreSpotlight indexing is, the difference
   between `CSSearchableIndex` (persistent, batch-indexed content) and
   `NSUserActivity` (current-state / "what the user is doing right
   now"), and a short test recipe: swipe down on the iOS home screen
   and search for `spot showcase` to see indexed entries.
2. **IndexableItemsList** — a scrollable list whose items are sourced
   from the iOS Showcase module registry. Each row shows: title (the
   module's label), content description, the keyword set, an
   indexed-state badge (`indexed` / `not indexed`), and a per-row
   toggle that adds or removes that single item from the system index.
3. **BulkActionsCard** — two CTAs: **Index all** (re-indexes every
   item from the source list) and **Remove all from index** (calls
   `deleteAllSearchableItems()`). After a bulk action resolves, every
   row's badge reflects the new state.
4. **SearchTestCard** — a text input plus a **Search Spotlight** CTA
   that runs `CSSearchQuery` against `CSSearchableIndex.default()` and
   renders the matching items below. An empty result set renders an
   explicit empty-state line so reviewers can distinguish "no match"
   from "search didn't run".
5. **UserActivityCard** — a **Mark this screen as current activity**
   CTA that creates an `NSUserActivity` with `eligibleForSearch =
   true` and `eligibleForPrediction = true`; a status pill toggles
   between `active` and `inactive`; a **Clear current activity** CTA
   invalidates it. A short documentation block explains the difference
   between user-activity-driven and core-spotlight-driven indexing.
6. **PersistenceNoteCard** — explains that the Spotlight index is
   system-managed and items can be evicted by iOS at any time; for
   that reason this module re-indexes on every screen mount from a
   stable source list (the registry) rather than treating the index
   as authoritative storage.

The feature is purely additive at the integration boundary:

1. `src/modules/registry.ts` — one new import line + one new array
   entry (registry size +1). No existing entry is modified.
2. `app.json` `plugins` array — one new entry
   (`./plugins/with-spotlight`). Coexists with all prior plugins
   (007/013/014/019/023/025/026/027/028/029/030).
3. `app.json` `Info.plist` augmentation — the plugin ensures
   `NSUserActivityTypes` contains `spot.showcase.activity`, merging
   into any pre-existing array without removing or reordering prior
   entries. `CoreSpotlight.framework` linkage is supplied by the
   Swift module's podspec (autolinking); the plugin itself is a no-op
   for framework wiring.
4. New native sources under `native/ios/spotlight/` are linked via
   the existing autolinking pipeline.
5. Bundle identifier (`com.izkizk8.spot`) is read from `app.json` to
   document derivation of the `domainIdentifier` namespace
   (`com.izkizk8.spot.modules`) used for searchable items and the
   activity type literal `spot.showcase.activity`. Plugin and Swift
   sources reference these literals directly to prevent drift.

Cross-platform parity: Android and Web open the screen and render an
`IOSOnlyBanner` plus the static `ExplainerCard` and
`PersistenceNoteCard`. Indexing CTAs and the search/activity panels
are not rendered on those platforms; the bridge throws
`SpotlightNotSupported` if invoked from non-iOS code paths. Android
intentionally defers App Search support — the bridge stub throws on
every method.

## Goals

- **G-001**: Demonstrate the full `CSSearchableIndex` lifecycle —
  index, delete, deleteAll, search — from a single screen, with zero
  developer-mode-only steps and an obvious in-app verification path
  (the `CSSearchQuery` test panel) before the user has to leave the
  app.
- **G-002**: Make the conceptual difference between persistent
  CoreSpotlight indexing and transient `NSUserActivity` indexing
  legible to a reviewer who has never used either API (explainer
  copy + observable status pill on the activity card + side-by-side
  documentation block).
- **G-003**: Source all indexable items from the existing module
  registry so the search payload is automatically kept current as
  new feature cards are added (single source of truth; no duplicated
  catalogue).
- **G-004**: Keep all integration touchpoints additive (registry +1,
  `app.json` plugins +1, `NSUserActivityTypes` augmented not
  replaced) and preserve coexistence with every prior feature's
  plugin.
- **G-005**: Provide a JS bridge whose non-iOS stubs throw a single,
  well-typed `SpotlightNotSupported` error so cross-platform callers
  can branch cleanly.
- **G-006**: Make the system-eviction reality of CoreSpotlight
  obvious — the PersistenceNoteCard plus the on-mount re-index
  behaviour together communicate that the Spotlight index is a
  cache, not a store.

## Non-Goals

- **NG-001**: Indexing arbitrary user-supplied content. The source
  list is fixed: it is the iOS Showcase module registry mapped into
  `SearchableItem` shape.
- **NG-002**: Deep-linking from a Spotlight result back into the
  specific module screen. v1 makes the items discoverable; routing
  on selection is out of scope.
- **NG-003**: Android App Search parity. The Android bridge stub
  throws on every method and the Android screen renders the
  IOSOnlyBanner.
- **NG-004**: Web parity for either CoreSpotlight or
  `NSUserActivity`. The web screen renders the IOSOnlyBanner +
  static explainer copy and the bridge is not imported.
- **NG-005**: A persistent record of "what was indexed when".
  Indexed-state badges reflect a best-effort in-memory mirror; the
  authoritative state is the system index, which can evict at any
  time.
- **NG-006**: `CSSearchableItemAttributeSet` extras beyond title,
  contentDescription, and keywords. Thumbnails, custom URLs, and
  rich attributes are deferred to v2.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Index a single module and find it in Spotlight (Priority: P1)

A developer evaluating the showcase opens the Spotlight Indexing card
on an iOS 9+ device, finds the row for a specific module (e.g.
"Haptics Playground"), toggles its row switch to **on**, then leaves
the app and uses iOS Spotlight Search to confirm the entry appears.

**Why this priority**: This is the canonical `CSSearchableIndex` flow
and the smallest end-to-end demonstration of the framework. If it
works, the rest of the screen is a delta on top of it.

**Independent Test**: Launch the app on iOS 9+, open the card, tap
one row's per-row toggle to **on**, observe the badge flip from
`not indexed` to `indexed`, swipe down on the home screen, and search
for the module's title; the entry appears in Spotlight results.

**Acceptance Scenarios**:

1. **Given** the user is on iOS 9+ and the row's badge currently
   reads `not indexed`, **When** they toggle the row switch on,
   **Then** the bridge calls `index([item])` with the row's mapped
   `SearchableItem`, the badge flips to `indexed`, and an
   in-app `CSSearchQuery` for that title returns at least one match.
2. **Given** a row's badge currently reads `indexed`, **When** the
   user toggles the row switch off, **Then** the bridge calls
   `delete([item.id])`, the badge flips to `not indexed`, and a
   subsequent `CSSearchQuery` for that title returns zero matches.
3. **Given** the bridge call rejects (mocked), **When** the user
   toggles the switch, **Then** the badge state reverts to its
   pre-toggle value and the screen surfaces the failure on the
   hook's `error` channel.

---

### User Story 2 — Bulk index every module then bulk remove (Priority: P1)

A reviewer wants to demonstrate that the entire showcase catalogue
can be made discoverable via Spotlight in one tap, then cleared in
one tap.

**Why this priority**: Bulk index is the reviewer's fastest path to
"all of this is searchable from the home screen", and bulk delete
is the cleanup affordance that makes the demo non-destructive.

**Independent Test**: Tap **Index all**, observe every row badge
flip to `indexed`; swipe down on the home screen, search for
`spot showcase`; multiple module entries appear. Return to the
screen, tap **Remove all from index**, observe every row badge flip
to `not indexed`; the same Spotlight search returns no module rows.

**Acceptance Scenarios**:

1. **Given** zero items are currently indexed, **When** the user
   taps **Index all**, **Then** the bridge calls `index(items)`
   with the full mapped `SearchableItem` array, every row badge
   becomes `indexed`, and an in-app `CSSearchQuery` for
   `spot showcase` returns at least one match.
2. **Given** every item is currently indexed, **When** the user
   taps **Remove all from index**, **Then** the bridge calls
   `deleteAll()`, every row badge becomes `not indexed`, and an
   in-app `CSSearchQuery` for `spot showcase` returns zero matches.
3. **Given** a bulk action is in flight, **When** the user taps
   the same bulk CTA again, **Then** the screen ignores the second
   tap until the first resolves; both bulk CTAs are disabled while
   any bulk action is pending.

---

### User Story 3 — In-app Spotlight search test (Priority: P2)

A reviewer wants to verify Spotlight indexing without leaving the
app, by typing a query into the SearchTestCard and seeing the
matching items rendered in-place.

**Why this priority**: The in-app test path makes the feature
demonstrable in environments where the home-screen Spotlight UI
isn't available (CI screenshots, simulators with restricted
gestures, screen-recordings).

**Independent Test**: Index at least one item, type its title (or a
keyword) into the SearchTestCard input, tap **Search Spotlight**,
and observe a results list rendering at least that item below the
input.

**Acceptance Scenarios**:

1. **Given** at least one item is indexed and matches the query,
   **When** the user submits the SearchTestCard,
   **Then** `search(query, limit)` resolves with that item and the
   results list renders one row per match (limit defaults to 25).
2. **Given** no indexed item matches the query,
   **When** the user submits the SearchTestCard,
   **Then** the results list renders an empty-state line such as
   "No matches in Spotlight".
3. **Given** the bridge rejects (mocked),
   **When** the user submits the SearchTestCard,
   **Then** the results list renders nothing and the screen surfaces
   the failure on the hook's `error` channel.

---

### User Story 4 — Mark current screen as `NSUserActivity` (Priority: P2)

A reviewer wants to demonstrate the `NSUserActivity`-driven indexing
path (current-state) as distinct from `CSSearchableIndex`
(persistent).

**Why this priority**: The two indexing paths are commonly conflated;
exposing both side-by-side in the same screen is the educational
core of the feature.

**Independent Test**: Tap **Mark this screen as current activity**,
observe the status pill move from `inactive` to `active`; tap
**Clear current activity**, observe it return to `inactive`. Expand
the documentation block to read the comparison.

**Acceptance Scenarios**:

1. **Given** no current activity is active, **When** the user taps
   **Mark this screen as current activity**,
   **Then** the bridge calls `markCurrentActivity({ title,
   keywords, userInfo })` with the screen's title literal and
   keyword set, the status pill becomes `active`, and the activity
   created has `eligibleForSearch = true` and `eligibleForPrediction
   = true`.
2. **Given** an activity is currently active,
   **When** the user taps **Clear current activity**,
   **Then** the bridge calls `clearCurrentActivity()`, the
   underlying `NSUserActivity` is invalidated, and the status pill
   becomes `inactive`.
3. **Given** the user navigates away from the screen while an
   activity is active,
   **When** the screen unmounts,
   **Then** the hook's cleanup invalidates the activity so it does
   not outlive the screen, and the status pill resets on next
   mount.

---

### User Story 5 — Cross-platform fallback (Priority: P3)

An Android or Web user opens the showcase, taps the Spotlight
Indexing card (registered for all platforms so the catalogue stays
parity-clean), and sees a clear "iOS-only" banner alongside the
static explainer copy so they understand what they would see on
iOS.

**Why this priority**: Pure parity with prior modules' cross-platform
discoverability story; not blocking, but required for catalogue
consistency.

**Acceptance Scenarios**:

1. **Given** the user is on Android, **When** they open the screen,
   **Then** they see `IOSOnlyBanner`, `ExplainerCard`, and
   `PersistenceNoteCard`; the indexing list, bulk actions, search,
   and activity panels are not rendered.
2. **Given** the user is on Web, **When** they open the screen,
   **Then** the web variant renders the iOS-only banner and
   explainer; the bridge is never imported on the web path.
3. **Given** any caller invokes `index`, `delete`, `deleteAll`,
   `search`, `markCurrentActivity`, or `clearCurrentActivity`
   from a non-iOS code path,
   **When** the call executes,
   **Then** it throws a typed `SpotlightNotSupported` error.

---

### Edge Cases

- **EC-001**: User toggles a row's switch on while a bulk **Index
  all** is in flight. The per-row toggle is disabled while any bulk
  action is pending; once the bulk action resolves, the per-row
  state reflects the bulk result and the user can toggle again.
- **EC-002**: Device is on iOS but `CSSearchableIndex.default()`
  reports unavailable (e.g. corporate MDM disables Spotlight).
  `isAvailable()` returns false and the screen renders the iOS-only
  banner with copy explaining the system-disabled case.
- **EC-003**: A `SearchableItem` mapped from the registry has a
  duplicate id (regression). The mapper de-duplicates by id and
  surfaces the duplicate via the hook's `error` channel; the index
  call proceeds with the de-duplicated set.
- **EC-004**: A `SearchableItem` has an empty title or empty
  keyword set. The mapper falls back to the module's `id` for the
  title and to `[]` for keywords; the row still renders and is
  still indexable but the badge clarifies "(minimal metadata)".
- **EC-005**: User taps **Search Spotlight** with an empty query.
  The card disables the CTA when the input is empty; submission is
  not possible.
- **EC-006**: System evicts indexed items between the moment the
  badge flipped to `indexed` and the moment the user runs the
  in-app search. The search returns fewer matches than the badge
  count suggests; the PersistenceNoteCard explains why this is
  expected behaviour.
- **EC-007**: Plugin runs against an `Info.plist` that already
  contains `NSUserActivityTypes` from a hypothetical prior plugin.
  The plugin merges by union and de-duplicates; prior entries are
  preserved.
- **EC-008**: Plugin runs twice in succession. The second run is a
  byte-identical no-op against the result of the first run.
- **EC-009**: `screen.tsx` unmounts while a bridge call (e.g.
  `index`) is still pending. The hook's `useEffect` cleanup ignores
  the late resolution so no setState-after-unmount warning is
  emitted.
- **EC-010**: User backgrounds and re-foregrounds the app. On
  re-foreground, the screen does NOT automatically re-index every
  item (avoids battery cost); the badges remain at their last
  observed state and the PersistenceNoteCard explains that bulk
  re-index on launch is the recommended pattern for stable source
  lists.
- **EC-011**: An NSUserActivity is left active when the user kills
  the app. iOS handles invalidation at process exit; on next
  launch the status pill shows `inactive`.

## Requirements *(mandatory)*

### Functional Requirements

#### Registry & navigation

- **FR-001**: `src/modules/registry.ts` MUST add exactly one new
  entry with `id: 'spotlight-lab'`, label `"Spotlight Indexing"`,
  `platforms: ['ios','android','web']`, and `minIOS: '9.0'`. No
  existing registry entries may be modified.
- **FR-002**: The registry entry MUST resolve to a manifest
  exported from `src/modules/spotlight-lab/index.tsx` whose shape
  matches the project-wide manifest contract used by prior modules
  (id, label, platforms, minIOS, screen component reference).
- **FR-003**: The screen MUST be reachable through the existing
  showcase catalogue navigation flow without any new top-level
  routes.

#### Screen composition

- **FR-010**: On iOS 9+, the screen MUST render the panels in this
  fixed top-to-bottom order: ExplainerCard, IndexableItemsList,
  BulkActionsCard, SearchTestCard, UserActivityCard,
  PersistenceNoteCard.
- **FR-011**: On Android, `screen.android.tsx` MUST render
  IOSOnlyBanner, ExplainerCard, and PersistenceNoteCard only.
- **FR-012**: On Web, `screen.web.tsx` MUST render IOSOnlyBanner,
  ExplainerCard, and PersistenceNoteCard only, and MUST NOT import
  `src/native/spotlight.ts` at module evaluation time.
- **FR-013**: When `isAvailable()` returns false on iOS (system
  disabled or older OS build), the iOS screen MUST render
  IOSOnlyBanner with copy referencing the iOS 9+ floor (or system-
  disabled state) instead of the indexing/search/activity panels.

#### Indexable items source

- **FR-020**: `searchable-items-source.ts` MUST read the iOS
  Showcase module registry and map each entry to a
  `SearchableItem` of shape
  `{ id: string; title: string; contentDescription: string;
  keywords: string[]; domainIdentifier: string }`.
- **FR-021**: The `id` MUST be derived deterministically from the
  module's registry id (e.g.
  `${domainIdentifier}.${module.id}`); ids MUST be unique across
  the mapped set.
- **FR-022**: `domainIdentifier` MUST be the literal
  `"com.izkizk8.spot.modules"` for every mapped item.
- **FR-023**: When a module entry's label or description is empty,
  the mapper MUST fall back to the module's `id` for `title` and
  `[]` for `keywords`, and MUST NOT throw.
- **FR-024**: The mapper MUST de-duplicate by `id` and MUST
  surface any duplicate via the hook's `error` channel.

#### Indexable items list

- **FR-030**: Each row MUST render the item's title, content
  description, keyword set (rendered as inert chips or comma-
  separated text), the indexed-state badge, and a per-row toggle.
- **FR-031**: Toggling a row from `not indexed` to `indexed` MUST
  call `index([item])`; toggling from `indexed` to `not indexed`
  MUST call `delete([item.id])`.
- **FR-032**: While any bulk action is in flight, every per-row
  toggle MUST be disabled.
- **FR-033**: A bridge rejection on a per-row toggle MUST revert
  the badge to its pre-toggle value and surface the failure on
  the hook's `error` channel.

#### Bulk actions card

- **FR-040**: The card MUST expose two CTAs: **Index all** and
  **Remove all from index**.
- **FR-041**: **Index all** MUST call `index(items)` with the
  full mapped `SearchableItem` array and, on success, set every
  row's badge to `indexed`.
- **FR-042**: **Remove all from index** MUST call `deleteAll()`
  and, on success, set every row's badge to `not indexed`.
- **FR-043**: While any bulk action is in flight, both bulk CTAs
  MUST be disabled and a pending indicator MUST be visible.

#### Search test card

- **FR-050**: The card MUST expose a single text input and a
  **Search Spotlight** CTA.
- **FR-051**: The CTA MUST be disabled while the input is empty
  or while a search is in flight.
- **FR-052**: Submitting the CTA MUST call
  `search(query, limit)` with `limit` defaulting to 25 and render
  the resolved `SearchableItem[]` below the input as one row per
  match (title + content description).
- **FR-053**: An empty result set MUST render the explicit empty-
  state line "No matches in Spotlight".
- **FR-054**: A bridge rejection MUST clear the results list and
  surface the failure on the hook's `error` channel.

#### User activity card

- **FR-060**: The card MUST expose **Mark this screen as current
  activity** and **Clear current activity** CTAs and a status pill
  with values `active` / `inactive`.
- **FR-061**: **Mark** MUST call `markCurrentActivity({ title,
  keywords, userInfo })` with `title = "Spotlight Indexing"`,
  keywords = the screen's keyword set, and `userInfo =
  { source: 'spotlight-lab' }`.
- **FR-062**: The created `NSUserActivity` MUST have
  `eligibleForSearch = true`, `eligibleForPrediction = true`, and
  `activityType = "spot.showcase.activity"`.
- **FR-063**: **Clear** MUST call `clearCurrentActivity()` and
  reset the status pill to `inactive`.
- **FR-064**: Screen unmount MUST invalidate any active activity
  via the hook's effect cleanup so no activity outlives the
  screen.

#### Persistence note card

- **FR-070**: The card MUST display copy explaining that
  CoreSpotlight is system-managed, items can be evicted at any
  time, and the recommended pattern is to re-index from a stable
  source list on app launch (or on screen mount, in this demo).
- **FR-071**: The copy MUST be rendered as static text using
  `ThemedText` so theming tokens apply.

#### Native (Swift) module

- **FR-080**: `SpotlightIndexer.swift` MUST wrap
  `CSSearchableIndex.default()` and expose, through the JS bridge:
  `index(items: [SearchableItem])`, `delete(ids: [String])`,
  `deleteAll()`, `search(query: String, limit: Int) -> [SearchableItem]`.
- **FR-081**: For each `SearchableItem`, the indexer MUST build a
  `CSSearchableItemAttributeSet(itemContentType: kUTTypeData)` (or
  the modern UTType equivalent on iOS 14+) populated with `title`,
  `contentDescription`, and `keywords`.
- **FR-082**: Every `CSSearchableItem` constructed MUST set
  `domainIdentifier = "com.izkizk8.spot.modules"` so a single
  `deleteAll()` call cleanly clears everything this module owns.
- **FR-083**: `search(query:limit:)` MUST run a `CSSearchQuery`
  with `queryString` derived from the input plus the standard
  attribute key projection (`title`, `contentDescription`,
  `keywords`) and resolve with the mapped `SearchableItem[]`,
  capped at `limit`.
- **FR-084**: `UserActivityHelper.swift` MUST create an
  `NSUserActivity(activityType: "spot.showcase.activity")` with
  the supplied title, keywords (as a `Set<String>`), and userInfo;
  set `isEligibleForSearch = true` and
  `isEligibleForPrediction = true`; call `becomeCurrent()`; and
  retain the instance for later invalidation.
- **FR-085**: `UserActivityHelper.swift` MUST expose `invalidate()`
  which calls `resignCurrent()` then `invalidate()` on the retained
  activity and releases it.

#### JS bridge

- **FR-090**: `src/native/spotlight.ts` MUST export the typed
  surface: `index(items: SearchableItem[]): Promise<void>`,
  `delete(ids: string[]): Promise<void>`, `deleteAll():
  Promise<void>`, `search(query: string, limit?: number):
  Promise<SearchableItem[]>`, `markCurrentActivity(activity: {
  title: string; keywords: string[]; userInfo?:
  Record<string, string> }): Promise<void>`,
  `clearCurrentActivity(): Promise<void>`,
  `isAvailable(): boolean`.
- **FR-091**: All non-iOS implementations MUST throw
  `SpotlightNotSupported` on every method except `isAvailable()`
  (which returns `false`). Web and Android share the same stub
  policy.
- **FR-092**: The `SpotlightNotSupported` error MUST be a typed
  class export so consumers can `instanceof`-check at the import
  boundary.
- **FR-093**: Platform splitting MUST follow the precedent of
  feature 030 (`spotlight.ts` on iOS, `spotlight.web.ts`,
  `spotlight.android.ts`, `spotlight.types.ts`).

#### Hook

- **FR-100**: `useSpotlightIndex` MUST return `{ items,
  indexedIds, isAvailable, isBusy, error, toggleItem, indexAll,
  removeAll, search, results, markActivity, clearActivity,
  activityActive }`.
- **FR-101**: The hook MUST initialise `items` from
  `searchable-items-source.ts` exactly once on mount.
- **FR-102**: `indexedIds` MUST be a `Set<string>` reflecting the
  hook's best-effort in-memory mirror of which item ids the user
  has indexed during the current session.
- **FR-103**: `toggleItem(id)`, `indexAll()`, and `removeAll()`
  MUST serialise through a single reducer so concurrent calls
  cannot leave `indexedIds` inconsistent.
- **FR-104**: `search(query, limit?)` MUST call the bridge and
  store the resolved `SearchableItem[]` on `results`; a rejection
  MUST clear `results` to `[]` and assign `error`.
- **FR-105**: `markActivity()` MUST call
  `markCurrentActivity(...)` and set `activityActive = true` on
  resolution; `clearActivity()` MUST call
  `clearCurrentActivity()` and set `activityActive = false`.
- **FR-106**: The hook's `useEffect` cleanup MUST call
  `clearActivity()` when `activityActive` is true so an activity
  never outlives the screen.

#### Plugin

- **FR-110**: `plugins/with-spotlight/` MUST ensure
  `Info.plist`'s `NSUserActivityTypes` array contains
  `"spot.showcase.activity"`. If the array does not exist, the
  plugin MUST create it with that single entry. If it exists, the
  plugin MUST merge by union and de-duplicate.
- **FR-111**: The plugin MUST be a no-op for `CoreSpotlight.framework`
  linkage; framework wiring is supplied by the Swift module's
  podspec via autolinking.
- **FR-112**: The plugin MUST be idempotent: running it twice in
  succession on the same `Info.plist` MUST produce a byte-
  identical result to running it once.
- **FR-113**: The plugin MUST coexist with all prior plugins
  (007/013/014/019/023/025/026/027/028/029/030): when run
  sequentially in `app.json` declaration order, no prior plugin's
  keys are removed, reordered, or overwritten.

#### Repository hygiene

- **FR-120**: No `eslint-disable` directives may be introduced in
  any file added or modified by this feature.
- **FR-121**: `pnpm format` MUST be run before the final commit;
  the resulting diff MUST be the only formatting delta.
- **FR-122**: `pnpm check` (the project's aggregate lint+
  typecheck+test gate) MUST pass green on the feature branch
  prior to merge.
- **FR-123**: All native bridges MUST be mocked at the import
  boundary in unit tests using the `jest.isolateModules` +
  `jest.doMock` pattern from
  `test/unit/native/background-tasks.test.ts`; no test may
  exercise the real native module.
- **FR-124**: All UI components MUST use the project theming
  primitives (`ThemedText`, `ThemedView`, `Spacing`); raw colour
  literals are forbidden per
  `.specify/memory/constitution.md` v1.1.0.

### Key Entities

- **SearchableItem**: One indexable record. Fields: `id` (string,
  unique), `title` (string), `contentDescription` (string),
  `keywords` (string[]), `domainIdentifier` (string, fixed to
  `"com.izkizk8.spot.modules"`).
- **UserActivityDescriptor**: The payload passed to
  `markCurrentActivity`. Fields: `title` (string), `keywords`
  (string[]), `userInfo` (`Record<string,string>`, optional).
- **IndexedState**: Per-item in-memory mirror of system index
  membership during the current session. Values: `indexed`,
  `not indexed`. Authoritative state is the system index, which
  may evict at any time.
- **ActivityState**: The live `NSUserActivity`'s status pill
  value. Values: `active`, `inactive`.
- **SearchResult**: A `SearchableItem` returned from
  `CSSearchQuery`; identical shape to `SearchableItem`.

## Non-Functional Requirements

- **NFR-001 (Performance)**: Screen mount to first meaningful
  paint MUST complete within 250 ms on a mid-tier iPhone
  (excluding any awaited bridge calls, which run after first
  paint).
- **NFR-002 (Reliability)**: Bridge call failures (`index`,
  `delete`, `deleteAll`, `search`, `markCurrentActivity`,
  `clearCurrentActivity`) MUST never crash the screen; each MUST
  degrade to an observable error on the hook's `error` channel.
- **NFR-003 (Battery)**: Bulk **Index all** for the full
  registry-mapped item set MUST complete in under 1 s of bridge
  wall-clock on a mid-tier iPhone; the operation MUST be a
  single batch call to `CSSearchableIndex` (no per-item
  round-trip).
- **NFR-004 (Privacy)**: No PII is indexed. The mapped
  `SearchableItem` set contains only static module metadata
  (title, description, keywords) drawn from the in-app registry.
  No userInfo on the demo `NSUserActivity` carries user-supplied
  data; `userInfo` is fixed to `{ source: 'spotlight-lab' }`.
- **NFR-005 (Compatibility)**: Coexists additively with every
  prior plugin and registry entry. Plugin against a fresh
  `Info.plist` and against an `Info.plist` already augmented by
  features 007/013/014/019/023/025/026/027/028/029/030 both
  produce valid manifests.
- **NFR-006 (Offline)**: All UI states (items list, search
  results, activity status) render without network. CoreSpotlight
  is a local system service; no network is required for any
  bridge method.
- **NFR-007 (Accessibility)**: Per-row toggles, bulk CTAs,
  search input, and activity pill MUST expose accessibility
  labels and roles consistent with prior modules. Status pills
  MUST not rely on colour alone to communicate state.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A reviewer who has never used CoreSpotlight can,
  within 60 seconds of opening the card, identify which CTAs
  add/remove items from the system index versus which CTA marks
  the current screen as an `NSUserActivity` — verified by a
  single read of the explainer card and the panel labels.
- **SC-002**: From a cold launch, tapping **Index all** resolves
  in under 1 s of bridge wall-clock on a mid-tier iPhone.
- **SC-003**: After **Index all** resolves, the in-app
  SearchTestCard search for `spot showcase` returns ≥ 1 match
  in 100% of cases (given a healthy system index).
- **SC-004**: Toggling a single row from `not indexed` to
  `indexed` produces a Spotlight-discoverable entry within 5 s
  of bridge resolution in ≥ 95% of attempts on a mid-tier
  iPhone (system indexing latency is non-deterministic; the
  threshold reflects observed iOS behaviour).
- **SC-005**: Plugin idempotency: running `expo prebuild` twice
  consecutively produces a byte-identical `Info.plist`.
- **SC-006**: Zero `eslint-disable` directives are introduced;
  `pnpm check` passes green; `pnpm format` produces no further
  diff after the feature commit.
- **SC-007**: Cross-platform safety: importing
  `src/modules/spotlight-lab` on Android or Web does not pull
  the iOS-only bridge module into the bundle (verified by the
  bundler not erroring and by `screen.web.tsx` /
  `screen.android.tsx` rendering without exception in unit
  tests).
- **SC-008**: Coexistence: running this plugin after every
  prior feature's plugin in `app.json` order yields an
  `Info.plist` whose `NSUserActivityTypes` is a superset
  containing `spot.showcase.activity` plus any prior entries.
- **SC-009**: Activity hygiene: a screen unmount with an active
  `NSUserActivity` always invalidates the activity (no
  activity outlives the screen) — verified by unit test on
  the hook's effect cleanup.

## Acceptance Criteria

- **AC-SPL-001**: `src/modules/registry.ts` size grows by
  exactly one entry; the diff touches no other registry entry.
- **AC-SPL-002**: `app.json` `plugins` array gains exactly one
  new entry (`./plugins/with-spotlight`); no other plugin
  entries are reordered or removed.
- **AC-SPL-003**: Snapshot of `Info.plist` after `expo prebuild`
  contains `NSUserActivityTypes` as a superset containing
  `"spot.showcase.activity"`.
- **AC-SPL-004**: The following test files exist and pass:
  - `searchable-items-source.test.ts`
  - `useSpotlightIndex.test.tsx`
  - `components/ExplainerCard.test.tsx`
  - `components/IndexableItemsList.test.tsx`
  - `components/ItemRow.test.tsx`
  - `components/BulkActionsCard.test.tsx`
  - `components/SearchTestCard.test.tsx`
  - `components/UserActivityCard.test.tsx`
  - `components/PersistenceNoteCard.test.tsx`
  - `components/IOSOnlyBanner.test.tsx`
  - `screen.test.tsx` + `.android.test.tsx` + `.web.test.tsx`
  - `native/spotlight.test.ts`
  - `plugins/with-spotlight/index.test.ts`
  - `manifest.test.ts`
- **AC-SPL-005**: `searchable-items-source.test.ts` proves: the
  registry maps to `SearchableItem[]`; ids are unique; required
  fields are populated; empty-label fallback works;
  duplicate-id de-duplication works.
- **AC-SPL-006**: `useSpotlightIndex.test.tsx` proves: toggle a
  single item calls `index`/`delete`; bulk index calls `index`
  with the full set; bulk remove calls `deleteAll`; search
  resolves with mocked `SearchableItem[]`; markActivity /
  clearActivity drive the activity status; per-row toggles are
  disabled while bulk is in flight; rejections revert state and
  surface on `error`; unmount with active activity calls
  `clearCurrentActivity`.
- **AC-SPL-007**: `native/spotlight.test.ts` proves: bridge
  contract matches the typed surface; non-iOS stubs throw
  `SpotlightNotSupported` for every method except `isAvailable`
  (returns `false`); iOS code path delegates to the underlying
  native module (mocked using `jest.isolateModules` +
  `jest.doMock`).
- **AC-SPL-008**: `plugins/with-spotlight/index.test.ts`
  proves: it adds `spot.showcase.activity` to
  `NSUserActivityTypes`; idempotent on second run; coexists
  with all prior plugins (007/013/014/019/023/025/026/027/028/
  029/030) run sequentially; preserves any prior
  `NSUserActivityTypes` entries when present.
- **AC-SPL-009**: `manifest.test.ts` proves: registry entry
  has the expected id (`spotlight-lab`), label
  (`"Spotlight Indexing"`), platforms
  (`['ios','android','web']`), and `minIOS: '9.0'`.
- **AC-SPL-010**: `pnpm check` passes green; no
  `eslint-disable` directives are introduced; `pnpm format` is
  a no-op after the final commit.

## Out of Scope

- Deep-link routing from a Spotlight result back into a
  specific module screen.
- Custom `CSSearchableItemAttributeSet` extras (thumbnails,
  rich content URLs, ratings) beyond title /
  contentDescription / keywords.
- Android App Search parity.
- Web parity for either CoreSpotlight or `NSUserActivity`.
- Persistent record of which items were indexed when (across
  app launches).
- Telemetry, analytics, or remote config.
- Authentication, ACLs, or per-user index partitioning.

## Open Questions (resolved)

The user marked themselves unavailable for clarification. The
following decisions were resolved autonomously by the most
reasonable additive interpretation, consistent with prior
features (025–030):

- **DECISION 1 — Registry id and label**: `id: 'spotlight-lab'`,
  label `"Spotlight Indexing"`. Rationale: matches the
  `<feature>-lab` naming convention used by 028/029/030.
- **DECISION 2 — `domainIdentifier` literal**:
  `"com.izkizk8.spot.modules"`. Rationale: derived from the
  existing `app.json` bundle id; a single namespace makes
  `deleteAll()` clean up exactly what this module owns.
- **DECISION 3 — Activity type literal**:
  `"spot.showcase.activity"` (per feature description's
  explicit decision). The plugin freezes this literal in
  `NSUserActivityTypes`; the Swift `UserActivityHelper`
  references the same literal.
- **DECISION 4 — Search default `limit`**: 25 results.
  Rationale: enough to demonstrate multiple matches without
  flooding the screen on a small device.
- **DECISION 5 — In-memory mirror of indexed-state**: best-
  effort `Set<string>` in the hook reducer. Rationale: the
  system index is authoritative and may evict at any time;
  persisting the mirror across launches would risk false
  positives. PersistenceNoteCard documents this contract.
- **DECISION 6 — Indexed-state on mount**: do NOT auto-index;
  badges start at `not indexed` on every mount. The user must
  explicitly tap **Index all** or per-row toggles. Rationale:
  avoids hidden battery / system-index churn and makes the
  feature observable from a known-clean state.
- **DECISION 7 — Cross-platform behaviour**: card is
  registered for all platforms (per the feature description);
  Android and Web render IOSOnlyBanner + ExplainerCard +
  PersistenceNoteCard so the catalogue stays parity-clean.
  The bridge is not imported on the web path.
- **DECISION 8 — Android App Search**: deferred. The Android
  bridge stub throws `SpotlightNotSupported` on every method.
  A v2 could add `androidx.appsearch` parity.
- **DECISION 9 — Activity userInfo**: fixed to
  `{ source: 'spotlight-lab' }`. Rationale: deterministic,
  PII-free, and easy to recognise in `application(_:continue:
  restorationHandler:)` if a future feature adds restoration.
- **DECISION 10 — Activity lifecycle**: invalidated on screen
  unmount via the hook's effect cleanup (FR-064 / FR-106).
  Rationale: prevents an activity from outliving the screen,
  which is the documented Apple recommendation for transient
  current-state activities.
- **DECISION 11 — Bridge platform splitting**: follow feature
  030's pattern with `spotlight.ts` (iOS),
  `spotlight.web.ts`, `spotlight.android.ts`,
  `spotlight.types.ts`. Rationale: identical precedent
  reduces reviewer cognitive load.
- **DECISION 12 — Plugin merge semantics**:
  `NSUserActivityTypes` is merged by union and
  de-duplicated; prior entries are preserved. The plugin
  never removes or reorders prior entries (mirrors feature
  030's `UIBackgroundModes` policy).
- **DECISION 13 — Empty-query search**: disabled at the
  CTA level; the user cannot submit. Rationale: avoids an
  ambiguous "no results" state that is actually "no query".
- **DECISION 14 — Error surfacing**: all hook-level errors
  flow through a single `error` field on the hook return,
  consistent with features 028 / 029 / 030. No screen-level
  error boundary is introduced.
- **DECISION 15 — `kUTTypeData` vs UTType**: the Swift
  indexer uses `kUTTypeData` on iOS 9–13 and the modern
  `UTType.data` equivalent on iOS 14+; choice is made at
  the Swift implementation layer and does not affect the
  bridge contract.
