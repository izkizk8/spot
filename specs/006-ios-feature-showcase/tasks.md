---
description: "Task list for iOS Feature Showcase"
---

# Tasks: iOS Feature Showcase

**Input**: Design documents from `specs/006-ios-feature-showcase/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/module-manifest.md, quickstart.md

**Tests**: Included. FR-027 mandates jest-expo + RNTL coverage of the Modules grid (incl. unsupported-platform marking) and the theme switcher (incl. persistence). The constitution's Test-First principle is binding (plan.md §Constitution Check, principle V).

**Organization**: Tasks are grouped by user story (US1–US4) so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on incomplete tasks)
- **[Story]**: US1 / US2 / US3 / US4 — only on user-story phase tasks
- All paths are repository-root-relative

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the one new runtime dependency and create the empty directory skeleton the rest of the work fills in. No business logic yet.

- [X] T001 Install AsyncStorage via `npx expo install @react-native-async-storage/async-storage` (updates `package.json` + `pnpm-lock.yaml`); confirm the installed version is the SDK 55–aligned one
- [X] T002 [P] Create empty directories `src/modules/`, `src/modules/liquid-glass-playground/`, `src/components/glass/`, `src/theme/`, `src/app/modules/`, `test/unit/modules/`, `test/unit/theme/`, `test/unit/shell/` (use `.gitkeep` files where needed so they can be committed before content lands)
- [X] T003 [P] Verify baseline `pnpm check` (format, lint, typecheck, jest) is green on the current branch before any feature code is added; capture the run as the pre-change baseline

**Checkpoint**: Dependency in place, skeleton ready, baseline green.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the typed contracts and providers every user story depends on. Until this phase completes, no user story can compile.

**⚠️ CRITICAL**: No US task may begin until Phase 2 is done.

- [X] T004 Define the `ModuleManifest`, `ModulePlatform`, `ModuleIcon`, `SFSymbolName` types in `src/modules/types.ts` exactly as specified in `specs/006-ios-feature-showcase/contracts/module-manifest.md` (readonly fields, JSDoc preserved)
- [X] T005 Create the empty registry barrel `src/modules/registry.ts` exporting `export const MODULES: readonly ModuleManifest[] = [];` (the Liquid Glass entry is appended in T024); add the documented "Add new modules here ↓" comment from the contract
- [X] T006 [P] Create `src/theme/preference-provider.tsx` exporting `ThemePreferenceProvider`, internal context, and the AsyncStorage I/O for key `spot.theme.preference` (read once at boot, write on change, swallow write failures with a `__DEV__` console warning per FR-024). Default preference: `'system'`
- [X] T007 [P] Create `src/theme/use-theme-preference.ts` exporting `usePreference()` and `setPreference()` hooks backed by the context from T006
- [X] T008 Modify `src/hooks/use-theme.ts` so it derives `EffectiveColorScheme` from `usePreference()` (preference `'light'`/`'dark'` win; `'system'` falls back to `useColorScheme()` defaulting to `'light'` on `'unspecified'`) per data-model.md §EffectiveColorScheme. Public `useTheme()` signature MUST NOT change
- [X] T009 Modify `src/app/_layout.tsx` to wrap the existing root in `<ThemePreferenceProvider>` so every route sees the preference (this is the only edit the provider requires in the shell)
- [X] T010 [P] Add a `Modules` route stub `src/app/modules/index.tsx` rendering a placeholder `<ThemedView>` so `expo-router` typed routes regenerate and the tab can link to it; will be replaced in T029
- [X] T011 [P] Add a `Module detail` route stub `src/app/modules/[id].tsx` rendering a placeholder `<ThemedView>` for the same reason; will be replaced in T030
- [X] T012 [P] Add a `Settings` route stub `src/app/settings.tsx` rendering a placeholder `<ThemedView>` so the route is typed and reachable; will be replaced in T039
- [X] T013 Modify `src/components/app-tabs.tsx` (native NativeTabs) to add `Modules` and `Settings` triggers alongside the existing tabs, using SF Symbol icons via `expo-symbols`
- [X] T014 Modify `src/components/app-tabs.web.tsx` (custom web tabs) to add the same `Modules` and `Settings` entries with identical ids and labels (FR-026 — tab parity)
- [X] T015 [P] Write `test/unit/shell/tab-parity.test.ts`: import the tab id arrays from both `app-tabs.tsx` and `app-tabs.web.tsx` and assert deep equality. Test MUST fail if either file is edited without the other (FR-026 enforcement)

**Checkpoint**: Types, registry barrel, theme provider, tab parity test, and routable placeholders all in place. User stories can now be worked on in parallel.

---

## Phase 3: User Story 1 — Be wowed on first launch (Priority: P1) 🎯 MVP

**Goal**: Polished, theme-aware Home hero showcase that renders coherently on iOS, Android, and web with zero modules registered, plus a friendly empty state on the Modules tab.

**Independent Test**: Launch the app on iOS, Android, and web with `MODULES = []`. Verify Home renders the hero with smooth entrance motion; Modules tab shows an empty state, not an error; Settings tab is reachable.

### Tests for User Story 1 ⚠️ (write first, must fail before implementation)

- [X] T016 [P] [US1] Write `test/unit/modules/registry.test.ts` covering: empty `MODULES` array is valid; ids deterministic source-order; no duplicate ids (uses a fixture registry, not the real one) — invariants from data-model.md §ModuleRegistry

### Implementation for User Story 1

- [X] T017 [US1] Replace `src/app/index.tsx` with a polished hero showcase composed of `ThemedView` + `ThemedText` only, sized exclusively from `Spacing` in `src/constants/theme.ts`. All styles via `StyleSheet.create()` (FR-003, FR-004)
- [X] T018 [P] [US1] Add Reanimated 4 + Worklets entrance motion to the hero (no Animated API). Motion MUST be reduced-motion aware via `useReducedMotion()`
- [X] T019 [P] [US1] Implement the empty-state path in `src/app/modules/index.tsx`: when `MODULES.length === 0`, render a friendly `<ThemedView>` with a one-line `<ThemedText>` empty message and an SF Symbol illustration (FR-012). Real grid lands in T029, so write this branch as a guarded early return
- [X] T020 [US1] Verify on iOS simulator, Android emulator, and web that Home renders, Modules shows empty state, and Settings is reachable; record the run in the PR description

**Checkpoint**: Shell is independently demonstrable on all three platforms with zero modules. MVP achieved.

---

## Phase 4: User Story 2 — Liquid Glass Playground (Priority: P1)

**Goal**: First shipping module. Three interactive glass surfaces driven by live blur / tint / shape controls on iOS; documented translucent and `backdrop-filter` fallbacks on Android and web.

**Independent Test**: Open Modules → Liquid Glass Playground. Adjust blur, tint, shape; confirm at least three surfaces respond live on iOS. Repeat on Android and web; confirm fallback renders without runtime errors.

### Tests for User Story 2 ⚠️ (write first, must fail before implementation)

- [X] T021 [P] [US2] Write `test/unit/modules/manifest.test.ts` validating every entry in the real `MODULES` array: `id` matches `/^[a-z][a-z0-9-]*$/`, `platforms` is non-empty subset of `{ios,android,web}`, `minIOS` matches `/^\d+(\.\d+){0,2}$/` if present, `render` is a function (data-model.md §ModuleManifest validation rules)
- [X] T022 [P] [US2] Write `test/unit/modules/platform-filtering.test.tsx` covering: a manifest declaring only `['ios']` rendered on Android shows the unsupported badge and tapping the card does not throw (FR-010, edge case "Unsupported-platform module")

### Implementation for User Story 2

- [X] T023 [P] [US2] Implement the `<Glass>` primitive at `src/components/glass/index.tsx` (iOS) using `expo-glass-effect`'s `<GlassView>`; props: `intensity`, `tint`, `shape`, `style`, `children`
- [X] T024 [P] [US2] Implement `src/components/glass/index.android.tsx` — translucent `View` (rgba background + elevation + 1px hairline border) honouring the same props (FR-016)
- [X] T025 [P] [US2] Implement `src/components/glass/index.web.tsx` — `View` with the inline `backdropFilter` style object (the single permitted StyleSheet exception, documented inline per plan.md §Constitution Check) honouring the same props (FR-017)
- [X] T026 [P] [US2] Create `src/modules/liquid-glass-playground/tints.ts` exporting the tint chip palette as `as const` constants
- [X] T027 [US2] Implement `src/modules/liquid-glass-playground/screen.tsx`: three distinct interactive `<Glass>` surfaces plus controls (blur intensity slider, tint chips bound to T026, shape segmented control). All control changes propagate to all three surfaces in real time (FR-014, FR-015). All styles via `StyleSheet.create()`
- [X] T028 [US2] Implement `src/modules/liquid-glass-playground/index.ts` exporting the default `ModuleManifest` (id `liquid-glass-playground`, SF Symbol `sparkles` + fallback glyph, `platforms: ['ios','android','web']`, `render: () => <PlaygroundScreen />`); update `src/modules/registry.ts` to import and append it
- [X] T029 [US2] Replace the empty-state-only `src/app/modules/index.tsx` with the full grid: render one card per `MODULES` entry preserving array order, showing title / description / icon / platform-availability badge derived from `platforms` and (on iOS) `minIOS`. Empty-state branch from T019 is preserved (FR-009, FR-010, FR-012)
- [X] T030 [US2] Implement `src/app/modules/[id].tsx`: look up the route id in `MODULES`; if found AND module available on current platform, invoke `manifest.render()`; otherwise render a graceful "not supported on this platform" view (FR-011, edge case "Module screen crash isolation"). Wrap the rendered module in a React error boundary so a runtime error inside the module screen lets the user navigate back (SC-008)

**Checkpoint**: Liquid Glass Playground is demonstrable on iOS with three live surfaces; Android and web render their fallbacks. Modules grid is fully driven by the registry.

---

## Phase 5: User Story 3 — Theme switching (Priority: P2)

**Goal**: Settings exposes a System / Light / Dark switcher whose selection updates every visible surface immediately and persists across restarts.

**Independent Test**: Toggle through System / Light / Dark in Settings; verify Home, Modules, and the open Liquid Glass Playground all reflect the choice without restart. Quit and relaunch — selection is restored. With System selected, change OS appearance and confirm the app follows.

### Tests for User Story 3 ⚠️ (write first, must fail before implementation)

- [X] T031 [P] [US3] Write `test/unit/theme/preference.test.tsx` covering: default preference is `'system'`; `setPreference('dark')` updates context and writes the AsyncStorage key `spot.theme.preference`; boot reads the previously written value; AsyncStorage write failure does not throw and in-memory state still updates (FR-021, FR-024)
- [X] T032 [P] [US3] Extend the same test file (or a sibling) to assert `EffectiveColorScheme` derivation: `'light'`/`'dark'` win regardless of OS scheme; `'system'` follows `useColorScheme()`; `'unspecified'` defaults to `'light'`
- [X] T033 [P] [US3] Add a test asserting that when preference is `'light'` or `'dark'`, OS appearance changes do NOT change `EffectiveColorScheme` (FR-023, edge case "System appearance change while in non-System mode")

### Implementation for User Story 3

- [X] T034 [US3] Replace the `src/app/settings.tsx` placeholder with the System / Light / Dark switcher UI — three radio-style options inside `ThemedView`, sourced from `usePreference()` and writing through `setPreference()`. All styles via `StyleSheet.create()`. Use `Spacing` only (FR-019)
- [X] T035 [US3] Verify (manual + observation in `preference-provider.tsx` from T006) that AsyncStorage writes occur on selection change and read occurs once at boot; ensure the provider exposes a `loaded` flag so the UI can suppress flicker until the persisted value is hydrated (FR-021, SC-004)
- [X] T036 [US3] Manually verify on iOS / Android / web that selecting a theme updates Home, Modules grid, and the open Liquid Glass Playground within 500 ms with no partial-update flicker (SC-003)

**Checkpoint**: Theme switching works end-to-end and persists across restarts; the Liquid Glass Playground (US2) re-themes correctly because it consumes the same `useTheme()`.

---

## Phase 6: User Story 4 — Add a future module (Priority: P3)

**Goal**: Prove the registry contract by demonstrating that a stub module can be added with one folder + one import line, and that an iOS-only module is correctly badged on Android/web.

**Independent Test**: Create a no-op stub module folder with a valid manifest; add one registration import; confirm the card appears in the Modules grid with declared metadata, that opening it routes to its screen, and that an iOS-only manifest is badged "iOS only" on Android/web without crashing on tap.

### Tests for User Story 4 ⚠️ (write first, must fail before implementation)

- [X] T037 [P] [US4] Extend `test/unit/modules/platform-filtering.test.tsx` (from T022) with a case asserting that a manifest declaring `platforms: ['ios']` and `minIOS: '17.0'` is treated as unavailable when the simulated iOS version is `16.0` (FR-006, edge case "Minimum iOS version not met")

### Implementation for User Story 4

- [X] T038 [US4] Document the "add a module in ≤ 10 minutes" path inline in `src/modules/registry.ts` as a comment block matching `quickstart.md` §"Add a new module" (single source of truth for the developer-facing contract). No new runtime code; this seals SC-006
- [X] T039 [US4] Manually walk the quickstart "add a new module" flow with a throwaway stub (do NOT commit the stub); time it; assert it completes in under 10 minutes touching only the new folder + one line in `registry.ts` (SC-006)

**Checkpoint**: All four user stories independently demonstrable.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T040 [P] Run `pnpm format` and commit any formatting deltas
- [X] T041 [P] Run `pnpm lint` (oxlint + eslint) and resolve any new findings introduced by this feature
- [X] T042 [P] Run `pnpm typecheck` (`tsc --noEmit`) and resolve any new errors
- [X] T043 Run `pnpm test` and ensure every new test from T015, T016, T021, T022, T031, T032, T033, T037 passes; full suite green
- [X] T044 Run `pnpm check` end-to-end as the final gate; MUST pass cleanly (FR-028, SC-007)
- [X] T045 Walk the entire `quickstart.md` manual verification matrix on iOS, Android, and web and record results in the PR description (covers SC-001, SC-002, SC-003, SC-005, SC-008)
- [X] T046 Update `.specify/memory/` agent context only if a new convention emerged that future features must obey (no-op if not)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: no deps; T001 must precede T006/T007 (AsyncStorage import)
- **Phase 2 (Foundational)**: depends on Phase 1; blocks every user story
- **Phase 3 (US1)**: depends on Phase 2
- **Phase 4 (US2)**: depends on Phase 2; the empty-state branch in `app/modules/index.tsx` from T019 (US1) is extended by T029 (US2) — coordinate the edit if US1 and US2 are worked in parallel
- **Phase 5 (US3)**: depends on Phase 2; independent of US2 implementation but the manual 500 ms verification in T036 needs US2 present to be meaningful
- **Phase 6 (US4)**: depends on Phase 2 + the registry being non-empty (T028)
- **Phase 7 (Polish)**: depends on every targeted user story being complete

### Within Each User Story

- Tests (`T016`, `T021`/`T022`, `T031`/`T032`/`T033`, `T037`) MUST be written and observed failing before the corresponding implementation tasks
- Models / types before consumers; primitives before screens; screens before routing
- `[P]` tasks within a story touch distinct files

### Parallel Opportunities

- Phase 1: T002 ∥ T003
- Phase 2: T006 ∥ T007 ∥ T010 ∥ T011 ∥ T012 ∥ T015 (all distinct files); T008 must follow T006/T007; T013 ∥ T014 are different files but logically one change — review together
- Phase 3 (US1): T016 first; then T017 ∥ T018 ∥ T019
- Phase 4 (US2): T021 ∥ T022 first; then T023 ∥ T024 ∥ T025 ∥ T026; T027 after T023–T026; T028 after T027; T029 after T028; T030 after T028
- Phase 5 (US3): T031 ∥ T032 ∥ T033 first; then T034; then T035; then T036
- Phase 7: T040 ∥ T041 ∥ T042

---

## Parallel Example: User Story 2

```bash
# Tests first, in parallel:
Task: "T021 Write test/unit/modules/manifest.test.ts"
Task: "T022 Write test/unit/modules/platform-filtering.test.tsx"

# Then the three Glass platform implementations + tint constants in parallel:
Task: "T023 Implement <Glass> iOS impl in src/components/glass/index.tsx"
Task: "T024 Implement <Glass> Android fallback in src/components/glass/index.android.tsx"
Task: "T025 Implement <Glass> web fallback in src/components/glass/index.web.tsx"
Task: "T026 Create tint palette in src/modules/liquid-glass-playground/tints.ts"
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Phase 1 → Phase 2 → Phase 3.
2. Stop. The shell — Home hero, empty Modules tab, Settings reachable — is demoable on iOS / Android / web with zero modules.

### Incremental delivery

1. MVP (US1) → demo.
2. Add US2 (Liquid Glass Playground) → demo the first "wow" capability.
3. Add US3 (Theme switching) → demo end-to-end token system.
4. Add US4 (extensibility verification) → demo the architecture proof.
5. Phase 7 polish + `pnpm check` → merge.

### Parallel team strategy

After Phase 2: one developer can take US1 + US3 (shell + theme), another can take US2 (Liquid Glass + grid + routing). US4 belongs to whoever finishes second since it depends on the registry being non-empty.

---

## Notes

- `[P]` = different files, no incomplete-task dependency
- `[US#]` traces a task back to its user story; foundational, setup, and polish tasks intentionally have no `[US#]`
- Tests must fail before their implementation lands (constitution principle V)
- Commit after each task or logical group per the project's standard workflow
- The `backdropFilter` inline style in `src/components/glass/index.web.tsx` is the only acknowledged StyleSheet-discipline exception in this feature (plan.md §Constitution Check)
- Tab parity (FR-026) is mechanically guarded by T015 — do not bypass

---

## Open Questions

None. All architectural decisions were resolved in `plan.md` and `research.md`; the user instructed autonomous execution.
