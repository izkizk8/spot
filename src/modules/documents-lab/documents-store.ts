/**
 * Documents Store (AsyncStorage-backed)
 * Feature: 032-document-picker-quicklook
 *
 * Pure `parsePersisted` + side-effectful `load` / `save` / `dropMissingURIs`.
 * The hook's only AsyncStorage boundary.
 *
 * @see specs/032-document-picker-quicklook/contracts/documents-store.contract.ts
 * @see specs/032-document-picker-quicklook/spec.md FR-009, FR-011, FR-012
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DocumentFilter } from './mime-types';

export const STORAGE_KEY = 'spot.documents.list' as const;

export interface DocumentEntry {
  readonly id: string;
  readonly name: string;
  readonly uri: string;
  readonly mimeType: string;
  readonly size: number;
  readonly addedAt: string; // ISO-8601
  readonly source: 'picker' | 'sample';
}

export interface DocumentsStoreState {
  readonly files: readonly DocumentEntry[];
  readonly filter: DocumentFilter;
}

export const DEFAULT_STATE: DocumentsStoreState = {
  files: [],
  filter: 'all',
} as const;

export type ParseErrorKind =
  | { readonly kind: 'parse'; readonly cause: unknown }
  | { readonly kind: 'shape'; readonly root: unknown }
  | { readonly kind: 'rows'; readonly dropped: number };

export interface ParseOptions {
  readonly onError?: (err: ParseErrorKind) => void;
}

export interface URIResolver {
  (uri: string): Promise<boolean>;
}

/**
 * Pure parser. Tolerates corrupt JSON / bad shapes per S3..S7.
 */
export function parsePersisted(raw: string | null, opts?: ParseOptions): DocumentsStoreState {
  // S3: null -> default state, no error
  if (raw === null) {
    return DEFAULT_STATE;
  }

  // S4: Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (cause) {
    opts?.onError?.({ kind: 'parse', cause });
    return DEFAULT_STATE;
  }

  // S5: Must be an object with files array
  if (typeof parsed !== 'object' || parsed === null || !('files' in parsed)) {
    opts?.onError?.({ kind: 'shape', root: parsed });
    return DEFAULT_STATE;
  }

  const obj = parsed as { files?: unknown; filter?: unknown };

  // Validate files array
  let files: DocumentEntry[] = [];
  let droppedCount = 0;

  if (Array.isArray(obj.files)) {
    for (const item of obj.files) {
      if (isValidEntry(item)) {
        files.push(item);
      } else {
        droppedCount++;
      }
    }
  }

  // S6: Fire onError once if any rows dropped
  if (droppedCount > 0) {
    opts?.onError?.({ kind: 'rows', dropped: droppedCount });
  }

  // S7: Validate filter, fall back to 'all'
  const validFilters: DocumentFilter[] = ['all', 'images', 'text', 'pdf'];
  const filter = validFilters.includes(obj.filter as DocumentFilter)
    ? (obj.filter as DocumentFilter)
    : 'all';

  return { files, filter };
}

/**
 * Validates that an entry has all required fields with correct types.
 */
function isValidEntry(item: unknown): item is DocumentEntry {
  if (typeof item !== 'object' || item === null) {
    return false;
  }

  const e = item as Record<string, unknown>;

  return (
    typeof e.id === 'string' &&
    typeof e.name === 'string' &&
    typeof e.uri === 'string' &&
    typeof e.mimeType === 'string' &&
    typeof e.size === 'number' &&
    Number.isFinite(e.size) &&
    typeof e.addedAt === 'string' &&
    (e.source === 'picker' || e.source === 'sample')
  );
}

/**
 * Loads state from AsyncStorage. Errors are funneled through onError.
 */
export async function load(opts?: ParseOptions): Promise<DocumentsStoreState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return parsePersisted(raw, opts);
  } catch (cause) {
    opts?.onError?.({ kind: 'parse', cause });
    return DEFAULT_STATE;
  }
}

/**
 * Persists state to AsyncStorage. Throws on error (caller must handle).
 */
export async function save(state: DocumentsStoreState): Promise<void> {
  const serialized = JSON.stringify(state);
  await AsyncStorage.setItem(STORAGE_KEY, serialized);
}

/**
 * Drops entries whose URI cannot be resolved (S8).
 * Resolver rejections are treated as false.
 */
export async function dropMissingURIs(
  state: DocumentsStoreState,
  resolver: URIResolver,
): Promise<DocumentsStoreState> {
  const results = await Promise.allSettled(
    state.files.map(async (entry) => {
      try {
        const exists = await resolver(entry.uri);
        return exists ? entry : null;
      } catch {
        return null;
      }
    }),
  );

  const files = results
    .map((r) => (r.status === 'fulfilled' ? r.value : null))
    .filter((entry): entry is DocumentEntry => entry !== null);

  return { ...state, files };
}

// Re-export types for convenience
export type { DocumentFilter };
