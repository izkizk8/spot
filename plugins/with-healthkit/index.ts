/**
 * with-healthkit — Expo config plugin for feature 043.
 *
 * Applies the three things every HealthKit-capable iOS app must add:
 *
 *   1. `NSHealthShareUsageDescription` on the parent target's
 *      Info.plist — the user-facing string shown in the read-permission
 *      sheet. We set this only if the key is missing or non-string;
 *      a developer-supplied string is preserved.
 *   2. `NSHealthUpdateUsageDescription` on the parent target's
 *      Info.plist — the write-permission sheet copy. Same policy.
 *   3. `com.apple.developer.healthkit` boolean entitlement on the
 *      parent target — set unconditionally to true (the iOS-required
 *      shape).
 *
 * The plugin is **idempotent**: re-running yields a byte-stable
 * Info.plist / entitlements set. It never deletes or rewrites unrelated
 * keys; the wrapper coexists byte-cleanly with every prior plugin in
 * the repo (keychain, sign-in-with-apple, app-groups, app-clips,
 * universal-links, etc.).
 *
 * Pure helpers `applyHealthKitUsageStrings` and
 * `applyHealthKitEntitlement` are exported so tests can assert the
 * mutation rules without driving the full mod runner.
 */

import * as _cp from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';
const configPlugins = (_cp as { default?: typeof _cp }).default ?? _cp;
const { withEntitlementsPlist, withInfoPlist } = configPlugins;
export const HEALTHKIT_SHARE_KEY = 'NSHealthShareUsageDescription';
export const HEALTHKIT_UPDATE_KEY = 'NSHealthUpdateUsageDescription';
export const HEALTHKIT_ENTITLEMENT_KEY = 'com.apple.developer.healthkit';

export const DEFAULT_SHARE_COPY =
  'Spot uses HealthKit to demonstrate reading step count, heart rate, sleep, workouts, and weight in the HealthKit Lab module.';
export const DEFAULT_UPDATE_COPY =
  'Spot uses HealthKit to demonstrate writing manual heart-rate and weight samples from the HealthKit Lab module.';

/**
 * Pure mutation: returns a new Info.plist record with the two HealthKit
 * usage strings populated. A pre-existing non-empty string is preserved
 * as-is. A missing or non-string value is replaced with our default
 * copy and a one-time warn is emitted on overwrite of a non-string.
 */
export function applyHealthKitUsageStrings(
  input: Record<string, unknown>,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...input };

  for (const [key, fallback] of [
    [HEALTHKIT_SHARE_KEY, DEFAULT_SHARE_COPY],
    [HEALTHKIT_UPDATE_KEY, DEFAULT_UPDATE_COPY],
  ] as const) {
    const prior = next[key];
    if (typeof prior === 'string' && prior.length > 0) {
      // Developer-supplied copy — keep it.
      continue;
    }
    if (prior !== undefined && typeof prior !== 'string') {
      console.warn(`with-healthkit: ${key} was not a string; replacing.`);
    }
    next[key] = fallback;
  }

  return next;
}

/**
 * Pure mutation: returns a new entitlements record with
 * `com.apple.developer.healthkit` set to true. Any prior non-boolean
 * value is replaced with a one-time warn.
 */
export function applyHealthKitEntitlement(input: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = { ...input };
  const prior = next[HEALTHKIT_ENTITLEMENT_KEY];
  if (prior !== undefined && typeof prior !== 'boolean') {
    console.warn(`with-healthkit: ${HEALTHKIT_ENTITLEMENT_KEY} was not a boolean; replacing.`);
  }
  next[HEALTHKIT_ENTITLEMENT_KEY] = true;
  return next;
}

const withHealthKit: ConfigPlugin = (config) => {
  let next = withInfoPlist(config, (mod) => {
    mod.modResults = applyHealthKitUsageStrings(
      mod.modResults as unknown as Record<string, unknown>,
    ) as typeof mod.modResults;
    return mod;
  });
  next = withEntitlementsPlist(next, (mod) => {
    mod.modResults = applyHealthKitEntitlement(
      mod.modResults as unknown as Record<string, unknown>,
    ) as typeof mod.modResults;
    return mod;
  });
  return next;
};

export default withHealthKit;
