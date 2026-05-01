/**
 * Unit tests: live-text-lab module manifest (feature 080).
 */

import manifest from '@/modules/live-text-lab';
import type { ModuleManifest } from '@/modules/types';

describe('live-text-lab manifest', () => {
  it('has id "live-text-lab"', () => {
    expect(manifest.id).toBe('live-text-lab');
  });

  it('has a non-empty title', () => {
    expect(manifest.title.length).toBeGreaterThan(0);
  });

  it('has a non-empty description mentioning Live Text', () => {
    expect(manifest.description.length).toBeGreaterThan(0);
    expect(manifest.description).toMatch(/Live Text/i);
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
