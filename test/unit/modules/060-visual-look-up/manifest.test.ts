/**
 * Unit tests: visual-look-up-lab module manifest (feature 060).
 */

import manifest from '@/modules/visual-look-up-lab';
import type { ModuleManifest } from '@/modules/types';

describe('visual-look-up-lab manifest', () => {
  it('has id "visual-look-up-lab"', () => {
    expect(manifest.id).toBe('visual-look-up-lab');
  });

  it('has a non-empty title', () => {
    expect(manifest.title.length).toBeGreaterThan(0);
  });

  it('has a non-empty description mentioning Visual Look Up', () => {
    expect(manifest.description.length).toBeGreaterThan(0);
    expect(manifest.description).toMatch(/Visual Look Up/i);
  });

  it('declares platforms as ["ios", "android", "web"]', () => {
    expect(manifest.platforms).toEqual(['ios', 'android', 'web']);
  });

  it('declares minIOS as "15.0"', () => {
    expect(manifest.minIOS).toBe('15.0');
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
