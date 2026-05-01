# Quickstart: Swift Charts Playground

Manual verification steps for the Swift-native paths that cannot be
exercised under Jest. Run after `pnpm check` passes.

## Prerequisites

- iPhone with **iOS 16 or later** (preferably iOS 17+ to verify the
  `chartXSelection` selection gesture; on iOS 16 the implementation
  falls back to a tap gesture per `research.md` Decision 1)
- Android device or emulator
- A modern desktop browser (Chrome, Safari, or Firefox)
- Spot dev client built from this branch with the local Swift
  `ChartView` extension included
- Optional: a second iPhone running iOS 15 to verify the registry's
  `minIOS: '16.0'` gating (FR-004)

## 0. Build prep (one-time, after pulling this branch)

```sh
pnpm install
pnpm check                 # format + lint + typecheck + jest
npx expo run:ios           # rebuilds the dev client with the local Swift extension
npx expo run:android       # Android dev client (no native rebuild needed for this module)
```

The local Swift extension lives at
`src/modules/swift-charts-lab/native/ios/`. `npx expo run:ios` is
required because Apple's `Charts` framework is iOS 16+ only and the
extension's `Podfile` entry triggers a CocoaPods install. Web does
not require a rebuild.

## 1. iOS 16+ — happy path (Stories 1, 2, 3)

1. Launch the dev client on iPhone 16+.
2. Open the Modules tab. **Verify**: a "Swift Charts Lab" card is
   visible in source order alongside the existing modules
   (FR-002, SC-001).
3. Tap the card. **Verify**: the screen renders without an
   "iOS 16+ only" banner (FR-006(a)). The chart-type segmented
   control reads Line / Bar / Area / Point with **Line selected**
   (FR-008, FR-009). A real Swift Charts line chart at least 300 pt
   tall plots the 12-month dataset (FR-007, FR-011).
4. Tap **Bar**. **Verify**: the chart morphs into bars within the
   default Swift Charts animation (~0.3 s); the same 12 values are
   plotted (FR-010).
5. Tap **Area**, then **Point**. **Verify**: each transition
   animates and the dataset is preserved.
6. Tap **Randomize data**. **Verify**: every mark animates from
   its old value to a new value within the visible range; series
   length stays at the previous value (FR-013).
7. Tap **Add point** repeatedly until the button greys out.
   **Verify**: each tap appends a mark with the next month label
   (`'Jan'`, `'Feb'`, …, `'Dec'`, `'Jan ʼ27'`, `'Feb ʼ27'`, …);
   the button disables at length 24 (FR-014, FR-016, planning
   resolution of NEEDS CLARIFICATION #1 + #2).
8. Tap **Remove point** repeatedly. **Verify**: each tap pops the
   most recent mark with an animation; the button disables at
   length 2 (FR-015, FR-016).
9. Tap each of the four tint swatches in turn. **Verify**: chart
   marks recolor within ~300 ms (SC-005); the selected swatch
   gains a ring + checkmark (FR-035). Selection survives a chart
   type change.
10. With Line active, toggle **Show foreground style** on.
    **Verify**: the line stroke gains a vertical gradient derived
    from the active tint (FR-021). Switch to Area; the area fill
    gains the same gradient. Switch to Bar; the chart still
    renders correctly with no gradient applied (FR-022). Toggle
    off, switch back to Line — the line returns to flat tint
    (FR-022).
11. Tap a mark on Bar. **Verify**: an inline indicator appears
    showing the month label and value (FR-024, SC-007). Tap
    elsewhere — indicator dismisses (FR-026). Re-select. Tap
    Randomize — indicator dismisses (FR-026).
12. Switch to Line. Tap *near* the curve between two data points.
    **Verify**: the indicator snaps to the nearest data point
    (FR-025). Switch to a different chart type — indicator
    dismisses (FR-026).

## 2. iOS 15 (FR-004, SC-009) — optional, skip if no iOS 15 device

1. On an iPhone running iOS 15, open the Modules tab.
2. **Verify**: the Swift Charts Lab card is either hidden or
   rendered with the registry's standard "unavailable" treatment
   per spec 006 (FR-002, FR-004). The exact treatment is owned by
   feature 006 and not re-asserted here.
3. **Developer**: confirm in the bundler logs that
   `@expo/ui/swift-ui` and the local Swift `ChartView` symbol were
   never resolved on this device (search for any iOS-only import
   error — there should be none).

## 3. Android (Story 5)

1. Build the dev client for Android and launch.
2. Open the Modules tab → Swift Charts Lab.
3. **Verify**: the screen renders with an **"iOS 16+ only" banner**
   at the top (FR-028) whose copy includes the sentence
   "Mark selection is available on iOS 16+ only." (planning
   resolution of NEEDS CLARIFICATION #3).
4. **Verify**: all five controls (chart-type segmented control,
   Randomize, Add, Remove, tint swatches, gradient toggle) render
   and are interactive (FR-029).
5. Tap each chart type segment. **Verify**: the fallback bar chart
   visibly updates — Bar shows full bars; Line / Area show bars
   plus a top stripe; Point shows small dots (Decision 2 in
   `research.md`).
6. Tap Randomize. **Verify**: bars animate to new heights via the
   `LayoutAnimation` ease-in-out (Decision 2). Add / Remove
   produce ±1 visible columns; the buttons disable at the
   configured bounds (FR-029, FR-016).
7. Tap each swatch. **Verify**: bar fills (and dots / line
   stripes) recolor.
8. Toggle Show foreground style on with Bar active. **Verify**:
   bars adopt a vertical gradient (the stacked translucent
   overlay). Toggle off — bars return to flat fill. Switch to
   Line / Area / Point — toggle has no visible effect (FR-023).
9. **Verify**: tapping a bar does **nothing** (no selection on the
   fallback per planning resolution of NEEDS CLARIFICATION #3).
10. **Verify** (developer): no warnings appear in the Metro logs
    related to missing iOS-only modules; the Android variant must
    not import `@expo/ui/swift-ui` (FR-031).

## 4. Web (Story 5, FR-030, FR-031)

1. Run `pnpm web` and open the page in Chrome on a desktop.
2. Navigate to Modules → Swift Charts Lab.
3. **Verify**: the screen renders with the **"iOS 16+ only"
   banner** at the top (FR-028).
4. **Verify**: all five controls render and are interactive
   (FR-029); the same fallback chart visuals as Android render.
5. Open the browser devtools console. **Verify**: no runtime
   errors related to missing iOS-only Swift Charts symbols; no
   `requireNativeViewManager` warnings (SC-008, FR-031).
6. Cycle through chart types and dataset operations. **Verify**:
   the fallback updates on each tap. Animations are single-frame
   on Web (`LayoutAnimation` is a no-op on Web — acceptable per
   the spec's fallback wording).
7. Tap a tint swatch. **Verify**: bar fills recolor. Toggle the
   gradient. **Verify** (Bar only): the overlay child appears.

## 5. Lifecycle (Edge Cases, FR-032, FR-033)

1. On iOS 16+, Start a Randomize animation and immediately tap a
   different chart type. **Verify**: no orphan marks; chart ends
   in the new type with the latest dataset (Edge Case
   "Switching chart types while an animation is in flight").
2. Background the app while an animation is in flight (press the
   home button mid-Randomize). Wait 5 s. Foreground the app.
   **Verify**: chart restored with the same chart type, dataset,
   tint, and gradient toggle state (FR-033). In-flight animations
   may have settled directly to their final values.
3. Navigate away from the screen mid-animation. **Verify**
   (developer): no animation callbacks fire after unmount; no
   layout warnings emitted (FR-032, SC-007 wording).
4. With a mark selected on iOS 16+, tap Randomize / Add / Remove
   or switch chart type. **Verify**: the selection indicator
   dismisses on every one of those actions (FR-026, Edge Case
   "Selection across chart-type changes").

## 6. Accessibility (FR-034, FR-035, FR-036, FR-037)

1. On iOS, enable VoiceOver (Settings → Accessibility →
   VoiceOver).
2. Open the Swift Charts Lab. **Verify**: the chart-type
   segmented control announces "Chart type: Line", "Chart type:
   Bar", etc. (FR-034). Each tint swatch announces "Tint: blue"
   etc. The gradient toggle announces "Show foreground style on"
   / "off" (FR-034).
3. Add point until the series is at max. **Verify**: VoiceOver
   announces "Add point, dimmed" (or equivalent platform wording
   for `accessibilityState.disabled`) — FR-036.
4. Repeat on Android with TalkBack and on Web with the screen
   reader of choice. **Verify**: same announcements (FR-034) and
   that the fallback chart announces a single accessible summary
   (e.g. "Chart with 12 values, currently in Bar mode") instead
   of a collection of unlabelled `<View>` nodes (FR-037).

## 7. Quality gates (SC-011, FR-043)

```sh
pnpm check
```

**Verify**: format, lint, typecheck, and Jest all pass with zero
warnings introduced by the new module.

## 8. Additive-only invariant (SC-010)

```sh
git diff --stat main..HEAD -- ':!src/modules/swift-charts-lab/' \
                              ':!test/unit/modules/swift-charts-lab/' \
                              ':!specs/012-swift-charts-playground/'
```

**Verify**: the only file outside the module / test / spec
directories with diffs is:

- `src/modules/registry.ts` — exactly one added import line and
  one added array entry (after `sensorsPlayground`).

If the local Swift extension required app-config edits
(`app.json` / `Podfile.properties.json`), they are documented here
and counted as the documented exception in SC-010 — but the
preferred path is to keep the extension fully under
`src/modules/swift-charts-lab/native/` so no app-config edit is
needed. Verify with the diff above before opening the PR.

## 9. Stress (Edge Cases)

1. Tap chart-type segments rapidly in alternating order
   (Bar → Line → Area → Bar → Point → Line) for ~10 seconds.
   **Verify**: no crash; final state matches the last tap; no
   orphan marks (Edge Case "Rapid control tapping").
2. Hold Add point until disabled, then hold Remove until disabled.
   **Verify**: bounds respected; no crash; series ends at the
   bound nearest the last action.
