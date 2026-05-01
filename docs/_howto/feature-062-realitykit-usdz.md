---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+
  - iPhone running iOS 13+
  - Apple Developer account (free tier is sufficient)
---

# How to verify RealityKit USDZ AR Quick Look on iPhone

## Goal

Open a USDZ 3D model in iOS AR Quick Look via `QLPreviewController`, walk around a
virtual object placed in the room, and confirm RealityKit capability flags are reported
correctly by the JS bridge.

## Prerequisites

- macOS with Xcode 15+
- iPhone running iOS 13+ (AR Quick Look + `QLPreviewController` available since iOS 13)
- Free Apple Developer account (no extra entitlements required)
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
3. Open `ios/Spot.xcworkspace` in Xcode, select your personal team under
   **Signing & Capabilities**, and connect your iPhone.
4. Build and run with **Product → Run** (⌘R).
5. In the app, open the **Modules** tab and tap **RealityKit USDZ**.
6. The lab screen shows the device AR capability card (LiDAR, World Tracking flags).
7. Tap **Open AR Quick Look** — `QLPreviewController` launches with the bundled USDZ
   model rendered in full AR view.
8. Point the phone at a flat surface; the model appears anchored to the floor.
9. Walk around the model or pinch to scale it; tap **Share** in the Quick Look toolbar
   to confirm sharing works.

## Verify

- AR Quick Look sheet opens without crashing
- The USDZ model is visible and stays anchored to the surface
- Device capability flags (e.g. `supportsARKit`) are shown correctly in the lab card
- Closing Quick Look returns to the lab screen cleanly

## Troubleshooting

- **"AR not supported" shown** → older devices without A9+ chip cannot run ARKit;
  the model still opens in Object mode (no surface placement)
- **Model fails to load** → confirm network access; the USDZ URL is fetched at runtime.
  Test on a device with an active internet connection
- **Black screen in AR Quick Look** → grant Camera permission when prompted; revoke/re-grant
  via **Settings → Privacy → Camera → Spot**

## Implementation references

- Spec: `specs/062-realitykit-usdz/spec.md`
- Plan: `specs/062-realitykit-usdz/plan.md`
- Module: `src/modules/062-realitykit-usdz/`
- Native bridge: `src/native/realitykit-usdz.ts`

## See Also

- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows