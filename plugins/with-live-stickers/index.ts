/**
 * with-live-stickers — Expo config plugin for feature 083
 * (Live Stickers / VNGenerateForegroundInstanceMaskRequest).
 *
 * Prebuild-time operations (all idempotent):
 *
 *   1. Set `NSPhotoLibraryUsageDescription` in Info.plist when absent,
 *      preserving any operator-supplied value.
 *
 * Running the plugin twice on the same Expo config produces a
 * deep-equal config (idempotent).
 */

import type { ConfigPlugin } from '@expo/config-plugins';
import { withInfoPlist } from '@expo/config-plugins';

export const PHOTO_LIBRARY_KEY = 'NSPhotoLibraryUsageDescription' as const;

export const PHOTO_LIBRARY_USAGE =
  'Required to select photos for Live Stickers subject extraction.' as const;

/**
 * Apply the NSPhotoLibraryUsageDescription Info.plist key. Pure function —
 * exposed for unit tests so the plist-shape decision can be verified
 * without booting the full plugin chain.
 */
export function applyPhotoLibraryUsage(plist: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = { ...plist };
  if (next[PHOTO_LIBRARY_KEY] === undefined) {
    next[PHOTO_LIBRARY_KEY] = PHOTO_LIBRARY_USAGE;
  }
  return next;
}

const withLiveStickers: ConfigPlugin = (config) => {
  return withInfoPlist(config, (mod) => {
    mod.modResults = applyPhotoLibraryUsage(
      mod.modResults as Record<string, unknown>,
    ) as typeof mod.modResults;
    return mod;
  });
};

export default withLiveStickers;
