/**
 * with-bluetooth — Expo config plugin for feature 035 (Core Bluetooth /
 * BLE Central module).
 *
 * Prebuild-time operations (all idempotent):
 *
 *   1. Chain the upstream `react-native-ble-plx` plugin via `withPlugins`
 *      with options `{ isBackgroundEnabled: false, modes: [],
 *      bluetoothAlwaysPermission: undefined }` so we own the iOS plist
 *      key (P3 / R-G).
 *   2. Set `NSBluetoothAlwaysUsageDescription` to a default string ONLY
 *      when the key is absent in the input config — preserving any
 *      operator override (P4 / FR-019).
 *
 * Running the plugin twice on the same Expo config produces a deep-equal
 * config (P5 / SC-008).
 *
 * @see specs/035-core-bluetooth/contracts/with-bluetooth-plugin.md
 */

import * as _cp from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';
const configPlugins = (_cp as { default?: typeof _cp }).default ?? _cp;
const { withInfoPlist, withPlugins } = configPlugins;
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
    if (cfg.modResults.NSBluetoothAlwaysUsageDescription === undefined) {
      cfg.modResults.NSBluetoothAlwaysUsageDescription = DEFAULT_BT_USAGE;
    }
    return cfg;
  });
  return next;
};

export default withBluetooth;
