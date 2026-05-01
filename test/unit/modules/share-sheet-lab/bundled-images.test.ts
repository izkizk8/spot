/**
 * Test: Bundled Images Catalog
 * Feature: 033-share-sheet
 *
 * Structural invariants for the bundled sample images.
 *
 * @see specs/033-share-sheet/data-model.md (bundled images reference)
 * @see specs/033-share-sheet/tasks.md T004
 */

import { BUNDLED_IMAGES } from '@/modules/share-sheet-lab/bundled-images';

describe('Bundled Images Catalog', () => {
  it('contains exactly four entries', () => {
    expect(BUNDLED_IMAGES).toHaveLength(4);
  });

  it('each entry exposes a non-empty alt string', () => {
    BUNDLED_IMAGES.forEach((entry) => {
      expect(typeof entry.alt).toBe('string');
      expect(entry.alt.trim().length).toBeGreaterThan(0);
    });
  });

  it('each entry exposes a source value (require() module id or test mock)', () => {
    BUNDLED_IMAGES.forEach((entry) => {
      // In production: number (metro resolver)
      // In Jest: object with testUri property (jest-expo resolver)
      expect(entry.source).toBeDefined();
      expect(entry.source).not.toBeNull();
    });
  });

  it('no duplicate alt texts', () => {
    const alts = BUNDLED_IMAGES.map((e) => e.alt);
    const uniqueAlts = new Set(alts);
    expect(uniqueAlts.size).toBe(alts.length);
  });
});
