# Contract: `ChartView` (the single seam)

`ChartView` is the only file in the module with a platform-split
implementation. All three variants
(`components/ChartView.tsx`, `.android.tsx`, `.web.tsx`) MUST
export a single named component `ChartView` matching the
`ChartViewProps` shape below. The screen composes it as a
black box; tests treat it as the single mock seam.

## Prop shape

```ts
import type { ChartType, Dataset, Tint } from '../data';

export interface ChartViewProps {
  /** Which mark type to render. */
  readonly type: ChartType;            // 'line' | 'bar' | 'area' | 'point'
  /** Series data. */
  readonly data: Dataset;              // readonly DataPoint[]
  /** Active tint (drives mark fill / stroke / dot color). */
  readonly tint: Tint;                 // { id, value }
  /** When true on Line or Area (iOS 16+), apply gradient foreground style. */
  readonly gradientEnabled: boolean;

  /** iOS only. Index of the currently selected mark, or null. */
  readonly selectedIndex?: number | null;
  /** iOS only. Called when the user taps a mark or taps to dismiss. */
  readonly onSelect?: (index: number | null) => void;

  /** Optional minimum chart height; defaults to 300 (FR-007). */
  readonly minHeight?: number;
  /** testID forwarded to the root view of every variant. */
  readonly testID?: string;
}

export const ChartView: React.FC<ChartViewProps>;
```

## Per-variant behavior

### `ChartView.tsx` (iOS)

- Imports from `@expo/ui/swift-ui` (`Host`) and from the local
  Swift extension's TS shim
  (`requireNativeViewManager('SwiftChartsLabChartView')`).
- Wraps the native view in `<Host>` so it composes inside
  feature-010-style SwiftUI trees.
- Forwards every prop to the native view as a non-null primitive
  (the Swift body decodes `data` as `[(String, Double)]` and
  `tint` as a hex string).
- On `onSelect`, the native view emits a single event with
  `{ index: number | null }` which the wrapper unpacks before
  calling the JS callback.
- MUST NOT be evaluated at module load time on Android or Web
  (FR-031). Achieved by being in the `.tsx` file (default
  variant), with `.android.tsx` / `.web.tsx` siblings shadowing it
  on those targets.

### `ChartView.android.tsx` and `ChartView.web.tsx`

- Implement the fallback per `research.md` Decision 2 using only
  `<View>` and `<Text>`.
- Render the dataset as one of the four visuals
  (`bar` / `line` / `area` / `point`) with bar widths / heights /
  positions tied to `data` and `tint`.
- Honor `gradientEnabled` on `bar` only (overlay child); MUST
  accept it without crashing for the other three types.
- Ignore `selectedIndex` and `onSelect` (selection is iOS-only
  per planning resolution of NEEDS CLARIFICATION #3).
- Apply
  `LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)`
  before any state-driven re-render that mutates child counts or
  heights. (`LayoutAnimation` is a built-in RN API; it is a no-op
  on Web — acceptable per spec.)
- Expose a single accessible summary via `accessibilityLabel` on
  the root `<View>` describing the dataset, chart type, and tint
  (FR-037).

## Testability

The seam is shaped so each layer has a small, mockable surface:

| Test file | Imports | Mocks |
|---|---|---|
| `ChartView.test.tsx` (iOS) | default-resolved `./ChartView` | `@expo/ui/swift-ui` (`Host` → passthrough); local native view registered as a recording `<View>` |
| `ChartView.android.test.tsx` | `require('./ChartView.android').ChartView` | none |
| `ChartView.web.test.tsx` | `require('./ChartView.web').ChartView` | none |
| `screen.*.test.tsx` | the screen variant under test | `./components/ChartView` → prop-recording `<View>` |

The "explicit-filename require" pattern in the .android / .web
tests follows the convention established by feature 006 — it
ensures the iOS variant is never evaluated under Jest on the
Windows host.

## Invariants asserted by tests

### Per-variant

| Variant | Invariant |
|---|---|
| iOS | The native view receives `type`, `data`, `tint.value`, `gradientEnabled`. |
| iOS | Changing `type` re-renders with the new `type` prop. |
| iOS | Calling the recorded `onSelect` from the mock fires the JS callback with the same argument. |
| android & web | `data.length` reflected in the rendered child count (one bar / dot per data point). |
| android & web | `type='bar'`: full-height bars; `type='line'`/`'area'`: bars + top stripe child; `type='point'`: dot children. |
| android & web | Tint propagates to `backgroundColor` of the fill / stripe / dot. |
| android & web | `gradientEnabled` on `type='bar'` mounts a second overlay child on each bar; on the other three types it is a documented no-op. |
| android & web | Root has `accessibilityLabel` describing the dataset summary (FR-037). |

### Cross-variant

- Every variant accepts the `ChartViewProps` shape as-is (TS
  contract enforced by `tsc --noEmit` in `pnpm check`).
- `minHeight` defaults to 300 when omitted; honored by every
  variant (FR-007).
