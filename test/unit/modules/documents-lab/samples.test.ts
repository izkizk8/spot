/**
 * Test: samples.ts (bundled sample files descriptor)
 * Feature: 032-document-picker-quicklook
 *
 * Tests the static descriptor for the four bundled sample files.
 * Each sample resolves its URI at runtime via Asset.fromModule.
 *
 * @see specs/032-document-picker-quicklook/spec.md FR-006, US2
 */

import { Asset } from 'expo-asset';
import { SAMPLES } from '@/modules/documents-lab/samples';

// Mock expo-asset
jest.mock('expo-asset', () => ({
  Asset: {
    fromModule: jest.fn((moduleId) => ({
      localUri: `file://bundled/${moduleId}`,
    })),
  },
}));

describe('samples', () => {
  describe('SAMPLES array', () => {
    it('has exactly four entries', () => {
      expect(SAMPLES).toHaveLength(4);
    });

    it('includes entries for hello.txt, note.md, data.json, icon.png (no PDF)', () => {
      const ids = SAMPLES.map((s) => s.id);
      expect(ids).toContain('hello.txt');
      expect(ids).toContain('note.md');
      expect(ids).toContain('data.json');
      expect(ids).toContain('icon.png');
      // Explicitly no PDF per plan
      expect(ids).not.toContain('sample.pdf');
    });

    it('each entry has non-empty name, mimeType, and positive size', () => {
      SAMPLES.forEach((sample) => {
        expect(sample.name).toBeTruthy();
        expect(typeof sample.name).toBe('string');
        expect(sample.name.length).toBeGreaterThan(0);

        expect(sample.mimeType).toBeTruthy();
        expect(typeof sample.mimeType).toBe('string');

        expect(sample.size).toBeGreaterThan(0);
        expect(typeof sample.size).toBe('number');
      });
    });

    it('mimeTypes match expected values', () => {
      const byId = Object.fromEntries(SAMPLES.map((s) => [s.id, s]));

      expect(byId['hello.txt'].mimeType).toBe('text/plain');
      expect(byId['note.md'].mimeType).toBe('text/markdown');
      expect(byId['data.json'].mimeType).toBe('application/json');
      expect(byId['icon.png'].mimeType).toBe('image/png');
    });

    it('each entry exposes a requireAsset reference that yields a localUri when passed to Asset.fromModule', () => {
      SAMPLES.forEach((sample) => {
        expect(sample.requireAsset).toBeDefined();

        const asset = Asset.fromModule(sample.requireAsset);
        expect(asset.localUri).toBeTruthy();
        expect(typeof asset.localUri).toBe('string');
        expect(asset.localUri.length).toBeGreaterThan(0);
      });
    });
  });
});
