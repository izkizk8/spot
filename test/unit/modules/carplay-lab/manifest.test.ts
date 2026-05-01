/**
 * @jest-environment node
 */

import manifest from '@/modules/carplay-lab';
import type { ModuleManifest } from '@/modules/types';

describe('carplay-lab manifest', () => {
  it('has id "carplay-lab"', () => {
    expect(manifest.id).toBe('carplay-lab');
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

  it('declares a CarPlay-evocative SF Symbol icon', () => {
    expect(manifest.icon.ios).toBe('car.fill');
    expect(manifest.icon.fallback).toBe('🚗');
  });
});
