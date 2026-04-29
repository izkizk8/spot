/**
 * Focus Filters bridge stub for Android.
 *
 * Focus Filters require iOS 16+. This stub always returns unavailable
 * and rejects all calls (FR-FF-016).
 *
 * @see specs/029-focus-filters/contracts/focus-filters-bridge.contract.ts
 */

import type { ShowcaseFilterPersistedPayload, FocusFiltersBridge } from './focus-filters.types';
import { FocusFiltersNotSupported } from './focus-filters.types';

export { FocusFiltersNotSupported };
export type { ShowcaseFilterPersistedPayload };

const bridge: FocusFiltersBridge = Object.freeze({
  isAvailable(): boolean {
    return false;
  },

  async getCurrentFilterValues(): Promise<ShowcaseFilterPersistedPayload | null> {
    throw new FocusFiltersNotSupported('Focus Filters require iOS 16+');
  },
});

export const isAvailable = bridge.isAvailable;
export const getCurrentFilterValues = bridge.getCurrentFilterValues;
