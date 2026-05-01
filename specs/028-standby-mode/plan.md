# Implementation Plan: StandBy Mode Showcase Module

**Branch**: `028-standby-mode` | **Date**: 2026-04-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/028-standby-mode/spec.md`
**Branch parent**: `027-lock-screen-widgets`

## Summary

Add a real WidgetKit StandBy widget (kind `SpotStandByWidget`) exposing
`.systemMedium` and `.systemLarge` families on iOS 17+, driven from a new
`standby-lab` module screen via the **same App Group** that feature 014
established and that 027 already reuses, but under a **third disjoint
key namespace** (`spot.widget.standbyConfig`) carrying one extra field
beyond 014/027: `mode: 'fullColor' | 'accented' | 'vibrant'`. The four new
Swift sources are appended to **014's existing widget extension target**
(no new target) by a new, idempotent, marker-guarded Expo config plugin
(`plugins/with-standby-widget/`) that inserts a single `StandByWidget()`
call between the marker comments
`// MARK: spot-widgets:bundle:additional-widgets:start` /
`:end` in 014's `SpotWidgetBundle.swift` — coexisting with the
`LockScreenAccessoryWidget()` line 027 already inserted there. The JS
bridge in `src/native/widget-center.ts` is extended additively with
`setStandByConfig(config)` / `getStandByConfig()` (mirroring 027's
`setLockConfig` / `getLockConfig` pattern); the **existing**
`reloadTimelinesByKind` symbol added by 027 is reused for the per-kind
reload — no parallel `reloadStandByTimelines` symbol is introduced.
Cross-platform fallback (Android, Web, iOS < 17) keeps the explainer,
configuration panel (with rendering-mode segmented picker), and the live
StandBy preview interactive while disabling the push button and hiding
iOS-17-only chrome (setup card, reload event log).

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), Swift 5 (StandBy sources
appended to 014's widget extension target)
**Primary Dependencies**: Expo SDK 55, expo-router (typed routes),
React 19.2, React Native 0.83, react-native-reanimated,
`@expo/config-plugins`, `expo-modules-core`
(`requireOptionalNativeModule` — already in use by 014/027's bridge),
WidgetKit (iOS 17+ StandBy: `.systemMedium` / `.systemLarge` +
`@Environment(\.widgetRenderingMode)` +
`.widgetAccentedRenderingMode` + `.widgetURL`), SwiftUI,
`@react-native-async-storage/async-storage` (already a transitive dep
via 014; reused for the standby-config shadow store)
**Storage**: App Group `UserDefaults(suiteName:)` keyed under
`spot.widget.standbyConfig.*` (same suite as 014/027, third disjoint
namespace adding a `mode` field); `AsyncStorage` shadow store at key
`spot.widget.standbyConfig` (separate from 014's `widgets-lab:config`
and 027's `spot.widget.lockConfig`) for the cross-platform preview path
**Testing**: Jest Expo + React Native Testing Library — JS-pure tests
only. The Swift surface for 028 (four new files) is not unit-testable
on the Windows-based dev environment used by this repository (same
exemption pattern features 007 / 014 / 027 applied; see `quickstart.md`
for on-device verification steps)
**Target Platform**: iOS 17+ (StandBy Mode); iOS < 17 / Android / Web
(JS-only fallback with banner + explainer + config panel +
rendering-mode picker + live preview, push disabled)
**Project Type**: Mobile app (Expo) with native iOS sources appended to
an existing extension target via a new TS config plugin — same shape as
feature 027, including the marker-guarded bundle insertion
**Performance Goals**: First paint of StandBy Mode screen < 500 ms
(NFR-SB-001); preview re-render within one render pass (≤ 16 ms on
60 Hz) when any control changes; per-kind reload event log entry
visible within 500 ms of bridge call resolving (NFR-SB-002); widget
on-device refresh within 1 s of `reloadTimelines(ofKind:)` (NFR-SB-002
/ US1 AS4)
**Constraints**: Purely additive at integration level — 1 import +
1 array entry in `src/modules/registry.ts`, 1 plugin entry in
`app.json`, zero new runtime dependencies (NFR-SB-003); no edits to
014's or 027's plugin / screen / Swift sources except the
marker-guarded `WidgetBundle` insertion performed at prebuild time;
no new App Group; StyleSheet.create() only (Constitution IV);
`.android.tsx` / `.web.tsx` splits for non-trivial platform branches
(Constitution III)
**Scale/Scope**: One module directory (`src/modules/standby-lab/`),
one new plugin (`plugins/with-standby-widget/`), one bridge extension
(`setStandByConfig` / `getStandByConfig` added to
`src/native/widget-center.ts`), four Swift files under
`native/ios/widgets/standby/`, ~14 JS-pure test files. Reload event log
capped at 10 entries (FR-SB-033).
**Test baseline at branch start**: carried forward from feature 027's
completion totals (027 plan documented +14 suites target on top of
290 / 1984; 028 will report the actual 027 close numbers in
retrospective.md per FR-SB-059). 028's expected delta: **≥ +14 suites**
(see "Test baseline tracking" below).

## Constitution Check

*Constitution version checked*: **1.1.0**
(`.specify/memory/constitution.md`). Spec NFR-SB-009 cites v1.1.0
explicitly; aligned.

| Principle | Compliance |
|-----------|------------|
| I. Cross-Platform Parity | **PASS** — iOS 17+ ships the real StandBy widget; Android / Web / iOS < 17 ship explainer + configuration panel + rendering-mode picker + live StandBy preview + banner + disabled push (FR-SB-027, US3). Core "edit data + pick rendering mode → preview the StandBy treatment" journey is equivalent across platforms. |
| II. Token-Based Theming | **PASS** — All chrome uses `ThemedView` / `ThemedText` and the `Spacing` scale. Tint swatches **reuse** 014's `Tint` enum and hex map (no new tokens). Rendering-mode picker uses the existing semantic colors (`textPrimary`, `surfaceElevated`) for selected/unselected states. |
| III. Platform File Splitting | **PASS** — `screen.tsx` / `screen.android.tsx` / `screen.web.tsx`. Bridge does not need a 028-specific platform split because `setStandByConfig` / `getStandByConfig` are added to all three existing variants of `widget-center.*` symmetrically (matching 014/027's existing layout). |
| IV. StyleSheet Discipline | **PASS** — All styles via `StyleSheet.create()`; `Spacing` from theme tokens; no inline objects, no CSS-in-JS, no utility-class frameworks. |
| V. Test-First for New Features | **PASS** — JS-pure tests enumerated in FR-SB-057 cover standby-config schema + AsyncStorage round-trip (incl. `mode` field), every component, every screen variant, plugin idempotency + 014/027 non-regression + missing-marker fail-loud + commutativity, manifest contract, and the bridge extensions. Swift cannot be exercised on Windows; on-device verification documented in `quickstart.md`. |

**Initial Constitution Check: PASS — no violations, no entries needed
in Complexity Tracking.**

**Re-check after Phase 1 (post-design): PASS** — the Phase 1 artifacts
(data-model, contracts, quickstart) introduce no new global stores, no
new dependencies, no new theme tokens, and no inline `Platform.select`
beyond trivial style branches. The defensive cross-module imports of
014's data-control widgets and `Tint` enum (research §5) are
internal source-tree reuse and do not violate Principle III.

## Project Structure

### Documentation (this feature)

```text
specs/028-standby-mode/
├── plan.md              # this file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── standby-config.contract.ts          # StandByConfig schema + defaults + AsyncStorage shadow contract
│   ├── widget-center-bridge.contract.ts    # setStandByConfig / getStandByConfig signatures + error contract
│   └── manifest.contract.ts                # registry entry contract (id/label/platforms/minIOS)
└── tasks.md             # Phase 2 output (NOT created here)
```

### Source Code (repository root)

```text
# NEW (this feature) — TypeScript module
src/modules/standby-lab/
├── index.tsx                       # ModuleManifest (id 'standby-lab', minIOS '17.0')
├── screen.tsx                      # iOS 17+ variant (explainer + config + push + preview + setup + log)
├── screen.android.tsx              # Android fallback (banner + explainer + config + preview, disabled push)
├── screen.web.tsx                  # Web fallback (same as android)
├── standby-config.ts               # StandByConfig type, DEFAULT_STANDBY_CONFIG, validate(),
│                                   #   loadShadowStandByConfig(), saveShadowStandByConfig()
└── components/
    ├── ExplainerCard.tsx           # Prose: what StandBy is + 3 rendering modes (FR-SB-039)
    ├── StandByConfigPanel.tsx      # Composes 014's data-controls + RenderingModePicker + Push button
    ├── RenderingModePicker.tsx     # 3-segment picker: Full Color / Accented / Vibrant (FR-SB-031)
    ├── StandByPreview.tsx          # Wide landscape card; large numerals; per-mode visual treatment
    ├── SetupInstructions.tsx       # Numbered list (Settings → StandBy → charge → landscape → lock → swipe)
    ├── ReloadEventLog.tsx          # In-memory ring buffer (cap 10), scoped to this screen only
    └── IOSOnlyBanner.tsx           # "StandBy Mode is iOS 17+ only" banner (Android / Web / iOS < 17)

# NEW (this feature) — Swift sources appended to 014's existing widget extension target
native/ios/widgets/standby/
├── StandByWidget.swift             # StaticConfiguration; supportedFamilies = [.systemMedium, .systemLarge];
│                                   #   chains .widgetAccentedRenderingMode(.accented) (FR-SB-007)
├── StandByProvider.swift           # TimelineProvider (placeholder, getSnapshot, getTimeline) reading
│                                   #   App Group under spot.widget.standbyConfig.*
├── StandByEntry.swift              # TimelineEntry (date, showcaseValue, counter, tint, mode)
└── StandByViews.swift              # @Environment(\.widgetFamily) + @Environment(\.widgetRenderingMode)
                                    #   branching; .containerBackground always (iOS 17+);
                                    #   .widgetURL("spot://modules/standby-lab")

# NEW (this feature) — Expo config plugin
plugins/with-standby-widget/
├── index.ts                        # ConfigPlugin entry; orchestrates the two sub-plugins below
├── add-swift-sources.ts            # Append the 4 Swift files above to 014's widget extension target
├── insert-bundle-entry.ts          # Marker-guarded insert of `if #available(iOS 17, *) { StandByWidget() }`
│                                   #   in ios-widget/SpotWidgetBundle.swift between the same marker pair
│                                   #   027 uses. Fails loudly if either marker is absent (FR-SB-044).
└── package.json

# MODIFIED (additive only, single line each, plus per-kind setter/getter pair)
src/modules/registry.ts             # +1 import line, +1 array entry (standbyLab) — registry size +1
src/native/widget-center.ts         # +setStandByConfig / +getStandByConfig (iOS impl)
src/native/widget-center.android.ts # +setStandByConfig / +getStandByConfig — throws WidgetCenterNotSupportedError
src/native/widget-center.web.ts     # +setStandByConfig / +getStandByConfig — throws WidgetCenterNotSupportedError
src/native/widget-center.types.ts   # +setStandByConfig / +getStandByConfig in WidgetCenterBridge interface;
                                    #   +StandByConfig type re-export (or interface declaration)
app.json                            # +1 plugins entry: "./plugins/with-standby-widget"

# UNTOUCHED (deliberately, beyond the marker-guarded bundle insertion at prebuild time)
ios-widget/SpotWidgetBundle.swift   # 014-owned; markers already exist (027 prerequisite back-patch from T001
                                    #   of 027's plan landed). 028 only inserts a SECOND entry between them.
plugins/with-home-widgets/**        # 014-owned, untouched
plugins/with-lock-widgets/**        # 027-owned, untouched
src/modules/widgets-lab/**          # 014-owned, untouched
src/modules/lock-widgets-lab/**     # 027-owned, untouched

# Tests (NEW)
test/unit/modules/standby-lab/
├── standby-config.test.ts                    # schema, defaults, AsyncStorage round-trip incl. mode field,
│                                             #   error tolerance, malformed-payload defaults
├── manifest.test.ts                          # id 'standby-lab', label, platforms, minIOS '17.0'
├── screen.test.tsx                           # iOS 17+ flow: panel order, push prepends to log,
│                                             #   isolation from 014/027 push paths
├── screen.android.test.tsx                   # banner; explainer + preview interactive; push disabled;
│                                             #   setup card + log hidden
├── screen.web.test.tsx                       # same as android
└── components/
    ├── ExplainerCard.test.tsx                # mentions StandBy + 3 mode names; renders on every platform
    ├── StandByConfigPanel.test.tsx           # composes 014 controls + picker; push button wiring
    ├── RenderingModePicker.test.tsx          # 3 segments; accessibility labels; mode change updates draft
    ├── StandByPreview.test.tsx               # 3 modes visually distinct; updates on prop change;
    │                                         #   medium + large layouts both rendered (snapshot)
    ├── SetupInstructions.test.tsx            # numbered list ≥6 steps; mentions "spot" and "StandBy"
    ├── ReloadEventLog.test.tsx               # empty-state line; ring buffer caps at 10; failure entries;
    │                                         #   kind tag is `SpotStandByWidget`
    └── IOSOnlyBanner.test.tsx                # message string; accessibility announcement
test/unit/native/
└── widget-center-standby.test.ts             # setStandByConfig / getStandByConfig on all 3 platform variants;
                                              #   reuse of reloadTimelinesByKind for kind 'SpotStandByWidget'
test/unit/plugins/
└── with-standby-widget/
    ├── index.test.ts                         # full plugin pipeline: append sources, insert bundle entry
    ├── insert-bundle-entry.test.ts           # idempotency; missing-marker fail-loud; coexists with 027
    │                                         #   entry; commutative with 014 + 027 plugin order
    └── add-swift-sources.test.ts             # 4 files added to existing widget extension target;
                                              #   idempotent on second run; does not duplicate 014/027 sources
```

**Structure Decision**: Mirrors feature 027's
`Expo + iOS-extension-via-config-plugin + marker-guarded bundle insert`
shape near-exactly. Differences (driven by spec FR-SB-005 / FR-SB-006 /
FR-SB-021):

1. **Different families** — `[.systemMedium, .systemLarge]` (StandBy
   shape) instead of 027's three `.accessory*` families. The widget
   kind name (`SpotStandByWidget`) and the Swift source tree
   (`native/ios/widgets/standby/`) are 028-specific.
2. **Schema gains a field** — `StandByConfig` adds `mode:
   'fullColor' | 'accented' | 'vibrant'` on top of 014/027's
   `{ showcaseValue, counter, tint }`. This propagates into the App
   Group key namespace (one extra key, `spot.widget.standbyConfig.mode`)
   and into the `StandByEntry` Swift type (one extra `RenderingMode`
   field).
3. **Bridge reuses 027's reload symbol** — 028 does **not** add a new
   reload symbol; it consumes the `reloadTimelinesByKind(kind: string)`
   method 027 added. Only `setStandByConfig` / `getStandByConfig` are
   new on the bridge.
4. **No iOS 16 fallback in Swift** — `minIOS: '17.0'` (FR-SB-001), so
   `.containerBackground` is applied unconditionally and there is no
   `if #available(iOS 17, *)` guard inside the SwiftUI views (only
   inside the `WidgetBundle` entry registration, per FR-SB-045).
5. **`.widgetAccentedRenderingMode(.accented)` + `.widgetURL`** —
   declared on the widget configuration / view root respectively
   (FR-SB-007 / FR-SB-017). 027's lock-screen widget did neither.

## Resolved [NEEDS CLARIFICATION] markers

All open questions were pre-resolved autonomously in spec.md
§"Open Questions (resolved)" (17 items). The plan inherits those
authoritative decisions verbatim. Recorded here for traceability:

| # | Question | Resolution | Spec ref |
|---|----------|------------|----------|
| 1 | One widget kind for 2 families, or 2 widget kinds? | One kind `SpotStandByWidget` with `supportedFamilies: [.systemMedium, .systemLarge]` | FR-SB-005 |
| 2 | Same widget extension target as 014/027, or a new one? | **Same target** as 014 | FR-SB-006 / FR-SB-020 |
| 3 | Same App Group as 014/027, or a new one? | **Same App Group** as 014 | FR-SB-019 |
| 4 | Same key namespace as 014/027, or separate? | **Separate** namespace `spot.widget.standbyConfig.*` (incl. `mode` field) | FR-SB-021 |
| 5 | Single combined Expo plugin or separate plugin? | **Separate plugin** `plugins/with-standby-widget/` | FR-SB-043 |
| 6 | `reloadAllTimelines` or `reloadTimelinesByKind`? | **Per-kind** reload (reuse 027's symbol; do not add a new one) | FR-SB-024 / FR-SB-030 |
| 7 | Per-kind reload event log, or shared with 014/027? | **Per-kind** log, in 028's screen state only | FR-SB-033 / FR-SB-034 |
| 8 | Reuse 014's data-control inner widgets or copy? | **Import from 014** by default; fallback = local copy if cross-module import is rejected | FR-SB-028 / research §5 |
| 9 | Default showcase value | `"StandBy"` (distinct from 014's `"Hello, Widget!"` and 027's `"Hello, Lock!"`) | FR-SB-029 |
| 10 | iOS 17 `containerBackground` handling | **Always apply**; no iOS 16 fallback (minIOS 17.0); do NOT call `.contentMarginsDisabled()` | FR-SB-016 |
| 11 | `.widgetAccentedRenderingMode` and `.widgetURL` | Declare both: `.widgetAccentedRenderingMode(.accented)` on configuration; `.widgetURL("spot://modules/standby-lab")` on view root | FR-SB-007 / FR-SB-017 |
| 12 | Where do Swift sources live? | `native/ios/widgets/standby/` (parallels 027's `native/ios/widgets/lock-screen/`) | FR-SB-042 |
| 13 | AsyncStorage shadow store key | `spot.widget.standbyConfig` (parallel to 027's `spot.widget.lockConfig` and 014's `widgets-lab:config`) | FR-SB-048 |
| 14 | Plugin failure mode if 014's bundle markers absent? | **Fail loudly** with descriptive error pointing at 014's plugin | FR-SB-044 |
| 15 | `.systemSmall` family too? | **No** — `.systemMedium` + `.systemLarge` only | FR-SB-005 |
| 16 | `widgetRenderingMode` env semantics on iOS 16? | Not relevant — bundle entry guarded by `if #available(iOS 17, *)` | FR-SB-045 |
| 17 | Test baseline tracking | Carry forward 027's completion totals; 028 delta tracked here + retrospective | FR-SB-059 |

Plan-level decisions made beyond the spec-resolved set (locked in
`research.md`):

- **R-A**: Reuse the existing marker pair in
  `ios-widget/SpotWidgetBundle.swift` (added by 027's T001 prerequisite
  back-patch to 014). 028's plugin inserts a SECOND entry between the
  same markers, after the `LockScreenAccessoryWidget()` entry 027
  inserted. The insertion strategy is **region-replacement of the
  bounded body**, not append: 028's plugin and 027's plugin both compute
  the desired body deterministically from the union of "entries this
  plugin owns" and "entries other plugins own that survive". See
  research §3 for the exact algorithm and its commutativity proof.
- **R-B**: The bridge takes the **dedicated symbols** path of
  FR-SB-022 (`setStandByConfig` / `getStandByConfig`) rather than a
  generic key-namespace-argument path. Rationale: matches 027's
  precedent (`setLockConfig` / `getLockConfig`), keeps each per-kind
  config independently mockable, and avoids introducing a generic
  bridge symbol that would later constrain 014/027/028 callers
  differently. See research §6.
- **R-C**: The fallback for FR-SB-028's data-control reuse is a local
  copy at `src/modules/standby-lab/components/StandByConfigPanel.tsx`
  that re-implements the showcase-value field, counter input, and tint
  picker if and only if the cross-module import surfaces a circular
  type dependency between `widget-config.ts` (014) /
  `lock-config.ts` (027) / `standby-config.ts` (028) during
  implementation. The default and recommended path is to import the
  three inner widgets from 014's `widgets-lab/components/` and compose
  them locally. See research §5.
- **R-D**: The `.widgetURL` value is `spot://modules/standby-lab`,
  matching the registry id and the Expo Router scheme already in use.
  If implementation discovers the actual deep-link route differs (e.g.
  the registry produces a different path segment for module
  navigation), the planner-of-record will update the literal in
  `StandByViews.swift` and document the diff in research.md before
  merge. See research §7.

## Phased file inventory

### Phase 0 — Research (no code; produces research.md only)

NEW files:
- `specs/028-standby-mode/research.md`

### Phase 1 — Design contracts (no app code; produces docs only)

NEW files:
- `specs/028-standby-mode/data-model.md`
- `specs/028-standby-mode/quickstart.md`
- `specs/028-standby-mode/contracts/standby-config.contract.ts`
- `specs/028-standby-mode/contracts/widget-center-bridge.contract.ts`
- `specs/028-standby-mode/contracts/manifest.contract.ts`

MODIFIED:
- `.github/copilot-instructions.md` — single-line plan reference
  update between `<!-- SPECKIT START -->` / `<!-- SPECKIT END -->`
  markers (Phase 1 step 3).

### Phase 2 — Tasks (out of scope for /speckit.plan; sketched here for tasks.md)

NEW (TypeScript / tests):
- `src/modules/standby-lab/index.tsx`
- `src/modules/standby-lab/screen.tsx`
- `src/modules/standby-lab/screen.android.tsx`
- `src/modules/standby-lab/screen.web.tsx`
- `src/modules/standby-lab/standby-config.ts`
- `src/modules/standby-lab/components/ExplainerCard.tsx`
- `src/modules/standby-lab/components/StandByConfigPanel.tsx`
- `src/modules/standby-lab/components/RenderingModePicker.tsx`
- `src/modules/standby-lab/components/StandByPreview.tsx`
- `src/modules/standby-lab/components/SetupInstructions.tsx`
- `src/modules/standby-lab/components/ReloadEventLog.tsx`
- `src/modules/standby-lab/components/IOSOnlyBanner.tsx`
- `test/unit/modules/standby-lab/standby-config.test.ts`
- `test/unit/modules/standby-lab/manifest.test.ts`
- `test/unit/modules/standby-lab/screen.test.tsx`
- `test/unit/modules/standby-lab/screen.android.test.tsx`
- `test/unit/modules/standby-lab/screen.web.test.tsx`
- `test/unit/modules/standby-lab/components/ExplainerCard.test.tsx`
- `test/unit/modules/standby-lab/components/StandByConfigPanel.test.tsx`
- `test/unit/modules/standby-lab/components/RenderingModePicker.test.tsx`
- `test/unit/modules/standby-lab/components/StandByPreview.test.tsx`
- `test/unit/modules/standby-lab/components/SetupInstructions.test.tsx`
- `test/unit/modules/standby-lab/components/ReloadEventLog.test.tsx`
- `test/unit/modules/standby-lab/components/IOSOnlyBanner.test.tsx`
- `test/unit/native/widget-center-standby.test.ts`
- `test/unit/plugins/with-standby-widget/index.test.ts`
- `test/unit/plugins/with-standby-widget/insert-bundle-entry.test.ts`
- `test/unit/plugins/with-standby-widget/add-swift-sources.test.ts`

NEW (Swift, appended to 014's extension target by 028's plugin):
- `native/ios/widgets/standby/StandByWidget.swift`
- `native/ios/widgets/standby/StandByProvider.swift`
- `native/ios/widgets/standby/StandByEntry.swift`
- `native/ios/widgets/standby/StandByViews.swift`

NEW (plugin):
- `plugins/with-standby-widget/index.ts`
- `plugins/with-standby-widget/add-swift-sources.ts`
- `plugins/with-standby-widget/insert-bundle-entry.ts`
- `plugins/with-standby-widget/package.json`

MODIFIED (additive only):
- `src/modules/registry.ts` (+1 import, +1 array entry)
- `src/native/widget-center.ts` (+setStandByConfig / +getStandByConfig
  iOS impl; reuses existing `reloadTimelinesByKind`)
- `src/native/widget-center.android.ts` (+setStandByConfig /
  +getStandByConfig throw `WidgetCenterNotSupportedError`)
- `src/native/widget-center.web.ts` (+setStandByConfig /
  +getStandByConfig throw `WidgetCenterNotSupportedError`)
- `src/native/widget-center.types.ts` (+method signatures on
  `WidgetCenterBridge` interface; +`StandByConfig` type definition or
  re-export; no error class additions — reuse
  `WidgetCenterNotSupportedError` / `WidgetCenterBridgeError`)
- `app.json` (+1 plugins entry `./plugins/with-standby-widget`)

UNTOUCHED (verified non-regression in tests):
- `src/modules/widgets-lab/**` — every file under here remains byte-
  identical (014 import side-effects only — no behaviour change).
- `src/modules/lock-widgets-lab/**` — every file under here remains
  byte-identical (027 import side-effects only).
- `plugins/with-home-widgets/**`, `plugins/with-lock-widgets/**` —
  unchanged.
- `ios-widget/SpotWidgetBundle.swift` — the marker pair already exists
  (added by 027's T001 prerequisite back-patch); 028 only inserts a
  second entry between them at prebuild time. No source-tree edit.
- All 007 / 013 / 024 / 025 / 026 module / plugin / Swift / bridge
  files — unchanged.

## Task seeds for tasks.md

These are sketches for the `/speckit.tasks` step, ordered by
dependency. The full enumeration belongs in `tasks.md`; these are
intentionally coarse so `/speckit.tasks` can split each into RED →
GREEN → REFACTOR sub-tasks.

1. **T001 — Plan-level constants & types**:
   `src/modules/standby-lab/standby-config.ts` with
   `DEFAULT_STANDBY_CONFIG` (incl. `mode: 'fullColor'`), `validate()`
   (tolerant of unknown `mode`), AsyncStorage shadow helpers; tests in
   `standby-config.test.ts`. RED first.
2. **T002 — Bridge extension**: extend
   `src/native/widget-center.types.ts` with `StandByConfig` type and
   `setStandByConfig` / `getStandByConfig` on the
   `WidgetCenterBridge` interface; add iOS impl in
   `widget-center.ts`; add throwing impls in `.android.ts` / `.web.ts`;
   tests in `widget-center-standby.test.ts`. Verify
   `reloadTimelinesByKind('SpotStandByWidget')` is the only reload
   path used (no parallel symbol).
3. **T003 — Manifest**: `src/modules/standby-lab/index.tsx` +
   `manifest.test.ts` (asserts id `'standby-lab'`, label
   `'StandBy Mode'`, platforms `['ios','android','web']`,
   `minIOS: '17.0'`).
4. **T004 — Components, top-down RED**: write component tests first
   (`ExplainerCard`, `StandByConfigPanel`, `RenderingModePicker`,
   `StandByPreview`, `SetupInstructions`, `ReloadEventLog`,
   `IOSOnlyBanner`); then implement components against them.
   `StandByConfigPanel` composes 014's data-control inner widgets
   imported from `src/modules/widgets-lab/components/`.
5. **T005 — Screens**: implement `screen.tsx`,
   `screen.android.tsx`, `screen.web.tsx` with full panel ordering
   per FR-SB-026 / FR-SB-027; tests assert layout order, banner
   visibility, disabled push, log lifecycle, push isolation from
   014/027.
6. **T006 — Plugin**: write
   `plugins/with-standby-widget/{index,add-swift-sources,insert-bundle-entry}.ts`
   and tests. Tests must cover (a) appending the 4 Swift files to
   014's existing widget extension target's Sources, (b) inserting
   `if #available(iOS 17, *) { StandByWidget() }` between the markers
   AFTER 027's existing entry (region-replacement strategy from
   research §3), (c) idempotency on second run, (d) fail-loud when
   markers absent (mock 014's bundle without markers), (e) running
   014/027/028 plugins in any of the 6 orderings produces identical
   final state (commutativity, FR-SB-043 / FR-SB-044 / NFR-SB-004).
7. **T007 — Swift sources**: write
   `StandByWidget/Provider/Entry/Views.swift` under
   `native/ios/widgets/standby/`. `StandByWidget` chains
   `.widgetAccentedRenderingMode(.accented)`. Views apply
   `.containerBackground(.fill.tertiary, for: .widget)`
   unconditionally and annotate the root with
   `.widgetURL(URL(string: "spot://modules/standby-lab")!)`. No JS
   tests here (per Constitution V exemption); on-device verification
   in `quickstart.md`.
8. **T008 — Registry hook-up**: append `standbyLab` import and array
   entry to `src/modules/registry.ts`. Update
   `test/unit/modules/registry.test.ts` if it asserts a fixed length.
9. **T009 — `app.json` plugin entry**: add
   `./plugins/with-standby-widget` to the `plugins` array.
10. **T010 — `pnpm check` gate**: lint + typecheck + tests must be
    green. Report delta from 027's closing baseline.
11. **T011 — On-device verification**: execute the 7-step
    `quickstart.md` checklist on an iOS 17+ device on a charger in
    landscape.

## Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|------------|--------|------------|
| R1 | **014/027 regression** — 028's plugin breaks 014's home widget or 027's lock-screen widget by clobbering or reordering bundle entries / duplicating sources / corrupting markers. | Medium | High (breaks two released features) | Plugin test `(e)` asserts commutativity over all 6 plugin orderings; `insert-bundle-entry.ts` uses a region-replacement strategy that is provably commutative (research §3); `quickstart.md` §7 has explicit "014 home widget still refreshes; 027 lock widget still refreshes" check. |
| R2 | **Plugin idempotency drift** — `expo prebuild` run twice produces a duplicated `StandByWidget()` line in 014's bundle, or duplicated source-file refs in the Sources build phase. | Medium | High (Xcode build error) | Same region-replacement strategy as R1: the bounded body is regenerated deterministically from the union of "entries this plugin owns" and "entries other plugins own that survive" each run; `add-swift-sources.ts` checks `pbxSourcesBuildPhaseObj.files` by basename before adding. Tests `(c)` and `(d)` assert byte-identical output on second run. |
| R3 | **Bundle marker drift** — 014's `BUNDLE_SOURCE` literal is later edited by 014's owners and the marker comments are accidentally removed, causing 028's plugin to fail loudly post-merge. | Low | Medium (028 prebuild fails) | 027 already added a regression test in 014's `with-home-widgets/add-widget-bundle.test.ts` asserting the markers are emitted. 028's fail-loud message points the operator at the exact 014 file and the exact marker strings (FR-SB-044). No new 014 file edit required by 028. |
| R4 | **Rendering-mode preview accuracy on RN** — the three RN-rendered preview treatments diverge visually from real WidgetKit StandBy rendering enough that reviewers think the demo is broken. | Medium | Low | Mark the preview as an "approximation" in the panel header; document accuracy caveats in `quickstart.md` §6; honour the user-selected mode as authoritative for preview purposes (FR-SB-036). The on-device path is the canonical one. |
| R5 | **Cross-module data-control import** introduces a circular type dep between `widget-config.ts`, `lock-config.ts`, and `standby-config.ts`. | Low | Low (fall back to local copy) | Recommended path is the import; if implementation surfaces a cycle, switch to local copy per R-C and document the rationale in research.md before merge. Both options are designed-for. |
| R6 | **`.widgetURL` route mismatch** — `spot://modules/standby-lab` does not resolve to the StandBy Mode screen because Expo Router's deep-link convention differs. | Low | Medium (US2 AS6 / SC-009 fail) | Verified during T011 on-device test. If the route differs, update the literal in `StandByViews.swift` and document in research.md per R-D. The registry id `'standby-lab'` is the authoritative source for the path segment. |
| R7 | **`.widgetAccentedRenderingMode` API rename** — pre-release SDK rename causes the `.widgetAccentedRenderingMode(.accented)` modifier to not compile on the available Xcode toolchain. | Low | Medium (Swift compile error) | Documented as an assumption in spec.md ("If a pre-release SDK rename surfaces during planning, the planner MUST document the rename in research.md and update Swift call sites"). If it surfaces, fall back to omitting the modifier (the widget still renders, just without explicit accented opt-in). |
| R8 | **Bridge interface drift** — adding `setStandByConfig` / `getStandByConfig` to `WidgetCenterBridge` makes existing 014/027 unit tests fail because the mocks don't supply the new methods. | Low | Low (test churn only) | Update 014/027 test mock factories to provide stubs for the new methods that throw `NOT_SUPPORTED` if invoked from a 014/027-only test path. Done as part of T002. |
| R9 | **Reload event log cross-talk** — pushing 028's config inadvertently causes an entry in 014's or 027's reload event log (or vice versa). | Low | Low (cosmetic only — no widget data corruption) | The log is screen-state-local (FR-SB-034), not in any shared store; per-kind reload via `reloadTimelinesByKind('SpotStandByWidget')` does not refresh 014's or 027's widget kinds. Test `screen.test.tsx` asserts isolation. |

## Test baseline tracking

- **Branch start**: carried forward from feature 027's completion
  totals (recorded in 027's plan.md / retrospective). 027's plan
  documented an expected delta of +14 suites on top of 290 / 1984; the
  actual close numbers will be substituted into this section by T010.
- **Expected delta** (sketch, finalised in `tasks.md`):
  - +1 `standby-config.test.ts` suite
  - +1 `manifest.test.ts` suite
  - +3 `screen.{ios,android,web}.test.tsx` suites
  - +7 component test suites (Explainer, ConfigPanel, RenderingModePicker,
    Preview, SetupInstructions, ReloadEventLog, IOSOnlyBanner)
  - +1 `widget-center-standby.test.ts` suite
  - +3 plugin test suites
  - **Total target**: **≥ +16 suites at completion** (matches and
    slightly exceeds 027's +14 shape because 028 adds one extra
    component — `RenderingModePicker` — and the `IOSOnlyBanner` is
    larger than 027's analogous fallback chrome).
- Final deltas reported in `specs/028-standby-mode/retrospective.md`
  per FR-SB-059.

## Complexity Tracking

> No constitution violations. Section intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| _(none)_  | _(n/a)_    | _(n/a)_                              |
