/**
 * Config plugin for Core Location Lab (feature 025).
 *
 * Sets NSLocationWhenInUseUsageDescription and NSLocationAlwaysAndWhenInUseUsageDescription
 * in Info.plist, and adds 'location' to UIBackgroundModes for geofencing support.
 */
import type { ConfigPlugin } from '@expo/config-plugins';
import { withInfoPlist } from '@expo/config-plugins';

const WHEN_IN_USE_KEY = 'NSLocationWhenInUseUsageDescription';
const ALWAYS_KEY = 'NSLocationAlwaysAndWhenInUseUsageDescription';
const BACKGROUND_MODES_KEY = 'UIBackgroundModes';

const WHEN_IN_USE_COPY =
  'Spot uses your location for live updates, region monitoring (geofencing), heading/compass, and significant location changes in the Core Location Lab.';

const ALWAYS_COPY =
  'Spot uses your location in the background for region monitoring (geofencing) to notify you when entering or exiting monitored areas.';

const withCoreLocation: ConfigPlugin = (config) => {
  return withInfoPlist(config, (mod) => {
    // Set location usage descriptions (idempotent: only write if different)
    if (mod.modResults[WHEN_IN_USE_KEY] !== WHEN_IN_USE_COPY) {
      mod.modResults[WHEN_IN_USE_KEY] = WHEN_IN_USE_COPY;
    }

    if (mod.modResults[ALWAYS_KEY] !== ALWAYS_COPY) {
      mod.modResults[ALWAYS_KEY] = ALWAYS_COPY;
    }

    // Add 'location' to UIBackgroundModes if not present
    const modes = (mod.modResults[BACKGROUND_MODES_KEY] as string[] | undefined) ?? [];
    if (!modes.includes('location')) {
      mod.modResults[BACKGROUND_MODES_KEY] = [...modes, 'location'];
    }

    return mod;
  });
};

export default withCoreLocation;
