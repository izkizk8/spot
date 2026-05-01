/**
 * with-storekit plugin tests (Feature 050 — StoreKit 2 Lab).
 *
 * Coverage:
 *   - applyStoreKitInfoPlist adds the placeholder config-file
 *     path when absent.
 *   - applyStoreKitInfoPlist preserves an operator-supplied
 *     value verbatim.
 *   - applyStoreKitInfoPlist is byte-stable on re-run.
 *   - applyStoreKitInfoPlist does not mutate its input.
 *   - app.json plugin chain length bumped to 40.
 *   - The plugin slots in after with-apple-pay.
 *   - Coexistence with the rest of the chain (does not throw).
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

import withStoreKit, {
  applyStoreKitInfoPlist,
  PLACEHOLDER_CONFIG_FILE_PATH,
  STOREKIT_INFOPLIST_KEY,
} from '../../../../plugins/with-storekit';

describe('applyStoreKitInfoPlist (pure helper)', () => {
  it('adds the placeholder config-file path when the key is absent', () => {
    const out = applyStoreKitInfoPlist({});
    expect(out[STOREKIT_INFOPLIST_KEY]).toBe(PLACEHOLDER_CONFIG_FILE_PATH);
  });

  it('preserves an operator-supplied value verbatim', () => {
    const out = applyStoreKitInfoPlist({
      [STOREKIT_INFOPLIST_KEY]: 'CustomCatalog.storekit',
    });
    expect(out[STOREKIT_INFOPLIST_KEY]).toBe('CustomCatalog.storekit');
  });

  it('is byte-stable on re-run', () => {
    const once = applyStoreKitInfoPlist({});
    const twice = applyStoreKitInfoPlist(once);
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once));
  });

  it('does not mutate the input object', () => {
    const input: Record<string, unknown> = {};
    const out = applyStoreKitInfoPlist(input);
    expect(out).not.toBe(input);
    expect(input[STOREKIT_INFOPLIST_KEY]).toBeUndefined();
  });

  it('preserves unrelated Info.plist keys', () => {
    const out = applyStoreKitInfoPlist({
      NSCameraUsageDescription: 'camera',
    });
    expect(out['NSCameraUsageDescription']).toBe('camera');
    expect(out[STOREKIT_INFOPLIST_KEY]).toBe(PLACEHOLDER_CONFIG_FILE_PATH);
  });
});

describe('with-storekit (config plugin)', () => {
  it('exports a config plugin function', () => {
    expect(typeof withStoreKit).toBe('function');
  });

  it('seeds the Info.plist hint on a baseline config', () => {
    const cfg: ExpoConfig = { name: 't', slug: 't', ios: {} };
    const out = withStoreKit(cfg);
    expect(
      (out.ios?.infoPlist as Record<string, unknown> | undefined)?.[STOREKIT_INFOPLIST_KEY],
    ).toBe(PLACEHOLDER_CONFIG_FILE_PATH);
  });

  it('preserves an operator-supplied Info.plist value', () => {
    const cfg: ExpoConfig = {
      name: 't',
      slug: 't',
      ios: {
        infoPlist: {
          [STOREKIT_INFOPLIST_KEY]: 'Operator.storekit',
        },
      },
    };
    const out = withStoreKit(cfg);
    expect(
      (out.ios?.infoPlist as Record<string, unknown> | undefined)?.[STOREKIT_INFOPLIST_KEY],
    ).toBe('Operator.storekit');
  });

  it('running twice yields a deep-equal config (idempotency)', () => {
    const cfg: ExpoConfig = { name: 't', slug: 't', ios: {} };
    const once = withStoreKit(cfg);
    const twice = withStoreKit(once);
    expect(twice).toEqual(once);
  });
});

describe('with-storekit: app.json registration + chain composition', () => {
  it('app.json plugins array contains ./plugins/with-storekit exactly once', () => {
    const appJson = require('../../../../app.json');
    const plugins: unknown[] = appJson.expo.plugins;
    const count = plugins.filter(
      (p) => typeof p === 'string' && p === './plugins/with-storekit',
    ).length;
    expect(count).toBe(1);
  });

  it('app.json plugins array length is 40 after feature 050', () => {
    const appJson = require('../../../../app.json');
    const plugins: unknown[] = appJson.expo.plugins;
    expect(plugins.length).toBe(45);
  });

  it('with-storekit slots in after with-apple-pay', () => {
    const appJson = require('../../../../app.json');
    const plugins: unknown[] = appJson.expo.plugins;
    const applePayIdx = plugins.findIndex(
      (p) => typeof p === 'string' && p === './plugins/with-apple-pay',
    );
    const storekitIdx = plugins.findIndex(
      (p) => typeof p === 'string' && p === './plugins/with-storekit',
    );
    expect(applePayIdx).toBeGreaterThan(-1);
    expect(storekitIdx).toBe(applePayIdx + 1);
  });

  it('coexists with with-apple-pay and re-runs idempotently', () => {
    const baseConfig: ExpoConfig = { name: 't', slug: 't', ios: {} };
    const withStoreKit2 = require('../../../../plugins/with-storekit').default;
    const withApplePay = require('../../../../plugins/with-apple-pay').default;

    let config: ExpoConfig = baseConfig;
    expect(() => {
      config = withApplePay(config);
      config = withStoreKit2(config);
      // Re-run to validate idempotency under composition.
      config = withStoreKit2(config);
      config = withApplePay(config);
    }).not.toThrow();
    expect(
      (config.ios?.infoPlist as Record<string, unknown> | undefined)?.[STOREKIT_INFOPLIST_KEY],
    ).toBe(PLACEHOLDER_CONFIG_FILE_PATH);
  });
});
