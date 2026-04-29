/**
 * Test: Activity Types Catalog
 * Feature: 033-share-sheet
 *
 * Structural invariants for the iOS activity types catalog plus
 * the two synthetic platform-fallback entries.
 *
 * @see specs/033-share-sheet/data-model.md Entity 5
 * @see specs/033-share-sheet/research.md §8
 * @see specs/033-share-sheet/tasks.md T003
 */

import { ACTIVITY_TYPES_CATALOG, WEB_CLIPBOARD_FALLBACK } from '@/modules/share-sheet-lab/activity-types';

describe('Activity Types Catalog', () => {
  it('contains exactly 12 iOS entries + 2 synthetic entries', () => {
    expect(ACTIVITY_TYPES_CATALOG).toHaveLength(14);

    const iosEntries = ACTIVITY_TYPES_CATALOG.filter(
      (e) => !e.synthetic,
    );
    const syntheticEntries = ACTIVITY_TYPES_CATALOG.filter(
      (e) => e.synthetic,
    );

    expect(iosEntries).toHaveLength(12);
    expect(syntheticEntries).toHaveLength(2);
  });

  it('each iOS id matches pattern /^com\\.apple\\.UIKit\\.activity\\.[A-Za-z]+$/', () => {
    const iosEntries = ACTIVITY_TYPES_CATALOG.filter(
      (e) => !e.synthetic,
    );

    iosEntries.forEach((entry) => {
      expect(entry.id).toMatch(/^com\.apple\.UIKit\.activity\.[A-Za-z]+$/);
    });
  });

  it('synthetic entries match pattern /^(web|android)\\.clipboard-fallback$/', () => {
    const syntheticEntries = ACTIVITY_TYPES_CATALOG.filter(
      (e) => e.synthetic,
    );

    syntheticEntries.forEach((entry) => {
      expect(entry.id).toMatch(/^(web|android)\.clipboard-fallback$/);
      expect(entry.synthetic).toMatch(/^(web|android)\.clipboard-fallback$/);
    });
  });

  it('all entries have non-empty labels', () => {
    ACTIVITY_TYPES_CATALOG.forEach((entry) => {
      expect(entry.label).toBeTruthy();
      expect(entry.label.trim().length).toBeGreaterThan(0);
    });
  });

  it('no duplicate ids', () => {
    const ids = ACTIVITY_TYPES_CATALOG.map((e) => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('synthetic entries are flagged by the synthetic literal field', () => {
    const syntheticEntries = ACTIVITY_TYPES_CATALOG.filter(
      (e) => e.synthetic,
    );

    expect(syntheticEntries).toHaveLength(2);
    expect(syntheticEntries.some((e) => e.id === 'web.clipboard-fallback')).toBe(true);
    expect(syntheticEntries.some((e) => e.id === 'android.clipboard-fallback')).toBe(true);
  });

  it('exports web.clipboard-fallback as a distinct constant', () => {
    expect(WEB_CLIPBOARD_FALLBACK).toBeDefined();
    expect(WEB_CLIPBOARD_FALLBACK.id).toBe('web.clipboard-fallback');
    expect(WEB_CLIPBOARD_FALLBACK.synthetic).toBe('web.clipboard-fallback');
  });
});
