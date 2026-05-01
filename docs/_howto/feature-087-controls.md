---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 16+ (iOS 18 SDK required)
  - iPhone running iOS 18+
  - Apple Developer account (free tier is sufficient)
---

# How to verify Control Center custom Controls on iPhone

## Goal

View the registered `ControlWidget` descriptors in the Controls lab, trigger a
simulated `AppIntent` invocation, and add a custom control to Control Center via
**Settings → Control Center**.

## Prerequisites

- macOS with Xcode 16+ (WidgetKit `ControlWidget` is an iOS 18 API)
- iPhone running iOS 18+ (Control Center customisation APIs unavailable on iOS 17)
- Free Apple Developer account (no paid membership required for the lab UI)
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
5. In the app, open the **Modules** tab and tap **Control Center**.
6. The **Controls Capability** card shows OS version and `ControlWidget` availability.
7. In the **Registered Controls** list, each control shows its kind, title, SF Symbol
   icon, and current state (for toggles).
8. Tap **Trigger** on a toggle control — the simulated `AppIntent` invocation runs
   and the state indicator updates.
9. Read the **Setup Guide** for the full five-step Xcode walkthrough.
10. On device, open **Settings → Control Center** and scroll to **More Controls**.
    Tap **+** next to the Spot control entry to add it to your Control Center.
11. Swipe down from the top-right corner to open Control Center and confirm the
    custom control tile is visible.

## Verify

- Controls Capability card shows `ControlWidget` as available on iOS 18+
- Registered Controls list shows at least two control descriptors
- Trigger button simulates an AppIntent and the state updates in the list
- Custom control tile appears in Settings → Control Center after Step 10
- On iOS 17 and below, the screen shows an "iOS Only Feature" banner

## Troubleshooting

- **"iOS Only Feature" banner on iOS 18 device** → confirm Xcode 16 was used to build;
  older SDKs do not include `ControlWidget`
- **Control not visible in Settings → Control Center** → ensure `NSSupportsControlCenter`
  is `true` in Info.plist (written by `with-controls` plugin); run
  `npx expo prebuild --clean` if missing
- **Trigger button shows no state change** → the AppIntent handler is simulated in JS;
  a real Widget Extension target is required for live Control Center interaction
- **Build error "ControlWidget not found"** → update Xcode to 16.0 or later

## Implementation references

- Spec: `specs/087-controls/spec.md`
- Plan: `specs/087-controls/plan.md`
- Module: `src/modules/controls-lab/`
- Native bridge: `src/native/controls.ts`
- Plugin: `plugins/with-controls/`

## See Also

- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows