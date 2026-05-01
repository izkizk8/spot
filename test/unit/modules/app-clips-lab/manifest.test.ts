/**
 * Unit tests: app-clips-lab module manifest (feature 042).
 */

import manifest from '@/modules/app-clips-lab';
import type { ModuleManifest } from '@/modules/types';

describe('app-clips-lab manifest', () => {
  it('has id "app-clips-lab"', () => {
    expect(manifest.id).toBe('app-clips-lab');
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

  it('declares minIOS as "14.0"', () => {
    expect(manifest.minIOS).toBe('14.0');
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
