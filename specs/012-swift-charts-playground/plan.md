# Implementation Plan: Swift Charts Playground

**Branch**: `012-swift-charts-playground` | **Date**: 2026-04-28 | **Spec**: [spec.md](./spec.md)
**Input**: [`specs/012-swift-charts-playground/spec.md`](./spec.md)

## Summary

Add a new module `swift-charts-lab` to the iOS Feature Showcase plugin
registry that demos Apple's **Swift Charts** framework. On iOS 16+ the
screen renders a real native chart (Line / Bar / Area / Point) backed
by Apple's `Charts` framework; on Android, Web, and iOS < 16 the same
controls drive a `<View>`-only React Native bar fallback (line / area
emulated as "step bars", point as small dots), with an "iOS 16+ only"
banner. State (chart type, dataset, tint, gradient toggle) is local
React state. The change is purely additive — exactly one import line
plus one array entry in `src/modules/registry.ts`. Tests are JS-pure
(Jest + RNTL); the iOS Swift native code is verified manually on
device per `quickstart.md`.

The chart-host integration was originally planned to use
`@expo/ui/swift-ui`'s Chart bindings to mirror feature 010
(`swiftui-interop`). Verification against the live SDK 55 docs
confirmed `@expo/ui/swift-ui` does **not** export a `Chart` binding
(only the SwiftUI primitives — `Button`, `Slider`, `Picker`,
`ColorPicker`, `DatePicker`, `Stepper`, `Toggle`, `CircularProgress`,
`LinearProgress`, layout primitives, `Host`, `RNHostView`, etc.).
Per the planning instructions, the deviation is documented in
`research.md` Decision 1 and the implementation falls back to a thin
local Swift `ChartView` extension built with the @expo/ui extension
recipe (`createViewModifierEventListener` + `UIBaseViewProps`) — the
same pattern @expo/ui's docs prescribe for "missing View / modifier"
cases. The TS surface lives at
`components/ChartView.tsx` and exports a tiny prop contract
(`type`, `data`, `tint`, `gradientEnabled`, `selectedIndex`,
`onSelect`) so per-platform variants and tests can be written against
the same shape.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), React 19.2, React
Native 0.83, Expo SDK 55. Swift 5.9 / iOS 16+ for the native
`ChartView` extension. Constitution v1.0.1 / v1.1.0 — both impose
the same gates (TS strict, StyleSheet, ThemedText/ThemedView, `@/*`
alias, test-first, cross-platform parity).
**Primary Dependencies**: `@expo/ui` (~55.0.12, **already installed**
via feature 010), `expo-modules-core` (transitive), and
`react-native` for the fallback. The Swift `ChartView` view extension
is a project-local module under
`src/modules/swift-charts-lab/native/ios/` registered through the
@expo/ui extension recipe; no new npm package is added. Existing:
`@/components/themed-*`, `@/constants/theme` (`Spacing`),
`@/hooks/use-theme`.
**Storage**: N/A. All state is `useState` / `useReducer` local to
the screen and discarded on unmount (FR-040, Out of Scope:
persistence).
**Testing**: Jest 29.7 + `@testing-library/react-native` 13.3 on
the Windows host (no native runtime). The `ChartView.tsx` file is
the single seam tests mock — its iOS variant imports from
`@expo/ui/swift-ui` plus the local view name, so tests
`jest.mock('@expo/ui/swift-ui', …)` and the project's existing
`@expo/ui` jest setup (from feature 010) carries over. The
`.android.tsx` and `.web.tsx` variants use plain `<View>` /
`<Text>` and are tested directly via the explicit-filename import
pattern established in feature 006 (`require('./ChartView.web')`,
`require('./ChartView.android')`). On-device verification is
documented in `quickstart.md`.
**Target Platform**: iOS 16+ for the real Swift Charts host
(FR-001, `minIOS: '16.0'` set on the manifest, gated by spec 006's
existing dispatch). Android, Web, and iOS < 16 always render the
RN fallback (FR-028 / FR-029 / FR-030).
**Project Type**: mobile-app (Expo Router single project).
**Performance Goals**: SC-001 — first chart visible < 5 s after
opening the module on iOS 16+. SC-005 — tint transition < 300 ms.
SC-002 — chart-type switch animates without dropped frames at the
default 12-point dataset on a baseline iPhone (iPhone 12). SC-003 —
mark-mutation animations (Randomize / Add / Remove) complete in <
1 s. The fallback path is `<View>`-only with width / height tied to
`useState`; no animation library work is required for v1 (a
`LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)`
call before each set-state on the fallback satisfies the
"visible animated transition" wording of FR-013 / FR-014 / FR-015
on iOS / Android; on Web `LayoutAnimation` is a no-op and the
update is a one-frame swap, which is acceptable per the spec's
fallback wording).
**Constraints**: Additive only (SC-010 — exactly one import line +
one array entry added to `src/modules/registry.ts`). No new global
state, contexts, or persistence (FR-040). All styles via
`StyleSheet.create()` and the `Spacing` scale (FR-041). TypeScript
strict, `@/*` alias (FR-042). No new lint/test tooling (FR-042).
The four tint swatches MAY introduce a small palette of hardcoded
swatch colors — explicitly permitted by spec Assumptions. The
iOS-only Swift Charts symbol MUST NOT be evaluated at module load
time on Android / Web (FR-031); platform-split files (`*.ios.tsx`
/ `*.android.tsx` / `*.web.tsx`) are the mechanism.
**Scale/Scope**: 1 module, 1 screen (3 platform variants), 1
`ChartView` (3 platform variants), 3 control components
(`ChartTypePicker`, `TintPicker`, `DataControls`), 1 `data.ts`
module with deterministic seedable generators, 1 manifest, 1 thin
Swift extension under `native/ios/`. ~13 source files, ~13 test
files.

### Library decision: `@expo/ui/swift-ui` (with documented deviation) + local Swift `ChartView` extension

`@expo/ui` v55 is the project's standard SwiftUI bridge (introduced
in feature 010 / `swiftui-interop`). It would be the preferred way
to host Apple's Swift Charts so this module would compose visually
and architecturally with feature 010. Verification against the
SDK 55 docs (`https://docs.expo.dev/versions/v55.0.0/sdk/ui/swift-ui/`
and `llms-full.txt`, fetched 2026-04-28) confirms `@expo/ui/swift-ui`
ships `Button`, `CircularProgress`, `ColorPicker`, `DatePicker`,
`Form`, `HStack`, `Host`, `Image`, `LinearProgress`, `List`,
`Picker`, `RNHostView`, `Section`, `Slider`, `Spacer`, `Stepper`,
`Text`, `Toggle`, `VStack`, etc., plus a modifier set under
`@expo/ui/swift-ui/modifiers` — but **no `Chart` / `LineMark` /
`BarMark` / `AreaMark` / `PointMark` exports**. `research.md`
Decision 1 records this deviation and selects the @expo/ui
extension path: a local Expo module exposing a Swift
`ChartView: ExpoView` whose body is a SwiftUI `Chart { … }` with
`LineMark` / `BarMark` / `AreaMark` / `PointMark` driven by
JS-passed props. The TS-side wrapper imports the view name from the
local module via `requireNativeViewManager` and is callable from
inside `<Host>` exactly as if it were a built-in @expo/ui
component. This keeps the JS architecture aligned with feature 010
(props-only, no imperative API, no host-shell coupling) while still
delivering real Apple Charts marks on iOS 16+.

If during the implement phase the @expo/ui extension recipe proves
incompatible with `Charts` (e.g. SwiftUI body can't capture the
JS-passed `data` array reactively in the way the recipe's prop
class supports), the fallback documented in `research.md`
Decision 1 is to drop the @expo/ui dependency for this module and
expose the same Swift `ChartView` directly via `expo-modules-core`'s
`ViewDefinition` API — same Swift body, different TS-side import
(`requireNativeViewManager('SwiftChartsLabChartView')` instead of
the @expo/ui Host child path). Either way the TS prop contract
(`{ type, data, tint, gradientEnabled, selectedIndex, onSelect }`)
is unchanged and the tests do not need to change.

## Constitution Check

Constitution at `.specify/memory/constitution.md` (v1.0.1 per
spec Assumptions; file currently shows v1.1.0 — both versions
impose the same gates evaluated below).

| Principle | Status | How this plan complies |
|---|---|---|
| I. Cross-Platform Parity | ✅ | Module declares all three platforms (FR-001). Every control (chart-type segmented control, dataset buttons, tint swatches, gradient toggle) renders on every platform with the same enable/disable semantics (FR-029). The chart region renders on every platform — Swift Charts on iOS 16+, RN bar fallback otherwise (FR-006(c), FR-028, FR-030). The "iOS 16+ only" banner makes the fallback state legible to the user (FR-028). |
| II. Token-Based Theming | ✅ | All chrome (cards, banner, control rows, readouts) uses `ThemedText` / `ThemedView` / theme colors via `useTheme()`. Inline dynamic styles are limited to single-value props (`width`, `height`, `transform`) computed from React state, which the constitution permits as "single-value differences". The four tint swatches use a small hardcoded palette explicitly permitted by spec Assumptions (a "tint picker is intrinsically about specific colors"). The Swift Charts marks pick up the active tint via the `tint` prop forwarded into the SwiftUI `Chart` body and applied with `.foregroundStyle(.<tintColor>)`. |
| III. Platform File Splitting | ✅ | Per FR-031, the iOS-only Swift Charts symbol MUST NOT be evaluated at module load time on non-iOS-16+ targets. We use `.ios.tsx` / `.android.tsx` / `.web.tsx` siblings on `screen` and `components/ChartView` (and on every test that needs to pin the platform variant). No inline `Platform.OS` branching is required; the bundler resolves the right file. |
| IV. StyleSheet Discipline | ✅ | All styles via `StyleSheet.create()` using the `Spacing` scale (FR-041). Animated style values on the fallback (`bar.width`, `bar.height`, `bar.transform`) are passed as inline style **values** computed from state — permitted as a "single-value difference" by the constitution. No CSS-in-JS, no inline style objects defined outside StyleSheet, no utility classes. The `LayoutAnimation.configureNext(...)` call before each fallback set-state is a one-line built-in RN call, not a styling library. |
| V. Test-First for New Features | ✅ | Per FR-044 plus the user's expanded test list: `data.test.ts`, `components/ChartView.test.tsx`, `components/ChartView.android.test.tsx`, `components/ChartView.web.test.tsx`, `components/ChartTypePicker.test.tsx`, `components/TintPicker.test.tsx`, `components/DataControls.test.tsx`, `screen.test.tsx`, `screen.android.test.tsx`, `screen.web.test.tsx`, `manifest.test.ts`. Tests are written alongside or before each implementation file. JS-only; the Swift native code path is verified manually per `quickstart.md` (Constitution Principle V exemption clause: "Existing untested code does not need retroactive coverage" — applied here only to the Swift native body, not the TS contract that wraps it; the TS contract is fully tested via mocks). |
| Tech constraints (TS strict, `@/*` alias, no Animated API, no inline-style libs) | ✅ | Module is plain RN + a small `@expo/ui`-style native extension. No `Animated` API usage; the fallback uses `LayoutAnimation` (built into RN, distinct from the deprecated `Animated` API named in the constitution) for one-shot ease-in-out transitions. Reanimated is not needed for v1 — the spec's animation requirements are satisfied by `LayoutAnimation` on the fallback and Swift Charts' built-in mark animations on iOS 16+. Imports use `@/modules/...`, `@/components/...`, `@/constants/theme`. |
| Validate-Before-Spec (build-pipeline features) | n/a | This is a feature module, not a build/infra change. The `@expo/ui` Chart-binding probe is captured in `research.md` Decision 1 (against live SDK 55 docs) before any Swift code is written, satisfying the spirit of the gate. |

**Gate result**: PASS. No Complexity Tracking entries required.

### Resolved [NEEDS CLARIFICATION] markers from spec.md

Three markers are resolved here per the planning instructions
(autonomously with reasonable defaults):

1. **Configured maximum series size (FR-012)**: **24**. Rationale:
   the spec's recommended planning default; lets the user
   approximately double the initial 12-point dataset via Add point
   before the button disables (six taps to fill, six taps to drain).
   Encoded as `MAX_SERIES_SIZE = 24` in `data.ts`. The minimum is
   **2** (the spec's hard floor — a chart with 1 point is
   degenerate).
2. **Month label sequence past December (FR-014)**: wrap back to
   January with an appended year-offset suffix
   (`'Jan ʼ27'`, `'Feb ʼ27'`, …, where `ʼ27` is shorthand for
   "year +1 from the initial Jan…Dec block"). Reasoning: the
   recommended default in the spec; "wrap to January" alone makes
   labels ambiguous (two "January" entries side by side); the year
   suffix uses a single character that fits on a chart axis tick at
   the typical font size and is visually distinguishable. The
   wrapping rule is: the initial 12 entries are unsuffixed; entries
   13–24 carry `ʼ27`; if the spec ever raises the maximum past 24
   the suffix increments. Encoded in `data.ts`'s `nextMonthLabel`
   helper.
3. **Fallback selection affordance (FR-027)**: **omitted in v1**.
   The fallback bar chart does not implement mark selection. The
   "iOS 16+ only" banner copy includes a single sentence
   ("Mark selection is available on iOS 16+ only.") to make the
   omission discoverable. Reasoning: the spec recommends omission;
   selection on the fallback would either require extra hit-test
   plumbing or feel inconsistent with the simple bar visual. A
   future spec MAY add it without breaking this contract.

These resolutions are recorded both in `research.md` Decision 5 and
referenced in the relevant data-model entries.

## Project Structure

### Documentation (this feature)

```text
specs/012-swift-charts-playground/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output (manual on-device steps)
├── contracts/
│   ├── module-manifest.md   # Manifest contract (extends @/modules/types)
│   ├── chart-view.md        # ChartView TS prop contract (single seam)
│   └── dataset.md           # Dataset / DataPoint / generator contract
├── spec.md
└── checklists/
```

### Source Code (repository root)

```text
src/modules/swift-charts-lab/
├── index.tsx                       # ModuleManifest export (minIOS: '16.0')
├── screen.tsx                      # iOS variant (banner suppressed)
├── screen.android.tsx              # Android variant (banner shown)
├── screen.web.tsx                  # Web variant (banner shown)
├── data.ts                         # Dataset + generators (deterministic via seed)
├── components/
│   ├── ChartView.tsx               # iOS: real Swift Charts via @expo/ui Host + local extension
│   ├── ChartView.android.tsx       # Android fallback: <View>-based bars / step bars / dots
│   ├── ChartView.web.tsx           # Web fallback: same surface as Android
│   ├── ChartTypePicker.tsx         # Segmented control (Line / Bar / Area / Point)
│   ├── TintPicker.tsx              # Four swatches with selected-state ring
│   └── DataControls.tsx            # Randomize / Add point / Remove point + Show foreground style
└── native/ios/                     # Swift extension scaffolding (built with EAS Build)
    ├── ChartView.swift             # SwiftUI Chart body
    ├── ChartViewProps.swift        # @expo/ui-style UIBaseViewProps subclass
    └── ChartViewModule.swift       # Expo module registration

src/modules/registry.ts             # +1 import line, +1 array entry (only edit outside the module dir)
```

```text
test/unit/modules/swift-charts-lab/
├── manifest.test.ts                          # id / platforms / minIOS=16.0 invariants
├── data.test.ts                              # Generator length, value range, determinism, mutation invariants
├── screen.test.tsx                           # iOS: composition, default state, prop wiring (no banner)
├── screen.android.test.tsx                   # Android: banner shown, fallback composed, control wiring
├── screen.web.test.tsx                       # Web: banner shown, fallback composed
└── components/
    ├── ChartView.test.tsx                    # iOS: mocks @expo/ui exports; asserts data/type/tint/gradient props
    ├── ChartView.android.test.tsx            # Android: explicit-filename import; asserts bars / step bars / dots
    ├── ChartView.web.test.tsx                # Web: explicit-filename import; same assertions as android
    ├── ChartTypePicker.test.tsx              # Default selection, change callback, a11y labels
    ├── TintPicker.test.tsx                   # Default selection, change callback, non-color selected indicator
    └── DataControls.test.tsx                 # Button enable/disable at min/max, callbacks, a11y labels
```

**Structure Decision**: Mirrors the per-module manifest pattern of
`src/modules/swiftui-interop/` (feature 010) and
`src/modules/sf-symbols-lab/` (feature 008). Unlike
`sensors-playground` (feature 011), this module **does** require
platform-split files because the iOS-only Swift Charts symbol must
not be evaluated at module load time on non-iOS-16+ targets
(FR-031). The platform-split surface is intentionally small — only
`screen.*.tsx` and `components/ChartView.*.tsx` split. All controls
(`ChartTypePicker`, `TintPicker`, `DataControls`) and the dataset
module (`data.ts`) are platform-agnostic and live as single files.
The `ChartView` is the **single seam** for both the native bridge
and the fallback: every test that needs to drive the chart imports
the explicit-filename variant via the feature-006 pattern
(`require('./ChartView.android').ChartView`); the iOS variant is
verified by mocking `@expo/ui/swift-ui` and the local native view
name (`'SwiftChartsLabChartView'`).

## Complexity Tracking

> No constitutional violations. Section intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
