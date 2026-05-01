# Tasks — 049-apple-pay

- [x] T1  `src/native/applepay.types.ts` — shared types and
       `ApplePayNotSupported`.
- [x] T2  iOS / Android / Web bridge variants
       (`src/native/applepay*.ts`).
- [x] T3  Swift bridge (`ApplePayBridge.swift`,
       `ApplePay.podspec`, `expo-module.config.json`).
- [x] T4  `plugins/with-apple-pay/` — adds
       `com.apple.developer.in-app-payments` entitlement with
       a placeholder merchant id; idempotent; preserves
       operator-supplied lists.
- [x] T5  Module manifest + iOS / Android / Web screens.
- [x] T6  `supported-networks.ts` — frozen network catalog +
       pure helpers (`totalAmount`, `validateRequest`).
- [x] T7  `useApplePay` hook — full lifecycle, error surface,
       `__setApplePayBridgeForTests`.
- [x] T8  Seven components (CapabilityCard, PaymentComposer,
       SummaryItemsEditor, PayButton, ResultCard, SetupNotes,
       IOSOnlyBanner).
- [x] T9  Wire registry; insert plugin into `app.json`; bump
       `with-mapkit`, `with-weatherkit`, `with-roomplan`
       count assertions from 38 to 39.
- [x] T10 Tests: bridge + manifest + registry + networks +
       hook + 3 screens + 7 components + plugin idempotency /
       coexistence.
- [x] T11 `pnpm format` + `pnpm check` green.
