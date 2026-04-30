/**
 * @jest-environment node
 */

import manifest from '@/modules/shareplay-lab';
import type { ModuleManifest } from '@/modules/types';

describe('shareplay-lab manifest', () => {
  it('has id "shareplay-lab"', () => {
    expect(manifest.id).toBe('shareplay-lab');
  });

  it('has a non-empty title', () => {
    expect(manifest.title.length).toBeGreaterThan(0);
  });

  it('has a non-empty description', () => {
    expect(manifest.description.length).toBeGreaterThan(0);
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

  it('declares an SF Symbol icon', () => {
    expect(typeof manifest.icon.ios).toBe('string');
    expect(manifest.icon.ios.length).toBeGreaterThan(0);
    expect(typeof manifest.icon.fallback).toBe('string');
    expect(manifest.icon.fallback.length).toBeGreaterThan(0);
  });
});
