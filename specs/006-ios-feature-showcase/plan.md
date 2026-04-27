# Implementation Plan: iOS Feature Showcase

**Branch**: `006-ios-feature-showcase` | **Date**: 2026-04-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/006-ios-feature-showcase/spec.md`

## Summary

Build a polished, theme-aware cross-platform shell (Home / Modules / Settings tabs)
plus a typed module-registry plugin architecture, and ship one demo module —
**Liquid Glass Playground** — that uses `expo-glass-effect` on iOS with documented
fallbacks on Android (translucent material `View`) and web (CSS `backdrop-filter`).

The technical approach is dictated by the existing stack and constitution:

- Extend the existing dual tab implementation (`src/components/app-tabs.tsx` for
  native NativeTabs, `src/components/app-tabs.web.tsx` for custom web tabs) by
  adding **Modules** and **Settings** tabs to both files. A unit test asserts
  the two files declare the same tab id list (constitution-acknowledged
  duplication, mechanically guarded).
- Module registry is a typed barrel: `src/modules/types.ts` defines
  `ModuleManifest`; each module under `src/modules/<id>/` exports a default
  manifest from `index.ts`; `src/modules/registry.ts` imports each and exposes
  `MODULES: ModuleManifest[]`. Adding a module = create folder + add one
  import line.
- Module routing uses `expo-router` typed routes. Module detail lives at
  `src/app/modules/[id].tsx`, which looks up the id in the registry and
  renders the manifest's `render()` component. Modules screen at
  `src/app/modules/index.tsx`. Settings at `src/app/settings.tsx`.
- Glass primitive is a `<Glass>` wrapper at `src/components/glass/` with
  per-platform implementations resolved by file suffix:
  `index.tsx` (iOS — `expo-glass-effect` `<GlassView>`),
  `index.android.tsx` (Android — `View` with rgba background + elevation +
  border), `index.web.tsx` (web — `View` with inline `backdropFilter` style).
- Theme preference (`system | light | dark`) persists via
  `@react-native-async-storage/async-storage` (added as a new dep). A
  `ThemePreferenceProvider` reads the saved value at boot, exposes
  `usePreference()` + `setPreference()`, and resolves the effective scheme
  used by `useTheme()`. AsyncStorage is non-blocking, isolated to one module,
  and gracefully no-ops on persistence failure (FR-024).
- All tests under `test/unit/` per existing Jest setup: registry loader,
  manifest validation, theme preference reducer, tab parity test.

No native modules, no Live Activities, no Widget Extension, no Dynamic Island,
no networking, no backend.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), React 19.2, React Native 0.83
**Primary Dependencies**: Expo SDK 55, `expo-router` (typed routes),
`expo-glass-effect` ~55.0.10, `expo-symbols`, `react-native-reanimated` 4.2 +
`react-native-worklets`, `@react-native-async-storage/async-storage` (NEW —
to be added at the version aligned with Expo SDK 55 via `npx expo install`)
**Storage**: AsyncStorage (one key: `spot.theme.preference`); no remote
storage, no DB
**Testing**: `jest-expo` 55 + `@testing-library/react-native` 13, configured
under `test/unit/**`
**Target Platform**: iOS 17+ (primary, required for `expo-glass-effect`),
Android (latest two majors, fallback path), Web (modern Chromium / Safari /
Firefox supporting `backdrop-filter`)
**Project Type**: Mobile + Web single Expo Router project
**Performance Goals**: 60 fps on Liquid Glass Playground control changes
(SC-002 / SC-003); Home hero visible within 3 s of cold launch on iPhone
(SC-001); theme switch propagates within 500 ms (SC-003)
**Constraints**: StyleSheet-only styling, `ThemedText` / `ThemedView` only,
Spacing scale only, `.web.tsx` / `.android.tsx` file splitting for
non-trivial platform divergence, typed `expo-router` routes, no Animated
API
**Scale/Scope**: 3 tabs, 3 routes (`/`, `/explore` retained, `/modules`,
`/modules/[id]`, `/settings`), 1 shipping module, registry sized for
~10–20 future modules, ~600–900 LOC of feature code

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution: `.specify/memory/constitution.md` v1.1.0.

| Principle | Compliance | Evidence |
|---|---|---|
| **I. Cross-Platform Parity** | ✅ PASS | Every screen renders on iOS/Android/web (FR-025). Liquid Glass module ships documented per-platform fallbacks (FR-016, FR-017). Tab parity is mechanically tested (see "Tab parity" below). |
| **II. Token-Based Theming** | ✅ PASS | All new surfaces use `ThemedText` / `ThemedView` (FR-003). `useTheme()` is extended (not replaced) so existing API is preserved. No hardcoded colors in feature code; the Liquid Glass tint chip palette is the *only* exception and is sourced from a constants file inside the module folder, not from raw call sites. |
| **III. Platform File Splitting** | ✅ PASS | `<Glass>` wrapper splits via `index.tsx` / `index.android.tsx` / `index.web.tsx`. Tab implementations stay split (`app-tabs.tsx` / `app-tabs.web.tsx`). `useColorScheme` already split. Inline `Platform.OS` only used for single-value differences (e.g., picking a fallback icon name). |
| **IV. StyleSheet Discipline** | ✅ PASS | All new styles via `StyleSheet.create()`. Web `backdropFilter` is not supported by RN's `StyleSheet` typings, so the `<Glass>` web variant uses an inline style object containing the single `backdropFilter` property — this is constrained to one file (`src/components/glass/index.web.tsx`), is the minimum viable expression of a web-only CSS feature unavailable in RN typings, and is documented inline. Spacing values come from the `Spacing` scale. |
| **V. Test-First for New Features** | ✅ PASS | Tests under `test/unit/`: registry loader, manifest validation, theme preference reducer/store, tab-parity (FR-027). Acceptance scenarios for the Modules grid (including unsupported-platform marking) and theme switcher (including persistence) are covered. Tasks phase will sequence tests before their corresponding implementation. |

**Technology Constraints check**: Expo SDK 55 ✅, `expo-router` typed routes ✅,
Reanimated + Worklets only (no Animated API) ✅, `expo-image` (none added in
this feature; existing usage retained) ✅, pnpm hoisted ✅, React Compiler
enabled ✅, path aliases honored ✅.

**Validate-Before-Spec check** (Workflow §): Not applicable — this feature
ships no build pipeline, no infra, no external service integration. The one
new external dependency, `@react-native-async-storage/async-storage`, is a
mature first-party Expo-supported package; an Expo SDK 55–compatible
version exists and is the canonical persistence choice for non-sensitive
local key/value data.

**Result**: PASS. No violations. Complexity Tracking section intentionally
omitted.

## Project Structure

### Documentation (this feature)

```text
specs/006-ios-feature-showcase/
├── plan.md              # This file (/speckit.plan output)
├── spec.md              # Already authored
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/
    └── module-manifest.md   # Phase 1 — typed manifest contract
```

### Source Code (repository root)

```text
src/
├── app/                              # expo-router routes
│   ├── _layout.tsx                   # (modified) wraps in ThemePreferenceProvider
│   ├── index.tsx                     # (modified) polished hero showcase
│   ├── explore.tsx                   # (kept as-is, existing tab)
│   ├── modules/
│   │   ├── index.tsx                 # NEW — Modules grid driven by registry
│   │   └── [id].tsx                  # NEW — dynamic module detail dispatcher
│   └── settings.tsx                  # NEW — System / Light / Dark switcher
├── components/
│   ├── app-tabs.tsx                  # (modified) add Modules + Settings triggers
│   ├── app-tabs.web.tsx              # (modified) add Modules + Settings triggers
│   ├── themed-text.tsx               # (kept)
│   ├── themed-view.tsx               # (kept)
│   └── glass/
│       ├── index.tsx                 # NEW — iOS impl via expo-glass-effect
│       ├── index.android.tsx         # NEW — Android translucent fallback
│       └── index.web.tsx             # NEW — web backdrop-filter fallback
├── modules/
│   ├── types.ts                      # NEW — ModuleManifest interface
│   ├── registry.ts                   # NEW — barrel exporting MODULES[]
│   └── liquid-glass-playground/
│       ├── index.ts                  # NEW — exports default manifest
│       ├── screen.tsx                # NEW — playground UI + controls
│       └── tints.ts                  # NEW — tint chip palette constants
├── theme/
│   ├── preference-provider.tsx       # NEW — context + AsyncStorage I/O
│   └── use-theme-preference.ts       # NEW — hook (system/light/dark + setter)
├── hooks/
│   ├── use-color-scheme.ts           # (kept)
│   ├── use-color-scheme.web.ts       # (kept)
│   └── use-theme.ts                  # (modified) honors preference provider
└── constants/
    └── theme.ts                      # (kept; Colors, Spacing untouched)

test/unit/
├── modules/
│   ├── registry.test.ts              # NEW — loads modules, sorts deterministically
│   ├── manifest.test.ts              # NEW — validates each registered manifest
│   └── platform-filtering.test.tsx   # NEW — unsupported-platform card behavior
├── theme/
│   └── preference.test.tsx           # NEW — store reducer + AsyncStorage persistence
└── shell/
    └── tab-parity.test.ts            # NEW — native tab ids === web tab ids
```

**Structure Decision**: Single Expo Router project (existing layout extended).
Routes live under `src/app/` per the project's already-established convention
(not the SDK-default root `app/`). All new feature code is co-located under
`src/modules/`, `src/components/glass/`, and `src/theme/`, leaving the
existing shell modules untouched except for the explicit edits listed above.

## Phase 0 Output

See [`research.md`](./research.md). All `NEEDS CLARIFICATION` items in the
template have been resolved by user-provided guidance and the constitution;
no open clarifications remain.

## Phase 1 Output

- [`data-model.md`](./data-model.md) — entities: `ModuleManifest`,
  `ModuleRegistry`, `ThemePreference`, derived `EffectiveColorScheme`.
- [`contracts/module-manifest.md`](./contracts/module-manifest.md) — the
  TypeScript contract every module must export.
- [`quickstart.md`](./quickstart.md) — how to run the app, how to add a new
  module, how to run tests.
- Agent context updated: the `<!-- SPECKIT START -->` block in
  `.github/copilot-instructions.md` now points at `specs/006-ios-feature-showcase/plan.md`.

**Re-evaluation of Constitution Check after Phase 1 design**: Still PASS.
The added `src/theme/` directory does not violate Token-Based Theming —
it *centralises* the preference layer that feeds `useTheme()`. The
`backdropFilter` web inline style remains the only acknowledged
StyleSheet-discipline asterisk and is contained to a single file.

## Open Questions Flagged

None. All architectural decisions are recorded in `research.md`. Items
intentionally deferred to a future spec (Live Activities, Widget Extension,
Dynamic Island, additional modules) are listed in the spec's *Assumptions*
section and explicitly out of scope here.
