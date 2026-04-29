# Implementation Plan: Focus Filter Intents Module

**Branch**: `029-focus-filters` | **Date**: 2026-05-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/029-focus-filters/spec.md`
**Branch parent**: `028-standby-mode`

## Summary

Add an iOS 16+ Focus Filters showcase by shipping a single
`SetFocusFilterIntent` subclass (`ShowcaseModeFilter`) that the
system invokes when the user binds it to a Focus, persisting the
invocation values into **014's existing App Group suite** under a
**fourth disjoint key namespace** (`spot.focus.filterValues`)
that is fully separate from 014's `spot.widget.config.*`, 027's
`spot.widget.lockConfig.*`, and 028's `spot.widget.standbyConfig.*`
namespaces. The two new Swift sources (`ShowcaseModeFilter.swift`
and `FocusFilterStorage.swift`) are appended to the **main app
target's** `Sources` build phase (NOT to a widget extension target,
NOT to 013's app-intents target) by a **new, idempotent,
purely-additive Expo config plugin** at `plugins/with-focus-filters/`
that coexists with 007's, 013's, 014's, 026's, 027's, and 028's
plugins and is commutative with all of them. The plugin
deliberately does NOT extend 013's `with-app-intents` plugin
(per spec DECISION 1) and does NOT register an
`AppShortcutsProvider` (per spec DECISION 2) — Apple's filter
intent discovery picks up `SetFocusFilterIntent` subclasses
linked into the main app target automatically. A new JS bridge
(`src/native/focus-filters.ts`) mirrors 013's `app-intents.ts`
shape (`requireOptionalNativeModule` + Platform/version gate +
typed `FocusFiltersNotSupported` error) and exposes
`isAvailable()` + `getCurrentFilterValues()`. A new module
(`src/modules/focus-filters-lab/`) renders the six-panel screen
on iOS 16+ and a four-panel cross-platform fallback (banner +
explainer + filter-definition + in-app demo with pretend toggle
+ event log) on Android, Web, and iOS < 16.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), Swift 5
(`@available(iOS 16.0, *)` on the two new sources)
**Primary Dependencies**: Expo SDK 55, expo-router (typed
routes), React 19.2, React Native 0.83, react-native-reanimated,
`@expo/config-plugins`, `expo-modules-core`
(`requireOptionalNativeModule` — same pattern 013 / 014 / 027 /
028 already use), `AppIntents` framework (iOS 16+:
`SetFocusFilterIntent`, `AppEnum`, `@Parameter`,
`LocalizedStringResource`, `IntentDescription`), `Foundation`
(`UserDefaults(suiteName:)`, `JSONEncoder`), `react-native`
(`AppState`).
**Storage**: App Group `UserDefaults(suiteName:)` keyed under
`spot.focus.filterValues` — a single JSON-encoded payload
(NOT a `*.field`-style flattened key namespace, since the
filter intent is a single atomic write per invocation). The
suite is the **same** as 014/027/028; the namespace is
**fourth disjoint** (DECISION 3). No AsyncStorage shadow
store (DECISION 10 — unlike 014/027/028's mirrored
configurations, the filter values are exclusively
system-driven, so a shadow store would carry no value).
**Testing**: Jest Expo + React Native Testing Library —
JS-pure tests only. The Swift surface for 029 (two new files)
is not unit-testable on the Windows-based dev environment
used by this repository (same exemption pattern features
007 / 013 / 014 / 027 / 028 applied; see `quickstart.md`
for on-device verification steps).
**Target Platform**: iOS 16+ (real Focus Filter binding via
Settings → Focus → Add Filter; persisted-state panel; setup
instructions). iOS < 16 / Android / Web ship the
cross-platform fallback (banner + explainer + filter
definition card + in-app demo + pretend toggle + event log
with `simulated` entries only).
**Project Type**: Mobile app (Expo) with native iOS sources
appended to the **main app target** via a new TS config
plugin — strictly additive shape, simpler than 027/028's
extension-target shape (no `WidgetBundle` marker insertion;
no extension target at all).
**Performance Goals**: First paint of Focus Filters screen
< 500 ms (NFR-FF-001); in-app demo update within one render
pass (≤ 16 ms on 60 Hz) when any control changes or the
pretend toggle flips (NFR-FF-001); current filter state
panel + status pill refresh within 500 ms of an `AppState`
transition to `'active'` (NFR-FF-002 / US1 AS3); native
filter `perform()` write within iOS's filter-intent
background execution budget (NFR-FF-009).
**Constraints**: Purely additive at integration level —
1 import + 1 array entry in `src/modules/registry.ts`,
1 plugin entry in `app.json`, zero new runtime
dependencies (NFR-FF-003); no edits to 013's, 014's,
026's, 027's, or 028's plugin / screen / Swift sources;
no new App Group; no modification of the App Group
entitlement; StyleSheet.create() only (Constitution IV);
`.android.tsx` / `.web.tsx` splits for non-trivial
platform branches (Constitution III).
**Scale/Scope**: One module directory
(`src/modules/focus-filters-lab/`), one new plugin
(`plugins/with-focus-filters/`), one new bridge file
(`src/native/focus-filters.ts` plus matching
`.android.ts` / `.web.ts` / `.types.ts` siblings), two
Swift files under `native/ios/focus-filters/`, one hook
(`hooks/useFocusFilter.ts`), seven UI components,
~14 JS-pure test files. Event log capped at 10 entries
(FR-FF-033).
**Test baseline at branch start**: carried forward from
feature 028's completion totals (recorded in 028's
plan.md / retrospective.md). 029's expected delta:
**≥ +14 suites** (see "Test baseline tracking" below).

## Constitution Check

*Constitution version checked*: **1.1.0**
(`.specify/memory/constitution.md`). Spec NFR-FF-010 cites
v1.1.0 explicitly; aligned.

| Principle | Compliance |
|-----------|------------|
| I. Cross-Platform Parity | **PASS** — iOS 16+ ships the real `SetFocusFilterIntent` + persisted-state panel + setup instructions; Android / Web / iOS < 16 ship the explainer + filter definition card + in-app demo + pretend toggle + event log (`simulated` events only) per FR-FF-021 / US3. The "edit draft → toggle pretend → see demo adapt → see log entry" loop is identical across platforms (SC-006). |
| II. Token-Based Theming | **PASS** — All chrome uses `ThemedView` / `ThemedText` and the `Spacing` scale. Accent swatches define a small four-entry catalog (`blue` / `orange` / `green` / `purple`) in `filter-modes.ts`; the demo body re-tints via the existing semantic colour system. The `mode` segmented picker uses the existing `textPrimary` / `surfaceElevated` semantics for selected/unselected states (matches 028's `RenderingModePicker`). |
| III. Platform File Splitting | **PASS** — `screen.tsx` / `screen.android.tsx` / `screen.web.tsx`. Bridge has matching `focus-filters.ts` / `.android.ts` / `.web.ts` / `.types.ts` variants (mirrors 013's `app-intents.*` and 014/027/028's `widget-center.*` layouts). `Platform.select` is permitted only for trivial style/copy diffs per FR-FF-048. |
| IV. StyleSheet Discipline | **PASS** — All styles via `StyleSheet.create()`; `Spacing` from theme tokens; no inline objects, no CSS-in-JS, no utility-class frameworks. |
| V. Test-First for New Features | **PASS** — JS-pure tests enumerated in FR-FF-055 cover `filter-modes` (catalog, parsers, defaults, malformed payload tolerance), every component, every screen variant, the `useFocusFilter` hook (mount fetch, `AppState` re-fetch, `simulateActivation`, error tolerance), the bridge (iOS 16+ truthy `isAvailable`, throws on non-iOS / iOS < 16, payload parse), the plugin (idempotency + 013/014/026/027/028 non-regression + commutativity), and the manifest contract. Swift cannot be exercised on Windows; on-device verification documented in `quickstart.md`. |

**Initial Constitution Check: PASS — no violations, no entries needed
in Complexity Tracking.**

**Re-check after Phase 1 (post-design): PASS** — the Phase 1 artifacts
(data-model, contracts, quickstart) introduce no new global stores,
no new dependencies, no new theme tokens, and no inline
`Platform.select` beyond trivial style branches. The bridge's
typed-object parsing surface (DECISION 12) is internal to
`src/native/focus-filters.ts` and `filter-modes.ts` and does not
leak any iOS-only symbol into the cross-platform code path.

## Project Structure

### Documentation (this feature)

```text
specs/029-focus-filters/
├── plan.md              # this file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── filter-modes.contract.ts            # ShowcaseFilterMode + AccentColor catalogs
│   │                                       #   + draft defaults + payload parser contract
│   ├── focus-filters-bridge.contract.ts    # isAvailable() + getCurrentFilterValues() signatures
│   │                                       #   + FocusFiltersNotSupported error contract
│   └── manifest.contract.ts                # registry entry contract
│                                           #   (id 'focus-filters-lab', label, platforms, minIOS '16.0')
└── tasks.md             # Phase 2 output (NOT created here)
```

### Source Code (repository root)

```text
# NEW (this feature) — TypeScript module
src/modules/focus-filters-lab/
├── index.tsx                       # ModuleManifest (id 'focus-filters-lab', minIOS '16.0',
│                                   #   platforms ['ios','android','web'])
├── screen.tsx                      # iOS 16+ variant (six panels in fixed order)
├── screen.android.tsx              # Android fallback (banner + explainer + def + demo + log)
├── screen.web.tsx                  # Web fallback (same as android)
├── filter-modes.ts                 # ShowcaseFilterMode enum, AccentColor catalog,
│                                   #   draft defaults, payload parser (validate / parse)
├── hooks/
│   └── useFocusFilter.ts           # { values, refresh, eventLog, simulateActivation };
│                                   #   refetches on mount + AppState 'active'; tolerates
│                                   #   FocusFiltersNotSupported (resolves null; never throws to UI)
└── components/
    ├── ExplainerCard.tsx           # Prose: what Focus Filters are + Settings flow
    │                               #   + filter parameters + simulated vs. real path (FR-FF-037)
    ├── FilterDefinitionCard.tsx    # 3-segment mode picker + 4-swatch accentColor picker;
    │                               #   updates DRAFT only — never writes to App Group (FR-FF-022/23)
    ├── CurrentStateCard.tsx        # iOS 16+ only; renders mode/accent/event/updatedAt/focusName
    │                               #   from latest App Group read; empty-state when null (FR-FF-025-28)
    ├── PretendFilterToggle.tsx     # Toggle + status pill + tinted demo body; calls
    │                               #   simulateActivation; precedence over persisted (FR-FF-029-32)
    ├── SetupInstructions.tsx       # iOS 16+ only; numbered list (Settings → Focus → ... → Done)
    │                               #   ≥7 steps mentioning "spot" + "Showcase Mode" (FR-FF-038)
    ├── EventLog.tsx                # In-memory ring buffer (cap 10), local reducer; renders
    │                               #   activated / deactivated / simulated entries with badge
    │                               #   + timestamp + values + optional focusName (FR-FF-033-36)
    └── IOSOnlyBanner.tsx           # "Focus Filters require iOS 16+" banner; shown on
                                    #   Android / Web / iOS < 16 only (FR-FF-021 / FR-FF-052)

# NEW (this feature) — Swift sources, appended to MAIN APP TARGET (not a widget extension)
native/ios/focus-filters/
├── ShowcaseModeFilter.swift        # @available(iOS 16.0, *) struct conforming to
│                                   #   SetFocusFilterIntent. Declares title (LocalizedStringResource
│                                   #   "Showcase Mode") + description (IntentDescription).
│                                   #   @Parameter(title: "Mode") var mode: ShowcaseFilterMode = .relaxed
│                                   #   @Parameter(title: "Accent Color") var accentColor: String = "blue"
│                                   #   ShowcaseFilterMode declared in same file as AppEnum with
│                                   #   3 cases (relaxed / focused / quiet) + caseDisplayRepresentations.
│                                   #   perform() body: read system-supplied focus name (best effort),
│                                   #   call FocusFilterStorage.write(values:event:focusName:) with
│                                   #   event derived from invocation context, then return .result()
└── FocusFilterStorage.swift        # @available(iOS 16.0, *) enum FocusFilterStorage with
                                    #   static func write(values: ShowcaseFilterValues,
                                    #     event: ShowcaseFilterEvent, focusName: String?)
                                    #   and static func read() -> ShowcaseFilterPersistedPayload?.
                                    #   UserDefaults(suiteName: AppGroupID).set(jsonData, forKey:
                                    #   "spot.focus.filterValues"). NO UIKit / SwiftUI symbols.

# NEW (this feature) — Expo config plugin (separate from 013's; per DECISION 1)
plugins/with-focus-filters/
├── index.ts                        # ConfigPlugin entry; orchestrates add-swift-sources sub-plugin
├── add-swift-sources.ts            # Appends ShowcaseModeFilter.swift + FocusFilterStorage.swift
│                                   #   to the MAIN APP TARGET's Sources build phase (NOT widget
│                                   #   extension; NOT 013's app-intents target). Idempotent —
│                                   #   checks pbxSourcesBuildPhaseObj.files by basename before adding.
│                                   #   Does NOT modify App Group entitlement (014 owns it).
│                                   #   Does NOT touch 013's, 014's, 026's, 027's, 028's files.
└── package.json

# NEW (this feature) — JS bridge (mirrors 013's app-intents.* layout)
src/native/focus-filters.ts         # iOS impl: requireOptionalNativeModule('FocusFilters') +
                                    #   Platform.OS === 'ios' + parseInt(Platform.Version) >= 16 gate;
                                    #   exports isAvailable(), getCurrentFilterValues(),
                                    #   FocusFiltersNotSupported class. Internally parses the
                                    #   payload via filter-modes.ts parser; resolves null on
                                    #   parse failure with a single __DEV__ console.warn.
src/native/focus-filters.android.ts # isAvailable() returns false; getCurrentFilterValues()
                                    #   throws FocusFiltersNotSupported (FR-FF-015 / FR-FF-016).
src/native/focus-filters.web.ts     # Same as android.ts.
src/native/focus-filters.types.ts   # FocusFiltersBridge interface; ShowcaseFilterPersistedPayload
                                    #   type re-export; FocusFiltersNotSupported error class
                                    #   declaration. No global symbol collisions with 013's or
                                    #   014/027/028's bridges (FR-FF-018).

# MODIFIED (additive only)
src/modules/registry.ts             # +1 import line, +1 array entry (focusFiltersLab) — registry size +1
app.json                            # +1 plugins entry: "./plugins/with-focus-filters"

# UNTOUCHED (deliberately)
plugins/with-app-intents/**         # 013-owned; not modified (DECISION 1)
plugins/with-home-widgets/**        # 014-owned; not modified
plugins/with-rich-notifications/**  # 026-owned; not modified
plugins/with-lock-widgets/**        # 027-owned; not modified
plugins/with-standby-widget/**      # 028-owned; not modified
plugins/with-live-activity/**       # 007-owned; not modified
native/ios/app-intents/**           # 013-owned; SpotAppShortcuts.swift NOT touched (DECISION 2)
native/ios/widgets/**               # 014/027/028-owned; not modified
src/native/app-intents.*            # 013-owned; not modified (FR-FF-018)
src/native/widget-center.*          # 014/027/028-owned; not modified (FR-FF-018)
src/modules/{intents-lab,widgets-lab,lock-widgets-lab,standby-lab,...}/**
                                    # All prior modules untouched
ios-widget/**                       # 014/027/028-owned widget extension; NOT touched —
                                    #   this feature does NOT add Swift to the widget extension

# Tests (NEW)
test/unit/modules/focus-filters-lab/
├── filter-modes.test.ts                     # mode/accent catalogs; default values; payload
│                                            #   parser round-trip; tolerance for unknown mode,
│                                            #   unknown accentColor, missing fields, malformed JSON
├── manifest.test.ts                         # id 'focus-filters-lab', label 'Focus Filters',
│                                            #   platforms ['ios','android','web'], minIOS '16.0'
├── screen.test.tsx                          # iOS 16+ flow: six panels in order; pretend
│                                            #   toggle precedence; AppState refresh; isolation
│                                            #   from 013/014/027/028 paths
├── screen.android.test.tsx                  # banner; explainer + def + demo + log render;
│                                            #   current-state panel + setup card hidden;
│                                            #   getCurrentFilterValues throws path tolerated
├── screen.web.test.tsx                      # same as android
├── hooks/
│   └── useFocusFilter.test.tsx              # mount fetch; AppState 'active' refetch;
│                                            #   simulateActivation prepends simulated entry;
│                                            #   tolerates FocusFiltersNotSupported (values null)
└── components/
    ├── ExplainerCard.test.tsx               # mentions Focus Filters + Settings flow + 2 params
    │                                        #   + simulated vs. real path; renders every platform
    ├── FilterDefinitionCard.test.tsx        # 3 segments + 4 swatches; draft updates do NOT call
    │                                        #   bridge; accessibility labels per FR-FF-051/53
    ├── CurrentStateCard.test.tsx            # renders mode + swatch + event + updatedAt +
    │                                        #   focusName; empty state when null; iOS-16+-only
    ├── PretendFilterToggle.test.tsx         # toggle ON prepends simulated entry; OFF does not;
    │                                        #   draft changes while ON debounce to ~300 ms
    ├── SetupInstructions.test.tsx           # ≥7 numbered steps mentioning "spot" + "Showcase Mode"
    ├── EventLog.test.tsx                    # ring buffer caps at 10; simulated badge distinct
    │                                        #   from activated/deactivated; empty-state line
    └── IOSOnlyBanner.test.tsx               # message string; accessibility announcement on mount
test/unit/native/
└── focus-filters.test.ts                    # iOS 16+ delegates to mocked native module + parses
                                              #   payload; non-iOS / iOS < 16 throws
                                              #   FocusFiltersNotSupported; isAvailable() truthiness;
                                              #   parse-failure path resolves null + warns once
test/unit/plugins/
└── with-focus-filters/
    ├── index.test.ts                        # full pipeline: appends 2 Swift files to main app
    │                                        #   target's Sources; idempotent on second run;
    │                                        #   fails loudly if main app target missing
    └── add-swift-sources.test.ts            # 2 files added to main app target's Sources;
                                              #   does NOT add to widget extension target;
                                              #   does NOT add to 013's app-intents target;
                                              #   commutative with 013/014/026/027/028 plugin
                                              #   orderings (all 6! orderings produce identical
                                              #   final state — sampled sub-set tested)
```

**Structure Decision**: Mirrors **013's** `Expo + iOS-main-app-target-via-config-plugin` shape (NOT 027/028's extension-target-via-marker-insertion shape). Differences from 013:

1. **Different intent flavour** — `SetFocusFilterIntent` instead of 013's `AppIntent`. The filter intent is auto-discovered by iOS when linked into the main app target; no `AppShortcutsProvider` is required (DECISION 2 — 013's `SpotAppShortcuts.swift` stays untouched).
2. **Persistence path** — 013's intents use `UserDefaults.standard` for the local mood log; 029's filter persists into the **App Group** suite (014's identifier) under namespace `spot.focus.filterValues`. This connects 029's storage path more closely to 014/027/028 than to 013, but the **target** the Swift sources land in matches 013 (main app, not widget extension).
3. **Bridge** — 013's `app-intents.ts` exposes `submit(intent, params)` + `getLastMoodEntry()`; 029's `focus-filters.ts` exposes `isAvailable()` + `getCurrentFilterValues()` (read-only on the JS side; the writes happen exclusively from `ShowcaseModeFilter.perform()`).
4. **No widget integration** — Per Non-Goals, this feature does NOT wire filter values into 014's home widget, 027's lock widget, or 028's StandBy widget. Cross-feature wiring is a separate future feature.
5. **No AsyncStorage shadow store** — Unlike 014/027/028 (which mirror their widget configurations via AsyncStorage so the cross-platform fallback can render), 029's filter values are exclusively system-driven; the cross-platform demo handles its parity entirely in-memory via the pretend toggle (DECISION 10).

## Resolved [NEEDS CLARIFICATION] markers

All open questions were pre-resolved autonomously in spec.md
§"Open Questions (resolved)" (14 items). The plan inherits those
authoritative decisions verbatim. Recorded here for traceability:

| # | Question | Resolution | Spec ref |
|---|----------|------------|----------|
| 1 | Reuse 013's plugin or separate? | **Separate plugin** `plugins/with-focus-filters/` | FR-FF-041 |
| 2 | Declare via `AppShortcutsProvider` or rely on auto-discovery? | **Auto-discovery** — 013's `SpotAppShortcuts.swift` untouched | FR-FF-044 / Out-of-Scope |
| 3 | Reuse 014's App Group or new App Group? | **Reuse 014's App Group**; 4th disjoint key namespace | FR-FF-012 |
| 4 | Display Focus name in status pill? | **Best-effort**; persisted as optional `focusName` field | FR-FF-014 / FR-FF-029 |
| 5 | `simulateActivation` writes to App Group or in-memory? | **In-memory only** — pretend toggle stays a pure UI affordance | FR-FF-031 / FR-FF-023 |
| 6 | Where do Swift sources live? | `native/ios/focus-filters/` (parallels `native/ios/app-intents/`) | FR-FF-040 |
| 7 | Cap on event log entries? | **10**, FIFO, in-memory only | FR-FF-033 / FR-FF-035 |
| 8 | Expose in Shortcuts too? | **No** — Focus Filters surface only | Out-of-Scope / Non-Goals |
| 9 | Deactivation — clear payload or retain? | **Retain payload, flip `event` to `'deactivated'`** | FR-FF-014 / Edge Case |
| 10 | AsyncStorage shadow store? | **None** — pretend toggle handles cross-platform path in-memory | FR-FF-032 / FR-FF-046 |
| 11 | Default draft values | `mode = relaxed`, `accentColor = blue` | FR-FF-007 / FR-FF-024 |
| 12 | Bridge surfaces raw JSON or typed object? | **Typed object with strict parsing**; null on malformed | FR-FF-015 / FR-FF-046 |
| 13 | Where do parameter display strings come from? | `LocalizedStringResource` in the Swift `AppEnum` declaration | FR-FF-007 / Edge Case |
| 14 | Restore drafts across screen mounts? | **No** — drafts reset to defaults on every mount | FR-FF-024 |

Plan-level decisions made beyond the spec-resolved set (locked in
`research.md`):

- **R-A**: The Swift sources are added to the **main app target's** `Sources` build phase via `xcode`'s `pbxSourcesBuildPhaseObj` API (same call shape 013's plugin uses). The plugin computes the target by `xcode.PBXProject.getFirstTarget()` filtered by the Info.plist key `CFBundleIdentifier` matching the app's bundle id from `app.json` (rather than by hard-coded target name) so 029's plugin is robust against a future rename of the main app target. See research §1.
- **R-B**: The `event` field is derived from `SetFocusFilterIntent.perform()` invocation context using Apple's documented filter-intent activation/deactivation distinction: filter intents receive a `FocusFilter` parameter that exposes `isActive` (or equivalent on the SDK at hand). If the SDK exposes only one perform() entry point and no activation flag, the plugin documents the limitation in research.md and falls back to recording every invocation as `activated` (with `updatedAt` carrying the time, so deactivation→reactivation is still distinguishable). See research §2.
- **R-C**: The four-swatch `accentColor` catalog (`blue` / `orange` / `green` / `purple`) reuses the same hex values 014's `Tint` enum exposes, but **without** importing from 014 — `filter-modes.ts` declares the catalog locally to avoid creating a cross-feature type dependency that 028 deliberately structured to allow but 029 has no need for (the filter shape diverges from 014's widget shape). If a future feature wants to share the catalog, the refactor lands then. See research §3.
- **R-D**: Bridge parse failures resolve `null` (per DECISION 12) and emit **at most one** `__DEV__` `console.warn` per **distinct failure mode per session** (deduplicated by error class + key) so a malformed App Group payload does not spam the console on every `AppState`-driven refetch. The dedup map lives inside `src/native/focus-filters.ts` module scope; tests assert that calling `getCurrentFilterValues()` 50× on a malformed payload produces exactly one warn. See research §4.
- **R-E**: The bridge's `getCurrentFilterValues()` parses the App Group payload's `accentColor` and `mode` against `filter-modes.ts`'s catalogs strictly (per DECISION 12); but the **in-app demo** body falls back to the documented defaults (`relaxed` / `blue`) when the parsed values fall outside the catalog (per Edge Cases "Empty / unknown `accentColor` payload" + "Unknown `mode` payload"), rather than rendering a "broken filter" state. The two layers (bridge null vs. UI fallback to defaults) are distinct: bridge null = "no readable payload"; UI default = "payload readable but field outside catalog". See research §5.

## Phased file inventory

### Phase 0 — Research (no code; produces research.md only)

NEW files:
- `specs/029-focus-filters/research.md`

### Phase 1 — Design contracts (no app code; produces docs only)

NEW files:
- `specs/029-focus-filters/data-model.md`
- `specs/029-focus-filters/quickstart.md`
- `specs/029-focus-filters/contracts/filter-modes.contract.ts`
- `specs/029-focus-filters/contracts/focus-filters-bridge.contract.ts`
- `specs/029-focus-filters/contracts/manifest.contract.ts`

MODIFIED:
- *(intentionally none — agent context update step is owned
  by the integrator and is **explicitly out of scope** for
  this autonomous-mode plan run per the originating user
  directive "Do NOT touch any code outside
  `specs/029-focus-filters/`". The integrator should update
  `.github/copilot-instructions.md`'s plan reference
  between the `<!-- SPECKIT START -->` /
  `<!-- SPECKIT END -->` markers when merging this plan.)*

### Phase 2 — Tasks (out of scope for /speckit.plan; sketched here for tasks.md)

NEW (TypeScript / tests):
- `src/modules/focus-filters-lab/index.tsx`
- `src/modules/focus-filters-lab/screen.tsx`
- `src/modules/focus-filters-lab/screen.android.tsx`
- `src/modules/focus-filters-lab/screen.web.tsx`
- `src/modules/focus-filters-lab/filter-modes.ts`
- `src/modules/focus-filters-lab/hooks/useFocusFilter.ts`
- `src/modules/focus-filters-lab/components/ExplainerCard.tsx`
- `src/modules/focus-filters-lab/components/FilterDefinitionCard.tsx`
- `src/modules/focus-filters-lab/components/CurrentStateCard.tsx`
- `src/modules/focus-filters-lab/components/PretendFilterToggle.tsx`
- `src/modules/focus-filters-lab/components/SetupInstructions.tsx`
- `src/modules/focus-filters-lab/components/EventLog.tsx`
- `src/modules/focus-filters-lab/components/IOSOnlyBanner.tsx`
- `src/native/focus-filters.ts`
- `src/native/focus-filters.android.ts`
- `src/native/focus-filters.web.ts`
- `src/native/focus-filters.types.ts`
- `test/unit/modules/focus-filters-lab/filter-modes.test.ts`
- `test/unit/modules/focus-filters-lab/manifest.test.ts`
- `test/unit/modules/focus-filters-lab/screen.test.tsx`
- `test/unit/modules/focus-filters-lab/screen.android.test.tsx`
- `test/unit/modules/focus-filters-lab/screen.web.test.tsx`
- `test/unit/modules/focus-filters-lab/hooks/useFocusFilter.test.tsx`
- `test/unit/modules/focus-filters-lab/components/ExplainerCard.test.tsx`
- `test/unit/modules/focus-filters-lab/components/FilterDefinitionCard.test.tsx`
- `test/unit/modules/focus-filters-lab/components/CurrentStateCard.test.tsx`
- `test/unit/modules/focus-filters-lab/components/PretendFilterToggle.test.tsx`
- `test/unit/modules/focus-filters-lab/components/SetupInstructions.test.tsx`
- `test/unit/modules/focus-filters-lab/components/EventLog.test.tsx`
- `test/unit/modules/focus-filters-lab/components/IOSOnlyBanner.test.tsx`
- `test/unit/native/focus-filters.test.ts`
- `test/unit/plugins/with-focus-filters/index.test.ts`
- `test/unit/plugins/with-focus-filters/add-swift-sources.test.ts`

NEW (Swift, appended to main app target by 029's plugin):
- `native/ios/focus-filters/ShowcaseModeFilter.swift`
- `native/ios/focus-filters/FocusFilterStorage.swift`

NEW (plugin):
- `plugins/with-focus-filters/index.ts`
- `plugins/with-focus-filters/add-swift-sources.ts`
- `plugins/with-focus-filters/package.json`

MODIFIED (additive only):
- `src/modules/registry.ts` (+1 import, +1 array entry)
- `app.json` (+1 plugins entry `./plugins/with-focus-filters`)

UNTOUCHED (verified non-regression in tests):
- `plugins/with-app-intents/**`, `plugins/with-home-widgets/**`,
  `plugins/with-rich-notifications/**`,
  `plugins/with-lock-widgets/**`,
  `plugins/with-standby-widget/**`,
  `plugins/with-live-activity/**` — every file byte-identical.
- `native/ios/app-intents/**`, `native/ios/widgets/**` — byte-identical.
- `src/native/app-intents.*`, `src/native/widget-center.*` — byte-identical.
- `src/modules/{intents-lab,widgets-lab,lock-widgets-lab,standby-lab,
  rich-notifications-lab,...}/**` — byte-identical.
- `ios-widget/**` — byte-identical (this feature explicitly does not
  touch the widget extension target).

## Task seeds for tasks.md

These are sketches for the `/speckit.tasks` step, ordered by
dependency. The full enumeration belongs in `tasks.md`; these are
intentionally coarse so `/speckit.tasks` can split each into RED →
GREEN → REFACTOR sub-tasks.

1. **T001 — Plan-level constants & parser**:
   `src/modules/focus-filters-lab/filter-modes.ts` with
   `ShowcaseFilterMode` enum, `AccentColor` catalog,
   `DRAFT_DEFAULTS` (`{ mode: 'relaxed', accentColor: 'blue' }`),
   `parseFilterPayload(raw: unknown)` returning
   `ShowcaseFilterPersistedPayload | null`. Tolerant of unknown
   `mode`, unknown `accentColor`, missing optional fields,
   malformed JSON. Tests in `filter-modes.test.ts`. RED first.
2. **T002 — Bridge**:
   `src/native/focus-filters.types.ts` declares
   `FocusFiltersBridge` interface +
   `FocusFiltersNotSupported` class +
   `ShowcaseFilterPersistedPayload` type re-export.
   `src/native/focus-filters.ts` implements iOS path
   (`requireOptionalNativeModule` + version gate + parse via
   T001's parser + dedup-warn on parse failure per R-D).
   `.android.ts` / `.web.ts` throw on
   `getCurrentFilterValues()` and return `false` on
   `isAvailable()`. Tests in `focus-filters.test.ts`. Verify
   no symbol collision with `app-intents.ts` /
   `widget-center.ts` (FR-FF-018).
3. **T003 — Manifest**:
   `src/modules/focus-filters-lab/index.tsx` +
   `manifest.test.ts` (asserts id `'focus-filters-lab'`,
   label `'Focus Filters'`, platforms
   `['ios','android','web']`, `minIOS: '16.0'`).
4. **T004 — Hook**:
   `hooks/useFocusFilter.ts` returning
   `{ values, refresh, eventLog, simulateActivation }`;
   refetches on mount and on `AppState` `'active'`;
   tolerates `FocusFiltersNotSupported` by resolving
   `values` to `null` and not propagating.
   `simulateActivation(values)` prepends a `simulated`
   entry to the event log (debounced ~300 ms per
   FR-FF-031). Tests in `useFocusFilter.test.tsx` (mock
   the bridge).
5. **T005 — Components, top-down RED**: write component
   tests first (Explainer, FilterDefinition, CurrentState,
   PretendFilterToggle, SetupInstructions, EventLog,
   IOSOnlyBanner); then implement against them. Pretend
   toggle precedence over persisted (FR-FF-029); event
   log ring buffer cap at 10 (FR-FF-033); simulated
   badge distinct from real (FR-FF-034 / US2 AS5).
6. **T006 — Screens**: implement `screen.tsx`,
   `screen.android.tsx`, `screen.web.tsx` with full
   panel ordering per FR-FF-020 / FR-FF-021; tests
   assert layout order, banner visibility, hidden
   panels, log lifecycle, isolation from
   013/014/027/028.
7. **T007 — Plugin**: write
   `plugins/with-focus-filters/{index,add-swift-sources}.ts`
   and tests. Tests must cover (a) appending the 2
   Swift files to the main app target's Sources, (b)
   idempotency on second run (no duplicates), (c)
   does NOT add to widget extension target, (d) does
   NOT add to 013's app-intents target, (e) running
   013/014/026/027/028/029 plugins in any of 6!
   orderings produces identical final state
   (commutativity sampled across at least 3
   non-trivial permutations to keep test runtime
   reasonable; FR-FF-041 / NFR-FF-004), (f) does NOT
   modify App Group entitlement (FR-FF-042), (g)
   fails loudly if the main app target cannot be
   located.
8. **T008 — Swift sources**: write
   `ShowcaseModeFilter.swift` +
   `FocusFilterStorage.swift` under
   `native/ios/focus-filters/`. `ShowcaseModeFilter`
   conforms to `SetFocusFilterIntent` with the two
   `@Parameter`s and the `AppEnum` mode. `perform()`
   reads system-supplied focus name (best-effort per
   R-B), calls `FocusFilterStorage.write(...)`,
   returns `.result()`. `FocusFilterStorage` writes
   JSON to App Group `UserDefaults` under
   `spot.focus.filterValues` and reads it back.
   No JS tests here (per Constitution V exemption);
   on-device verification in `quickstart.md`.
9. **T009 — Registry hook-up**: append
   `focusFiltersLab` import + array entry to
   `src/modules/registry.ts`. Update
   `test/unit/modules/registry.test.ts` if it asserts
   a fixed length.
10. **T010 — `app.json` plugin entry**: add
    `./plugins/with-focus-filters` to the `plugins`
    array.
11. **T011 — `pnpm check` gate**: lint + typecheck +
    tests must be green. Report delta from 028's
    closing baseline.
12. **T012 — On-device verification**: execute the
    `quickstart.md` checklist on a real iOS 16+ device
    (Settings → Focus → Add Filter → search "spot" →
    bind → activate → foreground → observe screen
    update + event log entry).

## Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|------------|--------|------------|
| R1 | **013/014/027/028 regression** — 029's plugin damages a prior plugin's output (clobbers PBXFileReference entries, duplicates files, modifies entitlements). | Medium | High (breaks ≥1 released feature) | Plugin test `(e)` asserts commutativity over a sampled set of plugin orderings; `(f)` asserts App Group entitlement diff is empty; `(c)` / `(d)` assert sources are added ONLY to the main app target. `quickstart.md` §6 has explicit 013/014/027/028 spot-checks. |
| R2 | **Plugin idempotency drift** — `expo prebuild` run twice produces duplicated PBXFileReference entries or duplicated Sources build phase entries for the 2 Swift files. | Medium | High (Xcode build error / "duplicate symbol" warnings) | `add-swift-sources.ts` checks `pbxSourcesBuildPhaseObj.files` by basename before adding, and skips PBXFileReference creation if a reference with the same path already exists. Test `(b)` asserts byte-identical pbxproj output on second run. |
| R3 | **`SetFocusFilterIntent` activation/deactivation distinction missing in current SDK** — the SDK exposes a single `perform()` without an `isActive`-style flag, breaking FR-FF-014's `event` semantics. | Low | Medium (UI loses the activated/deactivated badge) | Per R-B, fall back to recording every invocation as `activated` and document the limitation in research.md. The current filter state panel still renders (FR-FF-026); the deactivation-specific Edge Case "last seen at <time>" indicator becomes a "last activation" indicator instead. |
| R4 | **Settings → Focus search for "spot" doesn't surface "Showcase Mode"** — Apple's search index doesn't pick up the filter title because of bundle-name interaction (e.g. only `CFBundleDisplayName` is indexed, not the filter title literal). | Low | High (US1 AS6 / SC-002 fail) | T012 (on-device) verifies the search hit. Mitigation if it fails: rename the filter's `LocalizedStringResource` to include a more searchable phrase OR ensure the app's `CFBundleDisplayName` contains "spot". Both paths preserve FR-FF-009 without editing 013's sources. |
| R5 | **Filter intent runs while app suspended and the App Group write is throttled** — iOS may de-prioritise the write under thermal pressure, leaving the JS layer reading stale values on next foreground. | Low | Low (US1 AS3 timing fails — refresh > 500 ms) | `FocusFilterStorage.write` uses synchronous `UserDefaults.set`; no NSURLSession / file I/O. NFR-FF-009 / FR-FF-013 keep the perform() body to a single in-memory write. T012 measures actual latency. |
| R6 | **JS bridge dedup-warn map memory leak** — the dedup map (R-D) accumulates entries across the session; a long-lived app could OOM if many distinct parse failures occur. | Very Low | Low | Cap the dedup map at 64 entries; evict oldest on insert. Test `focus-filters.test.ts` asserts the cap. |
| R7 | **`@Parameter(title:)` localisation drift** — `LocalizedStringResource("Showcase Mode")` resolves to a key the App Bundle's `Localizable.strings` doesn't contain, falling back to the literal — which is what we want — but a future contributor adds `Localizable.strings` and the literal silently changes. | Very Low | Low (cosmetic — Settings sheet shows a different label) | Document in research.md that the filter relies on default-locale literal resolution; if the app gains a `Localizable.strings`, contributors MUST add the three mode keys + the filter title key explicitly. No code change in 029. |
| R8 | **Cross-feature App Group key collision** — a future refactor renames `spot.widget.config` / `lockConfig` / `standbyConfig` and accidentally collides with `spot.focus.filterValues`, or vice versa. | Very Low | Medium | AC-FF-009 asserts disjoint namespaces. The four namespaces are documented here and in spec.md; any rename PR would land before this assertion is updated, surfacing the conflict in CI. |
| R9 | **Bridge interface drift** — adding `FocusFilters` symbols to a shared `requireOptionalNativeModule` registry collides with 013's `'AppIntents'` module name. | Very Low | Low (test churn only) | Distinct native module name `'FocusFilters'` (not `'AppIntents'`). Test `focus-filters.test.ts` asserts the module name lookup is exactly `'FocusFilters'`. |
| R10 | **Pretend toggle simulated event log spam** — rapid draft edits while toggle ON produce one log entry per keystroke, blowing past the 10-entry ring buffer in seconds. | Medium | Low (ring buffer evicts cleanly; user just sees rapid log churn) | FR-FF-031 mandates ~300 ms debounce; `useFocusFilter` implements via `useDebouncedCallback`-style helper. `PretendFilterToggle.test.tsx` asserts the debounce. |

## Test baseline tracking

- **Branch start**: carried forward from feature 028's
  completion totals (recorded in 028's `plan.md` / `retrospective.md`
  per FR-SB-059). 028's plan.md documented an expected delta of
  ≥ +16 suites; 029's T011 will substitute the actual 028 close
  numbers into this section before the merge commit.
- **Expected delta** (sketch, finalised in `tasks.md`):
  - +1 `filter-modes.test.ts` suite
  - +1 `manifest.test.ts` suite
  - +3 `screen.{ios,android,web}.test.tsx` suites
  - +1 `useFocusFilter.test.tsx` suite
  - +7 component test suites (Explainer, FilterDefinition,
    CurrentState, PretendFilterToggle, SetupInstructions,
    EventLog, IOSOnlyBanner)
  - +1 `focus-filters.test.ts` (bridge) suite
  - +2 plugin test suites (`index.test.ts`, `add-swift-sources.test.ts`)
  - **Total target**: **≥ +16 suites at completion** (matches
    028's shape; 029 has fewer plugin tests — no marker
    insertion / commutativity matrix on a `WidgetBundle` —
    but more component tests because the FilterDefinition +
    CurrentState + PretendFilterToggle trio is wider than
    028's analogous panel set).
- Final deltas reported in `specs/029-focus-filters/retrospective.md`
  per FR-FF-057.

## Progress Tracking

- [x] Spec authored and approved (specs/029-focus-filters/spec.md, 2026-05-07)
- [x] Plan authored — this file (Phase 0 + Phase 1 outline complete)
- [ ] Phase 0 — `research.md` written (resolves R-A through R-E with code-level detail)
- [ ] Phase 1 — `data-model.md`, `contracts/*.contract.ts`, `quickstart.md` written
- [ ] `/speckit.tasks` run; `tasks.md` written from the T001-T012 seeds above
- [ ] T001-T010 implemented; `pnpm check` green; baseline delta substituted into "Test baseline tracking"
- [ ] T011 (`pnpm check` gate) signed off
- [ ] T012 (on-device quickstart) signed off on a real iOS 16+ device
- [ ] `retrospective.md` written; final test totals substituted; merged to main

## Complexity Tracking

> No constitution violations. Section intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| _(none)_  | _(n/a)_    | _(n/a)_                              |
