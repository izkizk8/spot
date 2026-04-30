# Research — 051-tap-to-pay

## ProximityReader Framework Overview

### What is Tap to Pay on iPhone?

Tap to Pay on iPhone is a feature introduced in iOS 15.4 (expanded in
iOS 16.0+) that allows iPhones to accept contactless payments
(including credit/debit cards, Apple Pay, and other NFC-enabled
wallets) without requiring external payment hardware.

**Key Points:**
- Uses iPhone's built-in NFC reader (iPhone XS and later)
- Requires iOS 16.0+ for the `PaymentCardReaderSession` API
- Requires Apple's restricted entitlement
  `com.apple.developer.proximity-reader.payment.acceptance`
- Requires enrollment in Apple's Tap to Pay program
- Requires integration with a Payment Service Provider (PSP) SDK
  (Stripe Terminal, Adyen, Square, etc.)

### ProximityReader Framework

The `ProximityReader` framework provides the native iOS API surface
for Tap to Pay. Key class: `PaymentCardReaderSession`.

**Framework Import:**
```swift
import ProximityReader
```

**Availability:**
- iOS 16.4+
- Requires entitlement (will throw at runtime if missing)

### `PaymentCardReaderSession` API

#### Check Support

```swift
@available(iOS 16.0, *)
class PaymentCardReaderSession {
    static var isSupported: Bool { get }
}
```

Returns `true` if the device supports Tap to Pay (iPhone XS or
later, iOS 16.0+). Does NOT check entitlement status.

#### Initialize Session

```swift
init() async throws
```

Instantiates a reader session. Throws if:
- Entitlement is missing
- Device is unsupported
- iOS version is too old

#### Discover Reader

The session initialization itself is the "discovery" step. Once
initialized, the session is ready to accept payments. No separate
discovery call is required in the API (unlike external card readers).

#### Accept Payment

```swift
func readPaymentCard(_ request: PaymentCardTransactionRequest) async throws -> PaymentCardReaderSession.PaymentCardData
```

Accepts a payment request and returns card data upon successful tap.

**`PaymentCardTransactionRequest` structure:**
```swift
struct PaymentCardTransactionRequest {
    let amount: Decimal
    let currencyCode: String // ISO 4217
    let lineItems: [LineItem]?
    // ... other fields (merchant info, etc.)
}
```

**`LineItem` structure:**
```swift
struct LineItem {
    let label: String
    let amount: Decimal
}
```

**Return Value: `PaymentCardData`**
Contains:
- Card type (debit/credit)
- PAN (Primary Account Number, tokenized)
- Expiration date
- Transaction details

**Error Handling:**
- `.notEntitled` — entitlement missing
- `.sessionNotReady` — session not initialized
- `.userCancelled` — user cancelled tap
- `.cardDeclined` — issuer declined
- Network/reader errors

### Payment Outcomes

1. **Success**: Card tapped, issuer authorized, transaction data
   returned.
2. **Declined**: Card tapped but issuer declined (insufficient
   funds, card blocked, etc.).
3. **Error**: Session not ready, entitlement missing, user
   cancelled, hardware failure, etc.

## iOS Version Requirements

- **iOS 15.4**: Tap to Pay introduced (limited APIs)
- **iOS 16.0**: `PaymentCardReaderSession` becomes stable
- **iOS 16.4**: Full API surface available
- **This module targets iOS 16.0+** (minIOS: '16.0')

## Entitlement Details

### Entitlement Key
```
com.apple.developer.proximity-reader.payment.acceptance
```

**Type**: Boolean (true)

**Restriction**: Apple-restricted. Not automatically granted.
Requires enrollment in Apple's Tap to Pay program and approval.

### Requesting the Entitlement

1. **Enroll** in Apple's Tap to Pay on iPhone program:
   https://register.apple.com/tap-to-pay-on-iphone
2. **Integrate** a PSP SDK (see below)
3. **Submit** your App Store Connect app for entitlement review
4. **Apple reviews** and grants entitlement (if approved)

**Timeline**: Can take 1-4 weeks for approval.

### Plugin Role

The `with-tap-to-pay` plugin adds the entitlement key to the Xcode
project's entitlements plist. This does NOT grant Apple approval;
it's a prerequisite for the app to attempt to use the API. Without
the key, the API throws `.notEntitled` at runtime.

## PSP (Payment Service Provider) Integration

Tap to Pay on iPhone requires integration with a PSP that supports
the feature. The PSP SDK wraps the ProximityReader API and handles:
- Payment processing backend communication
- Transaction authorization
- Settlement
- Compliance (PCI DSS)

### Supported PSPs (as of 2026)

1. **Stripe Terminal SDK**
   - Docs: https://stripe.com/docs/terminal/payments/setup-reader/tap-to-pay-ios
   - Swift SDK wraps ProximityReader
   - Handles tokenization, authorization, settlement
   - Requires Stripe account + Terminal activation

2. **Adyen Point-of-Sale SDK**
   - Docs: https://docs.adyen.com/point-of-sale/ipp/tap-to-pay-ios/
   - Supports Tap to Pay on iPhone
   - Requires Adyen merchant account

3. **Square Terminal SDK**
   - Docs: https://developer.squareup.com/docs/terminal-api/overview
   - Supports Tap to Pay on iPhone
   - Requires Square seller account

4. **Others**: PayPal, Worldpay, Fiserv, etc. (check PSP docs)

### This Module's Approach

**This module does NOT integrate a real PSP.** The Swift bridge
demonstrates the ProximityReader API surface, but stops short of
actual payment processing. The `SetupNotes` component links to PSP
documentation and explains the integration requirement.

**Why no PSP in this PR?**
- Each PSP has its own SDK, credentials, and backend setup
- PSP integration is beyond the scope of an educational scaffold
- Developers can follow PSP docs to integrate after learning the API

## Currency Catalog (ISO 4217)

The payment request requires an ISO 4217 currency code (3-letter
string, e.g., `'USD'`). The module provides a catalog of 20+ common
currencies.

### Minor Units (Decimal Places)

Different currencies have different minor unit counts:
- **0 minor units**: JPY (Japanese Yen), KRW (South Korean Won) —
  no cents/pence
- **2 minor units**: USD, EUR, GBP, CAD, AUD, etc. — most currencies
- **3 minor units**: BHD (Bahraini Dinar), KWD (Kuwaiti Dinar),
  OMR (Omani Rial) — rare

**Example**: $12.34 USD = 1234 cents (minor units = 2)
**Example**: ¥1234 JPY = 1234 yen (minor units = 0)

### Catalog Entries

Minimum 20 currencies:
- USD (US Dollar, 2)
- EUR (Euro, 2)
- GBP (British Pound, 2)
- JPY (Japanese Yen, 0)
- CAD (Canadian Dollar, 2)
- AUD (Australian Dollar, 2)
- CHF (Swiss Franc, 2)
- CNY (Chinese Yuan, 2)
- SEK (Swedish Krona, 2)
- NZD (New Zealand Dollar, 2)
- MXN (Mexican Peso, 2)
- SGD (Singapore Dollar, 2)
- HKD (Hong Kong Dollar, 2)
- NOK (Norwegian Krone, 2)
- KRW (South Korean Won, 0)
- INR (Indian Rupee, 2)
- BRL (Brazilian Real, 2)
- ZAR (South African Rand, 2)
- DKK (Danish Krone, 2)
- PLN (Polish Złoty, 2)

Extensible: developers can add more by appending to the array.

## Testing Strategy

All tests are JS-pure (Jest + React Native Testing Library). The
native module is mocked at the import boundary via
`requireOptionalNativeModule` (same pattern as 050-storekit).

### Mocking Pattern

```ts
// In useTapToPay.ts (hook)
let mockBridge: TapToPayBridge | null = null;

export function __setTapToPayBridgeForTests(bridge: TapToPayBridge | null) {
  mockBridge = bridge;
}

function getBridge(): TapToPayBridge {
  if (mockBridge) return mockBridge;
  // ... requireOptionalNativeModule logic
}
```

Tests inject a controlled mock via `__setTapToPayBridgeForTests`,
allowing state transitions to be verified without touching native
code.

## Device Requirements

### Supported iPhones
- iPhone XS or later (A12 Bionic chip or newer)
- NFC hardware required
- iOS 16.0+

### Unsupported
- iPhone X and earlier (no compatible NFC)
- iPad (no Tap to Pay support)
- Android, Web (not applicable)

The module gates the feature behind:
- Platform check (iOS only)
- Version check (iOS 16.0+)
- Capability check (`PaymentCardReaderSession.isSupported`)
- Entitlement check (inferred from bridge behavior)

## Apple Documentation References

### Official Docs
- **ProximityReader Framework**:
  https://developer.apple.com/documentation/proximityreader
- **PaymentCardReaderSession**:
  https://developer.apple.com/documentation/proximityreader/paymentcardreadersession
- **Tap to Pay on iPhone Program**:
  https://register.apple.com/tap-to-pay-on-iphone
- **WWDC 2022 Session (Tap to Pay overview)**:
  https://developer.apple.com/videos/play/wwdc2022/10041/

### Entitlement Docs
- **Requesting Restricted Entitlements**:
  https://developer.apple.com/documentation/bundleresources/entitlements/requesting-entitlements
- **Proximity Reader Entitlement**:
  https://developer.apple.com/documentation/bundleresources/entitlements/com_apple_developer_proximity-reader_payment_acceptance

### PSP Integration Guides
- **Stripe Terminal — Tap to Pay**:
  https://stripe.com/docs/terminal/payments/setup-reader/tap-to-pay-ios
- **Adyen — Tap to Pay**:
  https://docs.adyen.com/point-of-sale/ipp/tap-to-pay-ios/
- **Square — Tap to Pay**:
  https://developer.squareup.com/docs/terminal-api/tap-to-pay

## Implementation Notes

### Swift Bridge (Educational Scaffold)

The Swift bridge demonstrates API usage but is NOT compiled in this
PR. Actual compilation requires:
1. Entitlement granted by Apple
2. PSP SDK integration
3. Code signing with proper provisioning profile

The bridge serves as:
- API reference for developers
- Template for real integration
- Documentation of call patterns

### JS Bridge Contract

The JS bridge provides a typed interface that wraps the native
module. Key design decisions:
- Use `requireOptionalNativeModule` (returns null if missing)
- Throw `TapToPayNotSupported` when platform/module unavailable
- Web stub rejects all operations
- Mock boundary (`__setTapToPayBridgeForTests`) for unit tests

### State Management

The `useTapToPay` hook encapsulates:
- Capability detection (call `isSupported` on mount)
- Discovery state machine (idle → discovering → ready → error)
- Payment flow (loading state, result/error handling)
- Entitlement inference (if `acceptPayment` throws `.notEntitled`,
  mark `entitled: false`)

### Component Responsibilities

1. **EntitlementBanner**: Status display + link to Apple program
2. **CapabilityCard**: Device/iOS/entitlement checks (pills)
3. **DiscoverButton**: Trigger discovery, show state (idle/discovering/ready/error)
4. **PaymentComposer**: Amount input (cents), currency picker, line items list
5. **AcceptPaymentButton**: Trigger payment, show loading state
6. **ResultCard**: Display last result (success/declined/error)
7. **SetupNotes**: Checklist of integration steps
8. **IOSOnlyBanner**: Platform gate for Android/Web

Each component is presentational; state lives in `useTapToPay` hook.

## Edge Cases and Error Handling

### Entitlement Missing
- `acceptPayment` throws `.notEntitled`
- EntitlementBanner shows "missing" status
- ResultCard shows error

### Device Unsupported
- `isSupported()` returns false
- CapabilityCard shows ✗ pill
- AcceptPaymentButton disabled

### iOS Version Too Old
- Client-side check: `Platform.Version < 16` (iOS < 16.0)
- CapabilityCard shows ✗ pill
- Module content hidden or grayed out

### User Cancels Tap
- `acceptPayment` throws `.userCancelled`
- ResultCard shows "User cancelled" message
- State resets to idle

### Card Declined
- `acceptPayment` returns `{ outcome: 'declined', declinedReason: ... }`
- ResultCard shows declined reason

### Network/Reader Error
- `acceptPayment` throws error
- ResultCard shows error message
- State resets to error

### Amount Validation
- PaymentComposer validates `amount > 0` before enabling AcceptPaymentButton
- Line items validate `label.length > 0` and `amount >= 0`

## Test Coverage Targets

- **Bridge tests**: Contract verification, web stub rejects
- **Hook tests**: State transitions (8+ states), error handling
- **Component tests**: Render, callbacks, props (8 components × 2+ assertions)
- **Screen tests**: Composition, iOS-only gate
- **Plugin tests**: Idempotency, coexistence
- **Manifest tests**: Registry entry, count

**Expected**: ~30 tests, ~80 assertions

## Summary

Tap to Pay on iPhone is a powerful iOS 16+ feature that transforms
iPhones into contactless payment terminals. This module provides an
educational scaffold that:
- Demonstrates the ProximityReader API surface
- Guides developers through the entitlement and PSP integration
  requirements
- Provides a testable, type-safe JS bridge
- Offers a currency catalog and payment composer UI

The Swift bridge is doc-only (not compiled) because the entitlement
is Apple-restricted. Developers who enroll in the program can use
this module as a starting point for real integration with a PSP SDK.
