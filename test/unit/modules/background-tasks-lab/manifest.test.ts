/**
 * Tests for background-tasks-lab manifest — feature 030 / T033.
 */

describe('background-tasks-lab manifest', () => {
  it('manifest.id === "background-tasks-lab" (FR-001)', () => {
    const manifest = require('@/modules/background-tasks-lab').default;
    expect(manifest.id).toBe('background-tasks-lab');
  });

  it('manifest.title === "Background Tasks" (FR-001)', () => {
    const manifest = require('@/modules/background-tasks-lab').default;
    expect(manifest.title).toBe('Background Tasks');
  });

  it('manifest.platforms deep-equals ["ios","android","web"] (FR-001)', () => {
    const manifest = require('@/modules/background-tasks-lab').default;
    expect(manifest.platforms).toEqual(['ios', 'android', 'web']);
  });

  it('manifest.minIOS === "13.0" (FR-001)', () => {
    const manifest = require('@/modules/background-tasks-lab').default;
    expect(manifest.minIOS).toBe('13.0');
  });

  it('typeof manifest.render === "function"', () => {
    const manifest = require('@/modules/background-tasks-lab').default;
    expect(typeof manifest.render).toBe('function');
  });

  it('manifest.icon.ios is non-empty', () => {
    const manifest = require('@/modules/background-tasks-lab').default;
    expect(typeof manifest.icon.ios).toBe('string');
    expect(manifest.icon.ios.length).toBeGreaterThan(0);
  });

  it('manifest.icon.fallback is non-empty', () => {
    const manifest = require('@/modules/background-tasks-lab').default;
    expect(typeof manifest.icon.fallback).toBe('string');
    expect(manifest.icon.fallback.length).toBeGreaterThan(0);
  });

  it('manifest.description is non-empty and mentions background|iOS 13', () => {
    const manifest = require('@/modules/background-tasks-lab').default;
    expect(typeof manifest.description).toBe('string');
    expect(manifest.description.length).toBeGreaterThan(0);
    expect(manifest.description).toMatch(/background|iOS\s*13|BGTask/i);
  });
});
