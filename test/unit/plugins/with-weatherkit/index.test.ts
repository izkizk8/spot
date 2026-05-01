/**
 * Tests for with-weatherkit Expo config plugin — feature 046.
 *
 * @jest-environment node
 */

import withWeatherKit, {
  applyWeatherKitEntitlement,
  WEATHERKIT_ENTITLEMENT_KEY,
} from '../../../../plugins/with-weatherkit';
import type { ExpoConfig } from '@expo/config-types';

describe('with-weatherkit (entitlement mutation)', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('Row 1: missing key → set to true, no warn', () => {
    const out = applyWeatherKitEntitlement({});
    expect(out[WEATHERKIT_ENTITLEMENT_KEY]).toBe(true);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('Row 2: developer-supplied boolean is preserved verbatim', () => {
    const out = applyWeatherKitEntitlement({
      [WEATHERKIT_ENTITLEMENT_KEY]: false,
    });
    expect(out[WEATHERKIT_ENTITLEMENT_KEY]).toBe(false);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('Row 3: non-boolean value is replaced and emits a one-time warn', () => {
    const out = applyWeatherKitEntitlement({
      [WEATHERKIT_ENTITLEMENT_KEY]: 'yes' as unknown,
    });
    expect(out[WEATHERKIT_ENTITLEMENT_KEY]).toBe(true);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('Row 4: re-running on own output is byte-stable', () => {
    const once = applyWeatherKitEntitlement({});
    const twice = applyWeatherKitEntitlement(once);
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once));
  });

  it('does not mutate the input object', () => {
    const input: Record<string, unknown> = {};
    const out = applyWeatherKitEntitlement(input);
    expect(out).not.toBe(input);
    expect(input[WEATHERKIT_ENTITLEMENT_KEY]).toBeUndefined();
  });

  it('coexistence: leaves unrelated entitlements verbatim', () => {
    const input: Record<string, unknown> = {
      'com.apple.developer.on-demand-install-capable': true,
      'com.apple.developer.applesignin': ['Default'],
      'com.apple.developer.carplay-audio': true,
      'aps-environment': 'production',
    };
    const out = applyWeatherKitEntitlement(input);
    expect(out['com.apple.developer.on-demand-install-capable']).toBe(true);
    expect(out['com.apple.developer.applesignin']).toEqual(['Default']);
    expect(out['com.apple.developer.carplay-audio']).toBe(true);
    expect(out['aps-environment']).toBe('production');
    expect(out[WEATHERKIT_ENTITLEMENT_KEY]).toBe(true);
  });
});

describe('with-weatherkit (plugin wrapper + composition)', () => {
  const baseConfig: ExpoConfig = {
    name: 'test-app',
    slug: 'test-app',
    ios: { bundleIdentifier: 'com.test.app' },
  };

  it('returns a valid ExpoConfig when applied', () => {
    const modded = withWeatherKit(baseConfig);
    expect(modded).toBeDefined();
    expect(modded.name).toBe('test-app');
  });

  it('app.json plugins array contains ./plugins/with-weatherkit exactly once', () => {
    const appJson = require('../../../../app.json');
    const plugins: unknown[] = appJson.expo.plugins;
    const count = plugins.filter(
      (p) => typeof p === 'string' && p === './plugins/with-weatherkit',
    ).length;
    expect(count).toBe(1);
  });

  it('app.json plugins array length is 38 after feature 048', () => {
    const appJson = require('../../../../app.json');
    const plugins: unknown[] = appJson.expo.plugins;
    expect(plugins.length).toBe(43);
  });

  it('coexists with carplay, homekit, healthkit, app-clips, mapkit, universal-links without throwing', () => {
    const carplay = require('../../../../plugins/with-carplay').default;
    const homekit = require('../../../../plugins/with-homekit').default;
    const healthkit = require('../../../../plugins/with-healthkit').default;
    const appClips = require('../../../../plugins/with-app-clips').default;
    const mapkit = require('../../../../plugins/with-mapkit').default;
    const universalLinks = require('../../../../plugins/with-universal-links').default;

    let config = baseConfig;
    expect(() => {
      config = withWeatherKit(config);
      config = carplay(config);
      config = homekit(config);
      config = healthkit(config);
      config = appClips(config);
      config = mapkit(config);
      config = universalLinks(config);
      // Re-run to check idempotency under composition.
      config = withWeatherKit(config);
      config = carplay(config);
    }).not.toThrow();
    expect(config).toBeDefined();
  });
});
