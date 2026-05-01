/**
 * with-roomplan — Expo config plugin for feature 048
 * (LiDAR / RoomPlan Lab module).
 *
 * Prebuild-time operations (all idempotent):
 *   1. Add NSCameraUsageDescription to Info.plist if not already
 *      present, with the default copy
 *      "Used to demonstrate Apple RoomPlan LiDAR room capture.".
 *   2. Preserve any existing NSCameraUsageDescription value
 *      (coexists with feature 017's `with-vision` and feature
 *      034's `with-arkit`).
 *
 * NO entitlements; NO additional Info.plist keys; NO
 * UIRequiredDeviceCapabilities mutation.
 *
 * Running the plugin twice on the same Expo config produces a
 * deep-equal config.
 */

import * as _cp from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';
const configPlugins = (_cp as { default?: typeof _cp }).default ?? _cp;
const { withInfoPlist } = configPlugins;
export const DEFAULT_CAMERA_USAGE_DESCRIPTION =
  'Used to demonstrate Apple RoomPlan LiDAR room capture.';

const withRoomPlan: ConfigPlugin = (config) => {
  return withInfoPlist(config, (cfg) => {
    if (!cfg.modResults.NSCameraUsageDescription) {
      cfg.modResults.NSCameraUsageDescription = DEFAULT_CAMERA_USAGE_DESCRIPTION;
    }
    return cfg;
  });
};

export default withRoomPlan;
