# Implementation Plan: Home Screen Widgets Module

**Branch**: `014-home-widgets` | **Date**: 2026-04-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/014-home-widgets/spec.md`

## Summary

Ship a real WidgetKit Home Screen widget (kind `SpotShowcaseWidget`) in three
sizes (Small / Medium / Large) driven by data the user pushes from a new
"Widgets Lab" module screen via an App Group `UserDefaults` suite and an
explicit `WidgetCenter.shared.reloadAllTimelines()` call. The widget is added
to the **existing** widget extension target introduced by feature 007
(`LiveActivityDemoWidget`) by promoting that extension's `@main` widget into a
`WidgetBundle` containing both the existing Live Activity widget and the new
showcase widget. App Group entitlement is configured by a new TypeScript Expo
config plugin (`plugins/with-home-widgets/`) on **both** the main app target
and the widget extension target. JS bridge `src/native/widget-center.ts`
mirrors the live-activity bridge pattern (Platform-gated, throws on
unsupported, native-side resolved via `requireOptionalNativeModule`). Cross-
platform fallback (Android, Web, iOS < 14) keeps the configuration panel and
RN-rendered previews fully interactive.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), Swift 5 (widget extension)
**Primary Dependencies**: Expo SDK 55, expo-router (typed routes), React 19.2,
React Native 0.83, react-native-reanimated, `@expo/config-plugins`,
`expo-modules-core` (`requireOptionalNativeModule`), WidgetKit (iOS 14+),
SwiftUI, `@react-native-async-storage/async-storage` (JS-side shadow store
for the previews path)
**Storage**: App Group `UserDefaults(suiteName:)` (single source of truth on
iOS 14+); JS-side `AsyncStorage` mirror for the cross-platform previews
**Testing**: Jest Expo + React Native Testing Library (JS-pure tests only;
Swift sources are not unit-tested per FR-057 / Constitution Principle V
exemption applies only to *non-code* work — here Swift verification is
documented as on-device steps in `quickstart.md` because Swift cannot be
exercised on the Windows-based dev environment, mirroring feature 007)
**Target Platform**: iOS 14+ (Home Screen widgets), iOS < 14 / Android / Web
(JS-only fallback with banner + previews + disabled push)
**Project Type**: Mobile app (Expo) with native iOS extension target and TS
config plugin; same shape as feature 007
**Performance Goals**: Widget refresh visible on Home Screen within 1 s of
"Push to widget" tap (SC-003); previews update in same render pass as edits
(SC-007); `placeholder` / `getSnapshot` / `getTimeline` complete inside
WidgetKit's documented per-call budget (SC-012)
**Constraints**: Purely additive at registry level (1 import line + 1 array
entry in `src/modules/registry.ts`, 1 plugin entry in `app.json`); no
behavioural change to feature 007's `with-live-activity` plugin (SC-010 /
SC-011); no new global stores in JS (FR-052); StyleSheet.create() only
(Constitution Principle IV); `.web.tsx` / `.android.tsx` splits for any
non-trivial platform difference (Constitution Principle III)
**Scale/Scope**: One module directory, one new plugin, one bridge, four Swift
files, ~10 JS-pure test files; reload event log capped at 10 entries per spec
FR-036

## Constitution Check

*Constitution version checked*: **1.1.0**
(`.specify/memory/constitution.md`). Spec FR-055 cites v1.0.1 but the
constitution at HEAD is v1.1.0 (1.0.1 → 1.1.0 was a non-breaking MINOR bump
adding Validate-Before-Spec + back-patching guidance). Both apply uniformly to
this feature; no exemption is requested. The spec's reference will be
back-patched if/when it diverges materially.

| Principle | Compliance |
|-----------|------------|
| I. Cross-Platform Parity | **PASS** — iOS 14+ ships the real widget; Android / Web / iOS < 14 ship the configuration panel + 3 previews + banner + disabled push (FR-024, US4, SC-008). Core "edit a config and preview it" journey is equivalent. |
| II. Token-Based Theming | **PASS** — All chrome uses `ThemedView` / `ThemedText` and the `Spacing` scale. The four tint swatches are documented hex values exposed as a small in-module palette + a Swift `Tint` enum (see Phase 0 §1); colour values are *widget brand* tokens, not new theme tokens, and live inside the module per FR-050. No raw `Text` / `View` in screen chrome. |
| III. Platform File Splitting | **PASS** — `screen.tsx` / `screen.android.tsx` / `screen.web.tsx`; `widget-center.ts` / `widget-center.android.ts` / `widget-center.web.ts`. No inline `Platform.select()` for non-trivial branches. |
| IV. StyleSheet Discipline | **PASS** — All styles via `StyleSheet.create()` (FR-053); `Spacing` from theme tokens; no inline objects, no CSS-in-JS, no utility-class frameworks. |
| V. Test-First for New Features | **PASS** — JS-pure tests enumerated in FR-056 cover bridge contract, plugin (idempotency + 007 coexistence), every component, every screen variant, and the manifest. Swift cannot be exercised on Windows; on-device verification steps are documented in `quickstart.md` per FR-057 (same exemption pattern feature 007 applied). |

**Initial Constitution Check: PASS — no violations, no entries needed in
Complexity Tracking.**

## Project Structure

### Documentation (this feature)

```text
specs/014-home-widgets/
├── plan.md              # this file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── widget-center-bridge.md   # JS bridge contract
└── tasks.md             # Phase 2 output (NOT created here)
```

### Source Code (repository root)

```text
src/modules/widgets-lab/
├── index.tsx                 # ModuleManifest (id: 'widgets-lab', minIOS: 14.0)
├── screen.tsx                # iOS variant (status + config + setup + 3 previews + log)
├── screen.android.tsx        # Android fallback (banner + config + previews)
├── screen.web.tsx            # Web fallback (banner + config + previews)
├── widget-config.ts          # WidgetConfig type, defaults, AsyncStorage shadow store, validate()
└── components/
    ├── StatusPanel.tsx
    ├── ConfigPanel.tsx
    ├── WidgetPreview.tsx     # Renders Small / Medium / Large in one component
    ├── SetupInstructions.tsx
    └── ReloadEventLog.tsx

src/native/
├── widget-center.ts          # iOS bridge (requireOptionalNativeModule)
├── widget-center.android.ts  # throws WidgetCenterNotSupported (except isAvailable())
├── widget-center.web.ts      # throws WidgetCenterNotSupported (except isAvailable())
└── widget-center.types.ts    # WidgetConfig (re-export), Tint enum, error classes

plugins/with-home-widgets/
├── index.ts                  # ConfigPlugin entry
├── add-widget-bundle.ts      # Append SpotShowcaseWidget to existing 007 extension; synthesize @main WidgetBundle
├── add-app-group.ts          # Set com.apple.security.application-groups on main app + widget ext
├── add-swift-sources.ts      # Add 4 Swift files to widget extension target
└── package.json

native/ios/widgets/
├── ShowcaseWidget.swift      # @main-eligible Widget; StaticConfiguration; 3 families
├── ShowcaseProvider.swift    # TimelineProvider (placeholder, getSnapshot, getTimeline)
├── ShowcaseEntry.swift       # TimelineEntry (date, showcaseValue, counter, tint)
└── ShowcaseWidgetView.swift  # SwiftUI view; @Environment(\.widgetFamily) branching

# (Synthesized at prebuild time, idempotent — see Phase 0 §3:)
ios-widget/SpotWidgetBundle.swift  # @main WidgetBundle { LiveActivityDemoWidget(); ShowcaseWidget() }

# Modified (additive only):
src/modules/registry.ts        # +1 import, +1 array entry
app.json                       # +1 plugins entry: "./plugins/with-home-widgets"

# Tests:
test/unit/modules/widgets-lab/
├── widget-config.test.ts
├── manifest.test.ts
├── screen.test.tsx
├── screen.android.test.tsx
├── screen.web.test.tsx
└── components/
    ├── StatusPanel.test.tsx
    ├── ConfigPanel.test.tsx
    ├── WidgetPreview.test.tsx
    ├── SetupInstructions.test.tsx
    └── ReloadEventLog.test.tsx
test/unit/native/
└── widget-center.test.ts
test/unit/plugins/
└── with-home-widgets/index.test.ts
```

**Structure Decision**: Same Expo + iOS-extension-via-config-plugin shape used
by feature 007 (`with-live-activity`) and feature 013 (`with-app-intents`).
The new plugin **appends** to the existing 007 widget extension target instead
of creating a parallel target — research §3 documents the bundle-promotion
detection logic and the alternative considered.

**Note on directory naming**: spec.md FR-039/FR-050 refer to
`native/ios/home-widgets/` and individual `PreviewCardSmall/Medium/Large.tsx`
+ `SetupInstructionsCard.tsx` files. This plan uses `native/ios/widgets/` and
a single consolidated `WidgetPreview.tsx` (renders all three sizes) +
`SetupInstructions.tsx` for cohesion and to reduce surface area; the
behavioural surface area, the public bridge contract, the App Group keys, and
the registry/plugin/Swift-file *count* are unchanged. This is a documentation
delta only and will be back-patched into the spec via the
"Spec back-patching" workflow (constitution §Development Workflow) before the
feature is considered complete.

## Resolved [NEEDS CLARIFICATION] markers

Resolved autonomously during `/speckit.plan` per the Notes section of spec.md
(no `/speckit.clarify` cycle needed):

1. **Four tint swatches**: `src/constants/theme.ts` defines only two named
   tints (`tintA`, `tintB`). The four widget swatches therefore use the
   user-input fallback palette, encoded in a small in-module `tints.ts`:
   - `blue`   — `#0A84FF` (matches `Colors.dark.tintA`)
   - `green`  — `#30D158` (iOS system green, dark)
   - `orange` — `#FF9F0A` (matches `Colors.dark.tintB`)
   - `pink`   — `#FF375F` (iOS system pink, dark)

   Same four names appear in the Swift `Tint` enum
   (`ShowcaseEntry.swift`) and the JS `Tint` union
   (`widget-center.types.ts`).

2. **Default tint**: `blue` (first swatch). Used by:
   - `placeholder` and read-failure paths in `ShowcaseProvider`
   - `getCurrentConfig` empty-suite default
   - `ConfigPanel` initial picker selection on first render

3. **`getTimeline` refresh cadence**: every **30 minutes**. Implemented as
   `Timeline(entries, policy: .after(now.addingTimeInterval(30 * 60)))`.
   Documented in `StatusPanel`'s "next refresh time" line as the local-time
   value of `now + 30min`.

## Complexity Tracking

> No constitution violations. Section intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| _(none)_  | _(n/a)_    | _(n/a)_                              |
