# Research — 049-apple-pay

## Frameworks

### PassKit / Apple Pay (iOS 8+)
- `PKPaymentAuthorizationController` — the modern, view-controller
  free entry point (replaces the legacy
  `PKPaymentAuthorizationViewController` constructor for new code).
- `PKPaymentRequest` — describes the merchant capabilities,
  networks, summary items, shipping methods, and required
  contact fields.
- `PKPaymentSummaryItem` — line-item label + `NSDecimalNumber`
  amount; the last item is the grand total.
- `PKPaymentNetwork.{visa, masterCard, amex, discover, chinaUnionPay}` —
  the canonical subset shown in this lab.

### Entitlements / capabilities
- **`com.apple.developer.in-app-payments`** — required. Value
  is an array of merchant identifiers
  (`merchant.<reverse-dns>`). The plugin seeds a single
  placeholder (`merchant.com.izkizk8.spot`) that operators MUST
  replace; an operator-supplied list is preserved verbatim.

### Info.plist requirements
- **None.** Apple Pay does not require a usage-description key.

## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| R-A | Add a config plugin even though Apple Pay needs no Info.plist key. | The merchant-id entitlement is mandatory and easy to forget; documenting the dependency in the chain prevents silent breakage. |
| R-B | Seed a single placeholder merchant id and document replacement in `SetupNotes`. | Keeps the educational scaffold runnable while making real-merchant configuration explicit. |
| R-C | Mock the bridge at the import boundary via `__setApplePayBridgeForTests`. | Mirrors 047 / 048 patterns; the native module is never loaded in jsdom. |
| R-D | Keep the supported-network catalog as a frozen string-literal union. | Single source of truth shared between the JS bridge, the manifest, and the components. |
| R-E | Return a mock payment token from the bridge. | This is an educational scaffold — real charges require a payment processor (Stripe / Square / Adyen). The shape mirrors `PKPayment.token` enough to demonstrate the data flow. |

## Rejected alternatives

- **No plugin** (rely on operators to add the entitlement
  manually). Rejected — easy to forget, and the failure mode
  is a runtime PKPasses/Wallet error.
- **Use `PKPaymentAuthorizationViewController` directly.**
  Rejected — `PKPaymentAuthorizationController` is the modern
  replacement and avoids dragging a UIKit VC into the bridge
  for a feature whose UX lives mostly in the system sheet.
- **Ship a real Stripe integration.** Out of scope — this is
  the Apple Pay surface scaffold; payment processors are a
  separate concern documented in `SetupNotes`.
