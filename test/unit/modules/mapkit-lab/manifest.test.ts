/**
 * Manifest tests for MapKit Lab (feature 024).
 *
 * Mirrors the per-property assertions called out in plan.md "Manifest
 * test" so the module's public contract is captured in code.
 */

import manifest from '@/modules/mapkit-lab';

describe('MapKit Lab manifest', () => {
  it('has id "mapkit-lab"', () => {
    expect(manifest.id).toBe('mapkit-lab');
  });

  it('has title "MapKit Lab"', () => {
    expect(manifest.title).toBe('MapKit Lab');
  });

  it('declares ios, android, and web platforms', () => {
    expect(manifest.platforms).toEqual(['ios', 'android', 'web']);
  });

  it('has minIOS set to 9.0', () => {
    expect(manifest.minIOS).toBe('9.0');
  });

  it('uses the map.fill SF Symbol on iOS', () => {
    expect(manifest.icon.ios).toBe('map.fill');
  });

  it('exposes a render function', () => {
    expect(typeof manifest.render).toBe('function');
  });
});
