# Contract — `with-passkit` Expo config plugin

**Feature**: 036-passkit-wallet
**See**: [spec.md](../spec.md) FR-019, FR-020, FR-021, FR-022, SC-006, SC-007
**See**: [research.md](../research.md) §7 (R-G)

Implementation files:

- `plugins/with-passkit/index.ts` — the `ConfigPlugin`
- `plugins/with-passkit/index.test.ts` — co-located export-shape
  smoke test
- `plugins/with-passkit/package.json` — Expo plugin package
  metadata
- `test/unit/plugins/with-passkit/index.test.ts` — full
  behavioural test (idempotency, placeholder, coexistence)

## Invariants (asserted by `test/unit/plugins/with-passkit/index.test.ts`)

- **P1**. The plugin's default export is a `ConfigPlugin` (function
  taking an Expo config and returning an Expo config).
- **P2**. Running the plugin on an Expo config whose
  `ios.entitlements['com.apple.developer.pass-type-identifiers']` is
  ABSENT, EMPTY, or NOT AN ARRAY adds the placeholder array
  `['$(TeamIdentifierPrefix)pass.example.placeholder']`.
- **P3**. Running the plugin on an Expo config whose
  `ios.entitlements['com.apple.developer.pass-type-identifiers']` is
  ALREADY a non-empty array preserves the existing value
  byte-identical (no merge, no de-dup, no reorder).
- **P4**. Running the plugin appends `PassKit.framework` to the main
  iOS target's frameworks build phase exactly once. If
  `PassKit.framework` is already linked (e.g., by another plugin
  that ran earlier), the plugin is a no-op for that mod.
- **P5**. **Idempotency** — running the plugin twice on the same
  Expo config produces a deep-equal config (SC-006). This holds
  whether the placeholder is in effect or an operator-supplied real
  value is present.
- **P6**. **Coexistence with all 22 prior plugins** (FR-022, SC-007).
  Composing
  `[withScreentime, withCoreML, withVision, withSpeech,
    withAudio, withSignInWithApple, withLocalAuth, withKeychain,
    withMapKit, withCoreLocation, withRichNotifications,
    withLockWidgets, withStandbyWidget, withFocusFilters,
    withBackgroundTasks, withSpotlight, withDocuments, withARKit,
    withBluetooth, withLiveActivity, withAppIntents, withHomeWidgets, withPassKit]`
  on an empty Expo config produces a config in which:
    - Each prior plugin's contribution to
      `ios.entitlements`, `ios.infoPlist`, `android.permissions`,
      and the Xcode project (target list, framework list, build
      phases) is BYTE-IDENTICAL to running each plugin alone.
    - The new `pass-type-identifiers` placeholder array is present.
    - `PassKit.framework` is in the main target's frameworks build
      phase exactly once.
- **P7**. The plugin does NOT touch
  `com.apple.security.application-groups`,
  `com.apple.developer.applesignin`,
  `com.apple.developer.associated-domains`,
  `com.apple.developer.healthkit`,
  `com.apple.developer.usernotifications.communication`,
  `com.apple.developer.family-controls`, or any other entitlement
  declared by any prior plugin. The composition test asserts this
  by listing each prior plugin's owned keys and verifying they are
  byte-identical post-composition.
- **P8**. The plugin's `package.json` declares `main` as `index.ts`
  and has no runtime `dependencies` (config plugins resolve
  `@expo/config-plugins` from the host package; mirroring
  `plugins/with-bluetooth/package.json`).

## Plugin shape

```ts
// plugins/with-passkit/index.ts
import {
  ConfigPlugin,
  withEntitlementsPlist,
  withXcodeProject,
} from '@expo/config-plugins';

const ENTITLEMENT_KEY = 'com.apple.developer.pass-type-identifiers';
const PLACEHOLDER = '$(TeamIdentifierPrefix)pass.example.placeholder';
const FRAMEWORK = 'PassKit.framework';

const withPassKit: ConfigPlugin = (config) => {
  config = withEntitlementsPlist(config, (cfg) => {
    const existing = cfg.modResults[ENTITLEMENT_KEY];
    const isPopulatedArray =
      Array.isArray(existing) && existing.length > 0 && existing.every((s) => typeof s === 'string');
    if (!isPopulatedArray) {
      cfg.modResults[ENTITLEMENT_KEY] = [PLACEHOLDER];
    }
    return cfg;
  });

  config = withXcodeProject(config, (cfg) => {
    const project = cfg.modResults;
    // Use @expo/config-plugins' helper or the project's existing pattern
    // (matching prior plugins like with-arkit / with-bluetooth) to ensure
    // PassKit.framework is in the main target's frameworks build phase
    // exactly once. No-op when already present.
    if (!hasFramework(project, FRAMEWORK)) {
      addFramework(project, FRAMEWORK);
    }
    return cfg;
  });

  return config;
};

export default withPassKit;
```

The two helpers (`hasFramework`, `addFramework`) follow the same
pattern used by prior plugins (`with-arkit`, `with-bluetooth`,
`with-mapkit`, etc.); the exact helper names match whatever the
project already uses for system-framework linkage.

## `package.json` shape

```json
{
  "name": "with-passkit",
  "version": "1.0.0",
  "main": "index.ts",
  "private": true
}
```

(No `dependencies`. Mirrors `plugins/with-bluetooth/package.json`.)

## App-config edit

```jsonc
// app.json (additive — exactly 1 entry in expo.plugins)
{
  "expo": {
    "plugins": [
      "expo-router",
      // ...22 prior plugin entries...
      "./plugins/with-passkit"
    ]
  }
}
```

After this edit `app.json`'s `expo.plugins.length === 23`.

## Documentation requirement (in the source comments)

The plugin source (or its `index.ts` JSDoc block) MUST document:

1. The placeholder value and its lifecycle (overwritten only when
   absent / empty).
2. How an operator replaces it: edit `app.json`'s
   `ios.entitlements['com.apple.developer.pass-type-identifiers']`
   directly, with a real registered Pass Type ID array.
3. That the placeholder does NOT block EAS Build / Apple
   provisioning; it only fails at runtime when an unsigned or
   Pass-Type-mismatched pass is presented to Wallet.
4. A pointer to `quickstart.md` §3.1 (operator override steps).

## Test surface (sketch)

`test/unit/plugins/with-passkit/index.test.ts` exercises:

- **P2 (placeholder)**: empty config → key present, value is the
  placeholder; explicit empty array → replaced; non-array existing
  value → replaced.
- **P3 (preserve)**: pre-populated array of one or more real Pass
  Type ID strings → unchanged after running the plugin.
- **P4 (framework)**: empty config → `PassKit.framework` is in the
  main target's frameworks build phase exactly once; running on a
  config that already has it → still exactly once.
- **P5 (idempotency)**: deep-equal after two runs (snapshot or
  recursive equality on the resolved config).
- **P6 (coexistence)**: compose all 22 prior plugins + `with-passkit`;
  assert each prior plugin's contribution is byte-identical to its
  solo output; assert `pass-type-identifiers` placeholder is
  present; assert `PassKit.framework` linkage is in place exactly
  once.
- **P7 (no foreign-key writes)**: snapshot the entitlements dict
  before / after; only `pass-type-identifiers` differs.
