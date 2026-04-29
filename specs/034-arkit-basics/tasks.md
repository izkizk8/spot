---
description: "Task list for feature 034 — ARKit Basics"
---

# Tasks: ARKit Basics Module (034)

**Input**: Design documents from `/specs/034-arkit-basics/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: REQUIRED. Per plan §"Test-First for New Features" and Constitution V
(v1.1.0), every JS-pure surface ships with tests authored before implementation
(TDD-first). Native Swift sources are exempt from JS unit tests on Windows
(033 carryover); on-device verification documented in `quickstart.md`.

**Organization**: Tasks are grouped by **technical layer** in dependency order
(scaffold → foundational types & constants → JS bridge → hook → components →
screens → manifest → registry → config plugin → native iOS sources → plugin /
app.json wiring → final integration). Each layer follows a strict RED→GREEN
cadence: test files are added first, then the matching implementation.

**Constitution compliance** (encoded in every task):

- NO `eslint-disable` directives anywhere in added or modified code (FR-023).
- All native bridges mocked at the import boundary via `jest.mock` of
  `src/native/arkit.ts` (FR-022).
- `with-arkit` plugin coexists with 017's `with-vision`: never clobbers
  `NSCameraUsageDescription`; appends `arkit` to
  `UIRequiredDeviceCapabilities` exactly once (idempotent — verified by
  running the mod twice and asserting deep-equal config — SC-008).
- No face-tracking strings (`NSFaceIDUsageDescription`,
  `ARFaceTrackingConfiguration`, etc.) anywhere in plugin output (FR-017).
- Polling cadence **500 ms** (R-D); cleanup on unmount; `cancelled` ref
  guards every tick (SC-011, FR-016).
- `StyleSheet.create()` only (Constitution IV). `ThemedView` / `ThemedText` +
  `Spacing` tokens (Constitution II). Platform splits via `.android.tsx` /
  `.web.tsx` siblings (Constitution III).
- Strictly additive: registry +1, `app.json` `plugins` +1.

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks).
- All paths are absolute from repository root.
- User-story coverage: T039–T046 (US1–US5 wiring across screens / hook), T010–T012 (US1 + US5 bridge), T015–T016 (US1 capabilities), T019–T020 (US3 configuration), T021–T022 (US2 tap-to-place), T023–T024 (US2 anchor list), T025–T026 (US4 stats), T031–T035 (US5 plugin).

---

## Phase 1: Scaffold & foundational types

**Purpose**: Establish the directory skeleton, the typed TypeScript surface,
and the static `PlaneDetectionMode` mapping table that every later layer
imports. No tests in this phase for T001 (pure scaffolding) and T002 (pure
type declarations exercised by every later test). T003 / T004 follow the
TDD RED→GREEN cadence for the static mapping table.

- [ ] T001 Create directory scaffolding: `src/modules/arkit-lab/{components,hooks}/`, `src/native/`, `native/ios/arkit/Resources/`, `plugins/with-arkit/`, `test/unit/modules/arkit-lab/{components,hooks}/`, `test/unit/native/`, `test/unit/plugins/`.
  - Acceptance: every directory above exists; no source files added yet.
- [ ] T002 Author `src/native/arkit.types.ts` with `PlaneDetectionMode` (entity 1), `SessionState` (entity 2), `TrackingState` (entity 3), `ARKitConfiguration` + `DEFAULT_CONFIGURATION` (entity 4), `AnchorRecord` (entity 5), `SessionInfo` + `INITIAL_SESSION_INFO` (entity 6), `ARKitBridge` interface (per `contracts/arkit-bridge.contract.ts`), `NATIVE_MODULE_NAME = 'ARKitBridge'`, `NATIVE_VIEW_NAME = 'ARKitView'`, and the `ARKitNotSupported` class.
  - Acceptance: `pnpm typecheck` passes; every later test/impl imports from this file; module-name and view-name strings are exported as `as const`.
- [ ] T003 [P] Author `test/unit/modules/arkit-lab/plane-detection-modes.test.ts`: asserts the catalog is exactly the four entries `'none' | 'horizontal' | 'vertical' | 'both'` in that order; each entry exposes a non-empty human-readable `label` and a `value` matching `PlaneDetectionMode`; the `DEFAULT_PLANE_DETECTION_MODE` export equals `'horizontal'` (data-model entity 1 default); no duplicate values; the catalog is `Object.freeze`d.
  - Acceptance: test fails (RED) before T004 lands.
- [ ] T004 [P] Implement `src/modules/arkit-lab/plane-detection-modes.ts`: `as const` array of four `{ value, label }` rows; `DEFAULT_PLANE_DETECTION_MODE` const re-exported from `src/native/arkit.types.ts`'s `DEFAULT_CONFIGURATION.planeDetection` for a single source of truth.
  - Acceptance: T003 passes (GREEN).

---

## Phase 2: JS bridge (cross-platform)

**Purpose**: The single typed entry point all UI consumes. One test file
covers all three platform variants by mocking the import boundary
(per FR-022). RED first, then three parallel implementations.

- [ ] T005 Author `test/unit/native/arkit.test.ts` covering `contracts/arkit-bridge.contract.ts` invariants on **all three platforms**:
  - **iOS**: `placeAnchorAt(x, y)` delegates to a mocked `ARKitBridge` native module returning a 1:1 `AnchorRecord`; `clearAnchors`, `pauseSession`, `resumeSession` resolve void; `getSessionInfo()` returns the typed `SessionInfo` shape; `isAvailable()` reads the mocked `ARWorldTrackingConfiguration.isSupported` field and returns the boolean (never throws).
  - **iOS serialisation (R-A)**: two back-to-back `placeAnchorAt()` calls produce exactly two native invocations in submission order, even when the first rejects.
  - **Android**: every `AsyncFunction` rejects with an `ARKitNotSupported` instance carrying a stable message; `isAvailable()` returns `false` (never throws).
  - **Web**: identical contract to Android; additionally asserts via `jest.isolateModules` + `jest.doMock('src/native/arkit.ts')` (throwing) that the web bundle does NOT pull in the iOS bridge at module evaluation time (mirrors 030–033 SC-007 discipline).
  - Acceptance: test fails (RED) before T006–T008 land; each `it` block names the exact bridge entry point under test.
- [ ] T006 [P] Implement `src/native/arkit.ts` (iOS): `requireOptionalNativeModule('ARKitBridge')` + `Platform.OS === 'ios'` gate; closure-scoped `enqueue` promise chain (R-A) wrapping every `AsyncFunction`; exports `placeAnchorAt`, `clearAnchors`, `pauseSession`, `resumeSession`, `getSessionInfo`, `isAvailable`, and the `ARKitNotSupported` class re-exported from `arkit.types.ts`.
  - Acceptance: T005 iOS branch passes (GREEN); no `eslint-disable` directives.
- [ ] T007 [P] Implement `src/native/arkit.android.ts`: every `AsyncFunction` throws `ARKitNotSupported` with a stable message; `isAvailable()` returns `false` synchronously and never throws; re-exports `ARKitNotSupported`.
  - Acceptance: T005 Android branch passes (GREEN).
- [ ] T008 [P] Implement `src/native/arkit.web.ts`: identical contract to `.android.ts`; throws `ARKitNotSupported` on every `AsyncFunction`; `isAvailable()` returns `false`. MUST NOT import `src/native/arkit.ts` at evaluation time.
  - Acceptance: T005 Web branch passes (GREEN); the static-import assertion in T005 holds.

---

## Phase 3: `useARKitSession` hook

**Purpose**: The single state surface the screens consume (entity 7). Owns
the 500 ms polling lifecycle, anchor list, configuration queue, and bridge
error classification (R-D).

- [ ] T009 Author `test/unit/modules/arkit-lab/hooks/useARKitSession.test.tsx`:
  - default state matches `INITIAL_SESSION_INFO` + `DEFAULT_CONFIGURATION` + `anchors === []`.
  - `placeAnchorAt(x, y)` appends an `AnchorRecord` from the mocked bridge; failures are classified per R-D (`'unsupported'` flips `state` to `'error'`; `'cancelled'` is a no-op; `'failed'` flips to `'error'` with the message).
  - `clearAnchors()` empties the list.
  - `pause()` / `resume()` flip `info.state` to `'paused'` / `'running'`; `setConfig({...})` while paused is queued and flushed on `resume()` (FR-025).
  - `reset()` clears anchors AND re-applies the current config.
  - **Polling at 500 ms (R-D)**: with `jest.useFakeTimers()`, advancing 500 ms triggers exactly one `getSessionInfo()` call; advancing 2 s triggers four; the mounted ref guards every tick.
  - **Unmount safety (FR-016, SC-011)**: `unmount()` then advancing 5 s triggers ZERO additional bridge calls; `clearInterval` ran synchronously; cleanup best-effort calls `pauseSession()` and swallows rejection.
  - All action functions have stable identities across renders (referenced by `useEffect` dependency arrays without re-firing).
  - Acceptance: test fails (RED) before T010 lands; uses `jest.mock('src/native/arkit')` at the import boundary (FR-022).
- [ ] T010 Implement `src/modules/arkit-lab/hooks/useARKitSession.ts`: reducer-serialised state per data-model §"State machine"; `cancelled` ref + `mounted` ref guarding every tick handler; `setInterval(500)` started on mount; cleanup clears the interval, sets `cancelled.current = true`, and best-effort `pauseSession().catch(() => undefined)`; classifies bridge errors per R-D (`'unsupported'` / `'cancelled'` / `'failed'`); imports the bridge from `src/native/arkit` only via the platform-resolved entry.
  - Acceptance: T009 passes (GREEN); no `eslint-disable` directives.

---

## Phase 4: Components (5 panels + 1 wrapper)

**Purpose**: Pure presentational + light-state components consumed by the
three screen variants. `IOSOnlyBanner` is **REUSED** from the prior modules
(017 / 029 / 030 / 031 / 032 / 033) — NOT redefined here. Tests authored
in parallel, then implementations in parallel.

### Component tests (RED) — all parallelisable

- [ ] T011 [P] Author `test/unit/modules/arkit-lab/components/CapabilitiesCard.test.tsx`: supported / unsupported branches; status pill renders one of `'idle' | 'running' | 'paused' | 'error'`; when `state === 'error'`, the `lastError` message is visible; frame-semantics summary lists `peopleOcclusion` only when supported.
- [ ] T012 [P] Author `test/unit/modules/arkit-lab/components/ARViewWrapper.test.tsx`: on iOS with `isAvailable === true` and permission granted, renders the `ARKitView` ViewDefinition (mocked via `requireNativeViewManager('ARKitView')`); on `isAvailable === false`, renders the "Unsupported on this device" placeholder; on permission denied, renders the permission-prompt placeholder with an "Open Settings" button; on Android / Web, renders `<IOSOnlyBanner />`. Mocks the native view manager at the import boundary.
- [ ] T013 [P] Author `test/unit/modules/arkit-lab/components/ConfigurationCard.test.tsx`: 4 mutually-exclusive plane-detection segments sourced from `plane-detection-modes.ts`; each tap calls `onChange` with the matching `PlaneDetectionMode`; switches for `peopleOcclusion` / `lightEstimation` / `worldMapPersistence`; disabled rows when capability flag is false; on non-iOS the entire card has `accessibilityState.disabled === true` with an explanatory caption; Reset button calls `onReset`.
- [ ] T014 [P] Author `test/unit/modules/arkit-lab/components/AnchorsPanel.test.tsx`: 0 / 1 / 100 entries; ids truncated to 8 chars; coordinates rounded to 2 decimals (`(x, y, z)` in metres); newest-first ordering preserved; soft-cap-100 caption present; renders inside a `ScrollView`.
- [ ] T015 [P] Author `test/unit/modules/arkit-lab/components/StatsBar.test.tsx`: FPS rendering (0 when `state === 'paused'`); tracking-state format covers `'normal'` / `'limited:initializing'` / `'limited:excessiveMotion'` / `'limited:insufficientFeatures'` / `'limited:relocalizing'` / `'notAvailable'`; `mm:ss` formatter for `duration` (covers 0, 65, 3599 seconds).
- [ ] T016 [P] Author `test/unit/modules/arkit-lab/components/IOSOnlyBanner.usage.test.tsx`: imports the **existing** `IOSOnlyBanner` component (no new file under `arkit-lab/components/`) and asserts it renders with the ARKit-specific copy passed via props in the screen variants. (No implementation task — this is a usage smoke test only.)

### Component implementations (GREEN) — all parallelisable

- [ ] T017 [P] Implement `src/modules/arkit-lab/components/CapabilitiesCard.tsx`. Acceptance: T011 passes.
- [ ] T018 [P] Implement `src/modules/arkit-lab/components/ARViewWrapper.tsx`. Uses `Platform.OS` to choose between the native view (iOS) and `IOSOnlyBanner` (Android / Web); reads camera-permission state from the project's existing permission helper. Acceptance: T012 passes.
- [ ] T019 [P] Implement `src/modules/arkit-lab/components/ConfigurationCard.tsx`. Consumes `plane-detection-modes.ts` for the segmented control rows. Acceptance: T013 passes.
- [ ] T020 [P] Implement `src/modules/arkit-lab/components/AnchorsPanel.tsx`. Slices to 100 newest-first entries at the render boundary (no virtualization). Acceptance: T014 passes.
- [ ] T021 [P] Implement `src/modules/arkit-lab/components/StatsBar.tsx`. Acceptance: T015 passes.

---

## Phase 5: Screens (3 platform variants)

**Purpose**: Compose the panels in the fixed order from spec §"Overview"
(CapabilitiesCard → ARViewWrapper → ConfigurationCard → tap-to-place
controls → AnchorsPanel → StatsBar); enforce that `screen.web.tsx` NEVER
imports `src/native/arkit.ts` at module evaluation time.

### Screen tests (RED)

- [ ] T022 [P] Author `test/unit/modules/arkit-lab/screen.test.tsx` (iOS): six panels render in fixed order; permission-denied path renders permission placeholder; `isAvailable === false` path renders unsupported placeholder; tap on the AR view region calls `placeAnchorAt` via the hook (mocked); "Clear all" button calls `clearAnchors`. Mocks `src/native/arkit` and `requireNativeViewManager` at the import boundary.
- [ ] T023 [P] Author `test/unit/modules/arkit-lab/screen.android.test.tsx`: panels render in the same order; AR region renders `<IOSOnlyBanner />`; `ConfigurationCard` and tap-to-place controls have `accessibilityState.disabled === true`; explanatory caption present; bridge is never called at module evaluation time.
- [ ] T024 [P] Author `test/unit/modules/arkit-lab/screen.web.test.tsx`: same render set as Android; statically asserts (via `jest.isolateModules` + `jest.doMock('src/native/arkit.ts', () => { throw new Error(...) })`) that the web bundle does NOT pull in the iOS bridge at evaluation time.

### Screen implementations (GREEN)

- [ ] T025 Implement `src/modules/arkit-lab/screen.tsx` (iOS variant; consumes `useARKitSession`). Acceptance: T022 passes.
- [ ] T026 Implement `src/modules/arkit-lab/screen.android.tsx`. Acceptance: T023 passes.
- [ ] T027 Implement `src/modules/arkit-lab/screen.web.tsx` (must not import `src/native/arkit.ts`). Acceptance: T024 passes — including the static-import assertion.

---

## Phase 6: Manifest

- [ ] T028 Author `test/unit/modules/arkit-lab/manifest.test.ts` per `contracts/manifest.contract.ts`: `id === 'arkit-basics'`; `label === 'ARKit Basics'`; `platforms` deep-equals `['ios','android','web']`; `minIOS === '11.0'`. Acceptance: test fails (RED) before T029.
- [ ] T029 Implement `src/modules/arkit-lab/index.tsx` exporting the `ModuleManifest` (matches manifest test). Acceptance: T028 passes.

---

## Phase 7: Registry integration

- [ ] T030 Modify `src/modules/registry.ts`: +1 import line for `arkitLab` from `./arkit-lab`; +1 array entry appended after the 033 (`shareSheetLab`) entry; no other edits. Re-run existing `test/unit/modules/registry.test.ts` (no new test needed — T028 manifest test covers shape).
  - Acceptance: registry size grows by exactly 1; existing registry test passes; ordering preserved.

---

## Phase 8: Expo config plugin (`with-arkit`)

**Purpose**: Idempotent `withInfoPlist` mod that adds
`NSCameraUsageDescription` (only when absent — coexists with 017's
`with-vision`) and appends `arkit` to `UIRequiredDeviceCapabilities`
exactly once. JS-pure tests against `@expo/config-plugins` (FR-022 / R-F).

- [ ] T031 Author `test/unit/plugins/with-arkit.test.ts` per `contracts/plugin.contract.ts`:
  - **Idempotency (SC-008)**: invoking the plugin twice on the same Expo config produces a deep-equal config (no array growth on second pass; no duplicate `'arkit'`).
  - **Coexistence with 017 (SC-009)**: when an upstream `NSCameraUsageDescription` is already set (simulating `with-vision` having run first), `with-arkit` preserves the value verbatim. When absent, `with-arkit` sets the default `'Used to demonstrate ARKit world tracking and plane detection.'`.
  - **`UIRequiredDeviceCapabilities` append**: when the array is absent, plugin creates it as `['arkit']`; when present without `'arkit'`, plugin appends; when present with `'arkit'`, plugin is a no-op.
  - **No-face-tracking guarantee (FR-017)**: the resulting `modResults` object contains NO `NSFaceIDUsageDescription`, NO face-tracking-related strings (`/face[-_ ]?tracking/i` regex search of all string values yields zero matches), NO `ARFaceTrackingConfiguration` references.
  - Acceptance: test fails (RED) before T032 / T033 land.
- [ ] T032 [P] Implement `plugins/with-arkit/index.ts`: default-exported `ConfigPlugin` using `withInfoPlist`; performs the two modifications above; pure-functional (no I/O); no dependencies declared (resolves `@expo/config-plugins` from the host package).
  - Acceptance: T031 passes (GREEN); no `eslint-disable` directives.
- [ ] T033 [P] Implement `plugins/with-arkit/package.json`: same shape as `plugins/with-vision/package.json` (`name: 'with-arkit'`, `version: '1.0.0'`, `main: 'index.ts'`, NO dependencies array entry).
  - Acceptance: file parses as valid JSON; `node -e "require('./plugins/with-arkit/package.json')"` succeeds.

---

## Phase 9: `app.json` plugin entry

- [ ] T034 Modify `app.json`: append the string `"./plugins/with-arkit"` to `expo.plugins`; no other edits. Order: appended last (after 033's plugin entries if any, otherwise after the existing tail).
  - Acceptance: `app.json` parses as valid JSON; `expo.plugins` length grows by exactly 1; the new entry is the literal string `"./plugins/with-arkit"`.
- [ ] T035 [P] (Optional) Add `test/unit/app-json.test.ts` assertion (or extend an existing one if present): `expo.plugins` contains `'./plugins/with-arkit'` exactly once.
  - Acceptance: test passes; if a prior `app-json.test.ts` already enforces the list, extend it with the new entry rather than duplicating.

---

## Phase 10: Native iOS sources (Swift)

**Purpose**: Real `ARKitBridge` Expo Module + `ARKitView` ViewDefinition
wrapping `RealityKit.ARView`. Not unit-testable on Windows; on-device
verification documented in `quickstart.md` (same exemption pattern as
007 / 013 / 014 / 027–033). All four files independent → all parallelisable.

- [ ] T036 [P] Implement `native/ios/arkit/ARKitBridge.swift`: `@available(iOS 11.0, *)` Expo Module exposing `Module("ARKitBridge")` with `AsyncFunction` `placeAnchorAt(x, y) -> AnchorRecord`, `clearAnchors() -> Void`, `pauseSession() -> Void`, `resumeSession() -> Void`, `getSessionInfo() -> SessionInfo`, and `Function("isAvailable") -> Bool` (reads `ARWorldTrackingConfiguration.isSupported`). Holds a weak ref to the active `ARKitView`'s `ARSession` via a process-wide registry keyed by `reactTag` (R-C). When zero views are registered, every `AsyncFunction` rejects with `'no-active-view'`.
- [ ] T037 [P] Implement `native/ios/arkit/ARKitView.swift`: `@available(iOS 11.0, *)` Expo Module `View("ARKitView")` wrapping `RealityKit.ARView`. Props: `planeDetection` (string enum), `peopleOcclusion` (Bool, gated `@available(iOS 13.0, *)` at the call site), `lightEstimation` (Bool). Events: `onSessionStateChange`, `onAnchorAdded`, `onAnchorRemoved`, `onError`. On raycast hit (R-B) builds `AnchorEntity(world: hit.worldTransform)` parented to a `ModelEntity(mesh: .generateBox(size: 0.05), materials: [SimpleMaterial(... cubeTexture)])`. FPS ring buffer (60 timestamps) sampled by `getSessionInfo()` at call time (R-E). Reset path uses `[.resetTracking, .removeExistingAnchors]` (R-G).
- [ ] T038 [P] Author `native/ios/arkit/expo-module.config.json` declaring the iOS module name and platform target (iOS 11.0+); registers both `ARKitBridge` and `ARKitView` for autolinking.
  - Acceptance: file parses as valid JSON; `platforms` array contains `'ios'`; module name matches `NATIVE_MODULE_NAME` from T002.
- [ ] T039 [P] Author `native/ios/arkit/Arkit.podspec` (or whatever the project's autolinking convention is — match the shape used by 033's `share-sheet` Swift sources): minimum iOS deployment target `11.0`; `source_files = '*.swift'`; `resource_bundles` declaring `cube-texture.png`.
- [ ] T040 [P] Add bundled asset `native/ios/arkit/Resources/cube-texture.png` (64×64 PNG; tiny placeholder texture). Acceptance: file exists; size ≤ 4 KB; declared in T039's podspec / module config.

---

## Phase 11: Final integration & verification

- [ ] T041 Run `pnpm format` from the repo root.
  - Acceptance: exits 0; no diff produced (no-op final commit per plan §"Constraints").
- [ ] T042 Run `pnpm lint` (or `pnpm oxlint` — match the project's existing script name).
  - Acceptance: exits 0; ZERO `eslint-disable` directives anywhere in the diff (`git diff main -- src plugins | rg 'eslint-disable'` returns no matches).
- [ ] T043 Run `pnpm typecheck`.
  - Acceptance: exits 0; no type errors introduced.
- [ ] T044 Run `pnpm test` (Jest Expo).
  - Acceptance: exits 0; suite delta ≥ +14 vs the 033 baseline (manifest +1, screens +3, hook +1, components +5, plane-detection-modes +1, bridge +1, plugin +1, optional app.json +1).
- [ ] T045 Run on-device quickstart per `quickstart.md` (manual; documented, not gated in CI). Place ≥ 3 anchors; pause / resume; reset; toggle plane detection at runtime; verify FPS / tracking-state telemetry; run `expo prebuild` and inspect the generated `ios/<app>/Info.plist` for: (a) `arkit` present in `UIRequiredDeviceCapabilities` exactly once, (b) `NSCameraUsageDescription` non-empty, (c) NO face-tracking strings.
- [ ] T046 Commit and push the `034-arkit-basics` branch.

---

## Dependencies & ordering

- **T001** blocks every later task (directories must exist).
- **T002** blocks T003–T040 (every later test/impl imports the shared types and module/view-name constants).
- **T003 / T004** (plane-detection-modes) block T013 / T019 (ConfigurationCard consumes the catalog) and T009 / T010 (hook re-uses the default).
- **Bridge tests (T005)** precede bridge impls (T006–T008) — TDD RED→GREEN.
- **Bridge impls (T006–T008)** block T009 / T010 (hook imports bridge) and T022–T027 (screens, indirectly via the hook).
- **Hook tests (T009)** precede T010; T010 blocks T022–T027.
- **Component tests (T011–T016)** precede component impls (T017–T021); no inter-component dependencies.
- **Component impls (T017–T021)** block screen tests (T022–T024) only insofar as the screen tests render real components — if components are mocked in screen tests this is a soft dependency.
- **Screen tests (T022–T024)** precede screen impls (T025–T027).
- **Manifest (T028 / T029)** is independent of components; can run in parallel with Phase 4 once T002 is done.
- **Registry (T030)** requires T029 (manifest export must exist).
- **Plugin tests (T031)** precede plugin impls (T032 / T033).
- **`app.json` (T034)** requires the plugin path to exist on disk (T032); T035 (optional test) can run in parallel with T034 once T032 is done.
- **Swift sources + native config (T036–T040)** are independent of all JS tasks (mocked at the import boundary in tests); can run any time after T002.
- **T041–T044** are gates that depend on every prior task being complete.
- **T045** requires the full pipeline + `expo prebuild` succeeding on a Mac with a real iOS 11+ device.
- **T046** is the terminal task.

## Parallel execution opportunities

- All `[P]` tasks within a single layer can run concurrently.
- The largest fan-outs:
  - **6 component tests in parallel** (T011–T016).
  - **5 component impls in parallel** (T017–T021).
  - **3 bridge impls in parallel** (T006–T008).
  - **3 screen tests in parallel** (T022–T024).
  - **5 native iOS files in parallel** (T036–T040), independent of every JS task.
  - **2 plugin impls in parallel** (T032 / T033).

## Total task count

**46 tasks** (T001–T046). 14 test files (T003, T005, T009, T011–T016, T022–T024, T028, T031, optionally T035) match the plan's "≥ +14 suites" delta target.

## User-story coverage matrix

| User story (spec.md) | Priority | Covered by |
|----------------------|----------|------------|
| US1 — Launch a world-tracking session and observe capabilities | P1 | T002, T005–T008, T009/T010, T011/T017 (CapabilitiesCard), T012/T018 (ARViewWrapper), T022/T025, T028/T029, T030, T036/T037 |
| US2 — Tap to place anchored cubes via raycast | P2 | T005 (placeAnchorAt), T009/T010 (hook action), T014/T020 (AnchorsPanel), T022/T025, T036/T037, T040 (texture) |
| US3 — Reconfigure session at runtime + Reset | P2 | T003/T004 (plane modes), T013/T019 (ConfigurationCard), T009/T010 (queued config), T037 (ViewDefinition prop diffing — R-G) |
| US4 — Observe FPS / tracking-state / duration telemetry | P3 | T015/T021 (StatsBar), T009/T010 (500 ms polling — R-D), T037 (FPS ring buffer — R-E) |
| US5 — Cross-platform graceful degradation + on-device prebuild | P3 | T007/T008 (non-iOS bridge), T012/T018 (ARViewWrapper banner), T023/T024/T026/T027 (Android/Web screens), T031–T035 (with-arkit plugin), T045 (prebuild verification) |

## MVP scope

User Story 1 (P1) ships the world-tracking session start + capabilities
display end-to-end. Minimum task subset for an MVP demoable build:

**T001 → T002 → T005/T006/T007/T008 → T009/T010 → T011/T017 (CapabilitiesCard) → T012/T018 (ARViewWrapper) → T015/T021 (StatsBar) → T022/T025 → T028/T029 → T030 → T031–T034 → T036/T037/T038/T039/T040 → T041–T046.**

Stories US2–US5 are layered on top without touching MVP files.

## Risks (carried forward from plan §Risks)

- **R1** (plugin clobbers 017's camera-usage string): mitigated by T031's coexistence test; plugin only sets the default when **absent**.
- **R2** (`UIRequiredDeviceCapabilities` `arkit` duplicated): mitigated by T031's idempotency test (deep-equal config across two passes — SC-008).
- **R3** (bridge concurrency anomaly): mitigated by T005's serialisation invariant (R-A).
- **R4** (iPad simulator / A8 device returns `isSupported === false`): mitigated by T012 / T018's unsupported-placeholder branch (FR-021).
- **R6** (`screen.web.tsx` accidentally imports the iOS bridge): mitigated by T024's static-import assertion.
- **R9** (polling tick fires after unmount): mitigated by T009's unmount-safety test (`mounted` ref + `cancelled` ref — SC-011).
- **R10** (bridge module-name collision): mitigated by T002's `NATIVE_MODULE_NAME = 'ARKitBridge'` + `NATIVE_VIEW_NAME = 'ARKitView'` distinct constants.

Constitution v1.1.0 is **additive only** for this feature: registry +1,
`app.json` `plugins` +1, no theme tokens, no new runtime JS dependencies,
no `eslint-disable` directives.
