/**
 * Spotlight bridge types — feature 031.
 *
 * Cross-platform-safe: importing this module on Android/Web/iOS
 * does NOT touch any iOS-only native bridge. The runtime variants
 * (`spotlight.{ts,android.ts,web.ts}`) re-export the symbols
 * defined here.
 *
 * @see specs/031-spotlight-indexing/contracts/spotlight-bridge.contract.ts
 */

/** Native module name expected by `requireOptionalNativeModule(...)` (B1). */
export const NATIVE_MODULE_NAME = 'Spotlight' as const;

/** Frozen literal for `domainIdentifier` on every SearchableItem (B5/FR-022). */
export const DOMAIN_IDENTIFIER = 'com.izkizk8.spot.modules' as const;

/** Frozen literal for the NSUserActivity type (B6/FR-062). */
export const ACTIVITY_TYPE = 'spot.showcase.activity' as const;

/** Namespaced ID prefix for searchable item IDs (derived from DOMAIN_IDENTIFIER). */
export const ID_NAMESPACE = 'com.izkizk8.spot.modules' as const;

/** Default search limit — see invariant B7 (FR-052/DECISION 4). */
export const DEFAULT_SEARCH_LIMIT = 25 as const;

/**
 * One indexable record. Mapped from a registry entry by
 * `searchable-items-source.ts` (R-B).
 */
export interface SearchableItem {
  readonly id: string;
  readonly title: string;
  readonly contentDescription: string;
  readonly keywords: readonly string[];
  readonly domainIdentifier: typeof DOMAIN_IDENTIFIER;
}

/**
 * Payload for `markCurrentActivity(...)`. The Swift helper
 * augments this with `isEligibleForSearch = true`,
 * `isEligibleForPrediction = true`, and
 * `activityType = ACTIVITY_TYPE`.
 */
export interface UserActivityDescriptor {
  readonly title: string;
  readonly keywords: readonly string[];
  readonly userInfo?: Readonly<Record<string, unknown>>;
}

/**
 * Per-item in-memory mirror used by `useSpotlightIndex.ts`.
 * Authoritative state is the system index, which may evict at any
 * time (DECISION 5 / EC-006). NOT persisted.
 */
export type IndexedState = 'indexed' | 'not indexed';

/**
 * Status pill value on `UserActivityCard`. Mirrors the live
 * `NSUserActivity`'s lifecycle. NOT persisted.
 */
export type ActivityState = 'active' | 'inactive';

/**
 * Thrown by every mutating bridge method on non-iOS / iOS<9 / when the
 * native module is absent (FR-091/FR-092).
 */
export class SpotlightNotSupported extends Error {
  override readonly name = 'SpotlightNotSupported' as const;

  constructor(message?: string) {
    super(message ?? 'SpotlightNotSupported');
    // Restore prototype for instanceof across transpilation targets
    Object.setPrototypeOf(this, SpotlightNotSupported.prototype);
  }
}

/**
 * Typed bridge surface matching the contract.
 */
export interface SpotlightBridge {
  /** Returns true on iOS 9+ when the native module is loadable. */
  readonly isAvailable: () => boolean;

  /**
   * Indexes the supplied items via a single batch call to
   * `CSSearchableIndex.default().indexSearchableItems(...)`.
   * @throws SpotlightNotSupported on non-iOS / iOS < 9.
   */
  readonly index: (items: readonly SearchableItem[]) => Promise<void>;

  /**
   * Deletes the supplied ids via a single batch call.
   * @throws SpotlightNotSupported on non-iOS / iOS < 9.
   */
  readonly delete: (ids: readonly string[]) => Promise<void>;

  /**
   * Deletes every item this module owns via domainIdentifier.
   * @throws SpotlightNotSupported on non-iOS / iOS < 9.
   */
  readonly deleteAll: () => Promise<void>;

  /**
   * Runs a CSSearchQuery and resolves with the mapped SearchableItem[].
   * @throws SpotlightNotSupported on non-iOS / iOS < 9.
   */
  readonly search: (
    query: string,
    limit?: number,
  ) => Promise<readonly SearchableItem[]>;

  /**
   * Creates an NSUserActivity with the given descriptor.
   * @throws SpotlightNotSupported on non-iOS.
   */
  readonly markCurrentActivity: (
    descriptor: UserActivityDescriptor,
  ) => Promise<void>;

  /**
   * Invalidates the current activity.
   * @throws SpotlightNotSupported on non-iOS.
   */
  readonly clearCurrentActivity: () => Promise<void>;
}
