/**
 * with-vision — Expo config plugin for feature 017 (Camera + Vision Module).
 *
 * Prebuild-time operations (all idempotent):
 *   1. Add NSCameraUsageDescription to Info.plist if not already present,
 *      with the default copy "Used to demonstrate on-device Vision analysis".
 *   2. Preserve any existing NSCameraUsageDescription value (does not overwrite).
 *
 * Running the plugin twice on the same Expo config produces a deep-equal
 * config (FR-028).
 *
 * Coexists with features 007/014/015/016 without modifying their targets,
 * entitlements, or App Groups (FR-029).
 *
 * @see specs/017-camera-vision/tasks.md T019, T020
 */

import type { ConfigPlugin } from '@expo/config-plugins';
import { withInfoPlist } from '@expo/config-plugins';

const DEFAULT_CAMERA_USAGE_DESCRIPTION = 'Used to demonstrate on-device Vision analysis';

const withVision: ConfigPlugin = (config) => {
  // Add NSCameraUsageDescription if not already present
  return withInfoPlist(config, (cfg) => {
    // Only set if not already present (idempotent + preserves operator values)
    if (!cfg.modResults.NSCameraUsageDescription) {
      cfg.modResults.NSCameraUsageDescription = DEFAULT_CAMERA_USAGE_DESCRIPTION;
    }

    return cfg;
  });
};

export default withVision;
