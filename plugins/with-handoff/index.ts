/**
 * with-handoff — Expo config plugin for feature 040.
 *
 * Idempotent, additive Info.plist mutation:
 *   - union-merges `NSUserActivityTypes` with
 *     `'com.izkizk8.spot.activity.handoff-demo'` (FR-004);
 *   - preserves every prior entry verbatim in source order (FR-003).
 *   - coexists with `with-spotlight` (031) in either plugin order (FR-005).
 *
 * Pure helper `applyHandoffInfoPlist(modResults)` is exported
 * so unit tests can assert byte-identical idempotency without driving
 * the full mod runner.
 */

import * as _cp from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';
const configPlugins = (_cp as { default?: typeof _cp }).default ?? _cp;
const { withInfoPlist } = configPlugins;
import { HANDOFF_DEMO_ACTIVITY_TYPE } from '../../src/modules/handoff-lab/activity-types.ts';

const USER_ACTIVITY_TYPES_KEY = 'NSUserActivityTypes';

/**
 * Pure mutation: returns a new `Record<string, unknown>` with
 * NSUserActivityTypes union-merged. Preserves prior entries' order;
 * appends HANDOFF_DEMO_ACTIVITY_TYPE if not already present.
 * Defensive: missing or non-array input is treated as [].
 */
export function applyHandoffInfoPlist(input: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = { ...input };

  const prior = next[USER_ACTIVITY_TYPES_KEY];
  let priorTypes: string[] = [];

  if (Array.isArray(prior)) {
    priorTypes = prior.filter((v): v is string => typeof v === 'string');
  } else if (prior !== undefined) {
    console.warn('with-handoff: NSUserActivityTypes was not an array; replacing.');
  }

  const mergedTypes = [...priorTypes];
  if (!mergedTypes.includes(HANDOFF_DEMO_ACTIVITY_TYPE)) {
    mergedTypes.push(HANDOFF_DEMO_ACTIVITY_TYPE);
  }

  next[USER_ACTIVITY_TYPES_KEY] = mergedTypes;
  return next;
}

const withHandoff: ConfigPlugin = (config) => {
  return withInfoPlist(config, (mod) => {
    mod.modResults = applyHandoffInfoPlist(
      mod.modResults as unknown as Record<string, unknown>,
    ) as typeof mod.modResults;
    return mod;
  });
};

export default withHandoff;
