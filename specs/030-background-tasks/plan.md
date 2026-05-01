# Implementation Plan: BackgroundTasks Framework Module

**Branch**: `030-background-tasks` | **Date**: 2026-04-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/030-background-tasks/spec.md`
**Branch parent**: `029-focus-filters`

## Summary

Add an iOS 13+ `BGTaskScheduler` showcase that registers two demo
identifiers (`com.izkizk8.spot.refresh` for `BGAppRefreshTask` and
`com.izkizk8.spot.processing` for `BGProcessingTask`), exposes a
single screen with five panels (explainer, schedule-app-refresh
card, schedule-processing card, run-history list, lldb test-trigger
card), persists run history to AsyncStorage under
`spot.bgtasks.history` (FIFO, capped at 20), and writes a
`LastRunSnapshot` to App Group `UserDefaults` under
`spot.bgtasks.lastRun` so handler executions survive app suspension
and surface on the next foreground. The native side (`native/ios/
background-tasks/BackgroundTaskManager.swift`) registers both
handlers in `application(_:didFinishLaunchingWithOptions:)`, runs
small simulated workloads (≤2s refresh / ≤5s processing) with
correct `expirationHandler` + `setTaskCompleted(success:)`
discipline, and posts a best-effort local notification on
completion. The JS bridge (`src/native/background-tasks.ts`)
exposes the typed surface (`scheduleAppRefresh`,
`scheduleProcessing`, `cancelAll`, `getLastRun`,
`getRegisteredIdentifiers`, `isAvailable`); non-iOS variants throw
the typed `BackgroundTasksNotSupported` error class so
cross-platform callers can branch cleanly. A new, idempotent,
purely-additive Expo config plugin (`plugins/with-background-tasks/`)
union-merges the two task identifiers into
`BGTaskSchedulerPermittedIdentifiers` and union-merges
`["fetch", "processing"]` into `UIBackgroundModes` while preserving
**025's existing `"location"` entry verbatim**, coexisting with
all prior plugins (007/013/014/019/023/025/026/027/028/029) in any
declaration order. Integration is purely additive: registry +1
entry, `app.json` plugins +1 entry, no other module / plugin /
Swift source touched.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), Swift 5
(`@available(iOS 13.0, *)` on the new manager). React 19.2 +
React Native 0.83 + React Compiler enabled.
**Primary Dependencies**: Expo SDK 55, expo-router (typed routes),
react-native-reanimated, `@expo/config-plugins`,
`expo-modules-core` (`requireOptionalNativeModule` — same pattern
013 / 014 / 027 / 028 / 029 already use), `BackgroundTasks`
framework (iOS 13+: `BGTaskScheduler`,
`BGAppRefreshTaskRequest`, `BGProcessingTaskRequest`,
`BGAppRefreshTask`, `BGProcessingTask`),
`UserNotifications` (best-effort local notification on
completion), `Foundation` (`UserDefaults(suiteName:)`,
`JSONEncoder`), `react-native` (`AppState`),
`@react-native-async-storage/async-storage`.
**Storage**:
- AsyncStorage key `spot.bgtasks.history` — JSON array of
  `TaskRunRecord`, FIFO-evicted at 20 entries (FR-040 / FR-041 /
  FR-042). Owned exclusively by JS `history-store.ts`; the Swift
  side never reads or writes this key.
- App Group `UserDefaults(suiteName: AppGroupID)` key
  `spot.bgtasks.lastRun` — single JSON-encoded `LastRunSnapshot`
  (`{ refresh: TaskRunRecord | null; processing: TaskRunRecord |
  null }`), written by `BackgroundTaskManager` on every handler
  entry/exit (FR-063), read by the JS bridge's `getLastRun()`
  (FR-070). Reuses **014's** existing App Group identifier; the
  key namespace is **fifth disjoint** from 014's `spot.widget.*`,
  027's `spot.widget.lockConfig.*`, 028's
  `spot.widget.standbyConfig.*`, and 029's `spot.focus.*`. No new
  App Group entitlement is added.
**Testing**: Jest Expo + React Native Testing Library — JS-pure
tests only. The Swift surface (one new file under
`native/ios/background-tasks/`) is not unit-testable on the
Windows-based dev environment used by this repository (same
exemption pattern features 007 / 013 / 014 / 027 / 028 / 029
applied; on-device verification documented in `quickstart.md`).
All native bridges are mocked at the import boundary per FR-103.
**Target Platform**: iOS 13+ (real `BGTaskScheduler` registration
+ scheduling + handler execution + lldb debug-launch hook).
iOS < 13 / Android / Web ship the cross-platform fallback
(IOSOnlyBanner + ExplainerCard + TestTriggerCard only, per
FR-011 / FR-012 / FR-013). `screen.web.tsx` MUST NOT import
`src/native/background-tasks.ts` at module evaluation time
(FR-012 / SC-007).
**Project Type**: Mobile app (Expo) with native iOS sources
appended to the **main app target** via a new TS config plugin —
strictly additive (no extension target, no entitlement edits, no
new App Group). Same shape as 029.
**Performance Goals**: Screen mount → first meaningful paint <
250 ms on a mid-tier iPhone (NFR-001 / SC-002, excluding any
awaited bridge calls); in-app schedule call returns from the
bridge in < 250 ms (SC-002); status pill updates within one
render pass (≤ 16 ms on 60 Hz) when a run record changes;
last-run reconcile after `AppState` `'active'` transition within
500 ms (US3 AS3 ↔ EC-003); refresh handler ≤ 2 s simulated
workload, processing handler ≤ 5 s simulated workload (NFR-003).
**Constraints**: Purely additive at integration level — 1 import
+ 1 array entry in `src/modules/registry.ts`, 1 plugin entry in
`app.json`, zero new runtime dependencies (NFR-005); no edits to
prior plugin / screen / Swift sources; no new App Group; no
modification of the App Group entitlement; no
`eslint-disable` directives anywhere in added or modified code
(FR-100); `StyleSheet.create()` only (Constitution IV);
`.android.tsx` / `.web.tsx` splits for non-trivial platform
branches (Constitution III); all bridge interactions serialised
through the hook's reducer (FR-083).
**Scale/Scope**: One module directory
(`src/modules/background-tasks-lab/`), one new plugin
(`plugins/with-background-tasks/`), one new bridge file
(`src/native/background-tasks.ts` plus matching `.android.ts` /
`.web.ts` / `.types.ts` siblings), one Swift file under
`native/ios/background-tasks/`, one history store
(`history-store.ts`), one hook (`hooks/useBackgroundTasks.ts`),
six UI components, ~13 JS-pure test files. Run history capped at
20 entries (FR-041); registered task identifier set frozen at
two literals (NG-002).
**Test baseline at branch start**: carried forward from feature
029's completion totals (recorded in 029's plan.md /
retrospective.md). 030's expected delta: **≥ +13 suites** (see
"Test baseline tracking" below).

## Constitution Check

*Constitution version checked*: **1.1.0**
(`.specify/memory/constitution.md`). Spec NFR cross-checked against
v1.1.0 governance.

| Principle | Compliance |
|-----------|------------|
| I. Cross-Platform Parity | **PASS** — iOS 13+ ships the real `BGTaskScheduler` registration + two scheduling CTAs + run-history persistence + lldb instructions; Android / Web / iOS < 13 ship `IOSOnlyBanner` + `ExplainerCard` + `TestTriggerCard` so the catalogue card still renders and the educational copy is reachable from every platform. The user journey "open card → understand the framework" is equivalent across all targets; the platform-divergent piece (actual scheduling) is the iOS-only API surface itself. |
| II. Token-Based Theming | **PASS** — All chrome uses `ThemedView` / `ThemedText` and the `Spacing` scale from `src/constants/theme.ts`. The status pill reuses the existing semantic colour tokens (`textPrimary` / `surfaceElevated` / `accent` / `warning` / `error`) — no new theme entries; the `expired` and `canceled` states map to existing warning/error semantics. No hardcoded hex values. |
| III. Platform File Splitting | **PASS** — `screen.tsx` / `screen.android.tsx` / `screen.web.tsx`. Bridge has matching `background-tasks.ts` / `.android.ts` / `.web.ts` / `.types.ts` variants (mirrors 029's `focus-filters.*` and 014/027/028's `widget-center.*` layouts). `Platform.select` is permitted only for trivial style/copy diffs. The web variant explicitly avoids importing the bridge module at evaluation time (FR-012 / SC-007). |
| IV. StyleSheet Discipline | **PASS** — All styles via `StyleSheet.create()`; `Spacing` from theme tokens; no inline objects, no CSS-in-JS, no utility-class frameworks. |
| V. Test-First for New Features | **PASS** — JS-pure tests enumerated in AC-BGT-004..009 cover `history-store` (append/list/clear/cap-at-20/AsyncStorage error tolerance), every component, every screen variant, the `useBackgroundTasks` hook (schedule, AppState refresh, cancelAll, error channel), the bridge (typed surface, non-iOS throws, iOS delegates to mocked native module), the plugin (idempotency, `BGTaskSchedulerPermittedIdentifiers` union, `UIBackgroundModes` union preserving 025's `"location"`, prior-plugin coexistence), and the manifest contract. Swift cannot be exercised on Windows; on-device verification documented in `quickstart.md`. |
| Validate-Before-Spec (workflow) | **PASS / N/A** — This is not a build-pipeline or external-service-integration feature; it is an additive in-app showcase + standard `BGTaskScheduler` usage. The plugin's `Info.plist` mutation surface is fully unit-testable with `@expo/config-plugins`'s `withInfoPlist` mock — no proof-of-concept `expo prebuild` is required to validate spec assumptions, and the plugin test (AC-BGT-008) closes the loop on the byte-identical-second-run claim (SC-005) without invoking the real prebuild. |

**Initial Constitution Check: PASS — no violations, no entries needed
in Complexity Tracking.**

**Re-check after Phase 1 (post-design): PASS** — the Phase 1 artifacts
(data-model, contracts, quickstart) introduce no new global stores,
no new dependencies, no new theme tokens, and no inline
`Platform.select` beyond trivial style branches. The bridge's
typed-surface contract (DECISION 1 below) keeps every iOS-only symbol
strictly inside `src/native/background-tasks.ts`; non-iOS
(`.android.ts` / `.web.ts`) variants import only the shared
`*.types.ts` and the typed error class. AsyncStorage interaction is
isolated to `history-store.ts` (the hook never touches AsyncStorage
directly) so error-tolerance is testable at one boundary.

## Project Structure

### Documentation (this feature)

```text
specs/030-background-tasks/
├── plan.md              # this file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── history-store.contract.ts          # TaskRunRecord + history-store API
│   │                                       #   (append, list, clear, cap-at-20)
│   ├── background-tasks-bridge.contract.ts # Bridge typed surface
│   │                                       #   (scheduleAppRefresh, scheduleProcessing,
│   │                                       #    cancelAll, getLastRun,
│   │                                       #    getRegisteredIdentifiers, isAvailable)
│   │                                       #   + BackgroundTasksNotSupported error contract
│   └── manifest.contract.ts                # Registry entry contract
│                                           #   (id 'background-tasks-lab', label,
│                                           #    platforms, minIOS '13.0')
├── checklists/                              # (carried forward from /speckit.checklist;
│                                           #   not (re)generated by /speckit.plan)
└── tasks.md             # Phase 2 output (NOT created here)
```

### Source Code (repository root)

```text
# NEW (this feature) — TypeScript module
src/modules/background-tasks-lab/
├── index.tsx                              # ModuleManifest (id 'background-tasks-lab',
│                                          #   minIOS '13.0', platforms ['ios','android','web'])
├── screen.tsx                             # iOS 13+ variant (five panels in fixed order)
├── screen.android.tsx                     # Android fallback
│                                          #   (IOSOnlyBanner + ExplainerCard + TestTriggerCard)
├── screen.web.tsx                         # Web fallback (same as android; MUST NOT import
│                                          #   src/native/background-tasks.ts at module load)
├── history-store.ts                       # AsyncStorage-backed FIFO ring buffer
│                                          #   (key 'spot.bgtasks.history', cap 20).
│                                          #   Pure functions: append, list, clear,
│                                          #   parsePersistedArray (tolerates corrupt JSON).
├── hooks/
│   └── useBackgroundTasks.ts              # { schedule(type), cancelAll, lastRunByType,
│                                          #   history, error }; refetches on mount + AppState
│                                          #   'active'; reducer-serialised bridge calls
│                                          #   (FR-083); tolerates BackgroundTasksNotSupported
│                                          #   (resolves degraded state; never propagates to UI)
└── components/
    ├── ExplainerCard.tsx                  # Prose: BGTaskScheduler + refresh vs. processing
    │                                      #   contracts; coalescing/deferral discussion
    ├── ScheduleAppRefreshCard.tsx         # Primary CTA "Schedule App Refresh" → FR-021;
    │                                      #   status pill + last-run timestamp + duration
    ├── ScheduleProcessingCard.tsx         # Primary CTA "Schedule Processing" → FR-031;
    │                                      #   read-only requirements indicators (FR-032);
    │                                      #   status pill + last-run timestamp + duration
    ├── RunHistoryList.tsx                 # FIFO list of last 20 records; "Clear history"
    │                                      #   affordance; empty state line; AsyncStorage error
    │                                      #   surfaces via hook.error
    ├── TestTriggerCard.tsx                # lldb instructions verbatim for both task ids;
    │                                      #   copy-to-clipboard via existing project copy
    │                                      #   affordance; private-API caveat (FR-051)
    └── IOSOnlyBanner.tsx                  # "Background Tasks require iOS 13+"; rendered on
                                           #   Android / Web / iOS < 13 (FR-011 / FR-012 / FR-013)

# NEW (this feature) — Swift sources, appended to MAIN APP TARGET (not a widget extension)
native/ios/background-tasks/
└── BackgroundTaskManager.swift            # @available(iOS 13.0, *) enum / class wrapping
                                           #   BGTaskScheduler.shared. Registers both task
                                           #   identifiers in
                                           #   application(_:didFinishLaunchingWithOptions:)
                                           #   (FR-060). Refresh handler runs ~2s simulated
                                           #   workload; processing handler runs ~5s simulated
                                           #   workload (FR-061 / FR-062 / NFR-003). Both
                                           #   handlers wire task.expirationHandler →
                                           #   task.setTaskCompleted(success: false) and call
                                           #   setTaskCompleted(success: true) exactly once on
                                           #   normal completion (FR-061 / FR-062). On every
                                           #   handler entry and exit, the manager writes a
                                           #   LastRunSnapshot JSON payload to App Group
                                           #   UserDefaults under 'spot.bgtasks.lastRun'
                                           #   (FR-063). On successful completion, posts a
                                           #   best-effort UNNotificationRequest via
                                           #   UNUserNotificationCenter.current(); failure to
                                           #   post is swallowed (FR-064 / EC-008). Exposes
                                           #   isAvailable / scheduleAppRefresh /
                                           #   scheduleProcessing / cancelAll / getLastRun /
                                           #   getRegisteredIdentifiers via the JS bridge
                                           #   (FR-065 / FR-070).

# NEW (this feature) — Expo config plugin
plugins/with-background-tasks/
├── index.ts                               # ConfigPlugin: composes withInfoPlist mutation;
│                                          #   union-merges BGTaskSchedulerPermittedIdentifiers
│                                          #   with the two literals; union-merges
│                                          #   UIBackgroundModes with ['fetch','processing']
│                                          #   while preserving every prior entry (FR-090 /
│                                          #   FR-091 / EC-007). Idempotent + commutative
│                                          #   (FR-092 / FR-093).
└── package.json

# NEW (this feature) — JS bridge (mirrors 029's focus-filters.* layout)
src/native/background-tasks.ts             # iOS impl: requireOptionalNativeModule
                                           #   ('BackgroundTasks') + Platform.OS === 'ios'
                                           #   gate; exports scheduleAppRefresh,
                                           #   scheduleProcessing, cancelAll, getLastRun,
                                           #   getRegisteredIdentifiers, isAvailable, and the
                                           #   BackgroundTasksNotSupported class (FR-070 /
                                           #   FR-072). All async methods serialise through a
                                           #   single in-memory promise chain so concurrent
                                           #   schedules don't interleave (supports FR-083).
src/native/background-tasks.android.ts     # isAvailable() returns false;
                                           #   getRegisteredIdentifiers() returns [];
                                           #   every other method throws
                                           #   BackgroundTasksNotSupported (FR-071).
src/native/background-tasks.web.ts         # Same as android.ts.
src/native/background-tasks.types.ts       # BackgroundTasksBridge interface;
                                           #   TaskRunRecord / TaskType / TaskStatus type
                                           #   exports; LastRunSnapshot type;
                                           #   BackgroundTasksNotSupported class declaration.
                                           #   No global symbol collisions with 013's
                                           #   app-intents, 014/027/028's widget-center,
                                           #   or 029's focus-filters bridges.

# MODIFIED (additive only)
src/modules/registry.ts                    # +1 import line, +1 array entry
                                           #   (backgroundTasksLab) — registry size +1
app.json                                   # +1 plugins entry:
                                           #   "./plugins/with-background-tasks"

# UNTOUCHED (deliberately — verified non-regression in tests)
plugins/with-app-intents/**                # 013-owned; not modified
plugins/with-home-widgets/**               # 014-owned; not modified
plugins/with-core-location/**              # 025-owned; not modified — its 'location' entry
                                           #   in UIBackgroundModes is preserved by 030's
                                           #   union-merge (FR-091 / EC-007 / SC-008)
plugins/with-rich-notifications/**         # 026-owned; not modified
plugins/with-lock-widgets/**               # 027-owned; not modified
plugins/with-standby-widget/**             # 028-owned; not modified
plugins/with-focus-filters/**              # 029-owned; not modified
plugins/with-live-activity/**              # 007-owned; not modified
native/ios/app-intents/**                  # 013-owned; not modified
native/ios/widgets/**                      # 014/027/028-owned; not modified
native/ios/focus-filters/**                # 029-owned; not modified
src/native/app-intents.*                   # 013-owned; not modified
src/native/widget-center.*                 # 014/027/028-owned; not modified
src/native/focus-filters.*                 # 029-owned; not modified
src/modules/{intents-lab,widgets-lab,lock-widgets-lab,standby-lab,focus-filters-lab,...}/**
                                           # All prior modules untouched
ios-widget/**                              # 014/027/028-owned widget extension; NOT touched

# Tests (NEW)
test/unit/modules/background-tasks-lab/
├── manifest.test.ts                        # id 'background-tasks-lab', label 'Background
│                                            #   Tasks', platforms ['ios','android','web'],
│                                            #   minIOS '13.0' (AC-BGT-009)
├── history-store.test.ts                   # append, list, clear, cap-at-20 FIFO eviction,
│                                            #   AsyncStorage read/write/parse error tolerance
│                                            #   (AC-BGT-005 / FR-040..044 / EC-004)
├── screen.test.tsx                         # iOS flow: 5 panels in order; isAvailable()
│                                            #   false → IOSOnlyBanner variant; isolation from
│                                            #   013/014/027/028/029 paths
├── screen.android.test.tsx                 # Android: banner + explainer + test-trigger only;
│                                            #   schedule CTAs absent; bridge throws path
│                                            #   tolerated
├── screen.web.test.tsx                     # Web: same render set as android; assert that
│                                            #   src/native/background-tasks.ts is NOT pulled
│                                            #   in by the web bundle (SC-007)
├── hooks/
│   └── useBackgroundTasks.test.tsx         # mount fetch; AppState 'active' refetch; schedule
│                                            #   per task type calls bridge with correct args;
│                                            #   cancelAll clears scheduled state; error
│                                            #   channel surfaces AsyncStorage / bridge
│                                            #   failures without crashing (AC-BGT-006)
└── components/
    ├── ExplainerCard.test.tsx              # mentions BGTaskScheduler + refresh + processing
    │                                        #   + coalescing; renders every platform
    ├── ScheduleAppRefreshCard.test.tsx     # CTA label "Schedule App Refresh"; tap calls
    │                                        #   schedule('refresh'); status pill state
    │                                        #   transitions; last-run + duration empty state
    │                                        #   (FR-020..023)
    ├── ScheduleProcessingCard.test.tsx     # CTA label "Schedule Processing"; tap calls
    │                                        #   schedule('processing'); requirements
    │                                        #   indicators visible + read-only;
    │                                        #   status pill / last-run mirror refresh card
    │                                        #   (FR-030..033)
    ├── RunHistoryList.test.tsx             # renders 0 / 1 / 5 / 20 / overflow records;
    │                                        #   newest first; "Clear history" empties + shows
    │                                        #   empty-state line; AsyncStorage error path
    │                                        #   renders without crash (FR-040..044)
    ├── TestTriggerCard.test.tsx            # both task identifiers verbatim in lldb command;
    │                                        #   copy affordance present; private-API caveat
    │                                        #   string (FR-050 / FR-051)
    └── IOSOnlyBanner.test.tsx              # message string; copy variant when isAvailable()
                                             #   false on iOS (older OS) (FR-013)
test/unit/native/
└── background-tasks.test.ts                # iOS path delegates to mocked native module +
                                              #   serialises concurrent schedules; non-iOS
                                              #   throws BackgroundTasksNotSupported on every
                                              #   mutating method; isAvailable() / get
                                              #   RegisteredIdentifiers() degrade safely;
                                              #   typed surface matches the contract
                                              #   (AC-BGT-007)
test/unit/plugins/
└── with-background-tasks/
    └── index.test.ts                        # full pipeline:
                                              #   (a) adds both task ids to
                                              #       BGTaskSchedulerPermittedIdentifiers;
                                              #   (b) idempotent on second run (byte-identical);
                                              #   (c) preserves prior
                                              #       BGTaskSchedulerPermittedIdentifiers
                                              #       entries by union-merge;
                                              #   (d) adds 'fetch' + 'processing' to
                                              #       UIBackgroundModes;
                                              #   (e) preserves 025's 'location' entry in
                                              #       UIBackgroundModes by union-merge
                                              #       (assert ['location','fetch','processing']
                                              #       superset);
                                              #   (f) coexists with 013/014/025/026/027/028/029
                                              #       plugins in declaration order;
                                              #   (g) commutative across a sampled set of
                                              #       plugin orderings (≥3 non-trivial
                                              #       permutations);
                                              #   (AC-BGT-008 / FR-090..093 / SC-005 / SC-008)
```

**Structure Decision**: Mirrors **029's** `Expo + iOS-main-app-target`
shape. Differences from 029:

1. **Different framework / API class** — `BGTaskScheduler` instead of
   `SetFocusFilterIntent`. The manager registers two distinct task
   types in `application(_:didFinishLaunchingWithOptions:)`; no
   `AppShortcutsProvider` / no `AppIntent` discovery surface.
2. **Persistence path** — 029's filter persists into the App Group
   (`spot.focus.filterValues`); 030 also writes to the same App
   Group but under a **fifth disjoint** namespace
   (`spot.bgtasks.lastRun`) **and** maintains a separate
   AsyncStorage history (`spot.bgtasks.history`) — the AsyncStorage
   list is the durable, full history; the App Group snapshot is the
   single most-recent-per-type record (LastRunSnapshot) optimised
   for the cold-launch read on the JS side.
3. **Bridge surface** — 030's bridge is mostly write-side
   (`scheduleAppRefresh`, `scheduleProcessing`, `cancelAll`); 029's
   was read-side. Concurrent-schedule serialisation lives at the
   bridge layer (single in-memory promise chain) so the hook's
   reducer (FR-083) doesn't have to reason about overlapping
   awaits.
4. **No widget integration** — same as 029. Background-task records
   are deliberately not piped into 014/027/028's widget
   configurations; cross-feature wiring is a separate future
   feature.
5. **Plugin scope is `Info.plist` keys, not `pbxproj` Sources** —
   029 added Swift files to the main app target via xcode pbxproj
   manipulation. 030's plugin only mutates `Info.plist`
   (`BGTaskSchedulerPermittedIdentifiers` and `UIBackgroundModes`).
   The Swift source under `native/ios/background-tasks/` is linked
   via the existing autolinking pipeline (same path the existing
   `native/ios/{app-intents,coreml,…}` directories take), not by
   30's plugin. This makes 030's plugin strictly simpler and
   strictly less likely to regress prior plugin output (per R1
   under Risks).

## Resolved [NEEDS CLARIFICATION] markers

The user marked themselves unavailable for clarification. The
following decisions were resolved autonomously by the most
reasonable additive interpretation, consistent with prior features
(025–029). Recorded in spec.md §"Open Questions (resolved)" and
inherited verbatim here for traceability:

| # | Question | Resolution | Spec ref |
|---|----------|------------|----------|
| 1 | Should the bridge be a `requireOptionalNativeModule` lookup? | **Yes** — same pattern 013/014/027/028/029 use. Module name `'BackgroundTasks'` (distinct from prior modules to avoid collision per R9-equivalent). | FR-070 / FR-072 |
| 2 | Default `earliestBeginInterval` for refresh | **60 seconds** | spec §Open Questions DECISION 1 |
| 3 | Processing requirements | **Both** `requiresExternalPower` and `requiresNetworkConnectivity` set to `true` | FR-031 / spec §Open Questions DECISION 2 |
| 4 | History cap | **20 entries**, FIFO eviction | FR-041 / spec §Open Questions DECISION 3 |
| 5 | History persistence layer | **AsyncStorage** under `spot.bgtasks.history`; `LastRunSnapshot` mirrors most-recent-per-type into App Group `UserDefaults` under `spot.bgtasks.lastRun` for cross-process visibility | FR-040 / FR-063 |
| 6 | Where does `BackgroundTaskManager.swift` live? | `native/ios/background-tasks/` (parallels `native/ios/{app-intents,focus-filters}/`) | structure decision |
| 7 | Local notification on completion | **Best-effort**; failure swallowed; does not affect run record (FR-064 / EC-008) | FR-064 |
| 8 | Cross-platform fallback content | IOSOnlyBanner + ExplainerCard + TestTriggerCard only (schedule CTAs hidden on non-iOS / iOS < 13) | FR-011 / FR-012 / FR-013 |
| 9 | Bundle-id-derived task identifiers | **Frozen literals** `com.izkizk8.spot.refresh` and `com.izkizk8.spot.processing`; documented in ExplainerCard so forks know to update both Swift `register` calls and the plugin in tandem (EC-009) | FR-060 / EC-009 |
| 10 | Concurrent-schedule serialisation | **Bridge-level** — single in-memory promise chain in `src/native/background-tasks.ts`; the hook's reducer additionally serialises UI state changes (FR-083) | FR-083 / R-A below |

Plan-level decisions made beyond the spec-resolved set (locked in
`research.md`):

- **R-A**: Bridge serialisation is implemented as a closure-scoped
  `let chain: Promise<unknown> = Promise.resolve();` in
  `src/native/background-tasks.ts`; every async method assigns
  `chain = chain.then(…).catch(swallow)` and returns the new tail.
  Errors are NOT swallowed at the chain level (the per-call promise
  preserves its rejection); the catch only prevents one failed call
  from poisoning subsequent calls. Tests assert that two
  back-to-back `scheduleAppRefresh` calls produce exactly two native
  invocations in submission order even if the first rejects. See
  research §1.
- **R-B**: `LastRunSnapshot`'s shape on disk is the strictest JSON
  encoding of `{ refresh: TaskRunRecord | null; processing:
  TaskRunRecord | null }` — every field is present (null when
  absent) so the JS-side parser can validate the schema with a
  single shape check. The Swift writer always re-encodes the entire
  snapshot (read-modify-write) on every handler entry/exit so the
  on-disk representation stays consistent across both task types
  even if only one ran. See research §2.
- **R-C**: AsyncStorage corruption tolerance — `parsePersistedArray`
  returns `[]` on malformed JSON, on non-array roots, and on any
  `TaskRunRecord` whose required fields fail validation; an
  optional `onError(unknown)` callback is invoked exactly once per
  parse failure so the hook can surface the failure on its `error`
  channel without coupling the store to React state (per
  Constitution V test-first; tested in `history-store.test.ts`). See
  research §3.
- **R-D**: The plugin's union-merge over `UIBackgroundModes` and
  `BGTaskSchedulerPermittedIdentifiers` preserves source order of
  prior entries (per FR-091 / EC-007 wording "preserve every prior
  entry"). The implementation is `[...prior, …missing]` not
  `[…sorted set]` so the diff against an existing `Info.plist` is
  always "additive only" — no reorder, no removal. Test assertion
  uses `toEqual` against the exact expected superset shape rather
  than `toContain` to lock the ordering. See research §4.
- **R-E**: The plugin does NOT add `Info.plist`'s
  `NSUserNotificationsUsageDescription` (or any analogous local
  notifications permission key). Per FR-064 + EC-008, notification
  posting is best-effort and failure (including unauthorized) is
  swallowed; the project's existing notifications permission flow
  (owned by feature 026 / 011-equivalent) is the single source of
  truth for that key. 030's plugin remains strictly scoped to the
  two `Info.plist` keys the BackgroundTasks framework requires. See
  research §5.

## Phased file inventory

### Phase 0 — Research (no code; produces research.md only)

NEW files:
- `specs/030-background-tasks/research.md`

### Phase 1 — Design contracts (no app code; produces docs only)

NEW files:
- `specs/030-background-tasks/data-model.md`
- `specs/030-background-tasks/quickstart.md`
- `specs/030-background-tasks/contracts/history-store.contract.ts`
- `specs/030-background-tasks/contracts/background-tasks-bridge.contract.ts`
- `specs/030-background-tasks/contracts/manifest.contract.ts`

MODIFIED:
- `.github/copilot-instructions.md` — update the `<!-- SPECKIT
  START -->` / `<!-- SPECKIT END -->` block's plan reference from
  `specs/028-standby-mode/plan.md` to
  `specs/030-background-tasks/plan.md` (Phase 1 step 3 of
  `/speckit.plan`).

### Phase 2 — Tasks (out of scope for /speckit.plan; sketched here for tasks.md)

NEW (TypeScript / tests):

- `src/modules/background-tasks-lab/index.tsx`
- `src/modules/background-tasks-lab/screen.tsx`
- `src/modules/background-tasks-lab/screen.android.tsx`
- `src/modules/background-tasks-lab/screen.web.tsx`
- `src/modules/background-tasks-lab/history-store.ts`
- `src/modules/background-tasks-lab/hooks/useBackgroundTasks.ts`
- `src/modules/background-tasks-lab/components/ExplainerCard.tsx`
- `src/modules/background-tasks-lab/components/ScheduleAppRefreshCard.tsx`
- `src/modules/background-tasks-lab/components/ScheduleProcessingCard.tsx`
- `src/modules/background-tasks-lab/components/RunHistoryList.tsx`
- `src/modules/background-tasks-lab/components/TestTriggerCard.tsx`
- `src/modules/background-tasks-lab/components/IOSOnlyBanner.tsx`
- `src/native/background-tasks.ts`
- `src/native/background-tasks.android.ts`
- `src/native/background-tasks.web.ts`
- `src/native/background-tasks.types.ts`
- `test/unit/modules/background-tasks-lab/manifest.test.ts`
- `test/unit/modules/background-tasks-lab/history-store.test.ts`
- `test/unit/modules/background-tasks-lab/screen.test.tsx`
- `test/unit/modules/background-tasks-lab/screen.android.test.tsx`
- `test/unit/modules/background-tasks-lab/screen.web.test.tsx`
- `test/unit/modules/background-tasks-lab/hooks/useBackgroundTasks.test.tsx`
- `test/unit/modules/background-tasks-lab/components/ExplainerCard.test.tsx`
- `test/unit/modules/background-tasks-lab/components/ScheduleAppRefreshCard.test.tsx`
- `test/unit/modules/background-tasks-lab/components/ScheduleProcessingCard.test.tsx`
- `test/unit/modules/background-tasks-lab/components/RunHistoryList.test.tsx`
- `test/unit/modules/background-tasks-lab/components/TestTriggerCard.test.tsx`
- `test/unit/modules/background-tasks-lab/components/IOSOnlyBanner.test.tsx`
- `test/unit/native/background-tasks.test.ts`
- `test/unit/plugins/with-background-tasks/index.test.ts`

NEW (Swift, linked into main app target via existing autolinking):

- `native/ios/background-tasks/BackgroundTaskManager.swift`

NEW (plugin):

- `plugins/with-background-tasks/index.ts`
- `plugins/with-background-tasks/package.json`

MODIFIED (additive only):

- `src/modules/registry.ts` (+1 import, +1 array entry)
- `app.json` (+1 plugins entry `./plugins/with-background-tasks`)

UNTOUCHED (verified non-regression in tests):

- `plugins/with-{app-intents,home-widgets,core-location,
  rich-notifications,lock-widgets,standby-widget,focus-filters,
  live-activity,…}/**` — every file byte-identical.
- `native/ios/{app-intents,widgets,focus-filters,…}/**` —
  byte-identical.
- `src/native/{app-intents,widget-center,focus-filters}.*` —
  byte-identical.
- `src/modules/{intents-lab,widgets-lab,lock-widgets-lab,
  standby-lab,focus-filters-lab,…}/**` — byte-identical.
- `ios-widget/**` — byte-identical (this feature explicitly does
  not touch the widget extension target).

## Task seeds for tasks.md

These are sketches for the `/speckit.tasks` step, ordered by
dependency. The full enumeration belongs in `tasks.md`; these are
intentionally coarse so `/speckit.tasks` can split each into RED →
GREEN → REFACTOR sub-tasks.

1. **T001 — History store (RED-first)**:
   `src/modules/background-tasks-lab/history-store.ts` with
   `appendRun(record)`, `listRuns()`, `clearRuns()`,
   `parsePersistedArray(raw: unknown)` returning
   `TaskRunRecord[]`. Cap-at-20 FIFO eviction; AsyncStorage
   read/write/parse error tolerance with optional `onError`
   callback. Tests in `history-store.test.ts` (AC-BGT-005).
2. **T002 — Bridge types + non-iOS stubs**:
   `src/native/background-tasks.types.ts` declares
   `BackgroundTasksBridge` interface +
   `BackgroundTasksNotSupported` class +
   `TaskRunRecord` / `TaskType` / `TaskStatus` /
   `LastRunSnapshot` types.
   `src/native/background-tasks.android.ts` and
   `src/native/background-tasks.web.ts` throw on every mutating
   method, return `false` from `isAvailable()`, `[]` from
   `getRegisteredIdentifiers()`. Tests assert no symbol collision
   with `app-intents.ts` / `widget-center.ts` /
   `focus-filters.ts` (FR-070..072).
3. **T003 — iOS bridge**:
   `src/native/background-tasks.ts` implements iOS path
   (`requireOptionalNativeModule('BackgroundTasks')` + `Platform.OS
   === 'ios'` gate + closure-scoped serialisation chain per R-A);
   tests in `native/background-tasks.test.ts` (AC-BGT-007).
4. **T004 — Manifest**:
   `src/modules/background-tasks-lab/index.tsx` +
   `manifest.test.ts` (asserts id `'background-tasks-lab'`,
   label `'Background Tasks'`, platforms
   `['ios','android','web']`, `minIOS: '13.0'`) (AC-BGT-009).
5. **T005 — Hook**:
   `hooks/useBackgroundTasks.ts` returning
   `{ schedule(type), cancelAll, lastRunByType, history, error }`;
   refetches on mount and on `AppState` `'active'`; tolerates
   `BackgroundTasksNotSupported` and AsyncStorage errors by
   surfacing on `error` channel without crashing. Reducer-
   serialised UI state per FR-083. Tests in
   `useBackgroundTasks.test.tsx` (AC-BGT-006); mock the bridge.
6. **T006 — Components, top-down RED**: write component tests first
   (Explainer, ScheduleAppRefresh, ScheduleProcessing, RunHistory,
   TestTrigger, IOSOnlyBanner); then implement against them.
   Status pill state machine asserted at the schedule-card level;
   "Clear history" path asserted at the run-history level (FR-043).
7. **T007 — Screens**: implement `screen.tsx`, `screen.android.tsx`,
   `screen.web.tsx` with full panel ordering per FR-010..013;
   tests assert layout order, banner visibility, hidden panels on
   non-iOS, isolation from 013/014/027/028/029 paths, and that
   `screen.web.tsx` does NOT pull `src/native/background-tasks.ts`
   into the bundle (SC-007).
8. **T008 — Plugin**: write
   `plugins/with-background-tasks/{index.ts,package.json}` and
   tests (`with-background-tasks/index.test.ts`). Tests must
   cover: (a) appends both task ids to
   `BGTaskSchedulerPermittedIdentifiers`; (b) idempotent on
   second run (byte-identical); (c) preserves prior identifiers by
   union-merge; (d) adds `'fetch' + 'processing'` to
   `UIBackgroundModes`; (e) preserves 025's `'location'` entry;
   (f) coexists with prior plugins in declaration order;
   (g) commutativity across ≥3 sampled orderings (AC-BGT-008 /
   SC-005 / SC-008 / FR-090..093).
9. **T009 — Swift source**: write
   `BackgroundTaskManager.swift` under
   `native/ios/background-tasks/`. Registers both identifiers in
   `application(_:didFinishLaunchingWithOptions:)`; runs simulated
   workloads; wires `task.expirationHandler →
   setTaskCompleted(success: false)` and `setTaskCompleted(success:
   true)` on normal completion; writes `LastRunSnapshot` JSON to
   App Group `UserDefaults` under `spot.bgtasks.lastRun`; posts a
   best-effort `UNNotificationRequest` on completion (failure
   swallowed). No JS tests here (Constitution V exemption);
   on-device verification in `quickstart.md`.
10. **T010 — Registry hook-up**: append `backgroundTasksLab`
    import + array entry to `src/modules/registry.ts`. Update
    `test/unit/modules/registry.test.ts` if it asserts a fixed
    length.
11. **T011 — `app.json` plugin entry**: add
    `./plugins/with-background-tasks` to the `plugins` array.
12. **T012 — `pnpm check` gate**: lint + typecheck + tests must
    be green; no `eslint-disable` directives anywhere; `pnpm
    format` is a no-op after the final commit. Report delta from
    029's closing baseline (AC-BGT-010 / FR-100..103).
13. **T013 — On-device verification**: execute `quickstart.md`
    checklist on a real iOS 13+ device (open card → tap
    Schedule App Refresh → observe scheduled state →
    `_simulateLaunchForTaskWithIdentifier` via lldb → observe
    completed history row + last-run timestamp + duration →
    repeat for processing).

## Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|------------|--------|------------|
| R1 | **025-regression** — 030's plugin clobbers `UIBackgroundModes` and removes 025's `'location'` entry, breaking Core Location's geofencing background path. | Low | High (silent geofencing regression) | Plugin test (e) under T008 explicitly seeds `UIBackgroundModes: ['location']` and asserts the post-mutation array is `['location', 'fetch', 'processing']` (or any superset preserving prior entries) by `toEqual` rather than `toContain`. EC-007 enumerated; SC-008 measurable. |
| R2 | **Plugin idempotency drift** — `expo prebuild` run twice produces duplicated `BGTaskSchedulerPermittedIdentifiers` entries. | Medium | Medium (Xcode warns on duplicate background-task identifiers in Info.plist; runtime registration succeeds but schema lints fail) | Union-merge skips entries already present (`if (!arr.includes(id)) arr.push(id)`). Test (b) asserts byte-identical Info.plist on second run. SC-005 measurable. |
| R3 | **Bridge concurrency anomaly** — two rapid taps on a Schedule CTA produce two parallel awaits that interleave with the AppState refetch, leaving status pill in an inconsistent state. | Medium | Low (pill briefly wrong; resolves on next refetch) | Per R-A, bridge serialises through a closure-scoped promise chain; hook reducer additionally serialises UI state per FR-083; test asserts two back-to-back `scheduleAppRefresh` calls produce exactly two native invocations in submission order. EC-001 enumerated. |
| R4 | **AsyncStorage history corrupt JSON crashes the screen on mount** — corrupted persisted blob raises `SyntaxError` from `JSON.parse`, propagating to the React tree. | Low | High (screen crashes on cold launch) | Per R-C, `parsePersistedArray` returns `[]` on any parse / shape failure and surfaces the failure on the hook's `error` channel via the optional `onError` callback. EC-004 enumerated; AC-BGT-005 covers tolerance; FR-044 mandates degradation. |
| R5 | **Local notification permission undetermined** — `UNUserNotificationCenter` rejects the post and the handler interprets it as an error, failing the run record. | Medium | Low (run still recorded; only the user-visible toast is missing) | Per FR-064 + EC-008 + R-E, notification posting is best-effort; the Swift handler swallows the post error and proceeds to `setTaskCompleted(success: true)`. Plugin does NOT add notification permission keys (R-E). |
| R6 | **Expiration handler races with completion** — system fires `expirationHandler` on the same dispatch tick the simulated workload finishes, causing `setTaskCompleted(success:)` to be called twice. | Low | Medium (Apple docs warn calling it twice is undefined behaviour; in practice it logs a warning) | Manager guards completion via a single `os_unfair_lock` (or equivalent atomic flag) so only the first of {workload-done, expiration-fired} wins; the second is dropped. EC-005 enumerated; FR-061 / FR-062 mandate the contract. |
| R7 | **App Group write throttled while suspended** — iOS de-prioritises the `UserDefaults.set` under thermal pressure; on next foreground the JS bridge reads stale snapshot. | Low | Low (history-store is the durable source of truth; LastRunSnapshot is just the cold-launch hint) | The history-store write happens later (when JS resumes via AppState refetch), and the cap-at-20 list always wins for what gets rendered in `RunHistoryList`. The App Group snapshot is only used for the first-paint last-run timestamp on the schedule cards; if it's stale by < 1 minute, the user-visible impact is negligible. NFR-002 / NFR-006 covered. |
| R8 | **Bundle id drift in fork** — a downstream fork changes `expo.ios.bundleIdentifier` but forgets to update the literals in Swift / plugin. | Low | High (registration silently fails; tasks never run) | EC-009 enumerates. ExplainerCard documents the freeze; if a fork wants to support a different bundle id, both Swift `register(forTaskWithIdentifier:)` calls and the plugin's identifier list must be updated in tandem. Out-of-scope for v1. |
| R9 | **Bridge module-name collision** — adding `'BackgroundTasks'` to the shared `requireOptionalNativeModule` registry collides with a future Apple-shipped `BackgroundTasks` framework wrapper or a third-party library. | Very Low | Low (test churn only) | Distinct native module name `'BackgroundTasks'` (registered by `BackgroundTaskManager.swift`'s `Module` definition); test asserts the lookup is exactly `'BackgroundTasks'`. No conflict with prior modules' names (`'AppIntents'`, `'WidgetCenter'`, `'FocusFilters'`). |
| R10 | **AsyncStorage history grows unboundedly during dev** — a developer disables the cap-at-20 enforcement and eventually fills storage. | Very Low | Low (only affects dev environment) | The cap is enforced inside `appendRun` itself, not at the call site; bypassing it requires editing the store. Test (cap-at-20) asserts the invariant. |

## Test baseline tracking

- **Branch start**: carried forward from feature 029's completion
  totals (recorded in 029's `plan.md` / `retrospective.md`).
  029's plan.md documented an expected delta of ≥ +16 suites.
  030's T012 will substitute the actual 029 close numbers into
  this section before the merge commit.
- **Expected delta** (sketch, finalised in `tasks.md`):
  - +1 `manifest.test.ts` suite
  - +1 `history-store.test.ts` suite
  - +3 `screen.{ios,android,web}.test.tsx` suites
  - +1 `useBackgroundTasks.test.tsx` suite
  - +6 component test suites (Explainer, ScheduleAppRefresh,
    ScheduleProcessing, RunHistory, TestTrigger, IOSOnlyBanner)
  - +1 `background-tasks.test.ts` (bridge) suite
  - +1 plugin test suite (`with-background-tasks/index.test.ts`)
  - **Total target**: **≥ +13 suites at completion** (slightly
    smaller than 029's ≥ +16 because 030 has no marker-insertion
    sub-plugin and no commutativity-matrix split file; 030's
    plugin has a single test file covering all idempotency +
    union-merge + coexistence assertions).
- Final deltas reported in
  `specs/030-background-tasks/retrospective.md`.

## Progress Tracking

- [x] Spec authored and approved (`specs/030-background-tasks/spec.md`, 2026-04-29)
- [x] Plan authored — this file (Phase 0 + Phase 1 outline complete)
- [ ] Phase 0 — `research.md` written (resolves R-A through R-E with code-level detail)
- [ ] Phase 1 — `data-model.md`, `contracts/*.contract.ts`, `quickstart.md` written
- [ ] `.github/copilot-instructions.md` SPECKIT block points at this plan
- [ ] `/speckit.tasks` run; `tasks.md` written from the T001-T013 seeds above
- [ ] T001-T011 implemented; `pnpm check` green; baseline delta substituted into "Test baseline tracking"
- [ ] T012 (`pnpm check` gate) signed off
- [ ] T013 (on-device quickstart) signed off on a real iOS 13+ device
- [ ] `retrospective.md` written; final test totals substituted; merged to main

## Complexity Tracking

> No constitution violations. Section intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| _(none)_  | _(n/a)_    | _(n/a)_                              |
