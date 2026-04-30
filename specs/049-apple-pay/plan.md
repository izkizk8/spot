# Implementation Plan — 049-apple-pay

## Files

### Native (iOS)
- `native/ios/applepay/ApplePayBridge.swift` — Expo Module
  wrapping `PKPaymentAuthorizationController`. Methods:
  `canMakePayments`, `canMakePaymentsUsingNetworks(networks)`,
  `presentPaymentRequest(opts) -> PaymentResult`.
- `native/ios/applepay/ApplePay.podspec`.
- `native/ios/applepay/expo-module.config.json`.

### JS bridge
- `src/native/applepay.types.ts` — shared types
  (`SupportedNetwork`, `SummaryItem`, `PaymentRequestOptions`,
  `PaymentResult`, `ApplePayBridge`, `ApplePayNotSupported`).
- `src/native/applepay.ts` — iOS variant.
- `src/native/applepay.android.ts` — rejects with
  `ApplePayNotSupported`.
- `src/native/applepay.web.ts` — rejects with
  `ApplePayNotSupported`.

### Module
- `src/modules/apple-pay-lab/index.tsx` — manifest.
- `src/modules/apple-pay-lab/screen.tsx` — iOS screen.
- `src/modules/apple-pay-lab/screen.android.tsx`.
- `src/modules/apple-pay-lab/screen.web.tsx`.
- `src/modules/apple-pay-lab/supported-networks.ts` — catalog +
  pure helpers (totalAmount, validateRequest).
- `src/modules/apple-pay-lab/hooks/useApplePay.ts` — full
  lifecycle hook + `__setApplePayBridgeForTests`.
- `src/modules/apple-pay-lab/components/{CapabilityCard,
  PaymentComposer, SummaryItemsEditor, PayButton, ResultCard,
  SetupNotes, IOSOnlyBanner}.tsx`.

### Plugin
- `plugins/with-apple-pay/index.ts` — adds
  `com.apple.developer.in-app-payments` entitlement with a
  placeholder merchant id list. Idempotent. Coexists with the
  rest of the chain.
- `plugins/with-apple-pay/package.json`.

### Tests (JS-pure)
- `test/unit/native/applepay.test.ts` — bridge contract.
- `test/unit/modules/apple-pay-lab/manifest.test.ts`.
- `test/unit/modules/apple-pay-lab/registry.test.ts`.
- `test/unit/modules/apple-pay-lab/supported-networks.test.ts`.
- `test/unit/modules/apple-pay-lab/hooks/useApplePay.test.tsx`.
- `test/unit/modules/apple-pay-lab/screen.test.tsx`.
- `test/unit/modules/apple-pay-lab/screen.android.test.tsx`.
- `test/unit/modules/apple-pay-lab/screen.web.test.tsx`.
- `test/unit/modules/apple-pay-lab/components/{CapabilityCard,
  PaymentComposer, SummaryItemsEditor, PayButton, ResultCard,
  SetupNotes, IOSOnlyBanner}.test.tsx` (×7).
- `test/unit/plugins/with-apple-pay/index.test.ts`.

### Wiring
- `src/modules/registry.ts` — append `applePayLab`.
- `app.json` — insert `./plugins/with-apple-pay` after
  `./plugins/with-roomplan` (length 38 → 39).
- `test/unit/plugins/with-mapkit/index.test.ts` — bump 38 → 39.
- `test/unit/plugins/with-weatherkit/index.test.ts` — bump 38 → 39.
- `test/unit/plugins/with-roomplan/index.test.ts` — bump 38 → 39.

## Constraints

- Additive-only.
- No `eslint-disable`.
- `pnpm format` before commit.
- Native bridge mocked at import boundary.
- Plugin must coexist with the rest of the chain and be
  byte-stable on re-run.
