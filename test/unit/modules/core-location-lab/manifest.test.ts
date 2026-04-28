/**
 * Manifest tests for Core Location Lab (feature 025).
 *
 * Validates the module's public contract via its ModuleManifest.
 */

import manifest from '@/modules/core-location-lab';

describe('Core Location Lab manifest', () => {
  it('has id "core-location-lab"', () => {
    expect(manifest.id).toBe('core-location-lab');
  });

  it('has title "Core Location"', () => {
    expect(manifest.title).toBe('Core Location');
  });

  it('declares ios, android, and web platforms', () => {
    expect(manifest.platforms).toEqual(['ios', 'android', 'web']);
  });

  it('has minIOS set to 8.0', () => {
    expect(manifest.minIOS).toBe('8.0');
  });

  it('uses the location.fill SF Symbol on iOS', () => {
    expect(manifest.icon.ios).toBe('location.fill');
  });

  it('exposes a render function', () => {
    expect(typeof manifest.render).toBe('function');
  });
});
