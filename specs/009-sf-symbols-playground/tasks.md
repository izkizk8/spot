---
description: "Task list — SF Symbols Lab (spec 009)"
---

# Tasks: SF Symbols Lab

**Input**: Design documents from `/specs/009-sf-symbols-playground/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Test-first is REQUIRED for this feature (Constitution V; FR-039). Every implementation task is preceded by its unit test task. The seven test files match the inventory in `plan.md` § Project Structure and `contracts/test-plan.md`.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Maps to user stories from spec.md (US1 = pick-and-play, US2 = configure speed/repeat/tint/Replace, US3 = cross-platform fallbacks)
- All paths are repo-relative

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the existing `expo-symbols` dep and scaffold the module folder. No new runtime dependency is added (plan.md § Summary).

- [X] T001 Verify `expo-symbols` `~55.0.7` is present in `package.json` and `pnpm-lock.yaml`; if missing, run `npx expo install expo-symbols` from the repo root. Acceptance: `pnpm install` is clean; `pnpm list expo-symbols` reports the SDK 55–compatible version; no other deps changed.
- [X] T002 [P] Create empty module folders `src/modules/sf-symbols-lab/components/` and `test/unit/modules/sf-symbols-lab/components/`. Acceptance: directories exist; `git status` shows them tracked; nothing else changed.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types + curated catalog used by every story. MUST be complete before any user-story phase.

**⚠️ CRITICAL**: No US-tagged task may begin until this phase is green.

- [X] T003 Create shared types in `src/modules/sf-symbols-lab/types.ts` exporting `CuratedSymbol`, `EffectId`, `EffectMetadata`, `Speed`, `Repeat`, `TintToken`, `PlaybackConfig` per `data-model.md`. Strict TS, no `any`. Acceptance: `pnpm typecheck` passes; types importable via `@/modules/sf-symbols-lab/types`.
- [X] T004 [P] Write `test/unit/modules/sf-symbols-lab/catalog.test.ts` per `contracts/catalog.md`: assert `SYMBOLS` non-empty (length === 12); every `name` is a non-empty string matching the SF Symbol naming convention (lowercase letters, digits, dots — `/^[a-z0-9]+(\.[a-z0-9]+)*$/`); all `name` values are unique; all `displayLabel` values are unique. Assert `EFFECTS.length === 7` and contains all of `bounce | pulse | scale | variable-color | replace | appear | disappear`; only `replace` has `requiresSecondarySymbol === true`; the set of effects with `respondsToSpeed === true` equals `{ bounce, pulse, scale, variable-color }`; same for `respondsToRepeat`. Assert `TINTS` (or equivalent token list consumed by `TintPicker`) lists 4 entries and each is a valid `TintToken` resolvable through the project theme. Acceptance: file exists; FAILS because `catalog.ts` is missing.
- [X] T005 Implement `src/modules/sf-symbols-lab/catalog.ts`: export `const SYMBOLS: readonly CuratedSymbol[]` with the 12 curated entries from `data-model.md` (heart.fill, star.fill, bolt.fill, cloud.sun.fill, flame.fill, drop.fill, leaf.fill, sparkles, moon.stars.fill, cloud.bolt.rain.fill, sun.max.fill, snowflake), `const EFFECTS: readonly EffectMetadata[]` with the 7 effects in source order (Bounce default), and `const TINTS: readonly TintToken[]` with the 4 theme-token swatches per `data-model.md`. All arrays `as const`. No theme-color literals — `TintPicker` resolves at render via `useTheme()` (FR-036). Acceptance: T004 passes.

**Checkpoint**: Foundation ready — US1, US2, US3 may begin in parallel.

---

## Phase 3: User Story 1 — Pick a symbol and play an effect on iOS 17+ (Priority: P1) 🎯 MVP

**Goal**: A user lands on the SF Symbols Lab screen, sees a 12-cell horizontal symbol picker (first selected) and a 7-effect picker (Bounce default), picks both, taps Play Effect, and the preview animates within 100 ms (SC-002).

**Independent Test**: Mount `<SfSymbolsLabScreen />` with `expo-symbols` mocked; assert 12 symbol cells + 7 effect cells render; pick `heart.fill` + Bounce; press Play Effect; assert `<AnimatedSymbol>` is mounted with `name === 'heart.fill'`, `effect.id === 'bounce'`, and the bumped `playToken` (quickstart §3 Story 1).

### Tests for User Story 1 (write FIRST, must FAIL before implementation)

- [X] T006 [P] [US1] Write `test/unit/modules/sf-symbols-lab/components/SymbolPicker.test.tsx` per `contracts/test-plan.md`: render `<SymbolPicker symbols={SYMBOLS} selectedName={SYMBOLS[0].name} onSelect={fn} />`; assert all 12 symbol cells render (one `<AnimatedSymbol>` per cell, asserted by `testID` or accessibility label); tapping cell 5 calls `onSelect` exactly once with `SYMBOLS[4].name`; the cell whose name === `selectedName` has the `backgroundSelected` style/token applied (assert via `style` prop or `accessibilityState.selected === true`); changing `selectedName` re-highlights the right cell. Acceptance: file exists; FAILS — component missing.
- [X] T007 [P] [US1] Write `test/unit/modules/sf-symbols-lab/components/EffectPicker.test.tsx`: render `<EffectPicker effects={EFFECTS} selectedId="bounce" onSelect={fn} onSelectSecondary={fn2} />`; assert all 7 effect segments render with their `displayLabel`; default highlighted = Bounce (`accessibilityState.selected === true`); tapping the Pulse segment calls `onSelect` once with `'pulse'`; tapping Replace calls `onSelect('replace')` AND triggers the secondary-picker callback path (assert `onSelectSecondary` is invoked / `requiresSecondarySymbol` is surfaced — exact contract per `contracts/test-plan.md`); the active segment carries the `backgroundSelected` token. Acceptance: file exists; FAILS — component missing.
- [X] T008 [P] [US1] Write `test/unit/modules/sf-symbols-lab/components/AnimatedSymbol.test.tsx` per `contracts/animated-symbol.md`: at top-of-file `jest.mock('expo-symbols', () => ({ SymbolView: jest.fn(() => null) }))`. **iOS branch** (`jest.doMock('react-native/Libraries/Utilities/Platform', ...)` or `Platform.OS = 'ios'`): render with `effect: bounce, speed: normal, repeat: once`, assert `SymbolView` last call's props include `name`, `tintColor`, and `animationSpec` matching the per-effect mapping table — `bounce → { effect: { type: 'bounce' }, speed: 1.0, repeating: false }`; repeat for `pulse`, `scale`, `variable-color` (asserts `variableAnimationSpec`), and confirm `speed: 'fast' → 2.0`, `repeat: 'thrice' → repeating: true, repeatCount: 3`, `repeat: 'indefinite' → repeating: true, repeatCount: undefined`. **Emulated branch** (still iOS): for `replace`, assert two consecutive renders with different `name` props wrapped by a Reanimated opacity crossfade trigger; for `appear` / `disappear`, assert the wrapper drives a Reanimated shared value (opacity 0→1 / 1→0) over ~250 ms (assert via the mocked Reanimated API surface from `test/setup.ts`). **Non-iOS branch** (`Platform.OS = 'android'` then `'web'`): assert `SymbolView` is **not** rendered and a `ThemedText` plain-text fallback containing the symbol `name` (or `displayLabel`) is rendered with the current `tintColor`. Acceptance: file exists; FAILS — component missing.

### Implementation for User Story 1

- [X] T009 [US1] Implement `src/modules/sf-symbols-lab/components/AnimatedSymbol.tsx` per `contracts/animated-symbol.md`: single `Platform.OS === 'ios'` branch. **iOS**: import `SymbolView` from `expo-symbols`, derive `animationSpec` from props `(effect, speed, repeat)` per the mapping table in `data-model.md`; for `replace` swap `name` and drive a 200 ms Reanimated opacity crossfade keyed off `playToken`; for `appear` / `disappear` drive a 250 ms opacity worklet via `useSharedValue` + `useAnimatedStyle`; bump animation by `playToken` so each Play Effect press re-applies the spec (research.md R4). **Non-iOS**: render `<ThemedView><ThemedText>{name}</ThemedText></ThemedView>` with the resolved `tintColor`; do NOT touch `expo-symbols` even by import path on this branch (constitution III; `expo-symbols` is referenced only inside the iOS branch import — keep imports static at top per RN convention but tree-shaken via `Platform.OS`). `StyleSheet.create`, `Spacing` only. No `any`. Acceptance: T008 passes.
- [X] T010 [US1] Implement `src/modules/sf-symbols-lab/components/SymbolPicker.tsx`: horizontal `ScrollView` (or `FlatList horizontal`) of themed `Pressable` cells; each cell renders `<AnimatedSymbol name={symbol.name} effect={{id:'bounce',…}} speed="normal" repeat="once" tint={...} playToken={0} size="small" />` (effect static — picker cells do not animate); selected cell uses the `backgroundSelected` token; tap → `onSelect(symbol.name)`. Props `{ symbols, selectedName, onSelect, tint }`. `ThemedView`, `Spacing`, `StyleSheet.create` only; no `Platform.OS`. Acceptance: T006 passes.
- [X] T011 [US1] Implement `src/modules/sf-symbols-lab/components/EffectPicker.tsx`: themed segmented control of 7 themed `Pressable`s rendering each effect's `displayLabel`; props `{ effects, selectedId, onSelect, onSelectSecondary? }`; tap → `onSelect(effect.id)`; when `effect.requiresSecondarySymbol === true` is selected, invoke `onSelectSecondary?.()` so the screen can open / focus the secondary symbol picker (FR-025); active segment carries `backgroundSelected`. `ThemedView`, `ThemedText`, `Spacing`, `StyleSheet.create`. No `Platform.OS`. Acceptance: T007 passes.

**Checkpoint**: A symbol can be picked, an effect can be picked, and `<AnimatedSymbol>` renders with the right prop graph on every platform — verified through component tests. Screen integration lands in US3.

---

## Phase 4: User Story 2 — Configure speed, repeat, tint, and Replace target (Priority: P2)

**Goal**: A user adjusts a 3-segment speed selector, a 3-segment repeat selector, a 4-swatch tint picker (live re-tint), and — when Replace is the active effect — picks a second symbol from the Replace mini-picker. Play Effect honours all settings.

**Independent Test**: Mount `<SfSymbolsLabScreen />`; change speed → Fast, repeat → 3 times, tint → swatch B, effect → Replace, secondary symbol → `star.fill`; press Play Effect; assert `<AnimatedSymbol>` props include `speed: 'fast'`, `repeat: 'thrice'`, `tint: 'tintB'`, `effect.id === 'replace'`, `secondarySymbol.name === 'star.fill'` (quickstart §3 Story 2, SC-006).

### Tests for User Story 2 (write FIRST, must FAIL before implementation)

- [X] T012 [P] [US2] Write `test/unit/modules/sf-symbols-lab/components/TintPicker.test.tsx`:render `<TintPicker tints={TINTS} selectedTint="text" onSelect={fn} />`; assert exactly 4 swatches render (one per `TintToken`), each with the resolved theme colour as its background / inner fill (assert via `style` prop using a tiny `useTheme()` mock); tapping swatch 3 calls `onSelect` once with `TINTS[2]`; the swatch matching `selectedTint` is highlighted (e.g. ring / `backgroundSelected` border / `accessibilityState.selected === true`); changing the prop re-highlights. Acceptance: file exists; FAILS — component missing.

### Implementation for User Story 2

- [X] T013 [US2] Implement `src/modules/sf-symbols-lab/components/TintPicker.tsx`:row of 4 themed `Pressable` swatches; per render resolve each `TintToken` via `useTheme()` so light/dark switches re-tint live (FR-022, FR-024); selected swatch uses a themed selection ring sourced from theme tokens (no colour literals); props `{ tints, selectedTint, onSelect }`. `StyleSheet.create`, `Spacing`. No `Platform.OS`. Acceptance: T012 passes; tint flows from screen → `<AnimatedSymbol tint={...} />` (covered by T015).

**Checkpoint**: All four pickers exist as standalone units. Screen integration in US3 wires them together with the Replace mini-picker, the speed/repeat selectors, and Play Effect.

---

## Phase 5: User Story 3 — Screen + cross-platform fallbacks (Priority: P2)

**Goal**: A single screen wires preview + 4 pickers + speed/repeat selectors + Replace mini-picker + Play Effect button; renders the iOS-17+ banner on Android / Web; uses the same `<AnimatedSymbol>` plain-text fallback off-iOS so every interaction is testable everywhere (FR-028 – FR-031, SC-005).

**Independent Test**: RNTL render of `<SfSymbolsLabScreen />`; assert symbol picker (12), effect picker (7), tint picker (4), speed (3 segments), repeat (3 segments) all present; with `Platform.OS = 'web'` (and `'android'`), the iOS-17+ advisory banner is visible AND the preview renders the `ThemedText` fallback; with `Platform.OS = 'ios'`, banner is absent and preview renders the (mocked) `SymbolView`; selecting Replace shows the Replace mini-picker excluding the current primary symbol; picking a tint immediately updates the preview's `tintColor` prop (≤ 100 ms — assert by re-render, not wall-clock); pressing Play Effect bumps `playToken` so the next `<AnimatedSymbol>` render receives the combined `(symbol, effect, speed, repeat, tint, secondarySymbol?, playToken)` prop graph (quickstart §3 Story 3, SC-005, SC-006).

### Tests for User Story 3 (write FIRST, must FAIL before implementation)

- [X] T014 [P] [US3] Write `test/unit/modules/sf-symbols-lab/manifest.test.ts`: import default export from `src/modules/sf-symbols-lab/index.tsx`; assert `id === 'sf-symbols-lab'`, `platforms` deep-equals `['ios','android','web']`, `minIOS === '17.0'` (gate present per plan.md and FR-004), `render` is a function returning a React element. Acceptance: file exists; FAILS — manifest missing.
- [X] T015 [P] [US3] Write `test/unit/modules/sf-symbols-lab/screen.test.tsx` per `contracts/test-plan.md`: at top-of-file `jest.mock('expo-symbols', () => ({ SymbolView: jest.fn(() => null) }))`. Render `<SfSymbolsLabScreen />` and assert: 12 symbol cells, 7 effect segments, 4 tint swatches, 3 speed segments, 3 repeat segments; default selection = first symbol + Bounce + Normal + Once + first tint; **non-iOS** (`Platform.OS = 'android'` then `'web'`) — banner is visible AND preview is the `ThemedText` fallback; **iOS** — banner is absent AND `SymbolView` mock receives the combined prop graph. Interaction: pick `flame.fill` → pick Replace → assert Replace mini-picker is now visible AND `flame.fill` is excluded from its options → pick `star.fill` as the secondary → pick tint swatch B → press Play Effect → assert the most recent `SymbolView` (or fallback) props are `{ name: 'flame.fill', tintColor: <resolved swatch B>, secondaryName / animationSpec consistent with Replace, playToken bumped }`. Tint update independent of Play: changing the tint swatch immediately re-renders `<AnimatedSymbol>` with the new `tintColor` without requiring Play Effect (SC-006). Acceptance: file exists; FAILS — screen + manifest missing.

### Implementation for User Story 3

- [X] T016 [US3] Implement `src/modules/sf-symbols-lab/screen.tsx`: local `useState` for `selectedSymbol`, `selectedEffect`, `speed`, `repeat`, `tint`, `secondarySymbol`, `playToken` per `data-model.md`; layout (vertical `ThemedView`): iOS-17+ banner (only when `Platform.OS !== 'ios'` — single-value branch, constitution III) → preview area hosting `<AnimatedSymbol size="large" {...combined props} />` → `<SymbolPicker>` → `<EffectPicker onSelect={...} onSelectSecondary={openReplaceMiniPicker}>` → speed segmented control (3 themed `Pressable`s) → repeat segmented control (3 themed `Pressable`s) → `<TintPicker>` → conditional Replace mini-picker (visible iff `selectedEffect.id === 'replace'`, options = `SYMBOLS.filter(s => s.name !== selectedSymbol.name)`) → "Play Effect" themed `Pressable` that bumps `playToken` (set 0 then next-tick bump for indefinite-stop semantics per data-model.md state machine). `StyleSheet.create`, `Spacing`, themed components only. No imports from `expo-symbols` (only `<AnimatedSymbol>` is allowed to do that — FR-034). Acceptance: T015 passes.
- [X] T017 [US3] Implement `src/modules/sf-symbols-lab/index.tsx`: default-export `ModuleManifest` `{ id: 'sf-symbols-lab', platforms: ['ios','android','web'], minIOS: '17.0', render: () => <SfSymbolsLabScreen /> }`. Acceptance: T014 passes.

**Checkpoint**: Module is self-contained and fully tested but not yet reachable from the modules grid.

---

## Phase 6: Registry wiring

**Purpose**: Surface the module in the spec 006 grid via the one-import-one-entry contract (FR-001 / plan.md § Structure Decision). The existing 006 dispatch + iOS-version gating handle the `minIOS: '17.0'` hide-on-iOS-<17 behaviour automatically (FR-004).

- [X] T018 Edit `src/modules/registry.ts`:add ONE import `import sfSymbolsLab from '@/modules/sf-symbols-lab';` and append ONE entry to the manifests array. No other shell file modified. Acceptance: the global `test/unit/modules/manifest.test.ts` invariants suite still passes; the new module appears in the registry list; diff is exactly +2 lines (1 import + 1 entry, plus formatter-required commas).

---

## Phase 7: Polish & Quality Gate

- [X] T019 Run `pnpm check` (= `format:check && lint && typecheck && test`) and iterate until green with zero new warnings (SC-008). Acceptance: command exits 0; `pnpm test --testPathPattern sf-symbols-lab` reports 7 test files, all green.
- [X] T020 [P] Documentation touch-ups: cross-link `specs/009-sf-symbols-playground/quickstart.md` from `README.md` "Modules" list (if such a list exists; otherwise skip silently) and confirm `.github/copilot-instructions.md` SPECKIT block points at this feature's plan. Acceptance: links resolve; no other docs modified.
- [X] T021 Final commit on `009-sf-symbols-playground` summarising the feature, then run `quickstart.md` §3 on at least one physical iPhone running iOS 17+, one iPhone running iOS < 17 (gate verification), one Android device, and one web browser tab; record any deviations as follow-ups. Acceptance: commit pushed; smoke matrix recorded in PR description.

---

## Dependencies & Execution Order

### Phase order

1. **Phase 1 Setup** (T001–T002) — no deps.
2. **Phase 2 Foundational** (T003–T005) — depends on T001/T002; **blocks all US phases**. T003 first, then T004 ‖ (gate for T005), then T005.
3. **Phase 3 US1** — depends on T003 + T005. T006 ‖ T007 ‖ T008 first, then T009 (unblocks T008), then T010 (depends on T009 — picker cells render `<AnimatedSymbol>`) and T011 (independent of T009/T010).
4. **Phase 4 US2** — depends on T003 + T005. T012 first, then T013.
5. **Phase 5 US3** — depends on T009, T010, T011, T013. T014 ‖ T015 first, then T016 then T017 (manifest imports the screen).
6. **Phase 6 Registry** (T018) — depends on T017.
7. **Phase 7 Polish** (T019–T021) — T019 depends on everything above; T020 [P] alongside T019; T021 last.

### Parallelisable sets

- US1 tests: `T006 ‖ T007 ‖ T008` (different files, no shared state).
- US1 implementation: after T009 lands, `T010 ‖ T011`.
- US3 tests: `T014 ‖ T015`.
- Across stories after T005: US1 and US2 can start in parallel. US3 must wait for the four components (T009, T010, T011, T013).

### Test-before-implementation invariant

| Implementation task | Must-fail-first test task |
|---|---|
| T005 catalog.ts | T004 |
| T009 AnimatedSymbol.tsx | T008 |
| T010 SymbolPicker.tsx | T006 |
| T011 EffectPicker.tsx | T007 |
| T013 TintPicker.tsx | T012 |
| T016 screen.tsx | T015 |
| T017 index.tsx (manifest) | T014 |

---

## Parallel Example: kicking off after Foundational

```bash
# After T005 lands, in parallel:
Task: "T006 write SymbolPicker.test.tsx"
Task: "T007 write EffectPicker.test.tsx"
Task: "T008 write AnimatedSymbol.test.tsx"
Task: "T012 write TintPicker.test.tsx"
```

Then drive each red test green: T009 first (unblocks the picker cells), then T010 ‖ T011 ‖ T013, then unblock US3 (T014 ‖ T015 → T016 → T017), then T018, then T019.

---

## Implementation Strategy

### MVP

1. Phases 1 → 2 → 3 (US1) — `<AnimatedSymbol>` + `SymbolPicker` + `EffectPicker` proven via unit tests with the mocked `SymbolView`. Registry wiring intentionally lands only after T017 so the grid never points at a half-built screen.
2. US2 adds the live re-tint (`TintPicker`). US3 wires everything into `screen.tsx` with the Replace mini-picker, speed/repeat selectors, the iOS-17+ banner, and the cross-platform fallback path.
3. Land T018 to make the module reachable from the modules grid. iOS < 17 hiding is handled by spec 006's existing `minIOS` gating — no extra code in this module.
4. T019 quality gate, T020 docs, T021 device smoke + commit.

### Incremental delivery

US1 → US2 → US3 → registry → polish. Each US is mergeable behind the registry wiring (which is the last code change before polish), so partial work never appears in the shipped grid.

---

## Notes

- All file paths use the `@/` alias when imported (FR-037).
- Reanimated **Keyframe** API + worklets only — no Animated API (constitution III). The Appear / Disappear / Replace fades inside `<AnimatedSymbol>` use `useSharedValue` + `useAnimatedStyle`.
- Only `Platform.OS` references allowed: the single-value web/Android-banner gate inside `screen.tsx` (T016) and the single-value iOS / non-iOS render branch inside `AnimatedSymbol.tsx` (T009). Both are explicitly permitted by the constitution.
- `expo-symbols` is referenced only inside `AnimatedSymbol.tsx` (T009) — every other file in the module goes through that wrapper (FR-034). Component tests mock `expo-symbols` per file via `jest.mock('expo-symbols', () => ({ SymbolView: jest.fn(() => null) }))`.
- No theme-color literals — `TintPicker` resolves all swatch colours via `useTheme()` per render so light / dark mode switches re-tint live (FR-036, FR-024).
- Commit after each task or each green test→impl pair; never commit a red test together with its implementation in a single commit (TDD discipline).
