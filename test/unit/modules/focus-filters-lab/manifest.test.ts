/**
 * Tests for focus-filters-lab manifest per T016.
 *
 * @see specs/029-focus-filters/contracts/manifest.contract.ts
 * @see specs/029-focus-filters/tasks.md T016
 */

describe('focus-filters-lab manifest', () => {
  it('manifest.id === "focus-filters-lab"', () => {
    const manifest = require('@/modules/focus-filters-lab').default;
    expect(manifest.id).toBe('focus-filters-lab');
  });

  it('manifest.title === "Focus Filters"', () => {
    const manifest = require('@/modules/focus-filters-lab').default;
    expect(manifest.title).toBe('Focus Filters');
  });

  it('manifest.platforms deep-equals ["ios", "android", "web"]', () => {
    const manifest = require('@/modules/focus-filters-lab').default;
    expect(manifest.platforms).toEqual(['ios', 'android', 'web']);
  });

  it('manifest.minIOS === "16.0"', () => {
    const manifest = require('@/modules/focus-filters-lab').default;
    expect(manifest.minIOS).toBe('16.0');
  });

  it('typeof manifest.render === "function"', () => {
    const manifest = require('@/modules/focus-filters-lab').default;
    expect(typeof manifest.render).toBe('function');
  });

  it('manifest.icon.ios is a non-empty string (SF Symbol name)', () => {
    const manifest = require('@/modules/focus-filters-lab').default;
    expect(typeof manifest.icon.ios).toBe('string');
    expect(manifest.icon.ios.length).toBeGreaterThan(0);
  });

  it('manifest.icon.fallback is a non-empty single-character emoji', () => {
    const manifest = require('@/modules/focus-filters-lab').default;
    expect(typeof manifest.icon.fallback).toBe('string');
    expect(manifest.icon.fallback.length).toBeGreaterThan(0);
  });

  it('manifest.description is non-empty and mentions focus|iOS 16', () => {
    const manifest = require('@/modules/focus-filters-lab').default;
    expect(typeof manifest.description).toBe('string');
    expect(manifest.description.length).toBeGreaterThan(0);
    expect(manifest.description).toMatch(/focus|iOS\s*16/i);
  });
});
