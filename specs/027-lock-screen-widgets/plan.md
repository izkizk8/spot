# Implementation Plan: Lock Screen Widgets Module

**Branch**: `027-lock-screen-widgets` | **Date**: 2026-04-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/027-lock-screen-widgets/spec.md`
**Branch parent**: `026-rich-notifications`

## Summary

Add a real WidgetKit Lock Screen accessory widget (kind
`SpotLockScreenWidget`) exposing all three accessory families
(`.accessoryRectangular`, `.accessoryCircular`, `.accessoryInline`) on
iOS 16+, driven from a new `lock-widgets-lab` module screen via the
**same App Group** that feature 014 established but under a **disjoint
key namespace** (`spot.widget.lockConfig`). The four new Swift sources
are appended to **014's existing widget extension target** (no new
target) by a new, idempotent, marker-guarded Expo config plugin
(`plugins/with-lock-widgets/`). The plugin inserts a single
`LockScreenAccessoryWidget()` entry between the marker comments
`// MARK: spot-widgets:bundle:additional-widgets:start` / `:end` in
014's `SpotWidgetBundle.swift`. The JS bridge in
`src/native/widget-center.ts` is extended additively with
`reloadTimelinesByKind(kind)` so the Push button can fire a per-kind
reload (`WidgetCenter.shared.reloadTimelines(ofKind:)`) instead of
014's global `reloadAllTimelines()`. Cross-platform fallback (Android,
Web, iOS < 16) keeps the configuration panel and the three RN preview
cards interactive while disabling the push button and hiding the
iOS-only chrome (next-refresh-time line, setup card, reload event log).

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), Swift 5 (lock-screen
sources appended to 014's widget extension target)
**Primary Dependencies**: Expo SDK 55, expo-router (typed routes),
React 19.2, React Native 0.83, react-native-reanimated,
`@expo/config-plugins`, `expo-modules-core`
(`requireOptionalNativeModule` — already in use by 014's bridge),
WidgetKit (iOS 16+ Lock Screen accessory families), SwiftUI,
`@react-native-async-storage/async-storage` (already a transitive dep
via 014; reused for the lock-config shadow store)
**Storage**: App Group `UserDefaults(suiteName:)` keyed under
`spot.widget.lockConfig.*` (same suite as 014, disjoint keys);
`AsyncStorage` shadow store at key `spot.widget.lockConfig` (separate
from 014's `widgets-lab:config`) for the cross-platform preview path
**Testing**: Jest Expo + React Native Testing Library — JS-pure tests
only. The Swift surface for 027 (four new files) is not unit-testable
on the Windows-based dev environment used by this repository (same
exemption pattern feature 007/014 applied; see `quickstart.md` for
on-device verification steps)
**Target Platform**: iOS 16+ (Lock Screen accessory widgets); iOS <
16 / Android / Web (JS-only fallback with banner + previews + disabled
push)
**Project Type**: Mobile app (Expo) with native iOS sources appended to
an existing extension target via a new TS config plugin — same shape
as feature 014, minus the extension-target-creation half
**Performance Goals**: First paint of Lock Screen Widgets screen < 500
ms (NFR-LW-001); status panel populated within 1 s of mount; per-kind
reload event log entry visible within 500 ms of bridge call resolving;
widget on-device refresh within 1 s of `reloadTimelines(ofKind:)`
(NFR-LW-002 / US1 AS4)
**Constraints**: Purely additive at integration level — 1 import +
1 array entry in `src/modules/registry.ts`, 1 plugin entry in
`app.json`, zero new runtime dependencies (NFR-LW-003); no edits to
014's plugin / screen / Swift sources except the marker-guarded
`WidgetBundle` insertion performed at prebuild time; no new App Group;
StyleSheet.create() only (Constitution IV); `.android.tsx` /
`.web.tsx` splits for non-trivial platform branches (Constitution III)
**Scale/Scope**: One module directory (`src/modules/lock-widgets-lab/`),
one new plugin (`plugins/with-lock-widgets/`), one bridge extension
(`reloadTimelinesByKind` added to `src/native/widget-center.ts`), four
Swift files under `native/ios/widgets/lock-screen/`, ~12 JS-pure test
files. Reload event log capped at 10 entries (FR-LW-029).
**Test baseline at branch start**: **290 suites / 1984 tests** (carried
from 026 completion per FR-LW-053). 027's delta will be reported in the
retrospective.

## Constitution Check

*Constitution version checked*: **1.1.0**
(`.specify/memory/constitution.md`). Spec NFR-LW-009 cites v1.1.0
explicitly; aligned.

| Principle | Compliance |
|-----------|------------|
| I. Cross-Platform Parity | **PASS** — iOS 16+ ships the real accessory widget; Android / Web / iOS < 16 ship configuration panel + 3 accessory previews + banner + disabled push (FR-LW-025, US3). Core "edit a config and preview it" journey is equivalent. |
| II. Token-Based Theming | **PASS** — All chrome uses `ThemedView` / `ThemedText` and the `Spacing` scale. Tint swatches **reuse** 014's already-defined `Tint` enum and hex map (no new tokens). |
| III. Platform File Splitting | **PASS** — `screen.tsx` / `screen.android.tsx` / `screen.web.tsx`. Bridge does not need a 027-specific platform split because `reloadTimelinesByKind` is added to all three existing variants of `widget-center.*` symmetrically (matching 014's existing layout). |
| IV. StyleSheet Discipline | **PASS** — All styles via `StyleSheet.create()`; `Spacing` from theme tokens; no inline objects, no CSS-in-JS, no utility-class frameworks. |
| V. Test-First for New Features | **PASS** — JS-pure tests enumerated in FR-LW-052 cover lock-config schema + AsyncStorage round-trip, every component, every screen variant, plugin idempotency + 014 non-regression + missing-marker fail-loud, manifest contract, and the bridge extension. Swift cannot be exercised on Windows; on-device verification documented in `quickstart.md`. |

**Initial Constitution Check: PASS — no violations, no entries needed
in Complexity Tracking.**

**Re-check after Phase 1 (post-design): PASS** — the Phase 1 artifacts
(data-model, contracts, quickstart) introduce no new global stores, no
new dependencies, no new theme tokens, and no inline `Platform.select`
beyond trivial style branches. The single defensive cross-module
`ConfigPanel` import (research §5) is internal source-tree reuse and
does not violate Principle III.

## Project Structure

### Documentation (this feature)

```text
specs/027-lock-screen-widgets/
├── plan.md              # this file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── lock-config.contract.ts            # LockConfig schema + defaults + AsyncStorage shadow contract
│   ├── widget-center-bridge.contract.ts   # reloadTimelinesByKind signature + error contract
│   └── manifest.contract.ts               # registry entry contract (id/label/platforms/minIOS)
└── tasks.md             # Phase 2 output (NOT created here)
```

### Source Code (repository root)

```text
# NEW (this feature) — TypeScript module
src/modules/lock-widgets-lab/
├── index.tsx                    # ModuleManifest (id 'lock-widgets-lab', minIOS '16.0')
├── screen.tsx                   # iOS 16+ variant (status + config + push + 3 previews + setup card + log)
├── screen.android.tsx           # Android fallback (banner + config + 3 previews + disabled push)
├── screen.web.tsx               # Web fallback (banner + config + 3 previews + disabled push)
├── lock-config.ts               # LockConfig type, DEFAULT_LOCK_CONFIG, validate(),
│                                #   loadShadowLockConfig(), saveShadowLockConfig()
└── components/
    ├── StatusPanel.tsx          # Reads via bridge.getLockConfig(); shows next-refresh on iOS 16+ only
    ├── ConfigPanel.tsx          # Re-export of widgets-lab/components/ConfigPanel (FR-LW-026 / research §5)
    │                            #   — fallback: local copy if cross-module import is rejected
    ├── AccessoryPreview.tsx     # Renders Rectangular / Circular / Inline cards in one component
    ├── SetupInstructions.tsx    # Numbered list (long-press lock screen → … → pick family)
    └── ReloadEventLog.tsx       # In-memory ring buffer (cap 10), scoped to this screen only

# NEW (this feature) — Swift sources appended to 014's existing widget extension target
native/ios/widgets/lock-screen/
├── LockScreenAccessoryWidget.swift     # StaticConfiguration; supportedFamilies = 3 accessory families
├── LockScreenAccessoryProvider.swift   # TimelineProvider (placeholder, getSnapshot, getTimeline)
├── LockScreenAccessoryEntry.swift      # TimelineEntry (date, showcaseValue, counter, tint)
└── LockScreenAccessoryViews.swift      # @Environment(\.widgetFamily) branching; iOS 17 containerBackground gate

# NEW (this feature) — Expo config plugin
plugins/with-lock-widgets/
├── index.ts                     # ConfigPlugin entry; orchestrates the two sub-plugins below
├── add-swift-sources.ts         # Append the 4 Swift files above to LiveActivityDemoWidget target
├── insert-bundle-entry.ts       # Marker-guarded insert of LockScreenAccessoryWidget() in
│                                #   ios-widget/SpotWidgetBundle.swift between
│                                #   `// MARK: spot-widgets:bundle:additional-widgets:start` / `:end`.
│                                #   Fails loudly if either marker is absent (FR-LW-041).
└── package.json

# MODIFIED (additive only, single line each)
src/modules/registry.ts          # +1 import line, +1 array entry (lockWidgetsLab) — registry size +1
src/native/widget-center.ts      # +reloadTimelinesByKind(kind) iOS impl
src/native/widget-center.android.ts # +reloadTimelinesByKind(kind) — throws WidgetCenterNotSupportedError
src/native/widget-center.web.ts  # +reloadTimelinesByKind(kind) — throws WidgetCenterNotSupportedError
src/native/widget-center.types.ts # +reloadTimelinesByKind in WidgetCenterBridge interface;
                                  #   +setLockConfig/getLockConfig if dedicated symbols path is taken
                                  #   (per FR-LW-022 — final choice locked in research §6)
app.json                         # +1 plugins entry: "./plugins/with-lock-widgets"

# MODIFIED (014-owned, prerequisite — the ONE permitted touch on a 014 file)
ios-widget/SpotWidgetBundle.swift  # 014 must add the bundle markers below `LiveActivityDemoWidget()` /
                                   #   `ShowcaseWidget()` lines (research §3); 027 only inserts between them.

# Tests (NEW)
test/unit/modules/lock-widgets-lab/
├── lock-config.test.ts                  # schema, defaults, AsyncStorage round-trip, error tolerance
├── manifest.test.ts                     # id 'lock-widgets-lab', label, platforms, minIOS '16.0'
├── screen.test.tsx                      # iOS 16+ flow: layout order, push prepends to log
├── screen.android.test.tsx              # banner; previews interactive; push disabled; log hidden
├── screen.web.test.tsx                  # same as android
└── components/
    ├── StatusPanel.test.tsx
    ├── ConfigPanel.test.tsx             # re-export integration test (or local copy if fallback)
    ├── AccessoryPreview.test.tsx        # all 3 family cards; tint as accent; updates on prop change
    ├── SetupInstructions.test.tsx       # numbered list ≥5 steps; mentions "spot"
    └── ReloadEventLog.test.tsx          # empty-state line; ring buffer caps at 10; failure entries
test/unit/native/
└── widget-center-by-kind.test.ts        # reloadTimelinesByKind on all 3 platform variants
test/unit/plugins/
└── with-lock-widgets/
    ├── index.test.ts                    # full plugin pipeline: append sources, insert bundle entry
    ├── insert-bundle-entry.test.ts      # idempotency; missing-marker fail-loud; 014-non-regression
    └── add-swift-sources.test.ts        # 4 files added to LiveActivityDemoWidget target; idempotent
```

**Structure Decision**: Mirrors feature 014's
`Expo + iOS-extension-via-config-plugin` shape. Differences (driven by
spec FR-LW-018 / FR-LW-040):

1. **No new extension target** — the four Swift sources are appended to
   014's `LiveActivityDemoWidget` widget extension target by 027's
   plugin (`add-swift-sources.ts`), not produced by a new target.
2. **No App Group plumbing** — 014 already configured the App Group
   entitlement on both the main app target and the widget extension
   target; 027's plugin does not touch entitlements (FR-LW-017).
3. **The `WidgetBundle` is mutated by marker insertion**, not by full
   regeneration — 014's plugin owns the file's existence; 027's plugin
   only inserts `LockScreenAccessoryWidget()` between two marker
   comments and fails loudly if they are missing (research §3).

## Resolved [NEEDS CLARIFICATION] markers

All open questions were pre-resolved autonomously in spec.md
§"Open Questions (resolved)" (15 items). The plan inherits those
authoritative decisions verbatim. Recorded here for traceability:

| # | Question | Resolution | Spec ref |
|---|----------|------------|----------|
| 1 | One widget kind for 3 families, or 3 widget kinds? | One kind `SpotLockScreenWidget` with `supportedFamilies: [.accessoryRectangular, .accessoryCircular, .accessoryInline]` | FR-LW-005 |
| 2 | Same widget extension target as 014, or a new one? | **Same target** as 014 | FR-LW-006 / FR-LW-018 |
| 3 | Same App Group as 014, or a new one? | **Same App Group** as 014 | FR-LW-017 |
| 4 | Same key namespace as 014, or separate? | **Separate** namespace `spot.widget.lockConfig.*` | FR-LW-019 |
| 5 | Single combined Expo plugin or separate plugin? | **Separate plugin** `plugins/with-lock-widgets/` | FR-LW-040 |
| 6 | `reloadAllTimelines` or `reloadTimelines(ofKind:)`? | **Per-kind** reload | FR-LW-020 / FR-LW-028 |
| 7 | Per-kind reload event log, or shared with 014? | **Per-kind** log, in 027's screen state only | FR-LW-029 / FR-LW-030 |
| 8 | Reuse 014's `ConfigPanel` or copy it? | **Import from 014** by default; fallback = local copy if cross-module import is rejected | FR-LW-026 / research §5 |
| 9 | Default showcase value | `"Hello, Lock!"` (distinct from 014's `"Hello, Widget!"`) | FR-LW-027 |
| 10 | iOS 17 `containerBackground` handling | Gate on `if #available(iOS 17, *)`; iOS 16.x = no `containerBackground`, transparent bg + `.contentMarginsDisabled()` | FR-LW-015 |
| 11 | Where do Swift sources live? | `native/ios/widgets/lock-screen/` (parallels 014's `native/ios/widgets/`) | FR-LW-039 |
| 12 | AsyncStorage shadow store key | `spot.widget.lockConfig` (parallel to 014's `widgets-lab:config`) | FR-LW-044 |
| 13 | Plugin failure mode if 014's bundle markers absent? | **Fail loudly** with descriptive error | FR-LW-041 |
| 14 | Lock-screen tint fidelity | Lock Screen renders in `vibrantForegroundStyle`; tint expressed via shape contrast where colour cannot be honoured; accessibility labels still name the tint | FR-LW-014 / FR-LW-050 |
| 15 | Test baseline | **290 suites / 1984 tests** at branch start | FR-LW-053 |

Plan-level decisions made beyond the spec-resolved set (locked in
`research.md`):

- **R-A**: `WidgetBundle` markers are added to 014's
  `ios-widget/SpotWidgetBundle.swift` as a one-line back-patch to 014's
  generator (`plugins/with-home-widgets/add-widget-bundle.ts`). This
  is the only edit to a 014-owned file in the implementation phase
  and is mechanically identical to extending the `BUNDLE_SOURCE`
  literal — see research §3 for the exact diff. Without this
  prerequisite, 027's plugin will fail loudly per FR-LW-041.
- **R-B**: The bridge takes the **dedicated symbols** path of FR-LW-022
  (`setLockConfig` / `getLockConfig`) rather than the
  key-namespace-argument path. Rationale: minimises bridge surface
  drift for 014 callers and gives the lock-config a stable, typed
  symbol pair that can be mocked independently in tests. See
  research §6.
- **R-C**: The fallback for FR-LW-026's `ConfigPanel` reuse is a local
  copy at `src/modules/lock-widgets-lab/components/ConfigPanel.tsx`
  if and only if the cross-module import surfaces a circular type
  dependency between `widget-config.ts` and `lock-config.ts` during
  implementation. The default and recommended path is the import
  re-export. See research §5.

## Phased file inventory

### Phase 0 — Research (no code; produces research.md only)

NEW files:
- `specs/027-lock-screen-widgets/research.md`

### Phase 1 — Design contracts (no app code; produces docs only)

NEW files:
- `specs/027-lock-screen-widgets/data-model.md`
- `specs/027-lock-screen-widgets/quickstart.md`
- `specs/027-lock-screen-widgets/contracts/lock-config.contract.ts`
- `specs/027-lock-screen-widgets/contracts/widget-center-bridge.contract.ts`
- `specs/027-lock-screen-widgets/contracts/manifest.contract.ts`

MODIFIED:
- `.github/copilot-instructions.md` — single-line plan reference
  update between `<!-- SPECKIT START -->` / `<!-- SPECKIT END -->`
  markers (Phase 1 step 3).

### Phase 2 — Tasks (out of scope for /speckit.plan; sketched here for tasks.md)

NEW (TypeScript / tests):
- `src/modules/lock-widgets-lab/index.tsx`
- `src/modules/lock-widgets-lab/screen.tsx`
- `src/modules/lock-widgets-lab/screen.android.tsx`
- `src/modules/lock-widgets-lab/screen.web.tsx`
- `src/modules/lock-widgets-lab/lock-config.ts`
- `src/modules/lock-widgets-lab/components/StatusPanel.tsx`
- `src/modules/lock-widgets-lab/components/ConfigPanel.tsx`
  (re-export of 014's; fallback: local copy)
- `src/modules/lock-widgets-lab/components/AccessoryPreview.tsx`
- `src/modules/lock-widgets-lab/components/SetupInstructions.tsx`
- `src/modules/lock-widgets-lab/components/ReloadEventLog.tsx`
- `test/unit/modules/lock-widgets-lab/lock-config.test.ts`
- `test/unit/modules/lock-widgets-lab/manifest.test.ts`
- `test/unit/modules/lock-widgets-lab/screen.test.tsx`
- `test/unit/modules/lock-widgets-lab/screen.android.test.tsx`
- `test/unit/modules/lock-widgets-lab/screen.web.test.tsx`
- `test/unit/modules/lock-widgets-lab/components/StatusPanel.test.tsx`
- `test/unit/modules/lock-widgets-lab/components/ConfigPanel.test.tsx`
- `test/unit/modules/lock-widgets-lab/components/AccessoryPreview.test.tsx`
- `test/unit/modules/lock-widgets-lab/components/SetupInstructions.test.tsx`
- `test/unit/modules/lock-widgets-lab/components/ReloadEventLog.test.tsx`
- `test/unit/native/widget-center-by-kind.test.ts`
- `test/unit/plugins/with-lock-widgets/index.test.ts`
- `test/unit/plugins/with-lock-widgets/insert-bundle-entry.test.ts`
- `test/unit/plugins/with-lock-widgets/add-swift-sources.test.ts`

NEW (Swift, appended to 014's extension target by the plugin):
- `native/ios/widgets/lock-screen/LockScreenAccessoryWidget.swift`
- `native/ios/widgets/lock-screen/LockScreenAccessoryProvider.swift`
- `native/ios/widgets/lock-screen/LockScreenAccessoryEntry.swift`
- `native/ios/widgets/lock-screen/LockScreenAccessoryViews.swift`

NEW (plugin):
- `plugins/with-lock-widgets/index.ts`
- `plugins/with-lock-widgets/add-swift-sources.ts`
- `plugins/with-lock-widgets/insert-bundle-entry.ts`
- `plugins/with-lock-widgets/package.json`

MODIFIED (additive only):
- `src/modules/registry.ts` (+1 import, +1 array entry)
- `src/native/widget-center.ts` (+reloadTimelinesByKind iOS impl;
  +setLockConfig/getLockConfig per R-B)
- `src/native/widget-center.android.ts` (+reloadTimelinesByKind throw;
  +setLockConfig/getLockConfig throws)
- `src/native/widget-center.web.ts` (+reloadTimelinesByKind throw;
  +setLockConfig/getLockConfig throws)
- `src/native/widget-center.types.ts` (+method signatures on
  `WidgetCenterBridge` interface; no error class additions —
  reuse `WidgetCenterNotSupportedError` /
  `WidgetCenterBridgeError`)
- `app.json` (+1 plugins entry `./plugins/with-lock-widgets`)
- `ios-widget/SpotWidgetBundle.swift` (014-owned, prerequisite back-
  patch via 014's `add-widget-bundle.ts` to add the marker comments;
  see research §3 for the exact 3-line diff)

UNTOUCHED (verified non-regression in tests):
- `src/modules/widgets-lab/**` — every file under here remains byte-
  identical except possibly an import side-effect from the
  `ConfigPanel` re-export (no behaviour change).
- `plugins/with-home-widgets/index.ts`,
  `plugins/with-home-widgets/add-app-group.ts`,
  `plugins/with-home-widgets/add-swift-sources.ts` — unchanged.
- All 007 / 024 / 025 / 026 module / plugin / Swift / bridge files —
  unchanged.

## Task seeds for tasks.md

These are sketches for the `/speckit.tasks` step, ordered by
dependency. The full enumeration belongs in `tasks.md`; these are
intentionally coarse so `/speckit.tasks` can split each into RED →
GREEN → REFACTOR sub-tasks.

1. **T001 — 014 prerequisite back-patch**: extend
   `plugins/with-home-widgets/add-widget-bundle.ts` `BUNDLE_SOURCE`
   literal to emit the marker comments
   `// MARK: spot-widgets:bundle:additional-widgets:start` /
   `:end` between the existing widget calls and a placeholder
   comment. Update 014's existing plugin test to assert the markers
   are emitted. Re-run 014's full test suite locally.
2. **T002 — Plan-level constants & types**:
   `src/modules/lock-widgets-lab/lock-config.ts` with
   `DEFAULT_LOCK_CONFIG`, `validate()`, AsyncStorage shadow
   helpers; tests in `lock-config.test.ts`. RED first.
3. **T003 — Bridge extension**: extend
   `src/native/widget-center.types.ts` interface;
   add `reloadTimelinesByKind`, `setLockConfig`, `getLockConfig`
   to all three `widget-center.*.ts` variants; tests in
   `widget-center-by-kind.test.ts`. Native-side Swift not landed yet
   — JS tests use the existing native-module mock pattern.
4. **T004 — Manifest**: `src/modules/lock-widgets-lab/index.tsx`
   + `manifest.test.ts` (asserts id, label, platforms,
   `minIOS: '16.0'`).
5. **T005 — Components, top-down RED**: write component tests
   first (`StatusPanel.test.tsx`, `ConfigPanel.test.tsx`,
   `AccessoryPreview.test.tsx`, `SetupInstructions.test.tsx`,
   `ReloadEventLog.test.tsx`); then implement components against
   them. `ConfigPanel.tsx` starts as a re-export from
   `src/modules/widgets-lab/components/ConfigPanel`.
6. **T006 — Screens**: implement `screen.tsx`, `screen.android.tsx`,
   `screen.web.tsx` with full panel ordering per FR-LW-024 /
   FR-LW-025; tests assert layout order, banner visibility,
   disabled push, log lifecycle.
7. **T007 — Plugin**: write
   `plugins/with-lock-widgets/{index,add-swift-sources,insert-bundle-entry}.ts`
   and tests. Tests must cover (a) appending the 4 Swift files
   to the `LiveActivityDemoWidget` target's Sources, (b)
   inserting between the markers, (c) idempotency on second run,
   (d) fail-loud when markers absent (mock 014's bundle without
   markers), (e) running 014's plugin then 027's plugin
   produces the same state as 027's then 014's (commutativity
   protects FR-LW-040).
8. **T008 — Swift sources**: write
   `LockScreenAccessoryWidget/Provider/Entry/Views.swift` under
   `native/ios/widgets/lock-screen/`. iOS 17
   `containerBackground` gate via `if #available(iOS 17, *)`;
   iOS 16.x fallback uses `.contentMarginsDisabled()` only.
   No JS tests here (per Constitution V exemption); on-device
   verification in `quickstart.md`.
9. **T009 — Registry hook-up**: append `lockWidgetsLab` import
   and array entry to `src/modules/registry.ts`. Update
   `test/unit/modules/registry.test.ts` if it asserts a fixed
   length.
10. **T010 — `app.json` plugin entry**: add
    `./plugins/with-lock-widgets` to the `plugins` array.
11. **T011 — `pnpm check` gate**: lint + typecheck + tests must
    be green. Report delta from baseline (290 suites / 1984 tests).
12. **T012 — On-device verification**: execute the 6-step
    `quickstart.md` checklist on an iOS 16+ device.

## Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|------------|--------|------------|
| R1 | **014 regression** — 027's plugin or the prerequisite back-patch breaks 014's home widget (markers misplaced, `BUNDLE_SOURCE` syntax error, sources duplicated). | Medium | High (breaks released feature) | Plugin test `(e)` asserts commutativity with 014's plugin; `T001` includes a re-run of 014's full test suite; `quickstart.md` §7 has explicit "014 home widget still refreshes" check. |
| R2 | **Plugin idempotency drift** — `expo prebuild` run twice produces a duplicated `LockScreenAccessoryWidget()` line in 014's bundle, or duplicated source-file refs in the Sources build phase. | Medium | High (Xcode build error) | `insert-bundle-entry.ts` uses the marker pair as a *region replacement*, not an *append*: regenerates the bounded region every run from the same template; `add-swift-sources.ts` checks `pbxSourcesBuildPhaseObj.files` by basename before adding. Tests `(c)` and `(d)` assert byte-identical output on second run. |
| R3 | **Bundle marker drift** — 014's `BUNDLE_SOURCE` literal is later edited by 014's owners and the marker comments are accidentally removed, causing 027's plugin to fail loudly post-merge. | Low | Medium (027 prebuild fails) | Add a regression test in 014's `with-home-widgets/add-widget-bundle.test.ts` that asserts the markers are emitted (added by T001). 027's fail-loud message points the operator at the exact 014 file and the exact marker strings (FR-LW-041). |
| R4 | **Family preview accuracy on RN** — the three RN-rendered preview cards diverge visually from real WidgetKit accessory rendering enough that reviewers think the demo is broken. | Medium | Low | Mark previews as "approximations" in the panel header; document accuracy caveats in `quickstart.md` §6; size each preview card to the documented WidgetKit accessory bounds; honour tint as accent only (not as background). Lock-screen `vibrantForegroundStyle` rendering is acknowledged in FR-LW-014. |
| R5 | **Cross-module `ConfigPanel` import** introduces a circular type dep between `widget-config.ts` and `lock-config.ts`. | Low | Low (fall back to local copy) | Recommended path is re-export; if implementation surfaces the cycle, switch to local copy per R-C and document the rationale in research.md before merge. Both options are designed-for. |
| R6 | **iOS 16.x `containerBackground` regression** — `.containerBackground` is referenced unguarded and the widget crashes on iOS 16.0–16.x. | Low | High (lock-screen widget broken on iOS 16) | All accessory views wrap the call in `if #available(iOS 17, *) { ... }`; iOS 16 path uses transparent bg + `.contentMarginsDisabled()` only. Verified on-device per `quickstart.md` §3. |
| R7 | **`reloadTimelines(ofKind:)` no-op surprise** — calling on a kind with no installed widget instances resolves successfully and the user assumes the reload "did something". | Low | Low | Documented in spec Edge Cases ("No widget installed when Push is tapped"); per-kind reload event log entry still recorded so feedback is consistent. |
| R8 | **Bridge interface drift** — adding `reloadTimelinesByKind` / `setLockConfig` / `getLockConfig` to `WidgetCenterBridge` makes existing 014 unit tests fail because the mocks don't supply the new methods. | Low | Low (test churn only) | Update 014's test mock factories to provide stubs for the new methods that throw `NOT_SUPPORTED` if invoked from a 014-only test path. Done as part of T003. |

## Test baseline tracking

- **Branch start**: 290 suites / 1984 tests (carried from feature 026).
- **Expected delta** (sketch, finalised in `tasks.md`):
  - +1 `lock-config.test.ts` suite
  - +1 `manifest.test.ts` suite
  - +3 `screen.{ios,android,web}.test.tsx` suites
  - +5 component test suites
  - +1 `widget-center-by-kind.test.ts` suite
  - +3 plugin test suites
  - **Total target**: ≥ 304 suites at completion (+14).
- Final deltas reported in `specs/027-lock-screen-widgets/retrospective.md`
  per FR-LW-053.

## Complexity Tracking

> No constitution violations. Section intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| _(none)_  | _(n/a)_    | _(n/a)_                              |
