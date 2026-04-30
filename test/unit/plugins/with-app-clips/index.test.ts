/**
 * Tests for with-app-clips Expo config plugin — feature 042.
 *
 * @jest-environment node
 */

import withAppClips, {
  applyAppClipsEntitlement,
  APP_CLIPS_ENTITLEMENT_KEY,
} from '../../../../plugins/with-app-clips';
import type { ExpoConfig } from '@expo/config-types';

const KEY = APP_CLIPS_ENTITLEMENT_KEY;

describe('with-app-clips (pure mutation)', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('Row 1: missing key → set to true, no warn', () => {
    const out = applyAppClipsEntitlement({});
    expect(out[KEY]).toBe(true);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('Row 2: prior true → still true, idempotent, no warn', () => {
    const input = { [KEY]: true };
    const out = applyAppClipsEntitlement(input);
    expect(out[KEY]).toBe(true);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('Row 3: prior false → replaced with true, no warn', () => {
    const out = applyAppClipsEntitlement({ [KEY]: false });
    expect(out[KEY]).toBe(true);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('Row 4: re-run on own output is byte-stable (idempotency)', () => {
    const once = applyAppClipsEntitlement({});
    const twice = applyAppClipsEntitlement(once);
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once));
  });

  it('Row 5: non-boolean prior → replaced with true and warn fires once', () => {
    const out = applyAppClipsEntitlement({ [KEY]: 'yes' });
    expect(out[KEY]).toBe(true);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(String(warnSpy.mock.calls[0][0])).toContain('with-app-clips');
  });

  it('Immutability: returns new object, does not mutate input', () => {
    const input: Record<string, unknown> = { other: 'kept' };
    const out = applyAppClipsEntitlement(input);
    expect(out).not.toBe(input);
    expect(input[KEY]).toBeUndefined();
    expect(out.other).toBe('kept');
  });

  it('Coexistence: does not touch keychain-access-groups, aps-environment, associated-domains, app-groups', () => {
    const input: Record<string, unknown> = {
      'keychain-access-groups': ['$(AppIdentifierPrefix)com.example.app'],
      'aps-environment': 'development',
      'com.apple.developer.associated-domains': ['applinks:spot.example.com'],
      'com.apple.security.application-groups': ['group.com.example.app'],
    };
    const out = applyAppClipsEntitlement(input);
    expect(out['keychain-access-groups']).toEqual(input['keychain-access-groups']);
    expect(out['aps-environment']).toBe('development');
    expect(out['com.apple.developer.associated-domains']).toEqual(
      input['com.apple.developer.associated-domains'],
    );
    expect(out['com.apple.security.application-groups']).toEqual(
      input['com.apple.security.application-groups'],
    );
    expect(out[KEY]).toBe(true);
  });
});

describe('with-app-clips (plugin wrapper)', () => {
  it('returns a valid ExpoConfig when applied', () => {
    const config: Partial<ExpoConfig> = { name: 'test', slug: 'test' };
    const modded = withAppClips(config as ExpoConfig);
    expect(modded).toBeDefined();
    expect(modded.name).toBe('test');
  });

  it('app.json plugins array contains ./plugins/with-app-clips exactly once', () => {
    const appJson = require('../../../../app.json');
    const plugins: unknown[] = appJson.expo.plugins;
    const count = plugins.filter(
      (p) => typeof p === 'string' && p === './plugins/with-app-clips',
    ).length;
    expect(count).toBe(1);
  });

  it('coexists in the plugin chain alongside with-universal-links and others without throwing', () => {
    const baseConfig: ExpoConfig = {
      name: 'test-app',
      slug: 'test-app',
      ios: { bundleIdentifier: 'com.test.app' },
    };
    const universalLinks = require('../../../../plugins/with-universal-links').default;
    const keychain = require('../../../../plugins/with-keychain-services').default;
    const siwa = require('../../../../plugins/with-sign-in-with-apple').default;

    let config = baseConfig;
    expect(() => {
      config = withAppClips(config);
      config = universalLinks(config);
      config = keychain(config);
      config = siwa(config);
      // Re-run to check idempotency under composition
      config = withAppClips(config);
      config = universalLinks(config);
    }).not.toThrow();
    expect(config).toBeDefined();
  });
});
