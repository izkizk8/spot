# Phase 0 Research — PassKit / Wallet (Add Pass) Module (036)

**Companion to**: [plan.md](./plan.md) §"Resolved decisions"

This document records the code-level detail behind plan-level
decisions **R-A** through **R-G**, plus §8 (pass-category catalog).
Spec-level decisions were already approved in `spec.md`; they are not
re-litigated here.

All sections below follow the **Decision / Rationale / Alternatives
considered** template.

---

## §1 — R-A: Bridge-level serialisation of concurrent AsyncFunction calls

### Decision

`src/native/passkit.ts` exposes an internal, module-scoped promise
chain inherited verbatim from features 030 / 031 / 032 / 033 / 034 /
035:

```ts
let chain: Promise<unknown> = Promise.resolve();

function enqueue<T>(work: () => Promise<T>): Promise<T> {
  const next = chain.then(work, work); // run regardless of prior outcome
  chain = next.catch(() => undefined); // don't poison the chain
  return next;                          // preserve original rejection for the caller
}
```

Every **mutating** async bridge method (`addPassFromBytes`,
`addPassFromURL`, `openPass`) wraps its native call through
`enqueue(...)`. The capability probes (`canAddPasses`,
`isPassLibraryAvailable`) and the read-only `passes()` are also
`AsyncFunction`s on the Swift side (PassKit's `PKPassLibrary` calls
are advised to be invoked off the main thread for large libraries),
but they are **NOT** serialised: they are pure reads with no native
side-effect ordering requirements, and forcing them through the
chain would unnecessarily delay UI updates after a heavy mutation.

### Rationale

- Two rapid Add From URL submissions hitting the bridge could
  otherwise stack two `PKAddPassesViewController` presentations,
  with the second presented modally on top of the first. Serialising
  at the JS bridge ensures the second call only fires AFTER the
  first has resolved (success or failure), giving tests the
  deterministic invariant: "two back-to-back calls produce two
  native invocations in submission order".
- Inheriting the helper verbatim from 030–035 reduces reviewer
  cognitive load and reuses the same flake-free guarantee prior
  bridge tests demonstrated.
- Errors are preserved for the caller but the chain is detoxified by
  `chain.catch(...)` so a rejected call does not block subsequent
  ones.

### Alternatives considered

- **No serialisation** — rejected; double-presentation of
  `PKAddPassesViewController` is observably broken on iOS (the
  second sheet appears, dismisses to reveal the first, and emits
  no clean callback).
- **Serialise capability probes too** — rejected; capability probes
  must remain responsive even while a long-running URL fetch is in
  flight (the user can still see the pills update on Refresh while
  a download is happening).
- **Native-side queueing** — rejected; would require state in the
  Swift bridge that survives across calls, which is hard to reset
  cleanly on screen unmount.

---

## §2 — R-B: Native authoring choice — hand-written Swift bridge

### Decision

Author a single Swift file `native/ios/passkit/PassKitBridge.swift`
(≤ 200 LOC) wrapping `PKAddPassesViewController` + `PKPassLibrary`
via `expo-modules-core`'s Module DSL:

```swift
import ExpoModulesCore
import PassKit

public class PassKitBridge: Module {
  public func definition() -> ModuleDefinition {
    Name("PassKitBridge")

    AsyncFunction("canAddPasses") { () -> Bool in
      return PKPassLibrary.isPassLibraryAvailable() && PKAddPassesViewController.canAddPasses()
    }
    AsyncFunction("isPassLibraryAvailable") { () -> Bool in
      return PKPassLibrary.isPassLibraryAvailable()
    }
    AsyncFunction("passes") { () -> [[String: Any]] in
      // map each PKPass -> { passTypeIdentifier, serialNumber, organizationName,
      //                     localizedDescription, passType }
      // ...
    }
    AsyncFunction("addPassFromBytes") { (base64: String, promise: Promise) in
      // decode → PKPass(data:) → present PKAddPassesViewController
      // forward didAddPasses / didFinish into { added: Bool }
    }
    AsyncFunction("addPassFromURL") { (url: String, promise: Promise) in
      // URLSession.shared.dataTask → reuse the byte path
    }
    AsyncFunction("openPass") { (passTypeId: String, serial: String, promise: Promise) in
      if #available(iOS 13.4, *) {
        // PKPassLibrary().open(passTypeId, serialNumber: serial)
      } else {
        promise.reject(PassKitOpenUnsupportedException())
      }
    }
  }
}
```

No third-party `react-native-passkit*` package; no SPM dependency.

### Rationale

- PassKit's surface is **small and stable**: 6 methods, all mappable
  to `AsyncFunction`. PKPass APIs have been API-stable since iOS 6
  (with `openPass` added in iOS 13.4 and gated by `@available`). A
  100-line bridge is easier to audit than a third-party dependency.
- Zero new runtime JS dependencies — matches the additive-only
  spirit of the showcase (FR-031).
- Mirrors the 015 ScreenTime precedent: a small, hand-written Swift
  bridge is the right shape when the iOS API is small and the
  on-device flow is gated on a developer-account capability.
- Avoids inheriting maintenance risk from a third-party wrapper that
  may lag iOS releases or drift from Expo SDK 55.

### Alternatives considered

- **`react-native-passkit-wallet`** (and similar npm packages) —
  rejected. Most are unmaintained (last release > 2 years), some
  rely on the deprecated bridge model, and none are Expo-config-plugin-aware.
- **Pure JS via deep-link to a server-served pass** — rejected;
  doesn't demonstrate `PKPassLibrary` (queries existing passes) or
  `openPass`, both of which are part of the educational scope.
- **SPM-based modular Swift package** — rejected; single-file scope
  doesn't justify SPM ceremony, and the project's existing native
  modules use the `native/ios/<feature>/` flat layout.

---

## §3 — R-C: Educational-scaffold framing

### Decision

Ship the module as a **code-complete educational scaffold**, mirroring
015 ScreenTime. No signed `.pkpass` is checked in. The "Try with
bundled (unsigned) sample" button:

1. At module load, reads a build-time flag
   `__PASSKIT_BUNDLED_SAMPLE__` (default `false`; flipped only by
   an explicit, user-supplied bundler / Babel config when a real
   signed bundle is available at the documented path).
2. When the flag is `false` (the default for this repo), tapping
   the button surfaces an inline "Pass signing required" status
   without invoking the bridge or attempting any file `require`.
3. When the flag is `true` (a user opted in), tapping the button
   loads the bundled bytes and calls `addPassFromBytes(base64)`.

The four-locations rule keeps the gate visible:

1. `spec.md` §"Pass Signing Reality Check"
2. The on-screen `EntitlementBanner` component
3. `quickstart.md` §"Pass signing barrier"
4. `spec.md` §"Assumptions" (first bullet, repeated for prominence)

### Rationale

- A signed `.pkpass` is bound to a specific Apple Developer team's
  Pass Type ID + private certificate. Shipping one would either
  leak a private cert or ship an unsigned bundle that Wallet
  rejects on presentation (visible failure, bad pedagogy).
- The flag-based gate avoids the runtime-`require()` failure mode
  where bundlers resolve a placeholder asset that doesn't exist on
  disk.
- Code-complete framing maximises pedagogical value: every line
  the user would write in production already exists, reviewable
  and tested.

### Alternatives considered

- **Ship a sample unsigned `.pkpass` and let Wallet reject it** —
  rejected; the failure mode is opaque ("This pass cannot be
  installed"), trains the user that the module is broken, and
  contradicts the "no JavaScript exceptions thrown" success
  criterion (SC-005).
- **Hide the AddSamplePassCard entirely until a flag is set** —
  rejected; the card is part of the educational shape (FR-006). The
  inline notice IS the lesson.
- **Generate an unsigned pass at runtime in the JS bridge** —
  rejected; same outcome as shipping one (Wallet rejects), plus
  significant complexity for no payoff.

---

## §4 — R-D: Hook error classification

### Decision

`usePassKit.ts` catches every mutating bridge call at the hook
boundary and dispatches one of:

| Source | Typed class | `lastError.kind` | Caption (example) |
|--------|-------------|------------------|-------------------|
| Non-iOS bridge variant | `PassKitNotSupported` | `'unsupported'` | "Wallet is iOS-only" |
| `openPass` on iOS<13.4 | `PassKitOpenUnsupported` | `'open-unsupported'` | "Open in Wallet requires iOS 13.4+" |
| URLSession failure / non-2xx | `PassKitDownloadFailed` | `'download-failed'` | "Download failed (status 404)" |
| `PKPass(data:)` rejects bytes | `PassKitInvalidPass` | `'invalid-pass'` | "Pass invalid or unsigned" |
| User dismisses sheet without approving | `PassKitCancelled` | `'cancelled'` | "Cancelled" |
| Anything else | `Error` | `'failed'` | (the underlying message, truncated to 120 chars) |

The hook NEVER allows a bridge call to surface as an unhandled
rejection (FR-024). Every mutating action is wrapped in
`try { ... } catch (e) { dispatch({ type: 'error', error: classify(e) }) }`,
and the classifier is exported for direct testing.

### Rationale

- Five typed classes give the UI exactly the granularity it needs to
  render distinct, actionable status text. Six categories
  (including `'failed'` as the catch-all) is a deliberate match to
  035's R-D so reviewers experienced with that feature recognise the
  shape immediately.
- `PassKitCancelled` is split from `PassKitDownloadFailed` because
  user cancellation should not be styled as an error (no red text;
  just a neutral "Cancelled" caption).
- The bridge resolves with `{ added: false }` on cancel as a
  fallback, but the hook ALSO accepts `PassKitCancelled` rejections
  for symmetry with iOS versions that surface cancellation as a
  delegate error rather than a successful-but-empty result.

### Alternatives considered

- **Single typed `PassKitError` with a `code` field** — rejected;
  loses `instanceof` ergonomics and complicates the cross-platform
  identity guarantee (B9 in 035; B7 here).
- **Surface bridge errors raw** — rejected; FR-024 forbids uncaught
  promise rejections, and the spec is explicit that errors must
  appear as inline status text.
- **Three categories** (`'unsupported' | 'failed' | 'cancelled'`) —
  rejected; collapses too many actionable states.

---

## §5 — R-E: `openPass` iOS-version gate

### Decision

`PKPassLibrary.openPass(passTypeIdentifier:serialNumber:)` is iOS
13.4+. Gating happens **at both layers**:

- **Swift side**: the `AsyncFunction("openPass")` body is wrapped in
  `if #available(iOS 13.4, *) { ... } else { promise.reject(...) }`.
  This is the source of truth: even if the JS-side check is bypassed
  (e.g., by a future code path that calls the bridge directly), the
  native bridge rejects cleanly.
- **JS side**: `src/native/passkit.ts` reads
  `Platform.constants?.osVersion` (Expo / React Native exposes the
  iOS version as a string like `"13.4.1"`), parses it as a
  `[major, minor]` tuple, and synchronously rejects with
  `new PassKitOpenUnsupported(...)` on `major < 13 || (major === 13 && minor < 4)`.
  This avoids a needless round-trip and lets `PassRow` disable / hide
  the Open in Wallet button at render time.

`PassRow` reads the same version compare via a small helper
`isOpenPassSupported()` exported from `src/native/passkit.ts`; on
iOS 13.0–13.3 the button is rendered with `disabled` + an
`accessibilityHint` of "Requires iOS 13.4 or later".

### Rationale

- Belt-and-braces gating at both layers is the same pattern 028
  (Lock Widgets, iOS 16+) and 034 (ARKit, iOS 11+) use; it's tested
  in both directions (mock the iOS version and assert the
  short-circuit; mock the native rejection and assert the hook
  surfaces it).
- Tuple parsing avoids a real-world bug where `parseFloat("13.10")`
  returns `13.1`, which would falsely satisfy `>= 13.4` rounding.

### Alternatives considered

- **Native-only gate** — rejected; loses the synchronous JS-side
  short-circuit that lets `PassRow` render correctly without an
  initial bridge round-trip.
- **`Platform.Version >= 13.4`** — rejected; `Platform.Version` on
  iOS is a string in modern RN, and string comparison breaks on
  multi-digit minor versions.

---

## §6 — R-F: URL-fetch native-side rationale

### Decision

`addPassFromURL(url)` performs the download **inside the Swift
bridge** using `URLSession.shared.dataTask(with: url)`, then forwards
the resulting `Data` to the same `PKAddPassesViewController` path used
by `addPassFromBytes`. The JS bridge does NOT base64-encode and
re-decode the bytes for the URL flow.

### Rationale

- Eliminates one full base64 encode/decode round-trip for what can be
  a multi-hundred-KB pass package (boarding-pass passes routinely
  carry strip / thumbnail images).
- Keeps cancellation tight: if the JS-side promise is dropped (e.g.,
  the user navigates away during fetch), the bridge can cancel the
  underlying `URLSessionTask` deterministically. A JS-side fetch
  using `fetch()` + `AbortController` is possible but introduces a
  second cancellation point that has to be reconciled with the
  bridge's own queue.
- Mirrors how 008 (audio recording) and 031 (Spotlight)
  download / write data native-side rather than ferrying bytes
  through the JS bridge.

### Alternatives considered

- **JS-side fetch + base64 + `addPassFromBytes`** — rejected;
  wastes CPU on the encode/decode and complicates cancellation.
- **`expo-file-system` `downloadAsync` to a temp file + native
  `fileURL` open** — rejected; introduces a new dependency on
  `expo-file-system`'s legacy API for a single use site, and the
  temp-file lifecycle adds cleanup obligations the bridge doesn't
  otherwise have.

---

## §7 — R-G: `with-passkit` plugin shape

### Decision

`plugins/with-passkit/index.ts` is a single `ConfigPlugin` composed of
two idempotent mods:

```ts
const withPassKit: ConfigPlugin = (config) => {
  // Mod 1: entitlement
  config = withEntitlementsPlist(config, (cfg) => {
    const KEY = 'com.apple.developer.pass-type-identifiers';
    if (!Array.isArray(cfg.modResults[KEY]) || cfg.modResults[KEY].length === 0) {
      cfg.modResults[KEY] = ['$(TeamIdentifierPrefix)pass.example.placeholder'];
    }
    return cfg;
  });

  // Mod 2: PassKit.framework linkage
  config = withXcodeProject(config, (cfg) => {
    const project = cfg.modResults;
    const FRAMEWORK = 'PassKit.framework';
    // append to main target's Frameworks build phase ONLY when not present
    if (!hasFramework(project, FRAMEWORK)) {
      addFramework(project, FRAMEWORK);
    }
    return cfg;
  });

  return config;
};

export default withPassKit;
```

Operator override semantics: if the operator has already populated
`com.apple.developer.pass-type-identifiers` (e.g., via another plugin
or a manual entitlements override), the placeholder is **not**
substituted in.

### Rationale

- **Idempotency** (FR-021, SC-006): the `array.length === 0` /
  `hasFramework` guards mean running the plugin twice on the same
  Expo config produces a deep-equal config.
- **Coexistence with 22 prior plugins** (FR-022, SC-007): no prior
  plugin owns the `pass-type-identifiers` key or
  `PassKit.framework` linkage. The plugin reads → merges → writes
  the entitlements dict and asserts it sets only its own key,
  leaving every other key (App Groups from 014/015/027/028, Sign in
  with Apple from 011, etc.) untouched.
- **Documented placeholder**: the value
  `$(TeamIdentifierPrefix)pass.example.placeholder` is a syntactically
  valid Pass Type ID shape (it includes the standard
  `$(TeamIdentifierPrefix)` prefix expansion) but is not a registered
  identifier; Apple's provisioning service does not block builds on
  unregistered values (it only blocks at runtime, when a signed pass
  is presented).

### Alternatives considered

- **Hard-fail when placeholder detected at build time** — rejected;
  contradicts the educational-scaffold framing (build must succeed
  for the JS-pure UI to be exercisable).
- **Generate a randomised placeholder per-machine** — rejected; not
  reproducible, and the project values reproducibility.
- **Skip framework linkage and rely on autolinking** —
  rejected; `PassKit.framework` is a system framework that must be
  explicitly linked via the podspec or Xcode project; autolinking
  does not pick up system frameworks.

---

## §8 — Pass-category catalog

### Decision

`pass-types.ts` exports a 5-entry catalog mapping `PassCategory` to a
short user-facing label. The catalog mirrors Apple's `PKPassType`
taxonomy as of iOS 17:

```ts
export type PassCategory =
  | 'boardingPass'
  | 'coupon'
  | 'eventTicket'
  | 'generic'
  | 'storeCard';

export const PASS_CATEGORY_CATALOG: Record<PassCategory, { label: string }> = {
  boardingPass: { label: 'Boarding pass' },
  coupon:       { label: 'Coupon' },
  eventTicket:  { label: 'Event ticket' },
  generic:      { label: 'Generic' },
  storeCard:    { label: 'Store card' },
};
```

The Swift bridge maps `PKPass.passType` (an enum) to the corresponding
string via a small, exhaustive switch. Any future `PKPass.passType`
case the Swift side cannot map falls through to `'generic'` and the
JS bridge emits a `console.warn` so test environments can detect drift
(R12 in plan §"Risks").

### Rationale

- The five entries cover 100% of pass categories Apple has shipped
  since iOS 6; the catalog is exhaustive and stable.
- Storing the label in a catalog (rather than inline in `PassRow`)
  decouples per-category copy from layout and lets `PassRow` stay
  presentation-only.
- Catalog tests assert exhaustiveness (every `PassCategory` member
  appears as a key; no extra keys); that's the primary defence
  against silent drift if a future iOS adds a new case.

### Alternatives considered

- **Inline switch in `PassRow`** — rejected; spreads category copy
  across the codebase.
- **i18n strings file from day one** — out of scope for v1 (no other
  module is i18n'd yet); the catalog is structured so a future
  i18n migration is mechanical.
