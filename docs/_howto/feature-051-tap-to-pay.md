---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+ (Tap to Pay requires native iOS build)
  - iPhone XS or later running iOS 16+ (NFC hardware required)
  - Apple Developer account (paid account; Tap to Pay on iPhone entitlement requires Apple approval)
  - Stripe or Adyen payment processor SDK (Tap to Pay on iPhone requires a PSP)
---

# How to verify Tap to Pay on iPhone

## Goal
Confirm the Tap to Pay on iPhone entitlement is accepted, a payment session can
be initialised via the payment service provider (PSP) SDK, the NFC-read animation
appears, and a test contactless transaction completes.

## Prerequisites
- macOS with Xcode 15+
- iPhone XS or later running iOS 16+
- Paid Apple Developer account with **Tap to Pay on iPhone** entitlement approved
- `with-tap-to-pay` plugin registered in `app.json`
  (adds `com.apple.developer.proximity-reader.payment.acceptance` entitlement)
- PSP SDK (e.g., Stripe Terminal iOS SDK) linked and configured

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
4. In the app, navigate to **"Tap to Pay"** in the Modules tab.
5. Confirm the Tap to Pay Available chip shows **"Available"** (iPhone XS+ on iOS 16+).
6. Tap **Initialise Reader** → confirm the PSP SDK initialises without error.
7. Tap **Start Payment ($0.01)** → confirm the NFC animation (iPhone held screen-up)
   appears with "Hold card near iPhone" prompt.
8. Tap a test contactless card or Apple Pay device on the back of the iPhone.
9. Confirm the transaction authorises and `status: success` is displayed.

## Verify
- "Available" chip shows on qualifying device (iPhone XS+ on iOS 16+)
- NFC animation and "Hold card near iPhone" prompt appear
- Test contactless card tap authorises the transaction
- Success callback logs the payment ID and amount
- On non-qualifying devices: "Tap to Pay requires iPhone XS+ and iOS 16+" banner

## Troubleshooting
- **Entitlement error on launch** → Tap to Pay on iPhone requires explicit Apple
  approval; apply at `https://developer.apple.com/tap-to-pay/`
- **"Reader unavailable"** → confirm device is iPhone XS or later with iOS 16+;
  also ensure the PSP SDK has been initialised with valid API credentials
- **NFC animation never appears** → the PSP SDK must call
  `ProximityReader.PaymentCardReader.readPaymentCard(for:)` — check PSP integration docs

## Implementation references
- Spec: `specs/051-tap-to-pay/spec.md`
- Plan: `specs/051-tap-to-pay/plan.md`
- Module: `src/modules/tap-to-pay-lab/`
- Native bridge: `src/native/tap-to-pay.ts`
- Plugin: `plugins/with-tap-to-pay/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows