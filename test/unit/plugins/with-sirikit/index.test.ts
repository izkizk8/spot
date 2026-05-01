/**
 * with-sirikit Plugin Test
 * Feature: 071-sirikit
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

import withSiriKit, {
  applySiriKitInfoPlist,
  SIRI_USAGE_KEY,
  SIRI_USAGE_COPY,
} from '../../../../plugins/with-sirikit';

describe('applySiriKitInfoPlist (pure helper)', () => {
  it('adds NSSiriUsageDescription when absent', () => {
    const out = applySiriKitInfoPlist({});
    expect(out[SIRI_USAGE_KEY]).toBe(SIRI_USAGE_COPY);
  });

  it('preserves an operator-supplied value verbatim', () => {
    const out = applySiriKitInfoPlist({
      [SIRI_USAGE_KEY]: 'Custom description',
    });
    expect(out[SIRI_USAGE_KEY]).toBe('Custom description');
  });

  it('is byte-stable on re-run', () => {
    const once = applySiriKitInfoPlist({});
    const twice = applySiriKitInfoPlist(once);
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once));
  });

  it('does not mutate the input object', () => {
    const input: Record<string, unknown> = {};
    const out = applySiriKitInfoPlist(input);
    expect(out).not.toBe(input);
    expect(input[SIRI_USAGE_KEY]).toBeUndefined();
  });

  it('preserves unrelated Info.plist keys', () => {
    const out = applySiriKitInfoPlist({ NSCameraUsageDescription: 'camera' });
    expect(out['NSCameraUsageDescription']).toBe('camera');
    expect(out[SIRI_USAGE_KEY]).toBe(SIRI_USAGE_COPY);
  });
});

describe('with-sirikit (config plugin)', () => {
  const baseConfig: ExpoConfig = {
    name: 'test-app',
    slug: 'test-app',
    ios: { bundleIdentifier: 'com.test.app' },
  };

  it('exports a config plugin function', () => {
    expect(typeof withSiriKit).toBe('function');
  });

  it('seeds NSSiriUsageDescription on a baseline config', () => {
    const out = withSiriKit(baseConfig);
    expect((out.ios?.infoPlist as Record<string, unknown> | undefined)?.[SIRI_USAGE_KEY]).toBe(
      SIRI_USAGE_COPY,
    );
  });

  it('preserves an operator-supplied value', () => {
    const cfg: ExpoConfig = {
      ...baseConfig,
      ios: { infoPlist: { [SIRI_USAGE_KEY]: 'Custom' } },
    };
    const out = withSiriKit(cfg);
    expect((out.ios?.infoPlist as Record<string, unknown> | undefined)?.[SIRI_USAGE_KEY]).toBe(
      'Custom',
    );
  });

  it('running twice yields a deep-equal config (idempotency)', () => {
    const once = withSiriKit(baseConfig);
    const twice = withSiriKit(once);
    expect(twice).toEqual(once);
  });

  it('only edits NSSiriUsageDescription', () => {
    const out = withSiriKit(baseConfig);
    expect(out.name).toBe(baseConfig.name);
    expect(out.slug).toBe(baseConfig.slug);
  });
});

describe('with-sirikit: app.json registration + chain composition', () => {
  const baseConfig: ExpoConfig = {
    name: 'test-app',
    slug: 'test-app',
    ios: { bundleIdentifier: 'com.test.app' },
  };

  it('app.json plugins array contains ./plugins/with-sirikit exactly once', () => {
    const appJson = require('../../../../app.json');
    const plugins: unknown[] = appJson.expo.plugins;
    const count = plugins.filter(
      (p) => typeof p === 'string' && p === './plugins/with-sirikit',
    ).length;
    expect(count).toBe(1);
  });

  it('app.json plugins array length is 43 after feature 071', () => {
    const appJson = require('../../../../app.json');
    const plugins: unknown[] = appJson.expo.plugins;
    expect(plugins.length).toBe(47);
  });

  it('coexists with prior plugins without throwing', () => {
    const plugins = [
      require('../../../../plugins/with-mapkit').default,
      require('../../../../plugins/with-storekit').default,
      require('../../../../plugins/with-apple-pay').default,
      require('../../../../plugins/with-weatherkit').default,
      require('../../../../plugins/with-coredata-cloudkit').default,
      withSiriKit,
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
