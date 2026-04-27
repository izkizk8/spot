---
description: "Dependency-ordered task list for feature 014 — Home Screen Widgets module"
---

# Tasks: Home Screen Widgets Module (`widgets-lab`)

**Input**: Design documents from `/specs/014-home-widgets/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/widget-center-bridge.md, quickstart.md

**Tests**: REQUIRED. The spec mandates JS-pure tests for every component, screen variant, the manifest, the JS bridge, the plugin, and `widget-config` (FR-056, Constitution Principle V). Swift sources are verified on-device per `quickstart.md` (FR-057).

**Organization**: Tasks are grouped by user story so each story can be implemented, tested, and demoed independently. Within each story, tests precede implementation (TDD: write → fail → implement → pass).

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Different file, no ordering dependency on any incomplete task — safe to run in parallel.
- **[Story]**: User story tag (US1 / US2 / US3 / US4). Setup, Foundational, and Polish phases carry no story tag.
- Every task lists the **exact** file path it touches and an explicit acceptance criterion.

## Path Conventions

Paths are relative to the repository root (`C:\Users\izkizk8\spot-014-widgets\`). The feature touches:

- `src/modules/widgets-lab/` — JS module (manifest + screen + components + config)
- `src/native/widget-center*.ts` — JS bridge (iOS + Android + Web variants + types)
- `plugins/with-home-widgets/` — TS Expo config plugin
- `native/ios/widgets/` — Swift sources for the widget
- `test/unit/modules/widgets-lab/`, `test/unit/native/`, `test/unit/plugins/with-home-widgets/` — Jest tests
- `src/modules/registry.ts`, `app.json` — single-line additive edits

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Scaffold directories and the plugin package shell so subsequent file-creation tasks can run in parallel.

- [x] T001 [P] Create the empty directory tree expected by plan.md: `src/modules/widgets-lab/components/`, `plugins/with-home-widgets/`, `native/ios/widgets/`, `test/unit/modules/widgets-lab/components/`, `test/unit/native/`, `test/unit/plugins/with-home-widgets/`. **Acceptance**: All six directories exist and are tracked (add a `.gitkeep` if empty).
- [x] T002 [P] Create `plugins/with-home-widgets/package.json` with `name: "with-home-widgets"`, `main: "index.ts"`, no runtime deps (mirror `plugins/with-live-activity/package.json`). **Acceptance**: File parses as valid JSON, `main` points to `index.ts`.

**Checkpoint**: Empty scaffolding in place; foundational work can begin.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Types, default data, and the JS bridge contract that *every* user story depends on. Nothing in Phase 3+ may begin until this phase completes.

**⚠️ CRITICAL**: All four user stories import from `widget-config.ts` and `widget-center*.ts`. These MUST land — with green tests — before any story phase starts.

### Tests (write first, must FAIL before implementation)

- [x] T003 [P] Write `test/unit/modules/widgets-lab/widget-config.test.ts` covering: `TINTS.length === 4` with exact members `['blue','green','orange','pink']`; `DEFAULT_CONFIG` matches data-model.md; `validate()` clamps `counter` to `[-9999, 9999]`, falls back to default `tint` for unknown values, and accepts any string for `showcaseValue`. **Acceptance**: Test file present; `pnpm test widget-config` fails with module-not-found / undefined-export errors.
- [x] T004 [P] Write `test/unit/native/widget-center.test.ts` implementing all 7 cases enumerated in `contracts/widget-center-bridge.md` §"Test obligations" (web rejects, android rejects, iOS+module success paths, iOS+module rejection mapping `NOT_SUPPORTED`→`WidgetCenterNotSupportedError` and other→`WidgetCenterBridgeError`, iOS+module-absent path). Use `jest.mock('expo-modules-core')` to drive `requireOptionalNativeModule` and `jest.doMock` to swap `Platform.OS`. **Acceptance**: 7 distinct `it()` blocks; all fail before T006–T009 land.

### Implementation

- [x] T005 [P] Create `src/native/widget-center.types.ts` exporting `WidgetCenterNotSupportedError`, `WidgetCenterBridgeError`, `WidgetCenterBridge` interface, and re-exporting `WidgetConfig` / `Tint` from `@/modules/widgets-lab/widget-config` (forward declaration is fine — file lands in T006). **Acceptance**: `tsc --noEmit` passes for this file in isolation.
- [x] T006 [P] Create `src/modules/widgets-lab/widget-config.ts` defining `Tint`, `TINTS`, `WidgetConfig`, `DEFAULT_CONFIG`, `validate(input: unknown): WidgetConfig`, and an `AsyncStorage`-backed shadow store (`loadShadowConfig() / saveShadowConfig(c)` keyed `widgets-lab:config`). **Acceptance**: T003 passes; no ESLint errors.
- [x] T007 Create `src/native/widget-center.ts` (iOS implementation) — calls `requireOptionalNativeModule('SpotWidgetCenter')`, gates `isAvailable()` on `Platform.OS === 'ios'` + iOS-version ≥ 14 + module-non-null, maps native errors per the contract table. **Acceptance**: T004 iOS-path cases pass.
- [x] T008 [P] Create `src/native/widget-center.android.ts` exporting a default `WidgetCenterBridge` whose `isAvailable()` returns `false` and whose other 3 methods reject with `WidgetCenterNotSupportedError`. **Acceptance**: T004 android cases pass.
- [x] T009 [P] Create `src/native/widget-center.web.ts` mirroring the android stub. **Acceptance**: T004 web cases pass.

**Checkpoint**: Bridge + config types are green. User stories may now start in parallel.

---

## Phase 3: User Story 1 — Configure data and push it to a real Home Screen widget on iOS 14+ (Priority: P1) 🎯 MVP

**Goal**: A developer using a TestFlight build on iOS 14+ can edit `showcaseValue` / `counter` / `tint` in the app, tap **Push to widget**, and see the change appear on the Home Screen widget within ~1 s (SC-003).

**Independent Test**: With the new plugin enabled and a fresh prebuild, install the app on an iOS 14+ device, place the `SpotShowcaseWidget` (any size), open Widgets Lab, edit the three fields, tap Push, and confirm the Home Screen widget redraws with the new values.

### Tests for User Story 1 (write first, must FAIL)

- [x] T010 [P] [US1] Write `test/unit/plugins/with-home-widgets/index.test.ts` asserting: (a) running the plugin once adds the App Group `group.<bundleId>.showcase` to **both** the main-app and the widget-extension target entitlements; (b) running the plugin twice is a no-op (idempotency — counts of entries unchanged); (c) the four Swift sources from `native/ios/widgets/` plus the synthesized `SpotWidgetBundle.swift` end up in the widget extension's compile-sources list; (d) the existing 007 `LiveActivityDemoWidget.swift` retains the marker comment introduced for `@main` stripping and is referenced by `SpotWidgetBundle`; (e) `with-live-activity` plugin runs unaffected when both are configured (SC-010 / SC-011). **Acceptance**: Five `describe`/`it` groups present; all fail before T015–T019.
- [x] T011 [P] [US1] Write `test/unit/modules/widgets-lab/components/ConfigPanel.test.tsx` covering: renders three controls; trims `showcaseValue` and disables the Push button when empty (Edge Case in spec); clamps `counter` input to `[-9999, 9999]`; tint picker exposes exactly 4 swatches; calls the supplied `onPush` with the validated config when tapped. **Acceptance**: Tests fail with "Cannot find module ConfigPanel".

### Implementation for User Story 1

- [x] T012 [P] [US1] Create `native/ios/widgets/AppGroupKeys.swift` declaring the suite name (`group.<bundleId>.showcase`) and the three keys (`widgetConfig.showcaseValue`, `.counter`, `.tint`) as `enum` constants for sharing between widget extension and main-app Expo module (per data-model.md "Cross-target invariants"). **Acceptance**: File exists; constants match spec strings exactly.
- [x] T013 [P] [US1] Create `native/ios/widgets/ShowcaseEntry.swift` defining `Tint` enum (`blue, green, orange, pink`), `WidgetConfig` struct with `default`, and `ShowcaseEntry: TimelineEntry` (`date, showcaseValue, counter, tint`). **Acceptance**: Compiles in Xcode (verified on-device per quickstart.md); enum cases match JS `TINTS` exactly.
- [x] T014 [P] [US1] Create `native/ios/widgets/ShowcaseProvider.swift` implementing `TimelineProvider` with `placeholder` / `getSnapshot` / `getTimeline`; reads `UserDefaults(suiteName:)` via `AppGroupKeys`; returns `Timeline([entry], policy: .after(now + 30 * 60))`; falls back to `WidgetConfig.default` on any read failure (FR-014, plan.md §Resolved #3). **Acceptance**: Three protocol methods implemented; 30-min cadence hard-coded.
- [x] T015 [P] [US1] Create `native/ios/widgets/ShowcaseWidgetView.swift` — SwiftUI view branching on `@Environment(\.widgetFamily)` for `.systemSmall / .systemMedium / .systemLarge`; tints from the documented hex map; renders `showcaseValue` + `counter`. **Acceptance**: All three families produce visually distinct layouts (verified on-device).
- [x] T016 [US1] Create `native/ios/widgets/ShowcaseWidget.swift` declaring `struct ShowcaseWidget: Widget` with `kind = "SpotShowcaseWidget"`, `StaticConfiguration(provider: ShowcaseProvider())`, content closure → `ShowcaseWidgetView(entry:)`, `.supportedFamilies([.systemSmall, .systemMedium, .systemLarge])`, display name + description. **NOTE**: do NOT add `@main` here — the bundle synthesised by T018 is `@main`. **Acceptance**: Builds; depends on T013–T015.
- [x] T017 [P] [US1] Create `plugins/with-home-widgets/add-app-group.ts` exporting a `ConfigPlugin` that adds `com.apple.security.application-groups: ['group.<bundleId>.showcase']` to **both** the main-app entitlements and the widget-extension target entitlements; idempotent (de-dupes the array). **Acceptance**: T010 case (a) and (b) pass.
- [x] T018 [P] [US1] Create `plugins/with-home-widgets/add-swift-sources.ts` that adds `ShowcaseWidget.swift`, `ShowcaseProvider.swift`, `ShowcaseEntry.swift`, `ShowcaseWidgetView.swift`, and `AppGroupKeys.swift` to the existing 007 widget extension's PBX compile sources; idempotent (skips paths already present). **Acceptance**: T010 case (c) passes.
- [x] T019 [US1] Create `plugins/with-home-widgets/add-widget-bundle.ts` that (a) detects the marker comment `// @main // spot:widget-bundle-managed` in the existing `LiveActivityDemoWidget.swift` (introducing it on first run if absent), (b) replaces the `@main` attribute on `LiveActivityDemoWidget` with the marker so it is no longer the bundle entry-point, and (c) writes `ios-widget/SpotWidgetBundle.swift` containing `@main struct SpotWidgetBundle: WidgetBundle { var body: some Widget { LiveActivityDemoWidget(); ShowcaseWidget() } }` and adds it to the extension's compile sources. Idempotent on every dimension. **Acceptance**: T010 case (d) passes; running prebuild twice yields byte-identical output.
- [x] T020 [US1] Create `plugins/with-home-widgets/index.ts` exporting the composed `ConfigPlugin` that runs `add-app-group` → `add-swift-sources` → `add-widget-bundle` in order; default-export. **Acceptance**: T010 cases (a)–(e) all pass; importing the plugin produces no side effects until invoked.
- [x] T021 [US1] Edit `app.json` adding `"./plugins/with-home-widgets"` to the `expo.plugins` array (single-line addition, alphabetised after `with-live-activity`). **Acceptance**: `expo prebuild --clean` succeeds; existing `with-live-activity` plugin still listed and unaffected.
- [x] T022 [US1] Create `src/modules/widgets-lab/components/ConfigPanel.tsx` — `ThemedView` container, three `ThemedText`-labelled controls (TextInput for `showcaseValue`, stepper/numeric input for `counter`, swatch picker for `tint`), a Push button wired to a `onPush(config: WidgetConfig)` prop. Use `StyleSheet.create()` only; trim + validate before invoking `onPush`. **Acceptance**: T011 passes.

**Checkpoint**: Plugin + Swift + JS bridge + `ConfigPanel` form an end-to-end push path on iOS 14+. The screen orchestration (T035) lives in US3, but the underlying capability is verifiable via `bridge.setConfig(...).then(bridge.reloadAllTimelines)` from a REPL/test harness.

---

## Phase 4: User Story 2 — Add the widget to the Home Screen with clear in-app guidance (Priority: P1)

**Goal**: A first-time user who has never installed an iOS widget can follow the in-app instructions and successfully add `SpotShowcaseWidget` to their Home Screen without leaving the app for documentation.

**Independent Test**: On iOS 14+, navigate to the Widgets Lab module from the registry list, read the Setup Instructions card, follow them, and confirm a working widget appears on the Home Screen.

### Tests for User Story 2

- [x] T023 [P] [US2] Write `test/unit/modules/widgets-lab/components/SetupInstructions.test.tsx` covering: renders an ordered list of steps; each step has an icon + title + description; mentions the widget kind name `SpotShowcaseWidget` literally; renders only when `isAvailable === true` (component returns `null` otherwise per FR-031). **Acceptance**: Tests fail before T024.
- [x] T024 [P] [US2] Write `test/unit/modules/widgets-lab/manifest.test.ts` asserting: `id === 'widgets-lab'`, `title === 'Widgets Lab'`, `platforms` includes `ios`/`android`/`web`, `minIOS === '14.0'`, `render` returns a React element. **Acceptance**: Fails before T026.

### Implementation for User Story 2

- [x] T025 [US2] Create `src/modules/widgets-lab/components/SetupInstructions.tsx` rendering the iOS-specific add-to-Home-Screen walkthrough; reads no external state; pure presentation component using `ThemedView` / `ThemedText` and the `Spacing` scale. **Acceptance**: T023 passes.
- [x] T026 [US2] Create `src/modules/widgets-lab/index.tsx` exporting the `ModuleManifest` literal exactly as in data-model.md §`ModuleManifest`; default-exports nothing — module is registered via named export `manifest`. **Acceptance**: T024 passes.
- [x] T027 [US2] Edit `src/modules/registry.ts` adding **one** import line (`import { manifest as widgetsLab } from './widgets-lab';`) and **one** array entry (`widgetsLab`) in the modules array, keeping alphabetical order. **Acceptance**: Module appears in the home registry list at runtime; no other registry entries are touched.

**Checkpoint**: Module is discoverable from the registry on every platform. iOS users see the SetupInstructions card with platform-specific guidance.

---

## Phase 5: User Story 3 — Preview all three sizes and inspect timeline / reload state (Priority: P2)

**Goal**: A user (on any platform) can see Small / Medium / Large previews that update live as they edit the config; on iOS 14+, can additionally see the next refresh time and a rolling log of the last 10 reload events.

**Independent Test**: Edit `showcaseValue` and watch all three preview cards update in the same render pass (SC-007). On iOS 14+, push and verify the StatusPanel timestamp advances and a new entry appears in the ReloadEventLog.

### Tests for User Story 3

- [x] T028 [P] [US3] Write `test/unit/modules/widgets-lab/components/WidgetPreview.test.tsx` covering: renders three labelled cards (Small, Medium, Large); each card shows the supplied `WidgetConfig`'s `showcaseValue` + `counter`; tint hex matches the documented map; cards re-render when the `config` prop changes (no internal state). **Acceptance**: Fails before T029.
- [x] T029 [P] [US3] Write `test/unit/modules/widgets-lab/components/StatusPanel.test.tsx` covering: when `isAvailable === true`, shows the bridge availability line, the current config summary, and a "next refresh time" line equal to `now + 30min` formatted in user locale; when `isAvailable === false`, hides the refresh-time line and renders an unavailable banner instead (FR-031). **Acceptance**: Fails before T031.
- [x] T030 [P] [US3] Write `test/unit/modules/widgets-lab/components/ReloadEventLog.test.tsx` covering: empty state placeholder when log is empty; renders newest-first; caps at exactly 10 entries (push 11 → tail dropped, FR-036 / SC-004); failure entries show `errorMessage`; component is hidden when `isAvailable === false`. **Acceptance**: Fails before T033.
- [x] T031 [P] [US3] Write `test/unit/modules/widgets-lab/screen.test.tsx` covering: orchestrates ConfigPanel + WidgetPreview + StatusPanel + SetupInstructions + ReloadEventLog; on Push, calls `bridge.setConfig` then `bridge.reloadAllTimelines`, dispatches a `success` ReloadEvent, and the log gains an entry; on bridge error, dispatches a `failure` event with the error message; gates iOS-only chrome behind `bridge.isAvailable()`. **Acceptance**: Fails before T035.

### Implementation for User Story 3

- [x] T032 [P] [US3] Create `src/modules/widgets-lab/components/WidgetPreview.tsx` rendering all three sizes from a single `config` prop using `StyleSheet.create()`; pulls hex values from a local `tints.ts` map (in-module per FR-050). **Acceptance**: T028 passes.
- [x] T033 [P] [US3] Create `src/modules/widgets-lab/components/StatusPanel.tsx` taking `{ isAvailable, config, lastRefreshIso? }` props; computes "next refresh" = `now + 30min` only when `isAvailable`. **Acceptance**: T029 passes.
- [x] T034 [P] [US3] Create `src/modules/widgets-lab/components/ReloadEventLog.tsx` taking `{ events: ReloadEvent[], isAvailable }`; ring-buffer trimming is the parent's responsibility; component is purely presentational. **Acceptance**: T030 passes.
- [x] T035 [US3] Create `src/modules/widgets-lab/screen.tsx` (iOS variant) — uses `useReducer` with a 10-capacity ring buffer for ReloadEvents; reads/writes config via `bridge.getCurrentConfig` / `setConfig`; calls `reloadAllTimelines` on push; renders StatusPanel + ConfigPanel + SetupInstructions + WidgetPreview + ReloadEventLog in spec order (FR-029). Wraps in `ThemedView`. **Acceptance**: T031 passes; visual parity with mock layout in spec FR-029.

**Checkpoint**: Full iOS 14+ experience shipped: configure → push → see widget update → see status + log update.

---

## Phase 6: User Story 4 — Cross-platform fallback on Android, Web, and iOS < 14 (Priority: P2)

**Goal**: Android, Web, and iOS < 14 users see the configuration panel and three live previews working against the AsyncStorage shadow store, with a banner explaining that real Home Screen widgets are iOS-14-only and the Push button disabled.

**Independent Test**: Build for Android (or run on web), open Widgets Lab, edit the config, watch previews update in real time, confirm the unavailability banner is visible and the Push button is disabled.

### Tests for User Story 4

- [x] T036 [P] [US4] Write `test/unit/modules/widgets-lab/screen.android.test.tsx` covering: renders banner ("Home Screen widgets require iOS 14+"); renders ConfigPanel (with Push button disabled per FR-024); renders WidgetPreview wired to AsyncStorage shadow store via `loadShadowConfig` / `saveShadowConfig`; does NOT render StatusPanel's refresh line, SetupInstructions, or ReloadEventLog (FR-031). **Acceptance**: Fails before T037.
- [x] T037 [P] [US4] Write `test/unit/modules/widgets-lab/screen.web.test.tsx` mirroring T036 for the web variant. **Acceptance**: Fails before T039.

### Implementation for User Story 4

- [x] T038 [US4] Create `src/modules/widgets-lab/screen.android.tsx` — banner + ConfigPanel (push disabled) + WidgetPreview backed by `widget-config`'s shadow store; no iOS-only chrome. **Acceptance**: T036 passes.
- [x] T039 [US4] Create `src/modules/widgets-lab/screen.web.tsx` — same shape as `.android.tsx`; uses platform-appropriate copy in the banner if needed. **Acceptance**: T037 passes.

**Checkpoint**: Cross-platform parity achieved per Constitution Principle I; Android / Web / iOS < 14 demo the configure-and-preview half of the journey.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T040 Update `specs/014-home-widgets/quickstart.md` if any plan-vs-spec naming deltas surfaced during implementation (per plan.md "Spec back-patching" note about `home-widgets` → `widgets` directory and consolidated `WidgetPreview`). **Acceptance**: Quickstart steps reference the actual paths shipped.
- [ ] T041 Run `pnpm check` (typecheck + lint + tests) from repo root. **Acceptance**: Exit code 0; zero TS errors; zero new ESLint warnings; all new Jest suites green; existing 007 / 013 suites unaffected.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup; **BLOCKS all user stories**.
- **User Story 1 (Phase 3, P1)**: Depends on Foundational. Plugin work (T010, T017–T021) can proceed in parallel with Swift work (T012–T016) since they touch disjoint files; T019 depends on T018 ordering only at composition time.
- **User Story 2 (Phase 4, P1)**: Depends on Foundational. Independent of US1's plugin work — registry edit (T027) can land before US1 compiles.
- **User Story 3 (Phase 5, P2)**: Depends on Foundational. Component tests (T028–T030) and component impls (T032–T034) are mutually parallel; screen orchestration (T035) depends on the three components and on `ConfigPanel` from US1 (T022) + `SetupInstructions` from US2 (T025).
- **User Story 4 (Phase 6, P2)**: Depends on Foundational + on `ConfigPanel` (T022) + `WidgetPreview` (T032) being available (component reuse). T036–T039 are otherwise independent of US1's native/plugin work.
- **Polish (Phase 7)**: Depends on every preceding phase.

### Within Each User Story

- Tests are written first and observed to FAIL before implementation tasks begin (TDD gate).
- Swift sources can be authored in parallel; the Widget definition (T016) depends on Provider/Entry/View existing.
- Plugin sub-modules (`add-app-group`, `add-swift-sources`, `add-widget-bundle`) can be authored in parallel; the composing `index.ts` (T020) depends on all three.

### Parallel Opportunities

- **Phase 1**: T001, T002 in parallel.
- **Phase 2**: T003, T004 (tests) in parallel; then T005, T006, T008, T009 in parallel (different files); T007 sequenced after T005 + T006 (imports them).
- **Phase 3 (US1)**: T010, T011 (tests) in parallel; T012–T015 (Swift) in parallel; T017, T018 (plugin sub-modules) in parallel; T022 (ConfigPanel) parallel to all native/plugin work.
- **Phase 4 (US2)**: T023, T024 (tests) in parallel; T025, T026 in parallel; T027 sequenced after T026.
- **Phase 5 (US3)**: T028–T031 (tests) in parallel; T032–T034 (components) in parallel; T035 sequenced last.
- **Phase 6 (US4)**: T036, T037 in parallel; T038, T039 in parallel.

---

## Parallel Example: User Story 1 native + plugin tracks

```bash
# Track A — Swift (one developer / one tab):
Task: "T012 Create native/ios/widgets/AppGroupKeys.swift"
Task: "T013 Create native/ios/widgets/ShowcaseEntry.swift"
Task: "T014 Create native/ios/widgets/ShowcaseProvider.swift"
Task: "T015 Create native/ios/widgets/ShowcaseWidgetView.swift"
# then sequentially:
Task: "T016 Create native/ios/widgets/ShowcaseWidget.swift"

# Track B — Plugin (second developer / second tab, in parallel with Track A):
Task: "T017 Create plugins/with-home-widgets/add-app-group.ts"
Task: "T018 Create plugins/with-home-widgets/add-swift-sources.ts"
# then sequentially:
Task: "T019 Create plugins/with-home-widgets/add-widget-bundle.ts"
Task: "T020 Create plugins/with-home-widgets/index.ts"
Task: "T021 Edit app.json"

# Track C — JS UI (third developer, in parallel):
Task: "T022 Create src/modules/widgets-lab/components/ConfigPanel.tsx"
```

---

## Implementation Strategy

### MVP (US1 + US2 only)

1. Phase 1 → Phase 2 (foundation green).
2. Phase 3 (US1) → real widget pushable on iOS 14+.
3. Phase 4 (US2) → module discoverable + add-to-Home-Screen guidance.
4. **STOP, validate via `quickstart.md` on a physical device, ship MVP TestFlight build.**

### Incremental Delivery

5. Phase 5 (US3) → richer in-app feedback (status + previews + reload log).
6. Phase 6 (US4) → cross-platform parity for Android / Web / iOS < 14.
7. Phase 7 (Polish) → docs back-patch + `pnpm check` gate.

### Parallel Team Strategy

- Dev A: Swift + plugin (Tracks A + B above) — owns US1 native/packaging.
- Dev B: JS UI (ConfigPanel + SetupInstructions + manifest + registry) — owns US1 JS half + US2.
- Dev C: Status / Preview / ReloadLog components + screen orchestration — owns US3 + US4 fallbacks.

---

## Notes

- `[P]` = different file, no incomplete-task dependency. Re-check before launching: a task that was `[P]` at planning time may become serial if a co-edited file appears mid-flight.
- TDD is mandatory per Constitution Principle V. Every component / screen / bridge / plugin task has a paired `*.test.*` file authored first.
- Swift sources are not unit-tested in CI (Windows-based dev env per plan.md "Testing"); they are verified on-device per `quickstart.md` (FR-057).
- The marker comment introduced in T019 (`// @main // spot:widget-bundle-managed`) is the **only** edit to feature 007's `LiveActivityDemoWidget.swift`; it is idempotent and reversible (re-adding `@main` and removing the bundle file restores 007's original behaviour).
- Registry edit (T027) and `app.json` edit (T021) are the only changes to repo-shared files; both are single-line additive.
