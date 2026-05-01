/**
 * with-spotlight — Expo config plugin for feature 031.
 *
 * Idempotent, additive Info.plist mutation:
 *   - union-merges `NSUserActivityTypes` with the literal
 *     `'spot.showcase.activity'` (FR-110);
 *   - preserves every prior entry verbatim in source order (R-D / FR-113).
 *
 * Does NOT add `CoreSpotlight.framework` linkage — that comes from
 * the Swift sources' autolinking (R-E / FR-111).
 *
 * Pure helper `applySpotlightInfoPlist(modResults)` is exported
 * so unit tests can assert byte-identical idempotency without driving
 * the full mod runner.
 */

import * as _cp from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';
const configPlugins = (_cp as { default?: typeof _cp }).default ?? _cp;
const { withInfoPlist } = configPlugins;
export const ACTIVITY_TYPE = 'spot.showcase.activity' as const;

const USER_ACTIVITY_TYPES_KEY = 'NSUserActivityTypes';

/**
 * Pure mutation: returns a new `Record<string, unknown>` with
 * NSUserActivityTypes union-merged. Preserves prior entries' order;
 * appends the ACTIVITY_TYPE if not already present.
 */
export function applySpotlightInfoPlist(input: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = { ...input };

  const priorTypes = Array.isArray(next[USER_ACTIVITY_TYPES_KEY])
    ? (next[USER_ACTIVITY_TYPES_KEY] as unknown[]).filter((v): v is string => typeof v === 'string')
    : [];
  const mergedTypes = [...priorTypes];
  if (!mergedTypes.includes(ACTIVITY_TYPE)) {
    mergedTypes.push(ACTIVITY_TYPE);
  }
  next[USER_ACTIVITY_TYPES_KEY] = mergedTypes;

  return next;
}

const withSpotlight: ConfigPlugin = (config) => {
  return withInfoPlist(config, (mod) => {
    mod.modResults = applySpotlightInfoPlist(
      mod.modResults as unknown as Record<string, unknown>,
    ) as typeof mod.modResults;
    return mod;
  });
};

export default withSpotlight;
