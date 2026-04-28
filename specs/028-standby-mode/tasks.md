---
description: "Dependency-ordered task list for feature 028 — StandBy Mode showcase module"
---

# Tasks: StandBy Mode Module (`standby-lab`)

**Input**: Design documents from `/specs/028-standby-mode/`
**Prerequisites**: plan.md (required), spec.md (required), research.md (required), data-model.md, quickstart.md, contracts/{standby-config,widget-center-bridge,manifest}.contract.ts

**Tests**: REQUIRED — every component, every screen variant, the manifest, the bridge extension, the standby-config module, and every plugin sub-module has an explicit unit test (FR-SB-057, NFR-SB-009, Constitution Principle V). The Swift surface for 028 (four new files) is verified on-device per `quickstart.md` (Constitution V exemption mirroring 007 / 014 / 027).

**Organization**: Tasks are grouped by the plan's Implementation Phases. The plan defines no separate user-story phases — the single screen composes the same module across iOS-17+ / Android / Web / iOS-<17 fallbacks (US1, US2, US3, US4 per spec), all delivered together as one shippable module. Task density and conventions mirror `specs/027-lock-screen-widgets/tasks.md` (T-numbering, [P] markers, exact file paths, RED→GREEN test pairing, dependencies).

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- All file paths are repository-relative under the worktree root `C:\Users\izkizk8\spot-028-standby`
- Test convention: tests live under `test/unit/modules/standby-lab/`, `test/unit/native/`, and `test/unit/plugins/with-standby-widget/` (matches plan §"Phased file inventory" and 014/027's layout — NOT colocated)
- **No commits are produced by `/speckit.tasks`.** The "Checkpoint commit" tasks below are markers for the implementation phase; do not run `git commit` while generating this file.

---

## Phase 1: Setup (Module + Plugin + Native + Test Scaffolding)

**Purpose**: Create the empty directory tree and the plugin package shell so subsequent file-creation tasks can run in parallel. No business logic.

- [ ] T001 [P] Create the module directory tree: `src/modules/standby-lab/` and `src/modules/standby-lab/components/`. Add `.gitkeep` if a directory ends up empty after the phase. **Acceptance**: Both directories exist and are tracked.
- [ ] T002 [P] Create the plugin directory `plugins/with-standby-widget/` with `package.json` containing `{ "name": "with-standby-widget", "version": "0.0.0", "main": "index.ts", "types": "index.ts" }` (mirror `plugins/with-lock-widgets/package.json`). Plugin source files (`index.ts`, `add-swift-sources.ts`, `insert-bundle-entry.ts`) are created in Phase 7. **Acceptance**: File parses as valid JSON; `main` points to `index.ts`; `dependencies` is absent or empty (NFR-SB-003).
- [ ] T003 [P] Create the Swift source directory `native/ios/widgets/standby/` with a `.gitkeep`. Swift source files are created in Phase 8. **Acceptance**: Directory exists and is tracked.
- [ ] T004 [P] Create the test directory tree: `test/unit/modules/standby-lab/`, `test/unit/modules/standby-lab/components/`, `test/unit/plugins/with-standby-widget/`. Add `.gitkeep` if empty after this phase. **Acceptance**: All three directories exist and are tracked.
- [ ] T005 **Checkpoint commit**: `chore(028): scaffold standby-lab module/plugin/test/native dirs`.

---

## Phase 2: Foundational — `standby-config.ts` (Plan §"Phased file inventory" — FR-SB-013 / FR-SB-021 / FR-SB-029 / FR-SB-031 / FR-SB-048)

**Purpose**: Define `StandByConfig`, `RenderingMode`, `DEFAULT_STANDBY_CONFIG`, `validate()`, and the AsyncStorage shadow store. Every component, every screen variant, and the bridge extension depend on these symbols.

**⚠️ CRITICAL**: Nothing in Phase 3+ may begin until this phase completes.

### Tests for standby-config (write FIRST, ensure they FAIL)

- [ ] T006 Write `test/unit/modules/standby-lab/standby-config.test.ts` covering every obligation in `contracts/standby-config.contract.ts`:
  1. `DEFAULT_STANDBY_CONFIG` deep-equals `{ showcaseValue: 'StandBy', counter: 0, tint: <014-default-tint>, mode: 'fullColor' }` (FR-SB-029, contract §`DEFAULT_STANDBY_CONFIG`). Reference 014's `DEFAULT_CONFIG.tint` to compute the expected tint default (single source of truth; FR-SB-013).
  2. `SHADOW_STORE_KEY === 'spot.widget.standbyConfig'` (literal string assertion; FR-SB-048) AND is disjoint from 014's `'widgets-lab:config'` and 027's `'spot.widget.lockConfig'`.
  3. `validate(undefined)`, `validate(null)`, `validate({})`, `validate('not an object')` all return `DEFAULT_STANDBY_CONFIG` (no throw).
  4. `validate({ showcaseValue: 42 })` returns config with `showcaseValue === DEFAULT_STANDBY_CONFIG.showcaseValue` (non-string falls back).
  5. `validate({ showcaseValue: 'x'.repeat(200) })` returns config whose `showcaseValue.length === 64` (contract §`validate` length cap).
  6. `validate({ counter: 'abc' })` returns config with `counter === DEFAULT_STANDBY_CONFIG.counter` (non-number falls back).
  7. `validate({ counter: 99999 })` returns `counter === 9999`; `validate({ counter: -99999 })` returns `counter === -9999` (clamp; contract §`validate`).
  8. `validate({ tint: 'magenta' })` returns config with `tint === DEFAULT_STANDBY_CONFIG.tint` (unknown tint falls back).
  9. `validate({ mode: 'unknown' })` returns config with `mode === DEFAULT_STANDBY_CONFIG.mode` ('fullColor'); `validate({ mode: 'fullColor' })`, `'accented'`, `'vibrant'` all round-trip verbatim (FR-SB-031).
  10. `validate({ showcaseValue: 'Hi', counter: 7, tint: <valid-014-tint>, mode: 'accented' })` returns the input verbatim (happy path).
  11. `validate(JSON.parse('"raw string"'))` returns `DEFAULT_STANDBY_CONFIG` (defensive).
  12. AsyncStorage round-trip: `saveShadowStandByConfig(c)` then `loadShadowStandByConfig()` resolves to `c` for a `c` that exercises every field including each of the three `mode` values (use the existing `@react-native-async-storage/async-storage` jest-mock provider; mirror 014's `widget-config.test.ts` and 027's `lock-config.test.ts` patterns).
  13. `loadShadowStandByConfig()` resolves to `DEFAULT_STANDBY_CONFIG` when the key is missing.
  14. `loadShadowStandByConfig()` resolves to `DEFAULT_STANDBY_CONFIG` when the stored value is malformed JSON (mock `getItem` to return `'not-json{'`); MUST NOT throw.
  15. `saveShadowStandByConfig()` swallows AsyncStorage errors silently (mock `setItem` to reject; assert the promise resolves, not rejects).
  16. `loadShadowStandByConfig()` swallows AsyncStorage errors silently (mock `getItem` to reject; assert resolves to `DEFAULT_STANDBY_CONFIG`).

  Each assertion MUST FAIL initially because `standby-config.ts` does not yet exist. **Acceptance**: ≥16 distinct `it()` blocks; all fail with module-not-found / undefined-export errors. **Spec ref**: FR-SB-013, FR-SB-021, FR-SB-029, FR-SB-031, FR-SB-048, contract `standby-config.contract.ts`.

### Implementation for standby-config

- [ ] T007 Implement `src/modules/standby-lab/standby-config.ts` per `contracts/standby-config.contract.ts`: export `RenderingMode` type alias `'fullColor' | 'accented' | 'vibrant'`, `StandByConfig` interface, `DEFAULT_STANDBY_CONFIG` const, `SHADOW_STORE_KEY` const literal `'spot.widget.standbyConfig'`, `validate(input: unknown): StandByConfig` pure function (with the length cap + clamp + mode-fallback rules from the contract), `loadShadowStandByConfig(): Promise<StandByConfig>`, `saveShadowStandByConfig(c: StandByConfig): Promise<void>`. Re-import `Tint` from `@/modules/widgets-lab/widget-config` (NOT redefine — FR-SB-013 / data-model.md §3). AsyncStorage I/O wrapped in `try/catch` returning `DEFAULT_STANDBY_CONFIG` / `void` on error. Make T006 pass. **Acceptance**: T006 green; `pnpm typecheck` clean; no ESLint errors. **Spec ref**: FR-SB-013, FR-SB-021, FR-SB-029, FR-SB-031, FR-SB-048.
- [ ] T008 **Checkpoint commit**: `feat(028): standby-config module (StandByConfig, RenderingMode, defaults, validate, AsyncStorage shadow)`.

**Checkpoint**: standby-config module is green. Bridge (Phase 3), components (Phase 5), and screens (Phase 6) may now begin.

---

## Phase 3: Bridge Extension — `setStandByConfig`, `getStandByConfig` (Plan §"Phased file inventory" / R-B — FR-SB-022 / FR-SB-023 / FR-SB-024)

**Purpose**: Additively extend `WidgetCenterBridge` with the two new per-kind config methods on every platform variant. iOS 17+ implementation calls through to the native module; Android / Web / iOS < 17 reject with `WidgetCenterNotSupportedError`. **No new error classes** (R-B; reuse 014/027's). **No new reload symbol** — 028 reuses 027's `reloadTimelinesByKind('SpotStandByWidget')` (FR-SB-024).

### Tests for the bridge (write FIRST, ensure they FAIL)

- [ ] T009 Write `test/unit/native/widget-center-standby.test.ts` covering every obligation in `contracts/widget-center-bridge.contract.ts` §"Required test cases":
  1. **Web platform** (`jest.doMock('react-native', () => ({ Platform: { OS: 'web', Version: 0 } }))`): (a) `getStandByConfig()` rejects with `WidgetCenterNotSupportedError`; (b) `setStandByConfig(STANDBY_CONFIG)` rejects with `WidgetCenterNotSupportedError`; (c) `isAvailable()` returns `false` and does not throw.
  2. **Android platform** (`Platform.OS === 'android'`): same 3 assertions as web.
  3. **iOS 17+ with native module mocked**: (a) `getStandByConfig()` resolves with the mocked module's response (assert deep-equal against a fixture `STANDBY_CONFIG`, verifying all four fields including `mode` round-trip); (b) `setStandByConfig(c)` calls through with the same payload; (c) `reloadTimelinesByKind('SpotStandByWidget')` calls through with the exact kind string and resolves (re-asserts 027's contract; ensures 028 does NOT introduce a parallel reload symbol per FR-SB-024); (d) native rejection with code `NOT_SUPPORTED` surfaces as `WidgetCenterNotSupportedError`; (e) native rejection with any other code surfaces as `WidgetCenterBridgeError(message)`; (f) `setStandByConfig` with `mode: 'unknown' as RenderingMode` rejects with `WidgetCenterBridgeError` (defensive validation at the bridge boundary; contract §3.f).
  4. **iOS < 17** (mock `Platform.Version` to `'16.4'`): (a) `getStandByConfig` rejects with `WidgetCenterNotSupportedError`; (b) `setStandByConfig` rejects with `WidgetCenterNotSupportedError`; (c) `isAvailable()` returns `false`. NOTE: 028's bridge methods gate at iOS ≥ 17; 027's existing methods continue to gate at iOS ≥ 16 and 014's at iOS ≥ 14.
  5. **No parallel reload symbol** (FR-SB-024 / contract §6): static-inspect `widget-center.ts`, `widget-center.android.ts`, `widget-center.web.ts`, `widget-center.types.ts` and assert the literal string `'reloadStandByTimelines'` does not appear in any of them (`fs.readFileSync` + `.includes()`).
  6. **014 / 027 regression**: existing `getCurrentConfig`, `setConfig`, `reloadAllTimelines`, `isAvailable`, `reloadTimelinesByKind`, `getLockConfig`, `setLockConfig` symbols still resolve correctly under the new mock setup (smoke check — invoke each once and assert no method is undefined).

  Use `jest.mock('expo-modules-core')` to drive `requireOptionalNativeModule` and `jest.doMock('react-native', …)` to swap `Platform.OS` / `Platform.Version` (mirror 014's `widget-center.test.ts` and 027's `widget-center-by-kind.test.ts` patterns). Each assertion MUST FAIL initially because the two new methods do not yet exist on any platform variant. **Acceptance**: ≥15 distinct `it()` blocks; all fail with `TypeError: bridge.setStandByConfig is not a function` etc. **Spec ref**: FR-SB-022, FR-SB-023, FR-SB-024, contract `widget-center-bridge.contract.ts`, R-B.

### Implementation for the bridge

- [ ] T010 Extend `src/native/widget-center.types.ts` `WidgetCenterBridge` interface with two new method signatures: `getStandByConfig(): Promise<StandByConfig>`, `setStandByConfig(config: StandByConfig): Promise<void>`. Re-export (or declare and re-export) the `StandByConfig` type from `@/modules/standby-lab/standby-config` for bridge-side consumers (forward type-only import; depends on T007). Do NOT add any new error classes — `WidgetCenterNotSupportedError` and `WidgetCenterBridgeError` from 014 are reused (R-B). Do NOT add a `reloadStandByTimelines` method (FR-SB-024). **Acceptance**: `pnpm typecheck` clean; no new exports beyond the two signatures + the type re-export. **Spec ref**: FR-SB-022, FR-SB-024.
- [ ] T011 [P] Extend `src/native/widget-center.ts` (iOS impl) with the two new methods. `getStandByConfig()` calls the underlying native module's `getStandByConfig` (or equivalent symbol), gates on `Platform.OS === 'ios'` + iOS-version ≥ **17** + module-non-null (note: 014's existing methods gate at iOS ≥ 14; 027's gate at iOS ≥ 16; 028's at iOS ≥ 17 per FR-SB-001), and maps native errors per the contract table (`NOT_SUPPORTED` → `WidgetCenterNotSupportedError`, anything else → `WidgetCenterBridgeError`). `setStandByConfig(c)` follows the same gating + error-mapping AND additionally validates `c.mode` is one of `'fullColor'|'accented'|'vibrant'` and `c.tint` is a known tint slug before calling through, rejecting with `WidgetCenterBridgeError('invalid …')` otherwise (contract §3.f / spec FR-SB-022 defensive obligation). `isAvailable()` is unchanged (014 governs it). The existing `reloadTimelinesByKind` from 027 is left untouched. **Acceptance**: T009 iOS-17+ cases (3a–3f) pass. **Spec ref**: FR-SB-022, FR-SB-023, FR-SB-024.
- [ ] T012 [P] Extend `src/native/widget-center.android.ts` with stubs for the two new methods, each rejecting with `WidgetCenterNotSupportedError` (mirror 014's existing stub style for `setConfig` etc and 027's for `setLockConfig`). `isAvailable()` is unchanged. **Acceptance**: T009 android cases (2a–2c) pass. **Spec ref**: FR-SB-023.
- [ ] T013 [P] Extend `src/native/widget-center.web.ts` with the same two stubs as android. **Acceptance**: T009 web cases (1a–1c) pass. **Spec ref**: FR-SB-023.
- [ ] T014 Re-run 014's bridge test (`test/unit/native/widget-center.test.ts`) and 027's bridge test (`test/unit/native/widget-center-by-kind.test.ts`) and any tests that mock `WidgetCenterBridge` (search the repo for `WidgetCenterBridge` mocks — at least 014's screen tests and 027's screen tests). If any test fails because its mock factory did not supply the two new methods, update the mock factory to provide stub implementations that throw `WidgetCenterNotSupportedError` if invoked from a 014- or 027-only test path. Document the touched files in the commit message. **Acceptance**: 014's and 027's full bridge + screen suites green (R-B mitigation).
- [ ] T015 **Checkpoint commit**: `feat(028): widget-center bridge +setStandByConfig/+getStandByConfig (iOS 17+ impl + RN/Web/Android rejects; reuses 027's reloadTimelinesByKind)`.

**Checkpoint**: Bridge surface is green on all 3 platforms. Phase 4+ may now use the bridge symbols.

---

## Phase 4: Manifest + Registry Hook-Up (Plan §"Phased file inventory" — FR-SB-001 / FR-SB-002 / FR-SB-003 / FR-SB-004, AC-SB-001)

**Purpose**: Register the module so the Modules grid renders a "StandBy Mode" tile.

### Tests for the manifest (write FIRST, ensure they FAIL)

- [ ] T016 Write `test/unit/modules/standby-lab/manifest.test.ts` covering every obligation in `contracts/manifest.contract.ts`:
  1. `manifest.id === 'standby-lab'`.
  2. `manifest.title === 'StandBy Mode'`.
  3. `manifest.platforms` deep-equals `['ios', 'android', 'web']`.
  4. `manifest.minIOS === '17.0'` (FR-SB-001 / FR-SB-004).
  5. `typeof manifest.render === 'function'`.
  6. `manifest.icon.ios` is a non-empty string (SF Symbol name).
  7. `manifest.icon.fallback` is a non-empty single-character emoji.
  8. `manifest.description` is a non-empty string and matches `/standby|iOS\s*17/i` (mentions "StandBy" or "iOS 17"; FR-SB-002).

  Each assertion MUST FAIL because `src/modules/standby-lab/index.tsx` does not yet exist. **Acceptance**: 8 `it()` blocks; all fail. **Spec ref**: FR-SB-001, FR-SB-002, FR-SB-004, contract `manifest.contract.ts`.

### Implementation for the manifest

- [ ] T017 Implement `src/modules/standby-lab/index.tsx` exporting a default `ModuleManifest` with `id: 'standby-lab'`, `title: 'StandBy Mode'`, `platforms: ['ios', 'android', 'web']`, `minIOS: '17.0'`, `description` (one-sentence summary mentioning StandBy + iOS 17), `icon: { ios: <SF Symbol>, fallback: <emoji> }`, and `render: () => <Screen />` where `<Screen />` is imported from `./screen` (the platform-suffix resolver picks up `.tsx` / `.android.tsx` / `.web.tsx` automatically per RN/Metro defaults). Make T016 pass. **Acceptance**: T016 green. **Spec ref**: FR-SB-001, FR-SB-002, FR-SB-003.
- [ ] T018 Append the manifest to `src/modules/registry.ts`: add ONE import line `import standbyLab from './standby-lab';` after the `lockWidgetsLab` import (027's last addition) AND ONE entry `standbyLab` to the `MODULES` array immediately after `lockWidgetsLab`. Diff MUST be exactly +2 lines. No other entry may be modified or reordered. **Acceptance**: `MODULES.find(m => m.id === 'standby-lab')` is defined; `MODULES.length` is the prior length + 1 (= 027's closing total + 1). **Spec ref**: FR-SB-002, AC-SB-001.
- [ ] T019 If `test/unit/modules/registry.test.ts` asserts a fixed `MODULES.length`, update the constant to the new length. Otherwise (it asserts `> 0` / uniqueness only) leave it unchanged. Re-run the registry test suite; assert duplicate-id check passes (no other manifest has `id === 'standby-lab'`). **Acceptance**: registry test green. **Spec ref**: AC-SB-001.
- [ ] T020 **Checkpoint commit**: `feat(028): standby-lab manifest + registry +1`.

---

## Phase 5: Components (Plan §"Phased file inventory" — FR-SB-028 / FR-SB-031 / FR-SB-035 / FR-SB-036 / FR-SB-039 / FR-SB-040 / FR-SB-041 / R-C)

**Purpose**: Build the seven reusable components. `StandByConfigPanel` composes 014's data-control inner widgets by default; fallback (R-C) is a verbatim local copy if a circular type dep emerges. Each component has a paired test file. Tests are written first.

### Tests for components (write FIRST, ensure they FAIL — all [P], independent files)

- [ ] T021 [P] Write `test/unit/modules/standby-lab/components/ExplainerCard.test.tsx`: (a) renders heading + body prose; (b) body text mentions both "StandBy" (case-insensitive) AND each of the three rendering-mode names — `Full Color`, `Accented`, `Vibrant` — at least once (FR-SB-039); (c) renders identically on every platform (no `Platform.OS` branch — explainer is cross-platform); (d) accepts an optional `style` prop and applies it to the outer container. MUST FAIL. **Spec ref**: FR-SB-039.
- [ ] T022 [P] Write `test/unit/modules/standby-lab/components/StandByConfigPanel.test.tsx`: (a) composes the three 014 data-control inner widgets (showcase-value field, counter input, four-swatch tint picker) — assert each is rendered (search by testID or by the 014 component's exported display name); (b) renders the `RenderingModePicker` directly below the tint picker; (c) renders a "Push to StandBy widget" button below the rendering-mode picker; (d) `onPush` is called with the validated draft `StandByConfig` (incl. `mode`) on tap; (e) trims `showcaseValue` and disables the Push button when empty (mirrors 014's edge case); (f) when `disabledPushReason` prop is set, the Push button is `disabled` and an inline explanation containing the prop string is rendered (FR-SB-027 (c)). **R-C fallback note**: if T029 (impl) takes the local-copy path due to a circular type dep, replace the "compose from 014" assertions with a per-control render-and-press matrix; document the divergence inline in the test header comment with a `// FALLBACK: research §5` marker. MUST FAIL. **Spec ref**: FR-SB-028, R-C.
- [ ] T023 [P] Write `test/unit/modules/standby-lab/components/RenderingModePicker.test.tsx`: (a) renders exactly **3 segments** with labels `Full Color`, `Accented`, `Vibrant` in this order (FR-SB-031); (b) the segment matching the `value` prop is visibly selected (asserts `accessibilityState: { selected: true }` on exactly one segment); (c) tapping a non-selected segment fires `onChange` once with the corresponding `RenderingMode` value (`'fullColor'`, `'accented'`, `'vibrant'`); (d) tapping the already-selected segment does NOT fire `onChange` (idempotent UI); (e) each segment has an `accessibilityLabel` naming the mode (NFR-SB-007); (f) selected vs. unselected segments use the existing semantic colors (`textPrimary` / `surfaceElevated`) — assert via style snapshot, no new theme tokens introduced. MUST FAIL. **Spec ref**: FR-SB-031, NFR-SB-007.
- [ ] T024 [P] Write `test/unit/modules/standby-lab/components/StandByPreview.test.tsx`: (a) renders a wide, landscape-oriented card showing the current showcase value (large numerals if numeric-looking) + counter + tint accent (FR-SB-040); (b) given `mode='fullColor'` vs. `'accented'` vs. `'vibrant'`, the rendered card differs visually (assert distinct style snapshots for the three modes — e.g. distinct `backgroundColor` / `tintColor` / `opacity`); (c) updating any of the four props (`showcaseValue`, `counter`, `tint`, `mode`) re-renders the card (FR-SB-040); (d) renders BOTH a `.systemMedium` and a `.systemLarge` layout (two stacked previews — assert both are present by testID), each with documented WidgetKit StandBy bounds (snapshot widths/heights — exact numbers per data-model.md if specified, otherwise constants from research §1); (e) preview a11y label names the rendering mode + tint (NFR-SB-007). MUST FAIL. **Spec ref**: FR-SB-040, FR-SB-005, NFR-SB-007.
- [ ] T025 [P] Write `test/unit/modules/standby-lab/components/SetupInstructions.test.tsx`: (a) renders an ordered/numbered list with **≥6 steps** (FR-SB-035); (b) the steps mention `Settings`, `StandBy`, `charge` / charging, `landscape`, `lock`, and the **"spot"** entry (case-insensitive — search step text for `/spot/i` AND `/standby/i` AND `/landscape/i`); (c) the card has a heading like "Set up StandBy"; (d) accepts an optional `style` prop and applies it to the outer container. MUST FAIL. **Spec ref**: FR-SB-035, FR-SB-036.
- [ ] T026 [P] Write `test/unit/modules/standby-lab/components/ReloadEventLog.test.tsx`: (a) renders an empty-state line ("No pushes yet" or equivalent) when given `entries: []`; (b) when given `entries: [...]` renders one row per entry with timestamp, kind, and outcome; (c) the component does NOT itself enforce the 10-cap — it renders whatever it receives; supply `entries.length === 10` and assert all 10 render (FR-SB-033); (d) success vs. failure entries are visually distinguished (e.g. different `accessibilityRole` / icon / text); (e) the most recent entry appears **first** (FR-SB-033, ring-buffer prepend semantics); (f) every entry's `kind` field MUST equal `'SpotStandByWidget'` when fed real entries from the screen (assert via fixture). MUST FAIL. **Spec ref**: FR-SB-033, FR-SB-034.
- [ ] T027 [P] Write `test/unit/modules/standby-lab/components/IOSOnlyBanner.test.tsx`: (a) renders the literal user-facing string `'StandBy Mode is iOS 17+ only'` (FR-SB-027 (a)); (b) the component sets `accessibilityRole: 'alert'` (or equivalent) so screen readers announce it on mount (NFR-SB-007); (c) the component is a pure presentational component (no platform branching inside — visibility is owned by the screen variant); (d) accepts an optional `style` prop. MUST FAIL. **Spec ref**: FR-SB-027, NFR-SB-007.

### Implementation for components (each [P], independent files)

- [ ] T028 [P] Implement `src/modules/standby-lab/components/ExplainerCard.tsx`. Pure presentational; uses `ThemedView` / `ThemedText` and the `Spacing` scale (Constitution II / IV); `StyleSheet.create()` only. Body text mentions StandBy and the three rendering-mode names. Make T021 pass. **Spec ref**: FR-SB-039.
- [ ] T029 [P] Implement `src/modules/standby-lab/components/StandByConfigPanel.tsx`. **Default path (research §5)**: imports the three 014 data-control inner widgets from `@/modules/widgets-lab/components/` and composes them with the local `RenderingModePicker` (T030) and a `Pressable` "Push to StandBy widget" button. **Fallback (R-C)**: if `pnpm typecheck` or `pnpm lint` surfaces a circular type dep between `widget-config.ts` (014) / `lock-config.ts` (027) / `standby-config.ts` (028), replace the imports with a verbatim local copy of the 014 inner widgets whose imports are rewired to `standby-config.ts`'s types; add `// FALLBACK: research §5` as the first line; update T022's test to its fallback variant. Document the chosen path in the commit message. Make T022 pass. **Spec ref**: FR-SB-028, R-C.
- [ ] T030 [P] Implement `src/modules/standby-lab/components/RenderingModePicker.tsx`. Three-segment picker with `value: RenderingMode` and `onChange: (m: RenderingMode) => void` props. Uses `Pressable` for each segment; selected state expressed via `accessibilityState.selected` and a contrasting `surfaceElevated` background; tap on already-selected segment is a no-op. `StyleSheet.create()` only. Make T023 pass. **Spec ref**: FR-SB-031, NFR-SB-007.
- [ ] T031 [P] Implement `src/modules/standby-lab/components/StandByPreview.tsx`. Wide, landscape card; large numeric-style typography for the showcase value; renders both a `.systemMedium`-sized stub and a `.systemLarge`-sized stub stacked vertically. Per-mode visual treatment branches on the `mode` prop: `fullColor` = full color over surface; `accented` = monochrome with `tint` as accent; `vibrant` = high-contrast monochrome with translucent surface. Tint applied as accent only (never background). `StyleSheet.create()` only. Make T024 pass. **Spec ref**: FR-SB-040, FR-SB-005.
- [ ] T032 [P] Implement `src/modules/standby-lab/components/SetupInstructions.tsx`. Numbered list with ≥6 steps copied/paraphrased from `quickstart.md` Path B (Settings → enable StandBy → put device on charger → rotate landscape → lock → swipe horizontally to widgets pane → pick "spot"). Mentions "spot" (case-insensitive). Accepts an optional `style` prop. Make T025 pass. **Spec ref**: FR-SB-035, FR-SB-036.
- [ ] T033 [P] Implement `src/modules/standby-lab/components/ReloadEventLog.tsx`. Pure presentational — accepts `entries: ReloadEvent[]`, renders empty state when length is zero, prepends most-recent first, distinguishes success vs. failure visually. Does NOT manage state itself; the screen owns the ring buffer. Make T026 pass. **Spec ref**: FR-SB-033, FR-SB-034.
- [ ] T034 [P] Implement `src/modules/standby-lab/components/IOSOnlyBanner.tsx`. Pure presentational; renders the exact string `'StandBy Mode is iOS 17+ only'`; sets `accessibilityRole: 'alert'`. Accepts `style` prop. Make T027 pass. **Spec ref**: FR-SB-027, NFR-SB-007.
- [ ] T035 **Checkpoint commit**: `feat(028): standby-lab components (ExplainerCard, StandByConfigPanel, RenderingModePicker, StandByPreview, SetupInstructions, ReloadEventLog, IOSOnlyBanner)`.

---

## Phase 6: Screens (Plan §"Phased file inventory" — FR-SB-025 / FR-SB-026 / FR-SB-027 / FR-SB-030 / FR-SB-033 / FR-SB-034 / FR-SB-041 / FR-SB-046)

**Purpose**: Three platform-suffixed screen variants. iOS 17+ wires the full flow; Android / Web are fallback-only. iOS < 17 falls back to the same layout as Android / Web. Each variant has a paired test file.

### Tests for screens (write FIRST, ensure they FAIL — all [P], independent files)

- [ ] T036 [P] Write `test/unit/modules/standby-lab/screen.test.tsx` (iOS 17+ variant): (a) layout order matches FR-SB-026 exactly: explainer card → configuration panel (with rendering-mode picker + Push button) → live preview → setup instructions → reload event log; (b) tapping Push calls `bridge.setStandByConfig(currentDraft)` THEN `bridge.reloadTimelinesByKind('SpotStandByWidget')` (write before reload — assert ordering via mock call order); (c) on success, an entry with `kind: 'SpotStandByWidget'` and `outcome: 'success'` is **prepended** to the reload event log (FR-SB-033); (d) on `WidgetCenterBridgeError`, a failure entry is prepended; (e) the log caps at 10 entries (FR-SB-033) — push 11 times and assert the oldest is dropped; (f) the screen calls `validate(draft)` before `setStandByConfig` (defensive); (g) the screen unsubscribes on unmount and the log resets to `[]` on next mount (FR-SB-034); (h) when the screen is mounted on a device reporting iOS < 17 (mock `Platform.Version === '16.4'`), the iOS-17 chrome (setup card, reload event log) is hidden, the banner is shown, and the Push button is disabled (FR-SB-027 / FR-SB-046); (i) **isolation from 014/027 push paths**: tapping Push does NOT call `bridge.setConfig`, `bridge.setLockConfig`, `bridge.reloadAllTimelines`, or `bridge.reloadTimelinesByKind` with any kind other than `'SpotStandByWidget'` (assert mock call list). Mock the bridge per T009. MUST FAIL. **Spec ref**: FR-SB-024, FR-SB-026, FR-SB-030, FR-SB-033, FR-SB-034, FR-SB-046.
- [ ] T037 [P] Write `test/unit/modules/standby-lab/screen.android.test.tsx`: (a) banner is visible at the top stating `'StandBy Mode is iOS 17+ only'` (FR-SB-027 (a)); (b) the explainer card renders below the banner (FR-SB-027 (b)); (c) the configuration panel is interactive (showcase / counter / tint / rendering-mode editable); (d) the live preview reflects every edit including the rendering-mode segment (FR-SB-027 (d)); (e) the Push button is **disabled** (FR-SB-027 (c)) AND an inline explanation is rendered next to it; (f) the setup instructions card is hidden (FR-SB-041); (g) the reload event log is hidden (FR-SB-027); (h) edits round-trip to the AsyncStorage shadow store (`saveShadowStandByConfig` is called) — verifies cross-platform draft persistence (NFR-SB-005). MUST FAIL. **Spec ref**: FR-SB-027, FR-SB-040, FR-SB-041, NFR-SB-005.
- [ ] T038 [P] Write `test/unit/modules/standby-lab/screen.web.test.tsx`: identical assertion set to T037, with `Platform.OS === 'web'` mocked. MUST FAIL. **Spec ref**: FR-SB-027, FR-SB-040, FR-SB-041, NFR-SB-005.

### Implementation for screens

- [ ] T039 Implement `src/modules/standby-lab/screen.tsx` (iOS 17+ variant). Owns: draft `StandByConfig` state initialised from `getStandByConfig()` (or `loadShadowStandByConfig()` if iOS < 17), reload-event ring buffer (cap 10, prepend semantics, reset on unmount), Push handler calling `validate → setStandByConfig → reloadTimelinesByKind('SpotStandByWidget')` and prepending log entries on success/failure. Layout order per FR-SB-026. iOS-version branch: if `Platform.Version < 17`, render the fallback layout (banner + explainer + config + preview + disabled push) — same fallback as android/web variants (FR-SB-046). Uses `ThemedView` / `ThemedText` / `Spacing` (Constitution II / IV); `StyleSheet.create()` only. Make T036 pass. **Spec ref**: FR-SB-024, FR-SB-026, FR-SB-030, FR-SB-033, FR-SB-034, FR-SB-046.
- [ ] T040 [P] Implement `src/modules/standby-lab/screen.android.tsx`. Renders: banner (FR-SB-027 (a)) → explainer (b) → config panel with rendering-mode picker (interactive, persists to shadow store) (c) → live preview (d) → no setup card, no log. Push button is rendered but `disabled` with inline explanation (FR-SB-027 (c)). Make T037 pass. **Spec ref**: FR-SB-027, FR-SB-040, FR-SB-041, NFR-SB-005.
- [ ] T041 [P] Implement `src/modules/standby-lab/screen.web.tsx`. Identical to `screen.android.tsx`. Make T038 pass. **Spec ref**: FR-SB-027, FR-SB-040, FR-SB-041, NFR-SB-005.
- [ ] T042 **Checkpoint commit**: `feat(028): standby-lab screen.{tsx,android.tsx,web.tsx} (US1+US2+US3+US4 flow)`.

**Checkpoint**: All JS user-facing surfaces are green. Plugin (Phase 7) and Swift sources (Phase 8) are unblocked.

---

## Phase 7: Config Plugin — `with-standby-widget` (Plan §"Phased file inventory" — FR-SB-043 / FR-SB-044, AC-SB-008 / AC-SB-009 / AC-SB-010, R-A)

**Purpose**: New idempotent Expo config plugin that (a) appends the four StandBy Swift sources to 014's existing `LiveActivityDemoWidget` extension target — coexisting with 027's four lock-screen sources; (b) inserts `StandByWidget()` (guarded by `if #available(iOS 17, *)`) between 014's bundle markers, **after** the `LockScreenAccessoryWidget()` entry 027 inserted; (c) is fully idempotent and commutative with **both** 014's and 027's plugins (R-A — region-replacement of the bounded body, not append; the algorithm is order-independent). **No new App Group, no new entitlement, no new extension target** (FR-SB-019 / FR-SB-020).

### Tests for the plugin (write FIRST, ensure they FAIL)

- [ ] T043 [P] Write `test/unit/plugins/with-standby-widget/insert-bundle-entry.test.ts` covering the bundle-insertion contract (research §3 / R-A):
  1. **Happy path (028 alone)**: given a synthetic `SpotWidgetBundle.swift` source containing both markers and an empty body between them, the function returns a string containing `StandByWidget()` between them, wrapped in `if #available(iOS 17, *) { … }`.
  2. **Coexistence with 027**: given a bundle whose marker region already contains 027's `if #available(iOS 16.0, *) { LockScreenAccessoryWidget() }` block, after running 028's `insertBundleEntry`, the result MUST contain BOTH 027's and 028's blocks between the markers (assert both `LockScreenAccessoryWidget()` and `StandByWidget()` substrings are present, in source order); 027's block MUST appear before 028's (deterministic ordering — research §3 union-of-owned-entries algorithm).
  3. **Idempotency on 028 alone** (FR-SB-044 / AC-SB-008): running 028's function twice on its own output returns byte-identical output (region replacement, not append). Assert `f(f(src)) === f(src)`.
  4. **Idempotency in the presence of 027**: running 028's function twice on a source where 027's block is already present produces byte-identical output across both runs AND preserves 027's block exactly.
  5. **Commutativity with 027** (R-A / AC-SB-009): for a baseline source containing both markers and an empty body, `apply027 ∘ apply028(baseline)` deep-equals `apply028 ∘ apply027(baseline)` (string equality of the marker region after sorting blocks by widget kind name); both orderings yield BOTH blocks present.
  6. **Commutativity with 014**: 014 owns the markers themselves (not a body entry); applying 028 to a source that has the markers but no 014 body entry leaves 014's surrounding `ShowcaseWidget()` line intact (string substring assertion both before and after the marker region).
  7. **Missing-start-marker fail-loud** (FR-SB-044): if `// MARK: spot-widgets:bundle:additional-widgets:start` is absent, the function throws an `Error` whose message contains `with-standby-widget`, the missing-marker string, and a pointer to `specs/028-standby-mode/research.md §3`.
  8. **Missing-end-marker fail-loud**: same as case 7 but with the `:end` marker absent.
  9. **Both markers absent**: throws (any of the above messages is acceptable; assert the throw).
  10. **Markers reversed** (`:end` before `:start`): throws with a message containing "marker order" or the function still detects the absence of a valid region.
  11. **Bundle text outside the marker region is preserved byte-identically**: given source containing `LiveActivityDemoWidget()` and `ShowcaseWidget()` plus the markers, after running 028's function those lines remain at their original positions (deep substring assertion).
  12. **Inserted Swift compiles syntactically as a `var body: some Widget`**: assert the inserted block contains `if #available(iOS 17, *)`, opens a `{`, contains `StandByWidget()`, and closes `}`.

  Each assertion MUST FAIL because `plugins/with-standby-widget/insert-bundle-entry.ts` does not exist. **Acceptance**: ≥12 `it()` blocks; all fail. **Spec ref**: FR-SB-044, AC-SB-008, AC-SB-009, R-A.
- [ ] T044 [P] Write `test/unit/plugins/with-standby-widget/add-swift-sources.test.ts` covering the source-append contract (mirroring 014's and 027's `add-swift-sources.test.ts`):
  1. **Adds 4 Swift files** to the `LiveActivityDemoWidget` target's `pbxSourcesBuildPhaseObj.files`: `StandByWidget.swift`, `StandByProvider.swift`, `StandByEntry.swift`, `StandByViews.swift` (assert by basename presence).
  2. **Idempotency**: running twice does not produce duplicate file refs (assert basename count is exactly 1 each).
  3. **Target name** is `LiveActivityDemoWidget` (the existing 014 target — FR-SB-006 / FR-SB-020); the function MUST throw if no such target exists (defensive — covers a misconfigured project).
  4. **Files originate from `native/ios/widgets/standby/`** — assert the source path components include `widgets/standby/`.
  5. **No new extension target is created**: the count of `PBXNativeTarget`s with productType `com.apple.product-type.app-extension` is unchanged before vs. after.
  6. **014's existing Swift sources** (`ShowcaseWidget.swift`, `WidgetEntry.swift`, etc.) are still present in the same target after the function runs (014 non-regression).
  7. **027's existing Swift sources** (`LockScreenAccessoryWidget.swift`, `LockScreenAccessoryProvider.swift`, etc.) are still present in the same target after the function runs (027 non-regression / AC-SB-010).
  8. **No duplication of 014/027 sources**: running 028's function on a project that already has all 014 + 027 sources adds exactly the 4 028 basenames and does NOT duplicate any 014/027 ref.

  Use a synthetic in-memory `XcodeProject` mock (mirror 014's and 027's `add-swift-sources.test.ts` patterns). MUST FAIL. **Acceptance**: ≥8 `it()` blocks; all fail. **Spec ref**: FR-SB-006, FR-SB-020, FR-SB-042, AC-SB-010.
- [ ] T045 [P] Write `test/unit/plugins/with-standby-widget/index.test.ts` covering the full plugin pipeline (FR-SB-043, AC-SB-008 / AC-SB-009 / AC-SB-010):
  1. **Pipeline composition**: the default export `withStandByWidget` is a `ConfigPlugin<void>` that chains the two sub-plugins (`add-swift-sources`, `insert-bundle-entry`) without touching entitlements, App Groups, or Info.plist (FR-SB-019 / FR-SB-020).
  2. **Idempotency** (FR-SB-043 / AC-SB-008): folding the plugin twice over a baseline `ExpoConfig` produces a deep-equal config the second time.
  3. **Commutativity with 014** (R-A / AC-SB-009): folding `withHomeWidgets → withStandByWidget` over a baseline produces structurally equal output to folding `withStandByWidget → withHomeWidgets` (asserts both Swift file lists match by basename set, both bundles contain the same widget kinds in any deterministic order, and 014's App Group entitlements are present in both runs).
  4. **Commutativity with 027** (R-A / AC-SB-009): folding `withLockWidgets → withStandByWidget` over a baseline produces structurally equal output to folding `withStandByWidget → withLockWidgets`.
  5. **Three-way commutativity** (014 + 027 + 028 — R-A): for any of the 6 permutations of `[withHomeWidgets, withLockWidgets, withStandByWidget]`, folding all three produces the same final Swift file basename set and the same set of widget kinds inside the bundle marker region (assert by sorted basenames + sorted set of `\w+Widget\(\)` matches in the marker region).
  6. **014 + 027 non-regression** (AC-SB-010): after folding all three plugins, 014's `ShowcaseWidget` AND 027's `LockScreenAccessoryWidget` are still present in the bundle and 014's App Group is still on both targets.
  7. **Fail-loud propagation**: if `insert-bundle-entry` throws (markers missing), `withStandByWidget` propagates the throw with the original message (FR-SB-044).
  8. **No console warnings** on a baseline config (spy on `console.warn`; assert call count is 0).
  9. **Zero new dependencies** declared by the plugin's `package.json` (NFR-SB-003): assert `Object.keys(require('plugins/with-standby-widget/package.json').dependencies ?? {}).length === 0`.

  MUST FAIL. **Acceptance**: ≥9 `it()` blocks; all fail. **Spec ref**: FR-SB-043, FR-SB-044, NFR-SB-003, AC-SB-008, AC-SB-009, AC-SB-010, R-A.

### Implementation for the plugin

- [ ] T046 Implement `plugins/with-standby-widget/insert-bundle-entry.ts` per research §3 / R-A. Region-replacement between `// MARK: spot-widgets:bundle:additional-widgets:start` and `:end` (NOT append). The replacement region is computed deterministically from the union of "entries this plugin owns" + "entries other plugins own that are detected in the input region" (027's `LockScreenAccessoryWidget()` block detected by substring + structural parse). The owned 028 entry is exactly:
  ```swift
          if #available(iOS 17, *) {
              StandByWidget()
          }
  ```
  Output ordering: 027's block first, 028's block second, separated by a single blank line. Fail-loud `Error` with descriptive message + `research §3` pointer when either marker is absent (FR-SB-044). Pure string in / string out — no Xcode project access — testable from T043. Make T043 pass. **Spec ref**: FR-SB-044, R-A.
- [ ] T047 [P] Implement `plugins/with-standby-widget/add-swift-sources.ts`. Uses `withXcodeProject` to add the 4 source-file refs to `LiveActivityDemoWidget`'s `pbxSourcesBuildPhaseObj`. Idempotency check by basename (`pbxSourcesBuildPhaseObj.files.some(f => f.basename === '<name>.swift')`). Throws if the target is missing. Mirror 014's and 027's `add-swift-sources.ts` structurally. Make T044 pass. **Spec ref**: FR-SB-006, FR-SB-020, FR-SB-042.
- [ ] T048 Implement `plugins/with-standby-widget/index.ts`: default export `withStandByWidget: ConfigPlugin = (config) => { config = withAddSwiftSources(config); config = withInsertBundleEntry(config); return config; }` (or equivalent compose using `@expo/config-plugins`). Make T045 pass. **Spec ref**: FR-SB-043.
- [ ] T049 Append `'./plugins/with-standby-widget'` to the `plugins` array in `app.json` (AC-SB-002). Insertion position: immediately after `'./plugins/with-lock-widgets'` (the last 027-added plugin). Diff MUST be exactly +1 array entry. No other plugin entry may be modified or reordered. **Acceptance**: T045 case 9 verifies; manual `app.json` diff shows +1 line. **Spec ref**: AC-SB-002.
- [ ] T050 Run `npx expo prebuild --clean` once locally as a smoke check (mirroring 027's T050). Confirm the plugin chain (014 + 027 + 028) resolves without throwing on the real Expo config. Do NOT commit prebuild artifacts. Note the result in the implementation PR description. **Acceptance**: prebuild exits 0; bundle file contains BOTH `LockScreenAccessoryWidget()` AND `StandByWidget()` between the markers (in that order); widget extension target's source list contains all 12 Swift files (4 from 014 + 4 from 027 + 4 from 028). **Spec ref**: AC-SB-008, AC-SB-009, AC-SB-010.
- [ ] T051 **Checkpoint commit**: `feat(028): with-standby-widget plugin (idempotent, commutative with 014 + 027, fail-loud) + app.json plugins +1 entry`.

**Checkpoint**: Plugin chain is green and verified against a real prebuild.

---

## Phase 8: Swift Sources (Plan §"Phased file inventory" — FR-SB-005 / FR-SB-006 / FR-SB-007 / FR-SB-008 / FR-SB-009 / FR-SB-010 / FR-SB-011 / FR-SB-012 / FR-SB-013 / FR-SB-016 / FR-SB-017 / FR-SB-018 / FR-SB-042 / FR-SB-045)

**Purpose**: The four Swift sources that implement the actual WidgetKit StandBy widget on iOS 17+. **No JS tests** (Constitution V exemption — same as 007 / 014 / 027); on-device verification per `quickstart.md`.

- [ ] T052 [P] Create `native/ios/widgets/standby/StandByEntry.swift` defining a `TimelineEntry` struct `StandByEntry` with stored properties `date: Date`, `showcaseValue: String`, `counter: Int`, `tint: String` (the tint as the persisted-string slug from the App Group), and `mode: RenderingMode` where `RenderingMode` is a Swift enum `case fullColor, accented, vibrant` defined inline at file top. **Spec ref**: FR-SB-013, FR-SB-021.
- [ ] T053 [P] Create `native/ios/widgets/standby/StandByProvider.swift` defining `StandByProvider: TimelineProvider` with: `placeholder(in:)` returning a hard-coded entry (FR-SB-009, no I/O); `getSnapshot(in:completion:)` reading the App Group `UserDefaults(suiteName:)` keys under `spot.widget.standbyConfig.*` (`showcaseValue`, `counter`, `tint`, `mode`), falling back to defaults if any key is missing or malformed (FR-SB-010); `getTimeline(in:completion:)` returning a single-entry timeline with `.policy = .never` (FR-SB-011 — refresh is push-driven via `reloadTimelines(ofKind:)`). **Spec ref**: FR-SB-009, FR-SB-010, FR-SB-011, FR-SB-018.
- [ ] T054 [P] Create `native/ios/widgets/standby/StandByViews.swift` with one parent SwiftUI view struct branching on `@Environment(\.widgetFamily)` (`.systemMedium` vs. `.systemLarge`) and on `@Environment(\.widgetRenderingMode)` (`.fullColor` / `.accented` / `.vibrant`) per FR-SB-008 / FR-SB-031. Apply `.containerBackground(.fill.tertiary, for: .widget)` unconditionally (minIOS 17.0; FR-SB-016 — no iOS 16 fallback, no `.contentMarginsDisabled()`). Apply `.widgetURL(URL(string: "spot://modules/standby-lab")!)` to the view root (FR-SB-017 / R-D). Tint expressed as accent for `accented` mode and as monochrome with translucent surface for `vibrant` mode (FR-SB-008). No I/O in any view body (FR-SB-012). **Spec ref**: FR-SB-008, FR-SB-012, FR-SB-016, FR-SB-017, R-D.
- [ ] T055 Create `native/ios/widgets/standby/StandByWidget.swift` defining `struct StandByWidget: Widget` with `kind = "SpotStandByWidget"` (FR-SB-005), `StaticConfiguration(provider: StandByProvider()) { entry in StandByRootView(entry: entry) }`, `.supportedFamilies([.systemMedium, .systemLarge])` (FR-SB-005), `.configurationDisplayName("Spot StandBy")`, `.description("Showcase value, counter, tint, and rendering mode in StandBy.")`, AND chains `.widgetAccentedRenderingMode(.accented)` on the configuration (FR-SB-007). The widget kind string MUST exactly match the JS-side `'SpotStandByWidget'` literal used in T036 / T039 / T046. **Spec ref**: FR-SB-005, FR-SB-007, FR-SB-013.
- [ ] T056 **Checkpoint commit**: `feat(028): standby WidgetKit Swift sources (Widget/Provider/Entry/Views, iOS 17+, accented + widgetURL)`.

**Checkpoint**: Swift sources land. The plugin (Phase 7) will pick them up on the next prebuild. On-device verification (Phase 11) follows.

---

## Phase 9: Final Integration Sanity Sweep

**Purpose**: Cross-cut audits that none of the per-phase tests cover individually.

- [ ] T057 [P] Verify **NFR-SB-003** (zero new runtime dependencies): `git diff main -- package.json pnpm-lock.yaml | Select-String '^\+\s*"'` produces NO new `dependencies` / `devDependencies` lines beyond what was already added by 014 / 026 / 027. The plugin's `package.json` (T002) declares zero deps. **Acceptance**: diff shows zero new package entries.
- [ ] T058 [P] Verify no `eslint-disable` directives introduced: `git diff main -- 'src/modules/standby-lab/**' 'src/native/widget-center*.ts' 'plugins/with-standby-widget/**' | Select-String 'eslint-disable'` returns zero matches. **Acceptance**: zero `eslint-disable` directives in 028-touched files.
- [ ] T059 [P] Verify **AC-SB-011** (no new extension target): `Select-String -Pattern 'productType.*app-extension' ios/*.xcodeproj/project.pbxproj` after a prebuild matches the pre-028 count (1, 014's `LiveActivityDemoWidget`). **Acceptance**: extension-target count unchanged.
- [ ] T060 [P] Verify **FR-SB-024** (no parallel reload symbol): `Select-String -Path src/native/widget-center*.ts -Pattern 'reloadStandByTimelines'` returns zero matches across all four bridge files. Verify Swift symbol non-leakage: `Select-String -Path src/,test/unit/modules,test/unit/native -Pattern 'StandBy(Widget|Provider|Entry|Views)' -Recurse | Where-Object { $_.Line -notmatch 'standby-mode:' }` returns zero matches in JS / TS sources outside `'SpotStandByWidget'` kind constants and test fixtures. **Acceptance**: zero leaks; zero parallel reload symbol.
- [ ] T061 **Checkpoint commit (optional)**: only if any of T057–T060 surfaced a fix.

---

## Phase 10: Final Gate — `pnpm typecheck` + `pnpm lint` + `pnpm test` + `pnpm format`

**Purpose**: The four explicit CI gates required by the user. Each MUST be green individually before the final commit. Report delta from baseline.

- [ ] T062 Run `pnpm typecheck` from the repo root. MUST exit 0 with zero new `tsc --noEmit` errors. **Acceptance**: clean.
- [ ] T063 Run `pnpm lint` from the repo root. MUST exit 0 with zero new warnings; zero `eslint-disable` directives in 028-touched files (cross-checked against T058). **Acceptance**: clean.
- [ ] T064 Run `pnpm test` from the repo root. The full Jest suite MUST be green. Report:
  - **Suite count delta**: exactly **+16 new suites** vs. 027's closing total: `standby-config.test.ts`, `manifest.test.ts`, `screen.test.tsx`, `screen.android.test.tsx`, `screen.web.test.tsx`, `ExplainerCard.test.tsx`, `StandByConfigPanel.test.tsx`, `RenderingModePicker.test.tsx`, `StandByPreview.test.tsx`, `SetupInstructions.test.tsx`, `ReloadEventLog.test.tsx`, `IOSOnlyBanner.test.tsx`, `widget-center-standby.test.ts`, `with-standby-widget/index.test.ts`, `with-standby-widget/insert-bundle-entry.test.ts`, `with-standby-widget/add-swift-sources.test.ts` (16 files; matches plan §"Test baseline tracking" expected delta of ≥+14 with margin).
  - **Test count delta**: ≥ +16 new tests (by construction, ≥ ~120: T006 ≥16, T009 ≥15, T016 = 8, T021–T027 ≥4×7 = 28, T036 ≥9, T037 ≥8, T038 ≥8, T043 ≥12, T044 ≥8, T045 ≥9).
  - **Lint**: zero new warnings (cross-checked against T063).
  - **Typecheck**: clean (cross-checked against T062).

  Record actual final numbers in the implementation PR description (FR-SB-059 final delta). **Acceptance**: `pnpm test` exits 0 and reports the +16-suite target above.
- [ ] T065 Run `pnpm format` from the repo root. MUST produce only whitespace-only diffs (or no diff). If diffs are present, stage them for the final commit at T066. **Acceptance**: `git status` shows only formatting-class diffs.
- [ ] T066 **Final commit** (single squashed conventional commit covering all of Phases 1–10 — match 027's per-checkpoint cadence by squashing during the implementation PR's merge): `feat(028): standby-lab module + with-standby-widget plugin (StandBy WidgetKit on iOS 17+, +16 test suites)`. **NOTE**: this final commit is produced by the implementation phase, NOT by `/speckit.tasks`.

---

## Phase 11: On-Device Verification (Plan §"Phased file inventory" / `quickstart.md` Path B — Constitution V exemption)

**Purpose**: The Swift surface is not unit-testable on Windows (Constitution V exemption mirroring 007 / 014 / 027). On-device steps are recorded here for traceability; not blocking on the JS test gate but required for the merge PR.

- [ ] T067 Execute the on-device checklist in `specs/028-standby-mode/quickstart.md` Path B on an iOS 17+ device (TestFlight build): (1) install on iOS 17.x device — verify "Spot StandBy" appears in the StandBy widget gallery with both `.systemMedium` and `.systemLarge` size options (FR-SB-005 / FR-SB-008); (2) install `.systemMedium` family — verify renders with default `"StandBy"` / `0` / default tint / `.fullColor` mode; (3) edit fields + select each rendering mode in the app, tap Push, verify on-device redraw within ~1 s under each mode (NFR-SB-002, FR-SB-024, FR-SB-031); (4) repeat for `.systemLarge`; (5) verify `.widgetURL("spot://modules/standby-lab")` taps deep-link back into the standby-lab screen (FR-SB-017 / R-D); (6) verify `.widgetAccentedRenderingMode(.accented)` is honoured when the system is in accented mode (FR-SB-007); (7) verify 014's home `ShowcaseWidget` AND 027's lock-screen widget still refresh correctly after all three plugins ran (AC-SB-010); (8) verify `containerBackground` is honoured (FR-SB-016). Document the result inline in the merge PR. **Acceptance**: All 8 steps pass; PR description references this task and includes a screenshot of each rendering mode × each family.

---

## Dependencies & Parallel Execution Map

### Phase ordering (sequential)

```
Phase 1 (T001–T005) ─► Phase 2 (T006–T008) ─► Phase 3 (T009–T015) ─► Phase 4 (T016–T020) ─►
Phase 5 (T021–T035) ─► Phase 6 (T036–T042) ─► Phase 7 (T043–T051) ─►
Phase 8 (T052–T056) ─► Phase 9 (T057–T061) ─► Phase 10 (T062–T066) ─► Phase 11 (T067)
```

- **Phase 2 (standby-config)** blocks Phases 3, 5, 6 (every component / screen / bridge type imports `StandByConfig` / `RenderingMode`).
- **Phase 3 (bridge)** blocks Phases 5 (StandByConfigPanel — defensive only) and 6 (screen Push handler reads via bridge symbols).
- **Phase 4 (manifest)** can begin in parallel with Phase 3 once Phase 2 is green (manifest only depends on `screen.tsx` existing as a forward import — `render` is the function that fails until T039 lands; the manifest test runs in isolation against the manifest module without rendering the screen).
- **Phase 5 components** can run mostly in parallel (different files); `StandByConfigPanel.tsx` (T029) depends on T030 (`RenderingModePicker.tsx`) being importable, so order T030 before T029 inside the parallel batch — or stub `RenderingModePicker` with a placeholder.
- **Phase 6 screens** depend on **all** of Phase 5 (components) + Phase 3 (bridge) + Phase 2 (standby-config) being green.
- **Phase 7 plugin** depends on **Phase 8 directory existing** (T003); does NOT depend on the Swift content because tests use synthetic project mocks. T050 (real prebuild) does need T052–T055 to be present for the source paths to resolve.
- **Phase 8 Swift** is independent of all JS phases except for matching the kind string `'SpotStandByWidget'` referenced by T036 / T039 / T046 / T055.

### Parallel batches within a phase

- **Phase 1**: T001 ‖ T002 ‖ T003 ‖ T004 (four scaffolding tasks, four different paths).
- **Phase 3**: T011 ‖ T012 ‖ T013 (three platform-variant impls — different files; all depend on T010).
- **Phase 5 tests**: T021 ‖ T022 ‖ T023 ‖ T024 ‖ T025 ‖ T026 ‖ T027 (seven test files — different paths).
- **Phase 5 impls**: T028 ‖ T030 ‖ T031 ‖ T032 ‖ T033 ‖ T034, then T029 (T029 depends on T030 if `RenderingModePicker` is referenced statically).
- **Phase 6 tests**: T036 ‖ T037 ‖ T038 (three test files — different paths).
- **Phase 6 impls**: T040 ‖ T041 (android & web — different files; T039 must land first because it owns the iOS-17+ flow that the platform-fallback variants partially share via re-exported helpers).
- **Phase 7 tests**: T043 ‖ T044 ‖ T045 (three test files — different paths).
- **Phase 7 impls**: T046 (insert-bundle-entry — single file) → T047 ‖ T048 (T047 add-swift-sources is independent of T046; T048 index composes both, depends on T046 + T047).
- **Phase 8**: T052 ‖ T053 ‖ T054 (entry + provider + views — different files); T055 (widget) depends on all three.
- **Phase 9**: T057 ‖ T058 ‖ T059 ‖ T060 (four read-only audits).

### Critical path

```
T001..T004 → T005
   → T006 → T007 → T008
   → T009 → T010 → (T011 ‖ T012 ‖ T013) → T014 → T015
   → (T016 → T017 → T018 → T019 → T020)               ┐
   → (T021..T027) → T030 → (T028 ‖ T029 ‖ T031..T034)  │ Phase 4 can also run after T007
   → T035 → (T036..T038) → T039 → (T040 ‖ T041) → T042 │ in parallel with Phase 3
   → (T043..T045) → T046 → (T047 ‖ T048) → T049 → T050 → T051
   → (T052 ‖ T053 ‖ T054) → T055 → T056
   → (T057..T060) → T061
   → T062 → T063 → T064 → T065 → T066
   → T067
```

---

## Spec Coverage Matrix (FR/AC ↔ Task)

| Spec ID | Task(s) |
|---------|---------|
| FR-SB-001 | T016, T017 |
| FR-SB-002 | T016, T017, T018, T049 |
| FR-SB-003 | T017 |
| FR-SB-004 | T016, T017 |
| FR-SB-005 | T024, T031, T053, T055 |
| FR-SB-006 | T044, T047 |
| FR-SB-007 | T055 |
| FR-SB-008 | T024, T031, T054 |
| FR-SB-009 | T053 |
| FR-SB-010 | T053 |
| FR-SB-011 | T053 |
| FR-SB-012 | T054 |
| FR-SB-013 | T006, T007, T052, T054 |
| FR-SB-016 | T054, T067 |
| FR-SB-017 | T054, T067 |
| FR-SB-018 | T053 |
| FR-SB-019 | T044, T045, T047 |
| FR-SB-020 | T044, T045, T047, T059 |
| FR-SB-021 | T006, T007, T052, T053 |
| FR-SB-022 | T009, T010, T011, T012, T013 |
| FR-SB-023 | T009, T011, T012, T013 |
| FR-SB-024 | T009, T010, T036, T039, T060 |
| FR-SB-025 | T037, T038 |
| FR-SB-026 | T036, T039 |
| FR-SB-027 | T027, T034, T037, T038, T040, T041 |
| FR-SB-028 | T022, T029 |
| FR-SB-029 | T006, T007 |
| FR-SB-030 | T036, T039 |
| FR-SB-031 | T006, T007, T023, T030, T031, T054 |
| FR-SB-033 | T026, T036, T039 |
| FR-SB-034 | T026, T036, T039 |
| FR-SB-035 | T025, T032 |
| FR-SB-036 | T025, T032, T037, T038, T040, T041 |
| FR-SB-039 | T021, T028 |
| FR-SB-040 | T024, T031, T037, T038, T040, T041 |
| FR-SB-041 | T036, T037, T038, T039, T040, T041 |
| FR-SB-042 | T044, T047, T052, T053, T054, T055 |
| FR-SB-043 | T045, T046, T047, T048 |
| FR-SB-044 | T043, T045, T046 |
| FR-SB-045 | T046, T055 |
| FR-SB-046 | T036, T039 |
| FR-SB-048 | T006, T007 |
| FR-SB-057 | All test tasks (T006, T009, T016, T021–T027, T036–T038, T043–T045) |
| FR-SB-059 | T064 |
| NFR-SB-002 | T067 |
| NFR-SB-003 | T002, T045, T057 |
| NFR-SB-005 | T037, T038, T040, T041 |
| NFR-SB-007 | T023, T024, T027, T030, T034 |
| NFR-SB-009 | T062, T063, T064, T065 |
| AC-SB-001 | T018, T019 |
| AC-SB-002 | T049 |
| AC-SB-008 | T043, T045, T050 |
| AC-SB-009 | T043, T045, T050 |
| AC-SB-010 | T044, T045, T050, T067 |
| AC-SB-011 | T044, T059 |
| R-A | T043, T045, T046 |
| R-B | T009, T010, T011, T014 |
| R-C | T022, T029 |
| R-D | T054, T067 |

---

## Test Baseline Tracking

- **Branch start**: 027's closing totals (carried forward per FR-SB-059; reported in retrospective).
- **028 delta** (planned, finalised at T064):
  - **+16 new suites** (one per file enumerated in T064).
  - ≥+16 new tests (by construction, ≥ ~120 individual `it()` blocks).
- **Target at completion**: 027's closing suite count + 16; 027's closing test count + ≥120.
- **Final delta** is reported in `specs/028-standby-mode/retrospective.md` per FR-SB-059.
