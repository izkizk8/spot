# Quickstart: Live Activities + Dynamic Island Showcase

## Prerequisites

- Node 20+ and pnpm (project uses pnpm with `nodeLinker: hoisted`).
- macOS with Xcode 15+ (required to compile the Widget Extension).
- An EAS account with this project linked, OR a local Xcode signing
  identity for ad-hoc on-device builds.
- A **physical iPhone** running **iOS 16.1+** for end-to-end verification.
  Dynamic Island specifically requires iPhone 14 Pro or newer; on iOS
  16.1+ devices without a Dynamic Island (e.g., iPhone 13) the activity
  renders only on the Lock Screen — that is acceptable and matches the
  spec's *Assumptions*.
- All existing project tooling installed (`pnpm install`).

## Install the new dependency

```sh
npx expo install @expo/config-plugins
```

This is the single new (dev)dependency for this feature. It is required
by `plugins/with-live-activity/` to mutate the iOS project at prebuild
time. No runtime npm dep is added.

## Wire the config plugin

Add the local plugin to `app.json`:

```json
{
  "expo": {
    "plugins": [
      "./plugins/with-live-activity"
    ]
  }
}
```

## Generate the iOS project

```sh
pnpm exec expo prebuild --clean --platform ios
```

After this command:

- `ios/spot/Info.plist` MUST contain:

  ```xml
  <key>NSSupportsLiveActivities</key>
  <true/>
  ```

- `ios/spot.xcodeproj/project.pbxproj` MUST list a target named
  `LiveActivityDemoWidget` (the Widget Extension), and the main `spot`
  target MUST embed it via the "Embed App Extensions" build phase.

**Idempotency check (SC-008)**:

```sh
pnpm exec expo prebuild --clean --platform ios
git status ios/    # should report no changes after a second run
```

If `git status` reports a diff, the config plugin is not idempotent and
the build is broken — back-patch the spec per the Validate-Before-Spec
workflow rule.

## Build a dev client containing the Widget Extension

Use the existing `development` profile (iOS Simulator) for fast iteration
on the *non-activity* code paths:

```sh
pnpm ios:simulator
```

Live Activities **do not run in the iOS Simulator** in any meaningful way
for end-to-end verification (the simulator can render the Lock Screen
view but not the Dynamic Island in a useful manner). For full Story 1–3
verification, build the on-device dev client via the existing `sideload`
profile:

```sh
pnpm ios:ipa
```

Install the produced IPA on the iPhone, launch it, and verify per the
matrix below.

## Run the unit test gate

```sh
pnpm check        # format:check + lint + typecheck + jest
```

`pnpm check` MUST be green before this feature is considered complete
(FR-027 / SC-007). The three new test files exercise:

- `test/unit/modules/live-activity-demo/screen.test.tsx` — Start/Update/
  End wiring, status text, button enable/disable, non-iOS notice.
- `test/unit/native/live-activity.test.ts` — bridge contract; non-iOS
  stubs throw `LiveActivityNotSupportedError`; type signatures.
- `test/unit/plugins/with-live-activity/index.test.ts` — config plugin:
  Info.plist mutation, target registration, idempotency on a fixture
  config.

The Swift Widget Extension is **not** unit-tested in this environment
(no `xcodebuild test` step, no Swift test target). Manual verification
is the test of record for the Swift side — see the matrix below.

## On-device manual verification matrix

This matrix maps directly onto Stories 1–4 in `spec.md`. Run each row
and tick it off. Any FAIL in Stories 1–3 is a release blocker.

### Story 1 — Start (P1)

| # | Setup | Action | Expected | Pass? |
|---|---|---|---|---|
| 1.1 | iPhone 14 Pro+, iOS 16.1+, Live Activities authorised, no activity running | Open Modules → Live Activity Demo → Start | Lock Screen + Dynamic Island show the activity within 1 s; in-app status reads "Activity running" with initial counter (SC-001) | |
| 1.2 | Continuing from 1.1 | Lock the device (or pull down Notification Center) | Lock Screen view shows icon + name + counter + progress bar | |
| 1.3 | Continuing from 1.1 | Look at the Dynamic Island; long-press it; trigger a second activity (e.g., a timer) and observe the minimal | Compact: SF Symbol leading + counter trailing. Expanded: richer layout with progress bar. Minimal: SF Symbol only | |
| 1.4 | Activity already running | Tap Start again | App does not crash; no second activity created; in-app message indicates an activity is already running (edge case 2) | |

### Story 2 — Update (P2)

| # | Setup | Action | Expected | Pass? |
|---|---|---|---|---|
| 2.1 | Activity running from Story 1 | Tap Update | Counter increments by 1 on Lock Screen + DI compact + DI expanded + in-app status, all within 500 ms (SC-002) | |
| 2.2 | After ≥ 3 Updates | Background the app, then re-foreground it | In-app status shows the same counter the Lock Screen / DI shows (FR-009 reconcile) | |
| 2.3 | No activity running | Tap Update | App does not crash; in-app message indicates there is nothing to update (FR-025) | |

### Story 3 — End (P3)

| # | Setup | Action | Expected | Pass? |
|---|---|---|---|---|
| 3.1 | Activity running | Tap End | Activity disappears from Lock Screen + DI within 1 s; in-app status reads "No activity running" (SC-003) | |
| 3.2 | No activity running | Tap End | App does not crash; in-app message indicates there is nothing to end (FR-025) | |
| 3.3 | After 3.1 | Tap Start again | Fresh activity begins at the initial counter value; no carryover | |

### Story 4 — Graceful gating (P4)

| # | Setup | Action | Expected | Pass? |
|---|---|---|---|---|
| 4.1 | Android device or emulator | Open Modules tab | Live Activity Demo card visible, marked "iOS only"; tapping does not crash (SC-004) | |
| 4.2 | Web (Chromium / Safari / Firefox) | Open Modules tab | Same as 4.1 | |
| 4.3 | iOS 16.0 simulator | Open Modules tab | Card visible, marked "Requires iOS 16.1+"; tapping does not crash | |
| 4.4 | iOS 16.1+, Live Activities **disabled** in iOS Settings for this app | Open Live Activity Demo → Start | App does not crash; in-app message names "iOS Settings" as the place to re-enable Live Activities (SC-005) | |

### Cross-cutting

| # | Action | Expected | Pass? |
|---|---|---|---|
| X.1 | Force-quit the app while an activity is running, relaunch | In-app status reconciles to the actual system state (FR-009 / edge case 4) | |
| X.2 | Tap Start → End → Start → End rapidly five times | No orphaned or duplicate activities; in-app status stays consistent (edge case 7) | |
| X.3 | Throw an uncaught error inside `screen.tsx` (dev only) | Shell does not go down; user can navigate back to Modules (SC-009) | |
| X.4 | Run `pnpm check` on the merged feature branch | All four sub-steps pass (SC-007) | |
| X.5 | Run `pnpm exec expo prebuild --clean --platform ios` twice | Second run produces zero `git diff` under `ios/` (SC-008) | |

## Troubleshooting

- **"`requireNativeModule('LiveActivityDemo')` returned undefined"** —
  the dev client was built before the config plugin was wired. Re-run
  `pnpm exec expo prebuild --clean --platform ios` and rebuild the
  client (`pnpm ios:ipa`).
- **Activity does not appear despite Start succeeding** — confirm
  Settings → spot → Live Activities is ON, then check
  Settings → Face ID & Passcode (iOS) → Allow Access When Locked → Live
  Activities is ON.
- **Idempotency check fails** — likely the pbxproj target injection in
  `plugins/with-live-activity/add-widget-extension.ts` is keyed on a
  per-run identifier (e.g., a UUID) instead of the stable target name.
  Switch the existence check to the product reference name
  (`LiveActivityDemoWidget`).
