---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+ (StoreKit 2 requires native iOS build)
  - iPhone running iOS 15+
  - Apple Developer account (paid account required; IAP products configured in App Store Connect)
  - StoreKit Configuration file included for local testing (Xcode Scheme → StoreKit Configuration)
---

# How to verify StoreKit 2 on iPhone

## Goal
Confirm `Product.products(for:)` loads configured in-app purchase products,
purchase and restore flows complete in sandbox or with a StoreKit Configuration
file, transaction verification passes, and entitlement state updates after purchase.

## Prerequisites
- macOS with Xcode 15+
- iPhone running iOS 15+
- Paid Apple Developer account with at least one IAP product configured (or a local
  StoreKit Configuration file for offline testing)
- `with-storekit` plugin registered in `app.json`

## Steps
1. Build the JS layer:
   ```bash
   pnpm install && pnpm check
   ```
2. In Xcode, edit the **SpotDev** scheme → Options → StoreKit Configuration →
   select `StoreKitConfig.storekit`.
3. Build and run on device (⌘R).
4. In the app, navigate to **"StoreKit 2"** in the Modules tab.
5. Confirm the product list loads with title, description, and price.
6. Tap **Buy** on a consumable → the purchase sheet appears → authenticate
   → confirm transaction completes and the result panel shows `verified`.
7. Tap **Buy** on a non-consumable → purchase → confirm entitlement granted
   (feature gated behind purchase is now unlocked).
8. Force-quit and relaunch → confirm entitlement persists.
9. Tap **Restore Purchases** → confirm all prior purchases are restored.

## Verify
- Product list loads with correct titles and prices from configuration
- Consumable purchase completes and transaction shows "verified"
- Non-consumable purchase gates the feature and persists after relaunch
- Restore Purchases restores previously purchased non-consumables
- On iOS < 15: in-app banner "StoreKit 2 requires iOS 15+"

## Troubleshooting
- **Product list is empty** → ensure the StoreKit Configuration file is selected
  in the scheme, or the IAP products are approved and active in App Store Connect
- **Transaction shows "unverified"** → in a local StoreKit Configuration, transactions
  are always verified; sandbox may occasionally have delays
- **Purchase fails with "cannot connect to iTunes Store"** → ensure sandbox account
  is signed in via Settings → App Store → [sandbox account] and the device has network

## Implementation references
- Spec: `specs/050-storekit-2/spec.md`
- Plan: `specs/050-storekit-2/plan.md`
- Module: `src/modules/storekit-lab/`
- Native bridge: `src/native/storekit.ts`
- Plugin: `plugins/with-storekit/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows