# Implementation Plan: PassKit / Wallet (Add Pass) Module

**Branch**: `036-passkit-wallet` | **Date**: 2026-04-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/036-passkit-wallet/spec.md`
**Branch parent**: `035-core-bluetooth`

## Summary

Add a "Wallet (PassKit)" showcase module that demonstrates Apple's
PassKit surface via a thin Swift bridge over `PKAddPassesViewController`
and `PKPassLibrary`. The feature ships as a **code-complete educational
scaffold** (mirroring 015 ScreenTime): all Swift sources, the JS bridge,
the config plugin, and the React UI exist with full JS-pure unit
coverage, but no signed `.pkpass` is checked in (Apple gates pass
signing on a developer-issued Pass Type ID + certificate, neither of
which can be shipped in a public repo). Users who own a Pass Type ID
substitute the placeholder entitlement in `app.json` and drop in a
signed pass to exercise the real flow; everyone else sees the full
five-card UI with an `EntitlementBanner` + inline "Pass signing
required" status surfaced from the "Try with bundled sample" button.
The module is self-contained inside `src/modules/passkit-lab/` and
registers as a single new card (`id: 'passkit-lab'`,
`platforms: ['ios','android','web']`, `minIOS: '6.0'`) appended to
`src/modules/registry.ts`. The native layer is a single Swift file
`native/ios/passkit/PassKitBridge.swift` linking `PassKit.framework`;
non-iOS variants of the JS bridge (`passkit.android.ts`,
`passkit.web.ts`) reject every method with `PassKitNotSupported`. A
new config plugin `plugins/with-passkit/` adds the
`com.apple.developer.pass-type-identifiers` entitlement with a
documented placeholder array, idempotent across re-runs, coexisting
with all 22 prior plugins. Integration is purely additive at the
project boundary: registry +1 (30 → 31 modules), `app.json` `plugins`
+1 (22 → 23 plugins), zero new runtime JS dependencies.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict). React 19.2 + React
Native 0.83 + React Compiler enabled. Swift 5.9 for the single new
native file (`PassKitBridge.swift`); compiled by EAS Build / Xcode on
macOS, not by the Windows-side test suite.
**Primary Dependencies**: Expo SDK 55, expo-router (typed routes),
`expo-modules-core` (consumed by the Swift bridge for the
`requireNativeModule` surface and for typed AsyncFunction error
propagation), `@expo/config-plugins` (used by the new
`with-passkit` plugin). `PassKit.framework` is a system framework on
iOS (no SPM / CocoaPods package needed — linkage is declared via the
podspec / `Podfile.properties.json`). **REUSED** (no version
movement): all prior pinned packages. **NEW runtime JS deps: zero.**
**Storage**: None. Capability flags, the My Passes list, the
`lastError`, and the `inFlight` flag are in-memory and scoped to the
screen's lifetime. Passes themselves live in Apple Wallet, accessed
read-only via `PKPassLibrary.passes()`; the module never persists pass
metadata to disk.
**Testing**: Jest Expo + React Native Testing Library — JS-pure tests
only. Per FR-027, all native bridges are mocked **at the import
boundary** (`src/native/passkit.ts`); no test reaches into
`expo-modules-core`'s `requireNativeModule` machinery directly. This
mirrors the precedent established by 015 (ScreenTime) and refined
through 030 / 031 / 032 / 033 / 034 / 035: the bridge file is the
single seam, so the mock attaches to one stable identity. The Swift
file `PassKitBridge.swift` is reviewed but **not** unit-tested on
Windows; on-device verification belongs to `quickstart.md`.
**Target Platform**: iOS 6+ (PassKit shipped in iOS 6;
`PKPassLibrary.openPass(passTypeIdentifier:serialNumber:)` is iOS
13.4+ and is gated behind `@available` in Swift and a typed
`PassKitOpenUnsupported` rejection in the JS bridge). Android and
Web are stubs that reject every method with `PassKitNotSupported` and
show an `IOSOnlyBanner` while preserving the five-card educational
shell. `screen.web.tsx` MUST NOT eagerly import the iOS bridge file
at module-evaluation time (carryover from 030–035 SC-007 discipline);
the platform-split bridge family handles this automatically.
**Project Type**: Mobile app (Expo) authoring **one new Swift native
file** plus a thin Expo prebuild config plugin. Strictly additive: no
new extension target, no App Group changes, no edits to features
002–035 outside the single-line registry append + single-entry
`app.json` plugin append.
**Performance Goals**: Screen mount → first meaningful paint
< 250 ms; capability probes return < 100 ms in 95% of cases (both
are synchronous reads on iOS); `PKPassLibrary.passes()` returns
< 500 ms for a typical wallet (≤ 50 passes); URL-fetch path
end-to-end (download + present sheet) < 5 s on a reachable
signed pass under 200 KB. The five-card layout MUST scroll at 60 fps
with up to 20 `PassRow` instances rendered.
**Constraints**: Purely additive at integration level — 1 import + 1
array entry in `src/modules/registry.ts`; +1 entry in `app.json`
`plugins`; zero runtime JS dependencies; no edits to prior plugin /
screen / Swift sources; no `eslint-disable` directives anywhere in
added or modified code (FR-029, user-stipulated); `StyleSheet.create()`
only (Constitution IV); `.android.ts` / `.web.ts` splits for non-trivial
platform branches (Constitution III); the bridge is mocked at the
import boundary in tests (FR-027); `pnpm format` is a no-op after the
final commit; no signed `.pkpass` binary checked in (FR-006); the
`com.apple.developer.pass-type-identifiers` entitlement is shipped as
a **placeholder** (FR-019).
**Scale/Scope**: One module directory (`src/modules/passkit-lab/`),
one new plugin (`plugins/with-passkit/`), one new bridge file family
(`src/native/passkit.ts` + `.android.ts` / `.web.ts` / `.types.ts`
siblings), one new Swift file (`native/ios/passkit/PassKitBridge.swift`),
one hook (`hooks/usePassKit.ts`), eight UI components, three screen
variants. No bundled assets. No new top-level dependencies.
**Test baseline at branch start**: carried forward from feature 035's
completion totals (recorded in 035's `plan.md` / `retrospective.md`).
036's expected delta: **≥ +14 suites** (see "Test baseline tracking"
below).

## Constitution Check

*Constitution version checked*: **1.1.0**
(`.specify/memory/constitution.md`).

| Principle | Compliance |
|-----------|------------|
| I. Cross-Platform Parity | **PASS** — iOS ships the full module (capabilities, add-from-bytes, add-from-URL, my-passes enumeration, open-in-Wallet on iOS 13.4+). Android and Web ship the same five-card educational shell with controls disabled and an `IOSOnlyBanner` at the top — every JS bridge method rejects with a typed `PassKitNotSupported`. The educational UI shape is itself part of the lesson and is preserved cross-platform (story P3). The platform asymmetry is dictated by Apple Wallet itself being iOS-only and is documented in spec §"Out of Scope" + Story 3. |
| II. Token-Based Theming | **PASS** — All chrome uses `ThemedView` / `ThemedText` and the `Spacing` scale from `src/constants/theme.ts`. Reuses existing semantic colour tokens (`textPrimary` / `surfaceElevated` / `accent` / `warning` / `error`); the segmented status pill, banner, and per-row layout shapes match the conventions established by 015 / 029 / 032 / 033 / 034 / 035. No new theme entries; no hardcoded hex values. |
| III. Platform File Splitting | **PASS** — `screen.tsx` / `screen.android.tsx` / `screen.web.tsx`. Bridge has matching `passkit.ts` / `.android.ts` / `.web.ts` / `.types.ts` variants (mirrors 030–035 layouts). The non-iOS variants throw `PassKitNotSupported` from every method without importing `expo-modules-core`'s `requireNativeModule`, so they are fully Windows / Node-runnable. `Platform.select` is permitted only for trivial style / copy diffs. |
| IV. StyleSheet Discipline | **PASS** — All styles via `StyleSheet.create()`; `Spacing` from theme tokens; no inline objects, no CSS-in-JS, no utility-class frameworks. |
| V. Test-First for New Features | **PASS** — JS-pure tests are enumerated in the "Phased file inventory" section below and cover: every component (`CapabilitiesCard`, `AddSamplePassCard`, `MyPassesList`, `PassRow`, `AddFromUrlCard`, `SetupGuideCard`, `EntitlementBanner`, `IOSOnlyBanner`), the `usePassKit` hook (capability flow, refresh, add-from-URL, add-from-bytes, error path, unmount cleanup), the bridge across all three platforms (iOS delegates to a mocked native module; Android / Web variants reject with `PassKitNotSupported`), the `with-passkit` plugin (idempotency + coexistence with all 22 prior plugins via the existing 002–035 fixture composition pattern), all three screen variants, the `pass-types` catalog, and the manifest contract. The Swift source `PassKitBridge.swift` is reviewed and compiled on macOS / EAS Build but **not** unit-tested on Windows; on-device verification is documented in `quickstart.md`. |
| Validate-Before-Spec (workflow) | **PASS / N/A** — Not a build-pipeline feature in the sense of 004 (where a real build had to be attempted before the spec was written). The plugin's behaviour is verified by JS-pure tests against `@expo/config-plugins`'s `withEntitlementsPlist` mod. A full `expo prebuild` smoke-test is recorded in `quickstart.md` §3 as the on-device gate. The educational-scaffold framing (no signed binary shipped, placeholder entitlement, native flow exercised only by the user's own Pass Type ID) is the deliberate scope choice — see spec §"Pass Signing Reality Check" + the four-locations rule (spec, on-screen banner, quickstart, assumptions). |

**Initial Constitution Check: PASS — no violations, no entries needed
in Complexity Tracking.**

**Re-check after Phase 1 (post-design): PASS** — the Phase 1 artifacts
(data-model, contracts, quickstart) introduce zero new global stores
(no AsyncStorage key, no `UserDefaults` write), zero new theme tokens,
zero new runtime JS dependencies, and no inline `Platform.select`
beyond trivial style branches. The bridge's typed surface keeps every
PassKit-specific symbol strictly inside `src/native/passkit.ts` and
the Swift file `PassKitBridge.swift`; non-iOS variants import only the
shared `*.types.ts` and the typed error classes. The bridge module
name `'PassKitBridge'` does not collide with any prior native module
— see `contracts/passkit-bridge.md` invariant B1.

## Project Structure

### Documentation (this feature)

```text
specs/036-passkit-wallet/
├── plan.md                        # this file
├── research.md                    # Phase 0 output (R-A through R-G)
├── data-model.md                  # Phase 1 output (entities 1–6)
├── quickstart.md                  # Phase 1 output
├── contracts/
│   ├── passkit-bridge.md              # JS bridge typed surface (6 methods)
│   │                                  #   + 5 typed error classes
│   ├── passkit-lab-manifest.md        # Registry entry contract
│   │                                  #   (id 'passkit-lab', label,
│   │                                  #    platforms, minIOS '6.0')
│   ├── with-passkit-plugin.md         # with-passkit modifier shape +
│   │                                  #   placeholder-entitlement +
│   │                                  #   idempotency invariants
│   └── usePassKit-hook.md             # Hook return shape + actions +
│                                      #   lifecycle + error classification
└── tasks.md                       # Phase 2 output (NOT created here)
```

### Source Code (repository root)

```text
# NEW (this feature) — TypeScript module
src/modules/passkit-lab/
├── index.tsx                              # ModuleManifest (id 'passkit-lab',
│                                          #   minIOS '6.0', platforms ['ios','android','web'])
├── screen.tsx                             # iOS variant. Renders, in fixed order:
│                                          #   EntitlementBanner (conditional) →
│                                          #   CapabilitiesCard → AddSamplePassCard →
│                                          #   MyPassesList → AddFromUrlCard → SetupGuideCard
├── screen.android.tsx                     # Android: IOSOnlyBanner + the same five
│                                          #   cards rendered with all controls disabled
├── screen.web.tsx                         # Web: same as Android. MUST NOT eagerly
│                                          #   import the iOS bridge file
├── pass-types.ts                          # Exports PassMetadata type + the 5-entry
│                                          #   PassCategory catalog (boardingPass,
│                                          #   coupon, eventTicket, generic, storeCard)
│                                          #   with a short user-facing label per
│                                          #   category. Catalog is exhaustively tested.
├── hooks/
│   └── usePassKit.ts                      # { capabilities, passes, inFlight, lastError,
│                                          #   refresh, addFromBytes, addFromURL, openPass };
│                                          #   reducer-serialised mutations; cancels in-flight
│                                          #   on unmount; never setState after unmount;
│                                          #   classifies bridge errors per R-D; ONLY public
│                                          #   surface consumed by screen variants
└── components/
    ├── CapabilitiesCard.tsx               # Two status pills bound to
    │                                      #   isPassLibraryAvailable + canAddPasses;
    │                                      #   Refresh re-evaluates both
    ├── AddSamplePassCard.tsx              # Explanation + "Try with bundled (unsigned)
    │                                      #   sample" button; surfaces "Pass signing
    │                                      #   required" inline when no bundle present;
    │                                      #   if a signed bundle is provided, calls
    │                                      #   addFromBytes(base64) and shows the result
    ├── MyPassesList.tsx                   # Empty-state row when zero passes; else maps
    │                                      #   each PassMetadata to a PassRow; per-card
    │                                      #   Refresh button calls bridge.passes()
    ├── PassRow.tsx                        # Renders serialNumber, organizationName,
    │                                      #   localizedDescription, passType label;
    │                                      #   per-row Open in Wallet button calls
    │                                      #   openPass on iOS 13.4+, hidden / disabled
    │                                      #   below with a tooltip
    ├── AddFromUrlCard.tsx                 # URL text input + "Fetch and add" button;
    │                                      #   calls addFromURL; failures surface as
    │                                      #   inline status text
    ├── SetupGuideCard.tsx                 # Renders the documented step list
    │                                      #   (developer.apple.com Pass Type ID
    │                                      #    registration + certificate generation
    │                                      #    + signpass-style packaging). No verbatim
    │                                      #   Apple text; uses links.
    ├── EntitlementBanner.tsx              # Visible iff app.json still carries the
    │                                      #   placeholder pass-type-identifiers value;
    │                                      #   tappable link to quickstart.md
    └── IOSOnlyBanner.tsx                  # Rendered on Android and Web; explains the
                                            #   module is iOS-only and that controls
                                            #   below are disabled

# NEW (this feature) — JS bridge (mirrors 030 / 031 / 032 / 033 / 034 / 035 layout)
src/native/passkit.ts                      # iOS impl: thin wrapper over the Swift
                                            #   PassKitBridge module. Imports
                                            #   `requireNativeModule('PassKitBridge')`
                                            #   exactly once. Translates raw native
                                            #   results into the stable PassKitBridge
                                            #   interface (PassMetadata.passType
                                            #   normalisation, base64 framing).
                                            #   Mutating methods serialised through a
                                            #   closure-scoped promise chain inherited
                                            #   verbatim from 030 / 031 / 032 / 033 / 034 / 035 (R-A).
src/native/passkit.android.ts              # Stub: every method rejects with
                                            #   PassKitNotSupported. canAddPasses /
                                            #   isPassLibraryAvailable return Promise<false>
                                            #   so the screen can render disabled controls.
src/native/passkit.web.ts                  # Identical to .android.ts in shape; rejects
                                            #   every async method with PassKitNotSupported.
src/native/passkit.types.ts                # PassKitBridge interface; PassMetadata type;
                                            #   PassCategory union ('boardingPass' |
                                            #   'coupon' | 'eventTicket' | 'generic' |
                                            #   'storeCard'); Capabilities type;
                                            #   5 typed error classes (PassKitNotSupported,
                                            #   PassKitOpenUnsupported, PassKitDownloadFailed,
                                            #   PassKitInvalidPass, PassKitCancelled).
                                            #   Distinct module name 'PassKitBridge'
                                            #   (no collision with prior modules).

# NEW (this feature) — Swift native source
native/ios/passkit/PassKitBridge.swift     # ExpoModulesCore Module wrapping
                                            #   PKAddPassesViewController + PKPassLibrary.
                                            #   AsyncFunction("canAddPasses"),
                                            #   AsyncFunction("isPassLibraryAvailable"),
                                            #   AsyncFunction("passes"),
                                            #   AsyncFunction("addPassFromBytes"),
                                            #   AsyncFunction("addPassFromURL"),
                                            #   AsyncFunction("openPass") (iOS 13.4+).
                                            #   All entry points wrapped in do/catch;
                                            #   typed errors via expo-modules-core's
                                            #   Exception machinery. Presents
                                            #   PKAddPassesViewController from the
                                            #   key-window's top-most presented controller
                                            #   and forwards didAddPasses / didFinish into
                                            #   { added: boolean }. Wallet.framework
                                            #   linkage declared via the podspec (next file).
native/ios/passkit/PassKit.podspec         # Optional companion podspec (or merged into the
                                            #   workspace's existing module podspec) that
                                            #   declares `s.frameworks = 'PassKit'`. The
                                            #   exact filename is finalised in T003; if the
                                            #   project uses an umbrella podspec (verified at
                                            #   plan time), the framework declaration is
                                            #   appended there instead. Either way the
                                            #   linkage is owned by the with-passkit plugin
                                            #   so prebuild reproduces it.

# NEW (this feature) — Expo config plugin
plugins/with-passkit/
├── index.ts                                # ConfigPlugin: withEntitlementsPlist mod
│                                            #   that adds
│                                            #   'com.apple.developer.pass-type-identifiers'
│                                            #   with a default placeholder array
│                                            #   ['$(TeamIdentifierPrefix)pass.example.placeholder']
│                                            #   ONLY when absent (preserves any value set
│                                            #   by the operator). Also ensures
│                                            #   PassKit.framework is linked (via the
│                                            #   project's existing iOS framework-list
│                                            #   modifier convention; see research §G).
│                                            #   Idempotent: running the plugin twice on
│                                            #   the same Expo config produces a deep-equal
│                                            #   config. Documents the placeholder + how to
│                                            #   replace it in a JSDoc block.
├── index.test.ts                            # Co-located smoke test importing index.ts to
│                                            #   verify the export shape; thorough
│                                            #   behavioural tests live in
│                                            #   test/unit/plugins/with-passkit/index.test.ts.
└── package.json                             # Same shape as plugins/with-bluetooth/package.json
                                              #   (or plugins/with-arkit/package.json):
                                              #   name, version, main 'index.ts'. NO
                                              #   dependencies (config plugins resolve
                                              #   @expo/config-plugins from the host
                                              #   package).

# MODIFIED (additive only)
src/modules/registry.ts                    # +1 import line, +1 array entry (passkitLab)
                                            #   — registry size 30 → 31
app.json                                   # +1 string entry in expo.plugins:
                                            #   "./plugins/with-passkit". 22 → 23 plugins.

# NOT MODIFIED — verified non-regression in tests
plugins/with-{live-activity,app-intents,home-widgets,screentime,coreml,vision,
              speech-recognition,audio-recording,sign-in-with-apple,local-auth,
              keychain-services,mapkit,core-location,rich-notifications,
              lock-widgets,standby-widget,focus-filters,background-tasks,
              spotlight,documents,arkit,bluetooth}/**     # All 22 prior plugins byte-identical.
native/ios/{live-activity,app-intents,home-widgets,coreml,vision,
            speech-recognition,audio-recording,sign-in-with-apple,
            local-auth,keychain-services,mapkit,core-location,
            rich-notifications,lock-widgets,standby-widget,focus-filters,
            background-tasks,spotlight,quicklook,share-sheet,arkit}/**
                                            # All prior native sources byte-identical.
src/native/{app-intents,widget-center,focus-filters,background-tasks,spotlight,
              quicklook,share-sheet,arkit,ble-central}.*  # All prior bridges byte-identical.
src/modules/{intents-lab,widgets-lab,lock-widgets-lab,standby-lab,
              focus-filters-lab,background-tasks-lab,spotlight-lab,
              documents-lab,share-sheet-lab,arkit-lab,bluetooth-lab,...}/**
                                            # All prior modules byte-identical.
ios-widget/**                              # 014/027/028-owned widget extension; NOT touched.

# Tests (NEW)
test/unit/modules/passkit-lab/
├── manifest.test.ts                        # id 'passkit-lab', label 'Wallet (PassKit)',
│                                            #   platforms ['ios','android','web'],
│                                            #   minIOS '6.0'
├── pass-types.test.ts                      # Catalog has 5 entries; keys are unique;
│                                            #   each label is non-empty; PassCategory
│                                            #   union exhaustive over the catalog
├── screen.test.tsx                         # iOS flow: five cards in fixed order;
│                                            #   EntitlementBanner visibility toggles on
│                                            #   the placeholder flag; capability pills
│                                            #   bind to bridge values; AddSamplePassCard
│                                            #   surfaces "Pass signing required" when
│                                            #   no bundle present
├── screen.android.test.tsx                 # IOSOnlyBanner present; all action buttons
│                                            #   disabled; bridge methods never invoked
├── screen.web.test.tsx                     # IOSOnlyBanner present; assert
│                                            #   src/native/passkit.ts is NOT in the web
│                                            #   bundle's import closure
├── hooks/
│   └── usePassKit.test.tsx                 # mount default state; refresh() invokes both
│                                            #   capability methods + passes(); addFromURL
│                                            #   happy path; addFromBytes happy path;
│                                            #   download failure surfaces
│                                            #   PassKitDownloadFailed via lastError;
│                                            #   invalid-pass failure surfaces
│                                            #   PassKitInvalidPass; cancel surfaces
│                                            #   PassKitCancelled (added: false); openPass
│                                            #   on iOS<13.4 rejects with
│                                            #   PassKitOpenUnsupported; unmount during
│                                            #   in-flight URL fetch produces zero
│                                            #   post-unmount setState calls (R-D)
└── components/
    ├── CapabilitiesCard.test.tsx           # both pills bind to bridge values; Refresh
    │                                        #   re-invokes both bridge methods; pill
    │                                        #   captions match boolean state
    ├── AddSamplePassCard.test.tsx          # without bundled sample: button surfaces
    │                                        #   "Pass signing required"; with mocked
    │                                        #   sample bytes: button calls
    │                                        #   addPassFromBytes; cancel rejection
    │                                        #   surfaces in status; success surfaces
    │                                        #   "Pass added"
    ├── MyPassesList.test.tsx               # 0 passes → empty-state row; N passes →
    │                                        #   N PassRows; Refresh calls passes() once
    ├── PassRow.test.tsx                    # renders all 4 metadata fields; passType
    │                                        #   resolves to category label from
    │                                        #   pass-types.ts; Open in Wallet calls
    │                                        #   openPass(passTypeIdentifier, serialNumber)
    │                                        #   on iOS 13.4+; disabled below
    ├── AddFromUrlCard.test.tsx             # URL input + Fetch button invokes
    │                                        #   addFromURL with the entered string;
    │                                        #   network failure surfaces
    │                                        #   "Download failed"; invalid-pass failure
    │                                        #   surfaces "Pass invalid or unsigned";
    │                                        #   user cancel surfaces "Cancelled"
    ├── SetupGuideCard.test.tsx             # renders the documented step list (no
    │                                        #   verbatim Apple copy); links resolve to
    │                                        #   developer.apple.com hosts
    ├── EntitlementBanner.test.tsx          # visible when placeholder entitlement
    │                                        #   detected; hidden when real Pass Type ID
    │                                        #   present
    └── IOSOnlyBanner.test.tsx              # renders the iOS-only message; assertion
                                              #   uses platform mock
test/unit/native/
└── passkit.test.ts                         # iOS path: each method delegates to a mocked
                                              #   PassKitBridge native module; passType
                                              #   normalisation; serialisation invariant
                                              #   (R-A); Android + Web stubs reject every
                                              #   method with PassKitNotSupported; the 5
                                              #   typed error classes share a single
                                              #   identity across files (instanceof
                                              #   round-trip); openPass on the iOS path
                                              #   rejects with PassKitOpenUnsupported when
                                              #   the native module reports
                                              #   `__legacy_open_unsupported: true`
test/unit/plugins/with-passkit/
└── index.test.ts                           # withEntitlementsPlist adds the
                                              #   pass-type-identifiers key with the
                                              #   placeholder array when absent;
                                              #   preserves an operator-supplied real
                                              #   value; idempotent (running twice
                                              #   produces a deep-equal config — SC-006);
                                              #   coexists with all 22 prior plugins
                                              #   (composed via the existing 002–035
                                              #   fixture pattern; asserts entitlements
                                              #   from prior plugins are byte-identical
                                              #   after composition — SC-007)
```

**Structure Decision**: Mirrors **035's** `Expo + iOS-main-app-target`
shape, with **two structural differences** versus 035:

1. **One new Swift source** — `PassKitBridge.swift`. 035 had zero new
   native sources (it delegated to the upstream `react-native-ble-plx`
   library). 036 authors its own thin Swift bridge because PassKit is
   small, system-shipped, and has no Expo-compatible upstream wrapper
   that adds value over a 100-line Swift file. The Swift code is not
   testable on Windows; tests live entirely in the JS layer with the
   bridge mocked at `src/native/passkit.ts`.
2. **Zero new runtime JS dependencies** — 035 added one
   (`react-native-ble-plx`). 036 adds zero. The educational scaffold
   framing means the only "code we don't ship" is the user's own
   signed `.pkpass` and Pass Type ID; everything else is in-repo.

Other carryovers from 035 are preserved:

- Platform-split bridge file family (`.ts` / `.android.ts` /
  `.web.ts` / `.types.ts`) and platform-split screen files.
- Closure-scoped promise chain `enqueue()` for mutating async
  bridge methods (R-A inherited verbatim).
- Hook-as-only-public-surface invariant for components.
- All-typed-errors-from-types-file invariant for cross-platform
  `instanceof` correctness.
- Module-name distinctness (`'PassKitBridge'` does not collide with
  `'AppIntents'` / `'WidgetCenter'` / `'FocusFilters'` /
  `'BackgroundTasks'` / `'Spotlight'` / `'QuickLook'` /
  `'ShareSheet'` / `'ARKitBridge'` / `'BleCentralBridge'`).
- Plugin idempotency proof via JS-pure tests against
  `@expo/config-plugins` mods.
- Educational-scaffold framing inherited from 015 (ScreenTime):
  code is complete, on-device functional verification is gated on
  developer-account artifacts the user supplies.

## Resolved decisions

The spec was approved without clarifications. The following are the
plan-level technical decisions made autonomously, recorded in
`research.md` with full Decision / Rationale / Alternatives:

| # | Decision | Spec ref / location |
|---|----------|---------------------|
| R-A | **Bridge serialisation** via closure-scoped promise chain (inherited verbatim from 030 / 031 / 032 / 033 / 034 / 035). Two back-to-back mutating calls (e.g., two rapid Add From URL submissions) produce two native invocations in submission order. Applied on all three platforms (Android / Web reject in submission order with `PassKitNotSupported`). Synchronous reads (none in this feature; even capability checks are async) and emitter listeners (none in this feature) are NOT serialised. | research §1 |
| R-B | **Native authoring choice**: a hand-written Swift bridge over `PKAddPassesViewController` + `PKPassLibrary` (one file, ≤ 200 LOC), instead of pulling in a third-party `react-native-passkit*` library. Rationale: PassKit's surface is small (six methods, all mappable to `AsyncFunction`), the iOS APIs are stable since iOS 6, and no maintained Expo-compatible wrapper exists. A custom bridge keeps zero new runtime JS dependencies and matches the 015 ScreenTime precedent. | research §2 / spec §"Assumptions" |
| R-C | **Educational-scaffold framing** (no signed `.pkpass` shipped): the "Try with bundled sample" button detects bundle absence at module load and surfaces "Pass signing required" without attempting a network call or a `PKAddPassesViewController` presentation. The placeholder entitlement is shipped via `with-passkit`. Quickstart documents the user-side override. The four-locations rule (spec, on-screen banner, quickstart, assumptions) keeps the gate visible. This mirrors 015 (ScreenTime) where the on-device flow is gated on an Apple-issued capability the repo cannot ship. | research §3 / spec §"Pass Signing Reality Check" |
| R-D | **Hook error classification**: every mutating bridge call is caught at the hook boundary and dispatched as one of `'unsupported'` (`PassKitNotSupported`), `'open-unsupported'` (`PassKitOpenUnsupported`), `'download-failed'` (`PassKitDownloadFailed`), `'invalid-pass'` (`PassKitInvalidPass`), `'cancelled'` (`PassKitCancelled` — used when the user dismisses `PKAddPassesViewController` without approving), or `'failed'` (any other Error). The `lastError` field on the hook state carries a human-readable string for inline caption rendering. The hook NEVER allows a bridge call to surface as an unhandled rejection (FR-024). | research §4 |
| R-E | **`openPass` iOS-version gate**: the Swift side uses `@available(iOS 13.4, *)` and falls through to a typed exception on earlier OSes; the JS bridge inspects the `Platform.constants` major.minor pair and short-circuits with a synchronous `PassKitOpenUnsupported` rejection on iOS < 13.4 to avoid a needless native round-trip. The hook surfaces this via `lastError` on the corresponding `PassRow`; `PassRow` itself disables / hides the Open in Wallet button on iOS 13.0–13.3 with an explanatory tooltip. The contract test asserts both paths. | research §5 / FR-017, FR-024 |
| R-F | **URL-fetch behaviour**: `addPassFromURL(url)` performs the download inside the Swift bridge using `URLSession`, then forwards the resulting `Data` to the same `PKAddPassesViewController` presentation path used by `addPassFromBytes`. Doing the fetch native-side avoids a JS↔native double base64 round-trip for large packages and keeps the cancellation semantics tight (cancelling the screen during fetch cancels the `URLSessionTask`). On Android / Web the method rejects with `PassKitNotSupported` from the JS stub without ever reaching the network. | research §6 / FR-008, FR-012 |
| R-G | **Plugin design**: `with-passkit` is a single `withEntitlementsPlist` mod that sets `com.apple.developer.pass-type-identifiers` to the placeholder array `['$(TeamIdentifierPrefix)pass.example.placeholder']` only when the key is absent — preserving any operator-supplied real Pass Type IDs. `PassKit.framework` linkage piggybacks on the project's existing iOS framework-list pattern (a single `withXcodeProject` mod that appends `PassKit.framework` to the main target's frameworks build phase only when not already linked). Both mods are idempotent: running the plugin twice on the same Expo config produces a deep-equal config (SC-006). The plugin coexists with all 22 prior plugins because it touches a key (`pass-type-identifiers`) and a framework (`PassKit.framework`) that no prior plugin owns. | research §7 / FR-019, FR-020, FR-021, FR-022 |

## Phase 0 — Research

`research.md` resolves R-A through R-G with code-level detail.

- §1 R-A: Bridge serialisation (inherited from 030 / 031 / 032 / 033
  / 034 / 035)
- §2 R-B: Native authoring choice — hand-written Swift bridge vs
  third-party libraries (decision matrix + rejection rationale)
- §3 R-C: Educational-scaffold framing — bundle-absence detection,
  the four-locations rule, the 015 ScreenTime precedent
- §4 R-D: Hook error classification table (5 categories) +
  unhandled-rejection prevention
- §5 R-E: `openPass` iOS-version gate — Swift `@available` +
  JS-side short-circuit
- §6 R-F: URL-fetch native-side rationale + `URLSessionTask`
  cancellation semantics
- §7 R-G: `with-passkit` plugin shape — placeholder entitlement,
  framework linkage, idempotency proof, 22-plugin coexistence
- §8 (Pass categories): the 5-entry catalog
  (`boardingPass`, `coupon`, `eventTicket`, `generic`, `storeCard`)
  + per-category user-facing label conventions

## Phase 1 — Design & Contracts

**Prerequisites**: research.md complete (R-A through R-G resolved).

1. **`data-model.md`** — entities 1–6:
   - `PassMetadata` (`{ passTypeIdentifier, serialNumber,
     organizationName, localizedDescription, passType }`)
   - `PassCategory`
     (`'boardingPass' | 'coupon' | 'eventTicket' | 'generic' | 'storeCard'`)
   - `Capabilities`
     (`{ isPassLibraryAvailable: boolean; canAddPasses: boolean }`)
   - `EntitlementStatus` (derived boolean: placeholder present?)
   - `PassKitState` (hook state composing all of the above + `inFlight`,
     `lastError`)
   - 5 typed error classes
     (`PassKitNotSupported`, `PassKitOpenUnsupported`,
     `PassKitDownloadFailed`, `PassKitInvalidPass`, `PassKitCancelled`)
2. **`contracts/`** (markdown contract docs, mirroring 035's
   format — chosen to keep the contract surface readable for a
   wider reviewer set):
   - `passkit-bridge.md` — JS bridge typed surface (6 methods) +
     5 typed error classes + module-name invariant
   - `passkit-lab-manifest.md` — registry entry shape +
     invariants
   - `with-passkit-plugin.md` — `with-passkit` modifier shape,
     placeholder-entitlement semantics, idempotency, 22-plugin
     coexistence invariants
   - `usePassKit-hook.md` — hook return shape + actions +
     lifecycle + error classification
3. **`quickstart.md`** — JS-pure verification (Windows / CI) +
   on-device verification (a real iOS 13.4+ device with a developer
   account that owns at least one Pass Type ID and a signed
   `.pkpass` URL; an Android device and a desktop browser to
   exercise the IOSOnlyBanner). Adds an `expo prebuild` smoke-test
   step that asserts the generated entitlements file contains a
   non-empty `com.apple.developer.pass-type-identifiers` array
   exactly once. Documents the user-side override of the
   placeholder.
4. **Agent context update**: the workspace's
   `.github/copilot-instructions.md` carries `<!-- SPECKIT START -->`
   / `<!-- SPECKIT END -->` markers. The plan reference inside
   those markers is updated to point at
   `specs/036-passkit-wallet/plan.md`.

## Phased file inventory

NEW (TypeScript module):

- `src/modules/passkit-lab/index.tsx`
- `src/modules/passkit-lab/screen.tsx`
- `src/modules/passkit-lab/screen.android.tsx`
- `src/modules/passkit-lab/screen.web.tsx`
- `src/modules/passkit-lab/pass-types.ts`
- `src/modules/passkit-lab/hooks/usePassKit.ts`
- `src/modules/passkit-lab/components/{CapabilitiesCard,
  AddSamplePassCard, MyPassesList, PassRow, AddFromUrlCard,
  SetupGuideCard, EntitlementBanner, IOSOnlyBanner}.tsx`

NEW (JS bridge):

- `src/native/passkit.ts`
- `src/native/passkit.android.ts`
- `src/native/passkit.web.ts`
- `src/native/passkit.types.ts`

NEW (Swift):

- `native/ios/passkit/PassKitBridge.swift`
- `native/ios/passkit/PassKit.podspec` (or merged into the
  workspace's umbrella podspec; finalised in T003)

NEW (tests):

- `test/unit/modules/passkit-lab/manifest.test.ts`
- `test/unit/modules/passkit-lab/pass-types.test.ts`
- `test/unit/modules/passkit-lab/screen.test.tsx`
- `test/unit/modules/passkit-lab/screen.android.test.tsx`
- `test/unit/modules/passkit-lab/screen.web.test.tsx`
- `test/unit/modules/passkit-lab/hooks/usePassKit.test.tsx`
- `test/unit/modules/passkit-lab/components/{CapabilitiesCard,
  AddSamplePassCard, MyPassesList, PassRow, AddFromUrlCard,
  SetupGuideCard, EntitlementBanner, IOSOnlyBanner}.test.tsx`
- `test/unit/native/passkit.test.ts`
- `test/unit/plugins/with-passkit/index.test.ts`

NEW (Expo config plugin):

- `plugins/with-passkit/index.ts`
- `plugins/with-passkit/index.test.ts` (export-shape smoke test)
- `plugins/with-passkit/package.json`

MODIFIED (additive only):

- `src/modules/registry.ts` (+1 import, +1 array entry `passkitLab`)
- `app.json` (+1 string entry `'./plugins/with-passkit'` in
  `expo.plugins`; 22 → 23 plugins)
- `.github/copilot-instructions.md` (SPECKIT marker block updated
  to point at `specs/036-passkit-wallet/plan.md`)

NOT MODIFIED:

- All prior plugins / Swift sources / bridges / modules —
  byte-identical
- `package.json` / `pnpm-lock.yaml` — no new runtime deps; no
  devDependency changes
- No new App Group changes; no widget extension edits

## Task seeds for tasks.md

These are sketches for the `/speckit.tasks` step, ordered by
dependency. The full enumeration belongs in `tasks.md`; these are
intentionally coarse so `/speckit.tasks` can split each into
RED → GREEN → REFACTOR sub-tasks.

1. **T001 — Bridge types + non-iOS variants (RED-first)**:
   `src/native/passkit.types.ts` declares the bridge interface
   + `PassMetadata` + `PassCategory` + `Capabilities` + 5 typed
   error classes. `src/native/passkit.android.ts` and
   `src/native/passkit.web.ts` reject every async method with
   `PassKitNotSupported` and return `Promise<false>` from the
   capability probes. Tests cover the class identities
   (`instanceof` round-trip across files) and the rejection
   shape on each non-iOS variant.
2. **T002 — `pass-types.ts` catalog (RED-first)**: the 5-entry
   catalog mapping `PassCategory → { label }`. Tests assert
   exhaustiveness (catalog covers every union member; no extra
   keys), unique keys, and non-empty labels.
3. **T003 — Swift bridge + iOS JS bridge**: write
   `native/ios/passkit/PassKitBridge.swift` (six AsyncFunctions
   wrapping `PKAddPassesViewController` + `PKPassLibrary`, with
   `@available(iOS 13.4, *)` on `openPass`); finalise the
   podspec / framework-link declaration. Implement
   `src/native/passkit.ts` with the closure-scoped serialisation
   chain (R-A) and the iOS<13.4 short-circuit on `openPass` (R-E).
   Tests mock the native module at the import boundary
   (`requireNativeModule('PassKitBridge')`).
4. **T004 — `with-passkit` plugin (RED-first)**:
   `plugins/with-passkit/index.ts` + `package.json` + co-located
   smoke test. JS-pure tests in `test/unit/plugins/with-passkit/`
   exercise: placeholder entitlement is added when absent;
   operator-supplied real value is preserved; idempotency
   (SC-006); coexistence with all 22 prior plugins (composed via
   the existing 002–035 fixture pattern; asserts each prior
   plugin's entitlement-list and framework-link output is
   byte-identical after composition — SC-007).
5. **T005 — Manifest**:
   `src/modules/passkit-lab/index.tsx` + `manifest.test.ts`
   (asserts id `'passkit-lab'`, label `'Wallet (PassKit)'`,
   platforms `['ios','android','web']`, `minIOS: '6.0'`).
6. **T006 — Hook**:
   `src/modules/passkit-lab/hooks/usePassKit.ts` returning the
   documented state object; reducer-serialised mutations;
   classifies bridge errors (R-D); on unmount cancels in-flight
   work and stops dispatching (FR-023).
7. **T007 — Components, top-down RED**: write component tests
   first (`CapabilitiesCard`, `AddSamplePassCard`, `MyPassesList`,
   `PassRow`, `AddFromUrlCard`, `SetupGuideCard`,
   `EntitlementBanner`, `IOSOnlyBanner`); then implement against
   them. `AddSamplePassCard` MUST detect bundle absence and
   short-circuit to "Pass signing required" without invoking
   the bridge (R-C).
8. **T008 — Screens**: implement `screen.tsx`,
   `screen.android.tsx`, `screen.web.tsx` with the fixed card
   ordering per FR-004. Tests assert layout order, conditional
   `EntitlementBanner` visibility, the `IOSOnlyBanner` on
   non-iOS, and that `screen.web.tsx` does NOT pull
   `src/native/passkit.ts` into the bundle.
9. **T009 — Registry hook-up**: append `passkitLab` import +
   array entry to `src/modules/registry.ts`. Update
   `test/unit/modules/registry.test.ts` if it asserts a fixed
   length (30 → 31).
10. **T010 — `app.json` plugin entry**: append
    `"./plugins/with-passkit"` to the `expo.plugins` array
    (22 → 23).
11. **T011 — Agent context update**: substitute
    `specs/036-passkit-wallet/plan.md` between the
    `<!-- SPECKIT START -->` and `<!-- SPECKIT END -->`
    markers in `.github/copilot-instructions.md`.
12. **T012 — `pnpm check` gate**: lint + typecheck + tests must be
    green; no `eslint-disable` directives anywhere; `pnpm format`
    is a no-op after the final commit. Report delta from 035's
    closing baseline.
13. **T013 — On-device verification**: execute `quickstart.md`
    checklist on a real iOS 13.4+ device with a developer-issued
    Pass Type ID + signed `.pkpass`, on an Android device, and on
    a desktop browser. Verify `expo prebuild` produces an
    entitlements plist with a non-empty
    `com.apple.developer.pass-type-identifiers` array exactly once
    and that `PassKit.framework` is in the main target's
    frameworks build phase exactly once.

## Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|------------|--------|------------|
| R1 | **Pass signing barrier hides crashes** — because the on-device flow is gated on developer artifacts, regressions in the URL-fetch / present-sheet path could ship undetected. | Medium | Medium | The hook + bridge tests fully exercise the success / cancel / invalid / download-failed branches with mocked native calls (R-D). On-device verification (T013) is mandatory before merge for any maintainer who has a Pass Type ID; for everyone else, JS-pure tests are the gate (FR-026, FR-027). |
| R2 | **Placeholder entitlement breaks EAS Build** — the `$(TeamIdentifierPrefix)pass.example.placeholder` value isn't a real registered Pass Type ID. | Low | High | Apple does NOT block provisioning on unregistered pass-type-identifiers values (research §7); EAS Build proceeds. The resulting build cannot present real passes until the value is replaced, which is the documented intent. Quickstart §3 verifies this on a fresh build. |
| R3 | **Plugin coexistence regression** — the `withEntitlementsPlist` mod inadvertently overwrites or reorders entitlements declared by prior plugins (e.g., 011 sign-in-with-apple, 012 local-auth, 027 lock-widgets, 029 focus-filters). | Medium | High | The plugin reads → merges → writes the entitlements dict and asserts it sets only the `pass-type-identifiers` key. The composition test (T004) enables all 22 prior plugins + 036 in a fixture and asserts each prior plugin's contributions are byte-identical after composition (SC-007). |
| R4 | **`PKAddPassesViewController` presentation context drift** — modal-on-modal scenarios (e.g., a system alert is up when the user taps Add) cause the bridge to present from the wrong controller. | Medium | Medium | The Swift bridge walks `keyWindow.rootViewController` → `presentedViewController` chains until it finds a non-presented top, mirroring the pattern used by 032 (QuickLook) and 033 (ShareSheet). Tested manually in T013 with a system alert active. |
| R5 | **`openPass` iOS-version detection drift** — the JS-side short-circuit reads `Platform.constants` which on some Expo SDKs returns a string like "13.4.1"; naive `parseFloat` rounding breaks for "13.10". | Low | Medium | The version compare uses a tuple parse (`[major, minor]`) on the iOS version string, not a float. Test covers "13.0", "13.3", "13.4", "13.4.1", "14.0", "16.0", and the malformed-string fallback (treat as < 13.4). |
| R6 | **URL fetch races screen unmount** — `addPassFromURL` resolves after the user navigates away; the hook attempts a `setState`. | Medium | Low | FR-023: hook owns a `mounted` ref; resolution paths check it before dispatching. Test asserts zero post-unmount setState calls (carryover from 030–035 SC-010). The Swift bridge cancels the underlying `URLSessionTask` if the JS-side promise is dropped (best-effort). |
| R7 | **`PKPassLibrary.passes()` empty-result misclassified as error** — empty-list distinguishability from rejection. | Low | Low | The Swift bridge resolves with an empty array on success; only network / authorisation failures reject. `MyPassesList` test covers the empty-state row explicitly. |
| R8 | **Bundle-absence detection at module load is unreliable** — bundler may resolve a placeholder asset that doesn't exist on disk, producing a runtime require-error rather than a typed "no bundle". | Low | Medium | R-C: the AddSamplePassCard does NOT use `require()` of an optional asset. It checks a build-time flag (`__PASSKIT_BUNDLED_SAMPLE__`) that defaults to `false` and is only flipped by an explicit user-supplied bundler config. Test asserts the flag-off branch surfaces "Pass signing required" without any require / fetch attempt. |
| R9 | **Bridge module-name collision** — `'PassKitBridge'` collides with a future Apple-shipped wrapper or third-party module. | Very Low | Low | Distinct module name. No conflict with `'AppIntents'` / `'WidgetCenter'` / `'FocusFilters'` / `'BackgroundTasks'` / `'Spotlight'` / `'QuickLook'` / `'ShareSheet'` / `'ARKitBridge'` / `'BleCentralBridge'`. Test asserts the bridge export shape and the module-name string literal. |
| R10 | **`PassKit.framework` linkage drift** — running `expo prebuild` on a fresh checkout drops the framework (e.g., because the project's framework-list mod expects it before the plugin runs). | Low | Medium | The plugin's framework-link mod is idempotent and runs in the standard `withXcodeProject` post-merge phase used by all prior plugins. Quickstart §3 verifies the linkage post-prebuild. |
| R11 | **Accessibility regression** — disabled-control state on Android / Web is not announced by screen readers. | Low | Low | All disabled controls carry `accessibilityState={{ disabled: true }}`; the `IOSOnlyBanner` carries `accessibilityRole="alert"`. Component tests assert these props. |
| R12 | **Pass categories diverge from Apple taxonomy** — Apple introduces a new `passType` (rare; last addition was `storeCard` in iOS 7). | Very Low | Low | The `PassCategory` union is exhaustive over Apple's documented set as of iOS 17. The Swift bridge maps unknown styles to `'generic'` and logs a `console.warn` from the JS bridge. |

## Test baseline tracking

- **Branch start**: carried forward from feature 035's completion
  totals (recorded in 035's `plan.md` / `retrospective.md`).
- **Expected delta** (sketch, finalised in `tasks.md`):
  - +1 `manifest.test.ts` suite
  - +1 `pass-types.test.ts` suite
  - +3 `screen.{ios,android,web}.test.tsx` suites
  - +1 `usePassKit.test.tsx` suite
  - +8 component test suites (`CapabilitiesCard`,
    `AddSamplePassCard`, `MyPassesList`, `PassRow`,
    `AddFromUrlCard`, `SetupGuideCard`, `EntitlementBanner`,
    `IOSOnlyBanner`)
  - +1 `passkit.test.ts` (bridge, all three platforms) suite
  - +1 `with-passkit/index.test.ts` (plugin) suite
  - +1 (optional) export-shape smoke test co-located with the
    plugin
  - **Total target**: **≥ +14 suites at completion** (16 if the
    co-located plugin smoke test and a registry-length test are
    counted as their own suites).
- Final deltas reported in
  `specs/036-passkit-wallet/retrospective.md`.

## Progress Tracking

- [x] Spec authored and approved (`specs/036-passkit-wallet/spec.md`, 2026-04-29)
- [x] Plan authored — this file (Phase 0 + Phase 1 outline complete)
- [x] Phase 0 — `research.md` written (resolves R-A through R-G)
- [x] Phase 1 — `data-model.md`, `contracts/*.md`, `quickstart.md` written
- [x] Agent context update (SPECKIT marker repointed to this plan)
- [ ] `/speckit.tasks` run; `tasks.md` written from the T001-T013 seeds above
- [ ] T001-T011 implemented; `pnpm check` green; baseline delta substituted into "Test baseline tracking"
- [ ] T012 (`pnpm check` gate) signed off
- [ ] T013 (on-device quickstart) signed off on a real iOS 13.4+ device with a Pass Type ID + signed `.pkpass`, plus Android device + desktop browser for the iOS-only banner path
- [ ] `retrospective.md` written; final test totals substituted; merged to main

## Complexity Tracking

> No constitution violations. Section intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| _(none)_  | _(n/a)_    | _(n/a)_                              |
