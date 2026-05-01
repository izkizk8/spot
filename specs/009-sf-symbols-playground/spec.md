# Feature Specification: SF Symbols Lab

**Feature Branch**: `009-sf-symbols-playground`  
**Created**: 2026-05-14  
**Status**: Draft  
**Input**: User description: "A new module added to the iOS Feature Showcase app's plugin registry showing off SF Symbols and the iOS 17+ symbol effects (bounce, pulse, scale, variable color, replace, appear, disappear)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pick a symbol and play an effect on iOS 17+ (Priority: P1)

A user opens the Spot iOS Feature Showcase on an iPhone running iOS 17 or
later, sees an "SF Symbols Lab" card on the Modules home grid, taps it, and
lands on a screen with a horizontal symbol picker and an effect picker. They
tap a symbol (e.g. `heart.fill`), tap an effect (e.g. Bounce), then tap
"Play Effect". The large preview area immediately animates the chosen
SF Symbol with the chosen effect, using the project's default tint.

**Why this priority**: This is the core demonstration value of the module —
without it, the screen shows nothing useful. It is also the smallest slice
that proves the registry entry, the iOS 17 gating, and the `expo-symbols`
integration all work end-to-end.

**Independent Test**: Install a dev build on an iPhone running iOS 17+, open
the Modules grid, tap the "SF Symbols Lab" card, pick a symbol, pick an
effect, tap Play Effect, and verify the preview symbol animates with the
chosen effect. The MVP is shippable on this slice alone.

**Acceptance Scenarios**:

1. **Given** the user is on the Modules home grid on an iOS 17+ device,
   **When** they look at the list of available modules, **Then** an
   "SF Symbols Lab" card is visible and tappable.
2. **Given** the user is on the SF Symbols Lab screen, **When** the screen
   first renders, **Then** the symbol picker shows exactly 12 curated
   symbols horizontally scrollable, and the first symbol is selected by
   default.
3. **Given** the user is on the SF Symbols Lab screen, **When** the screen
   first renders, **Then** the effect picker shows seven effects (Bounce,
   Pulse, Scale, Variable Color, Replace, Appear, Disappear) and one is
   selected by default.
4. **Given** the user has selected a symbol and an effect, **When** they
   tap "Play Effect", **Then** the preview area animates the selected
   symbol with the selected effect within 100 ms of the tap.
5. **Given** the user changes the selected symbol, **When** the new
   selection is made, **Then** the preview area updates to render the new
   symbol (still tinted with the current theme color and ready to play
   the current effect).

---

### User Story 2 - Configure speed, repeat, tint, and Replace target (Priority: P2)

After Story 1 the user wants more control. They adjust a 3-segment speed
selector (Slow / Normal / Fast), a 3-segment repeat selector
(Once / 3 times / Indefinite), and a 4-swatch theme color picker that
re-tints the preview symbol live. When they pick the "Replace" effect, an
additional "Replace with" mini-picker appears letting them choose the second
symbol that the primary symbol will swap to. Tapping Play Effect honours all
of these settings.

**Why this priority**: Configuration turns a one-shot demo into an actual
playground and is the differentiator vs. a trivial showcase. It depends on
Story 1 (symbol + effect + play) being in place.

**Independent Test**: After Story 1 is shipped, on an iOS 17+ device, change
the speed to Fast and the repeat to 3 times, pick a different tint swatch,
choose the Replace effect, pick a "Replace with" symbol, then tap Play
Effect. Verify the preview tints correctly, plays at a faster cadence, and
swaps to the chosen second symbol three times.

**Acceptance Scenarios**:

1. **Given** the SF Symbols Lab screen is open, **When** the user taps a
   different speed segment, **Then** the next Play Effect uses that speed.
2. **Given** the SF Symbols Lab screen is open, **When** the user selects
   a repeat option, **Then** the next Play Effect repeats accordingly
   (Once = 1 cycle, 3 times = 3 cycles, Indefinite = until the user taps
   Play Effect again or leaves the screen).
3. **Given** the SF Symbols Lab screen is open, **When** the user taps a
   different theme color swatch, **Then** the preview symbol re-renders
   tinted with that color immediately, without requiring a Play Effect tap.
4. **Given** the user selects the Replace effect, **When** the effect
   becomes active, **Then** a "Replace with" mini-picker appears showing
   the same 12 curated symbols (excluding the currently selected primary
   symbol) and one is selected by default.
5. **Given** the user has chosen a "Replace with" symbol, **When** they
   tap Play Effect, **Then** the preview animates the Replace transition
   from the primary symbol to the secondary symbol.
6. **Given** the user switches away from the Replace effect, **When** the
   effect changes, **Then** the "Replace with" mini-picker is hidden, and
   any previously chosen secondary symbol is remembered for the next time
   Replace is selected during the same session.

---

### User Story 3 - Cross-platform fallback on Android and Web (Priority: P2)

A user opens the SF Symbols Lab on Android or in a web browser. The screen
still loads, the symbol picker and the effect picker still render and are
fully tappable, and the theme color picker still works, but the preview
area shows a static plain-text glyph fallback (the symbol name rendered as
text) and a clearly visible banner reads "iOS 17+ only" at the top of the
screen. No errors are thrown; Play Effect is a safe no-op.

**Why this priority**: Constitution Principle I (Cross-Platform Parity)
requires every showcase module to render on iOS, Android, and Web with
platform-aware fallbacks rather than a hard "not supported" wall. This
story validates that requirement for a feature that is fundamentally
iOS-only at the native level.

**Independent Test**: After Story 1 is shipped, run the same screen on an
Android device and in a web build. Verify the banner appears, the symbol
picker, effect picker, and tint picker all render and respond to taps, and
the preview shows the symbol name as plain text styled with the current
tint. Confirm Play Effect produces no error.

**Acceptance Scenarios**:

1. **Given** the user is on Android or Web, **When** the SF Symbols Lab
   screen loads, **Then** a banner reading "iOS 17+ only" is visible at
   the top of the screen.
2. **Given** the user is on Android or Web, **When** the screen renders,
   **Then** the symbol picker, effect picker, and tint picker still
   render and accept input.
3. **Given** the user is on Android or Web, **When** they change the
   selected symbol or tint, **Then** the preview's static plain-text
   glyph updates to show the new symbol's name styled with the new tint.
4. **Given** the user is on Android or Web, **When** they tap Play Effect,
   **Then** no error is raised, no exception escapes, and the preview
   does not attempt a native symbol animation.
5. **Given** the user is on iOS at a version below 17, **When** they
   attempt to open the module, **Then** the registry hides or disables
   the card per the existing 006 minIOS gating behavior, and no crash
   occurs.

---

### Edge Cases

- **Rapid Play Effect taps**: Tapping Play Effect repeatedly during an
  active animation MUST be safe; the system MAY restart the animation or
  coalesce the taps, but MUST NOT crash, leak timers, or spawn unbounded
  parallel animations.
- **Repeat: Indefinite running while user navigates away**: An indefinite
  effect MUST be cancelled on screen unmount; no animation timers or
  native effect cycles MUST persist after leaving the screen.
- **Switching effect mid-animation**: Selecting a new effect while one is
  playing MUST stop the current animation cleanly before the next Play
  Effect tap.
- **Replace with same symbol**: Selecting the same symbol on both sides of
  Replace MUST be prevented in the UI (the current primary is excluded
  from the "Replace with" mini-picker).
- **Effect not applicable to a symbol**: If the underlying library reports
  that the chosen effect is not supported for the chosen symbol on the
  current OS, the system MUST degrade gracefully (no exception) and MUST
  surface an unobtrusive inline indication; the rest of the screen MUST
  remain interactive.
- **Reduced-motion / accessibility**: Symbol effects MUST respect the
  platform reduced-motion setting (degrade to a static render or a single
  short pulse) on iOS 17+; the screen MUST remain interactive.
- **Android/Web with no native symbols**: All effect invocations MUST be
  safe no-ops; the static plain-text glyph fallback MUST always render.

## Requirements *(mandatory)*

### Functional Requirements

#### Module registration

- **FR-001**: System MUST register an "SF Symbols Lab" module in the
  plugin registry introduced by feature 006, with id `sf-symbols-lab`,
  declaring supported platforms `['ios', 'android', 'web']` and
  `minIOS: '17.0'`.
- **FR-002**: The Modules home grid MUST display the SF Symbols Lab card
  alongside other registered modules using the same card visual treatment.
- **FR-003**: Tapping the SF Symbols Lab card MUST navigate to the
  SF Symbols Lab screen via the registry's standard navigation flow.
- **FR-004**: The registry's existing iOS-version gating from feature 006
  MUST continue to govern card visibility/availability on iOS versions
  below 17.0; this module MUST NOT introduce a parallel gating mechanism.

#### Symbol picker

- **FR-005**: The screen MUST present a Symbol Picker as a horizontally
  scrollable row of exactly 12 curated SF Symbols:
  `heart.fill`, `star.fill`, `bolt.fill`, `cloud.sun.fill`, `flame.fill`,
  `drop.fill`, `leaf.fill`, `sparkles`, `moon.stars.fill`,
  `cloud.bolt.rain.fill`, `sun.max.fill`, `snowflake`.
- **FR-006**: The Symbol Picker MUST visually indicate the currently
  selected symbol (e.g. via a selected-state background, border, or scale).
- **FR-007**: Tapping any item in the Symbol Picker MUST update the
  selected symbol and update the preview area on all platforms.
- **FR-008**: On first render, the Symbol Picker MUST default to the first
  symbol in the curated list (`heart.fill`).

#### Effect picker

- **FR-009**: The screen MUST present an Effect Picker as a segmented
  control offering exactly seven effects: Bounce, Pulse, Scale,
  Variable Color, Replace, Appear, Disappear.
- **FR-010**: Tapping any segment MUST update the selected effect.
- **FR-011**: On first render, the Effect Picker MUST default to Bounce.
- **FR-012**: The Effect Picker MUST be visible and interactive on all
  three platforms (iOS, Android, Web), even when the preview is the
  static fallback.

#### Configuration row

- **FR-013**: The screen MUST present a Speed selector as a 3-segment
  control with options Slow / Normal / Fast, defaulting to Normal, using
  the same visual pattern as the speed selector in the feature 006
  playground.
- **FR-014**: The screen MUST present a Repeat selector as a 3-segment
  control with options Once / 3 times / Indefinite, defaulting to Once.
- **FR-015**: When the selected effect does not meaningfully respond to
  speed (e.g. Appear, Disappear, Replace), the Speed selector MAY be
  rendered in a visually de-emphasized (disabled) state but MUST still
  be present in the layout for consistency.
- **FR-016**: When the selected effect does not meaningfully respond to
  repeat (e.g. Appear, Disappear, Replace), the Repeat selector MAY be
  rendered in a visually de-emphasized (disabled) state but MUST still
  be present in the layout for consistency.

#### Trigger and preview

- **FR-017**: The screen MUST present a "Play Effect" trigger button.
- **FR-018**: When Play Effect is tapped on iOS 17+, the system MUST
  apply the currently selected effect to the currently selected symbol
  in the preview area, honouring the current Speed and Repeat settings.
- **FR-019**: The preview area MUST render the currently selected symbol
  large enough to be the visual focus of the screen (the dominant region
  of the layout).
- **FR-020**: The preview area MUST tint the symbol with the currently
  selected theme color at all times, on all platforms.
- **FR-021**: Repeat: Indefinite MUST continue cycling the effect until
  the user taps Play Effect again (which stops it) or until the screen
  unmounts.

#### Theme color picker

- **FR-022**: The screen MUST present a Theme Color picker showing
  exactly 4 swatches drawn from the project's centralized theme tokens.
- **FR-023**: Tapping a swatch MUST immediately re-tint the preview
  symbol on all platforms; no Play Effect tap MUST be required.
- **FR-024**: The Theme Color picker MUST visually indicate the currently
  selected swatch.

#### Replace-effect "Replace with" mini-picker

- **FR-025**: When and only when the Replace effect is selected, the
  screen MUST display a "Replace with" mini-picker offering the same 12
  curated symbols, excluding the currently selected primary symbol.
- **FR-026**: When Replace is active and the user taps Play Effect, the
  preview MUST animate the SF Symbols Replace transition from the
  primary symbol to the chosen secondary symbol on iOS 17+.
- **FR-027**: When the user switches away from Replace, the "Replace with"
  mini-picker MUST be hidden but the previously chosen secondary symbol
  MUST be remembered for the remainder of the session.

#### Cross-platform behavior

- **FR-028**: On Android and on Web, the screen MUST display a clearly
  visible banner reading "iOS 17+ only" at the top of the screen.
- **FR-029**: On Android and on Web, the preview area MUST render a
  static plain-text glyph fallback consisting of the selected symbol's
  textual name styled with the current tint and a large display weight.
- **FR-030**: On Android and on Web, the symbol picker, effect picker,
  configuration row, theme color picker, and Replace mini-picker MUST
  still render and respond to user input.
- **FR-031**: On Android and on Web, tapping Play Effect MUST be a safe
  no-op and MUST NOT throw or surface errors.

#### Architecture & quality

- **FR-032**: The module's source MUST live under
  `src/modules/sf-symbols-lab/` with the following structure:
  `index.tsx` (manifest), `screen.tsx`, `catalog.ts`, and a
  `components/` directory containing `SymbolPicker`, `EffectPicker`,
  `AnimatedSymbol`, and `TintPicker`.
- **FR-033**: The module MUST be registered with the registry via a
  single import line added to `src/modules/registry.ts` and MUST NOT
  modify any other file outside `src/modules/sf-symbols-lab/`.
- **FR-034**: All native SF Symbol rendering and effect playback MUST go
  through a single `<AnimatedSymbol>` component that wraps the
  `expo-symbols` `SymbolView`, providing the only seam used by tests.
- **FR-035**: All component state MUST be local component state; no new
  global stores, contexts, or persistence layers MUST be introduced.
- **FR-036**: All styles MUST use `StyleSheet.create()` and the
  centralized theme tokens (`Spacing`, theme colors via the project's
  themed primitives, `ThemedText` / `ThemedView`); no hardcoded colors
  and no inline style objects outside StyleSheet.
- **FR-037**: TypeScript strict mode and the existing path aliases MUST
  be honoured; no relaxations or new lint/test tooling MUST be
  introduced.
- **FR-038**: All quality gates (`pnpm check`: format, lint, typecheck,
  test) MUST pass before the feature is considered complete.
- **FR-039**: Tests MUST cover, at minimum: `catalog.test.ts`,
  `SymbolPicker.test.tsx`, `EffectPicker.test.tsx`,
  `AnimatedSymbol.test.tsx` (mocking `expo-symbols`),
  `TintPicker.test.tsx`, `screen.test.tsx`, and `manifest.test.ts`,
  in line with constitutional Principle V (Test-First).

### Key Entities

- **CuratedSymbol**: One of the 12 fixed SF Symbol identifiers exposed by
  this module.
  - `name`: SF Symbol system name (e.g. `heart.fill`).
  - `displayLabel`: short human-readable label used in the picker and in
    the static fallback (derived from `name`).
- **SymbolEffect**: One of the seven effect kinds exposed by this module
  (Bounce, Pulse, Scale, Variable Color, Replace, Appear, Disappear).
  - `id`: stable identifier used in catalog/state.
  - `displayLabel`: human-readable label rendered in the segmented
    control.
  - `respondsToSpeed`: whether the Speed selector is meaningful for this
    effect.
  - `respondsToRepeat`: whether the Repeat selector is meaningful for
    this effect.
  - `requiresSecondarySymbol`: true only for Replace.
- **PlaybackConfig**: The transient, in-memory configuration applied on
  the next Play Effect tap.
  - `symbol`: selected `CuratedSymbol`.
  - `effect`: selected `SymbolEffect`.
  - `speed`: Slow | Normal | Fast.
  - `repeat`: Once | 3 times | Indefinite.
  - `tint`: selected theme color token.
  - `secondarySymbol`: optional `CuratedSymbol`, only honoured when
    `effect === Replace`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user lands on the Modules home grid on an iOS 17+
  device, opens the SF Symbols Lab, and sees a symbol animate with an
  effect in under 10 seconds without consulting docs.
- **SC-002**: From a tap on Play Effect on iOS 17+, the preview symbol
  begins animating in under 100 ms.
- **SC-003**: 100% of the seven effect types (Bounce, Pulse, Scale,
  Variable Color, Replace, Appear, Disappear) are exercisable from the
  screen without writing code.
- **SC-004**: 100% of the 12 curated symbols are selectable from the
  Symbol Picker and renderable in the preview area on all three
  platforms (animated on iOS 17+, static plain-text glyph on Android
  and Web).
- **SC-005**: On Android and on Web, opening the SF Symbols Lab screen
  produces zero runtime errors related to missing native SF Symbols
  APIs, and 100% of the non-preview UI controls remain interactive.
- **SC-006**: Switching the selected tint swatch updates the preview
  symbol's color in under 100 ms on all three platforms.
- **SC-007**: The SF Symbols Lab module ships with cross-platform
  parity: every acceptance scenario in Stories 1, 2, and 3 passes on
  iOS 17+, Android (where applicable), and Web (where applicable)
  before release.
- **SC-008**: The change is purely additive at the registry level:
  exactly one line is added to `src/modules/registry.ts` and no other
  file outside `src/modules/sf-symbols-lab/` is modified by this
  feature.
- **SC-009**: All quality gates (`pnpm check`) pass on the feature
  branch with no warnings introduced by this module.

## Out of Scope

The following are explicitly **not** part of this feature and will be
deferred to a future spec if pursued:

- Custom symbol images, SVG layering, or any non-SF-Symbols glyph
  source.
- Animated symbol transitions between unrelated symbols beyond the
  built-in Replace effect (no cross-fade, morph, or other custom
  transitions).
- iOS 16 (or earlier) fallbacks for individual effects; the entire
  module gates on iOS 17 at the registry level.
- Per-user persistence of the selected symbol, effect, speed, repeat,
  tint, or secondary symbol; all state is in-memory and resets on
  screen unmount.
- Sharing or exporting symbol/effect combinations.
- Variable-color value or fill-level controls beyond the built-in
  Variable Color effect's defaults.

## Assumptions

- The plugin registry from feature 006 is in place, exposes a stable
  `minIOS` field on module manifests, and already gates module visibility
  on iOS version, so this module does not need to reimplement gating.
- `expo-symbols` is already a project dependency (per the feature
  description) and exposes a `SymbolView` component capable of rendering
  SF Symbols and triggering iOS 17+ symbol effects, including the
  Replace transition between two symbols.
- The project's centralized theme tokens already include at least 4
  semantically distinct colors suitable for use as tint swatches; the
  TintPicker selects from those tokens rather than introducing new color
  literals.
- The feature 006 playground already defines a 3-segment Slow/Normal/Fast
  speed control pattern that this module reuses (visual, not code reuse
  is sufficient — a parallel local component is acceptable provided the
  visual pattern matches).
- A 4-swatch tint picker is sufficient for v1; expanding to a full color
  palette is out of scope.
- The static plain-text glyph fallback for Android and Web is acceptable
  as a "showcase" — there is no requirement to ship a Material Symbols
  or web-symbol parity layer in v1.
- The constitution at `.specify/memory/constitution.md` v1.0.1 applies
  uniformly; this feature does not request any constitutional exemption.
