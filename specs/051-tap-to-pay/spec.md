# Feature Specification: Tap to Pay on iPhone Lab Module

**Feature Branch**: `051-tap-to-pay`
**Feature Number**: 051
**Created**: 2026-05-15
**Status**: Approved (autonomous)
**Parent Branch**: `050-storekit-2`

## Summary

iOS 16+ educational module demonstrating the **Tap to Pay on iPhone** API
(ProximityReader framework / `PaymentCardReaderSession`). This is a
**scaffold for learning the API surface** — not a production payment
integration. Actual payment acceptance requires (a) Apple Tap to Pay program
enrollment, (b) PSP SDK integration (Stripe Terminal / Adyen / Square), and
(c) the restricted `com.apple.developer.proximity-reader.payment.acceptance`
entitlement.

The module showcases:
- Capability detection (`PaymentCardReaderSession.isSupported`, entitlement
  status, iOS version check)
- Reader discovery flow (session instantiation)
- Payment composer UI (amount in cents, currency picker, optional line items)
- Accept payment flow (`readPaymentCard` call)
- Result handling (success / declined / error states)
- Setup notes (Apple program enrollment, PSP integration, entitlement workflow)

Adds a "Tap to Pay" card to the iOS Showcase registry
(`id: 'tap-to-pay-lab'`, `platforms: ['ios','android','web']`,
`minIOS: '16.0'`).

The module ships a thin Swift bridge
(`native/ios/taptopay/TapToPayBridge.swift`) wrapping ProximityReader's
`PaymentCardReaderSession` async/await API. The bridge is mocked at the
import boundary in unit tests (`requireOptionalNativeModule` pattern).

## User Scenarios

### US-1: Developer checks capability
As a developer, I open the Tap to Pay Lab module and see a **Capability Card**
showing:
- Whether `PaymentCardReaderSession.isSupported` returns true
- iOS version (≥16.0 required)
- Entitlement status (granted / missing / unknown)
- Clear visual pills (✓ green / ✗ red)

### US-2: Developer reads entitlement requirements
The module displays an **Entitlement Banner** explaining:
- The `com.apple.developer.proximity-reader.payment.acceptance` entitlement is
  Apple-restricted and requires program enrollment
- A link button to Apple's Tap to Pay program request page
  (`https://register.apple.com/tap-to-pay-on-iphone`)
- Current status (granted / missing / unknown)

### US-3: Developer initiates reader discovery
I tap a **Discover Button**, which calls `bridge.discover()`. The button
shows status:
- idle → discovering → ready
- Or: discovering → error (with error message)

### US-4: Developer composes a payment request
In the **Payment Composer** section, I:
- Enter an amount (numeric input, stored as cents/minor units integer)
- Select a currency from a picker (USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY,
  SEK, NZD, MXN, SGD, HKD, NOK, KRW, INR, BRL, ZAR, DKK, PLN — 20+ entries)
- Optionally add line items (label + amount rows, add/remove buttons)

### US-5: Developer accepts a payment
I tap **Accept Payment**, which calls
`bridge.acceptPayment({amount, currency, lineItems})`. The module surfaces:
- Success → transaction ID, amount, currency displayed in **Result Card**
- Declined → reason displayed
- Error → error message displayed (not-entitled, session-failed, etc.)

### US-6: Developer reviews setup instructions
The **Setup Notes** section provides a checklist:
- Enroll in Apple Tap to Pay program
- Integrate a PSP SDK (Stripe Terminal / Adyen / Square)
- Add entitlement via the `with-tap-to-pay` plugin
- Test on a supported iPhone model (iPhone XS or later with iOS 16+)

### US-7: Non-iOS user sees gate banner
On Android or Web, the module displays an **IOSOnlyBanner** explaining
Tap to Pay is iOS-only and showing which platforms are unsupported.

## Functional Requirements

### FR-1: Module Registration
- Module id: `tap-to-pay-lab`
- Title: "Tap to Pay"
- Description: ~150 chars explaining the educational scaffold
- Icon: iOS `creditcard.fill`, fallback 💳
- Platforms: `['ios', 'android', 'web']`
- minIOS: `'16.0'`
- Registry entry at next available slot (likely position 48, after `storekit-lab`)

### FR-2: Capability Detection
The module MUST check and display:
- `PaymentCardReaderSession.isSupported` (via bridge.isSupported())
- iOS version ≥16.0 (client-side check using Platform.Version or Constants.platform.ios.systemVersion)
- Entitlement status (granted / missing / unknown — inferred from bridge behavior or explicit check if bridge provides it)

### FR-3: Entitlement Banner
The EntitlementBanner component MUST:
- Display current entitlement status (granted / missing / unknown)
- Explain the restricted entitlement requirement
- Provide a link button to Apple's Tap to Pay program
  (`https://register.apple.com/tap-to-pay-on-iphone`)
- Use visual status indicators (pills or badges)

### FR-4: Reader Discovery
The DiscoverButton component MUST:
- Call `bridge.discover()` on press
- Show status: idle | discovering | ready | error
- Display error message if discovery fails
- Be disabled during discovery

### FR-5: Payment Composer
The PaymentComposer component MUST:
- Accept numeric amount input (stored as integer cents/minor units)
- Provide a currency picker (ISO 4217 codes from catalog)
- Support optional line items list (add/remove rows)
- Validate amount > 0 before allowing payment
- Each line item has: label (string), amount (integer cents)

### FR-6: Currency Catalog
The `currency-codes.ts` module MUST export:
- Array of currency objects: `{ code, name, minorUnits }`
- Minimum 20 entries: USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, SEK, NZD, MXN, SGD, HKD, NOK, KRW, INR, BRL, ZAR, DKK, PLN
- minorUnits: 0 (JPY, KRW), 2 (USD, EUR, most), or 3 (rare)

### FR-7: Accept Payment Flow
The AcceptPaymentButton component MUST:
- Call `bridge.acceptPayment({amount, currency, lineItems})`
- Handle three outcomes:
  - **Success**: transaction ID, amount, currency returned
  - **Declined**: reason code / message returned
  - **Error**: error thrown (not-entitled, session-not-ready, network-error, etc.)
- Disable button during payment processing
- Surface result in ResultCard

### FR-8: Result Display
The ResultCard component MUST display:
- Last result state: success | declined | error | none
- Success: transaction ID, amount, currency, timestamp
- Declined: reason message
- Error: error type and message

### FR-9: Setup Instructions
The SetupNotes component MUST provide:
- Bullet list of setup steps (Apple program enrollment, PSP integration, entitlement plugin, test device requirements)
- Links to external resources (Apple docs, PSP docs)

### FR-10: iOS-Only Gate
- On Android/Web or iOS < 16.0, display IOSOnlyBanner
- Banner explains platform/version restriction
- Module content hidden or grayed out

### FR-11: Swift Bridge (Educational Scaffold)
`native/ios/taptopay/TapToPayBridge.swift` MUST provide:
- `isSupported() -> Bool` — uses `PaymentCardReaderSession.isSupported` if available
- `discover() async throws` — instantiates session, returns reader info
- `acceptPayment(opts) async throws` — builds `PaymentCardTransactionRequest`, calls `session.readPaymentCard(request)`, returns mapped result
- Annotated with `@available(iOS 16.4, *)` where appropriate
- `// MARK:` sections for organization
- Doc comments explaining educational nature

**NOTE**: This Swift code is a **reference implementation** and NOT compiled
in this PR. It demonstrates the API surface. Actual compilation requires
entitlement provisioning beyond scope.

### FR-12: JS Bridge Contract
`src/native/taptopay.ts` MUST:
- Define TypeScript types: `TapToPayBridge`, `AcceptPaymentOptions`, `PaymentResult`, `DiscoveryStatus`
- Export functions: `isSupported()`, `discover()`, `acceptPayment(opts)`
- Use `requireOptionalNativeModule('TapToPay')` pattern (from 050)
- Provide safe fallback that throws `not-supported` when module missing or platform unsupported
- Companion web stub `taptopay.web.ts` rejects all operations

### FR-13: Config Plugin
`plugins/with-tap-to-pay/` MUST:
- Add `com.apple.developer.proximity-reader.payment.acceptance` to iOS entitlements (boolean true)
- Be idempotent (don't double-add)
- No-op on Android
- Mirror structure of `plugins/with-storekit/`
- Export typed ConfigPlugin

### FR-14: app.json Plugin Registration
- Add `./plugins/with-tap-to-pay` to plugins array (after `./plugins/with-storekit`)
- Bump plugin chain counts in tests (`with-mapkit` test count 40 → 41)

### FR-15: State Management Hook
`hooks/useTapToPay.ts` MUST provide:
- State: `{ supported, entitled, discovery: 'idle'|'discovering'|'ready'|'error', lastResult, lastError }`
- Actions: `checkSupport()`, `discover()`, `acceptPayment(opts)`
- Uses bridge, handles errors, updates state atomically

### FR-16: Test Coverage (JS-Pure, Jest + RNTL)
Required test files:
1. `test/unit/modules/tap-to-pay-lab/currency-codes.test.ts` — catalog validation
2. `test/unit/modules/tap-to-pay-lab/useTapToPay.test.tsx` — hook state machine
3. `test/unit/modules/tap-to-pay-lab/components/EntitlementBanner.test.tsx`
4. `test/unit/modules/tap-to-pay-lab/components/CapabilityCard.test.tsx`
5. `test/unit/modules/tap-to-pay-lab/components/DiscoverButton.test.tsx`
6. `test/unit/modules/tap-to-pay-lab/components/PaymentComposer.test.tsx`
7. `test/unit/modules/tap-to-pay-lab/components/AcceptPaymentButton.test.tsx`
8. `test/unit/modules/tap-to-pay-lab/components/ResultCard.test.tsx`
9. `test/unit/modules/tap-to-pay-lab/components/SetupNotes.test.tsx`
10. `test/unit/modules/tap-to-pay-lab/components/IOSOnlyBanner.test.tsx`
11. `test/unit/modules/tap-to-pay-lab/screens/` — 3 screen tests (or sectioned screen tests matching 050 pattern)
12. `test/unit/native/taptopay-bridge.test.ts` — contract tests
13. `test/unit/plugins/with-tap-to-pay.test.ts` — plugin idempotency and coexistence
14. `test/unit/manifest.test.ts` — update module count

Each component test ≥2 assertions. Mock bridge and `useTapToPay` where needed.

### FR-17: Code Conventions
- Use `ThemedText` and `ThemedView` (never raw `Text`/`View`)
- Use `Spacing` scale from `src/constants/theme.ts` (no magic numbers)
- Styles via `StyleSheet.create()` only
- Single quotes everywhere in JS/TS/TSX (including JSX attributes)
- No `eslint-disable` comments
- All files formatted with `pnpm format` before commit

## Non-Goals

### NG-1: Real PSP Integration
This module does NOT integrate a real PSP (Stripe Terminal SDK, Adyen SDK, Square SDK).
The Swift bridge demonstrates the ProximityReader API surface but stops short of
actual payment processing. Setup instructions link to PSP documentation.

### NG-2: Entitlement Provisioning
The `with-tap-to-pay` plugin adds the entitlement key to the Xcode project,
but obtaining Apple approval for the entitlement is out of scope. The module
educates about the approval process but does not automate it.

### NG-3: Production Payment Handling
No PCI compliance, no webhook handling, no backend integration. This is an
educational scaffold. The result card displays mock/test transaction data only.

### NG-4: Android/Web Implementation
Tap to Pay on iPhone is iOS-only. Android/Web show a gate banner.
No cross-platform payment API is provided.

### NG-5: Swift Bridge Compilation in this PR
The Swift bridge (`TapToPayBridge.swift`) is a **reference implementation**
demonstrating API usage. It is NOT compiled or linked in this PR because the
entitlement is restricted and requires Apple approval. The file serves as
documentation and a template for developers who obtain the entitlement.

## Dependencies

- Expo SDK 55 (already present)
- React Native Reanimated (already present)
- React Native Gesture Handler (already present)
- `@expo/config-plugins` (already present)
- `requireOptionalNativeModule` from `expo-modules-core` (already present)

**No new external dependencies required.**

## Acceptance Criteria

1. Module appears in registry after `storekit-lab`
2. All 16 test files exist and pass
3. `pnpm check` (typecheck + lint + format + test) is green
4. `with-tap-to-pay` plugin coexists with rest of plugin chain
5. `with-mapkit` test count updated 40 → 41
6. Swift bridge file exists with complete API surface (doc-only, not compiled)
7. Currency catalog has ≥20 entries with correct minorUnits
8. IOSOnlyBanner gates module on Android/Web
9. All code follows conventions (ThemedText/View, Spacing scale, single quotes, no eslint-disable)
10. Single feat commit with Co-authored-by trailer
11. Test delta: baseline (669 tests / 4578 assertions) + new tests (≥30 new tests, ≥80 new assertions)

## Risks and Mitigations

**Risk**: Developer confusion about entitlement restriction
**Mitigation**: EntitlementBanner prominently explains restriction and links to Apple program

**Risk**: Currency catalog incompleteness
**Mitigation**: Include 20+ most common currencies; extendable catalog pattern

**Risk**: Swift bridge code drift from actual API
**Mitigation**: Cite Apple docs in comments; mark as educational scaffold

**Risk**: Plugin chain conflicts
**Mitigation**: Test coexistence with existing plugins (`with-storekit`, `with-mapkit`, etc.)

**Risk**: Test flakiness with mocked bridge
**Mitigation**: Use `requireOptionalNativeModule` pattern proven in 050; mock at import boundary
