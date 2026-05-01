---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+ (NSPersistentCloudKitContainer requires native iOS build)
  - iPhone running iOS 13+
  - Paid Apple Developer account (iCloud capability + CloudKit enabled)
  - iCloud account signed in on the device
---

# How to verify Core Data + CloudKit on iPhone

## Goal
Confirm NSPersistentCloudKitContainer initialises the persistent store successfully,
records created on one device sync to iCloud and appear on a second device (or
the CloudKit dashboard), and the sync-event monitor shows cloud import/export events.

## Prerequisites
- macOS with Xcode 15+
- iPhone running iOS 13+
- Paid Apple Developer account (iCloud capability enabled; CloudKit container exists)
- `with-coredata-cloudkit` plugin registered in `app.json`
  (adds iCloud entitlement and CloudKit container identifier)

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
4. In the app, navigate to **"Core Data + CloudKit"** in the Modules tab.
5. Confirm the Persistent Store Status chip shows **"Ready"**.
6. Tap **Add Record** → enter title "CloudKit Test" → **Save**.
7. Confirm the row appears in the Records list.
8. Wait 30–60 s → open CloudKit Dashboard in a browser →
   navigate to the container → confirm the record is visible.
9. On a second device (or simulator with same Apple ID), run the app →
   navigate to the module → confirm the synced record appears.
10. Tap **Delete** on the record → confirm it disappears from both devices.

## Verify
- Persistent store initialises without error
- Record created in-app appears in CloudKit Dashboard within ~60 s
- Record syncs to a second device within ~60 s
- Deleted record disappears from both devices after sync
- Sync Events monitor shows IMPORT and EXPORT events
- On Android: Room + Firebase Firestore equivalent path used

## Troubleshooting
- **Persistent store status "Error"** → confirm iCloud is enabled on the device,
  the CloudKit container ID is correct, and the paid developer account has iCloud
  capability enabled in the App ID
- **Records not syncing** → check network; also confirm in Settings → Apple ID →
  iCloud → iCloud Drive is enabled
- **CloudKit Dashboard shows empty** → ensure the container identifier matches
  `NSPersistentCloudKitContainerOptions.cloudKitContainerIdentifier` and the
  development environment is selected in the dashboard

## Implementation references
- Spec: `specs/052-core-data-cloudkit/spec.md`
- Plan: `specs/052-core-data-cloudkit/plan.md`
- Module: `src/modules/coredata-cloudkit-lab/`
- Native bridge: `src/native/coredata-cloudkit.ts`
- Plugin: `plugins/with-coredata-cloudkit/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows