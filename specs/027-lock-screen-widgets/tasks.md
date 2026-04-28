---
description: "Dependency-ordered task list for feature 027 — Lock Screen Widgets module"
---

# Tasks: Lock Screen Widgets Module (`lock-widgets-lab`)

**Input**: Design documents from `/specs/027-lock-screen-widgets/`
**Prerequisites**: plan.md (required), spec.md (required), research.md (required), data-model.md, quickstart.md, contracts/{lock-config,widget-center-bridge,manifest}.contract.ts

**Tests**: REQUIRED — every component, screen variant, the manifest, the bridge extension, the lock-config module, and every plugin sub-module has an explicit unit test (FR-LW-052, AC-LW-012, Constitution Principle V). Swift sources are verified on-device per `quickstart.md` (FR-LW-051 exemption, mirroring 014/007).

**Organization**: Tasks are grouped by the plan's Implementation Phases. The plan defines no separate user-story phases — the single screen composes the same module across iOS-16+/Android/Web/iOS-<16 fallbacks (US1, US2, US3, US4 per spec), all delivered together as one shippable module. Task density and conventions mirror `specs/026-rich-notifications/tasks.md` and `specs/014-home-widgets/tasks.md` (T-numbering, [P] markers, exact file paths, RED→GREEN test pairing, dependencies).

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- All file paths are repository-relative under the worktree root `C:\Users\izkizk8\spot-027-lockwidgets`
- Test convention: tests live under `test/unit/modules/lock-widgets-lab/`, `test/unit/native/`, and `test/unit/plugins/with-lock-widgets/` (matches plan §Project Structure and 014's layout — NOT colocated)

---

## Phase 1: 014 Prerequisite Back-Patch (Plan §"Task seeds" T001 — research §3 / R1 / R3)

**Purpose**: Add the `// MARK: spot-widgets:bundle:additional-widgets:start|end` markers to 014's `BUNDLE_SOURCE` literal in `plugins/with-home-widgets/add-widget-bundle.ts` so 027's plugin has a deterministic insertion region. This is the **only permitted touch** of a 014-owned file in 027's implementation (plan §"Project Structure" → MODIFIED-014-owned).

**⚠️ CRITICAL**: 027's plugin (Phase 8) fails loudly per FR-LW-041 if these markers are absent. Phase 8 cannot start until this phase is green.

### Tests for the back-patch (write FIRST, ensure they FAIL)

- [ ] T001 Extend `test/unit/plugins/with-home-widgets/add-widget-bundle.test.ts` (014's existing test file) with **two new assertions** in a `describe('bundle markers (027 prerequisite)', ...)` block: (a) the emitted `SpotWidgetBundle.swift` source contains the literal substring `// MARK: spot-widgets:bundle:additional-widgets:start`; (b) the emitted source contains the literal substring `// MARK: spot-widgets:bundle:additional-widgets:end`; (c) the `start` marker appears at a lower index than the `end` marker (correct ordering); (d) both markers appear AFTER the `ShowcaseWidget()` call site so the region sits inside the `var body: some Widget` builder closure. Each assertion MUST FAIL initially because `BUNDLE_SOURCE` does not yet emit the markers. **Acceptance**: 4 new failing assertions. **Spec ref**: research §3 / FR-LW-041 / R3.

### Implementation for the back-patch

- [ ] T002 Modify the `BUNDLE_SOURCE` template literal in `plugins/with-home-widgets/add-widget-bundle.ts` to emit, immediately after the `if #available(iOS 14.0, *) { ShowcaseWidget() }` block and before the closing `}` of `var body: some Widget`, the exact two-line pair (research §3, exact diff):
  ```swift
          // MARK: spot-widgets:bundle:additional-widgets:start
          // MARK: spot-widgets:bundle:additional-widgets:end
  ```
  Indentation MUST match the surrounding 8-space (two-tab) indentation already used by `ShowcaseWidget()`. Do NOT change any other line in `BUNDLE_SOURCE`. Do NOT modify `add-app-group.ts`, `add-swift-sources.ts`, `index.ts`, or `package.json` under `plugins/with-home-widgets/`. **Acceptance**: T001's 4 assertions pass.
- [ ] T003 Re-run **014's full plugin test suite** locally: `pnpm test plugins/with-home-widgets`. Every existing 014 test MUST remain green (R1 mitigation). Confirm zero diff in 014's `widget-bundle-rewrite` / `app-group` / `swift-sources` test outputs apart from the +4 marker assertions added by T001. **Acceptance**: 014's plugin suite green; no regressions reported.
- [ ] T004 **Checkpoint commit**: `feat(027): back-patch with-home-widgets BUNDLE_SOURCE with bundle-additional-widgets markers (014 prerequisite)`.

**Checkpoint**: 014's bundle markers are emitted. 027's plugin (Phase 8) is now unblocked.

---

## Phase 2: Setup (Module + Plugin + Native Scaffolding)

**Purpose**: Create the empty directory tree and the plugin package shell so subsequent file-creation tasks can run in parallel. No business logic.

- [ ] T005 [P] Create the module directory tree: `src/modules/lock-widgets-lab/` and `src/modules/lock-widgets-lab/components/`. Add `.gitkeep` if a directory ends up empty. **Acceptance**: Both directories exist and are tracked.
- [ ] T006 [P] Create the plugin directory `plugins/with-lock-widgets/` with `package.json` containing `{ "name": "with-lock-widgets", "version": "0.0.0", "main": "index.ts", "types": "index.ts" }` (mirror `plugins/with-home-widgets/package.json`). Plugin source files (`index.ts`, `add-swift-sources.ts`, `insert-bundle-entry.ts`) are created in Phase 8. **Acceptance**: File parses as valid JSON; `main` points to `index.ts`.
- [ ] T007 [P] Create the Swift source directory `native/ios/widgets/lock-screen/` with a `.gitkeep`. Swift source files are created in Phase 9. **Acceptance**: Directory exists and is tracked.
- [ ] T008 [P] Create the test directory tree: `test/unit/modules/lock-widgets-lab/`, `test/unit/modules/lock-widgets-lab/components/`, `test/unit/plugins/with-lock-widgets/`. Add `.gitkeep` if empty after this phase. **Acceptance**: All three directories exist and are tracked.
- [ ] T009 **Checkpoint commit**: `chore(027): scaffold lock-widgets-lab module/plugin/test/native dirs`.

---

## Phase 3: Foundational — `lock-config.ts` (Plan Phase 2 — FR-LW-019 / FR-LW-027 / FR-LW-044)

**Purpose**: Define `LockConfig`, `DEFAULT_LOCK_CONFIG`, `validate()`, and the AsyncStorage shadow store. Every component, screen, and the bridge depend on these symbols.

**⚠️ CRITICAL**: Nothing in Phase 4+ may begin until this phase completes.

### Tests for lock-config (write FIRST, ensure they FAIL)

- [ ] T010 Write `test/unit/modules/lock-widgets-lab/lock-config.test.ts` covering every obligation in `contracts/lock-config.contract.ts`:
  1. `DEFAULT_LOCK_CONFIG` deep-equals `{ showcaseValue: 'Hello, Lock!', counter: 0, tint: <014-default-tint> }` (FR-LW-027). Reference 014's `DEFAULT_CONFIG.tint` to compute the expected default tint value (single source of truth; FR-LW-012).
  2. `SHADOW_STORE_KEY === 'spot.widget.lockConfig'` (literal string assertion; FR-LW-044) AND is disjoint from `'widgets-lab:config'` (014's key).
  3. `validate(undefined)`, `validate(null)`, `validate({})`, `validate('not an object')` all return `DEFAULT_LOCK_CONFIG` (no throw).
  4. `validate({ showcaseValue: 42 })` returns config with `showcaseValue === DEFAULT_LOCK_CONFIG.showcaseValue` (non-string falls back).
  5. `validate({ counter: 'abc' })` returns config with `counter === DEFAULT_LOCK_CONFIG.counter` (non-number falls back).
  6. `validate({ tint: 'magenta' })` returns config with `tint === DEFAULT_LOCK_CONFIG.tint` (unknown tint falls back).
  7. `validate({ showcaseValue: 'Hi', counter: 7, tint: <valid-014-tint> })` returns the input verbatim (happy path).
  8. `validate(JSON.parse('"raw string"'))` returns `DEFAULT_LOCK_CONFIG` (defensive).
  9. AsyncStorage round-trip: `saveShadowLockConfig(c)` then `loadShadowLockConfig()` resolves to `c` (use the existing `@react-native-async-storage/async-storage` jest-mock provider; mirror 014's `widget-config.test.ts` pattern).
  10. `loadShadowLockConfig()` resolves to `DEFAULT_LOCK_CONFIG` when the key is missing.
  11. `loadShadowLockConfig()` resolves to `DEFAULT_LOCK_CONFIG` when the stored value is malformed JSON (mock `getItem` to return `'not-json{'`); MUST NOT throw.
  12. `saveShadowLockConfig()` swallows AsyncStorage errors silently (mock `setItem` to reject; assert the promise resolves, not rejects).
  13. `loadShadowLockConfig()` swallows AsyncStorage errors silently (mock `getItem` to reject; assert resolves to `DEFAULT_LOCK_CONFIG`).
  
  Each assertion MUST FAIL initially because `lock-config.ts` does not yet exist. **Acceptance**: 13 distinct `it()` blocks; all fail with module-not-found / undefined-export errors. **Spec ref**: FR-LW-019, FR-LW-027, FR-LW-044, contract `lock-config.contract.ts`.

### Implementation for lock-config

- [ ] T011 Implement `src/modules/lock-widgets-lab/lock-config.ts` per `contracts/lock-config.contract.ts`: export `LockConfig` interface, `DEFAULT_LOCK_CONFIG` const, `SHADOW_STORE_KEY` const literal `'spot.widget.lockConfig'`, `validate(input: unknown): LockConfig` pure function, `loadShadowLockConfig(): Promise<LockConfig>`, `saveShadowLockConfig(c: LockConfig): Promise<void>`. Re-import `Tint` from `@/modules/widgets-lab/widget-config` (NOT redefine — FR-LW-012 / data-model.md §Tint). AsyncStorage I/O wrapped in `try/catch` returning `DEFAULT_LOCK_CONFIG` / `void` on error. Make T010 pass. **Acceptance**: T010 green; `tsc --noEmit` clean; no ESLint errors. **Spec ref**: FR-LW-019, FR-LW-027, FR-LW-044.
- [ ] T012 **Checkpoint commit**: `feat(027): lock-config module (LockConfig, defaults, validate, AsyncStorage shadow)`.

**Checkpoint**: Lock-config module is green. Bridge (Phase 4), components (Phase 6), and screens (Phase 7) may now begin.

---

## Phase 4: Bridge Extension — `reloadTimelinesByKind`, `setLockConfig`, `getLockConfig` (Plan Phase 2 — FR-LW-020 / FR-LW-021 / FR-LW-022 / FR-LW-028, research §6 / R-B / R8)

**Purpose**: Additively extend `WidgetCenterBridge` with the three new methods on every platform variant. iOS 16+ implementation calls through to the native module; Android / Web / iOS < 16 reject with `WidgetCenterNotSupportedError`. No new error classes (R-B; reuse 014's).

### Tests for the bridge (write FIRST, ensure they FAIL)

- [ ] T013 Write `test/unit/native/widget-center-by-kind.test.ts` covering every obligation in `contracts/widget-center-bridge.contract.ts` §"Required test cases":
  1. **Web platform** (`jest.doMock('react-native', () => ({ Platform: { OS: 'web', Version: 0 } }))`): (a) `reloadTimelinesByKind('SpotLockScreenWidget')` rejects with `WidgetCenterNotSupportedError`; (b) `getLockConfig()` rejects with `WidgetCenterNotSupportedError`; (c) `setLockConfig(LOCK_CONFIG)` rejects with `WidgetCenterNotSupportedError`; (d) `isAvailable()` returns `false` and does not throw.
  2. **Android platform** (`Platform.OS === 'android'`): same 4 assertions as web.
  3. **iOS 16+ with native module mocked**: (a) `reloadTimelinesByKind('SpotLockScreenWidget')` calls the mock's underlying method with the exact kind string and resolves; (b) `getLockConfig()` resolves with the mocked module's response (assert deep-equal against a fixture `LOCK_CONFIG`); (c) `setLockConfig(c)` calls through with the same payload; (d) native rejection with code `NOT_SUPPORTED` surfaces as `WidgetCenterNotSupportedError`; (e) native rejection with any other code surfaces as `WidgetCenterBridgeError(message)`.
  4. **iOS < 16 (mock `Platform.Version` to `15.0`)**: (a) `reloadTimelinesByKind` rejects with `WidgetCenterNotSupportedError`; (b) `getLockConfig` rejects with `WidgetCenterNotSupportedError`; (c) `setLockConfig` rejects with `WidgetCenterNotSupportedError`; (d) `isAvailable()` returns `false`.
  5. **014 regression**: existing `getCurrentConfig`, `setConfig`, `reloadAllTimelines`, `isAvailable` symbols still resolve correctly under the new mock setup (smoke check — invoke each once and assert no method is undefined).
  
  Use `jest.mock('expo-modules-core')` to drive `requireOptionalNativeModule` and `jest.doMock('react-native', …)` to swap `Platform.OS` / `Platform.Version` (mirror 014's `widget-center.test.ts` pattern). Each assertion MUST FAIL initially because the three new methods do not yet exist on any platform variant. **Acceptance**: ≥18 distinct `it()` blocks; all fail with `TypeError: bridge.reloadTimelinesByKind is not a function` etc. **Spec ref**: FR-LW-020, FR-LW-021, FR-LW-022, FR-LW-028, contract `widget-center-bridge.contract.ts`, R-B, R8.

### Implementation for the bridge

- [ ] T014 Extend `src/native/widget-center.types.ts` `WidgetCenterBridge` interface with three new method signatures: `reloadTimelinesByKind(kind: string): Promise<void>`, `getLockConfig(): Promise<LockConfig>`, `setLockConfig(config: LockConfig): Promise<void>`. Re-import `LockConfig` from `@/modules/lock-widgets-lab/lock-config` (forward type-only import; depends on T011). Do NOT add any new error classes — `WidgetCenterNotSupportedError` and `WidgetCenterBridgeError` from 014 are reused (R-B). **Acceptance**: `tsc --noEmit` clean; no new exports beyond the three signatures. **Spec ref**: FR-LW-020, FR-LW-022.
- [ ] T015 [P] Extend `src/native/widget-center.ts` (iOS impl) with the three new methods. `reloadTimelinesByKind(kind)` calls the underlying native module's `reloadTimelinesByKind` (or equivalent symbol), gates on `Platform.OS === 'ios'` + iOS-version ≥ **16** + module-non-null (note: 014's existing methods gate at iOS ≥ 14; the new methods gate at iOS ≥ 16 per FR-LW-021), and maps native errors per the contract table (`NOT_SUPPORTED` → `WidgetCenterNotSupportedError`, anything else → `WidgetCenterBridgeError`). `getLockConfig()` and `setLockConfig(c)` follow the same gating + error-mapping. `isAvailable()` is unchanged (014 governs it). **Acceptance**: T013 iOS-16+ cases (3a–3e) pass. **Spec ref**: FR-LW-020, FR-LW-021, FR-LW-022.
- [ ] T016 [P] Extend `src/native/widget-center.android.ts` with stubs for the three new methods, each rejecting with `WidgetCenterNotSupportedError` (mirror 014's existing stub style for `setConfig` etc). `isAvailable()` is unchanged. **Acceptance**: T013 android cases (2a–2d) pass. **Spec ref**: FR-LW-021.
- [ ] T017 [P] Extend `src/native/widget-center.web.ts` with the same three stubs as android. **Acceptance**: T013 web cases (1a–1d) pass. **Spec ref**: FR-LW-021.
- [ ] T018 Re-run 014's bridge test (`test/unit/native/widget-center.test.ts`) and 014's tests that mock `WidgetCenterBridge` (search the repo for `WidgetCenterBridge` mocks — at least 014's screen tests). If any test fails because its mock factory did not supply the three new methods, update the mock factory to provide stub implementations that throw `WidgetCenterNotSupportedError` if invoked from a 014-only test path. Document the touched files in the commit message. **Acceptance**: 014's full bridge + screen suites green (R8 mitigation).
- [ ] T019 **Checkpoint commit**: `feat(027): widget-center bridge +reloadTimelinesByKind/setLockConfig/getLockConfig (iOS 16+ impl + RN/Web/Android rejects)`.

**Checkpoint**: Bridge surface is green on all 3 platforms. Phase 5+ may now use the bridge symbols.

---

## Phase 5: Manifest + Registry Hook-Up (Plan Phase 2 — FR-LW-001 / FR-LW-002 / FR-LW-003 / FR-LW-004, AC-LW-001)

**Purpose**: Register the module so the Modules grid renders a "Lock Screen Widgets" tile.

### Tests for the manifest (write FIRST, ensure they FAIL)

- [ ] T020 Write `test/unit/modules/lock-widgets-lab/manifest.test.ts` covering every obligation in `contracts/manifest.contract.ts`:
  1. `manifest.id === 'lock-widgets-lab'`.
  2. `manifest.title === 'Lock Screen Widgets'`.
  3. `manifest.platforms` deep-equals `['ios', 'android', 'web']`.
  4. `manifest.minIOS === '16.0'` (FR-LW-001 / FR-LW-004).
  5. `typeof manifest.render === 'function'`.
  6. `manifest.icon.ios` is a non-empty string (SF Symbol name).
  7. `manifest.icon.fallback` is a non-empty single-character emoji.
  8. `manifest.description` is a non-empty string and matches `/lock|iOS\s*16/i` (mentions "lock" or "iOS 16"; FR-LW-002).
  
  Each assertion MUST FAIL because `src/modules/lock-widgets-lab/index.tsx` does not yet exist. **Acceptance**: 8 `it()` blocks; all fail. **Spec ref**: FR-LW-001, FR-LW-002, FR-LW-004, contract `manifest.contract.ts`.

### Implementation for the manifest

- [ ] T021 Implement `src/modules/lock-widgets-lab/index.tsx` exporting a default `ModuleManifest` with `id: 'lock-widgets-lab'`, `title: 'Lock Screen Widgets'`, `platforms: ['ios', 'android', 'web']`, `minIOS: '16.0'`, `description` (one-sentence summary mentioning Lock Screen + iOS 16), `icon: { ios: <SF Symbol>, fallback: <emoji> }`, and `render: () => <Screen />` where `<Screen />` is imported from `./screen` (the platform-suffix resolver picks up `.tsx` / `.android.tsx` / `.web.tsx` automatically per RN/Metro defaults; FR-LW-045). Make T020 pass. **Acceptance**: T020 green. **Spec ref**: FR-LW-001, FR-LW-002, FR-LW-003, FR-LW-045.
- [ ] T022 Append the manifest to `src/modules/registry.ts`: add ONE import line `import lockWidgetsLab from './lock-widgets-lab';` after the `notificationsLab` import (line 23) AND ONE entry `lockWidgetsLab` to the `MODULES` array immediately after `notificationsLab` (line 64). Diff MUST be exactly +2 lines. No other entry may be modified or reordered. **Acceptance**: `MODULES.find(m => m.id === 'lock-widgets-lab')` is defined; `MODULES.length` is the prior length + 1. **Spec ref**: FR-LW-002, AC-LW-001.
- [ ] T023 If `test/unit/modules/registry.test.ts` asserts a fixed `MODULES.length`, update the constant to the new length. Otherwise (it asserts `> 0` / uniqueness only) leave it unchanged. Re-run the registry test suite; assert duplicate-id check passes (no other manifest has `id === 'lock-widgets-lab'`). **Acceptance**: registry test green. **Spec ref**: AC-LW-001.
- [ ] T024 **Checkpoint commit**: `feat(027): lock-widgets-lab manifest + registry +1`.

---

## Phase 6: Components (Plan Phase 2 — FR-LW-031 / FR-LW-026 / FR-LW-029 / FR-LW-035 / FR-LW-037 / R-C / R5)

**Purpose**: Build the five reusable components. ConfigPanel default path is a re-export of 014's; fallback (R-C) is a verbatim local copy if a circular type dep emerges. Each component has a paired test file. Tests are written first.

### Tests for components (write FIRST, ensure they FAIL — all [P], independent files)

- [ ] T025 [P] Write `test/unit/modules/lock-widgets-lab/components/StatusPanel.test.tsx`: (a) renders the showcase value, counter, tint label, and (on iOS 16+) a "Next refresh" line (FR-LW-037 / FR-LW-038); (b) on Android/Web the "Next refresh" line is **absent** (FR-LW-025); (c) on iOS 16+ when `bridge.getLockConfig()` rejects with `WidgetCenterBridgeError`, the panel renders an error state and the showcase value falls back to `DEFAULT_LOCK_CONFIG.showcaseValue` (defensive); (d) the panel re-fetches when its `version` / `lastPushedAt` prop changes (FR-LW-038); (e) the tint is communicated as a swatch with an a11y label naming the tint (FR-LW-050). Mock the bridge via the platform-aware factory used in T013. MUST FAIL. **Spec ref**: FR-LW-037, FR-LW-038, FR-LW-050, FR-LW-025.
- [ ] T026 [P] Write `test/unit/modules/lock-widgets-lab/components/ConfigPanel.test.tsx` — re-export integration test: (a) the default export is identical (`Object.is`) to the default export of `@/modules/widgets-lab/components/ConfigPanel` (default re-export path per research §5); (b) named exports of 027's `ConfigPanel` module are a superset (or equal) to 014's named exports; (c) when supplied a `LockConfig` and `onPush` callback, the panel renders three controls (showcase / counter / tint) and `onPush` is called with the validated config on tap; (d) trims `showcaseValue` and disables the Push button when empty (mirrors 014's edge case). **R-C fallback note**: if T028 (impl) takes the local-copy path due to a circular type dep, this test reverts to a per-control render-and-press matrix copied from 014's `ConfigPanel.test.tsx`; document the divergence inline in the test header comment with a `// FALLBACK: research §5` marker (R-C, R5). MUST FAIL. **Spec ref**: FR-LW-026, FR-LW-031, R-C.
- [ ] T027 [P] Write `test/unit/modules/lock-widgets-lab/components/AccessoryPreview.test.tsx`: (a) renders three cards in this order — Rectangular, Circular, Inline (FR-LW-031); (b) each card shows the showcase value, counter, and tint per the family's documented bounds (Rectangular = full text + counter, Circular = counter only or a glyph, Inline = single line `<showcaseValue> · <counter>`); (c) tint is honoured as **accent** (border / icon tint), not as background, per R4 / FR-LW-014; (d) updating any of the three props (`showcaseValue`, `counter`, `tint`) re-renders all three cards (FR-LW-032); (e) each card has an a11y label naming its accessory family ("Rectangular", "Circular", "Inline") and the tint name (FR-LW-050); (f) sizes match documented WidgetKit accessory bounds (snapshot widths/heights — assert exact numbers, mirror 014's `widget-preview.test.tsx` style if present). MUST FAIL. **Spec ref**: FR-LW-014, FR-LW-031, FR-LW-032, FR-LW-033, FR-LW-050, R4.
- [ ] T028 [P] Write `test/unit/modules/lock-widgets-lab/components/SetupInstructions.test.tsx`: (a) renders an ordered/numbered list with **≥5 steps** (FR-LW-035); (b) the steps mention long-press of the Lock Screen, opening the customizer, picking a widget family, and selecting the **"spot"** entry (case-insensitive — search step text for `/spot/i`); (c) the card has a heading like "Set up on your Lock Screen"; (d) the component accepts a `style` prop and applies it to the outer container (consistency with other module cards). MUST FAIL. **Spec ref**: FR-LW-035, FR-LW-036.
- [ ] T029 [P] Write `test/unit/modules/lock-widgets-lab/components/ReloadEventLog.test.tsx`: (a) renders an empty-state line ("No pushes yet" or equivalent) when given `entries: []`; (b) when given `entries: [...]` renders one row per entry with timestamp, kind, and outcome; (c) the component does NOT itself enforce the 10-cap — it renders whatever it receives — but a separate assertion verifies the **caller** (screen) caps; in this test, supply `entries.length === 10` and assert all 10 render (FR-LW-029); (d) success vs. failure entries are visually distinguished (e.g. different `accessibilityRole` / icon / text); (e) the most recent entry appears **first** (FR-LW-029, ring-buffer prepend semantics). MUST FAIL. **Spec ref**: FR-LW-029, FR-LW-030.

### Implementation for components (each [P], independent files)

- [ ] T030 [P] Implement `src/modules/lock-widgets-lab/components/StatusPanel.tsx`. Reads via `bridge.getLockConfig()` on iOS 16+; falls back to `loadShadowLockConfig()` on Android / Web / iOS < 16. Uses `ThemedView` / `ThemedText` and the `Spacing` scale (Constitution II / IV). Re-fetches when the `version` / `lastPushedAt` prop changes. Renders a "Next refresh" line ONLY when `Platform.OS === 'ios'` AND the iOS-version check passes. Make T025 pass. **Spec ref**: FR-LW-025, FR-LW-037, FR-LW-038, FR-LW-050.
- [ ] T031 [P] Implement `src/modules/lock-widgets-lab/components/ConfigPanel.tsx` as a **re-export** of `@/modules/widgets-lab/components/ConfigPanel` (default path per research §5):
  ```ts
  export { default } from '@/modules/widgets-lab/components/ConfigPanel';
  export * from '@/modules/widgets-lab/components/ConfigPanel';
  ```
  **Fallback (R-C)**: if `tsc --noEmit` or `pnpm lint` surfaces a circular type dep between `widget-config.ts` and `lock-config.ts`, replace the file with a verbatim copy of `src/modules/widgets-lab/components/ConfigPanel.tsx` whose imports are rewired to `lock-config.ts`'s types; add `// FALLBACK: research §5` as the first line; update T026's test to its fallback variant. Document the chosen path in the commit message. Make T026 pass. **Spec ref**: FR-LW-026, R-C.
- [ ] T032 [P] Implement `src/modules/lock-widgets-lab/components/AccessoryPreview.tsx`. One component renders all three accessory family cards in a vertical `View`. Sizes match documented WidgetKit accessory bounds (Rectangular ≈ 170×72, Circular ≈ 72×72, Inline ≈ full-width × 24 — exact numbers per data-model.md if specified, otherwise use the constants from research §1). Tint applied as accent (border / icon colour) only — never as background — per R4 + FR-LW-014. `StyleSheet.create()` only (Constitution IV). Make T027 pass. **Spec ref**: FR-LW-014, FR-LW-031, FR-LW-032, FR-LW-033, FR-LW-050, R4.
- [ ] T033 [P] Implement `src/modules/lock-widgets-lab/components/SetupInstructions.tsx`. Numbered list with ≥5 steps, mentioning "spot" (case-insensitive). Steps copied or paraphrased from the Apple Lock Screen widget setup flow (research / quickstart §3). Accepts an optional `style` prop. Make T028 pass. **Spec ref**: FR-LW-035, FR-LW-036.
- [ ] T034 [P] Implement `src/modules/lock-widgets-lab/components/ReloadEventLog.tsx`. Pure presentational — accepts `entries: ReloadEvent[]`, renders empty state when length is zero, prepends most-recent first, distinguishes success vs. failure visually. Does NOT manage state itself; the screen owns the ring buffer. Make T029 pass. **Spec ref**: FR-LW-029, FR-LW-030.
- [ ] T035 **Checkpoint commit**: `feat(027): lock-widgets-lab components (StatusPanel, ConfigPanel re-export, AccessoryPreview, SetupInstructions, ReloadEventLog)`.

---

## Phase 7: Screens (Plan Phase 2 — FR-LW-023 / FR-LW-024 / FR-LW-025 / FR-LW-045 / FR-LW-046 / FR-LW-047 / FR-LW-049)

**Purpose**: Three platform-suffixed screen variants. iOS 16+ wires the full flow; Android / Web are fallback-only. Each variant has a paired test file.

### Tests for screens (write FIRST, ensure they FAIL — all [P], independent files)

- [ ] T036 [P] Write `test/unit/modules/lock-widgets-lab/screen.test.tsx` (iOS 16+ variant): (a) layout order matches FR-LW-024 exactly: status panel → config panel → push button → accessory previews → setup instructions → reload event log; (b) tapping Push calls `bridge.reloadTimelinesByKind('SpotLockScreenWidget')` AND `bridge.setLockConfig(currentDraft)` (order: setLockConfig before reloadTimelinesByKind — write before reload); (c) on success, an entry is **prepended** to the reload event log (FR-LW-029); (d) on `WidgetCenterBridgeError`, a failure entry is prepended; (e) the log caps at 10 entries (FR-LW-029) — push 11 times and assert the oldest is dropped; (f) the screen calls `validate(draft)` before `setLockConfig` (defensive); (g) the screen unsubscribes on unmount and the log resets to `[]` on next mount (FR-LW-030, FR-LW-046); (h) when the screen is mounted on a device reporting iOS < 16 (mock `Platform.Version === '15.0'`), the iOS chrome (next-refresh line, setup card, reload event log) is hidden and a banner is shown (FR-LW-049). Mock the bridge per T013. MUST FAIL. **Spec ref**: FR-LW-023, FR-LW-024, FR-LW-028, FR-LW-029, FR-LW-030, FR-LW-046, FR-LW-049.
- [ ] T037 [P] Write `test/unit/modules/lock-widgets-lab/screen.android.test.tsx`: (a) banner is visible at the top stating "Lock Screen Widgets are iOS 16+ only" (FR-LW-049); (b) the configuration panel is interactive (showcase / counter / tint editable); (c) the three accessory previews render and update on prop change (FR-LW-034); (d) the Push button is **disabled** (FR-LW-025); (e) the setup instructions card is hidden (FR-LW-036); (f) the reload event log is hidden (FR-LW-025 / FR-LW-029); (g) edits round-trip to the AsyncStorage shadow store (`saveShadowLockConfig` is called) — this verifies cross-platform draft persistence. MUST FAIL. **Spec ref**: FR-LW-025, FR-LW-034, FR-LW-036, FR-LW-049.
- [ ] T038 [P] Write `test/unit/modules/lock-widgets-lab/screen.web.test.tsx`: identical assertion set to T037, with `Platform.OS === 'web'` mocked. MUST FAIL. **Spec ref**: FR-LW-025, FR-LW-034, FR-LW-036, FR-LW-049.

### Implementation for screens

- [ ] T039 Implement `src/modules/lock-widgets-lab/screen.tsx` (iOS 16+ variant). Owns: draft `LockConfig` state initialised from `getLockConfig()` (or `loadShadowLockConfig()` if iOS < 16), reload-event ring buffer (cap 10, prepend semantics, reset on unmount), Push handler calling `validate → setLockConfig → reloadTimelinesByKind('SpotLockScreenWidget')` and prepending log entries on success/failure. Layout order per FR-LW-024. iOS-version branch: if `Platform.Version < 16`, render the fallback layout (banner + config + previews + disabled push) — same fallback as android/web variants. Uses `ThemedView` / `ThemedText` / `Spacing` (Constitution II / IV); `StyleSheet.create()` only. Make T036 pass. **Spec ref**: FR-LW-023, FR-LW-024, FR-LW-028, FR-LW-029, FR-LW-030, FR-LW-046, FR-LW-049.
- [ ] T040 [P] Implement `src/modules/lock-widgets-lab/screen.android.tsx`. Renders: banner (FR-LW-049) → config panel (interactive, persists to shadow store) → 3 accessory previews → disabled Push button → no setup card, no log. Make T037 pass. **Spec ref**: FR-LW-025, FR-LW-034, FR-LW-036, FR-LW-049.
- [ ] T041 [P] Implement `src/modules/lock-widgets-lab/screen.web.tsx`. Identical to `screen.android.tsx`. Make T038 pass. **Spec ref**: FR-LW-025, FR-LW-034, FR-LW-036, FR-LW-049.
- [ ] T042 **Checkpoint commit**: `feat(027): lock-widgets-lab screen.{tsx,android.tsx,web.tsx} (US1+US2+US3 flow)`.

**Checkpoint**: All JS user-facing surfaces are green. Plugin (Phase 8) and Swift sources (Phase 9) are unblocked.

---

## Phase 8: Config Plugin — `with-lock-widgets` (Plan Phase 2 — FR-LW-040 / FR-LW-041, AC-LW-008 / AC-LW-009 / AC-LW-010, R1 / R2 / R3)

**Purpose**: New idempotent Expo config plugin that (a) appends the four lock-screen Swift sources to 014's `LiveActivityDemoWidget` extension target; (b) inserts `LockScreenAccessoryWidget()` between 014's bundle markers (added in Phase 1); (c) is fully idempotent and commutative with 014's plugin. **No new App Group, no new entitlement, no new extension target** (FR-LW-018, AC-LW-011).

### Tests for the plugin (write FIRST, ensure they FAIL)

- [ ] T043 [P] Write `test/unit/plugins/with-lock-widgets/insert-bundle-entry.test.ts` covering the bundle-insertion contract (research §3 / §4):
  1. **Happy path**: given a synthetic `SpotWidgetBundle.swift` source containing both markers, the function returns a string containing `LockScreenAccessoryWidget()` between them, wrapped in `if #available(iOS 16.0, *) { … }` (research §3 exact diff).
  2. **Idempotency** (FR-LW-041 / R2 / AC-LW-008): running the function twice on its own output returns byte-identical output (region replacement, not append).
  3. **Missing-start-marker fail-loud** (FR-LW-041 / R3): if `// MARK: spot-widgets:bundle:additional-widgets:start` is absent, the function throws an `Error` whose message contains both `with-lock-widgets`, the missing-marker string, and a pointer to `specs/027-lock-screen-widgets/research.md §3`.
  4. **Missing-end-marker fail-loud**: same as case 3 but with the `:end` marker absent.
  5. **Both markers absent**: throws (any of the above messages is acceptable; assert the throw).
  6. **Markers reversed** (`:end` appears before `:start`): throws with a message containing "marker order" or the function still detects the absence of a valid region (assert throw).
  7. **Bundle text outside the marker region is preserved byte-identically** (R1 / 014 non-regression): given source containing `LiveActivityDemoWidget()` and `ShowcaseWidget()` plus the markers, after running the function, `LiveActivityDemoWidget()` and `ShowcaseWidget()` lines are still present at their original positions (deep substring assertion).
  8. **Inserted Swift compiles syntactically as a `var body: some Widget`** — assert the inserted block contains `if #available(iOS 16.0, *)`, opens a `{`, contains `LockScreenAccessoryWidget()`, and closes `}`.
  
  Each assertion MUST FAIL because `plugins/with-lock-widgets/insert-bundle-entry.ts` does not exist. **Acceptance**: ≥8 `it()` blocks; all fail. **Spec ref**: FR-LW-041, R1, R2, R3, AC-LW-008.
- [ ] T044 [P] Write `test/unit/plugins/with-lock-widgets/add-swift-sources.test.ts` covering the source-append contract (research §3, mirroring 014's `add-swift-sources.test.ts`):
  1. **Adds 4 Swift files** to the `LiveActivityDemoWidget` target's `pbxSourcesBuildPhaseObj.files`: `LockScreenAccessoryWidget.swift`, `LockScreenAccessoryProvider.swift`, `LockScreenAccessoryEntry.swift`, `LockScreenAccessoryViews.swift` (assert by basename presence).
  2. **Idempotency** (R2): running twice does not produce duplicate file refs (assert basename count is exactly 1 each).
  3. **Target name** is `LiveActivityDemoWidget` (the existing 014 target — FR-LW-006 / FR-LW-018); the function MUST throw if no such target exists (defensive — covers a misconfigured project).
  4. **Files originate from `native/ios/widgets/lock-screen/`** — assert the source path components include `widgets/lock-screen/`.
  5. **No new extension target is created** (AC-LW-011): the count of `PBXNativeTarget`s with productType `com.apple.product-type.app-extension` is unchanged before vs. after.
  6. **014's existing Swift sources** (`ShowcaseWidget.swift`, `WidgetEntry.swift`, etc.) are still present in the same target after the function runs (R1 / AC-LW-010).
  
  Use a synthetic in-memory `XcodeProject` mock (mirror 014's `add-swift-sources.test.ts` pattern). MUST FAIL. **Acceptance**: ≥6 `it()` blocks; all fail. **Spec ref**: FR-LW-006, FR-LW-018, FR-LW-039, AC-LW-010, AC-LW-011, R1, R2.
- [ ] T045 [P] Write `test/unit/plugins/with-lock-widgets/index.test.ts` covering the full plugin pipeline (FR-LW-040, AC-LW-008 / AC-LW-009 / AC-LW-010):
  1. **Pipeline composition**: the default export `withLockWidgets` is a `ConfigPlugin<void>` that chains the two sub-plugins (`add-swift-sources`, `insert-bundle-entry`) without touching entitlements, App Groups, or Info.plist (FR-LW-017 / FR-LW-018).
  2. **Idempotency** (FR-LW-040 / AC-LW-008): folding the plugin twice over a baseline `ExpoConfig` produces a deep-equal config the second time.
  3. **Commutativity with 014** (R1 / AC-LW-009 / AC-LW-010): folding `withHomeWidgets → withLockWidgets` over a baseline produces structurally equal output to folding `withLockWidgets → withHomeWidgets` (asserts both Swift file lists match by basename set, both bundles contain the same widget kinds in any order, and 014's App Group entitlements are present in both runs).
  4. **014 non-regression**: after folding both plugins, 014's `ShowcaseWidget` is still present in the bundle and 014's App Group is still on both targets (AC-LW-010).
  5. **Fail-loud propagation**: if `insert-bundle-entry` throws (markers missing), `withLockWidgets` propagates the throw with the original message (R3 / FR-LW-041).
  6. **No console warnings** on a baseline config (spy on `console.warn`; assert call count is 0).
  7. **Zero new dependencies** declared by the plugin's `package.json` (AC-LW-003): assert `Object.keys(require('plugins/with-lock-widgets/package.json').dependencies ?? {}).length === 0`.
  
  MUST FAIL. **Acceptance**: ≥7 `it()` blocks; all fail. **Spec ref**: FR-LW-040, FR-LW-041, AC-LW-003, AC-LW-008, AC-LW-009, AC-LW-010, AC-LW-011.

### Implementation for the plugin

- [ ] T046 Implement `plugins/with-lock-widgets/insert-bundle-entry.ts` per research §3 / §4. Region-replacement between `// MARK: spot-widgets:bundle:additional-widgets:start` and `:end` (NOT append). The replacement region contains exactly:
  ```swift
          if #available(iOS 16.0, *) {
              LockScreenAccessoryWidget()
          }
  ```
  Fail-loud `Error` with descriptive message + `research §3` pointer when either marker is absent (FR-LW-041 exact phrasing per plan). Pure string in / string out — no Xcode project access — testable from T043. Make T043 pass. **Spec ref**: FR-LW-041, research §3 / §4, R2, R3.
- [ ] T047 [P] Implement `plugins/with-lock-widgets/add-swift-sources.ts`. Uses `withXcodeProject` to add the 4 source-file refs to `LiveActivityDemoWidget`'s `pbxSourcesBuildPhaseObj`. Idempotency check by basename (`pbxSourcesBuildPhaseObj.files.some(f => f.basename === '<name>.swift')`). Throws if the target is missing. Mirror 014's `add-swift-sources.ts` structurally. Make T044 pass. **Spec ref**: FR-LW-006, FR-LW-018, FR-LW-039, R2.
- [ ] T048 Implement `plugins/with-lock-widgets/index.ts`: default export `withLockWidgets: ConfigPlugin = (config) => { config = withAddSwiftSources(config); config = withInsertBundleEntry(config); return config; }` (or equivalent compose using `@expo/config-plugins`). Make T045 pass. **Spec ref**: FR-LW-040.
- [ ] T049 Append `'./plugins/with-lock-widgets'` to the `plugins` array in `app.json` (AC-LW-002). Insertion position: immediately after `'./plugins/with-rich-notifications'` (the last 026-added plugin). Diff MUST be exactly +1 array entry. No other plugin entry may be modified. **Acceptance**: T045 case 7 verifies; manual `app.json` diff shows +1 line. **Spec ref**: FR-LW-002, AC-LW-002.
- [ ] T050 Run `npx expo prebuild --clean` once locally as a smoke check (NFR-LW equivalent to 026 NFR-NL-004). Confirm the plugin chain resolves without throwing on the real Expo config. Do NOT commit prebuild artifacts. Note the result in the implementation PR description. **Acceptance**: prebuild exits 0; bundle file contains `LockScreenAccessoryWidget()` between the markers; widget extension target's source list contains the 4 new Swift files. **Spec ref**: AC-LW-008, AC-LW-009, AC-LW-010.
- [ ] T051 **Checkpoint commit**: `feat(027): with-lock-widgets plugin (idempotent, commutative with 014, fail-loud) + app.json plugins +1 entry`.

**Checkpoint**: Plugin chain is green and verified against a real prebuild.

---

## Phase 9: Swift Sources (Plan Phase 2 — FR-LW-005 / FR-LW-007 / FR-LW-009 / FR-LW-010 / FR-LW-011 / FR-LW-012 / FR-LW-013 / FR-LW-014 / FR-LW-015 / FR-LW-016 / FR-LW-039, R6)

**Purpose**: The four Swift sources that implement the actual WidgetKit accessory widget on iOS 16+. **No JS tests** (Constitution V exemption — same as 007 / 014); on-device verification per `quickstart.md`.

- [ ] T052 [P] Create `native/ios/widgets/lock-screen/LockScreenAccessoryEntry.swift` defining a `TimelineEntry` struct `LockScreenAccessoryEntry` with stored properties `date: Date`, `showcaseValue: String`, `counter: Int`, `tint: String` (the tint as the persisted-string slug from the App Group). **Spec ref**: FR-LW-012.
- [ ] T053 [P] Create `native/ios/widgets/lock-screen/LockScreenAccessoryProvider.swift` defining `LockScreenAccessoryProvider: TimelineProvider` with: `placeholder(in:)` returning a hard-coded entry (FR-LW-009, no I/O); `getSnapshot(in:completion:)` reading the App Group `UserDefaults(suiteName:)` keys under `spot.widget.lockConfig.*`, falling back to defaults if any key is missing or malformed (FR-LW-010); `getTimeline(in:completion:)` returning a single-entry timeline with `.policy = .never` (FR-LW-011 — refresh is push-driven via `reloadTimelines(ofKind:)`). **Spec ref**: FR-LW-009, FR-LW-010, FR-LW-011, FR-LW-017.
- [ ] T054 [P] Create `native/ios/widgets/lock-screen/LockScreenAccessoryViews.swift` with three SwiftUI view structs: `AccessoryRectangularView`, `AccessoryCircularView`, `AccessoryInlineView`, each accepting `entry: LockScreenAccessoryEntry`. Each view branches on `@Environment(\.widgetFamily)` only at the parent `LockScreenAccessoryWidget` level. **iOS 17 `containerBackground` gate** (FR-LW-015, R6): wrap `.containerBackground(.fill.tertiary, for: .widget)` in `if #available(iOS 17, *) { … } else { … }`; iOS 16 fallback applies `.contentMarginsDisabled()` only with a transparent background. Tint expressed as **shape contrast / accent** only (FR-LW-014 / FR-LW-050) — never as background — because Lock Screen renders in `vibrantForegroundStyle`. No I/O in any view body (FR-LW-016). **Spec ref**: FR-LW-013, FR-LW-014, FR-LW-015, FR-LW-016, FR-LW-050, R6.
- [ ] T055 Create `native/ios/widgets/lock-screen/LockScreenAccessoryWidget.swift` defining `struct LockScreenAccessoryWidget: Widget` with `kind = "SpotLockScreenWidget"` (FR-LW-005), `StaticConfiguration(provider: LockScreenAccessoryProvider()) { entry in <AccessoryFamilySwitch>(entry: entry) }`, `.supportedFamilies([.accessoryRectangular, .accessoryCircular, .accessoryInline])` (FR-LW-005 / FR-LW-013), `.configurationDisplayName("Spot Lock")`, `.description("Showcase value, counter, and tint on the Lock Screen.")`. The `<AccessoryFamilySwitch>` selects between the three `LockScreenAccessoryViews.swift` views via `@Environment(\.widgetFamily)`. The widget kind string MUST exactly match the JS-side `'SpotLockScreenWidget'` literal used in T036 / T039. **Spec ref**: FR-LW-005, FR-LW-007, FR-LW-008, FR-LW-013.
- [ ] T056 **Checkpoint commit**: `feat(027): lock-screen WidgetKit Swift sources (Widget/Provider/Entry/Views, iOS 16/17 gated)`.

**Checkpoint**: Swift sources land. The plugin (Phase 8) will pick them up on the next prebuild. On-device verification (Phase 11) follows.

---

## Phase 10: Final Integration Sanity Sweep

**Purpose**: Cross-cut audits that none of the per-phase tests cover individually.

- [ ] T057 [P] Verify **AC-LW-003** (zero new runtime dependencies): `git diff main -- package.json pnpm-lock.yaml | grep -E '^\+\s*"'` produces NO new `dependencies` / `devDependencies` lines beyond what was already added by 014 / 026. The plugin's `package.json` (T006) declares zero deps. **Acceptance**: diff shows zero new package entries.
- [ ] T058 [P] Verify **AC-LW-013** (no `eslint-disable` directives introduced): `git diff main -- 'src/modules/lock-widgets-lab/**' 'src/native/widget-center*.ts' 'plugins/with-lock-widgets/**' | grep -E 'eslint-disable'` returns zero matches. **Acceptance**: zero `eslint-disable` directives in 027-touched files.
- [ ] T059 [P] Verify **AC-LW-011** (no new extension target): `grep -c 'productType.*app-extension' ios/*.xcodeproj/project.pbxproj` after a prebuild equals the pre-027 count (1, 014's `LiveActivityDemoWidget`). **Acceptance**: extension-target count unchanged.
- [ ] T060 [P] Verify **FR-LW-042** (no Swift symbol leaks on non-iOS): `grep -rE 'LockScreenAccessory(Widget|Provider|Entry|Views)' src/ test/unit/modules test/unit/native | grep -v 'lock-screen-widgets:'` returns zero matches in JS / TS sources (the strings appear only in test fixtures and the bridge kind constant). **Acceptance**: zero leaks.
- [ ] T061 **Checkpoint commit (optional)**: only if any of T057–T060 surfaced a fix.

---

## Phase 11: Final Gate — `pnpm format` + `pnpm check`

**Purpose**: The single CI gate. Lint + typecheck + tests + format must all be green. Report delta from baseline.

- [ ] T062 Run `pnpm format` from the repo root. Commit any whitespace-only diff under `chore(027): pnpm format`.
- [ ] T063 Run `pnpm check` from the repo root. The full suite (lint + typecheck + Jest) MUST be green (FR-LW-051, AC-LW-004). Report:
  - **Suite count**: ≥ **304** (baseline 290 + 14 new — FR-LW-053). Confirm exactly 14 new suites: `lock-config.test.ts`, `manifest.test.ts`, `screen.test.tsx`, `screen.android.test.tsx`, `screen.web.test.tsx`, `StatusPanel.test.tsx`, `ConfigPanel.test.tsx`, `AccessoryPreview.test.tsx`, `SetupInstructions.test.tsx`, `ReloadEventLog.test.tsx`, `widget-center-by-kind.test.ts`, `with-lock-widgets/index.test.ts`, `with-lock-widgets/insert-bundle-entry.test.ts`, `with-lock-widgets/add-swift-sources.test.ts`.
  - **Test count**: ≥ **1998** (baseline 1984 + ≥14 new). Aggregate `it()` blocks across the 14 new suites — by construction (T010 ≥13, T013 ≥18, T020 = 8, T025–T029 ≥5×5 = 25, T036 ≥8, T037 ≥7, T038 ≥7, T043 ≥8, T044 ≥6, T045 ≥7) the 027 delta is ≥112 tests, comfortably clearing the +14 minimum.
  - **Lint**: zero new warnings; zero `eslint-disable` directives (AC-LW-013).
  - **Typecheck**: clean (no new `tsc --noEmit` errors).
  
  Record actual final numbers in the PR description (FR-LW-053 final delta). **Acceptance**: full `pnpm check` exits 0 and reports the targets above.
- [ ] T064 **Final commit**: `feat(027): lock-widgets-lab module + with-lock-widgets plugin (lock-screen WidgetKit on iOS 16+)`.

---

## Phase 12: On-Device Verification (Plan Phase 2 §T012 — FR-LW-051 exemption / `quickstart.md`)

**Purpose**: The Swift surface is not unit-testable on Windows (Constitution V exemption mirroring 007 / 014). On-device steps are recorded here for traceability; not blocking on the JS test gate but required for the merge PR.

- [ ] T065 Execute the 6-step on-device checklist in `specs/027-lock-screen-widgets/quickstart.md` on an iOS 16+ device (TestFlight build): (1) install on iOS 16.x device — verify lock-screen widget appears in the Lock Screen widget gallery as "Spot Lock" (FR-LW-008, AC-LW-006); (2) install Rectangular family — verify renders with default `"Hello, Lock!"` / `0` / default tint (AC-LW-005); (3) edit fields in the app, tap Push, verify on-device redraw within ~1 s (NFR-LW-002, AC-LW-005); (4) repeat for Circular and Inline families; (5) install on iOS 17.x device — verify `containerBackground` is honoured (R6, FR-LW-015); (6) verify 014's home `ShowcaseWidget` still refreshes correctly after both plugins ran (AC-LW-010, R1). Document the result inline in the merge PR. **Acceptance**: All 6 steps pass; PR description references this task and includes a screenshot of each accessory family.

---

## Dependencies & Parallel Execution Map

### Phase ordering (sequential)

```
Phase 1 (T001–T004) ─► Phase 2 (T005–T009) ─► Phase 3 (T010–T012) ─► Phase 4 (T013–T019) ─►
Phase 5 (T020–T024) ─► Phase 6 (T025–T035) ─► Phase 7 (T036–T042) ─► Phase 8 (T043–T051) ─►
Phase 9 (T052–T056) ─► Phase 10 (T057–T061) ─► Phase 11 (T062–T064) ─► Phase 12 (T065)
```

- **Phase 1** is the only edit to a 014-owned file; must complete and 014's full suite must remain green before Phase 8 can land.
- **Phase 3 (lock-config)** blocks Phases 4, 6, 7 (every component / screen / bridge type imports `LockConfig`).
- **Phase 4 (bridge)** blocks Phases 6 and 7 (StatusPanel + screens read via bridge symbols).
- **Phase 5 (manifest)** can begin in parallel with Phase 4 once Phase 3 is green (manifest only depends on `screen.tsx` existing as a forward import — `render` is the function that fails until T021 lands; the manifest test can run in isolation against the manifest module without rendering the screen).
- **Phase 6 components** can run mostly in parallel (different files); `ConfigPanel.tsx` (T031) is a re-export and only depends on T011 + 014's existing `ConfigPanel.tsx`.
- **Phase 7 screens** depend on **all** of Phase 6 (components) + Phase 4 (bridge) + Phase 3 (lock-config) being green.
- **Phase 8 plugin** depends on **Phase 1** (markers) + **Phase 9 directory existing** (T007); does NOT depend on the Swift content because tests use synthetic project mocks. T050 (real prebuild) does need T052–T055 to be present for the source paths to resolve.
- **Phase 9 Swift** is independent of all JS phases except for matching the kind string `'SpotLockScreenWidget'` referenced by T036 / T039 / T055.

### Parallel batches within a phase

- **Phase 2**: T005 ‖ T006 ‖ T007 ‖ T008 (four scaffolding tasks, four different paths).
- **Phase 4**: T015 ‖ T016 ‖ T017 (three platform-variant impls — different files; all depend on T014).
- **Phase 6 tests**: T025 ‖ T026 ‖ T027 ‖ T028 ‖ T029 (five test files — different paths).
- **Phase 6 impls**: T030 ‖ T031 ‖ T032 ‖ T033 ‖ T034 (five component files — different paths).
- **Phase 7 tests**: T036 ‖ T037 ‖ T038 (three test files — different paths).
- **Phase 7 impls**: T040 ‖ T041 (android & web — different files; T039 must land first because it owns the iOS-16+ flow that the platform-fallback variants partially share via re-exported helpers).
- **Phase 8 tests**: T043 ‖ T044 ‖ T045 (three test files — different paths).
- **Phase 8 impls**: T046 (insert-bundle-entry — single file) → T047 ‖ T048 (T047 add-swift-sources is independent of T046; T048 index composes both, depends on T046 + T047).
- **Phase 9**: T052 ‖ T053 ‖ T054 (entry + provider + views — different files); T055 (widget) depends on all three.
- **Phase 10**: T057 ‖ T058 ‖ T059 ‖ T060 (four read-only audits).

### Critical path

```
T001 → T002 → T003 → T004
   → T005..T008 → T009
   → T010 → T011 → T012
   → T013 → T014 → (T015 ‖ T016 ‖ T017) → T018 → T019
   → (T020 → T021 → T022 → T023 → T024)         ┐
   → (T025..T029) → (T030..T034) → T035          │ Phase 5 can also run after T011
   → (T036..T038) → T039 → (T040 ‖ T041) → T042  │ in parallel with Phase 4
   → (T043..T045) → T046 → (T047 ‖ T048) → T049 → T050 → T051
   → (T052 ‖ T053 ‖ T054) → T055 → T056
   → (T057..T060) → T061
   → T062 → T063 → T064
   → T065
```

---

## Spec Coverage Matrix (FR/AC ↔ Task)

| Spec ID | Task(s) |
|---------|---------|
| FR-LW-001 | T020, T021 |
| FR-LW-002 | T020, T021, T022, T049 |
| FR-LW-003 | T021 |
| FR-LW-004 | T020, T021 |
| FR-LW-005 | T053, T055 |
| FR-LW-006 | T044, T047 |
| FR-LW-007 | T055 |
| FR-LW-008 | T055, T065 |
| FR-LW-009 | T053 |
| FR-LW-010 | T053 |
| FR-LW-011 | T053 |
| FR-LW-012 | T010, T011, T052 |
| FR-LW-013 | T054, T055 |
| FR-LW-014 | T027, T032, T054 |
| FR-LW-015 | T054, T065 |
| FR-LW-016 | T054 |
| FR-LW-017 | T053, T045 |
| FR-LW-018 | T044, T045, T047, T059 |
| FR-LW-019 | T010, T011 |
| FR-LW-020 | T013, T014, T015, T016, T017 |
| FR-LW-021 | T013, T015, T016, T017 |
| FR-LW-022 | T013, T014, T015, T016, T017 |
| FR-LW-023 | T036, T039 |
| FR-LW-024 | T036, T039 |
| FR-LW-025 | T037, T038, T040, T041 |
| FR-LW-026 | T026, T031 |
| FR-LW-027 | T010, T011 |
| FR-LW-028 | T013, T015, T036, T039 |
| FR-LW-029 | T029, T036, T039 |
| FR-LW-030 | T029, T036, T039 |
| FR-LW-031 | T026, T027, T032 |
| FR-LW-032 | T027, T032 |
| FR-LW-033 | T027, T032 |
| FR-LW-034 | T037, T038, T040, T041 |
| FR-LW-035 | T028, T033 |
| FR-LW-036 | T028, T037, T038, T040, T041 |
| FR-LW-037 | T025, T030 |
| FR-LW-038 | T025, T030 |
| FR-LW-039 | T044, T052, T053, T054, T055 |
| FR-LW-040 | T045, T046, T047, T048 |
| FR-LW-041 | T001, T002, T043, T046 |
| FR-LW-042 | T060 |
| FR-LW-043 | T005, T021 |
| FR-LW-044 | T010, T011 |
| FR-LW-045 | T021, T039, T040, T041 |
| FR-LW-046 | T036, T039 |
| FR-LW-047 | T036, T039 |
| FR-LW-048 | T026, T031 |
| FR-LW-049 | T036, T037, T038, T039, T040, T041 |
| FR-LW-050 | T025, T027, T032, T054 |
| FR-LW-051 | T063, T065 |
| FR-LW-052 | All test tasks (T001, T010, T013, T020, T025–T029, T036–T038, T043–T045) |
| FR-LW-053 | T063 |
| AC-LW-001 | T022, T023 |
| AC-LW-002 | T049 |
| AC-LW-003 | T057 |
| AC-LW-004 | T063 |
| AC-LW-005 | T065 |
| AC-LW-006 | T065 |
| AC-LW-007 | T037, T038, T040, T041, T065 |
| AC-LW-008 | T043, T045, T050 |
| AC-LW-009 | T045, T050 |
| AC-LW-010 | T003, T044, T045, T050, T065 |
| AC-LW-011 | T044, T059 |
| AC-LW-012 | All test tasks |
| AC-LW-013 | T058 |

---

## Test Baseline Tracking

- **Branch start**: 290 suites / 1984 tests (carried from feature 026 per FR-LW-053).
- **027 delta** (planned, finalised at T063):
  - +14 new suites (one per file enumerated in T063).
  - ≥+14 new tests (by construction, ≥112).
- **Target at completion**: ≥ 304 suites / ≥ 1998 tests.
- **Final delta** is reported in `specs/027-lock-screen-widgets/retrospective.md` per FR-LW-053.
