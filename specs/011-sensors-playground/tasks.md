---
description: "Task list — Sensors Playground (spec 011)"
---

# Tasks: Sensors Playground

**Input**: Design documents from `/specs/011-sensors-playground/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Test-first is REQUIRED for this feature (Constitution V; plan.md § Constitution Check). Every implementation task is preceded by its unit test task. The test file inventory matches `plan.md` § Project Structure (1 manifest + 1 screen + 1 ring-buffer + 1 hook + 4 components + 4 cards = 12 test files; `RotationIndicator.tsx` ships without a dedicated test per plan.md).

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Maps to user stories from spec.md (US1 = Accelerometer MVP, US2 = Gyro/Mag/DeviceMotion cards, US3 = sample-rate + Start All / Stop All, US4 = cross-platform availability + permissions; US4 is exercised inside US1/US2 tests via the `useSensorStream` mock and the `PermissionNotice` component built in Phase 2)
- All paths are repo-relative

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the only new runtime dependency (`expo-sensors`), wire its config plugin into `app.json` for `NSMotionUsageDescription`, and scaffold module + test folders. No other deps are added.

- [X] T001 Run `npx expo install expo-sensors` from the repo root and commit the lockfile + manifest update in a single "chore(011): add expo-sensors" commit. Acceptance: `pnpm install` is clean; `pnpm list expo-sensors` reports an SDK 55–compatible version (~55.0.x); diff touches only `package.json` + `pnpm-lock.yaml`; no other deps changed (SC-010).
- [X] T002 [P] Edit `app.json` to add the `expo-sensors` config plugin entry with the project's standard motion-usage copy (e.g. `"This app reads motion sensors to demonstrate the Sensors Playground."`) so iOS gets `NSMotionUsageDescription` injected on prebuild (research.md Decision 5). Acceptance: `app.json` plugins array contains `["expo-sensors", { "motionPermission": "..." }]`; `pnpm typecheck` still passes; no other config changes.
- [X] T003 [P] Create empty module folders `src/modules/sensors-playground/`, `src/modules/sensors-playground/cards/`, `src/modules/sensors-playground/components/`, `src/modules/sensors-playground/hooks/` and matching test folders under `test/unit/modules/sensors-playground/{cards,components,hooks}/`. Acceptance: directories exist; `git status` shows them tracked (with `.gitkeep` if your tooling drops empty dirs); nothing else changed.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Land the four pieces every card depends on — the pure ring buffer (the visualization data source), the `useSensorStream` seam (the only file that imports `expo-sensors`; FR-040), the shared `SampleRatePicker` (used by all four cards; spec US3), and the shared `PermissionNotice` (used by all four cards; spec US4). Tests for each pair are written FIRST and must FAIL before the implementation lands.

**⚠️ CRITICAL**: No US-tagged task may begin until this phase is green. The hook is the single mock seam consumed by every card test downstream.

- [X] T004 [P] Write `test/unit/modules/sensors-playground/ring-buffer.test.ts` per `contracts/ring-buffer.md`: cover (a) `push` then `length` reflects count up to capacity, (b) `snapshot(n)` returns the last n samples in insertion order with newest last, (c) `snapshot(n > length)` returns whatever exists (no padding), (d) the 61st `push` evicts the oldest sample (capacity 60), (e) `clear()` resets length to 0, (f) buffer holds plain numeric tuples without copying on read (assert reference identity is NOT promised — caller must treat as immutable). Acceptance: file exists; FAILS — `ring-buffer` missing.
- [X] T005 Implement `src/modules/sensors-playground/ring-buffer.ts`: a tiny class or factory exposing `push(sample)`, `snapshot(n)`, `length`, `clear()`. Backed by a fixed-size `Array` + write index (no allocations on `push`). No `any`. Acceptance: T004 passes.
- [X] T006 [P] Write `test/unit/modules/sensors-playground/hooks/useSensorStream.test.tsx` per `contracts/sensor-stream-hook.md` § "Test invariants": at top-of-file `jest.mock('expo-sensors', () => ({ Accelerometer: { isAvailableAsync: jest.fn(), getPermissionsAsync: jest.fn(), requestPermissionsAsync: jest.fn(), setUpdateInterval: jest.fn(), addListener: jest.fn(() => ({ remove: jest.fn() })) } /* …same shape for Gyroscope, Magnetometer, DeviceMotion */ }))`. Cover: (a) sensor available + no permission needed → `start()` calls `addListener` once and `setUpdateInterval` with `1000/rate` ms, (b) `isAvailableAsync` returns `false` → `isAvailable === false` and `start()` is a no-op, (c) `isAvailableAsync` throws → same as (b), no unhandled rejection, (d) permission `undetermined` → `start()` calls `requestPermissionsAsync`; granted attaches listener; denied is a no-op, (e) rate change while running calls `setUpdateInterval` again WITHOUT re-calling `addListener`, (f) unmount calls `subscription.remove()` and never calls deprecated `removeAllListeners` (research.md, FR-035). Acceptance: file exists; FAILS — hook missing.
- [X] T007 Implement `src/modules/sensors-playground/hooks/useSensorStream.ts`: generic seam `useSensorStream(sensor, rate, capacity)` returning `{ isAvailable, permission, isRunning, start, stop, snapshot }`. Backed by a `useRef<RingBuffer>` (T005) so per-sample updates never trigger re-render; consumers call `snapshot(n)` from a `requestAnimationFrame`/`setInterval` paint loop owned by the consuming card. Wraps every `expo-sensors` call in try/catch (FR-035). Uses `subscription.remove()` per subscription — never `removeAllListeners()` (deprecated). Acceptance: T006 passes.
- [X] T008 [P] Write `test/unit/modules/sensors-playground/components/SampleRatePicker.test.tsx`: render `<SampleRatePicker value={60} onChange={fn} />`; assert three segments labelled `30 Hz`, `60 Hz`, `120 Hz` are present; assert the `60 Hz` segment is visually selected (testID or `accessibilityState.selected`); fire press on the `120 Hz` segment; assert `fn` called once with `120`. Acceptance: file exists; FAILS — picker missing.
- [X] T009 [P] Implement `src/modules/sensors-playground/components/SampleRatePicker.tsx`: themed segmented control built from three `Pressable`s wrapped in a `ThemedView` row; `value: 30 | 60 | 120`, `onChange: (rate) => void`. Default visual emphasis on the current value. `StyleSheet.create`, `Spacing` only; no inline style objects defined outside StyleSheet. Acceptance: T008 passes.
- [X] T010 [P] Write `test/unit/modules/sensors-playground/components/PermissionNotice.test.tsx`: cover three render modes — (a) `kind='unsupported'` renders the literal string `Not supported on this platform` and no button, (b) `kind='denied'` renders `Permission denied` plus an `Open Settings` `Pressable` whose press calls a mock for `Linking.openSettings`, (c) `kind='idle'` renders nothing (returns `null`). Use `jest.mock('react-native/Libraries/Linking/Linking', () => ({ openSettings: jest.fn() }))` (or equivalent module path used elsewhere in the repo) and assert it was called once on press. Acceptance: file exists; FAILS — notice missing.
- [X] T011 [P] Implement `src/modules/sensors-playground/components/PermissionNotice.tsx`: themed inline notice; `props: { kind: 'idle' | 'unsupported' | 'denied' }`. On `'denied'` the `Open Settings` press calls `Linking.openSettings()`. `ThemedText` / `ThemedView` only; `StyleSheet.create` + `Spacing`. Acceptance: T010 passes.

**Checkpoint**: Ring buffer, hook seam, sample-rate picker, and permission notice are all green. Card phases (US1, US2) and screen phase (US3) may now begin in parallel — every per-card test mocks `@/modules/sensors-playground/hooks/useSensorStream` and feeds synthetic samples through the returned `snapshot()` shape.

---

## Phase 3: User Story 1 — Feel the accelerometer move on screen (Priority: P1) 🎯 MVP

**Goal**: A user lands on `<SensorsPlaygroundScreen />`, presses the Accelerometer card's Start, tilts the device, and watches the three numeric readouts update at 3-decimal precision while the BarChart renders the last 30 samples per axis as a 3-row sliding window. Sample-rate picker (30/60/120 Hz) and Start/Stop are wired through `useSensorStream` (mocked in tests).

**Independent Test**: RNTL render of `<AccelerometerCard />` with `useSensorStream` mocked to return a controllable `snapshot()` and a synthetic `start()` that pushes a sequence of `{x,y,z}` samples. Assert (a) three readout cells render the latest sample at 3-decimal precision, (b) the BarChart renders three rows with widths proportional to the most-recent 30 samples, (c) toggling the sample-rate segment forwards `30|60|120` to the hook, (d) Start → Stop toggles the hook's `start()`/`stop()`.

### Tests for User Story 1 (write FIRST, must FAIL before implementation)

- [X] T012 [P] [US1] Write `test/unit/modules/sensors-playground/components/BarChart.test.tsx`: render `<BarChart samples={…60 mocked tuples…} window={30} />`; assert the chart renders exactly 3 rows (one per axis); assert each row's bar width is proportional to the absolute value of the last 30 samples on that axis (assert via `style.width` snapshot of just the dynamic field, normalized to a 0..100 scale); assert that with an empty buffer the chart renders 3 rows of zero-width bars (no crash). Acceptance: file exists; FAILS — chart missing.
- [X] T013 [P] [US1] Write `test/unit/modules/sensors-playground/cards/AccelerometerCard.test.tsx`: `jest.mock('@/modules/sensors-playground/hooks/useSensorStream', () => ({ useSensorStream: jest.fn() }))`; configure the mock to return `{ isAvailable: true, permission: 'granted', isRunning: false, start: jest.fn(), stop: jest.fn(), snapshot: () => [{x:0.1,y:0.2,z:0.98}, …] }`. Render `<AccelerometerCard />`. Assert (a) title `Accelerometer` present, (b) three readout cells display `0.100`, `0.200`, `0.980` (3-decimal precision), (c) `<SampleRatePicker />` mounts with default `60`, (d) pressing the `120 Hz` segment re-renders the hook with `rate === 120`, (e) pressing `Start` calls the mocked `start()`, (f) when the mock returns `isRunning: true`, the button label flips to `Stop`, (g) `<BarChart />` mounts and receives the `snapshot()` array. Acceptance: file exists; FAILS — card missing.

### Implementation for User Story 1

- [X] T014 [US1] Implement `src/modules/sensors-playground/components/BarChart.tsx`: pure presentational component that takes `samples: {x:number,y:number,z:number}[]` and a `window: number`; renders 3 rows of `ThemedView` bars whose width is `Math.min(100, Math.abs(value) * scale) + '%'` (single-value dynamic style — permitted per constitution IV). `StyleSheet.create`, `Spacing` only. No `Animated`. Acceptance: T012 passes.
- [X] T015 [US1] Implement `src/modules/sensors-playground/cards/AccelerometerCard.tsx`: composes `<ThemedView>` card with title, three readout cells (3-decimal precision via `value.toFixed(3)`), `<SampleRatePicker />`, Start/Stop `Pressable`, `<PermissionNotice />` (driven by hook's `isAvailable` + `permission`), and `<BarChart />`. Owns local `useState` for `rate` (default `60`) and a `requestAnimationFrame`/`setInterval`-driven re-render that calls `useSensorStream`'s `snapshot(30)` for the chart and `snapshot(1)` for the readouts. Calls `useSensorStream(Accelerometer, rate, 60)`. No `any`. Acceptance: T013 passes.

**Checkpoint**: Accelerometer card works end-to-end against the mocked hook. The MVP is shippable: gyroscope/magnetometer/devicemotion land in US2.

---

## Phase 4: User Story 2 — Visualize gyroscope, magnetometer, and device motion (Priority: P1)

**Goal**: The screen now stacks four cards. Gyroscope shows x/y/z + a `RotationIndicator` (SF Symbol on iOS 17+, fallback glyph elsewhere). Magnetometer shows x/y/z + a `CompassNeedle` rotated to the heading. DeviceMotion shows pitch/roll/yaw in degrees + a `SpiritLevel` whose inner disc offsets from pitch/roll. Each card uses the same `useSensorStream` seam as US1 and the same `<SampleRatePicker />` + `<PermissionNotice />` foundations.

**Independent Test**: For each of the three cards, RNTL render with `useSensorStream` mocked. Assert title, three readouts at 3-decimal precision (DeviceMotion in degrees), sample-rate picker default 60, Start/Stop toggling, and that the matching visualization component receives the latest snapshot — compass needle rotation reflects `atan2(y, x)`, spirit-level inner disc offsets are bounded, gyroscope's `RotationIndicator` mounts.

### Tests for User Story 2 (write FIRST, must FAIL before implementation)

- [X] T016 [P] [US2] Write `test/unit/modules/sensors-playground/components/CompassNeedle.test.tsx`: render `<CompassNeedle x={1} y={0} />`; assert the needle's `transform` style contains `rotate('0deg')` (or near-zero per `atan2(0,1)`); render `<CompassNeedle x={0} y={1} />`; assert `rotate('90deg')`; render with near-zero magnitude (`x=0.0001, y=0.0001`); assert the previous angle is preserved (no NaN, no jitter to 0). Acceptance: file exists; FAILS.
- [X] T017 [P] [US2] Write `test/unit/modules/sensors-playground/components/SpiritLevel.test.tsx`: render `<SpiritLevel pitch={0} roll={0} />`; assert inner disc translate is `{0, 0}`; render with pitch/roll exceeding the saturation bound (e.g. `pitch=π/2, roll=π/2`); assert the inner-disc translate values are clamped to the outer-ring radius (no overflow). Acceptance: file exists; FAILS.
- [X] T018 [P] [US2] Write `test/unit/modules/sensors-playground/cards/GyroscopeCard.test.tsx`: same `useSensorStream` mock pattern as T013; assert title `Gyroscope`, three readouts at 3-decimal precision, sample-rate picker default 60, Start/Stop toggling, `<RotationIndicator />` mounts, integrated yaw (research.md Decision 4) advances when synthetic samples are pushed. Acceptance: file exists; FAILS.
- [X] T019 [P] [US2] Write `test/unit/modules/sensors-playground/cards/MagnetometerCard.test.tsx`: same mock pattern; assert title `Magnetometer`, three readouts at 3-decimal precision, sample-rate picker default 60, Start/Stop toggling, `<CompassNeedle />` mounts and receives the latest `{x,y}`; assert that when the mock reports `permission === 'denied'`, the `<PermissionNotice kind="denied" />` renders with the `Open Settings` button (FR-030, US4). Acceptance: file exists; FAILS.
- [X] T020 [P] [US2] Write `test/unit/modules/sensors-playground/cards/DeviceMotionCard.test.tsx`: same mock pattern but the synthetic samples are `{ rotation: { alpha, beta, gamma } }` in radians; assert title `Device Motion`, three readouts at 3-decimal precision in **degrees** (i.e. radians × 180/π, then `.toFixed(3)`), labelled pitch / roll / yaw (research.md note: `beta`→pitch, `gamma`→roll, `alpha`→yaw), `<SpiritLevel />` mounts and receives pitch/roll. Acceptance: file exists; FAILS.

### Implementation for User Story 2

- [X] T021 [P] [US2] Implement `src/modules/sensors-playground/components/CompassNeedle.tsx`: pure presentational; computes `angle = atan2(y, x)` in degrees; renders a `ThemedView` ring with an inner `ThemedView` needle whose `transform: [{ rotate: `${angle}deg` }]` is the only dynamic style value (permitted per constitution IV). Holds previous angle via `useRef` when input magnitude < ε to avoid jitter. Acceptance: T016 passes.
- [X] T022 [P] [US2] Implement `src/modules/sensors-playground/components/SpiritLevel.tsx`: pure presentational; takes `pitch`, `roll` (radians); inner disc `transform: [{ translateX }, { translateY }]` clamped to the outer-ring radius. `StyleSheet.create`, `Spacing`. Acceptance: T017 passes.
- [X] T023 [P] [US2] Implement `src/modules/sensors-playground/components/RotationIndicator.tsx`: a small visualization that on iOS 17+ uses an `expo-symbols` SF Symbol (e.g. `arrow.triangle.2.circlepath`) rotated by integrated yaw, and elsewhere falls back to a themed glyph + numeric readout. Inline `Platform.OS` check is acceptable here per constitution III (single-value difference). No dedicated unit test required (plan.md § "Project Structure" omits one); behavior is covered by `GyroscopeCard.test.tsx` mounting it.
- [X] T024 [P] [US2] Implement `src/modules/sensors-playground/cards/GyroscopeCard.tsx`: same shape as `AccelerometerCard.tsx` but the visualization is `<RotationIndicator yaw={integratedYaw} />`. Integrates yaw across `snapshot()` deltas using a `useRef<number>` accumulator (research.md Decision 4). Calls `useSensorStream(Gyroscope, rate, 60)`. Acceptance: T018 passes.
- [X] T025 [P] [US2] Implement `src/modules/sensors-playground/cards/MagnetometerCard.tsx`: same shape; visualization is `<CompassNeedle x={latest.x} y={latest.y} />`. Calls `useSensorStream(Magnetometer, rate, 60)`. When the hook reports `isAvailable === false` (Web), renders `<PermissionNotice kind="unsupported" />` and disables Start (FR-030). When `permission === 'denied'`, renders `<PermissionNotice kind="denied" />` (FR-030, US4). Acceptance: T019 passes.
- [X] T026 [P] [US2] Implement `src/modules/sensors-playground/cards/DeviceMotionCard.tsx`: same shape; readouts are pitch/roll/yaw in degrees; visualization is `<SpiritLevel pitch={latest.beta} roll={latest.gamma} />`. Calls `useSensorStream(DeviceMotion, rate, 60)`. Acceptance: T020 passes.

**Checkpoint**: All four cards work end-to-end against the mocked hook. The screen shell + Start All / Stop All event bus land in US3.

---

## Phase 5: User Story 3 — Choose sample rate and use Start All / Stop All (Priority: P2)

**Goal**: A user opens the module, taps `Start All`, and every available card begins streaming at its current sample rate. Tapping `Stop All` stops them all. The header label flips between `Start All` and `Stop All` based on whether any card is currently running. Cards whose sensor is unavailable are skipped silently by the global toggle (their per-card Start remains disabled with the `unsupported` notice).

**Independent Test**: RNTL render of `<SensorsPlaygroundScreen />` with each card mocked (or with `useSensorStream` mocked four times — one per sensor). Assert (a) the four cards render in order Accelerometer → Gyroscope → Magnetometer → DeviceMotion, (b) tapping the header `Start All` causes each available card to receive the global "start" event (asserted by mocked `start()` call counts), (c) tapping `Stop All` causes each running card to receive the global "stop" event, (d) header label transitions `Start All ↔ Stop All` on state changes. The "event bus" is implementation-internal (a small `useRef<Set<() => void>>` exposed via context, OR a tiny `EventEmitter` colocated in `screen.tsx`); the test asserts the observable behaviour, not the bus shape.

### Tests for User Story 3 (write FIRST, must FAIL before implementation)

- [X] T027 [US3] Write `test/unit/modules/sensors-playground/screen.test.tsx`: at top-of-file `jest.mock('@/modules/sensors-playground/hooks/useSensorStream', () => { const mocks = { Accelerometer: { start: jest.fn(), stop: jest.fn(), isAvailable: true, permission: 'granted', isRunning: false, snapshot: () => [] }, /* …same for the other three… */ }; return { useSensorStream: jest.fn((sensor) => mocks[sensor.name ?? 'Accelerometer']), __mocks: mocks }; })`. Render `<SensorsPlaygroundScreen />`. Assert (a) header text `Sensors Playground` (or whatever spec FR uses) + a single `Start All` button, (b) cards render in canonical order Accelerometer → Gyroscope → Magnetometer → DeviceMotion (FR-021), (c) press `Start All`; assert each mocked card's `start()` was called once, (d) header label flips to `Stop All`, (e) press `Stop All`; assert each `stop()` was called once, (f) when the Magnetometer mock reports `isAvailable: false`, `Start All` does NOT call its `start()` (skipped silently). Acceptance: file exists; FAILS — screen missing.

### Implementation for User Story 3

- [X] T028 [US3] Implement `src/modules/sensors-playground/screen.tsx`: a vertical `ScrollView` of `ThemedView` sections. Header row contains a `ThemedText` title and a single `Pressable` whose label is derived from `anyRunning` state. A small in-file event bus (a `useRef<Set<{ start: () => void; stop: () => void; isAvailable: boolean }>>` exposed via `React.createContext`) lets each card register itself on mount and de-register on unmount; `Start All` iterates the set and calls `start()` on each registered card whose `isAvailable === true`. Stacks `<AccelerometerCard />`, `<GyroscopeCard />`, `<MagnetometerCard />`, `<DeviceMotionCard />` in that order (FR-021). `StyleSheet.create`, `Spacing`, `ThemedText`, `ThemedView` only. No `Platform.OS`. Acceptance: T027 passes.

**Checkpoint**: Screen wires the four cards together with the global toggle. US4 coverage (cross-platform availability + permissions) is implicit — exercised by `useSensorStream.test.tsx` (T006), `PermissionNotice.test.tsx` (T010), `MagnetometerCard.test.tsx` (T019, the unsupported + denied paths). Manifest + registry remain.

---

## Phase 6: Manifest

**Purpose**: Default-export the `ModuleManifest` so `src/modules/registry.ts` can append a single entry. Mirrors `src/modules/swiftui-interop/index.tsx` shape.

- [X] T029 Write `test/unit/modules/sensors-playground/manifest.test.ts`: import default export from `src/modules/sensors-playground/index.tsx`; assert `id === 'sensors-playground'`, `platforms` deep-equals `['ios','android','web']` (FR-001), `title` is a non-empty string, `render` is a function returning a React element. Acceptance: file exists; FAILS — manifest missing.
- [X] T030 Implement `src/modules/sensors-playground/index.tsx`: default-export `ModuleManifest` `{ id: 'sensors-playground', title: 'Sensors Playground', platforms: ['ios','android','web'], render: () => <SensorsPlaygroundScreen /> }` (use the exact field names defined in `src/modules/types.ts`; no `minIOS` — `expo-sensors` supports back to iOS 13). Imports `SensorsPlaygroundScreen` from `./screen`. Acceptance: T029 passes.

---

## Phase 7: Registry wiring

**Purpose**: Surface the module in the spec 006 grid via the one-import-one-entry contract (SC-006 / SC-010 / `src/modules/registry.ts` header).

- [X] T031 Edit `src/modules/registry.ts`: add ONE import `import sensorsPlayground from './sensors-playground';` and append ONE entry `sensorsPlayground,` to the `MODULES` array (after `swiftuiInterop`). No other shell file modified. Acceptance: the global `test/unit/modules/manifest.test.ts` invariants suite still passes; `test/unit/modules/registry.test.ts` reports the new module appearing in source order; diff is exactly +2 lines (1 import + 1 entry, plus formatter-required commas).

---

## Phase 8: Polish & Quality Gate

- [X] T032 Run `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm test` and iterate until all four are green with zero new warnings (SC-008). Acceptance: each command exits 0; `pnpm test --testPathPattern sensors-playground` reports all 12 sensors-playground test files green; full suite still green.
- [X] T033 [P] Cleanup pass on `src/modules/sensors-playground/`: confirm no `Platform.OS` outside `RotationIndicator.tsx`, no inline style objects defined outside `StyleSheet.create`, no `any`, no unused exports, all imports use the `@/` alias (constitution III/IV/VI). Run `pnpm lint --max-warnings 0` and `pnpm typecheck` again to confirm. Acceptance: zero warnings/errors; diff is whitespace-only or trivial naming fixes.
- [X] T034 [P] Documentation touch-ups: cross-link `specs/011-sensors-playground/quickstart.md` from `README.md` "Modules" list (if such a list exists; otherwise skip silently) and confirm `.github/copilot-instructions.md` SPECKIT block points at this feature's plan if it tracks active features. Acceptance: links resolve; no other docs modified.
- [X] T035 Final commit on `011-sensors-playground` summarising the feature, then run `quickstart.md` §3 on at least one physical iPhone (iOS 16+), one Android device, and one desktop web browser tab; record any deviations as follow-ups in the PR description. Acceptance: commit pushed; smoke matrix recorded; SC-002 (sample-rate cadence visible), SC-003 (every card renders on every platform), SC-006 (rate change <100 ms), SC-007 (clean unmount) confirmed live.

---

## Dependencies & Execution Order

### Phase order

1. **Phase 1 Setup** (T001–T003) — T001 first (adds dep + commits "chore(011): add expo-sensors"). T002 ‖ T003 after T001.
2. **Phase 2 Foundational** (T004–T011) — depends on T001/T003. Test/impl pairs are independent of each other: `(T004→T005) ‖ (T006→T007) ‖ (T008→T009) ‖ (T010→T011)`. **Blocks all US phases.**
3. **Phase 3 US1** (T012–T015) — depends on Phase 2 (uses `useSensorStream`, `SampleRatePicker`, `PermissionNotice`). T012 ‖ T013 first; then T014 ‖ T015.
4. **Phase 4 US2** (T016–T026) — depends on Phase 2 only (each card is self-contained against the same hook seam). May start fully in parallel with Phase 3 if staffed; per-pair ordering is `test → impl`. May start fully in parallel with Phase 5 (US3 screen test mocks the cards).
5. **Phase 5 US3** (T027–T028) — depends on Phase 2 (the screen mocks the hook directly). The screen test does NOT depend on the real card implementations — it mocks the hook globally, so cards mount harmlessly. May land before US2 cards in principle, but for clarity land US3 after US2 to keep the registry pointing at a complete module.
6. **Phase 6 Manifest** (T029–T030) — depends on T028 (screen exists for the manifest's `render`).
7. **Phase 7 Registry** (T031) — depends on T030 (manifest exists). For safety land it AFTER all 12 tests are green.
8. **Phase 8 Polish** (T032–T035) — T032 depends on everything above; T033 ‖ T034 alongside T032; T035 last.

### Parallelisable sets

- Phase 1: `T002 ‖ T003` after T001.
- Phase 2 tests: `T004 ‖ T006 ‖ T008 ‖ T010`. Phase 2 impls (each after its red test): `T005 ‖ T007 ‖ T009 ‖ T011`.
- US1 tests: `T012 ‖ T013`. US1 impls (after their red tests): `T014 ‖ T015`.
- US2 tests: `T016 ‖ T017 ‖ T018 ‖ T019 ‖ T020`. US2 impls: `T021 ‖ T022 ‖ T023 ‖ T024 ‖ T025 ‖ T026`.
- Across stories: US1, US2, US3 all consume the same mocked hook seam and may run fully in parallel after Phase 2 lands.
- Polish: `T033 ‖ T034` alongside `T032`.

### Test-before-implementation invariant

| Implementation task | Must-fail-first test task |
|---|---|
| T005 ring-buffer.ts | T004 |
| T007 useSensorStream.ts | T006 |
| T009 SampleRatePicker.tsx | T008 |
| T011 PermissionNotice.tsx | T010 |
| T014 BarChart.tsx | T012 |
| T015 AccelerometerCard.tsx | T013 |
| T021 CompassNeedle.tsx | T016 |
| T022 SpiritLevel.tsx | T017 |
| T024 GyroscopeCard.tsx | T018 |
| T025 MagnetometerCard.tsx | T019 |
| T026 DeviceMotionCard.tsx | T020 |
| T028 screen.tsx | T027 |
| T030 index.tsx (manifest) | T029 |
| T023 RotationIndicator.tsx | (none — covered transitively by T018/T024) |

---

## Parallel Example: kicking off after Setup

```bash
# After T001 lands, in parallel:
Task: "T002 add expo-sensors plugin to app.json"
Task: "T003 scaffold module + test folders"

# After T003 lands, in parallel (Phase 2 tests):
Task: "T004 write ring-buffer.test.ts"
Task: "T006 write useSensorStream.test.tsx"
Task: "T008 write SampleRatePicker.test.tsx"
Task: "T010 write PermissionNotice.test.tsx"

# Drive each red test green (Phase 2 impls):
Task: "T005 implement ring-buffer.ts"
Task: "T007 implement useSensorStream.ts"
Task: "T009 implement SampleRatePicker.tsx"
Task: "T011 implement PermissionNotice.tsx"

# Then US1, US2, US3 tests in parallel:
Task: "T012 BarChart.test.tsx"
Task: "T013 AccelerometerCard.test.tsx"
Task: "T016 CompassNeedle.test.tsx"
Task: "T017 SpiritLevel.test.tsx"
Task: "T018 GyroscopeCard.test.tsx"
Task: "T019 MagnetometerCard.test.tsx"
Task: "T020 DeviceMotionCard.test.tsx"
Task: "T027 screen.test.tsx"
```

Then drive each red test green: US1 impls (T014, T015), US2 impls (T021–T026), US3 screen impl (T028). Land T029→T030 manifest, then T031 registry, then T032 quality gate.

---

## Implementation Strategy

### MVP

1. Phases 1 → 2 → 3 (US1) — Accelerometer card proven via unit tests with `useSensorStream` mocked; foundations (ring buffer, hook seam, sample-rate picker, permission notice) all green. Registry wiring intentionally lands only after every variant is green so the grid never points at a half-built screen.
2. US2 adds the three remaining cards + their visualizations (CompassNeedle, SpiritLevel, RotationIndicator) behind the same hook mock.
3. US3 lands the screen + global Start All / Stop All event bus. US4 is implicitly covered by the hook + notice tests already authored in Phase 2 and re-exercised inside US2 card tests.
4. Land T029→T030 (manifest) and T031 (registry) to make the module reachable from the modules grid.
5. T032 quality gate, T033 cleanup, T034 docs, T035 device smoke + commit.

### Incremental delivery

Phase 2 → US1 → (US2 ‖ US3) → manifest → registry → polish. Each US is mergeable behind the registry wiring (which is the last code change before polish), so partial work never appears in the shipped grid.

---

## Notes

- All file paths use the `@/` alias when imported (constitution VI / `tsconfig.json`).
- **No `Platform.OS` branching anywhere in this module except inside `RotationIndicator.tsx`** (single-value SF Symbol gate, permitted by constitution III). All other per-platform divergence is runtime-driven via `useSensorStream`'s `isAvailable` + `permission` (FR-030, plan.md § Constitution Check III).
- **`expo-sensors` is imported in exactly ONE file: `src/modules/sensors-playground/hooks/useSensorStream.ts`** (FR-040). Every card test mocks `@/modules/sensors-playground/hooks/useSensorStream`; the hook's own test mocks `expo-sensors` directly. This is the single mock seam — do not import `expo-sensors` from any card or component.
- Use `subscription.remove()` per subscription — never `removeAllListeners()` (deprecated; research.md).
- `Accelerometer` reports g-force units; `DeviceMotion.rotation.{alpha,beta,gamma}` is radians (yaw/pitch/roll mapping per research.md). Convert to degrees only at the readout boundary.
- The two acknowledged dynamic style values (BarChart row `width`, CompassNeedle `rotate`, SpiritLevel `translate`) are computed from runtime state and are explicitly permitted by the constitution (`plan.md` § Constitution Check IV).
- Ring buffer holds 60 samples; BarChart slides a 30-sample window over the buffer. `useState` is updated from a paint-loop (`requestAnimationFrame`/`setInterval`) snapshot inside each card — never from the raw sample callback at 120 Hz (research.md Decision 3).
- Commit after each task or each green test→impl pair; never commit a red test together with its implementation in a single commit (TDD discipline). Suggested checkpoint commits: `chore(011): add expo-sensors` (T001), `feat(011): ring-buffer + tests` (T004–T005), `feat(011): useSensorStream seam + tests` (T006–T007), `feat(011): shared SampleRatePicker + PermissionNotice` (T008–T011), `feat(011): AccelerometerCard MVP` (T012–T015), `feat(011): Gyroscope/Magnetometer/DeviceMotion cards` (T016–T026), `feat(011): screen + Start All/Stop All` (T027–T028), `feat(011): manifest + registry wiring` (T029–T031), `chore(011): polish + quality gate` (T032–T035).
