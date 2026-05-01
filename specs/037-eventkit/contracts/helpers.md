# Contract — `date-ranges.ts` and `alarm-offsets.ts` pure helpers

**Feature**: 037-eventkit
**See**: [spec.md](../spec.md) FR-015, FR-016
**See**: [data-model.md](../data-model.md) Entity 6
**See**: [research.md](../research.md) §5 (R-E DST stability)

Implementation files:

- `src/modules/eventkit-lab/date-ranges.ts`
- `src/modules/eventkit-lab/alarm-offsets.ts`

Both modules are **pure** (no React imports, no `expo-calendar`
imports, no side effects). They are exhaustively unit-tested.

---

## §A — `date-ranges.ts`

### Exported surface

```ts
export type DateRangePreset = 'today' | 'next7' | 'next30';

export const DATE_RANGE_PRESETS: readonly DateRangePreset[] = [
  'today', 'next7', 'next30',
] as const;

export const DATE_RANGE_LABELS: Readonly<Record<DateRangePreset, string>> = {
  today: 'Today',
  next7: 'Next 7 days',
  next30: 'Next 30 days',
};

export function computeRange(
  preset: DateRangePreset,
  now: Date,
): { startDate: Date; endDate: Date };
```

### Invariants (asserted by `test/unit/modules/eventkit-lab/date-ranges.test.ts`)

- **D1**. `computeRange` is pure: `computeRange(p, t)` deep-equals
  `computeRange(p, t)` across multiple calls; the output `Date`
  instances are fresh (not aliasing `now` or each other).
- **D2**. For every preset, `startDate <= endDate`.
- **D3**. `startDate.getHours() === 0`,
  `startDate.getMinutes() === 0`,
  `startDate.getSeconds() === 0`,
  `startDate.getMilliseconds() === 0` (start-of-day in local TZ).
- **D4**. `endDate.getHours() === 23`,
  `endDate.getMinutes() === 59`,
  `endDate.getSeconds() === 59` (end-of-day in local TZ).
- **D5**. **Day count per preset** (counting calendar days in local
  TZ, NOT milliseconds):
    - `'today'`: end-of-day === start-of-day (1 day span).
    - `'next7'`: end is 6 days after start (7-day inclusive span).
    - `'next30'`: end is 29 days after start (30-day inclusive
      span).
- **D6**. **DST stability**: with `now` pinned to a US
  spring-forward boundary (e.g., 2025-03-09 in
  `America/Los_Angeles`), `computeRange('next7', now).endDate`
  has the same `getHours()/getMinutes()/getSeconds()` as
  `startDate`'s end-of-day (no 1-hour drift). Likewise for
  fall-back (2025-11-02). Tested with `process.env.TZ` pinned
  inside the test or via a `jest.useFakeTimers` setup.
- **D7**. The function uses `setDate(d.getDate() + N)` for day
  arithmetic, NEVER `+ N * 24 * 60 * 60 * 1000`. (Asserted
  indirectly via D6; structurally enforced by code review.)

### Test surface (sketch)

- Each preset: produces the expected pair on a fixed `now` like
  `2025-06-15T14:30:00` in the test's timezone.
- Each preset: D2, D3, D4 invariants.
- D6: DST boundary fixtures (2025-03-09 + 2025-11-02), both US
  and EU zones if `process.env.TZ` is parameterisable.
- Purity: 1000 calls with the same input produce identical outputs.

---

## §B — `alarm-offsets.ts`

### Exported surface

```ts
export type AlarmOffsetPreset = 'none' | '5min' | '15min' | '1hour';

export const ALARM_OFFSET_PRESETS: readonly AlarmOffsetPreset[] = [
  'none', '5min', '15min', '1hour',
] as const;

export const ALARM_OFFSET_LABELS: Readonly<Record<AlarmOffsetPreset, string>> = {
  none: 'None',
  '5min': '5 minutes before',
  '15min': '15 minutes before',
  '1hour': '1 hour before',
};

export function toAlarmsArray(
  preset: AlarmOffsetPreset,
): readonly [{ readonly relativeOffset: number }] | undefined;
```

### Invariants (asserted by `test/unit/modules/eventkit-lab/alarm-offsets.test.ts`)

- **A1**. The four preset string keys are unique and exactly equal
  to the union members.
- **A2**. Every preset has a non-empty label.
- **A3**. `toAlarmsArray('none') === undefined` (strict equality).
- **A4**. `toAlarmsArray('5min')` deep-equals
  `[{ relativeOffset: -5 }]`.
- **A5**. `toAlarmsArray('15min')` deep-equals
  `[{ relativeOffset: -15 }]`.
- **A6**. `toAlarmsArray('1hour')` deep-equals
  `[{ relativeOffset: -60 }]`.
- **A7**. `toAlarmsArray` is pure: identical inputs produce
  deep-equal outputs across calls; outputs are fresh objects (the
  composer may mutate them, although the type is `readonly`).
- **A8**. The function is exhaustive — switching on
  `AlarmOffsetPreset` triggers a TypeScript `never` check on a
  default branch, ensuring future preset additions force an update
  here.

### Test surface (sketch)

- For each preset: the label exists and is non-empty; the
  `toAlarmsArray` return matches the table above.
- Pure: 1000 calls produce identical-shape outputs.
- Type-level: a `satisfies` assertion that the returned array's
  element shape conforms to `expo-calendar`'s `Alarm` type for
  the iOS-relative-offset variant.

---

## Cross-helper invariant

Neither helper imports React, `expo-calendar`, or any other module
beyond TypeScript built-ins. Both are tree-shakeable from the iOS,
Android, and Web bundles. (The tests import them directly without
any platform shim.)
