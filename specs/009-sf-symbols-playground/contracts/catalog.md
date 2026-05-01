# Contract — `catalog.ts`

**File**: `src/modules/sf-symbols-lab/catalog.ts`
**Consumers**: `screen.tsx`, `SymbolPicker.tsx`, `EffectPicker.tsx`,
`AnimatedSymbol.tsx`, all module test files.
**Owner**: This contract is authoritative for the curated arrays. Any
change here requires updating `spec.md` FR-005, FR-009, and the
corresponding tests.

---

## Public API

```ts
import type { CuratedSymbol, EffectMetadata } from './types';

export const SYMBOLS: readonly CuratedSymbol[];
export const EFFECTS: readonly EffectMetadata[];
```

Both arrays are `as const` to preserve element identity for picker
default-selection logic.

---

## `SYMBOLS`

Length: **exactly 12** (FR-005). Source-order:

```text
1.  heart.fill           → "Heart"
2.  star.fill            → "Star"
3.  bolt.fill            → "Bolt"
4.  cloud.sun.fill       → "Cloudy"
5.  flame.fill           → "Flame"
6.  drop.fill            → "Drop"
7.  leaf.fill            → "Leaf"
8.  sparkles             → "Sparkles"
9.  moon.stars.fill      → "Moon"
10. cloud.bolt.rain.fill → "Storm"
11. sun.max.fill         → "Sun"
12. snowflake            → "Snow"
```

The first entry (`heart.fill`) is the FR-008 default for the Symbol
Picker.

**Invariants** (asserted by `catalog.test.ts`):

- `SYMBOLS.length === 12`
- `new Set(SYMBOLS.map((s) => s.name)).size === 12` (no duplicate names)
- `new Set(SYMBOLS.map((s) => s.displayLabel)).size === 12`
- Every `name` matches `/^[a-z][a-z0-9.]*$/` (SF Symbol naming
  convention; no trailing dots)

---

## `EFFECTS`

Length: **exactly 7** (FR-009). Source-order matches the spec's
enumeration exactly:

```text
1. bounce          → "Bounce"          (speed:✓ repeat:✓ secondary:–)
2. pulse           → "Pulse"           (speed:✓ repeat:✓ secondary:–)
3. scale           → "Scale"           (speed:✓ repeat:✓ secondary:–)
4. variable-color  → "Variable Color"  (speed:✓ repeat:✓ secondary:–)
5. replace         → "Replace"         (speed:– repeat:– secondary:✓)
6. appear          → "Appear"          (speed:– repeat:– secondary:–)
7. disappear       → "Disappear"       (speed:– repeat:– secondary:–)
```

The first entry (`bounce`) is the FR-011 default for the Effect Picker.

**Invariants** (asserted by `catalog.test.ts`):

- `EFFECTS.length === 7`
- `new Set(EFFECTS.map((e) => e.id)).size === 7`
- `EFFECTS.find((e) => e.requiresSecondarySymbol)?.id === 'replace'`
  and exactly one effect has `requiresSecondarySymbol === true`
- `EFFECTS.filter((e) => e.respondsToSpeed).map((e) => e.id)` deep-
  equals `['bounce', 'pulse', 'scale', 'variable-color']`
- Same set for `respondsToRepeat`
- Every `displayLabel` is a non-empty string

---

## Why the catalog lives in its own file

- `screen.tsx` would otherwise have to declare these arrays inline,
  bloating it past the readable threshold.
- The pickers and the Replace mini-picker all consume the *same*
  source-of-truth list; centralising prevents drift.
- The catalog is the *only* file in the module exporting both arrays
  — `index.tsx` (manifest) imports nothing from `catalog.ts`, so a
  future refactor to lazy-load the screen does not pull the catalog
  into the Modules-grid bundle path.
