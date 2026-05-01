/**
 * Contract: pure mapper from the iOS Showcase module registry to
 * the `SearchableItem[]` shape consumed by the Spotlight bridge.
 *
 * @feature 031-spotlight-indexing
 * @see specs/031-spotlight-indexing/spec.md FR-020..024, AC-SPL-005, EC-003, EC-004
 * @see specs/031-spotlight-indexing/data-model.md Entity 1 (SearchableItem)
 * @see specs/031-spotlight-indexing/research.md §2 (R-B)
 *
 * Implementation file:
 *   - src/modules/spotlight-lab/searchable-items-source.ts
 *
 * INVARIANTS (asserted by `searchable-items-source.test.ts`):
 *   S1. The function is PURE: no React imports, no I/O, no global
 *       mutation. Calling twice with the same input produces
 *       identical output (excluding `onError` invocations).
 *   S2. Output ids are unique. Duplicates in the input drop the
 *       second occurrence and fire `onError({ kind: 'duplicate-id',
 *       id })` exactly once per duplicate.
 *   S3. Output ids are deterministic:
 *       `id === ` + DOMAIN_IDENTIFIER + `.` + module.id`.
 *   S4. Empty / missing `module.title` falls back to `module.id`
 *       and fires `onError({ kind: 'minimal-metadata',
 *       moduleId })` exactly once.
 *   S5. Empty / missing `module.keywords` falls back to `[]`. No
 *       error is fired (an empty keyword set is a valid mapping,
 *       not a regression).
 *   S6. Empty / missing `module.description` falls back to `''`.
 *   S7. Every output item has
 *       `domainIdentifier === DOMAIN_IDENTIFIER`.
 *   S8. `onError` is invoked AT MOST ONCE per duplicate id and AT
 *       MOST ONCE per minimal-metadata module. The mapper does NOT
 *       throw on degraded input.
 */

import type { SearchableItem } from './spotlight-bridge.contract';
import { DOMAIN_IDENTIFIER } from './spotlight-bridge.contract';

/**
 * Minimum shape the mapper requires from a registry entry. The
 * project-wide `ModuleManifest` (from `src/modules/types.ts`)
 * satisfies this by structural typing; the mapper does NOT depend
 * on any other ModuleManifest field.
 */
export interface RegistryEntryLike {
  readonly id: string;
  readonly title?: string;
  readonly description?: string;
  readonly keywords?: readonly string[];
}

/**
 * Discriminated union of degraded-input signals. The hook supplies
 * the callback and translates each signal into its `error` channel
 * (FR-024 / FR-104). Using a discriminated union (rather than a
 * generic `Error`) lets the hook decide whether to surface a
 * user-visible warning (`'duplicate-id'`) or merely log
 * (`'minimal-metadata'`).
 */
export type MapErrorSignal =
  | { readonly kind: 'duplicate-id'; readonly id: string }
  | { readonly kind: 'minimal-metadata'; readonly moduleId: string };

export interface MapOptions {
  /**
   * Invoked at most once per degraded input — see invariant S8.
   * The hook supplies this so the mapper stays React-free.
   */
  readonly onError?: (err: MapErrorSignal) => void;
}

/**
 * Maps a registry to a deduplicated, fallback-applied
 * `SearchableItem[]`. Pure (S1).
 *
 * @throws never (S8) — degraded input degrades to a valid item or
 *                     is dropped, with onError fired exactly once
 */
export type MapRegistryToItems = (
  registry: readonly RegistryEntryLike[],
  opts?: MapOptions,
) => readonly SearchableItem[];

/**
 * Re-export the frozen domain identifier so consumers can assert
 * the contract without importing from the bridge contract directly.
 */
export { DOMAIN_IDENTIFIER };

export interface SearchableItemsSource {
  readonly mapRegistryToItems: MapRegistryToItems;
}
