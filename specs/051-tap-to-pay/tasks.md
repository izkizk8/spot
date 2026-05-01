# Tasks — 051-tap-to-pay

## T001: Create native bridge types
**Status**: pending
**Dependencies**: none
**Estimate**: 10 min

Create `src/native/taptopay.types.ts` with:
- `TapToPayBridge` interface (isSupported, discover, acceptPayment methods)
- `AcceptPaymentOptions` type (amount, currency, lineItems)
- `LineItem` type (label, amount)
- `PaymentOutcome` type ('success' | 'declined' | 'error')
- `PaymentResult` type (outcome, transactionId, amount, currency, errorMessage, declinedReason)
- `DiscoveryStatus` type ('idle' | 'discovering' | 'ready' | 'error')
- `TapToPayNotSupported` error class
- `NATIVE_MODULE_NAME` constant ('TapToPay')

All types exported. Follow 050-storekit pattern for type organization.

---

## T002: Create currency catalog + test
**Status**: pending
**Dependencies**: none
**Estimate**: 15 min

Create `src/modules/tap-to-pay-lab/currency-codes.ts`:
- Export `CurrencyEntry` interface: `{ code, name, minorUnits }`
- Export `CURRENCIES` array (20+ entries: USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, SEK, NZD, MXN, SGD, HKD, NOK, KRW, INR, BRL, ZAR, DKK, PLN)
- Each entry has correct minorUnits (0 for JPY/KRW, 2 for most, 3 for rare)

Create `test/unit/modules/tap-to-pay-lab/currency-codes.test.ts`:
- Assert count ≥20
- Assert codes are unique
- Assert minorUnits are 0, 2, or 3
- Assert key codes present (USD, EUR, GBP, JPY)

---

## T003: Create iOS JS bridge
**Status**: pending
**Dependencies**: T001
**Estimate**: 15 min

Create `src/native/taptopay.ts`:
- Import types from `taptopay.types.ts`
- Define `NativeTapToPay` interface (matches bridge contract)
- Implement `getNative()` using `requireOptionalNativeModule<NativeTapToPay>(NATIVE_MODULE_NAME)`
- Implement `ensureNative()` that throws `TapToPayNotSupported` on non-iOS or missing module
- Export `isSupported()`, `discover()`, `acceptPayment(opts)` functions that call ensureNative()
- Export default object `{ isSupported, discover, acceptPayment }`

Pattern: mirror `src/native/storekit.ts`.

---

## T004: Create web JS bridge stub
**Status**: pending
**Dependencies**: T001
**Estimate**: 5 min

Create `src/native/taptopay.web.ts`:
- Import `TapToPayNotSupported` from `taptopay.types.ts`
- Export `isSupported()` that returns `Promise.resolve(false)`
- Export `discover()` that rejects with `TapToPayNotSupported('not supported on web')`
- Export `acceptPayment(opts)` that rejects with `TapToPayNotSupported('not supported on web')`
- Export default object `{ isSupported, discover, acceptPayment }`

---

## T005: Create bridge contract test
**Status**: pending
**Dependencies**: T003, T004
**Estimate**: 10 min

Create `test/unit/native/taptopay-bridge.test.ts`:
- Test: web stub `isSupported` returns false
- Test: web stub `discover` rejects with TapToPayNotSupported
- Test: web stub `acceptPayment` rejects with TapToPayNotSupported
- Test: iOS bridge with mocked native module dispatches correctly
- Test: iOS bridge without native module throws TapToPayNotSupported
- Mock `requireOptionalNativeModule` via jest.mock

Use `@jest/globals` for imports. Follow 050 pattern.

---

## T006: Create useTapToPay hook + mock boundary
**Status**: pending
**Dependencies**: T003
**Estimate**: 20 min

Create `src/modules/tap-to-pay-lab/hooks/useTapToPay.ts`:
- State: `{ supported, entitled, discovery, lastResult, lastError }`
- Actions: `checkSupport()`, `discover()`, `acceptPayment(opts)`
- Export `useTapToPay()` hook
- Export `__setTapToPayBridgeForTests(bridge)` for test mocking
- Use `useState`, `useCallback` for state management
- Call bridge methods, update state on success/error
- Infer entitlement from bridge behavior (if acceptPayment throws not-entitled, set entitled: false)

Pattern: mirror `src/modules/storekit-lab/hooks/useStoreKit.ts`.

---

## T007: Create useTapToPay test
**Status**: pending
**Dependencies**: T006
**Estimate**: 15 min

Create `test/unit/modules/tap-to-pay-lab/useTapToPay.test.tsx`:
- Test: initial state (supported: null, entitled: null, discovery: 'idle', lastResult: null, lastError: null)
- Test: checkSupport() updates supported to true/false
- Test: discover() success → discovery: 'ready'
- Test: discover() error → discovery: 'error', lastError set
- Test: acceptPayment() success → lastResult set
- Test: acceptPayment() declined → lastResult set with declined outcome
- Test: acceptPayment() error → lastError set
- Test: acceptPayment() not-entitled → entitled: false

Use `@testing-library/react-hooks` or `renderHook` from RNTL. Mock bridge via `__setTapToPayBridgeForTests`.

---

## T008: Create EntitlementBanner component + test
**Status**: pending
**Dependencies**: none
**Estimate**: 15 min

Create `src/modules/tap-to-pay-lab/components/EntitlementBanner.tsx`:
- Props: `status: 'granted' | 'missing' | 'unknown'`, `style?`
- Display status pill (✓ green / ✗ red / ? gray)
- Explain entitlement restriction (text)
- Link button to `https://register.apple.com/tap-to-pay-on-iphone`
- Use `ThemedText`, `ThemedView`, `Spacing` scale
- Single quotes

Create `test/unit/modules/tap-to-pay-lab/components/EntitlementBanner.test.tsx`:
- Test: renders status pill for 'granted'
- Test: renders status pill for 'missing'
- Test: renders link button
- ≥2 assertions

---

## T009: Create CapabilityCard component + test
**Status**: pending
**Dependencies**: none
**Estimate**: 15 min

Create `src/modules/tap-to-pay-lab/components/CapabilityCard.tsx`:
- Props: `supported: boolean`, `iosVersionOk: boolean`, `entitled: boolean | null`, `style?`
- Display three rows with pills:
  - "Device Supported" → ✓/✗ based on `supported`
  - "iOS 16.0+" → ✓/✗ based on `iosVersionOk`
  - "Entitlement Granted" → ✓/✗/? based on `entitled`
- Use `ThemedText`, `ThemedView`, `Spacing` scale
- Single quotes

Create `test/unit/modules/tap-to-pay-lab/components/CapabilityCard.test.tsx`:
- Test: renders supported pills correctly
- Test: renders unsupported pills correctly
- ≥2 assertions

---

## T010: Create DiscoverButton component + test
**Status**: pending
**Dependencies**: none
**Estimate**: 15 min

Create `src/modules/tap-to-pay-lab/components/DiscoverButton.tsx`:
- Props: `status: DiscoveryStatus`, `onPress: () => void`, `style?`
- Button label: "Discover Reader" or status text
- Disabled during 'discovering'
- Show status pill (idle/discovering/ready/error)
- Use `ThemedText`, `ThemedView`, `Spacing` scale
- Single quotes

Create `test/unit/modules/tap-to-pay-lab/components/DiscoverButton.test.tsx`:
- Test: renders button with correct label
- Test: disabled during discovering
- Test: calls onPress when pressed
- ≥2 assertions

---

## T011: Create PaymentComposer component + test
**Status**: pending
**Dependencies**: T002
**Estimate**: 20 min

Create `src/modules/tap-to-pay-lab/components/PaymentComposer.tsx`:
- Props: `onPaymentReady: (opts: AcceptPaymentOptions) => void`, `style?`
- Amount input (TextInput, numeric, stores as cents integer)
- Currency picker (dropdown/select, uses `CURRENCIES` from currency-codes.ts)
- Line items list (add/remove rows, each row has label + amount)
- Validate amount > 0 before calling onPaymentReady
- Use `ThemedText`, `ThemedView`, `Spacing` scale, single quotes

Create `test/unit/modules/tap-to-pay-lab/components/PaymentComposer.test.tsx`:
- Test: renders amount input
- Test: renders currency picker
- Test: validates amount > 0
- Test: calls onPaymentReady with correct opts
- ≥2 assertions

---

## T012: Create AcceptPaymentButton component + test
**Status**: pending
**Dependencies**: none
**Estimate**: 10 min

Create `src/modules/tap-to-pay-lab/components/AcceptPaymentButton.tsx`:
- Props: `onPress: () => void`, `loading: boolean`, `disabled: boolean`, `style?`
- Button label: "Accept Payment" or "Processing..." when loading
- Disabled when loading or disabled prop
- Use `ThemedText`, `ThemedView`, `Spacing` scale, single quotes

Create `test/unit/modules/tap-to-pay-lab/components/AcceptPaymentButton.test.tsx`:
- Test: renders button
- Test: disabled when loading
- Test: calls onPress when pressed
- ≥2 assertions

---

## T013: Create ResultCard component + test
**Status**: pending
**Dependencies**: T001
**Estimate**: 15 min

Create `src/modules/tap-to-pay-lab/components/ResultCard.tsx`:
- Props: `result: PaymentResult | null`, `style?`
- Display last result state:
  - None: "No payment attempts yet"
  - Success: transactionId, amount, currency, timestamp
  - Declined: declinedReason
  - Error: errorMessage
- Use `ThemedText`, `ThemedView`, `Spacing` scale, single quotes

Create `test/unit/modules/tap-to-pay-lab/components/ResultCard.test.tsx`:
- Test: renders "no attempts" when result is null
- Test: renders success details
- Test: renders declined reason
- Test: renders error message
- ≥2 assertions

---

## T014: Create SetupNotes component + test
**Status**: pending
**Dependencies**: none
**Estimate**: 10 min

Create `src/modules/tap-to-pay-lab/components/SetupNotes.tsx`:
- Props: `style?`
- Bullet list:
  1. Enroll in Apple Tap to Pay program (link)
  2. Integrate a PSP SDK (Stripe Terminal, Adyen, Square)
  3. Add entitlement via with-tap-to-pay plugin
  4. Test on supported iPhone (XS or later, iOS 16+)
- Use `ThemedText`, `ThemedView`, `Spacing` scale, single quotes

Create `test/unit/modules/tap-to-pay-lab/components/SetupNotes.test.tsx`:
- Test: renders bullet list
- Test: includes link to Apple program
- ≥2 assertions

---

## T015: Create IOSOnlyBanner component + test
**Status**: pending
**Dependencies**: none
**Estimate**: 10 min

Create `src/modules/tap-to-pay-lab/components/IOSOnlyBanner.tsx`:
- Props: `style?`
- Display message: "Tap to Pay on iPhone is iOS-only. This feature is not available on [current platform]."
- Use `ThemedText`, `ThemedView`, `Spacing` scale, single quotes
- Can copy/adapt from 050 IOSOnlyBanner if exists

Create `test/unit/modules/tap-to-pay-lab/components/IOSOnlyBanner.test.tsx`:
- Test: renders banner
- Test: includes platform name
- ≥2 assertions

---

## T016: Create iOS screen
**Status**: pending
**Dependencies**: T006, T008, T009, T010, T011, T012, T013, T014
**Estimate**: 20 min

Create `src/modules/tap-to-pay-lab/screen.tsx`:
- Import and compose: EntitlementBanner, CapabilityCard, DiscoverButton, PaymentComposer, AcceptPaymentButton, ResultCard, SetupNotes
- Use `useTapToPay()` hook
- Call `checkSupport()` on mount
- Wire up button callbacks
- ScrollView layout with Spacing scale
- Use `ThemedText`, `ThemedView`, single quotes

Pattern: mirror `src/modules/storekit-lab/screen.tsx`.

---

## T017: Create Android screen
**Status**: pending
**Dependencies**: T015
**Estimate**: 5 min

Create `src/modules/tap-to-pay-lab/screen.android.tsx`:
- Render `IOSOnlyBanner` only
- Use `ThemedView`, single quotes

---

## T018: Create web screen
**Status**: pending
**Dependencies**: T015
**Estimate**: 5 min

Create `src/modules/tap-to-pay-lab/screen.web.tsx`:
- Render `IOSOnlyBanner` only
- Use `ThemedView`, single quotes

---

## T019: Create iOS screen test
**Status**: pending
**Dependencies**: T016
**Estimate**: 10 min

Create `test/unit/modules/tap-to-pay-lab/screen.test.tsx`:
- Mock `useTapToPay` hook
- Test: renders all sections (EntitlementBanner, CapabilityCard, DiscoverButton, PaymentComposer, AcceptPaymentButton, ResultCard, SetupNotes)
- Test: calls checkSupport on mount
- ≥2 assertions

---

## T020: Create Android screen test
**Status**: pending
**Dependencies**: T017
**Estimate**: 5 min

Create `test/unit/modules/tap-to-pay-lab/screen.android.test.tsx`:
- Test: renders IOSOnlyBanner
- Test: no interactive sections present
- ≥2 assertions

---

## T021: Create web screen test
**Status**: pending
**Dependencies**: T018
**Estimate**: 5 min

Create `test/unit/modules/tap-to-pay-lab/screen.web.test.tsx`:
- Test: renders IOSOnlyBanner
- Test: no interactive sections present
- ≥2 assertions

---

## T022: Create module manifest
**Status**: pending
**Dependencies**: T016, T017, T018
**Estimate**: 5 min

Create `src/modules/tap-to-pay-lab/index.tsx`:
- Export default `ModuleManifest` object:
  - id: 'tap-to-pay-lab'
  - title: 'Tap to Pay'
  - description: ~150 chars (educational scaffold for ProximityReader API)
  - icon: iOS 'creditcard.fill', fallback 💳
  - platforms: ['ios', 'android', 'web']
  - minIOS: '16.0'
  - render: lazy import of screen

Pattern: mirror `src/modules/storekit-lab/index.tsx`.

---

## T023: Create plugin index + package.json
**Status**: pending
**Dependencies**: none
**Estimate**: 15 min

Create `plugins/with-tap-to-pay/index.ts`:
- Import `ConfigPlugin`, `withEntitlementsPlist` from `@expo/config-plugins`
- Define `ENTITLEMENT_KEY = 'com.apple.developer.proximity-reader.payment.acceptance'`
- Implement `applyTapToPayEntitlements(plist)` pure function:
  - If key exists, preserve value (idempotent)
  - Else, add key with value `true`
- Export `withTapToPay: ConfigPlugin` using `withEntitlementsPlist` mod
- Export as default

Create `plugins/with-tap-to-pay/package.json`:
- name: '@spot/with-tap-to-pay'
- version: '1.0.0'
- main: 'index.ts'
- No dependencies

Pattern: mirror `plugins/with-storekit/`.

---

## T024: Create plugin test
**Status**: pending
**Dependencies**: T023
**Estimate**: 15 min

Create `test/unit/plugins/with-tap-to-pay.test.ts`:
- Test: applyTapToPayEntitlements adds entitlement when absent
- Test: applyTapToPayEntitlements idempotent (run twice = same result)
- Test: withTapToPay plugin coexists with with-storekit and with-mapkit
- Test: entitlements plist has both storekit and taptopay entitlements after applying both plugins
- ≥4 assertions

---

## T025: Update registry
**Status**: pending
**Dependencies**: T022
**Estimate**: 5 min

Edit `src/modules/registry.ts`:
- Add import: `import tapToPayLab from './tap-to-pay-lab';`
- Append `tapToPayLab` to `MODULES` array after `storekitLab`
- No other changes

---

## T026: Update app.json plugins
**Status**: pending
**Dependencies**: T023
**Estimate**: 5 min

Edit `app.json`:
- Insert `./plugins/with-tap-to-pay` in plugins array after `./plugins/with-storekit`
- Plugins array length: 40 → 41

---

## T027: Bump with-mapkit test count
**Status**: pending
**Dependencies**: T026
**Estimate**: 5 min

Find and edit `test/unit/plugins/with-mapkit*.test.ts` (or similar test that asserts plugin chain count):
- Search for assertion like `expect(plugins.length).toBe(40)`
- Update to `expect(plugins.length).toBe(41)`
- Or find the test that counts plugin chain and update from 40 to 41

---

## T028: Update manifest test
**Status**: pending
**Dependencies**: T025
**Estimate**: 5 min

Edit `test/unit/manifest.test.ts`:
- Update expected module count (current + 1)
- Verify new module entry exists (id: 'tap-to-pay-lab')

---

## T029: Create Swift bridge (doc-only)
**Status**: pending
**Dependencies**: none
**Estimate**: 30 min

Create `native/ios/taptopay/TapToPayBridge.swift`:
- Import `ExpoModulesCore`, `ProximityReader`
- Define `TapToPayBridge: Module`
- Implement methods:
  - `isSupported() -> Bool` — uses `PaymentCardReaderSession.isSupported`
  - `discover() async throws` — instantiates session, returns mock reader info
  - `acceptPayment(opts) async throws` — builds `PaymentCardTransactionRequest`, calls `readPaymentCard`, returns mapped result
- Annotate with `@available(iOS 16.4, *)`
- Add `// MARK:` sections (Setup, Capability, Discovery, Payment)
- Add doc comments explaining educational nature
- **NOT compiled in this PR** (entitlement restricted)

---

## T030: Run typecheck
**Status**: pending
**Dependencies**: T001-T029
**Estimate**: 5 min

Run `pnpm typecheck` in worktree. Fix any type errors. Iterate until green.

---

## T031: Run lint
**Status**: pending
**Dependencies**: T030
**Estimate**: 5 min

Run `pnpm lint` in worktree. Fix any lint errors. No `eslint-disable` comments. Iterate until green.

---

## T032: Run tests
**Status**: pending
**Dependencies**: T031
**Estimate**: 10 min

Run `pnpm test` in worktree. Fix any test failures. Iterate until green.

Expected delta: baseline 4578 tests → ~4608 tests (+ ~30 tests, + ~80 assertions).

---

## T033: Run format
**Status**: pending
**Dependencies**: T032
**Estimate**: 5 min

Run `pnpm format` in worktree. Apply all formatting changes (Prettier).

---

## T034: Run full check
**Status**: pending
**Dependencies**: T033
**Estimate**: 5 min

Run `pnpm check` in worktree. Must be green (typecheck + lint + test + format).

---

## T035: Commit changes
**Status**: pending
**Dependencies**: T034
**Estimate**: 5 min

Commit with message:
```
feat(051): Tap to Pay on iPhone Lab module + with-tap-to-pay plugin + thin Swift bridge

- Add tap-to-pay-lab module (iOS 16+) with capability detection,
  reader discovery, payment composer, accept payment flow, result
  display, and setup notes
- Add with-tap-to-pay plugin (idempotent entitlement injection)
- Add native Swift bridge (educational scaffold, not compiled)
- Add currency catalog (20+ ISO 4217 codes)
- Add 30+ tests (JS-pure, Jest + RNTL)
- Update registry (append tap-to-pay-lab after storekit-lab)
- Update app.json plugins (40 → 41)
- Bump with-mapkit test count (40 → 41)

Test delta: 4578 tests → ~4608 tests

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
```

---

## Summary

- **Total tasks**: 35
- **Estimated time**: ~5 hours (autonomous mode, no blockers expected)
- **Test coverage**: 30+ tests, 80+ assertions
- **Files touched**: ~50 files (35 new, 5 existing modified)
- **Constraints**: Additive-only, no eslint-disable, single quotes, ThemedText/View, Spacing scale

## Analysis

Cross-artifact consistency:
- Spec defines functional requirements → Plan maps to files → Tasks implement each file + test
- All FR-1 to FR-17 covered by tasks T001-T029
- All acceptance criteria covered
- Constitution compliance verified (Cross-Platform Parity, Token-Based Theming, Platform File Splitting)
- No new dependencies (uses existing Expo SDK + config plugins)
- Plugin coexistence tested (T024)
- Test delta matches expectation (baseline 4578 → ~4608)

Ready for implementation.
