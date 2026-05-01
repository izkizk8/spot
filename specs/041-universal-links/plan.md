# Implementation Plan — 041 Universal Links

**Status**: Implemented
**Branch**: `041-universal-links` (from `040-handoff-continuity`)

## Architecture

```
src/modules/universal-links-lab/
├── index.tsx                     ModuleManifest (lazy `render`)
├── types.ts                      ConfiguredDomain, UniversalLinkEvent
├── aasa-template.ts              buildAASA(), aasaToJsonString()
├── screen.tsx                    iOS composition
├── screen.android.tsx            IOSOnlyBanner
├── screen.web.tsx                IOSOnlyBanner
├── components/
│   ├── ExplainerCard.tsx
│   ├── DomainsList.tsx           parses applinks: entries → status pills
│   ├── TestComposer.tsx          Linking.openURL self-test
│   ├── AASAPreviewCard.tsx       Clipboard copy of AASA JSON
│   ├── SetupInstructions.tsx     8 numbered steps
│   ├── InvocationsLog.tsx        FIFO log renderer + Clear button
│   └── IOSOnlyBanner.tsx
└── hooks/
    └── useUniversalLinks.ts      subscribe + initial URL + log + clear + dispatch

plugins/with-universal-links/
├── index.ts                      applyAssociatedDomains() pure helper + plugin
└── package.json
```

## Native side

No new native code. expo-router and `expo-linking` already wire
incoming URLs through the AppDelegate
`application(_:continue:restorationHandler:)` callback (and the
`UIApplication.OpenURLOptions` path) into JS. This module only adds JS
listeners on top.

## Config plugin

`with-universal-links` operates on `withEntitlementsPlist`:

- Pure helper `applyAssociatedDomains(modResults)` returns a new record
  with `com.apple.developer.associated-domains` union-merged.
- Idempotent: running on own output is byte-stable.
- Defensive: non-array prior values → single console.warn + replace.
- Coexists with `with-keychain-services`, `with-sign-in-with-apple`,
  `with-home-widgets` (app groups), `with-passkit` — none of those
  touch `associated-domains`.

## URL parsing strategy

The `URL` constructor exposed by jest-expo / RN polyfills is unreliable
(rejects valid `https://example.com/x` strings under jsdom). The hook
and the validator therefore use **regex-based parsing** rather than
`new URL(...)`:

- Validator: `^https?:\/\/[^\s/$.?#].[^\s]*$`
- Parser: `^https?:\/\/([^/?#]+)([^?#]*)(\?[^#]*)?(#.*)?$`

This keeps behaviour identical between Node, jsdom, and the device
runtime.

## Test coverage

15 new test files, ~88 new tests:

- `manifest.test.ts` (7)
- `registry.test.ts` (3)
- `aasa-template.test.ts` (9)
- `hooks/useUniversalLinks.test.tsx` (13)
- 7 component test files (3-7 each)
- 3 screen variants
- `plugins/with-universal-links/index.test.ts` (12)
- existing `with-mapkit/index.test.ts` plugin-count assertion bumped
  31 → 32.

## Risks

- **AASA caching** means mid-build changes won't reach the device until
  reinstall — documented in SetupInstructions.
- **Placeholder domain** (`spot.example.com`) cannot serve a real AASA
  file — module is educational only; users replace it for real builds.
- **expo-router route resolution**: the lab does not assert any
  particular path mapping; it logs whatever URL the OS delivers.

## Out of scope

- Branch-specific dynamic AASA generation per environment.
- Android App Links coverage.
- Real route-table inspection / "did this UL match a route?" UX.
