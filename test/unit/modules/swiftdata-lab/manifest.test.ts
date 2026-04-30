/**
 * Unit tests: swiftdata-lab module manifest (feature 053).
 */

import manifest from '@/modules/swiftdata-lab';
import type { ModuleManifest } from '@/modules/types';

describe('swiftdata-lab manifest', () => {
  it('has id "swiftdata-lab"', () => {
    expect(manifest.id).toBe('swiftdata-lab');
  });

  it('has a non-empty title', () => {
    expect(manifest.title.length).toBeGreaterThan(0);
  });

  it('has a non-empty description mentioning SwiftData', () => {
    expect(manifest.description.length).toBeGreaterThan(0);
    expect(manifest.description).toMatch(/SwiftData/i);
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
