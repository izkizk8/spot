/**
 * with-background-tasks — Expo config plugin for feature 030.
 *
 * Idempotent, additive Info.plist mutation:
 *   - union-merges `BGTaskSchedulerPermittedIdentifiers` with the two
 *     task identifier literals (FR-090);
 *   - union-merges `UIBackgroundModes` with `['fetch','processing']`
 *     while preserving every prior entry verbatim — including feature
 *     025's `'location'` (FR-091 / EC-007).
 *
 * Pure helper `applyBackgroundTasksInfoPlist(modResults)` is exported
 * so unit tests can assert byte-identical idempotency without driving
 * the full mod runner.
 */

import type { ConfigPlugin } from '@expo/config-plugins';
import { withInfoPlist } from '@expo/config-plugins';

export const TASK_IDENTIFIER_REFRESH = 'com.izkizk8.spot.refresh' as const;
export const TASK_IDENTIFIER_PROCESSING = 'com.izkizk8.spot.processing' as const;

const PERMITTED_IDS_KEY = 'BGTaskSchedulerPermittedIdentifiers';
const BACKGROUND_MODES_KEY = 'UIBackgroundModes';

const REQUIRED_IDENTIFIERS: readonly string[] = [
  TASK_IDENTIFIER_REFRESH,
  TASK_IDENTIFIER_PROCESSING,
];

const REQUIRED_BACKGROUND_MODES: readonly string[] = ['fetch', 'processing'];

/**
 * Pure mutation: returns a new `Record<string, unknown>` with the two
 * keys union-merged. Preserves prior entries' order; appends new
 * entries in the order declared in REQUIRED_*.
 */
export function applyBackgroundTasksInfoPlist(
  input: Record<string, unknown>,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...input };

  const priorIds = Array.isArray(next[PERMITTED_IDS_KEY])
    ? (next[PERMITTED_IDS_KEY] as unknown[]).filter(
        (v): v is string => typeof v === 'string',
      )
    : [];
  const mergedIds = [...priorIds];
  for (const id of REQUIRED_IDENTIFIERS) {
    if (!mergedIds.includes(id)) mergedIds.push(id);
  }
  next[PERMITTED_IDS_KEY] = mergedIds;

  const priorModes = Array.isArray(next[BACKGROUND_MODES_KEY])
    ? (next[BACKGROUND_MODES_KEY] as unknown[]).filter(
        (v): v is string => typeof v === 'string',
      )
    : [];
  const mergedModes = [...priorModes];
  for (const m of REQUIRED_BACKGROUND_MODES) {
    if (!mergedModes.includes(m)) mergedModes.push(m);
  }
  next[BACKGROUND_MODES_KEY] = mergedModes;

  return next;
}

const withBackgroundTasks: ConfigPlugin = (config) => {
  return withInfoPlist(config, (mod) => {
    mod.modResults = applyBackgroundTasksInfoPlist(
      mod.modResults as unknown as Record<string, unknown>,
    ) as typeof mod.modResults;
    return mod;
  });
};

export default withBackgroundTasks;
