---
description: "Dependency-ordered task list for feature 030 — BackgroundTasks Framework Module (`background-tasks-lab`)"
---

# Tasks: BackgroundTasks Framework Module (`background-tasks-lab`)

**Input**: Design documents from `/specs/030-background-tasks/`
**Prerequisites**: plan.md (required), spec.md (required), data-model.md, quickstart.md, research.md, contracts/{history-store,background-tasks-bridge,manifest}.contract.ts.

**Tests**: REQUIRED — every component, every screen variant, the manifest, the bridge, the `history-store`, the `useBackgroundTasks` hook, and the plugin has an explicit unit test (AC-BGT-004..009, FR-103, Constitution Principle V). The Swift surface (one new file under `native/ios/background-tasks/`) is verified on-device per `quickstart.md` (Constitution V exemption mirroring 007 / 013 / 014 / 027 / 028 / 029).

**Organization**: Tasks are grouped by the plan's phased file inventory (mirrors 029's layout). Spec defines four user stories (US1: schedule app refresh — P1; US2: schedule processing — P1; US3: history persistence — P2; US4: cross-platform fallback — P3); all four ship together as one module so tasks are organised by file/dependency rather than per-story phases. [Story] tags are attached to the iOS-side schedule/history/fallback tasks for traceability.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: `[US1]`, `[US2]`, `[US3]`, `[US4]` where the task delivers a story-specific surface; foundational and infra tasks have no story tag
- All file paths are repository-relative under the worktree root `C:\Users\izkizk8\spot-030-bgtasks`
- Tests live under `test/unit/modules/background-tasks-lab/`, `test/unit/native/`, and `test/unit/plugins/with-background-tasks/` (NOT colocated; matches 014/027/028/029 layout)
- **No commits are produced by `/speckit.tasks`.** "Checkpoint commit" tasks below are markers for the implementation phase; the orchestrator commits at end.
- **TDD cadence**: every implementation task is preceded by a RED test task. RED tests must fail with module-not-found / undefined-symbol errors before the matching implementation begins (Constitution Principle V).

---

## Overview

Feature 030 adds an iOS 13+ BackgroundTasks showcase module. Three classes of artefact are produced:

1. **TypeScript surface** — one module (`src/modules/background-tasks-lab/`) with a manifest, three platform-suffixed screen variants, a `history-store`, a `useBackgroundTasks` hook, and six UI components. Plus a four-file JS bridge (`src/native/background-tasks.{ts,android.ts,web.ts,types.ts}`) mirroring 029's `focus-filters.*` shape.
2. **Swift surface** — one file under `native/ios/background-tasks/` (`BackgroundTaskManager.swift`) appended to the **main app target** via the existing autolinking pipeline (NOT via this feature's plugin; plugin scope is `Info.plist` keys only — see plan §"Structure Decision" #5).
3. **Plugin** — `plugins/with-background-tasks/` (idempotent, commutative with 007/013/014/019/023/025/026/027/028/029; mutates only `Info.plist`'s `BGTaskSchedulerPermittedIdentifiers` and `UIBackgroundModes`; preserves 025's `"location"` entry).

Plus 2 additive integration edits (`src/modules/registry.ts` +1 import +1 array entry; `app.json` `plugins` +1 entry).

**Deliverable counts**: **23 source files + 2 additive edits + 13 test files** — split into **74 numbered tasks** across **13 phases**.

**Test baseline delta target**: **≥ +13 new Jest suites** (matches plan §"Test baseline tracking").

---

## Phase 1: Setup (Module + Plugin + Native + Test Scaffolding)

**Purpose**: Create the empty directory tree and the plugin package shell so subsequent file-creation tasks can run in parallel. No business logic.

- [ ] T001 [P] Create the module directory tree: `src/modules/background-tasks-lab/`, `src/modules/background-tasks-lab/components/`, and `src/modules/background-tasks-lab/hooks/`. Add `.gitkeep` if a directory ends up empty after the phase. **Acceptance**: All three directories exist and are tracked.
- [ ] T002 [P] Create the plugin directory `plugins/with-background-tasks/` with `package.json` containing `{ "name": "with-background-tasks", "version": "0.0.0", "main": "index.ts", "types": "index.ts" }` (mirror `plugins/with-focus-filters/package.json`). Plugin source files are created in Phase 10. **Acceptance**: File parses as valid JSON; `main` points to `index.ts`; `dependencies` is absent or empty (NFR-005).
- [ ] T003 [P] Create the Swift source directory `native/ios/background-tasks/` with a `.gitkeep`. The Swift source is authored in Phase 11. **Acceptance**: Directory exists and is tracked.
- [ ] T004 [P] Create the test directory tree: `test/unit/modules/background-tasks-lab/`, `test/unit/modules/background-tasks-lab/components/`, `test/unit/modules/background-tasks-lab/hooks/`, `test/unit/plugins/with-background-tasks/`. Add `.gitkeep` if empty after this phase. **Acceptance**: All four directories exist and are tracked.
- [ ] T005 **Checkpoint commit** marker: `chore(030): scaffold background-tasks-lab module/plugin/test/native dirs`.

---

## Phase 2: Foundational — Shared Bridge Types (`src/native/background-tasks.types.ts`)

**Purpose**: Define `TaskType`, `TaskStatus`, `TaskRunRecord`, `LastRunSnapshot`, `BackgroundTasksBridge` interface, and `BackgroundTasksNotSupported` error class. Every component, every screen variant, the bridge runtime variants, the hook, and the history-store depend on these symbols. Imported safely on every platform (no native module access at evaluation time, per FR-012 / SC-007).

**⚠️ CRITICAL**: Nothing in Phase 3+ may begin until this phase completes (foundational types).

### Tests for shared types (RED)

- [ ] T006 Write `test/unit/native/background-tasks.types.test.ts` covering every obligation in `contracts/background-tasks-bridge.contract.ts` that is purely type-/value-level:
  1. `BackgroundTasksNotSupported` is a `class` whose instances pass `instanceof BackgroundTasksNotSupported` and `instanceof Error` (FR-072).
  2. `BackgroundTasksNotSupported` carries a stable `name === 'BackgroundTasksNotSupported'`.
  3. `TaskType` accepts exactly the literals `'refresh'` and `'processing'` (FR-042 / FR-080).
  4. `TaskStatus` accepts exactly the literals `'completed'`, `'expired'`, `'canceled'` (FR-042).
  5. A `TaskRunRecord` value matching `{ id, type, scheduledAt, startedAt, endedAt, durationMs, status }` typechecks with all numeric fields as `number | null` where the spec allows (FR-042).
  6. A `LastRunSnapshot` value `{ refresh: null, processing: null }` typechecks; `{ refresh: <record>, processing: <record> }` typechecks; missing keys fail compilation (R-B / data-model.md).

  RED until `src/native/background-tasks.types.ts` exists. **Acceptance**: ≥6 distinct `it()`/type assertions; all fail with module-not-found. **Spec ref**: FR-042, FR-070, FR-072, FR-080; contract `background-tasks-bridge.contract.ts`.

### Implementation (GREEN)

- [ ] T007 Implement `src/native/background-tasks.types.ts` per `contracts/background-tasks-bridge.contract.ts`: export `TaskType` alias `'refresh' | 'processing'`, `TaskStatus` alias `'completed' | 'expired' | 'canceled'`, `TaskRunRecord` interface (`id: string; type: TaskType; scheduledAt: number; startedAt: number | null; endedAt: number | null; durationMs: number | null; status: TaskStatus`), `LastRunSnapshot` interface (`{ refresh: TaskRunRecord | null; processing: TaskRunRecord | null }`), `BackgroundTasksBridge` interface (FR-070 surface), and `BackgroundTasksNotSupported` class extending `Error`. Make T006 pass. **Acceptance**: T006 green; `pnpm typecheck` clean; no global symbol collisions with `app-intents.types`, `widget-center.types`, or `focus-filters.types`. **Spec ref**: FR-042, FR-070, FR-072, FR-080.

---

## Phase 3: Foundational — History Store (`src/modules/background-tasks-lab/history-store.ts`)

**Purpose**: AsyncStorage-backed FIFO ring buffer (cap 20) for `TaskRunRecord` history under key `spot.bgtasks.history`. Pure functions: `append`, `list`, `clear`, `parsePersistedArray`. Owned exclusively by JS; the Swift side never reads or writes this key.

### Tests (RED)

- [ ] T008 [US3] Write `test/unit/modules/background-tasks-lab/history-store.test.ts` covering every obligation in `contracts/history-store.contract.ts` and AC-BGT-005 / FR-040..044 / EC-004:
  1. `list()` on a fresh AsyncStorage returns `[]` (no key yet).
  2. `append(record)` writes a JSON array containing exactly that record under key `spot.bgtasks.history`.
  3. Two successive `append`s yield a list with the newest record first (`[newest, older]`) — newest-first ordering (US3 AS1).
  4. Appending a 21st record evicts the oldest; `list()` length stays at 20; the just-appended record is at index 0 (FR-041 / US3 AS2).
  5. `clear()` removes the AsyncStorage key (assert via `getItem` returning `null`) and a subsequent `list()` returns `[]` (FR-043 / US3 AS4).
  6. AsyncStorage `getItem` rejection: `list()` resolves to `[]` and surfaces the error via the documented error channel (FR-044 / NFR-002 / EC-004).
  7. AsyncStorage `setItem` rejection: `append(record)` resolves (does not throw) and surfaces the error via the error channel (FR-044 / NFR-002).
  8. Corrupt JSON in storage (`'not-json'`): `parsePersistedArray('not-json')` returns `[]` and `list()` resolves to `[]` (EC-004).
  9. JSON value of wrong shape (`'{"notAnArray":true}'`): `parsePersistedArray(...)` returns `[]`.
  10. Array containing one valid record + one malformed entry: `parsePersistedArray(...)` filters to the valid record (best-effort tolerance per data-model §parser).
  11. `append` after `clear` while a stale value is concurrently being processed: only the post-clear record is present (EC-010).
  12. The exported AsyncStorage key string equals `'spot.bgtasks.history'` (FR-040).

  RED until `history-store.ts` exists. **Acceptance**: ≥12 distinct `it()` blocks; all fail with module-not-found. **Spec ref**: FR-040..044, EC-004, EC-010, AC-BGT-005, NFR-002.

### Implementation (GREEN)

- [ ] T009 [US3] Implement `src/modules/background-tasks-lab/history-store.ts` per `contracts/history-store.contract.ts`: export `HISTORY_KEY = 'spot.bgtasks.history'`, `append(record: TaskRunRecord): Promise<TaskRunRecord[]>`, `list(): Promise<TaskRunRecord[]>`, `clear(): Promise<void>`, and `parsePersistedArray(raw: string | null | undefined): TaskRunRecord[]`. Internally cap at 20 entries with FIFO eviction; tolerate AsyncStorage rejections by resolving with the empty list and forwarding the error via a documented error-callback channel (used by the hook in Phase 5). Make T008 pass. **Acceptance**: T008 green; `pnpm typecheck` clean; no `eslint-disable` (FR-100). **Spec ref**: FR-040..044, EC-004, EC-010, AC-BGT-005.

- [ ] T010 **Checkpoint commit** marker: `feat(030): foundational types + history-store with AsyncStorage tolerance`.

---

## Phase 4: JS Bridge — non-iOS variants (`src/native/background-tasks.android.ts`, `.web.ts`)

**Purpose**: Cross-platform stubs that throw `BackgroundTasksNotSupported` on every mutating method, return `false` for `isAvailable()`, and `[]` for `getRegisteredIdentifiers()`. Imported by Android / Web screen variants without pulling any iOS-only symbol (FR-071 / SC-007).

### Tests (RED)

- [ ] T011 [P] [US4] Write `test/unit/native/background-tasks.android.test.ts`:
  1. `isAvailable()` returns `false` (FR-071).
  2. `getRegisteredIdentifiers()` returns `[]` (FR-071).
  3. `scheduleAppRefresh(60_000)` rejects with `BackgroundTasksNotSupported`.
  4. `scheduleProcessing({ requiresExternalPower: true, requiresNetworkConnectivity: true })` rejects with `BackgroundTasksNotSupported`.
  5. `cancelAll()` rejects with `BackgroundTasksNotSupported`.
  6. `getLastRun()` rejects with `BackgroundTasksNotSupported`.
  7. The thrown error is `instanceof BackgroundTasksNotSupported` AND `instanceof Error` (FR-072).
  8. Importing the module does NOT call `requireOptionalNativeModule` (assert by spying — defensive against accidental iOS import on Android).

  RED until `background-tasks.android.ts` exists. **Spec ref**: FR-071, FR-072, US4 AS3, SC-007.

- [ ] T012 [P] [US4] Write `test/unit/native/background-tasks.web.test.ts` mirroring T011 but for the `.web.ts` variant; additionally assert that the file does NOT statically import `react-native`'s `Platform` module nor `expo-modules-core`'s `requireOptionalNativeModule` (FR-012 / SC-007). **Spec ref**: FR-012, FR-071, FR-072, SC-007.

### Implementation (GREEN)

- [ ] T013 [P] [US4] Implement `src/native/background-tasks.android.ts`: re-export `BackgroundTasksNotSupported` from `./background-tasks.types`; export `isAvailable: () => false`, `getRegisteredIdentifiers: () => []`, and four async methods that all reject with `new BackgroundTasksNotSupported(...)`. Make T011 pass. **Spec ref**: FR-071, FR-072.
- [ ] T014 [P] [US4] Implement `src/native/background-tasks.web.ts`: identical to `.android.ts` (re-export the same shape). MUST NOT import `expo-modules-core`, `react-native`'s native bridge, or any iOS-only symbol. Make T012 pass. **Spec ref**: FR-012, FR-071, FR-072, SC-007.

---

## Phase 5: JS Bridge — iOS variant (`src/native/background-tasks.ts`)

**Purpose**: iOS implementation that gates on `Platform.OS === 'ios'` + `requireOptionalNativeModule('BackgroundTasks')`, exposes the typed surface (FR-070), and serialises concurrent calls through a single in-memory promise chain (R-A / FR-083).

### Tests (RED)

- [ ] T015 [US1] [US2] Write `test/unit/native/background-tasks.test.ts` covering AC-BGT-007 and the bridge contract:
  1. With the native module mocked present and `Platform.OS === 'ios'`, `isAvailable()` returns `true`; `getRegisteredIdentifiers()` returns `['com.izkizk8.spot.refresh', 'com.izkizk8.spot.processing']` (FR-060 / FR-065).
  2. `scheduleAppRefresh(60_000)` calls the mocked native `scheduleAppRefresh` with argument `60000` exactly once (FR-021 / FR-070).
  3. `scheduleProcessing({ requiresExternalPower: true, requiresNetworkConnectivity: true })` forwards both flags verbatim to the mocked native module (FR-031 / FR-070).
  4. `cancelAll()` delegates to the mocked native `cancelAll` (FR-082).
  5. `getLastRun()` resolves to a `TaskRunRecord | null` matching the mocked native return value (FR-070).
  6. With the native module mocked absent (`requireOptionalNativeModule` returns `null`), every mutating method rejects with `BackgroundTasksNotSupported`; `isAvailable()` returns `false`; `getRegisteredIdentifiers()` returns `[]` (FR-071 / FR-072 / EC-002).
  7. Two back-to-back `scheduleAppRefresh(60_000)` calls produce exactly two native invocations in submission order (R-A / FR-083); a sleep-mocked first call delays the second.
  8. If the first call rejects, the second call still executes and resolves/rejects on its own merits (chain doesn't poison subsequent calls — R-A).
  9. `BackgroundTasksNotSupported` thrown from a non-iOS code path is `instanceof BackgroundTasksNotSupported` (FR-072).
  10. Typed surface matches the contract: `scheduleAppRefresh: (ms: number) => Promise<void>`, etc. — verified via `expectType<...>()` or equivalent.
  11. The module is NEVER evaluated on Android / Web (Jest config + the screen.web/android tests in Phase 9 separately enforce; this test confirms by importing only via the iOS-mock harness).

  RED until `background-tasks.ts` exists. **Acceptance**: ≥11 `it()` blocks; all fail with module-not-found. **Spec ref**: FR-070..072, FR-082, FR-083, R-A, AC-BGT-007.

### Implementation (GREEN)

- [ ] T016 [US1] [US2] Implement `src/native/background-tasks.ts`: import the typed surface from `./background-tasks.types`; gate `Platform.OS === 'ios'` + `requireOptionalNativeModule('BackgroundTasks')`; expose `scheduleAppRefresh`, `scheduleProcessing`, `cancelAll`, `getLastRun`, `getRegisteredIdentifiers`, `isAvailable`. Implement the closure-scoped promise chain `let chain: Promise<unknown> = Promise.resolve();` per R-A. When the optional native module is absent, every mutating method rejects with `new BackgroundTasksNotSupported(...)` (matches non-iOS variants). Make T015 pass. **Acceptance**: T015 green; `pnpm typecheck` clean; bridge has zero direct `console.log` / `eslint-disable`. **Spec ref**: FR-070..072, FR-082, FR-083, R-A, AC-BGT-007.

- [ ] T017 **Checkpoint commit** marker: `feat(030): JS bridge variants (ios + android + web) with serialised promise chain`.

---

## Phase 6: Hook (`src/modules/background-tasks-lab/hooks/useBackgroundTasks.ts`)

**Purpose**: React hook wrapping bridge + history-store + AppState. Returns `{ schedule, cancelAll, lastRunByType, history, error }`. Refetches on mount + `AppState === 'active'`. All bridge calls serialised through a reducer (FR-083). Tolerates `BackgroundTasksNotSupported` (resolves to degraded state; never propagates to UI).

### Tests (RED)

- [ ] T018 [US1] [US2] [US3] Write `test/unit/modules/background-tasks-lab/hooks/useBackgroundTasks.test.tsx` covering AC-BGT-006 / FR-080..083 / NFR-002:
  1. On mount, calls `bridge.getLastRun()` and `historyStore.list()` once each; populates `lastRunByType` (`{ refresh, processing }`) and `history` accordingly (FR-081).
  2. Re-runs both reads when `AppState` transitions from `background` → `active` (FR-081 / EC-003 / US3 AS1).
  3. `schedule('refresh')` calls `bridge.scheduleAppRefresh(60_000)` exactly once and updates the in-memory `scheduled` state for `refresh` (US1 AS1, FR-021).
  4. `schedule('processing')` calls `bridge.scheduleProcessing({ requiresExternalPower: true, requiresNetworkConnectivity: true })` exactly once (US2 AS1, FR-031).
  5. Two rapid `schedule('refresh')` calls are reduced to a single in-flight scheduling state and produce two ordered native invocations (FR-083 / R-A / US1 AS4).
  6. `cancelAll()` calls `bridge.cancelAll()` and clears scheduled state to `idle` for both task types after resolution (FR-082 / US2 AS3).
  7. When `bridge.getLastRun()` rejects with `BackgroundTasksNotSupported`, the hook resolves to a degraded state (`lastRunByType = { refresh: null, processing: null }`, `history = []`); `error` is `null` (silent fallback per US4 AS3 / EC-002 — non-iOS path).
  8. When `historyStore.list()` rejects with a non-`BackgroundTasksNotSupported` error, the hook surfaces the error on `error` and renders `history = []` (FR-044 / NFR-002 / US3 AS3).
  9. When `bridge.scheduleAppRefresh` rejects with a generic Error, the hook surfaces the error on `error` and reverts the scheduled state to its pre-call value.
  10. After a completed run snapshot is read from the bridge (mocked `getLastRun()` returning a `completed` record), the per-type `scheduled` state is reset to `idle` and the corresponding history entry is appended via `historyStore.append` (US1 AS2 / EC-003).
  11. Unmount cancels the AppState subscription (no leak warnings).

  RED until the hook exists. **Acceptance**: ≥11 `it()` blocks; all fail with module-not-found. **Spec ref**: FR-080..083, NFR-002, AC-BGT-006, EC-003, R-A.

### Implementation (GREEN)

- [ ] T019 [US1] [US2] [US3] Implement `src/modules/background-tasks-lab/hooks/useBackgroundTasks.ts`: `useReducer`-based; subscribes to `AppState`; calls `bridge.getLastRun()` + `historyStore.list()` on mount and on `'active'`; exposes `schedule(type)`, `cancelAll`, `lastRunByType`, `history`, `error`. Catches `BackgroundTasksNotSupported` silently (renders degraded); surfaces all other errors on `error`. Make T018 pass. **Acceptance**: T018 green; reducer is the single source of bridge interaction (FR-083); no race-leaking subscriptions. **Spec ref**: FR-080..083, NFR-002, AC-BGT-006, EC-003.

---

## Phase 7: Components (six files in parallel)

**Purpose**: Six presentational components used by the iOS screen and (where listed in plan §"Phased file inventory") the cross-platform fallbacks. All chrome via `ThemedView` / `ThemedText` and `Spacing` from `src/constants/theme.ts`; `StyleSheet.create()` only (Constitution IV); no inline objects.

### Tests (RED) — runnable in parallel

- [ ] T020 [P] Write `test/unit/modules/background-tasks-lab/components/ExplainerCard.test.tsx`: renders prose mentioning `BGTaskScheduler`, `BGAppRefreshTask`, `BGProcessingTask`, "coalesces" / "deferred" (or equivalent platform vocabulary), and the two task identifier literals `com.izkizk8.spot.refresh` / `com.izkizk8.spot.processing` (so forks see EC-009 caveat). Renders without props on every platform. ≥4 `it()` blocks. **Spec ref**: spec §Overview panel 1, EC-009.
- [ ] T021 [P] [US1] Write `test/unit/modules/background-tasks-lab/components/ScheduleAppRefreshCard.test.tsx`: CTA label text "Schedule App Refresh" present (FR-020); pressing the CTA calls the injected `onSchedule` prop exactly once (FR-021); status pill renders all six values (`idle`, `scheduled`, `running`, `completed`, `expired`, `canceled`) when fed via the `status` prop (FR-022); empty-state dash when `lastRun === null` (FR-023); localised timestamp + duration (e.g. via `Intl.DateTimeFormat`) when `lastRun` is provided. ≥6 `it()` blocks. **Spec ref**: FR-020..023, AC-BGT-004.
- [ ] T022 [P] [US2] Write `test/unit/modules/background-tasks-lab/components/ScheduleProcessingCard.test.tsx`: CTA label "Schedule Processing" (FR-030); pressing calls `onSchedule` exactly once (FR-031); both requirements indicators render and are read-only (cannot be toggled by user input) (FR-032); status pill + last-run + duration mirror refresh card (FR-033). ≥6 `it()` blocks. **Spec ref**: FR-030..033, AC-BGT-004.
- [ ] T023 [P] [US3] Write `test/unit/modules/background-tasks-lab/components/RunHistoryList.test.tsx`: renders empty-state line "No background runs recorded yet" when `history.length === 0` (FR-043); renders 1 / 5 / 20 records correctly (newest first); overflow case (records.length === 21 in the prop — defensive) clips to first 20 in display order; "Clear history" affordance present and calls injected `onClear` once when pressed (FR-043); accepts an `error` prop and renders an inline error indicator without crashing (FR-044 / US3 AS3); each row shows id, type, scheduled-at, started-at, ended-at, duration ms, status (FR-042). ≥7 `it()` blocks. **Spec ref**: FR-040..044, AC-BGT-004, US3 AS1/AS2/AS3/AS4.
- [ ] T024 [P] Write `test/unit/modules/background-tasks-lab/components/TestTriggerCard.test.tsx`: both task identifiers appear verbatim inside the rendered lldb command strings (FR-050); copy-to-clipboard affordance present and wired to the existing project copy helper (assert via mock); private-API caveat copy present (FR-051). ≥4 `it()` blocks. **Spec ref**: FR-050, FR-051, AC-BGT-004.
- [ ] T025 [P] [US4] Write `test/unit/modules/background-tasks-lab/components/IOSOnlyBanner.test.tsx`: renders the default "Background Tasks require iOS 13+" copy; renders an alternative copy variant when prop `reason === 'older-ios'` (older-iOS-on-iOS case per FR-013 / EC-002); renders without crashing on Android / Web. ≥3 `it()` blocks. **Spec ref**: FR-011, FR-013, EC-002, AC-BGT-004.

  All six tests RED. **Acceptance**: each fails with module-not-found.

### Implementation (GREEN) — runnable in parallel after their RED partner exists

- [ ] T026 [P] Implement `src/modules/background-tasks-lab/components/ExplainerCard.tsx`. Make T020 pass. **Spec ref**: spec §Overview panel 1, Constitution II/IV.
- [ ] T027 [P] [US1] Implement `src/modules/background-tasks-lab/components/ScheduleAppRefreshCard.tsx` (props: `status`, `lastRun`, `onSchedule`). Make T021 pass. **Spec ref**: FR-020..023.
- [ ] T028 [P] [US2] Implement `src/modules/background-tasks-lab/components/ScheduleProcessingCard.tsx` (props: `status`, `lastRun`, `onSchedule`; renders read-only `requiresExternalPower` + `requiresNetworkConnectivity` indicators). Make T022 pass. **Spec ref**: FR-030..033.
- [ ] T029 [P] [US3] Implement `src/modules/background-tasks-lab/components/RunHistoryList.tsx` (props: `history`, `error`, `onClear`). Make T023 pass. **Spec ref**: FR-040..044.
- [ ] T030 [P] Implement `src/modules/background-tasks-lab/components/TestTriggerCard.tsx`. Make T024 pass. **Spec ref**: FR-050, FR-051.
- [ ] T031 [P] [US4] Implement `src/modules/background-tasks-lab/components/IOSOnlyBanner.tsx`. Make T025 pass. **Spec ref**: FR-011, FR-013, EC-002.

- [ ] T032 **Checkpoint commit** marker: `feat(030): six components + hook GREEN`.

---

## Phase 8: Manifest (`src/modules/background-tasks-lab/index.tsx`)

**Purpose**: Module manifest export consumed by the registry.

### Tests (RED)

- [ ] T033 Write `test/unit/modules/background-tasks-lab/manifest.test.ts` covering AC-BGT-009 and `contracts/manifest.contract.ts`:
  1. `id === 'background-tasks-lab'` (FR-001).
  2. `label === 'Background Tasks'` (FR-001).
  3. `platforms` deep-equals `['ios', 'android', 'web']` in this order (FR-001).
  4. `minIOS === '13.0'` (FR-001).
  5. `screen` is a function / component reference (matches existing manifest contract used by 014/027/028/029).
  6. No global symbol collisions with prior modules' manifest exports.

  RED until `index.tsx` exists. **Spec ref**: FR-001, FR-002, AC-BGT-009.

### Implementation (GREEN)

- [ ] T034 Implement `src/modules/background-tasks-lab/index.tsx` exporting the `ModuleManifest`-shaped object with `id: 'background-tasks-lab'`, `label: 'Background Tasks'`, `platforms: ['ios','android','web']`, `minIOS: '13.0'`, and a `screen` reference resolving to the platform-suffixed screen (created in Phase 9). Make T033 pass. **Spec ref**: FR-001, FR-002.

---

## Phase 9: Screens — three platform variants

**Purpose**: `screen.tsx` (iOS 13+ — five panels in fixed order), `screen.android.tsx` (banner + explainer + test-trigger), `screen.web.tsx` (same as android; MUST NOT import the iOS bridge at module evaluation time).

### Tests (RED) — runnable in parallel

- [ ] T035 [P] [US1] [US2] [US3] Write `test/unit/modules/background-tasks-lab/screen.test.tsx` (iOS path, with `bridge.isAvailable() === true` mock):
  1. Renders, in fixed top-to-bottom order, ExplainerCard → ScheduleAppRefreshCard → ScheduleProcessingCard → RunHistoryList → TestTriggerCard (FR-010).
  2. Tapping the refresh CTA invokes `useBackgroundTasks().schedule('refresh')` (US1 AS1).
  3. Tapping the processing CTA invokes `useBackgroundTasks().schedule('processing')` (US2 AS1).
  4. RunHistoryList receives `history` from the hook and re-renders when `history` changes.
  5. When `bridge.isAvailable()` returns `false` (older iOS), the screen renders `IOSOnlyBanner` + `ExplainerCard` + `TestTriggerCard` only — schedule CTAs absent (FR-013 / EC-002).
  6. The screen does NOT import any prior feature's screen module (isolation from 013/014/025/027/028/029).

  ≥6 `it()` blocks. **Spec ref**: FR-010, FR-013, EC-002, AC-BGT-004.

- [ ] T036 [P] [US4] Write `test/unit/modules/background-tasks-lab/screen.android.test.tsx`:
  1. Renders `IOSOnlyBanner`, `ExplainerCard`, `TestTriggerCard` only (FR-011).
  2. Schedule CTAs absent (no element with text "Schedule App Refresh" / "Schedule Processing").
  3. RunHistoryList absent.
  4. No call to the bridge's mutating methods (assert via spy that `scheduleAppRefresh` / `scheduleProcessing` are never invoked) (FR-071 / US4 AS3).
  5. Render is exception-free even if the bridge is mocked as throwing on every call (FR-071 / US4 AS3).

  ≥5 `it()` blocks. **Spec ref**: FR-011, FR-071, US4 AS1/AS3, AC-BGT-004.

- [ ] T037 [P] [US4] Write `test/unit/modules/background-tasks-lab/screen.web.test.tsx`:
  1. Renders the same component set as the android variant (FR-012).
  2. Asserts (via Jest module-loaded snapshot of `require.cache` or equivalent) that `src/native/background-tasks.ts` is NOT loaded by the web bundle path (SC-007 / FR-012).
  3. Asserts the file does NOT statically import `src/native/background-tasks` (only `src/native/background-tasks.types` is permitted for the typed `BackgroundTasksNotSupported` export, but no runtime bridge methods).

  ≥3 `it()` blocks. **Spec ref**: FR-012, SC-007, US4 AS2.

### Implementation (GREEN)

- [ ] T038 [US1] [US2] [US3] Implement `src/modules/background-tasks-lab/screen.tsx` (iOS variant — five panels via the components + hook). Use `useBackgroundTasks()` for state. Render `IOSOnlyBanner` fallback when `bridge.isAvailable()` returns false. Make T035 pass. **Spec ref**: FR-010, FR-013, EC-002.
- [ ] T039 [P] [US4] Implement `src/modules/background-tasks-lab/screen.android.tsx`. Imports only the cross-platform-safe components (`IOSOnlyBanner`, `ExplainerCard`, `TestTriggerCard`). Make T036 pass. **Spec ref**: FR-011.
- [ ] T040 [P] [US4] Implement `src/modules/background-tasks-lab/screen.web.tsx`. MUST NOT import `src/native/background-tasks` at module evaluation time. Make T037 pass. **Spec ref**: FR-012, SC-007.

- [ ] T041 **Checkpoint commit** marker: `feat(030): manifest + three screen variants GREEN`.

---

## Phase 10: Expo Config Plugin (`plugins/with-background-tasks/`)

**Purpose**: Idempotent, additive `Info.plist` mutation: union-merge `BGTaskSchedulerPermittedIdentifiers` with the two task identifiers; union-merge `UIBackgroundModes` with `['fetch','processing']`, preserving 025's `"location"` entry.

### Tests (RED)

- [ ] T042 Write `test/unit/plugins/with-background-tasks/index.test.ts` covering AC-BGT-008 / FR-090..093 / SC-005 / SC-008 / EC-006 / EC-007:
  1. Applied to a fresh `Info.plist`, the result contains `BGTaskSchedulerPermittedIdentifiers` deep-equal-as-set to `['com.izkizk8.spot.refresh', 'com.izkizk8.spot.processing']` (FR-090).
  2. Applied to an `Info.plist` that already has `BGTaskSchedulerPermittedIdentifiers: ['com.example.other']`, the result is a superset preserving `'com.example.other'` plus both new ids (union, no overwrite) (FR-090 / EC-006).
  3. Applied twice in sequence to the same `Info.plist` produces a byte-identical result to applying once (FR-092 / SC-005).
  4. Applied to a fresh `Info.plist`, `UIBackgroundModes` deep-equal-as-set ⊇ `['fetch','processing']` (FR-091).
  5. Applied to an `Info.plist` containing 025's `UIBackgroundModes: ['location']`, the result deep-equal-as-set ⊇ `['location','fetch','processing']` and preserves `'location'` at its original index (FR-091 / EC-007 / SC-008).
  6. Applied with all of {013-app-intents, 014-home-widgets, 025-core-location, 026-rich-notifications, 027-lock-widgets, 028-standby-widget, 029-focus-filters} plugins applied first, in app.json declaration order: no prior plugin's keys are removed, reordered, or overwritten; the two new ids are present in `BGTaskSchedulerPermittedIdentifiers`; `UIBackgroundModes` superset preserves all prior entries (FR-093 / SC-008).
  7. Commutativity: ≥3 non-trivial permutations of {025, 029, 030} plugin orderings produce semantically equivalent `Info.plist` outputs (FR-093).
  8. Applied with both new ids already present in `BGTaskSchedulerPermittedIdentifiers`: result is unchanged (idempotent — defensive against double-include) (FR-092).
  9. Plugin export shape matches `ConfigPlugin` from `@expo/config-plugins` (default export is a function of `(config) => config`).
  10. No `eslint-disable` directives anywhere in the plugin source (FR-100).

  RED until `plugins/with-background-tasks/index.ts` exists. **Acceptance**: ≥10 `it()` blocks. **Spec ref**: FR-090..093, EC-006, EC-007, SC-005, SC-008, AC-BGT-008.

### Implementation (GREEN)

- [ ] T043 Implement `plugins/with-background-tasks/index.ts`: default-export a `ConfigPlugin` that composes `withInfoPlist` to union-merge the two task identifiers into `BGTaskSchedulerPermittedIdentifiers` (creating the array if absent) and union-merge `['fetch','processing']` into `UIBackgroundModes` while preserving every prior entry verbatim. Make T042 pass. **Acceptance**: T042 green; plugin source has zero new runtime dependencies (NFR-005). **Spec ref**: FR-090..093, EC-006, EC-007, SC-005, SC-008.

- [ ] T044 **Checkpoint commit** marker: `feat(030): with-background-tasks Expo config plugin GREEN`.

---

## Phase 11: Native iOS Swift surface (no JS-side test — on-device only)

**Purpose**: Author `BackgroundTaskManager.swift` per FR-060..065. Cannot be unit-tested on the Windows dev environment (Constitution V exemption mirroring 007/013/014/027/028/029). Quickstart documents on-device verification.

- [ ] T045 [US1] [US2] Author `native/ios/background-tasks/BackgroundTaskManager.swift`: `@available(iOS 13.0, *)` enum/class wrapping `BGTaskScheduler.shared`. Registers both task identifiers (`com.izkizk8.spot.refresh`, `com.izkizk8.spot.processing`) in `application(_:didFinishLaunchingWithOptions:)` (FR-060). Refresh handler runs ~2 s simulated workload (numeric sum + sleep), processing handler runs ~5 s simulated workload (FR-061 / FR-062 / NFR-003). Each handler wires `task.expirationHandler → task.setTaskCompleted(success: false)` and calls `setTaskCompleted(success: true)` exactly once on normal completion (FR-061 / FR-062 / EC-005). On every handler entry and exit, writes a `LastRunSnapshot` JSON payload to App Group `UserDefaults(suiteName: AppGroupID)` under key `spot.bgtasks.lastRun` (FR-063 / R-B). On successful completion, posts a best-effort `UNNotificationRequest` via `UNUserNotificationCenter.current()`; failure swallowed (FR-064 / EC-008). Exposes via the JS bridge: `isAvailable`, `scheduleAppRefresh`, `scheduleProcessing`, `cancelAll`, `getLastRun`, `getRegisteredIdentifiers` (FR-065 / FR-070). **Acceptance**: file compiles via the existing autolinking pipeline on a macOS build; verified on-device per `quickstart.md` (NOT verified on Windows). **Spec ref**: FR-060..065, NFR-003, EC-005, EC-008, R-B.
- [ ] T046 Update `specs/030-background-tasks/quickstart.md` (if not already up to date from Phase 1 of plan) with the on-device verification steps for `BackgroundTaskManager.swift`: schedule via the in-app CTAs, trigger via the documented lldb command, confirm `LastRunSnapshot` writes via the App Group, confirm best-effort notification post. **Acceptance**: quickstart §"Native verification" enumerates ≥4 verification steps. **Spec ref**: SC-003, FR-050, quickstart.md.

- [ ] T047 **Checkpoint commit** marker: `feat(030): BackgroundTaskManager.swift authored (on-device verification only)`.

---

## Phase 12: Integration edits (additive — registry + app.json)

**Purpose**: The two strictly-additive integration touchpoints.

- [ ] T048 Modify `src/modules/registry.ts`: add exactly one new `import { backgroundTasksLab } from '@/modules/background-tasks-lab'` line and exactly one new array entry (`backgroundTasksLab`) — registry size +1; no existing entry modified or reordered. **Acceptance**: AC-BGT-001 holds — diff is +1 import line + +1 array entry only. **Spec ref**: FR-001, AC-BGT-001.
- [ ] T049 Modify `app.json`: add `"./plugins/with-background-tasks"` as exactly one new entry in the `plugins` array; no existing plugin entry is reordered or removed. **Acceptance**: AC-BGT-002 holds — diff is one new array entry only; plugin appears after every prior plugin (declaration order). **Spec ref**: FR-093, AC-BGT-002, SC-008.

- [ ] T050 **Checkpoint commit** marker: `feat(030): additive registry + app.json plugin integration`.

---

## Phase 13: Polish & Cross-Cutting Concerns

**Purpose**: Format, gate, status updates, and final verification. No new business logic.

- [ ] T051 Run `pnpm format` from the repo root. Stage any resulting whitespace-only delta (FR-101). **Acceptance**: a second `pnpm format` produces no further diff. **Spec ref**: FR-101, AC-BGT-010, SC-006.
- [ ] T052 Run `pnpm check` (the project's aggregate `lint + typecheck + test` gate) from the repo root. **Acceptance**: green; all 13 new Jest suites pass; `pnpm check` exit code 0; no `eslint-disable` directives introduced in any added or modified file (FR-100 / FR-102). **Spec ref**: FR-100, FR-102, AC-BGT-010, SC-006.
- [ ] T053 [P] Update `specs/spec-status.md`: append (or update) the row for feature 030 with the implementation status, test-suite delta (≥ +13), and a link to this `tasks.md`. **Acceptance**: row exists; status reflects this branch's terminal state; format consistent with prior rows for 028 / 029. **Spec ref**: spec governance / repo hygiene.
- [ ] T054 [P] Update `specs/README.md` (only if it lists per-feature entries): add a one-line summary for `030-background-tasks` linking to its `spec.md` and `tasks.md`. If `specs/README.md` does not list per-feature entries, this task is a no-op — record that determination explicitly in the implementation log. **Acceptance**: either +1 line or documented no-op. **Spec ref**: spec governance / repo hygiene.
- [ ] T055 Final verification pass: re-run `pnpm check` once more after T053/T054 to confirm no documentation-only edit broke any link-check / markdown lint that the gate covers. **Acceptance**: `pnpm check` green; no diff outside the documented scope of feature 030. **Spec ref**: FR-102, AC-BGT-010.

- [ ] T056 **Checkpoint commit** marker: `chore(030): pnpm format + pnpm check green; spec-status + README updated`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: no dependencies; all four `[P]` tasks can run in parallel.
- **Phase 2 (Foundational types)**: depends on Phase 1. Blocks every subsequent phase.
- **Phase 3 (history-store)**: depends on Phase 2 (imports `TaskRunRecord` from types). Independent of Phases 4/5.
- **Phase 4 (non-iOS bridge stubs)**: depends on Phase 2.
- **Phase 5 (iOS bridge)**: depends on Phase 2 + Phase 4 (re-exports the shared error class consistently). Tests assume Phase 4 stubs already exist.
- **Phase 6 (hook)**: depends on Phase 3 + Phase 5.
- **Phase 7 (components)**: depends on Phase 2 (types) only — every component test mocks the hook, so it does NOT block on Phase 6. The six components can RED→GREEN in parallel.
- **Phase 8 (manifest)**: depends on Phase 7 (manifest's `screen` reference points at Phase 9, but the test only asserts shape — so Phase 8 may RED→GREEN before Phase 9 GREEN).
- **Phase 9 (screens)**: depends on Phase 6 + Phase 7 + Phase 8.
- **Phase 10 (plugin)**: independent of Phases 2–9 (plugin is pure `Info.plist` mutation). Can run in parallel with Phases 3–9 once Phase 1 is complete.
- **Phase 11 (Swift)**: independent at the JS-test level (no Jest suite). Can run in parallel with Phases 3–10.
- **Phase 12 (integration edits)**: depends on Phase 8 (registry import) + Phase 10 (`app.json` plugin entry).
- **Phase 13 (polish)**: depends on every prior phase.

### Within Each Phase

- Tests (RED) MUST be written and FAIL before the matching implementation (GREEN) begins (Constitution V).
- `[P]` tasks within a phase touch different files and can run in parallel.
- Checkpoint-commit tasks mark GREEN→REFACTOR boundaries — do not run `git commit` while generating this file.

### Parallel Opportunities

- All Phase 1 tasks `[P]` run in parallel.
- Phase 4's two RED tests + two implementations all `[P]`.
- Phase 7's six RED tests all `[P]`; six implementations all `[P]`.
- Phase 9's three screen RED tests all `[P]`; android + web implementations `[P]`.
- Phases 3, 4, 10, 11 can all run in parallel after Phase 2 completes (different files, different concerns).
- Phase 13's `pnpm format` (T051) is sequential, but `specs/spec-status.md` (T053) and `specs/README.md` (T054) edits are `[P]` to each other.

---

## Parallel Example: Phase 7 (Components)

```bash
# Six RED test tasks in parallel:
Task: T020 ExplainerCard.test.tsx
Task: T021 ScheduleAppRefreshCard.test.tsx
Task: T022 ScheduleProcessingCard.test.tsx
Task: T023 RunHistoryList.test.tsx
Task: T024 TestTriggerCard.test.tsx
Task: T025 IOSOnlyBanner.test.tsx

# Then six GREEN implementation tasks in parallel (after their RED partner is on disk):
Task: T026 ExplainerCard.tsx
Task: T027 ScheduleAppRefreshCard.tsx
Task: T028 ScheduleProcessingCard.tsx
Task: T029 RunHistoryList.tsx
Task: T030 TestTriggerCard.tsx
Task: T031 IOSOnlyBanner.tsx
```

---

## User-Story Coverage Map

| Story | Priority | Tasks (test + impl) |
|-------|----------|---------------------|
| US1 — Schedule app refresh | P1 | T015/T016 (bridge), T018/T019 (hook), T021/T027 (card), T035/T038 (screen), T045 (Swift), T048 (registry) |
| US2 — Schedule processing | P1 | T015/T016 (bridge), T018/T019 (hook), T022/T028 (card), T035/T038 (screen), T045 (Swift), T048 (registry) |
| US3 — Inspect history across relaunches | P2 | T008/T009 (history-store), T018/T019 (hook), T023/T029 (RunHistoryList), T035/T038 (screen), T045 (Swift writes LastRunSnapshot) |
| US4 — Cross-platform fallback | P3 | T011/T013 (android bridge), T012/T014 (web bridge), T025/T031 (IOSOnlyBanner), T036/T039 (android screen), T037/T040 (web screen) |

---

## Acceptance-Criteria Coverage Map

| AC ID | Tasks |
|-------|-------|
| AC-BGT-001 (registry +1) | T048 |
| AC-BGT-002 (app.json plugins +1) | T049 |
| AC-BGT-003 (Info.plist superset) | T042, T043 |
| AC-BGT-004 (all 13 test files) | T006, T008, T011, T012, T015, T018, T020–T025, T033, T035, T036, T037, T042 |
| AC-BGT-005 (history-store) | T008, T009 |
| AC-BGT-006 (hook) | T018, T019 |
| AC-BGT-007 (bridge) | T015, T016 |
| AC-BGT-008 (plugin) | T042, T043 |
| AC-BGT-009 (manifest) | T033, T034 |
| AC-BGT-010 (pnpm check / format / no eslint-disable) | T051, T052, T055 |

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Phases 1–6 (setup → bridge → hook).
2. Phases 7 (components) + 8 (manifest) + 9 (iOS `screen.tsx` only).
3. Phase 11 (Swift) on-device.
4. Phase 12 (registry + app.json).
5. Validate: schedule both task types from the iOS card, observe status pill transitions, verify a Run History row appears on completion.

### Incremental Delivery

1. MVP slice above → validate US1 + US2.
2. Add Phase 9's `.android.tsx` + `.web.tsx` variants → validate US4 cross-platform fallback.
3. Phase 10 (plugin) → validate `Info.plist` outputs after `expo prebuild` (SC-005 / SC-008).
4. Phase 13 (polish) → final `pnpm check` green.

### Parallel Team Strategy

Once Phase 2 completes, three streams may proceed independently:

- **Stream A**: Phase 3 (history-store) → Phase 6 (hook).
- **Stream B**: Phase 4 (non-iOS bridges) → Phase 5 (iOS bridge).
- **Stream C**: Phase 10 (plugin) — independent.
- **Stream D** (macOS-only contributor): Phase 11 (Swift).

Streams converge at Phase 7 (components), then Phase 9 (screens), then Phase 12 (integration).

---

## Notes

- `[P]` tasks = different files, no dependencies on incomplete tasks.
- `[Story]` tags trace tasks back to spec.md user stories (US1/US2/US3/US4); foundational and infra tasks (types, plugin, repo hygiene) are story-independent.
- Each user story is independently verifiable per spec §"Independent Test" sections.
- Verify RED tests fail with module-not-found / undefined-symbol before implementing GREEN.
- The orchestrator commits at the end; do NOT run `git commit` during task execution unless a checkpoint task explicitly says so.
- Avoid: vague tasks, same-file conflicts, cross-story dependencies that break US-level independence, edits to prior features' files (013/014/019/023/025/026/027/028/029 plugins, screens, and Swift sources are all UNTOUCHED — see plan §"Project Structure").
- No `eslint-disable` directives anywhere in added or modified code (FR-100).
