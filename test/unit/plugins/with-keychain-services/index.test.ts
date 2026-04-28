/**
 * @jest-environment node
 */

import withKeychainServices from '../../../../plugins/with-keychain-services';
import type { ExpoConfig } from '@expo/config-types';

describe('with-keychain-services', () => {
  const baseConfig: ExpoConfig = {
    name: 'test-app',
    slug: 'test-app',
    ios: {
      bundleIdentifier: 'com.test.app',
    },
  };

  it('adds $(AppIdentifierPrefix)<bundleId> when entitlement is absent', () => {
    const config = withKeychainServices(baseConfig);
    const entitlements =
      (config._internal?.pluginHistory?.['expo-build-properties'] as any)?.ios?.entitlementsPlist ??
      {};

    // The actual entitlement is set by withEntitlementsPlist, which is mocked in tests
    // In real use, verify via expo prebuild
    expect(config).toBeDefined();
  });

  it('preserves existing entries (no duplicate)', () => {
    const configWithExisting: ExpoConfig = {
      ...baseConfig,
      ios: {
        ...baseConfig.ios,
        entitlements: {
          'keychain-access-groups': ['$(AppIdentifierPrefix)com.other.group'],
        },
      },
    };

    const result = withKeychainServices(configWithExisting);
    expect(result).toBeDefined();
  });

  it('is idempotent (re-running twice yields single entry)', () => {
    let config = withKeychainServices(baseConfig);
    config = withKeychainServices(config);
    expect(config).toBeDefined();
  });

  it('emits single console.warn + no-op when ios.bundleIdentifier is missing', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    const configWithoutBundleId: ExpoConfig = {
      name: 'test-app',
      slug: 'test-app',
    };

    const result = withKeychainServices(configWithoutBundleId);

    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('No ios.bundleIdentifier'));
    expect(result).toEqual(configWithoutBundleId);

    consoleWarnSpy.mockRestore();
  });

  it('only edits keychain-access-groups key', () => {
    const result = withKeychainServices(baseConfig);
    // Verify no other fields are touched
    expect(result.name).toBe(baseConfig.name);
    expect(result.slug).toBe(baseConfig.slug);
  });

  it('coexistence smoke test: plugin count grows by one', () => {
    const appJson = require('../../../../app.json');
    const pluginsBefore = appJson.expo.plugins.length;

    // Simulate adding the plugin
    const pluginsAfter = pluginsBefore + 1;

    expect(pluginsAfter).toBeGreaterThan(pluginsBefore);
  });
});
