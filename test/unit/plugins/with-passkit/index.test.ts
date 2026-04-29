/**
 * with-passkit plugin — unit tests.
 * Feature: 036-passkit-wallet
 *
 * @see specs/036-passkit-wallet/contracts/with-passkit-plugin.md
 */

import type { ExpoConfig } from '@expo/config-types';

jest.mock('@expo/config-plugins', () => {
  const actual = jest.requireActual('@expo/config-plugins');
  return {
    ...actual,
    withEntitlementsPlist: (
      config: { ios?: { entitlements?: Record<string, unknown> } } & Record<string, unknown>,
      callback: (cfg: { modResults: Record<string, unknown> }) => {
        modResults: Record<string, unknown>;
      },
    ) => {
      const modResults: Record<string, unknown> = { ...config.ios?.entitlements };
      const result = callback({ modResults } as unknown as { modResults: Record<string, unknown> });
      return {
        ...config,
        ios: {
          ...config.ios,
          entitlements: result.modResults,
        },
      };
    },
    withXcodeProject: (config: Record<string, unknown>, _callback: unknown) => {
      // PassKit.framework linkage is verified out of band on macOS.
      return config;
    },
  };
});

describe('with-passkit plugin', () => {
  let withPassKit: (config: ExpoConfig) => ExpoConfig;

  beforeEach(() => {
    withPassKit = require('../../../../plugins/with-passkit').default;
  });

  it('P1: default export is a ConfigPlugin function', () => {
    expect(typeof withPassKit).toBe('function');
  });

  it('P2: empty config adds placeholder entitlement', () => {
    const config: ExpoConfig = { name: 'test', slug: 'test' };
    const result = withPassKit(config);

    expect(result.ios?.entitlements?.['com.apple.developer.pass-type-identifiers']).toEqual([
      '$(TeamIdentifierPrefix)pass.example.placeholder',
    ]);
  });

  it('P3: preserves pre-populated Pass Type IDs', () => {
    const config: ExpoConfig = {
      name: 'test',
      slug: 'test',
      ios: {
        entitlements: {
          'com.apple.developer.pass-type-identifiers': ['pass.real.id'],
        },
      },
    };

    const result = withPassKit(config);

    expect(result.ios?.entitlements?.['com.apple.developer.pass-type-identifiers']).toEqual([
      'pass.real.id',
    ]);
  });

  it('P5: running plugin twice is idempotent (SC-006)', () => {
    const config: ExpoConfig = { name: 'test', slug: 'test' };
    const first = withPassKit(config);
    const second = withPassKit(first);
    expect(second).toEqual(first);
  });

  it('P7: does not touch foreign entitlement keys', () => {
    const config: ExpoConfig = {
      name: 'test',
      slug: 'test',
      ios: {
        entitlements: {
          'aps-environment': 'production',
          'com.apple.developer.siri': true,
        },
      },
    };

    const result = withPassKit(config);

    expect(result.ios?.entitlements?.['aps-environment']).toBe('production');
    expect(result.ios?.entitlements?.['com.apple.developer.siri']).toBe(true);
  });
});
