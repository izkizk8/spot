/**
 * Unit tests: shortcuts-snippets-lab module manifest (feature 072).
 */

import manifest from '@/modules/shortcuts-snippets-lab';
import type { ModuleManifest } from '@/modules/types';

describe('shortcuts-snippets-lab manifest', () => {
  it('has id "shortcuts-snippets-lab"', () => {
    expect(manifest.id).toBe('shortcuts-snippets-lab');
  });

  it('has a non-empty title', () => {
    expect(manifest.title.length).toBeGreaterThan(0);
  });

  it('has a non-empty description mentioning Shortcuts', () => {
    expect(manifest.description.length).toBeGreaterThan(0);
    expect(manifest.description).toMatch(/Shortcuts/i);
  });

  it('declares platforms as ["ios", "android", "web"]', () => {
    expect(manifest.platforms).toEqual(['ios', 'android', 'web']);
  });

  it('declares minIOS as "12.0"', () => {
    expect(manifest.minIOS).toBe('12.0');
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
