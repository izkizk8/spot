/**
 * Unit tests: icloud-drive-lab module manifest (feature 070).
 */

import manifest from '@/modules/icloud-drive-lab';
import type { ModuleManifest } from '@/modules/types';

describe('icloud-drive-lab manifest', () => {
  it('has id "icloud-drive-lab"', () => {
    expect(manifest.id).toBe('icloud-drive-lab');
  });

  it('has a non-empty title', () => {
    expect(manifest.title.length).toBeGreaterThan(0);
  });

  it('has a non-empty description mentioning iCloud Drive', () => {
    expect(manifest.description.length).toBeGreaterThan(0);
    expect(manifest.description).toMatch(/iCloud Drive/i);
  });

  it('declares platforms as ["ios", "android", "web"]', () => {
    expect(manifest.platforms).toEqual(['ios', 'android', 'web']);
  });

  it('declares minIOS as "16.0"', () => {
    expect(manifest.minIOS).toBe('16.0');
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
