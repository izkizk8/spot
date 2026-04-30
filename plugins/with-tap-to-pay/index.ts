/**
 * with-tap-to-pay — Expo config plugin for feature 051
 * (Tap to Pay on iPhone Lab module).
 *
 * Prebuild-time operations (all idempotent):
 *
 *   1. Add `com.apple.developer.proximity-reader.payment.acceptance`
 *      entitlement to iOS entitlements plist (boolean true).
 *
 * The entitlement is Apple-restricted and requires enrollment in
 * the Tap to Pay program. This plugin adds the key to the Xcode
 * project; obtaining Apple approval is out of scope.
 *
 * Running the plugin twice on the same Expo config produces a
 * deep-equal config.
 */

import type { ConfigPlugin } from '@expo/config-plugins';
import { withEntitlementsPlist } from '@expo/config-plugins';

export const TAP_TO_PAY_ENTITLEMENT_KEY =
  'com.apple.developer.proximity-reader.payment.acceptance' as const;

/**
 * Apply the Tap to Pay entitlement. Pure function — exposed for
 * unit tests so the plist-shape decision can be verified without
 * booting the full plugin chain.
 */
export function applyTapToPayEntitlements(
  entitlements: Record<string, unknown>,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...entitlements };
  if (next[TAP_TO_PAY_ENTITLEMENT_KEY] === undefined) {
    next[TAP_TO_PAY_ENTITLEMENT_KEY] = true;
  }
  return next;
}

const withTapToPay: ConfigPlugin = (config) => {
  return withEntitlementsPlist(config, (cfg) => {
    cfg.modResults = applyTapToPayEntitlements(cfg.modResults) as typeof cfg.modResults;
    return cfg;
  });
};

export default withTapToPay;
