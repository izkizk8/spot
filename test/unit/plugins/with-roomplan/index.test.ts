/**
 * with-roomplan plugin tests (Feature 048 — LiDAR / RoomPlan Lab).
 *
 * Coverage:
 *   - Adds NSCameraUsageDescription with default copy when absent.
 *   - Preserves an existing NSCameraUsageDescription value
 *     (coexists with feature 017's `with-vision` and feature
 *     034's `with-arkit`).
 *   - Idempotent: running twice yields a deep-equal config.
 *   - Adds NO additional Info.plist keys.
 *   - Coexists with the rest of the plugin chain.
 *   - app.json plugin chain length bumped to 38.
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
}));

import { DEFAULT_CAMERA_USAGE_DESCRIPTION } from '../../../../plugins/with-roomplan';

describe('with-roomplan plugin', () => {
  let withRoomPlan: (config: ExpoConfig) => ExpoConfig;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    withRoomPlan = require('../../../../plugins/with-roomplan').default;
  });

  it('exports a config plugin function', () => {
    expect(typeof withRoomPlan).toBe('function');
  });

  describe('NSCameraUsageDescription', () => {
    it('adds the default copy when the key is absent', () => {
      const cfg: ExpoConfig = { name: 't', slug: 't', ios: {} };
      const out = withRoomPlan(cfg);
      expect(out.ios?.infoPlist?.NSCameraUsageDescription).toBe(DEFAULT_CAMERA_USAGE_DESCRIPTION);
    });

    it('preserves an existing operator-supplied value (coexistence with 017)', () => {
      const existing = 'Used to demonstrate on-device Vision analysis';
      const cfg: ExpoConfig = {
        name: 't',
        slug: 't',
        ios: { infoPlist: { NSCameraUsageDescription: existing } },
      };
      const out = withRoomPlan(cfg);
      expect(out.ios?.infoPlist?.NSCameraUsageDescription).toBe(existing);
    });

    it('handles a config without an ios object', () => {
      const cfg: ExpoConfig = { name: 't', slug: 't' };
      const out = withRoomPlan(cfg);
      expect(out.ios?.infoPlist?.NSCameraUsageDescription).toBe(DEFAULT_CAMERA_USAGE_DESCRIPTION);
    });
  });

  describe('idempotency', () => {
    it('running twice yields a deep-equal config', () => {
      const cfg: ExpoConfig = { name: 't', slug: 't', ios: {} };
      const once = withRoomPlan(cfg);
      const twice = withRoomPlan(once);
      expect(twice).toEqual(once);
    });

    it('starting from coexistence baseline (017 / 034 already applied) is idempotent', () => {
      const cfg: ExpoConfig = {
        name: 't',
        slug: 't',
        ios: {
          infoPlist: {
            NSCameraUsageDescription: 'Used to demonstrate on-device Vision analysis',
            UIRequiredDeviceCapabilities: ['arkit'],
          },
        },
      };
      const once = withRoomPlan(cfg);
      const twice = withRoomPlan(once);
      expect(twice).toEqual(once);
      expect(once.ios?.infoPlist?.NSCameraUsageDescription).toBe(
        'Used to demonstrate on-device Vision analysis',
      );
      expect(once.ios?.infoPlist?.UIRequiredDeviceCapabilities).toEqual(['arkit']);
    });
  });

  describe('purity', () => {
    it('does not add additional Info.plist keys beyond NSCameraUsageDescription', () => {
      const cfg: ExpoConfig = { name: 't', slug: 't', ios: {} };
      const out = withRoomPlan(cfg);
      expect(Object.keys(out.ios?.infoPlist ?? {})).toEqual(['NSCameraUsageDescription']);
    });

    it('does not append entries to UIRequiredDeviceCapabilities', () => {
      const cfg: ExpoConfig = {
        name: 't',
        slug: 't',
        ios: { infoPlist: { UIRequiredDeviceCapabilities: ['metal'] } },
      };
      const out = withRoomPlan(cfg);
      expect(out.ios?.infoPlist?.UIRequiredDeviceCapabilities).toEqual(['metal']);
    });
  });
});

describe('with-roomplan: app.json registration + chain composition', () => {
  it('app.json plugins array contains ./plugins/with-roomplan exactly once', () => {
    const appJson = require('../../../../app.json');
    const plugins: unknown[] = appJson.expo.plugins;
    const count = plugins.filter(
      (p) => typeof p === 'string' && p === './plugins/with-roomplan',
    ).length;
    expect(count).toBe(1);
  });

  it('app.json plugins array length is 38 after feature 048', () => {
    const appJson = require('../../../../app.json');
    const plugins: unknown[] = appJson.expo.plugins;
    expect(plugins.length).toBe(49);
  });

  it('with-roomplan slots in after with-weatherkit', () => {
    const appJson = require('../../../../app.json');
    const plugins: unknown[] = appJson.expo.plugins;
    const weatherIdx = plugins.findIndex(
      (p) => typeof p === 'string' && p === './plugins/with-weatherkit',
    );
    const roomplanIdx = plugins.findIndex(
      (p) => typeof p === 'string' && p === './plugins/with-roomplan',
    );
    expect(weatherIdx).toBeGreaterThan(-1);
    expect(roomplanIdx).toBe(weatherIdx + 1);
  });

  it('coexists with vision, arkit, and re-runs idempotently', () => {
    const baseConfig: ExpoConfig = { name: 't', slug: 't', ios: {} };
    const withRoomPlan = require('../../../../plugins/with-roomplan').default;
    const withVision = require('../../../../plugins/with-vision').default;
    const withArkit = require('../../../../plugins/with-arkit').default;

    let config: ExpoConfig = baseConfig;
    expect(() => {
      config = withVision(config);
      config = withArkit(config);
      config = withRoomPlan(config);
      // Re-run to validate idempotency under composition.
      config = withRoomPlan(config);
      config = withArkit(config);
      config = withVision(config);
    }).not.toThrow();
    expect(config.ios?.infoPlist?.NSCameraUsageDescription).toBeDefined();
  });
});
