# Feature 070 — iCloud Drive

**Slug:** 070-icloud-drive
**Branch:** 070-icloud-drive (based on 053-swiftdata)
**iOS min:** 16.0

## Overview

iCloud Drive file read/write via `NSFileCoordinator` and `NSMetadataQuery` lets an app create, read, update, and delete documents in the user's iCloud Drive ubiquity container and observe changes from other devices in real time. This educational lab demonstrates the bridge API, shows a file list, and explains the entitlement requirements.

## Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-001 | iOS 16+ only; Android and Web show `IOSOnlyBanner`. |
| FR-002 | `ICloudDriveBridge.isAvailable()` returns `true` when iCloud is signed in and the entitlement is present. |
| FR-003 | `ICloudDriveBridge.listFiles()` returns a list of `ICloudFileItem` entries (name, url, size, modifiedAt). |
| FR-004 | `ICloudDriveBridge.writeFile(name, content)` writes a UTF-8 text file to the ubiquity container. |
| FR-005 | `ICloudDriveBridge.readFile(url)` reads and returns the UTF-8 content of a file. |
| FR-006 | `ICloudDriveBridge.deleteFile(url)` removes the file via `NSFileCoordinator`. |
| FR-007 | `EntitlementBanner` explains the Apple Developer account requirement and manual entitlement enablement. |
| FR-008 | `with-icloud-drive` plugin writes `com.apple.developer.icloud-container-identifiers`, `com.apple.developer.ubiquity-container-identifiers`, and `NSUbiquitousContainers` to the appropriate plist files (idempotent, preserves operator values). |

## Non-functional Requirements

- Bridge mocked at import boundary via `__setICloudDriveBridgeForTests`.
- All styles via `StyleSheet.create`, no inline styles.
- `ThemedText` / `ThemedView` only; `Spacing` scale from `constants/theme`.
- Single quotes throughout.
- Zero `eslint-disable` comments.
