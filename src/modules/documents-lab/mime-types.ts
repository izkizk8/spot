/**
 * MIME Type Helpers
 * Feature: 032-document-picker-quicklook
 *
 * Pure functions for MIME type detection, filtering, and formatting.
 * No React imports, no I/O.
 *
 * @see specs/032-document-picker-quicklook/spec.md FR-004, FR-010
 */

/**
 * Document filter type for picker and list filtering.
 */
export type DocumentFilter = 'all' | 'images' | 'text' | 'pdf';

/**
 * MIME type family classification.
 */
type MimeFamily = 'image' | 'text' | 'pdf' | 'other';

/**
 * Maps file extension to MIME type.
 * Case-insensitive.
 * Unknown extensions return 'application/octet-stream'.
 */
export function mimeFromExtension(nameOrExt: string): string {
  const lower = nameOrExt.toLowerCase();
  const ext = lower.includes('.') ? lower.slice(lower.lastIndexOf('.')) : lower;

  const mapping: Record<string, string> = {
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.pdf': 'application/pdf',
  };

  return mapping[ext] || 'application/octet-stream';
}

/**
 * Classifies a MIME type into one of four families.
 */
export function familyOfMime(mimeType: string): MimeFamily {
  const lower = mimeType.toLowerCase();

  if (lower.startsWith('image/')) {
    return 'image';
  }

  if (lower === 'text/plain' || lower === 'text/markdown' || lower === 'application/json') {
    return 'text';
  }

  if (lower === 'application/pdf') {
    return 'pdf';
  }

  return 'other';
}

/**
 * Converts a DocumentFilter to expo-document-picker's type parameter.
 */
export function pickerTypeForFilter(filter: DocumentFilter): string | string[] | undefined {
  switch (filter) {
    case 'all':
      return undefined; // expo-document-picker accepts undefined for all types
    case 'images':
      return 'image/*';
    case 'text':
      return ['text/plain', 'text/markdown', 'application/json'];
    case 'pdf':
      return 'application/pdf';
  }
}

/**
 * Checks if a document entry matches the given filter.
 */
export function filterMatchesEntry(filter: DocumentFilter, entry: { mimeType: string }): boolean {
  if (filter === 'all') {
    return true;
  }

  const family = familyOfMime(entry.mimeType);

  switch (filter) {
    case 'images':
      return family === 'image';
    case 'text':
      return family === 'text';
    case 'pdf':
      return family === 'pdf';
    default:
      return false;
  }
}

/**
 * Formats a byte count as a human-readable size string.
 * Returns '—' for negative or non-finite values.
 */
export function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '—';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}
