/**
 * Expo config plugin for Sign in with Apple (feature 021).
 *
 * Adds the `com.apple.developer.applesignin = ["Default"]` entitlement to the
 * iOS entitlements plist idempotently. Does not overwrite a pre-existing
 * customized value.
 */

import type { ConfigPlugin } from '@expo/config-plugins';
import { withEntitlementsPlist } from '@expo/config-plugins';

const withSignInWithApple: ConfigPlugin = (config) => {
  return withEntitlementsPlist(config, (modConfig) => {
    const key = 'com.apple.developer.applesignin';
    const existing = modConfig.modResults[key];

    if (existing === undefined) {
      modConfig.modResults[key] = ['Default'];
    } else if (Array.isArray(existing)) {
      // If it's an array, only add Default if it's not already there
      if (!existing.includes('Default')) {
        modConfig.modResults[key] = [...existing, 'Default'];
      }
      // Otherwise leave it unchanged (already has Default)
    }
    // If existing is defined but not an array, leave it unchanged

    return modConfig;
  });
};

export default withSignInWithApple;
