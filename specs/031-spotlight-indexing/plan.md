# Implementation Plan: CoreSpotlight Indexing Module

**Branch**: `031-spotlight-indexing` | **Date**: 2026-04-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/031-spotlight-indexing/spec.md`
**Branch parent**: `030-background-tasks`

## Summary

Add an iOS 9+ CoreSpotlight showcase that indexes the existing iOS
Showcase module registry into the system Spotlight search index via
`CSSearchableIndex.default()`, demonstrates the parallel
`NSUserActivity`-driven current-state indexing path, and exposes
both surfaces side-by-side on a single screen so a reviewer can read,
operate, and verify both APIs without leaving the app. The screen
renders six panels in fixed order — `ExplainerCard`,
`IndexableItemsList`, `BulkActionsCard`, `SearchTestCard`,
`UserActivityCard`, `PersistenceNoteCard` — each driven by a single
hook (`useSpotlightIndex`) that wraps a typed JS bridge
(`src/native/spotlight.ts`) over a Swift indexer
(`native/ios/spotlight/SpotlightIndexer.swift`) and a Swift activity
helper (`native/ios/spotlight/UserActivityHelper.swift`). The bridge
exposes seven methods (`index`, `delete`, `deleteAll`, `search`,
`markCurrentActivity`, `clearCurrentActivity`, `isAvailable`); non-iOS
implementations throw a typed `SpotlightNotSupported` class so
cross-platform callers can branch cleanly. A new, idempotent,
purely-additive Expo config plugin (`plugins/with-spotlight/`)
union-merges the literal `spot.showcase.activity` into
`Info.plist`'s `NSUserActivityTypes` while preserving any prior
entries and coexisting with all eleven prior plugins
(007/013/014/019/023/025/026/027/028/029/030) in any declaration
order. `CoreSpotlight.framework` linkage is supplied by the Swift
sources' autolinking; the plugin itself is a no-op for framework
wiring. Integration is purely additive: registry +1 entry
(`spotlight-lab`), `app.json` plugins +1 entry
(`./plugins/with-spotlight`), no other module / plugin / Swift
source touched. The indexed-state mirror is in-memory only (a
`Set<string>` in the hook reducer); the system index is the
authoritative store and may evict at any time, which the
`PersistenceNoteCard` documents inline.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), Swift 5
(`@available(iOS 9.0, *)` on the indexer; `NSUserActivity` is
unconditional from iOS 8 but gated behind the same iOS 9 floor as
CoreSpotlight for surface consistency). React 19.2 + React Native
0.83 + React Compiler enabled.
**Primary Dependencies**: Expo SDK 55, expo-router (typed routes),
react-native-reanimated, `@expo/config-plugins`,
`expo-modules-core` (`requireOptionalNativeModule` — same pattern
013 / 014 / 027 / 028 / 029 / 030 already use), `CoreSpotlight`
framework (iOS 9+: `CSSearchableIndex`, `CSSearchableItem`,
`CSSearchableItemAttributeSet`, `CSSearchQuery`), `Foundation`
(`NSUserActivity`, `Set`, `JSONEncoder` for the bridge wire format),
`MobileCoreServices` / `UniformTypeIdentifiers` (`kUTTypeData`
on iOS 9–13, `UTType.data` on iOS 14+ — research §5).
**Storage**:
- **No persistent JS-side store.** The indexed-state mirror
  (`indexedIds: Set<string>`) lives entirely in the hook reducer
  and is rebuilt from a known-clean state (`new Set()`) on every
  mount (DECISION 5 / DECISION 6 / FR-102). The PersistenceNoteCard
  explains why: the system index is authoritative and may evict at
  any time, so persisting the mirror across launches would risk
  false positives.
- **System index** (`CSSearchableIndex.default()`) — owned by iOS;
  the bridge writes/reads it via `index([items])`, `delete([ids])`,
  `deleteAll()`, `search(query, limit)`. Every `CSSearchableItem`
  carries `domainIdentifier = "com.izkizk8.spot.modules"`
  (FR-022 / FR-082) so a single `deleteAll()` cleanly clears
  exactly what this module owns.
- **Active `NSUserActivity`** — held by `UserActivityHelper.swift`'s
  `private var current: NSUserActivity?` for the duration of the
  screen. Released on `clearCurrentActivity()` or on screen unmount
  via the hook's effect cleanup (FR-064 / FR-106 / SC-009).
- **Disjoint from prior namespaces.** This feature does **not** use
  AsyncStorage and does **not** write to the App Group
  `UserDefaults` (the App Group is owned by 014/027/028/029/030 and
  remains untouched). 031 adds zero new persistence keys.

**Testing**: Jest Expo + React Native Testing Library — JS-pure
tests only. The Swift surface (two new files under
`native/ios/spotlight/`) is not unit-testable on the Windows-based
dev environment used by this repository (same exemption pattern
features 007 / 013 / 014 / 027 / 028 / 029 / 030 applied; on-device
verification documented in `quickstart.md`). All native bridges are
mocked at the import boundary per FR-123 using the
`jest.isolateModules` + `jest.doMock` pattern carried forward
verbatim from `test/unit/native/background-tasks.test.ts`.
**Target Platform**: iOS 9+ (real `CSSearchableIndex` indexing +
deletion + `CSSearchQuery` + `NSUserActivity`-driven indexing). iOS
< 9 / Android / Web ship the cross-platform fallback (IOSOnlyBanner
+ ExplainerCard + PersistenceNoteCard only, per FR-011 / FR-012).
`screen.web.tsx` MUST NOT import `src/native/spotlight.ts` at module
evaluation time (FR-012 / SC-007).
**Project Type**: Mobile app (Expo) with native iOS sources
appended to the **main app target** via the existing autolinking
pipeline — strictly additive (no extension target, no entitlement
edits, no new App Group, no `pbxproj` mutation). The plugin's
mutation surface is a single `Info.plist` array
(`NSUserActivityTypes`); strictly simpler than 030's two-key
mutation (`BGTaskSchedulerPermittedIdentifiers` + `UIBackgroundModes`).
**Performance Goals**: Screen mount → first meaningful paint
< 250 ms on a mid-tier iPhone (NFR-001 / SC-002, excluding any
awaited bridge calls, which run after first paint); **Index all**
for the full registry-mapped item set < 1 s of bridge wall-clock
on a mid-tier iPhone (NFR-003 / SC-002), implemented as a single
batch call to `CSSearchableIndex` (no per-item round-trip);
toggling a single row from `not indexed` to `indexed` produces a
Spotlight-discoverable entry within 5 s of bridge resolution in
≥ 95% of attempts (SC-004; system indexing latency is
non-deterministic). Status pill updates within one render pass
(≤ 16 ms on 60 Hz) when activity state changes.
**Constraints**: Purely additive at integration level — 1 import
+ 1 array entry in `src/modules/registry.ts`, 1 plugin entry in
`app.json`, zero new runtime dependencies (NFR-005); no edits to
prior plugin / screen / Swift sources; no new App Group; no
modification of any existing entitlement; no `eslint-disable`
directives anywhere in added or modified code (FR-120);
`StyleSheet.create()` only (Constitution IV); `ThemedText` /
`ThemedView` / `Spacing` only — raw colour literals forbidden
except inside `IOSOnlyBanner`-style banners that mirror prior
modules' exact precedent (FR-124); `.android.tsx` / `.web.tsx`
splits for non-trivial platform branches (Constitution III); all
bridge mutations serialised through the hook's reducer (FR-103).
**Scale/Scope**: One module directory
(`src/modules/spotlight-lab/`), one new plugin
(`plugins/with-spotlight/`), one new bridge file
(`src/native/spotlight.ts` plus matching `.android.ts` / `.web.ts`
/ `.types.ts` siblings), two Swift files under
`native/ios/spotlight/` (`SpotlightIndexer.swift` +
`UserActivityHelper.swift`), one items-source mapper
(`searchable-items-source.ts`), one hook
(`hooks/useSpotlightIndex.ts`), seven UI components (Explainer,
IndexableItemsList, ItemRow, BulkActionsCard, SearchTestCard,
UserActivityCard, PersistenceNoteCard) plus IOSOnlyBanner,
~14 JS-pure test files. Search default limit frozen at 25
(DECISION 4 / FR-052); `domainIdentifier` frozen at
`com.izkizk8.spot.modules` (DECISION 2 / FR-022); activity type
frozen at `spot.showcase.activity` (DECISION 3 / FR-062).

**Test baseline at branch start**: carried forward from feature
030's completion totals (recorded in 030's `plan.md` /
`retrospective.md`). 030's plan.md documented an expected delta of
≥ +13 suites. 031's expected delta: **≥ +14 suites** (see "Test
baseline tracking" below — 031 has one extra test file relative to
030, the `searchable-items-source.test.ts` mapper test, which has
no analogue in 030's history-store-only persistence layer).

## Constitution Check

*Constitution version checked*: **1.1.0**
(`.specify/memory/constitution.md`). Spec NFR cross-checked against
v1.1.0 governance.

| Principle | Compliance |
|-----------|------------|
| I. Cross-Platform Parity | **PASS** — iOS 9+ ships the real `CSSearchableIndex` index/delete/search lifecycle + `NSUserActivity` mark/clear flow; Android / Web / iOS < 9 ship `IOSOnlyBanner` + `ExplainerCard` + `PersistenceNoteCard` so the catalogue card still renders and the educational copy is reachable from every platform. The user journey "open card → understand the framework" is equivalent across all targets; the platform-divergent piece (actual indexing + activity APIs) is the iOS-only surface itself. |
| II. Token-Based Theming | **PASS** — All chrome uses `ThemedView` / `ThemedText` and the `Spacing` scale from `src/constants/theme.ts`. The indexed-state badge and the activity status pill reuse the existing semantic colour tokens (`textPrimary` / `surfaceElevated` / `accent` / `success` / `muted`) — no new theme entries; the `not indexed` and `inactive` states map to the existing muted/neutral semantics. No hardcoded hex values outside the `IOSOnlyBanner` precedent. |
| III. Platform File Splitting | **PASS** — `screen.tsx` / `screen.android.tsx` / `screen.web.tsx`. Bridge has matching `spotlight.ts` / `.android.ts` / `.web.ts` / `.types.ts` variants (mirrors 029's `focus-filters.*` and 030's `background-tasks.*` layouts). `Platform.select` is permitted only for trivial style/copy diffs. The web variant explicitly avoids importing the bridge module at module-evaluation time (FR-012 / SC-007). |
| IV. StyleSheet Discipline | **PASS** — All styles via `StyleSheet.create()`; `Spacing` from theme tokens; no inline objects, no CSS-in-JS, no utility-class frameworks. |
| V. Test-First for New Features | **PASS** — JS-pure tests enumerated in AC-SPL-004..009 cover `searchable-items-source` (mapping, id uniqueness, empty-label fallback, duplicate dedup), every component, every screen variant, the `useSpotlightIndex` hook (toggle, bulk index, bulk remove, search, mark/clear activity, error channel, unmount cleanup), the bridge (typed surface, non-iOS throws, iOS delegates to mocked native module), the plugin (idempotency, `NSUserActivityTypes` union, prior-entry preservation, prior-plugin coexistence), and the manifest contract. Swift cannot be exercised on Windows; on-device verification documented in `quickstart.md`. |
| Validate-Before-Spec (workflow) | **PASS / N/A** — This is not a build-pipeline or external-service-integration feature; it is an additive in-app showcase + standard `CSSearchableIndex` / `NSUserActivity` usage. The plugin's `Info.plist` mutation surface is fully unit-testable with `@expo/config-plugins`'s `withInfoPlist` mock — no proof-of-concept `expo prebuild` is required to validate spec assumptions, and the plugin test (AC-SPL-008) closes the loop on the byte-identical-second-run claim (SC-005) without invoking the real prebuild. |

**Initial Constitution Check: PASS — no violations, no entries needed
in Complexity Tracking.**

**Re-check after Phase 1 (post-design): PASS** — the Phase 1 artifacts
(data-model, contracts, quickstart) introduce no new global stores,
no new dependencies, no new theme tokens, no inline `Platform.select`
beyond trivial style branches, and no AsyncStorage / App Group
writes. The bridge's typed-surface contract (DECISION 11 / R-A
below) keeps every iOS-only symbol strictly inside
`src/native/spotlight.ts`; non-iOS (`.android.ts` / `.web.ts`)
variants import only the shared `*.types.ts` and the typed error
class. The hook's effect-cleanup contract (FR-106 / SC-009) is
testable at one boundary.

## Project Structure

### Documentation (this feature)

```text
specs/031-spotlight-indexing/
├── plan.md              # this file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── searchable-items-source.contract.ts # Registry → SearchableItem mapper API
│   │                                        #   (mapRegistryToItems, dedupe, fallbacks,
│   │                                        #    domainIdentifier literal)
│   ├── spotlight-bridge.contract.ts         # Bridge typed surface
│   │                                        #   (index, delete, deleteAll, search,
│   │                                        #    markCurrentActivity, clearCurrentActivity,
│   │                                        #    isAvailable) + SpotlightNotSupported
│   ├── manifest.contract.ts                 # Registry entry contract
│   │                                        #   (id 'spotlight-lab', label
│   │                                        #    'Spotlight Indexing', platforms,
│   │                                        #    minIOS '9.0')
│   └── with-spotlight-plugin.contract.ts    # Plugin invariant contract
│                                            #   (NSUserActivityTypes union-merge,
│                                            #    idempotency, prior-entry preservation,
│                                            #    coexistence with 007/013/014/019/023/
│                                            #    025/026/027/028/029/030)
├── checklists/                              # (carried forward from /speckit.checklist;
│                                           #   not (re)generated by /speckit.plan)
└── tasks.md             # Phase 2 output (NOT created here)
```

### Source Code (repository root)

```text
# NEW (this feature) — TypeScript module
src/modules/spotlight-lab/
├── index.tsx                              # ModuleManifest (id 'spotlight-lab',
│                                          #   label 'Spotlight Indexing',
│                                          #   minIOS '9.0',
│                                          #   platforms ['ios','android','web'])
├── screen.tsx                             # iOS 9+ variant (six panels in fixed order)
├── screen.android.tsx                     # Android fallback
│                                          #   (IOSOnlyBanner + ExplainerCard +
│                                          #    PersistenceNoteCard)
├── screen.web.tsx                         # Web fallback (same as android; MUST NOT import
│                                          #   src/native/spotlight.ts at module load)
├── searchable-items-source.ts             # Pure mapper:
│                                          #   MODULES → SearchableItem[]
│                                          #   - id deterministic from module id
│                                          #     (`${domainIdentifier}.${module.id}`)
│                                          #   - title fallback to module.id when label empty
│                                          #   - keywords fallback to [] when missing
│                                          #   - dedupe by id; surfaces duplicates via
│                                          #     optional onError callback (R-C analogue)
├── hooks/
│   └── useSpotlightIndex.ts               # { items, indexedIds, isAvailable, isBusy,
│                                          #   error, toggleItem, indexAll, removeAll,
│                                          #   search, results, markActivity, clearActivity,
│                                          #   activityActive }; reducer-serialised bridge
│                                          #   calls (FR-103); tolerates SpotlightNotSupported
│                                          #   (degrades; never propagates to UI); unmount
│                                          #   cleanup invalidates active activity (FR-106)
└── components/
    ├── ExplainerCard.tsx                  # Prose: CSSearchableIndex vs. NSUserActivity;
    │                                      #   "swipe down on home → search 'spot showcase'"
    │                                      #   recipe; static, renders on every platform
    ├── IndexableItemsList.tsx             # FlatList of items mapped from the registry;
    │                                      #   delegates rendering to ItemRow
    ├── ItemRow.tsx                        # Per-row UI: title, contentDescription,
    │                                      #   keyword chips, IndexedState badge, per-row
    │                                      #   toggle (disabled while bulk pending)
    ├── BulkActionsCard.tsx                # "Index all" + "Remove all from index" CTAs;
    │                                      #   pending indicator while any bulk in flight
    │                                      #   (FR-043)
    ├── SearchTestCard.tsx                 # Text input + "Search Spotlight" CTA (disabled
    │                                      #   while empty or in flight); results list
    │                                      #   below; explicit empty-state line (FR-053)
    ├── UserActivityCard.tsx               # "Mark this screen as current activity" + "Clear
    │                                      #   current activity" CTAs; status pill
    │                                      #   active/inactive; embedded comparison block
    ├── PersistenceNoteCard.tsx            # Static prose: system-managed eviction;
    │                                      #   re-index from stable source on mount
    │                                      #   (FR-070 / FR-071)
    └── IOSOnlyBanner.tsx                  # "Spotlight indexing requires iOS 9+"; rendered
                                           #   on Android / Web / iOS < 9 (FR-011 / FR-012 /
                                           #   FR-013); also rendered on iOS when
                                           #   isAvailable() reports false (EC-002)

# NEW (this feature) — Swift sources, appended to MAIN APP TARGET (autolinked)
native/ios/spotlight/
├── SpotlightIndexer.swift                 # @available(iOS 9.0, *) enum / class wrapping
│                                          #   CSSearchableIndex.default(). Builds a
│                                          #   CSSearchableItemAttributeSet(itemContentType:
│                                          #   kUTTypeData / UTType.data on iOS 14+) for
│                                          #   each SearchableItem (FR-081). Sets
│                                          #   domainIdentifier = "com.izkizk8.spot.modules"
│                                          #   on every CSSearchableItem (FR-082). Exposes
│                                          #   index, delete, deleteAll, search via the JS
│                                          #   bridge. search(query:limit:) runs a
│                                          #   CSSearchQuery with queryString derived from
│                                          #   the input plus the standard attribute key
│                                          #   projection (title, contentDescription,
│                                          #   keywords) and resolves with the mapped
│                                          #   SearchableItem[] capped at limit (FR-083).
└── UserActivityHelper.swift               # Creates NSUserActivity(activityType:
                                           #   "spot.showcase.activity") with title,
                                           #   keywords as Set<String>, userInfo; sets
                                           #   isEligibleForSearch = true and
                                           #   isEligibleForPrediction = true; calls
                                           #   becomeCurrent(); retains for invalidation
                                           #   (FR-084). invalidate() calls resignCurrent()
                                           #   then invalidate() and releases the retained
                                           #   activity (FR-085).

# NEW (this feature) — Expo config plugin
plugins/with-spotlight/
├── index.ts                               # ConfigPlugin: composes withInfoPlist mutation;
│                                          #   union-merges NSUserActivityTypes with the
│                                          #   single literal "spot.showcase.activity"
│                                          #   while preserving every prior entry
│                                          #   (FR-110 / EC-007). Idempotent +
│                                          #   commutative (FR-112 / FR-113).
└── package.json

# NEW (this feature) — JS bridge (mirrors 030's background-tasks.* layout)
src/native/spotlight.ts                    # iOS impl: requireOptionalNativeModule
                                           #   ('Spotlight') + Platform.OS === 'ios' gate;
                                           #   exports index, delete, deleteAll, search,
                                           #   markCurrentActivity, clearCurrentActivity,
                                           #   isAvailable, and the SpotlightNotSupported
                                           #   class (FR-090 / FR-091 / FR-092). All
                                           #   mutating methods serialise through a single
                                           #   in-memory promise chain so concurrent calls
                                           #   don't interleave (supports FR-103).
src/native/spotlight.android.ts            # isAvailable() returns false; every other
                                           #   method throws SpotlightNotSupported (FR-091).
src/native/spotlight.web.ts                # Same as android.ts.
src/native/spotlight.types.ts              # SpotlightBridge interface;
                                           #   SearchableItem / UserActivityDescriptor /
                                           #   IndexedState / ActivityState type exports;
                                           #   SpotlightNotSupported class declaration. No
                                           #   global symbol collisions with prior bridges
                                           #   (013's app-intents, 014/027/028's
                                           #   widget-center, 029's focus-filters,
                                           #   030's background-tasks).

# MODIFIED (additive only)
src/modules/registry.ts                    # +1 import line, +1 array entry
                                           #   (spotlightLab) — registry size +1
app.json                                   # +1 plugins entry:
                                           #   "./plugins/with-spotlight"

# UNTOUCHED (deliberately — verified non-regression in tests)
plugins/with-live-activity/**              # 007-owned; not modified
plugins/with-app-intents/**                # 013-owned; not modified
plugins/with-home-widgets/**               # 014-owned; not modified
plugins/with-sign-in-with-apple/**         # 019-owned; not modified
plugins/with-keychain/**                   # 023-owned; not modified
plugins/with-core-location/**              # 025-owned; not modified
plugins/with-rich-notifications/**         # 026-owned; not modified
plugins/with-lock-widgets/**               # 027-owned; not modified
plugins/with-standby-widget/**             # 028-owned; not modified
plugins/with-focus-filters/**              # 029-owned; not modified
plugins/with-background-tasks/**           # 030-owned; not modified — its
                                           #   BGTaskSchedulerPermittedIdentifiers and
                                           #   UIBackgroundModes augmentations are
                                           #   preserved verbatim by 031's plugin
                                           #   (which only touches NSUserActivityTypes)
native/ios/{app-intents,widgets,focus-filters,background-tasks}/**
                                           # 013/014/027/028/029/030-owned; not modified
src/native/{app-intents,widget-center,focus-filters,background-tasks}.*
                                           # 013/014/027/028/029/030-owned; not modified
src/modules/{intents-lab,widgets-lab,lock-widgets-lab,standby-lab,focus-filters-lab,
             background-tasks-lab,...}/**  # All prior modules untouched
ios-widget/**                              # 014/027/028-owned widget extension; NOT touched

# Tests (NEW)
test/unit/modules/spotlight-lab/
├── manifest.test.ts                        # id 'spotlight-lab', label
│                                            #   'Spotlight Indexing', platforms
│                                            #   ['ios','android','web'], minIOS '9.0'
│                                            #   (AC-SPL-009)
├── searchable-items-source.test.ts         # registry → SearchableItem[]; ids unique;
│                                            #   required fields populated; empty-label
│                                            #   fallback (title ← module.id; keywords ← []);
│                                            #   duplicate-id de-duplication; onError
│                                            #   callback exactly once per duplicate
│                                            #   (AC-SPL-005 / FR-020..024 / EC-003 / EC-004)
├── screen.test.tsx                         # iOS flow: 6 panels in order; isAvailable()
│                                            #   false → IOSOnlyBanner variant; isolation
│                                            #   from 013/014/027/028/029/030 paths
├── screen.android.test.tsx                 # Android: banner + explainer +
│                                            #   persistence-note only; indexing CTAs
│                                            #   absent; bridge throws path tolerated
├── screen.web.test.tsx                     # Web: same render set as android; assert that
│                                            #   src/native/spotlight.ts is NOT pulled in
│                                            #   by the web bundle (SC-007)
├── hooks/
│   └── useSpotlightIndex.test.tsx          # mount: items initialised from source;
│                                            #   toggleItem on/off calls index/delete;
│                                            #   indexAll calls index(items); removeAll
│                                            #   calls deleteAll; search resolves with
│                                            #   mocked SearchableItem[]; markActivity /
│                                            #   clearActivity drive activityActive;
│                                            #   per-row toggles disabled while bulk
│                                            #   pending; rejections revert state and
│                                            #   surface on error; unmount with active
│                                            #   activity calls clearCurrentActivity
│                                            #   (AC-SPL-006 / FR-100..106 / EC-009 /
│                                            #   SC-009)
└── components/
    ├── ExplainerCard.test.tsx              # mentions CSSearchableIndex + NSUserActivity
    │                                        #   + the home-screen test recipe; renders on
    │                                        #   every platform
    ├── IndexableItemsList.test.tsx         # renders 0 / 1 / N rows; delegates to ItemRow
    ├── ItemRow.test.tsx                    # title + description + keyword chips + badge +
    │                                        #   toggle; toggle disabled while bulk in
    │                                        #   flight (FR-030..033)
    ├── BulkActionsCard.test.tsx            # both CTAs visible; tap calls indexAll /
    │                                        #   removeAll; both disabled while pending
    │                                        #   (FR-040..043)
    ├── SearchTestCard.test.tsx             # input + CTA; CTA disabled while empty or
    │                                        #   in flight; results render; empty-state
    │                                        #   line on zero matches; rejection clears
    │                                        #   results (FR-050..054)
    ├── UserActivityCard.test.tsx           # CTAs visible; status pill toggles
    │                                        #   active/inactive (FR-060..063)
    ├── PersistenceNoteCard.test.tsx        # static copy mentions system-managed eviction
    │                                        #   + re-index recommendation (FR-070..071)
    └── IOSOnlyBanner.test.tsx              # message string; copy variant when
                                              #   isAvailable() false on iOS (system
                                              #   disabled / older OS) (FR-013)
test/unit/native/
└── spotlight.test.ts                       # iOS path delegates to mocked native module +
                                              #   serialises concurrent mutations; non-iOS
                                              #   throws SpotlightNotSupported on every
                                              #   method except isAvailable (returns false);
                                              #   typed surface matches the contract
                                              #   (AC-SPL-007)
test/unit/plugins/
└── with-spotlight/
    └── index.test.ts                        # full pipeline:
                                              #   (a) adds 'spot.showcase.activity' to
                                              #       NSUserActivityTypes (creates the array
                                              #       when absent);
                                              #   (b) idempotent on second run
                                              #       (byte-identical);
                                              #   (c) preserves prior NSUserActivityTypes
                                              #       entries by union-merge (toEqual,
                                              #       not toContain);
                                              #   (d) coexists with 007/013/014/019/023/
                                              #       025/026/027/028/029/030 plugins in
                                              #       declaration order;
                                              #   (e) commutative across a sampled set of
                                              #       plugin orderings (≥3 non-trivial
                                              #       permutations);
                                              #   (AC-SPL-008 / FR-110..113 / SC-005 /
                                              #       SC-008)
```

**Structure Decision**: Mirrors **030's** `Expo + iOS-main-app-target`
shape. Differences from 030:

1. **Different framework / API class** — `CSSearchableIndex` +
   `NSUserActivity` instead of `BGTaskScheduler`. The Swift surface
   splits across two files (`SpotlightIndexer.swift` for the
   batch-index lifecycle, `UserActivityHelper.swift` for the
   current-state activity lifecycle); 030 was a single
   `BackgroundTaskManager.swift`. The split mirrors the spec's
   conceptual division of the two indexing paths (the
   ExplainerCard's central pedagogical point) and keeps each Swift
   file scoped to a single Apple framework class.
2. **No persistence layer on the JS side** — 030 maintained both an
   AsyncStorage history (`spot.bgtasks.history`) and an App Group
   `LastRunSnapshot` (`spot.bgtasks.lastRun`). 031 has neither: the
   indexed-state mirror is in-memory only (DECISION 5), and the
   activity lifecycle is bound to the screen's mount lifetime
   (DECISION 10 / FR-106 / SC-009). This is a simplification, not
   an omission — the system index is authoritative (PersistenceNoteCard
   documents this), and persisting a JS-side mirror would risk false
   positives across launches due to system eviction (EC-006).
3. **Bridge surface is mixed read/write** — 030's bridge was mostly
   write-side (schedule / cancelAll); 031 has four mutating methods
   (`index`, `delete`, `deleteAll`, `markCurrentActivity` /
   `clearCurrentActivity`) and one read method (`search`) plus
   `isAvailable`. Concurrent-mutation serialisation lives at the
   bridge layer (single in-memory promise chain, identical to 030
   R-A), inherited verbatim from 030's `enqueue` helper.
4. **Plugin scope is a single `Info.plist` key** —
   `NSUserActivityTypes` only. 030's plugin mutated two keys
   (`BGTaskSchedulerPermittedIdentifiers` + `UIBackgroundModes`).
   `CoreSpotlight.framework` linkage comes from autolinking; the
   plugin is a no-op for framework wiring (FR-111). This makes 031's
   plugin strictly simpler than 030's, with a smaller commutativity
   matrix and a smaller idempotency surface.
5. **Two Swift files, no lldb instructions** — 030 documented the
   `_simulateLaunchForTaskWithIdentifier` lldb private-API trigger
   because `BGTaskScheduler` cannot be naturally launched on demand.
   031's verification path is the home-screen Spotlight UI itself —
   the user opens iOS Spotlight Search and types `spot showcase`.
   No lldb step, no private-API caveat. The `quickstart.md`
   verification recipe is correspondingly simpler.

## Resolved [NEEDS CLARIFICATION] markers

The user marked themselves unavailable for clarification. The
following decisions were resolved autonomously by the most
reasonable additive interpretation, consistent with prior features
(025–030). Recorded in spec.md §"Open Questions (resolved)" and
inherited verbatim here for traceability:

| # | Question | Resolution | Spec ref |
|---|----------|------------|----------|
| 1 | Registry id and label | `id: 'spotlight-lab'`, label `'Spotlight Indexing'` (matches `<feature>-lab` convention from 028/029/030) | DECISION 1 |
| 2 | `domainIdentifier` literal | `"com.izkizk8.spot.modules"` (derived from `app.json` bundle id `com.izkizk8.spot`); single namespace makes `deleteAll()` clean up exactly what this module owns | DECISION 2 / FR-022 |
| 3 | Activity type literal | `"spot.showcase.activity"`; frozen in `NSUserActivityTypes` by the plugin and referenced by `UserActivityHelper.swift` | DECISION 3 / FR-062 |
| 4 | Search default `limit` | **25** results (enough to demonstrate multiple matches without flooding small-device screens) | DECISION 4 / FR-052 |
| 5 | In-memory mirror of indexed state | Best-effort `Set<string>` in the hook reducer; not persisted (system index is authoritative; eviction makes a persisted mirror risk false positives) | DECISION 5 / FR-102 |
| 6 | Indexed-state on mount | Do NOT auto-index; badges start at `not indexed` on every mount; user must explicitly tap **Index all** or per-row toggles | DECISION 6 |
| 7 | Cross-platform behaviour | Card registered for all platforms; Android/Web render IOSOnlyBanner + ExplainerCard + PersistenceNoteCard; bridge not imported on web path | DECISION 7 / FR-011 / FR-012 |
| 8 | Android App Search | Deferred (v2); Android bridge stub throws on every method | DECISION 8 / FR-091 / NG-003 |
| 9 | Activity userInfo | Fixed to `{ source: 'spotlight-lab' }` (deterministic, PII-free) | DECISION 9 / FR-061 / NFR-004 |
| 10 | Activity lifecycle | Invalidated on screen unmount via the hook's effect cleanup (Apple-recommended) | DECISION 10 / FR-064 / FR-106 / SC-009 |
| 11 | Bridge platform splitting | `spotlight.ts` (iOS), `spotlight.web.ts`, `spotlight.android.ts`, `spotlight.types.ts` (mirrors 030 verbatim) | DECISION 11 / FR-093 |
| 12 | Plugin merge semantics | Union-merge with prior-entry preservation; never removes / reorders prior entries (mirrors 030's `UIBackgroundModes` policy) | DECISION 12 / FR-110 / FR-113 |
| 13 | Empty-query search | Disabled at the CTA level; user cannot submit (avoids ambiguous "no results" vs. "no query" state) | DECISION 13 / FR-051 / EC-005 |
| 14 | Error surfacing | All hook-level errors flow through a single `error` field on the hook return (consistent with 028/029/030); no screen-level error boundary | DECISION 14 / FR-104 |
| 15 | `kUTTypeData` vs `UTType` | Swift indexer uses `kUTTypeData` on iOS 9–13 and `UTType.data` on iOS 14+; choice is at the Swift implementation layer and does not affect the bridge contract | DECISION 15 / FR-081 |

Plan-level decisions made beyond the spec-resolved set (locked in
`research.md`):

- **R-A**: Bridge-level serialisation of concurrent mutations.
  `src/native/spotlight.ts` exposes a closure-scoped
  `let chain: Promise<unknown> = Promise.resolve();`; every
  mutating method (`index`, `delete`, `deleteAll`,
  `markCurrentActivity`, `clearCurrentActivity`) wraps its native
  call through `enqueue(...)` (same shape as 030 R-A). Read-only
  `search` and `isAvailable` are NOT serialised. Errors are
  preserved for the caller; the chain is detoxified by an internal
  `chain.catch(...)` so a rejected mutation does not poison
  subsequent calls. See research §1.
- **R-B**: `searchable-items-source.ts` is a **pure function** —
  no React imports, no I/O. It accepts the registry as an argument
  (or pulls `MODULES` from `src/modules/registry.ts` at the
  call-site only) so tests can inject a deterministic registry.
  Empty-label fallback (`title ← module.id`, `keywords ← []`) and
  duplicate-id dedup are applied in a single pass; duplicates
  surface via an optional `onError(duplicateId: string)` callback
  invoked exactly once per duplicate, mirroring 030's R-C error
  funnel. See research §2.
- **R-C**: The hook's effect-cleanup contract for `NSUserActivity`
  invalidation. `useSpotlightIndex` retains `activityActive` in
  reducer state; the `useEffect` cleanup checks the **latest**
  reducer value via a `ref` (not the closure-captured value) so
  unmount-after-late-tap correctly invalidates the activity. The
  test (`useSpotlightIndex.test.tsx`) exercises mount → tap mark →
  unmount → assert `clearCurrentActivity` was called. See research §3.
- **R-D**: The plugin's union-merge over `NSUserActivityTypes`
  preserves source order of prior entries (per FR-113 wording
  "no prior plugin's keys are removed, reordered, or overwritten").
  Implementation is `[...prior, …missing]` not `[…sorted set]`;
  test assertion uses `toEqual` against the exact expected
  superset shape rather than `toContain`. Inherited verbatim from
  030 R-D. See research §4.
- **R-E**: The plugin does **not** add `CoreSpotlight.framework`
  linkage to `pbxproj`. Framework wiring is supplied by the Swift
  module's autolinking pipeline (the project's existing
  `native/ios/*` autolinker resolves `import CoreSpotlight` /
  `import CoreServices` / `import UniformTypeIdentifiers`
  automatically). Keeping the plugin scoped to exactly one
  `Info.plist` key (`NSUserActivityTypes`) makes coexistence and
  commutativity (T008 (d) (e)) trivially satisfiable. See research §5.

## Phased file inventory

### Phase 0 — Research (no code; produces research.md only)

NEW files:
- `specs/031-spotlight-indexing/research.md`

### Phase 1 — Design contracts (no app code; produces docs only)

NEW files:
- `specs/031-spotlight-indexing/data-model.md`
- `specs/031-spotlight-indexing/quickstart.md`
- `specs/031-spotlight-indexing/contracts/searchable-items-source.contract.ts`
- `specs/031-spotlight-indexing/contracts/spotlight-bridge.contract.ts`
- `specs/031-spotlight-indexing/contracts/manifest.contract.ts`
- `specs/031-spotlight-indexing/contracts/with-spotlight-plugin.contract.ts`

MODIFIED:
- `.github/copilot-instructions.md` — update the
  `<!-- SPECKIT START -->` / `<!-- SPECKIT END -->` block's plan
  reference from `specs/030-background-tasks/plan.md` to
  `specs/031-spotlight-indexing/plan.md` (Phase 1 step 3 of
  `/speckit.plan`).

### Phase 2 — Tasks (out of scope for /speckit.plan; sketched here for tasks.md)

NEW (TypeScript / tests):

- `src/modules/spotlight-lab/index.tsx`
- `src/modules/spotlight-lab/screen.tsx`
- `src/modules/spotlight-lab/screen.android.tsx`
- `src/modules/spotlight-lab/screen.web.tsx`
- `src/modules/spotlight-lab/searchable-items-source.ts`
- `src/modules/spotlight-lab/hooks/useSpotlightIndex.ts`
- `src/modules/spotlight-lab/components/ExplainerCard.tsx`
- `src/modules/spotlight-lab/components/IndexableItemsList.tsx`
- `src/modules/spotlight-lab/components/ItemRow.tsx`
- `src/modules/spotlight-lab/components/BulkActionsCard.tsx`
- `src/modules/spotlight-lab/components/SearchTestCard.tsx`
- `src/modules/spotlight-lab/components/UserActivityCard.tsx`
- `src/modules/spotlight-lab/components/PersistenceNoteCard.tsx`
- `src/modules/spotlight-lab/components/IOSOnlyBanner.tsx`
- `src/native/spotlight.ts`
- `src/native/spotlight.android.ts`
- `src/native/spotlight.web.ts`
- `src/native/spotlight.types.ts`
- `test/unit/modules/spotlight-lab/manifest.test.ts`
- `test/unit/modules/spotlight-lab/searchable-items-source.test.ts`
- `test/unit/modules/spotlight-lab/screen.test.tsx`
- `test/unit/modules/spotlight-lab/screen.android.test.tsx`
- `test/unit/modules/spotlight-lab/screen.web.test.tsx`
- `test/unit/modules/spotlight-lab/hooks/useSpotlightIndex.test.tsx`
- `test/unit/modules/spotlight-lab/components/ExplainerCard.test.tsx`
- `test/unit/modules/spotlight-lab/components/IndexableItemsList.test.tsx`
- `test/unit/modules/spotlight-lab/components/ItemRow.test.tsx`
- `test/unit/modules/spotlight-lab/components/BulkActionsCard.test.tsx`
- `test/unit/modules/spotlight-lab/components/SearchTestCard.test.tsx`
- `test/unit/modules/spotlight-lab/components/UserActivityCard.test.tsx`
- `test/unit/modules/spotlight-lab/components/PersistenceNoteCard.test.tsx`
- `test/unit/modules/spotlight-lab/components/IOSOnlyBanner.test.tsx`
- `test/unit/native/spotlight.test.ts`
- `test/unit/plugins/with-spotlight/index.test.ts`

NEW (Swift, linked into main app target via existing autolinking):

- `native/ios/spotlight/SpotlightIndexer.swift`
- `native/ios/spotlight/UserActivityHelper.swift`

NEW (plugin):

- `plugins/with-spotlight/index.ts`
- `plugins/with-spotlight/package.json`

MODIFIED (additive only):

- `src/modules/registry.ts` (+1 import, +1 array entry)
- `app.json` (+1 plugins entry `./plugins/with-spotlight`)

UNTOUCHED (verified non-regression in tests):

- `plugins/with-{live-activity,app-intents,home-widgets,
   sign-in-with-apple,keychain,core-location,rich-notifications,
   lock-widgets,standby-widget,focus-filters,background-tasks}/**`
  — every file byte-identical.
- `native/ios/{app-intents,widgets,focus-filters,background-tasks,…}/**`
  — byte-identical.
- `src/native/{app-intents,widget-center,focus-filters,background-tasks}.*`
  — byte-identical.
- `src/modules/{intents-lab,widgets-lab,lock-widgets-lab,
   standby-lab,focus-filters-lab,background-tasks-lab,…}/**`
  — byte-identical.
- `ios-widget/**` — byte-identical (this feature explicitly does
  not touch the widget extension target).

## Task seeds for tasks.md

These are sketches for the `/speckit.tasks` step, ordered by
dependency. The full enumeration belongs in `tasks.md`; these are
intentionally coarse so `/speckit.tasks` can split each into RED →
GREEN → REFACTOR sub-tasks.

1. **T001 — Bridge types + non-iOS stubs (RED-first)**:
   `src/native/spotlight.types.ts` declares `SpotlightBridge`
   interface + `SpotlightNotSupported` class + `SearchableItem` /
   `UserActivityDescriptor` / `IndexedState` / `ActivityState` types.
   `src/native/spotlight.android.ts` and
   `src/native/spotlight.web.ts` throw on every method except
   `isAvailable()` (which returns `false`). Tests assert no symbol
   collision with `app-intents.ts` / `widget-center.ts` /
   `focus-filters.ts` / `background-tasks.ts` (FR-090..093).
2. **T002 — iOS bridge**:
   `src/native/spotlight.ts` implements the iOS path
   (`requireOptionalNativeModule('Spotlight')` + `Platform.OS ===
   'ios'` gate + closure-scoped serialisation chain per R-A);
   tests in `native/spotlight.test.ts` (AC-SPL-007).
3. **T003 — Searchable-items source mapper**:
   `src/modules/spotlight-lab/searchable-items-source.ts` —
   pure function `mapRegistryToItems(registry, opts?)` returning
   `SearchableItem[]`. Tests in `searchable-items-source.test.ts`
   (AC-SPL-005 / FR-020..024 / EC-003 / EC-004).
4. **T004 — Manifest**:
   `src/modules/spotlight-lab/index.tsx` + `manifest.test.ts`
   (asserts id `'spotlight-lab'`, label `'Spotlight Indexing'`,
   platforms `['ios','android','web']`, `minIOS: '9.0'`)
   (AC-SPL-009).
5. **T005 — Hook**:
   `hooks/useSpotlightIndex.ts` returning the typed surface in
   FR-100; reducer-serialised UI state per FR-103; effect cleanup
   invalidates active activity per R-C / FR-106. Tests in
   `useSpotlightIndex.test.tsx` (AC-SPL-006); mock the bridge.
6. **T006 — Components, top-down RED**: write component tests first
   (Explainer, IndexableItemsList, ItemRow, BulkActionsCard,
   SearchTestCard, UserActivityCard, PersistenceNoteCard,
   IOSOnlyBanner); then implement against them. IndexedState badge
   state machine asserted at the ItemRow level; activity status pill
   asserted at the UserActivityCard level; bulk-pending toggle
   disabling asserted at the BulkActionsCard + ItemRow boundary
   (FR-032 / FR-043).
7. **T007 — Screens**: implement `screen.tsx`, `screen.android.tsx`,
   `screen.web.tsx` with full panel ordering per FR-010..013;
   tests assert layout order, banner visibility, hidden panels on
   non-iOS, isolation from prior modules' paths, and that
   `screen.web.tsx` does NOT pull `src/native/spotlight.ts`
   into the bundle (SC-007).
8. **T008 — Plugin**: write
   `plugins/with-spotlight/{index.ts,package.json}` and tests
   (`with-spotlight/index.test.ts`). Tests must cover:
   (a) appends `'spot.showcase.activity'` to `NSUserActivityTypes`;
   creates the array when absent; (b) idempotent on second run
   (byte-identical); (c) preserves prior `NSUserActivityTypes`
   entries by union-merge (`toEqual`, not `toContain`);
   (d) coexists with all eleven prior plugins
   (007/013/014/019/023/025/026/027/028/029/030) in declaration
   order; (e) commutativity across ≥3 sampled orderings (AC-SPL-008
   / SC-005 / SC-008 / FR-110..113).
9. **T009 — Swift sources**: write
   `SpotlightIndexer.swift` + `UserActivityHelper.swift` under
   `native/ios/spotlight/`. The indexer wraps
   `CSSearchableIndex.default()` and exposes `index` / `delete` /
   `deleteAll` / `search` to the JS bridge with
   `domainIdentifier = "com.izkizk8.spot.modules"` on every item
   (FR-080..083). The activity helper creates / retains /
   invalidates an `NSUserActivity(activityType:
   "spot.showcase.activity")` (FR-084..085). No JS tests here
   (Constitution V exemption); on-device verification in
   `quickstart.md`.
10. **T010 — Registry hook-up**: append `spotlightLab` import +
    array entry to `src/modules/registry.ts`. Update
    `test/unit/modules/registry.test.ts` if it asserts a fixed
    length.
11. **T011 — `app.json` plugin entry**: add
    `./plugins/with-spotlight` to the `plugins` array.
12. **T012 — `pnpm check` gate**: lint + typecheck + tests must
    be green; no `eslint-disable` directives anywhere; `pnpm
    format` is a no-op after the final commit. Report delta from
    030's closing baseline (AC-SPL-010 / FR-120..124).
13. **T013 — On-device verification**: execute `quickstart.md`
    checklist on a real iOS 9+ device (open card → toggle a row
    → swipe down on home screen → search the title → see the
    result; **Index all** → search `spot showcase` → see multiple
    results; **Mark current activity** → swipe down on home
    screen → search the screen title → see the activity-driven
    entry; **Clear** → re-search → entry disappears).

## Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|------------|--------|------------|
| R1 | **Plugin idempotency drift** — `expo prebuild` run twice produces a duplicated `'spot.showcase.activity'` entry in `NSUserActivityTypes`. | Medium | Medium (Xcode does not warn on duplicates here, but a duplicated activity type still routes correctly; the spec's byte-identical claim breaks). | Union-merge skips entries already present (`if (!arr.includes(v)) arr.push(v)`). Test (b) asserts byte-identical Info.plist on second run via `toEqual`. SC-005 measurable. |
| R2 | **Prior-plugin clobbering** — 031's plugin overwrites a hypothetical prior `NSUserActivityTypes` entry (none exist in the current pipeline, but a fork might add one for, e.g., a Siri shortcut). | Low | Medium (silent loss of prior shortcut routing). | Union-merge preserves every prior entry by source order; test (c) seeds a synthetic prior entry and asserts `toEqual([priorEntry, 'spot.showcase.activity'])`. EC-007 enumerated; FR-110 / FR-113 mandate the contract. |
| R3 | **Bridge concurrency anomaly** — two rapid taps on the same per-row toggle (or a per-row toggle while a bulk action is in flight) produce two parallel awaits that interleave, leaving `indexedIds` inconsistent. | Medium | Low (badge briefly wrong; resolves on next toggle). | Per R-A, bridge serialises through a closure-scoped promise chain; hook reducer additionally serialises UI state per FR-103; test asserts two back-to-back `index` calls produce exactly two native invocations in submission order. EC-001 enumerated. The bulk-vs-row interaction is additionally guarded at the UI level: per-row toggles are disabled while any bulk action is pending (FR-032 / FR-043). |
| R4 | **`NSUserActivity` outlives the screen** — user marks the screen, navigates away without tapping Clear, the activity stays current and continues to be indexed by Spotlight despite the screen being unmounted. | Medium | Medium (false positives in Spotlight; user-visible drift between status pill state and reality). | Per R-C / FR-106 / SC-009, the hook's `useEffect` cleanup invalidates the activity using a `ref`-tracked latest reducer value; test exercises mount → mark → unmount → assert `clearCurrentActivity` was called. DECISION 10 documents the contract. |
| R5 | **System eviction during demo** — between the badge flipping to `indexed` and the user running the in-app `CSSearchQuery`, iOS evicts the item; the search returns fewer matches than the badge suggests. | Medium | Low (educational gap, not a bug). | EC-006 enumerated; PersistenceNoteCard explicitly documents that the system index is a cache, not a store. The on-mount re-index recommendation (DECISION 6) gives the user an obvious recovery path: tap **Index all** to refresh the system index from the registry. |
| R6 | **`isAvailable()` false on iOS due to MDM** — corporate MDM disables Spotlight; the bridge reports `false` but the screen still tries to render the indexing/search/activity panels. | Low | Low (panels render but bridge calls fail noisily on the error channel). | EC-002 enumerated; FR-013 mandates that the iOS screen renders IOSOnlyBanner when `isAvailable()` returns false, with copy explaining the system-disabled case. The IOSOnlyBanner test asserts the alternate copy variant. |
| R7 | **`kUTTypeData` deprecation on iOS 14+** — building against the iOS 14 SDK with `kUTTypeData` produces a deprecation warning that fails the project's strict-warnings build setting. | Low | Low (build warning, not error; trivially fixed). | DECISION 15 / FR-081 / R-E: the Swift indexer branches on `#available(iOS 14.0, *)` and uses `UTType.data` on the modern path, falling back to `kUTTypeData` (with `import MobileCoreServices`) on iOS 9–13. The branch is at the Swift implementation layer and is not exposed to the JS bridge contract. |
| R8 | **Bundle id drift in fork** — a downstream fork changes `expo.ios.bundleIdentifier` but forgets to update the `domainIdentifier` literal in Swift / TS / plugin. | Low | Medium (Spotlight items collide with another app's namespace if the new bundle id matches). | DECISION 2 freezes the literal `com.izkizk8.spot.modules`; ExplainerCard does not mention the literal directly (it's an implementation detail), but the Swift indexer references the same constant TS-side as well. If a fork wants to support a different bundle id, the indexer source + the bridge constant + (optionally) the plugin's activity-type literal `spot.showcase.activity` must be updated in tandem. Out-of-scope for v1. |
| R9 | **Bridge module-name collision** — adding `'Spotlight'` to the shared `requireOptionalNativeModule` registry collides with a future Apple-shipped `Spotlight` framework wrapper or a third-party library. | Very Low | Low (test churn only). | Distinct native module name `'Spotlight'` (registered by the Swift `Module` definition); test asserts the lookup is exactly `'Spotlight'`. No conflict with prior modules' names (`'AppIntents'`, `'WidgetCenter'`, `'FocusFilters'`, `'BackgroundTasks'`). |
| R10 | **Empty-label fallback masks data quality issues** — a registry entry with an empty label silently maps to `title = module.id`, which the user sees as a gibberish entry in Spotlight. | Low | Low (cosmetic; no functional regression). | EC-004 enumerates; the IndexedState badge clarifies "(minimal metadata)" when fallback is applied; the source mapper exposes the fallback decision via the optional `onError` callback so the hook can surface a single warning per session. R-B documents the funnel. |

## Test baseline tracking

- **Branch start**: carried forward from feature 030's completion
  totals (recorded in 030's `plan.md` / `retrospective.md`).
  030's plan.md documented an expected delta of ≥ +13 suites.
  031's T012 will substitute the actual 030 close numbers into
  this section before the merge commit.
- **Expected delta** (sketch, finalised in `tasks.md`):
  - +1 `manifest.test.ts` suite
  - +1 `searchable-items-source.test.ts` suite
  - +3 `screen.{ios,android,web}.test.tsx` suites
  - +1 `useSpotlightIndex.test.tsx` suite
  - +8 component test suites (Explainer, IndexableItemsList,
    ItemRow, BulkActionsCard, SearchTestCard, UserActivityCard,
    PersistenceNoteCard, IOSOnlyBanner)
  - +1 `spotlight.test.ts` (bridge) suite
  - +1 plugin test suite (`with-spotlight/index.test.ts`)
  - **Total target**: **≥ +14 suites at completion** (one more
    than 030's ≥ +13 because 031 has the
    `searchable-items-source.test.ts` mapper test, which has no
    analogue in 030's history-store-only persistence layer; 031
    also has two more component tests — IndexableItemsList /
    ItemRow / SearchTestCard / UserActivityCard /
    PersistenceNoteCard vs. 030's flatter component set — but
    fewer total than 029's ≥ +16 because 031 has no
    commutativity-matrix split file).
- Final deltas reported in
  `specs/031-spotlight-indexing/retrospective.md`.

## Progress Tracking

- [x] Spec authored and approved (`specs/031-spotlight-indexing/spec.md`, 2026-04-29)
- [x] Plan authored — this file (Phase 0 + Phase 1 outline complete)
- [x] Phase 0 — `research.md` written (resolves R-A through R-E with code-level detail)
- [x] Phase 1 — `data-model.md`, `contracts/*.contract.ts`, `quickstart.md` written
- [x] `.github/copilot-instructions.md` SPECKIT block points at this plan
- [ ] `/speckit.tasks` run; `tasks.md` written from the T001-T013 seeds above
- [ ] T001-T011 implemented; `pnpm check` green; baseline delta substituted into "Test baseline tracking"
- [ ] T012 (`pnpm check` gate) signed off
- [ ] T013 (on-device quickstart) signed off on a real iOS 9+ device
- [ ] `retrospective.md` written; final test totals substituted; merged to main

## Complexity Tracking

> No constitution violations. Section intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| _(none)_  | _(n/a)_    | _(n/a)_                              |
