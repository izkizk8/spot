---
description: "Actionable, dependency-ordered TDD task list for MapKit Lab Module (feature 024)"
---

# Tasks: MapKit Lab Module

**Input**: Design documents from `/specs/024-mapkit/`
**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`,
`contracts/mapkit-search-bridge.md`, `contracts/lookaround-bridge.md`,
`contracts/with-mapkit-plugin.md`, `quickstart.md`.

**Branch**: `024-mapkit` | **Worktree**: `C:\Users\izkizk8\spot-024-mapkit\`

**Tests**: Strictly TDD per spec NFR-007 / NFR-008 and constitution V
("Test-First"). For every implementation task, the matching `*.test.*`
task listed immediately before it MUST be written and observed RED
before implementation lands. JS-pure throughout — no native runtime is
exercised in CI (NFR-007).

**Organization**: Tasks are grouped by user story (US1–US5 from spec.md)
where it adds clarity. Foundations (deps install → mocks → native bridges →
JS bridges → landmarks → hook) are in Phases 1–3 because every story
depends on them. Components and screens follow per-story; manifest +
registry + plugin + `app.json` integration land last; final phase is the
green-bar gate plus the commit.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: `US1`–`US5` from spec.md; phases 1–3, 9, 10 have no story label.
- File paths are relative to the worktree root for readability.
- Tests are listed *before* their implementation task (TDD: RED → GREEN).

---

## Phase 1: Setup & Dependency Install

**Purpose**: Land the directory tree and the two new pnpm dependencies
via the Expo SDK 55 resolver. No business logic yet.

- [ ] T001 Create the empty directory tree:
  `src/modules/mapkit-lab/`,
  `src/modules/mapkit-lab/components/`,
  `src/modules/mapkit-lab/hooks/`,
  `src/native/` (already exists — confirm only),
  `native/ios/mapkit/`,
  `plugins/with-mapkit/`,
  `test/unit/modules/mapkit-lab/`,
  `test/unit/modules/mapkit-lab/components/`,
  `test/unit/modules/mapkit-lab/hooks/`,
  `test/unit/native/` (confirm),
  `test/unit/plugins/with-mapkit/`.
  Implements plan.md §Architecture.
- [ ] T002 Run `npx expo install react-native-maps expo-location` from
  the worktree root. Observe `package.json` + `pnpm-lock.yaml` updated
  to SDK-55-aligned versions; then `pnpm install` exits clean. Implements
  research.md §1, plan.md §Technical Context.
- [ ] T003 Run `pnpm typecheck` to confirm the two new packages' types
  satisfy `tsc --noEmit` under `strict: true`. No code changes; this
  is the Phase 0 validation gate (research.md §5).

---

## Phase 2: Global Test Mocks

**Purpose**: Create the four JS-pure global mocks every subsequent test
will consume. These BLOCK every other test task. Matches the
021/022/023 global-mock convention.

- [ ] T004 [P] Create `test/__mocks__/react-native-maps.tsx` —
  `MapView`, `Marker`, `Polyline` exported as testID-tagged `View`s
  (`map-view`, `map-marker`, `map-polyline`); `mapType` / `region` /
  `showsUserLocation` props forwarded to `accessibilityState` for
  observable assertions; `MapView.prototype.animateToRegion` captured
  on a recorder; `__resetMapsMock()` helper for per-test reset.
  Implements plan.md §Test stack and §Mocks.
- [ ] T005 [P] Create `test/__mocks__/expo-location.ts` — exports
  `requestForegroundPermissionsAsync`, `getForegroundPermissionsAsync`,
  `getCurrentPositionAsync` as jest fns; `__setLocationMock({ status,
  coords, throwOnGet })` programmable per test; `__resetLocationMock()`.
  Implements plan.md §Mocks.
- [ ] T006 [P] Create `test/__mocks__/native-mapkit-search.ts` — mirrors
  the `native-keychain` mock shape from 023: an injectable resolver
  consumed by `requireOptionalNativeModule('SpotMapKitSearch')` plus
  per-call result/throw injection (`__setSearchModule(null | { search })`,
  `__setSearchResult(...)`, `__setSearchThrow(err)`,
  `__resetSearchMock()`). NFR-007 / NFR-008.
- [ ] T007 [P] Create `test/__mocks__/native-lookaround.ts` — same
  injection shape as T006 but for `requireOptionalNativeModule('SpotLookAround')`:
  `__setLookAroundModule(null | { presentLookAround })`,
  `__setLookAroundResult({ shown })`, `__setLookAroundThrow(err)`,
  `__resetLookAroundMock()`. NFR-007 / NFR-008.
- [ ] T008 Wire all four new mocks into `test/setup.ts` next to the
  existing `native-keychain` mock from feature 023 (one
  `jest.mock('react-native-maps', () => require('./__mocks__/react-native-maps'))`
  call per module; reset hooks added to the existing
  `beforeEach`/`afterEach`). Sequential because it edits a single
  shared file. NFR-007.

---

## Phase 3: Foundational — Bridge Types, JS Bridges, Landmarks, Hook

**Purpose**: Land every JS export every component will import. BLOCKS
every component / screen task. Every implementation task is preceded by
its matching test task (TDD).

### 3a. Native bridge JS surface (per-platform-file pattern, NFR-008)

- [ ] T009 [P] Create `src/native/mapkit-search.types.ts` — exports
  `SearchResult`, `SearchRegion`, `MapKitSearchBridge` interfaces and
  `MapKitNotSupportedError` class exactly as in plan.md §JS Bridge
  Contract. Pure types/values; no runtime deps.
- [ ] T010 [P] Create `src/native/lookaround.types.ts` — exports
  `LookAroundResult` and `LookAroundBridge` interfaces per plan.md
  §JS Bridge Contract.
- [ ] T011 [P] Create `test/unit/native/mapkit-search.ios.test.ts` —
  RED first: when the global `native-mapkit-search` mock resolves to a
  module, `searchLocations(q, r)` forwards `(q, r)` and returns the
  array; when the mock resolves to `null`, every call throws
  `MapKitNotSupportedError('searchLocations')`. plan.md §Test Strategy.
- [ ] T012 Create `src/native/mapkit-search.ios.ts` — resolves
  `requireOptionalNativeModule<{ search }>('SpotMapKitSearch')`; default
  export implements `MapKitSearchBridge.searchLocations` by delegating
  to `module.search(query, region)`; throws `MapKitNotSupportedError`
  when the module is `null`. Makes T011 GREEN.
- [ ] T013 [P] Create `test/unit/native/mapkit-search.android.test.ts` —
  RED: every call to `searchLocations` throws `MapKitNotSupportedError`.
- [ ] T014 [P] Create `src/native/mapkit-search.android.ts` — pure stub
  per plan.md §JS Bridge Contract. Makes T013 GREEN.
- [ ] T015 [P] Create `test/unit/native/mapkit-search.web.test.ts` —
  RED: same as T013 but for web.
- [ ] T016 [P] Create `src/native/mapkit-search.web.ts` — pure stub
  identical in shape to T014. Makes T015 GREEN.
- [ ] T017 [P] Create `test/unit/native/lookaround.ios.test.ts` —
  RED: when the global `native-lookaround` mock resolves to a module,
  `presentLookAround(lat, lng)` forwards `(lat, lng)` and returns the
  result; when the mock resolves to `null`, throws
  `MapKitNotSupportedError('presentLookAround')`.
- [ ] T018 Create `src/native/lookaround.ios.ts` — resolves
  `requireOptionalNativeModule<{ presentLookAround }>('SpotLookAround')`;
  default export implements `LookAroundBridge.presentLookAround`. Makes
  T017 GREEN.
- [ ] T019 [P] Create `test/unit/native/lookaround.android.test.ts` —
  RED: stub always throws.
- [ ] T020 [P] Create `src/native/lookaround.android.ts` — pure stub.
  Makes T019 GREEN.
- [ ] T021 [P] Create `test/unit/native/lookaround.web.test.ts` —
  RED: stub always throws.
- [ ] T022 [P] Create `src/native/lookaround.web.ts` — pure stub.
  Makes T021 GREEN.

### 3b. Landmarks data

- [ ] T023 [P] Create `test/unit/modules/mapkit-lab/landmarks.test.ts` —
  RED: `LANDMARKS.length === 4`; each `id` matches `/^[a-z][a-z0-9-]*$/`;
  ids are unique; `lat ∈ [-90, 90]`, `lng ∈ [-180, 180]`; `description`
  non-empty. `DEFAULT_FALLBACK_REGION.lat ∈ [25, 50]`,
  `lng ∈ [-130, -65]`. plan.md §Test Strategy / §Data.
- [ ] T024 Create `src/modules/mapkit-lab/landmarks.ts` — exports the
  `Landmark` interface, the `LANDMARKS` readonly array (Apple Park,
  Eiffel Tower, Tokyo Tower, Sydney Opera House) and
  `DEFAULT_FALLBACK_REGION` exactly as plan.md §Data. Makes T023 GREEN.

### 3c. `useMapState` hook

- [ ] T025 Create `test/unit/modules/mapkit-lab/hooks/useMapState.test.tsx` —
  RED across all branches in plan.md §Hook Contract / §Test Strategy
  `useMapState.test.tsx` bullets: initial state, `toggleAnnotation`
  (add → remove → unknown id), `addAnnotationAtCenter` id-uniqueness
  with `jest.useFakeTimers()`, `drawSampleLoop` ≥4 closed-loop points
  within span, `clearPolyline`, `setMapType` round-trip, `setRegion`,
  `setPermissionStatus('denied')` forces `userLocationEnabled=false`,
  `toggleUserLocation` no-op when ungranted, `recenter` granted /
  throw / ungranted branches via the `expo-location` mock. Asserts
  the `mountedRef` post-unmount guard does not warn.
- [ ] T026 Create `src/modules/mapkit-lab/hooks/useMapState.ts` —
  implements the full `UseMapState` contract per plan.md §Hook Contract:
  state, all 9 actions, `mountedRef` guard, `getForegroundPermissionsAsync`
  on mount, `getCurrentPositionAsync` in `recenter` with the documented
  fallback + single `console.warn` on throw. Makes T025 GREEN.

---

## Phase 4: Cross-cutting components (consumed by every story)

These ship before the per-story panels because the screens and panels
both depend on them. Each `*.test.tsx` is RED before implementation.

- [ ] T027 [P] Create
  `test/unit/modules/mapkit-lab/components/IOSOnlyBanner.test.tsx` —
  RED: copy varies per `reason` prop (`'search' | 'lookaround' | 'ios-version'`);
  no side effects. plan.md §Component Contracts.
- [ ] T028 [P] Create
  `src/modules/mapkit-lab/components/IOSOnlyBanner.tsx` — themed
  `ThemedView` + `ThemedText`; per-reason copy. Makes T027 GREEN.
- [ ] T029 [P] Create
  `test/unit/modules/mapkit-lab/components/MapPlaceholder.test.tsx` —
  RED: renders the documented "Map view not available on web" copy.
- [ ] T030 [P] Create
  `src/modules/mapkit-lab/components/MapPlaceholder.tsx` — centered
  `ThemedText` with the documented copy. Makes T029 GREEN.
- [ ] T031 [P] Create
  `test/unit/modules/mapkit-lab/components/PermissionsCard.test.tsx` —
  RED: renders a status row for all 4 `PermissionStatus` values; the
  request button is enabled only on `'undetermined'`; press awaits
  `onRequest`.
- [ ] T032 [P] Create
  `src/modules/mapkit-lab/components/PermissionsCard.tsx` — props,
  themed render, `Pressable` gated on `status === 'undetermined'`.
  Makes T031 GREEN.
- [ ] T033 [P] Create
  `test/unit/modules/mapkit-lab/components/MapToolbar.test.tsx` — RED:
  segmented control toggles all 4 `MapType` values via `setMapType`;
  Switch is disabled and renders the hint subtitle when
  `permissionStatus !== 'granted'`; Recenter calls `onRecenter`.
- [ ] T034 [P] Create
  `src/modules/mapkit-lab/components/MapToolbar.tsx` — `Pressable`-based
  4-segment row, RN `Switch` (or `Pressable` substitute) for user-location
  toggle (disabled per status), Recenter `Pressable`. `StyleSheet.create`
  only; uses `Spacing` + `useTheme()`. Makes T033 GREEN.

---

## Phase 5: User Story 1 — Browse map + toggle preset annotations

> Maps to spec US1: "I can open MapKit Lab, see four preset landmarks I
> can toggle, switch map type, and pan the map."

- [ ] T035 [P] [US1] Create
  `test/unit/modules/mapkit-lab/components/AnnotationsPanel.test.tsx` —
  RED: 4 toggle rows render landmark names from `LANDMARKS`; each
  toggle calls `onToggleAnnotation(id)` with the right id;
  "Add at center" calls `onAddAtCenter`; footer "Custom pins: N"
  reflects `customAnnotations.length`.
- [ ] T036 [US1] Create
  `src/modules/mapkit-lab/components/AnnotationsPanel.tsx` — themed
  list of 4 toggleable rows + add-button + footer per plan.md
  §Component Contracts. Makes T035 GREEN.

---

## Phase 6: User Story 2 — Draw / clear sample polyline

> Maps to spec US2: "I can draw a sample loop polyline and clear it."

- [ ] T037 [P] [US2] Create
  `test/unit/modules/mapkit-lab/components/PolylinePanel.test.tsx` —
  RED: Draw calls `onDraw`; Clear is `disabled` when `hasPolyline === false`
  and calls `onClear` otherwise.
- [ ] T038 [US2] Create
  `src/modules/mapkit-lab/components/PolylinePanel.tsx` — two themed
  `Pressable`s with the disabled-Clear gating. Makes T037 GREEN.

---

## Phase 7: User Story 3 — Region-scoped MKLocalSearch (iOS)

> Maps to spec US3 / FR-011 / FR-edge "Search bridge throws".

- [ ] T039 [P] [US3] Create
  `test/unit/modules/mapkit-lab/components/SearchPanel.test.tsx` — RED:
  empty-query Submit is a no-op; non-empty Submit calls
  `bridge.searchLocations(query, region)` with the active region;
  results render rows; tapping a row calls `onResultPress`; bridge
  throw surfaces `error.message` inline; empty results render the
  empty-state copy. Loading transitions assert via `act` + `await`.
- [ ] T040 [US3] Create
  `src/modules/mapkit-lab/components/SearchPanel.tsx` — local
  `query`/`loading`/`error`/`results` state; submits to
  `props.bridge.searchLocations(query, props.region)`; themed
  text input + button + result list. Makes T039 GREEN.

---

## Phase 8: User Story 4 — LookAround presentation (iOS 16+)

> Maps to spec US4 / FR-012 / FR-edge "iOS < 16" / "no imagery".

- [ ] T041 [P] [US4] Create
  `test/unit/modules/mapkit-lab/components/LookAroundPanel.test.tsx` —
  RED: `iosVersionAtLeast16=false` renders `IOSOnlyBanner reason="ios-version"`;
  `=true` renders the action `Pressable`; press calls
  `bridge.presentLookAround(region.lat, region.lng)`;
  `{ shown: false }` renders the no-imagery copy; bridge throw renders
  the inline error message.
- [ ] T042 [US4] Create
  `src/modules/mapkit-lab/components/LookAroundPanel.tsx` — version
  gate + button + result/error rendering per plan.md §Component
  Contracts. Makes T041 GREEN.

---

## Phase 9: BottomTabs composer + screens + manifest

These compose Phases 4–8. `BottomTabs` is the local-state owner for the
active tab.

- [ ] T043 [P] Create
  `test/unit/modules/mapkit-lab/components/BottomTabs.test.tsx` — RED:
  initial active tab is `'annotations'`; tapping each of the four tabs
  swaps the rendered panel (queryByTestId on the panel root for
  `annotations-panel`, `polyline-panel`, `search-panel`,
  `lookaround-panel`).
- [ ] T044 Create `src/modules/mapkit-lab/components/BottomTabs.tsx` —
  4-cell tab strip, owns `activeTab` state, renders the active panel,
  forwards the bridges + state from `useMapState` to each panel per
  plan.md §Component Contracts. Makes T043 GREEN.
- [ ] T045 [P] Create `test/unit/modules/mapkit-lab/manifest.test.ts` —
  RED: `id === 'mapkit-lab'`; `title === 'MapKit Lab'`;
  `platforms === ['ios','android','web']`; `minIOS === '9.0'`;
  `render` is a function; `icon === 'map.fill'`. plan.md §Test Strategy.
- [ ] T046 Create `src/modules/mapkit-lab/index.tsx` — exports the
  `ModuleManifest` default export per plan.md §Architecture; `render`
  returns the platform-resolved screen. Makes T045 GREEN.
- [ ] T047 [P] Create `test/unit/modules/mapkit-lab/screen.test.tsx` —
  RED: mounts; `MapView` (testID `map-view`), `MapToolbar`,
  `BottomTabs`, `PermissionsCard` are present; the four panels are
  reachable through `BottomTabs`. plan.md §Test Strategy / Screen
  variants.
- [ ] T048 Create `src/modules/mapkit-lab/screen.tsx` — composes
  `useMapState` + `<MapView>` + `<MapToolbar>` + `<BottomTabs>` +
  `<PermissionsCard>`; computes
  `iosVersionAtLeast16 = Platform.OS === 'ios' && Number(Platform.Version) >= 16`
  inline (allowed by Constitution III for single-value derivation per
  plan.md §Constitution Compliance); injects the iOS bridges from
  `src/native/mapkit-search` and `src/native/lookaround`. Makes T047 GREEN.
- [ ] T049 [P] Create
  `test/unit/modules/mapkit-lab/screen.android.test.tsx` — RED:
  `MapView` present; Search and LookAround tabs render `IOSOnlyBanner`;
  Annotations and Polyline tabs work via the same `useMapState` hook.
- [ ] T050 Create `src/modules/mapkit-lab/screen.android.tsx` — same
  shell as T048; SearchPanel and LookAroundPanel slots replaced by
  `<IOSOnlyBanner reason="search" />` / `reason="lookaround"`. Makes
  T049 GREEN.
- [ ] T051 [P] Create
  `test/unit/modules/mapkit-lab/screen.web.test.tsx` — RED:
  `MapPlaceholder` renders in place of `MapView`; toolbar + bottom
  panel still mount; pressing Recenter / "Add at center" / "Draw
  sample loop" does not throw and does not call any native bridge.
- [ ] T052 Create `src/modules/mapkit-lab/screen.web.tsx` — replaces
  `<MapView>` with `<MapPlaceholder />`; Search and LookAround tabs
  render `IOSOnlyBanner`; map-mutating actions are inert. Makes T051
  GREEN.

---

## Phase 10: Native iOS bridges (Swift, in-tree)

> JS contract is already proven by Phase 3; this phase is the autolinked
> native implementation for the custom dev client. Independent of
> Phases 4–9 once Phase 3 is GREEN. Swift sources are exempt from
> JS-pure tests (NFR-007), but the JS surface they back is fully covered
> by Phase 3 tests.

- [ ] T053 [P] Create `native/ios/mapkit/MapKitSearchBridge.swift` —
  Expo Modules `Module` named `SpotMapKitSearch` with the
  `AsyncFunction("search")` signature in plan.md §Native Bridges;
  implements `MKLocalSearch.Request` with `naturalLanguageQuery` +
  region; maps `response.mapItems` to `[SearchResult]` per the
  documented address composition; awaits `MKLocalSearch.start()`;
  throws propagate to JS. Implements `contracts/mapkit-search-bridge.md`.
- [ ] T054 [P] Create `native/ios/mapkit/LookAroundBridge.swift` —
  Expo Modules `Module` named `SpotLookAround` with
  `AsyncFunction("presentLookAround")`; gated on
  `if #available(iOS 16.0, *)` (older OS resolves `{ shown: false }`);
  presents `MKLookAroundViewController` modally on the topmost
  presented VC of the foreground key window; main-actor dispatch via
  `await MainActor.run`. Implements `contracts/lookaround-bridge.md`.
- [ ] T055 [P] Create `native/ios/mapkit/MapKit.podspec` — single
  podspec covering both Swift sources (matches the 023
  one-podspec-per-feature pattern). plan.md §Architecture.
- [ ] T056 [P] Create `native/ios/mapkit/expo-module.config.json` —
  `{ "platforms": ["ios"], "ios": { "modules": ["MapKitSearchBridge",
  "LookAroundBridge"] } }`. plan.md §Architecture.

---

## Phase 11: Expo config plugin `with-mapkit`

- [ ] T057 [P] Create `plugins/with-mapkit/package.json` —
  `{ name, version, main: "index.ts", types: "index.ts" }` so the
  plugin is consumable via the `./plugins/with-mapkit` path used by
  `app.json`.
- [ ] T058 [P] Create `test/unit/plugins/with-mapkit/index.test.ts` —
  RED for all 7 cases enumerated in plan.md §Plugin / Coexistence
  verification: (1) adds key with documented copy when absent;
  (2) overwrites stale value; (3) idempotent on double-run;
  (4) zero `console.warn` on baseline; (5) only edits
  `NSLocationWhenInUseUsageDescription`; (6) coexistence — `app.json`
  `plugins` length is 15 with `'./plugins/with-mapkit'` present
  exactly once and prior 14 entries unmodified by deep-equality on
  the head slice; (7) full mod-chain over a baseline `ExpoConfig`
  folds without throwing and ends with the documented copy set.
  jest `node` env (matches `with-keychain-services/index.test.ts`).
- [ ] T059 Create `plugins/with-mapkit/index.ts` — `withInfoPlist`
  guard-equality writer for `NSLocationWhenInUseUsageDescription`
  with the documented user-facing copy in plan.md §Plugin. Makes
  T058 cases 1–5 GREEN. (Cases 6–7 require T060 + T061.)

---

## Phase 12: Registry + `app.json` integration

- [ ] T060 Edit `src/modules/registry.ts` — append exactly two lines:
  the import `import mapkitLab from './mapkit-lab';` after the existing
  `keychainLab` import, and the `mapkitLab,` entry inside the `MODULES`
  array immediately after `keychainLab,`. No other line in the file
  is edited. plan.md §Registry Update.
- [ ] T061 Edit `app.json` — append exactly one entry
  `"./plugins/with-mapkit"` to the `plugins` array, inserted **before**
  the inline-configured `expo-sensors` array so the array tail
  convention is preserved (final length 15). No prior entry edited.
  plan.md §`app.json` Update. Makes T058 cases 6–7 GREEN.

---

## Phase 13: Polish & Cross-Cutting Verification

- [ ] T062 Run `pnpm format && pnpm check` from the worktree root and
  confirm green. `pnpm check` is the project's aggregate
  lint/typecheck/test gate. Zero new `eslint-disable` directives for
  unregistered rules (NFR-002); strict TS (NFR-003); full suite green
  (NFR-007). If any failure surfaces, fix in place and re-run until
  fully green before T063.
- [ ] T063 Run the `quickstart.md` validation script end-to-end on the
  custom dev client (manual checklist): browse + toggle annotations,
  switch map types, draw + clear polyline, request when-in-use
  permission, recenter on user location, MKLocalSearch in-region,
  LookAround on iOS 16+ (and the iOS<16 / Android / Web negative
  paths). Confirms US1–US5 acceptance scenarios in a single pass.
- [ ] T064 Verify constitution v1.1.0 compliance per plan.md
  §Constitution Compliance: three screen variants, JS bridges split
  per-platform-file (no inline `Platform.OS` branch in any bridge or
  component besides the single `iosVersionAtLeast16` derivation in
  `screen.tsx`), `ThemedText`/`ThemedView`/`Spacing`/`useTheme()`
  everywhere, `StyleSheet.create` only with no inline color literals,
  and a paired test file for every new JS export.
- [ ] T065 Commit. Use a single descriptive conventional commit (or
  split into a small number of logical commits at your discretion —
  e.g. one for deps + mocks, one for bridges + hook + components +
  screens + plugin + registry + app.json) using the
  **`feat(024):`** prefix and append the trailer
  `Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`
  to every commit message. Example single-commit subject:
  `feat(024): add MapKit Lab module with MKLocalSearch + LookAround bridges`.
  Do **not** push.

---

## Dependencies & Execution Order

### Phase dependencies

- **Phase 1 (Setup + deps install)**: No deps — start immediately.
- **Phase 2 (Mocks)**: Depends on Phase 1; BLOCKS every test task.
- **Phase 3 (Foundational JS — types, bridges, landmarks, hook)**:
  Depends on Phase 2; BLOCKS every component / screen / manifest task.
- **Phase 4 (Cross-cutting components)**: Depends on Phase 3.
- **Phases 5–8 (US1–US4 panels)**: Depend on Phase 3; independent of
  each other and may proceed in parallel by separate engineers.
- **Phase 9 (BottomTabs + screens + manifest)**: Depends on Phases 4–8.
- **Phase 10 (Swift bridges)**: Depends only on Phase 3 (the JS
  contract). Independent of Phases 4–9; may run fully in parallel.
- **Phase 11 (Plugin)**: Depends on Phase 1; T058 cases 6–7 depend on
  T061 (so the test goes RED initially and turns GREEN after Phase 12).
- **Phase 12 (Registry + app.json)**: Depends on Phases 9 + 11.
- **Phase 13 (Polish + commit)**: Depends on every prior phase.

### Parallel-safe batches

- Phase 2 mocks: T004 ∥ T005 ∥ T006 ∥ T007 (then T008 sequential).
- Phase 3a bridges: T009 ∥ T010, then test/impl pairs T011→T012,
  T013→T014, T015→T016, T017→T018, T019→T020, T021→T022 may run as
  six parallel pair-streams once T009/T010 land.
- Phase 4 components: T027/T028, T029/T030, T031/T032, T033/T034 are
  four parallel pair-streams.
- Phases 5/6/7/8: four parallel pair-streams (one per US panel).
- Phase 9 screens: T047/T048, T049/T050, T051/T052 are three parallel
  pair-streams once T044 + T046 land.
- Phase 10 Swift: T053 ∥ T054 ∥ T055 ∥ T056 fully parallel.
- Phase 11: T057 ∥ T058 (then T059 sequential).

### File-coverage cross-check

Every file enumerated in plan.md §Architecture is covered by at least
one task above:

| Plan file | Task |
| --- | --- |
| `src/modules/mapkit-lab/index.tsx` | T046 |
| `src/modules/mapkit-lab/screen.tsx` | T048 |
| `src/modules/mapkit-lab/screen.android.tsx` | T050 |
| `src/modules/mapkit-lab/screen.web.tsx` | T052 |
| `src/modules/mapkit-lab/landmarks.ts` | T024 |
| `src/modules/mapkit-lab/hooks/useMapState.ts` | T026 |
| `src/modules/mapkit-lab/components/MapToolbar.tsx` | T034 |
| `src/modules/mapkit-lab/components/BottomTabs.tsx` | T044 |
| `src/modules/mapkit-lab/components/AnnotationsPanel.tsx` | T036 |
| `src/modules/mapkit-lab/components/PolylinePanel.tsx` | T038 |
| `src/modules/mapkit-lab/components/SearchPanel.tsx` | T040 |
| `src/modules/mapkit-lab/components/LookAroundPanel.tsx` | T042 |
| `src/modules/mapkit-lab/components/PermissionsCard.tsx` | T032 |
| `src/modules/mapkit-lab/components/IOSOnlyBanner.tsx` | T028 |
| `src/modules/mapkit-lab/components/MapPlaceholder.tsx` | T030 |
| `src/native/mapkit-search.ios.ts` | T012 |
| `src/native/mapkit-search.android.ts` | T014 |
| `src/native/mapkit-search.web.ts` | T016 |
| `src/native/mapkit-search.types.ts` | T009 |
| `src/native/lookaround.ios.ts` | T018 |
| `src/native/lookaround.android.ts` | T020 |
| `src/native/lookaround.web.ts` | T022 |
| `src/native/lookaround.types.ts` | T010 |
| `native/ios/mapkit/MapKitSearchBridge.swift` | T053 |
| `native/ios/mapkit/LookAroundBridge.swift` | T054 |
| `native/ios/mapkit/MapKit.podspec` | T055 |
| `native/ios/mapkit/expo-module.config.json` | T056 |
| `plugins/with-mapkit/index.ts` | T059 |
| `plugins/with-mapkit/package.json` | T057 |
| `test/__mocks__/react-native-maps.tsx` | T004 |
| `test/__mocks__/expo-location.ts` | T005 |
| `test/__mocks__/native-mapkit-search.ts` | T006 |
| `test/__mocks__/native-lookaround.ts` | T007 |
| `test/setup.ts` | T008 |
| `test/unit/modules/mapkit-lab/manifest.test.ts` | T045 |
| `test/unit/modules/mapkit-lab/landmarks.test.ts` | T023 |
| `test/unit/modules/mapkit-lab/hooks/useMapState.test.tsx` | T025 |
| `test/unit/modules/mapkit-lab/components/MapToolbar.test.tsx` | T033 |
| `test/unit/modules/mapkit-lab/components/BottomTabs.test.tsx` | T043 |
| `test/unit/modules/mapkit-lab/components/AnnotationsPanel.test.tsx` | T035 |
| `test/unit/modules/mapkit-lab/components/PolylinePanel.test.tsx` | T037 |
| `test/unit/modules/mapkit-lab/components/SearchPanel.test.tsx` | T039 |
| `test/unit/modules/mapkit-lab/components/LookAroundPanel.test.tsx` | T041 |
| `test/unit/modules/mapkit-lab/components/PermissionsCard.test.tsx` | T031 |
| `test/unit/modules/mapkit-lab/components/IOSOnlyBanner.test.tsx` | T027 |
| `test/unit/modules/mapkit-lab/components/MapPlaceholder.test.tsx` | T029 |
| `test/unit/modules/mapkit-lab/screen.test.tsx` | T047 |
| `test/unit/modules/mapkit-lab/screen.android.test.tsx` | T049 |
| `test/unit/modules/mapkit-lab/screen.web.test.tsx` | T051 |
| `test/unit/native/mapkit-search.ios.test.ts` | T011 |
| `test/unit/native/mapkit-search.android.test.ts` | T013 |
| `test/unit/native/mapkit-search.web.test.ts` | T015 |
| `test/unit/native/lookaround.ios.test.ts` | T017 |
| `test/unit/native/lookaround.android.test.ts` | T019 |
| `test/unit/native/lookaround.web.test.ts` | T021 |
| `test/unit/plugins/with-mapkit/index.test.ts` | T058 |
| `src/modules/registry.ts` (edit) | T060 |
| `app.json` (edit) | T061 |
| `package.json` + `pnpm-lock.yaml` (edit via `npx expo install`) | T002 |

**Total**: 65 tasks across 13 phases, covering all 49 enumerated files
plus 3 modified files plus the format/check/commit gates.
