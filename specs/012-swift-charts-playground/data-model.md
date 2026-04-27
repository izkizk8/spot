# Phase 1 Data Model: Swift Charts Playground

All entities live in-memory only. No persistence, no global stores,
no network calls. Every entity is local to the screen component or
to `data.ts` (a pure module).

## Type aliases

```ts
/** The four chart types surfaced in the UI. */
export type ChartType = 'line' | 'bar' | 'area' | 'point';

/** Identifier for one of the four predefined tint swatches. */
export type TintId = 'blue' | 'green' | 'orange' | 'purple';

/** A single tint definition. */
export interface Tint {
  readonly id: TintId;
  /** Hex string suitable for both RN backgroundColor and Swift Charts. */
  readonly value: string;
}

/** Hardcoded tint palette (data.ts). */
export const TINTS: readonly Tint[] = [
  { id: 'blue',   value: '#007AFF' },
  { id: 'green',  value: '#34C759' },
  { id: 'orange', value: '#FF9500' },
  { id: 'purple', value: '#AF52DE' },
] as const;
```

## Constants (data.ts)

```ts
export const MIN_SERIES_SIZE = 2;
export const MAX_SERIES_SIZE = 24;
export const VALUE_MIN = -10;     // mock-temperature lower bound
export const VALUE_MAX = 30;      // mock-temperature upper bound
export const INITIAL_SIZE = 12;   // FR-011

/** Initial month labels — first 12 entries are unsuffixed. */
export const INITIAL_MONTHS: readonly string[] = [
  'Jan','Feb','Mar','Apr','May','Jun',
  'Jul','Aug','Sep','Oct','Nov','Dec',
];
```

## Entities

### `DataPoint`

A single value in the chart series.

```ts
export interface DataPoint {
  /** Month label, e.g. 'Jan' or 'Jan ʼ27' for entries past December. */
  readonly month: string;
  /** Mock-temperature value within [VALUE_MIN, VALUE_MAX], 1 decimal place. */
  readonly value: number;
}
```

**Validation**:

- `month` is non-empty and unique within the series under the
  documented wrapping rule (`'Jan'` → `'Jan ʼ27'` → `'Jan ʼ28'` …).
- `value` is finite, within `[VALUE_MIN, VALUE_MAX]`, rounded to 1
  decimal. The UI does not enforce the range — `data.ts`'s
  generators do.

### `Dataset` (alias)

The screen holds the dataset as a readonly array — there is no
class wrapping it; mutation goes through `data.ts` helpers that
return new arrays (immutability simplifies React reconciliation
and the integration tests).

```ts
export type Dataset = readonly DataPoint[];
```

**Invariants** (asserted by `data.test.ts`):

- `data.length` is always in `[MIN_SERIES_SIZE, MAX_SERIES_SIZE]`.
- `initialDataset().length === INITIAL_SIZE` (12).
- `randomize(data, seed)` returns a new array with the same length
  and the same `month` labels in the same order; only `value`s
  change.
- `addPoint(data)` returns a new array with `length + 1`; the
  appended entry's `month` is `nextMonthLabel(data[length-1].month)`;
  refuses (returns the same reference) when `length === MAX_SERIES_SIZE`.
- `removePoint(data)` returns a new array with `length - 1`;
  refuses (returns the same reference) when `length === MIN_SERIES_SIZE`.
- `nextMonthLabel('Dec')` returns `'Jan ʼ27'`;
  `nextMonthLabel('Dec ʼ27')` returns `'Jan ʼ28'`; same-year
  successors (`'Jan'` → `'Feb'`, `'Mar ʼ27'` → `'Apr ʼ27'`) work
  left-to-right.

### `Tint` (see Type aliases above)

The four-element constant `TINTS` is the entire universe of valid
tints. The screen holds the active tint as a single `Tint` value
(not an id) so the `ChartView` receives the hex string directly.

### `ChartType` (see Type aliases above)

Drives the iOS Swift Charts mark selection (`LineMark` / `BarMark`
/ `AreaMark` / `PointMark`) and the fallback's render branch. The
default is `'line'` (FR-009).

### `ScreenState` (held in `screen.tsx`'s `useState`)

Lives inside `SwiftChartsLabScreen` and its platform variants.

| Field | Type | Source | Notes |
|---|---|---|---|
| `chartType` | `ChartType` | `useState` | Defaults to `'line'` (FR-009). |
| `data` | `Dataset` | `useState` | Initialized from `initialDataset()`. |
| `tint` | `Tint` | `useState` | Defaults to `TINTS[0]` (FR-019). |
| `gradientEnabled` | `boolean` | `useState` | Defaults to `false`. |
| `selectedIndex` | `number \| null` | `useState` | iOS only. Cleared on chart-type change and on every dataset mutation (FR-026). Always `null` on the fallback (Decision 5 in `research.md`). |

**Transitions** (every transition produces a new `Dataset` reference;
arrays are never mutated in place):

```text
init                      → { chartType: 'line', data: initialDataset(), tint: TINTS[0],
                              gradientEnabled: false, selectedIndex: null }
chart-type tap            → { …prev, chartType: tapped, selectedIndex: null }
Randomize tap             → { …prev, data: randomize(prev.data), selectedIndex: null }
Add point tap (n < max)   → { …prev, data: addPoint(prev.data), selectedIndex: null }
Add point tap (n === max) → no-op (button is disabled; defensive guard returns prev)
Remove tap (n > min)      → { …prev, data: removePoint(prev.data), selectedIndex: null }
Remove tap (n === min)    → no-op (button is disabled; defensive guard returns prev)
swatch tap                → { …prev, tint: tapped }                     // selectedIndex preserved
toggle tap                → { …prev, gradientEnabled: !prev.gradientEnabled }
mark tap (iOS)            → { …prev, selectedIndex: hitIndex | null }
unmount                   → state discarded; no persistence
```

### `ChartViewProps` (the seam — see `contracts/chart-view.md`)

```ts
export interface ChartViewProps {
  readonly type: ChartType;
  readonly data: Dataset;
  readonly tint: Tint;
  readonly gradientEnabled: boolean;
  /** iOS only; ignored by .android.tsx and .web.tsx. */
  readonly selectedIndex?: number | null;
  /** iOS only; ignored by .android.tsx and .web.tsx. */
  readonly onSelect?: (index: number | null) => void;
  /** Optional minimum chart height; defaults to 300 (FR-007). */
  readonly minHeight?: number;
  /** testID forwarded to the root view of every variant. */
  readonly testID?: string;
}

export interface ChartViewModule {
  ChartView: React.ComponentType<ChartViewProps>;
}
```

The three platform files (`ChartView.tsx`, `ChartView.android.tsx`,
`ChartView.web.tsx`) each export `ChartView` matching this shape.
Tests import the explicit-filename variant via the feature-006
pattern.

### `ModuleManifest` (re-uses `@/modules/types`)

```ts
{
  id: 'swift-charts-lab',
  title: 'Swift Charts Lab',
  description: 'Real Apple Charts on iOS 16+ with a React Native fallback',
  icon: { ios: 'chart.xyaxis.line', fallback: '📊' },
  platforms: ['ios', 'android', 'web'],
  minIOS: '16.0',
  render: () => <SwiftChartsLabScreen />,
}
```

The exact SF Symbol name MAY be revised at implement time if the
chosen one is not available pre-iOS 17; safe alternatives are
`'chart.bar.fill'`, `'chart.line.uptrend.xyaxis'`, or
`'chart.dots.scatter'`. The fallback glyph is for the Modules grid
card on Android / Web.

## Relationships

```text
SwiftChartsLabScreen (one of screen.tsx / .android.tsx / .web.tsx)
├── (android & web only) <Banner /> "iOS 16+ only — RN fallback"
├── <ChartTypePicker value={chartType} onChange={setChartType} />
├── <ChartView                                              ← THE SEAM
│     type={chartType}
│     data={data}
│     tint={tint}
│     gradientEnabled={gradientEnabled}
│     selectedIndex={selectedIndex}                        // iOS only
│     onSelect={setSelectedIndex}                          // iOS only
│     minHeight={300} />
├── <DataControls
│     onRandomize={…}
│     onAdd={…}      addDisabled={data.length === MAX_SERIES_SIZE}
│     onRemove={…}   removeDisabled={data.length === MIN_SERIES_SIZE}
│     gradientEnabled={gradientEnabled}
│     onToggleGradient={…} />
└── <TintPicker value={tint} onChange={setTint} tints={TINTS} />
```

## Memory budget

- `Dataset` is a single `readonly DataPoint[]` of length ≤ 24.
- A `DataPoint` is `{ month: string, value: number }` ≈ 24 B per
  entry (string header + 8 B number).
- 24 entries × 24 B = **~0.6 KiB** total retained dataset memory.
  Bounded; does not grow with run time.
- The Swift `ChartView`'s body retains a `[Tuple<String, Double>]`
  copy of the same data per render — the same order of magnitude;
  Swift Charts' internal vertex buffers are negligible at N=24.
