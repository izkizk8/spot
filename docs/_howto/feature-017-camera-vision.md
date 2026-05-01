---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+ (Vision framework requires native iOS build)
  - iPhone running iOS 13+ (physical device for true frame analysis)
  - Apple Developer account (free tier sufficient)
---

# How to verify Camera + Vision on iPhone

## Goal
Confirm the live camera preview runs, the Vision analysis pipeline detects faces,
text, and barcodes in ~2-6 fps cycles, and bounding-box overlays track detected
objects in real time.

## Prerequisites
- macOS with Xcode 15+
- iPhone running iOS 13+
- `expo-camera` installed (`npx expo install expo-camera`)
- `with-vision` plugin registered in `app.json`
- `NSCameraUsageDescription` injected by the plugin at prebuild time

## Steps
1. Build the JS layer:
   ```bash
   pnpm install && pnpm check
   ```
2. Generate native project and build:
   ```bash
   npx expo prebuild --clean
   eas build --platform ios
   ```
3. Install the IPA per [sideload-iphone.md](sideload-iphone.md).
4. In the app, navigate to **"Camera Vision"** in the Modules tab.
5. Grant camera permission when prompted (first launch).
6. Confirm live camera preview fills the available area.
7. Mode Picker shows four segments: **Faces / Text / Barcodes / Off** — Faces pre-selected.
8. Point at a face → bounding-box overlays appear within ~1 second; Stats Bar
   shows detected count and FPS (2–6).
9. Tap **Text** → overlays update to text regions; VoiceOver focus announces recognized text.
10. Tap **Barcodes** → point at a QR code → bounding box appears; VoiceOver announces decoded payload.
11. Tap the camera-flip button → switches to front camera; analysis continues.
12. Navigate away → confirm no further `[VisionDetector]` log lines (unmount cleanup).

## Verify
- Face/text/barcode bounding boxes track correctly at 2-6 fps
- Stats Bar shows positive FPS, lastAnalysisMs, and correct detection count
- Camera flip switches to front camera without interrupting analysis
- Flash mode cycles: Off → Auto → On → Off
- On Android: live preview renders; Vision banner visible; analysis loop does not start
- On web: static placeholder; Vision banner visible; no camera permission prompt

## Troubleshooting
- **`Info.plist` missing `NSCameraUsageDescription`** → add `./plugins/with-vision`
  to `app.json` and run `npx expo prebuild --clean`
- **Overlays appear flipped** → bug in coordinate conversion; verify
  `y_top = 1 - (y_bottom + height)` in `VisionDetector.swift`
- **FPS stays 0** → check permission granted, mode not "Off", cameraRef attached

## Implementation references
- Spec: `specs/017-camera-vision/spec.md`
- Plan: `specs/017-camera-vision/plan.md`
- Module: `src/modules/camera-vision/`
- Native bridge: `src/native/vision-detector.ts`
- Plugin: `plugins/with-vision/`
- Swift: `native/ios/vision/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows