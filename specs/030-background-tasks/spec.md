# Feature Specification: BackgroundTasks Framework Module

**Feature Branch**: `030-background-tasks`
**Feature Number**: 030
**Created**: 2026-04-29
**Status**: Approved (autonomous, no clarifications needed)
**Input**: iOS 13+ module showcasing `BGTaskScheduler` with `BGAppRefreshTask`
(short, frequent ≤30s refreshes) and `BGProcessingTask` (longer batch work,
optionally requiring external power and/or network connectivity). Adds a
"Background Tasks" card to the iOS Showcase registry, an in-app screen with
explainer + scheduling controls + persisted run history, a Swift
`BackgroundTaskManager` that registers and handles the two demo task
identifiers, a JS bridge with non-iOS stubs, and an Expo config plugin that
adds `BGTaskSchedulerPermittedIdentifiers` and the required
`UIBackgroundModes` entries to `Info.plist`. Branch parent is
`029-focus-filters`. Builds additively on prior modules; coexists with all
prior config plugins (notably 025's `UIBackgroundModes: ["location"]`).

## Overview

The BackgroundTasks module ("Background Tasks") is a feature card in the
iOS Showcase registry (`id: 'background-tasks-lab'`, label `"Background
Tasks"`, `platforms: ['ios','android','web']`, `minIOS: '13.0'`). Tapping
the card opens a single screen with five panels arranged in a fixed
top-to-bottom order:

1. **Explainer card** — what `BGTaskScheduler` is; why iOS coalesces and
   defers background work to preserve battery/thermals; the contract for
   `BGAppRefreshTask` (≤30s wall-clock budget, frequent, no special
   requirements) versus `BGProcessingTask` (longer wall-clock budget, may
   require external power and/or network connectivity, opportunistically
   scheduled by the system).
2. **Schedule App Refresh card** — primary CTA "Schedule App Refresh"
   submits a `BGAppRefreshTaskRequest` for identifier
   `com.izkizk8.spot.refresh` with `earliestBeginDate = now + N seconds`
   (default N = 60). Shows a status pill cycling through
   `idle → scheduled → running → completed` (or `expired` / `canceled`),
   the last-run timestamp, and the last-run duration in milliseconds.
3. **Schedule Processing card** — primary CTA "Schedule Processing"
   submits a `BGProcessingTaskRequest` for identifier
   `com.izkizk8.spot.processing` with `requiresExternalPower = true` and
   `requiresNetworkConnectivity = true`. Same status pill + last-run
   timestamp + duration affordances as panel 2. Two read-only toggles
   visualise the requirements being submitted (so reviewers can see what
   was requested without editing the request itself in v1).
4. **Run history list** — FIFO list of the last **20** background-task
   runs across both identifiers, persisted to AsyncStorage under the key
   `spot.bgtasks.history` so it survives relaunches. Each row shows: run
   id, task type (`refresh` / `processing`), scheduled-at, started-at,
   ended-at, duration ms, and final status (`completed` / `expired` /
   `canceled`). A "Clear history" affordance empties the list.
5. **Test trigger card** — copy-pasteable Xcode lldb instructions
   explaining how a developer can manually launch each registered task
   in a debug build, e.g.:
   `e -l objc -- (void)[[BGTaskScheduler sharedScheduler] _simulateLaunchForTaskWithIdentifier:@"com.izkizk8.spot.refresh"]`.
   Provided for educational value only; the in-app UI does not invoke
   private API.

The feature is purely additive at the integration boundary:

1. `src/modules/registry.ts` — one new import line + one new array entry
   (registry size +1). No existing entry is modified.
2. `app.json` `plugins` array — one new entry
   (`./plugins/with-background-tasks`). Coexists with all prior plugins.
3. `app.json` already-existing `UIBackgroundModes` (added in 025 with
   value `["location"]`) is preserved; the plugin merges
   `["fetch", "processing"]` into the existing array without removing or
   reordering prior entries.
4. New native sources under `native/ios/background-tasks/` are linked via
   the existing autolinking pipeline.
5. Bundle identifier (`com.izkizk8.spot`) is read from `app.json` to
   document derivation of the two task identifiers; the plugin and the
   Swift `register(forTaskWithIdentifier:)` calls both reference the
   identifiers literally so they cannot drift.

Cross-platform parity: Android and Web open the screen and render an
`IOSOnlyBanner` plus the static explainer / test-trigger copy. The
schedule CTAs are not rendered on those platforms; the bridge throws
`BackgroundTasksNotSupported` if invoked from non-iOS code paths.

## Goals

- **G-001**: Demonstrate the full `BGTaskScheduler` registration and
  scheduling lifecycle for both task classes from a single screen, with
  zero developer-mode-only steps required to reach the "scheduled" state.
- **G-002**: Make the difference between `BGAppRefreshTask` and
  `BGProcessingTask` legible to a reviewer who has never used the API
  (explainer copy + visible requirements toggles + observable run-history
  rows that record which class executed).
- **G-003**: Persist a developer-grade run history across relaunches so
  reviewers can correlate "I scheduled this last night" with "the system
  ran it at 03:14 this morning".
- **G-004**: Keep all integration touchpoints additive (registry +1,
  `app.json` plugins +1, `UIBackgroundModes` augmented not replaced) and
  preserve coexistence with every prior feature's plugin.
- **G-005**: Provide a JS bridge whose non-iOS stubs throw a single,
  well-typed `BackgroundTasksNotSupported` error so cross-platform
  callers can branch cleanly.
- **G-006**: Document — but do not invoke from production code — the
  Xcode lldb manual-trigger workflow so reviewers can verify their
  scheduled tasks run on demand in debug builds.

## Non-Goals

- **NG-001**: Real-world background sync, push delivery, content
  prefetching, or any user-visible background work beyond the simulated
  workload (sum + sleep) used to make timings observable.
- **NG-002**: Configurable task identifiers, custom workloads, or arbitrary
  user-supplied requirement toggles. The two demo identifiers and their
  requirements are fixed in v1.
- **NG-003**: A full notifications stack. The handler posts a single
  local notification on completion using the existing project
  notifications path (or a no-op fallback) but the spec does not require
  a notifications-permission UX flow inside this screen.
- **NG-004**: Cross-process or cross-device synchronisation of run
  history. History is per-install, persisted only to AsyncStorage and
  the App Group `UserDefaults` `spot.bgtasks.lastRun` snapshot.
- **NG-005**: Android `WorkManager` / `JobScheduler` parity, or any web
  ServiceWorker background-sync analogue. Both platforms render the
  iOS-only banner.
- **NG-006**: Production use of `_simulateLaunchForTaskWithIdentifier:`
  or any other private API in the shipping JS/Swift code.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Schedule and observe a background app refresh (Priority: P1)

A developer evaluating the showcase opens the Background Tasks card on an
iOS 13+ device, taps **Schedule App Refresh**, and wants to see (a) that
the request was accepted by `BGTaskScheduler`, (b) when iOS eventually
runs the handler, and (c) how long the handler took.

**Why this priority**: This is the canonical `BGAppRefreshTask` flow and
the smallest end-to-end demonstration of the framework. If it works, the
rest of the screen is a delta on top of it.

**Independent Test**: Launch the app on an iOS 13+ device or simulator,
open the card, tap **Schedule App Refresh**, observe the status pill
move `idle → scheduled`, then either wait for iOS to run it or use the
documented lldb command from panel 5 to trigger it manually; confirm the
status pill moves to `running → completed` and a new row appears in Run
History with `type: refresh`, a non-zero duration, and status
`completed`.

**Acceptance Scenarios**:

1. **Given** the user is on iOS 13+ and has never scheduled a refresh,
   **When** they tap **Schedule App Refresh**,
   **Then** the bridge submits a `BGAppRefreshTaskRequest` with
   identifier `com.izkizk8.spot.refresh` and
   `earliestBeginDate = now + 60s`, the status pill becomes `scheduled`,
   and no row is yet appended to Run History.
2. **Given** a refresh task is scheduled and iOS launches it (or the
   developer triggers it via lldb),
   **When** the handler completes its simulated workload,
   **Then** a new Run History row is prepended with `type: refresh`,
   non-null `started-at` / `ended-at`, a positive `duration ms`, and
   status `completed`; the status pill returns to `idle`; the
   "last run" timestamp + duration on the Schedule App Refresh card
   updates.
3. **Given** an app refresh was running but iOS signals the expiration
   handler before the workload finishes,
   **When** expiration fires,
   **Then** the run is recorded with status `expired`, `ended-at` = the
   expiration time, and `duration ms` reflects the truncated runtime.
4. **Given** the user taps **Schedule App Refresh** twice in quick
   succession,
   **When** the second submission resolves,
   **Then** the second request supersedes the first per `BGTaskScheduler`
   semantics (only one pending request per identifier) and the screen
   reflects a single `scheduled` state, not two.

---

### User Story 2 — Schedule a processing task with power+network requirements (Priority: P1)

A developer wants to demonstrate the longer-running `BGProcessingTask`
class, including the gating effect of `requiresExternalPower` and
`requiresNetworkConnectivity`.

**Why this priority**: The processing class is the feature most often
misunderstood relative to refresh; showing the requirements explicitly
is the educational core of the screen.

**Independent Test**: On an iOS 13+ device, tap **Schedule Processing**,
confirm the status pill moves to `scheduled`; while the device is on
battery and offline, confirm iOS does not run the handler; plug the
device in / re-enable network and confirm the handler eventually runs
(or trigger manually via lldb); a row with `type: processing` is added
to Run History on completion.

**Acceptance Scenarios**:

1. **Given** the user is on iOS 13+, **When** they tap **Schedule
   Processing**, **Then** the bridge submits a `BGProcessingTaskRequest`
   for identifier `com.izkizk8.spot.processing` with
   `requiresExternalPower = true` and `requiresNetworkConnectivity = true`,
   and the status pill becomes `scheduled`.
2. **Given** a processing task ran to completion,
   **When** the handler returns,
   **Then** a Run History row is prepended with `type: processing`, a
   `duration ms` ≥ the simulated 5s workload's lower bound, and status
   `completed`.
3. **Given** the system cancels the pending request before launch,
   **When** the cancellation surfaces (e.g. the developer calls
   `cancelAll()` or the OS drops it on next reschedule),
   **Then** the existing scheduled state clears to `idle` and no Run
   History row is added for the canceled request.

---

### User Story 3 — Inspect run history across relaunches (Priority: P2)

A reviewer wants to verify that the screen retains the last 20
background runs even after fully terminating and relaunching the app.

**Why this priority**: Persistence is a credibility checkpoint —
without it, the run history is just a session log and reviewers can't
tell whether iOS actually ran the task overnight.

**Independent Test**: Schedule one of each task type, terminate the app,
reopen it, navigate to the Background Tasks screen, and confirm the
prior runs are still listed in correct chronological order with a list
length capped at 20.

**Acceptance Scenarios**:

1. **Given** the run history contains 5 prior runs persisted under
   `spot.bgtasks.history`,
   **When** the user cold-launches the app and opens the screen,
   **Then** all 5 runs are rendered in the same order they were
   recorded, newest first.
2. **Given** the run history already contains 20 entries,
   **When** a new run completes,
   **Then** the oldest entry is dropped and the newest is inserted at
   the head so the list length stays at 20.
3. **Given** AsyncStorage throws on read or write,
   **When** the screen mounts (read) or a run completes (write),
   **Then** the screen renders an empty/best-effort history without
   crashing, and the error is captured into the hook's `error` state for
   display via the existing project error-banner pattern.
4. **Given** the user taps **Clear history**,
   **When** the confirmation resolves,
   **Then** the AsyncStorage key is removed, the in-memory list is
   emptied, and the empty-state line "No background runs recorded yet"
   is shown.

---

### User Story 4 — Cross-platform fallback (Priority: P3)

An Android or Web user opens the showcase, taps the Background Tasks
card (it is registered for all platforms so the catalogue stays
parity-clean), and sees a clear "iOS-only" banner alongside the static
explainer copy so they understand what they would see on iOS.

**Why this priority**: Pure parity with prior modules' cross-platform
discoverability story; not blocking, but required for catalogue
consistency.

**Acceptance Scenarios**:

1. **Given** the user is on Android, **When** they open the screen,
   **Then** they see `IOSOnlyBanner`, the `ExplainerCard`, and the
   `TestTriggerCard`; the schedule CTAs and run history are not
   rendered.
2. **Given** the user is on Web, **When** they open the screen,
   **Then** the web variant renders the iOS-only banner and explainer;
   the bridge is never imported on the web path.
3. **Given** any caller invokes `scheduleAppRefresh` or
   `scheduleProcessing` from a non-iOS code path,
   **When** the call executes,
   **Then** it throws a typed `BackgroundTasksNotSupported` error.

---

### Edge Cases

- **EC-001**: User taps **Schedule App Refresh** while a refresh is
  already `running`. The new request is queued at `BGTaskScheduler` and
  the UI shows the running state until the in-flight handler completes;
  a follow-up `scheduled` state is then reflected for the queued
  request.
- **EC-002**: Device lacks the BackgroundTasks framework (somehow
  pre-iOS 13 build). `isAvailable()` returns false; the screen renders
  the iOS-only banner with a copy variant explaining the iOS version
  floor.
- **EC-003**: User backgrounds the app immediately after tapping a
  Schedule CTA. The bridge call resolves while the app is suspended; on
  next foreground, `useBackgroundTasks` re-reads the App Group last-run
  snapshot via the AppState 'active' listener and reconciles status.
- **EC-004**: AsyncStorage's persisted value for
  `spot.bgtasks.history` is corrupt JSON. The store treats the value as
  empty, surfaces the parse failure on the hook's `error` channel, and
  overwrites it on the next successful append.
- **EC-005**: The Swift handler's expiration block fires before the
  simulated workload completes. The handler calls
  `task.setTaskCompleted(success: false)` and the run is recorded with
  status `expired`.
- **EC-006**: Two task identifiers collide with prior plugins'
  `BGTaskSchedulerPermittedIdentifiers` (none expected today, but
  defensive). The plugin merges by union and de-duplicates, never
  overwriting prior identifiers.
- **EC-007**: `app.json` already contains `UIBackgroundModes:
  ["location"]` (added by 025). The plugin produces
  `["location", "fetch", "processing"]` (or any superset preserving
  prior entries) — never `["fetch","processing"]` alone.
- **EC-008**: Local-notification permission is undetermined or denied.
  The handler still records the run; the notification post is
  best-effort and any failure is swallowed at the native side without
  affecting the Run History row.
- **EC-009**: Bundle identifier in `app.json` differs from
  `com.izkizk8.spot` (e.g. in a fork). Spec freezes the identifier
  literals; downstream consumers wishing to fork must update both the
  Swift `register` calls and the plugin in tandem (this is documented
  in the explainer card).
- **EC-010**: User taps **Clear history** while a handler is mid-run.
  The clear empties prior history; when the in-flight run completes, a
  single new row is appended (the just-completed run), not all prior
  history.

## Requirements *(mandatory)*

### Functional Requirements

#### Registry & navigation

- **FR-001**: `src/modules/registry.ts` MUST add exactly one new entry
  with `id: 'background-tasks-lab'`, label `"Background Tasks"`,
  `platforms: ['ios','android','web']`, and `minIOS: '13.0'`. No
  existing registry entries may be modified.
- **FR-002**: The registry entry MUST resolve to a manifest exported
  from `src/modules/background-tasks-lab/index.tsx` whose shape matches
  the project-wide manifest contract used by prior modules (id, label,
  platforms, minIOS, screen component reference).
- **FR-003**: The screen MUST be reachable through the existing
  showcase catalogue navigation flow without any new top-level routes.

#### Screen composition

- **FR-010**: On iOS 13+, the screen MUST render the panels in this
  fixed top-to-bottom order: ExplainerCard, ScheduleAppRefreshCard,
  ScheduleProcessingCard, RunHistoryList, TestTriggerCard.
- **FR-011**: On Android, `screen.android.tsx` MUST render
  IOSOnlyBanner, ExplainerCard, and TestTriggerCard only.
- **FR-012**: On Web, `screen.web.tsx` MUST render IOSOnlyBanner,
  ExplainerCard, and TestTriggerCard only, and MUST NOT import
  `src/native/background-tasks.ts` at module evaluation time.
- **FR-013**: When `isAvailable()` returns false on iOS (older OS
  build), the iOS screen MUST render IOSOnlyBanner with copy
  referencing the iOS 13+ floor instead of the schedule CTAs.

#### Schedule App Refresh card

- **FR-020**: The card MUST expose a single primary CTA labelled
  "Schedule App Refresh".
- **FR-021**: Tapping the CTA MUST call
  `scheduleAppRefresh(earliestBeginIntervalMs)` with a default interval
  of 60_000 ms.
- **FR-022**: The card MUST display a status pill whose value is one of
  `idle`, `scheduled`, `running`, `completed`, `expired`, `canceled`,
  derived from the latest record for `type: refresh` plus the in-flight
  scheduling state.
- **FR-023**: The card MUST display the last completed refresh's
  timestamp (localised) and duration in milliseconds when at least one
  refresh run exists; otherwise it shows an empty-state dash.

#### Schedule Processing card

- **FR-030**: The card MUST expose a single primary CTA labelled
  "Schedule Processing".
- **FR-031**: Tapping the CTA MUST call `scheduleProcessing(opts)` with
  `opts = { requiresExternalPower: true, requiresNetworkConnectivity:
  true }`.
- **FR-032**: The card MUST surface the two requirements as read-only
  visual indicators (e.g. inert toggles or chips) so the reviewer can
  see what was requested.
- **FR-033**: Status pill, last-run timestamp, and last-run duration
  rules mirror FR-022 / FR-023 for `type: processing`.

#### Run history

- **FR-040**: The screen MUST persist run records under the
  AsyncStorage key `spot.bgtasks.history` as a JSON array of
  `TaskRunRecord` items.
- **FR-041**: The list MUST be capped at 20 entries; on overflow, the
  oldest entry MUST be dropped (FIFO eviction) before the new entry is
  prepended.
- **FR-042**: Each `TaskRunRecord` MUST include: `id` (string),
  `type` (`'refresh' | 'processing'`), `scheduledAt` (epoch ms),
  `startedAt` (epoch ms | null), `endedAt` (epoch ms | null),
  `durationMs` (number | null), `status` (`'completed' | 'expired' |
  'canceled'`).
- **FR-043**: A "Clear history" affordance MUST remove the AsyncStorage
  key, empty the in-memory list, and render the empty-state line.
- **FR-044**: AsyncStorage read or write failures MUST NOT crash the
  screen; failures MUST surface on the hook's `error` channel and
  history MUST degrade to an empty list.

#### Test trigger card

- **FR-050**: The card MUST display the lldb command verbatim for both
  task identifiers and MUST allow copy-to-clipboard via the existing
  project copy affordance.
- **FR-051**: The card MUST clarify that the lldb command targets
  private API and is only suitable for debug builds during development.

#### Native (Swift) module

- **FR-060**: `BackgroundTaskManager.swift` MUST register both task
  identifiers (`com.izkizk8.spot.refresh`,
  `com.izkizk8.spot.processing`) via
  `BGTaskScheduler.shared.register(forTaskWithIdentifier:using:launchHandler:)`
  during `application(_:didFinishLaunchingWithOptions:)`.
- **FR-061**: The refresh handler MUST execute a small simulated
  workload — a numeric sum plus a sleep on the order of ~2 seconds —
  and MUST call `task.setTaskCompleted(success:)` exactly once,
  including from within `task.expirationHandler`.
- **FR-062**: The processing handler MUST execute a longer simulated
  workload on the order of ~5 seconds with the same completion / expiry
  contract as FR-061.
- **FR-063**: On every handler entry and exit, the manager MUST write a
  snapshot of the most recent run (id, type, scheduled-at, started-at,
  ended-at, duration, status) to App Group `UserDefaults` under the key
  `spot.bgtasks.lastRun`.
- **FR-064**: The manager MUST submit a local notification on
  successful completion via the project's existing notifications path;
  failure to post the notification MUST NOT alter the recorded run
  status.
- **FR-065**: The manager MUST expose, through the JS bridge,
  `getLastRun()`, `getRegisteredIdentifiers()`, `scheduleAppRefresh`,
  `scheduleProcessing`, `cancelAll`, and `isAvailable`.

#### JS bridge

- **FR-070**: `src/native/background-tasks.ts` MUST export the typed
  surface: `scheduleAppRefresh(earliestBeginIntervalMs: number):
  Promise<void>`, `scheduleProcessing(opts: { requiresExternalPower:
  boolean; requiresNetworkConnectivity: boolean }): Promise<void>`,
  `cancelAll(): Promise<void>`, `getLastRun(): Promise<TaskRunRecord |
  null>`, `getRegisteredIdentifiers(): string[]`, `isAvailable():
  boolean`.
- **FR-071**: All non-iOS implementations MUST throw
  `BackgroundTasksNotSupported` on every method except `isAvailable()`
  (which returns `false`) and `getRegisteredIdentifiers()` (which
  returns `[]`).
- **FR-072**: The `BackgroundTasksNotSupported` error MUST be a typed
  class export so consumers can `instanceof`-check at the import
  boundary.

#### Hook

- **FR-080**: `useBackgroundTasks` MUST return `{ schedule(type:
  'refresh' | 'processing'), cancelAll, lastRunByType, history, error }`.
- **FR-081**: The hook MUST refresh status on mount and whenever
  AppState transitions to `active`, by reading `getLastRun()` and the
  AsyncStorage history snapshot.
- **FR-082**: `cancelAll()` MUST flush in-memory scheduled state to
  `idle` for both task types after the bridge resolves.
- **FR-083**: All bridge interactions MUST be serialised through the
  hook's reducer so concurrent schedules do not produce inconsistent
  status pills.

#### Plugin

- **FR-090**: `plugins/with-background-tasks/` MUST add the two task
  identifiers under `Info.plist`'s
  `BGTaskSchedulerPermittedIdentifiers` array; if the array already
  exists it MUST be merged by union and de-duplicated.
- **FR-091**: The plugin MUST add `"fetch"` and `"processing"` to
  `Info.plist`'s `UIBackgroundModes` array; if the array already
  exists (e.g. from feature 025 with `["location"]`) the plugin MUST
  preserve every prior entry and append only missing values.
- **FR-092**: The plugin MUST be idempotent: running it twice in
  succession on the same `Info.plist` MUST produce a byte-identical
  result to running it once.
- **FR-093**: The plugin MUST coexist with all prior plugins (013, 014,
  019, 023, 025, 027, 028, 029, …): when run sequentially in `app.json`
  declaration order, no prior plugin's keys are removed, reordered, or
  overwritten.

#### Repository hygiene

- **FR-100**: No `eslint-disable` directives may be introduced in any
  file added or modified by this feature.
- **FR-101**: `pnpm format` MUST be run before the final commit; the
  resulting diff MUST be the only formatting delta.
- **FR-102**: `pnpm check` (the project's aggregate lint+typecheck+test
  gate) MUST pass green on the feature branch prior to merge.
- **FR-103**: All native bridges MUST be mocked at the import boundary
  in unit tests; no test may exercise the real native module.

### Key Entities

- **TaskRunRecord**: One historical execution of a background task.
  Fields: `id` (uuid), `type` (`'refresh' | 'processing'`),
  `scheduledAt`, `startedAt`, `endedAt`, `durationMs`, `status`
  (`'completed' | 'expired' | 'canceled'`).
- **LastRunSnapshot**: The single most-recent run per task type, as
  stored in App Group `UserDefaults` under `spot.bgtasks.lastRun`.
  Shape: `{ refresh: TaskRunRecord | null; processing: TaskRunRecord |
  null }`.
- **ScheduledState**: Per-task in-memory status pill value, derived
  from the most recent successful schedule submission and the latest
  `LastRunSnapshot`.

## Non-Functional Requirements

- **NFR-001 (Performance)**: Screen mount to first meaningful paint
  MUST complete within 250 ms on a mid-tier iPhone (excluding any
  awaited bridge calls, which run in parallel).
- **NFR-002 (Reliability)**: AsyncStorage read/write failures, App
  Group read failures, and notification-post failures MUST never crash
  the screen; each MUST degrade to an observable error on the hook's
  `error` channel.
- **NFR-003 (Battery)**: The simulated workloads MUST be small enough
  that running them does not measurably affect device battery in a
  reviewer's session (≤5s wall-clock per processing run; ≤2s per
  refresh run).
- **NFR-004 (Privacy)**: No PII is collected, persisted, or
  transmitted. Run records contain only timestamps, durations, an
  internal uuid, the task type, and a status enum.
- **NFR-005 (Compatibility)**: Coexists additively with every prior
  plugin and registry entry; running the feature's plugin against a
  fresh `Info.plist` and against an `Info.plist` already containing
  feature 025's `UIBackgroundModes: ["location"]` both produce valid
  manifests.
- **NFR-006 (Offline)**: All UI states (history list, last-run
  snapshot, explainer copy) render without network. The
  `requiresNetworkConnectivity` flag affects only when iOS chooses to
  launch the processing handler, not when the UI renders.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A reviewer who has never used `BGTaskScheduler` can,
  within 60 seconds of opening the card, identify which CTA schedules
  short-frequent work versus longer batch work — verified by a single
  read of the explainer card and the two CTA labels.
- **SC-002**: From a cold launch, the in-app schedule of a
  `BGAppRefreshTask` returns from the bridge in under 250 ms on a
  mid-tier iPhone.
- **SC-003**: When manually triggered via the documented lldb command,
  100% of triggered handlers record exactly one new Run History row
  with non-null `startedAt` / `endedAt` and a positive `durationMs`.
- **SC-004**: After a forced terminate + relaunch, ≥ 99% of previously
  persisted run records (up to the 20-entry cap) are still rendered in
  correct order, given AsyncStorage is healthy.
- **SC-005**: Plugin idempotency: running `expo prebuild` twice
  consecutively produces a byte-identical `Info.plist`.
- **SC-006**: Zero `eslint-disable` directives are introduced; `pnpm
  check` passes green; `pnpm format` produces no further diff after the
  feature commit.
- **SC-007**: Cross-platform safety: importing
  `src/modules/background-tasks-lab` on Android or Web does not pull
  the iOS-only bridge module into the bundle (verified by the bundler
  not erroring and by `screen.web.tsx` / `screen.android.tsx` rendering
  without exception in unit tests).
- **SC-008**: Coexistence: running this plugin after every prior
  feature's plugin in `app.json` order yields an `Info.plist` whose
  `UIBackgroundModes` is a superset of `["location", "fetch",
  "processing"]` (preserving 025's entry).

## Acceptance Criteria

- **AC-BGT-001**: `src/modules/registry.ts` size grows by exactly one
  entry; the diff touches no other registry entry.
- **AC-BGT-002**: `app.json` `plugins` array gains exactly one new
  entry (`./plugins/with-background-tasks`); no other plugin entries
  are reordered or removed.
- **AC-BGT-003**: Snapshot of `Info.plist` after `expo prebuild`
  contains `BGTaskSchedulerPermittedIdentifiers` = a superset
  containing both `com.izkizk8.spot.refresh` and
  `com.izkizk8.spot.processing`, and `UIBackgroundModes` containing at
  minimum `["fetch", "processing"]` (plus any prior entries such as
  `"location"`).
- **AC-BGT-004**: All eight test files exist and pass:
  `history-store.test.ts`, `useBackgroundTasks.test.tsx`,
  `components/{ExplainerCard,ScheduleAppRefreshCard,ScheduleProcessingCard,RunHistoryList,TestTriggerCard,IOSOnlyBanner}.test.tsx`,
  `screen.test.tsx` + `.android.test.tsx` + `.web.test.tsx`,
  `native/background-tasks.test.ts`,
  `plugins/with-background-tasks/index.test.ts`, `manifest.test.ts`.
- **AC-BGT-005**: `history-store.test.ts` proves: append, list, clear,
  cap-at-20, and AsyncStorage error tolerance.
- **AC-BGT-006**: `useBackgroundTasks.test.tsx` proves: schedule calls
  the bridge with the expected arguments per task type; status
  reflects the latest scheduled state; AppState change to `active`
  triggers a status refresh; `cancelAll` clears scheduled state.
- **AC-BGT-007**: `native/background-tasks.test.ts` proves: bridge
  contract matches the typed surface; non-iOS stubs throw
  `BackgroundTasksNotSupported`; iOS code path delegates to the
  underlying native module (mocked).
- **AC-BGT-008**: `plugins/with-background-tasks/index.test.ts`
  proves: it adds the two task ids; idempotent on second run; coexists
  with all prior plugins run sequentially; preserves any prior
  `UIBackgroundModes` entries (specifically asserts that 025's
  `"location"` is preserved when present).
- **AC-BGT-009**: `manifest.test.ts` proves: registry entry has the
  expected id, label, platforms, and `minIOS`.
- **AC-BGT-010**: `pnpm check` passes green; no `eslint-disable`
  directives are introduced; `pnpm format` is a no-op after the final
  commit.

## Out of Scope

- Real background fetch work (HTTP, sync, prefetch).
- User-configurable task identifiers, intervals, or requirements
  beyond the two fixed demos.
- Notifications-permission UX; this feature reuses whatever path the
  app already provides and best-effort posts.
- Android `WorkManager` / Web `Background Sync` parity.
- Production use of `_simulateLaunchForTaskWithIdentifier:`.
- Telemetry, analytics, or remote config.

## Open Questions (resolved)

The user marked themselves unavailable for clarification. The following
decisions were resolved autonomously by the most reasonable additive
interpretation, consistent with prior features (025–029):

- **DECISION 1 — Default `earliestBeginInterval`**: 60 seconds for
  refresh requests. Rationale: iOS treats this as a lower bound only,
  and 60s makes the scheduled→running transition observable in a
  reasonable demo session without abusing the system. (NG-001)
- **DECISION 2 — Processing requirements default**: Both
  `requiresExternalPower` and `requiresNetworkConnectivity` are set to
  `true` per the feature description; a v2 could expose toggles, but
  v1 keeps them fixed (NG-002).
- **DECISION 3 — Run history cap**: 20 entries (per the feature
  description) with FIFO eviction; rationale: bounded storage,
  reviewer can see at least a week of typical activity.
- **DECISION 4 — Task identifiers**: Literal strings
  `com.izkizk8.spot.refresh` and `com.izkizk8.spot.processing`,
  derived from the existing `app.json` bundle id. The explainer card
  documents derivation; the Swift `register(forTaskWithIdentifier:)`
  calls and the plugin reference these literals to prevent drift.
- **DECISION 5 — App Group key naming**: `spot.bgtasks.lastRun` for
  the per-type latest snapshot in App Group `UserDefaults`;
  `spot.bgtasks.history` for the AsyncStorage-persisted list. Mirrors
  the dot-namespaced convention from features 014 / 028 / 029.
- **DECISION 6 — Notifications**: A best-effort local notification on
  completion using the existing project notifications path; failure
  does not affect run-history recording. No new permission UX.
- **DECISION 7 — Cross-platform behaviour**: Card is registered for
  all platforms (per the feature description); Android and Web render
  IOSOnlyBanner + ExplainerCard + TestTriggerCard so the catalogue
  stays parity-clean. The bridge is not imported on the web path.
- **DECISION 8 — Test-trigger UX**: Static copy + copy-to-clipboard
  only; no in-app invocation of `_simulateLaunchForTaskWithIdentifier:`,
  which is private API.
- **DECISION 9 — Plugin merge semantics**: Both
  `BGTaskSchedulerPermittedIdentifiers` and `UIBackgroundModes` are
  merged by union, de-duplicated, with prior entries preserved. The
  plugin never removes or reorders prior entries.
- **DECISION 10 — Status pill states**: Six values total — `idle`,
  `scheduled`, `running`, `completed`, `expired`, `canceled` —
  matching the `BGTaskScheduler` lifecycle plus the cancellation
  affordance.
- **DECISION 11 — Workload sizes**: ~2s for refresh, ~5s for
  processing (per the feature description); rationale: refresh stays
  well under the iOS 30s budget; processing is long enough to make
  the duration visible without holding the system for an unreasonable
  time.
- **DECISION 12 — Error surfacing**: All hook-level errors flow
  through a single `error` field on the hook return, consistent with
  features 028 / 029. No screen-level error boundary is introduced.
