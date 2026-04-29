# Implementation Plan: Share Sheet Module

**Branch**: `033-share-sheet` | **Date**: 2026-04-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/033-share-sheet/spec.md`
**Branch parent**: `032-document-picker-quicklook`

## Summary

Add an iOS 8+ "Share Sheet" showcase module that wraps
`UIActivityViewController` for sharing **Text / URL / Image / File**
content, with optional excluded built-in activities, an in-app custom
`UIActivity` subclass (`CopyWithPrefixActivity`) that copies
`"Spot says: <text>"` to the clipboard via `expo-clipboard`, and an
iPad-only anchor selector that supplies `popoverPresentationController
.sourceView` / `sourceRect`. The module is fully self-contained inside
`src/modules/share-sheet-lab/`, registers as a single new card
(`id: 'share-sheet'`, `platforms: ['ios','android','web']`,
`minIOS: '8.0'`) appended to `src/modules/registry.ts`. iOS uses a
new Swift wrapper (`native/ios/share-sheet/ShareSheetPresenter.swift`
+ `CopyWithPrefixActivity.swift`) exposing
`present(opts) -> Promise<{ activityType: string|null, completed:
bool }>`. Android falls back to `expo-sharing` for files and throws a
typed `ShareSheetNotSupported` error for text/URL paths that the JS
layer converts to a clipboard-copy + toast. Web tries
`navigator.share`; absent that, copies to the clipboard via
`expo-clipboard` and resolves with synthetic `activityType:
'web.clipboard-fallback'`. Integration is purely additive: registry +1,
**no plugin** (research §1 confirms in-app `UIActivity` subclasses
require zero `Info.plist` keys), **no `app.json` change**. `expo-sharing`
is reused from feature 032; `expo-clipboard` is already a project
dependency (verified in `package.json`) — **zero new runtime
dependencies**.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), Swift 5
(`@available(iOS 8.0, *)` on the new presenter). React 19.2 +
React Native 0.83 + React Compiler enabled.
**Primary Dependencies**: Expo SDK 55, expo-router (typed routes),
`@expo/config-plugins` (NOT used this feature — no plugin authored),
`expo-modules-core` (`requireOptionalNativeModule` — same pattern
013 / 014 / 027 / 028 / 029 / 030 / 031 / 032 use), `UIKit`
(`UIActivityViewController`, `UIActivity`, `UIPasteboard`,
`UIPopoverPresentationController`), `Foundation`. **REUSED** (no
version movement): `expo-sharing` (added in 032), `expo-clipboard`
(already pinned in `package.json` at `^55.0.13`).
**Storage**: None. The result log is in-memory only (spec §"Out of
Scope" + §Assumptions). The custom `UIActivity` writes the
`"Spot says: <text>"` string to `UIPasteboard.general` (system
clipboard), which is OS state, not module state.
**Testing**: Jest Expo + React Native Testing Library — JS-pure tests
only. The Swift surface (two new files under `native/ios/share-sheet/`)
is not unit-testable on the Windows-based dev environment used by
this repository (same exemption pattern features 007 / 013 / 014 /
027 / 028 / 029 / 030 / 031 / 032 applied; on-device verification
documented in `quickstart.md`). All native bridges, `expo-sharing`,
`expo-clipboard`, and the global `navigator.share` MUST be mocked at
the import boundary per FR-022 (no `require.resolve` hacks; mocks
attach to the module identity exposed by each bridge variant).
**Target Platform**: iOS 8+ (real `UIActivityViewController` with
custom activity, exclusions, and iPad anchor); Android (file path via
`expo-sharing`, text/URL falls through to clipboard); Web (`navigator
.share` when present, else clipboard fallback). `screen.web.tsx` MUST
NOT import `src/native/share-sheet.ts` at module evaluation time
(carryover from 030 / 031 / 032 SC-007 discipline).
**Project Type**: Mobile app (Expo) with native iOS sources appended
to the **main app target** via existing autolinking — strictly
additive (no extension target, no entitlement edits, no plugin,
**no `app.json` mutation**). Same shape as 032 minus the plugin and
minus the new dependency installs.
**Performance Goals**: Screen mount → first meaningful paint < 250 ms
on a mid-tier iPhone; `present()` returns to JS ≤ 50 ms after the
system sheet completes; iPad anchor recompute on `onLayout` ≤ 16 ms
(one frame); ResultLog rendering remains 60 fps with up to 10 entries
(SC-006).
**Constraints**: Purely additive at integration level — 1 import +
1 array entry in `src/modules/registry.ts`, **0** plugin entries,
**0** new runtime dependencies (verified: `expo-clipboard` and
`expo-sharing` already present in `package.json`); no edits to prior
plugin / screen / Swift sources; no new App Group; no `eslint-disable`
directives anywhere in added or modified code (FR-023);
`StyleSheet.create()` only (Constitution IV); `.android.tsx` /
`.web.tsx` splits for non-trivial platform branches (Constitution
III); native bridges mocked at the import boundary in tests (FR-022);
`pnpm format` is a no-op after the final commit.
**Scale/Scope**: One module directory (`src/modules/share-sheet-lab/`),
zero new plugins, one new bridge file
(`src/native/share-sheet.ts` + `.android.ts` / `.web.ts` / `.types.ts`
siblings), two Swift files under `native/ios/share-sheet/`, one hook
(`hooks/useShareSession.ts`), two static catalogs
(`activity-types.ts`, `bundled-images.ts`), nine UI components,
three screen variants, four tiny bundled sample images (reused from
features 016 / 032 where possible — no new asset pipeline) plus one
bundled fallback text file (reused from 032's `samples/hello.txt` if
present, otherwise a tiny new file).
**Test baseline at branch start**: carried forward from feature 032's
completion totals (recorded in 032's plan.md / retrospective.md).
033's expected delta: **≥ +18 suites** (see "Test baseline tracking"
below).

## Constitution Check

*Constitution version checked*: **1.1.0**
(`.specify/memory/constitution.md`).

| Principle | Compliance |
|-----------|------------|
| I. Cross-Platform Parity | **PASS** — iOS ships the full module: every panel + custom activity + exclusions + iPad anchor. Android ships every panel; Share routes file content through `expo-sharing` and routes text/URL through a clipboard-copy fallback (the JS bridge catches `ShareSheetNotSupported` and writes via `expo-clipboard`); the AnchorSelector and CustomActivityToggle are visibly disabled. Web tries `navigator.share` and otherwise uses the same clipboard-copy fallback; AnchorSelector hidden, exclusions / custom-activity controls visibly disabled with explanatory caption. The user journey "open card → choose content → tap Share → see outcome in log" is equivalent across all targets; only iOS-specific affordances (custom activity, exclusion list, popover anchor) are intrinsically degraded. |
| II. Token-Based Theming | **PASS** — All chrome uses `ThemedView` / `ThemedText` and the `Spacing` scale from `src/constants/theme.ts`. Reuses existing semantic colour tokens (`textPrimary` / `surfaceElevated` / `accent` / `warning` / `error`); the segmented control + checklist + switch + log row use the existing token shapes already established by 016 / 029 / 032. No new theme entries; no hardcoded hex values. |
| III. Platform File Splitting | **PASS** — `screen.tsx` / `screen.android.tsx` / `screen.web.tsx`. Bridge has matching `share-sheet.ts` / `.android.ts` / `.web.ts` / `.types.ts` variants (mirrors 030 / 031 / 032 layouts). The web variant explicitly avoids importing `src/native/share-sheet.ts` at evaluation time. `Platform.select` is permitted only for trivial style / copy diffs (e.g., the iPad-only `AnchorSelector` visibility uses the project's existing `Platform.isPad` helper). |
| IV. StyleSheet Discipline | **PASS** — All styles via `StyleSheet.create()`; `Spacing` from theme tokens; no inline objects, no CSS-in-JS, no utility-class frameworks. |
| V. Test-First for New Features | **PASS** — JS-pure tests are enumerated in the "Phased file inventory" section below and cover: every component (`ContentTypePicker`, `TextContentInput`, `UrlContentInput`, `ImageContentPicker`, `FileContentPicker`, `ExcludedActivitiesPicker`, `CustomActivityToggle`, `AnchorSelector`, `ResultLog`), the `useShareSession` hook, both catalogs (`activity-types.ts`, `bundled-images.ts`), all three screen variants, the bridge across all three platforms (typed surface, iOS delegates to mocked native module, Android throws `ShareSheetNotSupported` for non-file paths, Web uses `navigator.share` else clipboard fallback), and the manifest contract. Swift cannot be exercised on Windows; on-device verification documented in `quickstart.md`. |
| Validate-Before-Spec (workflow) | **PASS / N/A** — This is not a build-pipeline or external-service-integration feature; it is an additive in-app showcase + standard `UIActivityViewController` usage. No plugin is authored (research §1 confirms zero `Info.plist` keys are needed for in-app `UIActivity` subclasses); no proof-of-concept `expo prebuild` is required to validate spec assumptions. |

**Initial Constitution Check: PASS — no violations, no entries needed
in Complexity Tracking.**

**Re-check after Phase 1 (post-design): PASS** — the Phase 1 artifacts
(data-model, contracts, quickstart) introduce zero new global stores
(no AsyncStorage key, no `UserDefaults` write), zero new theme tokens,
and no inline `Platform.select` beyond trivial style branches. The
bridge's typed-surface contract keeps every iOS-only symbol strictly
inside `src/native/share-sheet.ts`; non-iOS variants import only the
shared `*.types.ts` and the typed error class. The custom activity's
clipboard write is performed by Swift via `UIPasteboard.general` (not
by `expo-clipboard`) — `expo-clipboard` is consumed only by the JS
fallback paths (Android non-file, Web no-`navigator.share`); this
keeps the platform boundaries clean.

## Project Structure

### Documentation (this feature)

```text
specs/033-share-sheet/
├── plan.md              # this file
├── research.md          # Phase 0 output (R-A through R-G)
├── data-model.md        # Phase 1 output (entities 1–7)
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── share-sheet-bridge.contract.ts   # JS bridge typed surface
│   │                                     #   (present, isAvailable) +
│   │                                     #   ShareSheetNotSupported error
│   ├── activity-types.contract.ts        # Activity-type catalog shape
│   │                                     #   + iOS string ID list
│   ├── manifest.contract.ts              # Registry entry contract
│   │                                     #   (id 'share-sheet', label,
│   │                                     #    platforms, minIOS '8.0')
│   └── native-module.contract.ts         # Expo Module Function shape
│                                         #   on the Swift side
└── tasks.md             # Phase 2 output (NOT created here)
```

### Source Code (repository root)

```text
# NEW (this feature) — TypeScript module
src/modules/share-sheet-lab/
├── index.tsx                              # ModuleManifest (id 'share-sheet',
│                                          #   minIOS '8.0', platforms ['ios','android','web'])
├── screen.tsx                             # iOS variant (six panels in fixed order:
│                                          #   ContentTypePicker → matching content panel →
│                                          #   ExcludedActivitiesPicker → CustomActivityToggle →
│                                          #   AnchorSelector (iPad only) → Share+ResultLog)
├── screen.android.tsx                     # Android: same panels minus AnchorSelector;
│                                          #   ExcludedActivitiesPicker + CustomActivityToggle
│                                          #   visibly disabled with explanatory caption
├── screen.web.tsx                         # Web: same render set as android;
│                                          #   MUST NOT import src/native/share-sheet.ts at load
├── activity-types.ts                      # Static catalog of well-known
│                                          #   UIActivity.ActivityType strings:
│                                          #   { id: 'com.apple.UIKit.activity.Mail', label: 'Mail' },
│                                          #   { id: '...Print', label: 'Print' }, … etc.
│                                          #   PLUS the synthetic 'web.clipboard-fallback'
│                                          #   constant for Web. Hand-curated; spec-stable.
├── bundled-images.ts                      # Descriptors for the four ImageContentPicker tiles
│                                          #   (require()'d 1x1 PNGs reused from 016 / 032
│                                          #   where possible). Pure module; no I/O at load.
├── hooks/
│   └── useShareSession.ts                 # { content, exclusions, includeCustomActivity,
│                                          #   anchor, log, share() }; reducer-serialised
│                                          #   mutations; clamps log to 10 entries newest-first;
│                                          #   ONLY public surface consumed by screen variants
│                                          #   (FR-012, FR-024, FR-025); catches every bridge
│                                          #   error and classifies via R-D below.
└── components/
    ├── ContentTypePicker.tsx              # 4-segment control: Text / URL / Image / File
    ├── TextContentInput.tsx               # multiline TextInput; default
    │                                      #   "Hello from spot showcase"
    ├── UrlContentInput.tsx                # single-line TextInput + synchronous URL validation
    │                                      #   (R-B); inline error message; disables Share when invalid
    ├── ImageContentPicker.tsx             # 2x2 grid sourced from bundled-images.ts;
    │                                      #   single-select; defaults to first
    ├── FileContentPicker.tsx              # Lists Documents Lab files when documents-store
    │                                      #   exposes a non-empty list; otherwise renders one
    │                                      #   bundled fallback file (R-E)
    ├── ExcludedActivitiesPicker.tsx       # Checklist over activity-types.ts catalog +
    │                                      #   "Hide all" master toggle; on iPhone the toggle
    │                                      #   only affects built-in entries (the custom
    │                                      #   activity, when included, is always emitted)
    ├── CustomActivityToggle.tsx           # Single Switch; default off; disabled on
    │                                      #   non-iOS with explanatory caption
    ├── AnchorSelector.tsx                 # iPad-only 2x2 grid of source-view anchors
    │                                      #   (top-left / top-right / center / bottom);
    │                                      #   captures button frames via onLayout (R-F);
    │                                      #   returns null on iPhone / Android / Web
    └── ResultLog.tsx                      # Renders log[] (max 10, newest first);
                                            #   each row: type + activityType + outcome +
                                            #   relative timestamp

# NEW (this feature) — Swift sources, appended to MAIN APP TARGET (not a widget extension)
native/ios/share-sheet/
├── ShareSheetPresenter.swift              # @available(iOS 8.0, *) Expo Module
│                                          #   AsyncFunction "present" returning
│                                          #   { activityType: String?, completed: Bool }.
│                                          #   Builds activity items from the JS payload,
│                                          #   appends CopyWithPrefixActivity when requested,
│                                          #   sets popoverPresentationController.sourceView /
│                                          #   sourceRect from the supplied anchor (FR-015),
│                                          #   presents over the current root view controller,
│                                          #   resolves the Promise from the
│                                          #   completionWithItemsHandler (R-G).
└── CopyWithPrefixActivity.swift           # UIActivity subclass.
                                            #   activityType: 'com.spot.share-sheet.copy-with-prefix'.
                                            #   activityTitle: "Copy with prefix".
                                            #   activityImage: SF Symbol icon.
                                            #   canPerform(withActivityItems:): true if any item
                                            #     is a String. perform(): joins string items,
                                            #     prepends "Spot says: ", writes to
                                            #     UIPasteboard.general, calls
                                            #     activityDidFinish(true).

# NEW (this feature) — JS bridge (mirrors 030 / 031 / 032 layout)
src/native/share-sheet.ts                  # iOS impl: requireOptionalNativeModule
                                            #   ('ShareSheet') + Platform.OS === 'ios' gate;
                                            #   exports present(opts), isAvailable(), and the
                                            #   ShareSheetNotSupported class (FR-019). All
                                            #   present() calls serialise through a closure-
                                            #   scoped promise chain inherited verbatim from
                                            #   030 / 031 / 032 (research §1 / R-A) so two
                                            #   rapid Share taps don't double-present.
src/native/share-sheet.android.ts          # File content -> expo-sharing.shareAsync(uri).
                                            #   Text / URL -> throws ShareSheetNotSupported
                                            #   (caller in useShareSession converts to
                                            #   clipboard fallback per R-D).
                                            #   isAvailable() -> true (a usable share path
                                            #   always exists via expo-sharing or clipboard).
src/native/share-sheet.web.ts              # If 'share' in navigator and the payload is
                                            #   navigator.share-supported -> calls it and
                                            #   resolves with { activityType: null,
                                            #   completed: true } (Web Share API does not
                                            #   surface chosen target). Otherwise copies to
                                            #   clipboard via expo-clipboard and resolves with
                                            #   { activityType: 'web.clipboard-fallback',
                                            #   completed: true }. AbortError -> resolves with
                                            #   { activityType: null, completed: false }.
src/native/share-sheet.types.ts            # ShareSheetBridge interface;
                                            #   ShareSheetNotSupported class declaration.
                                            #   ShareContent / ShareOptions / ShareResult /
                                            #   AnchorRect type re-exports. No global symbol
                                            #   collisions with prior bridges' module names
                                            #   (distinct module name 'ShareSheet').

# MODIFIED (additive only)
src/modules/registry.ts                    # +1 import line, +1 array entry
                                            #   (shareSheetLab) — registry size +1

# NOT MODIFIED — research §1 confirms no Info.plist keys needed
app.json                                   # UNCHANGED. No plugin entry added.
plugins/                                   # UNCHANGED. No plugins/with-share-sheet/ created.

# NOT MODIFIED — both deps already pinned
package.json                               # UNCHANGED. expo-clipboard ^55.0.13 already
                                            #   present (verified pre-plan); expo-sharing
                                            #   ~55.0.18 added in 032. Zero version movement.
pnpm-lock.yaml                             # UNCHANGED.

# UNTOUCHED (deliberately — verified non-regression in tests)
plugins/with-{live-activity,app-intents,home-widgets,screentime,coreml,vision,
              speech-recognition,audio-recording,sign-in-with-apple,local-auth,
              keychain-services,mapkit,core-location,rich-notifications,
              lock-widgets,standby-widget,focus-filters,background-tasks,
              spotlight,documents}/**     # All 32 prior plugins byte-identical.
native/ios/{app-intents,widgets,focus-filters,background-tasks,spotlight,
              documents,...}/**           # All prior native sources byte-identical.
src/native/{app-intents,widget-center,focus-filters,background-tasks,spotlight,
              quicklook}.*                # All prior bridges byte-identical.
src/modules/{intents-lab,widgets-lab,lock-widgets-lab,standby-lab,
              focus-filters-lab,background-tasks-lab,spotlight-lab,
              documents-lab,...}/**      # All prior modules byte-identical.
ios-widget/**                              # 014/027/028-owned widget extension; NOT touched.

# Tests (NEW)
test/unit/modules/share-sheet-lab/
├── manifest.test.ts                        # id 'share-sheet', label 'Share Sheet',
│                                            #   platforms ['ios','android','web'],
│                                            #   minIOS '8.0'
├── activity-types.test.ts                  # catalog: ≥ 12 well-known iOS activity types;
│                                            #   each has non-empty id + label; ids match
│                                            #   the 'com.apple.UIKit.activity.*' shape;
│                                            #   no duplicates; the 'web.clipboard-fallback'
│                                            #   constant is exported and distinct
├── bundled-images.test.ts                  # exactly four entries; each has non-empty
│                                            #   alt text + a resolvable require() module id
├── screen.test.tsx                         # iOS flow: panels in fixed order
│                                            #   ContentTypePicker → matching panel →
│                                            #   ExcludedActivitiesPicker → CustomActivityToggle
│                                            #   → AnchorSelector (when isPad, mocked) →
│                                            #   Share+ResultLog. AnchorSelector hidden when
│                                            #   isPad mock returns false.
├── screen.android.test.tsx                 # Android: same panels minus AnchorSelector;
│                                            #   ExcludedActivitiesPicker / CustomActivityToggle
│                                            #   are rendered but disabled (assert
│                                            #   accessibilityState.disabled === true)
├── screen.web.test.tsx                     # Web: same render set as android; assert
│                                            #   src/native/share-sheet.ts is NOT pulled in
│                                            #   by the web bundle at module evaluation time
├── hooks/
│   └── useShareSession.test.tsx            # mount default state; setContent / setExclusions
│                                            #   / setIncludeCustomActivity / setAnchor;
│                                            #   share() success -> log entry with completed
│                                            #   / activityType; share() cancel -> log entry
│                                            #   with outcome 'cancelled' and activityType
│                                            #   '(none)'; share() error -> outcome 'error'
│                                            #   with errorMessage; log clamped to 10 entries
│                                            #   newest-first; ShareSheetNotSupported on
│                                            #   Android non-file -> falls back to clipboard
│                                            #   path (R-D)
└── components/
    ├── ContentTypePicker.test.tsx          # 4 mutually-exclusive segments; selecting each
    │                                        #   calls onChange with the corresponding value
    ├── TextContentInput.test.tsx           # default value "Hello from spot showcase";
    │                                        #   multiline; onChange propagates
    ├── UrlContentInput.test.tsx            # default value "https://expo.dev"; valid URL
    │                                        #   passes; clearing field -> isValid=false +
    │                                        #   inline error message; "not-a-url" -> invalid
    ├── ImageContentPicker.test.tsx         # renders 2x2 grid of 4 tiles; tap selects;
    │                                        #   selection survives re-render
    ├── FileContentPicker.test.tsx          # documents-lab list non-empty -> renders that
    │                                        #   list; documents-lab list empty / unavailable
    │                                        #   -> renders the bundled fallback file row
    │                                        #   only (R-E)
    ├── ExcludedActivitiesPicker.test.tsx   # checklist length matches catalog;
    │                                        #   tap toggles selection; "Hide all" toggles
    │                                        #   every built-in entry; disabled on non-iOS
    ├── CustomActivityToggle.test.tsx       # default off; toggle flips; disabled on non-iOS
    │                                        #   with caption
    ├── AnchorSelector.test.tsx             # renders 4 buttons; selecting each propagates
    │                                        #   the AnchorRect from the most recent
    │                                        #   onLayout event (R-F); returns null when
    │                                        #   isPad mock returns false
    └── ResultLog.test.tsx                  # 0 / 1 / N entries; clamps to 10 newest-first;
                                              #   each row renders type + activityType +
                                              #   outcome label + timestamp text
test/unit/native/
└── share-sheet.test.ts                     # iOS path delegates to mocked native module;
                                              #   present() result mapped 1:1 to ShareResult;
                                              #   isAvailable() true on iOS;
                                              #   Android: file path delegates to mocked
                                              #   expo-sharing.shareAsync; text/URL throws
                                              #   ShareSheetNotSupported;
                                              #   Web: navigator.share present -> awaited;
                                              #   absent -> expo-clipboard mock invoked +
                                              #   activityType 'web.clipboard-fallback';
                                              #   AbortError -> { completed: false }.
                                              #   Two back-to-back present() calls produce
                                              #   exactly two native invocations in
                                              #   submission order (R-A serialisation
                                              #   inheritance).
```

**Structure Decision**: Mirrors **032's** `Expo + iOS-main-app-target`
shape. Differences from 032:

1. **No plugin** — research §1 confirms `UIActivityViewController` and
   in-app `UIActivity` subclasses require zero `Info.plist` keys.
   `app.json` is **not** modified; `plugins/with-share-sheet/` is
   **not** created. Spec FR-021 explicitly permits skipping the plugin
   when research confirms.
2. **Two Swift files, not one** — `ShareSheetPresenter.swift` (the
   bridge) and `CopyWithPrefixActivity.swift` (the custom activity).
   The activity subclass lives in its own file because it has its own
   lifecycle (`UIActivity` instances are owned by UIKit during the
   sheet's lifetime) and its own test surface (on-device).
3. **Bridge surface is wider** — `present(opts)` takes a structured
   payload (content + exclusions + custom-activity flag + anchor) and
   resolves with `{ activityType, completed }`. 032's bridge took a
   single URI and resolved with `{ shown }`. The contract is therefore
   richer (see `share-sheet-bridge.contract.ts`).
4. **Three-platform JS divergence** — Android and Web each carry
   nontrivial behaviour (file delegation via `expo-sharing` on Android;
   `navigator.share` + clipboard fallback on Web). 032's non-iOS
   variants only threw the typed error. The bridge tests therefore
   cover all three platforms in `share-sheet.test.ts`.
5. **Zero new runtime dependencies** — both `expo-clipboard` and
   `expo-sharing` are already pinned in `package.json` (032 added
   `expo-sharing`; `expo-clipboard` predates this feature). Verified
   via `Select-String 'expo-clipboard|expo-sharing' package.json`
   before plan authoring.
6. **No JS-side persistence** — the result log is in-memory only
   (spec §"Out of Scope"). 032 owned an AsyncStorage key; 033 owns
   none. There is therefore no `documents-store`-equivalent and no
   `R-C` (rehydration tolerance) decision in research.
7. **iPad anchor surface** — a brand-new concern with no analogue in
   032. The anchor rect is captured per-button via `onLayout` and
   re-read at share time (not at selection time) so orientation
   changes between select and share don't crash (FR-015 + EC).

## Resolved decisions

The spec was approved without clarifications. The following are the
plan-level technical decisions made autonomously, recorded in
`research.md` with full Decision / Rationale / Alternatives:

| # | Decision | Spec ref / location |
|---|----------|---------------------|
| R-A | Bridge serialisation via closure-scoped promise chain (inherited verbatim from 030 / 031 / 032). Two back-to-back `present()` calls produce two native invocations in submission order. | research §1 |
| R-B | Synchronous URL validation in `UrlContentInput` uses the `URL` constructor inside a try/catch with an additional `^https?:` regex guard. Pure, no I/O, no network. | research §2 |
| R-C | **No plugin.** Research §3 confirms `UIActivityViewController` and in-app `UIActivity` subclasses require zero `Info.plist` keys. `app.json` is not touched. | research §3 |
| R-D | Cross-platform error classification: `ShareSheetNotSupported` from Android (text/URL) and from Web (no `navigator.share`) is caught inside the JS bridge variant itself and converted to a clipboard-copy fallback via `expo-clipboard.setStringAsync`, resolving with `{ activityType: 'web.clipboard-fallback' \| 'android.clipboard-fallback', completed: true }`. The hook never sees the typed error for the basic share path (FR-019: "MUST NOT throw for the basic share path"). The hook only sees `ShareSheetNotSupported` when caller-side capabilities (custom activity, exclusions, anchor) are requested on a non-iOS platform — and the screen prevents that by disabling those controls. | research §4 |
| R-E | `FileContentPicker` reads from `documents-store` via a stable read API. If documents-store is unavailable (not yet implemented) or its list is empty, the panel renders a single bundled fallback text file row (reused from 032's `samples/hello.txt` if present, otherwise a tiny new `samples/sample.txt` shipped under `src/modules/share-sheet-lab/samples/`). The module does NOT require documents-lab to function (spec §Assumptions). | research §5 |
| R-F | iPad anchor strategy: each `AnchorSelector` button captures its measured frame on `onLayout` into a ref-scoped `AnchorRect`. At `share()` time, the hook reads the rect for the currently-selected anchor key from the ref (NOT from React state captured at selection time) so orientation changes between selection and share use the latest measured frame. The bridge sets `popoverPresentationController.sourceView` to the root view controller's view and `sourceRect` to the supplied rect. | research §6 |
| R-G | Swift presenter resolves the JS Promise from the `completionWithItemsHandler` callback with `{ activityType: activityType?.rawValue ?? null, completed: completed }`. The presenter holds itself alive for the duration of the sheet (strong-ref via associated object, same pattern as 032's `QuickLookPresenter`) and releases on dismissal. Errors (e.g., no root view controller) reject with a typed error mapped to the JS-side `Error` class. | research §7 |

## Phase 0 — Research

`research.md` resolves R-A through R-G with code-level detail.

- §1 R-A: Bridge serialisation
- §2 R-B: URL validation
- §3 R-C: **No plugin needed** — `UIActivityViewController` requires
  no `Info.plist` registration; in-app `UIActivity` subclasses are
  in-process and don't need to be declared in `LSApplicationQueriesSchemes`,
  in `NSExtensionPointIdentifier`, or anywhere else. (The
  `NSExtensionPointIdentifier = com.apple.share-services` requirement
  applies only to **Share Extensions** — separate target binaries that
  appear in *other* apps' share sheets — not to in-app
  `UIActivityViewController` usage. Spec §"Out of Scope" excludes
  Share Extensions explicitly.)
- §4 R-D: Cross-platform error classification + clipboard fallback
  catalog (`web.clipboard-fallback` / `android.clipboard-fallback`)
- §5 R-E: documents-lab read interface + bundled fallback
- §6 R-F: iPad anchor capture via `onLayout` + ref-scoped rect map
- §7 R-G: Swift presenter lifecycle + completion handler shape
- §8 (Excluded activity catalog scope): the catalog includes
  Mail, Print, AirDrop, Message, AddToReadingList, AssignToContact,
  CopyToPasteboard, PostToFacebook, PostToTwitter, SaveToCameraRoll,
  OpenInIBooks, Markup. Activities deprecated pre-iOS 8 (e.g.,
  `PostToWeibo`, `PostToTencentWeibo`, `PostToVimeo`, `PostToFlickr`)
  are intentionally excluded from the catalog for spec stability;
  they may be added in a follow-up if a use case emerges.

## Phase 1 — Design & Contracts

**Prerequisites**: research.md complete (R-A through R-G resolved).

1. **`data-model.md`** — entities 1–7:
   - `ShareContent` (discriminated union: text / url / image / file)
   - `ShareOptions` (the wire payload to the bridge)
   - `ShareResult` (the wire response from the bridge)
   - `AnchorRect` (iPad-only)
   - `ExcludedActivitySelection` (the checklist state)
   - `ActivityTypeCatalogEntry` (one row in `activity-types.ts`)
   - `ShareLogEntry` (one row in the in-memory result log)
   - `ShareSession` (hook state composing all of the above)
2. **`contracts/`**:
   - `share-sheet-bridge.contract.ts` — JS bridge typed surface
     (`present`, `isAvailable`) + `ShareSheetNotSupported` error
   - `activity-types.contract.ts` — catalog shape + the
     `web.clipboard-fallback` / `android.clipboard-fallback`
     synthetic constants
   - `manifest.contract.ts` — registry entry shape
   - `native-module.contract.ts` — Expo Module Function signature on
     the Swift side
3. **`quickstart.md`** — JS-pure verification (Windows / CI) + on-device
   verification (iOS + iPad anchor + Android `expo-sharing` + Web
   `navigator.share` and clipboard fallback).
4. **Agent context update**: the workspace's
   `.github/copilot-instructions.md` does not currently contain
   `<!-- SPECKIT START -->` / `<!-- SPECKIT END -->` markers. The
   plan reference is recorded here; if/when those markers are
   introduced project-wide, `tasks.md` will substitute the path
   `specs/033-share-sheet/plan.md` between them.

## Phased file inventory

NEW (TypeScript module):

- `src/modules/share-sheet-lab/index.tsx`
- `src/modules/share-sheet-lab/screen.tsx`
- `src/modules/share-sheet-lab/screen.android.tsx`
- `src/modules/share-sheet-lab/screen.web.tsx`
- `src/modules/share-sheet-lab/activity-types.ts`
- `src/modules/share-sheet-lab/bundled-images.ts`
- `src/modules/share-sheet-lab/hooks/useShareSession.ts`
- `src/modules/share-sheet-lab/components/{ContentTypePicker,
  TextContentInput, UrlContentInput, ImageContentPicker,
  FileContentPicker, ExcludedActivitiesPicker, CustomActivityToggle,
  AnchorSelector, ResultLog}.tsx`
- `src/modules/share-sheet-lab/samples/sample.txt` (only if 032's
  `hello.txt` is not reusable — confirmed at implementation time)

NEW (JS bridge):

- `src/native/share-sheet.ts`
- `src/native/share-sheet.android.ts`
- `src/native/share-sheet.web.ts`
- `src/native/share-sheet.types.ts`

NEW (tests):

- `test/unit/modules/share-sheet-lab/manifest.test.ts`
- `test/unit/modules/share-sheet-lab/activity-types.test.ts`
- `test/unit/modules/share-sheet-lab/bundled-images.test.ts`
- `test/unit/modules/share-sheet-lab/screen.test.tsx`
- `test/unit/modules/share-sheet-lab/screen.android.test.tsx`
- `test/unit/modules/share-sheet-lab/screen.web.test.tsx`
- `test/unit/modules/share-sheet-lab/hooks/useShareSession.test.tsx`
- `test/unit/modules/share-sheet-lab/components/{ContentTypePicker,
  TextContentInput, UrlContentInput, ImageContentPicker,
  FileContentPicker, ExcludedActivitiesPicker, CustomActivityToggle,
  AnchorSelector, ResultLog}.test.tsx`
- `test/unit/native/share-sheet.test.ts`

NEW (Swift, linked into main app target via existing autolinking):

- `native/ios/share-sheet/ShareSheetPresenter.swift`
- `native/ios/share-sheet/CopyWithPrefixActivity.swift`

MODIFIED (additive only):

- `src/modules/registry.ts` (+1 import, +1 array entry
  `shareSheetLab`)

NOT MODIFIED:

- `app.json` — **no plugin entry added** (R-C)
- `package.json` / `pnpm-lock.yaml` — both deps already pinned
- All prior plugins / Swift sources / bridges / modules — byte-identical

## Task seeds for tasks.md

These are sketches for the `/speckit.tasks` step, ordered by
dependency. The full enumeration belongs in `tasks.md`; these are
intentionally coarse so `/speckit.tasks` can split each into
RED → GREEN → REFACTOR sub-tasks.

1. **T001 — Activity-types catalog (RED-first)**:
   `activity-types.ts` with the curated list + the synthetic
   `web.clipboard-fallback` / `android.clipboard-fallback`
   constants. Tests assert ≥ 12 entries, no duplicates,
   `com.apple.UIKit.activity.*` shape.
2. **T002 — Bundled images catalog (RED-first)**:
   `bundled-images.ts` with four `require()`'d PNG references.
   Tests assert exactly four entries with non-empty alt text.
3. **T003 — Bridge types + non-iOS variants (RED-first)**:
   `src/native/share-sheet.types.ts` declares the bridge interface +
   `ShareSheetNotSupported`. `share-sheet.android.ts` delegates file
   content to a mocked `expo-sharing` and uses `expo-clipboard` for
   text/URL fallback (R-D). `share-sheet.web.ts` uses `navigator
   .share` if present and `expo-clipboard` otherwise. Tests cover all
   three platforms.
4. **T004 — iOS bridge**: `src/native/share-sheet.ts` implements the
   iOS path via `requireOptionalNativeModule('ShareSheet')` +
   `Platform.OS === 'ios'` gate + closure-scoped serialisation chain
   per R-A. Tests cover serialisation invariant + typed surface.
5. **T005 — Manifest**: `src/modules/share-sheet-lab/index.tsx` +
   `manifest.test.ts` (asserts id `'share-sheet'`, label
   `'Share Sheet'`, platforms `['ios','android','web']`, `minIOS:
   '8.0'`).
6. **T006 — Hook**: `hooks/useShareSession.ts` returning the documented
   state object; reducer-serialised mutations; clamps log to 10
   entries newest-first; classifies bridge errors into outcomes
   (`completed` / `cancelled` / `error`) per FR-024 / FR-025.
7. **T007 — Components, top-down RED**: write component tests first
   (`ContentTypePicker`, `TextContentInput`, `UrlContentInput`,
   `ImageContentPicker`, `FileContentPicker`,
   `ExcludedActivitiesPicker`, `CustomActivityToggle`,
   `AnchorSelector`, `ResultLog`); then implement against them.
8. **T008 — Screens**: implement `screen.tsx`, `screen.android.tsx`,
   `screen.web.tsx` with full panel ordering per FR-003; tests assert
   layout order, banner visibility, hidden / disabled panels on non-iOS,
   and that `screen.web.tsx` does NOT pull `src/native/share-sheet.ts`
   into the bundle.
9. **T009 — Swift sources**: write `ShareSheetPresenter.swift` and
   `CopyWithPrefixActivity.swift` under `native/ios/share-sheet/`.
   Presenter implements the Expo Module Function surface; activity
   subclass writes `"Spot says: <text>"` to `UIPasteboard.general`.
   No JS tests here (Constitution V exemption); on-device verification
   in `quickstart.md`.
10. **T010 — Registry hook-up**: append `shareSheetLab` import + array
    entry to `src/modules/registry.ts`. Update
    `test/unit/modules/registry.test.ts` if it asserts a fixed length.
11. **T011 — `pnpm check` gate**: lint + typecheck + tests must be
    green; no `eslint-disable` directives anywhere; `pnpm format` is
    a no-op after the final commit. Report delta from 032's closing
    baseline.
12. **T012 — On-device verification**: execute `quickstart.md`
    checklist on a real iOS 8+ device (preferably an iPad too). Tap
    Share for each of the four content types; verify the custom
    activity copies the prefixed string; verify exclusions hide the
    expected built-in activities; verify all four iPad anchors present
    without crash. Then repeat the basic flow on Android (file via
    `expo-sharing`, text via clipboard fallback) and on Web
    (`navigator.share` if available, else clipboard fallback).

## Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|------------|--------|------------|
| R1 | **iPad crash from missing popover anchor** — presenting `UIActivityViewController` on iPad without setting `popoverPresentationController.sourceView` / `sourceRect` is a known hard crash. | Medium | High | FR-015 + R-F: the bridge always sets both; AnchorSelector mandates a default selection (top-left) on iPad mount; `share()` reads the latest measured rect, not the rect captured at selection time. SC-002 measurable on-device. |
| R2 | **Bridge concurrency anomaly** — two rapid Share taps stack two `UIActivityViewController` presentations. | Medium | Low (UI glitch, recoverable by dismissing) | Per R-A, bridge serialises through a closure-scoped promise chain; the second `present()` waits for the first to resolve. Test asserts two back-to-back present() calls produce exactly two native invocations in submission order. |
| R3 | **Custom activity availability** — `CopyWithPrefixActivity` does not appear in the share sheet because `canPerform(withActivityItems:)` returns false (e.g., the user picked Image content but the activity only supports String). | Medium | Low | The custom activity's `canPerform` accepts a payload if any item is a `String`; for non-text content, the iOS sheet correctly omits the custom activity (this is the platform behaviour, not a bug). Spec acceptance scenario US3-AS2 covers the toggle-off case; the implicit "wrong content type" case is documented in `quickstart.md`. |
| R4 | **`navigator.share` rejects with non-AbortError** on Web (e.g., permission denied, share target unavailable). | Low | Medium | Web bridge variant catches the error, falls back to clipboard via `expo-clipboard`, and resolves with `{ activityType: 'web.clipboard-fallback', completed: true }`. EC enumerated in spec; tests cover both AbortError and generic Error paths. |
| R5 | **Bridge module-name collision** — adding `'ShareSheet'` to `requireOptionalNativeModule` collides with a future Apple-shipped wrapper or third-party library. | Very Low | Low | Distinct module name `'ShareSheet'`. No conflict with `'AppIntents'` / `'WidgetCenter'` / `'FocusFilters'` / `'BackgroundTasks'` / `'Spotlight'` / `'QuickLook'`. Test asserts the lookup is exactly `'ShareSheet'`. |
| R6 | **`screen.web.tsx` accidentally pulls `src/native/share-sheet.ts` into the web bundle** via a transitive import. | Low | Medium | Tests for `screen.web.tsx` assert at module-graph level that `share-sheet.ts` is not in the import closure (mirrors 032 carryover). Bridge keeps platform-specific imports inside the `.ts` / `.android.ts` / `.web.ts` siblings only; types come from `share-sheet.types.ts`. |
| R7 | **`UIActivity.ActivityType` strings drift** between iOS major versions (e.g., a deprecation warning for a legacy activity). | Low | Low | Catalog (`activity-types.ts`) is hand-curated and includes only stable post-iOS-8 activity types. Deprecated pre-iOS-8 activities (Weibo, Vimeo, Flickr) are intentionally excluded (research §8). |
| R8 | **Documents Lab read API not yet available** at implementation time (e.g., 032's read API surface is internal-only). | Low | Low | Per R-E, `FileContentPicker` is structured to gracefully degrade to the bundled fallback when the read API throws or returns empty. Test seeds a mocked store returning `[]` and asserts the fallback row is the only option. |
| R9 | **Clipboard fallback not user-discoverable on Web** — the user taps Share, the text silently goes to the clipboard, the share sheet never appears. | Low | Low | The fallback path always writes a `ShareLogEntry` with `activityType: 'web.clipboard-fallback'` and `outcome: 'completed'`; the screen renders an inline "Copied to clipboard" toast (component-level test asserts the toast is rendered when the synthetic activity type is logged). FR-017 + spec US6-AS2. |
| R10 | **`expo-clipboard` API version drift** — the v55 API differs from the v54 call signature used in feature 016. | Very Low | Low | The bridge calls only `setStringAsync(value)` which has been stable since v0; if drift occurs, `pnpm check` catches it. |

## Test baseline tracking

- **Branch start**: carried forward from feature 032's completion
  totals (recorded in 032's `plan.md` / `retrospective.md`).
- **Expected delta** (sketch, finalised in `tasks.md`):
  - +1 `manifest.test.ts` suite
  - +1 `activity-types.test.ts` suite
  - +1 `bundled-images.test.ts` suite
  - +3 `screen.{ios,android,web}.test.tsx` suites
  - +1 `useShareSession.test.tsx` suite
  - +9 component test suites (`ContentTypePicker`,
    `TextContentInput`, `UrlContentInput`, `ImageContentPicker`,
    `FileContentPicker`, `ExcludedActivitiesPicker`,
    `CustomActivityToggle`, `AnchorSelector`, `ResultLog`)
  - +1 `share-sheet.test.ts` (bridge, all three platforms) suite
  - **Total target**: **≥ +18 suites at completion** (slightly larger
    than 032's ≥ +17 because 033 has nine components vs 032's seven
    and the bridge test covers three platforms vs 032's two).
- Final deltas reported in
  `specs/033-share-sheet/retrospective.md`.

## Progress Tracking

- [x] Spec authored and approved (`specs/033-share-sheet/spec.md`, 2026-04-29)
- [x] Plan authored — this file (Phase 0 + Phase 1 outline complete)
- [ ] Phase 0 — `research.md` written (resolves R-A through R-G)
- [ ] Phase 1 — `data-model.md`, `contracts/*.contract.ts`, `quickstart.md` written
- [ ] `/speckit.tasks` run; `tasks.md` written from the T001-T012 seeds above
- [ ] T001-T010 implemented; `pnpm check` green; baseline delta substituted into "Test baseline tracking"
- [ ] T011 (`pnpm check` gate) signed off
- [ ] T012 (on-device quickstart) signed off on a real iOS 8+ device (incl. iPad)
- [ ] `retrospective.md` written; final test totals substituted; merged to main

## Complexity Tracking

> No constitution violations. Section intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| _(none)_  | _(n/a)_    | _(n/a)_                              |
