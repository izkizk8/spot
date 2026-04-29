/**
 * Spotlight bridge stub for Android — feature 031.
 *
 * The CoreSpotlight framework is iOS-only (FR-091). Every mutating
 * method rejects with `SpotlightNotSupported`; `isAvailable()`
 * returns `false`.
 */

import {
  SpotlightNotSupported,
  type SearchableItem,
  type SpotlightBridge,
  type UserActivityDescriptor,
} from './spotlight.types';

export { SpotlightNotSupported };

function reject(): Promise<never> {
  return Promise.reject(new SpotlightNotSupported('Spotlight indexing requires iOS 9+'));
}

const bridge: SpotlightBridge = Object.freeze({
  isAvailable: () => false,
  index: (_items: readonly SearchableItem[]): Promise<void> => reject(),
  delete: (_ids: readonly string[]): Promise<void> => reject(),
  deleteAll: (): Promise<void> => reject(),
  search: (_query: string, _limit?: number): Promise<readonly SearchableItem[]> => reject(),
  markCurrentActivity: (_descriptor: UserActivityDescriptor): Promise<void> => reject(),
  clearCurrentActivity: (): Promise<void> => reject(),
});

export const isAvailable = bridge.isAvailable;
export const index = bridge.index;
const deleteFn = bridge.delete;
export { deleteFn as delete };
export const deleteAll = bridge.deleteAll;
export const search = bridge.search;
export const markCurrentActivity = bridge.markCurrentActivity;
export const clearCurrentActivity = bridge.clearCurrentActivity;

export default bridge;
