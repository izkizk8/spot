/**
 * Unit tests: controls-lab module manifest (feature 087).
 */
import manifest from '@/modules/controls-lab';
import type { ModuleManifest } from '@/modules/types';

describe('controls-lab manifest', () => {
  it('has id "controls-lab"', () => {
    expect(manifest.id).toBe('controls-lab');
  });

  it('has a non-empty title', () => {
    expect(manifest.title.length).toBeGreaterThan(0);
  });

  it('has a non-empty description mentioning Control', () => {
    expect(manifest.description.length).toBeGreaterThan(0);
    expect(manifest.description).toMatch(/Control/i);
  });

  it('declares platforms as ["ios", "android", "web"]', () => {
    expect(manifest.platforms).toEqual(['ios', 'android', 'web']);
  });

  it('declares minIOS as "18.0"', () => {
    expect(manifest.minIOS).toBe('18.0');
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
