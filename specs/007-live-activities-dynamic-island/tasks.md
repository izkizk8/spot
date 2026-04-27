---
description: "Task list for Live Activities + Dynamic Island Showcase"
---

# Tasks: Live Activities + Dynamic Island Showcase

**Input**: Design documents from `specs/007-live-activities-dynamic-island/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/live-activity-bridge.md, contracts/activity-attributes.md, quickstart.md

**Tests**: Included. FR-026 mandates jest-expo + RNTL coverage of (a) manifest invariants + registry inclusion, (b) the JS bridge non-iOS contract, (c) the demo screen's button enable/disable across states, and (d) the config plugin's Info.plist mutation + target registration + idempotency. The constitution's Test-First principle is binding (plan.md §Constitution Check, principle V). The Swift Widget Extension is exempt per the constitution's "no applicable test framework" clause; manual on-device verification per `quickstart.md` is the test of record for Swift code (see plan.md §Constitution Check, principle V).

**Organization**: Tasks are grouped by user story (US1–US4) so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on incomplete tasks)
- **[Story]**: US1 / US2 / US3 / US4 — only on user-story phase tasks
- All paths are repository-root-relative

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the one new (dev)dependency and create the empty directory skeleton the rest of the work fills in. No business logic yet.

- [X] T001 Install `@expo/config-plugins` via `npx expo install @expo/config-plugins` (updates `package.json` + `pnpm-lock.yaml`); confirm the installed version is the SDK 55–aligned one. This is the only new (dev)dependency for the feature (plan.md §Technical Context, quickstart.md §Install)
- [X] T002 [P] Create empty directories `plugins/with-live-activity/`, `ios-widget/`, `src/modules/live-activity-demo/`, `test/unit/native/`, `test/unit/plugins/with-live-activity/`, `test/unit/modules/live-activity-demo/` (use `.gitkeep` files where needed so they can be committed before content lands)
- [X] T003 [P] Verify baseline `pnpm check` (format, lint, typecheck, jest) is green on `007-live-activities-dynamic-island` before any feature code is added; capture the run as the pre-change baseline

**Checkpoint**: Dependency in place, skeleton ready, baseline green.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the typed bridge contract, both non-iOS stubs, the Swift `ActivityAttributes` + Widget visuals, the config plugin, the module manifest, the screen scaffold, and the registry registration. Until this phase completes, no user story can compile, the Modules card cannot appear, and the Widget Extension cannot be wired into the iOS project.

**⚠️ CRITICAL**: No US task may begin until Phase 2 is done.

### Bridge types and non-iOS stubs

- [X] T004 [P] Create `src/native/live-activity.types.ts` defining `LiveActivityState`, `LiveActivityStartArgs`, `LiveActivitySession`, the `LiveActivityBridge` interface, and the three error classes (`LiveActivityNotSupportedError`, `LiveActivityAuthorisationError`, `LiveActivityNoActiveSessionError`) exactly as specified in `contracts/live-activity-bridge.md` and `data-model.md` E1/E2/E4 (readonly fields, `code` discriminants preserved, no `any`)
- [X] T005 [P] Create `src/native/live-activity.android.ts` exporting a default object satisfying `LiveActivityBridge`: `isAvailable()` returns `false`; `start`/`update`/`end` reject with `LiveActivityNotSupportedError`; `current()` resolves `null`. MUST NOT call `requireNativeModule` and MUST NOT throw at import time (FR-018, contract §Invariants)
- [X] T006 [P] Create `src/native/live-activity.web.ts` mirroring T005 with identical semantics for the web target (FR-018)

### iOS bridge skeleton (concrete method bodies land in US phases)

- [X] T007 Create `src/native/live-activity.ts` (iOS impl) that: imports `requireOptionalNativeModule` from `expo-modules-core`, resolves the `LiveActivityDemo` native module (`null` if missing), implements `isAvailable()` as `Platform.OS === 'ios' && parseFloat(Version) >= 16.1 && native !== null`, defines a private `mapNativeError(e)` helper that converts native error codes (`'AUTHORISATION'`, `'NO_SESSION'`, `'ALREADY_RUNNING'`, `'NOT_SUPPORTED'`) to the typed errors from T004, and exports a default object satisfying `LiveActivityBridge`. Method bodies for `start`/`update`/`end` are populated in T021 / T029 / T033; `current()` is populated in T020. The default export MUST structurally satisfy `LiveActivityBridge` from day one so `screen.tsx` compiles

### Config plugin (`plugins/with-live-activity/`)

- [X] T008 [P] Create `plugins/with-live-activity/package.json` declaring the local plugin (name `with-live-activity`, `main: "index.ts"`, no published version) so `app.json`'s `"./plugins/with-live-activity"` entry resolves
- [X] T009 [P] Create `plugins/with-live-activity/set-info-plist.ts` exporting a `withInfoPlist`-based `ConfigPlugin` that sets `NSSupportsLiveActivities = true` in the main app's `Info.plist`. MUST be idempotent — running the plugin twice MUST NOT duplicate or flip the value (FR-021, FR-022, SC-008)
- [X] T010 [P] Create `plugins/with-live-activity/add-widget-extension.ts` exporting a `withXcodeProject`-based `ConfigPlugin` that: (a) adds a `LiveActivityDemoWidget` Widget Extension target if not already present, (b) file-references the four files under `ios-widget/` (`LiveActivityDemoAttributes.swift`, `LiveActivityDemoWidget.swift`, `LiveActivityDemoModule.swift`, `Info.plist`) into the appropriate targets (Attributes is referenced by both targets; Widget is in the extension only; Module is in the main app target only), (c) embeds the extension via the main app's "Embed App Extensions" build phase. Existence checks MUST key on the stable target name `LiveActivityDemoWidget`, not on UUIDs (quickstart.md §Troubleshooting). MUST be idempotent (FR-022, SC-008)
- [X] T011 [P] Create `plugins/with-live-activity/index.ts` composing T009 + T010 into a single default-exported `ConfigPlugin` that runs both steps in order, returns the modified `ExpoConfig`, and accepts no options
- [X] T012 Modify `app.json` to append `"./plugins/with-live-activity"` to `expo.plugins` (only if not already present — keep the diff minimal, do not reorder existing plugins)

### iOS Widget Extension sources (`ios-widget/`)

- [X] T013 [P] Create `ios-widget/LiveActivityDemoAttributes.swift` per `contracts/activity-attributes.md`: `@available(iOS 16.1, *)` `public struct LiveActivityDemoAttributes: ActivityAttributes` with `public struct ContentState: Codable, Hashable { public var counter: Int }`, `public var name: String`, both initialisers asserting their preconditions (`counter >= 0`, `!name.isEmpty`)
- [X] T014 [P] Create `ios-widget/LiveActivityDemoWidget.swift` declaring exactly one `ActivityConfiguration<LiveActivityDemoAttributes>` rendering: Lock Screen view (SF Symbol leading + name + counter trailing + `ProgressView` underneath bound to `min(1.0, Double(state.counter) / 10.0)`), Dynamic Island compact leading (SF Symbol only), compact trailing (counter as text), expanded (top: SF Symbol + name; bottom: counter + `ProgressView`), and minimal (SF Symbol only). SF Symbols + system colours only — no custom fonts, no bundled images, no custom hex colours (FR-014, FR-015, contracts/activity-attributes.md §Render contract)
- [X] T015 [P] Create `ios-widget/LiveActivityDemoModule.swift` — an Expo Modules API native module named `LiveActivityDemo` exposing `isAvailable` (sync), `start` (async), `update` (async), `end` (async), and `current` (async). Stub all method bodies to `throw NSError(domain: "LiveActivityDemo", code: 0, userInfo: [NSLocalizedDescriptionKey: "not implemented"])` — concrete bodies are filled in by T022 / T028 / T032 per user story. The module class skeleton, `Function`/`AsyncFunction` declarations, and the error-code → JS-side error-class mapping table (`AUTHORISATION`, `NO_SESSION`, `ALREADY_RUNNING`, `NOT_SUPPORTED`) MUST be in place so US phases only fill bodies (contracts/activity-attributes.md §Authoring rules)
- [X] T016 [P] Create `ios-widget/Info.plist` for the Widget Extension target with the standard `NSExtension` keys (`NSExtensionPointIdentifier = com.apple.widgetkit-extension`) and a bundle name matching the target

### Module entry, screen scaffold, and registry registration

- [X] T017 [P] Create `src/modules/live-activity-demo/index.tsx` exporting the default `ModuleManifest` exactly as specified in `data-model.md` E5: `{ id: 'live-activity-demo', title: 'Live Activity Demo', description: 'A counter that lives on your Lock Screen and Dynamic Island.', icon: { ios: 'bolt.badge.clock', fallback: '⚡' }, platforms: ['ios'], minIOS: '16.1', render: () => <LiveActivityDemoScreen /> }` (FR-001, FR-002)
- [X] T018 Create `src/modules/live-activity-demo/screen.tsx` scaffold — a function component using `ThemedView` + `ThemedText`, drawing every spacing value from `Spacing` in `src/constants/theme.ts`, every style via `StyleSheet.create()`. Layout: a screen header, a status line ("No activity running" / "Activity running — counter N"), three buttons (Start / Update / End) wired to `bridge.start` / `bridge.update` / `bridge.end` from `@/native/live-activity`. Local state: `session: LiveActivitySession | null`, `errorMessage: string | null`. On mount, call `bridge.current()` and seed `session` from the result (FR-009 reconcile). Buttons are disabled per FR-008 (Start when `session !== null`; Update + End when `session === null`). Concrete handler bodies for Start / Update / End are populated in T024 / T030 / T034 — for now they can be no-op stubs returning `Promise.resolve()`. All styles via `StyleSheet.create()` (FR-007)
- [X] T019 Modify `src/modules/registry.ts` to import the manifest from `./live-activity-demo` and append it to `MODULES` (one new import line + one new array entry, matching the "Add new modules here ↓" comment block — FR-001, FR-005). No other shell file may be touched

### Foundational tests (must fail until their implementations land)

- [X] T020 [P] Write `test/unit/native/live-activity.test.ts` covering the bridge non-iOS contract: importing `live-activity.android.ts` and `live-activity.web.ts` MUST NOT throw; the default exports satisfy `LiveActivityBridge`; `isAvailable()` returns `false`; `start({name:'demo', initialCounter:0})`, `update({counter:1})`, `end()` each reject with a `LiveActivityNotSupportedError` whose `code === 'LIVE_ACTIVITY_NOT_SUPPORTED'`; `current()` resolves `null`. Also verify (TS-only) that no exported function uses `any` and that the iOS file's default export structurally satisfies `LiveActivityBridge` (compile-time test) (FR-018, FR-026c, contract §Invariants)
- [X] T021 [P] Write `test/unit/plugins/with-live-activity/index.test.ts` covering: (a) running the composed plugin against a fixture `ExpoConfig` sets `NSSupportsLiveActivities = true` in the resulting `Info.plist`; (b) running the plugin against a fixture `pbxproj` adds a target whose product name is `LiveActivityDemoWidget` and embeds it in the main app's "Embed App Extensions" build phase; (c) running the plugin twice in sequence yields the *same* `ExpoConfig` (deep-equal) and does NOT duplicate the target, the file references, or the `Info.plist` key (FR-022, SC-008, FR-026 implicit via the plugin)
- [X] T022 [P] Write `test/unit/modules/live-activity-demo/manifest.test.ts` covering: (a) the exported manifest's `id` matches `/^[a-z][a-z0-9-]*$/` and equals `'live-activity-demo'`; (b) `platforms` is `['ios']`; (c) `minIOS` is `'16.1'` (matches `/^\d+(\.\d+){0,2}$/`); (d) `icon.ios` is a non-empty string and `icon.fallback` is non-empty; (e) `render` is a function; (f) the registry from `src/modules/registry.ts` includes exactly one entry with `id === 'live-activity-demo'` (FR-001, FR-002, FR-026a, FR-026b)

**Checkpoint**: Bridge contract typed; non-iOS stubs complete and tested; iOS bridge skeleton compiles; config plugin scaffolded with idempotency tests; Widget Extension Swift files exist with correct shape; module manifest + screen scaffold present; registry includes the new module. The card now appears in the Modules grid on every platform (US4 will validate the badging). User stories can be worked on in parallel.

---

## Phase 3: User Story 1 — Start a Live Activity (Priority: P1) 🎯 MVP

**Goal**: On iOS 16.1+ with Live Activities authorised, tapping Start in the Live Activity Demo screen makes a Live Activity appear on the Lock Screen and in all three Dynamic Island presentations within 1 second, and the in-app status display flips to "Activity running" with the initial counter (SC-001).

**Independent Test**: On a physical iPhone running iOS 16.1+ with Live Activities authorised, install the dev client (`pnpm ios:ipa`), open Modules → Live Activity Demo → Start. Lock Screen + Dynamic Island show the activity within 1 s; in-app status reads "Activity running" with the initial counter (quickstart.md row 1.1). On a second tap, no second activity is created and the user sees a clear in-app message (quickstart.md row 1.4).

### Tests for User Story 1 ⚠️ (write first, must fail before implementation)

- [X] T023 [P] [US1] Extend `test/unit/modules/live-activity-demo/screen.test.tsx` (create the file in this task) with three cases for the Start path: (a) on mount, the screen calls `bridge.current()` and renders "No activity running" when it resolves `null`; (b) tapping Start while no activity runs invokes `bridge.start({ name, initialCounter: 0 })`, then on success the status flips to "Activity running — counter 0" and the Start button becomes disabled while Update + End become enabled (FR-008); (c) when `bridge.start` rejects with `LiveActivityAuthorisationError`, the status remains "No activity running" and a non-technical message naming "iOS Settings" is rendered (FR-024, SC-005); when it rejects with the "already running" sub-case, a clear message is rendered without crashing (spec edge case 2). All assertions go through `@testing-library/react-native` queries — never read internal state. Mock `@/native/live-activity` at the top of the file (FR-026d)

### Implementation for User Story 1

- [X] T024 [US1] Implement the iOS bridge `start` method in `src/native/live-activity.ts`: validate `args.name.length >= 1` and `args.initialCounter >= 0` JS-side, call the native module's `start`, await the resolved `LiveActivitySession` shape, and on rejection map error codes via the helper from T007 (`AUTHORISATION` → `LiveActivityAuthorisationError`; `ALREADY_RUNNING` → typed error message surfaced to screen; `NOT_SUPPORTED` → `LiveActivityNotSupportedError`)
- [X] T025 [US1] Implement the iOS bridge `current` method in `src/native/live-activity.ts`: delegate to the native module's `current`; return its result unchanged. MUST NOT throw — on any native error, resolve `null` so screen mount never crashes (FR-009, contract `current()` description)
- [X] T026 [US1] Implement `start` in `ios-widget/LiveActivityDemoModule.swift`: check `ActivityAuthorizationInfo().areActivitiesEnabled` and throw the `AUTHORISATION` coded error if false (FR-019, FR-024); refuse to start a second activity if `Activity<LiveActivityDemoAttributes>.activities` is non-empty by throwing the `ALREADY_RUNNING` coded error (spec edge case 2); call `Activity<LiveActivityDemoAttributes>.request(attributes: .init(name:), contentState: .init(counter: initialCounter), pushType: nil)` and return the session as `{ id, attributes: { name, initialCounter }, state: { counter } }`. Local-only — MUST NOT use APNs (FR-013)
- [X] T027 [US1] Implement `current` in `ios-widget/LiveActivityDemoModule.swift`: read `Activity<LiveActivityDemoAttributes>.activities.first` and return the same shape as T026 (or `nil` if none). MUST NOT throw (contract §`current()`)
- [X] T028 [US1] Implement the Start handler and on-mount reconcile in `src/modules/live-activity-demo/screen.tsx`: in the `useEffect` from T018, await `bridge.current()` and seed `session` from the result; in the Start handler, call `bridge.start({ name: 'Live Activity Demo', initialCounter: 0 })`, store the resolved session in local state, clear `errorMessage`; in the `catch`, narrow on `error.code` and set the appropriate `errorMessage` string (`LIVE_ACTIVITY_AUTHORISATION` → "Live Activities are off for this app. Open iOS Settings → spot → Live Activities to enable them."; `LIVE_ACTIVITY_NOT_SUPPORTED` → "Live Activities are not supported on this device."; otherwise → a generic non-technical message). Render `errorMessage` via a `ThemedText` line beneath the status — never display `error.message` directly (contract §Consumer responsibilities; FR-023, FR-024)

**Checkpoint**: Story 1 demoable end-to-end on a physical iPhone 14 Pro+ running iOS 16.1+ — Start brings up the Lock Screen + DI presentations within 1 s, the in-app status updates, the second-tap and authorisation-denied paths render their messages without crashing.

---

## Phase 4: User Story 2 — Update the activity's state (Priority: P2)

**Goal**: With an activity running, tapping Update advances the counter (+1), and the new state propagates to the Lock Screen, all three Dynamic Island presentations, and the in-app status display within 500 ms (SC-002).

**Independent Test**: With Story 1 verified, tap Update three times. Confirm the counter increments on the Lock Screen, in the Dynamic Island compact + expanded views, and in the in-app status — all surfaces stay in sync (quickstart.md rows 2.1–2.2). With no activity running, Update is disabled in the UI and, if invoked programmatically (test path), produces a no-op message rather than a crash (FR-025, quickstart row 2.3).

### Tests for User Story 2 ⚠️ (write first, must fail before implementation)

- [X] T029 [P] [US2] Extend `test/unit/modules/live-activity-demo/screen.test.tsx` with two cases for the Update path: (a) when an activity is running (seeded by a successful Start in test setup), tapping Update invokes `bridge.update({ counter: prev + 1 })`, the status text updates to reflect the new counter, and Start remains disabled while Update + End remain enabled (FR-008, FR-011); (b) when `bridge.update` rejects with `LiveActivityNoActiveSessionError`, the screen reconciles to "No activity running", clears the local session handle, and renders a non-technical "nothing to update" message without crashing (FR-025, spec edge case 3)

### Implementation for User Story 2

- [X] T030 [US2] Implement the iOS bridge `update` method in `src/native/live-activity.ts`: validate `state.counter >= 0` JS-side, call the native module's `update(state)`, return the updated `LiveActivitySession`; map `NO_SESSION` → `LiveActivityNoActiveSessionError`, `NOT_SUPPORTED` → `LiveActivityNotSupportedError` via the T007 helper
- [X] T031 [US2] Implement `update` in `ios-widget/LiveActivityDemoModule.swift`: locate the in-flight activity via `Activity<LiveActivityDemoAttributes>.activities.first`; if none, throw the `NO_SESSION` coded error; otherwise call `await activity.update(using: .init(counter: newCounter))` and return the updated session shape (FR-011, contracts/activity-attributes.md §Authoring rules)
- [X] T032 [US2] Implement the Update handler in `src/modules/live-activity-demo/screen.tsx`: read the local `session.state.counter`, call `bridge.update({ counter: counter + 1 })`, store the resolved session, clear `errorMessage`; on `LIVE_ACTIVITY_NO_SESSION`, set `session` to `null` and render the "nothing to update" message; on `LIVE_ACTIVITY_NOT_SUPPORTED`, render the not-supported message. Update button MUST be disabled by render logic when `session === null` (FR-008)

**Checkpoint**: Story 2 demoable on the physical iPhone — three taps of Update produce three counter increments visible on the Lock Screen, in both Dynamic Island presentations, and in the in-app status, all within 500 ms each.

---

## Phase 5: User Story 3 — End the activity cleanly (Priority: P3)

**Goal**: Tapping End removes the Live Activity from the Lock Screen and the Dynamic Island within 1 second and flips the in-app status display back to "No activity running" (SC-003). A subsequent Start begins a fresh activity from the initial counter value.

**Independent Test**: With an activity running (Story 1 satisfied), tap End. Confirm the activity disappears from the Lock Screen and the Dynamic Island within 1 s, the in-app status reads "No activity running", and tapping Start afterwards begins a fresh activity from `counter = 0` (quickstart.md rows 3.1, 3.3). With no activity running, End is disabled in the UI and, if invoked programmatically, produces a no-op message (FR-025, quickstart row 3.2).

### Tests for User Story 3 ⚠️ (write first, must fail before implementation)

- [X] T033 [P] [US3] Extend `test/unit/modules/live-activity-demo/screen.test.tsx` with two cases for the End path: (a) when an activity is running, tapping End invokes `bridge.end()`, then on success the status flips to "No activity running", local `session` is cleared, the Start button becomes enabled, and Update + End become disabled (FR-008, FR-012); (b) when `bridge.end` rejects with `LiveActivityNoActiveSessionError`, the screen reconciles to "No activity running" and renders a non-technical "nothing to end" message without crashing (FR-025)

### Implementation for User Story 3

- [X] T034 [US3] Implement the iOS bridge `end` method in `src/native/live-activity.ts`: call the native module's `end()`, resolve `void` on success; map `NO_SESSION` → `LiveActivityNoActiveSessionError`, `NOT_SUPPORTED` → `LiveActivityNotSupportedError` via the T007 helper
- [X] T035 [US3] Implement `end` in `ios-widget/LiveActivityDemoModule.swift`: locate the in-flight activity; if none, throw the `NO_SESSION` coded error; otherwise call `await activity.end(dismissalPolicy: .immediate)` so the activity disappears from the Lock Screen + DI within 1 s (FR-012, contracts/activity-attributes.md §Authoring rules)
- [X] T036 [US3] Implement the End handler in `src/modules/live-activity-demo/screen.tsx`: call `bridge.end()`, set `session` to `null`, clear `errorMessage`; on `LIVE_ACTIVITY_NO_SESSION`, set `session` to `null` and render the "nothing to end" message; on `LIVE_ACTIVITY_NOT_SUPPORTED`, render the not-supported message. End button MUST be disabled by render logic when `session === null` (FR-008)

**Checkpoint**: Story 3 demoable — End cleanly tears down the activity within 1 s and a fresh Start begins from `counter = 0`.

---

## Phase 6: User Story 4 — Graceful gating on non-iOS and iOS < 16.1 (Priority: P4)

**Goal**: On Android, web, and iOS < 16.1, the Live Activity Demo card appears in the Modules grid with the correct unavailable badge and tapping the card never crashes (SC-004). On iOS 16.1+ with Live Activities disabled in iOS Settings, tapping Start surfaces a non-technical message naming iOS Settings as the place to re-enable them (SC-005).

**Independent Test**: Run the app on Android, on web, and on an iOS 16.0 simulator. Verify the card appears with the right badge ("iOS only" on Android/web; "Requires iOS 16.1+" on the iOS 16.0 simulator), and tapping the card does not crash. On iOS 16.1+ with Live Activities disabled in Settings, tap Start and confirm the in-app message names iOS Settings (quickstart.md rows 4.1–4.4). Most of this surface is wired by the spec 006 registry contract; this story validates the new manifest configures it correctly.

### Tests for User Story 4 ⚠️ (write first, must fail before implementation)

- [X] T037 [P] [US4] Extend `test/unit/modules/live-activity-demo/screen.test.tsx` with one case asserting that when `bridge.isAvailable()` returns `false` (the non-iOS / iOS < 16.1 path), the screen renders a clear "Live Activities are not available on this platform" notice via `ThemedText`, the Start / Update / End buttons are all disabled, and tapping any of them does not throw (FR-018, FR-026d, edge case "Module loaded on a platform where its native dependencies are absent")

### Implementation for User Story 4

- [X] T038 [US4] Add the unavailable-platform branch to `src/modules/live-activity-demo/screen.tsx`: at render time, if `bridge.isAvailable() === false`, render the notice from T037 instead of the Start/Update/End controls (or render the controls disabled with the notice on top — pick one and make T037 match). This branch is the screen-level safety net layered on top of the registry-level "iOS only" / "Requires iOS 16.1+" badging (which is owned by the spec 006 grid + detail route) so the screen still degrades gracefully if it is somehow rendered on an unsupported target
- [ ] T039 [US4] Manually verify the registry-level badging on Android emulator, web (Chromium), and an iOS 16.0 simulator: open Modules; confirm the Live Activity Demo card shows the right badge and tapping it does not crash (rows 4.1, 4.2, 4.3 of quickstart). Record results in the PR description (SC-004)
- [ ] T040 [US4] On a physical iPhone running iOS 16.1+, disable Live Activities for the app in iOS Settings → spot → Live Activities, then open the Live Activity Demo and tap Start. Confirm the message names "iOS Settings" as the remediation and that the app does not crash (row 4.4 of quickstart). Record the result in the PR description (SC-005, FR-024)

**Checkpoint**: All four user stories independently demonstrable. The card is correctly badged on every unsupported target and surfaces the right user-facing messages on the supported one.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T041 [P] Run `pnpm format` and commit any formatting deltas
- [X] T042 [P] Run `pnpm lint` (oxlint + eslint) and resolve any new findings introduced by this feature
- [X] T043 [P] Run `pnpm typecheck` (`tsc --noEmit`) and resolve any new errors; in particular, verify that the default exports of all three `src/native/live-activity{.ts,.android.ts,.web.ts}` files structurally satisfy `LiveActivityBridge` (compile-time test from T020) (FR-017)
- [X] T044 Run `pnpm test` and ensure every new test from T020, T021, T022, T023, T029, T033, T037 passes; full suite green (FR-026)
- [X] T045 Run `pnpm check` end-to-end as the final gate; MUST pass cleanly (FR-027, SC-007)
- [ ] T046 Run `pnpm exec expo prebuild --clean --platform ios` twice in succession on a clean tree and verify `git status ios/` reports no diff after the second run; if the diff is non-empty, the config plugin from T009/T010/T011 is not idempotent — fix and re-run (FR-022, SC-008, quickstart.md §Idempotency check)
- [ ] T047 Walk the entire `quickstart.md` on-device verification matrix on a physical iPhone (Stories 1–3), Android emulator (row 4.1), web (row 4.2), iOS 16.0 simulator (row 4.3), and the cross-cutting rows X.1–X.5; record results in the PR description (covers SC-001, SC-002, SC-003, SC-004, SC-005, SC-006, SC-008)
- [ ] T048 [P] Polish `specs/007-live-activities-dynamic-island/quickstart.md` and the project root `README.md` to reflect any deviations discovered during T047 (e.g., updated troubleshooting notes, build-profile clarifications). Update `.specify/memory/` agent context only if a new convention emerged that future features must obey (no-op if not)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: no deps; T001 must precede T009/T010/T011 (`@expo/config-plugins` import)
- **Phase 2 (Foundational)**: depends on Phase 1; blocks every user story
- **Phase 3 (US1)**: depends on Phase 2
- **Phase 4 (US2)**: depends on Phase 2 + US1 (the Update path is meaningful only with Start working; T029 mocks Start in test setup, but on-device verification of T032 needs T028 done)
- **Phase 5 (US3)**: depends on Phase 2 + US1 (same reasoning as US2)
- **Phase 6 (US4)**: depends on Phase 2; the manifest + non-iOS stubs delivered there are sufficient for the badging path. T040 (authorisation-denied) needs T024 + T028 (US1 Start path) to be the surface that produces the message
- **Phase 7 (Polish)**: depends on every targeted user story being complete

### Within Each User Story

- Tests (T023, T029, T033, T037) MUST be written and observed failing before the corresponding implementation tasks
- Bridge JS method before screen handler (e.g., T024 before T028; T030 before T032; T034 before T036)
- Swift native body before JS bridge body that calls it (e.g., T026 before T024 fully exercises end-to-end; T031 before T030; T035 before T034) — but the JS side compiles against the native interface from T015's skeleton, so implementations can be written in parallel; only end-to-end on-device verification needs both sides done
- `[P]` tasks within a story touch distinct files

### Parallel Opportunities

- Phase 1: T002 ∥ T003
- Phase 2: T004 ∥ T005 ∥ T006 (types + both stubs); T007 after T004; T008 ∥ T009 ∥ T010 (plugin pieces); T011 after T008/T009/T010; T012 after T011; T013 ∥ T014 ∥ T015 ∥ T016 (Swift sources); T017 ∥ T018 (manifest + screen scaffold; T018 imports from T004 so order T004 → T018); T019 after T017; T020 ∥ T021 ∥ T022 (foundational tests, all distinct files)
- Phase 3 (US1): T023 first; then T024 ∥ T025 (different methods in same file — coordinate edits) ∥ T026 ∥ T027 (different methods in same Swift file — coordinate edits); T028 after T024 + T025
- Phase 4 (US2): T029 first; then T030 ∥ T031; T032 after T030
- Phase 5 (US3): T033 first; then T034 ∥ T035; T036 after T034
- Phase 6 (US4): T037 first; then T038; T039 ∥ T040 (manual verification, different devices)
- Phase 7: T041 ∥ T042 ∥ T043; T048 ∥ T047 (T048 documents what T047 finds)

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Types and non-iOS stubs in parallel:
Task: "T004 Create src/native/live-activity.types.ts"
Task: "T005 Create src/native/live-activity.android.ts stub"
Task: "T006 Create src/native/live-activity.web.ts stub"

# Plugin pieces in parallel after T001:
Task: "T008 Create plugins/with-live-activity/package.json"
Task: "T009 Create plugins/with-live-activity/set-info-plist.ts"
Task: "T010 Create plugins/with-live-activity/add-widget-extension.ts"

# Swift sources in parallel:
Task: "T013 Create ios-widget/LiveActivityDemoAttributes.swift"
Task: "T014 Create ios-widget/LiveActivityDemoWidget.swift"
Task: "T015 Create ios-widget/LiveActivityDemoModule.swift skeleton"
Task: "T016 Create ios-widget/Info.plist"

# Foundational tests in parallel:
Task: "T020 Write test/unit/native/live-activity.test.ts"
Task: "T021 Write test/unit/plugins/with-live-activity/index.test.ts"
Task: "T022 Write test/unit/modules/live-activity-demo/manifest.test.ts"
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Phase 1 → Phase 2 → Phase 3.
2. Stop. The Live Activity Demo card appears, Start brings up the Lock Screen + Dynamic Island presentations within 1 s, and the in-app status reflects the running activity. Update / End are not yet wired but the app does not crash because the buttons are disabled by the FR-008 logic in T018.

### Incremental delivery

1. MVP (US1) → demo on a physical iPhone.
2. Add US2 (Update) → demo live counter increments across all surfaces.
3. Add US3 (End) → demo clean teardown and re-Start.
4. Add US4 (gating) → demo "iOS only" badging on Android/web, "Requires iOS 16.1+" on the iOS 16.0 simulator, and the Settings-disabled message on a real iPhone.
5. Phase 7 polish + `pnpm check` + idempotency check + quickstart matrix → merge.

### Parallel team strategy

After Phase 2: one developer can take US1 (the heaviest — Start path end-to-end across Swift + JS + screen). A second developer can take US4 (manifest gating tests + screen unavailable branch — almost entirely JS, no iPhone needed). Once US1 merges, US2 and US3 can be done in parallel by two developers since they touch the same three files (Swift module, JS bridge, screen) but in disjoint methods — coordinate edits with care.

---

## Notes

- `[P]` = different files (or disjoint methods within the same file with explicit coordination), no incomplete-task dependency
- `[US#]` traces a task back to its user story; foundational, setup, and polish tasks intentionally have no `[US#]`
- Tests must fail before their implementation lands (constitution principle V)
- Commit after each task or logical group per the project's standard workflow
- The Swift Widget Extension (T013–T016) and Swift method bodies (T026, T027, T031, T035) are NOT covered by unit tests — they are validated exclusively by the on-device matrix in T047 per the constitution exemption (plan.md §Constitution Check, principle V)
- The config plugin's idempotency is mechanically guarded by T021 (jest) and T046 (real `expo prebuild --clean` round-trip) — do not bypass either
- No APNs, no push tokens, no App Intents, no custom themes, no bundled images for the activity itself (FR-013, FR-015, FR-016)

---

## Open Questions

None. All architectural decisions are recorded in `plan.md` and `research.md`; the user instructed autonomous task generation against the existing design artifacts.
