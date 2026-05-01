# Implementation Plan — 050-storekit-2

## Files

### Native (iOS)
- `native/ios/storekit/StoreKitBridge.swift` — Expo Module
  wrapping StoreKit 2 (`Product`, `Transaction`, `AppStore`).
  Methods: `products(ids)`, `purchase(productId)`,
  `currentEntitlements`, `transactionHistory`, `restore`.
- `native/ios/storekit/StoreKit.podspec`.
- `native/ios/storekit/expo-module.config.json`.

### JS bridge
- `src/native/storekit.types.ts` — shared types
  (`StoreKitProduct`, `ProductType`, `PurchaseOutcome`,
  `StoreKitTransaction`, `EntitlementSummary`,
  `SubscriptionStatusInfo`, `StoreKitBridge`,
  `StoreKitNotSupported`).
- `src/native/storekit.ts` — iOS variant.
- `src/native/storekit.android.ts` — rejects with
  `StoreKitNotSupported`.
- `src/native/storekit.web.ts` — rejects with
  `StoreKitNotSupported`.

### Module
- `src/modules/storekit-lab/index.tsx` — manifest.
- `src/modules/storekit-lab/screen.tsx` — iOS screen.
- `src/modules/storekit-lab/screen.android.tsx`.
- `src/modules/storekit-lab/screen.web.tsx`.
- `src/modules/storekit-lab/demo-products.ts` — placeholder
  catalog + pure helpers (`isProductId`, `byType`,
  `formatPrice`).
- `src/modules/storekit-lab/hooks/useStoreKit.ts` — full
  lifecycle hook + `__setStoreKitBridgeForTests`.
- `src/modules/storekit-lab/components/{CapabilityCard,
  ProductsList, ProductRow, EntitlementsList,
  TransactionHistory, SubscriptionStatusCard,
  RestoreButton, SetupInstructions, IOSOnlyBanner}.tsx`.

### Plugin
- `plugins/with-storekit/index.ts` — adds an
  `SKStoreKitConfigurationFilePath` Info.plist hint pointing at
  `Configuration.storekit` placeholder. Idempotent; preserves
  operator-supplied values.
- `plugins/with-storekit/package.json`.

### Tests (JS-pure)
- `test/unit/native/storekit.test.ts` — bridge contract.
- `test/unit/modules/storekit-lab/manifest.test.ts`.
- `test/unit/modules/storekit-lab/registry.test.ts`.
- `test/unit/modules/storekit-lab/demo-products.test.ts`.
- `test/unit/modules/storekit-lab/hooks/useStoreKit.test.tsx`.
- `test/unit/modules/storekit-lab/screen.test.tsx`.
- `test/unit/modules/storekit-lab/screen.android.test.tsx`.
- `test/unit/modules/storekit-lab/screen.web.test.tsx`.
- `test/unit/modules/storekit-lab/components/{CapabilityCard,
  ProductsList, ProductRow, EntitlementsList,
  TransactionHistory, SubscriptionStatusCard, RestoreButton,
  SetupInstructions, IOSOnlyBanner}.test.tsx` (×9).
- `test/unit/plugins/with-storekit/index.test.ts`.

### Wiring
- `src/modules/registry.ts` — append `storekitLab`.
- `app.json` — insert `./plugins/with-storekit` after
  `./plugins/with-apple-pay` (length 39 → 40).
- `test/unit/plugins/with-mapkit/index.test.ts` — bump 39 → 40.
- `test/unit/plugins/with-weatherkit/index.test.ts` — bump
  39 → 40.
- `test/unit/plugins/with-roomplan/index.test.ts` — bump
  39 → 40.
- `test/unit/plugins/with-apple-pay/index.test.ts` — bump
  39 → 40.

## Constraints

- Additive-only.
- No `eslint-disable`.
- `pnpm format` before commit.
- Native bridge mocked at import boundary.
- Plugin must coexist with the rest of the chain and be
  byte-stable on re-run.
