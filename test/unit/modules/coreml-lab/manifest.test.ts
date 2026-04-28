/**
 * Manifest tests for CoreML Lab (feature 016).
 */

import manifest from '@/modules/coreml-lab';

describe('CoreML Lab manifest', () => {
  it('has correct id', () => {
    expect(manifest.id).toBe('coreml-lab');
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
    expect(typeof manifest.render).toBe('function');
    const result = manifest.render();
    expect(result).toBeTruthy();
  });
});
