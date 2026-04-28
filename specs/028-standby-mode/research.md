# Phase 0 — Research: StandBy Mode Showcase Module

Locks the small set of decisions still needed at plan time, validates
the riskiest assumption (the marker-guarded `WidgetBundle` insertion
into 014-owned source coexisting with 027's existing entry), and
captures the alternatives considered. All 17 spec-level open
questions were already pre-resolved in spec.md §"Open Questions
(resolved)"; this document covers **plan-level** decisions on top of
those.

## 1. StandBy Mode activation conditions and `widgetRenderingMode` semantics

**Decision**: Treat StandBy as a **rendering surface for existing
widgets**, not a separate framework. Declare `SpotStandByWidget` as a
normal `StaticConfiguration` widget with `supportedFamilies:
[.systemMedium, .systemLarge]` and let iOS 17+ choose to render it in
StandBy when the user's device meets the activation conditions.

**Activation conditions** (Apple, iOS 17 release notes;
[developer.apple.com/documentation/widgetkit/preparing-widgets-for-standby](https://developer.apple.com/documentation/widgetkit/preparing-widgets-for-standby)):

1. iPhone running iOS 17.0 or later (StandBy is iPhone-only; iPad has
   no StandBy mode).
2. Device on a charger (MagSafe / Qi puck / Lightning / USB-C).
3. Device oriented in **landscape**.
4. Device **locked**.

When all four hold simultaneously, iOS shows the StandBy view (Smart
Stack on the right, clock / photos / live activities on the left).
The user swipes vertically on the right Smart Stack to surface
specific widgets — the spot StandBy widget shows up as one entry in
that stack once added from the StandBy widget gallery.

**`widgetRenderingMode` SwiftUI environment value**: introduced in iOS
17, of type `WidgetRenderingMode`, with three documented cases:

| Case | When iOS sets it | Visual treatment |
|------|------------------|------------------|
| `.fullColor` | Default, on home screen and in StandBy when not in night mode | Saturated colour rendering, like a normal home-screen widget |
| `.accented` | StandBy / lock screen / Smart Stack gallery preview when the system wants a tinted treatment that respects the widget's accent zones | Two-layer: `accented` zones get the system tint; `accentable` zones (declared via `.widgetAccentable()`) get a contrasting colour drawn from the same accent | Used widely in StandBy in normal indoor lighting |
| `.vibrant` | StandBy night mode (typically iPhone 14 Pro / 15 Pro after dimming and ambient-light drop), AOD-capable iPhones in low-light StandBy | Translucent / luminance-preserving treatment in monochrome red (or white in some lighting); preserves luminance contrast only |

The `widgetRenderingMode` environment value is read inside the SwiftUI
view body and branched on; the system controls which mode is active
based on context. The user-selected `mode` field on `StandByConfig`
is **the user's preferred preview mode**, not a runtime override —
the app cannot force StandBy to render a particular mode on-device,
but the in-app live preview honours the selection authoritatively
(FR-SB-036).

**Rationale**:
- Documenting all four activation conditions in the setup
  instructions card (FR-SB-040) is the difference between a reviewer
  successfully completing US2 and giving up after charging the phone
  in portrait. The four conditions are non-obvious and Apple's iOS UI
  does not surface them.
- Differentiating between "user-selected `mode` for preview" and
  "system-applied `widgetRenderingMode` at render time" prevents a
  whole class of bug reports along the lines of "I picked Vibrant in
  the app but my StandBy widget renders in Full Color in daytime" —
  this is correct behaviour, not a bug, and the explainer card
  (FR-SB-039) needs to communicate it.

**Alternatives considered**:
- *Separate StandBy SDK*: rejected — there is no separate SDK. StandBy
  is a rendering surface for existing WidgetKit widgets that opt in
  by declaring system families and the accented rendering mode.
- *Force a particular `widgetRenderingMode` at render time*: rejected
  — Apple does not expose an API to override the system's choice.
  The only thing the widget can do is **opt into** accented rendering
  via `.widgetAccentedRenderingMode(.accented)` on the configuration.

## 2. `.widgetAccentedRenderingMode` modifier semantics

**Decision**: Chain
`.widgetAccentedRenderingMode(.accented)` on the `StaticConfiguration`
in `StandByWidget.swift` (FR-SB-007). Do **not** also chain
`.widgetAccentedRenderingMode(.fullColor)` (the system default).

**Semantics**:
- `.widgetAccentedRenderingMode(.accented)` declares that this widget
  supports the accented rendering treatment used in StandBy's Smart
  Stack and (some) lock-screen contexts. Without this declaration,
  iOS will render the widget in `.fullColor` even in contexts where
  it would prefer accented rendering — a common iOS-17 widget bug.
- The modifier takes a single `WidgetAccentedRenderingMode` enum
  value: `.fullColor` (the default; widget always renders in full
  colour regardless of context) or `.accented` (widget opts into the
  accented treatment when iOS asks for it).
- The two-layer accented treatment is per-`View`, not per-widget:
  inside the SwiftUI view bodies, calls to `.widgetAccentable()`
  designate which sub-views are "accentable" (get the contrasting
  colour) vs. the default "accented" baseline (gets the system tint).
  028's views designate the counter numeric text as `.widgetAccentable()`
  so the counter contrasts the showcase value in `.accented`
  rendering — see FR-SB-015 for the specific layout obligation.

**Rationale**:
- `.widgetAccentedRenderingMode(.accented)` is the documented opt-in
  required to make `widgetRenderingMode == .accented` ever fire for
  this widget on a real device. Without it, the user-selected
  `.accented` mode in the in-app preview would never match what they
  see on-device, undermining the entire showcase value.
- Pairing it with `.widgetAccentable()` annotations in the views (vs.
  applying `.foregroundStyle()` everywhere) makes the layout's accent
  zones explicit and makes the `.accented` rendering pleasing rather
  than monochrome-flat.

**Alternatives considered**:
- *Omit the modifier and let iOS fall back to `.fullColor`*: rejected
  — would defeat the entire point of demonstrating the three modes.
- *Set `.widgetAccentedRenderingMode(.fullColor)` explicitly*:
  rejected — same effect as omitting (it's the default), adds noise.
- *Branch on `widgetRenderingMode == .accented` in the views without
  declaring the modifier*: rejected — the branch will compile, but
  iOS will never set `widgetRenderingMode` to `.accented` for a
  widget that has not opted in via the configuration modifier, so
  the branch is unreachable on-device.

## 3. App Group sharing + bundle marker insertion strategy (commutativity proof)

**Decision**: Reuse 014's App Group exactly, the same way 027 does:
same suite name, same entitlement, no plugin changes to entitlements.
Use the **existing** marker pair in
`ios-widget/SpotWidgetBundle.swift` that 027's T001 prerequisite
back-patch added to 014's `with-home-widgets/add-widget-bundle.ts`.

```swift
@main
struct SpotWidgetBundle: WidgetBundle {
    var body: some Widget {
        LiveActivityDemoWidget()
        ShowcaseWidget()
        // MARK: spot-widgets:bundle:additional-widgets:start
        if #available(iOS 16, *) { LockScreenAccessoryWidget() }   // inserted by 027
        if #available(iOS 17, *) { StandByWidget() }               // inserted by 028
        // MARK: spot-widgets:bundle:additional-widgets:end
    }
}
```

**Insertion strategy — region replacement, not append**:

Both 027's `insert-bundle-entry.ts` and 028's `insert-bundle-entry.ts`
follow the same algorithm:

1. Read `ios-widget/SpotWidgetBundle.swift` from disk.
2. Locate the start marker `// MARK: spot-widgets:bundle:additional-widgets:start`
   and end marker `// MARK: spot-widgets:bundle:additional-widgets:end`.
   If either is missing, throw a descriptive error pointing the
   operator at 014's plugin (FR-SB-044). Fail-loud.
3. Compute the desired body of the bounded region as the
   **deterministic union** of all entries that all installed plugins
   own. Each plugin contributes one entry keyed by a stable
   identifier (027 owns the line containing `LockScreenAccessoryWidget()`,
   028 owns the line containing `StandByWidget()`). The order is
   **lexicographic by identifier** so the final order is independent
   of plugin invocation order: `LockScreenAccessoryWidget` < `StandByWidget`.
4. Replace the bounded region (between but not including the markers)
   with the recomputed body. Lines outside the region are untouched.
5. Write the file back only if the content changed.

**Commutativity proof**:

Let `B(p₁, p₂, …, pₙ)` be the bundle file state after invoking plugins
`p₁ … pₙ` in that order, starting from 014's emitted state (markers
+ empty bounded region). Each plugin contributes a *set* of owned
entries; the final region body is determined entirely by the union
of those sets, sorted lexicographically. Sets are commutative under
union. Lexicographic sort is deterministic. Therefore:

```text
B(014, 027, 028) = B(014, 028, 027) = B(027, 014, 028) = …
```

for any permutation of `{027, 028}` after 014 (014 must precede the
others because it owns the markers' existence). All 6 permutations of
`{014, 027, 028}` that put 014 first produce identical state. The 4
permutations that put 014 second or third produce the fail-loud error
in step 2 — which is correct behaviour and is itself
order-insensitive. So the system is commutative on the manifold of
"valid orderings" and fails identically off-manifold.

**Rationale**:
- Append-style insertion would NOT be commutative: if 027's plugin
  ran twice (e.g. after 028 was installed), it would append its line
  twice. Region replacement is idempotent by construction.
- Lexicographic ordering of the bounded region body keeps the diff
  reviewable and prevents merge churn — adding a future widget kind
  inserts a single line at its alphabetic position, not at the
  bottom.
- Spec-resolved decision #14 (FR-SB-044) mandates fail-loud on
  missing markers; the algorithm honours this in step 2 before any
  edit.

**Alternatives considered**:
- *Append-only with idempotency check*: rejected — fragile under
  out-of-order plugin invocation; requires every plugin to know about
  every other plugin's marker line to avoid duplication. Region
  replacement is local, the union/sort is global, and the contract
  between plugins is just "own a deterministic identifier".
- *One combined plugin owning all bundle entries*: rejected — would
  require editing 014's plugin every time a new widget kind is
  added (forbidden by additive-integration rule). Per-feature plugins
  with a shared marker pair is the agreed shape (FR-SB-043).
- *Different marker pair per inserter*: rejected — 027 already
  established the single marker pair convention and it works. Adding
  028-specific markers would require a 014 file edit and is forbidden.

## 4. Storage-sharing decision: same suite, disjoint key namespace, plus a `mode` field

**Decision**: Use the same App Group `UserDefaults(suiteName:)` that
014 and 027 use, but under a third disjoint key namespace rooted at
`spot.widget.standbyConfig`, with the schema gaining one field
beyond 014/027:

```text
spot.widget.standbyConfig.showcaseValue   : String
spot.widget.standbyConfig.counter         : Int
spot.widget.standbyConfig.tint            : String   (one of: red / blue / green / orange)
spot.widget.standbyConfig.mode            : String   (one of: fullColor / accented / vibrant)
```

The `mode` field is the only structural delta from 014/027's schema.
The `Tint` enum is shared with 014/027.

**Rationale**:
- Sharing the *suite* (App Group + entitlement + UserDefaults instance)
  reuses 014's already-working entitlement plumbing — no new App Group
  entitlement edits, no migration risk for existing 014/027 users.
- Disjoint *key namespaces* keep the three demos independently
  observable: pushing 014's home config does not change 027's
  lock-screen state and does not change 028's StandBy state, and vice
  versa. This is required by spec edge case "App Group key collision
  with 014 / 027" and AC-SB-009.
- The new `mode` field is necessary because the StandBy widget's
  rendering branches on this user-selected preview mode for the
  in-app preview AND must persist across app restarts so the next
  push reflects the user's last choice. Storing it in the App Group
  also lets the on-device widget's TimelineProvider pick up the user's
  preferred mode for any features that key off it (e.g. content
  ordering).
- The user-input requested storage-sharing decision was: "share
  014's App Group suite with `spot.widget.standbyConfig` key + `mode`
  field". This research locks that decision exactly.

**Alternatives considered**:
- *Separate App Group for 028*: rejected — would require a new
  entitlement, new bundle-id derivation, new code-signing concerns,
  for zero added isolation (the App Group is just a UserDefaults
  scope and disjoint keys provide all the isolation we need).
- *Reuse 014's keys directly and add the `mode` field on the same
  namespace*: rejected — would force 014's home widget to know about
  the `mode` field (which is irrelevant to it) and would conflate
  three demos' states into one shared blob. AC-SB-009 explicitly
  requires the three namespaces to be disjoint.
- *Store `mode` only on the AsyncStorage shadow, not in the App
  Group*: rejected — the on-device widget cannot read AsyncStorage,
  so the `mode` would not survive a push and the on-device widget
  could never honour the user's last selection if the system later
  decides to read it.

## 5. Cross-module data-control reuse vs. local copy

**Decision**: By default, `StandByConfigPanel.tsx` imports the
showcase-value field, counter input, and tint picker as **inner
widgets** from 014's
`src/modules/widgets-lab/components/` (the same source 027's
`ConfigPanel` re-export points at). The rendering-mode segmented
picker is new and lives in 028's
`src/modules/standby-lab/components/RenderingModePicker.tsx`.

Fallback (R-C in plan.md): if cross-module import surfaces a circular
dependency between `widget-config.ts` (014) / `lock-config.ts` (027) /
`standby-config.ts` (028), reimplement the three inner widgets locally
in `StandByConfigPanel.tsx` and document the rationale in this file
before merge.

**Rationale**:
- Spec-resolved decision #8 (FR-SB-028) prefers import over copy to
  avoid drift between the three widget configs' data controls.
- 027's `ConfigPanel` re-export proved the import path works for the
  full panel; 028 imports the *inner* widgets (not the whole panel)
  because 028's panel composition differs (it adds the rendering-mode
  picker between the tint picker and the push button).
- The fallback exists because three-way circular dependencies are
  harder to reason about than 027's two-way case; if it bites, switching
  to local copy is a one-file change and adds ≤ 80 LOC of duplication.

**Alternatives considered**:
- *Always local copy*: rejected — duplicates ≥ 80 LOC of styling and
  validation logic; high drift risk over time as 014's controls
  evolve (e.g. accessibility refinements).
- *Re-export 027's `ConfigPanel` directly and append the picker
  externally*: rejected — 027's `ConfigPanel` does not expose a
  trailing-children slot; modifying 027 is forbidden. Composing 014's
  inner widgets directly is cleaner.

## 6. Bridge surface: dedicated symbols vs. generic key-namespace argument

**Decision**: Take the **dedicated symbols** path: add
`setStandByConfig(config: StandByConfig)` and
`getStandByConfig(): Promise<StandByConfig>` to `WidgetCenterBridge`.
Reuse the existing `reloadTimelinesByKind(kind: string)` symbol
(added by 027) for the per-kind reload — do NOT add a parallel
`reloadStandByTimelines` symbol.

**Rationale**:
- Matches 027's precedent (`setLockConfig` / `getLockConfig`),
  preserving symmetry across the three widget surfaces.
- Strongly typed `StandByConfig` parameter at the bridge boundary
  catches schema drift at compile time (e.g. forgetting to write the
  `mode` field) instead of at on-device runtime.
- Per-kind config getters/setters are independently mockable in
  tests; a generic key-namespace setter would conflate test setup
  for 014/027/028 and reduce signal in failures.
- Reusing `reloadTimelinesByKind` is mandated by FR-SB-024 and
  prevents bridge surface bloat; the kind identifier
  `"SpotStandByWidget"` is the only delta at the call site.

**Alternatives considered**:
- *Generic `setConfigForNamespace(ns, config)`*: rejected — would
  weaken the type signature and conflate tests. 027 explicitly chose
  dedicated symbols for the same reasons.
- *Add `reloadStandByTimelines()` for symmetry with hypothetical
  per-kind reload symbols*: rejected — FR-SB-024 forbids parallel
  reload symbols; reuse is the correct shape.

## 7. `.widgetURL` deep-link route resolution

**Decision**: Annotate the StandBy view root with
`.widgetURL(URL(string: "spot://modules/standby-lab")!)`. The path
segment `standby-lab` matches the registry id, which Expo Router
resolves via its standard scheme handling.

**Rationale**:
- Spot's URL scheme is `spot://` (declared in `app.json` /
  `Info.plist` by Expo Router via the `scheme` field).
- Expo Router's typed routes resolve `/modules/[id]` to the module
  screen for the registry entry whose `id` matches `[id]`. The
  registry id for this feature is `'standby-lab'` (FR-SB-001).
- Annotating the StandBy view root with `.widgetURL` (not the inner
  layouts) ensures that taps anywhere on the widget body deep-link
  to the screen, regardless of which family is rendered.

**Verification**: T011 of the implementation phase performs an
on-device tap on the StandBy widget while the device is unlocked and
asserts the app opens at the StandBy Mode module screen (US2 AS6,
SC-009). If the route does not resolve, the planner-of-record updates
the literal in `StandByViews.swift` and patches this section before
merge (R-D in plan.md).

**Alternatives considered**:
- *Use the universal-link URL instead of the custom-scheme URL*:
  rejected — universal links require Apple App Site Association
  configuration on a backing domain; the showcase repository has no
  such backend. Custom scheme is the in-house convention.
- *Annotate each family layout with its own `.widgetURL`*: rejected
  — duplication; the root annotation propagates to all child views.

## 8. iOS 17+ `containerBackground` handling (no fallback)

**Decision**: Apply
`.containerBackground(.fill.tertiary, for: .widget)` unconditionally
on every StandBy view body. Do **not** wrap in
`if #available(iOS 17, *)` because the widget kind itself is
registered only on iOS 17+ (FR-SB-045). Do **not** call
`.contentMarginsDisabled()` (StandBy uses the standard widget
insets, unlike accessory widgets).

**Rationale**:
- `minIOS: '17.0'` (FR-SB-001) + the `if #available(iOS 17, *)` guard
  inside the bundle entry registration (FR-SB-045) together
  guarantee `StandByWidget` Swift code never executes on iOS 16.x.
- An unguarded `.containerBackground` call inside the iOS-17-gated
  view body therefore has no compatibility risk.
- StandBy widgets use full-bleed content with the system-supplied
  widget container; calling `.contentMarginsDisabled()` would remove
  the standard insets and produce a visually-broken widget.

**Alternatives considered**:
- *Mirror 027's iOS-16-fallback shape*: rejected — gratuitous
  complexity; minIOS-17 makes the gate unnecessary.
- *Use a custom background colour drawn from the active tint*:
  rejected — would override the system's StandBy chrome and look
  inconsistent with other StandBy widgets.
