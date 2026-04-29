/**
 * Tests for spotlight-lab manifest — feature 031 / T037.
 */

describe('spotlight-lab manifest', () => {
  it('manifest.id === "spotlight-lab" (FR-001)', () => {
    const manifest = require('@/modules/spotlight-lab').default;
    expect(manifest.id).toBe('spotlight-lab');
  });

  it('manifest.title === "Spotlight Indexing" (FR-001)', () => {
    const manifest = require('@/modules/spotlight-lab').default;
    expect(manifest.title).toBe('Spotlight Indexing');
  });

  it('manifest.platforms deep-equals ["ios","android","web"] (FR-001)', () => {
    const manifest = require('@/modules/spotlight-lab').default;
    expect(manifest.platforms).toEqual(['ios', 'android', 'web']);
  });

  it('manifest.minIOS === "9.0" (FR-001)', () => {
    const manifest = require('@/modules/spotlight-lab').default;
    expect(manifest.minIOS).toBe('9.0');
  });

  it('typeof manifest.render === "function"', () => {
    const manifest = require('@/modules/spotlight-lab').default;
    expect(typeof manifest.render).toBe('function');
  });

  it('manifest.icon.ios is non-empty', () => {
    const manifest = require('@/modules/spotlight-lab').default;
    expect(typeof manifest.icon.ios).toBe('string');
    expect(manifest.icon.ios.length).toBeGreaterThan(0);
  });

  it('manifest.icon.fallback is non-empty', () => {
    const manifest = require('@/modules/spotlight-lab').default;
    expect(typeof manifest.icon.fallback).toBe('string');
    expect(manifest.icon.fallback.length).toBeGreaterThan(0);
  });

  it('manifest.description is non-empty and mentions Spotlight|iOS 9|CoreSpotlight', () => {
    const manifest = require('@/modules/spotlight-lab').default;
    expect(typeof manifest.description).toBe('string');
    expect(manifest.description.length).toBeGreaterThan(0);
    expect(manifest.description).toMatch(/spotlight|iOS\s*9|CoreSpotlight|search/i);
  });
});
