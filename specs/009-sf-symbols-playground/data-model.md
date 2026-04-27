# Phase 1 — Data Model: SF Symbols Lab

All entities below live in `src/modules/sf-symbols-lab/types.ts` (or
co-located in `catalog.ts`) and are pure TypeScript types — no classes,
no runtime schema library, no persistence.

---

## `CuratedSymbol`

The fixed set of 12 SF Symbols this module exposes (FR-005).

```ts
export interface CuratedSymbol {
  /** SF Symbol system name as accepted by expo-symbols' `SymbolView.name`. */
  readonly name: string;
  /** Short human-readable label used in pickers and the plain-text fallback. */
  readonly displayLabel: string;
}
```

The 12 entries (source-order, FR-005, FR-008 default = first):

```text
heart.fill, star.fill, bolt.fill, cloud.sun.fill, flame.fill,
drop.fill, leaf.fill, sparkles, moon.stars.fill,
cloud.bolt.rain.fill, sun.max.fill, snowflake
```

`displayLabel` is derived deterministically from `name` — the catalog
hand-codes a short label per symbol (e.g. `heart.fill → "Heart"`,
`cloud.bolt.rain.fill → "Storm"`) so the pickers stay readable.

**Invariants** (asserted by `catalog.test.ts`):

- `SYMBOLS.length === 12`
- Every `name` is a non-empty string and unique within the array
- Every `displayLabel` is a non-empty string and unique within the
  array (deduplication aids picker accessibility labels)

---

## `EffectId`

The seven effect identifiers exposed by this module (FR-009).

```ts
export type EffectId =
  | 'bounce'
  | 'pulse'
  | 'scale'
  | 'variable-color'
  | 'replace'
  | 'appear'
  | 'disappear';
```

The screen, the picker, the wrapper, and the test files all branch on
this union. The 1:1 mapping to `expo-symbols`' `AnimationSpec` is
defined in `contracts/animated-symbol.md` (and summarised in
`research.md` R1).

---

## `EffectMetadata`

Per-effect metadata describing whether the Speed and Repeat selectors
are meaningful for that effect, and whether the Replace mini-picker
must be shown.

```ts
export interface EffectMetadata {
  readonly id: EffectId;
  readonly displayLabel: string;
  readonly respondsToSpeed: boolean;
  readonly respondsToRepeat: boolean;
  readonly requiresSecondarySymbol: boolean;
}
```

Concrete table (FR-015, FR-016, FR-025):

| `id` | `displayLabel` | `respondsToSpeed` | `respondsToRepeat` | `requiresSecondarySymbol` |
|---|---|:-:|:-:|:-:|
| `bounce` | "Bounce" | ✓ | ✓ | – |
| `pulse` | "Pulse" | ✓ | ✓ | – |
| `scale` | "Scale" | ✓ | ✓ | – |
| `variable-color` | "Variable Color" | ✓ | ✓ | – |
| `replace` | "Replace" | – | – | ✓ |
| `appear` | "Appear" | – | – | – |
| `disappear` | "Disappear" | – | – | – |

**Invariants** (asserted by `catalog.test.ts`):

- `EFFECTS.length === 7`
- Every `id` is unique
- The only effect with `requiresSecondarySymbol === true` is `replace`
- The set of effects with `respondsToSpeed === true` equals
  `{ bounce, pulse, scale, variable-color }`
- Same set for `respondsToRepeat === true`

---

## `Speed`

```ts
export type Speed = 'slow' | 'normal' | 'fast';
```

Default: `'normal'` (FR-013). Mapping to `expo-symbols`' `speed` field
(a UIKit speed multiplier, see R1):

| `Speed` | `animationSpec.speed` |
|---|---|
| `'slow'` | `0.5` |
| `'normal'` | `1.0` |
| `'fast'` | `2.0` |

---

## `Repeat`

```ts
export type Repeat = 'once' | 'thrice' | 'indefinite';
```

Default: `'once'` (FR-014). Mapping to `expo-symbols`' repeat fields:

| `Repeat` | `animationSpec.repeating` | `animationSpec.repeatCount` |
|---|---|---|
| `'once'` | `false` | `undefined` |
| `'thrice'` | `true` | `3` |
| `'indefinite'` | `true` | `undefined` |

---

## `TintToken`

The four tint swatches exposed by `TintPicker`, sourced from
`src/constants/theme.ts` via `useTheme()`.

```ts
export type TintToken = 'text' | 'textSecondary' | 'tintA' | 'tintB';
```

The actual `ColorValue` is resolved per render via `useTheme()` so that
swatches re-resolve when the user toggles light / dark. `tintA` and
`tintB` map to two visually distinct theme colours (see `research.md`
R5); concrete token names will be finalised when the screen is
implemented and may be primitive theme keys or composed in the
component file — *no new colour literals will be introduced* (FR-036).

---

## `PlaybackConfig`

The transient, in-memory configuration applied on the next Play Effect
tap. Held entirely in `screen.tsx` `useState`.

```ts
export interface PlaybackConfig {
  readonly symbol: CuratedSymbol;       // FR-005, FR-008
  readonly effect: EffectMetadata;      // FR-009, FR-011
  readonly speed: Speed;                // FR-013
  readonly repeat: Repeat;              // FR-014
  readonly tint: TintToken;             // FR-022
  readonly secondarySymbol?: CuratedSymbol;  // honoured iff effect.id === 'replace'
}
```

In addition, `screen.tsx` holds a non-config piece of state:

```ts
const [playToken, setPlayToken] = useState(0);
```

`playToken` is bumped on every Play Effect press to force
`<AnimatedSymbol>` to re-apply the `animationSpec` (the iOS view calls
`removeAllSymbolEffects()` on every render — see `research.md` R4).

**Invariants**:

- When `effect.id !== 'replace'`, `secondarySymbol` is unused
  (kept in state per FR-027 but not forwarded to `<AnimatedSymbol>`).
- When `effect.id === 'replace'`, `secondarySymbol !== symbol` is
  enforced by the Replace mini-picker excluding the current primary
  from its options (FR-025).

---

## State transitions

### Play Effect state machine

```text
idle ──Play (one-shot effect)──▶ playing ──effect completes──▶ idle
   │
   ├──Play (Indefinite repeat)──▶ playing ──Play again──▶ idle (stopped)
   │
   └── any selector change while playing ──▶ playing (token-bumped retrigger)
```

Implemented as the integer `playToken` and an effect-completion
heuristic: for `repeat === 'indefinite'`, the wrapper passes
`animationSpec.repeating: true` to `SymbolView`; the next Play Effect
press first sets `playToken` to `0` (no animation) for one render then
bumps it again — this is how FR-021 "taps Play Effect again ... stops"
is implemented without imperative `removeAllSymbolEffects` plumbing.

### Replace mini-picker visibility

```text
effect = anything-but-replace ──▶ mini-picker hidden (secondary remembered in state)
effect = replace               ──▶ mini-picker visible, defaulting to remembered secondary
                                   (or the next non-primary catalog entry if none yet)
```

### Cross-platform render branch

```text
Platform.OS === 'ios' ──▶ <SymbolView ... animationSpec={...} />
otherwise              ──▶ <ThemedView><ThemedText>{name}</ThemedText></ThemedView>
```

(Single-value branch, constitution III. See `contracts/animated-
symbol.md` for the full prop graph.)

---

## Storage layout

**N/A.** This module persists no state. All UI state resets on screen
unmount (FR-035, spec § Out of Scope).
