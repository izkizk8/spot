---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+ (CarPlay requires native iOS build and CarPlay entitlement)
  - iPhone running iOS 14+
  - Apple Developer account (paid account; CarPlay entitlement requires Apple approval)
  - CarPlay simulator (built into Xcode iOS Simulator) or a real car head unit
---

# How to verify CarPlay on iPhone

## Goal
Confirm the CarPlay App Template (e.g., CPListTemplate or CPGridTemplate) renders
correctly in the Xcode CarPlay Simulator, navigation interactions work, and the
entitlement is accepted without errors.

## Prerequisites
- macOS with Xcode 15+
- iPhone running iOS 14+
- Paid Apple Developer account with CarPlay entitlement approved by Apple
- `with-carplay` plugin registered in `app.json` (adds CarPlay entitlement)

## Steps
1. Build the JS layer:
   ```bash
   pnpm install && pnpm check
   ```
2. Open `ios/Spot.xcworkspace` in Xcode.
3. Enable the Xcode CarPlay Simulator: I/O → External Displays → CarPlay.
4. Build and run on iPhone simulator (⌘R).
5. In the app, navigate to **"CarPlay"** in the Modules tab.
6. In the CarPlay simulator window, confirm the Spot CarPlay app icon appears.
7. Tap the Spot icon — the CarPlay template (list / grid) renders in the window.
8. Tap a list item — confirm navigation event fires and the in-app result panel
   logs the selected item.
9. Connect a physical iPhone to a real CarPlay-compatible head unit (optional)
   to verify on hardware.

## Verify
- CarPlay simulator shows Spot app icon in the CarPlay launcher
- Tapping the icon renders the configured template without crash
- List item tap fires navigation callback and logs the event in-app
- On iOS < 14: in-app banner "CarPlay requires iOS 14+"
- Entitlement accepted (no `NSError` domain `CarPlay` errors in Xcode console)

## Troubleshooting
- **CarPlay simulator not showing Spot** → ensure the `CPTemplateApplicationSceneDelegate`
  is correctly registered and the entitlement matches the provisioning profile
- **Entitlement error** → CarPlay entitlements require explicit Apple approval;
  submit a CarPlay entitlement request at
  `https://developer.apple.com/carplay/`
- **Template renders blank** → `CPListTemplate` items array must be non-empty;
  provide at least one `CPListItem`

## Implementation references
- Spec: `specs/045-carplay/spec.md`
- Plan: `specs/045-carplay/plan.md`
- Module: `src/modules/carplay-lab/`
- Native bridge: `src/native/carplay.ts`
- Plugin: `plugins/with-carplay/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows