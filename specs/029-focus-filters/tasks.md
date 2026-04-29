---
description: "Dependency-ordered task list for feature 029 — Focus Filter Intents (`focus-filters-lab`)"
---

# Tasks: Focus Filters Module (`focus-filters-lab`)

**Input**: Design documents from `/specs/029-focus-filters/`
**Prerequisites**: plan.md (required), spec.md (required); contracts/{filter-modes,focus-filters-bridge,manifest}.contract.ts and research.md / data-model.md / quickstart.md (Phase 0/1, may be authored alongside Phase 1 of tasks if not yet present — they are not blocking for the JS-pure tests since contract obligations are quoted inline below from spec.md / plan.md)

**Tests**: REQUIRED — every component, every screen variant, the manifest, the bridge, the `filter-modes` parser, the `useFocusFilter` hook, and every plugin sub-module has an explicit unit test (FR-FF-055, NFR-FF-008, Constitution Principle V). The Swift surface for 029 (two new files) is verified on-device per `quickstart.md` (Constitution V exemption mirroring 007 / 013 / 014 / 027 / 028).

**Organization**: Tasks are grouped by the plan's Phased file inventory. The plan defines no separate user-story phases — the single screen composes the same module across iOS-16+ / Android / Web / iOS-<16 fallbacks (US1, US2, US3 per spec), all delivered together as one shippable module. Task density and conventions mirror `specs/028-standby-mode/tasks.md` (T-numbering, [P] markers, exact file paths, RED→GREEN test pairing, dependencies).

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- All file paths are repository-relative under the worktree root `C:\Users\izkizk8\spot-029-focus`
- Test convention: tests live under `test/unit/modules/focus-filters-lab/`, `test/unit/native/`, and `test/unit/plugins/with-focus-filters/` (matches plan §"Phased file inventory" and 014/027/028's layout — NOT colocated)
- **No commits are produced by `/speckit.tasks`.** The "Checkpoint commit" tasks below are markers for the implementation phase; do not run `git commit` while generating this file.
- **TDD cadence**: every implementation task is preceded by a RED test task; "Checkpoint commit" tasks mark GREEN→REFACTOR boundaries. RED tests must fail with module-not-found / undefined-symbol errors before the matching implementation begins.

---

## Overview

Feature 029 adds an iOS 16+ Focus Filters showcase module. Three classes of artefact are produced:

1. **TypeScript surface** — one module (`src/modules/focus-filters-lab/`) with a manifest, three platform-suffixed screen variants, a hook, seven components, and a `filter-modes` catalog/parser. Plus a four-file JS bridge (`src/native/focus-filters.{ts,android.ts,web.ts,types.ts}`) that mirrors 013's `app-intents.*` shape.
2. **Swift surface** — two files under `native/ios/focus-filters/` (`ShowcaseModeFilter.swift`, `FocusFilterStorage.swift`) appended to the **main app target's** Sources build phase by 029's plugin (NOT a widget extension; NOT 013's app-intents target).
3. **Plugin** — `plugins/with-focus-filters/` (idempotent, commutative with 007/013/014/026/027/028; does NOT modify App Group entitlement; does NOT touch any prior plugin's outputs).

Plus 2 additive integration edits (`src/modules/registry.ts` +1 import +1 array entry; `app.json` plugins +1 entry).

**Deliverable counts** (this feature): **22 source files + 2 additive edits + 16 test files** — split into **66 numbered tasks** across **12 phases**.

**Test baseline delta target**: **≥ +16 new Jest suites** (matches plan §"Test baseline tracking"). Final delta substituted into the merge PR description per FR-FF-057 / FR-FF-059.

---

## Phase 1: Setup (Module + Plugin + Native + Test Scaffolding)

**Purpose**: Create the empty directory tree and the plugin package shell so subsequent file-creation tasks can run in parallel. No business logic.

- [ ] T001 [P] Create the module directory tree: `src/modules/focus-filters-lab/`, `src/modules/focus-filters-lab/components/`, and `src/modules/focus-filters-lab/hooks/`. Add `.gitkeep` if a directory ends up empty after the phase. **Acceptance**: All three directories exist and are tracked.
- [ ] T002 [P] Create the plugin directory `plugins/with-focus-filters/` with `package.json` containing `{ "name": "with-focus-filters", "version": "0.0.0", "main": "index.ts", "types": "index.ts" }` (mirror `plugins/with-standby-widget/package.json`). Plugin source files (`index.ts`, `add-swift-sources.ts`) are created in Phase 8. **Acceptance**: File parses as valid JSON; `main` points to `index.ts`; `dependencies` is absent or empty (NFR-FF-003).
- [ ] T003 [P] Create the Swift source directory `native/ios/focus-filters/` with a `.gitkeep`. Swift source files are created in Phase 9. **Acceptance**: Directory exists and is tracked.
- [ ] T004 [P] Create the test directory tree: `test/unit/modules/focus-filters-lab/`, `test/unit/modules/focus-filters-lab/components/`, `test/unit/modules/focus-filters-lab/hooks/`, `test/unit/plugins/with-focus-filters/`. Add `.gitkeep` if empty after this phase. **Acceptance**: All four directories exist and are tracked.
- [ ] T005 **Checkpoint commit**: `chore(029): scaffold focus-filters-lab module/plugin/test/native dirs`.

---

## Phase 2: Foundational — `filter-modes.ts` (Plan §"Phased file inventory" / Task seed T001 — FR-FF-007 / FR-FF-008 / FR-FF-024 / FR-FF-046 / R-C / R-E)

**Purpose**: Define `ShowcaseFilterMode`, `AccentColor`, `DRAFT_DEFAULTS`, `parseFilterPayload()`, and `ShowcaseFilterPersistedPayload` type. Every component, every screen variant, the bridge, and the hook depend on these symbols. The catalog is locally declared — does NOT import from 014's `Tint` enum (R-C).

**⚠️ CRITICAL**: Nothing in Phase 3+ may begin until this phase completes.

### Tests for filter-modes (write FIRST, ensure they FAIL — RED)

- [ ] T006 Write `test/unit/modules/focus-filters-lab/filter-modes.test.ts` covering every obligation in `contracts/filter-modes.contract.ts` (or, if not yet authored, the obligations called out in spec.md FR-FF-007/008/024/046 and plan.md R-C/R-E):
  1. `ShowcaseFilterMode` exposes the three values `'relaxed'`, `'focused'`, `'quiet'` (FR-FF-007).
  2. `AccentColor` catalog deep-equals `['blue', 'orange', 'green', 'purple']` in this order (FR-FF-022 (d) / R-C).
  3. `DRAFT_DEFAULTS` deep-equals `{ mode: 'relaxed', accentColor: 'blue' }` (FR-FF-024 / DECISION 11).
  4. Each accent slug has a human-readable label entry (`AccentColor` catalog exposes a `labelFor(slug)` or equivalent — FR-FF-022 (d)); unknown slug returns the slug itself or a stable fallback (no throw).
  5. `parseFilterPayload(undefined)`, `parseFilterPayload(null)`, `parseFilterPayload({})`, `parseFilterPayload('not an object')` all return `null` (FR-FF-046 / DECISION 12 — strict parse).
  6. `parseFilterPayload({ mode: 'relaxed', accentColor: 'blue', event: 'activated', updatedAt: '2026-05-07T12:34:56.000Z' })` returns the input verbatim as a typed `ShowcaseFilterPersistedPayload` (happy path; round-trip).
  7. `parseFilterPayload({ mode: 'unknown', accentColor: 'blue', event: 'activated', updatedAt: '2026-05-07T12:34:56.000Z' })` returns `null` (unknown mode is bridge-strict — UI-side defaulting is a separate layer per R-E).
  8. `parseFilterPayload({ mode: 'relaxed', accentColor: 'magenta', event: 'activated', updatedAt: '2026-05-07T12:34:56.000Z' })` returns `null` (unknown accentColor is bridge-strict).
  9. `parseFilterPayload({ mode: 'relaxed', accentColor: 'blue', event: 'activated' })` returns `null` (missing required `updatedAt`).
  10. `parseFilterPayload({ mode: 'relaxed', accentColor: 'blue', event: 'deactivated', updatedAt: '2026-05-07T12:34:56.000Z' })` round-trips (deactivated event preserved per FR-FF-014 / Edge Case "Retain payload, flip event").
  11. `parseFilterPayload({ mode: 'relaxed', accentColor: 'blue', event: 'bogus', updatedAt: '2026-05-07T12:34:56.000Z' })` returns `null` (unknown event).
  12. `parseFilterPayload({ ...validPayload, focusName: 'Work' })` round-trips with optional `focusName: 'Work'`; `parseFilterPayload({ ...validPayload, focusName: 42 })` returns `null` (typed parse — non-string focusName rejected).
  13. `parseFilterPayload(JSON.parse('"raw string"'))` returns `null` (defensive).
  14. The catalog values are not exported as mutable arrays — assert `Object.isFrozen(AccentColor)` or that mutating the exported array throws / has no effect (immutability for safety; common pattern across 014/027/028's catalogs).

  Each assertion MUST FAIL initially because `filter-modes.ts` does not yet exist. **Acceptance**: ≥14 distinct `it()` blocks; all fail with module-not-found / undefined-export errors. **Spec ref**: FR-FF-007, FR-FF-008, FR-FF-022, FR-FF-024, FR-FF-046, R-C, R-E, contract `filter-modes.contract.ts`.

### Implementation for filter-modes (GREEN)

- [ ] T007 Implement `src/modules/focus-filters-lab/filter-modes.ts` per `contracts/filter-modes.contract.ts`: export `ShowcaseFilterMode` type alias `'relaxed' | 'focused' | 'quiet'`, `AccentColor` frozen catalog (slugs + labels for `blue` / `orange` / `green` / `purple`, locally declared per R-C — do NOT import from `@/modules/widgets-lab/widget-config`), `DRAFT_DEFAULTS` const `{ mode: 'relaxed', accentColor: 'blue' }`, `ShowcaseFilterPersistedPayload` interface (`{ mode, accentColor, event: 'activated'|'deactivated', updatedAt: string, focusName?: string }`), and `parseFilterPayload(input: unknown): ShowcaseFilterPersistedPayload | null` strict parser. Make T006 pass. **Acceptance**: T006 green; `pnpm typecheck` clean; no ESLint errors. **Spec ref**: FR-FF-007, FR-FF-008, FR-FF-022, FR-FF-024, FR-FF-046, R-C, R-E.
- [ ] T008 **Checkpoint commit**: `feat(029): filter-modes module (ShowcaseFilterMode, AccentColor catalog, DRAFT_DEFAULTS, parseFilterPayload)`.

**Checkpoint**: `filter-modes` is green. Bridge (Phase 3), manifest (Phase 4), hook (Phase 5), components (Phase 6), and screens (Phase 7) may now begin.

---

## Phase 3: Bridge — `focus-filters.{ts,android.ts,web.ts,types.ts}` (Plan §Task seed T002 — FR-FF-015 / FR-FF-016 / FR-FF-017 / FR-FF-018 / FR-FF-046 / R-D)

**Purpose**: New JS bridge mirroring 013's `app-intents.*` layout. iOS 16+ delegates to the optional native module `'FocusFilters'`; Android / Web / iOS < 16 throw `FocusFiltersNotSupported` from `getCurrentFilterValues()` and return `false` from `isAvailable()`. Bridge parse failures resolve `null` and emit at most one `__DEV__` `console.warn` per distinct failure mode per session (R-D, dedup map capped at 64 entries — R6 mitigation). **No symbol collision** with 013's `app-intents.*` or 014/027/028's `widget-center.*` (FR-FF-018).

### Tests for the bridge (write FIRST, ensure they FAIL — RED)

- [ ] T009 Write `test/unit/native/focus-filters.test.ts` covering every obligation in `contracts/focus-filters-bridge.contract.ts`:
  1. **Web platform** (`jest.doMock('react-native', () => ({ Platform: { OS: 'web', Version: 0 }, AppState: ... }))`): (a) `isAvailable()` returns `false`; (b) `getCurrentFilterValues()` rejects with `FocusFiltersNotSupported`.
  2. **Android platform** (`Platform.OS === 'android'`): same 2 assertions as web.
  3. **iOS < 16** (mock `Platform.OS === 'ios'`, `Platform.Version === '15.6'`): (a) `isAvailable()` returns `false`; (b) `getCurrentFilterValues()` rejects with `FocusFiltersNotSupported`.
  4. **iOS 16+ with native module mocked**: (a) `isAvailable()` returns `true` when the optional native module resolves non-null AND iOS version ≥ 16 (mock `requireOptionalNativeModule('FocusFilters')` to return `{ getCurrentFilterValues: jest.fn() }`); (b) `getCurrentFilterValues()` calls through, parses the response via `parseFilterPayload`, and resolves the typed payload (assert deep-equal against a fixture). (c) When the native module returns `null` (no payload yet — empty App Group), `getCurrentFilterValues()` resolves `null` (FR-FF-046). (d) When the native module returns malformed JSON / a non-object, `getCurrentFilterValues()` resolves `null` AND emits exactly one `console.warn` in `__DEV__` (R-D).
  5. **Dedup-warn behaviour** (R-D / R6): calling `getCurrentFilterValues()` 50 times with the same malformed payload produces exactly **one** `console.warn` call (spy on `console.warn`); calling it with a *different* malformed payload class produces a second `console.warn` (deduplicated by error class + key). The dedup map is capped at 64 entries — invoke 100 distinct malformed shapes and assert the map size never exceeds 64.
  6. **Native module name** (R9): the bridge calls `requireOptionalNativeModule('FocusFilters')` with the literal string `'FocusFilters'` (NOT `'AppIntents'`, NOT `'WidgetCenter'`). Assert via spy on `requireOptionalNativeModule`.
  7. **Symbol non-collision with 013** (FR-FF-018): static-inspect `src/native/app-intents.ts` and assert it does NOT export the symbols `getCurrentFilterValues`, `FocusFiltersNotSupported`, or `isAvailable` (smoke check via `import * as appIntents` and `Object.keys`). Static-inspect `src/native/widget-center.ts` and assert the same.
  8. **Symbol non-collision with 014/027/028** (FR-FF-018): `import * as widgetCenter from '@/native/widget-center'` and assert no member named `getCurrentFilterValues` or `FocusFiltersNotSupported`.
  9. **`FocusFiltersNotSupported` error class**: is an instance of `Error`; has `name === 'FocusFiltersNotSupported'`; the constructor accepts an optional message string and assigns it to `.message`.
  10. **iOS 16+ with native module absent** (`requireOptionalNativeModule('FocusFilters')` returns `null`): `isAvailable()` returns `false`; `getCurrentFilterValues()` rejects with `FocusFiltersNotSupported` (gracefully degraded — module not linked).
  11. **013 / 014 / 027 / 028 regression**: existing `app-intents.ts` `submit`, `getLastMoodEntry`, `isAvailable` symbols still resolve, and `widget-center.ts` `getCurrentConfig`, `setConfig`, `reloadAllTimelines`, `reloadTimelinesByKind`, `getLockConfig`, `setLockConfig`, `getStandByConfig`, `setStandByConfig` symbols still resolve correctly under the new mock setup.

  Use `jest.mock('expo-modules-core')` to drive `requireOptionalNativeModule` and `jest.doMock('react-native', …)` to swap `Platform.OS` / `Platform.Version` (mirror 013's `app-intents.test.ts` and 028's `widget-center-standby.test.ts` patterns). Each assertion MUST FAIL because the bridge does not yet exist. **Acceptance**: ≥14 distinct `it()` blocks; all fail with `Cannot find module '@/native/focus-filters'` or equivalent. **Spec ref**: FR-FF-015, FR-FF-016, FR-FF-017, FR-FF-018, FR-FF-046, R-D, R6, R9, contract `focus-filters-bridge.contract.ts`.

### Implementation for the bridge (GREEN)

- [ ] T010 Implement `src/native/focus-filters.types.ts`. Declares `FocusFiltersBridge` interface (`isAvailable(): boolean`, `getCurrentFilterValues(): Promise<ShowcaseFilterPersistedPayload | null>`), `FocusFiltersNotSupported` error class extending `Error`, and re-exports `ShowcaseFilterPersistedPayload` from `@/modules/focus-filters-lab/filter-modes` (depends on T007). No new error classes beyond `FocusFiltersNotSupported` (R-B mirror — single error class). **Acceptance**: `pnpm typecheck` clean. **Spec ref**: FR-FF-018.
- [ ] T011 [P] Implement `src/native/focus-filters.ts` (iOS 16+ impl). Uses `requireOptionalNativeModule('FocusFilters')` (literal name per R9), gates on `Platform.OS === 'ios'` && `parseInt(Platform.Version, 10) >= 16` && module-non-null. `isAvailable()` returns the boolean conjunction. `getCurrentFilterValues()` (a) throws `FocusFiltersNotSupported` if the gate fails; (b) calls native `getCurrentFilterValues()`, runs the result through `parseFilterPayload`; (c) returns `null` if parse returns `null` AND emits dedup-warn per R-D (module-scope `Map<string, true>` keyed by `name + ':' + safeStringifyShape(input)`, evict-oldest at 64 entries). Make T009 iOS-16+ cases (4a–4d, 5, 6, 10) pass. **Spec ref**: FR-FF-015, FR-FF-046, R-D.
- [ ] T012 [P] Implement `src/native/focus-filters.android.ts`. `isAvailable()` returns `false`. `getCurrentFilterValues()` rejects with `new FocusFiltersNotSupported('Focus Filters require iOS 16+')` (mirror 014's android stub style). Make T009 android cases (2a–2b) pass. **Spec ref**: FR-FF-016.
- [ ] T013 [P] Implement `src/native/focus-filters.web.ts`. Identical to android stub. Make T009 web cases (1a–1b) pass. **Spec ref**: FR-FF-016.
- [ ] T014 Re-run 013's bridge test (`test/unit/native/app-intents.test.ts`) and 014/027/028's bridge tests (`test/unit/native/widget-center*.test.ts`) and any tests that mock those bridges. If any test fails because its mock factory / global setup leaked into 029's surface, restore isolation. Document touched files in the commit message. **Acceptance**: 013's, 014's, 027's, 028's bridge + screen suites green (FR-FF-018 non-regression).
- [ ] T015 **Checkpoint commit**: `feat(029): focus-filters bridge (iOS 16+ impl + RN/Web/Android reject; dedup-warn parse failure; no 013/014 symbol collision)`.

**Checkpoint**: Bridge surface is green on all 4 platform variants. Phase 4+ may now use the bridge symbols.

---

## Phase 4: Manifest + Registry Hook-Up (Plan §Task seed T003 / T009 — FR-FF-001 / FR-FF-002 / FR-FF-003 / FR-FF-019, AC-FF-001)

**Purpose**: Register the module so the Modules grid renders a "Focus Filters" tile.

### Tests for the manifest (write FIRST, ensure they FAIL — RED)

- [ ] T016 Write `test/unit/modules/focus-filters-lab/manifest.test.ts` covering every obligation in `contracts/manifest.contract.ts`:
  1. `manifest.id === 'focus-filters-lab'`.
  2. `manifest.title === 'Focus Filters'`.
  3. `manifest.platforms` deep-equals `['ios', 'android', 'web']`.
  4. `manifest.minIOS === '16.0'` (FR-FF-001).
  5. `typeof manifest.render === 'function'`.
  6. `manifest.icon.ios` is a non-empty string (SF Symbol name).
  7. `manifest.icon.fallback` is a non-empty single-character emoji.
  8. `manifest.description` is a non-empty string and matches `/focus|iOS\s*16/i` (mentions "Focus" or "iOS 16"; FR-FF-002).

  Each assertion MUST FAIL because `src/modules/focus-filters-lab/index.tsx` does not yet exist. **Acceptance**: 8 `it()` blocks; all fail. **Spec ref**: FR-FF-001, FR-FF-002, contract `manifest.contract.ts`.

### Implementation for the manifest (GREEN)

- [ ] T017 Implement `src/modules/focus-filters-lab/index.tsx` exporting a default `ModuleManifest` with `id: 'focus-filters-lab'`, `title: 'Focus Filters'`, `platforms: ['ios', 'android', 'web']`, `minIOS: '16.0'`, `description` (one-sentence summary mentioning Focus + iOS 16), `icon: { ios: <SF Symbol>, fallback: <emoji> }`, and `render: () => <Screen />` where `<Screen />` is imported from `./screen` (the platform-suffix resolver picks up `.tsx` / `.android.tsx` / `.web.tsx` automatically). Make T016 pass. **Acceptance**: T016 green. **Spec ref**: FR-FF-001, FR-FF-002, FR-FF-003.
- [ ] T018 Append the manifest to `src/modules/registry.ts`: add ONE import line `import focusFiltersLab from './focus-filters-lab';` after the `standbyLab` import (028's last addition) AND ONE entry `focusFiltersLab` to the `MODULES` array immediately after `standbyLab`. Diff MUST be exactly +2 lines. No other entry may be modified or reordered. **Acceptance**: `MODULES.find(m => m.id === 'focus-filters-lab')` is defined; `MODULES.length` is the prior length + 1. **Spec ref**: FR-FF-002, AC-FF-001.
- [ ] T019 If `test/unit/modules/registry.test.ts` asserts a fixed `MODULES.length`, update the constant to the new length. Otherwise (it asserts `> 0` / uniqueness only) leave it unchanged. Re-run the registry test suite; assert duplicate-id check passes (no other manifest has `id === 'focus-filters-lab'`). **Acceptance**: registry test green. **Spec ref**: AC-FF-001.
- [ ] T020 **Checkpoint commit**: `feat(029): focus-filters-lab manifest + registry +1`.

---

## Phase 5: Hook — `useFocusFilter` (Plan §Task seed T004 — FR-FF-013 / FR-FF-014 / FR-FF-029 / FR-FF-031 / FR-FF-033 / FR-FF-046, NFR-FF-002, R10)

**Purpose**: Hook returning `{ values, refresh, eventLog, simulateActivation }`. Refetches on mount and on `AppState` `'active'`. Tolerates `FocusFiltersNotSupported` (resolves `values` to `null`, never propagates to UI). `simulateActivation(values)` prepends a `simulated` event log entry; debounced ~300 ms while pretend toggle is ON (R10). Event log is a 10-cap ring buffer (FR-FF-033). The screen owns mounting; the hook owns lifecycle.

### Tests for the hook (write FIRST, ensure they FAIL — RED)

- [ ] T021 Write `test/unit/modules/focus-filters-lab/hooks/useFocusFilter.test.tsx` covering:
  1. **Mount fetch**: on first render the hook calls `bridge.getCurrentFilterValues()` exactly once and exposes the resolved value via `values` (assert via mocked bridge + `act` + `waitFor`).
  2. **AppState refetch**: simulating `AppState` change to `'active'` triggers another `getCurrentFilterValues()` call within one render pass (mock `AppState.addEventListener`; flush; assert call count incremented).
  3. **AppState non-`'active'` is a no-op**: changing to `'background'` or `'inactive'` does NOT call the bridge (assert call count unchanged).
  4. **Tolerates `FocusFiltersNotSupported`**: when the bridge rejects with `FocusFiltersNotSupported`, the hook resolves `values` to `null` and does NOT propagate — the test environment's unhandled-rejection hook is silent.
  5. **`refresh()` is callable**: invoking the returned `refresh()` triggers an additional `getCurrentFilterValues()` call.
  6. **`simulateActivation(values)` prepends a `simulated` entry**: after one call, `eventLog[0]` deep-equals `{ kind: 'simulated', values, at: <ISO> }` (FR-FF-031 / FR-FF-034).
  7. **Event log ring buffer caps at 10** (FR-FF-033): after 11 `simulateActivation` calls, `eventLog.length === 10` and the oldest entry is dropped (FIFO).
  8. **Debounce ~300 ms**: 5 rapid `simulateActivation` calls within 100 ms produce **one** prepended entry after debounce flush, NOT five (R10 / FR-FF-031). Use `jest.useFakeTimers()`; advance 300 ms; assert single prepend.
  9. **Unmount cleanup**: unmounting removes the `AppState` listener (assert `AppState.removeEventListener` called or subscription `.remove()` called).
  10. **Bridge errors other than `FocusFiltersNotSupported` resolve to `null` AND log once**: e.g. a generic `Error('boom')` rejection — `values` becomes `null` and `console.warn` (or equivalent debug log) is called once (defensive UI policy — never throw to the screen).

  Use `jest.mock('@/native/focus-filters')` to drive the bridge. MUST FAIL. **Acceptance**: ≥10 `it()` blocks; all fail. **Spec ref**: FR-FF-013, FR-FF-014, FR-FF-029, FR-FF-031, FR-FF-033, FR-FF-046, NFR-FF-002, R10.

### Implementation for the hook (GREEN)

- [ ] T022 Implement `src/modules/focus-filters-lab/hooks/useFocusFilter.ts`. Uses `useState` for `values: ShowcaseFilterPersistedPayload | null`, `useState` for `eventLog: ReadonlyArray<EventLogEntry>` (capped at 10 via prepend-and-slice), `useRef` for the debounce timer, `useEffect` for mount fetch + `AppState.addEventListener('change', ...)`. `simulateActivation` is wrapped in a 300 ms debounce (use a small inline `useDebouncedCallback` helper or `setTimeout` + ref-cleared). Bridge errors other than `FocusFiltersNotSupported` swallowed with one `console.warn` and `values` set to `null`. Make T021 pass. **Acceptance**: T021 green; `pnpm typecheck` clean. **Spec ref**: FR-FF-013, FR-FF-014, FR-FF-029, FR-FF-031, FR-FF-033, FR-FF-046, NFR-FF-002.
- [ ] T023 **Checkpoint commit**: `feat(029): useFocusFilter hook (mount + AppState refetch, debounced simulateActivation, 10-cap ring buffer, FocusFiltersNotSupported tolerance)`.

---

## Phase 6: Components (Plan §Task seed T005 — FR-FF-022 / FR-FF-023 / FR-FF-025 / FR-FF-026 / FR-FF-027 / FR-FF-028 / FR-FF-029 / FR-FF-030 / FR-FF-031 / FR-FF-032 / FR-FF-033 / FR-FF-034 / FR-FF-036 / FR-FF-037 / FR-FF-038 / FR-FF-052)

**Purpose**: Build the seven reusable components. Each has a paired test file. Tests are written first (RED).

### Tests for components (write FIRST, ensure they FAIL — all [P], independent files)

- [ ] T024 [P] Write `test/unit/modules/focus-filters-lab/components/ExplainerCard.test.tsx`: (a) renders a heading + body prose; (b) body text mentions "Focus Filters" (case-insensitive) AND "Settings" AND each of the two parameter names (`mode` / `accent` or equivalent human labels) (FR-FF-037); (c) body distinguishes the **simulated** path from the **real** path explicitly (matches `/simulat(e|ed)/i` AND `/real|actual|system/i`); (d) renders identically on every platform (no `Platform.OS` branch); (e) accepts an optional `style` prop. MUST FAIL. **Spec ref**: FR-FF-037.
- [ ] T025 [P] Write `test/unit/modules/focus-filters-lab/components/FilterDefinitionCard.test.tsx`: (a) renders the filter display name `'Showcase Mode'` (FR-FF-022 (a)); (b) renders a one-line description (FR-FF-022 (b)); (c) renders exactly **3 mode segments** with labels `'Relaxed'` / `'Focused'` / `'Quiet'` in this order (FR-FF-022 (c)); (d) the segment matching `mode` prop has `accessibilityState.selected === true`; (e) tapping a non-selected segment fires `onChangeMode` once with the corresponding `ShowcaseFilterMode` value; (f) renders exactly **4 accent swatches** with the slugs `'blue'`, `'orange'`, `'green'`, `'purple'` in this order with human-readable labels (FR-FF-022 (d)); (g) tapping a non-selected swatch fires `onChangeAccent` once with the slug; (h) tapping the already-selected segment / swatch is a no-op (no callback fired); (i) **bridge isolation** — neither callback ever calls `bridge.getCurrentFilterValues` or any native module method (assert via spy on `@/native/focus-filters` mock — call count is 0) (FR-FF-023); (j) accessibility labels per FR-FF-051 / FR-FF-053 — every segment and swatch has a non-empty `accessibilityLabel`. MUST FAIL. **Spec ref**: FR-FF-022, FR-FF-023, FR-FF-051, FR-FF-053.
- [ ] T026 [P] Write `test/unit/modules/focus-filters-lab/components/CurrentStateCard.test.tsx`: (a) given `payload: null`, renders an empty-state line ("No active filter" or equivalent) (FR-FF-028); (b) given a full payload, renders the mode label, the accent swatch (visible color marker), the event badge (`activated` / `deactivated`), the `updatedAt` (formatted), and the optional `focusName` when present (FR-FF-026); (c) when `focusName` is omitted, the `focusName` row is not rendered; (d) the card is **iOS-16+-only** — exposes a marker (testID or default-export display name) the screen can use to gate visibility, BUT the component itself does NOT branch on `Platform.OS` (visibility is owned by the screen variant) (FR-FF-025); (e) `event === 'deactivated'` is visually distinguished from `'activated'` (different badge color / text) (FR-FF-014 / Edge Case "Retain payload, flip event"). MUST FAIL. **Spec ref**: FR-FF-014, FR-FF-025, FR-FF-026, FR-FF-027, FR-FF-028.
- [ ] T027 [P] Write `test/unit/modules/focus-filters-lab/components/PretendFilterToggle.test.tsx`: (a) renders a switch / toggle, a status pill, and a "demo body" container; (b) toggle initial state is OFF; toggling ON sets the status pill to "Active" (or equivalent); (c) toggling ON calls `onActivate(values)` exactly once with the current draft values (FR-FF-031); (d) toggling OFF does NOT call `onActivate` and sets the pill to "Inactive"; (e) **precedence over persisted** (FR-FF-029): when the toggle is ON, the demo body re-tints / re-renders using the **draft** values regardless of any `persistedPayload` prop passed in; when OFF, the demo body uses `persistedPayload` if present else `DRAFT_DEFAULTS` (R-E layered fallback); (f) draft changes (mode / accent prop changes) while toggle is ON propagate to the demo body within one render pass (NFR-FF-001) AND each change re-fires `onActivate` (debouncing is the hook's responsibility, not this component's — assert raw fire on every prop change while ON); (g) demo body has `accessibilityLabel` describing the active mode + accent (FR-FF-051). MUST FAIL. **Spec ref**: FR-FF-029, FR-FF-030, FR-FF-031, FR-FF-032, FR-FF-051, NFR-FF-001.
- [ ] T028 [P] Write `test/unit/modules/focus-filters-lab/components/SetupInstructions.test.tsx`: (a) renders an ordered/numbered list with **≥7 steps** (FR-FF-038); (b) the steps mention `Settings`, `Focus`, `Add Filter`, `spot` (case-insensitive — search for `/spot/i`), and `Showcase Mode` (case-insensitive — search for `/showcase\s*mode/i`); (c) the card has a heading like "Set up the filter"; (d) accepts an optional `style` prop. MUST FAIL. **Spec ref**: FR-FF-036, FR-FF-038.
- [ ] T029 [P] Write `test/unit/modules/focus-filters-lab/components/EventLog.test.tsx`: (a) renders an empty-state line ("No events yet" or equivalent) when given `entries: []`; (b) when given `entries: [...]` renders one row per entry with timestamp, kind badge, and values summary; (c) the component does NOT itself enforce the 10-cap (the hook does — FR-FF-033); supply `entries.length === 10` and assert all 10 render; (d) `kind: 'simulated'` entries render a visually distinct badge from `kind: 'activated'` / `kind: 'deactivated'` (FR-FF-034 / US2 AS5) — assert via distinct testIDs / `accessibilityLabel` text; (e) the most recent entry appears **first** (FR-FF-033, ring-buffer prepend semantics — the component renders in order received); (f) optional `focusName` is rendered when present in an entry's `values` (FR-FF-014). MUST FAIL. **Spec ref**: FR-FF-033, FR-FF-034.
- [ ] T030 [P] Write `test/unit/modules/focus-filters-lab/components/IOSOnlyBanner.test.tsx`: (a) renders the literal user-facing string `'Focus Filters require iOS 16+'` (FR-FF-052); (b) sets `accessibilityRole: 'alert'` so screen readers announce on mount (NFR-FF-008); (c) is purely presentational (no platform branching inside — visibility is owned by the screen variant); (d) accepts an optional `style` prop. MUST FAIL. **Spec ref**: FR-FF-021, FR-FF-052, NFR-FF-008.

### Implementation for components (each [P], independent files — GREEN)

- [ ] T031 [P] Implement `src/modules/focus-filters-lab/components/ExplainerCard.tsx`. Pure presentational; uses `ThemedView` / `ThemedText` and the `Spacing` scale (Constitution II / IV); `StyleSheet.create()` only. Body text mentions Focus Filters + Settings + the two parameter names + simulated vs. real distinction. Make T024 pass. **Spec ref**: FR-FF-037.
- [ ] T032 [P] Implement `src/modules/focus-filters-lab/components/FilterDefinitionCard.tsx`. Three-segment mode picker (`Pressable` per segment, `accessibilityState.selected`, `surfaceElevated` for selected) + four-swatch accent picker (square `Pressable` with the slug's hex from `filter-modes.ts`'s catalog and a thin border for selected). Updates DRAFT only — never calls bridge (FR-FF-023). `StyleSheet.create()` only. Make T025 pass. **Spec ref**: FR-FF-022, FR-FF-023.
- [ ] T033 [P] Implement `src/modules/focus-filters-lab/components/CurrentStateCard.tsx`. Renders mode label, accent swatch marker, event badge (`activated` / `deactivated` distinguished by color + label), `updatedAt` formatted via `Intl.DateTimeFormat` or `toLocaleString()`, and conditional `focusName` row. Empty-state when payload is `null` (FR-FF-028). `StyleSheet.create()` only. Make T026 pass. **Spec ref**: FR-FF-014, FR-FF-026, FR-FF-027, FR-FF-028.
- [ ] T034 [P] Implement `src/modules/focus-filters-lab/components/PretendFilterToggle.tsx`. Owns the toggle state internally (uncontrolled boolean) but accepts `draft: { mode, accentColor }` and optional `persistedPayload` props for the layered fallback (R-E). Calls `onActivate(draft)` on toggle ON and on every draft change while ON (raw — debouncing is the hook's job per R10). Status pill string + demo body container that re-tints based on the active values (toggle ON ? draft : (persistedPayload ?? DRAFT_DEFAULTS)). `StyleSheet.create()` only. Make T027 pass. **Spec ref**: FR-FF-029, FR-FF-030, FR-FF-031, FR-FF-032, R-E.
- [ ] T035 [P] Implement `src/modules/focus-filters-lab/components/SetupInstructions.tsx`. Numbered list with ≥7 steps (Settings → Focus → Add Filter → search "spot" → pick "Showcase Mode" → choose mode + accent → tap Done) per `quickstart.md`. Mentions "spot" + "Showcase Mode" verbatim. Accepts optional `style` prop. Make T028 pass. **Spec ref**: FR-FF-036, FR-FF-038.
- [ ] T036 [P] Implement `src/modules/focus-filters-lab/components/EventLog.tsx`. Pure presentational — accepts `entries: ReadonlyArray<EventLogEntry>`, renders empty state when length is zero, renders rows in given order (most-recent-first ordering is the hook's contract), distinguishes `simulated` vs. `activated` vs. `deactivated` via badge styling. Does NOT enforce the cap (FR-FF-033). Make T029 pass. **Spec ref**: FR-FF-033, FR-FF-034.
- [ ] T037 [P] Implement `src/modules/focus-filters-lab/components/IOSOnlyBanner.tsx`. Pure presentational; renders the exact string `'Focus Filters require iOS 16+'`; sets `accessibilityRole: 'alert'`. Accepts `style` prop. Make T030 pass. **Spec ref**: FR-FF-052, NFR-FF-008.
- [ ] T038 **Checkpoint commit**: `feat(029): focus-filters-lab components (ExplainerCard, FilterDefinitionCard, CurrentStateCard, PretendFilterToggle, SetupInstructions, EventLog, IOSOnlyBanner)`.

---

## Phase 7: Screens (Plan §Task seed T006 — FR-FF-020 / FR-FF-021 / FR-FF-024 / FR-FF-025 / FR-FF-029 / FR-FF-046)

**Purpose**: Three platform-suffixed screen variants. iOS 16+ wires the full six-panel flow (FR-FF-020); Android / Web / iOS < 16 ship the four-panel fallback (FR-FF-021). Each variant has a paired test file. Drafts reset to `DRAFT_DEFAULTS` on every mount (FR-FF-024 / DECISION 14).

### Tests for screens (write FIRST, ensure they FAIL — all [P], independent files — RED)

- [ ] T039 [P] Write `test/unit/modules/focus-filters-lab/screen.test.tsx` (iOS 16+ variant): (a) layout order matches FR-FF-020 exactly: explainer → filter definition → current state → in-app demo (status pill + demo body + pretend toggle) → setup instructions → event log; (b) drafts initialise to `DRAFT_DEFAULTS` on mount (NOT restored from prior mount — FR-FF-024); (c) the hook is invoked: assert `useFocusFilter` is called and its `values` propagates into `CurrentStateCard`; (d) toggling pretend filter ON calls the hook's `simulateActivation(draft)` and prepends a `simulated` entry to the event log within the debounce window (FR-FF-031); (e) on `AppState 'active'`, the `CurrentStateCard` re-renders with the new payload from the hook (within 500 ms NFR-FF-002 — assert the bridge call count is incremented and the rendered `updatedAt` matches the new payload); (f) when `Platform.Version === '15.6'` (iOS < 16), the screen renders the **fallback layout** (FR-FF-021 / FR-FF-046): banner + explainer + filter def + demo + log, with current state and setup instructions hidden; (g) the screen tolerates `getCurrentFilterValues` rejecting with `FocusFiltersNotSupported` — `CurrentStateCard` renders the empty state, no error surface (FR-FF-046); (h) **isolation from 013/014/027/028 paths**: the screen's mount and any user interaction do NOT call any of `appIntents.submit`, `appIntents.getLastMoodEntry`, `widgetCenter.setConfig`, `widgetCenter.setLockConfig`, `widgetCenter.setStandByConfig`, `widgetCenter.reloadAllTimelines`, `widgetCenter.reloadTimelinesByKind` (assert via spies on those mocks — call count is 0 for each); (i) unmount → remount: drafts re-initialise to `DRAFT_DEFAULTS` (assert via remount fixture — FR-FF-024). Mock the bridge per T009 and the hook per T021. MUST FAIL. **Spec ref**: FR-FF-018, FR-FF-020, FR-FF-024, FR-FF-029, FR-FF-031, FR-FF-046, NFR-FF-002.
- [ ] T040 [P] Write `test/unit/modules/focus-filters-lab/screen.android.test.tsx`: (a) banner is visible at the top with the literal string `'Focus Filters require iOS 16+'` (FR-FF-052); (b) layout order matches FR-FF-021: banner → explainer → filter definition → in-app demo → event log; (c) **current state panel is NOT rendered** (search for `CurrentStateCard` testID — none) (FR-FF-021); (d) **setup instructions are NOT rendered** (FR-FF-021); (e) filter definition card is interactive (mode + accent editable) and updates the draft; (f) pretend toggle works identically to iOS — flipping ON prepends a `simulated` event log entry (US3 cross-platform parity / SC-006); (g) the bridge is NOT called — `getCurrentFilterValues()` rejects on android, the hook tolerates it, the screen never reads `values` (FR-FF-016 / FR-FF-046); (h) tapping the toggle ON multiple times during edits respects the 300 ms debounce (one log entry per debounced flush — defers to hook). MUST FAIL. **Spec ref**: FR-FF-016, FR-FF-021, FR-FF-046, FR-FF-052, SC-006.
- [ ] T041 [P] Write `test/unit/modules/focus-filters-lab/screen.web.test.tsx`: identical assertion set to T040 with `Platform.OS === 'web'` mocked. MUST FAIL. **Spec ref**: FR-FF-016, FR-FF-021, FR-FF-046, FR-FF-052, SC-006.

### Implementation for screens (GREEN)

- [ ] T042 Implement `src/modules/focus-filters-lab/screen.tsx` (iOS 16+ variant). Owns: draft `{ mode, accentColor }` state initialised to `DRAFT_DEFAULTS` on every mount (FR-FF-024 — no AsyncStorage shadow per DECISION 10); calls `useFocusFilter()` for the `values` / `eventLog` / `simulateActivation` / `refresh` quartet; renders the six panels in FR-FF-020 order. iOS-version branch: if `parseInt(Platform.Version, 10) < 16`, render the fallback layout (banner + explainer + filter def + demo + log) — same fallback as android/web (FR-FF-021 / FR-FF-046). Uses `ThemedView` / `ThemedText` / `Spacing` (Constitution II / IV); `StyleSheet.create()` only. Make T039 pass. **Spec ref**: FR-FF-020, FR-FF-021, FR-FF-024, FR-FF-029, FR-FF-031, FR-FF-046.
- [ ] T043 [P] Implement `src/modules/focus-filters-lab/screen.android.tsx`. Renders the FR-FF-021 fallback layout: banner → explainer → filter definition (interactive — updates draft) → in-app demo (PretendFilterToggle) → event log. Uses the hook (which gracefully resolves `values` to `null` on android — FR-FF-046). Make T040 pass. **Spec ref**: FR-FF-016, FR-FF-021, FR-FF-046, FR-FF-052, SC-006.
- [ ] T044 [P] Implement `src/modules/focus-filters-lab/screen.web.tsx`. Identical to `screen.android.tsx`. Make T041 pass. **Spec ref**: FR-FF-016, FR-FF-021, FR-FF-046, FR-FF-052, SC-006.
- [ ] T045 **Checkpoint commit**: `feat(029): focus-filters-lab screen.{tsx,android.tsx,web.tsx} (US1+US2+US3 flow, draft reset on mount, AppState refetch)`.

**Checkpoint**: All JS user-facing surfaces are green. Plugin (Phase 8) and Swift sources (Phase 9) are unblocked.

---

## Phase 8: Config Plugin — `with-focus-filters` (Plan §Task seed T007 — FR-FF-040 / FR-FF-041 / FR-FF-042 / FR-FF-044, AC-FF-005 / AC-FF-006, R-A, R1, R2)

**Purpose**: New idempotent Expo config plugin that appends the two Focus-Filter Swift sources to the **main app target's** `Sources` build phase (NOT a widget extension target; NOT 013's app-intents target). Pure additive — does NOT modify the App Group entitlement, does NOT touch any prior plugin's outputs, and is commutative with all of 007/013/014/026/027/028's plugins (R-A / FR-FF-041 / NFR-FF-004).

### Tests for the plugin (write FIRST, ensure they FAIL — all [P], independent files — RED)

- [ ] T046 [P] Write `test/unit/plugins/with-focus-filters/add-swift-sources.test.ts` covering the source-append contract (mirrors 014's / 027's / 028's `add-swift-sources.test.ts` and 013's `with-app-intents` plugin test):
  1. **Adds 2 Swift files to the main app target's `pbxSourcesBuildPhaseObj.files`**: `ShowcaseModeFilter.swift`, `FocusFilterStorage.swift` (assert by basename presence).
  2. **Idempotency** (FR-FF-041 / R2): running the function twice does not produce duplicate file refs (assert basename count is exactly 1 each). Asserts byte-identical pbxproj region on the second run.
  3. **Target resolution** (R-A): the function locates the main app target by matching `Info.plist`'s `CFBundleIdentifier` against the app's bundle id from `app.json` (NOT by hard-coded target name). Synthesise two project mocks where the main target is named `Spot` and `SpotApp` respectively; assert both succeed.
  4. **Files originate from `native/ios/focus-filters/`** — assert the source-path components include `focus-filters/`.
  5. **Does NOT add sources to the widget extension target** (FR-FF-040): assert the `LiveActivityDemoWidget` target's `pbxSourcesBuildPhaseObj.files` is unchanged before vs. after the function runs (014/027/028 non-regression).
  6. **Does NOT add sources to 013's app-intents-related target structures** — if 013 added sources to a separate target group, that group's source list is unchanged (FR-FF-040 / DECISION 1).
  7. **Does NOT modify the App Group entitlement** (FR-FF-042 / R1): the `*.entitlements` file's `com.apple.security.application-groups` array is byte-identical before vs. after.
  8. **No new extension target is created** (R1): the count of `PBXNativeTarget`s with `productType === 'com.apple.product-type.app-extension'` is unchanged.
  9. **013 / 014 / 027 / 028 source non-regression**: 013's `IntentsBundle.swift` (or equivalent), 014's `ShowcaseWidget.swift`, 027's `LockScreenAccessoryWidget.swift`, and 028's `StandByWidget.swift` are still present in their respective targets after the function runs.
  10. **Fail-loud when main app target is missing** (FR-FF-044): synthesise a project with no app-target match; assert the function throws an `Error` whose message contains `with-focus-filters` and `main app target`.

  Use a synthetic in-memory `XcodeProject` mock (mirror 028's `add-swift-sources.test.ts`). MUST FAIL. **Acceptance**: ≥10 `it()` blocks; all fail. **Spec ref**: FR-FF-040, FR-FF-041, FR-FF-042, FR-FF-044, R-A, R1, R2.
- [ ] T047 [P] Write `test/unit/plugins/with-focus-filters/index.test.ts` covering the full plugin pipeline (FR-FF-041 / NFR-FF-004 / AC-FF-005 / AC-FF-006 — idempotency + commutativity):
  1. **Pipeline composition**: the default export `withFocusFilters` is a `ConfigPlugin<void>` that wraps `add-swift-sources` (only one sub-plugin in 029) without touching entitlements, App Groups, Info.plist, or any plugin order.
  2. **Idempotency** (FR-FF-041 / AC-FF-005): folding `withFocusFilters` twice over a baseline `ExpoConfig` produces a deep-equal config the second time (and a deep-equal Xcode project after both runs of `expo prebuild`).
  3. **Commutativity with 013** (R-A / AC-FF-006): folding `withAppIntents → withFocusFilters` over a baseline produces structurally equal output to folding `withFocusFilters → withAppIntents` (assert by sorted main-app-target Swift basename set + 013's `SpotAppShortcuts.swift` byte-identical).
  4. **Commutativity with 014**: folding `withHomeWidgets → withFocusFilters` ↔ `withFocusFilters → withHomeWidgets` produces structurally equal output (014's widget extension Swift sources untouched in both orderings).
  5. **Commutativity with 026** (rich-notifications): folding `withRichNotifications → withFocusFilters` ↔ reverse produces structurally equal output.
  6. **Commutativity with 027**: folding `withLockWidgets → withFocusFilters` ↔ reverse produces structurally equal output.
  7. **Commutativity with 028**: folding `withStandByWidget → withFocusFilters` ↔ reverse produces structurally equal output.
  8. **Six-way commutativity (sampled per plan §Task seed T007 (e))** — sample at least **3 non-trivial permutations** of the 6! orderings of `[withLiveActivity, withAppIntents, withHomeWidgets, withRichNotifications, withLockWidgets, withStandByWidget, withFocusFilters]`; assert all sampled permutations produce the **same final main-app-target Swift basename set** and the **same widget-extension Swift basename set** (FR-FF-041 / NFR-FF-004). Recommended sampled triples: (a) all-in-spec-order (007→013→014→026→027→028→029); (b) all-reverse (029→028→…→007); (c) interleaved (014→029→013→027→028→026→007).
  9. **App Group entitlement non-regression** (FR-FF-042 / R1): in every permutation tested above, the final `*.entitlements` `com.apple.security.application-groups` array deep-equals the post-014 baseline (014 owns the App Group; 029 must not touch it).
  10. **Fail-loud propagation**: if `add-swift-sources` throws (main target missing — case 10 of T046), `withFocusFilters` propagates the throw with the original message (FR-FF-044).
  11. **No console warnings** on a baseline config (spy on `console.warn`; assert call count is 0).
  12. **Zero new dependencies** declared by the plugin's `package.json` (NFR-FF-003): assert `Object.keys(require('plugins/with-focus-filters/package.json').dependencies ?? {}).length === 0`.

  MUST FAIL. **Acceptance**: ≥12 `it()` blocks; all fail. **Spec ref**: FR-FF-040, FR-FF-041, FR-FF-042, FR-FF-044, NFR-FF-003, NFR-FF-004, AC-FF-005, AC-FF-006, R-A.

### Implementation for the plugin (GREEN)

- [ ] T048 Implement `plugins/with-focus-filters/add-swift-sources.ts`. Uses `withXcodeProject` to add the 2 source-file refs to the main app target's `pbxSourcesBuildPhaseObj`. Target lookup per R-A: iterate `xcodeProject.pbxNativeTargetSection()`, match the `Info.plist`'s `CFBundleIdentifier` (read via `xcodeProject.pbxBuildConfigurationSection()`) against the app's bundle id from `app.json`'s `expo.ios.bundleIdentifier`. Idempotency check by basename (`pbxSourcesBuildPhaseObj.files.some(f => f.basename === '<name>.swift')`). Throws fail-loud `Error` with message containing `with-focus-filters` + `main app target` if the target is missing (FR-FF-044). Mirror 013's `with-app-intents/add-swift-sources.ts` structurally. Make T046 pass. **Spec ref**: FR-FF-040, FR-FF-042, FR-FF-044, R-A, R1.
- [ ] T049 Implement `plugins/with-focus-filters/index.ts`: default export `withFocusFilters: ConfigPlugin<void> = (config) => withAddSwiftSources(config)` (single composition, mirroring 029's simpler shape vs. 028's two-step). Make T047 pass. **Spec ref**: FR-FF-041.
- [ ] T050 Append `'./plugins/with-focus-filters'` to the `plugins` array in `app.json` (AC-FF-002). Insertion position: immediately after `'./plugins/with-standby-widget'` (the last 028-added plugin). Diff MUST be exactly +1 array entry. No other plugin entry may be modified or reordered. **Acceptance**: T047 case 12 verifies; manual `app.json` diff shows +1 line. **Spec ref**: AC-FF-002.
- [ ] T051 Run `npx expo prebuild --clean` once locally as a smoke check (mirroring 028's T050). Confirm the plugin chain (007 + 013 + 014 + 026 + 027 + 028 + 029) resolves without throwing on the real Expo config. Do NOT commit prebuild artifacts. Note the result in the implementation PR description. **Acceptance**: prebuild exits 0; main app target's source list contains BOTH `ShowcaseModeFilter.swift` AND `FocusFilterStorage.swift`; widget extension target's source list is byte-identical to 028's closing total (014's + 027's + 028's sources only); 013's `SpotAppShortcuts.swift` is unchanged in the main app target. **Spec ref**: AC-FF-005, AC-FF-006, AC-FF-008.
- [ ] T052 **Checkpoint commit**: `feat(029): with-focus-filters plugin (idempotent, commutative with 007/013/014/026/027/028, fail-loud) + app.json plugins +1 entry`.
- [ ] T053 Re-run 013's plugin tests (`test/unit/plugins/with-app-intents/**`) and 014/027/028's plugin tests (`test/unit/plugins/with-home-widgets/**`, `with-lock-widgets/**`, `with-standby-widget/**`). MUST be green — 029's plugin must not regress any of them. **Acceptance**: prior plugin suites green; document touched files in the commit if any test fixture needed adjustment.

**Checkpoint**: Plugin chain is green and verified against a real prebuild.

---

## Phase 9: Swift Sources (Plan §Task seed T008 — FR-FF-006 / FR-FF-007 / FR-FF-008 / FR-FF-009 / FR-FF-011 / FR-FF-012 / FR-FF-013 / FR-FF-014 / FR-FF-040, NFR-FF-009, R-B, R5)

**Purpose**: The two Swift sources that implement the actual `SetFocusFilterIntent` on iOS 16+. **No JS tests** (Constitution V exemption — same as 007 / 013 / 014 / 027 / 028); on-device verification per `quickstart.md`.

- [ ] T054 [P] Create `native/ios/focus-filters/FocusFilterStorage.swift` defining `@available(iOS 16.0, *) enum FocusFilterStorage` with: (a) `static func write(values: ShowcaseFilterValues, event: ShowcaseFilterEvent, focusName: String?)` — JSON-encodes `{ mode, accentColor, event, updatedAt: ISO8601, focusName? }`, calls `UserDefaults(suiteName: AppGroupID).set(jsonData, forKey: "spot.focus.filterValues")` synchronously (no NSURLSession / file I/O — NFR-FF-009 / R5); (b) `static func read() -> ShowcaseFilterPersistedPayload?` — reads + JSON-decodes from the same suite/key; returns `nil` on missing or malformed payload (defensive — FR-FF-046's Swift-side analogue). NO UIKit / SwiftUI symbols. App Group ID hard-coded to match 014's existing constant (do NOT redeclare; reference whatever 014's storage layer exposes — if 014 does not expose it as a public Swift symbol, document the literal string here with a `// MIRRORS 014's AppGroupID` comment). **Spec ref**: FR-FF-011, FR-FF-012, FR-FF-013, FR-FF-040, NFR-FF-009.
- [ ] T055 [P] Create `native/ios/focus-filters/ShowcaseModeFilter.swift` defining: (a) inline `@available(iOS 16.0, *) enum ShowcaseFilterMode: String, AppEnum, CaseIterable` with cases `relaxed` / `focused` / `quiet` and `static var caseDisplayRepresentations: [ShowcaseFilterMode: DisplayRepresentation]` mapping each to `LocalizedStringResource("Relaxed")` / `"Focused"` / `"Quiet"` per DECISION 13; (b) `@available(iOS 16.0, *) struct ShowcaseModeFilter: SetFocusFilterIntent` with `static var title: LocalizedStringResource = "Showcase Mode"`, `static var description: IntentDescription = IntentDescription("Tints the spot showcase to match your focus.")`, `@Parameter(title: "Mode") var mode: ShowcaseFilterMode = .relaxed`, `@Parameter(title: "Accent Color") var accentColor: String = "blue"` (FR-FF-006 / FR-FF-007 / FR-FF-008); (c) `func perform() async throws -> some IntentResult` body: derive `event` per R-B (use `FocusFilter` activation flag if exposed by the SDK; otherwise default to `.activated` and document the limitation inline with a `// R-B fallback` comment); read system-supplied focus name best-effort; call `FocusFilterStorage.write(values: …, event: …, focusName: …)`; return `.result()`. The widget kind / filter discovery is automatic — no `AppShortcutsProvider` registration (DECISION 2). **Spec ref**: FR-FF-006, FR-FF-007, FR-FF-008, FR-FF-009, FR-FF-013, FR-FF-014, R-B.
- [ ] T056 **Checkpoint commit**: `feat(029): focus-filters Swift sources (ShowcaseModeFilter SetFocusFilterIntent + FocusFilterStorage App Group writer, iOS 16+, auto-discovered by Settings → Focus)`.

**Checkpoint**: Swift sources land. The plugin (Phase 8) will pick them up on the next prebuild. On-device verification (Phase 12) follows.

---

## Phase 10: Final Integration Sanity Sweep

**Purpose**: Cross-cut audits that none of the per-phase tests cover individually.

- [ ] T057 [P] Verify **NFR-FF-003** (zero new runtime dependencies): `git diff main -- package.json pnpm-lock.yaml | Select-String '^\+\s*"'` produces NO new `dependencies` / `devDependencies` lines beyond what was already added by 007 / 013 / 014 / 026 / 027 / 028. The plugin's `package.json` (T002) declares zero deps. **Acceptance**: diff shows zero new package entries.
- [ ] T058 [P] Verify no `eslint-disable` directives introduced: `git diff main -- 'src/modules/focus-filters-lab/**' 'src/native/focus-filters*.ts' 'plugins/with-focus-filters/**' | Select-String 'eslint-disable'` returns zero matches. **Acceptance**: zero `eslint-disable` directives in 029-touched files.
- [ ] T059 [P] Verify **FR-FF-018** (no symbol collision): `Select-String -Path src/native/app-intents.ts,src/native/widget-center*.ts -Pattern 'FocusFilters|getCurrentFilterValues|FocusFiltersNotSupported'` returns zero matches; `Select-String -Path src/native/focus-filters*.ts -Pattern 'AppIntents|WidgetCenter|getCurrentConfig|setStandByConfig|reloadTimelinesByKind'` returns zero matches. **Acceptance**: zero cross-bridge symbol leaks.
- [ ] T060 [P] Verify **FR-FF-042** (App Group entitlement untouched): `git diff main -- '*.entitlements' 'ios/**/*.entitlements'` shows no diff in the `application-groups` array beyond what was already there at the start of 029. Verify **AC-FF-008** (no new App Group): the `application-groups` array length is identical to 014's closing total. **Acceptance**: entitlement byte-identical for the App Groups key; zero new App Groups.
- [ ] T061 **Checkpoint commit (optional)**: only if any of T057–T060 surfaced a fix.

---

## Phase 11: Final Gate — `pnpm format` + `pnpm check` (lint + typecheck + tests) + final commit

**Purpose**: The explicit CI gates required by the user brief. Each MUST be green individually before the final commit. Report delta from baseline.

- [ ] T062 Run `pnpm format` from the repo root. MUST produce only whitespace-only diffs (or no diff). If diffs are present, stage them for the final commit at T065. **Acceptance**: `git status` shows only formatting-class diffs.
- [ ] T063 Run `pnpm check` (the repo-aggregate lint + typecheck + tests gate per the user brief) from the repo root. MUST exit 0. Report:
  - **Suite count delta**: exactly **+16 new suites** vs. 028's closing total: `filter-modes.test.ts`, `manifest.test.ts`, `screen.test.tsx`, `screen.android.test.tsx`, `screen.web.test.tsx`, `useFocusFilter.test.tsx`, `ExplainerCard.test.tsx`, `FilterDefinitionCard.test.tsx`, `CurrentStateCard.test.tsx`, `PretendFilterToggle.test.tsx`, `SetupInstructions.test.tsx`, `EventLog.test.tsx`, `IOSOnlyBanner.test.tsx`, `focus-filters.test.ts` (bridge), `with-focus-filters/index.test.ts`, `with-focus-filters/add-swift-sources.test.ts` (16 files; matches plan §"Test baseline tracking" target of ≥+16 suites).
  - **Test count delta**: ≥ +120 new tests by construction (T006 ≥14, T009 ≥14, T016 = 8, T021 ≥10, T024–T030 ≥4×7 = 28, T039 ≥9, T040 ≥8, T041 ≥8, T046 ≥10, T047 ≥12).
  - **Lint**: zero new warnings; zero `eslint-disable` directives in 029-touched files (cross-checked against T058).
  - **Typecheck**: clean.

  Record actual final numbers in the implementation PR description (FR-FF-057 / FR-FF-059 final delta). **Acceptance**: `pnpm check` exits 0 and reports the +16-suite target above.
- [ ] T064 **Manual smoke test note (iOS device)**: defer the actual on-device verification to Phase 12 (T066) but record the expected smoke-test path inline in the implementation PR description: (1) install on iOS 16+ device → (2) open Settings → Focus → pick any focus → Add Filter → search "spot" → expect "Showcase Mode" entry → (3) bind with `Mode = Focused`, `Accent = Orange` → (4) activate the focus → (5) foreground the app → tap the Focus Filters tile → (6) expect the Current Filter State panel to show `mode: focused`, `accentColor: orange`, `event: activated`, recent `updatedAt`, optional `focusName` → (7) deactivate the focus → re-foreground → expect `event: deactivated` with the same payload retained (Edge Case "Retain payload"). **Acceptance**: smoke-test note authored; T066 carries out the actual verification.
- [ ] T065 **Final commit**: `feat(029): focus-filters-lab module + with-focus-filters plugin (Focus Filters on iOS 16+, +16 test suites)`. **NOTE**: this final commit is produced by the implementation phase, NOT by `/speckit.tasks`. Per user brief constraint, **do not commit** while running `/speckit.tasks`.

---

## Phase 12: On-Device Verification (Plan §Task seed T012 / `quickstart.md` — Constitution V exemption)

**Purpose**: The Swift surface is not unit-testable on Windows (Constitution V exemption mirroring 007 / 013 / 014 / 027 / 028). On-device steps are recorded here for traceability; not blocking on the JS test gate but required for the merge PR.

- [ ] T066 Execute the on-device checklist in `specs/029-focus-filters/quickstart.md` on an iOS 16+ device (TestFlight build): (1) Install on iOS 16.x device — open Settings → Focus → pick a focus → Add Filter — verify the search hit on `"spot"` surfaces `"Showcase Mode"` (US1 AS6 / SC-002 / R4); (2) Bind the filter with `Mode = Focused`, `Accent = Orange` — verify Done returns to the focus settings screen (FR-FF-009); (3) Activate the focus from Control Centre — verify the filter intent runs (no UI feedback; covered by step 4); (4) Foreground the app, navigate to the Focus Filters tile — verify the Current Filter State panel populates within 500 ms with `mode: focused`, `accentColor: orange`, `event: activated`, fresh `updatedAt`, and `focusName` if Apple's SDK exposed it (NFR-FF-002 / US1 AS3 / R-B); (5) Deactivate the focus — re-foreground — verify the panel updates to `event: deactivated` with the same `mode` + `accentColor` retained (Edge Case "Retain payload"); (6) Toggle "Pretend filter is active" ON — edit `mode` to `Quiet`, `accent` to `Purple` — verify the demo body re-tints within one render pass and an entry with the `simulated` badge prepends to the event log (US2 AS5 / SC-006); (7) Toggle OFF — verify the demo body reverts to the persisted (real) values; (8) Verify 013's mood log, 014's home widget, 027's lock widget, and 028's StandBy widget all still function correctly after the Focus Filter has run (R1 / AC-FF-008). Document the result inline in the merge PR with screenshots of the focus settings sheet, the Current State panel, the Pretend Filter demo body, and the event log. **Acceptance**: All 8 steps pass; PR description references this task.

---

## Dependencies & Parallel Execution Map

### Phase ordering (sequential)

```
Phase 1 (T001–T005) ─► Phase 2 (T006–T008) ─► Phase 3 (T009–T015) ─► Phase 4 (T016–T020) ─►
Phase 5 (T021–T023) ─► Phase 6 (T024–T038) ─► Phase 7 (T039–T045) ─► Phase 8 (T046–T053) ─►
Phase 9 (T054–T056) ─► Phase 10 (T057–T061) ─► Phase 11 (T062–T065) ─► Phase 12 (T066)
```

- **Phase 2 (`filter-modes`)** blocks Phases 3, 5, 6, 7 (every component / screen / bridge type imports `ShowcaseFilterMode` / `AccentColor` / `parseFilterPayload` / `ShowcaseFilterPersistedPayload`).
- **Phase 3 (bridge)** blocks Phase 5 (hook reads via bridge symbols) and Phase 7 (screen indirectly via the hook).
- **Phase 4 (manifest)** can begin in parallel with Phase 3 once Phase 2 is green (manifest only depends on `screen.tsx` existing as a forward import — `render` is the function that fails until T042 lands; the manifest test runs in isolation against the manifest module without rendering the screen).
- **Phase 5 (hook)** blocks Phase 7 (screens consume `useFocusFilter`).
- **Phase 6 components** can run in parallel (different files; only T034 depends conceptually on `filter-modes.ts`'s `DRAFT_DEFAULTS`, which is satisfied after Phase 2).
- **Phase 7 screens** depend on **all** of Phase 6 (components) + Phase 5 (hook) + Phase 3 (bridge) + Phase 2 (`filter-modes`) being green.
- **Phase 8 plugin** depends on **Phase 9 directory existing** (T003); does NOT depend on the Swift content because tests use synthetic project mocks. T051 (real prebuild) does need T054–T055 to be present for the source paths to resolve.
- **Phase 9 Swift** is independent of all JS phases (no JS tests reach into Swift symbols); the Swift `ShowcaseFilterMode` enum's case names MUST exactly match the JS-side `'relaxed' | 'focused' | 'quiet'` literals used in T007 / T039 (mismatch surfaces in T066).

### Parallel batches within a phase

- **Phase 1**: T001 ‖ T002 ‖ T003 ‖ T004 (four scaffolding tasks, four different paths).
- **Phase 3**: T011 ‖ T012 ‖ T013 (three platform-variant impls — different files; all depend on T010).
- **Phase 6 tests**: T024 ‖ T025 ‖ T026 ‖ T027 ‖ T028 ‖ T029 ‖ T030 (seven test files — different paths).
- **Phase 6 impls**: T031 ‖ T032 ‖ T033 ‖ T034 ‖ T035 ‖ T036 ‖ T037 (seven impls — different files, all independent of each other).
- **Phase 7 tests**: T039 ‖ T040 ‖ T041 (three test files — different paths).
- **Phase 7 impls**: T043 ‖ T044 (android & web — different files; T042 must land first because it owns the iOS-16+ flow that the platform-fallback variants partially share via re-exported helpers).
- **Phase 8 tests**: T046 ‖ T047 (two test files — different paths).
- **Phase 8 impls**: T048 then T049 (T049 composes T048; sequential).
- **Phase 9**: T054 ‖ T055 (two Swift files — different paths; T055's `ShowcaseModeFilter` references `FocusFilterStorage` from T054 only at runtime, not at compile time given Swift's same-target resolution).
- **Phase 10**: T057 ‖ T058 ‖ T059 ‖ T060 (four read-only audits).

### Critical path

```
T001..T004 → T005
   → T006 → T007 → T008
   → T009 → T010 → (T011 ‖ T012 ‖ T013) → T014 → T015
   → (T016 → T017 → T018 → T019 → T020)               ┐
   → T021 → T022 → T023                                │ Phase 4 can run after T008
   → (T024..T030) → (T031 ‖ T032 ‖ T033 ‖ T034 ‖ T035 ‖ T036 ‖ T037)
   → T038 → (T039 ‖ T040 ‖ T041) → T042 → (T043 ‖ T044) → T045
   → (T046 ‖ T047) → T048 → T049 → T050 → T051 → T052 → T053
   → (T054 ‖ T055) → T056
   → (T057..T060) → T061
   → T062 → T063 → T064 → T065
   → T066
```

### Parallel-execution example

Within Phase 6 (components), an implementer can launch all seven test-write tasks simultaneously (different files, no shared state):

```
$ # Phase 6 RED batch — all seven in parallel
$ <author T024 ExplainerCard.test.tsx>          &
$ <author T025 FilterDefinitionCard.test.tsx>   &
$ <author T026 CurrentStateCard.test.tsx>       &
$ <author T027 PretendFilterToggle.test.tsx>    &
$ <author T028 SetupInstructions.test.tsx>      &
$ <author T029 EventLog.test.tsx>               &
$ <author T030 IOSOnlyBanner.test.tsx>          &
$ wait
$ pnpm test --listFailing  # all 7 suites should fail with module-not-found
```

Then the GREEN batch (T031–T037) can also run in parallel — each component is in a distinct file with no inter-dependency at compile time.

---

## Spec Coverage Matrix (FR/AC ↔ Task)

| Spec ID | Task(s) |
|---------|---------|
| FR-FF-001 | T016, T017 |
| FR-FF-002 | T016, T017, T018, T050 |
| FR-FF-003 | T017 |
| FR-FF-006 | T055 |
| FR-FF-007 | T006, T007, T025, T032, T055 |
| FR-FF-008 | T006, T007, T055 |
| FR-FF-009 | T055, T066 |
| FR-FF-011 | T054 |
| FR-FF-012 | T054 |
| FR-FF-013 | T021, T022, T054, T055 |
| FR-FF-014 | T026, T029, T033, T036, T055, T066 |
| FR-FF-015 | T009, T011 |
| FR-FF-016 | T009, T012, T013, T040, T041, T043, T044 |
| FR-FF-017 | T009, T011 |
| FR-FF-018 | T009, T010, T039, T059 |
| FR-FF-019 | T017 |
| FR-FF-020 | T039, T042 |
| FR-FF-021 | T030, T037, T040, T041, T042, T043, T044 |
| FR-FF-022 | T025, T032 |
| FR-FF-023 | T025, T032 |
| FR-FF-024 | T006, T007, T039, T042 |
| FR-FF-025 | T026, T040, T041 |
| FR-FF-026 | T026, T033 |
| FR-FF-027 | T026, T033 |
| FR-FF-028 | T026, T033 |
| FR-FF-029 | T021, T022, T027, T034, T039 |
| FR-FF-030 | T027, T034 |
| FR-FF-031 | T021, T022, T027, T034, T039 |
| FR-FF-032 | T027, T034 |
| FR-FF-033 | T021, T022, T029, T036 |
| FR-FF-034 | T029, T036 |
| FR-FF-036 | T028, T035 |
| FR-FF-037 | T024, T031 |
| FR-FF-038 | T028, T035 |
| FR-FF-040 | T046, T048, T054, T055 |
| FR-FF-041 | T046, T047, T048, T049, T051, T053 |
| FR-FF-042 | T046, T047, T060 |
| FR-FF-044 | T046, T047, T048 |
| FR-FF-046 | T006, T007, T009, T011, T021, T022, T039, T042 |
| FR-FF-051 | T025, T027 |
| FR-FF-052 | T030, T037, T040, T041 |
| FR-FF-053 | T025 |
| FR-FF-055 | (entire Phases 2–8 RED tasks) |
| FR-FF-057 | T063 |
| FR-FF-059 | T063, T065 |
| NFR-FF-001 | T027, T034 |
| NFR-FF-002 | T021, T022, T039, T066 |
| NFR-FF-003 | T002, T047, T057 |
| NFR-FF-004 | T047 |
| NFR-FF-008 | T030, T037 |
| NFR-FF-009 | T054 |
| AC-FF-001 | T018, T019 |
| AC-FF-002 | T050 |
| AC-FF-005 | T046, T047, T051 |
| AC-FF-006 | T047, T051 |
| AC-FF-008 | T051, T060, T066 |
| R-A | T046, T047, T048 |
| R-B | T021, T055, T066 |
| R-C | T006, T007 |
| R-D | T009, T011 |
| R-E | T021, T022, T027, T034 |
| R1 | T046, T047, T053, T060 |
| R2 | T046, T047, T051 |
| R4 | T066 |
| R5 | T054, T066 |
| R6 | T009, T011 |
| R9 | T009, T011 |
| R10 | T021, T022, T027 |

---

## Validation checklist

- [x] **All 22 source files have an explicit creation task**: T007 (filter-modes), T010 (bridge types), T011 (bridge iOS), T012 (bridge android), T013 (bridge web), T017 (manifest), T022 (hook), T031 (ExplainerCard), T032 (FilterDefinitionCard), T033 (CurrentStateCard), T034 (PretendFilterToggle), T035 (SetupInstructions), T036 (EventLog), T037 (IOSOnlyBanner), T042 (screen.tsx), T043 (screen.android.tsx), T044 (screen.web.tsx), T048 (plugin add-swift-sources), T049 (plugin index), T002 (plugin package.json), T054 (FocusFilterStorage.swift), T055 (ShowcaseModeFilter.swift). **22/22 ✓**
- [x] **Both additive integration edits have an explicit task**: T018 (`registry.ts`), T050 (`app.json`). **2/2 ✓**
- [x] **All 16 test files have an explicit RED task**: T006 (filter-modes), T009 (bridge), T016 (manifest), T021 (hook), T024 (Explainer), T025 (FilterDefinition), T026 (CurrentState), T027 (PretendToggle), T028 (Setup), T029 (EventLog), T030 (IOSOnlyBanner), T039 (screen.tsx), T040 (screen.android.tsx), T041 (screen.web.tsx), T046 (plugin add-swift-sources), T047 (plugin index). **16/16 ✓**
- [x] **RED → GREEN → REFACTOR cadence enforced per task group**: every implementation task is preceded by its matching RED test task; checkpoint commits mark phase boundaries.
- [x] **Plugin idempotency tested**: T046 case 2, T047 case 2.
- [x] **Plugin commutativity tested with 013, 014, 026, 027, 028**: T047 cases 3, 4, 5, 6, 7 (pairwise) + case 8 (sampled six-way).
- [x] **Plugin App Group entitlement non-regression tested**: T046 case 7, T047 case 9, T060.
- [x] **Plugin does NOT touch widget extension target / 013's app-intents target**: T046 cases 5 + 6.
- [x] **Bridge symbol non-collision with 013 / 014 / 027 / 028**: T009 cases 7 + 8, T059.
- [x] **No new App Group, no new entitlement**: T060, AC-FF-008.
- [x] **Final tasks include `pnpm format` (T062), `pnpm check` (T063), manual iOS smoke test note (T064), final commit (T065), on-device verification (T066)**.
- [x] **`/speckit.tasks` does not commit**: every "Checkpoint commit" task is explicitly flagged as a marker for the implementation phase, not for execution during task generation.
- [x] **No code outside `specs/029-focus-filters/` is modified**: this tasks.md is the only artefact produced by `/speckit.tasks`; all source/test/plugin/Swift creations are deferred to the implementation phase.
