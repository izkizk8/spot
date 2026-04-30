/**
 * Unit tests: core-image-lab module manifest (feature 064).
 */
import manifest from '@/modules/064-core-image';
import type { ModuleManifest } from '@/modules/types';

describe('core-image-lab manifest', () => {
  it('has id "core-image-lab"', () => {
    expect(manifest.id).toBe('core-image-lab');
  });

  it('has a non-empty title', () => {
    expect(manifest.title.length).toBeGreaterThan(0);
  });

  it('has a non-empty description mentioning Core Image', () => {
    expect(manifest.description.length).toBeGreaterThan(0);
    expect(manifest.description).toMatch(/Core Image/i);
  });

  it('declares platforms as ["ios", "android", "web"]', () => {
    expect(manifest.platforms).toEqual(['ios', 'android', 'web']);
  });

  it('declares minIOS as "13.0"', () => {
    expect(manifest.minIOS).toBe('13.0');
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
