# Feature Specification: StoreKit 2 (In-App Purchase) Module

**Feature Branch**: `050-storekit-2`
**Feature Number**: 050
**Created**: 2026-05-14
**Status**: Approved (autonomous, no clarifications)
**Parent Branch**: `049-apple-pay`

## Summary

iOS 15+ educational module that demonstrates the modern
**StoreKit 2** API: products, purchases, transactions,
subscriptions, entitlements, and restore. Like 049, this is a
**scaffold for learning the API surface** — without an App
Store Connect / StoreKit configuration file the catalog stays
empty and the bridge returns deterministic mock results.

The showcase covers product loading, purchase flow outcomes
(success / userCancelled / pending), current entitlements,
transaction history, subscription renewal status, and the
`AppStore.sync()` restore flow.

Adds a "StoreKit 2" card to the 006 iOS Showcase registry
(`id: 'storekit-lab'`,
`platforms: ['ios','android','web']`,
`minIOS: '15.0'`).

The module ships a thin Swift bridge
(`native/ios/storekit/StoreKitBridge.swift`) wrapping
StoreKit 2's `Product`, `Transaction`, and `AppStore` async/await
API. The bridge is mocked at the import boundary in unit tests
(`__setStoreKitBridgeForTests`).

## Sections / UX

1. **Capability card** — store availability flag and a one-line
   summary of the configured product ids.
2. **Products list** — fetched via `Product.products([ids])`;
   shows id, type
   (consumable / non-consumable / auto-renewable / non-renewing),
   localized price, title, description.
3. **Purchase button per product** — invokes `Product.purchase()`;
   handles `success` / `userCancelled` / `pending`.
4. **Active entitlements card** — `Transaction.currentEntitlements`
   rendered as a list.
5. **Transaction history** — `Transaction.all` snapshot.
6. **Subscription status card** — for sub products, shows
   renewal info.
7. **Restore button** — calls `AppStore.sync()`.
8. **Setup instructions** — StoreKit Configuration file in
   Xcode for testing without real products; or App Store
   Connect product setup.
9. **IOSOnlyBanner** — Android / Web only.

## Decisions

- **Plugin: `plugins/with-storekit/`** — idempotent. Adds an
  `SKStoreKitConfigurationFilePath` Info.plist hint pointing
  at the placeholder `Configuration.storekit` so an operator
  knows where to drop the file. No-op when the key is already
  present (preserving operator-supplied values). The
  authoritative path is documented in `SetupInstructions`.
- **`app.json` plugins array** is bumped from 39 → 40 (insert
  `./plugins/with-storekit` after `./plugins/with-apple-pay`).
  The `with-mapkit`, `with-weatherkit`, `with-roomplan`, and
  `with-apple-pay` count assertions are bumped from 39 → 40.
- **Tests** are JS-pure; the native bridge is mocked at the
  import boundary via `__setStoreKitBridgeForTests`.
- **Demo product catalog** lives in `demo-products.ts`
  (placeholder ids covering all four product types). Real
  products require App Store Connect / StoreKit configuration.
- **Pure helpers** (filtering by type, formatting price,
  validating product id) live alongside the catalog so the
  JS surface is testable without touching native code.
- **Mock bridge results.** The educational bridge returns
  deterministic mock products and transactions; replacing it
  with a live App Store Connect catalog is documented in the
  SetupInstructions card.

## Acceptance criteria

- The module appears as the 45th entry in the registry, after
  `apple-pay-lab`.
- `pnpm check` is green.
- All new tests pass (JS-pure; no native module is ever loaded).
- The plugin coexists with the rest of the chain without
  throwing and is byte-stable when re-run.
