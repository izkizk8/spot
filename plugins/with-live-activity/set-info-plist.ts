/**
 * Config plugin to set NSSupportsLiveActivities in the main app's Info.plist.
 *
 * MUST be idempotent — running twice MUST NOT duplicate or flip the value.
 *
 * @see specs/007-live-activities-dynamic-island/tasks.md T009
 */

import { ConfigPlugin, withInfoPlist } from '@expo/config-plugins';

/**
 * Adds `NSSupportsLiveActivities = true` to the iOS app's Info.plist.
 */
export const withLiveActivityInfoPlist: ConfigPlugin = (config) => {
  return withInfoPlist(config, (cfg) => {
    // Idempotent: only set if not already true
    if (cfg.modResults.NSSupportsLiveActivities !== true) {
      cfg.modResults.NSSupportsLiveActivities = true;
    }
    return cfg;
  });
};

export default withLiveActivityInfoPlist;
