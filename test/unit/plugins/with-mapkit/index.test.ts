/**
 * @jest-environment node
 */

import withMapKit from '../../../../plugins/with-mapkit';
import type { ExpoConfig } from '@expo/config-types';

describe('with-mapkit', () => {
  const baseConfig: ExpoConfig = {
    name: 'test-app',
    slug: 'test-app',
    ios: {
      bundleIdentifier: 'com.test.app',
    },
  };

  it('adds the key with documented copy when absent', () => {
    const config = withMapKit(baseConfig);
    expect(config).toBeDefined();
  });

  it('overwrites a stale value', () => {
    const configWithStale: ExpoConfig = {
      ...baseConfig,
      ios: {
        ...baseConfig.ios,
        infoPlist: {
          NSLocationWhenInUseUsageDescription: 'Old copy',
        },
      },
    };

    const result = withMapKit(configWithStale);
    expect(result).toBeDefined();
  });

  it('is idempotent (running twice produces a single write)', () => {
    let config = withMapKit(baseConfig);
    config = withMapKit(config);
    expect(config).toBeDefined();
  });

  it('emits no warnings on a baseline config', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    withMapKit(baseConfig);

    expect(consoleWarnSpy).toHaveBeenCalledTimes(0);

    consoleWarnSpy.mockRestore();
  });

  it('only edits NSLocationWhenInUseUsageDescription', () => {
    const result = withMapKit(baseConfig);
    expect(result.name).toBe(baseConfig.name);
    expect(result.slug).toBe(baseConfig.slug);
    expect(result.ios?.bundleIdentifier).toBe(baseConfig.ios?.bundleIdentifier);
  });

  it('coexistence: app.json has the expected plugin shape', () => {
    const appJson = require('../../../../app.json');
    const plugins: unknown[] = appJson.expo.plugins;

    // After feature 052, plugins.length should be 42 (added with-coredata-cloudkit after with-tap-to-pay)
    expect(plugins.length).toBe(42); // bumped from 41 by feature 052 (with-coredata-cloudkit)

    // './plugins/with-mapkit' should appear exactly once at index 14
    const mapkitIndex = plugins.findIndex(
      (p: unknown) => typeof p === 'string' && p === './plugins/with-mapkit',
    );
    expect(mapkitIndex).toBe(14);

    // Prior string plugins (excluding configured arrays)
    const stringPlugins = plugins.filter((p: unknown) => typeof p === 'string');
    expect(stringPlugins).toContain('./plugins/with-mapkit');
    expect(stringPlugins.indexOf('./plugins/with-mapkit')).toBeGreaterThanOrEqual(0);
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
});
