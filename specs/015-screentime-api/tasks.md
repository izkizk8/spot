---
description: "Dependency-ordered task list for feature 015 — ScreenTime / FamilyControls Showcase Module"
---

# Tasks: ScreenTime / FamilyControls Showcase Module (`screentime-lab`)

**Input**: Design documents from `/specs/015-screentime-api/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/screentime-bridge.contract.ts, contracts/screentime-state.contract.ts, quickstart.md

**Tests**: REQUIRED. FR-025 + Constitution Principle V mandate JS-pure tests for the reducer, the JS bridge, the config plugin, every component, every screen variant, and the manifest. Native Swift sources are scaffold-only and not unit-testable on Windows; on-device verification is documented in `quickstart.md` (R-007).

**Organization**: Tasks are grouped by user story so each story can be implemented, tested, and demoed independently. Within each story, tests precede implementation (TDD: write → fail → implement → pass).

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Different file, no ordering dependency on any incomplete task — safe to run in parallel.
- **[Story]**: User story tag (US1 / US2 / US3 / US4). Setup, Foundational, and Polish phases carry no story tag.
- Every task lists the **exact** file path it touches.

## Path Conventions

Paths are relative to the repository root (`C:\Users\izkizk8\spot-015-screentime\`). The feature touches:

- `src/modules/screentime-lab/` — JS module (manifest + 3 screen variants + reducer + 5 components)
- `src/native/screentime*.ts` — JS bridge (iOS default + Android + Web variants + types)
- `plugins/with-screentime/` — TS Expo config plugin (entitlement + monitor extension target + App-Group consumption)
- `native/ios/screentime/` — Swift sources (scaffold-only, not Windows-testable)
- `test/unit/modules/screentime-lab/`, `test/unit/native/`, `test/unit/plugins/with-screentime/` — Jest tests
- `src/modules/registry.ts`, `app.json` — single-line additive edits (only existing files touched)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the empty directory skeleton expected by every later phase. No production code yet.

- [ ] T001 Create directory `src/modules/screentime-lab/` and `src/modules/screentime-lab/components/`
- [ ] T002 [P] Create directory `src/native/` entries for screentime variants (no files yet — scaffolded in Foundational)
- [ ] T003 [P] Create directory `plugins/with-screentime/`
- [ ] T004 [P] Create directory `native/ios/screentime/`
- [ ] T005 [P] Create test directories `test/unit/modules/screentime-lab/components/`, `test/unit/native/`, `test/unit/plugins/with-screentime/`

**Checkpoint**: Empty skeleton ready. No imports resolve yet — that is expected.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Ship the cross-cutting pieces every user story depends on: shared types, error classes, reducer, JS bridge with platform stubs, the Swift native scaffold, the config plugin, and the registry / app.json wiring.

**⚠️ CRITICAL**: No user story phase can begin until this phase is complete. The reducer and bridge are imported by every component; the plugin is required for any iOS build; the registry edit is required for the module to appear in the grid.

### Foundational Tests (write FIRST, must FAIL before implementation)

- [ ] T006 [P] Write reducer test `test/unit/modules/screentime-lab/screentime-state.test.ts` covering the full transition table from `data-model.md` §2 (every action, every guard, `BRIDGE_ERROR` does not mutate other fields, `lastError` cleared on next success, invariants in §1)
- [ ] T007 [P] Write JS bridge contract test `test/unit/native/screentime.test.ts` asserting:
  - `isAvailable()` is synchronous and returns `false` when the optional native module is absent
  - `entitlementsAvailable()` never throws (resolves `false` when probe rejects)
  - All other async methods reject with `EntitlementMissingError` when the probe returned `false`, and with `ScreenTimeNotSupportedError` on the android/web stubs (use jest mocking of `requireOptionalNativeModule` and platform module resolution)
- [ ] T008 [P] Write config plugin test `test/unit/plugins/with-screentime/index.test.ts` asserting against fixture Expo configs:
  - Adds `com.apple.developer.family-controls` entitlement to the main iOS target
  - Adds a `DeviceActivityMonitorExtension` target with bundle-ID suffix `.screentimemonitor`
  - Coexists with feature 007's `LiveActivityWidget` target and feature 014's `HomeWidget` target without collision
  - Reads (does NOT modify) feature 014's App Group bundle marker `// SPOT_APP_GROUP: 014` and attaches the same App Group to the new monitor extension
  - Idempotent: running the plugin twice produces deep-equal config

### Foundational Implementation

- [ ] T009 [P] Create shared types + error classes `src/native/screentime.types.ts` per `contracts/screentime-bridge.contract.ts` (export `AuthorizationStatus`, `SelectionSummary`, `MonitoringSchedule`, `ScreenTimeBridge` interface, `ScreenTimeNotSupportedError`, `EntitlementMissingError`, `PickerCancelledError`)
- [ ] T010 [US-Foundation] Implement reducer `src/modules/screentime-lab/screentime-state.ts` per `data-model.md` §1–§2 and `contracts/screentime-state.contract.ts` (pure functions, all 10 action types, all guards, exported `initialState`, exported `reducer`) — makes T006 pass
- [ ] T011 Implement iOS JS bridge `src/native/screentime.ts` using `requireOptionalNativeModule('SpotScreenTime')`; on `null`, route every async method through a sentinel-rejecting wrapper that throws `EntitlementMissingError`; memoize `entitlementsAvailable()` for process lifetime — partially makes T007 pass (depends on T009)
- [ ] T012 [P] Implement Android stub `src/native/screentime.android.ts`: `isAvailable() => false`, `entitlementsAvailable() => Promise.resolve(false)`, all other methods reject with `new ScreenTimeNotSupportedError()` — completes T007 (depends on T009)
- [ ] T013 [P] Implement Web stub `src/native/screentime.web.ts`: same shape as android stub — completes T007 (depends on T009)
- [ ] T014 [P] Create Swift `native/ios/screentime/ScreenTimeManager.swift` scaffold: expo-modules-core `Module` definition exposing the 9 bridge methods, every call wrapped in `do/catch`, `entitlementsAvailable()` probes `AuthorizationCenter.shared.authorizationStatus` inside `guard`, `OSLog` subsystem `com.spot.screentime` — scaffold-only, not unit-testable on Windows (R-001, R-005, FR-014, FR-015)
- [ ] T015 [P] Create Swift `native/ios/screentime/FamilyActivityPickerView.swift` scaffold: `UIViewControllerRepresentable` wrapping `FamilyActivityPicker` via `UIHostingController`, returns base64-encoded `FamilyActivitySelection` or `PickerCancelledError` (R-002) — scaffold-only, not unit-testable on Windows
- [ ] T016 [P] Create Swift `native/ios/screentime/DeviceActivityMonitorExtension.swift` scaffold: `DeviceActivityMonitor` subclass implementing `intervalDidStart` / `intervalDidEnd` / `eventDidReachThreshold`, all logging via `OSLog` subsystem `com.spot.screentime` category `monitor` (R-003, FR-014) — scaffold-only, not unit-testable on Windows
- [ ] T017 [P] Create `native/ios/screentime/ScreenTime.podspec` registering the Swift sources with expo-modules-core
- [ ] T018 [P] Create plugin entry point `plugins/with-screentime/index.ts` (default-exported `ConfigPlugin` composing the three sub-plugins below)
- [ ] T019 [P] Create `plugins/with-screentime/add-entitlement.ts` adding `com.apple.developer.family-controls` to the iOS target's `.entitlements` (with comment about Apple approval requirement, FR-019)
- [ ] T020 [P] Create `plugins/with-screentime/add-monitor-extension.ts` adding the `DeviceActivityMonitorExtension` target with bundle-ID suffix `.screentimemonitor`, `NSExtensionPointIdentifier = com.apple.deviceactivity.monitor-extension`, `IPHONEOS_DEPLOYMENT_TARGET = 16.0` (FR-020, R-003)
- [ ] T021 [P] Create `plugins/with-screentime/consume-app-group.ts` reading (NOT writing) feature 014's App Group bundle marker and attaching the App Group entitlement to the new monitor extension target only; on missing marker, log a prebuild warning and continue (FR-021, R-004)
- [ ] T022 Wire the four plugin files together in `plugins/with-screentime/index.ts` so that running it twice is idempotent (FR-022) — completes T008 (depends on T018, T019, T020, T021)
- [ ] T023 Edit `app.json`: add `"./plugins/with-screentime"` to the `expo.plugins` array (single additive line, after the existing `with-live-activity` entry; FR-029)
- [ ] T024 Edit `src/modules/registry.ts`: add the import line and the array entry for the screentime-lab manifest (single additive 1–2 line edit; FR-001, FR-029)

**Checkpoint**: Reducer, bridge (3 platform variants), Swift scaffold, config plugin, app.json, and registry are wired. The module appears in the grid. Foundational tests T006 / T007 / T008 are green. User-story phases can now begin in parallel.

---

## Phase 3: User Story 1 — Browse the showcase without an entitlement (Priority: P1) 🎯 MVP

**Goal**: A developer without the Apple `com.apple.developer.family-controls` entitlement can open Modules → Screen Time Lab on iOS, see the `EntitlementBanner`, browse the four cards, and tap every action button without the app crashing. Every action surfaces an "Entitlement required" status message.

**Independent Test**: With the plugin disabled (Quickstart §2 Option A) or on an unentitled iOS build, navigate to the module. Verify (a) banner is rendered, (b) all four cards render, (c) tapping any action button updates the card's status text and never throws, (d) `pnpm test` is green for every test in this phase.

### Tests for User Story 1 (write FIRST, must FAIL before implementation)

- [ ] T025 [P] [US1] Test `test/unit/modules/screentime-lab/components/EntitlementBanner.test.tsx`: renders nothing when `entitlementsAvailable === true`; renders banner copy + link to `quickstart.md` when `false`; uses `ThemedView` / `ThemedText` and the `Spacing` scale (FR-009, FR-028)
- [ ] T026 [P] [US1] Test `test/unit/modules/screentime-lab/components/AuthorizationCard.test.tsx`: renders status pill reflecting `authStatus`; "Request Authorization" button dispatches the bridge call; on `EntitlementMissingError` rejection, status text reads "Entitlement required …"; button stays enabled (FR-005, FR-013, FR-023)
- [ ] T027 [P] [US1] Test `test/unit/modules/screentime-lab/components/ActivityPickerCard.test.tsx`: renders "Pick apps & categories" button + summary "N apps / N categories / N web domains" + "Clear selection" button; rejection path surfaces status; null `selectionSummary` shows empty-state copy (FR-006, FR-023)
- [ ] T028 [P] [US1] Test `test/unit/modules/screentime-lab/components/ShieldingCard.test.tsx`: both buttons disabled when `selectionSummary === null`; enabled when a selection exists; rejection path surfaces status; success path updates pill (FR-007, FR-023)
- [ ] T029 [P] [US1] Test `test/unit/modules/screentime-lab/components/MonitoringCard.test.tsx`: renders "Start daily monitor" / "Stop monitor" + Active/Inactive pill + default schedule "09:00–21:00 daily"; rejection path surfaces status (FR-008, FR-023)
- [ ] T030 [P] [US1] Test `test/unit/modules/screentime-lab/screen.test.tsx`: iOS screen renders `EntitlementBanner` at top when probe → false; renders the four cards in the FR-004 order (Authorization, Activity Selection, Shielding, Monitoring); when probe → true, banner is absent; mount triggers hydration dispatch sequence per `data-model.md` §4 (FR-009, FR-017)
- [ ] T031 [P] [US1] Test `test/unit/modules/screentime-lab/manifest.test.ts`: manifest `id === 'screentime-lab'`, `platforms` includes `'ios'`, `'android'`, `'web'`, `minIOS === '16.0'`, `screen` reference resolves (FR-001)

### Implementation for User Story 1

- [ ] T032 [P] [US1] Implement `src/modules/screentime-lab/components/EntitlementBanner.tsx` (props: `{ visible: boolean }`; uses `ThemedView` + `ThemedText` + `Spacing`; styles via `StyleSheet.create()`) — makes T025 pass
- [ ] T033 [P] [US1] Implement `src/modules/screentime-lab/components/AuthorizationCard.tsx` (consumes reducer state + dispatch via props or context; calls `bridge.requestAuthorization()`; on rejection, dispatches `BRIDGE_ERROR`) — makes T026 pass
- [ ] T034 [P] [US1] Implement `src/modules/screentime-lab/components/ActivityPickerCard.tsx` (calls `bridge.pickActivity()` and dispatches `SELECTION_PICKED` / `BRIDGE_ERROR`; renders summary; "Clear selection" dispatches `SELECTION_CLEARED`) — makes T027 pass
- [ ] T035 [P] [US1] Implement `src/modules/screentime-lab/components/ShieldingCard.tsx` (Apply / Clear buttons gated by `selectionSummary !== null`; dispatches `SHIELDING_APPLIED` / `SHIELDING_CLEARED` / `BRIDGE_ERROR`) — makes T028 pass
- [ ] T036 [P] [US1] Implement `src/modules/screentime-lab/components/MonitoringCard.tsx` (Start passes hard-coded `{startHour:9,startMinute:0,endHour:21,endMinute:0}` to `bridge.startMonitoring`; Stop calls `bridge.stopMonitoring`) — makes T029 pass
- [ ] T037 [US1] Implement `src/modules/screentime-lab/screen.tsx`: mounts `useReducer(reducer, initialState)`; on mount dispatches the hydration sequence from `data-model.md` §4; renders `EntitlementBanner` + the 4 cards in FR-004 order; threads state + dispatch into each card — makes T030 pass (depends on T010, T011, T032–T036)
- [ ] T038 [US1] Implement `src/modules/screentime-lab/index.tsx`: exports a `ModuleManifest` with `id: 'screentime-lab'`, `title: 'Screen Time Lab'`, `platforms: ['ios','android','web']`, `minIOS: '16.0'`, `screen: () => import('./screen')` — makes T031 pass

**Checkpoint**: User Story 1 is complete. The module appears in the Modules grid, the iOS unentitled path is fully exercised, every native action surfaces a typed "Entitlement required" status without crashing, and `pnpm test` is green for the entire screentime-lab tree on Windows. **This is the MVP — deploy/demo from here.**

---

## Phase 4: User Story 4 — Cross-platform graceful degradation (Priority: P2)

**Goal**: On Android and Web, the module appears in the grid, opens to a "Screen Time API is iOS-only" banner, and renders the four-card structure with all controls disabled. No exceptions ever reach the JS console.

**Independent Test**: `pnpm android` and `pnpm web` — open the module, verify the iOS-only banner, verify all four cards render with disabled buttons, verify `bridge.isAvailable()` returns `false` synchronously, verify no console errors.

### Tests for User Story 4 (write FIRST)

- [ ] T039 [P] [US4] Test `test/unit/modules/screentime-lab/screen.android.test.tsx`: renders "Screen Time API is iOS-only" banner; renders the four cards with all interactive controls in their disabled state; never throws; never invokes any async bridge method (FR-010)
- [ ] T040 [P] [US4] Test `test/unit/modules/screentime-lab/screen.web.test.tsx`: identical assertions to T039 but for the web variant (FR-010)

### Implementation for User Story 4

- [ ] T041 [P] [US4] Implement `src/modules/screentime-lab/screen.android.tsx`: renders an iOS-only `EntitlementBanner` variant (or a sibling `IosOnlyBanner` reusing the same component) and the four cards in disabled mode (no bridge calls) — makes T039 pass
- [ ] T042 [P] [US4] Implement `src/modules/screentime-lab/screen.web.tsx`: identical to T041 but for web — makes T040 pass

**Checkpoint**: User Story 4 is complete. Module renders identically (educationally) on all three platforms; iOS-only behavior is explicit, never a silent failure.

---

## Phase 5: User Story 2 — Authorize, pick activity, apply shielding (with entitlement) (Priority: P2)

**Goal**: An entitled developer on a physical iOS 16+ device taps Request Authorization → approves → picks apps in `FamilyActivityPicker` → taps Apply Shielding → verifies the system shield UI blocks the chosen apps → taps Clear Shielding → verifies the apps launch again.

**Independent Test**: Documented in `quickstart.md` §3a + §3b — on-device only. JS-pure tests exist on the rejection path (covered by US1 tests); no Windows-runnable test for the success path is feasible.

> **Note**: All Swift sources were scaffolded in T014–T017 (Foundational). This phase fills in the success-path Swift bodies so an entitled build does the right thing. There are no new JS files or new tests in this phase — the JS bridge contract from T011 and the cards from T032–T036 already cover both rejection and success paths. The work here is Swift body completion.

### Implementation for User Story 2

- [ ] T043 [US2] Complete Swift `native/ios/screentime/ScreenTimeManager.swift` `requestAuthorization()` body: `try await AuthorizationCenter.shared.requestAuthorization(for: .individual)`; map to `AuthorizationStatus` string; persist to App Group key `screentime.auth.status` (FR-011, data-model §4) — verifies on-device per quickstart §3a
- [ ] T044 [US2] Complete Swift `ScreenTimeManager.swift` `getAuthorizationStatus()` body: read `AuthorizationCenter.shared.authorizationStatus`, map to string union (FR-011)
- [ ] T045 [US2] Complete Swift `ScreenTimeManager.swift` `pickActivity()` body: present `FamilyActivityPickerView` (T015) via `UIHostingController` from the topmost view controller; on done, base64-encode the `FamilyActivitySelection` via `Codable`, persist `screentime.selection.token` + cached counts to the App Group, resolve with `SelectionSummary`; on cancel, reject with `PickerCancelled` (R-002, FR-016)
- [ ] T046 [US2] Complete Swift `ScreenTimeManager.swift` `applyShielding(token:)` body: base64-decode `FamilyActivitySelection`, assign `store.shield.applications`, `store.shield.applicationCategories = .specific(...)`, `store.shield.webDomains` on the default `ManagedSettingsStore()`; idempotent re-apply (R-005)
- [ ] T047 [US2] Complete Swift `ScreenTimeManager.swift` `clearShielding()` body: assign all three `store.shield.*` properties to `nil` / empty (R-005)

**Checkpoint**: User Story 2 is complete. On an entitled device, the authorize → pick → shield → unshield loop works end-to-end and is verified via the Quickstart §3b ritual. Unentitled and non-iOS paths remain typed-rejection (no regression to US1 / US4).

---

## Phase 6: User Story 3 — Schedule a daily monitoring window (with entitlement) (Priority: P3)

**Goal**: An entitled developer on iOS taps Start daily monitor → registers a 09:00–21:00 schedule with `DeviceActivityCenter` → at the next schedule boundary, the `DeviceActivityMonitorExtension`'s `intervalDidStart` / `intervalDidEnd` fire and emit `OSLog` lines visible in Console.app under `subsystem:com.spot.screentime`. Tap Stop monitor → schedule is removed and no further callbacks fire.

**Independent Test**: Documented in `quickstart.md` §3c — on-device + Console.app log watch. JS-pure tests for the rejection path are covered by T029 / T036 (US1).

### Implementation for User Story 3

- [ ] T048 [US3] Complete Swift `ScreenTimeManager.swift` `startMonitoring(token:schedule:)` body: build `DeviceActivitySchedule` from the JS schedule (intervalStart/intervalEnd `DateComponents`), call `DeviceActivityCenter().startMonitoring(.init(rawValue: "spot.screentime.daily"), during: schedule)`; persist `screentime.monitoring.activityName` + JSON-encoded schedule to the App Group (R-003, data-model §4)
- [ ] T049 [US3] Complete Swift `ScreenTimeManager.swift` `stopMonitoring()` body: `DeviceActivityCenter().stopMonitoring([.init(rawValue: "spot.screentime.daily")])`; clear App Group monitoring keys; no-op (no rejection) when nothing is registered
- [ ] T050 [US3] Complete Swift `native/ios/screentime/DeviceActivityMonitorExtension.swift` `intervalDidStart` body: read selection token from App Group; `os_log("intervalDidStart for activity %{public}@", log: monitorLog, type: .info, activity.rawValue)`
- [ ] T051 [US3] Complete Swift `DeviceActivityMonitorExtension.swift` `intervalDidEnd` body: same logging pattern with "intervalDidEnd"; release any locally-held resources
- [ ] T052 [US3] Complete Swift `DeviceActivityMonitorExtension.swift` `eventDidReachThreshold(_:activity:)` body: log threshold event with event name + activity name (defensive — feature does not currently register thresholds, but the callback must exist per Apple API)

**Checkpoint**: User Story 3 is complete. On an entitled device, the start → wait-for-boundary → stop loop is verified via `quickstart.md` §3c. Console.app shows the expected log lines. Unentitled / non-iOS paths remain typed-rejection.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates and validation that span every story.

- [ ] T053 Run `pnpm format` from repo root and commit any formatting changes
- [ ] T054 Run `pnpm lint` from repo root; fix any lint errors introduced by the feature (no new disable comments)
- [ ] T055 Run `pnpm typecheck` from repo root; resolve any TypeScript strict-mode errors (FR-028)
- [ ] T056 Run `pnpm test` from repo root; confirm every screentime-lab test from T006–T008, T025–T031, T039–T040 is green and overall suite is green (FR-026)
- [ ] T057 [P] Walk through `quickstart.md` §4a (run JS-pure suite) and §4b (manually exercise unentitled UI path in simulator) — record observations in commit message or PR description
- [ ] T058 [P] Walk through `quickstart.md` §4c (cross-platform graceful degradation on Android + Web) — confirm no console exceptions
- [ ] T059 Verify FR-029 additive-change-set constraint by running `git diff --stat main..HEAD -- src/ app.json` and confirming the only modifications to existing files are `src/modules/registry.ts` (≤ 2 lines) and `app.json` (1 plugin entry)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → no dependencies, run first
- **Foundational (Phase 2)** → depends on Setup; **BLOCKS all user-story phases**
- **User Story 1 (Phase 3, P1)** → depends on Foundational; independently testable; **MVP**
- **User Story 4 (Phase 4, P2)** → depends on Foundational; independent of US1/US2/US3
- **User Story 2 (Phase 5, P2)** → depends on Foundational; on-device verification only; independent of US1/US3/US4 at code level
- **User Story 3 (Phase 6, P3)** → depends on Foundational; on-device verification only; independent at code level
- **Polish (Phase 7)** → depends on whichever stories you intend to ship

### Within-Story Dependencies

- Tests precede implementation in every story (RED → GREEN)
- T010 (reducer) must precede every component that dispatches actions (T032–T037)
- T009 (types) must precede T011/T012/T013 (bridge variants) and any test that imports the error classes
- T011 (iOS bridge) must precede T037 (iOS screen mount) — the screen calls the bridge at mount
- T022 (plugin compose) must follow T018–T021 (sub-plugins)
- T043–T047 (US2 Swift bodies) all live in the same file as T014's scaffold — sequential within US2
- T048–T049 (US3 Manager bodies) and T050–T052 (US3 Extension bodies) edit two files; T048/T049 are sequential to each other (same file), T050–T052 are sequential to each other (same file), but the two files are parallelizable

### Parallel Opportunities

- T002–T005 (Setup directory creation) all parallel
- T006, T007, T008 (Foundational test files) all parallel — different files
- T009 + T014–T021 (types, Swift scaffold trio + podspec, plugin sub-files) all parallel after T006–T008 are written — different files
- T012, T013 (Android + Web stubs) parallel to each other once T009 lands
- T025–T031 (US1 component tests + screen test + manifest test) all parallel — different files
- T032–T036 (US1 components) all parallel — different files
- T039 + T040 (US4 screen tests) parallel; T041 + T042 (US4 screen impls) parallel
- T050, T051, T052 are sequential among themselves but parallel to T048/T049 because they edit a different Swift file
- T057 + T058 (Polish manual walkthroughs) parallel

### Cross-story coordination

- US1 and US4 share `EntitlementBanner.tsx` (T032) — US4 screens (T041/T042) consume it after T032 lands
- US2 (T043–T047) and US3 (T048–T049) both edit `ScreenTimeManager.swift` (the scaffold from T014). Within each story the edits are sequential; across stories they touch disjoint methods so two developers can branch from T014 and merge with no conflicts beyond import-block ordering
- The reducer (T010) is a single file shared by every component test — write once, then T025–T031 can all run

---

## Parallel Example: User Story 1 component tests

```bash
# Launch all five US1 component tests in parallel — independent files:
Task: "Test test/unit/modules/screentime-lab/components/EntitlementBanner.test.tsx"
Task: "Test test/unit/modules/screentime-lab/components/AuthorizationCard.test.tsx"
Task: "Test test/unit/modules/screentime-lab/components/ActivityPickerCard.test.tsx"
Task: "Test test/unit/modules/screentime-lab/components/ShieldingCard.test.tsx"
Task: "Test test/unit/modules/screentime-lab/components/MonitoringCard.test.tsx"

# Then launch all five component implementations in parallel:
Task: "Implement src/modules/screentime-lab/components/EntitlementBanner.tsx"
Task: "Implement src/modules/screentime-lab/components/AuthorizationCard.tsx"
Task: "Implement src/modules/screentime-lab/components/ActivityPickerCard.tsx"
Task: "Implement src/modules/screentime-lab/components/ShieldingCard.tsx"
Task: "Implement src/modules/screentime-lab/components/MonitoringCard.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1: Setup
2. Phase 2: Foundational (reducer + bridge + plugin + Swift scaffold + registry + app.json)
3. Phase 3: User Story 1
4. **STOP and VALIDATE**: walk Quickstart §4 (Windows / unentitled path)
5. Ship/demo. The unentitled experience is fully working and tested.

### Incremental Delivery

- Setup + Foundational → Foundation ready
- Add US1 → Quickstart §4 validates → MVP ships
- Add US4 → Quickstart §4c validates → cross-platform shipped
- Add US2 → Quickstart §3a / §3b validate on entitled device → entitled shielding shipped
- Add US3 → Quickstart §3c validates with Console.app → entitled monitoring shipped
- Polish (Phase 7) → quality gates green on every shipped increment

### Parallel Team Strategy

After Foundational completes:
- Developer A: US1 (P1, MVP) — pure JS, Windows-runnable
- Developer B: US4 (P2) — pure JS, Windows-runnable, parallel to A
- Developer C: US2 + US3 Swift bodies — requires macOS + entitled device for verification, parallel to A/B at the source level (different files except `ScreenTimeManager.swift` which sequences within C)

---

## Notes

- `[P]` = different file, no dependency on any incomplete task
- `[Story]` tag maps every story task back to spec.md user stories US1 / US2 / US3 / US4 for traceability
- All Swift sources under `native/ios/screentime/` are scaffold-only and not unit-testable on Windows (R-007); their verification is on-device per `quickstart.md` and is conditional on holding the `com.apple.developer.family-controls` entitlement
- Tests must be RED before implementation — the TDD gate is enforced (Constitution Principle V)
- Only two existing files may be modified by this entire feature: `src/modules/registry.ts` (T024) and `app.json` (T023). T059 enforces this at PR time.
- Commit after each task or each logical group; never bundle unrelated changes
