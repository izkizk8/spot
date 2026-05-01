---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+ (LiDAR / RoomPlan require native iOS build)
  - iPhone 12 Pro or later (LiDAR sensor required)
  - iPhone running iOS 16+
  - Apple Developer account (free tier sufficient)
---

# How to verify LiDAR & RoomPlan on iPhone

## Goal
Confirm ARWorldTrackingConfiguration with LiDAR scene reconstruction produces a
mesh overlay, RoomCaptureSession captures a room scan, and the exported USDZ room
model can be previewed with QuickLook.

## Prerequisites
- macOS with Xcode 15+
- iPhone 12 Pro, 13 Pro, 14 Pro, 15 Pro, or later (LiDAR scanner required)
- iPhone running iOS 16+
- `with-lidar-roomplan` plugin registered in `app.json`
  (adds `NSCameraUsageDescription`, `ARKit` frameworks)

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
4. In the app, navigate to **"LiDAR & RoomPlan"** in the Modules tab.
5. Grant camera permission when prompted.
6. **Scene Reconstruction tab**: tap **Start** → confirm polygon mesh overlays
   appear on surfaces (floor, walls, furniture outlines).
7. Tap **Stop** → confirm mesh freezes.
8. **RoomPlan tab**: tap **Start Room Scan** → slowly sweep the camera around a room.
9. After scanning all walls/floor/ceiling, tap **Finish** → confirm a reconstructed
   room wire-frame appears.
10. Tap **Export USDZ** → QLPreviewController presents the 3-D room model.

## Verify
- Scene reconstruction mesh overlays detected surfaces correctly
- RoomPlan scan produces a recognisable room wire-frame
- USDZ export opens in QuickLook with the room model
- On non-LiDAR device: "LiDAR not available on this device" banner
- On iOS < 16: "RoomPlan requires iOS 16+" banner

## Troubleshooting
- **Mesh not appearing** → confirm `sceneReconstruction: .mesh` is enabled in
  the AR configuration; also confirm device has LiDAR (check with
  `ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh)`)
- **RoomPlan scan terminates early** → move slowly and keep surfaces fully in frame;
  low lighting degrades capture quality
- **USDZ export is empty** → `RoomCaptureSession.export(to:)` requires at least
  one detected room structure; ensure the scan completed successfully before export

## Implementation references
- Spec: `specs/048-lidar-roomplan/spec.md`
- Plan: `specs/048-lidar-roomplan/plan.md`
- Module: `src/modules/lidar-roomplan-lab/`
- Native bridge: `src/native/lidar-roomplan.ts`
- Plugin: `plugins/with-lidar-roomplan/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows