# Implementation Plan — Feature 042 (App Clips Lab)

**Branch**: `042-app-clips`
**Parent**: `041-universal-links`

## Architecture

```
src/modules/app-clips-lab/
├── index.tsx                 # Module manifest (id, platforms, render)
├── screen.tsx                # iOS variant — composes 5 sections
├── screen.android.tsx        # IOSOnlyBanner-only variant
├── screen.web.tsx            # IOSOnlyBanner-only variant
├── invocation-sources.ts     # Frozen catalog of invocation surfaces
├── simulator-store.ts        # In-memory FIFO store + subscribe()
└── components/
    ├── ExplainerCard.tsx
    ├── InvocationSimulator.tsx
    ├── PayloadViewer.tsx
    ├── SetupInstructions.tsx
    ├── LimitationsCard.tsx
    └── IOSOnlyBanner.tsx

plugins/with-app-clips/
├── index.ts                  # withEntitlementsPlist mod + pure helper
└── package.json
```

## Module rendering contract

The iOS screen subscribes to the module-level `simulatorStore` once on
mount, syncs local state on every notification, and unsubscribes on
unmount. This keeps the screen idiomatic React without a separate
context provider. The store is a plain JS singleton — no native
dependency, no `Linking` listener.

## Plugin design

`with-app-clips` uses `withEntitlementsPlist` to set the
`com.apple.developer.on-demand-install-capable` boolean to `true` on
the parent target's entitlements plist. The pure helper
`applyAppClipsEntitlement(modResults)` makes the mutation testable
without driving the full mod runner.

The plugin restricts itself to *one* key. It never deletes, reads, or
writes any other entitlement, so it composes byte-cleanly with every
prior entitlement plugin in the repo (keychain, sign-in-with-apple,
app-groups, passkit, universal-links).

## Test strategy

| Test | Scope | Env |
|------|-------|-----|
| `manifest.test.ts` | Manifest invariants | node |
| `registry.test.ts` | Registry includes app-clips-lab once with all platforms | node |
| `invocation-sources.test.ts` | Catalog shape, frozen, lookup | node |
| `simulator-store.test.ts` | Push/list/clear/capacity/subscribe/listener errors | node |
| `screen.test.tsx` | iOS screen — sections render + simulate flow + clear | jsdom |
| `screen.android.test.tsx` | Android variant — IOSOnlyBanner only | jsdom |
| `screen.web.test.tsx` | Web variant — IOSOnlyBanner only | jsdom |
| `components/*.test.tsx` (6) | Component-level: ExplainerCard, InvocationSimulator, PayloadViewer, SetupInstructions, LimitationsCard, IOSOnlyBanner | jsdom |
| `plugins/with-app-clips/index.test.ts` | Pure mutation rows + idempotency + coexistence + plugin chain | node |
| `plugins/with-mapkit/index.test.ts` | Bumped plugin count 32 → 33 | node |

## Risks

- **Xcode sub-target absent**: documented up-front. The module
  intentionally ships as scaffold; tests cover the JS / config-plugin
  layer only.
- **Plugin chain coexistence**: covered by the dedicated coexistence
  test that composes with-app-clips with universal-links / keychain /
  sign-in-with-apple and re-runs to confirm idempotency under
  composition.
