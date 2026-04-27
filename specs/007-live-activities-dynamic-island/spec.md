# Feature Specification: Live Activities + Dynamic Island Showcase

**Feature Branch**: `007-live-activities-dynamic-island`
**Created**: 2026-04-27
**Status**: Draft
**Input**: User description: "Add a Live Activities + Dynamic Island showcase module to the iOS Feature Showcase app. Plug into the existing module registry from spec 006. iOS 16.1+ only; on Android and web it appears in the Modules grid as 'iOS only'."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start a Live Activity and see it on Lock Screen + Dynamic Island (Priority: P1)

An iPhone user (iOS 16.1+) opens the app, taps the Modules tab, opens the new "Live Activity Demo" card, and taps Start. A Live Activity appears on their Lock Screen and in the Dynamic Island, showing an icon and a counter. The in-app status display flips from "No activity running" to "Activity running" with the current state visible.

**Why this priority**: This is the core "wow" of the module. If starting an activity does not produce a Lock Screen + Dynamic Island presence, the feature has failed. Update and End are meaningless without it.

**Independent Test**: On a physical iPhone running iOS 16.1+ with Live Activities enabled in Settings, install the dev client, open the Live Activity Demo, tap Start, lock the device, and verify the activity is visible on the Lock Screen and in the Dynamic Island (compact, expanded by long-press, and minimal when another activity is also active).

**Acceptance Scenarios**:

1. **Given** the user is on iOS 16.1+ with Live Activities authorisation granted and no activity currently running, **When** they tap Start in the Live Activity Demo screen, **Then** a Live Activity appears on the Lock Screen and the Dynamic Island within 1 second, and the in-app status shows "Activity running" with the initial counter/progress value.
2. **Given** the user has just started an activity, **When** they pull down Notification Center or lock the device, **Then** the Lock Screen presentation shows the icon, title, current counter, and progress bar — visually consistent with the Dynamic Island expanded view.
3. **Given** the user has just started an activity, **When** they look at the Dynamic Island, **Then** the compact presentation shows a leading SF Symbol icon and a trailing counter, the expanded presentation (via long-press) shows the richer layout with progress bar, and the minimal presentation (when another activity is co-present) shows just the icon.
4. **Given** an activity is already running, **When** the user taps Start again, **Then** the app does not crash, no second activity is created, and the user sees a clear in-app indication that an activity is already running.

---

### User Story 2 - Update the activity's state and watch it change live (Priority: P2)

With an activity running, the user taps Update one or more times. Each tap advances the activity's state (counter +1 and progress recomputed) and the Lock Screen presentation, the Dynamic Island compact/expanded views, and the in-app status display all update visibly within a fraction of a second.

**Why this priority**: A Live Activity that cannot change is a static notification. Demonstrating live updates is what makes the feature distinctive from a normal notification. It depends on Story 1 succeeding first.

**Independent Test**: With Story 1 verified, tap Update three times in succession. Confirm that each tap advances the counter on the Lock Screen, in the Dynamic Island compact view, in the Dynamic Island expanded view, and in the in-app status — all three external surfaces and the in-app surface stay in sync.

**Acceptance Scenarios**:

1. **Given** an activity is running, **When** the user taps Update, **Then** the counter increments by 1 and the progress bar advances proportionally on the Lock Screen, in both Dynamic Island presentations, and in the in-app status display, all within 500 ms.
2. **Given** an activity is running and the user has tapped Update N times, **When** the user re-opens the app from the background, **Then** the in-app status display reflects the current counter value (consistent with what the Lock Screen / Dynamic Island show).
3. **Given** no activity is running, **When** the user taps Update, **Then** the app does not crash and the user sees a clear in-app indication that there is nothing to update.

---

### User Story 3 - End the activity cleanly (Priority: P3)

The user taps End. The Live Activity disappears from the Lock Screen and the Dynamic Island, and the in-app status display flips back to "No activity running". The user can then start a fresh activity from a clean state.

**Why this priority**: Users must be able to terminate an activity cleanly. Without End, the demo cannot be reset and stale activities accumulate. Less critical than Start/Update because the activity will eventually time out on its own, but mandatory for a polished demo.

**Independent Test**: With an activity running (Story 1 satisfied), tap End. Confirm the activity disappears from the Lock Screen and the Dynamic Island within 1 second, the in-app status flips back to "No activity running", and tapping Start afterwards begins a fresh activity from the initial counter value.

**Acceptance Scenarios**:

1. **Given** an activity is running, **When** the user taps End, **Then** the activity disappears from both the Lock Screen and the Dynamic Island within 1 second, and the in-app status display reads "No activity running".
2. **Given** no activity is running, **When** the user taps End, **Then** the app does not crash and the user sees a clear in-app indication that there is nothing to end.
3. **Given** the user has just ended an activity, **When** they tap Start, **Then** a fresh activity begins at the initial counter value (no carryover from the previous activity).

---

### User Story 4 - Graceful gating on non-iOS and on iOS < 16.1 (Priority: P4)

A user on Android, web, or an iPhone running iOS < 16.1 opens the Modules tab. They see the "Live Activity Demo" card marked as unavailable on the current platform, and tapping it does not crash — it either is non-interactive or routes to a graceful "not supported on this platform" screen, consistent with the registry's existing platform/minIOS gating from spec 006.

**Why this priority**: The cross-platform shell from spec 006 promises that no module ever crashes on an unsupported platform. This story validates that the new module respects that contract on every non-supported platform path. Lower priority than the iOS happy path because the shell-level gating already exists; this story confirms the new module configures it correctly.

**Independent Test**: Run the app on Android, on web, and on an iOS Simulator pinned to iOS 16.0. In all three cases, open the Modules tab and verify the Live Activity Demo card appears with the correct unavailable badge ("iOS only" on Android/web; "Requires iOS 16.1+" on the iOS 16.0 simulator), and that tapping the card does not crash.

**Acceptance Scenarios**:

1. **Given** the app is running on Android or web, **When** the user opens the Modules tab, **Then** the Live Activity Demo card is visible, marked "iOS only", and tapping it does not crash.
2. **Given** the app is running on iOS 16.0 (or any iOS < 16.1), **When** the user opens the Modules tab, **Then** the Live Activity Demo card is visible, marked as requiring iOS 16.1+, and tapping it does not crash.
3. **Given** the app is running on iOS 16.1+ but the user has disabled Live Activities for this app in iOS Settings, **When** they open the Live Activity Demo and tap Start, **Then** the app does not crash and the user sees a clear in-app message indicating Live Activities are disabled for the app and pointing them to Settings.

---

### Edge Cases

- **Live Activities authorisation denied or revoked**: When the user has disabled Live Activities for the app in iOS Settings (or has never authorised), Start MUST surface a clear, non-technical message explaining the activity could not be created and pointing the user at iOS Settings; the app MUST NOT crash and the in-app status MUST remain "No activity running".
- **Activity already running when Start is tapped again**: The module MUST NOT create a second concurrent activity for the same demo; it MUST either no-op gracefully or refresh the existing activity, and MUST surface a clear in-app indication of what happened.
- **Update / End tapped with no activity running**: Both MUST be safe no-ops that surface a clear in-app indication; neither may crash the app or leave the in-app status display inconsistent with the actual system state.
- **Activity outlives the app process**: If the app is force-quit while an activity is running, on next launch the in-app status display MUST reconcile with the actual system state (i.e., if the system still shows the activity, the in-app display MUST show "Activity running" and offer Update/End for the existing activity; if the system has ended it, the display MUST show "No activity running").
- **System-imposed activity time limit reached**: When iOS terminates the activity due to its own time limits (currently up to 8 hours stale / 12 hours total), the in-app status display MUST eventually reconcile to "No activity running" without crashing.
- **Module loaded on a platform where its native dependencies are absent**: Per the registry contract from spec 006, the module's native bridge MUST NOT be imported at module-load time on Android, web, or unsupported iOS versions; the JS bridge MUST tolerate the missing native module by returning a "not available" result from `isAvailable()` rather than throwing at import.
- **Race between rapid Start → End → Start**: Tapping the buttons in rapid succession MUST NOT leave orphaned activities, duplicate activities, or an inconsistent in-app status display.
- **Module screen crash isolation (inherited from spec 006)**: A runtime error inside the Live Activity Demo screen MUST NOT take down the shell; the user MUST be able to navigate back to Modules.

## Requirements *(mandatory)*

### Functional Requirements

#### Module registration & gating

- **FR-001**: The app MUST register exactly one new module — "Live Activity Demo" — by exporting a `ModuleManifest` (per the contract at `specs/006-ios-feature-showcase/contracts/module-manifest.md`) from `src/modules/live-activity-demo/index.tsx` and adding a single registration import line to `src/modules/registry.ts`. No other shell file MAY be modified to register the module.
- **FR-002**: The Live Activity Demo manifest MUST declare `platforms: ['ios']` and `minIOS: '16.1'`, with a stable kebab-case `id`, a human-readable `title`, a one-sentence `description`, and an `icon` providing both a SF Symbol name for iOS and a fallback identifier for Android/web.
- **FR-003**: On Android and web, the Live Activity Demo card MUST appear in the Modules grid with a visible "iOS only" badge derived from the manifest's `platforms`, and tapping the card MUST NOT crash (per spec 006 FR-010).
- **FR-004**: On iOS versions below `16.1`, the Live Activity Demo card MUST appear in the Modules grid with a visible "Requires iOS 16.1+" badge derived from the manifest's `minIOS`, and the manifest's `render` function MUST NOT be invoked (per spec 006 module-manifest contract: "If present and the device's iOS version is lower, the module is marked unavailable on iOS and its `render` function MUST NOT be invoked").
- **FR-005**: The Live Activity Demo module folder MUST be self-contained: no shell code and no other module MAY import from `src/modules/live-activity-demo/` or from `src/native/live-activity.ts`.

#### In-app demo surface

- **FR-006**: The Live Activity Demo screen MUST present three primary controls — Start, Update, End — and a status display that always reflects whether an activity is currently running and, if so, its current counter value and progress.
- **FR-007**: The screen MUST use `ThemedText` and `ThemedView` for all text and surface containers, draw spacing exclusively from the `Spacing` scale in `src/constants/theme.ts`, and define every style via `StyleSheet.create()` (no inline style objects, no CSS-in-JS, no utility-class frameworks) — consistent with spec 006 FR-003 and FR-004.
- **FR-008**: All three controls MUST be visibly enabled/disabled in a way that reflects the current activity state: Start is enabled only when no activity is running; Update and End are enabled only when an activity is running.
- **FR-009**: The status display MUST update in response to user actions (Start, Update, End) and MUST reconcile with the actual system state when the screen mounts (i.e., if an activity is already running from a previous app session, the screen MUST show "Activity running" with the correct current state).

#### Live Activity behaviour (iOS 16.1+ only)

- **FR-010**: Tapping Start MUST cause a Live Activity to appear on the Lock Screen and in the Dynamic Island within 1 second, with an initial counter value and progress, and MUST NOT create a second concurrent activity if one is already running.
- **FR-011**: Tapping Update MUST advance the activity's state (counter +1, progress recomputed) and the Lock Screen presentation, the Dynamic Island compact, expanded, and minimal presentations, and the in-app status display MUST all reflect the new state within 500 ms.
- **FR-012**: Tapping End MUST terminate the activity within 1 second, removing it from both the Lock Screen and the Dynamic Island, and MUST flip the in-app status display back to "No activity running".
- **FR-013**: All activity updates MUST be performed locally from the running app; the feature MUST NOT use APNs or any push-token-based remote update path.
- **FR-014**: The Dynamic Island compact presentation MUST show a leading SF Symbol icon and a trailing counter; the expanded presentation MUST show a richer layout including a progress bar; the minimal presentation MUST show just the icon. The Lock Screen presentation MUST mirror the expanded layout.
- **FR-015**: All visual styling for the Lock Screen and Dynamic Island presentations MUST use SF Symbols and system colours; the feature MUST NOT introduce custom themes, custom fonts, or bundled images for the activity itself.
- **FR-016**: The activity MUST NOT include interactive controls (no buttons, no App Intents) inside the Lock Screen or Dynamic Island presentations; updates are exclusively driven by the in-app Update button.

#### JS ↔ native bridge

- **FR-017**: The app MUST expose a JavaScript bridge module at `src/native/live-activity.ts` providing at minimum: `isAvailable(): boolean | Promise<boolean>`, `start(initialState): Promise<void>`, `update(nextState): Promise<void>`, and `end(): Promise<void>`. The bridge's TypeScript types MUST be strict (no `any`).
- **FR-018**: On Android, web, and iOS < 16.1, `isAvailable()` MUST return falsy and the other bridge methods MUST either be no-ops or reject with a clearly typed "not available" error; importing the bridge module MUST NOT throw at any of these targets.
- **FR-019**: The bridge MUST surface authorisation failures (Live Activities disabled in iOS Settings) as a distinguishable, typed outcome so the demo screen can render the user-facing message required by FR-024.

#### iOS-side build integration

- **FR-020**: The feature MUST ship an iOS Widget Extension target (Swift / SwiftUI) under `ios-widget/` that declares the `ActivityAttributes` and the Lock Screen + Dynamic Island presentations described in FR-014 and FR-015.
- **FR-021**: The feature MUST ship a config plugin under `plugins/with-live-activity/` (TypeScript) that, during EAS prebuild, wires the Widget Extension target into the iOS project and sets the required iOS entitlements / `Info.plist` keys for Live Activities (in particular `NSSupportsLiveActivities`).
- **FR-022**: The config plugin MUST be idempotent: running `expo prebuild` repeatedly MUST yield the same iOS project state and MUST NOT duplicate targets, files, or entitlements.

#### User-facing error handling

- **FR-023**: If `start()` fails for any reason (authorisation denied, system limit reached, native module unavailable), the in-app status MUST remain "No activity running" and the user MUST see a clear, non-technical message describing what happened and (where applicable) how to fix it.
- **FR-024**: When Live Activities are disabled for the app in iOS Settings, Start MUST surface a message that names iOS Settings as the place to re-enable them.
- **FR-025**: `update()` and `end()` invoked when no activity is running MUST be safe no-ops surfaced to the user as a clear in-app message; neither MAY crash the app.

#### Quality gates

- **FR-026**: The feature MUST include automated unit tests under `test/unit/` covering: (a) the manifest invariants from spec 006's contract for the new module (id format, platforms non-empty, minIOS format, render is a function); (b) registry inclusion of the new module; (c) the JS bridge's behaviour on non-iOS targets (`isAvailable()` falsy, no throw on import, methods are safe no-ops or typed-error rejections); (d) the demo screen's button enable/disable logic across the three states (no activity running, activity running, transitioning).
- **FR-027**: `pnpm check` (format, lint, typecheck, jest) MUST pass cleanly with this feature merged.
- **FR-028**: The feature MUST ship a `quickstart.md` under `specs/007-live-activities-dynamic-island/` that documents (a) the EAS Build profile required to produce a dev client containing the Widget Extension and (b) an on-device manual verification matrix covering Stories 1-3 on iOS 16.1+ and Story 4 on Android, web, and an iOS 16.0 simulator.

### Key Entities *(include if feature involves data)*

- **Live Activity State**: The small payload that the app pushes into the running activity. Attributes: a non-negative integer counter and a derived progress value in `[0, 1]`. Read by the Widget Extension's SwiftUI views to render the Lock Screen and Dynamic Island presentations; written by the app whenever the user taps Start (initial value) or Update (incremented value).
- **Live Activity Session**: The in-app representation of "an activity is currently running": a typed handle returned by `start()` and consumed by `update()` and `end()`. Exists for the lifetime of one start-to-end cycle; reconciled with the actual system state on screen mount per FR-009.
- **Module Manifest (re-used)**: The typed contract from spec 006's `module-manifest.md`. The Live Activity Demo module exports one such manifest and is added to the central registry.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a physical iPhone running iOS 16.1+ with Live Activities authorised, tapping Start results in a visible Live Activity on the Lock Screen and in the Dynamic Island within 1 second, in 100% of attempts under normal conditions.
- **SC-002**: Tapping Update propagates the new state to the Lock Screen, all three Dynamic Island presentations (compact, expanded, minimal), and the in-app status display within 500 ms in 100% of attempts under normal conditions.
- **SC-003**: Tapping End removes the activity from both the Lock Screen and the Dynamic Island within 1 second, and flips the in-app status display back to "No activity running", in 100% of attempts under normal conditions.
- **SC-004**: On Android, web, and iOS 16.0 (the supported pre-16.1 simulator), opening the Modules tab shows the Live Activity Demo card with the correct unavailable badge, and tapping the card does not crash, in 100% of attempts.
- **SC-005**: When Live Activities are disabled for the app in iOS Settings, tapping Start surfaces a clear, non-technical message that names iOS Settings as the remediation, in 100% of attempts.
- **SC-006**: A user can complete the full Start → Update → Update → End demo loop in under 30 seconds in one continuous session on iOS 16.1+.
- **SC-007**: `pnpm check` (format, lint, typecheck, jest) passes cleanly on the merged feature branch.
- **SC-008**: A second `expo prebuild` invocation on a clean tree produces zero diff in the generated iOS project relative to the first invocation (config plugin idempotency).
- **SC-009**: No runtime error in the Live Activity Demo screen takes down the shell; the user can always navigate back to the Modules tab (inherited promise from spec 006 SC-008).

## Assumptions

- The user-supplied description is authoritative and sufficient; per the user's explicit instruction, the spec was written autonomously without follow-up clarification questions.
- The module-manifest contract at `specs/006-ios-feature-showcase/contracts/module-manifest.md` and the registry from spec 006 are merged and stable; this feature consumes that contract verbatim and does not propose changes to it.
- The constitution at `.specify/memory/constitution.md` (v1.0.1 per the user's input) governs this feature; cross-platform parity, token-based theming, platform file splitting, `StyleSheet.create()` discipline, TypeScript strict mode, and test-first quality gates are all assumed binding.
- The minimum iOS version for the activity itself is **16.1** (Live Activities became generally available in iOS 16.1). Dynamic Island is iPhone 14 Pro and newer; on supported iOS 16.1+ devices without a Dynamic Island (e.g., iPhone 13), the activity will render only on the Lock Screen, which is acceptable and outside the success criteria's measurable surfaces.
- All updates are local (in-process from the running app); push-token-based remote updates via APNs are explicitly out of scope and deferred to a future spec.
- App Intents inside the activity (interactive buttons in the Lock Screen / Dynamic Island presentations) are explicitly out of scope and deferred to a future spec.
- Custom themes for the activity are explicitly out of scope; the activity uses SF Symbols and system colours only.
- The exact technical mechanism by which the JS bridge talks to the Widget Extension's `ActivityKit` APIs (custom Expo Modules API native module vs. an existing community package) is left to the plan phase; the spec only constrains the bridge's surface, behaviour, and gating.
- The Widget Extension target lives under `ios-widget/` in the repo and is wired into the iOS project at prebuild time by the config plugin under `plugins/with-live-activity/`; both directories are new.
- The Live Activity Demo screen does not persist any of its own state across app launches beyond what `ActivityKit` itself preserves: the in-app status display reconciles to the system state on every mount per FR-009.
- Path aliases `@/*` → `./src/*` and `@/assets/*` → `./assets/*` from spec 006 remain stable and are used by all new TypeScript code.
