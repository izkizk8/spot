/**
 * T011: Manifest test for camera-vision module.
 *
 * Coverage:
 *   - manifest id === 'camera-vision'
 *   - platforms includes 'ios', 'android', 'web'
 *   - minIOS === '13.0'
 *   - screen reference resolves (FR-001, FR-003)
 */

import manifest from '@/modules/camera-vision';

describe('camera-vision manifest', () => {
  it('has correct id', () => {
    expect(manifest.id).toBe('camera-vision');
  });

  it('includes ios, android, and web platforms', () => {
    expect(manifest.platforms).toContain('ios');
    expect(manifest.platforms).toContain('android');
    expect(manifest.platforms).toContain('web');
  });

  it('has minIOS set to 13.0', () => {
    expect(manifest.minIOS).toBe('13.0');
  });

  it('has a render function', () => {
    expect(manifest.render).toBeDefined();
    expect(typeof manifest.render).toBe('function');
  });

  it('render function returns a React node', () => {
    const rendered = manifest.render();
    expect(rendered).toBeDefined();
  });

  it('has a title', () => {
    expect(manifest.title).toBe('Camera Vision');
  });
});
