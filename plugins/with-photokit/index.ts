import type { ConfigPlugin } from '@expo/config-plugins';
import { withInfoPlist } from '@expo/config-plugins';

export const PHOTO_LIBRARY_KEY = 'NSPhotoLibraryUsageDescription' as const;
export const PHOTO_LIBRARY_COPY =
  'Spot uses your photo library to demonstrate PHPickerViewController and photo asset access in the PhotoKit Lab.';

/**
 * Pure helper: write `NSPhotoLibraryUsageDescription` into infoPlist,
 * preserving any operator-supplied value.
 */
export function applyPhotoLibraryUsage(
  infoPlist: Record<string, unknown>,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...infoPlist };
  if (next[PHOTO_LIBRARY_KEY] === undefined) {
    next[PHOTO_LIBRARY_KEY] = PHOTO_LIBRARY_COPY;
  }
  return next;
}

const withPhotoKit: ConfigPlugin = (config) => {
  return withInfoPlist(config, (mod) => {
    mod.modResults = applyPhotoLibraryUsage(
      mod.modResults as Record<string, unknown>,
    ) as typeof mod.modResults;
    return mod;
  });
};

export default withPhotoKit;
