/**
 * with-app-clips — Expo config plugin for feature 042.
 *
 * Educational scaffold-level plugin. App Clips require a separate Xcode
 * target with its own bundle id, entitlement file, Info.plist, build
 * phases, and signing identity — none of which a config plugin can
 * create reliably today (the @expo/config-plugins API exposes only the
 * primary target's mod-runner). This plugin therefore restricts itself
 * to additive, idempotent entitlement work on the *parent* target so
 * that turning the educational scaffold into a real App Clip is a
 * smaller manual lift later in Xcode:
 *
 *   - sets the placeholder boolean entitlement
 *     `com.apple.developer.on-demand-install-capable` on the parent
 *     target's entitlements plist (true). This is the boolean Apple
 *     reads to declare the app is App Clip aware. The actual sub-target
 *     entitlement file is authored in Xcode.
 *
 * Coexistence: the plugin only writes one specific key. It preserves
 * every other entitlement verbatim and never mutates a key it did not
 * set. Tests assert byte-stable idempotency and coexistence with the
 * keychain, sign-in-with-apple, app-groups, and universal-links
 * plugins.
 *
 * Pure helper `applyAppClipsEntitlement(modResults)` is exported so
 * unit tests can assert byte-identical idempotency without driving the
 * full mod runner.
 */

import type { ConfigPlugin } from '@expo/config-plugins';
import { withEntitlementsPlist } from '@expo/config-plugins';

export const APP_CLIPS_ENTITLEMENT_KEY = 'com.apple.developer.on-demand-install-capable';

/**
 * Pure mutation: returns a new `Record<string, unknown>` with the
 * App Clip placeholder boolean entitlement set to `true`. Any prior
 * value (including non-boolean values) is replaced; we warn once on
 * non-boolean overwrites so a developer who set the key manually sees
 * the diff in build output.
 */
export function applyAppClipsEntitlement(input: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = { ...input };
  const prior = next[APP_CLIPS_ENTITLEMENT_KEY];

  if (prior !== undefined && typeof prior !== 'boolean') {
    console.warn(`with-app-clips: ${APP_CLIPS_ENTITLEMENT_KEY} was not a boolean; replacing.`);
  }

  next[APP_CLIPS_ENTITLEMENT_KEY] = true;
  return next;
}

const withAppClips: ConfigPlugin = (config) => {
  return withEntitlementsPlist(config, (mod) => {
    mod.modResults = applyAppClipsEntitlement(
      mod.modResults as unknown as Record<string, unknown>,
    ) as typeof mod.modResults;
    return mod;
  });
};

export default withAppClips;
