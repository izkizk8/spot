/**
 * Pure mapper from the iOS Showcase module registry to
 * SearchableItem[] consumed by the Spotlight bridge — feature 031.
 *
 * @see specs/031-spotlight-indexing/contracts/searchable-items-source.contract.ts
 */

import type { SearchableItem } from '@/native/spotlight.types';
import { DOMAIN_IDENTIFIER as DOMAIN_ID } from '@/native/spotlight.types';

export const DOMAIN_IDENTIFIER = DOMAIN_ID;

/**
 * Minimum shape the mapper requires from a registry entry.
 */
export interface RegistryEntryLike {
  readonly id: string;
  readonly title?: string;
  readonly description?: string;
  readonly keywords?: readonly string[];
}

/**
 * Discriminated union of degraded-input signals.
 */
export type MapErrorSignal =
  | { readonly kind: 'duplicate-id'; readonly id: string }
  | { readonly kind: 'minimal-metadata'; readonly moduleId: string };

export interface MapOptions {
  readonly onError?: (err: MapErrorSignal) => void;
}

/**
 * Maps a registry to a deduplicated, fallback-applied SearchableItem[].
 * Pure function: no React imports, no I/O, no global mutation.
 *
 * @param registry The source registry entries
 * @param opts Optional callbacks for error signaling
 * @returns Array of SearchableItems with unique IDs
 */
export function mapRegistryToItems(
  registry: readonly RegistryEntryLike[],
  opts?: MapOptions,
): SearchableItem[] {
  const { onError } = opts ?? {};
  const result: SearchableItem[] = [];
  const seenIds = new Set<string>();
  const reportedDuplicates = new Set<string>();

  for (const entry of registry) {
    const id = `${DOMAIN_IDENTIFIER}.${entry.id}`;

    // Handle duplicate IDs (first-wins strategy)
    if (seenIds.has(id)) {
      // Fire onError exactly once per duplicate id
      if (!reportedDuplicates.has(id)) {
        reportedDuplicates.add(id);
        onError?.({ kind: 'duplicate-id', id });
      }
      continue;
    }
    seenIds.add(id);

    // Apply fallbacks for missing/empty fields
    const title = entry.title?.trim() || entry.id;
    const hasMinimalMetadata = !entry.title?.trim();

    if (hasMinimalMetadata) {
      onError?.({ kind: 'minimal-metadata', moduleId: entry.id });
    }

    const item: SearchableItem = {
      id,
      title,
      contentDescription: entry.description ?? '',
      keywords: entry.keywords ? [...entry.keywords] : [],
      domainIdentifier: DOMAIN_IDENTIFIER,
    };

    result.push(item);
  }

  return result;
}
