# Quick-start — Feature 070 iCloud Drive

## Running the lab (iOS 16+ device)

```bash
pnpm ios
# Navigate → iCloud Drive
# The EntitlementBanner explains the Apple Developer account requirement
```

> **Important:** Full iCloud Drive functionality requires:
> 1. A paid Apple Developer Program membership.
> 2. An explicit iCloud entitlement added in App Store Connect / Xcode.
> 3. A physical device signed with the provisioning profile that includes the entitlement.
>
> Without the entitlement the `ICloudDriveModule.swift` bridge throws
> `ICloudDriveNotAvailable` and the screen surfaces the error gracefully.

## Key APIs

| API | Notes |
|-----|-------|
| `NSFileCoordinator` | Coordinates read/write with other processes; required for iCloud containers |
| `NSMetadataQuery` | Observes `NSMetadataQueryUbiquitousDocumentsScope` for live file list |
| `NSUbiquitousContainers` | Info.plist key declaring the ubiquity container to the system |
| `com.apple.developer.icloud-container-identifiers` | Entitlement enabling the container |
| `com.apple.developer.ubiquity-container-identifiers` | Legacy entitlement for iCloud documents |

## Bridging overview

`ICloudDriveModule.swift` wraps `NSFileCoordinator` and `NSMetadataQuery` in async
Swift continuations, mapping iCloud file metadata to the `ICloudFileItem` dictionary
understood by the JS bridge.

## Setup checklist

- iOS deployment target ≥ 16.0 (already set in app.json)
- Enable **iCloud Documents** capability in Xcode (requires paid account)
- Add container identifier in Apple Developer portal
- The `with-icloud-drive` plugin writes the entitlement keys and `NSUbiquitousContainers`
  to the generated native project automatically
