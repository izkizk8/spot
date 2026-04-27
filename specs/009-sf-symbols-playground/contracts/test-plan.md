# Contract — Test Plan: SF Symbols Lab

**Scope**: All seven test files under
`test/unit/modules/sf-symbols-lab/`. This document is the per-test
responsibility ledger and the recipe for the `expo-symbols` mock that
every component test depends on.

---

## Story → test-file matrix

| Story | Acceptance scenarios covered by | RNTL helper used |
|---|---|---|
| Story 1 — pick + play (P1) | `manifest.test.ts`, `catalog.test.ts`, `components/SymbolPicker.test.tsx`, `components/EffectPicker.test.tsx`, `components/AnimatedSymbol.test.tsx` (bounce / pulse / scale paths), `screen.test.tsx` (initial render + Play Effect on iOS) | `render`, `screen.getByRole`, `fireEvent.press` |
| Story 2 — config + Replace (P2) | `components/TintPicker.test.tsx`, `components/AnimatedSymbol.test.tsx` (replace / variable-color / appear / disappear paths + speed / repeat mapping), `screen.test.tsx` (Replace mini-picker visibility, secondary memory across effect switches, dim state for Speed / Repeat under Replace) | `fireEvent.press`, `rerender` |
| Story 3 — Android / Web fallback (P2) | `components/AnimatedSymbol.test.tsx` (web fallback branch + no `expo-symbols` invocation), `screen.test.tsx` (banner visibility branch) | `Platform.OS` mock, `screen.queryByText` |

---

## The `expo-symbols` mock recipe

Every test file that exercises `<AnimatedSymbol>` (directly or
transitively) MUST install this mock at the top of the file:

```ts
jest.mock('expo-symbols', () => {
  const React = require('react');
  const SymbolView = jest.fn(({ name, tintColor, size, animationSpec }) =>
    React.createElement('SymbolViewMock', {
      'data-name': name,
      'data-tint': String(tintColor),
      'data-size': size,
      'data-animation-spec': JSON.stringify(animationSpec ?? null),
    }),
  );
  return { SymbolView };
});
```

Three reasons it is hand-rolled per file rather than centralised in
`test/setup.ts`:

1. Other modules (notably the spec 008 haptics playground) do not need
   `expo-symbols` mocked, and a global mock would mask import-time
   regressions in their bundles.
2. The serialised `animationSpec` lets each test do an exact
   `expect(...).toEqual(...)` against the per-effect table in
   `contracts/animated-symbol.md`.
3. The mock is the contract — having it in every consuming test makes
   the dependency obvious and the assertions self-contained.

---

## Per-file responsibility

### `manifest.test.ts`

Per-module manifest invariants (complements the global
`test/unit/modules/manifest.test.ts` from spec 006):

- `manifest.id === 'sf-symbols-lab'`
- `/^[a-z][a-z0-9-]*$/.test(manifest.id)`
- `manifest.platforms` is `['ios', 'android', 'web']` (order
  insensitive — assert `Set` equality)
- `manifest.minIOS === '17.0'`
- `typeof manifest.render === 'function'`

### `catalog.test.ts`

Asserts every invariant in `contracts/catalog.md`:

- `SYMBOLS.length === 12` and unique by `name` and by `displayLabel`
- `EFFECTS.length === 7` and unique by `id`
- `EFFECTS.filter((e) => e.requiresSecondarySymbol).map((e) => e.id)`
  deep-equals `['replace']`
- `EFFECTS.filter((e) => e.respondsToSpeed).map((e) => e.id)` deep-
  equals `['bounce', 'pulse', 'scale', 'variable-color']`
- Same for `respondsToRepeat`

### `components/SymbolPicker.test.tsx`

- Renders 12 cells (count via `getAllByRole('button')` or a custom
  `accessibilityRole='button'` query)
- The cell for `heart.fill` has the selected visual state when
  `selectedName === 'heart.fill'`
- `fireEvent.press` on a cell calls the `onChange` prop with the
  pressed symbol's full `CuratedSymbol`

### `components/EffectPicker.test.tsx`

- Renders 7 segments
- The Bounce segment has the selected visual state when
  `selectedId === 'bounce'`
- `fireEvent.press` on a segment calls `onChange` with the segment's
  `EffectMetadata`

### `components/TintPicker.test.tsx`

- Renders 4 swatches
- `fireEvent.press` on a swatch calls `onChange` with the swatch's
  `TintToken`
- A second press on a different swatch fires `onChange` with the new
  token (no toggle-off semantics)

### `components/AnimatedSymbol.test.tsx`

The main per-effect prop-graph battery. With the `expo-symbols` mock
above and a default `Platform.OS = 'ios'`:

```ts
test.each([
  ['bounce', 'normal', 'once', { effect: { type: 'bounce' }, repeating: false, repeatCount: undefined, speed: 1.0 }],
  ['bounce', 'fast',   'thrice', { effect: { type: 'bounce' }, repeating: true,  repeatCount: 3,         speed: 2.0 }],
  ['bounce', 'slow',   'indefinite', { effect: { type: 'bounce' }, repeating: true, repeatCount: undefined, speed: 0.5 }],
  ['pulse',  'normal', 'once', { effect: { type: 'pulse' },  repeating: false, repeatCount: undefined, speed: 1.0 }],
  ['scale',  'normal', 'once', { effect: { type: 'scale' },  repeating: false, repeatCount: undefined, speed: 1.0 }],
  ['variable-color', 'normal', 'once', { variableAnimationSpec: { iterative: true, reversing: true }, repeating: false, repeatCount: undefined, speed: 1.0 }],
])('forwards %s/%s/%s as the expected animationSpec when playToken > 0', (effect, speed, repeat, expected) => {
  // render with playToken=1, parse data-animation-spec, deep-equal expected
});
```

Plus separate tests for:

- `playToken === 0` → `animationSpec === null` (i.e. `undefined`)
- `effect === 'replace'` + `playToken` bump → after 100 ms, the
  `name` data attribute equals `secondaryName`
- `effect === 'appear'` and `effect === 'disappear'` → no `effect` or
  `variableAnimationSpec` is forwarded; the wrapper drives an opacity
  worklet (assert via the Reanimated mock from `test/setup.ts`)
- `Platform.OS = 'web'` → `<ThemedText>` containing `name` string is
  rendered; `expo-symbols.SymbolView` mock has 0 calls

### `screen.test.tsx`

Integration coverage of every story:

- All four pickers render on iOS (banner absent)
- On `Platform.OS = 'web'`, banner reads "iOS 17+ only" and Play
  Effect press does NOT call the `SymbolView` mock
- Selecting Replace mounts the mini-picker; mini-picker has 11 cells
  (current primary excluded — FR-025)
- Switching from Replace to Pulse unmounts the mini-picker; switching
  back to Replace re-mounts it with the previously chosen secondary
  pre-selected (FR-027)
- Switching from Bounce to Replace renders Speed and Repeat with
  `pointerEvents='none'` and reduced opacity (FR-015, FR-016 — assert
  via the rendered style props)
- Pressing **Play Effect** twice while Repeat=Indefinite ends with
  `playToken === 0` (the second press stops the loop — FR-021)

---

## Test execution

```bash
pnpm test --testPathPattern sf-symbols-lab
```

CI gate: `pnpm check` runs `format:check && lint && typecheck && test`
across the whole repo, so any regression in this module fails the gate
(SC-009, FR-038).
