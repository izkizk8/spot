/**
 * with-arkit — Expo config plugin for feature 034 (ARKit Basics Module).
 *
 * Prebuild-time operations (all idempotent):
 *   1. Add NSCameraUsageDescription to Info.plist if not already present,
 *      with the default copy "Used to demonstrate ARKit world tracking and plane detection.".
 *   2. Preserve any existing NSCameraUsageDescription value (coexists with feature 017's with-vision).
 *   3. Append 'arkit' to UIRequiredDeviceCapabilities if absent; no-op if already present.
 *   4. NO face-tracking strings added (FR-017).
 *
 * Running the plugin twice on the same Expo config produces a deep-equal
 * config (SC-008, FR-018).
 *
 * Coexists with feature 017's with-vision plugin (SC-009).
 *
 * @see specs/034-arkit-basics/tasks.md T031, T032, T033
 */

import * as _cp from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';
const configPlugins = (_cp as { default?: typeof _cp }).default ?? _cp;
const { withInfoPlist } = configPlugins;
const DEFAULT_CAMERA_USAGE_DESCRIPTION =
  'Used to demonstrate ARKit world tracking and plane detection.';

const withArkit: ConfigPlugin = (config) => {
  return withInfoPlist(config, (cfg) => {
    // 1. Add NSCameraUsageDescription if not already present (coexists with 017)
    if (!cfg.modResults.NSCameraUsageDescription) {
      cfg.modResults.NSCameraUsageDescription = DEFAULT_CAMERA_USAGE_DESCRIPTION;
    }

    // 2. Append 'arkit' to UIRequiredDeviceCapabilities if absent
    const caps = (cfg.modResults.UIRequiredDeviceCapabilities || []) as string[];
    if (!caps.includes('arkit')) {
      cfg.modResults.UIRequiredDeviceCapabilities = [...caps, 'arkit'];
    }

    return cfg;
  });
};

export default withArkit;
