/**
 * Tests for standby-lab manifest per contracts/manifest.contract.ts
 *
 * @see specs/028-standby-mode/tasks.md T016
 */

describe('standby-lab manifest', () => {
  it('manifest.id === "standby-lab"', () => {
    const manifest = require('@/modules/standby-lab/index').default;
    expect(manifest.id).toBe('standby-lab');
  });

  it('manifest.title === "StandBy Mode"', () => {
    const manifest = require('@/modules/standby-lab/index').default;
    expect(manifest.title).toBe('StandBy Mode');
  });

  it('manifest.platforms deep-equals ["ios", "android", "web"]', () => {
    const manifest = require('@/modules/standby-lab/index').default;
    expect(manifest.platforms).toEqual(['ios', 'android', 'web']);
  });

  it('manifest.minIOS === "17.0"', () => {
    const manifest = require('@/modules/standby-lab/index').default;
    expect(manifest.minIOS).toBe('17.0');
  });

  it('typeof manifest.render === "function"', () => {
    const manifest = require('@/modules/standby-lab/index').default;
    expect(typeof manifest.render).toBe('function');
  });

  it('manifest.icon.ios is a non-empty string', () => {
    const manifest = require('@/modules/standby-lab/index').default;
    expect(typeof manifest.icon.ios).toBe('string');
    expect(manifest.icon.ios.length).toBeGreaterThan(0);
  });

  it('manifest.icon.fallback is a non-empty string', () => {
    const manifest = require('@/modules/standby-lab/index').default;
    expect(typeof manifest.icon.fallback).toBe('string');
    expect(manifest.icon.fallback.length).toBeGreaterThan(0);
  });

  it('manifest.description mentions "standby" or "iOS 17"', () => {
    const manifest = require('@/modules/standby-lab/index').default;
    expect(typeof manifest.description).toBe('string');
    expect(manifest.description.length).toBeGreaterThan(0);
    expect(manifest.description).toMatch(/standby|iOS\s*17/i);
  });
});
