---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+ (HomeKit requires native iOS build)
  - iPhone running iOS 11.4+
  - Apple Developer account (paid account required; HomeKit entitlement required)
  - A HomeKit-compatible accessory or the HomeKit Simulator (Xcode Instruments)
---

# How to verify HomeKit on iPhone

## Goal
Confirm HMHomeManager fetches homes, HMAccessory objects are discovered and
controlled, and the HomeKit entitlement does not produce rejection errors.

## Prerequisites
- macOS with Xcode 15+
- iPhone running iOS 11.4+
- Paid Apple Developer account (HomeKit capability enabled)
- `with-homekit` plugin registered in `app.json` (adds `NSHomeKitUsageDescription`,
  HomeKit entitlement)
- HomeKit accessory OR Xcode HomeKit Simulator running on the Mac

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
4. In the app, navigate to **"HomeKit"** in the Modules tab.
5. Tap **Request HomeKit Access** — grant permission.
6. Confirm the Homes list shows at least one home (from the Home app or simulator).
7. Tap a home → confirm Room and Accessory lists appear.
8. Tap an accessory (e.g., a simulated light) → tap **Toggle** → confirm the
   characteristic value changes (on/off) and the native Home app reflects the change.
9. Confirm the characteristic value readback updates in-app.

## Verify
- HomeKit permission prompt appears with description text
- Homes list populates from HMHomeManager
- Accessory toggle changes characteristic value
- Native Home app reflects the updated characteristic
- On non-iPhone (iPad without HomeKit data): graceful empty state

## Troubleshooting
- **Permission denied despite granting** → delete the app and reinstall; HomeKit
  permissions are sometimes cached incorrectly on first-time grant
- **Homes list empty** → set up a home in the native Home app, or start the
  Xcode HomeKit Simulator (Window → Devices and Simulators → HomeKit Simulator)
- **Entitlement error** → confirm `com.apple.developer.homekit` is in `Entitlements.plist`
  and the HomeKit capability is enabled in the Developer Portal under the App ID

## Implementation references
- Spec: `specs/044-homekit/spec.md`
- Plan: `specs/044-homekit/plan.md`
- Module: `src/modules/homekit-lab/`
- Native bridge: `src/native/homekit.ts`
- Plugin: `plugins/with-homekit/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows