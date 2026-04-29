/**
 * Focus Filters bridge types.
 *
 * @see specs/029-focus-filters/contracts/focus-filters-bridge.contract.ts
 */

import type { ShowcaseFilterPersistedPayload } from '@/modules/focus-filters-lab/filter-modes';

// Re-export for convenience
export type { ShowcaseFilterPersistedPayload };

/**
 * Thrown by getCurrentFilterValues() on non-iOS / iOS < 16 / when the
 * native module is absent (FR-FF-016, FR-FF-017).
 */
export class FocusFiltersNotSupported extends Error {
  constructor(message?: string) {
    super(message ?? 'FocusFiltersNotSupported');
    this.name = 'FocusFiltersNotSupported';
  }
}

/**
 * The JS bridge interface exposed by focus-filters.ts.
 */
export interface FocusFiltersBridge {
  /**
   * Returns true if getCurrentFilterValues() will succeed (iOS 16+ with
   * native module linked). Returns false on Android / Web / iOS < 16 /
   * or when the optional native module is absent.
   */
  isAvailable(): boolean;

  /**
   * Reads the latest persisted filter values from App Group UserDefaults.
   * Returns null if no payload exists yet or if parse fails. Rejects with
   * FocusFiltersNotSupported if the platform/version gate fails.
   *
   * @throws {FocusFiltersNotSupported} on non-iOS / iOS < 16 / module absent
   */
  getCurrentFilterValues(): Promise<ShowcaseFilterPersistedPayload | null>;
}
