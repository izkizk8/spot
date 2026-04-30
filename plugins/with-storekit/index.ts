/**
 * with-storekit — Expo config plugin for feature 050
 * (StoreKit 2 / In-App Purchase Lab module).
 *
 * Prebuild-time operations (all idempotent):
 *
 *   1. Set `SKStoreKitConfigurationFilePath` Info.plist hint
 *      to a placeholder `Configuration.storekit` ONLY when
 *      absent — preserving operator-supplied values.
 *
 * No entitlement is required for IAP. Adds NO framework links
 * (StoreKit is auto-linked by the Expo Module pod).
 *
 * Running the plugin twice on the same Expo config produces a
 * deep-equal config.
 */

import type { ConfigPlugin } from '@expo/config-plugins';
import { withInfoPlist } from '@expo/config-plugins';

export const STOREKIT_INFOPLIST_KEY = 'SKStoreKitConfigurationFilePath' as const;

export const PLACEHOLDER_CONFIG_FILE_PATH = 'Configuration.storekit' as const;

/**
 * Apply the StoreKit configuration-file Info.plist hint. Pure
 * function — exposed for unit tests so the plist-shape decision
 * can be verified without booting the full plugin chain.
 */
export function applyStoreKitInfoPlist(
  infoPlist: Record<string, unknown>,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...infoPlist };
  if (next[STOREKIT_INFOPLIST_KEY] === undefined) {
    next[STOREKIT_INFOPLIST_KEY] = PLACEHOLDER_CONFIG_FILE_PATH;
  }
  return next;
}

const withStoreKit: ConfigPlugin = (config) => {
  return withInfoPlist(config, (cfg) => {
    cfg.modResults = applyStoreKitInfoPlist(cfg.modResults) as typeof cfg.modResults;
    return cfg;
  });
};

export default withStoreKit;
