---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+ (PassKit requires native iOS build)
  - iPhone running iOS 9+
  - Apple Developer account (paid account required; pass type identifier entitlement required)
---

# How to verify PassKit Wallet on iPhone

## Goal
Confirm a PKPass file (boarding pass, coupon, or generic pass) is added to Apple
Wallet, displayed with correct fields, and the add-pass-to-wallet flow completes
without entitlement errors.

## Prerequisites
- macOS with Xcode 15+
- iPhone running iOS 9+
- Paid Apple Developer account (Pass Type IDs configured in the Developer Portal;
  `com.apple.developer.pass-type-identifiers` entitlement enabled)
- A valid signed `.pkpass` bundle (can be generated with the bundled test script)

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
4. In the app, navigate to **"PassKit Wallet"** in the Modules tab.
5. Confirm the CanAddPass chip shows **"Passes supported"**.
6. Tap **Generate Test Pass** — confirm a `.pkpass` row appears with name and serial number.
7. Tap **Add to Wallet** — the PKAddPassesViewController sheet appears with pass preview.
8. Tap **Add** — pass is added to Wallet; sheet dismisses.
9. Open the native Wallet app — confirm the test pass appears.
10. Back in the module, confirm the pass row status updates to **"In Wallet"**.

## Verify
- "Passes supported" chip appears on qualifying device
- PKAddPassesViewController presents the pass preview sheet
- Pass added to Wallet successfully
- Pass appears in native Wallet app
- In-app row reflects "In Wallet" status after add
- On Android: "PassKit is iOS-only" banner; all controls disabled

## Troubleshooting
- **"This device does not support passes"** → the PKPassLibrary is unavailable on
  some iPads or simulator; test on a physical iPhone
- **Pass fails validation** → the `.pkpass` bundle must have a valid `signature` and
  `manifest.json`; rerun the test-pass generator script
- **Entitlement error on add** → confirm `com.apple.developer.pass-type-identifiers`
  is in `Entitlements.plist` and the Pass Type ID is registered in the Developer Portal

## Implementation references
- Spec: `specs/036-passkit-wallet/spec.md`
- Plan: `specs/036-passkit-wallet/plan.md`
- Module: `src/modules/passkit-lab/`
- Native bridge: `src/native/passkit.ts`
- Plugin: `plugins/with-passkit/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows