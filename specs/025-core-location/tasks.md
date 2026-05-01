---
description: "Task list for feature 025: Core Location Lab Module"
---

# Tasks: Core Location Lab Module

**Input**: Design documents from `/specs/025-core-location/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: REQUIRED — every constant table, hook, component, screen variant, plugin, and manifest has an explicit unit test (plan §Test Strategy, spec FR-016, Constitution Principle V).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing. P1 (US1: permission + live updates) is the MVP and unblocks US2 (US2: geofencing) and US3 (US3: heading + significant changes).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (US1, US2, US3) — Setup, Foundational, and Polish phases carry no story label
- All file paths are absolute repository-relative paths under the worktree root `C:\Users\izkizk8\spot-025-corelocation`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install the new dependency, scaffold the module directory, and scaffold the plugin directory. No business logic yet.

- [X] T001 Install `expo-task-manager` via SDK-aligned resolver: run `npx expo install expo-task-manager` in the repo root so `package.json` and `pnpm-lock.yaml` pick the SDK 55 selection (plan §Technical Context, spec FR-009). Do NOT hand-edit the version range. Verify `expo-location` is unchanged (reused from 024).
- [X] T002 [P] Create the module directory tree at `src/modules/core-location-lab/` with empty placeholder subdirs `components/` and `hooks/`. Do not create any source files yet — subsequent tasks own them.
- [X] T003 [P] Create the plugin directory tree at `plugins/with-core-location/` with `package.json` (`{ "name": "with-core-location", "version": "0.0.0", "main": "index.ts", "types": "index.ts" }`). Plugin source file (`index.ts`) is created in T024.
- [X] T004 [P] Create the test directory tree at `test/unit/modules/core-location-lab/` with empty subdirs `hooks/` and `components/`, and `test/unit/plugins/with-core-location/`. No files yet.
- [X] T005 **Checkpoint commit**: `chore(025): install expo-task-manager and scaffold module/plugin/test dirs`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Test infrastructure (mock at the import boundary for `expo-task-manager`) and the in-tree event store + constant tables that every user story consumes. MUST complete before any user-story phase begins.

**⚠️ CRITICAL**: No US1/US2/US3 task can start until Phase 2 is complete.

### Test mocks (extend, do not replace)

- [X] T006 Create `test/__mocks__/expo-task-manager.ts` exposing `defineTask(name, handler)` (records into a module-scoped `Map<string, handler>`), `isTaskRegisteredAsync(name)`, `getRegisteredTasksAsync()`, plus test-only helpers `__triggerGeofenceEvent(name, { eventType, region })` and `__resetTaskManagerMock()`. Pure JS, no native imports. (plan §Mocks)
- [X] T007 Extend `test/setup.ts` by adding ONE new `jest.mock('expo-task-manager', () => jest.requireActual('./__mocks__/expo-task-manager'))` line directly next to the existing `expo-location` mock entry. Do NOT touch the `expo-modules-core` block (see comment at `test/setup.ts:87-90`). Do NOT modify any other mock. Diff must be exactly +1 functional line plus any necessary import shuffle.
- [X] T008 [P] Programmatically extend the existing `test/__mocks__/expo-location.ts` (from feature 024) by ADDING new fields only — do NOT modify or remove existing fields. Add: `__setWatchPositionMock(callback => Subscription)`, `__setWatchHeadingMock(callback => Subscription)`, `__setGeofencingMock({ throwOnStart })`. Verify 024's MapKit Lab tests still pass after the change. (plan §Mocks)

### Constants (TDD: tests first)

- [X] T009 [P] Write `test/unit/modules/core-location-lab/accuracy-presets.test.ts` covering: 4 entries, label set is `['Best','Best for navigation','Hundred meters','Kilometer']`, each `value` is a member of `Location.LocationAccuracy`, `DEFAULT_ACCURACY_PRESET === ACCURACY_PRESETS[0]` with label `'Best'`, labels are unique. Test MUST fail (file not yet created).
- [X] T010 [P] Write `test/unit/modules/core-location-lab/distance-filters.test.ts` covering: 3 entries with `meters` ∈ `{5, 50, 500}`, labels include the meter count and unit suffix, `DEFAULT_DISTANCE_FILTER === DISTANCE_FILTERS[0]`. Test MUST fail (file not yet created).
- [X] T011 [P] Implement `src/modules/core-location-lab/accuracy-presets.ts` per plan §Constant tables (export `AccuracyPresetLabel`, `AccuracyPreset`, `ACCURACY_PRESETS`, `DEFAULT_ACCURACY_PRESET`). Make T009 pass.
- [X] T012 [P] Implement `src/modules/core-location-lab/distance-filters.ts` per plan §Constant tables (export `DistanceFilterMeters`, `DistanceFilter`, `DISTANCE_FILTERS`, `DEFAULT_DISTANCE_FILTER`). Make T010 pass.

### Shared types + in-memory event store

- [X] T013 Create `src/modules/core-location-lab/types.ts` exporting `RegionRadiusMeters`, `MonitoredRegion`, `RegionEvent`, `LocationSample`, `HeadingSample`, `SignificantChangeEvent` per plan §Entities. Type-only file; no runtime exports.
- [X] T014 Create `src/modules/core-location-lab/event-store.ts` implementing the module-scoped FIFO geofence event store (cap 100, idempotency on `{regionId, type, timestamp-bucket}`) per plan §`geofence-task.ts`. Export `appendGeofenceEvent`, `subscribeGeofenceEvents`, `getGeofenceEvents`, `__resetGeofenceStore` (test-only). Stored on `globalThis.__coreLocationGeofenceStore`.
- [X] T015 **Checkpoint commit**: `feat(025): foundational test mocks, constants, types, event store`.

**Checkpoint**: Foundation ready — US1/US2/US3 may now begin in parallel.

---

## Phase 3: User Story 1 — Grant permission and see a live location stream (Priority: P1) 🎯 MVP

**Goal**: User taps the card, grants when-in-use permission, taps Start in Live updates, and sees the readout updating with `samplesPerMinute > 0`. Tapping Stop halts updates immediately. Changing accuracy/distance filter while running restarts the subscription transparently (FR-007).

**Independent Test**: On iOS, fresh install → tap card → tap Request → accept system prompt → expand Live updates → tap Start → readout updates and samples/min > 0 → tap Stop → readout freezes.

### Tests for User Story 1 (write FIRST, ensure they FAIL)

- [X] T016 [P] [US1] Write `test/unit/modules/core-location-lab/hooks/useLocationUpdates.test.tsx` covering all five required behaviors: start subscribes (`watchPositionAsync` called with current accuracy/distance), stop unsubscribes (`subscription.remove()` called), samples populate state (`latest` reflects most recent push), `samplesPerMinute` rises within 60s window and decays past it (use `jest.useFakeTimers()`), `setAccuracy`/`setDistanceFilter` while running re-invokes `watchPositionAsync` with new args (FR-007), error path captures into `error` and leaves `isRunning === false`, unmount cleanup calls `subscription.remove()` and does not warn about setState-after-unmount (mountedRef guard). (plan §Hook tests)
- [X] T017 [P] [US1] Write `test/unit/modules/core-location-lab/components/PermissionsCard.test.tsx`: status pill renders correctly for all 4 statuses (`undetermined`, `granted-when-in-use`, `granted-always`, `denied`); Request button calls `onRequest`; Request is disabled when status is `'denied'`; Open Settings link calls `Linking.openSettings()` (mocked at import boundary). (plan §Component tests)
- [X] T018 [P] [US1] Write `test/unit/modules/core-location-lab/components/LocationReadout.test.tsx`: pure render of all six fields (lat, lng, alt, accuracy, speed, heading); null/none values render as the documented placeholder `'—'`; given `samplesPerMinute = N`, the row "Samples / min: N" is present.
- [X] T019 [P] [US1] Write `test/unit/modules/core-location-lab/components/LiveUpdatesCard.test.tsx`: Start/Stop toggle invokes hook's `start`/`stop`; accuracy selector renders 4 segments and taps call `setAccuracy` with matching preset; distance selector renders 3 segments and taps call `setDistanceFilter`; readout reflects hook's `latest` and `samplesPerMinute`. Hook is mocked at import boundary.

### Implementation for User Story 1

- [X] T020 [P] [US1] Implement `src/modules/core-location-lab/hooks/useLocationUpdates.ts` per plan §`useLocationUpdates`: state shape `UseLocationUpdates`; `start()` calls `Location.watchPositionAsync({ accuracy, distanceInterval })`, stores subscription in ref, sets `isRunning = true`; callback maintains trailing 60s FIFO window for `samplesPerMinute`; `stop()` removes subscription; `setAccuracy`/`setDistanceFilter` restart subscription if running (FR-007); `mountedRef` guards setState; effect cleanup tears down on unmount; thrown errors captured into `error`. Make T016 pass.
- [X] T021 [P] [US1] Implement `src/modules/core-location-lab/components/PermissionsCard.tsx` per plan §Components: status pill, Request button (with disabled state for `'denied'`), Open Settings link via `Linking.openSettings()`. Use `ThemedText`/`ThemedView` and `Spacing` scale; `StyleSheet.create()`. Make T017 pass.
- [X] T022 [P] [US1] Implement `src/modules/core-location-lab/components/LocationReadout.tsx` per plan §Components: pure presentational, renders six fields plus samples/min; null values render `'—'`. `StyleSheet.create()`. Make T018 pass.
- [X] T023 [US1] Implement `src/modules/core-location-lab/components/LiveUpdatesCard.tsx` per plan §Components: Start/Stop toggle, 4-segment accuracy selector (sourced from `ACCURACY_PRESETS`), 3-segment distance selector (sourced from `DISTANCE_FILTERS`), readout. Wires the `useLocationUpdates` hook. Make T019 pass. (depends on T020, T022)
- [X] T024 **Checkpoint commit**: `feat(025): US1 — Permissions + Live updates (hook + components + tests)`.

**Checkpoint**: User Story 1 is fully functional and independently testable. MVP is shippable.

---

## Phase 4: User Story 2 — Add and observe a geofence (Priority: P2)

**Goal**: User adds a circular region at the current fix on iOS; enter/exit transitions are appended to the events log. Android/web render the iOS-only banner in this card's slot.

**Independent Test**: On iOS with permission granted and at least one fix received, tap "Add at current location" → row appears → simulate location change in iOS Simulator's Debug menu → enter/exit events appear in the log within ~30s.

### Tests for User Story 2 (write FIRST, ensure they FAIL)

- [X] T025 [P] [US2] Write `test/unit/modules/core-location-lab/geofence-task.test.ts`: handler records event with `regionId === region.identifier`, `type === 'enter'` for `Enter` and `'exit'` for `Exit`, `timestamp instanceof Date`; idempotent — invoking twice with same `(regionId, type, timestamp-bucket)` yields one entry; `error !== null` short-circuits without writing; reaching 101 events FIFO-evicts the oldest. (plan §`geofence-task.test.ts`)
- [X] T026 [P] [US2] Write `test/unit/modules/core-location-lab/hooks/useRegionMonitoring.test.tsx`: on `Platform.OS === 'android'` (mocked), `regions` and `events` are empty and `addRegion` rejects with `'Region monitoring is iOS-only'`; on iOS, `addRegion` appends to `regions` (state `'unknown'`) and calls `startGeofencingAsync` with the full mapped list; quota error rolls optimistic append back and populates `error`; `removeRegion(id)` drops the id and re-invokes `startGeofencingAsync` (or `stopGeofencingAsync` when empty); when geofence event store fires `{regionId, type:'enter'}`, the matching region's state becomes `'inside'` and an event is appended; unmount unsubscribes from the store. (plan §Hook tests)
- [X] T027 [P] [US2] Write `test/unit/modules/core-location-lab/components/IOSOnlyBanner.test.tsx`: renders per-`reason` copy; specifically verify `reason="region-monitoring"` copy is present.
- [X] T028 [P] [US2] Write `test/unit/modules/core-location-lab/components/EventLog.test.tsx`: given `entries`, renders one row per entry with rendered timestamp; given empty `entries`, renders empty-state copy; given >100 entries (defensive), renders the most-recent 100.
- [X] T029 [P] [US2] Write `test/unit/modules/core-location-lab/components/RegionRow.test.tsx`: renders id, radius, and a state pill that varies by `state` (`'inside'` / `'outside'` / `'unknown'`).
- [X] T030 [P] [US2] Write `test/unit/modules/core-location-lab/components/RegionMonitoringCard.test.tsx`: 3-segment radius selector (50/100/500); Add button is disabled when no fix is provided via prop, enabled and calls `onAddRegion(radius)` otherwise; renders a `RegionRow` per region; renders the events log via `EventLog`.

### Implementation for User Story 2

- [X] T031 [P] [US2] Implement `src/modules/core-location-lab/geofence-task.ts` per plan §`geofence-task.ts`: export `GEOFENCE_TASK_NAME = 'spot.core-location-lab.geofence'`; call `TaskManager.defineTask` with handler that maps `eventType` to `'enter'`/`'exit'` and appends via `appendGeofenceEvent`; short-circuit on `error !== null`. Make T025 pass.
- [X] T032 [P] [US2] Implement `src/modules/core-location-lab/components/IOSOnlyBanner.tsx` per plan §Components: per-`reason` copy table, themed; `StyleSheet.create()`. Make T027 pass.
- [X] T033 [P] [US2] Implement `src/modules/core-location-lab/components/EventLog.tsx` per plan §Components: generic FIFO log renderer capped at 100 entries; empty-state copy. Make T028 pass.
- [X] T034 [P] [US2] Implement `src/modules/core-location-lab/components/RegionRow.tsx` per plan §Components: id, radius, state pill. Make T029 pass.
- [X] T035 [US2] Implement `src/modules/core-location-lab/hooks/useRegionMonitoring.ts` per plan §`useRegionMonitoring`: iOS-only via `Platform.OS === 'ios'` single-expression early-return; `addRegion`/`removeRegion` wrap `startGeofencingAsync`/`stopGeofencingAsync`; subscribes to `event-store` via `subscribeGeofenceEvents`; updates `regions[i].state` and `events`; mountedRef guard; throws `'Region monitoring is iOS-only'` on non-iOS as defense-in-depth. Make T026 pass. (depends on T013, T014, T031)
- [X] T036 [US2] Implement `src/modules/core-location-lab/components/RegionMonitoringCard.tsx` per plan §Components: radius selector (50/100/500), Add at current location button (disabled when no fix), `RegionRow` list, `EventLog`. Wires `useRegionMonitoring`. Make T030 pass. (depends on T032, T033, T034, T035)
- [X] T037 **Checkpoint commit**: `feat(025): US2 — Region monitoring (geofence task, hook, components, tests)`.

**Checkpoint**: User Story 2 is fully functional and independently testable on iOS; non-iOS surfaces the banner.

---

## Phase 5: User Story 3 — Read the compass and watch significant changes (Priority: P3)

**Goal**: Heading card drives `CompassNeedle` (reused from feature 011) via `watchHeadingAsync` bound to `headingMagneticNorth`; calibration banner appears when uncalibrated. Significant changes toggle subscribes/unsubscribes the significant-change service and logs each callback to a visible events log.

**Independent Test**: On iOS, expand Heading → physically rotate device → needle rotates. Toggle Significant changes on → app reports "subscribed" → log records at least one event during a long-enough session.

### Tests for User Story 3 (write FIRST, ensure they FAIL)

- [X] T038 [P] [US3] Write `test/unit/modules/core-location-lab/hooks/useHeading.test.tsx` covering the same five required hook behaviors (start, stop, samples, error, unmount) against `Location.watchHeadingAsync`, plus `isCalibrated === false` when latest sample's `accuracy === 0` and `true` for `1`/`2`/`3`. (plan §Hook tests)
- [X] T039 [P] [US3] Write `test/unit/modules/core-location-lab/components/HeadingCard.test.tsx`: renders `CompassNeedle` (mocked at import boundary as a `View testID="compass-needle"`) with `headingMagneticNorth` wired from the hook; calibration banner appears when `isCalibrated === false` and is absent when `true`; "Heading not available" copy renders when `error !== null`.
- [X] T040 [P] [US3] Write `test/unit/modules/core-location-lab/components/SignificantChangesCard.test.tsx`: toggle calls subscribe/unsubscribe; events list renders via `EventLog`; explanatory copy is present in the DOM regardless of toggle state.

### Implementation for User Story 3

- [X] T041 [P] [US3] Implement `src/modules/core-location-lab/hooks/useHeading.ts` per plan §`useHeading`: lifecycle identical to `useLocationUpdates` but backed by `Location.watchHeadingAsync`; expose `isCalibrated` derived from `latest?.accuracy` (0 = uncalibrated). Make T038 pass.
- [X] T042 [P] [US3] Implement `src/modules/core-location-lab/components/HeadingCard.tsx` per plan §Components: imports `CompassNeedle` from `src/modules/sensors-playground/components/CompassNeedle` (do NOT modify feature 011); calibration banner; "Heading not available" fallback. Make T039 pass.
- [X] T043 [P] [US3] Implement `src/modules/core-location-lab/components/SignificantChangesCard.tsx` per plan §Components: toggle that subscribes/unsubscribes the significant-change service via expo-location; explanatory copy; events list via `EventLog`. Make T040 pass. (depends on T033)
- [X] T044 **Checkpoint commit**: `feat(025): US3 — Heading + Significant changes (hooks, components, tests)`.

**Checkpoint**: All three user stories are independently functional.

---

## Phase 6: Screens, Manifest, Plugin, Integration

**Purpose**: Compose the screen variants, write the manifest, build and test the config plugin, then perform the additive +1 integrations into `src/modules/registry.ts` and `app.json`.

### Screen variants (write tests FIRST)

- [X] T045 [P] Write `test/unit/modules/core-location-lab/screen.test.tsx` (iOS): mounts; all 5 cards present; expanding/collapsing one card preserves the state of the others; `RegionMonitoringCard` renders (not the banner).
- [X] T046 [P] Write `test/unit/modules/core-location-lab/screen.android.test.tsx`: 4 functional cards plus `IOSOnlyBanner` in place of `RegionMonitoringCard`; no geofencing API call is made (assert `startGeofencingAsync` mock not called).
- [X] T047 [P] Write `test/unit/modules/core-location-lab/screen.web.test.tsx`: same as Android plus the Significant changes toggle is inert (no subscribe call) and shows a "Coarse on web" note; no native bridge invoked.
- [X] T048 [P] Implement `src/modules/core-location-lab/screen.tsx` (iOS): composes the 5 collapsible cards in order — `PermissionsCard`, `LiveUpdatesCard`, `RegionMonitoringCard`, `HeadingCard`, `SignificantChangesCard`. Per-card collapse state held in screen-local state (not persisted across navigations — FR-014). Make T045 pass.
- [X] T049 [P] Implement `src/modules/core-location-lab/screen.android.tsx`: same shell as `screen.tsx` but `RegionMonitoringCard` slot is `<IOSOnlyBanner reason="region-monitoring" />`. Make T046 pass.
- [X] T050 [P] Implement `src/modules/core-location-lab/screen.web.tsx`: same as `.android.tsx`; additionally renders the Significant changes toggle in an inert "Coarse on web" mode (no subscribe call). Make T047 pass.

### Manifest (write test FIRST)

- [X] T051 Write `test/unit/modules/core-location-lab/manifest.test.ts`: `id === 'core-location-lab'`, `label === 'Core Location'`, `platforms === ['ios','android','web']`, `minIOS === '8.0'`, `screen` is a function/component reference.
- [X] T052 Implement `src/modules/core-location-lab/index.tsx` exporting the `ModuleManifest` per plan §Source Code: `id 'core-location-lab'`, `label 'Core Location'`, icon `'location.fill'`, `platforms ['ios','android','web']`, `minIOS '8.0'`, `screen` resolved via platform-aware import (matches existing module convention). Make T051 pass. (depends on T048, T049, T050)

### Config plugin (write tests FIRST)

- [X] T053 Write `test/unit/plugins/with-core-location/index.test.ts` covering all 7 plan §Plugin test cases:
  1. Adds both keys with documented copy and `'location'` mode when absent.
  2. Overwrites stale usage-description copy without throwing.
  3. Idempotent — running twice produces identical Info.plist; `UIBackgroundModes` contains `'location'` exactly once.
  4. Coexists with `with-mapkit`: folding `withMapKit` then `withCoreLocation` yields `NSLocationWhenInUseUsageDescription` equal to **this feature's** copy (insertion-order winner) and `UIBackgroundModes` contains `'location'` exactly once.
  5. 12-in-tree-plugin coexistence smoke: read `app.json`'s `plugins`, assert `./plugins/with-*` count is 12, that `'./plugins/with-core-location'` immediately follows `'./plugins/with-mapkit'`, and that the inline `'expo-sensors'` entry remains the last array element.
  6. Mod-chain runs without throwing: import every default export from `plugins/with-*/index.ts` (12 total), fold over a baseline `ExpoConfig`, assert no throw and that both Core Location keys plus `'location'` background mode are set.
  7. Emits no `console.warn` calls on a baseline config.
- [X] T054 Implement `plugins/with-core-location/index.ts` per plan §Plugin Contract: `withInfoPlist` setting `NSLocationWhenInUseUsageDescription` and `NSLocationAlwaysAndWhenInUseUsageDescription` to the documented copy and appending `'location'` to `UIBackgroundModes` only when absent. Idempotent guards (`!== copy` for keys, `!modes.includes(...)` for the array). Make tests 1, 2, 3, 7 of T053 pass. (depends on T003)

### Additive integrations (single-line edits, performed AFTER everything above is green)

- [X] T055 Edit `src/modules/registry.ts` per plan §Registry Update: add `import coreLocationLab from './core-location-lab';` directly after the `mapkitLab` import; add `coreLocationLab,` to the `MODULES` array directly after `mapkitLab,` and before the trailing comment. Diff MUST be exactly +2 lines. No other line in the file may be touched. (FR-001)
- [X] T056 Edit `app.json` per plan §`app.json` Update: append `"./plugins/with-core-location"` to the `plugins` array, inserted immediately after `"./plugins/with-mapkit"` and before the inline `["expo-sensors", { ... }]` entry. Diff MUST be exactly +1 array entry. No other plugin entry may be modified or removed. (FR-002)
- [X] T057 Re-run T053's plugin coexistence cases 4, 5, 6 — they require T055 and T056 to be in place to pass.
- [X] T058 **Checkpoint commit**: `feat(025): screens, manifest, plugin, registry+1, app.json+1`.

---

## Phase 7: Polish & Final Gate

- [X] T059 [P] Run `pnpm format` from repo root; commit any formatting changes in a dedicated commit `style(025): pnpm format`.
- [X] T060 Run `pnpm check` (lint + typecheck + tests) from repo root as the final gate. Zero new failures permitted (FR-016, SC-006). If anything fails, fix in place and re-run until clean.
- [X] T061 Verify scope discipline post-implementation: `git diff --stat main..025-core-location` should show only the documented additive changes — `src/modules/registry.ts` (+2 lines), `app.json` (+1 line), `package.json` + `pnpm-lock.yaml` (`expo-task-manager` add), `test/setup.ts` (+1 mock line plus the new `expo-location` extensions), and the new files under `src/modules/core-location-lab/`, `plugins/with-core-location/`, `test/unit/modules/core-location-lab/`, `test/unit/plugins/with-core-location/`, `test/__mocks__/expo-task-manager.ts`. (FR-016, SC-007)
- [X] T062 **Final commit**: `feat(025): Core Location Lab module — feature complete`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1. BLOCKS all user-story phases.
- **Phase 3 (US1)**: Depends on Phase 2. MVP — independently shippable.
- **Phase 4 (US2)**: Depends on Phase 2. Independently testable on iOS.
- **Phase 5 (US3)**: Depends on Phase 2. Independently testable on iOS.
- **Phase 6 (Integration)**: Depends on Phases 3, 4, 5 (manifest references all three screen variants which compose all cards).
- **Phase 7 (Polish/Gate)**: Depends on Phase 6.

### User Story Dependencies

- **US1 (P1)**: No story dependencies. Pure foundation for permissions + live updates.
- **US2 (P2)**: No hard story dependency on US1 — the geofence hook/components and `EventLog` stand alone. In practice US1 supplies the "current fix" the Add button needs at runtime, but in tests this is mocked.
- **US3 (P3)**: No hard dependency on US1 or US2.

### Within Each User Story

- Tests MUST be written and FAIL before implementation (Constitution Principle V).
- Hooks before components that consume them.
- Components before screens that compose them.

### Parallel Opportunities

- Phase 1: T002, T003, T004 are [P] (different directories).
- Phase 2: T009/T010/T011/T012 are [P] (constants — independent files); T008 is [P] with T006/T007 only after T007's mock-shape decision is fixed (treat as sequential to be safe).
- Phase 3: All four test tasks (T016-T019) are [P]; implementation tasks T020/T021/T022 are [P]; T023 depends on T020+T022.
- Phase 4: All six test tasks (T025-T030) are [P]; T031/T032/T033/T034 are [P]; T035 depends on T031; T036 depends on T032/T033/T034/T035.
- Phase 5: All three test tasks (T038-T040) are [P]; T041/T042/T043 are [P].
- Phase 6: T045/T046/T047 are [P]; T048/T049/T050 are [P]; T053 is [P] with the screen tests; T055 and T056 must be sequential (single-file integrations, run after T054 is implemented).
- Phase 7: T059 is [P] with itself only; T060 must follow T059.

### Different user stories can be worked on in parallel by different team members once Phase 2 is complete.

---

## Parallel Example: User Story 1

```text
# Launch all US1 tests together (they MUST FAIL before implementation):
T016 useLocationUpdates.test.tsx
T017 PermissionsCard.test.tsx
T018 LocationReadout.test.tsx
T019 LiveUpdatesCard.test.tsx

# Then launch independent implementations together:
T020 useLocationUpdates.ts
T021 PermissionsCard.tsx
T022 LocationReadout.tsx

# Then T023 (LiveUpdatesCard.tsx) once T020 + T022 are green.
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phases 1 → 2 → 3.
2. STOP and validate US1 independently on iOS (real device or simulator).
3. The integration steps in Phase 6 (manifest, registry, app.json, plugin) are required before the screen is reachable from the app shell, so the practical MVP slice runs Phases 1 → 2 → 3 → 6 (skipping the US2/US3-only pieces of Phase 6 — i.e., screen.android/web variants still need to render the iOS-only banner; build them as stubs if shipping MVP without US2/US3).

### Incremental Delivery

1. Phases 1 + 2 → foundation ready.
2. Phase 3 → US1 demoable in isolation.
3. Phase 4 → US2 demoable on iOS.
4. Phase 5 → US3 demoable on iOS.
5. Phase 6 → wire into the app shell and ship the plugin.
6. Phase 7 → final gate.

### Parallel Team Strategy

After Phase 2:

- Developer A: Phase 3 (US1).
- Developer B: Phase 4 (US2).
- Developer C: Phase 5 (US3).
- Lead integrates Phase 6 once all three are green.

---

## Notes

- **[P] tasks** = different files, no dependencies on incomplete tasks.
- **[Story] label** maps task to specific user story for traceability; Setup, Foundational, Integration, and Polish phases carry no story label.
- Verify tests fail before implementing (Constitution Principle V — Test-First).
- `npx expo install` (not `pnpm add`) is used for `expo-task-manager` so the SDK 55 resolver picks the right version.
- `test/setup.ts` is **extended** (one new mock line + import boundary), not replaced. Do **not** modify the `expo-modules-core` block — see `test/setup.ts:87-90` for the reasoning preserved from feature 024.
- The plugin coexists with all 11 prior plugins, especially 024's `with-mapkit` which sets the same `NSLocationWhenInUseUsageDescription` key. Insertion order in `app.json` (with-core-location AFTER with-mapkit) makes this feature's copy the winner.
- Beacon ranging is explicitly out of scope (FR-013) — no `CLBeacon`-related code in any task.
- Region monitoring is iOS-only — the Android/web screen variants substitute `IOSOnlyBanner` for `RegionMonitoringCard`; the hook also throws as defense-in-depth on non-iOS.
- Commit at every checkpoint marker (T005, T015, T024, T037, T044, T058, T062).
- Final gate: `pnpm format` then `pnpm check`. No new failures permitted (FR-016, SC-006).
