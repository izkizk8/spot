# Contract — `with-bluetooth` Expo config plugin

**Feature**: 035-core-bluetooth
**See**: [spec.md](../spec.md) FR-018, FR-019, FR-020
**See**: [research.md](../research.md) §7 (R-G chaining +
   idempotency proof)

Implementation files:

- `plugins/with-bluetooth/index.ts`
- `plugins/with-bluetooth/package.json`

## Invariants (asserted by `test/unit/plugins/with-bluetooth.test.ts`)

- **P1**. The default export is a `ConfigPlugin` from
  `@expo/config-plugins`.
- **P2**. The plugin uses ONLY `withPlugins` and `withInfoPlist`.
  It does NOT use `withDangerousMod`, `withEntitlementsPlist`,
  `withAndroidManifest`, or any other mod (additive + reviewable
  surface).
- **P3**. **Chains the upstream `react-native-ble-plx` plugin
  exactly once**, with options
  `{ isBackgroundEnabled: false, modes: [], bluetoothAlwaysPermission: undefined }`.
  Passing `bluetoothAlwaysPermission: undefined` ensures the
  upstream plugin does not set the iOS plist key (we own that set
  in P4 to preserve any operator override).
- **P4**. `NSBluetoothAlwaysUsageDescription`:
  - **a.** When the key is ABSENT in the input config, the plugin
    sets it to the string
    `'Used to demonstrate Core Bluetooth central scanning, connection, and characteristic operations.'`.
  - **b.** When the key is PRESENT (even with an empty string),
    the plugin leaves it UNCHANGED. (Operator-override
    coexistence — FR-019.)
- **P5**. **Idempotency**: running the plugin twice on the same
  input produces a deep-equal output. SC-008.
- **P6**. **No additional Android manifest mods**. The upstream
  `react-native-ble-plx` plugin already declares
  `BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`, and (guarded by
  `android:maxSdkVersion="30"`) `ACCESS_FINE_LOCATION`. The wrapper
  does NOT redeclare them. The test asserts that the wrapper
  does not call `withAndroidManifest`.
- **P7**. The plugin is added to `app.json` `plugins[]` as the
  string `'./plugins/with-bluetooth'` (relative path; no options).
  Adding it grows `expo.plugins.length` by exactly 1.
- **P8**. The plugin contains NO secret values, NO network
  requests, NO file-system writes outside the standard
  `@expo/config-plugins` mod surface.

## Pseudo-signature

```ts
import type { ConfigPlugin } from '@expo/config-plugins';
import { withInfoPlist, withPlugins } from '@expo/config-plugins';

const DEFAULT_BT_USAGE =
  'Used to demonstrate Core Bluetooth central scanning, connection, and characteristic operations.';

const withBluetooth: ConfigPlugin = (config) => {
  let next = withPlugins(config, [
    [
      'react-native-ble-plx',
      { isBackgroundEnabled: false, modes: [], bluetoothAlwaysPermission: undefined },
    ],
  ]);
  next = withInfoPlist(next, (cfg) => {
    if (!cfg.modResults.NSBluetoothAlwaysUsageDescription) {
      cfg.modResults.NSBluetoothAlwaysUsageDescription = DEFAULT_BT_USAGE;
    }
    return cfg;
  });
  return next;
};

export default withBluetooth;
```

## Test scenarios

The unit test exercises four scenarios:

1. **Empty input config** — runs the plugin once; expects
   `NSBluetoothAlwaysUsageDescription === DEFAULT_BT_USAGE` and
   the upstream plugin to have been invoked once with the
   documented options.
2. **Idempotency** — runs the plugin twice on the same input;
   expects deep-equal output (SC-008).
3. **Operator override preserved** — runs the plugin on a config
   where `NSBluetoothAlwaysUsageDescription = 'OPERATOR'`; expects
   the value to stay `'OPERATOR'` after both invocations.
4. **No Android manifest call** — mocks `withAndroidManifest` and
   asserts it was never called by the wrapper (the upstream
   plugin's manifest mods are inside `withPlugins` and are
   captured by the upstream plugin mock, not by this assertion).

## Test mocking strategy

The test mocks `@expo/config-plugins`:

```ts
jest.mock('@expo/config-plugins', () => {
  const actual = jest.requireActual('@expo/config-plugins');
  return {
    ...actual,
    withPlugins: jest.fn((config, plugins) => {
      // record the plugins[] array for assertion
      // return config unchanged
      return config;
    }),
  };
});
```

`withInfoPlist` is exercised against the actual implementation
(it is pure and small).

## `package.json` shape

```json
{
  "name": "with-bluetooth",
  "version": "1.0.0",
  "main": "index.ts"
}
```

No `dependencies` field. Config plugins resolve
`@expo/config-plugins` from the host project; the upstream
`react-native-ble-plx` plugin is resolved as a runtime peer of
the host's `react-native-ble-plx` install.
