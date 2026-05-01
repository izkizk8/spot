/**
 * Expo config plugin for Local Authentication (feature 022).
 *
 * Adds `NSFaceIDUsageDescription` to the iOS Info.plist idempotently. Does
 * not overwrite a pre-existing customized value.
 */

import * as _cp from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';
const configPlugins = (_cp as { default?: typeof _cp }).default ?? _cp;
const { withInfoPlist } = configPlugins;
const DEFAULT_USAGE =
  'This app uses Face ID to demonstrate biometric authentication in the Local Auth showcase module.';

const withLocalAuth: ConfigPlugin = (config) => {
  return withInfoPlist(config, (modConfig) => {
    const key = 'NSFaceIDUsageDescription';
    const existing = modConfig.modResults[key];
    if (existing === undefined || existing === null || existing === '') {
      modConfig.modResults[key] = DEFAULT_USAGE;
    }
    return modConfig;
  });
};

export default withLocalAuth;
