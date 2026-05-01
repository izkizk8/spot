/**
 * Unit tests: live-stickers-lab module manifest (feature 083).
 */

import manifest from '@/modules/live-stickers-lab';
import type { ModuleManifest } from '@/modules/types';

describe('live-stickers-lab manifest', () => {
  it('has id "live-stickers-lab"', () => {
    expect(manifest.id).toBe('live-stickers-lab');
  });

  it('has a non-empty title', () => {
    expect(manifest.title.length).toBeGreaterThan(0);
  });

  it('has a non-empty description mentioning Live Stickers', () => {
    expect(manifest.description.length).toBeGreaterThan(0);
    expect(manifest.description).toMatch(/Live Stickers|sticker/i);
  });

  it('declares platforms as ["ios", "android", "web"]', () => {
    expect(manifest.platforms).toEqual(['ios', 'android', 'web']);
  });

  it('declares minIOS as "17.0"', () => {
    expect(manifest.minIOS).toBe('17.0');
  });

  it('exports a valid ModuleManifest structure', () => {
    const keys: (keyof ModuleManifest)[] = ['id', 'title', 'description', 'platforms', 'render'];
    keys.forEach((key) => {
      expect(manifest).toHaveProperty(key);
    });
  });

  it('has a render function (lazy)', () => {
    expect(typeof manifest.render).toBe('function');
  });
});
