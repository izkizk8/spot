/**
 * @jest-environment node
 */

import manifest from '@/modules/homekit-lab';
import type { ModuleManifest } from '@/modules/types';

describe('homekit-lab manifest', () => {
  it('has id "homekit-lab"', () => {
    expect(manifest.id).toBe('homekit-lab');
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

  it('declares minIOS as "8.0"', () => {
    expect(manifest.minIOS).toBe('8.0');
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

  it('declares a HomeKit-evocative SF Symbol icon', () => {
    expect(manifest.icon.ios).toBe('house.fill');
    expect(manifest.icon.fallback).toBe('🏠');
  });
});
