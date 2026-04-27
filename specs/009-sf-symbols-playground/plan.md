# Implementation Plan: SF Symbols Lab

**Branch**: `009-sf-symbols-playground` | **Date**: 2026-05-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/009-sf-symbols-playground/spec.md`

## Summary

Ship one new module — **SF Symbols Lab** — that plugs into the spec 006
module registry and demonstrates SF Symbols with the iOS 17+ symbol
effects (Bounce, Pulse, Scale, Variable Color, Replace, Appear,
Disappear). The module ships with a single test seam,
`<AnimatedSymbol>`, that wraps `expo-symbols`' `SymbolView` so every JS
path can be unit-tested with a mocked native view, and the
Android / Web build degrades to a banner + plain-text glyph fallback.

The technical approach is dictated by the constitution and by the
registry contract from spec 006:

- **Module entry**: `src/modules/sf-symbols-lab/` with `index.tsx`
  (manifest: id `'sf-symbols-lab'`, `platforms: ['ios','android','web']`,
  `minIOS: '17.0'`, `render: () => <SfSymbolsLabScreen />`) and
  `screen.tsx` (banner → preview → symbol picker → effect picker →
  config row → tint picker → optional Replace mini-picker → Play Effect).
- **Registry change**: ONE import line + ONE entry appended to
  `src/modules/registry.ts`. No other shell file is touched (FR-001 /
  FR-002 / FR-003 / FR-004 are owned by spec 006's existing dispatch and
  iOS-version gating).
- **Single test seam — `<AnimatedSymbol>`**: a thin wrapper component at
  `components/AnimatedSymbol.tsx` that (a) on iOS renders
  `expo-symbols`' `SymbolView` with a derived `animationSpec`,
  (b) on Android / Web renders a `ThemedText` plain-text glyph fallback
  with the current tint, and (c) emulates the three logical effects that
  `expo-symbols` 55.0.7 does not natively expose (Replace, Appear,
  Disappear) at the wrapper level using `react-native-reanimated`. This
  is the *only* file in the module that imports `expo-symbols` (FR-034).
  Test strategy: mock `expo-symbols` and assert the prop graph passed to
  `SymbolView` (Component Contract in `contracts/`).
- **Components** (all under `src/modules/sf-symbols-lab/components/`):
  - `SymbolPicker.tsx` — horizontally scrollable row of 12 themed
    `Pressable` cells, each rendering an `<AnimatedSymbol>` at small
    size; selected state via `backgroundSelected` token; tap updates
    parent state (FR-005 – FR-008).
  - `EffectPicker.tsx` — themed segmented control of 7 effects; tap
    updates parent state; default Bounce (FR-009 – FR-012).
  - `TintPicker.tsx` — 4 themed colour swatches sourced from the project
    theme tokens; tap immediately re-tints the preview (FR-022 – FR-024,
    SC-006).
  - `AnimatedSymbol.tsx` — see above; the only consumer of
    `expo-symbols`.
- **Catalog — `catalog.ts`**: const-asserted arrays for the 12 curated
  symbols and the 7 effects. Each effect entry declares
  `respondsToSpeed`, `respondsToRepeat`, and `requiresSecondarySymbol`
  so the screen can de-emphasize irrelevant controls (FR-015, FR-016)
  and conditionally render the Replace mini-picker (FR-025, FR-027).
- **Cross-platform behaviour** is centralised: the *iOS-17+ banner* is
  rendered inside `screen.tsx` gated by `Platform.OS !== 'ios'`
  (single-value branch — permitted by constitution III); the *plain-text
  fallback* lives in `AnimatedSymbol.tsx` behind a single `Platform.OS`
  gate (single-source file with two branches; co-located makes the seam
  trivially testable). Other components do not branch on `Platform.OS`.
- **State**: All state is local to `screen.tsx` via `useState` —
  `selectedSymbol`, `selectedEffect`, `speed`, `repeat`, `tint`,
  `secondarySymbol`, `playToken` (an integer bumped on every Play Effect
  press to retrigger the wrapper's effect imperatively). No new global
  stores, contexts, or persistence (FR-035).
- **Tests** (jest-expo + RNTL, configured under `test/unit/`): catalog,
  four component test files, screen integration, and the per-module
  manifest invariants — see `Project Structure` below and
  `contracts/test-plan.md`.

No new runtime dependencies. `expo-symbols` is already in the dep tree
at `~55.0.7`. No config plugin needed (`expo-symbols` autolinks via
Expo Modules).

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), React 19.2, React Native 0.83.6
**Primary Dependencies**: Expo SDK 55, `expo-router` (typed routes),
`expo-symbols` `~55.0.7` (already installed), `react-native-reanimated`
4.2 + `react-native-worklets` (existing — used for Appear / Disappear /
Replace fade emulation only).
**Storage**: None. All UI state is component-local.
**Testing**: `jest-expo` 55 + `@testing-library/react-native` 13 with the
existing `test/setup.ts` (already mocks `react-native-reanimated`,
`@react-native-async-storage/async-storage`, `expo-image`, `expo-font`).
`expo-symbols` will be mocked per test file: `jest.mock('expo-symbols',
() => ({ SymbolView: jest.fn(() => null) }))` so component tests can
assert the props handed to `SymbolView` without hitting the native view
manager.
**Target Platform**: iOS 17+ (real symbol effects), iOS < 17 (registry
hides the card via existing 006 gating), Android (banner + plain-text
fallback), Web (banner + plain-text fallback).
**Project Type**: Mobile + Web single Expo Router project, extended by
one new module folder under `src/modules/`. No new top-level routes, no
new tabs, no native targets, no config plugins.
**Performance Goals**: From a Play Effect tap, the preview begins
animating within 100 ms on iOS 17+ (SC-002); switching tint updates the
preview within 100 ms on all platforms (SC-006); zero jank on the
emulated Reanimated fades (worklet on UI thread per constitution).
**Constraints**: StyleSheet-only styling, `ThemedText` / `ThemedView`
only, `Spacing` scale only (constitution II + IV), `@/` aliases
everywhere (FR-037), strict TS — no `any` in `AnimatedSymbol` or
`catalog`, no Animated API (constitution: Reanimated Keyframe + worklets
only), no inline `Platform.select()` for non-trivial divergence (the
only `Platform.OS` branches are single-value: the banner gate in
`screen.tsx` and the iOS / non-iOS render branch inside
`AnimatedSymbol.tsx`), no top-level side effects (`AnimatedSymbol`
import-safe on web because `expo-symbols`' web entrypoint already ships
a Material-Symbols-font fallback `SymbolView` — though our wrapper
short-circuits before invoking it).
**Scale/Scope**: 1 new module, 1 screen, 4 components, 1 catalog
module, 1 manifest entry, 7 test files. ~500–650 LOC total including
tests. No new shell routes or schema.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution: `.specify/memory/constitution.md` v1.1.0 (note: the user
prompt referenced v1.0.1; the on-disk version is v1.1.0 — the new MINOR
section is *Validate-Before-Spec*, addressed below).

| Principle | Compliance | Evidence |
|---|---|---|
| **I. Cross-Platform Parity** | ✅ PASS | The full UI renders on iOS 17+, Android, and Web. iOS uses `expo-symbols` `SymbolView` with iOS 17 symbol effects; Android and Web show the "iOS 17+ only" banner (FR-028) and a plain-text glyph fallback (FR-029) but every picker (symbol, effect, tint, Replace mini-picker, speed, repeat) remains fully interactive (FR-030, Story 3 / SC-005). Play Effect is a safe no-op off-iOS (FR-031). iOS < 17 is handled by spec 006's existing `minIOS` gating (FR-004). |
| **II. Token-Based Theming** | ✅ PASS | Every text and surface uses `ThemedText` / `ThemedView`. All spacing comes from the `Spacing` scale. Colours are only ever read via `useTheme()`. The 4 tint swatches in `TintPicker` are sourced from `Colors.{light,dark}` rather than hardcoded; the chosen swatch flows into `AnimatedSymbol`'s `tintColor` prop (FR-022 — "drawn from the project's centralized theme tokens"). |
| **III. Platform File Splitting** | ✅ PASS (with documented single-value branches) | Two `Platform.OS` references, both single-value: (a) `screen.tsx` conditionally renders the iOS-17+ banner via `Platform.OS !== 'ios'`; (b) `AnimatedSymbol.tsx` switches between the native `SymbolView` branch and the plain-text fallback via `Platform.OS === 'ios'`. Both are explicitly permitted by the principle. The fallback in (b) is two lines of JSX — splitting `AnimatedSymbol.tsx` into `.web.tsx` + `.android.tsx` + `.ios.tsx` would triplicate ~80 LOC for a 2-line difference and would force three test files where one suffices. If the fallback grows beyond a one-liner glyph, it will be split into `AnimatedSymbol.web.tsx` per the principle. |
| **IV. StyleSheet Discipline** | ✅ PASS | All styles via `StyleSheet.create()` in every `.tsx`. No CSS-in-JS, no inline style objects beyond what `StyleSheet.create()` accepts. `Spacing` scale used throughout. |
| **V. Test-First for New Features** | ✅ PASS | Tests under `test/unit/modules/sf-symbols-lab/`: `catalog.test.ts`, `components/SymbolPicker.test.tsx`, `components/EffectPicker.test.tsx`, `components/AnimatedSymbol.test.tsx` (mocking `expo-symbols`), `components/TintPicker.test.tsx`, `screen.test.tsx` (integration: banner + preview + all four pickers + Play Effect + Replace mini-picker visibility), and `manifest.test.ts` (per-module manifest invariants in addition to the global `test/unit/modules/manifest.test.ts` from spec 006). FR-039 enforces. Story-to-test mapping is in `quickstart.md` and `contracts/test-plan.md`. |

**Technology Constraints check**: Expo SDK 55 ✅, `expo-router` typed
routes ✅ (no new routes — module dispatched through existing
`/modules/[id]` shell), Reanimated Keyframe API + Worklets only (no
Animated API) ✅ — used for the Appear / Disappear / Replace fade
emulation, pnpm hoisted ✅, React Compiler enabled ✅ (catalog is a
pure module, components are pure function components), path aliases
honored (`@/modules/types`, `@/modules/sf-symbols-lab/...`,
`@/components/...`, `@/constants/theme`) ✅, `expo-image` not introduced
(no images bundled in this feature) ✅.

**Validate-Before-Spec check** (Workflow §): **Triggered and satisfied
during Phase 0**. The spec assumed `expo-symbols` exposes a single
"effect" handle covering all seven iOS 17 effects; reading the
`expo-symbols` 55.0.7 type surface (`node_modules/expo-symbols/src/
SymbolModule.types.ts`) and the iOS view source
(`node_modules/expo-symbols/ios/SymbolView.swift`) shows that
`AnimationType` is restricted to `'bounce' | 'pulse' | 'scale'`, that
Variable Color is expressed via a separate `variableAnimationSpec`
field, and that Replace / Appear / Disappear are *not* directly bound
in this version of the package. This is the kind of discovery the
Validate-Before-Spec mandate exists to surface; it is documented in
`research.md` R1 and the `<AnimatedSymbol>` contract has been written
around it (Replace = `name` swap with internal crossfade; Appear /
Disappear = Reanimated opacity worklet on the wrapper). Spec FR-018
("apply the currently selected effect") and FR-026 ("animate the
SF Symbols Replace transition") remain satisfied — the wrapper hides
the implementation detail from the screen — but the **spec is
back-patched** with a *Note: AnimatedSymbol contract* paragraph in
this plan's `Open Questions` section pointing the reviewer to
`research.md` R1 and `contracts/animated-symbol.md`.

**Result**: PASS. No constitutional violations. Complexity Tracking
intentionally omitted.

## Project Structure

### Documentation (this feature)

```text
specs/009-sf-symbols-playground/
├── plan.md              # This file (/speckit.plan output)
├── spec.md              # Already authored
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── checklists/          # Pre-existing (e.g., requirements checklist)
└── contracts/
    ├── animated-symbol.md  # JS test-seam contract: prop graph + per-effect mapping + cross-platform fallback
    ├── catalog.md          # Curated symbol & effect arrays — shape + invariants
    └── test-plan.md        # Story → test-file mapping + jest mock recipe for expo-symbols
```

### Source Code (repository root)

```text
src/
├── modules/
│   ├── registry.ts                                    # (modified) one new import + one new array entry
│   ├── types.ts                                       # (kept — re-uses spec 006 contract)
│   └── sf-symbols-lab/
│       ├── index.tsx                                  # NEW — exports default ModuleManifest
│       ├── screen.tsx                                 # NEW — banner + preview + 4 pickers + Play Effect
│       ├── catalog.ts                                 # NEW — 12 symbols + 7 effects with metadata
│       ├── types.ts                                   # NEW — CuratedSymbol, EffectId, Speed, Repeat, PlaybackConfig
│       └── components/
│           ├── SymbolPicker.tsx                       # NEW — horizontal scroller, 12 cells
│           ├── EffectPicker.tsx                       # NEW — 7-segment control
│           ├── TintPicker.tsx                         # NEW — 4 themed swatches
│           └── AnimatedSymbol.tsx                     # NEW — single seam over expo-symbols + plain-text fallback

test/unit/
└── modules/
    └── sf-symbols-lab/                                # NEW
        ├── manifest.test.ts                           # per-module invariants (id, platforms, minIOS '17.0', render)
        ├── catalog.test.ts                            # 12 symbols, 7 effects, Replace.requiresSecondarySymbol === true
        ├── screen.test.tsx                            # integration: banner + 4 pickers + Replace mini-picker visibility
        └── components/
            ├── SymbolPicker.test.tsx                  # render 12, default selection, tap updates
            ├── EffectPicker.test.tsx                  # render 7, default Bounce, tap updates
            ├── TintPicker.test.tsx                    # render 4, tap re-tints preview
            └── AnimatedSymbol.test.tsx                # mock expo-symbols; per-effect prop graph + fallback branch
```

**Structure Decision**: Single Expo Router project (existing 006 layout
extended). The module folder is fully *additive* — no existing shell
file is touched except `src/modules/registry.ts` (one import + one
entry, per FR-033 + SC-008). New code is co-located by domain under
`src/modules/sf-symbols-lab/`: the screen, the components, the catalog,
and the wrapper all live in one folder so the module is grep-able and
deletable as a unit. Tests mirror the source tree under
`test/unit/modules/sf-symbols-lab/`.

## Phase 0 Output

See [`research.md`](./research.md). All `NEEDS CLARIFICATION` items in
the template have been resolved by user-provided guidance, the spec,
the constitution, the `expo-symbols` 55.0.7 source on disk, and prior-
art from spec 006 / 007 / 008. The Validate-Before-Spec mandate fired
on the symbol-effects API surface (R1) and was satisfied by reading the
package source directly.

## Phase 1 Output

- [`data-model.md`](./data-model.md) — entities: `CuratedSymbol`,
  `EffectId`, `EffectMetadata`, `Speed`, `Repeat`, `TintToken`,
  `PlaybackConfig`.
- [`contracts/animated-symbol.md`](./contracts/animated-symbol.md) —
  the wrapper's prop graph, the per-effect mapping to
  `AnimationSpec`, and the cross-platform fallback contract.
- [`contracts/catalog.md`](./contracts/catalog.md) — invariants for the
  curated 12 symbols and 7 effects; the source of truth for the
  per-module `catalog.test.ts`.
- [`contracts/test-plan.md`](./contracts/test-plan.md) — story → test
  mapping, the `jest.mock('expo-symbols', ...)` recipe, and RNTL
  patterns for the screen integration test.
- [`quickstart.md`](./quickstart.md) — install / dev / on-device
  verification matrix + the cross-platform smoke list.
- Agent context updated: the `<!-- SPECKIT START -->` block in
  `.github/copilot-instructions.md` now points at
  `specs/009-sf-symbols-playground/plan.md`.

**Re-evaluation of Constitution Check after Phase 1 design**: Still
PASS. The contracts are pure documentation, not new shell coupling.
The wrapper and catalog are leaf modules — no other file in `src/`
imports them outside of `src/modules/sf-symbols-lab/`. The two
`Platform.OS` references are re-confirmed as the only branches and
both are single-value (banner gate, fallback gate), permitted by the
principle. No new dependency beyond the already-installed
`expo-symbols ~55.0.7` is required.

## Open Questions Flagged

**Note: AnimatedSymbol contract.** `expo-symbols` 55.0.7 does *not*
expose Replace, Appear, or Disappear as native `AnimationType` values
— `AnimationType` is fixed to `'bounce' | 'pulse' | 'scale'` (plus
Variable Color via `variableAnimationSpec`). The wrapper emulates the
three missing effects at the JS level: Replace via a `name`-prop swap
wrapped in a 200 ms Reanimated opacity crossfade; Appear / Disappear
via a 250 ms opacity worklet driven by a Reanimated shared value. From
the screen's perspective the effect taxonomy of all seven items is
uniform — the wrapper hides the implementation gap. See `research.md`
R1 and `contracts/animated-symbol.md` for the full mapping table. If a
future SDK ships native bindings for the missing three, the wrapper is
the only file that needs to change.

No other open questions. Items deferred to a future spec — custom
glyph sources, multi-symbol palette tinting, Variable Color value /
fill-level controls, persistence of the playback config, sharing /
exporting symbol+effect combinations — are listed in spec.md's *Out
of Scope* section and explicitly excluded here.
