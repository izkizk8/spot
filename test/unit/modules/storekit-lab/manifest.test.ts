/**
 * @jest-environment node
 */

import manifest from '@/modules/storekit-lab';
import type { ModuleManifest } from '@/modules/types';

describe('storekit-lab manifest', () => {
  it('has id "storekit-lab"', () => {
    expect(manifest.id).toBe('storekit-lab');
  });

  it('has a non-empty title', () => {
    expect(manifest.title.length).toBeGreaterThan(0);
  });

  it('has a non-empty description that mentions StoreKit', () => {
    expect(manifest.description.length).toBeGreaterThan(0);
    expect(manifest.description.toLowerCase()).toContain('storekit');
  });

  it('declares platforms as ["ios", "android", "web"]', () => {
    expect(manifest.platforms).toEqual(['ios', 'android', 'web']);
  });

  it('declares minIOS as "15.0"', () => {
    expect(manifest.minIOS).toBe('15.0');
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

  it('declares an icon', () => {
    expect(typeof manifest.icon.ios).toBe('string');
    expect(manifest.icon.ios.length).toBeGreaterThan(0);
    expect(typeof manifest.icon.fallback).toBe('string');
    expect(manifest.icon.fallback.length).toBeGreaterThan(0);
  });
});
