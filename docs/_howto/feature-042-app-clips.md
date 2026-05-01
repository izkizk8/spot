---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+ (App Clips require a separate Xcode target)
  - iPhone running iOS 14+
  - Paid Apple Developer account (App Clip target requires a separate App ID)
  - NFC tag, QR code, or Safari URL configured for App Clip invocation
---

# How to verify App Clips on iPhone

## Goal
Confirm the App Clip target launches successfully from a QR code / NFC tag /
Safari smart-banner invocation, the lightweight UI renders correctly, and
the "Open Full App" affordance deep-links to the main Spot installation.

## Prerequisites
- macOS with Xcode 15+
- iPhone running iOS 14+
- Paid Apple Developer account (App Clip App ID configured in the Developer Portal)
- Test invocation URL configured in App Store Connect under App Clips

## Steps
1. Build the JS layer:
   ```bash
   pnpm install && pnpm check
   ```
2. Open `ios/Spot.xcworkspace` in Xcode; select the **SpotClip** scheme.
3. Build and run the clip on device (⌘R with SpotClip scheme).
4. The App Clip card appears and the mini UI loads.
5. Confirm "Open in Spot" button is visible at the bottom of the App Clip.
6. In the main app (full install), navigate to **"App Clips"** in the Modules tab.
7. Tap **Simulate App Clip Invocation** → confirm the clip invocation URL is
   generated and the result panel shows the clip experience metadata.
8. If a physical invocation flow is available (QR code / NFC tag), scan it to
   invoke the clip end-to-end.

## Verify
- App Clip card appears on URL invocation
- Lightweight clip UI renders without the full app's dependencies
- "Open in Spot" transitions to the main Spot install
- In-app module shows clip invocation metadata
- On iOS < 14: module hidden; "App Clips require iOS 14+" banner shown

## Troubleshooting
- **App Clip card not appearing** → ensure the invocation URL matches exactly what
  is configured in App Store Connect App Clip experiences; prefix matching must be exact
- **"App Clip not found"** on device → the SpotClip target must be signed with a
  matching team and the App Clip App ID must be a child of the main App ID
- **Clip crashes immediately** → App Clips have a 10 MB size limit; check the target
  size; also ensure only lightweight frameworks are linked to the clip target

## Implementation references
- Spec: `specs/042-app-clips/spec.md`
- Plan: `specs/042-app-clips/plan.md`
- Module: `src/modules/app-clips-lab/`
- Native target: `native/ios/app-clip/`
- Plugin: `plugins/with-app-clips/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows