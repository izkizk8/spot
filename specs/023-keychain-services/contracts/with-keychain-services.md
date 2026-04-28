# Contract — `plugins/with-keychain-services`

Expo config plugin that idempotently adds the
`keychain-access-groups` entitlement so the iOS app can address
keychain items in the team-prefixed access group at runtime.

## Surface

```ts
import type { ConfigPlugin } from '@expo/config-plugins';
import { withEntitlementsPlist } from '@expo/config-plugins';

declare const withKeychainServices: ConfigPlugin;
export default withKeychainServices;
```

Registered in `app.json` `expo.plugins` as the literal string
`./plugins/with-keychain-services` (no options — the plugin reads
`ios.bundleIdentifier` from the config it is given).

## Behaviour

Run inside `withEntitlementsPlist`, the plugin:

1. Reads `modConfig.ios?.bundleIdentifier`.
2. **If missing**: emits a single
   `console.warn('[with-keychain-services] ios.bundleIdentifier is missing; skipping keychain-access-groups entitlement.')`
   and returns the config untouched. No throw.
3. **Else**: computes
   `entry = '$(AppIdentifierPrefix)' + bundleIdentifier`.
4. Reads `modConfig.modResults['keychain-access-groups']`. If it is
   an array and already contains `entry`, the plugin returns the
   config unchanged. Otherwise the plugin assigns
   `[...existingArray, entry]` (or `[entry]` when the field is
   absent / non-array).

## Invariants

- **Idempotent**: running the plugin twice on the same config
  produces a single entry.
- **Scoped**: writes only `keychain-access-groups`. Never reads or
  writes Info.plist, capabilities, build settings, or any other
  entitlement (FR-021).
- **Coexistent**: composes with all 10 prior custom plugins in the
  `expo.plugins` array; the new plugin is appended; the array
  grows by exactly one entry (11 → 12 — SC-004).
- **Safe on missing prerequisites**: missing
  `ios.bundleIdentifier` is a warn + no-op, not an error.
- **No throws** under any documented input.

## Test contract (`plugins/with-keychain-services/index.test.ts`)

- **Adds when absent** — given a config without the entitlement,
  the plugin produces
  `modResults['keychain-access-groups'] === ['$(AppIdentifierPrefix)com.example.app']`.
- **Preserves existing entries** — given a config that already
  contains an unrelated group, the plugin produces
  `[<existing>, '$(AppIdentifierPrefix)<bundleId>']`.
- **Idempotent on re-run** — running the plugin twice on the same
  starting config yields the same entitlement array as one run.
- **Missing bundleIdentifier** — given a config without
  `ios.bundleIdentifier`, the plugin emits exactly one
  `console.warn` (asserted via `jest.spyOn`) and leaves
  `modResults` untouched.
- **Coexistence smoke** — applying every prior plugin
  (`with-live-activity`, `with-app-intents`, `with-home-widgets`,
  `with-screentime`, `with-coreml`, `with-vision`,
  `with-speech-recognition`, `with-audio-recording`,
  `with-sign-in-with-apple`, `with-local-auth`) followed by
  `with-keychain-services` to a fresh config:
  - completes without throwing,
  - produces exactly one
    `keychain-access-groups` entry,
  - leaves every other plugin's contributions intact (asserted by
    spot-checking a key written by each prior plugin).
