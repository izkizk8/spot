# Plan — Feature 071 SiriKit Custom Intents

## Bridge types

`src/native/sirikit.types.ts` declares `IntentDomain`, `IntentStatus`,
`IntentItem`, `VocabularyEntry`, `SiriKitInfo`, and `SiriKitBridge`. A
`SiriKitNotSupported` error class flags non-iOS / unregistered usage.

## Module structure

`src/modules/sirikit-lab/`:

- `index.tsx` — manifest with lazy `render: () => require('./screen').default`.
- `screen.tsx` (iOS), `screen.android.tsx`, `screen.web.tsx` (gate banner).
- `hooks/useSiriKit.ts` — state machine; bridge replaceable via
  `__setSiriKitBridgeForTests`.
- `components/` — `CapabilityCard`, `IntentSimulator`, `VocabularyPanel`,
  `SetupGuide`, `IOSOnlyBanner`.

## Plugin

`plugins/with-sirikit/` seeds `NSSiriUsageDescription` (idempotent,
preserves operator-supplied values). Registered in `app.json` after
`with-coredata-cloudkit`.

## Tests

JS-pure under `test/unit/modules/sirikit-lab/` and
`test/unit/plugins/with-sirikit/`. Mocks the native module at the import
boundary; no Xcode required.
