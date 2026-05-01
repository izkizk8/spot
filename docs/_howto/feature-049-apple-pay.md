---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+ (Apple Pay requires native iOS build)
  - iPhone running iOS 8+ with Apple Pay configured (at least one card in Wallet)
  - Paid Apple Developer account (Apple Pay entitlement and Merchant ID configured)
  - Test sandbox card added to Wallet via Apple Pay Sandbox testing account
---

# How to verify Apple Pay on iPhone

## Goal
Confirm PKPaymentRequest is constructed correctly, the Apple Pay sheet presents
with the configured merchant name and line items, a test payment authorises
successfully in sandbox, and PKPaymentAuthorizationController callbacks are handled.

## Prerequisites
- macOS with Xcode 15+
- iPhone running iOS 8+ with a sandbox test card in Wallet
- Paid Apple Developer account with Merchant ID configured and Apple Pay capability enabled
- `with-apple-pay` plugin registered in `app.json` (adds Apple Pay entitlement)

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
4. In the app, navigate to **"Apple Pay"** in the Modules tab.
5. Confirm the Apple Pay Supported chip shows **"Supported"**.
6. Tap **Pay $0.01** — the Apple Pay payment sheet appears with the merchant name
   and a $0.01 line item.
7. Authenticate with Face ID or Touch ID — sandbox payment authorises.
8. Confirm the result panel shows `status: success` and the payment token is logged.
9. Tap **Pay** again and cancel — confirm `status: cancelled` is shown.

## Verify
- "Apple Pay Supported" chip shows correct state
- Payment sheet appears with correct merchant name and amount
- Sandbox payment authorises successfully with Face ID / Touch ID
- Payment token is returned in success callback
- Cancelled payment returns cancelled status without crash
- On Android: Google Pay equivalent tested if configured
- On web: "Apple Pay is iOS-only" banner

## Troubleshooting
- **"Apple Pay is not supported"** → ensure at least one card is configured in
  Wallet; also check `PKPaymentAuthorizationController.canMakePayments(usingNetworks:)`
- **Payment sheet does not appear** → verify the Merchant ID matches in
  `app.json`, Entitlements.plist, and the Developer Portal
- **Payment fails with "unknown error"** → in sandbox mode, ensure the sandbox
  test card is added via Settings → App Store → [sandbox account] → Manage

## Implementation references
- Spec: `specs/049-apple-pay/spec.md`
- Plan: `specs/049-apple-pay/plan.md`
- Module: `src/modules/apple-pay-lab/`
- Native bridge: `src/native/apple-pay.ts`
- Plugin: `plugins/with-apple-pay/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows