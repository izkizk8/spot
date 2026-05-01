/**
 * Test suite for with-local-auth config plugin (feature 022).
 *
 * Coverage:
 *   (a) Adds NSFaceIDUsageDescription when absent
 *   (b) Preserves pre-existing customized value
 *   (c) Idempotent: running twice yields deep-equal Info.plist
 *   (d) Coexists with prior plugins (with-sign-in-with-apple, with-audio-recording)
 */

import type { ExpoConfig } from '@expo/config-types';

jest.mock('@expo/config-plugins', () => ({
  withInfoPlist: (
    config: ExpoConfig,
    callback: (cfg: { modResults: Record<string, unknown> }) => {
      modResults: Record<string, unknown>;
    },
  ) => {
    const modResults: Record<string, unknown> =
      (config.ios?.infoPlist as Record<string, unknown>) || {};
    const result = callback({ modResults, ...config } as never);
    return {
      ...config,
      ios: {
        ...config.ios,
        infoPlist: result.modResults,
      },
    };
  },
  withEntitlementsPlist: (
    config: ExpoConfig,
    callback: (cfg: { modResults: Record<string, unknown> }) => {
      modResults: Record<string, unknown>;
    },
  ) => {
    const modResults: Record<string, unknown> = config.ios?.entitlements || {};
    const result = callback({ modResults, ...config } as never);
    return {
      ...config,
      ios: {
        ...config.ios,
        entitlements: result.modResults,
      },
    };
  },
  withAndroidManifest: (config: ExpoConfig) => config,
  withXcodeProject: (config: ExpoConfig) => config,
}));

describe('with-local-auth plugin', () => {
  let withLocalAuth: (config: ExpoConfig) => ExpoConfig;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    withLocalAuth = require('../../../../plugins/with-local-auth/index').default;
  });

  it('exports a config plugin function', () => {
    expect(typeof withLocalAuth).toBe('function');
  });

  describe('(a) adds NSFaceIDUsageDescription when absent', () => {
    it('sets a default usage description', () => {
      const result = withLocalAuth({ name: 'app', slug: 'app', ios: {} });
      const value = result.ios?.infoPlist?.NSFaceIDUsageDescription as string | undefined;
      expect(value).toBeTruthy();
      expect(value).toMatch(/Face ID/);
    });
  });

  describe('(b) preserves pre-existing customized value', () => {
    it('keeps a custom string unchanged', () => {
      const result = withLocalAuth({
        name: 'app',
        slug: 'app',
        ios: { infoPlist: { NSFaceIDUsageDescription: 'Custom reason' } },
      });
      expect(result.ios?.infoPlist?.NSFaceIDUsageDescription).toBe('Custom reason');
    });
  });

  describe('(c) idempotency', () => {
    it('produces deep-equal config when run twice', () => {
      const base: ExpoConfig = { name: 'app', slug: 'app', ios: {} };
      const r1 = withLocalAuth(base);
      const r2 = withLocalAuth(r1);
      expect(r2).toEqual(r1);
    });
  });

  describe('(d) coexistence with prior plugins', () => {
    it('coexists with with-sign-in-with-apple', () => {
      const withSiwa = require('../../../../plugins/with-sign-in-with-apple/index').default;
      const base: ExpoConfig = { name: 'app', slug: 'app', ios: {} };
      const r1 = withLocalAuth(withSiwa(base));
      const r2 = withSiwa(withLocalAuth(base));

      expect(r1.ios?.entitlements?.['com.apple.developer.applesignin']).toEqual(['Default']);
      expect(r1.ios?.infoPlist?.NSFaceIDUsageDescription).toBeTruthy();
      expect(r2.ios?.entitlements?.['com.apple.developer.applesignin']).toEqual(['Default']);
      expect(r2.ios?.infoPlist?.NSFaceIDUsageDescription).toBeTruthy();
    });

    it('coexists with with-audio-recording (both touch Info.plist)', () => {
      const withAudio = require('../../../../plugins/with-audio-recording/index').default;
      const base: ExpoConfig = { name: 'app', slug: 'app', ios: {} };
      const r1 = withLocalAuth(withAudio(base));
      const r2 = withAudio(withLocalAuth(base));

      expect(r1.ios?.infoPlist?.NSMicrophoneUsageDescription).toBeTruthy();
      expect(r1.ios?.infoPlist?.NSFaceIDUsageDescription).toBeTruthy();
      expect(r2.ios?.infoPlist?.NSMicrophoneUsageDescription).toBeTruthy();
      expect(r2.ios?.infoPlist?.NSFaceIDUsageDescription).toBeTruthy();
    });
  });
});
