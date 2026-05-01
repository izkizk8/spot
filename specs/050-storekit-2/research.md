# Research — 050-storekit-2

## R-A: StoreKit 2 surface

StoreKit 2 (iOS 15+) replaces the legacy
`SKPaymentQueue` / `SKPaymentTransactionObserver` model with a
modern async/await API:

- `Product.products(for:[String])` — fetches `Product` values.
- `product.purchase()` — returns `Product.PurchaseResult`
  (`success(VerificationResult<Transaction>)` /
  `userCancelled` / `pending`).
- `Transaction.currentEntitlements` — async sequence of the
  user's currently active entitlements.
- `Transaction.all` — async sequence of every transaction.
- `AppStore.sync()` — restores transactions.
- `Product.SubscriptionInfo.RenewalInfo` /
  `Product.SubscriptionInfo.Status` — renewal state for
  auto-renewable subs.

## R-B: Product types

- `consumable` (e.g. coins).
- `nonConsumable` (e.g. unlock).
- `autoRenewable` (subscriptions with renewal).
- `nonRenewing` (legacy non-renewing subs).

## R-C: Demo catalog

Placeholder ids ship as code-complete; real products require
App Store Connect setup or a `Configuration.storekit` file
in Xcode.

| id                                | type           |
|-----------------------------------|----------------|
| `com.izkizk8.spot.coins.100`      | consumable     |
| `com.izkizk8.spot.unlock.pro`     | nonConsumable  |
| `com.izkizk8.spot.sub.monthly`    | autoRenewable  |
| `com.izkizk8.spot.sub.season`     | nonRenewing    |

## R-D: Plugin scope

`plugins/with-storekit/` writes
`SKStoreKitConfigurationFilePath` to Info.plist with a
placeholder value `Configuration.storekit` — only when the key
is absent — so operators can swap in the real path. No
entitlement is required for IAP. Coexists with the chain.

## R-E: Test strategy

JS-pure. Native bridge is mocked at the import boundary via
`__setStoreKitBridgeForTests`. No StoreKit framework is
imported in any unit test.
