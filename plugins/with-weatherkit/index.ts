/**
 * with-weatherkit — Expo config plugin for feature 046.
 *
 * Adds the single entitlement key required by Apple WeatherKit:
 *
 *   - `com.apple.developer.weatherkit` (boolean true) on the parent
 *     target's entitlements plist.
 *
 * The plugin is **idempotent**: re-running yields a byte-stable
 * entitlements plist. It never deletes or rewrites unrelated keys;
 * the wrapper coexists byte-cleanly with every prior plugin in the
 * repo.
 *
 * The pure helper `applyWeatherKitEntitlement` is exported so tests
 * can assert the mutation rules without driving the full mod runner.
 */

import type { ConfigPlugin } from '@expo/config-plugins';
import { withEntitlementsPlist } from '@expo/config-plugins';

export const WEATHERKIT_ENTITLEMENT_KEY = 'com.apple.developer.weatherkit' as const;

/**
 * Pure mutation: returns a new entitlements record with the
 * WeatherKit boolean entitlement set to `true`. Any prior non-boolean
 * value is replaced with a one-time `console.warn`. A pre-existing
 * boolean (whether true or false) is preserved.
 */
export function applyWeatherKitEntitlement(
  input: Record<string, unknown>,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...input };
  const prior = next[WEATHERKIT_ENTITLEMENT_KEY];

  if (typeof prior === 'boolean') {
    return next;
  }
  if (prior !== undefined) {
    console.warn(`with-weatherkit: ${WEATHERKIT_ENTITLEMENT_KEY} was not a boolean; replacing.`);
  }
  next[WEATHERKIT_ENTITLEMENT_KEY] = true;
  return next;
}

const withWeatherKit: ConfigPlugin = (config) => {
  return withEntitlementsPlist(config, (mod) => {
    mod.modResults = applyWeatherKitEntitlement(
      mod.modResults as unknown as Record<string, unknown>,
    ) as typeof mod.modResults;
    return mod;
  });
};

export default withWeatherKit;
