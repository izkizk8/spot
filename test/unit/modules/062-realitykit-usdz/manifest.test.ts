/**
 * Unit tests: realitykit-usdz-lab module manifest (feature 062).
 */
import manifest from '@/modules/062-realitykit-usdz';
import type { ModuleManifest } from '@/modules/types';

describe('realitykit-usdz-lab manifest', () => {
  it('has id "realitykit-usdz-lab"', () => {
    expect(manifest.id).toBe('realitykit-usdz-lab');
  });

  it('has a non-empty title', () => {
    expect(manifest.title.length).toBeGreaterThan(0);
  });

  it('has a non-empty description mentioning RealityKit', () => {
    expect(manifest.description.length).toBeGreaterThan(0);
    expect(manifest.description).toMatch(/RealityKit/i);
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
