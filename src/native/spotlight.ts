/**
 * Spotlight JS bridge — iOS variant — feature 031.
 *
 * Single seam where the iOS-only `Spotlight` native module is touched.
 * Resolves to a no-op (rejecting) bridge on Android, Web, and iOS<9 /
 * when the optional native module is absent.
 *
 * Mutating method calls are serialised through a single closure-scoped
 * promise chain so back-to-back calls produce native invocations in
 * submission order even when an earlier call rejects (R-A / FR-103).
 *
 * @see specs/031-spotlight-indexing/contracts/spotlight-bridge.contract.ts
 */

import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

import {
  DEFAULT_SEARCH_LIMIT,
  NATIVE_MODULE_NAME,
  SpotlightNotSupported,
  type SearchableItem,
  type SpotlightBridge,
  type UserActivityDescriptor,
} from './spotlight.types';

export { SpotlightNotSupported };

interface NativeSpotlight {
  index(items: readonly SearchableItem[]): Promise<void>;
  delete(ids: readonly string[]): Promise<void>;
  deleteAll(): Promise<void>;
  search(query: string, limit: number): Promise<readonly SearchableItem[]>;
  markCurrentActivity(descriptor: UserActivityDescriptor): Promise<void>;
  clearCurrentActivity(): Promise<void>;
}

const native = requireOptionalNativeModule<NativeSpotlight>(NATIVE_MODULE_NAME);

function getIOSVersion(): number {
  if (Platform.OS !== 'ios') return 0;
  const v = Platform.Version;
  return typeof v === 'string' ? parseFloat(v) : v;
}

function isReady(): boolean {
  return Platform.OS === 'ios' && getIOSVersion() >= 9 && native != null;
}

/**
 * Single in-memory promise chain. Every mutating call queues onto this
 * chain so that even if an earlier call rejects, the next call still
 * executes (R-A). The chain stores `unknown` because each link's value
 * is irrelevant to the next.
 */
let chain: Promise<unknown> = Promise.resolve();

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const result = chain.then(fn, fn);
  // Swallow rejections on the chain reference itself so subsequent
  // appends are not poisoned. Callers still observe the rejection
  // through the returned `result` promise.
  chain = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

const bridge: SpotlightBridge = Object.freeze({
  isAvailable: (): boolean => isReady(),

  index: (items: readonly SearchableItem[]): Promise<void> => {
    if (!isReady() || native == null) {
      return Promise.reject(new SpotlightNotSupported('Spotlight indexing requires iOS 9+'));
    }
    return enqueue(() => native.index(items));
  },

  delete: (ids: readonly string[]): Promise<void> => {
    if (!isReady() || native == null) {
      return Promise.reject(new SpotlightNotSupported('Spotlight indexing requires iOS 9+'));
    }
    return enqueue(() => native.delete(ids));
  },

  deleteAll: (): Promise<void> => {
    if (!isReady() || native == null) {
      return Promise.reject(new SpotlightNotSupported('Spotlight indexing requires iOS 9+'));
    }
    return enqueue(() => native.deleteAll());
  },

  search: (query: string, limit?: number): Promise<readonly SearchableItem[]> => {
    if (!isReady() || native == null) {
      return Promise.reject(new SpotlightNotSupported('Spotlight indexing requires iOS 9+'));
    }
    // search is NOT serialised (read-only operation)
    return native.search(query, limit ?? DEFAULT_SEARCH_LIMIT);
  },

  markCurrentActivity: (descriptor: UserActivityDescriptor): Promise<void> => {
    if (!isReady() || native == null) {
      return Promise.reject(new SpotlightNotSupported('Spotlight indexing requires iOS 9+'));
    }
    return enqueue(() => native.markCurrentActivity(descriptor));
  },

  clearCurrentActivity: (): Promise<void> => {
    if (!isReady() || native == null) {
      return Promise.reject(new SpotlightNotSupported('Spotlight indexing requires iOS 9+'));
    }
    return enqueue(() => native.clearCurrentActivity());
  },
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
