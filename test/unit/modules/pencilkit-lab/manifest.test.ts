/**
 * Unit tests: pencilkit-lab module manifest (feature 082).
 */

import manifest from '@/modules/pencilkit-lab';
import type { ModuleManifest } from '@/modules/types';

describe('pencilkit-lab manifest', () => {
  it('has id "pencilkit-lab"', () => {
    expect(manifest.id).toBe('pencilkit-lab');
  });

  it('has a non-empty title', () => {
    expect(manifest.title.length).toBeGreaterThan(0);
  });

  it('has a non-empty description mentioning PencilKit', () => {
    expect(manifest.description.length).toBeGreaterThan(0);
    expect(manifest.description).toMatch(/PencilKit/i);
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
