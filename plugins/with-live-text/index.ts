/**
 * with-live-text — Expo config plugin for feature 080
 * (Live Text Lab module).
 *
 * Prebuild-time operations (all idempotent):
 *
 *   1. Inject NSCameraUsageDescription into Info.plist so the app
 *      can request camera access for DataScannerViewController.
 *
 * Running the plugin twice on the same Expo config produces a
 * deep-equal config.
 */
import type { ConfigPlugin } from '@expo/config-plugins';
import { withInfoPlist } from '@expo/config-plugins';

export const CAMERA_USAGE_KEY = 'NSCameraUsageDescription' as const;
export const CAMERA_USAGE_COPY =
  'This app uses the camera to scan text with DataScannerViewController.' as const;

export function applyLiveTextInfoPlist(
  infoPlist: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...infoPlist,
    [CAMERA_USAGE_KEY]: CAMERA_USAGE_COPY,
  };
}

const withLiveText: ConfigPlugin = (config) => {
  return withInfoPlist(config, (cfg) => {
    cfg.modResults = applyLiveTextInfoPlist(cfg.modResults) as typeof cfg.modResults;
    return cfg;
  });
};

export default withLiveText;
