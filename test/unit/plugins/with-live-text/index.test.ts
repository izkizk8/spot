/**
 * with-live-text Plugin Test
 * Feature: 080-live-text
 *
 * @jest-environment node
 */

import type { ExpoConfig } from '@expo/config-types';

jest.mock('@expo/config-plugins', () => ({
  withInfoPlist: (config: any, callback: (cfg: any) => any) => {
    const modResults: Record<string, unknown> = { ...config.ios?.infoPlist };
    const result = callback({ ...config, modResults, modRequest: {} });
    return {
      ...config,
      ios: {
        ...config.ios,
        infoPlist: result.modResults,
      },
    };
  },
  withEntitlementsPlist: (config: any, callback: (cfg: any) => any) => {
    const modResults: Record<string, unknown> = { ...config.ios?.entitlements };
    const result = callback({ ...config, modResults, modRequest: {} });
    return {
      ...config,
      ios: {
        ...config.ios,
        entitlements: result.modResults,
      },
    };
  },
}));

import withLiveText, {
  applyLiveTextInfoPlist,
  CAMERA_USAGE_KEY,
  CAMERA_USAGE_COPY,
} from '../../../../plugins/with-live-text';

describe('applyLiveTextInfoPlist (pure helper)', () => {
  it('adds NSCameraUsageDescription when absent', () => {
    const out = applyLiveTextInfoPlist({});
    expect(out[CAMERA_USAGE_KEY]).toBe(CAMERA_USAGE_COPY);
  });

  it('overwrites an existing NSCameraUsageDescription', () => {
    const out = applyLiveTextInfoPlist({ [CAMERA_USAGE_KEY]: 'old copy' });
    expect(out[CAMERA_USAGE_KEY]).toBe(CAMERA_USAGE_COPY);
  });

  it('is idempotent (running twice produces a deep-equal result)', () => {
    const once = applyLiveTextInfoPlist({});
    const twice = applyLiveTextInfoPlist(once);
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once));
  });

  it('does not mutate the input object', () => {
    const input: Record<string, unknown> = {};
    const out = applyLiveTextInfoPlist(input);
    expect(out).not.toBe(input);
    expect(input[CAMERA_USAGE_KEY]).toBeUndefined();
  });

  it('preserves unrelated Info.plist keys', () => {
    const out = applyLiveTextInfoPlist({ NSLocationWhenInUseUsageDescription: 'location' });
    expect(out['NSLocationWhenInUseUsageDescription']).toBe('location');
  });
});

describe('with-live-text (config plugin)', () => {
  const baseConfig: ExpoConfig = {
    name: 'test-app',
    slug: 'test-app',
    ios: { bundleIdentifier: 'com.test.app' },
  };

  it('exports a config plugin function', () => {
    expect(typeof withLiveText).toBe('function');
  });

  it('seeds NSCameraUsageDescription on a baseline config', () => {
    const out = withLiveText(baseConfig);
    const plist = out.ios?.infoPlist as Record<string, unknown> | undefined;
    expect(plist?.[CAMERA_USAGE_KEY]).toBe(CAMERA_USAGE_COPY);
  });

  it('running twice yields a deep-equal config (idempotency)', () => {
    const once = withLiveText(baseConfig);
    const twice = withLiveText(once);
    expect(twice).toEqual(once);
  });

  it('only edits NSCameraUsageDescription', () => {
    const out = withLiveText(baseConfig);
    expect(out.name).toBe(baseConfig.name);
    expect(out.slug).toBe(baseConfig.slug);
  });
});

describe('with-live-text: app.json registration + chain composition', () => {
  const baseConfig: ExpoConfig = {
    name: 'test-app',
    slug: 'test-app',
    ios: { bundleIdentifier: 'com.test.app' },
  };

  it('app.json plugins array contains ./plugins/with-live-text exactly once', () => {
    const appJson = require('../../../../app.json');
    const plugins: unknown[] = appJson.expo.plugins;
    const count = plugins.filter(
      (p) => typeof p === 'string' && p === './plugins/with-live-text',
    ).length;
    expect(count).toBe(1);
  });

  it('app.json plugins array length is 43 after feature 080', () => {
    const appJson = require('../../../../app.json');
    const plugins: unknown[] = appJson.expo.plugins;
    expect(plugins.length).toBe(43);
  });

  it('coexists with prior plugins without throwing', () => {
    const plugins = [
      require('../../../../plugins/with-mapkit').default,
      require('../../../../plugins/with-storekit').default,
      require('../../../../plugins/with-apple-pay').default,
      require('../../../../plugins/with-weatherkit').default,
      require('../../../../plugins/with-coredata-cloudkit').default,
      withLiveText,
    ];
    let config: ExpoConfig = baseConfig;
    expect(() => {
      for (const plugin of plugins) {
        config = plugin(config);
      }
    }).not.toThrow();
    expect(config).toBeDefined();
  });
});
