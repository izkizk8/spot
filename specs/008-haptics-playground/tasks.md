---
description: "Task list — Haptics Playground (spec 008)"
---

# Tasks: Haptics Playground

**Input**: Design documents from `/specs/008-haptics-playground/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Test-first is REQUIRED for this feature (Constitution V; FR-035). Every implementation task is preceded by its unit test task. The seven test files match the inventory in `plan.md` § Project Structure and `contracts/test-plan.md`.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Maps to user stories from spec.md (US1 = single-fire, US2 = composer, US3 = presets, US4 = cross-platform fallbacks)
- All paths are repo-relative

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the one new runtime dep and scaffold the module folder.

- [ ] T001 Install `expo-haptics` via `npx expo install expo-haptics` (run from repo root). Acceptance: `package.json` lists `expo-haptics` at the SDK 55–compatible version, `pnpm-lock.yaml` is updated, `pnpm install` is clean.
- [ ] T002 [P] Create empty module folders `src/modules/haptics-playground/components/` and `test/unit/modules/haptics-playground/components/` (preserve with `.gitkeep` only if needed). Acceptance: directories exist; `git status` shows them tracked; nothing else changed.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types used by every story. MUST be complete before any user-story phase.

**⚠️ CRITICAL**: No US-tagged task may begin until this phase is green.

- [ ] T003 Create shared types in `src/modules/haptics-playground/types.ts` exporting `HapticKind`, `HapticIntensity`, `Cell`, `Pattern` (length-8 tuple of `Cell | null`), `Preset`, and `PresetsStoreError` per `data-model.md`. Acceptance: `pnpm typecheck` passes; no `any`; types are importable via `@/modules/haptics-playground/types`.

**Checkpoint**: Foundation ready — US1, US2, US3, US4 may begin in parallel.

---

## Phase 3: User Story 1 — Single-fire haptics (Priority: P1) 🎯 MVP

**Goal**: A user can tap any of 9 labeled buttons (3 notification + 3 impact + 3 selection-style) and feel the corresponding `expo-haptics` feedback within ~100 ms, with a visual pulse on every press.

**Independent Test**: Mount `HapticsPlaygroundScreen`, press each button, assert the driver was called with the right `(kind, intensity)` and the visual pulse animation is invoked. On a real iPhone, all 9 buttons trigger distinct Taptic Engine feedback (quickstart §3 Story 1).

### Tests for User Story 1 (write FIRST, must FAIL before implementation)

- [ ] T004 [P] [US1] Write `test/unit/modules/haptics-playground/haptic-driver.test.ts` per `contracts/haptic-driver.md`: mock `expo-haptics`, assert `play('notification', 'success')`, `play('impact', 'medium')`, `play('selection')` route to the correct API; assert unknown intensity falls back per contract; assert `Platform.OS === 'web'` resolves without importing native APIs (jest module-level mock for `react-native` Platform). Acceptance: file exists, all describe blocks present, runs and FAILS with "module not found" or equivalent.
- [ ] T005 [P] [US1] Write `test/unit/modules/haptics-playground/components/HapticButton.test.tsx`: render `<HapticButton kind="impact" intensity="medium" label="Medium" />`; firing `fireEvent.press` calls a mocked `driver.play` exactly once with `('impact','medium')`; pulse handler is invoked (spy on the Reanimated trigger ref or a test-only `onPulse` callback). Acceptance: file exists, fails because component is not implemented yet.

### Implementation for User Story 1

- [ ] T006 [US1] Implement `src/modules/haptics-playground/haptic-driver.ts` per `contracts/haptic-driver.md`: export `play(kind, intensity?)` returning `Promise<void>`; on `Platform.OS === 'web'` short-circuit to `Promise.resolve()` without referencing `expo-haptics`; otherwise route to `notificationAsync` / `impactAsync` / `selectionAsync` with the documented intensity mapping. No top-level side effects. Acceptance: T004 passes; `pnpm typecheck` clean; no `any`.
- [ ] T007 [US1] Implement `src/modules/haptics-playground/components/HapticButton.tsx`: themed `Pressable` using `ThemedText` + `ThemedView`, `Spacing` scale, `StyleSheet.create`, props `{ kind, intensity?, label }`; on press calls `driver.play(kind, intensity)` and triggers a Reanimated **Keyframe** pulse (scale + opacity, ~180 ms). No `Platform.OS` branches, no Animated API. Acceptance: T005 passes.

**Checkpoint**: Single-fire haptics work; the screen does not exist yet — verified through component tests + driver tests. The screen integration test (T015) covers end-to-end mount.

---

## Phase 4: User Story 2 — Pattern composer (Priority: P2)

**Goal**: A user can tap 8 cells to cycle through 9 options (off + 8 haptic types), press **Play** to fire the sequence at ~120 ms inter-cell spacing, cancel mid-playback, and observe each cell's pulse as it fires.

**Independent Test**: Mount `<PatternSequencer />` with `jest.useFakeTimers()`; tap cell 1 ten times → cycles back to `off`; fill cells 1/3/5 → press Play → advance timers in 120 ms steps and assert driver calls land in order; press Play again mid-sequence → no further driver calls (FR-013, FR-016, SC-004).

### Tests for User Story 2 (write FIRST, must FAIL before implementation)

- [ ] T008 [P] [US2] Write `test/unit/modules/haptics-playground/components/PatternSequencer.test.tsx` per `contracts/test-plan.md` (fake-timer recipe): cell-cycle through all 9 options; Play with empty pattern fires nothing; Play with 3 filled cells dispatches in order at 120 ms boundaries; second Play during playback cancels remaining cells; unmount during playback cancels remaining cells. Acceptance: file exists; fails because component is missing.

### Implementation for User Story 2

- [ ] T009 [US2] Implement `src/modules/haptics-playground/components/PatternSequencer.tsx`: internal state `(Cell | null)[]` length 8; tap cycles per FR-010; **Play** chains `setTimeout`s at 120 ms spacing routing through `driver.play`; cancel-token ref cleared on re-press, unmount, and on save; **Save preset** prop callback delegates upward; `ThemedView`, `Spacing`, `StyleSheet.create`. Acceptance: T008 passes under `jest.useFakeTimers()`.

**Checkpoint**: Composer works in isolation. Persistence comes in US3.

---

## Phase 5: User Story 3 — Named presets (Priority: P3)

**Goal**: A user can save a non-empty composed pattern as `Preset N` (smallest free positive integer), see it persist across cold launches, replay it with the same 120 ms cadence, and delete entries.

**Independent Test**: With AsyncStorage mocked, call `save(pattern)` → entry appears in `list()`; deleting `Preset 2` then saving again → new id, name `Preset 2` reused; corrupt JSON in storage → `list()` returns `[]` (FR-024, FR-025). Component test mounts `<PresetList presets={...} onPlay={...} onDelete={...} />` and asserts row tap fires `onPlay`.

### Tests for User Story 3 (write FIRST, must FAIL before implementation)

- [ ] T010 [P] [US3] Write `test/unit/modules/haptics-playground/presets-store.test.ts` per `contracts/presets-store.md`: mock `@react-native-async-storage/async-storage`; `list()` on empty returns `[]`; `save(pattern)` returns a `Preset` with stable id + smallest-free-integer name; `delete(id)` removes entry and frees the integer; corrupted JSON → `[]`; write failure → typed `PresetsStoreError`. Acceptance: file exists; fails because store is missing.
- [ ] T011 [P] [US3] Write `test/unit/modules/haptics-playground/components/PresetList.test.tsx`: render with two seeded presets; tap row 1 fires `onPlay` with that preset's pattern; tap delete on row 2 fires `onDelete` with that id; empty list renders the empty-state copy. Acceptance: file exists; fails.

### Implementation for User Story 3

- [ ] T012 [US3] Implement `src/modules/haptics-playground/presets-store.ts` per `contracts/presets-store.md`: `list()`, `save(pattern)`, `delete(id)` over AsyncStorage key `spot.haptics.presets`; auto-generate id (timestamp + random suffix) and name; tolerate JSON / I/O errors per contract; no `any`. Acceptance: T010 passes.
- [ ] T013 [US3] Implement `src/modules/haptics-playground/components/PresetList.tsx`: render rows with name + compact glyph preview; per-row tap → `onPlay(preset)`; per-row delete affordance → `onDelete(id)`; `ThemedView`, `ThemedText`, `Spacing`, `StyleSheet.create`. Acceptance: T011 passes.

**Checkpoint**: All three primary stories function as standalone units (driver+button, sequencer, store+list).

---

## Phase 6: User Story 4 — Screen + cross-platform fallbacks (Priority: P2)

**Goal**: A single screen wires the three button rows + composer + preset list together, renders a web advisory banner on `Platform.OS === 'web'`, and routes preset playback through the same code path as the composer.

**Independent Test**: RNTL render of `HapticsPlaygroundScreen`; assert three rows of buttons (notification/impact/selection), composer present, preset list present; with `Platform.OS = 'web'`, banner is visible; with `Platform.OS = 'ios'`, banner is absent; tapping a saved preset triggers driver calls at 120 ms spacing identical to the composer's Play (quickstart §3 Story 4, SC-006).

### Tests for User Story 4 (write FIRST, must FAIL before implementation)

- [ ] T014 [P] [US4] Write `test/unit/modules/haptics-playground/manifest.test.ts`: import default export from `src/modules/haptics-playground/index.tsx`; assert `id === 'haptics-playground'`, `platforms` deep-equals `['ios','android','web']`, no `minIOS`, `render` is a function returning a React element. Acceptance: file exists; fails because manifest is missing.
- [ ] T015 [P] [US4] Write `test/unit/modules/haptics-playground/screen.test.tsx` per `contracts/test-plan.md`: render `<HapticsPlaygroundScreen />` (mock driver + store); assert 3 notification, 3 impact, 3 selection buttons present; composer cell count = 8; with `Platform.OS = 'web'` banner visible, with `'ios'` banner absent; saving a preset adds a row; tapping that row dispatches driver calls in order. Acceptance: file exists; fails.

### Implementation for User Story 4

- [ ] T016 [US4] Implement `src/modules/haptics-playground/screen.tsx`: compose `HapticButton` rows, `PatternSequencer`, `PresetList`; load presets via `presets-store.list()` on mount; pass `onPlay` to `PresetList` that schedules cells through the same routine as the composer (extract a small shared `playPattern(driver, pattern)` helper inside the module); single `Platform.OS === 'web'` branch renders the advisory `ThemedView` banner; inline notice slot for store write errors. `StyleSheet.create`, `Spacing`, themed components only. Acceptance: T015 passes.
- [ ] T017 [US4] Implement `src/modules/haptics-playground/index.tsx`: default-export the `ModuleManifest` `{ id: 'haptics-playground', platforms: ['ios','android','web'], render: () => <HapticsPlaygroundScreen /> }` (no `minIOS`). Acceptance: T014 passes.

**Checkpoint**: Module is self-contained and fully tested but not yet reachable from the modules grid.

---

## Phase 7: Registry wiring

**Purpose**: Surface the module in the spec 006 grid via the one-import-one-entry contract (FR-001 / plan.md § Structure Decision).

- [ ] T018 Edit `src/modules/registry.ts`: add ONE import `import hapticsPlayground from '@/modules/haptics-playground';` and append ONE entry to the manifests array. No other shell file modified. Acceptance: `pnpm test --testPathPattern modules/manifest` (the global registry invariants suite) still passes; the new module appears in the registry list; diff is exactly +2 lines (1 import + 1 entry, plus formatter-required commas).

---

## Phase 8: Polish & Quality Gate

- [ ] T019 Run `pnpm check` (= `format:check && lint && typecheck && test`) and iterate until green with zero new warnings (SC-008). Acceptance: command exits 0; `pnpm test --testPathPattern haptics-playground` reports 7 test files, all green.
- [ ] T020 [P] Documentation touch-ups: cross-link `specs/008-haptics-playground/quickstart.md` from `README.md` "Modules" list (if such a list exists; otherwise skip silently) and confirm `.github/copilot-instructions.md` SPECKIT block points at this feature's plan. Acceptance: links resolve; no other docs modified.
- [ ] T021 Final commit on `008-haptics-playground` summarising the feature, then run `quickstart.md` §3 on at least one physical iOS device + one Android device + one web browser tab; record any deviations as follow-ups. Acceptance: commit pushed; smoke matrix recorded in PR description.

---

## Dependencies & Execution Order

### Phase order

1. **Phase 1 Setup** (T001–T002) — no deps.
2. **Phase 2 Foundational** (T003) — depends on T001/T002; **blocks all US phases**.
3. **Phase 3 US1** — depends on T003. T004 ‖ T005, then T006 (unblocks T004), then T007 (unblocks T005). T007 depends on T006 (HapticButton imports the driver).
4. **Phase 4 US2** — depends on T003 + T006 (sequencer routes through driver). T008 first, then T009.
5. **Phase 5 US3** — depends on T003. T010 ‖ T011, then T012 + T013 (independent of each other; both [P] after their tests).
6. **Phase 6 US4** — depends on T007, T009, T012, T013. T014 ‖ T015 first, then T016 then T017 (manifest imports the screen).
7. **Phase 7 Registry** (T018) — depends on T017.
8. **Phase 8 Polish** (T019–T021) — T019 depends on everything above; T020 [P] alongside T019; T021 last.

### Parallelisable sets (within each US)

- US1 tests: `T004 ‖ T005` (different files, no shared state).
- US3 tests: `T010 ‖ T011`. US3 implementation: `T012 ‖ T013` (after their tests).
- US4 tests: `T014 ‖ T015`.
- Across stories after T003: US1, US3 can start in parallel. US2 and US4 must wait for the driver (T006); US4 also waits for US2 + US3 implementations.

### Test-before-implementation invariant

| Implementation task | Must-fail-first test task |
|---|---|
| T006 haptic-driver.ts | T004 |
| T007 HapticButton.tsx | T005 |
| T009 PatternSequencer.tsx | T008 |
| T012 presets-store.ts | T010 |
| T013 PresetList.tsx | T011 |
| T016 screen.tsx | T015 |
| T017 index.tsx (manifest) | T014 |

---

## Parallel Example: kicking off after Foundational

```bash
# After T003 lands, in parallel:
Task: "T004 write haptic-driver.test.ts"
Task: "T005 write HapticButton.test.tsx"
Task: "T010 write presets-store.test.ts"
Task: "T011 write PresetList.test.tsx"
```

Then drive each red test green in dependency order (T006 → T007, T012 ‖ T013), then unblock US2 (T008 → T009), then US4 (T014 ‖ T015 → T016 → T017), then T018, then T019.

---

## Implementation Strategy

### MVP

1. Phases 1 → 2 → 3 (US1) → register temporarily? **No** — registry wiring (T018) intentionally lands only after T017 so the grid never points at a half-built screen. The MVP demo is the unit tests passing for US1 + a local Storybook-style mount of `HapticsPlaygroundScreen` if needed.
2. Continue through US2, US3, US4 in order; each is independently green via its tests.
3. Land T018 to make the module reachable from the modules grid.
4. T019 quality gate, T020 docs, T021 device smoke + commit.

### Incremental delivery

US1 → US2 → US3 → US4 → registry → polish. Each US is mergeable behind the registry wiring (which is the last code change before polish), so partial work never appears in the shipped grid.

---

## Notes

- All file paths use the `@/` alias when imported (FR-030).
- Reanimated **Keyframe** API only — no Animated API (constitution III).
- Only `Platform.OS` reference allowed: the single-value web-banner gate inside `screen.tsx` (T016).
- `expo-haptics` is referenced only inside `haptic-driver.ts` (T006) — every other file goes through the driver (FR-031).
- Commit after each task or each green test→impl pair; never commit a red test together with its implementation in a single commit (TDD discipline).
