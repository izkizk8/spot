/**
 * Contract: JS bridge to the iOS CoreSpotlight + NSUserActivity surfaces.
 *
 * @feature 031-spotlight-indexing
 * @see specs/031-spotlight-indexing/spec.md FR-090..093, AC-SPL-007
 * @see specs/031-spotlight-indexing/data-model.md Entities 1, 2, 5
 * @see specs/031-spotlight-indexing/research.md §1 (R-A serialisation)
 *
 * Implementation files:
 *   - src/native/spotlight.ts         (iOS path)
 *   - src/native/spotlight.android.ts (throws everywhere except isAvailable)
 *   - src/native/spotlight.web.ts     (same as android)
 *   - src/native/spotlight.types.ts   (re-exports the types here)
 *
 * INVARIANTS (asserted by `test/unit/native/spotlight.test.ts`):
 *   B1. Native module name is the literal string 'Spotlight'.
 *       (Distinct from 013 'AppIntents', 014 'WidgetCenter',
 *        029 'FocusFilters', 030 'BackgroundTasks'.)
 *   B2. On non-iOS / iOS < 9, every method except `isAvailable`
 *       throws `SpotlightNotSupported`. `isAvailable()` returns
 *       `false`.
 *   B3. Mutating method calls (`index`, `delete`, `deleteAll`,
 *       `markCurrentActivity`, `clearCurrentActivity`) are
 *       serialised through a single closure-scoped promise chain
 *       inherited verbatim from 030's `enqueue` helper. Two
 *       back-to-back mutations produce native invocations in
 *       submission order even if the first rejects (research §1).
 *   B4. Read-only `search` and `isAvailable` are NOT serialised;
 *       a search may resolve in parallel with a pending mutation.
 *   B5. `domainIdentifier` on every `SearchableItem` is the frozen
 *       literal `'com.izkizk8.spot.modules'` (FR-022 / DECISION 2).
 *   B6. `activityType` on every `NSUserActivity` is the frozen
 *       literal `'spot.showcase.activity'` (FR-062 / DECISION 3).
 *       This literal is also the entry the plugin appends to
 *       `NSUserActivityTypes` in `Info.plist` (FR-110 /
 *       with-spotlight-plugin.contract.ts).
 *   B7. Default `limit` for `search(query, limit?)` is 25 when
 *       omitted (FR-052 / DECISION 4).
 */

export const NATIVE_MODULE_NAME = 'Spotlight' as const;

/** Frozen literal — see invariant B5. */
export const DOMAIN_IDENTIFIER = 'com.izkizk8.spot.modules' as const;

/** Frozen literal — see invariant B6. */
export const ACTIVITY_TYPE = 'spot.showcase.activity' as const;

/** Default search limit — see invariant B7. */
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
  readonly userInfo?: Readonly<Record<string, string>>;
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
 * Typed error class for cross-platform branching at the import
 * boundary. Consumers MAY `instanceof`-check.
 */
export declare class SpotlightNotSupported extends Error {
  readonly name: 'SpotlightNotSupported';
  constructor(message?: string);
}

export interface SpotlightBridge {
  /** Returns true on iOS 9+ when the native module is loadable AND
   *  `CSSearchableIndex.isIndexingAvailable()` returns true. */
  readonly isAvailable: () => boolean;

  /**
   * Indexes the supplied items via a single batch call to
   * `CSSearchableIndex.default().indexSearchableItems(...)`. Every
   * item carries `domainIdentifier = DOMAIN_IDENTIFIER` (B5).
   *
   * @throws SpotlightNotSupported on non-iOS / iOS < 9.
   */
  readonly index: (items: readonly SearchableItem[]) => Promise<void>;

  /**
   * Deletes the supplied ids via a single batch call to
   * `CSSearchableIndex.default().deleteSearchableItems(withIdentifiers:)`.
   *
   * @throws SpotlightNotSupported on non-iOS / iOS < 9.
   */
  readonly delete: (ids: readonly string[]) => Promise<void>;

  /**
   * Deletes every item this module owns via
   * `CSSearchableIndex.default().deleteSearchableItems(withDomainIdentifiers:
   *   [DOMAIN_IDENTIFIER])`. Other apps' / other domains' items
   * are NOT touched.
   *
   * @throws SpotlightNotSupported on non-iOS / iOS < 9.
   */
  readonly deleteAll: () => Promise<void>;

  /**
   * Runs a `CSSearchQuery` against `CSSearchableIndex.default()`
   * and resolves with the mapped `SearchableItem[]`, capped at
   * `limit` (default 25 per B7). The Swift indexer is responsible
   * for the queryString construction (FR-083) — the JS side passes
   * the user's raw input verbatim.
   *
   * Empty / whitespace-only queries are rejected at the UI layer
   * (FR-051 / EC-005); the bridge does NOT validate the query.
   *
   * @throws SpotlightNotSupported on non-iOS / iOS < 9.
   */
  readonly search: (
    query: string,
    limit?: number,
  ) => Promise<readonly SearchableItem[]>;

  /**
   * Creates an `NSUserActivity(activityType: ACTIVITY_TYPE)` (B6),
   * sets the descriptor's title / keywords / userInfo, sets
   * `isEligibleForSearch = true` and `isEligibleForPrediction =
   * true`, calls `becomeCurrent()`, and retains the instance for
   * later invalidation. If a previous activity is still retained,
   * it is invalidated first (no two activities can be current
   * simultaneously per Apple's API contract).
   *
   * @throws SpotlightNotSupported on non-iOS.
   */
  readonly markCurrentActivity: (
    descriptor: UserActivityDescriptor,
  ) => Promise<void>;

  /**
   * Calls `resignCurrent()` then `invalidate()` on the retained
   * activity and releases it. No-op if no activity is currently
   * retained (idempotent).
   *
   * @throws SpotlightNotSupported on non-iOS.
   */
  readonly clearCurrentActivity: () => Promise<void>;
}
