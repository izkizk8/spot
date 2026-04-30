---
description: "Dependency-ordered TDD task list for 040-handoff-continuity"
---

# Tasks: NSUserActivity / Handoff / Continuity Module (`handoff-lab`)

**Input**: Design documents from `/specs/040-handoff-continuity/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: REQUIRED for every JS/TS source file (TDD per Constitution v1.1.0 Principle V). The native Swift bridge (`HandoffBridge.swift` + `HandoffActivityHandler.swift`) is intentionally NOT unit-tested because consumers mock at the JS import boundary (`jest.mock('@/native/handoff', …)`). Two-device on-device validation is deferred to a manual step (T044), mirroring 039's T044 deferral.

**Organization**: Tasks are grouped by user story (US1–US7) so each story can be implemented and validated independently. Phase 1 (Setup) and Phase 2 (Foundational) are shared infrastructure that must complete before any user story phase begins. Phase 3 (US7) is built early because it delivers the simplest renderable surface and validates the manifest end-to-end.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Parallelizable (different file, no dependency on an unfinished task)
- **[Story]**: User-story tag (`[US1]`–`[US7]`) on user-story-phase tasks only
- All paths are repo-root-relative
- **No `eslint-disable`** anywhere in any new file (FR-021)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Ensure the working tree is clean and dependencies are installed. No new npm packages are added by this feature — the bridge is hand-written Swift.

- [X] T001 Run `pnpm install` from repo root; verify lockfile unchanged. Confirm working tree clean on branch `040-handoff-continuity`. **Acceptance**: `pnpm install` exits 0; `git status` shows no diff.

**Checkpoint**: Repo ready for TDD.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Activity-types constant, JS bridge surface (with non-iOS shim), config plugin (idempotent + 031-coexistent + defensive), app.json + plugin-count bump, module manifest + registry wiring. Prerequisites for every user story.

**⚠️ CRITICAL**: No user-story work begins until this phase is complete.

### 2a. Activity types constant (TDD)

- [X] T002 [P] Write failing test `test/unit/modules/handoff-lab/activity-types.test.ts` — assert (a) `HANDOFF_DEMO_ACTIVITY_TYPE === 'com.izkizk8.spot.activity.handoff-demo'`, (b) it matches `/^[a-zA-Z0-9._-]+$/` and contains at least one `.`, (c) the module exports the constant as `readonly` (compile-time `as const`), (d) any helper exports (e.g. validators) are pure functions returning the same output for equal input. **Acceptance**: test fails with module-not-found.
- [X] T003 Implement `src/modules/handoff-lab/activity-types.ts` exporting `HANDOFF_DEMO_ACTIVITY_TYPE` const-asserted plus the `ActivityDefinition` type-only re-export per data-model.md §1. **Acceptance**: T002 passes.

### 2b. JS bridge non-iOS shim (TDD)

- [X] T004 [P] Write failing test `test/unit/native/handoff.test.ts` covering the bridge contract per `contracts/bridge.md` § "Test contract":
  - `isAvailable === false`
  - `setCurrent(def)` rejects with `HandoffNotSupported` whose message contains `'setCurrent'`
  - `resignCurrent()` rejects with `HandoffNotSupported` whose message contains `'resignCurrent'`
  - `getCurrent()` rejects with `HandoffNotSupported` whose message contains `'getCurrent'`
  - `addContinuationListener(cb)` throws `HandoffNotSupported` synchronously
  - The error class name is exactly `'HandoffNotSupported'`
  
  Imports the module under `src/native/handoff.web.ts` directly (not via the `.web.ts`-resolution path — the test exercises the non-iOS implementation as the source of truth). **Acceptance**: test fails with module-not-found.
- [X] T005 Implement `src/native/handoff.web.ts` per `contracts/bridge.md` § "JS bridge — non-iOS path" — exports `HandoffNotSupported` class, `isAvailable = false`, and the four rejecting/throwing stubs. If repo convention requires a separate `src/native/handoff.android.ts`, re-export from the same `.web.ts` source (single source of truth). **Acceptance**: T004 passes.
- [X] T006 Implement `src/native/handoff.ts` (iOS path) per `contracts/bridge.md` § "JS bridge — iOS path" — `requireNativeModule('Handoff')`, `EventEmitter`, `isAvailable = true`, and the four async re-exports plus `addContinuationListener(cb)`. **No direct unit test** — every consumer mocks this module at the import boundary. **Acceptance**: typecheck passes; `import { setCurrent } from '@/native/handoff'` resolves on iOS bundling.

### 2c. Config plugin (TDD — idempotency, 031 coexistence, defensive)

- [X] T007 [P] Write failing test `test/unit/plugins/with-handoff/index.test.ts` exercising the pure helper `applyHandoffInfoPlist` per `contracts/plugin-merge.md` § "Invariants & test matrix" rows #1–#8:
  - Row 1: missing key → `[HANDOFF_DEMO_ACTIVITY_TYPE]`
  - Row 2: `[]` → `[HANDOFF_DEMO_ACTIVITY_TYPE]`
  - Row 3: `['spot.showcase.activity']` (031 ran first) → `['spot.showcase.activity', HANDOFF_DEMO_ACTIVITY_TYPE]`
  - Row 4: re-run on row #1 output is byte-stable (idempotency)
  - Row 5: both already present → identical (idempotency)
  - Row 6: `'not-an-array'` → `[HANDOFF_DEMO_ACTIVITY_TYPE]` AND `console.warn` fired exactly once with the expected message
  - Row 7: `null` → `[HANDOFF_DEMO_ACTIVITY_TYPE]` AND `console.warn` fired
  - Row 8: mixed `[42, 'spot.showcase.activity', null]` → `['spot.showcase.activity', HANDOFF_DEMO_ACTIVITY_TYPE]` (non-strings dropped)
  - **Coexistence (FR-005)**: `applyHandoffInfoPlist(applySpotlightInfoPlist(x))` and `applySpotlightInfoPlist(applyHandoffInfoPlist(x))` produce equal **sets** of `NSUserActivityTypes` for any prior input — both contain `'spot.showcase.activity'` and `HANDOFF_DEMO_ACTIVITY_TYPE`, no duplicates.
  - **Plugin wrapper**: calling `withHandoff(config)` once invokes `applyHandoffInfoPlist` exactly once on `mod.modResults` (assert via spy).
  - **Plugin coexistence with all prior plugins**: load `app.json` post-T010, assert `plugins` includes `'./plugins/with-handoff'` exactly once and the order of all 30 prior entries is preserved (no reordering).
  
  **Acceptance**: every assertion fails with module-not-found.
- [X] T008 Implement `plugins/with-handoff/index.ts` per `contracts/plugin-merge.md`:
  - Exported pure helper `applyHandoffInfoPlist(input: Record<string, unknown>): Record<string, unknown>` — immutable input, defensive (missing → `[]`, non-array → `[]` + `console.warn`), filters to `string[]`, appends `HANDOFF_DEMO_ACTIVITY_TYPE` only if absent, preserves prior order verbatim, returns new object.
  - Default export `withHandoff: ConfigPlugin` that wraps `withInfoPlist` and calls the helper exactly once.
  - Mirrors `plugins/with-spotlight/index.ts` shape exactly.
  - **No `eslint-disable`**.
  
  Also create `plugins/with-handoff/package.json` mirroring `plugins/with-spotlight/package.json` and a co-located `plugins/with-handoff/index.test.ts` mirroring 031/039 parity (kept consistent for cleanup pass; not picked up by jest per `jest.config.js` testMatch).
  
  **Acceptance**: T007 passes.

### 2d. Plugin-count assertion bump

- [X] T009 Update `test/unit/plugins/with-mapkit/index.test.ts` — bump `expect(plugins.length).toBe(30)` → `toBe(31)` and update the adjacent comment to reference feature 040. **Acceptance**: when run in isolation BEFORE T010, the test now fails (drives the app.json edit); after T010, it passes.

### 2e. App.json registration

- [X] T010 Append `"./plugins/with-handoff"` to `app.json` `plugins[]` (30 → 31 entries). Order: append after the last existing plugin entry; preserve every prior entry verbatim; do not register any third-party plugin. **Acceptance**: T009 passes; `plugins.length === 31`; the new entry is exactly the last element; no other diff in app.json.

### 2f. Module manifest + registry

- [X] T011 [P] Write failing test `test/unit/modules/handoff-lab/manifest.test.ts` — assert the default export from `src/modules/handoff-lab/index.tsx` matches the `ModuleManifest` shape used by 037/038/039 (`id: 'handoff-lab'`, non-empty `title`, `description`, `platforms: ['ios','android','web']`, `minIOS: '8.0'`, lazy `screen` component reference resolves on each platform). **Acceptance**: test fails with module-not-found.
- [X] T012 Implement `src/modules/handoff-lab/index.tsx` — `ModuleManifest` export with `id: 'handoff-lab'`, title/description copy, `platforms: ['ios','android','web']`, `minIOS: '8.0'`, screen reference (direct or lazy per the 038/039 pattern). **Acceptance**: T011 passes.
- [X] T013 Write failing registry test (extend the existing registry test file at `test/unit/modules/registry.test.ts` if present, else add one scoped narrowly to the new entry) asserting (a) the registry contains an entry with `id === 'handoff-lab'`, (b) total registered modules count incremented by exactly 1, (c) `platforms` contains all three of `'ios'`, `'android'`, `'web'`. **Acceptance**: test fails (entry missing).
- [X] T014 Update `src/modules/registry.ts` — one import line + one entry (additive only, per FR-023). **Acceptance**: T013 passes; existing registry tests still pass.

**Checkpoint**: plugin emits Info.plist correctly, idempotently, and coexists with 031 in either order; non-iOS bridge throws `HandoffNotSupported`; registry +1; app.json +1; activity-types constant available; all foundational tests green.

---

## Phase 3: User Story 7 — Cross-platform graceful degradation (Priority: P3, BUILT EARLY)

**Goal**: Android + Web render `IOSOnlyBanner` only — never call the native bridge — and the manifest's platform array is honoured.

**Independent Test**: Mount `screen.android.tsx` / `screen.web.tsx` in jsdom; assert `IOSOnlyBanner` renders and `jest.mock('@/native/handoff')` records zero calls to `setCurrent` / `resignCurrent` / `getCurrent` / `addContinuationListener`.

### Tests (TDD)

- [X] T015 [P] [US7] Write failing test `test/unit/modules/handoff-lab/components/IOSOnlyBanner.test.tsx` — renders title + body copy explaining the iOS-only nature of Handoff, uses `ThemedText`/`ThemedView`, snapshot non-empty, no native imports. **Acceptance**: test fails with module-not-found.
- [X] T016 [P] [US7] Write failing test `test/unit/modules/handoff-lab/screen.android.test.tsx` — renders `IOSOnlyBanner` only inside a `ThemedView` page wrapper; mocks `@/native/handoff` and asserts none of `setCurrent` / `resignCurrent` / `getCurrent` / `addContinuationListener` were invoked. **Acceptance**: fails with module-not-found.
- [X] T017 [P] [US7] Write failing test `test/unit/modules/handoff-lab/screen.web.test.tsx` — same shape as T016, web variant. **Acceptance**: fails with module-not-found.

### Implementation

- [X] T018 [P] [US7] Implement `src/modules/handoff-lab/components/IOSOnlyBanner.tsx` — `ThemedView` + `ThemedText`, `Spacing` only, single quotes, `StyleSheet.create()`. **Acceptance**: T015 passes.
- [X] T019 [P] [US7] Implement `src/modules/handoff-lab/screen.android.tsx` — renders only `<IOSOnlyBanner />` inside a `ThemedView` page wrapper. **Acceptance**: T016 passes.
- [X] T020 [P] [US7] Implement `src/modules/handoff-lab/screen.web.tsx` — same as T019 for web. **Acceptance**: T017 passes.

**Checkpoint**: Android + Web variants render banner; manifest platform claim is honoured without any native bridge calls.

---

## Phase 4: User Story 1 — Open the Lab and read the Explainer (Priority: P1) 🎯 MVP

**Goal**: A first-time user can navigate to the Handoff & Continuity Lab card and read a clear explanation of NSUserActivity, Handoff, and the four runtime conditions.

**Independent Test**: Mount `ExplainerCard.tsx` in jsdom; assert the explainer body contains the canonical short description and uses themed primitives.

### Tests (TDD)

- [X] T021 [P] [US1] Write failing test `test/unit/modules/handoff-lab/components/ExplainerCard.test.tsx` — renders the canonical explainer copy (NSUserActivity, Handoff, Spotlight reuse pointer to 031, prediction note), uses `ThemedText`/`ThemedView`, snapshot non-empty. **Acceptance**: fails with module-not-found.

### Implementation

- [X] T022 [P] [US1] Implement `src/modules/handoff-lab/components/ExplainerCard.tsx`. **Acceptance**: T021 passes.

**Checkpoint**: Explainer surface renders independently of the bridge.

---

## Phase 5: `useHandoffActivity` hook (Foundational for US2 / US3 / US4)

**Rationale**: The hook is shared by Stories 2, 3, 4. Built once, mocked at the import boundary in component tests, exercised end-to-end by the screen test in Phase 8.

### Tests (TDD — JS-pure with `jest.mock('@/native/handoff', …)` at the top of file)

- [X] T023 Write failing test `test/unit/modules/handoff-lab/hooks/useHandoffActivity.test.tsx` — covers (per data-model.md §3 state transitions and contracts/continuation.md):
  - Initial state: `currentActivity === null`, `log === []`, `isAvailable === true` (with mocked iOS bridge).
  - `setCurrent(def)` forwards to bridge.`setCurrent` and, on resolve, mirrors `currentActivity = def` synchronously.
  - `resignCurrent()` forwards to bridge.`resignCurrent` and, on resolve, sets `currentActivity = null`.
  - `getCurrent()` forwards to bridge.`getCurrent` and returns its result (debug-only; does not mutate `currentActivity`).
  - `subscribeToIncoming` / continuation listener: invoking the captured callback with a valid wire payload prepends a `ContinuationEvent` to `log[0]`; `receivedAt` is a valid ISO string set client-side.
  - **Log truncation at 10** (FR-014): firing 12 valid events leaves `log.length === 10` with the most-recent event at index 0 and the oldest two dropped from the tail.
  - **Discard rule** (FR-015): firing an event with missing or non-string `activityType` leaves `log` unchanged and (in `__DEV__`) emits exactly one `console.warn`.
  - **Defensive normalisation**: `userInfo === null` → `{}`; non-array `requiredUserInfoKeys` → `[]`; non-string keys in `userInfo` keys / `requiredUserInfoKeys` are dropped.
  - **Error paths**: `setCurrent` rejection leaves `currentActivity` unchanged; `resignCurrent` rejection leaves `currentActivity` unchanged.
  - **Unmount cleanup**: unmounting the hook calls the unsubscribe function returned by `addContinuationListener` exactly once; subsequent bridge-fired events do not throw and do not mutate any captured ref.
  
  **Acceptance**: every assertion fails with module-not-found.

### Implementation

- [X] T024 Implement `src/modules/handoff-lab/hooks/useHandoffActivity.ts` (iOS path) — subscribes once via `useEffect` with cleanup, exposes `{ currentActivity, log, isAvailable, setCurrent, resignCurrent, getCurrent }`, applies the normalisation in `contracts/continuation.md` §"JS-side normalisation", enforces FIFO truncation at 10, mirrors `currentActivity` synchronously after `setCurrent` resolves, clears it after `resignCurrent` resolves. **No `eslint-disable`**. **Acceptance**: T023 passes.
- [X] T025 [P] Implement `src/modules/handoff-lab/hooks/useHandoffActivity.web.ts` — JS-pure stub returning the same TypeScript shape with `isAvailable: false`, `currentActivity: null`, `log: []`, every method returns `Promise.reject(new HandoffNotSupported(…))` (or no-ops the listener). No separate unit test required — exercised through `screen.android.test.tsx` / `screen.web.test.tsx` mocks. **Acceptance**: typecheck passes; the web/android screens import this stub.

**Checkpoint**: Hook is ready to consume by every remaining story; native bridge is fully mocked at the import boundary in all tests.

---

## Phase 6: User Story 2 — Compose an activity and become current (Priority: P1)

**Goal**: User edits an `ActivityDefinition` in `ActivityComposer` (with `KeyValueEditor` for `userInfo`) and taps "Become current" to invoke `useHandoffActivity().setCurrent`.

**Independent Test**: Mount `ActivityComposer.tsx` in jsdom with the hook mocked; fill required fields; assert "Become current" enabled only when validation passes (per data-model.md §1 rules), and tapping it calls hook.`setCurrent` once with the expected `ActivityDefinition`.

### Tests (TDD)

- [X] T026 [P] [US2] Write failing test `test/unit/modules/handoff-lab/components/KeyValueEditor.test.tsx` — covers: add row appends an empty `{ key: '', value: '' }`, edit updates by index, remove splices, duplicate-key detection surfaces an error string, returned `onChange` payload matches the parent contract (ordered array). **Acceptance**: fails with module-not-found.
- [X] T027 [P] [US2] Write failing test `test/unit/modules/handoff-lab/components/ActivityComposer.test.tsx` — covers (per data-model.md §1 / §4):
  - Default form state matches the documented defaults (`activityType = HANDOFF_DEMO_ACTIVITY_TYPE`, `title = 'Handoff demo activity'`, eligibility flags all `true`).
  - `activityType` validation: empty → error; non-matching regex → error; missing `.` → error.
  - `webpageURL` validation: empty allowed; invalid URL → error; `ftp://` → error.
  - `userInfo` duplicate keys → error surfaced from `KeyValueEditor`.
  - `requiredUserInfoKeys` referencing a missing key → error.
  - "Become current" button disabled when any error is set; enabled only when `composerStateToDefinition` returns non-null.
  - Tapping "Become current" calls hook.`setCurrent` exactly once with the deserialised `ActivityDefinition`.
  - The hook is mocked at the top of the test file via `jest.mock('../hooks/useHandoffActivity', …)` (or the resolved path).
  
  **Acceptance**: fails with module-not-found.

### Implementation

- [X] T028 [P] [US2] Implement `src/modules/handoff-lab/components/KeyValueEditor.tsx` — controlled rows, ordered, duplicate-key detection, `Spacing` + `StyleSheet.create()` only. **Acceptance**: T026 passes.
- [X] T029 [US2] Implement `src/modules/handoff-lab/components/ActivityComposer.tsx` — `ComposerFormState` (data-model.md §4), `composerStateToDefinition` pure helper, validation per data-model.md §1, embeds `KeyValueEditor`, calls `useHandoffActivity().setCurrent` on submit. Depends on T028. **Acceptance**: T027 passes.

**Checkpoint**: User can compose a valid activity and dispatch it to the (mocked) bridge.

---

## Phase 7: User Story 3 — Inspect the Current Activity and resign it (Priority: P1)

**Goal**: After "Become current", `CurrentActivityCard` shows the mirrored `ActivityDefinition`; "Resign" calls `useHandoffActivity().resignCurrent` and the card returns to the empty state.

**Independent Test**: Mount `CurrentActivityCard.tsx` with `currentActivity` prop populated; assert all fields render; tap "Resign"; assert `onResign` callback fires.

### Tests (TDD)

- [X] T030 [P] [US3] Write failing test `test/unit/modules/handoff-lab/components/CurrentActivityCard.test.tsx` — covers: empty state (`currentActivity === null`) shows "No current activity"; populated state renders `activityType`, `title`, `webpageURL` (when present), formatted `userInfo` JSON, sorted `requiredUserInfoKeys`, all three eligibility flags as themed pills; "Resign" button disabled when empty, enabled when populated, calls `onResign` exactly once when tapped. **Acceptance**: fails with module-not-found.

### Implementation

- [X] T031 [P] [US3] Implement `src/modules/handoff-lab/components/CurrentActivityCard.tsx` — accepts `{ currentActivity, onResign }`, themed pills via `useTheme()`, `StyleSheet.create()` only. **Acceptance**: T030 passes.

**Checkpoint**: Card renders both states correctly in isolation.

---

## Phase 8: User Story 4 — Receive a continuation event from another device (Priority: P1)

**Goal**: When the bridge fires `onContinue`, `IncomingLog` shows a new row at the top with up to the last 10 events.

**Independent Test**: Mount `IncomingLog.tsx` with `events` prop populated (1, 5, 11 entries); assert FIFO order, max-10 cap visualised, empty-state copy when `events === []`.

### Tests (TDD)

- [X] T032 [P] [US4] Write failing test `test/unit/modules/handoff-lab/components/IncomingLog.test.tsx` — covers: empty state ("Waiting for incoming activities…"); single-event renders `activityType`, `title`, `webpageURL` (when present), `userInfo` JSON, `requiredUserInfoKeys`, `receivedAt` formatted; 11-event prop produces 10 rendered rows (consumer enforces cap; component does not slice but asserts the rendered count matches input length so the contract is documented); rows render in input order (most-recent first, since the hook prepends). **Acceptance**: fails with module-not-found.

### Implementation

- [X] T033 [P] [US4] Implement `src/modules/handoff-lab/components/IncomingLog.tsx` — accepts `{ events: ContinuationEvent[] }`, renders each row inline (no separate `IncomingLogRow` file; rows are a local subcomponent), `Spacing` + themed primitives. **Acceptance**: T032 passes.

**Checkpoint**: Log surface verified in isolation; truncation invariant lives in the hook (T023/T024) and the rendering contract is documented in T032.

---

## Phase 9: User Story 5 — Read the Setup Instructions (Priority: P2)

**Goal**: A documentary card listing the 8 numbered cross-device steps from quickstart.md §5.

**Independent Test**: Mount `SetupInstructions.tsx`; assert exactly 8 ordered list items; assert each item references one of (iCloud, Handoff toggle, Bluetooth, awake, install spot, become current, hint, tap to continue).

### Tests (TDD)

- [X] T034 [P] [US5] Write failing test `test/unit/modules/handoff-lab/components/SetupInstructions.test.tsx` — asserts (a) exactly 8 numbered steps, (b) each step is non-empty, (c) the four runtime conditions (iCloud / Bluetooth / Handoff toggle / both awake) are each mentioned, (d) themed primitives only. **Acceptance**: fails with module-not-found.

### Implementation

- [X] T035 [P] [US5] Implement `src/modules/handoff-lab/components/SetupInstructions.tsx` — static themed list per quickstart.md §5. **Acceptance**: T034 passes.

**Checkpoint**: Setup card renders independently.

---

## Phase 10: iOS screen integration (US1 + US2 + US3 + US4 + US5)

**Goal**: Compose `ExplainerCard`, `ActivityComposer`, `CurrentActivityCard`, `IncomingLog`, `SetupInstructions`, and the `IOSOnlyBanner`-equivalent reset surfaces into the iOS Lab screen, wired to `useHandoffActivity`.

### Tests (TDD)

- [X] T036 [P] Write failing test `test/unit/modules/handoff-lab/screen.test.tsx` — covers:
  - Mounts on iOS (`Platform.OS = 'ios'` via test setup).
  - Renders `ExplainerCard`, `ActivityComposer`, `CurrentActivityCard`, `IncomingLog`, `SetupInstructions` in vertical order.
  - **US3 wiring**: tapping "Resign" on `CurrentActivityCard` calls `useHandoffActivity().resignCurrent`.
  - **US4 wiring**: when the mocked hook exposes a populated `log`, `IncomingLog` renders the rows.
  - `useHandoffActivity` is mocked at the top of the test file; no real native bridge call.
  
  **Acceptance**: fails with module-not-found.

### Implementation

- [X] T037 Implement `src/modules/handoff-lab/screen.tsx` — composes all five sections, wires `CurrentActivityCard.onResign` → `hook.resignCurrent`, surfaces `hook.currentActivity` and `hook.log` as props. **No `eslint-disable`**. **Acceptance**: T036 passes.

**Checkpoint**: iOS lab screen renders end-to-end in tests; US1/2/3/4/5 all exercised through the mocked bridge.

---

## Phase 11: Native Swift bridge

**Rationale**: Last because every JS consumer mocks at the import boundary; the Swift bridge is validated only by the manual on-device run (T044).

- [X] T038 Implement `native/ios/handoff/HandoffBridge.swift` and `native/ios/handoff/HandoffActivityHandler.swift` per `contracts/bridge.md` § "Native (Swift) module" and `contracts/continuation.md` § "Wire payload" — single task, no unit test:
  - `HandoffBridge`: `Module` DSL with `Name("Handoff")`, `Constants(["isAvailable": true])`, `Events("onContinue")`, async `setCurrent` / `resignCurrent` / `getCurrent` operating on `UIApplication.shared.userActivity` via the `ActivityDefinitionRecord` DTO; `requiredUserInfoKeys` round-tripped as `Set<String>` ↔ sorted `[String]`.
  - `HandoffActivityHandler`: `AppDelegateSubscriber` implementing `application(_:continue:restorationHandler:)` — converts `NSUserActivity` to the wire payload (data-model.md §2 + contracts/continuation.md), sends on `onContinue`, always returns `true`.
  - Add `native/ios/handoff/HandoffModule.podspec` if autolinking via `expo-modules-core` requires it (verify against repo convention; mirror an existing hand-written bridge such as `031`'s Spotlight bridge if present, otherwise rely on autolinking).
  
  **No `eslint-disable`** equivalent in Swift (no analogue applies). **Acceptance**: `npx expo prebuild --platform ios --clean` succeeds; `pod install` succeeds; `npx expo run:ios` builds without errors. (Build validation is part of T044's manual run.)

**Checkpoint**: Native bridge implementation in place; ready for two-device validation.

---

## Phase 12: Polish & Cross-Cutting

- [X] T039 [P] Run `pnpm format` from repo root; verify no diff in already-formatted files. **Acceptance**: `git status` clean for non-feature files; only feature files formatted.
- [X] T040 [P] Run `pnpm lint`; verify zero errors and **zero `eslint-disable`** directives in new files. Confirm with `git grep -nE 'eslint-disable' src/modules/handoff-lab src/native/handoff plugins/with-handoff test/unit/modules/handoff-lab test/unit/plugins/with-handoff test/unit/native/handoff.test.ts` returning empty. **Acceptance**: lint exits 0; grep is empty.
- [X] T041 [P] Run `pnpm typecheck`; verify zero TS errors across the new module + plugin + bridge. **Acceptance**: typecheck exits 0.
- [X] T042 Run `pnpm test`; all suites green including the new ~14 test files (~40+ cases) and the bumped plugin-count assertion (30 → 31). **Acceptance**: jest exits 0.
- [X] T043 Run `pnpm check` (typecheck + lint + format + tests bundle); zero failures. **Acceptance**: exit 0.
- [ ] T044 Execute quickstart.md §5–§7 on **two real iOS devices** signed into the same iCloud account: prebuild, `pod install`, `run:ios --device` on Device A, install the same build on Device B, "Become current" on A, observe Handoff hint on B, tap to continue, verify the new row in `IncomingLog`. Also verify Info.plist `NSUserActivityTypes` contains both `'spot.showcase.activity'` and `'com.izkizk8.spot.activity.handoff-demo'` (set equality, order-independent) and that re-running `npx expo prebuild --platform ios` produces a byte-identical Info.plist. Capture pass/fail per success criterion (SC-1..SC-N). **DEFERRED — manual two-device on-device verification; out-of-scope for autonomous run** (analogous to 039's T044 deferral).
- [X] T045 Update the `<!-- SPECKIT START --> ... <!-- SPECKIT END -->` block in `.github/copilot-instructions.md` to reference `specs/040-handoff-continuity/plan.md` (currently points at `specs/039-quick-actions/plan.md`). **Acceptance**: diff is exactly the path swap; surrounding markers untouched.

---

## Dependencies & Execution Order

### Phase order

1. **Phase 1 Setup** (T001) — must complete first.
2. **Phase 2 Foundational** (T002–T014) — blocks all stories.
3. **Phase 3 US7** (T015–T020) — built early; depends only on Phase 2.
4. **Phase 4 US1** (T021–T022) — depends on Phase 2.
5. **Phase 5 Hook** (T023–T025) — depends on T003 (activity types), T005 (web bridge stub), T006 (iOS bridge surface). Blocks US2/US3/US4 wiring and screen integration.
6. **Phase 6 US2** (T026–T029) — depends on Phase 5 + T028 before T029.
7. **Phase 7 US3** (T030–T031) — depends on Phase 5.
8. **Phase 8 US4** (T032–T033) — depends on Phase 5.
9. **Phase 9 US5** (T034–T035) — independent of Phase 5; depends only on Phase 2.
10. **Phase 10 iOS screen** (T036–T037) — depends on Phases 4, 5, 6, 7, 8, 9.
11. **Phase 11 Native Swift** (T038) — depends on Phase 2 contracts; can be authored in parallel with JS phases since JS tests mock at the import boundary, but is required before T044.
12. **Phase 12 Polish** (T039–T045) — depends on all prior phases. T044 is deferred manual.

### Test-first within each task pair

For every implementation task, its preceding test task **must be written, run, and observed FAILING** before the implementation begins. Verify red → green per Constitution Principle V.

### Parallel opportunities (`[P]`)

- **T002 / T004 / T007 / T011** — independent foundational tests, can be authored in parallel.
- **T015 / T016 / T017** + **T018 / T019 / T020** — IOSOnlyBanner / android-screen / web-screen tests + impls run in parallel (different files).
- **T021 / T022** — ExplainerCard test + impl in parallel with US7 work (different file tree).
- **T025** — hook web stub in parallel with the iOS hook impl (different files).
- **T026 / T027** — US2 KeyValueEditor + ActivityComposer tests in parallel; **T028** in parallel with **T026/T027/T030/T032/T034**; **T029** waits on T028.
- **T030 / T031** — US3 test + impl in parallel with US4 / US5 work.
- **T032 / T033** — US4 test + impl in parallel with US3 / US5 work.
- **T034 / T035** — US5 test + impl in parallel with US3 / US4 work.
- **T036** — screen test in parallel with all component tests (different file).
- **T039 / T040 / T041** — format / lint / typecheck in parallel.

### Within-story sequencing rules

- Tests precede the implementation they cover (RED → GREEN).
- Component tests precede screen-composition tests (smaller surface first).
- Hook (Phase 5) precedes any component that imports it (US2 composer, screen).
- Plugin helper (T008) precedes app.json registration (T010); T010 unblocks the bumped assertion (T009).
- Native Swift (T038) is required before manual T044 but does not block any JS test.

---

## Parallel Example: Phase 3 (US7) tests + impls

```bash
# Author all 3 tests in parallel (different files, no shared deps):
Task: "Write failing IOSOnlyBanner.test.tsx"
Task: "Write failing screen.android.test.tsx"
Task: "Write failing screen.web.test.tsx"

# Once each test is RED, implement in parallel:
Task: "Implement IOSOnlyBanner.tsx"
Task: "Implement screen.android.tsx"
Task: "Implement screen.web.tsx"
```

---

## Implementation Strategy

### MVP scope (US1 + US2 + US3 + US4 + US7)

P1 stories together = the full Open-Lab → Compose → Become current → Inspect → Resign → Receive continuation flow, plus cross-platform graceful degradation. Build order:

1. Phase 1 → 2 (foundation: plugin, bridge, manifest, registry).
2. Phase 3 (US7) — banner + platform variants, validates manifest.
3. Phase 4 (US1) — explainer.
4. Phase 5 (hook).
5. Phase 6 (US2 — composer + key-value editor).
6. Phase 7 (US3 — current card).
7. Phase 8 (US4 — incoming log).
8. Phase 10 (screen integration).
9. Phase 11 (native Swift).
10. Phase 12 polish + manual T044 + SPECKIT bump. Ship MVP.

### Incremental delivery to GA

Phase 9 (US5 — Setup Instructions) is integrated into the screen for the P2 scope. Story 6 (Universal Links) is documented copy only at the spec level and is **deferred to a follow-up spec** — no source task in this list.

### Parallel Team Strategy

With multiple developers, after Phase 2:

- Developer A: Phase 3 (US7) + Phase 4 (US1)
- Developer B: Phase 5 (hook) → Phase 6 (US2)
- Developer C: Phase 7 (US3) + Phase 8 (US4) + Phase 9 (US5)
- Developer D: Phase 11 (Swift) in parallel with all JS phases

All converge at Phase 10 (screen integration) and Phase 12 (polish).

---

## Notes

- **No `eslint-disable`** anywhere in new source or test files (Constitution v1.1.0, FR-021). Verified by T040.
- **Mock at the import boundary**: `jest.mock('@/native/handoff', …)` or `jest.mock('../hooks/useHandoffActivity', …)` at the top of every test file that depends on them. No native code executes in unit tests.
- **Additive-only diff** (FR-023): the only edits to existing files are `app.json` (+1 plugin), `src/modules/registry.ts` (+1 import +1 entry), `test/unit/plugins/with-mapkit/index.test.ts` (30 → 31), `.github/copilot-instructions.md` (SPECKIT block bump). Optional: existing root registry test extended with a single `expect` (T013) — additive within an existing file.
- **Single source of truth** for the activity type: `activity-types.ts` is read by both the plugin (Info.plist) and any component that displays the default. Do not duplicate the string.
- **Idempotency** (FR-004): T008 plugin helper keys on string presence in `NSUserActivityTypes` so two prebuilds produce a byte-stable Info.plist. Verified by T007 row #4 + T044 manual.
- **031 coexistence** (FR-005): T007 asserts set equality of `NSUserActivityTypes` regardless of plugin run order. Verified by T044 manual `plutil -p`.
- **Plugin-count bump**: 30 → 31 per the `with-mapkit` assertion convention (T009 + T010).
- **Native Swift not unit-tested**: validated end-to-end by manual T044 only; every JS consumer mocks `@/native/handoff`.
- **Story 6 (Universal Links)**: deferred to a future spec; no source task here.

---

## Summary

- **Total tasks**: 45 (T001 – T045)
- **Parallelizable tasks (`[P]`)**: 26 — T002, T004, T007, T011, T015, T016, T017, T018, T019, T020, T021, T022, T025, T026, T027, T028, T030, T031, T032, T033, T034, T035, T036, T039, T040, T041
- **Manual deferred**: T044 (two-device on-device Handoff verification)
