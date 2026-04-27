# Contract: Dataset & generators (`data.ts`)

`src/modules/swift-charts-lab/data.ts` is a pure module — no React,
no side effects, no I/O. It owns every dataset operation the
screen invokes; the screen itself only calls these helpers and
threads the returned arrays through `useState`.

## Public surface

```ts
// Tints
export type TintId = 'blue' | 'green' | 'orange' | 'purple';
export interface Tint { readonly id: TintId; readonly value: string; }
export const TINTS: readonly Tint[];          // length 4, see data-model.md

// Chart types
export type ChartType = 'line' | 'bar' | 'area' | 'point';
export const CHART_TYPES: readonly ChartType[]; // ['line','bar','area','point']

// Data shape
export interface DataPoint { readonly month: string; readonly value: number; }
export type Dataset = readonly DataPoint[];

// Constants
export const MIN_SERIES_SIZE: 2;
export const MAX_SERIES_SIZE: 24;
export const VALUE_MIN: -10;
export const VALUE_MAX: 30;
export const INITIAL_SIZE: 12;
export const INITIAL_MONTHS: readonly string[]; // ['Jan',…,'Dec']

// Helpers
/** The 12-entry seasonal-curve dataset used at first render. Deterministic. */
export function initialDataset(): Dataset;

/** Replace every value with a new one in [VALUE_MIN, VALUE_MAX].
 *  Keeps length and month labels unchanged.
 *  `seed` is optional; when omitted, uses Date.now() (UI path);
 *  when provided, output is fully deterministic (test path). */
export function randomize(data: Dataset, seed?: number): Dataset;

/** Append one point with month = nextMonthLabel(last.month) and a
 *  fresh in-range value. Returns `data` unchanged if at MAX_SERIES_SIZE. */
export function addPoint(data: Dataset, seed?: number): Dataset;

/** Pop the last point. Returns `data` unchanged if at MIN_SERIES_SIZE. */
export function removePoint(data: Dataset): Dataset;

/** Compute the next month label.
 *   - 'Jan' → 'Feb', …, 'Nov' → 'Dec'
 *   - 'Dec' → 'Jan ʼ27'
 *   - 'Dec ʼ27' → 'Jan ʼ28'
 *   - 'Mar ʼ27' → 'Apr ʼ27'  */
export function nextMonthLabel(prev: string): string;
```

The `ʼ` character is the Unicode `MODIFIER LETTER APOSTROPHE`
(`U+02BC`), chosen over `'` (`U+0027`) for visual cleanliness on
chart axis ticks. Tests MUST use `ʼ` (the literal Unicode point)
in their string assertions to guarantee a byte-exact match.

## Invariants asserted by `data.test.ts`

### Constants

- `MIN_SERIES_SIZE === 2`, `MAX_SERIES_SIZE === 24`,
  `VALUE_MIN === -10`, `VALUE_MAX === 30`, `INITIAL_SIZE === 12`.
- `TINTS.length === 4`; ids are exactly
  `['blue','green','orange','purple']`.
- `CHART_TYPES` is exactly `['line','bar','area','point']`.

### `initialDataset()`

- Returns an array of length `INITIAL_SIZE` (12).
- `data.map(d => d.month) === INITIAL_MONTHS` (12 month names).
- Every `value` is finite, in `[VALUE_MIN, VALUE_MAX]`, rounded to
  1 decimal (`Math.abs(value * 10 - Math.round(value * 10)) < 1e-9`).
- Two successive calls return arrays whose `value`s are equal
  element-wise (deterministic).

### `randomize(data, seed)`

- Output length === input length.
- Output month labels are equal element-wise to the input's.
- Every output `value` is finite, in `[VALUE_MIN, VALUE_MAX]`,
  rounded to 1 decimal.
- For a fixed `seed`, two calls return equal arrays element-wise.
- For two different `seed`s, the call returns arrays that differ
  in at least one position (with overwhelming probability — the
  test pins a seed pair where it does).
- Calling without `seed` MAY return non-deterministic values
  (covered by the type signature, not asserted on values).

### `addPoint(data, seed)`

- When `data.length < MAX_SERIES_SIZE`: output length is
  `data.length + 1`; entries `0..n-1` are `===`-equal to
  `data[0..n-1]`; the appended entry has
  `month === nextMonthLabel(data[n-1].month)` and `value` in
  `[VALUE_MIN, VALUE_MAX]` rounded to 1 decimal.
- When `data.length === MAX_SERIES_SIZE`: returns the same
  reference (`addPoint(data) === data`).

### `removePoint(data)`

- When `data.length > MIN_SERIES_SIZE`: output length is
  `data.length - 1`; entries `0..n-2` are `===`-equal to
  `data[0..n-2]`.
- When `data.length === MIN_SERIES_SIZE`: returns the same
  reference (`removePoint(data) === data`).

### `nextMonthLabel(prev)`

- `nextMonthLabel('Jan') === 'Feb'`, …,
  `nextMonthLabel('Nov') === 'Dec'`.
- `nextMonthLabel('Dec') === 'Jan ʼ27'`.
- `nextMonthLabel('Jan ʼ27') === 'Feb ʼ27'`,
  `nextMonthLabel('Dec ʼ27') === 'Jan ʼ28'`.
- Throws (or returns a documented sentinel) on inputs that don't
  match the documented forms — the implementation MAY be lenient
  and round-trip the input on unknown labels; the test MUST pin
  whichever behavior is chosen.

### Insertion / removal preserves invariants (composition)

- For any sequence of `addPoint` / `removePoint` calls bounded by
  `MIN_SERIES_SIZE` and `MAX_SERIES_SIZE`: the resulting array's
  length is in `[MIN_SERIES_SIZE, MAX_SERIES_SIZE]`; every value
  is in `[VALUE_MIN, VALUE_MAX]` rounded to 1 decimal; month
  labels are pairwise distinct under the `nextMonthLabel`
  documented form.
