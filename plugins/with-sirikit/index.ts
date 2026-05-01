/**
 * with-sirikit — Expo config plugin for feature 071
 * (SiriKit Custom Intents Lab module).
 *
 * Prebuild-time operations (all idempotent):
 *
 *   1. Set NSSiriUsageDescription in Info.plist when absent —
 *      preserving operator-supplied values.
 *
 * Running the plugin twice on the same Expo config produces a
 * deep-equal config.
 */
import type { ConfigPlugin } from '@expo/config-plugins';
import { withInfoPlist } from '@expo/config-plugins';

export const SIRI_USAGE_KEY = 'NSSiriUsageDescription' as const;
export const SIRI_USAGE_COPY =
  'Spot uses Siri to demonstrate SiriKit Custom Intents, including messaging, note-taking, and reminder domains.' as const;

export function applySiriKitInfoPlist(infoPlist: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = { ...infoPlist };
  if (next[SIRI_USAGE_KEY] === undefined) {
    next[SIRI_USAGE_KEY] = SIRI_USAGE_COPY;
  }
  return next;
}

const withSiriKit: ConfigPlugin = (config) => {
  return withInfoPlist(config, (cfg) => {
    cfg.modResults = applySiriKitInfoPlist(cfg.modResults) as typeof cfg.modResults;
    return cfg;
  });
};

export default withSiriKit;
