---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+ (BGTaskScheduler requires native iOS build)
  - iPhone running iOS 13+
  - Apple Developer account (free tier sufficient)
---

# How to verify Background Tasks on iPhone

## Goal
Confirm BGAppRefreshTask and BGProcessingTask are scheduled, register as pending
in the task list, and simulate-fire correctly via the Xcode debugger command to
produce observable in-app outcomes.

## Prerequisites
- macOS with Xcode 15+
- iPhone running iOS 13+
- `with-background-tasks` plugin registered in `app.json` (adds
  `BGTaskSchedulerPermittedIdentifiers` to Info.plist)

## Steps
1. Build the JS layer:
   ```bash
   pnpm install && pnpm check
   ```
2. Open `ios/Spot.xcworkspace` in Xcode; build and run on device with debugger
   attached (Product → Run ⌘R).
3. In the app, navigate to **"Background Tasks"** in the Modules tab.
4. Tap **Schedule App Refresh** — confirm task ID appears in the Pending Tasks list.
5. Background the app (home button / swipe up).
6. In the Xcode debugger console, run:
   ```
   e -l objc -- (void)[[BGTaskScheduler sharedScheduler] _simulateLaunchForTaskWithIdentifier:@"com.spot.refresh"]
   ```
7. Foreground the app — confirm the "last ran" timestamp for the app-refresh task updated.
8. Repeat steps 4–7 for **Schedule Processing Task** using the processing identifier.
9. Tap **Cancel All** — confirm the Pending Tasks list empties.

## Verify
- Scheduling adds task IDs to the Pending Tasks list
- Simulated launch updates the "last ran" timestamp in-app
- Cancel All clears all pending task registrations
- Both BGAppRefreshTask and BGProcessingTask identifiers are accepted by BGTaskScheduler
- On Android: WorkManager equivalent task fires and updates the list

## Troubleshooting
- **"BGTaskScheduler: Error scheduling BGTask" in console** → ensure identifier
  matches exactly what's listed in `BGTaskSchedulerPermittedIdentifiers` in Info.plist
- **Simulate command not found** → ensure you are paused in the Xcode debugger on
  a real device; the simulate command does not work on simulator
- **Timestamps never update** → the task handler must call `task.setTaskCompleted(success: true)`
  to prevent the OS from treating the task as expired

## Implementation references
- Spec: `specs/030-background-tasks/spec.md`
- Plan: `specs/030-background-tasks/plan.md`
- Module: `src/modules/background-tasks-lab/`
- Native bridge: `src/native/background-tasks.ts`
- Plugin: `plugins/with-background-tasks/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows