# Implementation Plan: Document Picker + Quick Look Module

**Branch**: `032-document-picker-quicklook` | **Date**: 2026-04-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/032-document-picker-quicklook/spec.md`
**Branch parent**: `031-spotlight-indexing`

## Summary

Add an iOS 11+ "Documents Lab" showcase module that demonstrates two
adjacent system surfaces in a single screen: the **Document Picker**
(`UIDocumentPickerViewController` via `expo-document-picker`,
cross-platform) and **Quick Look** (`QLPreviewController`, iOS-only
native bridge). The screen renders five panels in fixed top-to-bottom
order — `PickDocumentsCard`, `BundledSamplesCard`, `TypeFilterControl`,
`FilesList`, and on non-iOS only the `IOSOnlyBanner` + `QuickLookFallback`.
The `TypeFilterControl` simultaneously filters the visible rows in
`FilesList` AND constrains the next picker invocation's UTIs / mime
types (All / Images / Text / PDF). A unified `documents-store`
persists the in-memory `DocumentEntry[]` to AsyncStorage under the
key `spot.documents.list`, with tolerant rehydration (corrupt JSON →
empty list; unresolvable URI → row dropped silently). Bundled samples
are four small valid files shipped under
`src/modules/documents-lab/samples/` (`hello.txt`, `note.md`,
`data.json`, `icon.png`) — **PDF samples are intentionally not
bundled** to keep the binary small; PDF still works for picker-sourced
files. The native side is a thin Swift wrapper
(`native/ios/documents/QuickLookPresenter.swift`) around
`QLPreviewController` exposing `present(uri:) -> Promise<{ shown:
Bool }>` plus `isAvailable() -> Bool`. The JS bridge
(`src/native/quicklook.ts`) typed surface throws a
`QuickLookNotSupported` error on Android / Web. A new, idempotent
Expo config plugin (`plugins/with-documents/`) sets
`LSSupportsOpeningDocumentsInPlace = true` and
`UIFileSharingEnabled = true` on `Info.plist` while coexisting with
all 31 prior plugins (007 / 013 / 014 / 019 / 023 / 025 / 026 / 027 /
028 / 029 / 030 / 031 plus every earlier plugin already in the array).
Two new runtime dependencies are added via `npx expo install`:
`expo-document-picker` and `expo-sharing`. Integration is purely
additive: registry +1, `app.json` `plugins` +1, no other module /
plugin / Swift source touched.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), Swift 5
(`@available(iOS 11.0, *)` on the new presenter). React 19.2 +
React Native 0.83 + React Compiler enabled.
**Primary Dependencies**: Expo SDK 55, expo-router (typed routes),
react-native-reanimated, `@expo/config-plugins`, `expo-modules-core`
(`requireOptionalNativeModule` — same pattern 013 / 014 / 027 / 028 /
029 / 030 / 031 already use), `QuickLook.framework` (iOS 4+:
`QLPreviewController`, `QLPreviewItem`), `UIKit` (root view controller
presentation), `Foundation` (`URL`),
`@react-native-async-storage/async-storage`, **NEW**:
`expo-document-picker`, `expo-sharing`.
**Storage**:
- AsyncStorage key `spot.documents.list` — JSON object
  `{ files: DocumentEntry[]; filter: DocumentFilter }`. Owned
  exclusively by JS `documents-store.ts`; the Swift side never reads
  or writes this key. Tolerant rehydration: parse failure → empty
  list; per-row URI resolution failure → that row dropped, others
  retained (FR-011).
- App bundle (read-only) — four sample files under
  `src/modules/documents-lab/samples/` shipped via the Metro asset
  pipeline (`require('./samples/hello.txt')` etc.). Their bundle URIs
  are resolved at runtime via `Asset.fromModule(...).localUri`.
- No App Group `UserDefaults` write (this feature is JS-side only;
  no widget extension target involvement).

**Testing**: Jest Expo + React Native Testing Library — JS-pure tests
only. The Swift surface (one new file under `native/ios/documents/`)
is not unit-testable on the Windows-based dev environment used by
this repository (same exemption pattern features 007 / 013 / 014 /
027 / 028 / 029 / 030 / 031 applied; on-device verification documented
in `quickstart.md`). All native bridges (and `expo-document-picker` /
`expo-sharing`) MUST be mocked at the import boundary per FR-019.
**Target Platform**: iOS 11+ (real `QLPreviewController` presentation
+ `LSSupportsOpeningDocumentsInPlace` / `UIFileSharingEnabled` Files
app integration). iOS < 11 / Android / Web ship the cross-platform
fallback (the picker still works via `expo-document-picker`,
`Share` still works via `expo-sharing`, and the `QuickLookFallback`
panel + `IOSOnlyBanner` explain the platform limitation).
`screen.web.tsx` MUST NOT import `src/native/quicklook.ts` at module
evaluation time (mirrors 030 / 031 SC-007 discipline).
**Project Type**: Mobile app (Expo) with native iOS sources appended
to the **main app target** via the existing autolinking pipeline —
strictly additive (no extension target, no entitlement edits, no
new App Group). Same shape as 029 / 030 / 031.
**Performance Goals**: Screen mount → first meaningful paint < 250 ms
on a mid-tier iPhone (excluding any awaited rehydration); picker
invocation returns from `expo-document-picker` in < 500 ms on a warm
file list; Quick Look sheet appears within 300 ms of `present(uri:)`
resolving; `QuickLookFallback` renders within 100 ms of a tap on
non-iOS (SC-006); list rehydration on mount completes in < 100 ms
for ≤ 50 entries.
**Constraints**: Purely additive at integration level — 1 import +
1 array entry in `src/modules/registry.ts`, 1 plugin entry in
`app.json`, exactly **two** new runtime dependencies (FR-018: no other
dependency versions move); no edits to prior plugin / screen / Swift
sources; no new App Group; no `eslint-disable` directives anywhere
in added or modified code (FR-020); `StyleSheet.create()` only
(Constitution IV); `.android.tsx` / `.web.tsx` splits for non-trivial
platform branches (Constitution III); native bridges mocked at the
import boundary in tests (FR-019).
**Scale/Scope**: One module directory (`src/modules/documents-lab/`),
one new plugin (`plugins/with-documents/`), one new bridge file
(`src/native/quicklook.ts` plus matching `.android.ts` / `.web.ts` /
`.types.ts` siblings), one Swift file under `native/ios/documents/`,
one store (`documents-store.ts`), one mime helper (`mime-types.ts`),
one samples descriptor module (`samples.ts`), one hook
(`hooks/usePickedDocuments.ts`), seven UI components, three screen
variants, four bundled sample assets. The Files List has no fixed
cap — duplicates are allowed (FR-005 acceptance scenario 3).
**Test baseline at branch start**: carried forward from feature 031's
completion totals (recorded in 031's plan.md / retrospective.md).
032's expected delta: **≥ +18 suites** (see "Test baseline tracking"
below).

## Constitution Check

*Constitution version checked*: **1.1.0**
(`.specify/memory/constitution.md`).

| Principle | Compliance |
|-----------|------------|
| I. Cross-Platform Parity | **PASS** — iOS 11+ ships the full module: picker + bundled samples + Files List + Quick Look preview + share + delete + filter. Android / Web / iOS < 11 ship the same screen minus native preview: `IOSOnlyBanner` + `QuickLookFallback` replace the in-place Quick Look render; `expo-document-picker` and `expo-sharing` keep the picker and share paths fully functional. The user journey "open card → pick / sample → see file in list → share or preview" is equivalent across all targets; the only platform-divergent piece is the in-app preview surface, which is intrinsic to `QLPreviewController` being iOS-only. |
| II. Token-Based Theming | **PASS** — All chrome uses `ThemedView` / `ThemedText` and the `Spacing` scale from `src/constants/theme.ts`. Reuses existing semantic colour tokens (`textPrimary` / `surfaceElevated` / `accent` / `warning` / `error`); the per-row "Preview / Share / Delete" affordances reuse the existing icon-button token shape. No new theme entries; no hardcoded hex values. |
| III. Platform File Splitting | **PASS** — `screen.tsx` / `screen.android.tsx` / `screen.web.tsx`. Bridge has matching `quicklook.ts` / `.android.ts` / `.web.ts` / `.types.ts` variants (mirrors 030 / 031 layouts). The web variant explicitly avoids importing `src/native/quicklook.ts` at evaluation time (SC-007 carryover). `Platform.select` is permitted only for trivial style / copy diffs. |
| IV. StyleSheet Discipline | **PASS** — All styles via `StyleSheet.create()`; `Spacing` from theme tokens; no inline objects, no CSS-in-JS, no utility-class frameworks. |
| V. Test-First for New Features | **PASS** — JS-pure tests are enumerated in the "Phased file inventory" section below and cover: `mime-types`, `samples`, `documents-store` (rehydrate / persist / corrupt-JSON tolerance / missing-URI drop), `usePickedDocuments` (filter, add, remove, clear, picker-arg derivation, AsyncStorage error tolerance), every component (`PickDocumentsCard`, `BundledSamplesCard`, `FilesList`, `FileRow`, `TypeFilterControl`, `QuickLookFallback`, `IOSOnlyBanner`), all three screen variants, the bridge (typed surface, non-iOS throws `QuickLookNotSupported`, iOS delegates to mocked native module), the plugin (idempotency + coexistence with all 31 prior plugins + commutativity + scope-limited mutation), and the manifest contract. Swift cannot be exercised on Windows; on-device verification documented in `quickstart.md`. |
| Validate-Before-Spec (workflow) | **PASS / N/A** — This is not a build-pipeline or external-service-integration feature; it is an additive in-app showcase + standard `QLPreviewController` usage. The plugin's `Info.plist` mutation surface is fully unit-testable with `@expo/config-plugins`'s `withInfoPlist` mock — no proof-of-concept `expo prebuild` is required to validate spec assumptions. |

**Initial Constitution Check: PASS — no violations, no entries needed
in Complexity Tracking.**

**Re-check after Phase 1 (post-design): PASS** — the Phase 1 artifacts
(data-model, contracts, quickstart) introduce no new global stores
beyond the one AsyncStorage key, no new theme tokens, and no inline
`Platform.select` beyond trivial style branches. The bridge's
typed-surface contract keeps every iOS-only symbol strictly inside
`src/native/quicklook.ts`; non-iOS variants import only the shared
`*.types.ts` and the typed error class. AsyncStorage interaction is
isolated to `documents-store.ts` (the hook never touches AsyncStorage
directly) so error-tolerance is testable at one boundary.

## Project Structure

### Documentation (this feature)

```text
specs/032-document-picker-quicklook/
├── plan.md              # this file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── documents-store.contract.ts          # DocumentEntry, DocumentFilter,
│   │                                         #   DocumentsStoreState, parse + persist API
│   ├── quicklook-bridge.contract.ts          # JS bridge typed surface
│   │                                         #   (present, isAvailable) +
│   │                                         #   QuickLookNotSupported error contract
│   ├── with-documents-plugin.contract.ts     # Plugin invariants (P1..P8)
│   └── manifest.contract.ts                  # Registry entry contract
│                                             #   (id 'documents-lab', label,
│                                             #    platforms, minIOS '11.0')
└── tasks.md             # Phase 2 output (NOT created here)
```

### Source Code (repository root)

```text
# NEW (this feature) — TypeScript module
src/modules/documents-lab/
├── index.tsx                              # ModuleManifest (id 'documents-lab',
│                                          #   minIOS '11.0', platforms ['ios','android','web'])
├── screen.tsx                             # iOS 11+ variant (PickDocuments + Samples +
│                                          #   TypeFilter + FilesList; no banner / fallback)
├── screen.android.tsx                     # Android: PickDocuments + Samples +
│                                          #   TypeFilter + FilesList + IOSOnlyBanner +
│                                          #   QuickLookFallback (above the Quick Look section)
├── screen.web.tsx                         # Web fallback (same render set as android;
│                                          #   MUST NOT import src/native/quicklook.ts at load)
├── documents-store.ts                     # AsyncStorage-backed list under
│                                          #   'spot.documents.list'.
│                                          #   Pure functions: load, save, parsePersisted,
│                                          #   filterRows. Tolerates corrupt JSON
│                                          #   (returns empty), drops unresolvable URI rows.
├── mime-types.ts                          # Pure helpers:
│                                          #   - mimeFromExtension(name) -> string
│                                          #   - familyOfMime(mime) -> 'image' | 'text' | 'pdf' | 'other'
│                                          #   - pickerTypeForFilter(filter) -> string | string[] | undefined
│                                          #   - filterMatchesEntry(filter, entry) -> boolean
│                                          #   - formatSize(bytes) -> human readable string
├── samples.ts                             # Static descriptor for the four bundled samples;
│                                          #   uses Asset.fromModule(require(...)) to resolve
│                                          #   bundle URIs at runtime (no PDF — see plan §"PDF
│                                          #   intentionally absent from bundled set").
├── samples/
│   ├── hello.txt                          # Tiny UTF-8 text ("Hello from spot 032!\n")
│   ├── note.md                            # Tiny markdown ("# spot 032\n\nDocument Picker + Quick Look.\n")
│   ├── data.json                          # Tiny JSON ({"feature":"032","ok":true})
│   └── icon.png                           # Tiny valid PNG (1x1 or 8x8) generated as
│                                          #   minimal valid bytes; checked into the repo
│                                          #   as a binary asset
├── hooks/
│   └── usePickedDocuments.ts              # { files, add, remove, clear, filter, setFilter };
│                                          #   refetches on mount; reducer-serialised mutations;
│                                          #   tolerates QuickLookNotSupported / AsyncStorage
│                                          #   errors via a per-row inline error channel; the
│                                          #   ONLY public surface consumed by the three
│                                          #   screen variants (FR-012)
└── components/
    ├── PickDocumentsCard.tsx              # Explainer + "Open documents" CTA. Calls
    │                                      #   expo-document-picker.getDocumentAsync with a
    │                                      #   `type` argument derived from filter. On
    │                                      #   cancellation, no-op (EC: picker cancelled).
    ├── BundledSamplesCard.tsx             # 2x2 grid of four sample tiles. Tapping a tile
    │                                      #   appends one DocumentEntry to the list (source:
    │                                      #   'sample').
    ├── FilesList.tsx                      # Renders filtered rows; empty-state line per
    │                                      #   filter ("No PDF files in your list" etc., EC).
    ├── FileRow.tsx                        # name + mime label + formatted size + 3 actions:
    │                                      #   Preview (calls quicklook.present on iOS,
    │                                      #   renders QuickLookFallback inline on non-iOS),
    │                                      #   Share (expo-sharing.shareAsync; disabled if not
    │                                      #   supported), Delete from list (removes from
    │                                      #   store; never deletes underlying file).
    ├── TypeFilterControl.tsx              # Segmented control: All / Images / Text / PDF.
    │                                      #   Drives both rendered rows (filterMatchesEntry)
    │                                      #   and picker UTIs (pickerTypeForFilter).
    ├── QuickLookFallback.tsx              # On non-iOS or on Quick Look error: explains
    │                                      #   limitation; offers Share as degraded path.
    └── IOSOnlyBanner.tsx                  # "Quick Look preview is iOS-only"; rendered on
                                            #   Android / Web only; absent on iOS (FR-017).

# NEW (this feature) — Swift sources, appended to MAIN APP TARGET (not a widget extension)
native/ios/documents/
└── QuickLookPresenter.swift               # @available(iOS 11.0, *) class implementing
                                            #   QLPreviewControllerDataSource. Presents
                                            #   QLPreviewController modally over the current
                                            #   root view controller (UIApplication.shared
                                            #   .keyWindow?.rootViewController, with
                                            #   first-presented-controller traversal).
                                            #   Exposes:
                                            #     - isAvailable() -> Bool (always true on iOS 11+)
                                            #     - present(uri: String) -> Promise<{ shown: Bool }>
                                            #   present(uri:) resolves with { shown: true } once
                                            #   the sheet appears; rejects with a typed error if
                                            #   the URI cannot be resolved or the file type is
                                            #   unsupported (EC: Quick Look fails to present).
                                            #   The presenter holds itself alive for the
                                            #   duration of the sheet (strong-ref via
                                            #   associated object) and releases on dismissal.

# NEW (this feature) — Expo config plugin
plugins/with-documents/
├── index.ts                               # ConfigPlugin: composes a single withInfoPlist
│                                          #   mutation that sets
│                                          #   LSSupportsOpeningDocumentsInPlace = true and
│                                          #   UIFileSharingEnabled = true. Idempotent
│                                          #   (byte-identical second run); coexists with all
│                                          #   31 prior plugins; commutative across sampled
│                                          #   orderings; does NOT mutate any other plist key,
│                                          #   any entitlement, or pbxproj.
└── package.json

# NEW (this feature) — JS bridge (mirrors 030 / 031 layout)
src/native/quicklook.ts                    # iOS impl: requireOptionalNativeModule
                                            #   ('QuickLook') + Platform.OS === 'ios' gate;
                                            #   exports present(uri), isAvailable(), and the
                                            #   QuickLookNotSupported class (FR-014). All
                                            #   present() calls serialise through a closure-
                                            #   scoped promise chain inherited verbatim from
                                            #   030 / 031 (research §1) so two rapid Preview
                                            #   taps don't double-present.
src/native/quicklook.android.ts            # isAvailable() returns false synchronously;
                                            #   present() throws QuickLookNotSupported.
src/native/quicklook.web.ts                # Same as android.ts.
src/native/quicklook.types.ts              # QuickLookBridge interface;
                                            #   QuickLookNotSupported class declaration.
                                            #   No global symbol collisions with 013's
                                            #   app-intents, 014/027/028's widget-center,
                                            #   029's focus-filters, 030's background-tasks,
                                            #   or 031's spotlight bridges (distinct module
                                            #   name 'QuickLook').

# MODIFIED (additive only)
src/modules/registry.ts                    # +1 import line, +1 array entry
                                            #   (documentsLab) — registry size +1
app.json                                   # +1 plugins entry: "./plugins/with-documents".
                                            #   Coexists with all 31 prior plugin entries.

# NEW (this feature) — runtime dependencies (added via `npx expo install`)
package.json                               # +2 dependencies: expo-document-picker,
                                            #   expo-sharing. No other dependency versions
                                            #   move (FR-018).

# UNTOUCHED (deliberately — verified non-regression in tests)
plugins/with-{live-activity,app-intents,home-widgets,screentime,coreml,vision,
              speech-recognition,audio-recording,sign-in-with-apple,local-auth,
              keychain-services,mapkit,core-location,rich-notifications,
              lock-widgets,standby-widget,focus-filters,background-tasks,
              spotlight}/**                # All prior plugins byte-identical.
native/ios/{app-intents,widgets,focus-filters,background-tasks,spotlight,...}/**
                                            # All prior native sources byte-identical.
src/native/{app-intents,widget-center,focus-filters,background-tasks,spotlight}.*
                                            # All prior bridges byte-identical.
src/modules/{intents-lab,widgets-lab,lock-widgets-lab,standby-lab,
              focus-filters-lab,background-tasks-lab,spotlight-lab,...}/**
                                            # All prior modules byte-identical.
ios-widget/**                              # 014/027/028-owned widget extension; NOT touched.

# Tests (NEW)
test/unit/modules/documents-lab/
├── manifest.test.ts                        # id 'documents-lab', label 'Documents Lab',
│                                            #   platforms ['ios','android','web'],
│                                            #   minIOS '11.0'
├── mime-types.test.ts                      # mimeFromExtension, familyOfMime,
│                                            #   pickerTypeForFilter, filterMatchesEntry,
│                                            #   formatSize — all four filter branches +
│                                            #   the empty / unknown extension paths
├── samples.test.ts                         # exactly four samples (txt, md, json, png);
│                                            #   no PDF; each has non-empty name + mime +
│                                            #   size + a resolvable requireAsset reference
├── documents-store.test.ts                 # load empty / load valid / load corrupt JSON
│                                            #   (-> empty) / load with one unresolvable URI
│                                            #   (-> remaining valid rows kept); save round-
│                                            #   trips; parsePersisted tolerates non-array
│                                            #   roots and missing required fields
├── screen.test.tsx                         # iOS flow: panels in order
│                                            #   PickDocuments → Samples → Filter → List;
│                                            #   no IOSOnlyBanner / QuickLookFallback at top
│                                            #   level on iOS; isolation from
│                                            #   013/014/027/028/029/030/031 paths
├── screen.android.test.tsx                 # Android: same panels + IOSOnlyBanner +
│                                            #   QuickLookFallback above Quick Look section;
│                                            #   tapping Preview does NOT crash
├── screen.web.test.tsx                     # Web: same render set as android; assert
│                                            #   src/native/quicklook.ts is NOT pulled in
│                                            #   by the web bundle at module evaluation time
├── hooks/
│   └── usePickedDocuments.test.tsx         # mount rehydrate; add(picker), add(sample),
│                                            #   remove(id), clear(), setFilter(value);
│                                            #   add() while filter='images' but a text file
│                                            #   is picked — file is added but hidden until
│                                            #   filter changes (FR-004 + FR-010);
│                                            #   AsyncStorage corruption -> empty list, no
│                                            #   crash, error surfaced on optional onError
└── components/
    ├── PickDocumentsCard.test.tsx          # CTA label "Open documents"; tap calls
    │                                        #   getDocumentAsync with type derived from
    │                                        #   filter (mocked expo-document-picker);
    │                                        #   cancellation result -> no rows added
    ├── BundledSamplesCard.test.tsx         # renders exactly 4 tiles; tap appends one row;
    │                                        #   tap same tile twice -> two distinct rows
    ├── FilesList.test.tsx                  # 0 / 1 / N rows; filter empty-state line for
    │                                        #   each filter ("No PDF files in your list"
    │                                        #   etc.); newest-first ordering matches store
    ├── FileRow.test.tsx                    # renders name + mime label + formatted size;
    │                                        #   3 buttons present; tap Preview on iOS calls
    │                                        #   quicklook.present; on non-iOS renders
    │                                        #   QuickLookFallback; tap Share calls
    │                                        #   expo-sharing.shareAsync; tap Delete removes
    │                                        #   from store but does NOT call any file-system
    │                                        #   delete API
    ├── TypeFilterControl.test.tsx          # 4 mutually-exclusive segments; selecting each
    │                                        #   calls setFilter with the corresponding value
    ├── QuickLookFallback.test.tsx          # message string mentions iOS-only; Share
    │                                        #   action is the offered degraded path
    └── IOSOnlyBanner.test.tsx              # message string; absent on iOS, present on
                                              #   Android / Web (rendered by screen variants)
test/unit/native/
└── quicklook.test.ts                       # iOS path delegates to mocked native module;
                                              #   non-iOS throws QuickLookNotSupported on
                                              #   present(); isAvailable() returns false on
                                              #   non-iOS; typed surface matches the contract;
                                              #   two back-to-back present() calls produce
                                              #   exactly two native invocations in
                                              #   submission order (R-A serialisation
                                              #   inheritance)
test/unit/plugins/
└── with-documents/
    └── index.test.ts                        # full pipeline:
                                              #   (a) sets LSSupportsOpeningDocumentsInPlace
                                              #       to true on a virgin Info.plist;
                                              #   (b) sets UIFileSharingEnabled to true on a
                                              #       virgin Info.plist;
                                              #   (c) idempotent on second run
                                              #       (byte-identical Info.plist);
                                              #   (d) when either key already exists with
                                              #       desired value -> no-op (preserves
                                              #       byte-identity);
                                              #   (e) when either key already exists with a
                                              #       DIFFERENT value -> overwrites only those
                                              #       two managed keys; every other key in
                                              #       Info.plist is byte-identical;
                                              #   (f) coexists with ALL 31 prior plugins in
                                              #       declaration order — assert post-pipeline
                                              #       Info.plist is a superset that contains
                                              #       all 31 prior mutations AND the two new
                                              #       keys, by toEqual against a reference
                                              #       fixture (NOT toContain);
                                              #   (g) commutativity across ≥3 sampled
                                              #       orderings (before-all, middle, after-all)
                                              #       — toEqual against a reference final
                                              #       Info.plist;
                                              #   (h) NO mutation outside the two managed
                                              #       Info.plist keys; assert the plugin does
                                              #       NOT call withXcodeProject and does NOT
                                              #       touch entitlements
```

**Structure Decision**: Mirrors **031's** `Expo + iOS-main-app-target`
shape. Differences from 031:

1. **Different framework / API class** — `QLPreviewController` instead
   of `CSSearchableIndex` + `NSUserActivity`. The presenter is a
   self-retaining `QLPreviewControllerDataSource` over a single URI;
   no batch indexing surface, no `becomeCurrent()` / `invalidate()`
   lifecycle, no system-index reads. The bridge surface is therefore
   far smaller (`present` + `isAvailable` only).
2. **Persistence path** — 031 has no JS-side persistent store (the
   system index is the source of truth). 032 owns its own store
   (`spot.documents.list` in AsyncStorage) because the file list is a
   user-mutable, in-app collection that must survive app restarts.
   No App Group write — this feature has no widget / extension target.
3. **Bridge surface is smaller** — only two methods (`present`,
   `isAvailable`), and only one is async. Concurrent-`present`
   serialisation still uses the closure-scoped promise chain
   inherited from 030 / 031 (R-A) so two rapid Preview taps don't
   stack two presentations.
4. **Plugin scope is two `Info.plist` keys, not one** — but the keys
   are scalars (booleans), not arrays, so there is no union-merge
   concern; the merge logic is simpler than 030's `UIBackgroundModes`
   union or 031's `NSUserActivityTypes` union.
5. **Two new runtime dependencies** — `expo-document-picker` and
   `expo-sharing`. 030 / 031 added zero. This is the first feature in
   the 025–032 sequence to add a runtime dependency, so the plan
   explicitly enumerates the version-pin discipline (FR-018: `npx
   expo install` resolves the SDK-55-compatible pins; no other deps
   move).
6. **Bundled binary assets** — 032 ships four small files in the app
   bundle. 030 / 031 shipped no binary assets. The samples are
   intentionally tiny (< 50 KB total) and the PDF case is covered by
   picker-sourced files only (assumption documented in spec.md and
   in research §6).

## Resolved decisions

The spec was approved without clarifications. The following are the
plan-level technical decisions made autonomously, recorded in
`research.md` with full Decision / Rationale / Alternatives:

| # | Decision | Spec ref / location |
|---|----------|---------------------|
| R-A | Bridge serialisation via closure-scoped promise chain (inherited verbatim from 030 / 031). Two back-to-back `present()` calls produce two native invocations in submission order. | research §1 |
| R-B | Pure mime-type / filter helpers (`mime-types.ts`) — no React imports, no I/O. Used by both the hook (for picker arg derivation) and the FilesList (for visibility). | research §2 |
| R-C | AsyncStorage rehydration tolerance — `parsePersisted` returns `{ files: [], filter: 'all' }` on malformed JSON, on non-object root, on missing `files` array, and per-row drops any entry whose required fields fail validation. Optional `onError(unknown)` callback fired exactly once per parse failure (mirrors 030 R-C / 031 R-B funnel pattern). | research §3 |
| R-D | Plugin mutates exactly two scalar `Info.plist` keys (`LSSupportsOpeningDocumentsInPlace`, `UIFileSharingEnabled`). When the key is absent, set to `true`. When present with desired value, no-op. When present with different value, overwrite (FR-015 wording). No `pbxproj` mutation; QuickLook framework linkage is provided by the existing autolinking pipeline. | research §4 |
| R-E | Bundled samples are loaded via `Asset.fromModule(require('./samples/<name>'))` and resolved to a runtime URI (`asset.localUri ?? asset.uri`) lazily inside the sample tile's tap handler. The samples descriptor (`samples.ts`) is pure: it only declares names, mime types, sizes, and the `requireAsset` references. The icon.png file is shipped as a hand-authored 8x8 PNG (~70 bytes) — small enough that the binary cost is negligible (<200 bytes total for the four files). | research §5 |
| R-F | PDF samples are intentionally NOT bundled. PDF is exercised in tests via a mocked `expo-document-picker` response that returns a fake PDF descriptor; the `pdf` filter branch is fully covered without shipping a binary PDF. Documented in spec.md §"Bundled samples", FR-005, and SC-002 (which scopes "all four bundled samples render in Quick Look" to txt/md/json/png only). | research §6 |

## Phased file inventory

### Phase 0 — Research (no code; produces research.md only)

NEW files:
- `specs/032-document-picker-quicklook/research.md`

### Phase 1 — Design contracts (no app code; produces docs only)

NEW files:
- `specs/032-document-picker-quicklook/data-model.md`
- `specs/032-document-picker-quicklook/quickstart.md`
- `specs/032-document-picker-quicklook/contracts/documents-store.contract.ts`
- `specs/032-document-picker-quicklook/contracts/quicklook-bridge.contract.ts`
- `specs/032-document-picker-quicklook/contracts/with-documents-plugin.contract.ts`
- `specs/032-document-picker-quicklook/contracts/manifest.contract.ts`

MODIFIED:
- `.github/copilot-instructions.md` — update the SPECKIT block's plan
  reference from `specs/031-spotlight-indexing/plan.md` to
  `specs/032-document-picker-quicklook/plan.md`.

### Phase 2 — Tasks (out of scope for /speckit.plan; sketched here for tasks.md)

NEW (TypeScript / tests):

- `src/modules/documents-lab/index.tsx`
- `src/modules/documents-lab/screen.tsx`
- `src/modules/documents-lab/screen.android.tsx`
- `src/modules/documents-lab/screen.web.tsx`
- `src/modules/documents-lab/documents-store.ts`
- `src/modules/documents-lab/mime-types.ts`
- `src/modules/documents-lab/samples.ts`
- `src/modules/documents-lab/samples/{hello.txt,note.md,data.json,icon.png}`
- `src/modules/documents-lab/hooks/usePickedDocuments.ts`
- `src/modules/documents-lab/components/{PickDocumentsCard,BundledSamplesCard,FilesList,FileRow,TypeFilterControl,QuickLookFallback,IOSOnlyBanner}.tsx`
- `src/native/quicklook.ts`
- `src/native/quicklook.android.ts`
- `src/native/quicklook.web.ts`
- `src/native/quicklook.types.ts`
- `test/unit/modules/documents-lab/manifest.test.ts`
- `test/unit/modules/documents-lab/mime-types.test.ts`
- `test/unit/modules/documents-lab/samples.test.ts`
- `test/unit/modules/documents-lab/documents-store.test.ts`
- `test/unit/modules/documents-lab/screen.test.tsx`
- `test/unit/modules/documents-lab/screen.android.test.tsx`
- `test/unit/modules/documents-lab/screen.web.test.tsx`
- `test/unit/modules/documents-lab/hooks/usePickedDocuments.test.tsx`
- `test/unit/modules/documents-lab/components/{PickDocumentsCard,BundledSamplesCard,FilesList,FileRow,TypeFilterControl,QuickLookFallback,IOSOnlyBanner}.test.tsx`
- `test/unit/native/quicklook.test.ts`
- `test/unit/plugins/with-documents/index.test.ts`

NEW (Swift, linked into main app target via existing autolinking):

- `native/ios/documents/QuickLookPresenter.swift`

NEW (plugin):

- `plugins/with-documents/index.ts`
- `plugins/with-documents/package.json`

MODIFIED (additive only):

- `src/modules/registry.ts` (+1 import, +1 array entry `documentsLab`)
- `app.json` (+1 plugins entry `./plugins/with-documents`)
- `package.json` (+2 dependencies via `npx expo install
  expo-document-picker expo-sharing`)
- `pnpm-lock.yaml` (regenerated by pnpm install — single commit
  alongside package.json change)

UNTOUCHED (verified non-regression in tests):

- `plugins/with-{live-activity,app-intents,home-widgets,screentime,
  coreml,vision,speech-recognition,audio-recording,sign-in-with-apple,
  local-auth,keychain-services,mapkit,core-location,rich-notifications,
  lock-widgets,standby-widget,focus-filters,background-tasks,
  spotlight}/**` — every file byte-identical.
- `native/ios/{app-intents,widgets,focus-filters,background-tasks,
  spotlight,...}/**` — byte-identical.
- `src/native/{app-intents,widget-center,focus-filters,
  background-tasks,spotlight}.*` — byte-identical.
- `src/modules/{intents-lab,widgets-lab,lock-widgets-lab,standby-lab,
  focus-filters-lab,background-tasks-lab,spotlight-lab,...}/**` —
  byte-identical.
- `ios-widget/**` — byte-identical.

## Task seeds for tasks.md

These are sketches for the `/speckit.tasks` step, ordered by
dependency. The full enumeration belongs in `tasks.md`; these are
intentionally coarse so `/speckit.tasks` can split each into
RED → GREEN → REFACTOR sub-tasks.

1. **T001 — Mime helpers (RED-first)**: `mime-types.ts` with
   `mimeFromExtension`, `familyOfMime`, `pickerTypeForFilter`,
   `filterMatchesEntry`, `formatSize`. Tests in `mime-types.test.ts`
   cover all four filter branches + unknown-extension fallback.
2. **T002 — Documents store (RED-first)**: `documents-store.ts` with
   `load(asyncStorage)`, `save(asyncStorage, state)`,
   `parsePersisted(raw: unknown)`, `dropMissingURIs(state, resolver)`.
   Tests cover empty / valid / corrupt JSON / missing-URI tolerance
   per R-C.
3. **T003 — Samples descriptor**: `samples.ts` with the four bundled
   sample descriptors (no PDF). Tests assert exactly four entries +
   correct mime types + non-empty size + resolvable `requireAsset`.
4. **T004 — Bridge types + non-iOS stubs**:
   `src/native/quicklook.types.ts` declares `QuickLookBridge`
   interface + `QuickLookNotSupported` class.
   `src/native/quicklook.android.ts` and `quicklook.web.ts` throw
   `QuickLookNotSupported` from `present()` and return `false` from
   `isAvailable()`. Tests assert no symbol collision with prior
   bridges.
5. **T005 — iOS bridge**: `src/native/quicklook.ts` implements iOS
   path (`requireOptionalNativeModule('QuickLook')` + `Platform.OS
   === 'ios'` gate + closure-scoped serialisation chain per R-A).
   Tests in `quicklook.test.ts` cover serialisation invariant + typed
   surface.
6. **T006 — Manifest**: `src/modules/documents-lab/index.tsx` +
   `manifest.test.ts` (asserts id `'documents-lab'`, label
   `'Documents Lab'`, platforms `['ios','android','web']`, `minIOS:
   '11.0'`).
7. **T007 — Hook**: `hooks/usePickedDocuments.ts` returning `{ files,
   add, remove, clear, filter, setFilter }`; reducer-serialised
   mutations; refetches on mount; tolerates `QuickLookNotSupported`
   and AsyncStorage errors. Tests mock the bridge,
   `expo-document-picker`, and AsyncStorage.
8. **T008 — Components, top-down RED**: write component tests first
   (`PickDocumentsCard`, `BundledSamplesCard`, `FilesList`, `FileRow`,
   `TypeFilterControl`, `QuickLookFallback`, `IOSOnlyBanner`); then
   implement against them. Per-row Preview / Share / Delete state
   transitions asserted at the `FileRow` level.
9. **T009 — Screens**: implement `screen.tsx`, `screen.android.tsx`,
   `screen.web.tsx` with full panel ordering per FR-002; tests
   assert layout order, banner visibility, hidden panels on iOS, and
   that `screen.web.tsx` does NOT pull `src/native/quicklook.ts` into
   the bundle.
10. **T010 — Plugin**: write `plugins/with-documents/{index.ts,
    package.json}` and tests. Tests must cover: (a)–(h) per the
    contract above (idempotency, scope-limit, prior-key preservation,
    coexistence with all 31 prior plugins, commutativity).
11. **T011 — Swift source**: write
    `QuickLookPresenter.swift` under `native/ios/documents/`.
    Implements `QLPreviewControllerDataSource`, presents the
    controller modally, holds itself alive for the sheet duration,
    releases on dismissal. No JS tests here (Constitution V
    exemption); on-device verification in `quickstart.md`.
12. **T012 — Dependency install**: run `npx expo install
    expo-document-picker expo-sharing` from the repo root; commit
    `package.json` + `pnpm-lock.yaml` together. Verify no other
    dependency versions move (FR-018) by diffing
    `pnpm-lock.yaml`.
13. **T013 — Registry hook-up**: append `documentsLab` import + array
    entry to `src/modules/registry.ts`. Update
    `test/unit/modules/registry.test.ts` if it asserts a fixed
    length.
14. **T014 — `app.json` plugin entry**: add `./plugins/with-documents`
    to the `plugins` array. Verify the array length is exactly
    previous + 1 (SC-005).
15. **T015 — `pnpm check` gate**: lint + typecheck + tests must be
    green; no `eslint-disable` directives anywhere; `pnpm format` is
    a no-op after the final commit. Report delta from 031's closing
    baseline.
16. **T016 — On-device verification**: execute `quickstart.md`
    checklist on a real iOS 11+ device (open card → tap a sample tile
    → tap Preview → observe Quick Look sheet → dismiss → tap Share →
    observe share sheet → tap Delete → observe row removed; repeat
    for picker-sourced files; toggle filter and observe both list
    and picker constraint changing).

## Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|------------|--------|------------|
| R1 | **Plugin clobbers prior plist keys** — 032's plugin accidentally rewrites `NSUserActivityTypes` (031), `BGTaskSchedulerPermittedIdentifiers` (030), or `UIBackgroundModes` (025/030). | Very Low | High (silent prior-feature regression) | Plugin test (h) under T010 explicitly seeds a reference Info.plist containing every prior plugin's mutations and asserts post-mutation Info.plist is byte-identical EXCEPT for the two managed keys. Coexistence test (f) runs the full pipeline of all 32 plugins and `toEqual`s a reference fixture. SC-003 measurable. |
| R2 | **Plugin idempotency drift** — `expo prebuild` run twice mutates the two booleans into something other than `true`. | Very Low | Medium | The keys are scalar booleans set unconditionally to `true`; second run finds them already `true` and is a no-op. Test (c) asserts byte-identical Info.plist on second run. SC-003 measurable. |
| R3 | **Bridge concurrency anomaly** — two rapid Preview taps stack two `QLPreviewController` presentations. | Medium | Low (UI glitch, recoverable by dismissing) | Per R-A, bridge serialises through a closure-scoped promise chain; the second `present()` waits for the first to resolve (i.e. for the sheet to appear). Test asserts two back-to-back `present()` calls produce exactly two native invocations in submission order. |
| R4 | **AsyncStorage corrupt JSON crashes the screen on mount** — a corrupted `spot.documents.list` blob raises `SyntaxError` from `JSON.parse`. | Low | High (screen crashes on cold launch) | Per R-C, `parsePersisted` returns the empty default state on any parse / shape failure and surfaces the failure on the optional `onError` callback. EC enumerated in spec; SC-007 measurable. |
| R5 | **Stored URI no longer resolves** (file removed from iCloud, app reinstalled, sandbox path drift). | High | Low | Per R-C, rehydration drops any row whose URI fails resolution and keeps the rest of the list. Test seeds a list with one resolvable + one unresolvable URI and asserts the resolvable row remains. |
| R6 | **Quick Look fails to present on iOS** for an unsupported file type. | Low | Low | Swift presenter rejects the promise with a typed error; `FileRow` catches and renders the `QuickLookFallback` inline (Share remains available). EC enumerated in spec. |
| R7 | **`expo-document-picker` / `expo-sharing` version pin breaks SDK 55** — `npx expo install` resolves an incompatible pin. | Very Low | Medium | `npx expo install` (not `pnpm add`) is the canonical command; it consults the SDK's compatibility map. T012 verifies green `pnpm check` after the install. If a version pin causes a regression, the spec back-patching mandate (Constitution v1.1.0) applies. |
| R8 | **PNG asset is not actually a valid PNG** — the hand-authored 8x8 binary is malformed and `QLPreviewController` rejects it. | Low | Low | Use a known-valid 8x8 PNG byte sequence (verified by piping through a PNG validator before committing). Fall back to bundling a slightly larger but provably valid PNG generated from a trusted tool. SC-002 acceptance is on-device (T016). |
| R9 | **Bridge module-name collision** — adding `'QuickLook'` to `requireOptionalNativeModule` collides with a future Apple-shipped wrapper or third-party library. | Very Low | Low | Distinct module name `'QuickLook'`; test asserts the lookup is exactly `'QuickLook'`. No conflict with `'AppIntents'` / `'WidgetCenter'` / `'FocusFilters'` / `'BackgroundTasks'` / `'Spotlight'`. |
| R10 | **`screen.web.tsx` accidentally pulls `src/native/quicklook.ts` into the web bundle** via a transitive import (e.g. importing from `quicklook.types.ts` reaches the iOS variant). | Low | Medium (web bundle contains dead iOS-only code; potentially crashes at module evaluation if the iOS path imports a native-only API at top level) | Tests for `screen.web.tsx` assert at module-graph level that `quicklook.ts` is not in the import closure (mirrors 030 SC-007 / 031 carryover). The bridge keeps platform-specific imports inside the `.ts` / `.android.ts` / `.web.ts` siblings only; types are imported from `quicklook.types.ts`. |

## Test baseline tracking

- **Branch start**: carried forward from feature 031's completion
  totals (recorded in 031's `plan.md` / `retrospective.md`).
  031's plan.md documented an expected delta of ≥ +14 suites.
  032's T015 will substitute the actual 031 close numbers into this
  section before the merge commit.
- **Expected delta** (sketch, finalised in `tasks.md`):
  - +1 `manifest.test.ts` suite
  - +1 `mime-types.test.ts` suite
  - +1 `samples.test.ts` suite
  - +1 `documents-store.test.ts` suite
  - +3 `screen.{ios,android,web}.test.tsx` suites
  - +1 `usePickedDocuments.test.tsx` suite
  - +7 component test suites (`PickDocumentsCard`,
    `BundledSamplesCard`, `FilesList`, `FileRow`,
    `TypeFilterControl`, `QuickLookFallback`, `IOSOnlyBanner`)
  - +1 `quicklook.test.ts` (bridge) suite
  - +1 plugin test suite (`with-documents/index.test.ts`)
  - **Total target**: **≥ +17 suites at completion** (slightly larger
    than 031's ≥ +14 because 032 has more components — the per-row
    Preview / Share / Delete affordance triples the component test
    surface — and an additional samples descriptor test).
- Final deltas reported in
  `specs/032-document-picker-quicklook/retrospective.md`.

## Progress Tracking

- [x] Spec authored and approved (`specs/032-document-picker-quicklook/spec.md`, 2026-04-29)
- [x] Plan authored — this file (Phase 0 + Phase 1 outline complete)
- [ ] Phase 0 — `research.md` written (resolves R-A through R-F with code-level detail)
- [ ] Phase 1 — `data-model.md`, `contracts/*.contract.ts`, `quickstart.md` written
- [ ] `.github/copilot-instructions.md` SPECKIT block points at this plan
- [ ] `/speckit.tasks` run; `tasks.md` written from the T001-T016 seeds above
- [ ] T001-T014 implemented; `pnpm check` green; baseline delta substituted into "Test baseline tracking"
- [ ] T015 (`pnpm check` gate) signed off
- [ ] T016 (on-device quickstart) signed off on a real iOS 11+ device
- [ ] `retrospective.md` written; final test totals substituted; merged to main

## Complexity Tracking

> No constitution violations. Section intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| _(none)_  | _(n/a)_    | _(n/a)_                              |
