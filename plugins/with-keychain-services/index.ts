/**
 * Expo config plugin: with-keychain-services (feature 023).
 *
 * Adds `keychain-access-groups` entitlement with app's primary access group.
 * Idempotent — re-running on the same config is a no-op.
 * No-op + single console.warn when `ios.bundleIdentifier` is missing.
 */

import type { ConfigPlugin } from '@expo/config-plugins';
import { withEntitlementsPlist } from '@expo/config-plugins';

const withKeychainServices: ConfigPlugin = (config) => {
  const bundleId = config.ios?.bundleIdentifier;

  if (!bundleId) {
    console.warn(
      '[with-keychain-services] No ios.bundleIdentifier found in config — skipping keychain-access-groups',
    );
    return config;
  }

  return withEntitlementsPlist(config, (mod) => {
    const accessGroup = `$(AppIdentifierPrefix)${bundleId}`;
    const existing = (mod.modResults['keychain-access-groups'] as string[] | undefined) ?? [];

    if (!existing.includes(accessGroup)) {
      mod.modResults['keychain-access-groups'] = [...existing, accessGroup];
    }

    return mod;
  });
};

export default withKeychainServices;
