/**
 * @file manifest.test.ts
 * @description Manifest contract test for SwiftUI Interop module (T004)
 */

import manifest from '@/modules/swiftui-interop';

describe('SwiftUI Interop manifest', () => {
  it('has correct id', () => {
    expect(manifest.id).toBe('swiftui-interop');
  });

  it('declares all three platforms', () => {
    expect(manifest.platforms).toEqual(['ios', 'android', 'web']);
  });

  it('requires iOS 16.0 minimum', () => {
    expect(manifest.minIOS).toBe('16.0');
  });

  it('has a render function returning a React element', () => {
    expect(typeof manifest.render).toBe('function');
    const element = manifest.render();
    expect(element).toBeTruthy();
    expect(typeof element).toBe('object');
  });

  it('has required title and description', () => {
    expect(manifest.title).toBeTruthy();
    expect(typeof manifest.title).toBe('string');
    expect(manifest.description).toBeTruthy();
    expect(typeof manifest.description).toBe('string');
  });

  it('has icon with ios and fallback', () => {
    expect(manifest.icon).toBeTruthy();
    expect(typeof manifest.icon.ios).toBe('string');
    expect(typeof manifest.icon.fallback).toBe('string');
  });
});
