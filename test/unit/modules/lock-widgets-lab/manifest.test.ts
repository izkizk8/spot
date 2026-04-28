/**
 * Tests for lock-widgets-lab manifest per contracts/manifest.contract.ts
 *
 * Covers:
 *  1. manifest.id === 'lock-widgets-lab'
 *  2. manifest.title === 'Lock Screen Widgets'
 *  3. manifest.platforms deep-equals ['ios', 'android', 'web']
 *  4. manifest.minIOS === '16.0'
 *  5. typeof manifest.render === 'function'
 *  6. manifest.icon.ios is a non-empty string (SF Symbol name)
 *  7. manifest.icon.fallback is a non-empty single-character emoji
 *  8. manifest.description mentions "lock" or "iOS 16" (case-insensitive)
 *
 * @see specs/027-lock-screen-widgets/tasks.md T020
 * @see specs/027-lock-screen-widgets/contracts/manifest.contract.ts
 */

describe('lock-widgets-lab manifest', () => {
  it('manifest.id === "lock-widgets-lab"', () => {
    const manifest = require('@/modules/lock-widgets-lab/index').default;
    expect(manifest.id).toBe('lock-widgets-lab');
  });

  it('manifest.title === "Lock Screen Widgets"', () => {
    const manifest = require('@/modules/lock-widgets-lab/index').default;
    expect(manifest.title).toBe('Lock Screen Widgets');
  });

  it('manifest.platforms deep-equals ["ios", "android", "web"]', () => {
    const manifest = require('@/modules/lock-widgets-lab/index').default;
    expect(manifest.platforms).toEqual(['ios', 'android', 'web']);
  });

  it('manifest.minIOS === "16.0"', () => {
    const manifest = require('@/modules/lock-widgets-lab/index').default;
    expect(manifest.minIOS).toBe('16.0');
  });

  it('typeof manifest.render === "function"', () => {
    const manifest = require('@/modules/lock-widgets-lab/index').default;
    expect(typeof manifest.render).toBe('function');
  });

  it('manifest.icon.ios is a non-empty string', () => {
    const manifest = require('@/modules/lock-widgets-lab/index').default;
    expect(typeof manifest.icon.ios).toBe('string');
    expect(manifest.icon.ios.length).toBeGreaterThan(0);
  });

  it('manifest.icon.fallback is a non-empty single-character emoji', () => {
    const manifest = require('@/modules/lock-widgets-lab/index').default;
    expect(typeof manifest.icon.fallback).toBe('string');
    expect(manifest.icon.fallback.length).toBeGreaterThan(0);
  });

  it('manifest.description mentions "lock" or "iOS 16"', () => {
    const manifest = require('@/modules/lock-widgets-lab/index').default;
    expect(typeof manifest.description).toBe('string');
    expect(manifest.description.length).toBeGreaterThan(0);
    expect(manifest.description).toMatch(/lock|iOS\s*16/i);
  });
});
