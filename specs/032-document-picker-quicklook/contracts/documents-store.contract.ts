/**
 * Contract: AsyncStorage-backed documents store.
 *
 * @feature 032-document-picker-quicklook
 * @see specs/032-document-picker-quicklook/spec.md FR-009, FR-011, FR-012
 * @see specs/032-document-picker-quicklook/data-model.md Entities 1, 2, 3
 * @see specs/032-document-picker-quicklook/research.md §3 (R-C tolerance)
 *
 * Implementation files:
 *   - src/modules/documents-lab/documents-store.ts
 *   - src/modules/documents-lab/mime-types.ts (DocumentFilter type)
 *
 * INVARIANTS (asserted by `documents-store.test.ts`):
 *   S1. STORAGE_KEY === 'spot.documents.list' (frozen literal).
 *   S2. The default state is `{ files: [], filter: 'all' }`.
 *   S3. `parsePersisted(null)` returns the default state without
 *       firing onError.
 *   S4. `parsePersisted(invalidJson)` returns the default state
 *       and fires `onError` exactly once with the parse error.
 *   S5. `parsePersisted(nonObjectRoot)` returns the default state
 *       and fires `onError` exactly once with a shape error.
 *   S6. Per-row validation drops any DocumentEntry missing required
 *       fields or with non-string types or non-finite size; the
 *       remaining valid rows are kept. `onError` is fired once per
 *       parse pass (not once per dropped row) when at least one
 *       row was dropped.
 *   S7. `filter` field with an unrecognised value silently falls
 *       back to `'all'` (NOT an error).
 *   S8. `dropMissingURIs(state, resolver)` drops every entry whose
 *       resolver returns false; resolver rejections are treated as
 *       false (the row is dropped, the rest survive).
 *   S9. Duplicates in `files` are explicitly allowed (FR-005 AS3).
 *       The store does NOT dedupe.
 */

export const STORAGE_KEY = 'spot.documents.list' as const;

/** See manifest.contract.ts / mime-types.ts — re-export for tests. */
export type DocumentFilter = 'all' | 'images' | 'text' | 'pdf';

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

/** Pure parser. See invariants S2..S7. */
export type ParsePersisted = (
  raw: string | null,
  opts?: ParseOptions,
) => DocumentsStoreState;

/**
 * Reads `spot.documents.list` from AsyncStorage and parses it.
 * Errors are funnelled through `opts.onError` per S4..S6.
 */
export type Load = (opts?: ParseOptions) => Promise<DocumentsStoreState>;

/**
 * Persists the supplied state under `spot.documents.list`. Errors
 * are NOT swallowed — the caller (the hook) is expected to surface
 * them on its `error` channel.
 */
export type Save = (state: DocumentsStoreState) => Promise<void>;

/**
 * Drops every entry whose URI cannot be resolved (per S8). The
 * resolver is injected so tests can supply a deterministic mock and
 * production code can supply the real
 * `FileSystem.getInfoAsync(...).exists` probe.
 */
export type DropMissingURIs = (
  state: DocumentsStoreState,
  resolver: URIResolver,
) => Promise<DocumentsStoreState>;
