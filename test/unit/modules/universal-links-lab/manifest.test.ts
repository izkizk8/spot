/**
 * Unit tests: universal-links-lab module manifest (feature 041).
 */

import manifest from '@/modules/universal-links-lab';
import type { ModuleManifest } from '@/modules/types';

describe('universal-links-lab manifest', () => {
  it('has id "universal-links-lab"', () => {
    expect(manifest.id).toBe('universal-links-lab');
  });

  it('has a non-empty title', () => {
    expect(manifest.title.length).toBeGreaterThan(0);
  });

  it('has a non-empty description', () => {
    expect(manifest.description.length).toBeGreaterThan(0);
  });

  it('declares platforms as ["ios", "android", "web"]', () => {
    expect(manifest.platforms).toEqual(['ios', 'android', 'web']);
  });

  it('declares minIOS as "9.0"', () => {
    expect(manifest.minIOS).toBe('9.0');
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
