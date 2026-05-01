/**
 * with-shortcuts-snippets — Expo config plugin for feature 072
 * (Shortcuts Snippets Lab module).
 *
 * Prebuild-time operations (all idempotent):
 *
 *   1. Declare NSUserActivityTypes in Info.plist so the app can
 *      donate NSUserActivity-based shortcuts to the Shortcuts app.
 *
 * Running the plugin twice on the same Expo config produces a
 * deep-equal config.
 */
import * as _cp from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';
const configPlugins = (_cp as { default?: typeof _cp }).default ?? _cp;
const { withInfoPlist } = configPlugins;
export const USER_ACTIVITY_TYPES_KEY = 'NSUserActivityTypes' as const;
export const SHORTCUT_ACTIVITY_TYPE = 'com.spot.ShortcutsSnippetsActivity' as const;

export function applyShortcutsSnippetsInfoPlist(
  infoPlist: Record<string, unknown>,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...infoPlist };
  const existing = next[USER_ACTIVITY_TYPES_KEY];
  if (Array.isArray(existing)) {
    if (!existing.includes(SHORTCUT_ACTIVITY_TYPE)) {
      next[USER_ACTIVITY_TYPES_KEY] = [...existing, SHORTCUT_ACTIVITY_TYPE];
    }
  } else {
    next[USER_ACTIVITY_TYPES_KEY] = [SHORTCUT_ACTIVITY_TYPE];
  }
  return next;
}

const withShortcutsSnippets: ConfigPlugin = (config) => {
  return withInfoPlist(config, (cfg) => {
    cfg.modResults = applyShortcutsSnippetsInfoPlist(cfg.modResults) as typeof cfg.modResults;
    return cfg;
  });
};

export default withShortcutsSnippets;
