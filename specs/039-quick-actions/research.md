# Research: Quick Actions Module

**Feature**: 039-quick-actions
**Date**: 2026-04-30
**Status**: Complete — all NEEDS CLARIFICATION resolved

This document resolves the open library / bridge / routing / persistence
questions raised in the spec's Assumptions and Open Questions sections.

---

## Decision 1: Native bridge — `expo-quick-actions` vs hand-written Swift

**Decision**: **Use `expo-quick-actions` v6.0.1** (community package by
EvanBacon, [github.com/evanbacon/expo-quick-actions](https://github.com/evanbacon/expo-quick-actions)).

**Rationale**:

- **Available on npm**: `npm view expo-quick-actions` returns
  `version = '6.0.1'` and `peerDependencies = { expo: '*' }` — installable
  in this Expo SDK 55 project via `npx expo install expo-quick-actions`.
- **Stable surface**: 6 major releases (0.x → 6.x) tracking Expo SDK
  upgrades; the v6 line targets recent Expo SDKs.
- **Minimal author-time cost**: A single npm install replaces a hand-written
  Swift `AppDelegate` shim plus an `RCTEventEmitter` bridge — material LOC
  savings, fewer native-build pitfalls, and full TypeScript types.
- **Lab module is educational**: a community library is the realistic choice
  any developer reading the showcase would actually use; demonstrating it is
  the point.
- **No-permission API**: matches the spec assumption — Quick Actions need
  no `*UsageDescription` key, only the `UIApplicationShortcutItems`
  Info.plist array.
- **Cross-platform**: the library has best-effort Android `ShortcutManager`
  support, so the iOS-only call sites still no-op cleanly on Android (the
  spec explicitly does NOT validate Android beyond what the library does
  automatically — `IOSOnlyBanner` covers the UX).

**Alternatives considered**:

1. **Hand-written Swift bridge** wrapping `UIApplication.shared.shortcutItems`
   plus `application(_:performActionFor:completionHandler:)` and the
   cold-launch `UIApplicationLaunchOptionsShortcutItemKey`. Rejected as
   primary: requires native code (this project is JS-only outside config
   plugins), adds maintenance burden, and duplicates a working community
   library. Kept as **fallback sketch** below.
2. **`react-native-quick-actions`** (older community lib). Rejected:
   unmaintained for SDK 55; not designed for the Expo config-plugin
   workflow.
3. **No bridge — Info.plist only**. Rejected: would deliver only static
   actions and lose Stories 3, 4, 5, 6 (which require runtime mutation,
   listeners, and cold-launch payload access).

**Library API surface we consume** (from
`expo-quick-actions` v6 README + types):

| Symbol | Used by | Purpose |
|---|---|---|
| `setItems(items: Action[]): Promise<void>` | `DynamicActionsManager`, Reset | Replace dynamic shortcut list |
| `getItems(): Promise<Action[]>` | manager init | Read current dynamic list |
| `clearItems(): Promise<void>` | Reset (sugar for `setItems([])`) | Clear dynamic list |
| `addListener(handler: (action) => void): Subscription` | `useQuickActions` warm-launch | Subscribe to runtime invocations |
| `getInitial(): Promise<Action \| null>` | `useQuickActions` cold-launch | Fetch the action that launched the app |

If the v6 surface differs in actual symbol names (e.g.
`useQuickAction` hook instead of `addListener`), the **import-boundary
mock strategy** absorbs the difference: `useQuickActions` (ours) is the only
import site, so renames are contained to one file. Tests mock
`'expo-quick-actions'` whole.

**Fallback sketch (only if library fails install / runtime check)**:

```text
ios/spot/AppDelegate.swift  # via a Swift config plugin
  - In application(_:didFinishLaunchingWithOptions:):
      if let shortcut = launchOptions?[.shortcutItem] as? UIApplicationShortcutItem {
        sendShortcutEvent(shortcut)   // RCTEventEmitter
        return false  // suppress automatic perform
      }
  - application(_:performActionFor:completionHandler:):
      sendShortcutEvent(shortcutItem)
      completionHandler(true)

modules/QuickActionsModule.swift
  - @objc setItems(_ items: [[String: Any]]) { UIApplication.shared.shortcutItems = ...}
  - @objc getItems(...) -> [[String: Any]]
  - emits "QuickActionInvoked" via RCTEventEmitter
```

The fallback is **deferred unless** the install of `expo-quick-actions` fails
in the implementation phase. We will not pre-build it.

---

## Decision 2: Owning `plugins/with-quick-actions/` even if `expo-quick-actions` ships its own plugin

**Decision**: Ship **our own** project-scoped `plugins/with-quick-actions/`
that injects the 4 defaults idempotently. **Do NOT** add the library's
plugin to `app.json` `plugins`. Plugin count goes from 29 → 30.

**Rationale**:

- **Pattern consistency**: every prior iOS-feature module on this codebase
  (006-mapkit, 037-eventkit, 038-contacts) ships a project-owned config
  plugin in `plugins/`. Owning the plugin keeps Info.plist defaults
  reviewable in-repo and idempotent.
- **No plugin-list duplication**: if both `expo-quick-actions` (auto-applied
  via its own plugin) and our `plugins/with-quick-actions` injected
  `UIApplicationShortcutItems`, the second writer would overwrite the first
  — non-deterministic ordering. Owning a single source of truth eliminates
  that race.
- **Idempotency contract**: our plugin keys items by `type` and skips
  re-adding any item already present, so prebuilding twice is byte-stable
  (FR-003 / SC-7). The library's plugin makes no such guarantee for our
  4 defaults.
- **App.json plugins-array dedup**: the library's plugin is **not** added
  to `plugins[]`. Only `./plugins/with-quick-actions` is added. This
  matches the precedent — `expo-contacts` is also installed without
  registering its plugin (`with-contacts` owns the Info.plist key).

**Idempotency strategy**:

```ts
withInfoPlist(config, (cfg) => {
  const existing = (cfg.modResults.UIApplicationShortcutItems as Item[] | undefined) ?? [];
  const have = new Set(existing.map((i) => i.UIApplicationShortcutItemType));
  const merged = [
    ...existing,
    ...DEFAULTS.filter((d) => !have.has(d.UIApplicationShortcutItemType)),
  ];
  cfg.modResults.UIApplicationShortcutItems = merged;
  return cfg;
});
```

Running the plugin twice produces identical output because the second pass
finds every default's `type` already present and adds nothing.

---

## Decision 3: Routing on invocation

**Decision**: A single hook — `useQuickActions` — registered in the
**root layout** (`app/_layout.tsx`) at app boot. Calls `router.replace(...)`
on cold-launch invocations (per Story 6 AS#1: deep-link replaces the
default initial route) and `router.navigate(...)` on warm-launch invocations
(preserves backstack).

**Rationale**:

- Centralizing the listener at root means Story 1 / 6 work even when the
  user never opens the Quick Actions Lab screen.
- The hook also wires the "side-effect for `add-mood-happy`" so that mood
  log entries land regardless of which screen is mounted.
- Listener subscription returns a cleanup function — typical
  `useEffect` pattern; no leaks.
- Unknown `userInfo.route` or missing `userInfo` ⇒ no-op. In `__DEV__`,
  emit a single `console.warn` with the action `type` (per Story 6 AS#4).

**Cross-module side effect (`add-mood-happy`)**:

The session-scoped mood log lives in
`src/modules/quick-actions-lab/mood-log.ts` as an in-memory module-scoped
array with `appendMoodEntry()` and `getMoodEntries()`. The
`app-intents-lab` module reads from this same module via a typed
`getMoodEntries` import — a one-way, JS-only contract. No Zustand, no
AsyncStorage; cleared on reload. This satisfies FR-009 without coupling
the two modules through global state.

---

## Decision 4: Persistence model

**Decision**: **No app-side persistence layer.**

- **Dynamic shortcuts** (`UIApplication.shared.shortcutItems`): iOS itself
  persists across launches. No AsyncStorage, no MMKV.
- **Last-invoked action**: in-memory `useState` in the Lab screen. Clears
  on app close. Spec calls this out explicitly.
- **Mood log (`add-mood-happy` side effect)**: in-memory module array.
  Clears on reload. Acceptable per spec FR-009.

**Rationale**: layering AsyncStorage on top of OS-managed state would
be redundant and risk drift. The spec's "Out of Scope" item #5 makes this
explicit.

---

## Decision 5: Test strategy & native bridge mocking

**Decision**: Mock `expo-quick-actions` and `expo-router` at the import
boundary in **per-test** `jest.mock(...)` calls (matches the pattern in
`test/unit/modules/contacts-lab/**`). Do **not** add a global mock to
`test/setup.ts` for `expo-quick-actions` — keeping the mock per-test makes
the bridge surface visible in each spec and avoids a global dependency
on a not-yet-installed package during early TDD.

```ts
// test/unit/modules/quick-actions-lab/hooks/useQuickActions.test.tsx
jest.mock('expo-quick-actions', () => ({
  setItems: jest.fn().mockResolvedValue(undefined),
  getItems: jest.fn().mockResolvedValue([]),
  getInitial: jest.fn().mockResolvedValue(null),
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  clearItems: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('expo-router', () => ({
  router: { navigate: jest.fn(), replace: jest.fn() },
}));
```

**Plugin tests** assert (1) the function exports as a `ConfigPlugin`,
(2) running it once yields the exact 4-item
`UIApplicationShortcutItems` shape, (3) running it twice produces
deeply-equal output (idempotency), and (4) the
**plugin-count assertion** in
`test/unit/plugins/with-mapkit/index.test.ts` is bumped **29 → 30**.

**Test count estimate**: ~35 unit tests across 13 files (per file layout
in plan.md).

---

## Decision 6: Project conventions reminder

For implementer (Phase 2):

- All themed surfaces use `ThemedText` / `ThemedView` from
  `@/components/themed-view` and `@/components/themed-text`.
- Spacing values from `Spacing` (`@/constants/theme`).
- Single quotes everywhere; no template-literal strings except for
  interpolation.
- `StyleSheet.create()` only — no inline style objects defined outside
  StyleSheet, no CSS-in-JS, no utility-class libs.
- Platform variants via `.web.tsx` / `.android.tsx` — **not** inline
  `Platform.select()`.
- Absolutely **zero `eslint-disable`** directives. Constitution v1.1.0,
  FR-014.
- The 006 Showcase already has `app-tabs.tsx` and `app-tabs.web.tsx`
  exposing a Modules grid; this feature **does not add a tab** — it adds
  a module entry consumed by the existing grid.
- Module is registered in `src/modules/registry.ts` (file confirmed at
  research time; the spec's reference to `src/data/moduleRegistry.ts`
  is corrected here — see Note below).

**Note** (spec back-patch candidate, per Constitution Validate-Before-Spec):
the spec's FR-001 references `src/data/moduleRegistry.ts`, but the actual
file is `src/modules/registry.ts`. The plan and tasks use the correct
path; the spec will be back-patched in Phase 3 verification.

---

## Decision 7: Plugin-count assertion site

**Decision**: Bump the assertion in
`test/unit/plugins/with-mapkit/index.test.ts` line 65 from
`expect(plugins.length).toBe(29)` → `expect(plugins.length).toBe(30)`.
Update the comment on line 64 ("After feature 037, plugins.length should
be 28 ...") to "After feature 039, plugins.length should be 30".

**Rationale**: The spec's Assumption #8 names this exact file; manual
inspection confirms it is the canonical project-wide plugin-count guard.
No other file asserts this number.

---

## Resolved questions summary

| Spec ref | Question | Resolution |
|---|---|---|
| Assumption 1 | `expo-quick-actions` available? | Yes — v6.0.1 on npm; install confirmed |
| Assumption 8 | plugin-count file path | `test/unit/plugins/with-mapkit/index.test.ts` line 65 |
| Assumption 9 | mood-log mechanism | In-memory module-scoped array in `mood-log.ts` |
| Open Q | Library plugin vs ours | Ship ours; do not register library plugin |
| Open Q | Fallback bridge needed? | No — primary path works; sketch retained for emergency |
| Spec FR-001 | Registry file path | Actual file is `src/modules/registry.ts` (back-patch) |

All NEEDS CLARIFICATION resolved.
