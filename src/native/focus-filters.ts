/**
 * Focus Filters bridge for iOS 16+.
 *
 * The single seam where the iOS-only `FocusFilters` native symbol is
 * touched. Resolves to a no-op (rejecting) bridge on Android, Web,
 * and iOS < 16.
 *
 * Mirrors the app-intents.ts pattern.
 *
 * @see specs/029-focus-filters/contracts/focus-filters-bridge.contract.ts
 */

import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

import { parseFilterPayload } from '@/modules/focus-filters-lab/filter-modes';
import {
  FocusFiltersNotSupported,
  type ShowcaseFilterPersistedPayload,
  type FocusFiltersBridge,
} from './focus-filters.types';

export { FocusFiltersNotSupported };
export type { ShowcaseFilterPersistedPayload };

interface NativeFocusFilters {
  getCurrentFilterValues(): Promise<ShowcaseFilterPersistedPayload | null>;
}

const native = requireOptionalNativeModule<NativeFocusFilters>('FocusFilters');

function getIOSVersion(): number {
  if (Platform.OS !== 'ios') return 0;
  const v = Platform.Version;
  return typeof v === 'string' ? parseFloat(v) : v;
}

/**
 * Dedup-warn map: keyed by error-class + payload-shape, capped at 64
 * entries (R-D / R6). Evicts oldest on overflow.
 */
const warnedShapes = new Map<string, true>();
const MAX_WARN_CACHE = 64;

function safeStringifyShape(input: unknown): string {
  try {
    if (typeof input === 'object' && input !== null) {
      return JSON.stringify(Object.keys(input).sort());
    }
    return typeof input;
  } catch {
    return 'unstringifiable';
  }
}

function dedupWarn(input: unknown): void {
  if (!__DEV__) return;

  const key = `malformed:${safeStringifyShape(input)}`;
  if (warnedShapes.has(key)) return;

  // Evict oldest if at cap
  if (warnedShapes.size >= MAX_WARN_CACHE) {
    const firstKey = warnedShapes.keys().next().value;
    if (firstKey) warnedShapes.delete(firstKey);
  }

  warnedShapes.set(key, true);
  console.warn('[FocusFilters] Failed to parse filter payload from native module:', input);
}

const bridge: FocusFiltersBridge = Object.freeze({
  isAvailable(): boolean {
    return Platform.OS === 'ios' && getIOSVersion() >= 16 && native != null;
  },

  async getCurrentFilterValues(): Promise<ShowcaseFilterPersistedPayload | null> {
    if (!bridge.isAvailable() || native == null) {
      throw new FocusFiltersNotSupported('Focus Filters require iOS 16+');
    }

    try {
      const raw = await native.getCurrentFilterValues();
      if (raw === null) return null;

      const parsed = parseFilterPayload(raw);
      if (parsed === null) {
        dedupWarn(raw);
        return null;
      }

      return parsed;
    } catch (err) {
      // Swallow native errors and return null (defensive)
      if (__DEV__) {
        console.warn('[FocusFilters] Native call failed:', err);
      }
      return null;
    }
  },
});

export const isAvailable = bridge.isAvailable;
export const getCurrentFilterValues = bridge.getCurrentFilterValues;
