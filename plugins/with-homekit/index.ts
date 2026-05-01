/**
 * with-homekit — Expo config plugin for feature 044.
 *
 * Adds the single Info.plist key required for HomeKit:
 *
 *   - `NSHomeKitUsageDescription` on the parent target's Info.plist —
 *     the user-facing string shown in the HomeKit permission sheet.
 *     We set this only if the key is missing or non-string; a
 *     developer-supplied string is preserved.
 *
 * The plugin is **idempotent**: re-running yields a byte-stable
 * Info.plist. It never deletes or rewrites unrelated keys; the
 * wrapper coexists byte-cleanly with every prior plugin in the repo.
 *
 * The pure helper `applyHomeKitUsageString` is exported so tests can
 * assert the mutation rules without driving the full mod runner.
 */

import type { ConfigPlugin } from '@expo/config-plugins';
import { withInfoPlist } from '@expo/config-plugins';

export const HOMEKIT_USAGE_KEY = 'NSHomeKitUsageDescription';

export const DEFAULT_USAGE_COPY =
  'Spot uses HomeKit to demonstrate listing homes, rooms and accessories, reading and writing characteristic values, and observing live updates in the HomeKit Lab module.';

/**
 * Pure mutation: returns a new Info.plist record with the HomeKit
 * usage string populated. A pre-existing non-empty string is
 * preserved as-is. A missing or non-string value is replaced with
 * our default copy and a one-time `console.warn` is emitted on
 * overwrite of a non-string.
 */
export function applyHomeKitUsageString(input: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = { ...input };
  const prior = next[HOMEKIT_USAGE_KEY];
  if (typeof prior === 'string' && prior.length > 0) {
    return next;
  }
  if (prior !== undefined && typeof prior !== 'string') {
    console.warn(`with-homekit: ${HOMEKIT_USAGE_KEY} was not a string; replacing.`);
  }
  next[HOMEKIT_USAGE_KEY] = DEFAULT_USAGE_COPY;
  return next;
}

const withHomeKit: ConfigPlugin = (config) => {
  return withInfoPlist(config, (mod) => {
    mod.modResults = applyHomeKitUsageString(
      mod.modResults as unknown as Record<string, unknown>,
    ) as typeof mod.modResults;
    return mod;
  });
};

export default withHomeKit;
