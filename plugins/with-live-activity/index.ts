/**
 * Live Activity config plugin for Expo.
 *
 * Composes:
 * 1. set-info-plist.ts — sets NSSupportsLiveActivities = true
 * 2. add-widget-extension.ts — adds the Widget Extension target
 *
 * Both steps are idempotent. Running `expo prebuild --clean` twice
 * produces identical output (FR-022, SC-008).
 *
 * @see specs/007-live-activities-dynamic-island/tasks.md T011
 */

import { ConfigPlugin } from '@expo/config-plugins';
import { withLiveActivityInfoPlist } from './set-info-plist';
import { withLiveActivityWidgetExtension } from './add-widget-extension';

/**
 * Main config plugin that sets up Live Activities support.
 * No options required.
 */
const withLiveActivity: ConfigPlugin = (config) => {
  // Step 1: Set NSSupportsLiveActivities in Info.plist
  config = withLiveActivityInfoPlist(config);

  // Step 2: Add Widget Extension target
  config = withLiveActivityWidgetExtension(config);

  return config;
};

export default withLiveActivity;
