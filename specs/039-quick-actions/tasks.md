---
description: "Dependency-ordered TDD task list for 039-quick-actions"
---

# Tasks: Quick Actions Module (`quick-actions-lab`)

**Input**: Design documents from `/specs/039-quick-actions/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Tests are REQUIRED for every source file (TDD per Constitution v1.1.0 Principle V). Each implementation task is preceded by a test task that MUST be written and FAIL before the implementation lands.

**Organization**: Tasks are grouped by user story (US1–US7) so each story can be implemented and validated independently. Phase 1 (Setup) and Phase 2 (Foundational) are shared infrastructure that must complete before any user story phase begins.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Parallelizable (different file, no dependency on an unfinished task)
- **[Story]**: User-story tag (`[US1]`–`[US7]`) on user-story-phase tasks only
- All paths are repo-root-relative

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install the native bridge dependency. Library's own config plugin is **not** registered (we own `plugins/with-quick-actions/`).

- [ ] T001 Install `expo-quick-actions` via `npx expo install expo-quick-actions` (adds `expo-quick-actions: 6.0.1` to `package.json` + `pnpm-lock.yaml`). Do **not** add the library's plugin to `app.json` `plugins`.

**Checkpoint**: dependency resolves; `node_modules/expo-quick-actions` present.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Project-owned config plugin, defaults source-of-truth, registry wiring, plugin-count bump, in-memory mood log. These are prerequisites for all user stories.

**⚠️ CRITICAL**: No user-story work begins until this phase is complete.

### 2a. Defaults & shared types (TDD)

- [ ] T002 [P] Write failing tests for the 4 defaults in `test/unit/modules/quick-actions-lab/default-actions.test.ts` — assert (a) exactly 4 entries, (b) ordered `open-liquid-glass`, `open-sensors`, `open-audio-lab`, `add-mood-happy`, (c) each entry conforms to `QuickActionDefinition` (kebab-case `type`, non-empty `title`, SF Symbol `iconName`, `userInfo.route` non-empty), (d) `add-mood-happy` carries `userInfo.mood === 'happy'` and route `'/modules/app-intents-lab'`, (e) array is `readonly` (compile-time `as const`).
- [ ] T003 Implement `src/modules/quick-actions-lab/default-actions.ts` exporting `QuickActionDefinition` interface (per data-model.md §1) and `DEFAULT_QUICK_ACTIONS` const-asserted readonly tuple of the 4 defaults with SF Symbols (`drop.fill`, `gauge`, `mic.fill`, `face.smiling`) and routes per data-model.md. Tests from T002 must pass.

### 2b. Mood log (TDD, used by US3 & US6 cross-module side effect)

- [ ] T004 [P] Write failing tests for `test/unit/modules/quick-actions-lab/mood-log.test.ts` — covers `appendMoodEntry({ mood, source, timestamp })`, `getMoodEntries()` returns inserted entries in order, `clearMoodEntries()` empties the array, module-scoped state is isolated per `jest.resetModules()` invocation.
- [ ] T005 Implement `src/modules/quick-actions-lab/mood-log.ts` — module-scoped `let entries: MoodEntry[] = []`, exports `appendMoodEntry`, `getMoodEntries` (returns a defensive copy), `clearMoodEntries`. No persistence. Tests from T004 must pass.

### 2c. Project-owned config plugin (TDD, idempotent)

- [ ] T006 [P] Write failing co-located plugin test `plugins/with-quick-actions/index.test.ts` — mirrors the `plugins/with-contacts/index.test.ts` shape; asserts the export is a `ConfigPlugin`, calling it once produces `UIApplicationShortcutItems` with the 4 mapped entries (`UIApplicationShortcutItemType`, `UIApplicationShortcutItemTitle`, `UIApplicationShortcutItemSubtitle`, `UIApplicationShortcutItemIconType: 'systemImageName'` + iconName, `UIApplicationShortcutItemUserInfo`), and calling it twice on the same config is byte-stable (idempotent — no duplicates, same order).
- [ ] T007 [P] Write failing jest-runnable plugin test at `test/unit/plugins/with-quick-actions/index.test.ts` — same assertions as T006 plus: (a) merges with pre-existing `UIApplicationShortcutItems` instead of overwriting, (b) deduplication keys on `UIApplicationShortcutItemType`, (c) preserves any pre-existing entry whose `type` is not in defaults, (d) returns the modified `ExpoConfig`.
- [ ] T008 Implement `plugins/with-quick-actions/index.ts` — single `withInfoPlist` modifier; reads `DEFAULT_QUICK_ACTIONS` from `src/modules/quick-actions-lab/default-actions.ts`; merges by `UIApplicationShortcutItemType` per research.md §Decision 2 idempotency strategy. Tests T006 + T007 must pass. **No `eslint-disable`**.

### 2d. Plugin-count assertion bump

- [ ] T009 Update `test/unit/plugins/with-mapkit/index.test.ts` — bump `expect(plugins.length).toBe(29)` → `toBe(30)` and update the adjacent comment to reference feature 039 (per research.md §Decision 7). Run the test in isolation to confirm it now drives the app.json edit.

### 2e. App.json registration

- [ ] T010 Add `"./plugins/with-quick-actions"` to `app.json` `plugins[]` (29 → 30 entries). Order: append after the last existing plugin entry; do **not** register `expo-quick-actions`'s own plugin. T009 assertion must pass after this change.

### 2f. Module registry slot

- [ ] T011 [P] Write failing manifest test `test/unit/modules/quick-actions-lab/manifest.test.ts` — asserts the default export from `src/modules/quick-actions-lab/index.tsx` matches the `ModuleManifest` shape used by 037/038 (`id: 'quick-actions-lab'`, non-empty `title`, `description`, `platforms: ['ios','android','web']`, lazy `screen` component reference resolves on each platform).
- [ ] T012 Implement `src/modules/quick-actions-lab/index.tsx` — `ModuleManifest` export with `id: 'quick-actions-lab'`, title/description copy, `platforms: ['ios','android','web']`, screen reference (lazy / direct import per the 038 pattern). Test T011 must pass.
- [ ] T013 Write failing registry test (extend or add to existing registry test file pattern) asserting the registry contains `quick-actions-lab` and total registered modules count incremented by 1. If no such test exists, add one at `test/unit/modules/registry.test.ts` scoped narrowly to the new entry.
- [ ] T014 Update `src/modules/registry.ts` — one import line + one entry (additive only, per FR-016). T013 must pass.

**Checkpoint**: plugin emits Info.plist correctly + idempotently; registry +1; app.json +1; mood-log + defaults available; all foundational tests green.

---

## Phase 3: User Story 1 — Static actions visible from Home Screen (Priority: P1) 🎯 MVP

**Goal**: Long-pressing the app icon shows the 4 default static actions. (No app code beyond Phase 2; on-device verification via prebuild + run:ios.)

**Independent Test**: `npx expo prebuild --clean` then `npx expo run:ios --device`; long-press app icon → exactly 4 rows in spec'd order with correct titles, subtitles, SF Symbols.

US1 is fully delivered by Phase 2 (T003 + T008 + T010). No additional source tasks. The on-device validation step is captured as polish task T044.

---

## Phase 4: User Story 7 — Cross-platform graceful degradation (Priority: P3, BUILT EARLY)

**Rationale for early build**: `IOSOnlyBanner` and the `screen.web.tsx` / `screen.android.tsx` variants are required by the manifest's platform array (US7) **and** are the simplest renderable surface — building them first lets us validate the manifest end-to-end before any native bridge code ships.

### Tests (TDD)

- [ ] T015 [P] [US7] Write failing test `test/unit/modules/quick-actions-lab/components/IOSOnlyBanner.test.tsx` — renders title + body copy, uses `ThemedText`/`ThemedView`, snapshot is non-empty, no native imports.
- [ ] T016 [P] [US7] Write failing test `test/unit/modules/quick-actions-lab/screen.android.test.tsx` — renders `IOSOnlyBanner` only; mocks for `expo-quick-actions` are NOT called (assert no `setItems` / `addListener` invocation via `jest.mock` spies).
- [ ] T017 [P] [US7] Write failing test `test/unit/modules/quick-actions-lab/screen.web.test.tsx` — same shape as T016, web variant.

### Implementation

- [ ] T018 [P] [US7] Implement `src/modules/quick-actions-lab/components/IOSOnlyBanner.tsx` — `ThemedView` + `ThemedText`, `Spacing` only, single quotes, `StyleSheet.create()`. T015 must pass.
- [ ] T019 [P] [US7] Implement `src/modules/quick-actions-lab/screen.android.tsx` — renders only `<IOSOnlyBanner />` inside a `ThemedView` page wrapper. T016 must pass.
- [ ] T020 [P] [US7] Implement `src/modules/quick-actions-lab/screen.web.tsx` — same as T019 for web. T017 must pass.

**Checkpoint**: Android + Web variants render banner; manifest platform claim is honored without native bridge calls.

---

## Phase 5: User Story 2 — Inspect static actions on Lab screen (Priority: P1)

### Tests (TDD)

- [ ] T021 [P] [US2] Write failing test `test/unit/modules/quick-actions-lab/components/ExplainerCard.test.tsx` — renders 4-item-cap explanation copy, uses themed primitives.
- [ ] T022 [P] [US2] Write failing test `test/unit/modules/quick-actions-lab/components/ActionRow.test.tsx` — accepts `{ title, subtitle, iconName, route, onPress?, disabled? }`; renders SF Symbol placeholder, title, subtitle, route; calls `onPress` only when not disabled.
- [ ] T023 [P] [US2] Write failing test `test/unit/modules/quick-actions-lab/components/StaticActionsList.test.tsx` — reads `DEFAULT_QUICK_ACTIONS`, renders 4 read-only `ActionRow` instances in order, no edit affordances.

### Implementation

- [ ] T024 [P] [US2] Implement `src/modules/quick-actions-lab/components/ExplainerCard.tsx`. T021 passes.
- [ ] T025 [P] [US2] Implement `src/modules/quick-actions-lab/components/ActionRow.tsx`. T022 passes.
- [ ] T026 [US2] Implement `src/modules/quick-actions-lab/components/StaticActionsList.tsx` (depends on T025 + T003). T023 passes.

**Checkpoint**: Static-list UI renders independently of any native bridge.

---

## Phase 6: useQuickActions hook (Foundational for US3 / US4 / US5 / US6)

**Rationale**: The hook is shared by Stories 3, 4, 5, 6. It is built once, mocked at the import boundary in component tests, and exercised end-to-end by the screen test in Phase 8.

### Tests (TDD, JS-pure with `jest.mock('expo-quick-actions')` + `jest.mock('expo-router')` at top of file)

- [ ] T027 [P] Write failing test `test/unit/modules/quick-actions-lab/hooks/useQuickActions.test.tsx` — covers:
  - `setItems(items)` forwards to `expo-quick-actions.setItems` and rejects when `items.length > 4` (max-4 enforcement returns/throws before bridge call).
  - `getInitial()` returns the cold-launch payload mapped to `InvocationEvent` (with ISO timestamp); `null` when none.
  - `addListener(handler)` subscribes, returns the bridge subscription object, propagates events as `InvocationEvent`.
  - On invocation with `type === 'add-mood-happy'`, calls `appendMoodEntry({ mood: 'happy', source: 'quick-action', timestamp })` (mood-log mocked or spied).
  - Cold-launch invocation routes via `router.replace(userInfo.route)`; warm-launch via `router.navigate(userInfo.route)`.
  - Unknown / missing route is a dev-only `console.warn` no-op (verify warn called once, no `router.*` call).
- [ ] T028 [P] Write failing web-stub test `test/unit/modules/quick-actions-lab/hooks/useQuickActions.web.test.tsx` — asserts the web export is a no-op (returns stable shape, never imports `expo-quick-actions`, never calls `router`).

### Implementation

- [ ] T029 Implement `src/modules/quick-actions-lab/hooks/useQuickActions.ts` (native) — subscribes once via `useEffect`, fetches `getInitial()`, reads cold-vs-warm flag from a ref, maps to `InvocationEvent`, dispatches `router.replace` / `router.navigate`, fires mood-log side-effect, enforces `items.length ≤ 4` in `setItems`. **No `eslint-disable`**. T027 passes.
- [ ] T030 [P] Implement `src/modules/quick-actions-lab/hooks/useQuickActions.web.ts` — JS-pure stub returning the same TypeScript shape with all bridge methods as `async () => undefined / null` and no listener. T028 passes.

**Checkpoint**: Hook is ready to consume by every remaining story; native bridge is fully mocked at the import boundary in all tests.

---

## Phase 7: User Story 3 — Add / remove / reorder dynamic actions (Priority: P1)

### Tests (TDD)

- [ ] T031 [P] [US3] Write failing test `test/unit/modules/quick-actions-lab/components/DynamicActionsManager.test.tsx` — covers:
  - "Pretend N statics" toggle (1..4) updates `effectiveStaticCount`.
  - "Add" disabled when `dynamicItems.length >= 4 - effectiveStaticCount`; tapping a disabled add shows the cap banner copy.
  - Adding pushes a new item and calls hook.`setItems` with the new full list.
  - Remove confirms then splices the item; calls `setItems`.
  - Reorder up/down arrows (disabled at boundaries) reorder `dynamicItems`; calls `setItems`.
  - Component imports `useQuickActions` mocked at the top of the test file.

### Implementation

- [ ] T032 [US3] Implement `src/modules/quick-actions-lab/components/DynamicActionsManager.tsx` — local `ManagerState`, invariants per data-model.md §3, calls hook methods, uses `ActionRow` for rows. T031 passes.

**Checkpoint**: Manager component works end-to-end against the mocked hook.

---

## Phase 8: User Story 4 — Last Invoked Action card (Priority: P2)

### Tests (TDD)

- [ ] T033 [P] [US4] Write failing test `test/unit/modules/quick-actions-lab/components/LastInvokedCard.test.tsx` — covers:
  - Empty state (`event === null`) shows "No quick action invoked this session".
  - Populated state renders `type`, formatted `userInfo` JSON, ISO timestamp.
  - Most-recent-wins: rerendering with a new event replaces the old display.

### Implementation

- [ ] T034 [P] [US4] Implement `src/modules/quick-actions-lab/components/LastInvokedCard.tsx`. T033 passes.

**Checkpoint**: Card surface verified in isolation.

---

## Phase 9: iOS screen integration (US2 + US3 + US4 + US5)

**Goal**: Compose ExplainerCard, StaticActionsList, DynamicActionsManager, LastInvokedCard, and the Reset action into the iOS Lab screen, wired to the hook.

### Tests (TDD)

- [ ] T035 [P] Write failing test `test/unit/modules/quick-actions-lab/screen.test.tsx` — covers:
  - Mounts on iOS (assume `Platform.OS = 'ios'` via test setup).
  - Renders ExplainerCard, StaticActionsList, DynamicActionsManager, LastInvokedCard.
  - **US5**: Reset button shows confirm prompt; confirming calls `useQuickActions().setItems([])` (or `clearItems()`); cancelling is a no-op.
  - **US4**: when `getInitial()` resolves to a payload, LastInvokedCard renders it (within 1s test timeout — SC-4).
  - `useQuickActions` is mocked at the top of the test file; no real native bridge call.

### Implementation

- [ ] T036 Implement `src/modules/quick-actions-lab/screen.tsx` — composes all child components, wires Reset (US5) with `Alert.alert` confirm + `clearItems()`, surfaces `lastInvoked` state from the hook into `LastInvokedCard`. **No `eslint-disable`**. T035 passes.

**Checkpoint**: Lab screen renders end-to-end on iOS in tests; US2/3/4/5 all exercised.

---

## Phase 10: User Story 6 — Routing on invocation (Priority: P1)

**Goal**: Cold-launch and warm-launch invocations route via `expo-router` regardless of which screen is mounted. Hook is registered at the **root layout**.

### Tests (TDD)

- [ ] T037 Write failing test `test/unit/app/_layout.test.tsx` (or extend existing `_layout` test if present) — asserts the root layout component invokes `useQuickActions()` once on mount. Mock the hook module and verify it is called. (If a root-layout test already exists, add the assertion to it.)

### Implementation

- [ ] T038 Wire `useQuickActions()` into `app/_layout.tsx` — call the hook once at the top of the root layout component (additive line per FR-016, no behavior change for non-invocation launches). T037 passes; existing root-layout tests still pass.

**Checkpoint**: Cold + warm invocations route correctly per quickstart §6.

---

## Phase 11: Polish & Cross-Cutting

- [ ] T039 [P] Run `pnpm format` from repo root; verify no diff in already-formatted files.
- [ ] T040 [P] Run `pnpm typecheck`; verify zero TS errors across the new module + plugin.
- [ ] T041 [P] Run `pnpm lint`; verify zero errors and **zero `eslint-disable`** directives in new files (`git grep -nE 'eslint-disable' src/modules/quick-actions-lab plugins/with-quick-actions test/unit/modules/quick-actions-lab test/unit/plugins/with-quick-actions` must return empty).
- [ ] T042 Run `pnpm test`; all suites green including new ~14 test files (~35 cases) and bumped plugin-count assertion.
- [ ] T043 Run `pnpm check` (typecheck + lint + format + tests bundle); zero failures.
- [ ] T044 Execute quickstart.md §4–§11 on a real iOS device (prebuild, run:ios, long-press, verify routing, verify dynamic mgmt, verify last-invoked card, verify reset, verify Android/Web banner, verify plugin idempotency). Capture pass/fail per success criterion (SC-1..SC-11).
- [ ] T045 Update the `<!-- SPECKIT START --> ... <!-- SPECKIT END -->` block in `.github/copilot-instructions.md` to reference `specs/039-quick-actions/plan.md` (per plan.md "Agent context update" note).

---

## Dependencies & Execution Order

### Phase order

1. **Phase 1 Setup** (T001) — must complete first.
2. **Phase 2 Foundational** (T002–T014) — blocks all stories.
3. **Phase 3 US1** — delivered by Phase 2; on-device verification deferred to T044.
4. **Phase 4 US7** (T015–T020) — built early; depends only on Phase 2.
5. **Phase 5 US2** (T021–T026) — depends on Phase 2 (defaults).
6. **Phase 6 Hook** (T027–T030) — depends on T005 (mood-log), T003 (defaults). Blocks US3/US4/US5/US6 implementations.
7. **Phase 7 US3** (T031–T032) — depends on Phase 6 + T025 (ActionRow).
8. **Phase 8 US4** (T033–T034) — depends on Phase 6.
9. **Phase 9 iOS screen** (T035–T036) — depends on Phases 5, 7, 8 (all components) + Phase 6 (hook).
10. **Phase 10 US6** (T037–T038) — depends on Phase 6.
11. **Phase 11 Polish** (T039–T045) — depends on all prior phases.

### Test-first within each task pair

For every implementation task, its preceding test task **must be written, run, and observed FAILING** before the implementation begins. Verify red → green per Constitution Principle V.

### Parallel opportunities (`[P]`)

- T002 / T004 / T006 / T007 / T011 — independent foundational tests, can be authored in parallel.
- T015–T017 + T018–T020 — IOSOnlyBanner / android / web tests + impls run in parallel (different files).
- T021–T023 / T024–T025 — US2 component tests + impls in parallel; T026 (StaticActionsList) waits on T025 (ActionRow).
- T027 / T028 — hook tests in parallel; T029 / T030 — native + web impls in parallel.
- T031 / T033 / T035 — US3 / US4 / screen tests in parallel.
- T039 / T040 / T041 — format/typecheck/lint in parallel.

### Within-story sequencing rules

- Tests precede the implementation they cover (RED → GREEN).
- Component tests precede screen-composition tests (smaller surface first).
- Hook (Phase 6) precedes any component that imports it (US3, screen).
- Plugin (T008) precedes app.json registration (T010); T010 unblocks the bumped assertion (T009).

---

## Parallel Example: Phase 4 (US7) tests + impls

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

### MVP scope (US1 + US2 + US3 + US6)

P1 stories together = the full long-press → see 4 actions → open Lab → manage dynamics → routing-works flow. Build order:

1. Phase 1 → 2 (foundation).
2. Phase 4 (US7) — banner + platform variants, validates manifest.
3. Phase 5 (US2) — Lab screen body parts.
4. Phase 6 (hook).
5. Phase 7 (US3) — dynamic manager.
6. Phase 9 (screen integration) + Phase 10 (US6 routing).
7. Run `pnpm check` (T043). Ship MVP.

### Incremental delivery to GA

Phase 8 (US4 — Last Invoked) and Phase 9's reset (US5) are integrated into the screen for parity and complete the P2 scope. Phase 11 polish + on-device verification (T044) closes SC-1..SC-11.

---

## Notes

- **No `eslint-disable`** anywhere in new source or test files (Constitution v1.1.0, FR-014).
- **Mock at the import boundary**: `jest.mock('expo-quick-actions', …)` and `jest.mock('expo-router', …)` at the top of every test file that depends on them. No native code executes in unit tests.
- **Additive-only diff** (FR-016): the only edits to existing files are `app.json` (+1 plugin), `src/modules/registry.ts` (+1 import +1 entry), `test/unit/plugins/with-mapkit/index.test.ts` (29 → 30), `package.json` + `pnpm-lock.yaml` (install), `app/_layout.tsx` (+1 hook call), `.github/copilot-instructions.md` (SPECKIT block bump).
- **Single source of truth** for the 4 defaults: `default-actions.ts` is read by both the plugin (Info.plist) and the screen (StaticActionsList). Do not duplicate the array.
- **Idempotency**: T008 plugin keys on `UIApplicationShortcutItemType` so two prebuilds produce a byte-stable Info.plist (SC-7).
- **Cross-module side effect**: `add-mood-happy` writes through `mood-log.ts`; the hook is the only writer.
