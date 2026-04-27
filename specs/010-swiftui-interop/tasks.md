---
description: "Task list — SwiftUI Interop Showcase (spec 010)"
---

# Tasks: SwiftUI Interop Showcase

**Input**: Design documents from `/specs/010-swiftui-interop/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Test-first is REQUIRED for this feature (Constitution V; plan.md § Constitution Check). Every implementation task is preceded by its unit test task. The test file inventory matches `plan.md` § Project Structure (1 manifest + 3 screen variants + 5 demos × 3 platform variants = 19 test files).

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Maps to user stories from spec.md (US1 = SwiftUI on iOS 16+, US2 = Android RN fallback + banner, US3 = Web RN-Web fallback + banner)
- All paths are repo-relative

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the only new runtime dependency (`@expo/ui`), confirm the SwiftUI skill is reachable, and scaffold module + test folders.

- [X] T001 Verify `@expo/ui` is present in `package.json` and `pnpm-lock.yaml`. If missing, run `npx expo install @expo/ui` from the repo root and commit the lockfile + manifest update in a single "chore(010): add @expo/ui" commit. Acceptance: `pnpm install` is clean; `pnpm list @expo/ui` reports an SDK 55–compatible version; no other deps changed.
- [X] T002 [P] Invoke the project's `Expo-UI-SwiftUI` skill (via the `skill` tool) to capture the exact import names, prop shapes, and change-callback signatures of `Picker`, `ColorPicker`, `DatePicker`, `Slider`, `Stepper`, and `Toggle` from `@expo/ui/swift-ui`. Record the resolved API surface as a comment block at the top of `src/modules/swiftui-interop/demos/PickerDemo.tsx` (added in T015) — or, if preferred, a short note in `specs/010-swiftui-interop/research.md` § "API surface (resolved at implement time)". Acceptance: every demo authored in Phase 4 imports only names actually exported by `@expo/ui/swift-ui`; `pnpm typecheck` passes.
- [X] T003 [P] Create empty module folders `src/modules/swiftui-interop/demos/` and test folders `test/unit/modules/swiftui-interop/demos/`. Acceptance: directories exist; `git status` shows them tracked (with `.gitkeep` if your tooling drops empty dirs); nothing else changed.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the demo-block contract — a manifest + a screen shell that composes 5 demo blocks — before any demo lands. Per `contracts/demo-block.md`, every demo is a no-prop component with the same shape, so wiring is uniform.

**⚠️ CRITICAL**: No US-tagged task may begin until this phase is green.

- [X] T004 Write `test/unit/modules/swiftui-interop/manifest.test.ts`: import default export from `src/modules/swiftui-interop/index.tsx`; assert `id === 'swiftui-interop'`, `platforms` deep-equals `['ios','android','web']`, `minIOS === '16.0'` (gate present per plan.md and FR-013), `render` is a function returning a React element. Acceptance: file exists; FAILS — manifest missing.
- [X] T005 Implement `src/modules/swiftui-interop/index.tsx`: default-export `ModuleManifest` `{ id: 'swiftui-interop', title: 'SwiftUI Interop', platforms: ['ios','android','web'], minIOS: '16.0', render: () => <SwiftUIInteropScreen /> }` (use the exact field names defined in `src/modules/types.ts` and the example set by `src/modules/sf-symbols-lab/index.tsx`). Imports `SwiftUIInteropScreen` from `./screen` so Metro picks the right `.tsx` / `.android.tsx` / `.web.tsx` per platform. Acceptance: T004 passes.

**Checkpoint**: Manifest is green and the registry can hold a placeholder pointer. US1, US2, US3 demos may now begin in parallel — each pair of (test, impl) is independent of the others because every demo is self-contained per `contracts/demo-block.md`.

---

## Phase 3: User Story 1 — Real SwiftUI on iOS 16+ (Priority: P1) 🎯 MVP

**Goal**: A user lands on `<SwiftUIInteropScreen />` on iOS, scrolls through 5 demo blocks, interacts with each real SwiftUI control, and watches the RN echo (label / swatch / bar) update within ~100 ms (SC-002).

**Independent Test**: RNTL render of `<SwiftUIInteropScreen />` (iOS path) with `@expo/ui/swift-ui` mocked. Assert all 5 demo blocks mount in the order Picker → ColorPicker → DatePicker → Slider → StepperToggle (FR-004); the iOS-only fallback banner is absent; firing each mocked control's change callback with a sample value updates that demo's RN echo (quickstart §3 Story 1, SC-002, SC-004).

### Tests for User Story 1 (write FIRST, must FAIL before implementation)

- [X] T006 [P] [US1] Write `test/unit/modules/swiftui-interop/demos/PickerDemo.test.tsx` per `contracts/demo-block.md` § "X.test.tsx": at top-of-file `jest.mock('@expo/ui/swift-ui', () => ({ Picker: jest.fn((props) => { (global as any).__lastPickerProps = props; return null; }), /* …other names per skill output… */ }))`. Render `<PickerDemo />`; locate the captured `onChange` (or skill-confirmed callback name) on `__lastPickerProps`; invoke it with a sample option; assert the RN `ThemedText` echo now displays that option's label; assert the caption text containing "real SwiftUI" is rendered. Acceptance: file exists; FAILS — demo missing.
- [X] T007 [P] [US1] Write `test/unit/modules/swiftui-interop/demos/ColorPickerDemo.test.tsx`: same pattern, mocking `ColorPicker`; fire the captured callback with a hex color (e.g. `'#ff8800'`); assert the RN swatch (a `ThemedView`) carries that color as a `style.backgroundColor` value (permitted dynamic style — `data-model.md`); assert caption present. Acceptance: file exists; FAILS — demo missing.
- [X] T008 [P] [US1] Write `test/unit/modules/swiftui-interop/demos/DatePickerDemo.test.tsx`: mock `DatePicker`; fire callback with a sample `Date`; assert the RN `ThemedText` echo renders that date in the human-readable format used by the demo (assert via substring match on year + month — do not pin locale-specific formatting); assert caption present. Acceptance: file exists; FAILS — demo missing.
- [X] T009 [P] [US1] Write `test/unit/modules/swiftui-interop/demos/SliderDemo.test.tsx`: mock `Slider`; fire callback with `value === 42`; assert the RN bar (`ThemedView`) has `style.width === '42%'` (or numeric width within a constrained min..max — assert via `style` prop snapshot of just the dynamic field); assert caption present. Acceptance: file exists; FAILS — demo missing.
- [X] T010 [P] [US1] Write `test/unit/modules/swiftui-interop/demos/StepperToggleDemo.test.tsx`: mock `Stepper` AND `Toggle`; fire `Stepper`'s callback with `5`, then `Toggle`'s callback with `true`; assert the RN `ThemedText` readout displays both `5` and the on-state (e.g. `"on"` / `"true"` — match the in-component formatting); assert caption present. Acceptance: file exists; FAILS — demo missing.
- [X] T011 [P] [US1] Write `test/unit/modules/swiftui-interop/screen.test.tsx`: at top-of-file `jest.mock('@expo/ui/swift-ui', () => ({ Picker: () => null, ColorPicker: () => null, DatePicker: () => null, Slider: () => null, Stepper: () => null, Toggle: () => null }))`. Render `<SwiftUIInteropScreen />` (iOS-default `screen.tsx` resolved by Jest); assert each demo block is present (locate by `testID` or accessibility label per demo); assert the iOS-only fallback banner is **absent** (no node containing `"iOS-only"`); assert demo render order is Picker → ColorPicker → DatePicker → Slider → StepperToggle (FR-004). Acceptance: file exists; FAILS — screen missing.

### Implementation for User Story 1

- [X] T012 [US1] Implement `src/modules/swiftui-interop/screen.tsx` (iOS-default): a vertical `ScrollView` of `ThemedView` sections each hosting one demo, in the order Picker → ColorPicker → DatePicker → Slider → StepperToggle (FR-004). No banner on iOS (`contracts/demo-block.md` § "Screen integration"). `StyleSheet.create`, `Spacing` only; no `Platform.OS` (the platform split is the file extension itself — constitution III). Imports `PickerDemo`, `ColorPickerDemo`, `DatePickerDemo`, `SliderDemo`, `StepperToggleDemo` from `./demos/<Name>Demo` (Metro resolves the iOS variant). Acceptance: T011 passes.
- [X] T013 [US1] Implement `src/modules/swiftui-interop/demos/PickerDemo.tsx` per `contracts/demo-block.md`: imports `Picker` from `@expo/ui/swift-ui` using the exact name confirmed in T002; one `useState` for the selected option; renders the SwiftUI `Picker` + an RN `ThemedText` echo of the selected `label` + a caption block. `StyleSheet.create`, `Spacing`, `ThemedText`, `ThemedView` only. No `any`. Acceptance: T006 passes.
- [X] T014 [US1] [P] Implement `src/modules/swiftui-interop/demos/ColorPickerDemo.tsx`: imports `ColorPicker`; `useState<string>` for the chosen color; renders the SwiftUI `ColorPicker` + an RN swatch (`ThemedView` with `style={{ backgroundColor: color }}` — permitted dynamic-value inline style per constitution IV / `data-model.md`) + caption. Acceptance: T007 passes.
- [X] T015 [US1] [P] Implement `src/modules/swiftui-interop/demos/DatePickerDemo.tsx`: imports `DatePicker`; `useState<Date>` defaulting to `new Date()`; renders both compact and wheel `DatePicker` styles per acceptance scenario US1.5 (use the skill-confirmed `displayedComponents` / `style` prop from T002) + RN `ThemedText` echo formatted via a tiny pure formatter colocated in the file + caption. Acceptance: T008 passes.
- [X] T016 [US1] [P] Implement `src/modules/swiftui-interop/demos/SliderDemo.tsx`: imports `Slider`; `useState<number>` clamped to 0..100; renders the SwiftUI `Slider` + an RN bar `ThemedView` whose `style.width` is the dynamic value `${value}%` + caption. Acceptance: T009 passes.
- [X] T017 [US1] [P] Implement `src/modules/swiftui-interop/demos/StepperToggleDemo.tsx`: imports `Stepper` AND `Toggle`; two `useState` slices (`number` + `boolean`); renders both SwiftUI controls in a row + an RN `ThemedText` readout combining both values + caption. Acceptance: T010 passes.

**Checkpoint**: All 5 SwiftUI demos render and round-trip values through their captured callbacks; the iOS screen composes them correctly. Android + Web variants land in US2 / US3.

---

## Phase 4: User Story 2 — Android RN fallback + banner (Priority: P2)

**Goal**: On Android, the same screen shows a banner stating `SwiftUI is iOS-only — here's the Material counterpart` (FR-012, exact wording per `contracts/demo-block.md`) followed by 5 RN-equivalent fallback demo blocks. `@expo/ui/swift-ui` is **never** imported (FR-014).

**Independent Test**: Explicit-filename RNTL render of `screen.android.tsx` and each `*.android.tsx` demo. With `jest.mock('@expo/ui/swift-ui', () => { throw new Error('should not be imported on android'); })` in place, every render completes without throwing AND the banner string + 5 fallback demos are visible AND interacting with each fallback control updates its RN echo (quickstart §3 Story 2).

### Tests for User Story 2 (write FIRST, must FAIL before implementation)

- [X] T018 [P] [US2] Write `test/unit/modules/swiftui-interop/demos/PickerDemo.android.test.tsx` per `contracts/demo-block.md` § "X.android.test.tsx": `jest.mock('@expo/ui/swift-ui', () => { throw new Error('should not be imported on android'); })`; `import { PickerDemo } from '@/modules/swiftui-interop/demos/PickerDemo.android'` (explicit-filename — mirrors `test/unit/components/glass/index.android.test.tsx`); render; assert no throw; locate the fallback control (e.g. a `Pressable` chip carrying the option label) and trigger its press; assert the RN echo updates. Acceptance: file exists; FAILS — fallback missing.
- [X] T019 [P] [US2] Write `test/unit/modules/swiftui-interop/demos/ColorPickerDemo.android.test.tsx`: same throw-mock + explicit-filename import for `ColorPickerDemo.android`; render; tap a swatch in the fallback grid; assert the RN preview swatch's `style.backgroundColor` updates to the tapped color. Acceptance: file exists; FAILS.
- [X] T020 [P] [US2] Write `test/unit/modules/swiftui-interop/demos/DatePickerDemo.android.test.tsx`: same pattern for `DatePickerDemo.android`; interact with the RN date input (set value via the input's `onChangeText` or testID-located press); assert the RN echo reflects the new date. Acceptance: file exists; FAILS.
- [X] T021 [P] [US2] Write `test/unit/modules/swiftui-interop/demos/SliderDemo.android.test.tsx`: same pattern for `SliderDemo.android`; if the fallback uses segmented chips (research Decision 5), tap chip representing 50; if it uses `@react-native-community/slider`, fire its `onValueChange` with 50; assert the RN bar width reflects 50. Acceptance: file exists; FAILS.
- [X] T022 [P] [US2] Write `test/unit/modules/swiftui-interop/demos/StepperToggleDemo.android.test.tsx`: same pattern; press the `+` button on the fallback stepper, then toggle the RN `Switch`; assert the readout combines both values. Acceptance: file exists; FAILS.
- [X] T023 [P] [US2] Write `test/unit/modules/swiftui-interop/screen.android.test.tsx`: `jest.mock('@expo/ui/swift-ui', () => { throw new Error('should not be imported on android'); })`; `import SwiftUIInteropScreen from '@/modules/swiftui-interop/screen.android'`; render; assert no throw; assert exact banner string `SwiftUI is iOS-only — here's the Material counterpart` is present (FR-012); assert all 5 fallback demos render in the order Picker → ColorPicker → DatePicker → Slider → StepperToggle. Acceptance: file exists; FAILS — Android screen missing.

### Implementation for User Story 2

- [X] T024 [US2] Implement `src/modules/swiftui-interop/demos/PickerDemo.android.tsx`: same component shape as `PickerDemo.tsx` (no props, same state slice — `contracts/demo-block.md` § 7) but the control is an RN-only segmented control or `@react-native-picker/picker`–style chip row built from themed `Pressable`s. Echo + caption identical in shape (caption may say "RN fallback for SwiftUI Picker"). MUST NOT import `@expo/ui/swift-ui`. Acceptance: T018 passes.
- [X] T025 [US2] [P] Implement `src/modules/swiftui-interop/demos/ColorPickerDemo.android.tsx`: RN swatch grid (4-N themed `Pressable`s); tap → set `useState` color; same RN preview swatch + caption. Acceptance: T019 passes.
- [X] T026 [US2] [P] Implement `src/modules/swiftui-interop/demos/DatePickerDemo.android.tsx`: RN date input fallback (themed `TextInput` with simple `YYYY-MM-DD` parsing OR a minimal year/month/day chip row — pick whichever is JS-pure and testable); same RN echo + caption. Acceptance: T020 passes.
- [X] T027 [US2] [P] Implement `src/modules/swiftui-interop/demos/SliderDemo.android.tsx`: per research Decision 5, prefer the segmented-chip fallback (no extra dep) over `@react-native-community/slider`; same RN bar + caption. Acceptance: T021 passes.
- [X] T028 [US2] [P] Implement `src/modules/swiftui-interop/demos/StepperToggleDemo.android.tsx`: themed `Pressable` `−` / `+` stepper buttons + RN `Switch`; same combined readout + caption. Acceptance: T022 passes.
- [X] T029 [US2] Implement `src/modules/swiftui-interop/screen.android.tsx`: `ScrollView` whose first child is a `ThemedView` banner with the exact string `SwiftUI is iOS-only — here's the Material counterpart` (FR-012), followed by the 5 fallback demos in the canonical order. Imports each demo from its bare module path (`./demos/PickerDemo` etc.) — Metro on Android picks the `.android.tsx` automatically (constitution III). MUST NOT import `@expo/ui/swift-ui`. Acceptance: T023 passes.

**Checkpoint**: Android variant is fully self-contained and proven by the throw-on-import mock to never reach `@expo/ui/swift-ui`.

---

## Phase 5: User Story 3 — Web RN-Web fallback + banner (Priority: P2)

**Goal**: Symmetrical to US2 but for Web. Banner reads exactly `Native SwiftUI is iOS-only` (FR-015). 5 fallback demos use RN-Web primitives or thin wrappers around `<input type="color">`, `<input type="date">`, `<input type="range">` per `plan.md` § Project Structure.

**Independent Test**: Explicit-filename render of `screen.web.tsx` and each `*.web.tsx` demo with the same throw-on-import mock for `@expo/ui/swift-ui`; banner + 5 fallbacks visible; interactions update RN echoes (quickstart §3 Story 3).

### Tests for User Story 3 (write FIRST, must FAIL before implementation)

- [X] T030 [P] [US3] Write `test/unit/modules/swiftui-interop/demos/PickerDemo.web.test.tsx`: throw-mock + `import { PickerDemo } from '@/modules/swiftui-interop/demos/PickerDemo.web'`; render; interact with the fallback (e.g. fire `onValueChange` on the `<select>` wrapper or tap a chip); assert echo updates. Acceptance: file exists; FAILS.
- [X] T031 [P] [US3] Write `test/unit/modules/swiftui-interop/demos/ColorPickerDemo.web.test.tsx`: same pattern; for an `<input type="color">` wrapper, fire its `onChange` with `'#00ff88'`; assert RN swatch updates. Acceptance: file exists; FAILS.
- [X] T032 [P] [US3] Write `test/unit/modules/swiftui-interop/demos/DatePickerDemo.web.test.tsx`: same pattern; for an `<input type="date">` wrapper, fire `onChange` with `'2026-04-28'`; assert RN echo updates. Acceptance: file exists; FAILS.
- [X] T033 [P] [US3] Write `test/unit/modules/swiftui-interop/demos/SliderDemo.web.test.tsx`: same pattern; for an `<input type="range">` wrapper, fire `onChange` with `'42'`; assert RN bar width is 42%. Acceptance: file exists; FAILS.
- [X] T034 [P] [US3] Write `test/unit/modules/swiftui-interop/demos/StepperToggleDemo.web.test.tsx`: same pattern; press web stepper buttons + flip web toggle; assert combined readout. Acceptance: file exists; FAILS.
- [X] T035 [P] [US3] Write `test/unit/modules/swiftui-interop/screen.web.test.tsx`: throw-mock + `import SwiftUIInteropScreen from '@/modules/swiftui-interop/screen.web'`; render; assert exact banner string `Native SwiftUI is iOS-only` (FR-015); assert all 5 fallback demos render in canonical order. Acceptance: file exists; FAILS — Web screen missing.

### Implementation for User Story 3

- [X] T036 [US3] Implement `src/modules/swiftui-interop/demos/PickerDemo.web.tsx`: RN-Web–compatible `<select>` wrapper or themed chip row; same component shape and echo + caption. MUST NOT import `@expo/ui/swift-ui`. Acceptance: T030 passes.
- [X] T037 [US3] [P] Implement `src/modules/swiftui-interop/demos/ColorPickerDemo.web.tsx`: thin wrapper around `<input type="color">` (use the project's existing pattern for raw web elements if present in `src/components/glass/index.web.tsx`); state + RN swatch + caption. Acceptance: T031 passes.
- [X] T038 [US3] [P] Implement `src/modules/swiftui-interop/demos/DatePickerDemo.web.tsx`: wrapper around `<input type="date">`; state + RN echo + caption. Acceptance: T032 passes.
- [X] T039 [US3] [P] Implement `src/modules/swiftui-interop/demos/SliderDemo.web.tsx`: wrapper around `<input type="range">`; state + RN bar + caption. Acceptance: T033 passes.
- [X] T040 [US3] [P] Implement `src/modules/swiftui-interop/demos/StepperToggleDemo.web.tsx`: web stepper buttons + RN `Switch` (renders fine on RN-Web); state + readout + caption. Acceptance: T034 passes.
- [X] T041 [US3] Implement `src/modules/swiftui-interop/screen.web.tsx`: `ScrollView` (RN-Web) whose first child is a `ThemedView` banner with the exact string `Native SwiftUI is iOS-only` (FR-015), followed by the 5 fallback demos in canonical order. MUST NOT import `@expo/ui/swift-ui`. Acceptance: T035 passes.

**Checkpoint**: All three platform variants of the screen + 5 demos are green. The module is fully self-contained; only the registry entry remains.

---

## Phase 6: Registry wiring

**Purpose**: Surface the module in the spec 006 grid via the one-import-one-entry contract (SC-006 / `src/modules/registry.ts` header). The existing 006 dispatch + iOS-version gating handle the `minIOS: '16.0'` hide-on-iOS-<16 behaviour automatically (FR-013).

- [X] T042 Edit `src/modules/registry.ts`: add ONE import `import swiftuiInterop from '@/modules/swiftui-interop';` and append ONE entry to the `MODULES` array. No other shell file modified. Acceptance: the global `test/unit/modules/manifest.test.ts` invariants suite still passes; `test/unit/modules/registry.test.ts` reports the new module appearing in source order; diff is exactly +2 lines (1 import + 1 entry, plus formatter-required commas).

---

## Phase 7: Polish & Quality Gate

- [X] T043 Run `pnpm check` (= `format:check && lint && typecheck && test`) and iterate until green with zero new warnings (SC-008). Acceptance: command exits 0; `pnpm test --testPathPattern swiftui-interop` reports 19 test files, all green.
- [X] T044 [P] Documentation touch-ups: cross-link `specs/010-swiftui-interop/quickstart.md` from `README.md` "Modules" list (if such a list exists; otherwise skip silently) and confirm `.github/copilot-instructions.md` SPECKIT block points at this feature's plan. Acceptance: links resolve; no other docs modified.
- [X] T045 Final commit on `010-swiftui-interop` summarising the feature, then run `quickstart.md` §3 on at least one physical iPhone running iOS 16+, one iPhone running iOS < 16 (gate verification), one Android device, and one web browser tab; record any deviations as follow-ups. Acceptance: commit pushed; smoke matrix recorded in PR description.

---

## Dependencies & Execution Order

### Phase order

1. **Phase 1 Setup** (T001–T003) — T001 first (adds dep). T002 ‖ T003 after T001.
2. **Phase 2 Foundational** (T004–T005) — depends on T001/T003. T004 first, then T005. **Blocks all US phases.**
3. **Phase 3 US1** — depends on Phase 2 + T002. T006 ‖ T007 ‖ T008 ‖ T009 ‖ T010 ‖ T011 first; then T012 (screen unblocks composition) and T013–T017 in parallel (each demo file is independent).
4. **Phase 4 US2** — depends on Phase 2 + T013–T017 only for matching state-slice shapes (`contracts/demo-block.md` § 7). Tests T018–T023 in parallel; impls T024–T029 in parallel after their tests are red. May start in parallel with Phase 5.
5. **Phase 5 US3** — depends on Phase 2 + T013–T017 (same shape contract). Tests T030–T035 ‖; impls T036–T041 ‖ after red. May run in parallel with Phase 4.
6. **Phase 6 Registry** (T042) — depends on T005 (manifest exists). For safety land it AFTER all 19 tests are green.
7. **Phase 7 Polish** (T043–T045) — T043 depends on everything above; T044 [P] alongside T043; T045 last.

### Parallelisable sets

- US1 tests: `T006 ‖ T007 ‖ T008 ‖ T009 ‖ T010 ‖ T011`.
- US1 impls (after T012 lands): `T013 ‖ T014 ‖ T015 ‖ T016 ‖ T017`.
- US2 tests: `T018 ‖ T019 ‖ T020 ‖ T021 ‖ T022 ‖ T023`.
- US2 impls (each after its red test): `T024 ‖ T025 ‖ T026 ‖ T027 ‖ T028 ‖ T029`.
- US3 tests: `T030 ‖ T031 ‖ T032 ‖ T033 ‖ T034 ‖ T035`.
- US3 impls: `T036 ‖ T037 ‖ T038 ‖ T039 ‖ T040 ‖ T041`.
- Across stories: US2 and US3 can run fully in parallel after US1 lands.

### Test-before-implementation invariant

| Implementation task | Must-fail-first test task |
|---|---|
| T005 index.tsx (manifest) | T004 |
| T012 screen.tsx | T011 |
| T013 PickerDemo.tsx | T006 |
| T014 ColorPickerDemo.tsx | T007 |
| T015 DatePickerDemo.tsx | T008 |
| T016 SliderDemo.tsx | T009 |
| T017 StepperToggleDemo.tsx | T010 |
| T024 PickerDemo.android.tsx | T018 |
| T025 ColorPickerDemo.android.tsx | T019 |
| T026 DatePickerDemo.android.tsx | T020 |
| T027 SliderDemo.android.tsx | T021 |
| T028 StepperToggleDemo.android.tsx | T022 |
| T029 screen.android.tsx | T023 |
| T036 PickerDemo.web.tsx | T030 |
| T037 ColorPickerDemo.web.tsx | T031 |
| T038 DatePickerDemo.web.tsx | T032 |
| T039 SliderDemo.web.tsx | T033 |
| T040 StepperToggleDemo.web.tsx | T034 |
| T041 screen.web.tsx | T035 |

---

## Parallel Example: kicking off after Foundational

```bash
# After T005 lands, in parallel:
Task: "T006 write PickerDemo.test.tsx"
Task: "T007 write ColorPickerDemo.test.tsx"
Task: "T008 write DatePickerDemo.test.tsx"
Task: "T009 write SliderDemo.test.tsx"
Task: "T010 write StepperToggleDemo.test.tsx"
Task: "T011 write screen.test.tsx"
```

Then drive each red test green: T012 first (screen shell unblocks composition assertions), then T013 ‖ T014 ‖ T015 ‖ T016 ‖ T017. Once US1 is green, kick off US2 and US3 in parallel (tests then impls). Land T042 last, then T043 quality gate.

---

## Implementation Strategy

### MVP

1. Phases 1 → 2 → 3 (US1) — `<SwiftUIInteropScreen />` + 5 SwiftUI demos proven via unit tests with `@expo/ui/swift-ui` mocked. Registry wiring intentionally lands only after every variant is green so the grid never points at a half-built screen.
2. US2 adds the Android banner + 5 RN fallbacks behind explicit-filename imports + throw-on-import mock (FR-014).
3. US3 adds the Web banner + 5 RN-Web fallbacks with the same guard (FR-017).
4. Land T042 to make the module reachable from the modules grid. iOS < 16 hiding is handled by spec 006's existing `minIOS` gating — no extra code in this module.
5. T043 quality gate, T044 docs, T045 device smoke + commit.

### Incremental delivery

US1 → US2 ‖ US3 → registry → polish. Each US is mergeable behind the registry wiring (which is the last code change before polish), so partial work never appears in the shipped grid.

---

## Notes

- All file paths use the `@/` alias when imported (constitution VI / `tsconfig.json`).
- **No `Platform.OS` branching anywhere in this module.** The platform split is the file extension itself (`.tsx` / `.android.tsx` / `.web.tsx`), mirroring `src/components/glass/` (constitution III).
- **`@expo/ui/swift-ui` is referenced ONLY inside `*.tsx` (iOS-default) demo and screen files** — every Android / Web variant is guarded by `jest.mock('@expo/ui/swift-ui', () => { throw new Error(...) })` in its test (FR-014, FR-017). This is the canonical enforcement pattern from `test/unit/components/glass/index.android.test.tsx`.
- The exact import names from `@expo/ui/swift-ui` (`Picker`, `ColorPicker`, `DatePicker`, `Slider`, `Stepper`, `Toggle`) and their callback prop names are RESOLVED IN T002 via the `Expo-UI-SwiftUI` skill — do not assume; verify before writing T013–T017.
- No theme-color literals — captions and surfaces use `ThemedText` / `ThemedView`. The two acknowledged dynamic style values (ColorPicker swatch `backgroundColor`, Slider bar `width`) are computed from runtime state and are explicitly permitted by the constitution (`plan.md` § Constitution Check IV).
- Commit after each task or each green test→impl pair; never commit a red test together with its implementation in a single commit (TDD discipline).
