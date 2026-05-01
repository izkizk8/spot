/**
 * Expo config plugin for Local Authentication (feature 022).
 *
 * Adds `NSFaceIDUsageDescription` to the iOS Info.plist idempotently. Does
 * not overwrite a pre-existing customized value.
 */

import type { ConfigPlugin } from '@expo/config-plugins';
import { withInfoPlist } from '@expo/config-plugins';

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
