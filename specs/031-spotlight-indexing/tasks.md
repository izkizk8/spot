---
description: "Dependency-ordered task list for feature 031 — CoreSpotlight Indexing Module (`spotlight-lab`)"
---

# Tasks: CoreSpotlight Indexing Module (`spotlight-lab`)

**Input**: Design documents from `/specs/031-spotlight-indexing/`
**Prerequisites**: plan.md (required), spec.md (required), data-model.md, quickstart.md, research.md, contracts/{searchable-items-source,spotlight-bridge,manifest,with-spotlight-plugin}.contract.ts.

**Tests**: REQUIRED — every component, every screen variant, the manifest, the bridge (iOS + Android + Web + types), the `searchable-items-source` mapper, the `useSpotlightIndex` hook, and the plugin has an explicit unit test (AC-SPL-004..009, FR-123, Constitution Principle V). The Swift surface (two new files under `native/ios/spotlight/`) is verified on-device per `quickstart.md` (Constitution V exemption mirroring 007 / 013 / 014 / 027 / 028 / 029 / 030).

**Organization**: Tasks are grouped by the plan's phased file inventory (mirrors 030's layout). Spec defines four user stories (US1: index registry items — P1; US2: search the system index — P1; US3: drive `NSUserActivity` — P2; US4: cross-platform fallback — P3); all four ship together as one module so tasks are organised by file/dependency rather than per-story phases. [Story] tags are attached to story-specific surfaces for traceability.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: `[US1]`, `[US2]`, `[US3]`, `[US4]` where the task delivers a story-specific surface; foundational and infra tasks have no story tag
- All file paths are repository-relative under the worktree root `C:\Users\izkizk8\spot-031-spotlight`
- Tests live under `test/unit/modules/spotlight-lab/`, `test/unit/native/`, and `test/unit/plugins/with-spotlight/` (NOT colocated; matches 014/027/028/029/030 layout)
- **No commits are produced by `/speckit.tasks`.** "Checkpoint commit" tasks below are markers for the implementation phase; the orchestrator commits at end.
- **TDD cadence**: every implementation task is preceded by a RED test task. RED tests must fail with module-not-found / undefined-symbol errors before the matching implementation begins (Constitution Principle V).

---

## Overview

Feature 031 adds an iOS 9+ CoreSpotlight + `NSUserActivity` showcase module. Three classes of artefact are produced:

1. **TypeScript surface** — one module (`src/modules/spotlight-lab/`) with a manifest, three platform-suffixed screen variants, a pure `searchable-items-source.ts` mapper, a `useSpotlightIndex` hook, and eight UI components. Plus a four-file JS bridge (`src/native/spotlight.{ts,android.ts,web.ts,types.ts}`) mirroring 030's `background-tasks.*` shape.
2. **Swift surface** — two files under `native/ios/spotlight/` (`SpotlightIndexer.swift` + `UserActivityHelper.swift`) appended to the **main app target** via the existing autolinking pipeline (NOT via this feature's plugin; plugin scope is `Info.plist` `NSUserActivityTypes` only — see plan §"Structure Decision" #4).
3. **Plugin** — `plugins/with-spotlight/` (idempotent, commutative with 007/013/014/019/023/025/026/027/028/029/030; mutates only `Info.plist`'s `NSUserActivityTypes`).

Plus 2 additive integration edits (`src/modules/registry.ts` +1 import +1 array entry; `app.json` `plugins` +1 entry).

**Deliverable counts**: **24 source files + 2 additive edits + 16 test files** — split into **86 numbered tasks** across **13 phases**.

**Test baseline delta target**: **≥ +14 new Jest suites** (matches plan §"Test baseline tracking").

---

## Phase 1: Setup (Module + Plugin + Native + Test Scaffolding)

**Purpose**: Create the empty directory tree and the plugin package shell so subsequent file-creation tasks can run in parallel. No business logic.

- [ ] T001 [P] Create the module directory tree: `src/modules/spotlight-lab/`, `src/modules/spotlight-lab/components/`, and `src/modules/spotlight-lab/hooks/`. Add `.gitkeep` if a directory ends up empty after the phase. **Acceptance**: All three directories exist and are tracked.
- [ ] T002 [P] Create the plugin directory `plugins/with-spotlight/` with `package.json` containing `{ "name": "with-spotlight", "version": "0.0.0", "main": "index.ts", "types": "index.ts" }` (mirror `plugins/with-background-tasks/package.json`). Plugin source is created in Phase 10. **Acceptance**: File parses as valid JSON; `main` points to `index.ts`; `dependencies` is absent or empty (NFR-005).
- [ ] T003 [P] Create the Swift source directory `native/ios/spotlight/` with a `.gitkeep`. The Swift sources are authored in Phase 11. **Acceptance**: Directory exists and is tracked.
- [ ] T004 [P] Create the test directory tree: `test/unit/modules/spotlight-lab/`, `test/unit/modules/spotlight-lab/components/`, `test/unit/modules/spotlight-lab/hooks/`, `test/unit/plugins/with-spotlight/`. Add `.gitkeep` if empty after this phase. **Acceptance**: All four directories exist and are tracked.
- [ ] T005 **Checkpoint commit** marker: `chore(031): scaffold spotlight-lab module/plugin/test/native dirs`.

---

## Phase 2: Foundational — Shared Bridge Types (`src/native/spotlight.types.ts`)

**Purpose**: Define `SearchableItem`, `UserActivityDescriptor`, `IndexedState`, `ActivityState`, `SpotlightBridge` interface, and `SpotlightNotSupported` error class. Every component, every screen variant, the bridge runtime variants, the hook, and the source mapper depend on these symbols. Imported safely on every platform (no native module access at evaluation time, per FR-012 / SC-007).

**⚠️ CRITICAL**: Nothing in Phase 3+ may begin until this phase completes (foundational types).

### Tests for shared types (RED)

- [ ] T006 Write `test/unit/native/spotlight.types.test.ts` covering every obligation in `contracts/spotlight-bridge.contract.ts` that is purely type-/value-level:
  1. `SpotlightNotSupported` is a `class` whose instances pass `instanceof SpotlightNotSupported` and `instanceof Error` (FR-091 / FR-092).
  2. `SpotlightNotSupported` carries a stable `name === 'SpotlightNotSupported'`.
  3. `IndexedState` accepts exactly the literals `'indexed'` and `'not-indexed'` (FR-030 / FR-031).
  4. `ActivityState` accepts exactly the literals `'active'` and `'inactive'` (FR-060..063).
  5. A `SearchableItem` value matching `{ id, title, contentDescription, keywords, domainIdentifier }` typechecks; missing `id` or `title` fails compilation; `keywords: string[]` (data-model.md / FR-020..024).
  6. A `UserActivityDescriptor` value matching `{ title, keywords, userInfo }` typechecks; `userInfo` is an arbitrary JSON-serialisable record (FR-061 / NFR-004).

  RED until `src/native/spotlight.types.ts` exists. **Acceptance**: ≥6 distinct `it()`/type assertions; all fail with module-not-found. **Spec ref**: FR-020..024, FR-061, FR-090, FR-091, FR-092; contract `spotlight-bridge.contract.ts`.

### Implementation (GREEN)

- [ ] T007 Implement `src/native/spotlight.types.ts` per `contracts/spotlight-bridge.contract.ts`: export `IndexedState` alias `'indexed' | 'not-indexed'`, `ActivityState` alias `'active' | 'inactive'`, `SearchableItem` interface (`id: string; title: string; contentDescription: string; keywords: string[]; domainIdentifier: string`), `UserActivityDescriptor` interface (`title: string; keywords: string[]; userInfo: Record<string, unknown>`), `SpotlightBridge` interface (FR-090 surface — `index`, `delete`, `deleteAll`, `search`, `markCurrentActivity`, `clearCurrentActivity`, `isAvailable`), and `SpotlightNotSupported` class extending `Error`. Make T006 pass. **Acceptance**: T006 green; `pnpm typecheck` clean; no global symbol collisions with `app-intents.types`, `widget-center.types`, `focus-filters.types`, or `background-tasks.types`. **Spec ref**: FR-020..024, FR-061, FR-090..092.

---

## Phase 3: Foundational — Source Mapper (`src/modules/spotlight-lab/searchable-items-source.ts`)

**Purpose**: Pure function `mapRegistryToItems(registry, opts?)` that maps the iOS Showcase module registry to `SearchableItem[]`. Deterministic id derivation (`${domainIdentifier}.${module.id}`); empty-label fallback (title ← `module.id`; keywords ← `[]`); duplicate-id de-duplication with `onError(duplicateId)` callback fired exactly once per duplicate (R-B). No React imports, no I/O.

### Tests (RED)

- [ ] T008 Write `test/unit/modules/spotlight-lab/searchable-items-source.test.ts` covering every obligation in `contracts/searchable-items-source.contract.ts` and AC-SPL-005 / FR-020..024 / EC-003 / EC-004:
  1. Given a registry of 3 distinct modules with full metadata, returns 3 `SearchableItem`s with ids `com.izkizk8.spot.modules.<id>` for each (FR-021 / FR-022).
  2. Every returned item has `domainIdentifier === 'com.izkizk8.spot.modules'` (FR-022).
  3. Every returned `keywords` field is `string[]`; missing/undefined keywords on the source produce `[]` (FR-023).
  4. Source module with empty `label` falls back to `title === module.id` (FR-023 / EC-003).
  5. Source module with empty `description` falls back to `contentDescription === ''` (or the explicit fallback documented in the contract).
  6. Two source entries sharing the same `id`: result contains exactly one item (de-dup); `onError` invoked once with the offending id (FR-024 / EC-004).
  7. Three source entries sharing the same `id`: result contains exactly one item; `onError` invoked **once** total (not per duplicate occurrence — see contract clause "exactly once per duplicate id"); duplicate determined by id, not by index.
  8. `onError` omitted: function does not throw on duplicates (best-effort tolerance).
  9. Empty registry: returns `[]`; `onError` not invoked.
  10. Result is stable across calls with the same input (deterministic ordering matches input order, with duplicates removed at the trailing position).
  11. Output is a fresh array (no mutation of the input registry).

  RED until `searchable-items-source.ts` exists. **Acceptance**: ≥11 distinct `it()` blocks; all fail with module-not-found. **Spec ref**: FR-020..024, EC-003, EC-004, AC-SPL-005, R-B.

### Implementation (GREEN)

- [ ] T009 Implement `src/modules/spotlight-lab/searchable-items-source.ts` per `contracts/searchable-items-source.contract.ts`: export `DOMAIN_IDENTIFIER = 'com.izkizk8.spot.modules'` and `mapRegistryToItems(registry: ReadonlyArray<ModuleManifest>, opts?: { onError?: (duplicateId: string) => void }): SearchableItem[]`. Single-pass: derive id, apply empty-label/keyword fallbacks, dedupe by id (first-wins), invoke `onError` once per duplicate id. No React imports. Make T008 pass. **Acceptance**: T008 green; `pnpm typecheck` clean; no `eslint-disable` (FR-120). **Spec ref**: FR-020..024, EC-003, EC-004, AC-SPL-005, R-B.

- [ ] T010 **Checkpoint commit** marker: `feat(031): foundational types + searchable-items-source mapper`.

---

## Phase 4: JS Bridge — non-iOS variants (`src/native/spotlight.android.ts`, `.web.ts`)

**Purpose**: Cross-platform stubs that throw `SpotlightNotSupported` on every method except `isAvailable()` (returns `false`). Imported by Android / Web screen variants without pulling any iOS-only symbol (FR-091 / SC-007).

### Tests (RED)

- [ ] T011 [P] [US4] Write `test/unit/native/spotlight.android.test.ts` (use `jest.isolateModules` + `jest.doMock` per FR-123, mirror `background-tasks.test.ts` style):
  1. `isAvailable()` returns `false` (FR-091).
  2. `index([item])` rejects with `SpotlightNotSupported`.
  3. `delete(['id'])` rejects with `SpotlightNotSupported`.
  4. `deleteAll()` rejects with `SpotlightNotSupported`.
  5. `search('q', 25)` rejects with `SpotlightNotSupported`.
  6. `markCurrentActivity({ title: 't', keywords: [], userInfo: {} })` rejects with `SpotlightNotSupported`.
  7. `clearCurrentActivity()` rejects with `SpotlightNotSupported`.
  8. The thrown error is `instanceof SpotlightNotSupported` AND `instanceof Error` (FR-092).
  9. Importing the module does NOT call `requireOptionalNativeModule` (assert via spy — defensive against accidental iOS import on Android).

  RED until `spotlight.android.ts` exists. **Spec ref**: FR-091, FR-092, US4 AS3, SC-007.

- [ ] T012 [P] [US4] Write `test/unit/native/spotlight.web.test.ts` mirroring T011 but for the `.web.ts` variant; additionally assert that the file does NOT statically import `react-native`'s `Platform` module nor `expo-modules-core`'s `requireOptionalNativeModule` (FR-012 / SC-007). **Spec ref**: FR-012, FR-091, FR-092, SC-007.

### Implementation (GREEN)

- [ ] T013 [P] [US4] Implement `src/native/spotlight.android.ts`: re-export `SpotlightNotSupported` from `./spotlight.types`; export `isAvailable: () => false` and six async methods that all reject with `new SpotlightNotSupported(...)`. Make T011 pass. **Spec ref**: FR-091, FR-092.
- [ ] T014 [P] [US4] Implement `src/native/spotlight.web.ts`: identical surface to `.android.ts` (re-export the same shape). MUST NOT import `expo-modules-core`, `react-native`'s native bridge, or any iOS-only symbol. Make T012 pass. **Spec ref**: FR-012, FR-091, FR-092, SC-007.

---

## Phase 5: JS Bridge — iOS variant (`src/native/spotlight.ts`)

**Purpose**: iOS implementation that gates on `Platform.OS === 'ios'` + `requireOptionalNativeModule('Spotlight')`, exposes the typed surface (FR-090), and serialises concurrent **mutating** calls (`index`, `delete`, `deleteAll`, `markCurrentActivity`, `clearCurrentActivity`) through a single in-memory promise chain (R-A / FR-103). Read-only `search` and `isAvailable` are NOT serialised.

### Tests (RED)

- [ ] T015 [US1] [US2] [US3] Write `test/unit/native/spotlight.test.ts` covering AC-SPL-007 and the bridge contract (use `jest.isolateModules` + `jest.doMock`):
  1. With the native module mocked present and `Platform.OS === 'ios'`, `isAvailable()` returns `true`.
  2. `index([item1, item2])` calls the mocked native `index` with the two items verbatim, exactly once (FR-090).
  3. `delete(['id1', 'id2'])` forwards both ids to the mocked native `delete` (FR-090).
  4. `deleteAll()` delegates to the mocked native `deleteAll`.
  5. `search('term', 25)` resolves with whatever the mocked native returns (FR-090).
  6. `markCurrentActivity({ title: 't', keywords: ['k'], userInfo: { source: 'spotlight-lab' } })` forwards the descriptor verbatim (FR-061).
  7. `clearCurrentActivity()` delegates to the mocked native `clearCurrentActivity`.
  8. With the native module mocked absent (`requireOptionalNativeModule` returns `null`), every mutating method rejects with `SpotlightNotSupported`; `isAvailable()` returns `false`; `search(...)` rejects with `SpotlightNotSupported` (FR-091 / FR-092 / EC-002).
  9. Two back-to-back `index([a])` + `index([b])` calls produce exactly two native invocations in submission order (R-A / FR-103); a sleep-mocked first call delays the second.
  10. If the first mutating call rejects, the second mutating call still executes and resolves/rejects on its own merits (chain doesn't poison subsequent calls — R-A).
  11. `search(...)` is NOT serialised through the mutation chain (a sleep-mocked in-flight `index` does NOT delay a concurrent `search`).
  12. `SpotlightNotSupported` thrown from a non-iOS code path is `instanceof SpotlightNotSupported` (FR-092).
  13. Typed surface matches the contract (`index: (items: SearchableItem[]) => Promise<void>`, etc.) — verified via `expectType<...>()` or equivalent.

  RED until `spotlight.ts` exists. **Acceptance**: ≥13 `it()` blocks; all fail with module-not-found. **Spec ref**: FR-090..092, FR-103, R-A, AC-SPL-007.

### Implementation (GREEN)

- [ ] T016 [US1] [US2] [US3] Implement `src/native/spotlight.ts`: import the typed surface from `./spotlight.types`; gate `Platform.OS === 'ios'` + `requireOptionalNativeModule('Spotlight')`; expose `index`, `delete`, `deleteAll`, `search`, `markCurrentActivity`, `clearCurrentActivity`, `isAvailable`. Implement the closure-scoped promise chain `let chain: Promise<unknown> = Promise.resolve();` for the five mutating methods only (per R-A). When the optional native module is absent, every method except `isAvailable` rejects with `new SpotlightNotSupported(...)`. Make T015 pass. **Acceptance**: T015 green; `pnpm typecheck` clean; bridge has zero `console.log` / `eslint-disable`. **Spec ref**: FR-090..092, FR-103, R-A, AC-SPL-007.

- [ ] T017 **Checkpoint commit** marker: `feat(031): JS bridge variants (ios + android + web) with serialised mutation chain`.

---

## Phase 6: Hook (`src/modules/spotlight-lab/hooks/useSpotlightIndex.ts`)

**Purpose**: React hook wrapping bridge + source mapper. Returns `{ items, indexedIds, isAvailable, isBusy, error, toggleItem, indexAll, removeAll, search, results, markActivity, clearActivity, activityActive }`. Reducer-serialised UI state (FR-103). Tolerates `SpotlightNotSupported` (resolves to degraded state; never propagates to UI). Effect cleanup invalidates active activity on unmount via a `ref`-tracked latest reducer value (R-C / FR-106 / SC-009).

### Tests (RED)

- [ ] T018 [US1] [US2] [US3] [US4] Write `test/unit/modules/spotlight-lab/hooks/useSpotlightIndex.test.tsx` covering AC-SPL-006 / FR-100..106 / EC-009 / SC-009:
  1. On mount, `items` is initialised from `mapRegistryToItems(MODULES)`; `indexedIds` is an empty `Set` (DECISION 6 / FR-102).
  2. `toggleItem('id1')` from `not-indexed → indexed` calls `bridge.index([item1])` exactly once and adds `'id1'` to `indexedIds` (FR-031).
  3. `toggleItem('id1')` from `indexed → not-indexed` calls `bridge.delete(['id1'])` exactly once and removes `'id1'` from `indexedIds`.
  4. `indexAll()` calls `bridge.index(items)` with the full mapped item set, exactly once; on resolve, `indexedIds` contains every item's id (FR-041).
  5. `removeAll()` calls `bridge.deleteAll()` exactly once; on resolve, `indexedIds` is empty (FR-042).
  6. While `indexAll`/`removeAll` is in flight, `isBusy === true`; per-row `toggleItem` calls are rejected/queued (FR-032 / FR-043).
  7. `search('term')` calls `bridge.search('term', 25)` (default limit per DECISION 4); resolves into `results` (FR-052).
  8. `search('')` does NOT call the bridge (CTA-disabled semantics in the hook contract; FR-051 / EC-005).
  9. `markActivity({ title, keywords })` calls `bridge.markCurrentActivity({ title, keywords, userInfo: { source: 'spotlight-lab' } })` (DECISION 9 / FR-061 / NFR-004); `activityActive` flips to `'active'` (FR-063 mirror).
  10. `clearActivity()` calls `bridge.clearCurrentActivity()`; `activityActive` flips to `'inactive'` (FR-063).
  11. Per-row toggle rejection (`bridge.index` rejects with generic Error): the hook reverts the row's state to its pre-call value AND surfaces the error on `error` (FR-033 / FR-104).
  12. `bridge.search` rejection: `results` is cleared to `[]`, error surfaced on `error` (FR-054).
  13. When `bridge.isAvailable()` returns `false`, the hook resolves to a degraded state (`isAvailable === false`; mutating calls are no-ops with `SpotlightNotSupported` swallowed silently per US4 AS3 / EC-002); `error` is `null`.
  14. Two rapid `toggleItem('id1')` calls reduce to a single in-flight reducer state and produce ordered native invocations (FR-103 / R-A).
  15. Unmount with `activityActive === 'active'` invokes `bridge.clearCurrentActivity()` exactly once via the effect cleanup (R-C / FR-064 / FR-106 / SC-009); the `ref`-tracked latest reducer value (NOT closure-captured) is used.
  16. Unmount with `activityActive === 'inactive'` does NOT call `bridge.clearCurrentActivity()`.
  17. Unmount cancels all pending subscriptions (no leak warnings).

  RED until the hook exists. **Acceptance**: ≥17 `it()` blocks; all fail with module-not-found. **Spec ref**: FR-100..106, EC-002, EC-005, EC-009, AC-SPL-006, R-A, R-C, SC-009.

### Implementation (GREEN)

- [ ] T019 [US1] [US2] [US3] [US4] Implement `src/modules/spotlight-lab/hooks/useSpotlightIndex.ts`: `useReducer`-based; calls `mapRegistryToItems(MODULES)` on mount; subscribes to bridge `isAvailable()`; exposes the full surface listed in plan §"Project Structure". Reducer is the single source of bridge interaction (FR-103). Catches `SpotlightNotSupported` silently (renders degraded); surfaces all other errors on `error`. `useEffect` cleanup uses a `ref`-tracked latest reducer snapshot to invalidate any active activity at unmount (R-C). Make T018 pass. **Acceptance**: T018 green; reducer is the single source of bridge interaction; no race-leaking subscriptions; `pnpm typecheck` clean. **Spec ref**: FR-100..106, AC-SPL-006, R-A, R-C, SC-009.

---

## Phase 7: Components (eight files in parallel)

**Purpose**: Eight presentational components used by the iOS screen and (where listed in plan §"Project Structure") the cross-platform fallbacks. All chrome via `ThemedView` / `ThemedText` and `Spacing` from `src/constants/theme.ts`; `StyleSheet.create()` only (Constitution IV); no inline objects.

### Tests (RED) — runnable in parallel

- [ ] T020 [P] Write `test/unit/modules/spotlight-lab/components/ExplainerCard.test.tsx`: renders prose mentioning `CSSearchableIndex`, `NSUserActivity`, and the home-screen test recipe ("swipe down on home → search 'spot showcase'"); renders without props on every platform. ≥4 `it()` blocks. **Spec ref**: spec §Overview panel 1, EC-006.
- [ ] T021 [P] [US1] Write `test/unit/modules/spotlight-lab/components/IndexableItemsList.test.tsx`: renders 0 / 1 / N rows from an `items` prop; delegates per-row rendering to `ItemRow`; passes the `indexedIds` set down so each row can compute its `IndexedState` badge; passes the `bulkPending` flag down to disable per-row toggles (FR-032). ≥5 `it()` blocks. **Spec ref**: FR-030..032, AC-SPL-004.
- [ ] T022 [P] [US1] Write `test/unit/modules/spotlight-lab/components/ItemRow.test.tsx`: renders title, contentDescription, keyword chips, `IndexedState` badge in both states (`'indexed'` / `'not-indexed'`), and a per-row toggle CTA; tapping the toggle calls injected `onToggle(id)` exactly once (FR-031); toggle is disabled when `bulkPending === true` (FR-032); per-row rejection path: when `state` is reverted via prop after a rejection, the badge re-renders to the pre-call value (FR-033). ≥6 `it()` blocks. **Spec ref**: FR-030..033, AC-SPL-004.
- [ ] T023 [P] [US1] Write `test/unit/modules/spotlight-lab/components/BulkActionsCard.test.tsx`: both CTAs visible with labels "Index all" and "Remove all from index" (FR-040); tapping each calls injected `onIndexAll` / `onRemoveAll` exactly once (FR-041 / FR-042); both CTAs disabled while `pending === true` (FR-043); pending indicator visible while pending. ≥5 `it()` blocks. **Spec ref**: FR-040..043, AC-SPL-004.
- [ ] T024 [P] [US2] Write `test/unit/modules/spotlight-lab/components/SearchTestCard.test.tsx`: input + CTA labelled "Search Spotlight" (FR-050); CTA disabled while input is empty OR while `pending === true` (FR-051 / EC-005); submit calls injected `onSearch(query)` exactly once with the trimmed query (FR-052); results list renders 0 / 1 / N matches; explicit empty-state line when results.length === 0 AND a query has been submitted (FR-053); rejection clears results and surfaces a row-level error indicator (FR-054). ≥6 `it()` blocks. **Spec ref**: FR-050..054, AC-SPL-004, EC-005.
- [ ] T025 [P] [US3] Write `test/unit/modules/spotlight-lab/components/UserActivityCard.test.tsx`: both CTAs visible with labels "Mark this screen as current activity" and "Clear current activity" (FR-060); tapping each calls injected `onMark` / `onClear` exactly once (FR-061 / FR-063); status pill renders both `'active'` and `'inactive'` variants (FR-062 mirror); embedded comparison block mentions the `CSSearchableIndex` vs. `NSUserActivity` contrast. ≥5 `it()` blocks. **Spec ref**: FR-060..063, AC-SPL-004.
- [ ] T026 [P] Write `test/unit/modules/spotlight-lab/components/PersistenceNoteCard.test.tsx`: static prose mentions system-managed eviction AND the re-index-from-stable-source recommendation (FR-070 / FR-071); renders without props on every platform; uses `ThemedText` / `ThemedView`; no raw colour literals. ≥3 `it()` blocks. **Spec ref**: FR-070, FR-071, AC-SPL-004, EC-006.
- [ ] T027 [P] [US4] Write `test/unit/modules/spotlight-lab/components/IOSOnlyBanner.test.tsx`: renders the default "Spotlight indexing requires iOS 9+" copy; renders an alternative copy variant when prop `reason === 'system-disabled'` (system-disabled-on-iOS case per FR-013 / EC-002); renders without crashing on Android / Web. ≥3 `it()` blocks. **Spec ref**: FR-011, FR-013, EC-002, AC-SPL-004.

  All eight tests RED. **Acceptance**: each fails with module-not-found.

### Implementation (GREEN) — runnable in parallel after their RED partner exists

- [ ] T028 [P] Implement `src/modules/spotlight-lab/components/ExplainerCard.tsx`. Make T020 pass. **Spec ref**: spec §Overview panel 1, Constitution II/IV.
- [ ] T029 [P] [US1] Implement `src/modules/spotlight-lab/components/IndexableItemsList.tsx` (props: `items`, `indexedIds`, `bulkPending`, `onToggle`). Make T021 pass. **Spec ref**: FR-030..032.
- [ ] T030 [P] [US1] Implement `src/modules/spotlight-lab/components/ItemRow.tsx` (props: `item`, `state`, `bulkPending`, `onToggle`). Make T022 pass. **Spec ref**: FR-030..033.
- [ ] T031 [P] [US1] Implement `src/modules/spotlight-lab/components/BulkActionsCard.tsx` (props: `pending`, `onIndexAll`, `onRemoveAll`). Make T023 pass. **Spec ref**: FR-040..043.
- [ ] T032 [P] [US2] Implement `src/modules/spotlight-lab/components/SearchTestCard.tsx` (props: `pending`, `results`, `error`, `onSearch`). Make T024 pass. **Spec ref**: FR-050..054.
- [ ] T033 [P] [US3] Implement `src/modules/spotlight-lab/components/UserActivityCard.tsx` (props: `state`, `onMark`, `onClear`). Make T025 pass. **Spec ref**: FR-060..063.
- [ ] T034 [P] Implement `src/modules/spotlight-lab/components/PersistenceNoteCard.tsx`. Make T026 pass. **Spec ref**: FR-070, FR-071.
- [ ] T035 [P] [US4] Implement `src/modules/spotlight-lab/components/IOSOnlyBanner.tsx` (props: `reason?: 'older-ios' | 'system-disabled'`). Make T027 pass. **Spec ref**: FR-011, FR-013, EC-002.

- [ ] T036 **Checkpoint commit** marker: `feat(031): eight components GREEN`.

---

## Phase 8: Manifest (`src/modules/spotlight-lab/index.tsx`)

**Purpose**: Module manifest export consumed by the registry.

### Tests (RED)

- [ ] T037 Write `test/unit/modules/spotlight-lab/manifest.test.ts` covering AC-SPL-009 and `contracts/manifest.contract.ts`:
  1. `id === 'spotlight-lab'` (FR-001).
  2. `label === 'Spotlight Indexing'` (FR-001).
  3. `platforms` deep-equals `['ios', 'android', 'web']` in this order (FR-001).
  4. `minIOS === '9.0'` (FR-001).
  5. `screen` is a function / component reference (matches existing manifest contract used by 014/027/028/029/030).
  6. No global symbol collisions with prior modules' manifest exports.

  RED until `index.tsx` exists. **Spec ref**: FR-001, FR-002, AC-SPL-009.

### Implementation (GREEN)

- [ ] T038 Implement `src/modules/spotlight-lab/index.tsx` exporting the `ModuleManifest`-shaped object with `id: 'spotlight-lab'`, `label: 'Spotlight Indexing'`, `platforms: ['ios','android','web']`, `minIOS: '9.0'`, and a `screen` reference resolving to the platform-suffixed screen (created in Phase 9). Make T037 pass. **Spec ref**: FR-001, FR-002.

---

## Phase 9: Screens — three platform variants

**Purpose**: `screen.tsx` (iOS 9+ — six panels in fixed order), `screen.android.tsx` (banner + explainer + persistence-note), `screen.web.tsx` (same as android; MUST NOT import the iOS bridge at module evaluation time).

### Tests (RED) — runnable in parallel

- [ ] T039 [P] [US1] [US2] [US3] Write `test/unit/modules/spotlight-lab/screen.test.tsx` (iOS path, with `useSpotlightIndex` mocked):
  1. Renders, in fixed top-to-bottom order, `ExplainerCard` → `IndexableItemsList` → `BulkActionsCard` → `SearchTestCard` → `UserActivityCard` → `PersistenceNoteCard` (FR-010).
  2. Tapping a per-row toggle invokes `useSpotlightIndex().toggleItem(id)` (US1 AS1).
  3. Tapping **Index all** invokes `useSpotlightIndex().indexAll()` (US1 AS2).
  4. Tapping **Remove all from index** invokes `useSpotlightIndex().removeAll()`.
  5. Submitting the search CTA invokes `useSpotlightIndex().search(query)` (US2 AS1).
  6. Tapping **Mark current activity** invokes `useSpotlightIndex().markActivity(...)` (US3 AS1).
  7. Tapping **Clear current activity** invokes `useSpotlightIndex().clearActivity()` (US3 AS2).
  8. When `useSpotlightIndex().isAvailable === false`, the screen renders `IOSOnlyBanner` (variant `reason='system-disabled'`) + `ExplainerCard` + `PersistenceNoteCard` only — index/search/activity panels absent (FR-013 / EC-002).
  9. The screen does NOT import any prior feature's screen module (isolation from 013/014/025/027/028/029/030).

  ≥9 `it()` blocks. **Spec ref**: FR-010, FR-013, EC-002, AC-SPL-004.

- [ ] T040 [P] [US4] Write `test/unit/modules/spotlight-lab/screen.android.test.tsx`:
  1. Renders `IOSOnlyBanner`, `ExplainerCard`, `PersistenceNoteCard` only (FR-011).
  2. `IndexableItemsList`, `BulkActionsCard`, `SearchTestCard`, `UserActivityCard` absent.
  3. No call to the bridge's mutating methods (assert via spy that `index` / `delete` / `deleteAll` / `markCurrentActivity` are never invoked) (FR-091 / US4 AS3).
  4. Render is exception-free even if the bridge is mocked as throwing on every call (FR-091 / US4 AS3).

  ≥4 `it()` blocks. **Spec ref**: FR-011, FR-091, US4 AS1/AS3, AC-SPL-004.

- [ ] T041 [P] [US4] Write `test/unit/modules/spotlight-lab/screen.web.test.tsx`:
  1. Renders the same component set as the android variant (FR-012).
  2. Asserts (via Jest module-loaded snapshot of `require.cache` or equivalent) that `src/native/spotlight.ts` is NOT loaded by the web bundle path (SC-007 / FR-012).
  3. Asserts the file does NOT statically import `src/native/spotlight` (only `src/native/spotlight.types` is permitted for the typed `SpotlightNotSupported` export, but no runtime bridge methods).

  ≥3 `it()` blocks. **Spec ref**: FR-012, SC-007, US4 AS2.

### Implementation (GREEN)

- [ ] T042 [US1] [US2] [US3] Implement `src/modules/spotlight-lab/screen.tsx` (iOS variant — six panels via the components + hook). Use `useSpotlightIndex()` for state. Render `IOSOnlyBanner` fallback when `isAvailable === false`. Make T039 pass. **Spec ref**: FR-010, FR-013, EC-002.
- [ ] T043 [P] [US4] Implement `src/modules/spotlight-lab/screen.android.tsx`. Imports only the cross-platform-safe components (`IOSOnlyBanner`, `ExplainerCard`, `PersistenceNoteCard`). Make T040 pass. **Spec ref**: FR-011.
- [ ] T044 [P] [US4] Implement `src/modules/spotlight-lab/screen.web.tsx`. MUST NOT import `src/native/spotlight` at module evaluation time. Make T041 pass. **Spec ref**: FR-012, SC-007.

- [ ] T045 **Checkpoint commit** marker: `feat(031): manifest + three screen variants GREEN`.

---

## Phase 10: Expo Config Plugin (`plugins/with-spotlight/`)

**Purpose**: Idempotent, additive `Info.plist` mutation: union-merge `NSUserActivityTypes` with the literal `'spot.showcase.activity'`, preserving every prior entry (R-D / FR-110 / FR-113). The plugin does NOT add `CoreSpotlight.framework` linkage — that comes from the Swift sources' autolinking (R-E / FR-111).

### Tests (RED)

- [ ] T046 Write `test/unit/plugins/with-spotlight/index.test.ts` covering AC-SPL-008 / FR-110..113 / SC-005 / SC-008 / EC-007:
  1. Applied to a fresh `Info.plist`, the result contains `NSUserActivityTypes: ['spot.showcase.activity']` (creates the array when absent) (FR-110).
  2. Applied to an `Info.plist` that already has `NSUserActivityTypes: ['com.example.shortcut']`, the result deep-equals `['com.example.shortcut', 'spot.showcase.activity']` — `toEqual`, NOT `toContain` — preserving prior entry at index 0 (FR-110 / FR-113 / EC-007 / R-D).
  3. Applied twice in sequence to the same `Info.plist` produces a `JSON.stringify`-identical result to applying once (idempotent — FR-112 / SC-005).
  4. Applied with the literal `'spot.showcase.activity'` already present in `NSUserActivityTypes`: result is unchanged (idempotent — defensive against double-include).
  5. Applied with all of {007-live-activity, 013-app-intents, 014-home-widgets, 019-sign-in-with-apple, 023-keychain, 025-core-location, 026-rich-notifications, 027-lock-widgets, 028-standby-widget, 029-focus-filters, 030-background-tasks} plugins applied first, in app.json declaration order: no prior plugin's keys are removed, reordered, or overwritten; `'spot.showcase.activity'` is present in `NSUserActivityTypes`; 030's `BGTaskSchedulerPermittedIdentifiers` and `UIBackgroundModes` are byte-identical to their pre-031 state (FR-113 / SC-008).
  6. Commutativity: ≥3 non-trivial permutations of {025, 029, 030, 031} plugin orderings produce semantically equivalent (`toEqual`) `Info.plist` outputs (FR-113).
  7. Plugin export shape matches `ConfigPlugin` from `@expo/config-plugins` (default export is a function of `(config) => config`).
  8. Plugin does NOT mutate `pbxproj` framework links (R-E / FR-111) — assert via mock that `withXcodeProject` is not invoked.
  9. No `eslint-disable` directives anywhere in the plugin source (FR-120).
  10. Plugin source has zero new runtime `dependencies` (NFR-005) — assert by reading `plugins/with-spotlight/package.json`.

  RED until `plugins/with-spotlight/index.ts` exists. **Acceptance**: ≥10 `it()` blocks. **Spec ref**: FR-110..113, EC-007, SC-005, SC-008, AC-SPL-008.

### Implementation (GREEN)

- [ ] T047 Implement `plugins/with-spotlight/index.ts`: default-export a `ConfigPlugin` that composes `withInfoPlist` to union-merge the literal `'spot.showcase.activity'` into `NSUserActivityTypes` (creating the array if absent) while preserving every prior entry verbatim in source order (`[...prior, …missing]`). Make T046 pass. **Acceptance**: T046 green; plugin source has zero new runtime dependencies (NFR-005); does not touch `pbxproj`. **Spec ref**: FR-110..113, EC-007, SC-005, SC-008, R-D, R-E.

- [ ] T048 **Checkpoint commit** marker: `feat(031): with-spotlight Expo config plugin GREEN`.

---

## Phase 11: Native iOS Swift surface (no JS-side test — on-device only)

**Purpose**: Author `SpotlightIndexer.swift` + `UserActivityHelper.swift` per FR-080..085. Cannot be unit-tested on the Windows dev environment (Constitution V exemption mirroring 007/013/014/027/028/029/030). Quickstart documents on-device verification.

- [ ] T049 [US1] [US2] Author `native/ios/spotlight/SpotlightIndexer.swift`: `@available(iOS 9.0, *)` enum/class wrapping `CSSearchableIndex.default()`. Builds a `CSSearchableItemAttributeSet(itemContentType:)` per `SearchableItem` using `kUTTypeData` on iOS 9–13 (`import MobileCoreServices`) and `UTType.data` on iOS 14+ (`import UniformTypeIdentifiers`), branching on `#available(iOS 14.0, *)` (DECISION 15 / FR-081). Sets `domainIdentifier = "com.izkizk8.spot.modules"` on every `CSSearchableItem` (FR-082). Exposes `index([SearchableItem])`, `delete([String])`, `deleteAll()`, `search(query: String, limit: Int) -> [SearchableItem]` to the JS bridge. `search(query:limit:)` runs a `CSSearchQuery` with a `queryString` derived from the input plus the standard attribute-key projection (`title`, `contentDescription`, `keywords`) and resolves with the mapped `SearchableItem[]` capped at `limit` (FR-083). All errors surfaced to the JS bridge for the caller's `error` channel. **Acceptance**: file compiles via the existing autolinking pipeline on a macOS build; verified on-device per `quickstart.md` (NOT verified on Windows). **Spec ref**: FR-080..083, R-E.
- [ ] T050 [US3] Author `native/ios/spotlight/UserActivityHelper.swift`: creates `NSUserActivity(activityType: "spot.showcase.activity")` with `title`, `keywords` as `Set<String>`, `userInfo` from the descriptor; sets `isEligibleForSearch = true` and `isEligibleForPrediction = true`; calls `becomeCurrent()`; retains the activity via `private var current: NSUserActivity?` (FR-084). Exposes `invalidate()` which calls `resignCurrent()` then `invalidate()` and releases the retained activity (FR-085 / FR-064). Re-marking while one is already current invalidates the prior activity first (defensive against EC-009). **Acceptance**: file compiles on macOS; verified on-device per `quickstart.md`. **Spec ref**: FR-084, FR-085, EC-009.
- [ ] T051 Update `specs/031-spotlight-indexing/quickstart.md` (if not already up to date from Phase 1 of plan) with the on-device verification steps for both Swift files: open card → toggle a row → swipe down on home → search the title → see the result (CSSearchableIndex path); **Index all** → search `spot showcase` → see multiple results; **Mark current activity** → swipe down on home → search the screen title → see the activity-driven entry (NSUserActivity path); **Clear** → re-search → entry disappears; navigate away while marked → confirm activity is invalidated (R-C / SC-009). **Acceptance**: quickstart §"Native verification" enumerates ≥5 verification steps. **Spec ref**: SC-002, SC-004, SC-009, quickstart.md.

- [ ] T052 **Checkpoint commit** marker: `feat(031): SpotlightIndexer.swift + UserActivityHelper.swift authored (on-device verification only)`.

---

## Phase 12: Integration edits (additive — registry + app.json) — ⚠ at the very END

**Purpose**: The two strictly-additive integration touchpoints. Per the user contract, these run **last** (after all module/plugin/Swift artefacts exist) so the registry never points at a non-existent screen and `app.json` never references a non-existent plugin folder.

- [ ] T053 Modify `src/modules/registry.ts`: add exactly one new `import { spotlightLab } from '@/modules/spotlight-lab'` line (or whatever import alias the codebase uses for prior modules) and exactly one new array entry (`spotlightLab`) — registry size +1; no existing entry modified or reordered. **Acceptance**: AC-SPL-001 holds — diff is +1 import line + +1 array entry only; `git diff src/modules/registry.ts` shows exactly two added lines. **Spec ref**: FR-001, AC-SPL-001.
- [ ] T054 Modify `app.json`: add `"./plugins/with-spotlight"` as exactly one new entry in the `plugins` array; no existing plugin entry is reordered or removed. **Acceptance**: AC-SPL-002 holds — diff is one new array entry only; plugin appears after every prior plugin (declaration order); `JSON.parse(fs.readFileSync('app.json')).expo.plugins` contains the new entry exactly once. **Spec ref**: FR-110, AC-SPL-002, SC-008.

- [ ] T055 **Checkpoint commit** marker: `feat(031): additive registry + app.json plugin integration`.

---

## Phase 13: Polish & Cross-Cutting Concerns

**Purpose**: Format, gate, status updates, and final verification. No new business logic.

- [ ] T056 Run `pnpm format` from the repo root. Stage any resulting whitespace-only delta (FR-121). **Acceptance**: a second `pnpm format` produces no further diff. **Spec ref**: FR-121, AC-SPL-010, SC-006.
- [ ] T057 Run `pnpm check` (the project's aggregate `lint + typecheck + test` gate) from the repo root. **Acceptance**: green; all ≥14 new Jest suites pass; `pnpm check` exit code 0; no `eslint-disable` directives introduced in any added or modified file (FR-120 / FR-122). **Spec ref**: FR-120, FR-122, AC-SPL-010, SC-006.
- [ ] T058 [P] Update `specs/spec-status.md`: append (or update) the row for feature 031 with the implementation status, test-suite delta (≥ +14), and a link to this `tasks.md`. **Acceptance**: row exists; status reflects this branch's terminal state; format consistent with prior rows for 029 / 030. **Spec ref**: spec governance / repo hygiene.
- [ ] T059 [P] Update `specs/README.md` (only if it lists per-feature entries): add a one-line summary for `031-spotlight-indexing` linking to its `spec.md` and `tasks.md`. If `specs/README.md` does not list per-feature entries, this task is a no-op — record that determination explicitly in the implementation log. **Acceptance**: either +1 line or documented no-op. **Spec ref**: spec governance / repo hygiene.
- [ ] T060 Final verification pass: re-run `pnpm check` once more after T058/T059 to confirm no documentation-only edit broke any link-check / markdown lint that the gate covers. **Acceptance**: `pnpm check` green; no diff outside the documented scope of feature 031. **Spec ref**: FR-122, AC-SPL-010.

- [ ] T061 **Checkpoint commit** marker: `chore(031): pnpm format + pnpm check green; spec-status + README updated`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: no dependencies; all four `[P]` tasks can run in parallel.
- **Phase 2 (Foundational types)**: depends on Phase 1. Blocks every subsequent phase.
- **Phase 3 (source mapper)**: depends on Phase 2 (imports `SearchableItem` from types). Independent of Phases 4/5.
- **Phase 4 (non-iOS bridge stubs)**: depends on Phase 2.
- **Phase 5 (iOS bridge)**: depends on Phase 2 + Phase 4 (re-exports the shared error class consistently). Tests assume Phase 4 stubs already exist.
- **Phase 6 (hook)**: depends on Phase 3 + Phase 5.
- **Phase 7 (components)**: depends on Phase 2 (types) only — every component test mocks the hook, so it does NOT block on Phase 6. The eight components can RED→GREEN in parallel.
- **Phase 8 (manifest)**: depends on Phase 7 (manifest's `screen` reference points at Phase 9, but the test only asserts shape — so Phase 8 may RED→GREEN before Phase 9 GREEN).
- **Phase 9 (screens)**: depends on Phase 6 + Phase 7 + Phase 8.
- **Phase 10 (plugin)**: independent of Phases 2–9 (plugin is pure `Info.plist` mutation). Can run in parallel with Phases 3–9 once Phase 1 is complete.
- **Phase 11 (Swift)**: independent at the JS-test level (no Jest suite). Can run in parallel with Phases 3–10.
- **Phase 12 (integration edits)**: depends on Phase 8 (registry import) + Phase 10 (`app.json` plugin entry) + Phase 9 (so the imported module's `screen` resolves cleanly). **MUST run last**, per the user-contract requirement that registry/app.json edits are the final additive integration step.
- **Phase 13 (polish)**: depends on every prior phase.

### Within Each Phase

- Tests (RED) MUST be written and FAIL before the matching implementation (GREEN) begins (Constitution V).
- `[P]` tasks within a phase touch different files and can run in parallel.
- Checkpoint-commit tasks mark GREEN→REFACTOR boundaries — do not run `git commit` while generating this file.

### Parallel Opportunities

- All Phase 1 tasks `[P]` run in parallel.
- Phase 4's two RED tests + two implementations all `[P]`.
- Phase 7's eight RED tests all `[P]`; eight implementations all `[P]`.
- Phase 9's three screen RED tests all `[P]`; android + web implementations `[P]`.
- Phase 11's two Swift files `[P]` to each other (independent files).
- Phases 3, 4, 10, 11 can all run in parallel after Phase 2 completes (different files, different concerns).
- Phase 13's `pnpm format` (T056) is sequential, but `specs/spec-status.md` (T058) and `specs/README.md` (T059) edits are `[P]` to each other.

---

## Parallel Example: Phase 7 (Components)

```bash
# Eight RED test tasks in parallel:
Task: T020 ExplainerCard.test.tsx
Task: T021 IndexableItemsList.test.tsx
Task: T022 ItemRow.test.tsx
Task: T023 BulkActionsCard.test.tsx
Task: T024 SearchTestCard.test.tsx
Task: T025 UserActivityCard.test.tsx
Task: T026 PersistenceNoteCard.test.tsx
Task: T027 IOSOnlyBanner.test.tsx

# Then eight GREEN implementation tasks in parallel (after their RED partner is on disk):
Task: T028 ExplainerCard.tsx
Task: T029 IndexableItemsList.tsx
Task: T030 ItemRow.tsx
Task: T031 BulkActionsCard.tsx
Task: T032 SearchTestCard.tsx
Task: T033 UserActivityCard.tsx
Task: T034 PersistenceNoteCard.tsx
Task: T035 IOSOnlyBanner.tsx
```

---

## User-Story Coverage Map

| Story | Priority | Tasks (test + impl) |
|-------|----------|---------------------|
| US1 — Index registry items | P1 | T008/T009 (mapper), T015/T016 (bridge), T018/T019 (hook), T021/T029 (list), T022/T030 (row), T023/T031 (bulk), T039/T042 (screen), T049 (Swift indexer), T053 (registry) |
| US2 — Search the system index | P1 | T015/T016 (bridge), T018/T019 (hook), T024/T032 (card), T039/T042 (screen), T049 (Swift indexer), T053 (registry) |
| US3 — Drive `NSUserActivity` | P2 | T015/T016 (bridge), T018/T019 (hook), T025/T033 (card), T039/T042 (screen), T050 (Swift activity helper) |
| US4 — Cross-platform fallback | P3 | T011/T013 (android bridge), T012/T014 (web bridge), T027/T035 (IOSOnlyBanner), T040/T043 (android screen), T041/T044 (web screen) |

---

## Acceptance-Criteria Coverage Map

| AC ID | Tasks |
|-------|-------|
| AC-SPL-001 (registry +1) | T053 |
| AC-SPL-002 (app.json plugins +1) | T054 |
| AC-SPL-003 (Info.plist superset) | T046, T047 |
| AC-SPL-004 (all ≥14 test files) | T006, T008, T011, T012, T015, T018, T020–T027, T037, T039, T040, T041, T046 |
| AC-SPL-005 (source mapper) | T008, T009 |
| AC-SPL-006 (hook) | T018, T019 |
| AC-SPL-007 (bridge) | T015, T016 |
| AC-SPL-008 (plugin) | T046, T047 |
| AC-SPL-009 (manifest) | T037, T038 |
| AC-SPL-010 (pnpm check / format / no eslint-disable) | T056, T057, T060 |

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Phases 1–6 (setup → types → mapper → bridge → hook).
2. Phases 7 (components) + 8 (manifest) + 9 (iOS `screen.tsx` only).
3. Phase 11 (Swift) on-device.
4. Phase 12 (registry + app.json).
5. Validate: index a row from the iOS card, run a `CSSearchQuery` from the SearchTestCard, see the result.

### Incremental Delivery

1. MVP slice above → validate US1 + US2 (CSSearchableIndex round trip).
2. Layer in `UserActivityCard` + Swift `UserActivityHelper.swift` → validate US3 (`NSUserActivity` lifecycle including unmount cleanup per SC-009).
3. Add Phase 9's `.android.tsx` + `.web.tsx` variants → validate US4 cross-platform fallback.
4. Phase 10 (plugin) → validate `Info.plist` outputs after `expo prebuild` (SC-005 / SC-008).
5. Phase 13 (polish) → final `pnpm check` green.

### Parallel Team Strategy

Once Phase 2 completes, four streams may proceed independently:

- **Stream A**: Phase 3 (mapper) → Phase 6 (hook).
- **Stream B**: Phase 4 (non-iOS bridges) → Phase 5 (iOS bridge).
- **Stream C**: Phase 10 (plugin) — independent.
- **Stream D** (macOS-only contributor): Phase 11 (Swift, two files in parallel).

Streams converge at Phase 7 (components), then Phase 9 (screens), then Phase 12 (integration).

---

## Notes

- `[P]` tasks = different files, no dependencies on incomplete tasks.
- `[Story]` tags trace tasks back to spec.md user stories (US1/US2/US3/US4); foundational and infra tasks (types, plugin, repo hygiene) are story-independent.
- Each user story is independently verifiable per spec §"Independent Test" sections.
- Verify RED tests fail with module-not-found / undefined-symbol before implementing GREEN.
- The orchestrator commits at the end; do NOT run `git commit` during task execution unless a checkpoint task explicitly says so.
- All native-bridge tests use `jest.isolateModules` + `jest.doMock` per FR-123 (carried forward verbatim from `test/unit/native/background-tasks.test.ts`).
- Avoid: vague tasks, same-file conflicts, cross-story dependencies that break US-level independence, edits to prior features' files (007/013/014/019/023/025/026/027/028/029/030 plugins, screens, and Swift sources are all UNTOUCHED — see plan §"Project Structure").
- No `eslint-disable` directives anywhere in added or modified code (FR-120).
