# Implementation Plan: Quick Actions Module

**Branch**: `039-quick-actions` | **Date**: 2026-04-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/039-quick-actions/spec.md`

## Summary

Add an iOS Home Screen Quick Actions educational module to the 006 Showcase
registry under `id: 'quick-actions-lab'`. The module ships **4 default static
shortcuts** (injected into Info.plist via a project-owned config plugin
`plugins/with-quick-actions/`) and a Lab screen that explains the 4-item
combined cap, lists the static items, and lets the user add / remove / reorder
**dynamic** shortcuts at runtime via `expo-quick-actions` (community library
by EvanBacon, v6.0.1). A `useQuickActions` hook subscribes to action
invocations on cold and warm launch and dispatches `expo-router` navigation to
each item's `userInfo.route`. Android and Web render an `IOSOnlyBanner` and
make zero native calls. The change is additive: registry +1 entry,
`app.json` `plugins` 29 → 30, plugin-count assertion in
`test/unit/plugins/with-mapkit/index.test.ts` 29 → 30.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), React 19.2, React Native 0.83
**Primary Dependencies**: Expo SDK 55, `expo-router` ~55.0.13,
`@expo/config-plugins` ~55.0.8, `expo-quick-actions` 6.0.1 (new),
`react-native-reanimated`, Jest 29.7 + jest-expo 55, @testing-library/react-native
**Storage**: None app-side. iOS itself persists `UIApplication.shared.shortcutItems`
across launches; the Last-Invoked-Action card is in-memory only and clears on
app close. The `add-mood-happy` cross-module log is an in-memory module-scoped
array (no AsyncStorage).
**Testing**: Jest with `preset: 'jest-expo'`, `setupFilesAfterEnv: ['<rootDir>/test/setup.ts']`.
testMatch covers `test/unit/**/*` and `src/**/__tests__/**/*`. Native
bridges (`expo-quick-actions`, `expo-router`) are mocked at the import boundary
(`jest.mock(...)` at the top of each test or in `test/setup.ts`).
**Target Platform**: iOS 9+ (primary), Android (graceful degradation), Web
(graceful degradation). Quick Actions itself is iPhone Home Screen only;
iPad / watchOS shortcuts are out of scope.
**Project Type**: Mobile (Expo / React Native universal app) — single
codebase, three platforms.
**Performance Goals**: Last Invoked Action card updates within 1s of
foreground/cold-launch (per spec SC-4). No measurable overhead on app start
(`useQuickActions` subscribes once at root and no-ops without an invocation).
**Constraints**: 4-item hard cap on combined static + dynamic shortcuts
(iOS platform invariant). No `eslint-disable` directives anywhere in the
new module or plugin (constitution v1.1.0). Additive-only diff (FR-016).
**Scale/Scope**: One new module (≈ 7 component files + 1 hook + 1 screen ×
3 platform variants + 1 manifest + 1 defaults file), one new config plugin
(`index.ts` + tests). Estimated ~14 source files + ~10 test files.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v1.1.0 — verified:

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Cross-Platform Parity | ✅ PASS | Module registers for `['ios','android','web']`. Android + Web render `IOSOnlyBanner`; iOS gets the full UI. Same card shows in the modules grid on every platform — graceful degradation, not exclusion. |
| II. Token-Based Theming | ✅ PASS | All surfaces use `ThemedText` / `ThemedView` and the `Spacing` scale from `src/constants/theme.ts`. No hardcoded hex. |
| III. Platform File Splitting | ✅ PASS | Three screen variants — `screen.tsx`, `screen.android.tsx`, `screen.web.tsx`. The `useQuickActions` hook itself uses a `.web.ts` / native split because the bridge is native-only. No inline `Platform.select()` for non-trivial logic. |
| IV. StyleSheet Discipline | ✅ PASS | All styles via `StyleSheet.create()`; single quotes; no inline style objects. Spacing values from `Spacing` only. |
| V. Test-First | ✅ PASS | TDD per Rollout Plan: tests written before each component/hook/plugin (see Phase 2 in spec). |
| Validate-Before-Spec (workflow) | ✅ PASS | The library decision (use `expo-quick-actions` 6.0.1) is validated in Phase 0 research below — the package resolves on npm with a stable v6 release line and lists Expo as a peer. No proof-of-concept build required because the integration is a JS-only add (no custom native code). |

**No constitutional violations.** No entries in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/039-quick-actions/
├── plan.md              # This file
├── research.md          # Phase 0: library choice, Info.plist shape, Android fallback
├── data-model.md        # Phase 1: QuickActionDefinition, InvocationEvent, ManagerState
├── quickstart.md        # Phase 1: build/install/test instructions
├── contracts/           # Phase 1: bridge surface + plugin Info.plist contract
│   ├── bridge.md
│   ├── info-plist.md
│   └── routing.md
├── spec.md              # Source of truth (already authored)
└── tasks.md             # Phase 2 — created by /speckit.tasks
```

### Source Code (repository root)

```text
src/modules/quick-actions-lab/
├── index.tsx                       # ModuleManifest export
├── default-actions.ts              # Single source of truth (4 defaults) — read by plugin AND screen
├── screen.tsx                      # iOS variant (full UI)
├── screen.android.tsx              # Android — IOSOnlyBanner only
├── screen.web.tsx                  # Web      — IOSOnlyBanner only
├── hooks/
│   ├── useQuickActions.ts          # Native: subscribe + route + side-effects
│   └── useQuickActions.web.ts      # Web stub: no-op
└── components/
    ├── ExplainerCard.tsx
    ├── StaticActionsList.tsx
    ├── DynamicActionsManager.tsx
    ├── ActionRow.tsx
    ├── LastInvokedCard.tsx
    └── IOSOnlyBanner.tsx           # Co-located (matches contacts-lab pattern)

plugins/with-quick-actions/
├── index.ts                        # ConfigPlugin: withInfoPlist → UIApplicationShortcutItems
└── index.test.ts                   # Co-located test (consistency w/ with-contacts pattern)

test/unit/plugins/with-quick-actions/
└── index.test.ts                   # Jest-runnable plugin test (idempotency + plist shape)

test/unit/modules/quick-actions-lab/
├── manifest.test.ts
├── default-actions.test.ts
├── hooks/useQuickActions.test.tsx
├── screen.test.tsx
├── screen.android.test.tsx
├── screen.web.test.tsx
└── components/
    ├── ExplainerCard.test.tsx
    ├── StaticActionsList.test.tsx
    ├── DynamicActionsManager.test.tsx
    ├── ActionRow.test.tsx
    ├── LastInvokedCard.test.tsx
    └── IOSOnlyBanner.test.tsx

# Modified (additive only — 1 line each)
src/modules/registry.ts              # +1 import, +1 entry
app.json                             # +1 plugins entry (29 → 30)
test/unit/plugins/with-mapkit/index.test.ts  # plugin-count assertion 29 → 30
```

**Structure Decision**: Module follows the **contacts-lab (038)** and
**eventkit-lab (037)** templates exactly — manifest + 3 screen variants +
co-located `components/` and `hooks/`. The plugin follows the
`with-contacts` template (single `withInfoPlist` modifier, default-prop
fallback). Per project convention (see `jest.config.js` testMatch), the
**jest-runnable** plugin test lives under `test/unit/plugins/with-quick-actions/`;
a co-located `plugins/with-quick-actions/index.test.ts` mirrors the
with-contacts pattern but is not picked up by jest (kept for parity with
the prior modules; can be removed if proven dead in cleanup).

## Phase 0: Outline & Research

See [research.md](./research.md). Highlights:

- **Library choice**: `expo-quick-actions` v6.0.1 (EvanBacon). Installable via
  `npx expo install expo-quick-actions`. Surface: `setItems`, `addListener`,
  `getInitial`, `clearItems`, `useQuickActionRouting`, plus a config plugin.
  We still ship our own `plugins/with-quick-actions/` (per the established
  006/037/038 pattern) so the project owns Info.plist defaults idempotently;
  we do **not** invoke the library's plugin to avoid duplicate-injection
  ambiguity (research documents the dedup strategy).
- **Fallback**: A Swift bridge sketch is documented for the unlikely case the
  community library breaks on SDK 55, but the primary path is
  `expo-quick-actions`.
- **No new permissions**: `UIApplicationShortcutItems` requires no
  `*UsageDescription` key.
- **Routing**: `useQuickActions` subscribes to invocations and calls
  `router.replace(userInfo.route)` for cold-launch and `router.navigate(...)`
  for warm-launch. Unknown / missing routes are no-ops with a dev-only
  `console.warn`.
- **Persistence**: iOS persists `UIApplication.shared.shortcutItems` between
  launches automatically; the lab adds zero app-side persistence. Last-invoked
  is in-memory.
- **Cross-module side-effect**: `add-mood-happy` writes
  `{ mood: 'happy', source: 'quick-action', timestamp }` to a session-scoped
  in-memory log array exported from `src/modules/quick-actions-lab/mood-log.ts`
  (or, if `app-intents-lab` already exposes a session log, that module's API
  is used directly — research confirms the existing surface).

## Phase 1: Design & Contracts

See:

- [data-model.md](./data-model.md) — `QuickActionDefinition`,
  `InvocationEvent`, `ManagerState`, plus state-transition rules.
- [contracts/bridge.md](./contracts/bridge.md) — JS-side surface our code
  consumes from `expo-quick-actions` (the only methods we depend on).
- [contracts/info-plist.md](./contracts/info-plist.md) — exact
  `UIApplicationShortcutItems` array our config plugin produces.
- [contracts/routing.md](./contracts/routing.md) — invocation → route
  dispatch contract.
- [quickstart.md](./quickstart.md) — install / build / test walkthrough.

**Agent context update**: After this plan is committed, the
`<!-- SPECKIT START --> ... <!-- SPECKIT END -->` block in
`.github/copilot-instructions.md` is updated to point at
`specs/039-quick-actions/plan.md` (currently points at 037-eventkit/plan.md).

## Complexity Tracking

> No constitutional violations. Section intentionally empty.
