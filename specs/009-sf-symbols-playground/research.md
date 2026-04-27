# Phase 0 — Research: SF Symbols Lab

All decisions below resolve `NEEDS CLARIFICATION` items implicit in the
plan template. The *Validate-Before-Spec* mandate (constitution §
Workflow) **fires for R1** because the spec assumed an effect API
surface that does not exist in `expo-symbols` 55.0.7; that assumption
was validated by reading the package source on disk (paths cited
inline) and the wrapper contract was written around the real API. No
device build POC was required because the JS-level surface is
sufficient to pin every decision below.

---

## R1 — `expo-symbols` 55.0.7 actual API surface (Validate-Before-Spec)

**Decision**: Build `<AnimatedSymbol>` against the **actual** type
surface of `expo-symbols` 55.0.7 as found in
`node_modules/expo-symbols/src/SymbolModule.types.ts` and confirmed by
the iOS view implementation in
`node_modules/expo-symbols/ios/SymbolView.swift`.

**The real API** (verbatim, trimmed):

```ts
// SymbolModule.types.ts
export type SymbolViewProps = {
  name: SFSymbol | { ios?: SFSymbol; android?: AndroidSymbol; web?: AndroidSymbol };
  fallback?: React.ReactNode;
  type?: SymbolType;             // 'monochrome' | 'hierarchical' | 'palette' | 'multicolor'
  scale?: SymbolScale;           // 'default' | 'unspecified' | 'small' | 'medium' | 'large'
  weight?: SymbolWeight | { ios; android };
  colors?: ColorValue | ColorValue[];
  size?: number;                 // default 24
  tintColor?: ColorValue;
  resizeMode?: ContentMode;
  animationSpec?: AnimationSpec; // iOS only — when set, the symbol is animated
} & ViewProps;

export type AnimationSpec = {
  effect?: AnimationEffect;
  repeating?: boolean;
  repeatCount?: number;          // forwarded to UIKit SymbolEffectOptions.repeat()
  speed?: number;                // forwarded to UIKit SymbolEffectOptions.speed()
  variableAnimationSpec?: VariableAnimationSpec;
};

export type AnimationEffect = {
  type: AnimationType;           // 'bounce' | 'pulse' | 'scale'  ⚠ ONLY THESE THREE
  wholeSymbol?: boolean;
  direction?: 'up' | 'down';
};

export type VariableAnimationSpec = {
  reversing?, nonReversing?, cumulative?, iterative?,
  hideInactiveLayers?, dimInactiveLayers?: boolean;
};
```

The iOS view (`SymbolView.swift` `addSymbolEffects`) confirms:

- If `variableAnimationSpec` is set, the variable-color effect is
  added and `animationSpec.effect` is **ignored** (early return).
- Otherwise `animationSpec.effect.type` is mapped to a
  `SymbolEffect` and added to the `UIImageView` with the resolved
  `SymbolEffectOptions(repeating | nonRepeating | repeat(N) | speed(s))`.
- All effect application is gated on `if #available(iOS 17.0, *)`.
- On every render, `removeAllSymbolEffects()` is called first, so
  retriggering an effect requires a prop change (we use a numeric
  `playToken` in `screen.tsx` that bumps on every Play Effect press).

**The seven effects in the spec do NOT map 1:1 to this API**:

| Spec effect (FR-009) | Native binding in `expo-symbols` 55.0.7? | Wrapper strategy |
|---|---|---|
| Bounce | ✅ `animationSpec.effect = { type: 'bounce' }` | Pass through |
| Pulse | ✅ `animationSpec.effect = { type: 'pulse' }` | Pass through |
| Scale | ✅ `animationSpec.effect = { type: 'scale' }` | Pass through |
| Variable Color | ✅ `animationSpec.variableAnimationSpec = { iterative: true, reversing: true }` (effect omitted) | Pass through |
| **Replace** | ❌ Not exposed as an `AnimationType` | **Emulated**: swap `name` prop; wrapper crossfades opacity 1→0→1 over 200 ms via Reanimated worklet so the swap reads as a transition on every platform |
| **Appear** | ❌ Not exposed | **Emulated**: Reanimated opacity 0→1 over 250 ms when `playToken` bumps |
| **Disappear** | ❌ Not exposed | **Emulated**: Reanimated opacity 1→0 over 250 ms when `playToken` bumps |

**Rationale**:

- The wrapper hides the implementation gap from `screen.tsx` —
  consumers see a uniform `effect: EffectId` prop and the Play Effect
  trigger fires the same code path for all seven. This is what
  FR-034's "single seam used by tests" was written for.
- The emulated effects use Reanimated worklets (constitution
  Technology Constraints — Animated API forbidden, Reanimated +
  worklets mandated) so they keep working on all three platforms even
  when the native `SymbolView` is the static `Material Symbols` glyph
  fallback (Android) or our plain-text glyph (Web / our wrapper).
- Replace's "swap the rendered `name`" implementation matches the
  spec's edge case "Replace with same symbol MUST be prevented in the
  UI" (FR-025 already excludes the primary from the mini-picker, so
  the swap is always to a distinct symbol).
- `repeatCount` ≠ logical "Once / 3 times / Indefinite": the wrapper
  maps `Once → repeating: false, repeatCount: undefined`,
  `3 times → repeating: true, repeatCount: 3`,
  `Indefinite → repeating: true` (no count). This aligns with the
  Swift code's `SymbolEffectOptions(repeating | repeat(N))` branching.
- `speed` is a *duration multiplier* in seconds — the wrapper maps
  `Slow → 0.5`, `Normal → 1.0`, `Fast → 2.0` (higher = faster, per
  UIKit's `SymbolEffectOptions.speed(_:)` which is a multiplier on the
  default playback speed).

**Alternatives considered**:

- **Wait for an `expo-symbols` SDK 56 that ships native bindings for
  the four missing effects** — would block the feature on an unscoped
  third-party release. Rejected.
- **Skip the four missing effects and ship only Bounce / Pulse / Scale
  / Variable Color** — would violate FR-009's explicit "exactly seven
  effects" requirement. Rejected.
- **Bind to UIKit directly via a custom Expo Modules native module** —
  doable, but introduces native code and a config plugin for a
  showcase module. Rejected; the JS-level emulation is honest about
  what each effect is and keeps the module a pure JS extension.

---

## R2 — Single test seam: `<AnimatedSymbol>`

**Decision**: One component file
`src/modules/sf-symbols-lab/components/AnimatedSymbol.tsx` is the *only*
module file that imports `expo-symbols`. Every other component
(`SymbolPicker`, the preview area, the Replace mini-picker) renders
`<AnimatedSymbol size=… tintColor=… name=… effect=… playToken=…
secondaryName?=… speed=… repeat=…/>`.

**Public prop surface** (full contract in
`contracts/animated-symbol.md`):

```ts
export type AnimatedSymbolProps = {
  name: string;                   // primary symbol
  secondaryName?: string;         // only honoured when effect === 'replace'
  effect: EffectId;               // 'bounce'|'pulse'|'scale'|'variable-color'|'replace'|'appear'|'disappear'
  speed: Speed;                   // 'slow' | 'normal' | 'fast'
  repeat: Repeat;                 // 'once' | 'thrice' | 'indefinite'
  tintColor: ColorValue;
  size: number;
  /** Bumped by parent on every Play Effect press to retrigger animation. */
  playToken: number;
};
```

**Rationale** (FR-034):

- One file owns the third-party API surface. Component tests for
  `SymbolPicker` and `screen.tsx` mock `<AnimatedSymbol>` itself with
  a stub that records its props; only `AnimatedSymbol.test.tsx` mocks
  `expo-symbols`. This keeps every other test deterministic and
  independent of the `expo-symbols` version pin.
- Co-locates the per-effect mapping (R1 table) with the *only*
  consumer of `animationSpec`, so a future SDK upgrade is a one-file
  diff.
- Aligns with the spec 006 + 007 + 008 plug-in pattern: "modules own
  their seams".

**Alternatives considered**:

- **No wrapper; components import `expo-symbols` directly** — explodes
  the mock surface across 4+ component test files and forces the
  Replace / Appear / Disappear emulation to be re-implemented per
  caller. Rejected; would violate FR-034.
- **A hook (`useSfSymbol`) returning a render prop** — adds ceremony
  for zero benefit; the wrapper is stateless except for a Reanimated
  shared value. Rejected.

---

## R3 — Cross-platform fallback strategy

**Decision**: On `Platform.OS !== 'ios'`, `<AnimatedSymbol>` returns a
`<ThemedView>` containing a `<ThemedText>` rendering the symbol's
`name` (e.g. literal text `"heart.fill"`) at large display weight,
coloured by `tintColor`. Effect playback is a JS-level no-op on
non-iOS — the Reanimated emulated effects (Appear / Disappear /
Replace) **also** become no-ops on non-iOS so the fallback stays
static (FR-029). The screen renders the "iOS 17+ only" banner via a
single `Platform.OS !== 'ios'` check in `screen.tsx` (FR-028).

**Rationale**:

- FR-029 explicitly mandates a *plain-text* glyph (the symbol name
  rendered as text), **not** the Material Symbols font fallback that
  `expo-symbols`' default Web/Android `SymbolView` ships with. We
  short-circuit before reaching that fallback so the rendered text is
  the SF Symbol identifier itself, which is the showcase-appropriate
  rendering for this module.
- Keeps the platform branch a single early return inside the wrapper —
  no `.web.ts` / `.android.ts` split needed for two lines of JSX
  (constitution III single-value branch carve-out).
- Tint still applies (FR-029 — "styled with the current tint"); the
  4-swatch tint picker remains immediately useful on all three
  platforms (FR-022, FR-023, SC-006).

**Alternatives considered**:

- **Use `expo-symbols`' built-in Material-Symbols font fallback on
  Android / Web** — would render an actual glyph, but that glyph is
  *not* the SF Symbol the user picked (it's a Google Material Symbols
  approximation). Misleading for a "showcase" module and contradicts
  FR-029. Rejected.
- **Render `?` or a generic placeholder** — drops the symbol-name
  signal that FR-029 explicitly mandates. Rejected.
- **Three-way file split (`.ios.tsx` / `.android.tsx` / `.web.tsx`)** —
  triplicates ~80 LOC for a 2-line difference. Rejected; revisited if
  the fallback grows.

---

## R4 — Effect retrigger mechanism

**Decision**: `screen.tsx` holds a `playToken: number` in `useState`
and increments it on every Play Effect press. `<AnimatedSymbol>` keys
the `<SymbolView>` render off `[name, effect, speed, repeat,
playToken]` so a token bump forces a fresh `animationSpec` to be
applied (the Swift implementation calls `removeAllSymbolEffects()` and
re-adds on every render — see R1). For Indefinite repeat, a *second*
press while `playToken > 0` swaps `animationSpec` to `undefined`
(stopping the effect) and resets `playToken` to `0` — this is the
"taps Play Effect again" stop semantics in FR-021.

**Rationale**:

- The expo-symbols iOS view does not expose an imperative trigger; the
  re-render-driven token is the idiomatic way to retrigger one-shot
  effects. Mirrors the equivalent React patterns for retrigger-on-key.
- A single integer state + a `useEffect` toggling stop / start cleanly
  expresses the FR-021 stop semantics without a second piece of
  state.
- Cancellation on screen unmount is automatic: when the wrapper
  unmounts, `<SymbolView>` unmounts, the underlying `UIImageView` is
  torn down, all effects stop. Edge case "Repeat: Indefinite running
  while user navigates away" is satisfied without extra cleanup.

**Alternatives considered**:

- **A `ref` + imperative `play()` method** — adds an imperative API
  surface to the wrapper for no functional gain. Rejected.
- **Throttle Play Effect presses to debounce rapid taps** — coalesces
  legitimate retrigger intent. The token bump pattern is naturally
  rapid-tap-safe (each bump is a fresh `removeAllSymbolEffects()` →
  add cycle on the native side). Rejected.

---

## R5 — Tint palette: 4 swatches drawn from theme tokens

**Decision**: `TintPicker` exposes 4 swatches sourced from the
project's theme tokens at `src/constants/theme.ts`. Selected swatch is
held in `screen.tsx` state and forwarded to `<AnimatedSymbol
tintColor=…/>`. The 4 chosen tokens are picked for *visual distinction
in both light and dark mode*: a primary text colour, a secondary text
colour, plus two accent-style colours derived via `useTheme()` so the
swatches re-resolve when the user toggles light / dark.

**Rationale**:

- FR-022: "drawn from the project's centralized theme tokens" — no
  hardcoded hex values.
- 4 swatches is the spec's minimum and maximum (FR-022); a richer
  palette is explicitly Out of Scope.
- Visual distinction in both schemes prevents the "all four look
  identical in dark mode" trap.

**Alternatives considered**:

- **Pull from a hypothetical `Colors.accents` array** — the project's
  current `Colors` token set (per `src/constants/theme.ts`) has no
  accents palette; introducing one is out of scope. Rejected.
- **Allow the user to type a hex** — out of scope and would require a
  colour-picker UX. Rejected.

---

## R6 — Speed / Repeat de-emphasis

**Decision**: Speed and Repeat selectors are always rendered (FR-015,
FR-016 require they remain in the layout) but each is dimmed (opacity
0.4, `pointerEvents='none'`) when the selected effect's
`respondsToSpeed` / `respondsToRepeat` metadata is `false`. The
catalog entry per effect declares the booleans:

| Effect | `respondsToSpeed` | `respondsToRepeat` | `requiresSecondarySymbol` |
|---|---|---|---|
| Bounce | true | true | false |
| Pulse | true | true | false |
| Scale | true | true | false |
| Variable Color | true | true | false |
| Replace | false | false | true |
| Appear | false | false | false |
| Disappear | false | false | false |

**Rationale**:

- Replace / Appear / Disappear are emulated as one-shot crossfades /
  fades; speed and repeat are not meaningful for them in this
  wrapper's implementation.
- Variable Color, Bounce, Pulse, Scale all map to UIKit
  `SymbolEffectOptions` which honours both `speed(_:)` and
  `repeating` / `repeat(_:)`.
- Keeping the controls *present but dimmed* (FR-015, FR-016) preserves
  layout stability — users don't see the screen reflow when they
  switch effects.

**Alternatives considered**:

- **Hide the controls when not applicable** — causes layout reflow;
  FR-015 / FR-016 explicitly forbid removal ("MUST still be present in
  the layout for consistency"). Rejected.
- **Apply speed / repeat to the emulated effects** — would require
  parameterising the Reanimated fade durations and adds a control
  surface area for marginal value. Rejected.

---

## R7 — Replace mini-picker memory across effect switches

**Decision**: `secondarySymbol` is held in `screen.tsx` state and
*persists across effect changes within the session*. When Replace is
re-selected after switching away, the previously chosen secondary
symbol is restored (FR-027). The mini-picker shows the 12 curated
symbols *minus* the current primary (FR-025) — if the previously
remembered secondary equals the new primary, the default selection
falls back to the next symbol in catalog order.

**Rationale**: FR-027 mandates session-scoped memory of the secondary
selection. Holding it in the screen-level `useState` (rather than
inside the mini-picker component) is the simplest implementation and
honours FR-035 ("local component state; no global stores").

**Alternatives considered**:

- **Reset the secondary on every effect switch** — directly violates
  FR-027. Rejected.
- **Persist across sessions via AsyncStorage** — out of scope (spec's
  Out of Scope: "Per-user persistence ... resets on screen unmount").
  Rejected.

---

## R8 — Banner placement and copy

**Decision**: Render an `<AdvisoryBanner>` (a small inline `ThemedView
+ ThemedText`) at the top of `screen.tsx`'s scroll content, gated by a
single `Platform.OS !== 'ios'` check. Copy: `"iOS 17+ only"` (matches
FR-028 verbatim). On iOS at runtime — including iOS < 17 — the banner
is *not* shown because spec 006's registry-level `minIOS: '17.0'`
gating means the screen is unreachable on iOS < 17 (FR-004).

**Rationale**:

- The banner is one inline `ThemedView`; splitting `screen.tsx` into a
  `.web.tsx` + `.android.tsx` would duplicate the entire ~250 LOC
  screen for a 3-line difference. The single-value-branch carve-out in
  constitution III is exactly designed for this case.
- Gating on `Platform.OS !== 'ios'` (rather than `=== 'web'` or
  `=== 'android'`) ensures the banner appears on both Android and Web
  with one branch.

**Alternatives considered**:

- **`screen.web.tsx` + `screen.android.tsx` split** — duplication
  burden vs. clarity is a clear loss. Rejected.
- **A dedicated `<NonIosBanner />` component returning `null` on iOS**
  — cleaner abstraction; we'll do this if the banner grows beyond a
  one-liner. For v1 the inline branch is the right amount of
  structure.

---

## R9 — Test surface

**Decision**: Seven test files under `test/unit/modules/sf-symbols-lab/`
(see plan §Project Structure). Each file's responsibility:

- `manifest.test.ts` — id matches `/^[a-z][a-z0-9-]*$/`, equals
  `'sf-symbols-lab'`, `platforms` ⊆ `{ios,android,web}`,
  `minIOS === '17.0'`, `render` is a function. Complements the global
  `manifest.test.ts` from spec 006.
- `catalog.test.ts` — `SYMBOLS.length === 12`, `EFFECTS.length === 7`,
  every effect id is unique, the only effect with
  `requiresSecondarySymbol === true` is Replace, the only effects with
  `respondsToSpeed === true` are Bounce / Pulse / Scale / Variable
  Color (R6 table).
- `components/AnimatedSymbol.test.tsx` — mocks `expo-symbols`, asserts
  the prop graph passed to `SymbolView` for each of the 4 native-
  bindable effects, asserts that Replace re-renders with the secondary
  `name` after `playToken` bumps, asserts the plain-text fallback
  branch is taken when `Platform.OS === 'web'`, asserts no
  `expo-symbols` symbol is invoked off-iOS.
- `components/SymbolPicker.test.tsx` — renders 12 cells, default
  selection is `heart.fill`, tap updates the selected id.
- `components/EffectPicker.test.tsx` — renders 7 segments, default
  selection is Bounce, tap updates the selected id.
- `components/TintPicker.test.tsx` — renders 4 swatches, tap fires
  the parent `onChange` with the tapped colour token.
- `screen.test.tsx` — integration: all four pickers render; banner
  visible only when `Platform.OS !== 'ios'`; switching effect to
  Replace mounts the mini-picker; switching away unmounts it but
  `secondarySymbol` is preserved (FR-027); pressing Play Effect on Web
  raises no error and does not invoke `expo-symbols`.

**Rationale**: FR-039 + constitution V. Story-to-test mapping is in
`contracts/test-plan.md`.

---

## R10 — Story → quality gate mapping (for tasks.md)

| Story | Files touched | Tests that cover it |
|---|---|---|
| Story 1 — pick a symbol + play an effect on iOS 17+ | `index.tsx`, `screen.tsx`, `catalog.ts`, `components/SymbolPicker.tsx`, `components/EffectPicker.tsx`, `components/AnimatedSymbol.tsx`, registry update | `manifest.test.ts`, `catalog.test.ts`, `components/SymbolPicker.test.tsx`, `components/EffectPicker.test.tsx`, `components/AnimatedSymbol.test.tsx`, `screen.test.tsx` |
| Story 2 — speed / repeat / tint / Replace mini-picker | `screen.tsx`, `components/TintPicker.tsx`, Replace mini-picker (in `screen.tsx`) | `components/TintPicker.test.tsx`, `components/AnimatedSymbol.test.tsx` (Replace branch), `screen.test.tsx` (mini-picker visibility + secondary memory) |
| Story 3 — Android / Web fallback + banner | `screen.tsx` (banner branch), `components/AnimatedSymbol.tsx` (fallback branch) | `components/AnimatedSymbol.test.tsx` (web branch), `screen.test.tsx` (banner case) |

`pnpm check` (format → lint → typecheck → test) is the final gate —
see quickstart §Quality Gates.
