# Feature Specification: Apple Pay (PassKit Payment) Module

**Feature Branch**: `049-apple-pay`
**Feature Number**: 049
**Created**: 2026-05-13
**Status**: Approved (autonomous, no clarifications)
**Parent Branch**: `048-lidar-roomplan`

## Summary

iOS 8+ educational module that demonstrates Apple Pay via
`PKPaymentAuthorizationViewController`. The module is a
**scaffold for learning the API surface** — it never actually
charges a card. Real charges require a live Merchant ID and a
payment processor (Stripe, Square, Adyen, …).

The showcase covers payment-request composition, summary items,
shipping methods, contact-field requirements, and the sandbox
authorization flow that returns an opaque payment token.

Adds an "Apple Pay" card to the 006 iOS Showcase registry
(`id: 'apple-pay-lab'`,
`platforms: ['ios','android','web']`,
`minIOS: '8.0'`).

The module ships a thin Swift bridge
(`native/ios/applepay/ApplePayBridge.swift`) wrapping
`PKPaymentAuthorizationController`. The bridge is mocked at the
import boundary in unit tests
(`__setApplePayBridgeForTests`).

## Sections / UX

1. **Capability card** — `PKPaymentAuthorizationController.canMakePayments(usingNetworks:)`
   plus the catalog of supported networks (Visa, Mastercard,
   Amex, Discover, ChinaUnionPay).
2. **Payment composer** — controlled form: merchant id
   (placeholder), country code, currency code, summary items
   (label + amount), required billing / shipping contact-field
   toggles.
3. **Pay with Apple Pay button** — uses `PKPaymentButton`
   styling on iOS; a regular `Pressable` on Android / Web.
4. **Result card** — payment authorization status + a mock
   payment token (educational; the real token is opaque and
   processor-specific).
5. **Setup notes** — Merchant ID configuration, processor
   integration, sandbox testing pointers.
6. **IOSOnlyBanner** — Android / Web only. Apple Pay is iOS-only.

## Decisions

- **Plugin: `plugins/with-apple-pay/`** — adds the
  `com.apple.developer.in-app-payments` entitlement with a
  single placeholder merchant id
  (`merchant.com.izkizk8.spot`). Operator must replace before
  shipping. Idempotent (running twice produces a deep-equal
  config). Preserves any operator-supplied merchant id list.
- **`app.json` plugins array** is bumped from 38 → 39 (insert
  `./plugins/with-apple-pay` after `./plugins/with-roomplan`).
  The `with-mapkit`, `with-weatherkit`, and `with-roomplan`
  count assertions are bumped from 38 → 39.
- **Tests** are JS-pure; the native bridge is mocked at the
  import boundary via `__setApplePayBridgeForTests`.
- **Frozen network catalog** lives in `supported-networks.ts`
  (Visa, Mastercard, Amex, Discover, ChinaUnionPay).
- **Pure helpers** live in `supported-networks.ts` so the JS
  surface is testable without ever touching native code.
- **No real charges.** The bridge returns a mock token shape
  for educational purposes; replacing it with a real
  processor integration is documented in the SetupNotes
  card.

## Acceptance criteria

- The module appears as the 44th entry in the registry, after
  `lidar-roomplan-lab`.
- `pnpm check` is green.
- All new tests pass (JS-pure; no native module is ever loaded).
- The plugin coexists with the rest of the chain without
  throwing and is byte-stable when re-run.
