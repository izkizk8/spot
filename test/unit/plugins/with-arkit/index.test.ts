/**
 * with-arkit plugin tests (Feature 034 — ARKit Basics module).
 *
 * Coverage:
 *   - Adds NSCameraUsageDescription with default copy when absent
 *   - Preserves existing NSCameraUsageDescription (coexists with feature 017's with-vision)
 *   - Appends 'arkit' to UIRequiredDeviceCapabilities when absent
 *   - No-op when 'arkit' already present
 *   - Idempotent: running twice yields deep-equal output (FR-018, SC-008)
 *   - No face-tracking strings emitted (FR-017)
 */

import type { ExpoConfig } from '@expo/config-types';

// Mock @expo/config-plugins so withInfoPlist runs its callback synchronously
// and writes the resulting modResults back onto config.ios.infoPlist.
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

describe('with-arkit plugin', () => {
  let withArkit: (config: ExpoConfig) => ExpoConfig;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    withArkit = require('../../../../plugins/with-arkit/index').default;
  });

  it('exports a config plugin function', () => {
    expect(typeof withArkit).toBe('function');
  });

  describe('NSCameraUsageDescription', () => {
    it('adds NSCameraUsageDescription with default copy when absent', () => {
      const baseConfig: ExpoConfig = {
        name: 'test-app',
        slug: 'test-app',
        ios: {},
      };

      const result = withArkit(baseConfig);

      expect(result.ios?.infoPlist?.NSCameraUsageDescription).toBe(
        'Used to demonstrate ARKit world tracking and plane detection.',
      );
    });

    it('preserves existing NSCameraUsageDescription (coexistence with 017)', () => {
      const existing = 'Used to demonstrate on-device Vision analysis';
      const baseConfig: ExpoConfig = {
        name: 'test-app',
        slug: 'test-app',
        ios: { infoPlist: { NSCameraUsageDescription: existing } },
      };

      const result = withArkit(baseConfig);

      expect(result.ios?.infoPlist?.NSCameraUsageDescription).toBe(existing);
    });

    it('handles config without ios object', () => {
      const baseConfig: ExpoConfig = { name: 'test-app', slug: 'test-app' };

      const result = withArkit(baseConfig);

      expect(result.ios?.infoPlist?.NSCameraUsageDescription).toBe(
        'Used to demonstrate ARKit world tracking and plane detection.',
      );
    });
  });

  describe('UIRequiredDeviceCapabilities', () => {
    it('appends "arkit" to UIRequiredDeviceCapabilities when absent', () => {
      const baseConfig: ExpoConfig = {
        name: 'test-app',
        slug: 'test-app',
        ios: {},
      };

      const result = withArkit(baseConfig);

      expect(result.ios?.infoPlist?.UIRequiredDeviceCapabilities).toContain('arkit');
    });

    it('is a no-op when "arkit" already in UIRequiredDeviceCapabilities', () => {
      const baseConfig: ExpoConfig = {
        name: 'test-app',
        slug: 'test-app',
        ios: { infoPlist: { UIRequiredDeviceCapabilities: ['arkit', 'metal'] } },
      };

      const result = withArkit(baseConfig);

      expect(result.ios?.infoPlist?.UIRequiredDeviceCapabilities).toEqual(['arkit', 'metal']);
    });

    it('preserves other existing capabilities and appends arkit', () => {
      const baseConfig: ExpoConfig = {
        name: 'test-app',
        slug: 'test-app',
        ios: { infoPlist: { UIRequiredDeviceCapabilities: ['metal', 'armv7'] } },
      };

      const result = withArkit(baseConfig);

      const caps = result.ios?.infoPlist?.UIRequiredDeviceCapabilities as string[];
      expect(caps).toContain('metal');
      expect(caps).toContain('armv7');
      expect(caps).toContain('arkit');
      expect(caps).toHaveLength(3);
    });
  });

  describe('idempotency (FR-018, SC-008)', () => {
    it('produces deep-equal config when applied twice', () => {
      const baseConfig: ExpoConfig = {
        name: 'test-app',
        slug: 'test-app',
        ios: {},
      };

      const once = withArkit(baseConfig);
      const twice = withArkit(once);

      expect(twice).toEqual(once);
    });

    it('is idempotent when starting from coexistence baseline (017 already applied)', () => {
      const baseConfig: ExpoConfig = {
        name: 'test-app',
        slug: 'test-app',
        ios: {
          infoPlist: {
            NSCameraUsageDescription: 'Used to demonstrate on-device Vision analysis',
            UIRequiredDeviceCapabilities: ['metal'],
          },
        },
      };

      const once = withArkit(baseConfig);
      const twice = withArkit(once);

      expect(twice).toEqual(once);
      expect(once.ios?.infoPlist?.NSCameraUsageDescription).toBe(
        'Used to demonstrate on-device Vision analysis',
      );
      expect(once.ios?.infoPlist?.UIRequiredDeviceCapabilities).toEqual(['metal', 'arkit']);
    });
  });

  describe('no face-tracking guarantees (FR-017)', () => {
    it('does not add NSFaceIDUsageDescription or face-tracking strings', () => {
      const baseConfig: ExpoConfig = {
        name: 'test-app',
        slug: 'test-app',
        ios: {},
      };

      const result = withArkit(baseConfig);
      const plist = result.ios?.infoPlist ?? {};

      expect(plist).not.toHaveProperty('NSFaceIDUsageDescription');
      const serialised = JSON.stringify(plist).toLowerCase();
      expect(serialised).not.toContain('face tracking');
      expect(serialised).not.toContain('arfacetracking');
    });
  });
});
