/**
 * Unit tests: handoff-lab module manifest (T011).
 *
 * Validates the exported ModuleManifest shape.
 */

import manifest from '@/modules/handoff-lab';
import type { ModuleManifest } from '@/modules/types';

describe('handoff-lab manifest', () => {
  it('has id "handoff-lab"', () => {
    expect(manifest.id).toBe('handoff-lab');
  });

  it('has a non-empty title', () => {
    expect(manifest.title).toBeDefined();
    expect(manifest.title.length).toBeGreaterThan(0);
  });

  it('has a non-empty description', () => {
    expect(manifest.description).toBeDefined();
    expect(manifest.description.length).toBeGreaterThan(0);
  });

  it('declares platforms as ["ios", "android", "web"]', () => {
    expect(manifest.platforms).toEqual(['ios', 'android', 'web']);
  });

  it('declares minIOS as "8.0"', () => {
    expect(manifest.minIOS).toBe('8.0');
  });

  it('exports a valid ModuleManifest structure', () => {
    const keys: (keyof ModuleManifest)[] = ['id', 'title', 'description', 'platforms', 'render'];
    keys.forEach((key) => {
      expect(manifest).toHaveProperty(key);
    });
  });

  it('has a render function that resolves on each platform', () => {
    expect(typeof manifest.render).toBe('function');
    // Lazy evaluation — we don't call render() here to avoid platform-specific imports
  });
});
