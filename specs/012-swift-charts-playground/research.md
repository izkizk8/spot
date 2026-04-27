# Phase 0 Research: Swift Charts Playground

All NEEDS CLARIFICATION items from the spec are closed in Decision 5.
Library decision (the @expo/ui Chart probe) is captured in Decision 1
from the live SDK 55 docs. Implementation strategy follows in
Decisions 2–8.

## Decision 1: `@expo/ui/swift-ui` Chart bindings — probed and ABSENT; fall back to a thin local Swift extension

- **Decision**: `@expo/ui/swift-ui` v55 does **not** export a `Chart`
  binding. The implementation MUST host Apple's `Charts` framework
  via a project-local Swift view extension authored with the
  @expo/ui extension recipe
  (`https://docs.expo.dev/guides/expo-ui-swift-ui/extending/`):
  a `ChartViewProps: UIBaseViewProps` class, a `ChartView: ExpoView`
  whose body is a SwiftUI `Chart { … }`, and a TS-side wrapper at
  `src/modules/swift-charts-lab/components/ChartView.tsx` that
  registers the view with `requireNativeViewManager` and is composed
  inside `<Host>` like a built-in @expo/ui component. If the
  @expo/ui extension recipe proves incompatible with
  `Charts` (e.g. data array reactivity into the SwiftUI body), the
  documented fallback is to drop `<Host>` for this module and use
  `expo-modules-core`'s plain `ViewDefinition` API directly — same
  Swift body, simpler TS-side wrapper. The TS prop contract is
  unchanged either way (see `contracts/chart-view.md`).
- **Verification**: Fetched
  `https://docs.expo.dev/versions/v55.0.0/sdk/ui/swift-ui/` and
  `https://docs.expo.dev/llms-full.txt` on 2026-04-28. Imports
  documented under `@expo/ui/swift-ui` are: `Button`,
  `CircularProgress`, `ColorPicker`, `DatePicker`, `Form`, `HStack`,
  `Host`, `Image`, `LinearProgress`, `List`, `Picker`, `RNHostView`,
  `Section`, `Slider`, `Spacer`, `Stepper`, `Text`, `Toggle`,
  `VStack`, plus the modifier set under
  `@expo/ui/swift-ui/modifiers`. There is **no** `Chart`,
  `LineMark`, `BarMark`, `AreaMark`, or `PointMark` export. The
  Expo docs' single chart-related how-to
  (`/modules/third-party-library` "create a radial chart") uses
  the `expo-modules-core` `ViewDefinition` path with a third-party
  iOS chart library, confirming that hosting Apple's `Charts`
  framework requires a project-local view extension.
- **Rationale**: The user's planning input prefers `@expo/ui/swift-ui`
  to keep the showcase consistent with feature 010
  (`swiftui-interop`). The extension recipe is the project-aligned
  way to add a missing SwiftUI view — the resulting JS code still
  composes inside `<Host>` and the props-only API surface is
  identical to the rest of feature 010. The deviation from
  "use a built-in @expo/ui component" is forced by upstream's
  feature set, not by a project-side preference.
- **Alternatives considered**:
  - Wait for `@expo/ui` to add Chart bindings — rejected: no
    upstream issue or PR found; spec target ship date is now.
  - Use `react-native-svg` + a JS reimplementation — rejected:
    spec FR-030 forbids new charting dependencies on the fallback
    path, and using a JS chart on iOS would defeat the module's
    "real Swift Charts" purpose.
  - Pure `expo-modules-core` `ViewDefinition` (no @expo/ui Host) —
    documented as the **fallback** if the @expo/ui extension recipe
    proves unworkable; rejected as the primary path because it
    misses the chance to keep the JS composition consistent with
    feature 010.

### Swift body sketch (recorded so the implement phase doesn't have to derive it)

```swift
import SwiftUI
import Charts
import ExpoModulesCore

@available(iOS 16.0, *)
struct ChartBody: View {
  let type: String   // "line" | "bar" | "area" | "point"
  let data: [(String, Double)]
  let tint: Color
  let gradientEnabled: Bool
  @Binding var selectedIndex: Int?

  var body: some View {
    Chart {
      ForEach(Array(data.enumerated()), id: \.offset) { index, point in
        switch type {
        case "bar":   BarMark(x: .value("Month", point.0), y: .value("Value", point.1))
        case "area":  AreaMark(x: .value("Month", point.0), y: .value("Value", point.1))
        case "point": PointMark(x: .value("Month", point.0), y: .value("Value", point.1))
        default:      LineMark(x: .value("Month", point.0), y: .value("Value", point.1))
        }
      }
      .foregroundStyle(
        gradientEnabled && (type == "line" || type == "area")
          ? AnyShapeStyle(LinearGradient(colors: [tint, tint.opacity(0.2)],
                                         startPoint: .top, endPoint: .bottom))
          : AnyShapeStyle(tint)
      )
    }
    .animation(.easeInOut(duration: 0.3), value: data.map(\.1))
    .chartXSelection(value: $selectedIndex)  // iOS 17+; iOS 16 falls back to a tap gesture
  }
}
```

The `chartXSelection` call requires iOS 17; on iOS 16 the Swift body
falls back to a `simultaneousGesture(SpatialTapGesture()...)` that
emits the nearest index via the prop event. This is recorded as a
v1 implementation detail; the JS-side prop contract
(`selectedIndex` + `onSelect(index | null)`) is unchanged.

## Decision 2: Fallback chart implementation (Android / Web / iOS < 16)

- **Decision**: A single `ChartView.<platform>.tsx` per non-iOS
  target renders the dataset using only `<View>` and `<Text>`
  primitives:
  - **Bar**: a horizontal flex row of N `<View>`s, each with
    `width = (containerWidth - gaps) / N` and
    `height = (value / maxAbs) * chartHeight`.
  - **Line / Area** (the user-input "step bars" emulation): the same
    bar layout, but each bar's height is the value, and a thin
    horizontal `<View>` at the top of each bar provides the
    "line" silhouette. For **Area**, the bar fill uses the active
    tint at full opacity; for **Line**, the bar fill uses the tint
    at 0.15 opacity and the top stripe carries the full-tint
    "line".
  - **Point**: each column is a small (10 pt) `<View>` with
    `borderRadius: 5`, positioned at
    `bottom = (value / maxAbs) * chartHeight - 5`.
  - The active **tint** is applied as `backgroundColor` to the bar
    fill / line stripe / dot.
  - The **gradient toggle** is honoured on Bar by setting the
    `<View>`'s style to layer a translucent overlay (a stacked
    second `<View>`) so the bar appears to fade vertically — this
    is the "where feasible" path of FR-023. On Line / Area / Point
    the toggle is recorded but has no visible effect on the
    fallback (acceptable per FR-023's "or a flat tinted fill" clause).
- **Animations**: A single
  `LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)`
  call before each `setData()` / `setType()` produces the visible
  animated transition required by FR-013 / FR-014 / FR-015 on the
  fallback path. `LayoutAnimation` is a built-in RN API, not the
  deprecated `Animated` API named in the constitution. On Web,
  `LayoutAnimation` is a no-op; the swap is single-frame, which is
  acceptable for the fallback per the spec's wording
  ("the fallback chart MUST visibly update in response to that
  interaction" — visible after one frame counts).
- **`BarChart` reuse from feature 011**: The existing
  `src/modules/sensors-playground/components/BarChart.tsx` is
  hard-coded to a 3-row sliding-window visualization
  (x / y / z axes), not a per-data-point visual, so it is **not
  directly reusable** for this module's fallback. The simpler
  inline bar fallback documented above is used instead. This
  decision keeps feature 011 untouched — SC-010's
  "exactly one line in `registry.ts`" invariant is preserved with
  no exception.
- **Rationale**: All five spec controls drive a fallback that's
  legibly responsive on every non-iOS-16+ target, with no new
  charting dependency (FR-030) and no edits to feature 011's
  module (SC-010).
- **Alternatives considered**:
  - Reuse `BarChart` from feature 011 with an additive prop —
    rejected: would require an additive export change in feature 011
    and a new "samples-from-discrete-points" mode; the spec's
    SC-010 exception clause permits this only "if and only if the
    `BarChart` reuse path of FR-030 is taken", and the bespoke
    inline fallback is simpler.
  - Implement a richer SVG fallback with `react-native-svg` —
    rejected: spec FR-030 forbids new charting dependencies and
    SVG would inflate the surface area beyond the
    "intentionally simple bar visual" wording in Out of Scope.
  - Reanimated `Keyframe` animations on each bar — possible (and
    the constitution's preferred animation API), but not required
    for v1; `LayoutAnimation` is a one-line affordance that
    satisfies the spec's "visible animated transition" wording.
    Recorded as a possible v2 upgrade if smoother transitions are
    desired.

## Decision 3: State shape and update flow

- **Decision**: All five user-visible state slices live in
  `screen.tsx` (and its platform variants) as `useState`:

  ```ts
  const [chartType, setChartType]   = useState<ChartType>('line');
  const [data, setData]             = useState<readonly DataPoint[]>(initialDataset);
  const [tint, setTint]             = useState<Tint>(TINTS[0]);
  const [gradientEnabled, setGrad]  = useState<boolean>(false);
  const [selectedIndex, setSelected] = useState<number | null>(null); // iOS only
  ```

  Each control component receives a value + an onChange callback;
  no shared context, no reducer required for v1. The dataset
  controls go through the `data.ts` helpers
  (`randomize(seed?)`, `addPoint(data, seed?)`,
  `removePoint(data)`) so the screen's onPress handlers are
  one-liners.
- **Reset of `selectedIndex` (FR-026)**: the screen wraps the
  `chartType` setter and the three dataset setters in a small
  helper that also calls `setSelected(null)` — making the dismiss
  semantics atomic with the cause. The on-iOS Swift Charts host
  also calls `onSelect(null)` when the user taps outside any mark.
- **Rationale**: Fits FR-040 (no new global stores or contexts).
  Local state is the minimum viable pattern for five independent
  slices that don't need to cross screen boundaries.
- **Alternatives considered**:
  - `useReducer` with an action enum — rejected: overengineered for
    five flat slices and four mutators; reducer adds indirection
    that hurts test legibility.
  - Lift to a context — rejected by FR-040 and the
    "no global stores" wording.

## Decision 4: Test strategy

- **Decision**: Jest + `@testing-library/react-native`. Three
  layers of mocking, applied per test (mirroring feature 011's
  approach):
  1. **`data.test.ts`**: pure utility — no mocks. Covers
     `initialDataset()` length === 12 and labels Jan…Dec;
     `randomize(seed)` is deterministic for a given seed and
     keeps length unchanged; values fall within
     `[VALUE_MIN, VALUE_MAX]`; `addPoint` appends one with the
     correct next month label (December → "Jan ʼ27"); `addPoint`
     refuses past `MAX_SERIES_SIZE`; `removePoint` pops the last
     item; `removePoint` refuses at `MIN_SERIES_SIZE`.
  2. **`components/ChartView.test.tsx` (iOS)**: mocks
     `@expo/ui/swift-ui` so `Host` is a passthrough `<View>` and
     the local native view name is a recorded `<View>` whose
     props are inspected. Asserts the JSX receives `type`,
     `data`, `tint`, `gradientEnabled`, and that switching props
     re-renders. (See `contracts/chart-view.md`.)
  3. **`components/ChartView.android.test.tsx` and
     `components/ChartView.web.test.tsx`**: explicit-filename
     import per the feature-006 pattern
     (`require('./ChartView.android').ChartView`) so the iOS
     variant is never evaluated. Asserts: `type='bar'` renders N
     bars, `type='line'`/`'area'` renders bars + top stripes,
     `type='point'` renders dots; tint propagates to
     `backgroundColor`; `data.length` reflected in rendered child
     count; `gradientEnabled` toggles the overlay child on Bar
     and is a documented no-op elsewhere.
  4. **`screen.test.tsx` / `screen.android.test.tsx` /
     `screen.web.test.tsx`**: integration. iOS asserts no banner;
     android/web assert banner present. All three assert that
     pressing each segment of `ChartTypePicker` updates the
     `ChartView`'s `type` prop; tapping Randomize swaps the
     `data` prop reference; Add/Remove change `data.length` by
     ±1; tapping a swatch updates `tint`; the gradient toggle
     updates `gradientEnabled`. Tests stub `ChartView` to a
     prop-recording `<View>` so they don't have to instantiate
     the real fallback / native bridge.
  5. **Control component tests** (`ChartTypePicker.test.tsx`,
     `TintPicker.test.tsx`, `DataControls.test.tsx`): verify
     default selection, change callback fires with the right
     argument, accessibility label matches the FR-034 wording,
     selected-state non-color indicator (FR-035) is rendered for
     `TintPicker`, disabled state for Add/Remove at bounds
     (FR-036) is reflected in `accessibilityState.disabled`.
  6. **`manifest.test.ts`**: `id === 'swift-charts-lab'`,
     `platforms === ['ios','android','web']`, `minIOS === '16.0'`,
     `render` is a function, manifest is included in
     `MODULES` from `@/modules/registry`.
- **Coverage of FR-031** (no iOS-only symbol evaluated at module
  load on non-iOS): enforced statically by the file-split design
  (`ChartView.android.tsx` / `ChartView.web.tsx` do not import
  `@expo/ui/swift-ui`) and verified at test time by
  `screen.android.test.tsx` and `screen.web.test.tsx` rendering
  cleanly without any `jest.mock('@expo/ui/swift-ui', …)` setup —
  if the iOS variant were resolved by the bundler on those
  targets, the test would crash with a missing native module error.
- **No native runtime is invoked.** Jest runs on the Windows host.
  Manual on-device verification of Apple Charts' real animation,
  selection gesture, and gradient rendering is in `quickstart.md`
  (Constitution Principle V's "manual verification" allowance for
  platform-only behavior).

## Decision 5: Resolved [NEEDS CLARIFICATION] markers

Three markers in `spec.md` are closed here per the planning
instructions:

1. **`MAX_SERIES_SIZE`**: **24**. Encoded in `data.ts`. Rationale
   in `plan.md` "Resolved [NEEDS CLARIFICATION]" section. Tests in
   `data.test.ts` and `DataControls.test.tsx` assert the bound and
   the Add-disabled state at 24.
2. **Month label sequence past December**: wrap to
   `'Jan ʼ27'`, `'Feb ʼ27'`, …, distinguishing the second pass
   with a Unicode right-single-quote (`U+02BC`) plus a 2-digit
   suffix that increments per full wrap. Encoded as the
   `nextMonthLabel(prev: string): string` helper in `data.ts`.
   Tests assert `nextMonthLabel('Dec') === 'Jan ʼ27'` and
   `nextMonthLabel('Dec ʼ27') === 'Jan ʼ28'`.
3. **Fallback selection affordance (FR-027)**: omitted in v1. The
   "iOS 16+ only" banner copy includes the sentence
   "Mark selection is available on iOS 16+ only." so the omission
   is discoverable without a follow-up spec.

## Decision 6: Tint palette (the four swatches)

- **Decision**: Hardcoded palette of four ergonomic chart-friendly
  hues, encoded in `data.ts`:

  ```ts
  export const TINTS = [
    { id: 'blue',   value: '#007AFF' }, // iOS systemBlue
    { id: 'green',  value: '#34C759' }, // iOS systemGreen
    { id: 'orange', value: '#FF9500' }, // iOS systemOrange
    { id: 'purple', value: '#AF52DE' }, // iOS systemPurple
  ] as const;
  ```

  These are the only hardcoded colors permitted by spec
  Assumptions ("the four tint swatches MAY introduce a small
  palette of hard-coded swatch colors since 'tint picker' is
  intrinsically about specific colors"). The first swatch
  (`'blue'`) is the default selected tint (FR-019).
- **Rationale**: iOS system colors are visually consistent with the
  Swift Charts marks on iOS 16+ and remain legible against both
  the light and dark themed backgrounds. Four hues comfortably fit
  in a single horizontal row at iPhone widths.
- **Selected-state indicator (FR-035)**: each swatch renders a
  ring (a `borderWidth: 3` + `borderColor: theme.text`) when
  selected and a checkmark glyph (`'✓'`) at its centre — both
  non-color indicators per the spec.

## Decision 7: Initial dataset shape and value range

- **Decision**: 12 entries, labels `'Jan'` through `'Dec'`, values
  rounded to 1 decimal in the closed interval `[VALUE_MIN,
  VALUE_MAX] = [-10, 30]` (mock-temperature, satisfies FR-011's
  "plausible mock-temperature range" wording with both above-zero
  and below-zero values to make the chart's y-axis interesting).
  Encoded in `data.ts` as:

  ```ts
  export const VALUE_MIN = -10;
  export const VALUE_MAX = 30;
  export function initialDataset(): readonly DataPoint[];
  export function randomize(seed?: number): readonly DataPoint[];
  export function addPoint(data: readonly DataPoint[], seed?: number): readonly DataPoint[];
  export function removePoint(data: readonly DataPoint[]): readonly DataPoint[];
  ```

  `initialDataset()` is **deterministic** — values are derived from
  a fixed seasonal curve (`-5 + 25 * sin(monthIndex * π / 6)`)
  jittered by a fixed seed so tests can pin them. `randomize(seed)`
  uses a small mulberry32 PRNG so test runs can pass a fixed seed
  for reproducibility (FR-044 / quality gate).
- **Rationale**: Determinism lets `data.test.ts` assert exact
  values without flakiness; the seasonal curve makes the initial
  chart visually obviously a "year of temperatures" rather than
  random noise.
- **Alternatives considered**:
  - `Math.random()` everywhere — rejected: non-deterministic,
    makes `data.test.ts` brittle.
  - A fixed array literal for `initialDataset()` — works but feels
    arbitrary; the seasonal curve communicates intent.

## Decision 8: Quality gates

- **Decision**: `pnpm check` (defined as `pnpm format:check &&
  pnpm lint && pnpm typecheck && pnpm test`) must pass with no
  warnings introduced (SC-011 / FR-043).
- **Rationale**: Single project-wide gate, no new tooling.
- **Alternatives considered**: a module-scoped gate — rejected;
  the project canonical gate is `pnpm check`.

## Open items

None. The library decision is documented above (deviation recorded
per planning instructions); all NEEDS CLARIFICATION items are
closed; all API uncertainties are pinned to the live SDK 55 docs.
If implement-phase discovery reveals a behavior contradicting any
decision above (e.g. `chartXSelection` semantics differ on iOS 16),
back-patch this file and the spec per the constitution's spec
back-patching workflow before the affected task is marked done.
