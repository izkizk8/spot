/**
 * Unit tests: coredata-cloudkit-lab module manifest (feature 052).
 */

import manifest from '@/modules/coredata-cloudkit-lab';
import type { ModuleManifest } from '@/modules/types';

describe('coredata-cloudkit-lab manifest', () => {
  it('has id "coredata-cloudkit-lab"', () => {
    expect(manifest.id).toBe('coredata-cloudkit-lab');
  });

  it('has a non-empty title', () => {
    expect(manifest.title.length).toBeGreaterThan(0);
  });

  it('has a non-empty description mentioning CloudKit', () => {
    expect(manifest.description.length).toBeGreaterThan(0);
    expect(manifest.description).toMatch(/CloudKit/i);
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
