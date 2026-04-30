# Implementation Plan — 051-tap-to-pay

## Files

### Native (iOS) — Educational Scaffold (NOT compiled in this PR)
- `native/ios/taptopay/TapToPayBridge.swift` — Expo Module
  wrapping ProximityReader / `PaymentCardReaderSession`.
  Methods: `isSupported()`, `discover()`, `acceptPayment(opts)`.
  Annotated with `@available(iOS 16.4, *)`, `// MARK:` sections,
  and doc comments explaining educational nature.
- **NOTE**: This Swift file is a **reference implementation** demonstrating
  the API surface. It is NOT compiled or linked in this PR because the
  `com.apple.developer.proximity-reader.payment.acceptance` entitlement
  is Apple-restricted and requires program enrollment. The file serves
  as documentation.

### JS bridge
- `src/native/taptopay.types.ts` — shared types
  (`TapToPayBridge`, `AcceptPaymentOptions`, `PaymentResult`,
  `PaymentOutcome`, `DiscoveryStatus`, `TapToPayNotSupported`,
  `LineItem`).
- `src/native/taptopay.ts` — iOS variant, uses
  `requireOptionalNativeModule('TapToPay')` pattern.
- `src/native/taptopay.web.ts` — rejects with `TapToPayNotSupported`.

### Module
- `src/modules/tap-to-pay-lab/index.tsx` — manifest.
- `src/modules/tap-to-pay-lab/screen.tsx` — iOS screen (single
  sectioned screen matching 050 pattern).
- `src/modules/tap-to-pay-lab/screen.android.tsx` — IOSOnlyBanner.
- `src/modules/tap-to-pay-lab/screen.web.tsx` — IOSOnlyBanner.
- `src/modules/tap-to-pay-lab/currency-codes.ts` — ISO 4217
  catalog (20+ currencies: USD, EUR, GBP, JPY, CAD, AUD, CHF,
  CNY, SEK, NZD, MXN, SGD, HKD, NOK, KRW, INR, BRL, ZAR, DKK,
  PLN). Each entry: `{ code, name, minorUnits }`.
- `src/modules/tap-to-pay-lab/hooks/useTapToPay.ts` — state
  machine hook + `__setTapToPayBridgeForTests` mock boundary.
- `src/modules/tap-to-pay-lab/components/{EntitlementBanner,
  CapabilityCard, DiscoverButton, PaymentComposer,
  AcceptPaymentButton, ResultCard, SetupNotes,
  IOSOnlyBanner}.tsx` (×8).

### Plugin
- `plugins/with-tap-to-pay/index.ts` — adds
  `com.apple.developer.proximity-reader.payment.acceptance`
  entitlement (boolean true) to iOS entitlements. Idempotent.
  No-op on Android. Mirrors `plugins/with-storekit/` structure.
- `plugins/with-tap-to-pay/package.json`.

### Tests (JS-pure, Jest + RNTL)
- `test/unit/native/taptopay-bridge.test.ts` — bridge contract,
  web stub rejects, mocked native module dispatches correctly.
- `test/unit/modules/tap-to-pay-lab/currency-codes.test.ts` —
  catalog count, uniqueness, valid minorUnits (0/2/3), key codes
  present (USD, EUR, GBP, JPY).
- `test/unit/modules/tap-to-pay-lab/useTapToPay.test.tsx` —
  state transitions: initial, checkSupport, discover
  success/error, acceptPayment success/declined/error/not-entitled.
- `test/unit/modules/tap-to-pay-lab/components/EntitlementBanner.test.tsx`
- `test/unit/modules/tap-to-pay-lab/components/CapabilityCard.test.tsx`
- `test/unit/modules/tap-to-pay-lab/components/DiscoverButton.test.tsx`
- `test/unit/modules/tap-to-pay-lab/components/PaymentComposer.test.tsx`
- `test/unit/modules/tap-to-pay-lab/components/AcceptPaymentButton.test.tsx`
- `test/unit/modules/tap-to-pay-lab/components/ResultCard.test.tsx`
- `test/unit/modules/tap-to-pay-lab/components/SetupNotes.test.tsx`
- `test/unit/modules/tap-to-pay-lab/components/IOSOnlyBanner.test.tsx`
- `test/unit/modules/tap-to-pay-lab/screen.test.tsx` (iOS screen)
- `test/unit/modules/tap-to-pay-lab/screen.android.test.tsx` (gate banner)
- `test/unit/modules/tap-to-pay-lab/screen.web.test.tsx` (gate banner)
- `test/unit/plugins/with-tap-to-pay.test.ts` — idempotency,
  coexistence with existing plugins.
- `test/unit/manifest.test.ts` — update module count.

### Wiring
- `src/modules/registry.ts` — import `tapToPayLab`, append to
  `MODULES` array after `storekitLab`.
- `app.json` — insert `./plugins/with-tap-to-pay` after
  `./plugins/with-storekit` (plugins array length 40 → 41).
- `test/unit/plugins/with-mapkit.test.ts` — bump plugin chain
  count 40 → 41 (per prompt: "bump with-mapkit count 40→41").

## Architecture

### Layering
1. **Native bridge** (Swift) — wraps ProximityReader /
   `PaymentCardReaderSession`. Educational scaffold, not compiled.
2. **JS bridge** (TS) — typed contract, safe fallback, web stub.
3. **State hook** (`useTapToPay`) — state machine, action creators.
4. **Components** — presentational, consume hook state, delegate
   actions.
5. **Screen** — composition layer, orchestrates sections.
6. **Module manifest** — registry entry, lazy render.
7. **Plugin** — prebuild-time entitlement injection.

### State Machine (`useTapToPay`)
```
States:
  supported: boolean | null
  entitled: boolean | null
  discovery: 'idle' | 'discovering' | 'ready' | 'error'
  lastResult: PaymentResult | null
  lastError: Error | null

Actions:
  checkSupport() -> calls bridge.isSupported(), updates supported
  discover() -> calls bridge.discover(), updates discovery state
  acceptPayment(opts) -> calls bridge.acceptPayment(opts), updates
    lastResult or lastError
```

### Currency Catalog Shape
```ts
export interface CurrencyEntry {
  code: string;        // ISO 4217 (e.g., 'USD')
  name: string;        // display name (e.g., 'US Dollar')
  minorUnits: number;  // decimal places (0, 2, or 3)
}

export const CURRENCIES: readonly CurrencyEntry[] = [ /* 20+ */ ];
```

### Bridge Contract (TS)
```ts
export interface LineItem {
  label: string;
  amount: number; // cents/minor units
}

export interface AcceptPaymentOptions {
  amount: number;        // cents/minor units
  currency: string;      // ISO 4217
  lineItems?: LineItem[];
}

export type PaymentOutcome = 'success' | 'declined' | 'error';

export interface PaymentResult {
  outcome: PaymentOutcome;
  transactionId?: string;
  amount?: number;
  currency?: string;
  errorMessage?: string;
  declinedReason?: string;
}

export interface TapToPayBridge {
  isSupported(): Promise<boolean>;
  discover(): Promise<void>;
  acceptPayment(opts: AcceptPaymentOptions): Promise<PaymentResult>;
}
```

### Plugin Strategy
- Uses `@expo/config-plugins` `withEntitlementsPlist` mod.
- Adds `com.apple.developer.proximity-reader.payment.acceptance: true`
  to iOS entitlements.
- Idempotent: if key exists, preserve value (don't double-add).
- Pure function `applyTapToPayEntitlements(plist)` exposed for
  unit testing.

## Constitution Compliance

### Cross-Platform Parity (Principle I)
- Module works on iOS, Android, Web.
- iOS: full UI with capability checks, gate on entitlement/support.
- Android/Web: IOSOnlyBanner with explanation.
- Core UX: user sees capability status on all platforms; iOS shows
  interactive payment UI; other platforms show educational gate.

### Token-Based Theming (Principle II)
- All components use `ThemedText` and `ThemedView`.
- Spacing via `Spacing` scale (no magic numbers).
- Colors via `useTheme()` hook.

### Platform File Splitting (Principle III)
- Non-trivial differences split via `.android.tsx` / `.web.tsx`
  suffix.
- `screen.tsx` (iOS), `screen.android.tsx` (gate),
  `screen.web.tsx` (gate).
- Bridge: `taptopay.ts` (iOS), `taptopay.web.ts` (stub).

### Educational Scaffolds (Principle VII, if exists; or best practice)
- Swift bridge is NOT compiled; serves as reference.
- Setup notes guide developer to real integration.
- Module disclaims production readiness.

### Development Workflow (Validate-Before-Spec)
- No new build dependencies; no `pnpm install` of packages.
- Plugin tested in existing plugin chain.
- No native compilation required for this PR.

## Dependencies

**None new.**

Existing dependencies used:
- `expo-modules-core` — `requireOptionalNativeModule`
- `@expo/config-plugins` — `withEntitlementsPlist`
- React Native core (`Platform`, `StyleSheet`, `ScrollView`,
  `TextInput`, `Button`, `View`, `Text`)
- React (`useState`, `useCallback`, `useEffect`)
- Jest, React Native Testing Library (tests)

## Test Strategy

All tests are JS-pure (Jest + RNTL). No native module is ever
loaded in Jest (jsdom environment).

- **Bridge contract tests**: Mock `requireOptionalNativeModule` to
  return a fake bridge; verify dispatch.
- **Hook tests**: Use `__setTapToPayBridgeForTests(mockBridge)` to
  inject a controlled mock; verify state transitions.
- **Component tests**: Render with RNTL, mock `useTapToPay` hook,
  fire events, assert DOM and callbacks.
- **Screen tests**: Render full screen, verify sections present,
  verify iOS-only gate on Android/Web.
- **Plugin tests**: Call plugin with mock Expo config, verify
  entitlements plist shape, test idempotency (run twice = same
  result), test coexistence with other plugins.
- **Manifest tests**: Import registry, verify new module present,
  verify id/platforms/minIOS.

Expected test delta:
- Baseline: 669 tests / 4578 assertions
- New: ~30 tests / ~80 assertions
- Total: ~699 tests / ~4658 assertions

## Constraints

- **Additive-only**: Touch existing files only for registry,
  app.json, manifest test, and with-mapkit test count bump.
- **No `eslint-disable`**: All code passes lint.
- **Single quotes**: JS/TS/TSX code uses single quotes.
- **`pnpm format` before commit**: Ensures consistent formatting.
- **Native bridge mocked at import boundary**: Use
  `requireOptionalNativeModule` + `__setTapToPayBridgeForTests`.
- **Plugin coexistence**: Must work alongside existing plugins
  without throwing.
- **No Swift compilation**: Swift file is doc-only, not linked.

## Risks and Mitigations

**Risk**: Entitlement confusion (developers think plugin grants
  Apple approval).
**Mitigation**: EntitlementBanner prominently explains restriction;
  Setup notes detail Apple program enrollment steps.

**Risk**: Currency catalog incomplete for edge cases.
**Mitigation**: 20+ common currencies cover 95% of use cases;
  catalog is easily extensible (add more entries to array).

**Risk**: Swift API drift (ProximityReader API changes).
**Mitigation**: Swift bridge is doc-only; cite Apple docs in
  comments; mark as iOS 16.4+ with `@available`.

**Risk**: Plugin test count mismatch (with-mapkit bump).
**Mitigation**: Grep for existing count assertions, update
  mechanically.

**Risk**: Test delta mismatch (baseline ≠ 669).
**Mitigation**: Re-run baseline tests at start, record actual
  count, adjust expectation.

## Commit Strategy

Single feat commit:
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

Test delta: 669 tests / 4578 assertions → ~699 tests / ~4658 assertions

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
```

## Implementation Order

1. **Native bridge types** (`taptopay.types.ts`)
2. **Currency catalog** (`currency-codes.ts` + test)
3. **JS bridge** (`taptopay.ts`, `taptopay.web.ts` + test)
4. **State hook** (`useTapToPay.ts` + test)
5. **Components** (×8, each with test)
6. **Screens** (×3, each with test)
7. **Module manifest** (`index.tsx`)
8. **Plugin** (`with-tap-to-pay/index.ts` + test)
9. **Wiring** (registry, app.json, with-mapkit count bump)
10. **Swift bridge** (doc-only, TapToPayBridge.swift)
11. **Verify** (typecheck, lint, format, test, check)
12. **Commit**
