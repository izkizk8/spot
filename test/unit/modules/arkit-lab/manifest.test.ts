/**
 * Manifest Test - ARKit Basics Module
 * Feature: 034-arkit-basics
 *
 * Tests the module manifest against the registry contract.
 */

import { manifest } from '@/modules/arkit-lab';

describe('ARKit Basics manifest', () => {
  it('has id "arkit-basics"', () => {
    expect(manifest.id).toBe('arkit-basics');
  });

  it('has title "ARKit Basics"', () => {
    expect(manifest.title).toBe('ARKit Basics');
  });

  it('has a description', () => {
    expect(manifest.description).toBeTruthy();
  });

  it('declares platforms: ios, android, web', () => {
    expect(manifest.platforms).toEqual(['ios', 'android', 'web']);
  });

  it('declares minIOS "11.0"', () => {
    expect(manifest.minIOS).toBe('11.0');
  });

  it('has a render function', () => {
    expect(typeof manifest.render).toBe('function');
  });
});
