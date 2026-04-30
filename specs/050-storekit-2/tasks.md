# Tasks — 050-storekit-2

- [x] T1  `src/native/storekit.types.ts` — shared types and
       `StoreKitNotSupported`.
- [x] T2  iOS / Android / Web bridge variants
       (`src/native/storekit*.ts`).
- [x] T3  Swift bridge (`StoreKitBridge.swift`,
       `StoreKit.podspec`, `expo-module.config.json`).
- [x] T4  `plugins/with-storekit/` — adds the
       `SKStoreKitConfigurationFilePath` Info.plist hint.
       Idempotent; preserves operator-supplied values.
- [x] T5  Module manifest + iOS / Android / Web screens.
- [x] T6  `demo-products.ts` — placeholder catalog + pure
       helpers (`isProductId`, `byType`, `formatPrice`).
- [x] T7  `useStoreKit` hook — full lifecycle (load, purchase,
       entitlements, history, restore), error surface,
       `__setStoreKitBridgeForTests`.
- [x] T8  Nine components (CapabilityCard, ProductsList,
       ProductRow, EntitlementsList, TransactionHistory,
       SubscriptionStatusCard, RestoreButton,
       SetupInstructions, IOSOnlyBanner).
- [x] T9  Wire registry; insert plugin into `app.json`; bump
       `with-mapkit`, `with-weatherkit`, `with-roomplan`,
       `with-apple-pay` count assertions from 39 to 40.
- [x] T10 Tests: bridge + manifest + registry + demo-products
       + hook + 3 screens + 9 components + plugin
       idempotency / coexistence.
- [x] T11 `pnpm format` + `pnpm check` green.
