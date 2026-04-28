/**
 * Test suite for with-sign-in-with-apple config plugin (feature 021).
 *
 * Coverage:
 *   (a) Adds com.apple.developer.applesignin when absent
 *   (b) Preserves pre-existing value
 *   (c) Idempotent: running twice yields deep-equal entitlements
 *   (d) Coexists with all prior plugins (order-invariant)
 */

import type { ExpoConfig } from '@expo/config-types';

// Mock @expo/config-plugins so withEntitlementsPlist runs its callback synchronously
jest.mock('@expo/config-plugins', () => ({
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
  withInfoPlist: (
    config: ExpoConfig,
    callback: (cfg: { modResults: Record<string, unknown> }) => {
      modResults: Record<string, unknown>;
    },
  ) => {
    const modResults: Record<string, unknown> = config.ios?.infoPlist || {};
    const result = callback({ modResults, ...config } as never);
    return {
      ...config,
      ios: {
        ...config.ios,
        infoPlist: result.modResults,
      },
    };
  },
  withAndroidManifest: (
    config: ExpoConfig,
    _callback: (cfg: { modResults: unknown }) => { modResults: unknown },
  ) => {
    return config;
  },
  withXcodeProject: (config: ExpoConfig, _callback: () => void) => {
    return config;
  },
}));

describe('with-sign-in-with-apple plugin', () => {
  let withSignInWithApple: (config: ExpoConfig) => ExpoConfig;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    withSignInWithApple = require('../../../../plugins/with-sign-in-with-apple/index').default;
  });

  it('exports a config plugin function', () => {
    expect(typeof withSignInWithApple).toBe('function');
  });

  describe('(a) adds entitlement when absent', () => {
    it('sets com.apple.developer.applesignin to ["Default"]', () => {
      const result = withSignInWithApple({ name: 'app', slug: 'app', ios: {} });
      expect(result.ios?.entitlements?.['com.apple.developer.applesignin']).toEqual(['Default']);
    });
  });

  describe('(b) preserves pre-existing value', () => {
    it('keeps value with Default already present unchanged', () => {
      const result = withSignInWithApple({
        name: 'app',
        slug: 'app',
        ios: { entitlements: { 'com.apple.developer.applesignin': ['Default', 'Custom'] } },
      });
      expect(result.ios?.entitlements?.['com.apple.developer.applesignin']).toEqual([
        'Default',
        'Custom',
      ]);
    });

    it('adds Default to existing array if not present', () => {
      const result = withSignInWithApple({
        name: 'app',
        slug: 'app',
        ios: { entitlements: { 'com.apple.developer.applesignin': ['Other'] } },
      });
      expect(result.ios?.entitlements?.['com.apple.developer.applesignin']).toEqual([
        'Other',
        'Default',
      ]);
    });
  });

  describe('(c) idempotency', () => {
    it('produces deep-equal config when run twice', () => {
      const base: ExpoConfig = { name: 'app', slug: 'app', ios: {} };
      const r1 = withSignInWithApple(base);
      const r2 = withSignInWithApple(r1);
      expect(r2).toEqual(r1);
    });
  });

  describe('(d) coexistence with prior plugins', () => {
    it('works alongside with-audio-recording', () => {
      const withAudioRecording = require('../../../../plugins/with-audio-recording/index').default;
      const base: ExpoConfig = { name: 'app', slug: 'app', ios: {} };

      const r1 = withSignInWithApple(withAudioRecording(base));
      const r2 = withAudioRecording(withSignInWithApple(base));

      expect(r1.ios?.entitlements?.['com.apple.developer.applesignin']).toEqual(['Default']);
      expect(r2.ios?.entitlements?.['com.apple.developer.applesignin']).toEqual(['Default']);
      // Both should have microphone usage description
      expect(r1.ios?.infoPlist?.NSMicrophoneUsageDescription).toBeTruthy();
      expect(r2.ios?.infoPlist?.NSMicrophoneUsageDescription).toBeTruthy();
    });
  });
});
