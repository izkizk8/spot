# Implementation Plan: NSUserActivity / Handoff / Continuity Module

**Branch**: `040-handoff-continuity` | **Date**: 2026-04-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/040-handoff-continuity/spec.md`

## Summary

Add an iOS 8+ educational module to the 006 Showcase registry under `id: 'handoff-lab'` that demonstrates **`NSUserActivity`** — the unifying primitive behind Handoff, state restoration, Spotlight indexing reuse (already covered by feature 031), and prediction. The lab screen renders six vertical sections in order: **ExplainerCard**, **ActivityComposer** (form + "Become current"), **CurrentActivityCard** (with "Resign"), **IncomingLog** (last 10 continuation events, FIFO), **SetupInstructions** (8 numbered cross-device steps), and a documentary **UniversalLinks** card with a "Deferred to follow-up spec" pill.

A thin Swift bridge `native/ios/handoff/HandoffBridge.swift` exposes `setCurrent` / `resignCurrent` / `getCurrent` to JS; a sibling `HandoffActivityHandler.swift` hooks `application(_:continue:restorationHandler:)` and forwards continuation events through an event channel. JS bridge `src/native/handoff.ts` re-exports `isAvailable` plus the lifecycle methods and a continuation listener; on Android and Web every method throws `HandoffNotSupported` and `isAvailable` is `false`.

The config plugin `plugins/with-handoff/` **union-merges** the activity type `'com.izkizk8.spot.activity.handoff-demo'` into Info.plist `NSUserActivityTypes`, preserving feature 031's prior `'spot.showcase.activity'` entry in either plugin order, idempotent on re-run, defensive against missing/non-array prior values. The change is additive: registry +1 entry, `app.json` `plugins` 30 → 31, plugin-count assertion in `test/unit/plugins/with-mapkit/index.test.ts` bumps 30 → 31.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), React 19.2, React Native 0.81+ (RN 0.83 line in this Expo SDK), Swift 5.9 for native modules.
**Primary Dependencies**: Expo SDK 55, `expo-router` ~55.0.13, `expo-modules-core` (Swift module bridge), `@expo/config-plugins` ~55.0.8, React Compiler enabled, Jest 29.7 + `jest-expo` 55, `@testing-library/react-native`. **No new npm dependencies** — the bridge is hand-written Swift.
**Storage**: None app-side. The Current Activity slice is hook-managed in-memory; the Incoming Log is screen-scoped (resets on unmount); `UIApplication.shared.userActivity` is platform-managed across the `setCurrent` / `resignCurrent` lifecycle.
**Testing**: Jest with `preset: 'jest-expo'`, `setupFilesAfterEnv: ['<rootDir>/test/setup.ts']`. testMatch covers `test/unit/**/*` and `src/**/__tests__/**/*`. The native bridge is mocked at the import boundary (`jest.mock('@/native/handoff', ...)` or `jest.mock('../../../src/native/handoff', ...)`) per test, never via E2E.
**Target Platform**: iOS 8+ (primary; Handoff was the iOS 8 / OS X 10.10 headline). Android and Web register in the showcase but render `IOSOnlyBanner` only — no native calls.
**Project Type**: Mobile (Expo / React Native universal app) — single TS codebase, three platforms, plus Swift native module.
**Performance Goals**: `setCurrent` → CurrentActivityCard render ≤ 1 frame (synchronous mirror in hook state). Continuation event delivery → IncomingLog row append ≤ 1 frame after the bridge fires. No measurable cold-start overhead (the AppDelegate hook is registered once at module load).
**Constraints**:
- **Zero `eslint-disable` directives** anywhere in this feature (constitution v1.1.0, FR-021).
- **Additive-only diff** (FR-023): registry +1, `app.json` plugins +1, plugin-count assertion +1; no other source files modified.
- Plugin must be **idempotent** and **order-independent** with `with-spotlight` (FR-004 / FR-005); both invariants are unit-tested.
- Plugin must be **defensive** against missing or non-array `NSUserActivityTypes` (FR-006 / Edge Cases #3 #4).
- iOS 8 baseline; `isEligibleForPrediction` is forwarded unconditionally (iOS <12 silently ignores it — Edge Case #10).
- No `eslint-disable`, no inline styles outside trivial flex shims, single quotes, `StyleSheet.create()` only (FR-022).

**Scale/Scope**: One new module (≈ 1 manifest + 1 activity-types constant + 3 screen variants + 1 hook with `.web` split + 1 bridge with `.web` split + 8 components), one new config plugin (`index.ts` + co-located test), one new Swift bridge pair. Estimated ~16 source files + ~14 test files.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v1.1.0 — initial check:

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Cross-Platform Parity | ✅ PASS | Module registers for `['ios','android','web']`. Android + Web render `IOSOnlyBanner`; iOS gets the full UI. The card stays visible in the modules grid on every platform — graceful degradation, not exclusion. JS bridge throws `HandoffNotSupported` on non-iOS, never crashes the bundle. |
| II. Token-Based Theming | ✅ PASS | All surfaces use `ThemedText` / `ThemedView` and the `Spacing` scale from `src/constants/theme.ts`. Eligibility-flag toggles, status pills, and the "Deferred" pill use theme colours via `useTheme()`. No hardcoded hex. |
| III. Platform File Splitting | ✅ PASS | Three screen variants — `screen.tsx`, `screen.android.tsx`, `screen.web.tsx`. The `useHandoffActivity` hook and the `src/native/handoff.ts` bridge both have `.web.ts` variants because the bridge is iOS-only. No inline `Platform.select()` for non-trivial logic. |
| IV. StyleSheet Discipline | ✅ PASS | All styles via `StyleSheet.create()`; single quotes; no inline style objects beyond trivial flex shims. Spacing values from `Spacing` only. No CSS-in-JS, no utility-class framework. |
| V. Test-First | ✅ PASS | TDD per the Rollout Plan in spec § Implementation Strategy: tests written before each component / hook / plugin. Plugin coexistence-with-031 test, idempotency test, and defensive-input tests precede the plugin implementation. Bridge contract tests precede `useHandoffActivity`. |
| Validate-Before-Spec (workflow) | ✅ PASS | No new npm dependency to validate — the bridge is hand-written Swift on top of the iOS 8 `NSUserActivity` API surface, which is part of UIKit. The plugin is a pure `withInfoPlist` mod mirroring the proven `with-spotlight` (031) shape. The `application(_:continue:restorationHandler:)` AppDelegate hook is documented Apple API present since iOS 8. No proof-of-concept build is required because every primitive is already exercised by 031 (the same Info.plist key) and by other Swift bridges in this repo. |

**No constitutional violations.** Complexity Tracking is intentionally empty.

**Post-design re-check** (after Phase 1 artifacts authored):

| Principle | Status | Re-check note |
|-----------|--------|----------------|
| I. Cross-Platform Parity | ✅ PASS | `data-model.md` ActivityDefinition is platform-agnostic; `contracts/bridge.md` documents the `HandoffNotSupported` throw on non-iOS platforms. |
| II. Token-Based Theming | ✅ PASS | No design surface introduced by the contracts requires new tokens. |
| III. Platform File Splitting | ✅ PASS | `contracts/bridge.md` enumerates the `.web.ts` stub explicitly. |
| IV. StyleSheet Discipline | ✅ PASS | No styling decisions in Phase 1 artifacts. |
| V. Test-First | ✅ PASS | `quickstart.md` step 2 lists the test commands; `contracts/plugin-merge.md` defines the plugin merge function with a test matrix that drives the union-merge / coexistence / idempotency tests. |
| Validate-Before-Spec | ✅ PASS | No new infra to validate; plugin pattern is already proven by 031. |

## Project Structure

### Documentation (this feature)

```text
specs/040-handoff-continuity/
├── plan.md              # This file
├── research.md          # Phase 0: bridge shape, plugin merge strategy, AppDelegate hook
├── data-model.md        # Phase 1: ActivityDefinition, ContinuationEvent, HookState, ComposerFormState
├── quickstart.md        # Phase 1: install / build / test instructions
├── contracts/           # Phase 1: bridge surface + plugin merge contract
│   ├── bridge.md        # Native (Swift) + JS bridge surfaces
│   ├── plugin-merge.md  # Pure union-merge function signature, idempotency, coexistence with 031
│   └── continuation.md  # AppDelegate continuation-event payload contract → JS
├── spec.md              # Source of truth (already authored)
└── tasks.md             # Phase 2 — created by /speckit.tasks
```

### Source Code (repository root)

```text
src/modules/handoff-lab/
├── index.tsx                       # ModuleManifest export
├── activity-types.ts               # HANDOFF_DEMO_ACTIVITY_TYPE constant + helpers (FR-024)
├── screen.tsx                      # iOS variant (full UI: 6 cards in order)
├── screen.android.tsx              # Android — IOSOnlyBanner + iOS-only placeholder
├── screen.web.tsx                  # Web      — IOSOnlyBanner + iOS-only placeholder
├── hooks/
│   ├── useHandoffActivity.ts       # iOS: subscribe + setCurrent/resign + log truncation
│   └── useHandoffActivity.web.ts   # Web/Android stub: returns { isAvailable: false, … no-ops }
└── components/
    ├── ExplainerCard.tsx
    ├── ActivityComposer.tsx
    ├── KeyValueEditor.tsx
    ├── CurrentActivityCard.tsx
    ├── IncomingLog.tsx
    ├── IncomingLogRow.tsx
    ├── SetupInstructions.tsx
    ├── UniversalLinksCard.tsx
    └── IOSOnlyBanner.tsx           # Co-located (matches 037/038/039 pattern)

src/native/
├── handoff.ts                      # iOS: thin re-export of expo-modules-core requireNativeModule
└── handoff.web.ts                  # Non-iOS: throws HandoffNotSupported, isAvailable=false

native/ios/handoff/
├── HandoffBridge.swift             # Module: setCurrent / resignCurrent / getCurrent
├── HandoffActivityHandler.swift    # AppDelegate hook → forwards continuation events
└── HandoffModule.podspec           # (or autolinked via expo-modules-core; see contracts/bridge.md)

plugins/with-handoff/
├── index.ts                        # ConfigPlugin: withInfoPlist → applyHandoffInfoPlist union-merge
├── index.test.ts                   # Co-located test (parity with with-spotlight pattern)
└── package.json                    # Mirrors plugins/with-spotlight/package.json shape

test/unit/plugins/with-handoff/
└── index.test.ts                   # Jest-runnable: idempotency + 031 coexistence + defensive shape

test/unit/modules/handoff-lab/
├── manifest.test.ts
├── activity-types.test.ts
├── hooks/useHandoffActivity.test.tsx
├── screen.test.tsx
├── screen.android.test.tsx
├── screen.web.test.tsx
└── components/
    ├── ExplainerCard.test.tsx
    ├── ActivityComposer.test.tsx
    ├── KeyValueEditor.test.tsx
    ├── CurrentActivityCard.test.tsx
    ├── IncomingLog.test.tsx
    ├── IncomingLogRow.test.tsx
    ├── SetupInstructions.test.tsx
    ├── UniversalLinksCard.test.tsx
    └── IOSOnlyBanner.test.tsx

test/unit/native/
└── handoff.test.ts                 # JS bridge: throws HandoffNotSupported on non-iOS

# Modified (additive only — 1 line each unless noted)
src/modules/registry.ts              # +1 import, +1 entry { id: 'handoff-lab', platforms: ['ios','android','web'], minIOS: '8.0' }
app.json                             # +1 plugins entry: './plugins/with-handoff' (30 → 31)
test/unit/plugins/with-mapkit/index.test.ts  # plugin-count assertion 30 → 31
```

**Structure Decision**: Module follows the **quick-actions-lab (039)** and **contacts-lab (038)** templates exactly — manifest + 3 screen variants + co-located `components/` and `hooks/`. The plugin follows the `with-spotlight` (031) template precisely (single `withInfoPlist`, exported pure helper `applyHandoffInfoPlist` for byte-identical idempotency tests). Native Swift code lives under `native/ios/handoff/` per repo convention for hand-written bridges. The JS bridge is a `.web.ts`-split module under `src/native/` so platform splitting happens at the import boundary, not inside hooks. Per project convention (see `jest.config.js` testMatch), the **jest-runnable** plugin test lives under `test/unit/plugins/with-handoff/`; the co-located `plugins/with-handoff/index.test.ts` mirrors 031/039 for parity (not picked up by jest, kept consistent for cleanup pass).

## Phase 0: Outline & Research

See [research.md](./research.md). Highlights — **no open questions; the spec is autonomous**:

- **Bridge implementation**: hand-written Swift via `expo-modules-core` `Module` DSL. No new npm package. The module exposes three async functions (`setCurrent`, `resignCurrent`, `getCurrent`) and one event channel (`onContinue`). Rationale: `NSUserActivity` is a UIKit-native primitive with no upstream community wrapper for Expo SDK 55, and a 60-line Swift module is cheaper than a deferred dependency.
- **AppDelegate hook**: `HandoffActivityHandler.swift` registers itself in the AppDelegate `application(_:continue:restorationHandler:)` callback via the same `expo-modules-core` `AppDelegateSubscriber` pattern used elsewhere in the repo. Continuation events are converted into a plain dictionary (`activityType`, `title`, `webpageURL?`, `userInfo`, `requiredUserInfoKeys: [String]`) and emitted on `onContinue`. The handler always returns `true` to claim the activity (the JS side decides what to do).
- **Plugin merge strategy**: Mirrors `applySpotlightInfoPlist` exactly. Pure helper `applyHandoffInfoPlist(modResults)` reads `NSUserActivityTypes`, filters to `string[]`, appends `HANDOFF_DEMO_ACTIVITY_TYPE` only if absent, returns a new object. Defensive: missing → fresh `[HANDOFF_DEMO_ACTIVITY_TYPE]`; non-array → fresh `[HANDOFF_DEMO_ACTIVITY_TYPE]` plus a one-line `console.warn` at plugin run time (Edge Case #4).
- **Coexistence with 031**: Both plugins use `string` filtering + `includes` dedup + `push`-on-absent. Running them in either order produces a `NSUserActivityTypes` array containing both `'spot.showcase.activity'` and `'com.izkizk8.spot.activity.handoff-demo'`, no duplicates. Order is the order plugins ran; the test asserts **set equality**, not array equality, to avoid coupling to plugin order. (FR-005.)
- **No new permissions**: `NSUserActivityTypes` requires no `*UsageDescription`. Handoff itself has no permission prompt. The Setup Instructions card describes the four runtime conditions (iCloud / Bluetooth / Settings toggle / awake) but those are user-side, not entitlement-side.
- **Universal Links deferral**: Phase 0 explicitly chooses NOT to wire Associated Domains, AASA, or `applinks:` entitlement in this feature. The Universal Links card is documentary only. A follow-up spec (041 or later) will add the entitlement and AASA infra.
- **Persistence**: None app-side. The platform manages `UIApplication.shared.userActivity`. The hook's `currentActivity` slice is a synchronous mirror updated after `setCurrent` resolves; `getCurrent` is exposed for debugging only and the UI never polls it (Edge Case #6).
- **iOS 8 baseline**: `isEligibleForSearch` (iOS 9+) and `isEligibleForPrediction` (iOS 12+) are forwarded unconditionally. The runtime silently ignores flags that postdate the OS. Composer copy notes this for prediction (Story 2 AS#2 / Edge Case #10). The bridge does NOT pre-filter by OS version — that would create a fork in the contract for marginal benefit.

## Phase 1: Design & Contracts

See:

- [data-model.md](./data-model.md) — `ActivityDefinition`, `ContinuationEvent`, `HookState`, `ComposerFormState`, plus state-transition rules (`setCurrent` / `resignCurrent` / `onContinue` → `log` prepend with FIFO truncation at 10).
- [contracts/bridge.md](./contracts/bridge.md) — Native (Swift) module shape and JS bridge surface (`isAvailable`, `setCurrent`, `resignCurrent`, `getCurrent`, `addContinuationListener`). Includes the `HandoffNotSupported` error contract for non-iOS platforms.
- [contracts/plugin-merge.md](./contracts/plugin-merge.md) — Exact signature `applyHandoffInfoPlist(input: Record<string, unknown>): Record<string, unknown>`, idempotency invariant (byte-identical past first call), 031-coexistence test matrix, defensive-input table.
- [contracts/continuation.md](./contracts/continuation.md) — AppDelegate continuation event payload shape and the JS-side normalisation rules (Set vs Array required-keys, missing `activityType` discard).
- [quickstart.md](./quickstart.md) — install / prebuild / test walkthrough.

**Agent context update**: After this plan is committed, the `<!-- SPECKIT START --> ... <!-- SPECKIT END -->` block in `.github/copilot-instructions.md` is updated to point at `specs/040-handoff-continuity/plan.md` (currently points at `specs/039-quick-actions/plan.md`).

## Task Generation Approach (pointer for `/speckit.tasks`)

Tasks should be ordered to honour TDD and dependency direction:

1. **Plugin first (pure JS, fastest feedback)**: write `applyHandoffInfoPlist` tests (idempotency, missing input, non-array input, 031 coexistence both orders), then implement the helper, then wire `withInfoPlist`, then bump `app.json` and `with-mapkit` plugin-count assertion.
2. **JS bridge contract**: write `src/native/handoff.web.ts` tests (every method throws `HandoffNotSupported`, `isAvailable === false`), implement the web stub, then write the iOS module re-export (untested directly; mocked at import boundary in consumers).
3. **Hook**: TDD `useHandoffActivity` against a mocked bridge — `setCurrent` mirror, `resignCurrent` clear, `onContinue` prepend with FIFO@10, malformed-event discard, unmount-cleanup.
4. **Components bottom-up**: `IOSOnlyBanner` → `KeyValueEditor` → `IncomingLogRow` → `IncomingLog` → `CurrentActivityCard` → `ActivityComposer` → `ExplainerCard` → `SetupInstructions` → `UniversalLinksCard`. Tests precede each.
5. **Screens**: `screen.android.tsx` and `screen.web.tsx` first (banner-only, simplest), then `screen.tsx` integrating all six sections.
6. **Manifest + registry wiring**: manifest test, registry entry, `activity-types.ts` constant test.
7. **Native Swift**: `HandoffBridge.swift` and `HandoffActivityHandler.swift` last — implementation only, no new tests (mocked at JS import boundary). A prebuild + smoke launch on a physical iPhone validates the bridge end-to-end during /speckit.implement, but is not a unit-test target.

`[P]` markers should be applied to component tests that don't share files (most of `components/` is parallelisable), and to the three screen-variant tests.

## Complexity Tracking

> No constitutional violations. Section intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| _(none)_  | _(none)_   | _(none)_                             |
