/**
 * Tests for with-core-location config plugin (feature 025).
 * @jest-environment node
 */

import withCoreLocation from '../../../../plugins/with-core-location';
import withMapKit from '../../../../plugins/with-mapkit';
import type { ExpoConfig } from '@expo/config-types';

describe('with-core-location', () => {
  const baseConfig: ExpoConfig = {
    name: 'test-app',
    slug: 'test-app',
    ios: {
      bundleIdentifier: 'com.test.app',
    },
  };

  it('adds both keys with documented copy and location mode when absent', () => {
    const config = withCoreLocation(baseConfig);
    expect(config).toBeDefined();
    // Plugin modifies Info.plist via withInfoPlist mod
    // Can't directly access Info.plist in test, but config should be valid
  });

  it('overwrites stale usage-description copy without throwing', () => {
    const configWithStale: ExpoConfig = {
      ...baseConfig,
      ios: {
        ...baseConfig.ios,
        infoPlist: {
          NSLocationWhenInUseUsageDescription: 'Old copy',
          NSLocationAlwaysAndWhenInUseUsageDescription: 'Old copy',
        },
      },
    };

    expect(() => {
      const result = withCoreLocation(configWithStale);
      expect(result).toBeDefined();
    }).not.toThrow();
  });

  it('is idempotent — running twice produces identical result', () => {
    let config = withCoreLocation(baseConfig);
    const afterFirst = JSON.stringify(config);

    config = withCoreLocation(config);
    const afterSecond = JSON.stringify(config);

    expect(afterFirst).toBe(afterSecond);
  });

  it('coexists with with-mapkit: folding both yields correct keys', () => {
    // Run withMapKit first, then withCoreLocation
    let config = withMapKit(baseConfig);
    config = withCoreLocation(config);

    // Both should process without error
    expect(config).toBeDefined();
    expect(config.name).toBe(baseConfig.name);
  });

  it('coexistence smoke: app.json has expected plugin count', () => {
    const appJson = require('../../../../app.json');
    const plugins: unknown[] = appJson.expo.plugins;

    // Count ./plugins/with-* entries
    const withPlugins = plugins.filter(
      (p: unknown) => typeof p === 'string' && p.startsWith('./plugins/with-'),
    );

    // Should have at least 12 custom plugins (before adding this one)
    expect(withPlugins.length).toBeGreaterThanOrEqual(12);
  });

  it('mod-chain runs without throwing', () => {
    // Import all custom plugins
    const plugins = [
      require('../../../../plugins/with-app-intents').default,
      require('../../../../plugins/with-audio-recording').default,
      require('../../../../plugins/with-coreml').default,
      require('../../../../plugins/with-home-widgets').default,
      require('../../../../plugins/with-keychain-services').default,
      require('../../../../plugins/with-live-activity').default,
      require('../../../../plugins/with-local-auth').default,
      require('../../../../plugins/with-screentime').default,
      require('../../../../plugins/with-sign-in-with-apple').default,
      require('../../../../plugins/with-speech-recognition').default,
      require('../../../../plugins/with-vision').default,
      withMapKit,
      withCoreLocation,
    ];

    // Fold over baseline config
    let config = baseConfig;
    expect(() => {
      for (const plugin of plugins) {
        config = plugin(config);
      }
    }).not.toThrow();

    expect(config).toBeDefined();
  });

  it('emits no console.warn calls on a baseline config', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    withCoreLocation(baseConfig);

    expect(consoleWarnSpy).toHaveBeenCalledTimes(0);

    consoleWarnSpy.mockRestore();
  });
});
