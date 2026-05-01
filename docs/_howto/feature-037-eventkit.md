---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode (optional; EKEventStore works in custom dev client)
  - iPhone running iOS 6+ (iOS 17+ for write-only calendar access)
  - Apple Developer account (free tier sufficient)
---

# How to verify EventKit on iPhone

## Goal
Confirm EKEventStore can request calendar and reminder permissions, list existing
events, create and save a new event, and delete events with the correct commit scope.

## Prerequisites
- Node 20+, pnpm; `pnpm install` already run
- `with-eventkit` plugin registered in `app.json`
  (adds `NSCalendarsUsageDescription`, `NSRemindersUsageDescription`)

## Steps
1. Build the JS layer:
   ```bash
   pnpm install && pnpm check
   ```
2. Generate native project and build:
   ```bash
   npx expo prebuild --clean
   pnpm ios:ipa
   ```
3. Install the IPA per [sideload-iphone.md](sideload-iphone.md).
4. In the app, navigate to **"EventKit"** in the Modules tab.
5. Tap **Request Calendar Access** — grant full access when prompted.
6. Confirm the Events list shows upcoming events from the default calendar.
7. Tap **Add Event** → fill title "EventKit Test", start time = now+1 h, duration = 30 min
   → **Save** → confirm row appears in the list.
8. Tap **Request Reminders Access** — grant access.
9. Tap **Add Reminder** → title "Spot Reminder" → **Save** → confirm row in Reminders list.
10. Delete the test event and reminder → confirm rows disappear.

## Verify
- Calendar and reminders permission prompts appear with app-specific descriptions
- Upcoming events from the device calendar are listed
- New event and reminder created and appear in-app and in native Calendar/Reminders apps
- Deleted items removed from both in-app list and native apps
- On Android: Android Calendar ContentProvider equivalent tested

## Troubleshooting
- **Events list is empty after permission** → ensure the device has at least one
  calendar configured (Settings → Calendar → Accounts)
- **"Full access required"** on iOS 17+ → iOS 17 added write-only access level;
  the bridge must request `fullAccess` for read operations
- **Save fails with "no default calendar"** → a writable calendar must exist;
  iCloud Calendar must be enabled or a local calendar created

## Implementation references
- Spec: `specs/037-eventkit/spec.md`
- Plan: `specs/037-eventkit/plan.md`
- Module: `src/modules/eventkit-lab/`
- Native bridge: `src/native/eventkit.ts`
- Plugin: `plugins/with-eventkit/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows