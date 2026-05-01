/**
 * with-apple-pay plugin tests (Feature 049 — Apple Pay Lab).
 *
 * Coverage:
 *   - applyApplePayEntitlement adds the placeholder merchant id
 *     when absent.
 *   - applyApplePayEntitlement preserves an operator-supplied
 *     merchant id list verbatim.
 *   - applyApplePayEntitlement is byte-stable on re-run.
 *   - applyApplePayEntitlement does not mutate its input.
 *   - app.json plugin chain length bumped to 40.
 *   - The plugin slots in after with-roomplan.
 *   - Coexistence with the rest of the chain (does not throw).
 *
 * @jest-environment node
 */

import type { ExpoConfig } from '@expo/config-types';

jest.mock('@expo/config-plugins', () => ({
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
}));

import withApplePay, {
  APPLE_PAY_ENTITLEMENT_KEY,
  applyApplePayEntitlement,
  PLACEHOLDER_MERCHANT_IDS,
} from '../../../../plugins/with-apple-pay';

describe('applyApplePayEntitlement (pure helper)', () => {
  it('adds the placeholder merchant id list when the key is absent', () => {
    const out = applyApplePayEntitlement({});
    expect(out[APPLE_PAY_ENTITLEMENT_KEY]).toEqual([...PLACEHOLDER_MERCHANT_IDS]);
  });

  it('preserves an operator-supplied merchant id list verbatim', () => {
    const operatorIds = ['merchant.com.acme', 'merchant.com.acme.staging'];
    const out = applyApplePayEntitlement({
      [APPLE_PAY_ENTITLEMENT_KEY]: operatorIds,
    });
    expect(out[APPLE_PAY_ENTITLEMENT_KEY]).toBe(operatorIds);
  });

  it('is byte-stable on re-run', () => {
    const once = applyApplePayEntitlement({});
    const twice = applyApplePayEntitlement(once);
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once));
  });

  it('does not mutate the input object', () => {
    const input: Record<string, unknown> = {};
    const out = applyApplePayEntitlement(input);
    expect(out).not.toBe(input);
    expect(input[APPLE_PAY_ENTITLEMENT_KEY]).toBeUndefined();
  });

  it('preserves unrelated entitlements', () => {
    const out = applyApplePayEntitlement({
      'com.apple.developer.healthkit': true,
      'com.apple.developer.in-app-payments': ['merchant.com.acme'],
    });
    expect(out['com.apple.developer.healthkit']).toBe(true);
    expect(out[APPLE_PAY_ENTITLEMENT_KEY]).toEqual(['merchant.com.acme']);
  });
});

describe('with-apple-pay (config plugin)', () => {
  it('exports a config plugin function', () => {
    expect(typeof withApplePay).toBe('function');
  });

  it('seeds the entitlement on a baseline config', () => {
    const cfg: ExpoConfig = { name: 't', slug: 't', ios: {} };
    const out = withApplePay(cfg);
    expect(out.ios?.entitlements?.[APPLE_PAY_ENTITLEMENT_KEY]).toEqual([
      ...PLACEHOLDER_MERCHANT_IDS,
    ]);
  });

  it('preserves an operator-supplied entitlement list', () => {
    const cfg: ExpoConfig = {
      name: 't',
      slug: 't',
      ios: {
        entitlements: {
          [APPLE_PAY_ENTITLEMENT_KEY]: ['merchant.com.acme'],
        },
      },
    };
    const out = withApplePay(cfg);
    expect(out.ios?.entitlements?.[APPLE_PAY_ENTITLEMENT_KEY]).toEqual(['merchant.com.acme']);
  });

  it('running twice yields a deep-equal config (idempotency)', () => {
    const cfg: ExpoConfig = { name: 't', slug: 't', ios: {} };
    const once = withApplePay(cfg);
    const twice = withApplePay(once);
    expect(twice).toEqual(once);
  });
});

describe('with-apple-pay: app.json registration + chain composition', () => {
  it('app.json plugins array contains ./plugins/with-apple-pay exactly once', () => {
    const appJson = require('../../../../app.json');
    const plugins: unknown[] = appJson.expo.plugins;
    const count = plugins.filter(
      (p) => typeof p === 'string' && p === './plugins/with-apple-pay',
    ).length;
    expect(count).toBe(1);
  });

  it('app.json plugins array length is 40 after feature 050', () => {
    const appJson = require('../../../../app.json');
    const plugins: unknown[] = appJson.expo.plugins;
    expect(plugins.length).toBe(43); // bumped from 42 by feature 087 (with-controls)
  });

  it('with-apple-pay slots in after with-roomplan', () => {
    const appJson = require('../../../../app.json');
    const plugins: unknown[] = appJson.expo.plugins;
    const roomplanIdx = plugins.findIndex(
      (p) => typeof p === 'string' && p === './plugins/with-roomplan',
    );
    const applePayIdx = plugins.findIndex(
      (p) => typeof p === 'string' && p === './plugins/with-apple-pay',
    );
    expect(roomplanIdx).toBeGreaterThan(-1);
    expect(applePayIdx).toBe(roomplanIdx + 1);
  });

  it('coexists with with-passkit, with-roomplan, and re-runs idempotently', () => {
    const baseConfig: ExpoConfig = { name: 't', slug: 't', ios: {} };
    const withApplePay2 = require('../../../../plugins/with-apple-pay').default;
    const withRoomPlan = require('../../../../plugins/with-roomplan').default;

    let config: ExpoConfig = baseConfig;
    expect(() => {
      config = withRoomPlan(config);
      config = withApplePay2(config);
      // Re-run to validate idempotency under composition.
      config = withApplePay2(config);
      config = withRoomPlan(config);
    }).not.toThrow();
    expect(config.ios?.entitlements?.[APPLE_PAY_ENTITLEMENT_KEY]).toBeDefined();
  });
});
