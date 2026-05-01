/**
 * Unit tests: sirikit-lab module manifest (feature 071).
 */

import manifest from '@/modules/sirikit-lab';
import type { ModuleManifest } from '@/modules/types';

describe('sirikit-lab manifest', () => {
  it('has id "sirikit-lab"', () => {
    expect(manifest.id).toBe('sirikit-lab');
  });

  it('has a non-empty title', () => {
    expect(manifest.title.length).toBeGreaterThan(0);
  });

  it('has a non-empty description mentioning SiriKit', () => {
    expect(manifest.description.length).toBeGreaterThan(0);
    expect(manifest.description).toMatch(/SiriKit/i);
  });

  it('declares platforms as ["ios", "android", "web"]', () => {
    expect(manifest.platforms).toEqual(['ios', 'android', 'web']);
  });

  it('declares minIOS as "10.0"', () => {
    expect(manifest.minIOS).toBe('10.0');
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
