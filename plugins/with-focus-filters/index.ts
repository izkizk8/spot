/**
 * with-focus-filters — Expo config plugin for feature 029.
 *
 * Adds the two Focus Filter Swift sources to the main app target.
 * Idempotent and commutative with all prior plugins (007/013/014/026/027/028).
 * No new entitlements, no new targets.
 *
 * @see specs/029-focus-filters/tasks.md T048, T049
 */

import type { ConfigPlugin } from '@expo/config-plugins';
import { withFocusFiltersSwiftSources } from './add-swift-sources';

const withFocusFilters: ConfigPlugin = (config) => {
  return withFocusFiltersSwiftSources(config);
};

export default withFocusFilters;
