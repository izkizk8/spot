---
description: "Task list — Swift Charts Playground (spec 012)"
---

# Tasks: Swift Charts Playground

**Input**: Design documents from `/specs/012-swift-charts-playground/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Test-first is REQUIRED for this feature (Constitution V; plan.md § Constitution Check). Every JS/TS implementation task is preceded by — or paired with — its unit-test task. The Swift native `ChartView` body is verified manually on device per `quickstart.md` (Constitution V exemption clause: native bodies are not unit-testable on the Windows host; the TS contract that wraps them is fully tested via mocks).

**Test file inventory** (matches `plan.md` § Project Structure): 1 manifest + 1 data + 3 screen variants + 3 ChartView variants + 3 controls = **11 test files**.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Maps to user stories from spec.md
  - **US1** = See a real Swift Charts line chart and switch chart types (P1)
  - **US2** = Mutate the dataset and watch marks animate (P1)
  - **US3** = Recolor and restyle marks (P2)
  - **US4** = Tap a mark to see its value (P2)
  - **US5** = Cross-platform fallback on Android, Web, and iOS < 16 (P2)
- All paths are repo-relative

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Scaffold module + test folders. **No new npm dependencies** — `@expo/ui` (~55.0.12) is already installed via feature 010 and the local Swift extension lives under the module's own `native/ios/` directory (plan.md § Technical Context). Per SC-010 the only edit outside `src/modules/swift-charts-lab/` and `test/unit/modules/swift-charts-lab/` is the registry wiring in Phase 9.

- [ ] T001 [P] Create empty module folders `src/modules/swift-charts-lab/`, `src/modules/swift-charts-lab/components/`, `src/modules/swift-charts-lab/native/ios/` and matching test folders `test/unit/modules/swift-charts-lab/` and `test/unit/modules/swift-charts-lab/components/`. Acceptance: directories exist; `git status` shows them tracked (with `.gitkeep` if your tooling drops empty dirs); nothing else changed.
- [ ] T002 [P] Confirm no new npm deps are required: run `pnpm list @expo/ui` and verify a `~55.0.12` version is already present from feature 010; do NOT add any package.json entries (plan.md § Technical Context, SC-010). Acceptance: `pnpm list @expo/ui` reports an SDK 55–compatible version; `git diff -- package.json pnpm-lock.yaml` is empty.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Land the pure `data.ts` module — every screen, every ChartView variant, every control test, and the manifest depend on its types (`ChartType`, `Tint`, `Dataset`, `DataPoint`) and constants (`MIN_SERIES_SIZE`, `MAX_SERIES_SIZE`, `INITIAL_SIZE`, `INITIAL_MONTHS`, `TINTS`, `CHART_TYPES`). The test is written FIRST and must FAIL before the implementation lands.

**⚠️ CRITICAL**: No US-tagged task may begin until this phase is green. `data.ts` is the type root for the entire module.

- [ ] T003 Write `test/unit/modules/swift-charts-lab/data.test.ts` per `contracts/dataset.md` § "Invariants asserted by `data.test.ts`". Cover, with one `describe` block per group:
  - **Constants**: `MIN_SERIES_SIZE === 2`, `MAX_SERIES_SIZE === 24`, `VALUE_MIN === -10`, `VALUE_MAX === 30`, `INITIAL_SIZE === 12`; `TINTS.length === 4` and ids deep-equal `['blue','green','orange','purple']`; `CHART_TYPES` deep-equals `['line','bar','area','point']`.
  - **`initialDataset()`**: length 12; months deep-equal `INITIAL_MONTHS`; every value finite, in `[-10, 30]`, rounded to 1 decimal; two successive calls return element-wise equal arrays (deterministic).
  - **`randomize(data, seed)`**: same length and same months as input; values in range and 1-decimal rounded; same seed → equal arrays; pinned different seeds (e.g. `1` and `2`) → at least one position differs.
  - **`addPoint(data, seed)`**: when `length < 24`, output length `+1`, prefix entries `===`-equal, appended `month === nextMonthLabel(last.month)`, value in range; when `length === 24`, returns same reference.
  - **`removePoint(data)`**: when `length > 2`, output length `-1`, prefix entries `===`-equal; when `length === 2`, returns same reference.
  - **`nextMonthLabel(prev)`**: `'Jan'`→`'Feb'`, …, `'Nov'`→`'Dec'`, `'Dec'`→`'Jan ʼ27'`, `'Jan ʼ27'`→`'Feb ʼ27'`, `'Dec ʼ27'`→`'Jan ʼ28'`. Use the literal Unicode `ʼ` (U+02BC) in assertions per `contracts/dataset.md`.
  - **Composition**: a 30-step random walk of `addPoint` / `removePoint` from `initialDataset()` keeps length in `[2, 24]`, every value in range and 1-decimal rounded, month labels pairwise distinct.

  Acceptance: file exists; `pnpm test --testPathPattern swift-charts-lab/data.test` FAILS — `data` module missing.
- [ ] T004 Implement `src/modules/swift-charts-lab/data.ts` per `contracts/dataset.md` § "Public surface" and `data-model.md` § "Constants". Pure module — no React, no I/O. Export `ChartType`, `TintId`, `Tint`, `TINTS`, `CHART_TYPES`, `DataPoint`, `Dataset`, `MIN_SERIES_SIZE`, `MAX_SERIES_SIZE`, `VALUE_MIN`, `VALUE_MAX`, `INITIAL_SIZE`, `INITIAL_MONTHS`, `initialDataset()`, `randomize(data, seed?)`, `addPoint(data, seed?)`, `removePoint(data)`, `nextMonthLabel(prev)`. Use a small seedable PRNG (mulberry32 or LCG) so seeded calls are deterministic; default to `Date.now()` when `seed` is omitted. Round every emitted value via `Math.round(v * 10) / 10`. The `nextMonthLabel` helper parses `^(Jan|Feb|…|Dec)( ʼ(\d+))?$`, increments month index, and wraps from `'Dec'` to `'Jan ʼ(N+1)'` where the initial unsuffixed block counts as year `26` (so `'Dec'` → `'Jan ʼ27'`). No `any`. Acceptance: T003 passes.

**Checkpoint**: `data.ts` is green. All US phases (which depend on its types) may now begin in parallel.

---

## Phase 3: User Story 1 — See a real Swift Charts line chart and switch chart types (Priority: P1) 🎯 MVP

**Goal**: A user opens the Swift Charts Lab module on iOS 16+ and sees a real Apple Charts line chart of the 12-month seasonal dataset; tapping any of Line / Bar / Area / Point in the segmented control morphs the chart with Apple's default mark-transition animation, with Line as the default.

**Independent Test**: RNTL render of the iOS `<SwiftChartsLabScreen />` (`screen.tsx`) with `./components/ChartView` mocked as a prop-recording `<View>`. Assert (a) no "iOS 16+ only" banner on iOS, (b) the segmented control reads Line / Bar / Area / Point with Line selected by default, (c) the recorded `ChartView` initially receives `type: 'line'` and a `data` array of length 12, (d) tapping the `Bar` segment causes `ChartView` to re-render with `type: 'bar'` and the same dataset.

### Tests for User Story 1 (write FIRST, must FAIL before implementation)

- [ ] T005 [P] [US1] Write `test/unit/modules/swift-charts-lab/components/ChartTypePicker.test.tsx`. Render `<ChartTypePicker value="line" onChange={fn} />` (props per `data-model.md` § "Relationships"). Assert four segments labelled `Line`, `Bar`, `Area`, `Point` are present (use `getByText` or `getByA11yLabel` with the FR-034 announcement format `"Chart type: Line"` etc.); assert the `Line` segment is selected (`accessibilityState.selected` or testID); fire press on `Bar`; assert `fn` called once with `'bar'`. Acceptance: file exists; FAILS — picker missing.
- [ ] T006 [P] [US1] Write `test/unit/modules/swift-charts-lab/components/ChartView.test.tsx` (iOS variant) per `contracts/chart-view.md` § "Per-variant behavior — `ChartView.tsx` (iOS)" and § "Testability". At top-of-file, `jest.mock('@expo/ui/swift-ui', () => ({ Host: ({ children }) => children }))` and mock the local Swift view name `'SwiftChartsLabChartView'` via `jest.mock('expo-modules-core', () => ({ requireNativeViewManager: () => (props) => <View {...props} testID="native-chart-view" /> }))` (or whichever import path the implementation chose; pin it explicitly in the test). Render the default-resolved `./ChartView` with `{ type: 'line', data: initialDataset(), tint: TINTS[0], gradientEnabled: false }`. Assert the recorded native view received `type: 'line'`, a `data` array of length 12, `tint` equal to `TINTS[0].value` (the hex string), and `gradientEnabled: false`. Re-render with `type: 'bar'` and assert the new `type` prop reaches the native view. Render with an `onSelect` mock and the recorded view; simulate the recorded `onSelect({ index: 3 })` event from inside the mock; assert the JS callback was called once with `3`. Render with `onSelect` and simulate `onSelect({ index: null })`; assert callback called with `null`. Acceptance: file exists; FAILS — `ChartView.tsx` missing.
- [ ] T007 [P] [US1] Write `test/unit/modules/swift-charts-lab/screen.test.tsx` (iOS variant). At top-of-file, `jest.mock('@/modules/swift-charts-lab/components/ChartView', () => { const recorded = []; return { ChartView: (props) => { recorded.push(props); return null; }, __recorded: recorded }; })` (and import the recorded array). Render the default-resolved `./screen`. Assert (a) NO "iOS 16+ only" banner is rendered (use `queryByText(/iOS 16/)` returns `null`), (b) `<ChartTypePicker />` mounts with default `'line'`, (c) the recorded `ChartView` props on first render include `type: 'line'`, `data.length === 12`, `tint.id === 'blue'`, `gradientEnabled === false`, (d) press the `Bar` segment; assert the next recorded `ChartView` props include `type: 'bar'` with the same `data` reference (chart-type tap MUST NOT mutate the dataset). Acceptance: file exists; FAILS — screen missing.

### Implementation for User Story 1

- [ ] T008 [P] [US1] Implement `src/modules/swift-charts-lab/components/ChartTypePicker.tsx`. Themed segmented control built from four `Pressable`s wrapped in a `ThemedView` row (mirrors the `SampleRatePicker` pattern from feature 011). Props: `{ value: ChartType; onChange: (next: ChartType) => void }`. Default visual emphasis on the current value; segment labels are the four `CHART_TYPES` Title-cased. `accessibilityLabel` per segment is `"Chart type: <Label>"` (FR-034); `accessibilityState.selected` reflects `value`. `StyleSheet.create`, `Spacing` only; no inline style objects defined outside StyleSheet; no `any`. Acceptance: T005 passes.
- [ ] T009 [P] [US1] Implement `src/modules/swift-charts-lab/components/ChartView.tsx` (iOS variant) per `contracts/chart-view.md` § "ChartView.tsx (iOS)". Imports `Host` from `@expo/ui/swift-ui` and the local Swift view via `requireNativeViewManager('SwiftChartsLabChartView')`. Wraps the native view in `<Host>`. Forwards every prop as a non-null primitive: `type` (string), `data` as the raw `Dataset`, `tint` as `tint.value` (hex string), `gradientEnabled` (boolean), `selectedIndex` (number-or-null). Subscribes to the native `onSelect` event and calls the JS `onSelect` with `event.nativeEvent.index` (or `event.index`, whichever the recipe surfaces). Honors `minHeight` (default 300) by passing it to the native view's `style.minHeight`. Forwards `testID`. No `any`; props typed exactly per `ChartViewProps`. Acceptance: T006 passes.
- [ ] T010 [US1] Implement `src/modules/swift-charts-lab/screen.tsx` (iOS variant) per `data-model.md` § "Relationships" and `data-model.md` § "ScreenState". Composes `<ThemedView>` root → `<ChartTypePicker value={chartType} onChange={setChartType} />` → `<ChartView type={chartType} data={data} tint={tint} gradientEnabled={gradientEnabled} selectedIndex={selectedIndex} onSelect={setSelectedIndex} minHeight={300} />` → `<DataControls … />` → `<TintPicker value={tint} onChange={setTint} tints={TINTS} />`. Owns `useState` for `chartType` (default `'line'`), `data` (init `initialDataset()`), `tint` (default `TINTS[0]`), `gradientEnabled` (default `false`), `selectedIndex` (default `null`). Setting `chartType`, `data` (any of randomize/add/remove), MUST also clear `selectedIndex` to `null` (FR-026). Does NOT render any "iOS 16+ only" banner (FR-006(a)). `StyleSheet.create`, `Spacing`, `ThemedText`, `ThemedView` only; no `Platform.OS` (handled via file split, FR-031). Default-export `SwiftChartsLabScreen`. Acceptance: T007 passes; the per-component tests for `DataControls` (T013) and `TintPicker` (T014) are imported transitively but not yet asserted here — the screen test mocks `./components/ChartView` so unmocked controls render harmlessly with default state. NOTE: this task LANDS AFTER T013/T014 implementations (US3) for compile, OR in parallel with stub controls — see Dependencies section. To unblock ordering, write minimal pass-through stubs for `DataControls` / `TintPicker` while their full implementations land in US3.

**Checkpoint**: On iOS 16+, the screen renders a real Swift Charts chart driven by JS state and the segmented control switches mark types. Dataset mutations + tint + gradient toggle land in US2 / US3 / US4. Fallback variants for non-iOS-16+ targets land in US5.

---

## Phase 4: User Story 2 — Mutate the dataset and watch marks animate (Priority: P1)

**Goal**: From the same iOS 16+ screen, tapping `Randomize data` re-rolls every value in range and animates marks to their new heights; `Add point` appends one mark with the next month label (wrapping `'Dec'` → `'Jan ʼ27'`); `Remove point` pops the last mark; bounds 2..24 are enforced via disabled buttons.

**Independent Test**: RNTL render of `<SwiftChartsLabScreen />` (iOS) with `./components/ChartView` mocked as prop-recording. Assert (a) `<DataControls />` mounts with Randomize, Add, Remove, and Show foreground style controls, (b) press Randomize → recorded `ChartView` receives a new `data` array of the same length whose `month` labels are unchanged but `value`s differ in at least one position, (c) press Add → recorded `data.length === 13` with appended `month === 'Jan ʼ27'`, (d) press Remove from a length-2 dataset (after 10 Removes) → button disabled, no further mutations, (e) press Add 12 times from initial → button disables at length 24.

### Tests for User Story 2 (write FIRST, must FAIL before implementation)

- [ ] T011 [P] [US2] Write `test/unit/modules/swift-charts-lab/components/DataControls.test.tsx`. Render `<DataControls onRandomize={r} onAdd={a} addDisabled={false} onRemove={rm} removeDisabled={false} gradientEnabled={false} onToggleGradient={tg} />`. Assert four pressables present: `Randomize`, `Add point`, `Remove point`, `Show foreground style`; their `accessibilityLabel`s match FR-034 wording. Press each; assert the matching mock was called once. Re-render with `addDisabled={true}`; assert the `Add point` `Pressable` reports `accessibilityState.disabled` and pressing it does NOT call `onAdd`. Same for `removeDisabled={true}` / `onRemove`. Re-render with `gradientEnabled={true}`; assert the toggle's `accessibilityState.checked === true` and the announcement is `"Show foreground style on"` (FR-034). Acceptance: file exists; FAILS — controls missing.
- [ ] T012 [US2] Extend `test/unit/modules/swift-charts-lab/screen.test.tsx` (do not create a new file — append `describe('dataset mutations', …)`). With the same `ChartView` recording mock from T007, assert: (a) press `Randomize`; recorded `data` has same length as before; same month labels; at least one value differs (use a fixed seed via `data.ts` if the implementation accepts one, otherwise compare reference identity changed AND length+months are equal); (b) press `Add point`; recorded `data.length === 13`; appended entry's `month === 'Jan ʼ27'` (literal U+02BC); (c) starting from initial, press `Add point` 12 times; on the 13th press the recorded `data.length` stays at `24` and the `Add point` `Pressable` reports `accessibilityState.disabled` (defensive guard plus button disable); (d) starting from initial, press `Remove point` 10 times; on the 11th press the recorded `data.length` stays at `2` and `Remove point` reports `disabled`; (e) after `Randomize`, after `Add point`, and after `Remove point`, the recorded `selectedIndex` prop is `null` even if the test pre-set it via the `onSelect` recorded callback (FR-026). Acceptance: appended cases FAIL — `DataControls` not yet wired into `screen.tsx`.

### Implementation for User Story 2

- [ ] T013 [P] [US2] Implement `src/modules/swift-charts-lab/components/DataControls.tsx`. Themed row of `Pressable`s: `Randomize`, `Add point`, `Remove point`, plus a `Show foreground style` `Switch`-like `Pressable` (do NOT introduce `react-native` `<Switch>` if the project's existing themed toggle pattern differs — match feature 011's `Pressable` toggles). Props: `{ onRandomize: () => void; onAdd: () => void; addDisabled: boolean; onRemove: () => void; removeDisabled: boolean; gradientEnabled: boolean; onToggleGradient: () => void }`. Disabled buttons set `accessibilityState.disabled`, dim via theme color, and refuse press. `accessibilityLabel`s: `"Randomize data"`, `"Add point"`, `"Remove point"`, `"Show foreground style on"` / `"Show foreground style off"` (FR-034). `StyleSheet.create`, `Spacing`. Acceptance: T011 passes.
- [ ] T014 [US2] Wire `DataControls` into `src/modules/swift-charts-lab/screen.tsx` (iOS): replace the T010 stub with the real component. Handlers call `data.ts` helpers and clear `selectedIndex`:
  - `onRandomize` → `setData(d => randomize(d)); setSelectedIndex(null);`
  - `onAdd` → `setData(d => addPoint(d)); setSelectedIndex(null);`
  - `onRemove` → `setData(d => removePoint(d)); setSelectedIndex(null);`
  - `onToggleGradient` → `setGradientEnabled(g => !g);`
  - `addDisabled = data.length === MAX_SERIES_SIZE`; `removeDisabled = data.length === MIN_SERIES_SIZE`.
  Acceptance: T012 appended cases pass; T007 still passes.

**Checkpoint**: iOS 16+ now supports the full dataset-mutation story. Tint + gradient styling lands in US3; mark selection lands in US4.

---

## Phase 5: User Story 3 — Recolor and restyle marks (Priority: P2)

**Goal**: A user taps any of the four tint swatches; chart marks recolor in <300 ms (SC-005). Toggling `Show foreground style` applies a vertical gradient to Line / Area; Bar (and Point) ignore it gracefully.

**Independent Test**: RNTL render of `<SwiftChartsLabScreen />` (iOS) with `./components/ChartView` mocked as prop-recording. Assert (a) `<TintPicker />` mounts with four swatches, blue selected; (b) tapping the `green` swatch causes the recorded `ChartView` to receive `tint.id === 'green'` and `tint.value === '#34C759'`; (c) toggling `Show foreground style` flips the recorded `gradientEnabled` from `false` to `true` and back; (d) selected-swatch indicator (ring + checkmark) renders on the active swatch (FR-035).

### Tests for User Story 3 (write FIRST, must FAIL before implementation)

- [ ] T015 [P] [US3] Write `test/unit/modules/swift-charts-lab/components/TintPicker.test.tsx`. Render `<TintPicker value={TINTS[0]} onChange={fn} tints={TINTS} />`. Assert four pressables, one per tint id; the `blue` swatch shows the selected ring + checkmark indicator (testID or accessibilityState.selected); the other three swatches do NOT. Assert each swatch's `accessibilityLabel` is `"Tint: <id>"` (FR-034). Press the `green` swatch; assert `fn` called once with the full `Tint` object (`{ id: 'green', value: '#34C759' }`). Re-render with `value={TINTS[1]}` (green); assert the indicator moved to the green swatch and is absent from blue. Acceptance: file exists; FAILS — picker missing.
- [ ] T016 [US3] Extend `test/unit/modules/swift-charts-lab/screen.test.tsx` (append `describe('tint and gradient', …)`). With the same `ChartView` recording mock: (a) initial recorded `tint` deep-equals `TINTS[0]`; (b) press the `green` swatch; recorded `tint.id === 'green'`; (c) press the `Show foreground style` toggle; recorded `gradientEnabled === true`; press again, back to `false`; (d) tint change does NOT clear `selectedIndex` (selection survives recoloring per `data-model.md` § Transitions). Acceptance: appended cases FAIL — `TintPicker` not yet wired.

### Implementation for User Story 3

- [ ] T017 [P] [US3] Implement `src/modules/swift-charts-lab/components/TintPicker.tsx`. Row of four circular swatches built from `Pressable` + `View`. Props: `{ value: Tint; onChange: (next: Tint) => void; tints: readonly Tint[] }`. Each swatch fills `backgroundColor: tint.value` (a single-value dynamic style — permitted per constitution IV; the four hex values are explicitly permitted per spec Assumptions). The active swatch shows a themed ring (border) + small checkmark (text glyph `'✓'`) overlay (FR-035). `accessibilityLabel` per swatch is `"Tint: <id>"`; `accessibilityState.selected` reflects `value.id === tint.id`. `StyleSheet.create`, `Spacing` for ring + spacing. Acceptance: T015 passes.
- [ ] T018 [US3] Wire `TintPicker` into `src/modules/swift-charts-lab/screen.tsx` (iOS): replace any stub with the real component; pass `value={tint}`, `onChange={setTint}`, `tints={TINTS}`. The screen MUST forward both `tint` (full object) to `<ChartView />` and the `gradientEnabled` boolean already set up in T014. Acceptance: T016 appended cases pass; T007 + T012 still pass.

**Checkpoint**: iOS 16+ chart now recolors via swatches and applies gradients via the toggle. Mark selection lands in US4; cross-platform fallback lands in US5.

---

## Phase 6: User Story 4 — Tap a mark to see its value (Priority: P2)

**Goal**: On iOS 16+, tapping a mark surfaces an inline indicator showing the month label and value; tapping elsewhere dismisses; switching chart types or mutating the dataset dismisses (FR-026).

**Independent Test**: RNTL render of `<SwiftChartsLabScreen />` (iOS) with the `ChartView` mock that exposes its recorded `onSelect` callback to the test. Assert (a) initial recorded `selectedIndex === null`; (b) call recorded `onSelect(3)`; assert the next recorded `ChartView` props include `selectedIndex === 3`; (c) call recorded `onSelect(null)`; assert recorded `selectedIndex === null`; (d) with `selectedIndex === 3`, press the `Bar` segment of `<ChartTypePicker />`; assert recorded `selectedIndex` falls back to `null` (FR-026); (e) with `selectedIndex === 3` again, press `Randomize`; assert `selectedIndex === null` (already covered in T012 (e), re-asserted here for clarity).

### Tests for User Story 4 (write FIRST, must FAIL before implementation)

- [ ] T019 [US4] Extend `test/unit/modules/swift-charts-lab/screen.test.tsx` (append `describe('mark selection (iOS)', …)`). The existing `ChartView` mock from T007 must capture the latest `onSelect` callback in a module-scoped ref so the test can fire it (`module.__lastOnSelect(3)`). Cover the five cases listed in the Independent Test above. Note: the iOS `ChartView` itself is responsible for the gesture → `onSelect` event plumbing; this test only asserts that `screen.tsx` correctly threads `selectedIndex` through `useState` and clears it on chart-type / dataset transitions. Acceptance: cases (a)–(d) FAIL — screen does not yet thread `onSelect` through state; case (e) was already wired in T014.

### Implementation for User Story 4

- [ ] T020 [US4] Wire selection into `src/modules/swift-charts-lab/screen.tsx` (iOS): set `selectedIndex` from `useState<number | null>(null)`; pass `selectedIndex={selectedIndex}` and `onSelect={setSelectedIndex}` to `<ChartView />`; ensure that `setChartType` (already in T010) ALSO clears `selectedIndex` (this may already be the case from T010; if not, adjust the handler to do so). The `<ChartView.tsx>` (iOS) implementation from T009 already forwards the native event payload to the JS `onSelect`. Acceptance: T019 cases pass.

**Checkpoint**: iOS 16+ flow is fully implemented. The screen exposes Line/Bar/Area/Point switching, dataset mutation with bounds, tint + gradient styling, and mark selection — all with selection auto-dismiss on the FR-026 transitions.

---

## Phase 7: User Story 5 — Cross-platform fallback on Android, Web, and iOS < 16 (Priority: P2)

**Goal**: Android, Web, and iOS-< 16 users see the same controls driving a `<View>`-only fallback (full bars for Bar; bars + top stripe for Line / Area; small dots for Point) with an "iOS 16+ only" banner. Selection is omitted on the fallback per planning resolution of NEEDS CLARIFICATION #3. The iOS-only Swift Charts symbol is NEVER evaluated at module load time on these targets (FR-031).

**Independent Test**: RNTL render of `<SwiftChartsLabScreen />` from `./screen.android` AND from `./screen.web` (explicit-filename `require` per feature 006 pattern), each with `./components/ChartView` resolved to its `.android` / `.web` variant explicitly. Assert (a) the "iOS 16+ only" banner renders on each, with the literal sentence `"Mark selection is available on iOS 16+ only."` (planning resolution of NEEDS CLARIFICATION #3); (b) the same five controls render and respond; (c) the `ChartView` fallback renders one child per data point with the active tint propagated to `backgroundColor`; (d) `gradientEnabled` on Bar mounts a second overlay child per bar; on Line / Area / Point it is a no-op (no crash, no extra children); (e) the iOS-only `@expo/ui/swift-ui` and `requireNativeViewManager('SwiftChartsLabChartView')` paths are NEVER imported by the `.android` / `.web` variants (assert via Jest's module registry — see test note below).

### Tests for User Story 5 (write FIRST, must FAIL before implementation)

- [ ] T021 [P] [US5] Write `test/unit/modules/swift-charts-lab/components/ChartView.android.test.tsx` per `contracts/chart-view.md` § "Per-variant behavior — `ChartView.android.tsx` and `ChartView.web.tsx`". Use the explicit-filename pattern: `const { ChartView } = require('@/modules/swift-charts-lab/components/ChartView.android');`. Render with `{ type: 'bar', data: initialDataset(), tint: TINTS[0], gradientEnabled: false }`. Assert: (a) the rendered tree contains exactly 12 bar children (one per data point) — query via testID `"chart-bar-{i}"` or by counting `accessibilityRole="image"` views per the implementation; (b) each bar's `backgroundColor` style equals `'#007AFF'` (TINTS[0].value); (c) re-render with `type: 'line'`; assert each bar has a top-stripe child; with `type: 'area'`; same; with `type: 'point'`; assert 12 dot children; (d) re-render with `type: 'bar'` + `gradientEnabled: true`; assert each bar mounts a second overlay child (testID `"chart-bar-{i}-gradient"`); re-render with `type: 'line'` + `gradientEnabled: true`; assert NO extra overlay child (documented no-op); (e) the root `<View>` has an `accessibilityLabel` matching `/Chart with 12 values, currently in Bar mode/i` (FR-037); (f) `selectedIndex` and `onSelect` props are accepted without crash and have NO observable effect (Decision 5). Acceptance: file exists; FAILS — `ChartView.android.tsx` missing.
- [ ] T022 [P] [US5] Write `test/unit/modules/swift-charts-lab/components/ChartView.web.test.tsx`. Mirror T021 line-for-line but `require('@/modules/swift-charts-lab/components/ChartView.web')`. Same assertions; the web variant MUST behave identically to the android variant on the assertions above (the only documented difference is `LayoutAnimation` being a no-op on web — not directly observable in JSDOM). Acceptance: file exists; FAILS — `ChartView.web.tsx` missing.
- [ ] T023 [P] [US5] Write `test/unit/modules/swift-charts-lab/screen.android.test.tsx`. `jest.mock('@/modules/swift-charts-lab/components/ChartView', () => { /* same recording mock as T007 */ })`. Use `const { default: SwiftChartsLabScreen } = require('@/modules/swift-charts-lab/screen.android');` (explicit filename per feature 006). Render. Assert: (a) the "iOS 16+ only" banner is visible (`getByText(/iOS 16/)` succeeds); (b) the banner copy includes the literal sentence `"Mark selection is available on iOS 16+ only."`; (c) the same five controls (chart-type picker, data controls, tint picker) mount and behave identically to the iOS screen on the cases covered by T012/T016 (re-assert one case from each — Add point disables at 24, tint swatch tap propagates — to keep this test self-sufficient); (d) `selectedIndex` recorded on `ChartView` is always `null` on this variant (Decision 5); (e) Jest module registry check: `expect(jest.requireMock('@expo/ui/swift-ui')).toBeUndefined()` is NOT a valid assertion (Jest auto-creates registry entries on mock); instead pin via `expect(() => jest.requireActual('@/modules/swift-charts-lab/screen.android')).not.toThrow()` AND assert the `.android.tsx` source contains zero `@expo/ui/swift-ui` import strings via a small `fs.readFileSync` + `expect(src).not.toMatch(/@expo\/ui\/swift-ui/)` (FR-031). Acceptance: file exists; FAILS — `screen.android.tsx` missing.
- [ ] T024 [P] [US5] Write `test/unit/modules/swift-charts-lab/screen.web.test.tsx`. Mirror T023 against `./screen.web` with the same five assertion groups. The FR-031 source-grep assertion runs against `screen.web.tsx`. Acceptance: file exists; FAILS — `screen.web.tsx` missing.

### Implementation for User Story 5

- [ ] T025 [P] [US5] Implement `src/modules/swift-charts-lab/components/ChartView.android.tsx` per `contracts/chart-view.md` § "Per-variant behavior — `ChartView.android.tsx` and `ChartView.web.tsx`" and `research.md` Decision 2. Pure RN: only `<View>` and `<Text>` from `react-native`, `ThemedView` from `@/components/themed-view`. Renders one `<View>` child per `DataPoint`:
  - `type === 'bar'`: full-height bar; `backgroundColor: tint.value`; if `gradientEnabled`, mount a second overlay `<View>` child with reduced opacity to fake the vertical gradient.
  - `type === 'line'` / `'area'`: a thin bar plus a top-stripe `<View>` child; `backgroundColor: tint.value` on the stripe.
  - `type === 'point'`: a small dot (`width=height=8`, borderRadius=4); `backgroundColor: tint.value`.
  Bar widths/heights tied to `data` (single-value dynamic style values — permitted by constitution IV). Calls `LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)` on each render that changes child count or heights. Ignores `selectedIndex` and `onSelect`. Honors `minHeight` (default 300). `accessibilityLabel` on root `<View>`: `` `Chart with ${data.length} values, currently in ${type[0].toUpperCase()+type.slice(1)} mode` `` (FR-037). MUST NOT import `@expo/ui/swift-ui`, MUST NOT call `requireNativeViewManager` (FR-031). Acceptance: T021 passes.
- [ ] T026 [P] [US5] Implement `src/modules/swift-charts-lab/components/ChartView.web.tsx`. Identical body to T025 (the fallback shape is platform-agnostic; `LayoutAnimation` is a no-op on web — acceptable per spec). The implementation MAY simply `export { ChartView } from './ChartView.android';` ONLY IF this still satisfies the FR-031 source-grep test in T024 — i.e. the `.web.tsx` file's transitive imports do not pull in any `@expo/ui/swift-ui` symbol. The safer path is to duplicate the body. Acceptance: T022 passes.
- [ ] T027 [P] [US5] Implement `src/modules/swift-charts-lab/screen.android.tsx`. Same composition as `screen.tsx` (T010 + T014 + T018 + T020) but with an additional banner row at the top: `<ThemedView>` containing `<ThemedText>` with the copy `"This module uses Apple's Swift Charts on iOS 16+; Android sees a React Native fallback. Mark selection is available on iOS 16+ only."`. The screen MUST NOT import `@expo/ui/swift-ui` or `requireNativeViewManager` (FR-031). The `<ChartView />` import resolves to `./components/ChartView` (which resolves to `.android.tsx` on Android via the bundler); never write a `.android` filename in the import — let the bundler pick. Always pass `selectedIndex={null}` and omit `onSelect` (Decision 5). Default-export `SwiftChartsLabScreen`. Acceptance: T023 passes.
- [ ] T028 [P] [US5] Implement `src/modules/swift-charts-lab/screen.web.tsx`. Mirror T027 line-for-line; the only difference is the file extension. Same banner, same composition, same FR-031 cleanliness. Acceptance: T024 passes.

**Checkpoint**: All five platforms (iOS 16+, Android, Web, plus iOS < 16 via the registry's `minIOS` gate) have a working surface. Manifest + registry remain.

---

## Phase 8: Manifest

**Purpose**: Default-export the `ModuleManifest` so `src/modules/registry.ts` can append a single entry. Mirrors `src/modules/sensors-playground/index.tsx` shape, plus a `minIOS: '16.0'` field (FR-001 / `contracts/module-manifest.md`).

- [ ] T029 Write `test/unit/modules/swift-charts-lab/manifest.test.ts` per `contracts/module-manifest.md` § "Invariants enforced by tests". Import the default export from `src/modules/swift-charts-lab/index.tsx`. Assert:
  - `id === 'swift-charts-lab'` AND matches `/^[a-z][a-z0-9-]*$/`;
  - `platforms` deep-equals (or `arrayContaining`) `['ios','android','web']`;
  - `minIOS === '16.0'` (FR-001);
  - `title` is non-empty; `description` is non-empty; `icon.ios` is non-empty; `icon.fallback` is non-empty;
  - `typeof manifest.render === 'function'` and calling it returns a React element;
  - `import { MODULES } from '@/modules/registry'; expect(MODULES).toContain(manifest)` — the registry-inclusion assertion (per `contracts/module-manifest.md`). Acceptance: file exists; FAILS — manifest missing.
- [ ] T030 Implement `src/modules/swift-charts-lab/index.tsx` per `contracts/module-manifest.md` § "Concrete shape". Default-export `ModuleManifest` `{ id: 'swift-charts-lab', title: 'Swift Charts Lab', description: 'Real Apple Charts on iOS 16+ with a React Native fallback', icon: { ios: 'chart.xyaxis.line', fallback: '📊' }, platforms: ['ios','android','web'], minIOS: '16.0', render: () => <SwiftChartsLabScreen /> }` (use the exact field names defined in `src/modules/types.ts`). Imports `SwiftChartsLabScreen` from `./screen` (the bundler picks the right platform variant). The `MODULES.toContain(manifest)` assertion in T029 will FAIL until T031 lands — that is intentional (the test exercises the integration). Acceptance: T029 passes EXCEPT the `MODULES.toContain` case (which passes after T031).

---

## Phase 9: Registry wiring

**Purpose**: Surface the module in the spec 006 grid via the one-import-one-entry contract (SC-006 / SC-010 / `src/modules/registry.ts` header).

- [ ] T031 Edit `src/modules/registry.ts`: add ONE import `import swiftChartsLab from './swift-charts-lab';` (after the `sensorsPlayground` import) and append ONE entry `swiftChartsLab,` to the `MODULES` array (after the `sensorsPlayground,` entry). No other shell file modified. Acceptance: the global `test/unit/modules/manifest.test.ts` invariants suite still passes; `test/unit/modules/registry.test.ts` reports the new module appearing in source order; T029's `MODULES.toContain(manifest)` case now passes; `git diff src/modules/registry.ts` is exactly +2 lines (1 import + 1 entry, plus formatter-required commas).

---

## Phase 10: Swift native `ChartView` extension (on-device verification only)

**Purpose**: Land the Swift body that `ChartView.tsx` (T009) bridges to. These files are NOT unit-tested on the Windows host (Constitution V exemption: native bodies are not Jest-reachable); they are verified manually per `quickstart.md`. They DO need to compile under EAS Build / `npx expo run:ios` so the dev client renders the real Apple Charts marks.

- [ ] T032 [P] Implement `src/modules/swift-charts-lab/native/ios/ChartViewProps.swift` per `research.md` Decision 1. A `UIBaseViewProps` subclass exposing the JS-passed props as observed properties: `type: String` (`"line"` | `"bar"` | `"area"` | `"point"`), `data: [Datum]` where `Datum: Decodable { let month: String; let value: Double }`, `tint: String` (hex), `gradientEnabled: Bool`, `selectedIndex: Int?`. Acceptance: file compiles under `xcodebuild` / EAS Build; on-device verification deferred to `quickstart.md` §1.
- [ ] T033 [P] Implement `src/modules/swift-charts-lab/native/ios/ChartView.swift` per `research.md` Decision 1 and `quickstart.md` §1. A `ChartView: ExpoView` whose body is a SwiftUI `Chart { ForEach(props.data, id: \.month) { d in switch props.type { case "line": LineMark(x: .value("Month", d.month), y: .value("Value", d.value)); case "bar": BarMark(...); case "area": AreaMark(...); case "point": PointMark(...) } } }.foregroundStyle(Color(hex: props.tint))` (with `.linearGradient(...)` applied when `props.gradientEnabled` is true and the type is line / area). Wires the `.chartXSelection(value: $selectedIndex)` modifier on iOS 17+ (gate via `if #available(iOS 17, *)`) and a `DragGesture`+`.chartPlotStyle` fallback on iOS 16 to fire `onSelect` events back to JS via `EventDispatcher`. Acceptance: file compiles; on-device verification deferred to `quickstart.md` §1, §2, §3.
- [ ] T034 [P] Implement `src/modules/swift-charts-lab/native/ios/ChartViewModule.swift` per `research.md` Decision 1. Registers the view as `SwiftChartsLabChartView` so JS's `requireNativeViewManager('SwiftChartsLabChartView')` (T009) resolves it. Defines the `Events("onSelect")` declaration and the `Prop("type" / "data" / "tint" / "gradientEnabled" / "selectedIndex")` bindings. Acceptance: file compiles; on-device verification deferred to `quickstart.md` §1; the JS `ChartView.test.tsx` (T006) covers the prop-shape contract via mocks.
- [ ] T035 Document the on-device verification surface for the Swift extension in a short comment block at the top of `src/modules/swift-charts-lab/native/ios/ChartView.swift` referencing `specs/012-swift-charts-playground/quickstart.md` §1, §2, §3, §5, §6. Acceptance: comment lands; `quickstart.md` already exists and the cross-link resolves.

---

## Phase 11: Polish & Quality Gate

- [ ] T036 Run `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm test` and iterate until all four are green with zero new warnings (SC-008, SC-011, FR-043). Acceptance: each command exits 0; `pnpm test --testPathPattern swift-charts-lab` reports all 11 swift-charts-lab test files green; full suite still green.
- [ ] T037 [P] Cleanup pass on `src/modules/swift-charts-lab/`: confirm no `Platform.OS` outside the implicit file-split (FR-031 / constitution III), no inline style objects defined outside `StyleSheet.create`, no `any`, no unused exports, all imports use the `@/` alias (constitution III/IV/VI). Run `pnpm lint --max-warnings 0` and `pnpm typecheck` again to confirm. Acceptance: zero warnings/errors; diff is whitespace-only or trivial naming fixes.
- [ ] T038 [P] Documentation touch-ups: cross-link `specs/012-swift-charts-playground/quickstart.md` from `README.md` "Modules" list (if such a list exists; otherwise skip silently); confirm `.github/copilot-instructions.md` SPECKIT block points at this feature's plan if it tracks active features. Acceptance: links resolve; no other docs modified.
- [ ] T039 Final commit on `012-swift-charts-playground` summarising the feature; then run `quickstart.md` §1–§9 on at least one iPhone running iOS 16+, one Android device, and one desktop web browser tab. Record any deviations as follow-ups in the PR description. Acceptance: commit pushed; smoke matrix recorded; SC-001 (first chart < 5 s on iOS 16+), SC-002 (chart-type switch animates), SC-003 (mark mutations < 1 s), SC-005 (tint transition < 300 ms), SC-007 (clean unmount), SC-008 (no console warnings on Android/Web), SC-010 (additive-only diff outside the module), SC-011 (`pnpm check` green) confirmed live.

---

## Dependencies & Execution Order

### Phase order

1. **Phase 1 Setup** (T001–T002) — both `[P]`.
2. **Phase 2 Foundational** (T003–T004) — depends on T001. `T003 → T004`. **Blocks all US phases.**
3. **Phase 3 US1** (T005–T010) — depends on Phase 2. Tests `T005 ‖ T006 ‖ T007` first; impls `T008 ‖ T009`; then `T010` (screen) which transitively requires stub or real `DataControls` / `TintPicker` — see note in T010.
4. **Phase 4 US2** (T011–T014) — depends on Phase 3 (extends `screen.test.tsx`, wires `screen.tsx`). `T011 ‖ T012` first; then `T013`; then `T014`.
5. **Phase 5 US3** (T015–T018) — depends on Phase 3 (extends `screen.test.tsx`, wires `screen.tsx`). May land in parallel with Phase 4 if both teams coordinate edits to `screen.tsx` / `screen.test.tsx`. `T015 ‖ T016` first; then `T017`; then `T018`.
6. **Phase 6 US4** (T019–T020) — depends on Phase 3 (`ChartView.tsx` from T009 must already forward `onSelect`). `T019` first; then `T020`.
7. **Phase 7 US5** (T021–T028) — depends on Phase 2 only (each fallback file is self-contained against `data.ts` types). May start fully in parallel with Phases 3–6. Per-pair ordering is `test → impl`. `T021 ‖ T022 ‖ T023 ‖ T024` first; then `T025 ‖ T026 ‖ T027 ‖ T028`.
8. **Phase 8 Manifest** (T029–T030) — depends on T010 + T027 + T028 (the `render` callable resolves to all three platform variants). `T029 → T030`.
9. **Phase 9 Registry** (T031) — depends on T030.
10. **Phase 10 Swift native** (T032–T035) — depends only on the contract defined in `contracts/chart-view.md` and on T009 having pinned the native view name `'SwiftChartsLabChartView'`. May start in parallel with any phase from US5 onward; verified on device after T036 / T039.
11. **Phase 11 Polish** (T036–T039) — T036 depends on everything above; T037 ‖ T038 alongside T036; T039 last.

### Parallelisable sets

- Phase 1: `T001 ‖ T002`.
- Phase 2: strictly sequential `T003 → T004` (single file).
- US1 tests: `T005 ‖ T006 ‖ T007`. US1 impls (after their red tests): `T008 ‖ T009` (T010 blocks on stubs / US3 controls — see Test-before-implementation invariant).
- US2: `T011 ‖ T012` (different files; T012 only appends, doesn't conflict with T011's new file). `T013` then `T014`.
- US3: `T015 ‖ T016` (same parallel pattern as US2). `T017` then `T018`.
- US4: `T019 → T020`.
- US5 tests: `T021 ‖ T022 ‖ T023 ‖ T024`. US5 impls: `T025 ‖ T026 ‖ T027 ‖ T028`.
- Across stories: US1, US2, US3, US4, US5 may run in parallel after Phase 2 lands, with the only contention being concurrent edits to `screen.tsx` / `screen.test.tsx` (US1–US4 share these files; US5 owns the `.android` / `.web` siblings exclusively).
- Phase 10 Swift: `T032 ‖ T033 ‖ T034`; `T035` last.
- Polish: `T037 ‖ T038` alongside `T036`.

### Test-before-implementation invariant

| Implementation task | Must-fail-first test task |
|---|---|
| T004 data.ts | T003 |
| T008 ChartTypePicker.tsx | T005 |
| T009 ChartView.tsx (iOS) | T006 |
| T010 screen.tsx (iOS) | T007 |
| T013 DataControls.tsx | T011 |
| T014 screen.tsx (US2 wiring) | T012 |
| T017 TintPicker.tsx | T015 |
| T018 screen.tsx (US3 wiring) | T016 |
| T020 screen.tsx (US4 wiring) | T019 |
| T025 ChartView.android.tsx | T021 |
| T026 ChartView.web.tsx | T022 |
| T027 screen.android.tsx | T023 |
| T028 screen.web.tsx | T024 |
| T030 index.tsx (manifest) | T029 |
| T031 registry.ts edit | T029 (re-runs `MODULES.toContain` case) |
| T032 / T033 / T034 Swift native | (none — on-device verification per `quickstart.md`; the TS contract is covered by T006) |

---

## Parallel Example: kicking off after Setup

```bash
# Phase 1 — both immediately:
Task: "T001 scaffold module + test folders"
Task: "T002 verify @expo/ui already installed"

# Phase 2 — strict sequence:
Task: "T003 write data.test.ts (must FAIL)"
Task: "T004 implement data.ts (T003 → green)"

# After Phase 2 green — open every US phase in parallel:
# US1 tests
Task: "T005 write ChartTypePicker.test.tsx"
Task: "T006 write ChartView.test.tsx (iOS)"
Task: "T007 write screen.test.tsx (iOS)"
# US5 tests (independent of US1–US4 files)
Task: "T021 write ChartView.android.test.tsx"
Task: "T022 write ChartView.web.test.tsx"
Task: "T023 write screen.android.test.tsx"
Task: "T024 write screen.web.test.tsx"

# Drive US1 tests green:
Task: "T008 implement ChartTypePicker.tsx"
Task: "T009 implement ChartView.tsx (iOS)"
# Then T010 with stubs for DataControls / TintPicker

# Drive US5 tests green in parallel:
Task: "T025 implement ChartView.android.tsx"
Task: "T026 implement ChartView.web.tsx"
Task: "T027 implement screen.android.tsx"
Task: "T028 implement screen.web.tsx"

# Phases 4 / 5 / 6 in series on screen.tsx:
Task: "T011 / T013  DataControls test + impl"
Task: "T012 / T014  screen.test.tsx US2 wiring + screen.tsx US2 wiring"
Task: "T015 / T017  TintPicker test + impl"
Task: "T016 / T018  screen.test.tsx US3 wiring + screen.tsx US3 wiring"
Task: "T019 / T020  screen.test.tsx US4 wiring + screen.tsx US4 wiring"

# Phase 8 / 9:
Task: "T029 write manifest.test.ts"
Task: "T030 implement index.tsx"
Task: "T031 edit registry.ts (+1 import +1 entry)"

# Phase 10 (Swift, on-device verification only):
Task: "T032 ‖ T033 ‖ T034 Swift native files"
Task: "T035 cross-link quickstart in ChartView.swift header"

# Phase 11:
Task: "T036 pnpm check (format + lint + typecheck + test)"
Task: "T037 cleanup pass"
Task: "T038 docs touch-ups"
Task: "T039 final commit + on-device smoke per quickstart §1–§9"
```

---

## Implementation strategy

- **MVP** = US1 (T001–T010): a real Swift Charts line chart on iOS 16+ with a working chart-type picker. Ship-able as soon as the registry wiring (T031) lands behind US1, but per the dependency graph it is cheaper to land US1–US5 together since the controls share `screen.tsx`.
- **Recommended cut points**: (1) US1 + US5 fallback alone covers the cross-platform parity gate (every platform renders something) — useful for an early demo. (2) US1 + US2 covers the dataset-mutation story on iOS 16+. (3) US3 + US4 layer styling + selection on top. (4) Phase 10 Swift native files are required for the iOS 16+ path to render real Apple Charts; without them, the iOS variant renders an empty `<Host>` (acceptable for early review).
- **Parallelisation budget**: with 3 implementers, the critical path is `T003 → T004 → T010 → T014 → T018 → T020 → T029 → T030 → T031 → T036`; US5 (T021–T028) and the Swift native phase (T032–T035) run fully in parallel along that path.
- **Quality gate**: `pnpm check` (T036) MUST exit 0 before T039's on-device pass; the on-device pass MUST follow `quickstart.md` end-to-end before opening the PR.
