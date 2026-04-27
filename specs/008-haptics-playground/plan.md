# Implementation Plan: Haptics Playground

**Branch**: `008-haptics-playground` | **Date**: 2026-04-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/008-haptics-playground/spec.md`

## Summary

Ship one new cross-platform module — **Haptics Playground** — that plugs into
the spec 006 module registry and lets a user (1) trigger every built-in
`expo-haptics` notification, impact, and selection feedback type from labeled
buttons, (2) compose and play 8-cell haptic sequences with ~120 ms inter-cell
spacing, and (3) save / replay sequences as named presets persisted in
AsyncStorage. The module ships with a single test seam (`haptic-driver.ts`)
that wraps `expo-haptics` so every JS path can be unit-tested with mocks and
the web build degrades to a safe no-op + advisory banner.

The technical approach is dictated by the constitution and by the registry
contract from spec 006:

- **Module entry**: `src/modules/haptics-playground/` with `index.tsx`
  (manifest: id `'haptics-playground'`, `platforms: ['ios','android','web']`,
  no `minIOS`, `render: () => <HapticsPlaygroundScreen />`) and `screen.tsx`
  (the four-section UI: web banner → notifications row → impact row →
  selection row → composer → presets list).
- **Registry change**: ONE import line + ONE entry appended to
  `src/modules/registry.ts`. No other shell file is touched (FR-001 / FR-002
  / FR-003 are all owned by spec 006's existing dispatch).
- **Single test seam — `haptic-driver.ts`**: a thin async wrapper around
  `expo-haptics` exposing `play(kind, intensity?)` where
  `kind ∈ {'notification','impact','selection'}` and `intensity` is
  `ImpactFeedbackStyle | NotificationFeedbackType | undefined`. On
  `Platform.OS === 'web'` the wrapper returns a resolved Promise without
  importing or calling any native API. This is the *only* file in the module
  that talks to `expo-haptics` — every component, the composer, and presets
  go through it (FR-031). Test strategy: mock `expo-haptics` and assert
  routing per kind/intensity (Driver Contract in `contracts/`).
- **Components** (all under `src/modules/haptics-playground/components/`):
  - `HapticButton.tsx` — themed `Pressable` with label, calls
    `driver.play(...)` on press, and animates a Reanimated *Keyframe* pulse
    (scale + opacity, ~180 ms) on every press regardless of platform
    (FR-008, FR-027–FR-029, constitution III on animations).
  - `PatternSequencer.tsx` — the 8-cell composer. Internal state is
    `(Cell | null)[]` of length 8; each cell tap cycles through the 9
    options per FR-010. The Play handler iterates cells with `setTimeout`
    chained at 120 ms spacing (jest fake timers compatible — see FR-035 and
    Contract). Holds a cancel token in a ref; cleared on re-press, on
    component unmount, and on save (FR-016). Save button delegates to the
    presets store.
  - `PresetList.tsx` — renders saved presets (name + compact preview
    glyphs), tap to replay (delegates back to a parent-supplied `onPlay`
    handler so playback uses the same code path as the composer), and a
    delete affordance per row.
- **Persistence — `presets-store.ts`**: a tiny CRUD facade over AsyncStorage
  under key `spot.haptics.presets`. Exposes `list()`, `save(pattern)`,
  `delete(id)`. `save` auto-generates `id` (timestamp + random suffix) and
  `name` (`Preset N` where N is the smallest positive integer not already
  used). All reads tolerate JSON parse / I/O errors → return `[]`; writes
  catch and surface a typed error so the screen can show an inline notice
  without crashing (FR-024, FR-025, edge case "AsyncStorage write failure").
- **Cross-platform behaviour** is centralised: the *web banner* is rendered
  unconditionally inside `screen.tsx` gated by `Platform.OS === 'web'`
  (single-value branch — permitted by constitution III) and the *no-op*
  lives in `haptic-driver.ts`. Components do not branch on `Platform.OS`.
- **Tests** (jest-expo + RNTL, configured under `test/unit/`): driver,
  store, three component test files, screen integration, and the per-module
  manifest invariants — see `Project Structure` below and
  `contracts/test-plan.md`.

No new runtime dependencies beyond `expo-haptics`. AsyncStorage was already
added by spec 006. No config plugin needed (`expo-haptics` is JS-pure +
autolinks).

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), React 19.2, React Native 0.83.6
**Primary Dependencies**: Expo SDK 55, `expo-router` (typed routes),
`expo-haptics` (NEW — installed via `npx expo install expo-haptics`),
`@react-native-async-storage/async-storage` 2.2 (existing, from spec 006),
`react-native-reanimated` 4.2 + `react-native-worklets` (existing).
**Storage**: `AsyncStorage` under the single key `spot.haptics.presets`. Value
is JSON-serialised `Preset[]`. No migrations — schema is additive (new
optional fields are tolerated by parsing; corrupted entries are skipped per
FR-025).
**Testing**: `jest-expo` 55 + `@testing-library/react-native` 13 with the
existing `test/setup.ts` (already mocks `react-native-reanimated`,
`@react-native-async-storage/async-storage`, `expo-image`, `expo-font`).
`expo-haptics` will be mocked per test file. `jest.useFakeTimers()` for the
sequencer's 120 ms spacing assertions (FR-013 / FR-035 / SC-004).
**Target Platform**: iOS (Taptic Engine), Android (vibrator-equivalent),
Web (no-op + advisory banner). All three platforms render the full UI.
**Project Type**: Mobile + Web single Expo Router project, extended by one
new module folder under `src/modules/`. No new top-level routes, no new
tabs, no native targets, no config plugins.
**Performance Goals**: Single-fire haptic begins firing in under 100 ms from
tap (SC-002); 8-cell sequence inter-cell spacing within ±30 ms of 120 ms
target (SC-004); zero jank on the visual pulse (Reanimated Keyframe runs on
the UI thread per constitution).
**Constraints**: StyleSheet-only styling, `ThemedText` / `ThemedView` only,
`Spacing` scale only (constitution II + IV), `@/` aliases everywhere
(FR-030), strict TS — no `any` in driver or store, no Animated API
(constitution: Reanimated Keyframe + worklets only), no inline
`Platform.select()` for non-trivial divergence (the only `Platform.OS` use
is the single-value web banner gate in `screen.tsx`), no top-level side
effects (driver/store import-safe on web).
**Scale/Scope**: 1 new module, 1 screen, 3 components, 2 leaf modules
(driver + store), 1 manifest entry, 7 test files. ~500–700 LOC total
including tests. No new shell routes or schema.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution: `.specify/memory/constitution.md` v1.1.0 (note: the user
prompt referenced v1.0.1; the on-disk version is v1.1.0 — the new MINOR
section is *Validate-Before-Spec*, addressed below).

| Principle | Compliance | Evidence |
|---|---|---|
| **I. Cross-Platform Parity** | ✅ PASS | The full UI renders on iOS, Android, and Web. iOS uses the Taptic Engine via `expo-haptics`; Android uses the cross-platform `expo-haptics` API which routes to the platform vibrator with closest-equivalent feedback (FR-026); Web shows the advisory banner (FR-027) but every button still produces the visual pulse and the composer + presets remain fully usable (FR-028, FR-029, Story 4 / SC-006). |
| **II. Token-Based Theming** | ✅ PASS | Every text and surface uses `ThemedText` / `ThemedView`. All spacing comes from the `Spacing` scale. Colours are only ever read via `useTheme()`. The web banner is a `ThemedView` with `themeColor`-resolved background, not a hardcoded yellow. |
| **III. Platform File Splitting** | ✅ PASS (with documented single-value branch) | The only `Platform.OS` reference is in `screen.tsx` to conditionally render the web banner — a single-value difference, explicitly permitted by the principle. The web no-op for haptics lives behind `haptic-driver.ts` (a single source file) where the branch is a single early return; this divergence is too small to justify a `.web.ts` split, and keeping it co-located makes the seam easier to test (one file, two paths). If the web stub grows beyond the no-op return, it will be split into `haptic-driver.web.ts` per the principle. |
| **IV. StyleSheet Discipline** | ✅ PASS | All styles via `StyleSheet.create()` in every `.tsx`. No CSS-in-JS, no inline style objects beyond what `StyleSheet.create()` accepts. `Spacing` scale used throughout. |
| **V. Test-First for New Features** | ✅ PASS | Tests under `test/unit/modules/haptics-playground/`: `haptic-driver.test.ts`, `presets-store.test.ts`, `components/HapticButton.test.tsx`, `components/PatternSequencer.test.tsx` (jest fake timers for 120 ms spacing — FR-013 + SC-004), `components/PresetList.test.tsx`, `screen.test.tsx` (integration: three sections + composer + presets + web banner), and `manifest.test.ts` (per-module manifest invariants in addition to the global `test/unit/modules/manifest.test.ts` from spec 006). FR-035 enforces. Story-to-test mapping is in `quickstart.md`. |

**Technology Constraints check**: Expo SDK 55 ✅, `expo-router` typed routes
✅ (no new routes — module dispatched through existing `/modules/[id]`
shell), Reanimated Keyframe API + Worklets only (no Animated API) ✅, pnpm
hoisted ✅, React Compiler enabled ✅ (driver and store are pure modules,
components are pure function components), path aliases honored
(`@/modules/types`, `@/modules/haptics-playground/...`, `@/components/...`,
`@/constants/theme`) ✅, `expo-image` not introduced (no images bundled in
this feature) ✅.

**Validate-Before-Spec check** (Workflow §): Not applicable. This feature
adds no build pipeline, no infrastructure, no external service integration,
and no native module — it is a JS-only consumer of an already-published
Expo SDK 55 library. The "build pipeline / infrastructure / external
service" trigger does not fire. `expo-haptics` is a first-party Expo
package whose API surface is documented and stable for SDK 55; no proof-
of-concept build is required before tasks. Manual on-device verification is
covered in `quickstart.md`.

**Result**: PASS. No constitutional violations. Complexity Tracking
intentionally omitted.

## Project Structure

### Documentation (this feature)

```text
specs/008-haptics-playground/
├── plan.md              # This file (/speckit.plan output)
├── spec.md              # Already authored
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── checklists/          # Pre-existing (e.g., requirements checklist)
└── contracts/
    ├── haptic-driver.md     # JS test-seam contract (kind/intensity routing + web no-op)
    ├── presets-store.md     # AsyncStorage CRUD contract (id/name generation, error tolerance)
    └── test-plan.md         # Story → test-file mapping + fake-timer recipe for the 120 ms sequence
```

### Source Code (repository root)

```text
src/
├── modules/
│   ├── registry.ts                                    # (modified) one new import + one new array entry
│   ├── types.ts                                       # (kept — re-uses spec 006 contract)
│   └── haptics-playground/
│       ├── index.tsx                                  # NEW — exports default ModuleManifest
│       ├── screen.tsx                                 # NEW — three sections + composer + presets + web banner
│       ├── haptic-driver.ts                           # NEW — single test seam over expo-haptics; web no-op
│       ├── presets-store.ts                           # NEW — AsyncStorage CRUD (list/save/delete)
│       ├── types.ts                                   # NEW — Cell, Pattern, Preset shared types
│       └── components/
│           ├── HapticButton.tsx                       # NEW — themed Pressable + Reanimated Keyframe pulse
│           ├── PatternSequencer.tsx                   # NEW — 8 cells + Play + Save preset
│           └── PresetList.tsx                         # NEW — list, tap-to-play, delete

test/unit/
└── modules/
    └── haptics-playground/                            # NEW
        ├── manifest.test.ts                           # per-module invariants (id, platforms, render)
        ├── haptic-driver.test.ts                      # mock expo-haptics; routing per kind/intensity; web no-op
        ├── presets-store.test.ts                      # mock AsyncStorage; CRUD; error tolerance; id uniqueness
        ├── screen.test.tsx                            # integration: 3 sections + composer + presets + web banner
        └── components/
            ├── HapticButton.test.tsx                  # press fires driver; visual pulse triggered
            ├── PatternSequencer.test.tsx              # cycle, play (jest fake timers, 120 ms), cancel, save
            └── PresetList.test.tsx                    # render, tap-to-play, delete
```

**Structure Decision**: Single Expo Router project (existing 006 layout
extended). The module folder is fully *additive* — no existing shell file
is touched except `src/modules/registry.ts` (one import + one entry, per
FR-001). New code is co-located by domain under
`src/modules/haptics-playground/`: the screen, the components, the driver
seam, and the store all live in one folder so the module is grep-able and
deletable as a unit. Tests mirror the source tree under
`test/unit/modules/haptics-playground/`.

## Phase 0 Output

See [`research.md`](./research.md). All `NEEDS CLARIFICATION` items in the
template have been resolved by user-provided guidance, the spec, the
constitution, and prior-art from spec 006 / 007. No build POC required
(see Validate-Before-Spec check above).

## Phase 1 Output

- [`data-model.md`](./data-model.md) — entities: `HapticKind`,
  `HapticIntensity`, `Cell`, `Pattern`, `Preset`, `PresetsStoreError`.
- [`contracts/haptic-driver.md`](./contracts/haptic-driver.md) — the JS
  test seam contract every component and the composer must honour, plus the
  per-platform behaviour table.
- [`contracts/presets-store.md`](./contracts/presets-store.md) — the
  AsyncStorage CRUD contract: shape, key, id/name generation, error
  tolerance.
- [`contracts/test-plan.md`](./contracts/test-plan.md) — story → test
  mapping, jest fake-timer recipe for the 120 ms sequencer assertion, and
  RNTL patterns for the screen integration test.
- [`quickstart.md`](./quickstart.md) — install / dev / on-device
  verification matrix + the cross-platform smoke list.
- Agent context updated: the `<!-- SPECKIT START -->` block in
  `.github/copilot-instructions.md` now points at
  `specs/008-haptics-playground/plan.md`.

**Re-evaluation of Constitution Check after Phase 1 design**: Still PASS.
The contracts are pure documentation, not new shell coupling. The driver
and store are leaf modules — no other file in `src/` imports them outside
of `src/modules/haptics-playground/`. The single `Platform.OS` reference is
re-confirmed as the only branch and lives in `screen.tsx`, which is the
permitted single-value usage. No new dependency beyond `expo-haptics` (the
target SDK 55 first-party JS-pure package) is required.

## Open Questions Flagged

None. Items deferred to a future spec — custom AHAP curves, audio sync,
gesture recording, preset sharing/sync, edit/rename UI, tempo controls — are
listed in spec.md's *Out of Scope* section and explicitly excluded here.
