# Contract — `<AnimatedSymbol>` (the single test seam)

**File**: `src/modules/sf-symbols-lab/components/AnimatedSymbol.tsx`
**Consumers**: `screen.tsx`, `SymbolPicker.tsx`
**Owner**: This contract is authoritative. Any change here requires
updating `spec.md` FR-034 and the corresponding tests. The mapping to
`expo-symbols`' real API was validated against
`node_modules/expo-symbols/src/SymbolModule.types.ts` and
`node_modules/expo-symbols/ios/SymbolView.swift` (see `research.md`
R1).

---

## Public API

```ts
import type { ColorValue } from 'react-native';
import type { EffectId, Speed, Repeat } from '../types';

export interface AnimatedSymbolProps {
  /** Primary SF Symbol system name. */
  name: string;
  /** Secondary SF Symbol name. Honoured ONLY when effect === 'replace'. */
  secondaryName?: string;
  /** The effect to play on the next playToken bump. */
  effect: EffectId;
  /** Maps to expo-symbols' AnimationSpec.speed (UIKit speed multiplier). */
  speed: Speed;
  /** Maps to AnimationSpec.repeating + AnimationSpec.repeatCount. */
  repeat: Repeat;
  /** Tint applied to the symbol on all platforms. */
  tintColor: ColorValue;
  /** Render size in points. */
  size: number;
  /**
   * Bumped by parent on every Play Effect press to retrigger the effect.
   * 0 = no effect armed (used to stop an Indefinite repeat — see R4).
   */
  playToken: number;
}

export function AnimatedSymbol(props: AnimatedSymbolProps): JSX.Element;
```

`<AnimatedSymbol>` is a pure function component. It holds at most one
Reanimated `useSharedValue` (for the Appear / Disappear / Replace fade
emulation). It holds no other state.

**Return value**: A `View` subtree. On iOS, contains
`expo-symbols`' `<SymbolView>`. Off-iOS, contains a `<ThemedText>`
with the symbol name as plain text.

---

## Per-platform behaviour

| Platform | Behaviour |
|---|---|
| iOS | Renders `<SymbolView name=… tintColor=… size=… animationSpec={spec(props)} />` where `spec(props)` is the per-effect mapping below. The Reanimated emulated effects (Replace / Appear / Disappear) ALSO run on iOS — they wrap the `<SymbolView>` so the swap reads as a fade transition. |
| Android | Returns the plain-text glyph fallback (FR-029). Effect playback is a no-op. The `expo-symbols` `SymbolView` is **not** rendered (we short-circuit before reaching its built-in Material Symbols font fallback so the showcase shows the actual SF Symbol *name string* instead of a Material approximation). |
| Web | Same as Android. (FR-031) |

The platform branch is a single early-return inside the wrapper:

```ts
if (Platform.OS !== 'ios') {
  return (
    <ThemedView style={styles.fallback}>
      <ThemedText style={[styles.glyph, { color: tintColor, fontSize: size * 0.5 }]}>
        {name}
      </ThemedText>
    </ThemedView>
  );
}
```

---

## Per-effect mapping table

(The assertion target for `components/AnimatedSymbol.test.tsx`. Source-
of-truth derived from `research.md` R1.)

| `effect` | `<SymbolView>` `animationSpec` | Wrapper-level emulation |
|---|---|---|
| `'bounce'` | `{ effect: { type: 'bounce' }, repeating, repeatCount, speed }` | – |
| `'pulse'` | `{ effect: { type: 'pulse' }, repeating, repeatCount, speed }` | – |
| `'scale'` | `{ effect: { type: 'scale' }, repeating, repeatCount, speed }` | – |
| `'variable-color'` | `{ variableAnimationSpec: { iterative: true, reversing: true }, repeating, repeatCount, speed }` (NB: `effect` field omitted — see Swift `addSymbolEffects` early-return) | – |
| `'replace'` | `undefined` (no native effect; `name` swap drives the visual) | On `playToken` bump: shared value goes 1 → 0 over 100 ms (during which `<SymbolView>` continues showing primary), at 0 the `name` prop swaps to `secondaryName`, then 0 → 1 over 100 ms |
| `'appear'` | `undefined` | On `playToken` bump: shared value goes 0 → 1 over 250 ms (opacity worklet) |
| `'disappear'` | `undefined` | On `playToken` bump: shared value goes 1 → 0 over 250 ms (opacity worklet) |

`repeating` / `repeatCount` derivation (see data-model `Repeat`):

| `repeat` | `repeating` | `repeatCount` |
|---|---|---|
| `'once'` | `false` | `undefined` |
| `'thrice'` | `true` | `3` |
| `'indefinite'` | `true` | `undefined` |

`speed` derivation (UIKit speed multiplier, see data-model `Speed`):

| `speed` | `animationSpec.speed` |
|---|---|
| `'slow'` | `0.5` |
| `'normal'` | `1.0` |
| `'fast'` | `2.0` |

---

## Retrigger semantics

- `playToken === 0` → `animationSpec` is `undefined` (no effect armed).
  This is the *initial* state and the *stopped* state (FR-021).
- `playToken > 0` → `animationSpec` is computed from the per-effect
  table above and passed to `<SymbolView>`. The native iOS view calls
  `removeAllSymbolEffects()` on every render and re-adds the effect,
  so any prop change in this set retriggers cleanly:
  `[name, secondaryName, effect, speed, repeat, playToken]`.
- For Replace / Appear / Disappear, the wrapper observes `playToken`
  via a `useEffect` and animates the shared value declaratively.

---

## Invariants

1. **No top-level side effects**. Importing `AnimatedSymbol.tsx` does
   not invoke any `expo-symbols` symbol. The native view is only
   constructed when the component is actually rendered on iOS.
2. **No state outside Reanimated shared value**. Component is pure;
   parent owns `playToken` and effect/symbol selections.
3. **Off-iOS = total no-op for native APIs**. The wrapper MUST NOT
   import `expo-symbols` synchronously in a way that invokes its
   `SymbolView` on Android / Web. (The package import itself is safe
   — `expo-symbols`' web entrypoint ships its own non-native fallback;
   we just don't render it.)
4. **Tint always applies**. `tintColor` is forwarded on iOS and used
   as the `<ThemedText>` colour off-iOS, so FR-020 / FR-023 / SC-006
   hold uniformly across platforms.
5. **Replace excludes self**. The wrapper does not enforce
   `secondaryName !== name`; the Replace mini-picker in `screen.tsx`
   does (FR-025). If the wrapper is invoked with
   `secondaryName === name`, the Replace fade still runs but no visual
   swap occurs — graceful no-op.

---

## Test recipe

```ts
// test/unit/modules/sf-symbols-lab/components/AnimatedSymbol.test.tsx
jest.mock('expo-symbols', () => {
  const React = require('react');
  return {
    SymbolView: jest.fn(({ name }) =>
      React.createElement('SymbolViewMock', { 'data-name': name }),
    ),
  };
});

// then assert:
//   1. animationSpec === undefined when playToken === 0
//   2. animationSpec deep-equals the table above for each effect when playToken > 0
//   3. Platform.OS === 'web' branch returns ThemedText with the name string
//   4. Platform.OS === 'web' branch never causes SymbolView mock to be called
```

Mocking `Platform.OS` per test:

```ts
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'web',
  select: (m: Record<string, unknown>) => m.web ?? m.default,
}));
```

(Or the project's existing equivalent in `test/setup.ts`.)
