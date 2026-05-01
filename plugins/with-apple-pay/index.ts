/**
 * with-apple-pay — Expo config plugin for feature 049
 * (Apple Pay / PassKit Payment Lab module).
 *
 * Prebuild-time operations (all idempotent):
 *
 *   1. Set `com.apple.developer.in-app-payments` entitlement to
 *      a placeholder array containing
 *      `merchant.com.izkizk8.spot` ONLY when absent (P2) —
 *      preserving any operator-supplied merchant identifiers
 *      (P3).
 *
 * Adds NO Info.plist keys; NO framework links (Apple Pay's
 * PassKit framework is auto-linked by the Expo Module pod).
 *
 * Running the plugin twice on the same Expo config produces a
 * deep-equal config (P5 / SC-006).
 */

import * as _cp from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';
const configPlugins = (_cp as { default?: typeof _cp }).default ?? _cp;
const { withEntitlementsPlist } = configPlugins;
export const APPLE_PAY_ENTITLEMENT_KEY = 'com.apple.developer.in-app-payments' as const;

export const PLACEHOLDER_MERCHANT_IDS: readonly string[] = Object.freeze([
  'merchant.com.izkizk8.spot',
]);

/**
 * Apply the Apple Pay merchant-id entitlement. Pure function —
 * exposed for unit tests so the entitlement-shape decision can
 * be verified without booting the full plugin chain.
 */
export function applyApplePayEntitlement(
  entitlements: Record<string, unknown>,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...entitlements };
  if (next[APPLE_PAY_ENTITLEMENT_KEY] === undefined) {
    next[APPLE_PAY_ENTITLEMENT_KEY] = [...PLACEHOLDER_MERCHANT_IDS];
  }
  return next;
}

const withApplePay: ConfigPlugin = (config) => {
  return withEntitlementsPlist(config, (cfg) => {
    cfg.modResults = applyApplePayEntitlement(cfg.modResults) as typeof cfg.modResults;
    return cfg;
  });
};

export default withApplePay;
