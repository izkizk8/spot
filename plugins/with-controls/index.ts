/**
 * with-controls — Expo config plugin for feature 087
 * (Controls Lab module).
 *
 * Prebuild-time operations (all idempotent):
 *
 *   1. Set NSSupportsControlCenter = true in Info.plist to document
 *      that this app ships ControlWidget extensions (iOS 18+).
 *
 * Running the plugin twice on the same Expo config produces a
 * deep-equal config.
 */
import * as _cp from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';
const configPlugins = (_cp as { default?: typeof _cp }).default ?? _cp;
const { withInfoPlist } = configPlugins;
export const CONTROLS_KEY = 'NSSupportsControlCenter' as const;
export const CONTROLS_VALUE = true as const;

export function applyControlsInfoPlist(
  infoPlist: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...infoPlist,
    [CONTROLS_KEY]: CONTROLS_VALUE,
  };
}

const withControls: ConfigPlugin = (config) => {
  return withInfoPlist(config, (cfg) => {
    cfg.modResults = applyControlsInfoPlist(cfg.modResults) as typeof cfg.modResults;
    return cfg;
  });
};

export default withControls;
