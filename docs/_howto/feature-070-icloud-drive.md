---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+
  - iPhone running iOS 16+
  - Apple Developer account (**paid** — iCloud entitlement requires membership)
---

# How to verify iCloud Drive on iPhone

## Goal

List, create, and read files in the app's iCloud Drive container using
`NSFileCoordinator` and `NSMetadataQuery`, then confirm the `EntitlementBanner`
explains the requirement gracefully when the entitlement is absent.

## Prerequisites

- macOS with Xcode 15+
- iPhone running iOS 16+
- **Paid** Apple Developer Program membership (iCloud entitlements are not available
  on free accounts)
- iCloud Documents capability enabled in App Store Connect for your App ID
- iCloud container identifier registered in the Apple Developer portal
- `pnpm install` already run

## Steps

1. Build the JS layer and run the quality gate:
   ```bash
   pnpm install && pnpm check
   ```
2. Generate native iOS project (macOS only):
   ```bash
   npx expo prebuild --clean
   ```
3. In Xcode, open **Signing & Capabilities** for the Spot target:
   - Add the **iCloud** capability.
   - Enable **iCloud Documents**.
   - Add your registered container identifier (e.g. `iCloud.com.yourteam.spot`).
4. Open `ios/Spot.xcworkspace`, select your paid team, connect your iPhone.
5. Build and run with **Product → Run** (⌘R).
6. In the app, open the **Modules** tab and tap **iCloud Drive**.
7. The file list loads from `NSMetadataQueryUbiquitousDocumentsScope`.
8. Tap **Create Test File** — a new `.txt` file appears in the list.
9. Tap a listed file — its content appears in the preview pane.
10. Open the iOS Files app and navigate to **iCloud Drive → Spot** to confirm the file
    is visible there too.

## Verify

- File list loads without error and reflects the actual iCloud container contents
- A newly created file appears in both the lab screen and the iOS Files app
- Reading a file shows its content in the preview pane
- Without the entitlement the screen shows `EntitlementBanner` (error gracefully handled)

## Troubleshooting

- **`ICloudDriveNotAvailable` error banner on screen** → iCloud entitlement is missing;
  follow Steps 3 above and rebuild
- **File list is empty after file creation** → `NSMetadataQuery` may take a few seconds
  to observe new files; wait or pull-to-refresh
- **"This app is not authorized to access iCloud" alert** → sign out of iCloud on device
  and sign back in; or check the container identifier matches your portal registration
- **Prebuild fails with entitlement key error** → the `with-icloud-drive` plugin writes
  the entitlement; ensure `app.json` includes the plugin entry

## Implementation references

- Spec: `specs/070-icloud-drive/spec.md`
- Plan: `specs/070-icloud-drive/plan.md`
- Module: `src/modules/icloud-drive-lab/`
- Native bridge: `src/native/icloud-drive.ts`
- Plugin: `plugins/with-icloud-drive/`

## See Also

- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows