/**
 * @jest-environment jsdom
 */

import keychainLabManifest from '@/modules/keychain-lab';
import { MODULES } from '@/modules/registry';

describe('keychain-lab manifest', () => {
  it('has id === keychain-lab', () => {
    expect(keychainLabManifest.id).toBe('keychain-lab');
  });

  it('uses kebab-case for id', () => {
    expect(keychainLabManifest.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('appears exactly once in MODULES registry', () => {
    const matches = MODULES.filter((m) => m.id === 'keychain-lab');
    expect(matches).toHaveLength(1);
  });

  it('supports platforms ios, android, web', () => {
    expect(keychainLabManifest.platforms).toEqual(['ios', 'android', 'web']);
  });

  it('has minIOS 8.0', () => {
    expect(keychainLabManifest.minIOS).toBe('8.0');
  });

  it('has title "Keychain Lab"', () => {
    expect(keychainLabManifest.title).toBe('Keychain Lab');
  });

  it('has SF Symbol icon lock.shield with fallback', () => {
    expect(keychainLabManifest.icon).toEqual({
      ios: 'lock.shield',
      fallback: '',
    });
  });

  it('has a non-empty description', () => {
    expect(keychainLabManifest.description).toBeTruthy();
    expect(keychainLabManifest.description.length).toBeGreaterThan(10);
  });
});
