# Contract: `with-mapkit` Expo Config Plugin

## Public API

```ts
// plugins/with-mapkit/index.ts
import type { ConfigPlugin } from '@expo/config-plugins';

declare const withMapKit: ConfigPlugin;
export default withMapKit;
```

## Behavior

The plugin sets exactly one Info.plist key on iOS:

| Key                                    | Value                                                                                                |
|----------------------------------------|------------------------------------------------------------------------------------------------------|
| `NSLocationWhenInUseUsageDescription`  | `Spot uses your location to center the MapKit Lab map on you and to drop pins at your current position.` |

Properties:

- **Idempotent**: re-running on a config that already contains the
  identical copy is a literal no-op (write is guarded by an
  inequality check). Re-running on a config with a different prior
  value overwrites it once and is then idempotent.
- **Targeted**: writes only `NSLocationWhenInUseUsageDescription`.
  Never reads or writes any other Info.plist key, no entitlements,
  no capabilities, no build settings.
- **Coexists** with all 10 prior in-tree custom plugins; the
  `app.json` `plugins` array grows from 14 entries to 15 (3
  baseline Expo plugins + 11 in-tree `./plugins/*` + 1 inline
  `expo-sensors` configured array).
- **No warnings**: emits no `console.warn` on a baseline config.

## Implementation

```ts
import type { ConfigPlugin } from '@expo/config-plugins';
import { withInfoPlist } from '@expo/config-plugins';

const KEY = 'NSLocationWhenInUseUsageDescription';
const COPY =
  'Spot uses your location to center the MapKit Lab map on you ' +
  'and to drop pins at your current position.';

const withMapKit: ConfigPlugin = (config) => {
  return withInfoPlist(config, (mod) => {
    if (mod.modResults[KEY] !== COPY) {
      mod.modResults[KEY] = COPY;
    }
    return mod;
  });
};

export default withMapKit;
```

## Test contract — `test/unit/plugins/with-mapkit/index.test.ts`

Mirrors the `with-keychain-services` test layout (node Jest env):

1. `adds the key with documented copy when absent` — call returns
   a defined config object.
2. `overwrites a stale value` — config with old copy → no throw.
3. `is idempotent (running twice produces a single write)` —
   double-call → no throw.
4. `emits no warnings on a baseline config` — `console.warn` spy
   call count `=== 0`.
5. `only edits NSLocationWhenInUseUsageDescription` — `name`,
   `slug`, `ios.bundleIdentifier` all preserved.
6. `coexistence: app.json has the expected plugin shape` —
   `appJson.expo.plugins.length === 15`;
   `'./plugins/with-mapkit'` appears exactly once at index 14;
   `appJson.expo.plugins.slice(0, 14)` deep-equals the prior
   array.
7. `mod-chain runs without throwing` — import every default export
   from `plugins/with-*/index.ts` (11 total: 10 prior +
   `with-mapkit`); fold them over a baseline `ExpoConfig`; assert
   no throw and that `NSLocationWhenInUseUsageDescription` ends up
   set to the documented copy.
