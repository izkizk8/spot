/**
 * Test: mime-types.ts (pure helpers)
 * Feature: 032-document-picker-quicklook
 *
 * Pure functions for MIME type detection, filtering, and formatting.
 * No React imports, no I/O.
 *
 * @see specs/032-document-picker-quicklook/spec.md FR-004, FR-010
 */

import {
  DocumentFilter,
  familyOfMime,
  filterMatchesEntry,
  formatSize,
  mimeFromExtension,
  pickerTypeForFilter,
} from '@/modules/documents-lab/mime-types';

describe('mime-types', () => {
  describe('mimeFromExtension', () => {
    it('returns text/plain for .txt', () => {
      expect(mimeFromExtension('.txt')).toBe('text/plain');
      expect(mimeFromExtension('document.txt')).toBe('text/plain');
    });

    it('returns text/markdown for .md', () => {
      expect(mimeFromExtension('.md')).toBe('text/markdown');
      expect(mimeFromExtension('README.md')).toBe('text/markdown');
    });

    it('returns application/json for .json', () => {
      expect(mimeFromExtension('.json')).toBe('application/json');
      expect(mimeFromExtension('data.json')).toBe('application/json');
    });

    it('returns image/png for .png', () => {
      expect(mimeFromExtension('.png')).toBe('image/png');
      expect(mimeFromExtension('icon.png')).toBe('image/png');
    });

    it('returns image/jpeg for .jpg and .jpeg', () => {
      expect(mimeFromExtension('.jpg')).toBe('image/jpeg');
      expect(mimeFromExtension('.jpeg')).toBe('image/jpeg');
      expect(mimeFromExtension('photo.jpg')).toBe('image/jpeg');
    });

    it('returns application/pdf for .pdf', () => {
      expect(mimeFromExtension('.pdf')).toBe('application/pdf');
      expect(mimeFromExtension('document.pdf')).toBe('application/pdf');
    });

    it('returns application/octet-stream for unknown extensions', () => {
      expect(mimeFromExtension('.xyz')).toBe('application/octet-stream');
      expect(mimeFromExtension('file.unknown')).toBe('application/octet-stream');
    });

    it('returns application/octet-stream for names with no extension', () => {
      expect(mimeFromExtension('noextension')).toBe('application/octet-stream');
      expect(mimeFromExtension('file')).toBe('application/octet-stream');
    });

    it('is case-insensitive', () => {
      expect(mimeFromExtension('.PNG')).toBe('image/png');
      expect(mimeFromExtension('.TXT')).toBe('text/plain');
      expect(mimeFromExtension('.Md')).toBe('text/markdown');
    });
  });

  describe('familyOfMime', () => {
    it('returns "image" for all image/* types', () => {
      expect(familyOfMime('image/png')).toBe('image');
      expect(familyOfMime('image/jpeg')).toBe('image');
      expect(familyOfMime('image/gif')).toBe('image');
      expect(familyOfMime('image/webp')).toBe('image');
    });

    it('returns "text" for text/plain, text/markdown, and application/json', () => {
      expect(familyOfMime('text/plain')).toBe('text');
      expect(familyOfMime('text/markdown')).toBe('text');
      expect(familyOfMime('application/json')).toBe('text');
    });

    it('returns "pdf" for application/pdf', () => {
      expect(familyOfMime('application/pdf')).toBe('pdf');
    });

    it('returns "other" for everything else', () => {
      expect(familyOfMime('application/zip')).toBe('other');
      expect(familyOfMime('video/mp4')).toBe('other');
      expect(familyOfMime('audio/mpeg')).toBe('other');
    });
  });

  describe('pickerTypeForFilter', () => {
    it('returns undefined or "*/*" for "all" filter', () => {
      const result = pickerTypeForFilter('all');
      expect(result === undefined || result === '*/*').toBe(true);
    });

    it('returns "image/*" for "images" filter', () => {
      expect(pickerTypeForFilter('images')).toBe('image/*');
    });

    it('returns array of text types for "text" filter', () => {
      const result = pickerTypeForFilter('text');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toContain('text/plain');
      expect(result).toContain('text/markdown');
      expect(result).toContain('application/json');
    });

    it('returns "application/pdf" for "pdf" filter', () => {
      expect(pickerTypeForFilter('pdf')).toBe('application/pdf');
    });
  });

  describe('filterMatchesEntry', () => {
    it('matches all entries for "all" filter', () => {
      expect(filterMatchesEntry('all', { mimeType: 'image/png' } as any)).toBe(true);
      expect(filterMatchesEntry('all', { mimeType: 'text/plain' } as any)).toBe(true);
      expect(filterMatchesEntry('all', { mimeType: 'application/pdf' } as any)).toBe(true);
      expect(filterMatchesEntry('all', { mimeType: 'video/mp4' } as any)).toBe(true);
    });

    it('matches only images for "images" filter', () => {
      expect(filterMatchesEntry('images', { mimeType: 'image/png' } as any)).toBe(true);
      expect(filterMatchesEntry('images', { mimeType: 'image/jpeg' } as any)).toBe(true);
      expect(filterMatchesEntry('images', { mimeType: 'text/plain' } as any)).toBe(false);
      expect(filterMatchesEntry('images', { mimeType: 'application/pdf' } as any)).toBe(false);
    });

    it('matches only text types for "text" filter', () => {
      expect(filterMatchesEntry('text', { mimeType: 'text/plain' } as any)).toBe(true);
      expect(filterMatchesEntry('text', { mimeType: 'text/markdown' } as any)).toBe(true);
      expect(filterMatchesEntry('text', { mimeType: 'application/json' } as any)).toBe(true);
      expect(filterMatchesEntry('text', { mimeType: 'image/png' } as any)).toBe(false);
      expect(filterMatchesEntry('text', { mimeType: 'application/pdf' } as any)).toBe(false);
    });

    it('matches only PDF for "pdf" filter', () => {
      expect(filterMatchesEntry('pdf', { mimeType: 'application/pdf' } as any)).toBe(true);
      expect(filterMatchesEntry('pdf', { mimeType: 'text/plain' } as any)).toBe(false);
      expect(filterMatchesEntry('pdf', { mimeType: 'image/png' } as any)).toBe(false);
    });
  });

  describe('formatSize', () => {
    it('formats 0 as "0 B"', () => {
      expect(formatSize(0)).toBe('0 B');
    });

    it('formats bytes below 1024 as "N B"', () => {
      expect(formatSize(1)).toBe('1 B');
      expect(formatSize(123)).toBe('123 B');
      expect(formatSize(1023)).toBe('1023 B');
    });

    it('formats 1024 as "1.0 KB"', () => {
      expect(formatSize(1024)).toBe('1.0 KB');
    });

    it('formats kilobytes with one decimal place', () => {
      expect(formatSize(2048)).toBe('2.0 KB');
      expect(formatSize(1536)).toBe('1.5 KB');
    });

    it('formats 1048576 (1 MB) as "1.0 MB"', () => {
      expect(formatSize(1048576)).toBe('1.0 MB');
    });

    it('formats megabytes with one decimal place', () => {
      expect(formatSize(2097152)).toBe('2.0 MB');
      expect(formatSize(1572864)).toBe('1.5 MB');
    });

    it('returns "—" for negative numbers', () => {
      expect(formatSize(-1)).toBe('—');
      expect(formatSize(-1024)).toBe('—');
    });

    it('returns "—" for non-finite values', () => {
      expect(formatSize(Infinity)).toBe('—');
      expect(formatSize(-Infinity)).toBe('—');
      expect(formatSize(NaN)).toBe('—');
    });
  });

  describe('DocumentFilter type', () => {
    it('accepts valid filter values', () => {
      const filters: DocumentFilter[] = ['all', 'images', 'text', 'pdf'];
      expect(filters).toHaveLength(4);
    });
  });
});
