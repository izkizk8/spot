/**
 * Tests for Documents Lab manifest — feature 032 / T039.
 *
 * @jest-environment jsdom
 */

import manifest from '@/modules/documents-lab';

describe('documents-lab manifest', () => {
  it('id === "documents-lab" (M1)', () => {
    expect(manifest.id).toBe('documents-lab');
  });

  it('title === "Documents Lab" (M2)', () => {
    expect(manifest.title).toBe('Documents Lab');
  });

  it('platforms === ["ios","android","web"] (M3)', () => {
    expect(manifest.platforms).toEqual(['ios', 'android', 'web']);
  });

  it('minIOS === "11.0" (M4)', () => {
    expect(manifest.minIOS).toBe('11.0');
  });

  it('render is a function (M5)', () => {
    expect(typeof manifest.render).toBe('function');
  });

  it('icon.ios and icon.fallback are non-empty strings', () => {
    expect(typeof manifest.icon.ios).toBe('string');
    expect(manifest.icon.ios.length).toBeGreaterThan(0);
    expect(typeof manifest.icon.fallback).toBe('string');
    expect(manifest.icon.fallback.length).toBeGreaterThan(0);
  });
});
