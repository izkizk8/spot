/**
 * with-visual-look-up — Expo config plugin for feature 060
 * (Visual Look Up Lab module).
 *
 * Prebuild-time operations (all idempotent):
 *   1. Add NSPhotoLibraryUsageDescription to Info.plist if not already
 *      present, with the default copy "Used to demonstrate Visual Look Up
 *      image analysis".
 *   2. Preserve any existing NSPhotoLibraryUsageDescription value
 *      (does not overwrite).
 *
 * Running the plugin twice on the same Expo config produces a deep-equal
 * config (idempotent).
 *
 * Coexists with all prior plugins without modifying their targets,
 * entitlements, or App Groups.
 *
 * @see specs/060-visual-look-up/tasks.md T011
 */

import * as _cp from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';
const configPlugins = (_cp as { default?: typeof _cp }).default ?? _cp;
const { withInfoPlist } = configPlugins;
export const PHOTO_LIBRARY_USAGE_KEY = 'NSPhotoLibraryUsageDescription' as const;

export const DEFAULT_PHOTO_LIBRARY_DESCRIPTION =
  'Used to demonstrate Visual Look Up image analysis';

/**
 * Pure helper: insert `NSPhotoLibraryUsageDescription` when absent.
 * Exported for direct unit testing without the full Expo mod chain.
 */
export function applyPhotoLibraryUsage(
  infoPlist: Record<string, unknown>,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...infoPlist };
  if (next[PHOTO_LIBRARY_USAGE_KEY] === undefined) {
    next[PHOTO_LIBRARY_USAGE_KEY] = DEFAULT_PHOTO_LIBRARY_DESCRIPTION;
  }
  return next;
}

const withVisualLookUp: ConfigPlugin = (config) => {
  return withInfoPlist(config, (cfg) => {
    cfg.modResults = applyPhotoLibraryUsage(
      cfg.modResults as Record<string, unknown>,
    ) as typeof cfg.modResults;
    return cfg;
  });
};

export default withVisualLookUp;
