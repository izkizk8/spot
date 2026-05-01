/**
 * Unit tests: photokit-lab module manifest (feature 057).
 */

import manifest from '@/modules/photokit-lab';
import type { ModuleManifest } from '@/modules/types';

describe('photokit-lab manifest', () => {
  it('has id "photokit-lab"', () => {
    expect(manifest.id).toBe('photokit-lab');
  });

  it('has a non-empty title', () => {
    expect(manifest.title.length).toBeGreaterThan(0);
  });

  it('has a non-empty description mentioning PhotoKit', () => {
    expect(manifest.description.length).toBeGreaterThan(0);
    expect(manifest.description).toMatch(/PHPickerViewController/i);
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
