# Feature Specification: ScreenTime / FamilyControls Showcase Module

**Feature Branch**: `015-screentime-api`
**Created**: 2026-04-28
**Status**: Draft
**Input**: User description: "Feature 015 — ScreenTime / FamilyControls Showcase module — a code-complete educational scaffold that demonstrates Apple's FamilyControls, DeviceActivity, and ManagedSettings frameworks in an Expo app, with graceful entitlement-missing fallbacks."

---

## ⚠️ Entitlement Reality Check (READ FIRST)

Apple gates the `FamilyControls`, `DeviceActivity`, and `ManagedSettings` frameworks behind the **`com.apple.developer.family-controls`** entitlement. This entitlement is **not freely available**: developers must submit a written request to Apple (via the Apple Developer portal) explaining their intended use case, and approval is granted on a case-by-case basis (often denied). Without the entitlement:

- The frameworks will **crash the app** on first use if invoked unguarded.
- EAS Build will **fail provisioning** if the entitlement is declared in `app.json` but the team's Apple account lacks approval.

**This module ships as a code-complete educational scaffold.** All Swift sources, the JS bridge, the config plugin, and the React UI exist and have unit-test coverage. On-device functional verification of the actual restriction-applying behavior is **conditional**: only users who have obtained the entitlement from Apple can verify that shielding/monitoring takes effect. Users without the entitlement see the full UI but every native action surfaces an "Entitlement required" message instead of crashing.

This reality check is repeated in three locations in addition to this spec: the on-screen UI (an `EntitlementBanner` component), the module's `quickstart.md`, and the Assumptions section below.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Browse the showcase without an entitlement (Priority: P1)

A developer studying the spot iOS showcase opens the app on an iOS 16+ device that does **not** have the `com.apple.developer.family-controls` entitlement (the most common case). They tap the "Screen Time Lab" card from the Modules grid, see the full UI structure with all four sections (Authorization, Activity Selection, Apply/Clear Shielding, Schedule Monitor), and understand from a prominent banner and inline status messages that real functionality requires Apple approval. No action crashes the app.

**Why this priority**: This is the experience for ~99% of users (and for the showcase's own CI builds). If the app crashes here, the entire module is worthless. This is the MVP — the educational value of the scaffold is delivered even without the entitlement.

**Independent Test**: Build and run the app on any iOS 16+ device or simulator using the showcase's normal provisioning profile (no special entitlement). Open the Screen Time Lab module. Verify that (a) the entitlement banner appears at the top of the screen, (b) all four cards render with their controls, (c) tapping each action button produces a non-crashing status message indicating the entitlement is required, and (d) navigating away and back leaves the app responsive.

**Acceptance Scenarios**:

1. **Given** an iOS 16+ device without the entitlement, **When** the user opens the Screen Time Lab module, **Then** an `EntitlementBanner` is displayed at the top of the screen with the text "Entitlement required" and a link to `quickstart.md`.
2. **Given** the same context, **When** the user taps "Request Authorization", **Then** the authorization status pill remains `notDetermined` and the card's status text reads "Entitlement required to perform this action — see quickstart.md".
3. **Given** the same context, **When** the user taps "Pick apps & categories", **Then** no picker is presented and the card status reads "Entitlement required to perform this action — see quickstart.md".
4. **Given** the same context, **When** the user taps Apply Shielding, Clear Shielding, Start Monitoring, or Stop Monitoring, **Then** each produces the same "Entitlement required" message and no native crash occurs.
5. **Given** the user navigates away from and back to the module, **When** the screen re-mounts, **Then** all UI state is reconstructed from persisted state (last selection summary, if any was previously stored) and the entitlement banner is re-evaluated.

---

### User Story 2 — Authorize, pick activity, apply shielding (with entitlement) (Priority: P2)

A developer who has obtained the `com.apple.developer.family-controls` entitlement from Apple, configured their provisioning profile, and built the app with the entitlement active opens the Screen Time Lab. They request authorization, are prompted by the system, approve. They then tap "Pick apps & categories", see Apple's `FamilyActivityPicker`, select a few apps and one category. Back in the module, they see the summary "3 apps / 1 category / 0 web domains". They tap "Apply Shielding"; the selected apps are now blocked on the device. They tap "Clear Shielding"; the apps are unblocked.

**Why this priority**: This is the core "happy path" the module is designed to demonstrate. It validates that the Swift bridge, the picker integration, the App Group-backed persistence, and the `ManagedSettingsStore` calls all work end-to-end. It's P2 because it's only reachable for entitled users.

**Independent Test**: With an entitled provisioning profile, build and install the app. Open the module, complete the flow, and confirm a previously-launchable app (e.g., Calculator) cannot be opened while shielding is active and can be opened again after Clear.

**Acceptance Scenarios**:

1. **Given** an entitled iOS 16+ device, **When** the user taps "Request Authorization" and approves the system prompt, **Then** the status pill updates to `approved` and persists across app relaunches.
2. **Given** authorization is `approved`, **When** the user taps "Pick apps & categories" and completes a selection in the system picker, **Then** the card displays a summary of the form "N apps / N categories / N web domains" and the raw selection token is persisted in shared `UserDefaults` (App Group from feature 014).
3. **Given** a non-empty selection is persisted, **When** the user taps "Apply Shielding", **Then** the `ManagedSettingsStore.shield.applications` value is set from the selection and the card status reads "Shielding active".
4. **Given** shielding is active, **When** the user taps "Clear Shielding", **Then** `ManagedSettingsStore.shield.applications` is cleared and the card status reads "Shielding cleared".
5. **Given** an empty selection, **When** the user views the Shielding card, **Then** both Apply and Clear buttons are disabled with helper text "Pick apps first".

---

### User Story 3 — Schedule a daily monitoring window (with entitlement) (Priority: P3)

The same entitled developer wants to demonstrate `DeviceActivityCenter` scheduling. They tap "Start daily monitor"; the module registers a `DeviceActivitySchedule` from 09:00 to 21:00 daily. The status pill shows "Active". They tap "Stop monitor"; the schedule is removed and the pill shows "Inactive". A separate `DeviceActivityMonitorExtension` target in the iOS project receives `intervalDidStart` / `intervalDidEnd` callbacks during the window and logs them via `OSLog`.

**Why this priority**: Useful but secondary to shielding; demonstrates the second framework but is not required for the basic shielding loop. Verification of the extension callbacks requires inspecting device logs, which is a more advanced workflow.

**Independent Test**: With entitlement, tap Start; inspect Console.app on the host Mac to see the `OSLog` entry from `DeviceActivityMonitorExtension` at the next interval boundary. Tap Stop; confirm no further callbacks fire.

**Acceptance Scenarios**:

1. **Given** authorization is `approved`, **When** the user taps "Start daily monitor", **Then** a `DeviceActivitySchedule` with `startHour=9, startMinute=0, endHour=21, endMinute=0, repeats=true` is registered with a stable activity name and the card status reads "Active".
2. **Given** monitoring is active, **When** the user taps "Stop monitor", **Then** the activity is removed via `DeviceActivityCenter.stopMonitoring` and the status reads "Inactive".
3. **Given** monitoring is active and the device clock crosses 09:00 or 21:00, **When** the system invokes the extension, **Then** `intervalDidStart` / `intervalDidEnd` log entries are emitted via `OSLog` with the activity name.

---

### User Story 4 — Cross-platform graceful degradation (Priority: P2)

A developer running the showcase on Android or in a web browser opens the Modules grid, sees the "Screen Time Lab" card (registered for all platforms for educational purposes), taps it, and sees the same overall screen layout with a prominent "Screen Time API is iOS-only" banner. All interactive controls are disabled. No bridge calls are made.

**Why this priority**: The module is registered for `['ios','android','web']` to remain visible everywhere as an educational artifact; without this story the registry would either hide the module on non-iOS or crash on it.

**Independent Test**: Run the app on Android (emulator or device) and on web; open the module; verify the iOS-only banner is shown, controls are disabled, and `bridge.isAvailable()` returns false (visible via the disabled state).

**Acceptance Scenarios**:

1. **Given** the app is running on Android or web, **When** the user opens the Screen Time Lab module, **Then** an "iOS-only" banner is displayed and all action buttons are disabled.
2. **Given** the same context, **When** any internal code path calls `bridge.isAvailable()`, **Then** it returns `false` synchronously without throwing.
3. **Given** the same context, **When** any other bridge method is invoked, **Then** it rejects with a `ScreenTimeNotSupported` error rather than crashing.

---

### Edge Cases

- **Authorization denied**: User declines the system authorization prompt. The status pill shows `denied`. Subsequent action buttons remain enabled but each call surfaces the system-returned error in the card status text (no crash).
- **Picker dismissed without selection**: User opens `FamilyActivityPicker` and cancels. The persisted selection is unchanged; the summary remains as it was.
- **App Group missing**: If feature 014's App Group is not configured (e.g., 014's plugin disabled), persistence falls back to in-memory storage for the current session. A warning is logged via `console.warn` in dev builds.
- **iOS < 16**: The module's manifest declares `minIOS: '16.0'`. The 006 registry filters it from the grid on older iOS versions; if it is somehow opened, the module shows the iOS-only banner (treated identically to non-iOS).
- **Re-applying shielding while already active**: Calling Apply twice in a row is idempotent; the second call overwrites with the same selection.
- **Stopping monitoring when none is active**: Calling Stop with no active schedule is a no-op and produces a status of "Inactive" (no error).
- **Concurrent feature 007 (Live Activities) and 014 (Home Widgets) plugins enabled**: The 015 config plugin must add its monitor extension target without disturbing the existing `LiveActivityWidget` (007) or `HomeWidget` (014) targets. If 014's bundle marker is present in the project, the 015 plugin must NOT modify it.
- **EAS Build without entitlement approval**: Documented in `quickstart.md` as a known failure mode; the suggested mitigation is to comment out the `with-screentime` entry in `app.json` until entitlement is granted.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Module Surface & Registration

- **FR-001**: The system MUST register a "Screen Time Lab" module entry in `src/modules/registry.ts` with `platforms: ['ios','android','web']` and `minIOS: '16.0'`. This MUST be the only registry edit (a single import + array entry line).
- **FR-002**: The module MUST be discoverable from the 006 Modules grid and tappable to navigate into the showcase screen.
- **FR-003**: The module MUST provide three platform-specific screen entry files: `screen.tsx` (iOS default), `screen.android.tsx`, and `screen.web.tsx`.

#### On-Screen UI Sections

- **FR-004**: The iOS screen MUST render four cards in this order: Authorization, Activity Selection, Apply / Clear Shielding, Schedule Monitor.
- **FR-005**: The Authorization card MUST show a status pill reflecting one of `notDetermined` | `approved` | `denied`, and a "Request Authorization" button that calls the bridge.
- **FR-006**: The Activity Selection card MUST show a "Pick apps & categories" button that presents `FamilyActivityPicker`, plus a summary line of the form "N apps / N categories / N web domains" and a "Clear selection" affordance.
- **FR-007**: The Shielding card MUST show "Apply Shielding" and "Clear Shielding" buttons with status text. Both buttons MUST be disabled when the persisted selection is empty.
- **FR-008**: The Monitoring card MUST show "Start daily monitor" / "Stop monitor" buttons, an Active/Inactive status pill, and display the default schedule (09:00–21:00 daily).
- **FR-009**: The screen MUST render an `EntitlementBanner` component at the top whenever `entitlementsAvailable()` returns false; it MUST render nothing when true.
- **FR-010**: On Android and web, the screen MUST render a "Screen Time API is iOS-only" banner and disable all action controls; the four-card structure MUST still be rendered for educational purposes.

#### Native Bridge Contract

- **FR-011**: The JS bridge `src/native/screentime.ts` MUST expose these methods with the listed signatures:
  - `isAvailable(): boolean` — synchronous; returns false on non-iOS or iOS < 16.
  - `entitlementsAvailable(): Promise<boolean>` — probes the framework; never throws.
  - `requestAuthorization(): Promise<'notDetermined' | 'approved' | 'denied'>`
  - `getAuthorizationStatus(): Promise<'notDetermined' | 'approved' | 'denied'>`
  - `pickActivity(): Promise<{ applicationCount: number; categoryCount: number; webDomainCount: number; rawSelectionToken: string }>`
  - `applyShielding(token: string): Promise<void>`
  - `clearShielding(): Promise<void>`
  - `startMonitoring(token: string, schedule: { startHour: number; startMinute: number; endHour: number; endMinute: number }): Promise<void>`
  - `stopMonitoring(): Promise<void>`
- **FR-012**: On non-iOS platforms, `isAvailable()` and `entitlementsAvailable()` MUST return false; all other methods MUST reject with a `ScreenTimeNotSupported` error.
- **FR-013**: When the entitlement is missing on iOS, every async method (other than `entitlementsAvailable` and `isAvailable`) MUST reject with a typed `EntitlementMissing` error rather than crashing the app.

#### Native Implementation

- **FR-014**: Three Swift files MUST exist under `native/ios/screentime/`:
  - `ScreenTimeManager.swift` — wraps `AuthorizationCenter`, `ManagedSettingsStore`, `DeviceActivityCenter` with all entry points in `do/catch` and typed errors via `expo-modules-core`.
  - `FamilyActivityPickerView.swift` — `UIViewControllerRepresentable` wrapping `FamilyActivityPicker`.
  - `DeviceActivityMonitorExtension.swift` — separate target's monitor extension with `intervalDidStart` / `intervalDidEnd` hooks logging via `OSLog`.
- **FR-015**: At module init, the bridge MUST call a Swift `entitlementsAvailable() -> Bool` that probes `AuthorizationCenter.shared.authorizationStatus` inside a `guard` and returns false on any failure.

#### Persistence

- **FR-016**: The `rawSelectionToken` returned from `pickActivity` MUST be persisted as JSON in shared `UserDefaults` using the App Group established by feature 014.
- **FR-017**: On screen mount, the module MUST hydrate its selection summary from persisted state if present.
- **FR-018**: If the App Group is not available, the module MUST fall back to in-memory storage for the session and log a warning in dev builds; it MUST NOT crash.

#### Config Plugin

- **FR-019**: A config plugin at `plugins/with-screentime/` MUST add the `com.apple.developer.family-controls` iOS entitlement, with a comment indicating that Apple approval is required.
- **FR-020**: The plugin MUST add the `DeviceActivityMonitorExtension` as a separate iOS target with a unique target name that does not collide with feature 007's `LiveActivityWidget` target or feature 014's `HomeWidget` target.
- **FR-021**: If feature 014's App Group bundle marker is present in the iOS project, the plugin MUST NOT modify that App Group configuration; it MUST only consume it.
- **FR-022**: The plugin MUST be idempotent: running it multiple times on the same project MUST produce the same result.

#### Error & Status Reporting

- **FR-023**: Each card MUST surface the most recent native error or success message in a status text region; errors MUST never propagate as uncaught promise rejections.
- **FR-024**: A reducer in `src/modules/screentime-lab/screentime-state.ts` MUST track: `authStatus`, `selectionSummary`, `shieldingActive`, `monitoringActive`, `lastError`. All transitions MUST be pure functions covered by tests.

#### Test Suite (JS-pure, Windows-runnable)

- **FR-025**: The following test files MUST exist and pass under `pnpm check`:
  - `screentime-state.test.ts` — reducer transitions
  - `native/screentime.test.ts` — bridge contract (mocked native)
  - `plugins/with-screentime/index.test.ts` — entitlement added, extension target added, idempotent, does not break 007/014 fixtures
  - `components/EntitlementBanner.test.tsx` — banner renders when entitlement false; renders nothing when true
  - `components/AuthorizationCard.test.tsx` — three-state pill; button calls `bridge.requestAuthorization`
  - `components/ActivityPickerCard.test.tsx` — `pickActivity` → summary; clear resets state
  - `components/ShieldingCard.test.tsx` — Apply/Clear; disabled when no selection
  - `components/MonitoringCard.test.tsx` — Start/Stop; default 09:00–21:00 schedule
  - `screen.test.tsx`, `screen.android.test.tsx`, `screen.web.test.tsx` — integration; banner behavior
  - `manifest.test.ts` — manifest valid; `minIOS = '16.0'`

#### Quality Gates

- **FR-026**: `pnpm check` MUST be green (typecheck, lint, tests).
- **FR-027**: Constitution v1.0.1 MUST pass.
- **FR-028**: Existing project conventions MUST be followed: `ThemedText` / `ThemedView`, `Spacing`, `StyleSheet.create()`, path aliases, TypeScript strict.
- **FR-029**: The change set MUST be purely additive: only `src/modules/registry.ts` (1-line edit) and `app.json` (1 plugin entry) may touch existing files. No edits to features 006–014.

### Key Entities

- **AuthorizationStatus**: enum of `notDetermined` | `approved` | `denied`. Reflects the user's response to the system FamilyControls authorization prompt.
- **ActivitySelection**: opaque token (string) plus three counts (`applicationCount`, `categoryCount`, `webDomainCount`). The token is produced by `FamilyActivityPicker` and is the only payload acceptable to `applyShielding` and `startMonitoring`. Persisted in App Group `UserDefaults`.
- **DeviceActivitySchedule**: tuple of `startHour`, `startMinute`, `endHour`, `endMinute`; the module hard-codes the demo schedule to 09:00–21:00 daily.
- **ScreenTimeState**: in-memory React reducer state holding `authStatus`, `selectionSummary`, `shieldingActive`, `monitoringActive`, `lastError`.
- **EntitlementStatus**: boolean derived once at module mount via `entitlementsAvailable()`; gates the on-screen banner and the disabled-state logic of action buttons.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer without the FamilyControls entitlement can open the Screen Time Lab module on an iOS 16+ device and exercise every visible button without crashing the app, in under 2 minutes from a cold app launch.
- **SC-002**: 100% of the JS-pure test suite (reducer, bridge contract, config plugin, component tests, screen integration tests, manifest test) passes on Windows under `pnpm check`, with no native or device dependencies.
- **SC-003**: The module is purely additive: a `git diff` against `main` for files outside `specs/`, `plugins/with-screentime/`, `native/ios/screentime/`, `src/modules/screentime-lab/`, and `src/native/screentime.ts` shows changes only in `src/modules/registry.ts` (≤ 2 lines) and `app.json` (≤ 1 plugin entry).
- **SC-004**: An entitled developer (per the manual quickstart) can complete the authorize → pick → apply flow in under 3 minutes and visibly observe a target app being shielded.
- **SC-005**: Running the app on Android and on web shows the "iOS-only" banner with disabled controls, with zero JavaScript exceptions thrown.
- **SC-006**: The 015 config plugin runs idempotently: a second `expo prebuild` produces no additional changes to the iOS project file.
- **SC-007**: Enabling the 015 plugin alongside the 007 and 014 plugins (in fixture tests) produces a project with three distinct extension/widget targets and no collisions.

---

## Assumptions

- **Entitlement gating** *(repeated for prominence)*: The `com.apple.developer.family-controls` entitlement requires Apple's written approval. Most users of this showcase will not have it; the module is therefore designed first for the unentitled experience and second for the entitled experience. All native operations are wrapped to fail gracefully (typed `EntitlementMissing` rejection) rather than crash. The on-screen `EntitlementBanner`, the `quickstart.md`, and this spec all surface this reality.
- **Conditional on-device verification**: Functional verification of the actual restriction-applying behavior (shielding, monitoring callbacks) is conditional on having the entitlement and a physical iOS 16+ device. CI and Windows-based development verify only the JS-pure layer (reducer, bridge contract, config plugin, components, manifest).
- **EAS Build provisioning**: A standard EAS Build will fail at the provisioning step if `com.apple.developer.family-controls` is declared in `app.json` and the team's Apple account lacks approval. The `quickstart.md` MUST document this and instruct users to comment out the `with-screentime` plugin entry in `app.json` until entitlement is granted.
- **Swift code is not unit-testable on Windows**: Swift sources are written, reviewed, and compiled on macOS or via EAS Build. JS-side mocks substitute for the native module in all Windows-runnable tests.
- **App Group reuse from feature 014**: Feature 014 (Home Widgets) is assumed to have established the shared App Group identifier used for `UserDefaults`-based persistence. Feature 015 only consumes it; if absent, the module degrades to in-memory persistence.
- **iOS minimum version**: iOS 16.0 is assumed as the minimum for this module (FamilyControls and DeviceActivity APIs require iOS 15+, but the picker integration and monitor extension patterns used here target iOS 16+).
- **No family member targeting**: Authorization is requested for the individual user only; family-member parental controls workflows are out of scope.
- **No custom shielding UI**: The default system shield is used; `ShieldConfiguration` extensions are out of scope.
- **No persistence across reinstalls**: Selection tokens and authorization status survive app relaunches but are not migrated across uninstall/reinstall.
- **No usage queries**: ScreenTime usage querying APIs (e.g., `DeviceActivityReport`) are out of scope; only schedule registration and shielding are demonstrated.
- **Single-line registry edit**: Adding the module to `src/modules/registry.ts` requires only one import statement and one entry in the modules array; this is the only edit to existing files outside `app.json`.

---

## Out of Scope

- ScreenTime usage queries beyond simple schedule registration (no `DeviceActivityReport`).
- Custom shielding UI (`ShieldConfiguration`).
- App-store-shipping-quality UX (this is an educational scaffold).
- Family member targeting (only individual user authorization).
- Web filtering details beyond the count surfaced from the picker.
- Persistent state across reinstalls.
- Modifications to features 006–014 (other than the single-line registry edit consuming feature 014's App Group).
