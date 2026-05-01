/**
 * @file manifest.test.ts
 * @description Manifest contract test for Sensors Playground module.
 */
import manifest from '@/modules/sensors-playground';
import { MODULES } from '@/modules/registry';

describe('Sensors Playground manifest', () => {
  it('id matches the kebab-case pattern and equals "sensors-playground"', () => {
    expect(manifest.id).toMatch(/^[a-z][a-z0-9-]*$/);
    expect(manifest.id).toBe('sensors-playground');
  });

  it('declares all three platforms (FR-001)', () => {
    expect(manifest.platforms).toEqual(['ios', 'android', 'web']);
  });

  it('does NOT set minIOS (expo-sensors supports iOS 13+)', () => {
    expect(manifest.minIOS).toBeUndefined();
  });

  it('has non-empty title, description, icon.ios, icon.fallback', () => {
    expect(manifest.title.length).toBeGreaterThan(0);
    expect(manifest.description.length).toBeGreaterThan(0);
    expect(manifest.icon.ios.length).toBeGreaterThan(0);
    expect(manifest.icon.fallback.length).toBeGreaterThan(0);
  });

  it('render is a function returning a React element', () => {
    expect(typeof manifest.render).toBe('function');
    const el = manifest.render();
    expect(el).toBeTruthy();
  });

  it('appears in the global module registry', () => {
    expect(MODULES).toContain(manifest);
  });
});
