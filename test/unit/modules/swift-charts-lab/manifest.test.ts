/**
 * T029: manifest.test.ts — Module manifest test
 *
 * Tests the default export ModuleManifest from index.tsx.
 */

import SwiftChartsLabManifest from '@/modules/swift-charts-lab';
import { MODULES } from '@/modules/registry';

describe('swift-charts-lab manifest', () => {
  it('id === "swift-charts-lab" and matches kebab-case pattern', () => {
    expect(SwiftChartsLabManifest.id).toBe('swift-charts-lab');
    expect(SwiftChartsLabManifest.id).toMatch(/^[a-z][a-z0-9-]*$/);
  });

  it('platforms includes ios, android, web', () => {
    expect(SwiftChartsLabManifest.platforms).toEqual(
      expect.arrayContaining(['ios', 'android', 'web']),
    );
  });

  it('minIOS === "16.0"', () => {
    expect(SwiftChartsLabManifest.minIOS).toBe('16.0');
  });

  it('title is non-empty', () => {
    expect(SwiftChartsLabManifest.title).toBeTruthy();
    expect(SwiftChartsLabManifest.title.length).toBeGreaterThan(0);
  });

  it('description is non-empty', () => {
    expect(SwiftChartsLabManifest.description).toBeTruthy();
    expect(SwiftChartsLabManifest.description.length).toBeGreaterThan(0);
  });

  it('icon.ios is non-empty', () => {
    expect(SwiftChartsLabManifest.icon.ios).toBeTruthy();
  });

  it('icon.fallback is non-empty', () => {
    expect(SwiftChartsLabManifest.icon.fallback).toBeTruthy();
  });

  it('render is a function that returns a React element', () => {
    expect(typeof SwiftChartsLabManifest.render).toBe('function');
    const element = SwiftChartsLabManifest.render();
    expect(element).toBeTruthy();
  });

  it('manifest is registered in MODULES array', () => {
    expect(MODULES).toContain(SwiftChartsLabManifest);
  });
});
